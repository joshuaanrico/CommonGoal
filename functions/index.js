// Cloud Functions for CommonGoal (BR E.1).
// They run on Google's server with the Admin SDK, which skips the Firestore rules,
// so each one checks who is calling before doing anything.

const { setGlobalOptions } = require('firebase-functions/v2')
const { onRequest } = require('firebase-functions/v2/https')
const { defineSecret } = require('firebase-functions/params')
const { onDocumentWritten } = require('firebase-functions/v2/firestore')
const admin = require('firebase-admin')

admin.initializeApp()
const db = admin.firestore()

// Brevo key is stored in Secret Manager, not in the code.
const brevoKey = defineSecret('BREVO_API_KEY')

// Melbourne, same as Firestore. Max 10 copies running, to cap cost.
setGlobalOptions({ region: 'australia-southeast2', maxInstances: 10 })

// Only our own websites can call these functions from a browser.
const cors = require('cors')({
  origin: [
    'http://localhost:5173',
    'https://commongoal-4a77b.web.app',
    'https://commongoal-4a77b.firebaseapp.com',
  ],
})

// ---------- helpers ----------

// Makes an error that carries an HTTP status code.
const httpError = (status, message) => Object.assign(new Error(message), { status })

// Works out the average and count for one route and saves it in routeStats.
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

// Checks the login token ("Authorization: Bearer <token>") and loads the user's role.
async function requireUser(req) {
  const header = req.get('Authorization') || ''
  const match = header.match(/^Bearer (.+)$/)
  if (!match) throw httpError(401, 'Sign in first.')

  let decoded
  try {
    decoded = await admin.auth().verifyIdToken(match[1])
  } catch {
    throw httpError(401, 'Session expired, sign in again.')
  }

  const profile = await db.collection('users').doc(decoded.uid).get()
  return { uid: decoded.uid, email: decoded.email, role: profile.exists ? profile.data().role : null }
}

async function requireAdmin(req) {
  const caller = await requireUser(req)
  if (caller.role !== 'admin') throw httpError(403, 'Admins only.')
  return caller
}

// Shared setup for every POST function: CORS, POST only, and JSON errors.
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
        // Never send the real server error to the browser.
        res.status(status).json({ error: status === 500 ? 'Something went wrong.' : error.message })
      }
    })
  })
}

// Sender must be verified in Brevo.
const SENDER = { name: 'CommonGoal', email: 'joshua.anrico30@gmail.com' }

// Turns < > & " ' into safe text so a message cannot add HTML to the email.
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
    throw httpError(502, 'The email service rejected the message.')
  }
}

// Stops spam: max `limit` sends per user in 10 minutes. A transaction so two clicks at once count properly.
async function enforceRateLimit(key, limit = 5, windowMs = 10 * 60 * 1000) {
  const ref = db.collection('rateLimits').doc(key)
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref)
    const now = Date.now()
    const recent = (snap.exists ? snap.data().times : []).filter((t) => now - t < windowMs)
    if (recent.length >= limit) throw httpError(429, 'Too many emails. Wait a few minutes and try again.')
    tx.set(ref, { times: [...recent, now] })
  })
}

// Same checks for single and bulk email.
function checkSubjectAndMessage(subject, message) {
  if (typeof subject !== 'string' || subject.trim().length < 3 || subject.length > 120) {
    throw httpError(400, 'Subject must be 3 to 120 characters.')
  }
  if (typeof message !== 'string' || message.trim().length < 5 || message.length > 2000) {
    throw httpError(400, 'Message must be 5 to 2000 characters.')
  }
}

// ---------- functions ----------

// Runs by itself when a rating is added, changed or deleted. Updates that route's stats.
exports.onRatingWritten = onDocumentWritten('ratings/{ratingId}', async (event) => {
  const after = event.data?.after?.data()
  const before = event.data?.before?.data()
  const routeId = after?.routeId ?? before?.routeId
  if (routeId === undefined) return

  const stats = await recomputeRouteStats(routeId)
  console.log(`routeStats/${routeId} updated`, { count: stats.count, average: stats.average })
})

// Admin only. Recalculates every route (for old ratings or if stats get out of sync).
exports.rebuildRouteStats = postEndpoint(async (req) => {
  await requireAdmin(req)
  const snapshot = await db.collection('ratings').get()
  const routeIds = [...new Set(snapshot.docs.map((docSnap) => docSnap.data().routeId))]
  const results = await Promise.all(routeIds.map(recomputeRouteStats))
  return { rebuilt: results.length }
})

// Admin only. The only way to change a role. Every change is saved in roleChanges.
exports.setUserRole = postEndpoint(async (req) => {
  const caller = await requireAdmin(req)
  const { uid, role } = req.body || {}

  if (typeof uid !== 'string' || uid.length === 0 || uid.length > 128) throw httpError(400, 'Missing user id.')
  if (!['member', 'admin'].includes(role)) throw httpError(400, 'Role must be member or admin.')
  if (uid === caller.uid) throw httpError(400, 'You cannot change your own role.')

  const userRef = db.collection('users').doc(uid)
  const userSnap = await userRef.get()
  if (!userSnap.exists) throw httpError(404, 'User not found.')

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

// Allowed attachment types, and the file extension to use for each.
const ATTACHMENT_TYPES = {
  'application/pdf': 'pdf',
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'text/plain': 'txt',
  'text/csv': 'csv',
}
const MAX_ATTACHMENT_BYTES = 2 * 1024 * 1024
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Any signed-in user. Email one route to a friend, with an optional file (BR D.2).
// We check everything again here because browser checks can be skipped.
exports.sendEmail = postEndpoint(
  async (req) => {
    const caller = await requireUser(req)
    const { to, subject, message, attachment } = req.body || {}

    if (typeof to !== 'string' || !EMAIL_PATTERN.test(to) || to.length > 254) {
      throw httpError(400, 'Enter a valid recipient email.')
    }
    checkSubjectAndMessage(subject, message)

    const brevoAttachments = []
    if (attachment) {
      const { name, type, content } = attachment
      if (!ATTACHMENT_TYPES[type] || typeof content !== 'string' || typeof name !== 'string') {
        throw httpError(400, 'Attach a PDF, PNG, JPG, TXT or CSV file.')
      }
      if (Buffer.from(content, 'base64').length > MAX_ATTACHMENT_BYTES) {
        throw httpError(400, 'Attachment must be 2 MB or smaller.')
      }
      // Clean the file name and force the right extension.
      const base = name.replace(/\.[^.]*$/, '').replace(/[^\w\- ]/g, '').slice(0, 60) || 'attachment'
      brevoAttachments.push({ name: `${base}.${ATTACHMENT_TYPES[type]}`, content })
    }

    await enforceRateLimit(caller.uid)

    await sendViaBrevo({
      to: [{ email: to }],
      replyTo: { email: caller.email },
      subject: subject.trim(),
      htmlContent:
        `<p>${escapeHtml(message.trim()).replace(/\n/g, '<br>')}</p>` +
        `<hr><p style="color:#666;font-size:12px">Sent by ${escapeHtml(caller.email)} through CommonGoal.</p>`,
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

const MAX_BULK_RECIPIENTS = 50

// Admin only. Email selected users (BR F.1).
// The browser sends user ids, not emails, so it can only reach registered users.
// Each person gets their own copy, and {{name}} becomes their first name.
exports.sendBulkEmail = postEndpoint(
  async (req) => {
    const caller = await requireAdmin(req)
    const { uids, subject, message } = req.body || {}

    if (!Array.isArray(uids) || uids.length === 0 || uids.length > MAX_BULK_RECIPIENTS) {
      throw httpError(400, `Pick between 1 and ${MAX_BULK_RECIPIENTS} users.`)
    }
    if (!uids.every((uid) => typeof uid === 'string' && uid.length > 0 && uid.length <= 128)) {
      throw httpError(400, 'Invalid user selection.')
    }
    checkSubjectAndMessage(subject, message)

    // Stricter than single email: 3 bulk sends per 10 minutes.
    await enforceRateLimit(`${caller.uid}_bulk`, 3)

    const refs = [...new Set(uids)].map((uid) => db.collection('users').doc(uid))
    const snaps = await db.getAll(...refs)
    const recipients = snaps.filter((snap) => snap.exists && snap.data().email).map((snap) => snap.data())
    if (recipients.length === 0) throw httpError(404, 'None of the selected users could be found.')

    const firstName = (data) => (data.fullName || 'there').split(' ')[0].slice(0, 40)
    const body = (name) =>
      // A function as the replacement, so a name like "$&" is not treated as a special pattern.
      `<p>${escapeHtml(message.trim().replace(/\{\{\s*name\s*\}\}/gi, () => name)).replace(/\n/g, '<br>')}</p>` +
      '<hr><p style="color:#666;font-size:12px">You are receiving this because you have a CommonGoal account.</p>'

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

// Public read-only REST API (BR F.1), in api.js.
exports.api = require('./api').api
