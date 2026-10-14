// Cloud Functions for CommonGoal (BR E.1).
//
// These run on Google's servers with the Admin SDK, which skips the Firestore rules. That is
// the point: they do the jobs a browser must never be trusted with, like working out the
// official rating average or changing someone's role.

const { setGlobalOptions } = require('firebase-functions/v2')
const { onRequest } = require('firebase-functions/v2/https')
const { onDocumentWritten } = require('firebase-functions/v2/firestore')
const admin = require('firebase-admin')

admin.initializeApp()
const db = admin.firestore()

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
function postEndpoint(handler) {
  return onRequest((req, res) => {
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
