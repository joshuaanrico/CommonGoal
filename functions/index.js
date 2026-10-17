// Cloud Functions for CommonGoal (BR E.1).
//
// These run on Google's servers with the Admin SDK, which skips the Firestore rules. That is
// the point: they do the jobs a browser must never be trusted with, like working out the
// official rating average or changing someone's role.

const { setGlobalOptions } = require('firebase-functions/v2')
const { onRequest } = require('firebase-functions/v2/https')
const { defineSecret } = require('firebase-functions/params')
const { onDocumentWritten } = require('firebase-functions/v2/firestore')
const admin = require('firebase-admin')

admin.initializeApp()
const db = admin.firestore()

// Brevo API key lives in Secret Manager (firebase functions:secrets:set BREVO_API_KEY), never in
// code or in the browser. Only functions that list it under `secrets` can read it.
const brevoKey = defineSecret('BREVO_API_KEY')

// Same region as the Firestore database (Melbourne). maxInstances caps cost if something loops.
setGlobalOptions({ region: 'australia-southeast2', maxInstances: 10 })

// Only our own sites may call the HTTP functions from a browser.
const cors = require('cors')({
  origin: [
    'http://localhost:5173',
    'https://commongoal-4a77b.web.app',
    'https://commongoal-4a77b.firebaseapp.com',
  ],
})

// ---------- helpers ----------

// Recalculates the average and count for one route from every rating it has.
async function recomputeRouteStats(routeId) {
  const snapshot = await db.collection('ratings').where('routeId', '==', routeId).get()
  const statsRef = db.collection('routeStats').doc(String(routeId))

  if (snapshot.empty) {
    await statsRef.delete()
    return { routeId, count: 0, average: null }
  }

  const total = snapshot.docs.reduce((sum, docSnap) => sum + docSnap.data().score, 0)
  const stats = {
    routeId,
    count: snapshot.size,
    average: Number((total / snapshot.size).toFixed(1)),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  }
  await statsRef.set(stats)
  return stats
}

// Checks the Firebase ID token sent as "Authorization: Bearer <token>" and loads the caller's
// profile. Throws an error carrying the HTTP status to send back.
async function requireUser(req) {
  const header = req.get('Authorization') || ''
  const match = header.match(/^Bearer (.+)$/)
  if (!match) throw Object.assign(new Error('Sign in first.'), { status: 401 })

  let decoded
  try {
    decoded = await admin.auth().verifyIdToken(match[1])
  } catch {
    throw Object.assign(new Error('Session expired, sign in again.'), { status: 401 })
  }

  const profile = await db.collection('users').doc(decoded.uid).get()
  return { uid: decoded.uid, email: decoded.email, role: profile.exists ? profile.data().role : null }
}

async function requireAdmin(req) {
  const caller = await requireUser(req)
  if (caller.role !== 'admin') throw Object.assign(new Error('Admins only.'), { status: 403 })
  return caller
}

// Wraps an async handler with CORS, POST-only and consistent JSON errors.
function postEndpoint(handler, options = {}) {
  return onRequest(options, (req, res) => {
    cors(req, res, async () => {
      if (req.method !== 'POST') {
        res.set('Allow', 'POST').status(405).json({ error: 'Use POST.' })
        return
      }
      try {
        res.status(200).json(await handler(req))
      } catch (error) {
        const status = error.status || 500
        if (status === 500) console.error(error)
        res.status(status).json({ error: status === 500 ? 'Something went wrong.' : error.message })
      }
    })
  })
}

// Sends one email through Brevo's transactional API. The sender must be a verified Brevo sender.
const SENDER = { name: 'CommonGoal', email: 'joshua.anrico30@gmail.com' }

const escapeHtml = (text) =>
  text.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])

async function sendViaBrevo(payload) {
  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': brevoKey.value(), 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({ sender: SENDER, ...payload }),
  })
  if (!response.ok) {
    console.error('Brevo error', response.status, await response.text())
    throw Object.assign(new Error('The email service rejected the message.'), { status: 502 })
  }
}

// Allows 5 emails per user in any 10 minute window, so one account cannot be used as a spam cannon.
async function enforceRateLimit(uid, limit = 5, windowMs = 10 * 60 * 1000) {
  const ref = db.collection('rateLimits').doc(uid)
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref)
    const now = Date.now()
    const recent = (snap.exists ? snap.data().times : []).filter((t) => now - t < windowMs)
    if (recent.length >= limit) {
      throw Object.assign(new Error('Too many emails. Wait a few minutes and try again.'), { status: 429 })
    }
    tx.set(ref, { times: [...recent, now] })
  })
}

// ---------- functions ----------

// Firestore trigger: any time a rating is created, changed or deleted, rebuild that route's
// stats. Clients can read routeStats but the rules stop them writing it, so the number shown
// on every card is one the server calculated, not one a user could fake.
exports.onRatingWritten = onDocumentWritten('ratings/{ratingId}', async (event) => {
  const after = event.data?.after?.data()
  const before = event.data?.before?.data()
  const routeId = after?.routeId ?? before?.routeId
  if (routeId === undefined) return

  const stats = await recomputeRouteStats(routeId)
  console.log(`routeStats/${routeId} updated`, { count: stats.count, average: stats.average })
})

// Admin only. Rebuilds stats for every route, for ratings written before the trigger existed.
exports.rebuildRouteStats = postEndpoint(async (req) => {
  await requireAdmin(req)
  const snapshot = await db.collection('ratings').get()
  const routeIds = [...new Set(snapshot.docs.map((docSnap) => docSnap.data().routeId))]
  const results = await Promise.all(routeIds.map(recomputeRouteStats))
  return { rebuilt: results.length }
})

// Admin only. Promotes a member to admin or back. The Firestore rules forbid any client from
// writing a role, so this server check is the only door, and every change is logged.
exports.setUserRole = postEndpoint(async (req) => {
  const caller = await requireAdmin(req)
  const { uid, role } = req.body || {}

  if (typeof uid !== 'string' || uid.length === 0 || uid.length > 128) {
    throw Object.assign(new Error('Missing user id.'), { status: 400 })
  }
  if (!['member', 'admin'].includes(role)) {
    throw Object.assign(new Error('Role must be member or admin.'), { status: 400 })
  }
  if (uid === caller.uid) {
    throw Object.assign(new Error('You cannot change your own role.'), { status: 400 })
  }

  const userRef = db.collection('users').doc(uid)
  const userSnap = await userRef.get()
  if (!userSnap.exists) throw Object.assign(new Error('User not found.'), { status: 404 })

  await userRef.update({ role })
  await db.collection('roleChanges').add({
    uid,
    from: userSnap.data().role,
    to: role,
    by: caller.uid,
    at: admin.firestore.FieldValue.serverTimestamp(),
  })

  return { uid, role }
})

// Signed-in members can email a route to a friend, optionally with one attachment (BR D.2).
// Checks happen here as well as in the browser, because a browser check can be bypassed.
const ATTACHMENT_TYPES = {
  'application/pdf': 'pdf',
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'text/plain': 'txt',
  'text/csv': 'csv',
}
const MAX_ATTACHMENT_BYTES = 2 * 1024 * 1024
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

exports.sendEmail = postEndpoint(
  async (req) => {
    const caller = await requireUser(req)
    const { to, subject, message, attachment } = req.body || {}

    if (typeof to !== 'string' || !EMAIL_PATTERN.test(to) || to.length > 254) {
      throw Object.assign(new Error('Enter a valid recipient email.'), { status: 400 })
    }
    if (typeof subject !== 'string' || subject.trim().length < 3 || subject.length > 120) {
      throw Object.assign(new Error('Subject must be 3 to 120 characters.'), { status: 400 })
    }
    if (typeof message !== 'string' || message.trim().length < 5 || message.length > 2000) {
      throw Object.assign(new Error('Message must be 5 to 2000 characters.'), { status: 400 })
    }

    const brevoAttachments = []
    if (attachment) {
      const { name, type, content } = attachment
      if (!ATTACHMENT_TYPES[type] || typeof content !== 'string' || typeof name !== 'string') {
        throw Object.assign(new Error('Attach a PDF, PNG, JPG, TXT or CSV file.'), { status: 400 })
      }
      if (Buffer.from(content, 'base64').length > MAX_ATTACHMENT_BYTES) {
        throw Object.assign(new Error('Attachment must be 2 MB or smaller.'), { status: 400 })
      }
      // Keep only safe filename characters and force the extension that matches the real type.
      const base = name.replace(/\.[^.]*$/, '').replace(/[^\w\- ]/g, '').slice(0, 60) || 'attachment'
      brevoAttachments.push({ name: `${base}.${ATTACHMENT_TYPES[type]}`, content })
    }

    await enforceRateLimit(caller.uid)

    await sendViaBrevo({
      to: [{ email: to }],
      replyTo: { email: caller.email },
      subject: subject.trim(),
      htmlContent: `<p>${escapeHtml(message.trim()).replace(/\n/g, '<br>')}</p><hr><p style="color:#666;font-size:12px">Sent by ${escapeHtml(caller.email)} through CommonGoal.</p>`,
      ...(brevoAttachments.length ? { attachment: brevoAttachments } : {}),
    })

    await db.collection('emailLog').add({
      uid: caller.uid,
      kind: 'single',
      recipients: 1,
      hasAttachment: brevoAttachments.length > 0,
      at: admin.firestore.FieldValue.serverTimestamp(),
    })
    return { sent: true }
  },
  { secrets: [brevoKey] },
)

// Admin only. Emails a message to selected registered users (BR F.1 bulk email).
// The browser sends user ids, never addresses: the server looks the addresses up, so this can
// only reach people who actually registered and cannot be used to mail strangers. Each person
// gets their own copy (Brevo messageVersions), so nobody sees anyone else's address, and
// {{name}} in the text becomes that person's name.
const MAX_BULK_RECIPIENTS = 50

exports.sendBulkEmail = postEndpoint(
  async (req) => {
    const caller = await requireAdmin(req)
    const { uids, subject, message } = req.body || {}

    if (!Array.isArray(uids) || uids.length === 0 || uids.length > MAX_BULK_RECIPIENTS) {
      throw Object.assign(new Error(`Pick between 1 and ${MAX_BULK_RECIPIENTS} users.`), { status: 400 })
    }
    if (!uids.every((uid) => typeof uid === 'string' && uid.length > 0 && uid.length <= 128)) {
      throw Object.assign(new Error('Invalid user selection.'), { status: 400 })
    }
    if (typeof subject !== 'string' || subject.trim().length < 3 || subject.length > 120) {
      throw Object.assign(new Error('Subject must be 3 to 120 characters.'), { status: 400 })
    }
    if (typeof message !== 'string' || message.trim().length < 5 || message.length > 2000) {
      throw Object.assign(new Error('Message must be 5 to 2000 characters.'), { status: 400 })
    }

    // Stricter limit than single email: 3 bulk sends per 10 minutes.
    await enforceRateLimit(`${caller.uid}_bulk`, 3)

    const refs = [...new Set(uids)].map((uid) => db.collection('users').doc(uid))
    const snaps = await db.getAll(...refs)
    const recipients = snaps.filter((snap) => snap.exists && snap.data().email).map((snap) => snap.data())
    if (recipients.length === 0) {
      throw Object.assign(new Error('None of the selected users could be found.'), { status: 404 })
    }

    const body = (name) =>
      `<p>${escapeHtml(message.trim().replace(/\{\{\s*name\s*\}\}/gi, name)).replace(/\n/g, '<br>')}</p>` +
      '<hr><p style="color:#666;font-size:12px">You are receiving this because you have a CommonGoal account.</p>'
    const firstName = (data) => (data.fullName || 'there').split(' ')[0].slice(0, 40)

    await sendViaBrevo({
      to: [{ email: recipients[0].email }],
      subject: subject.trim(),
      htmlContent: body('there'),
      messageVersions: recipients.map((data) => ({
        to: [{ email: data.email, name: data.fullName || undefined }],
        htmlContent: body(firstName(data)),
      })),
    })

    await db.collection('emailLog').add({
      uid: caller.uid,
      kind: 'bulk',
      recipients: recipients.length,
      hasAttachment: false,
      at: admin.firestore.FieldValue.serverTimestamp(),
    })
    return { sent: recipients.length, skipped: new Set(uids).size - recipients.length }
  },
  { secrets: [brevoKey] },
)

// Public read only REST API (F.1), defined in api.js.
exports.api = require('./api').api
