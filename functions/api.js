// Public read-only REST API (BR F.1).
// Anyone can GET routes, clubs and rating stats as JSON. No personal data, no writing.
// The site sends /api/* here (rewrite in firebase.json).

const { onRequest } = require('firebase-functions/v2/https')
const admin = require('firebase-admin')
const express = require('express')
const cors = require('cors')

const routes = require('./data/routes.json')
const clubs = require('./data/clubs.json')

const router = express.Router()

const MAX_LIMIT = 100
const DEFAULT_LIMIT = 20

// Reads ?limit= and ?offset= and keeps them in a safe range.
function paging(query) {
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || DEFAULT_LIMIT, 1), MAX_LIMIT)
  const offset = Math.max(parseInt(query.offset, 10) || 0, 0)
  return { limit, offset }
}

function paged(items, query) {
  const { limit, offset } = paging(query)
  return { total: items.length, limit, offset, data: items.slice(offset, offset + limit) }
}

// The id must be a whole number above 0, otherwise 400 Bad Request.
function parseId(req, res) {
  const id = Number(req.params.id)
  if (!Number.isInteger(id) || id < 1) {
    res.status(400).json({ error: 'The id must be a positive whole number.' })
    return null
  }
  return id
}

const clean = (value) => String(value ?? '').trim().toLowerCase()

// GET /api : list of endpoints.
router.get('/', (req, res) => {
  res.json({
    name: 'CommonGoal public API',
    version: '1.0',
    endpoints: [
      'GET /api/routes?suburb=&shade=true&stepFree=true&limit=&offset=',
      'GET /api/routes/:id',
      'GET /api/routes/:id/stats',
      'GET /api/clubs?sport=&suburb=&limit=&offset=',
      'GET /api/clubs/:id',
    ],
  })
})

// GET /api/routes : all routes, with optional filters.
router.get('/routes', (req, res) => {
  const { suburb, shade, stepFree } = req.query
  const result = routes.filter(
    (route) =>
      (!suburb || clean(route.suburb) === clean(suburb)) &&
      (shade !== 'true' || route.hasShade) &&
      (stepFree !== 'true' || route.stepFree),
  )
  res.json(paged(result, req.query))
})

// GET /api/routes/:id : one route, or 404.
router.get('/routes/:id', (req, res) => {
  const id = parseId(req, res)
  if (id === null) return
  const route = routes.find((r) => r.id === id)
  if (!route) return res.status(404).json({ error: `No route with id ${id}.` })
  res.json(route)
})

// GET /api/routes/:id/stats : live average and count from Firestore. Numbers only.
router.get('/routes/:id/stats', async (req, res, next) => {
  try {
    const id = parseId(req, res)
    if (id === null) return
    if (!routes.some((r) => r.id === id)) return res.status(404).json({ error: `No route with id ${id}.` })

    const snap = await admin.firestore().collection('routeStats').doc(String(id)).get()
    const stats = snap.exists ? snap.data() : null
    res.set('Cache-Control', 'public, max-age=60')
    res.json({ routeId: id, average: stats?.average ?? null, count: stats?.count ?? 0 })
  } catch (error) {
    next(error)
  }
})

// GET /api/clubs : all clubs, filter by sport or suburb.
router.get('/clubs', (req, res) => {
  const { sport, suburb } = req.query
  const result = clubs.filter(
    (club) => (!sport || clean(club.sport) === clean(sport)) && (!suburb || clean(club.suburb) === clean(suburb)),
  )
  res.json(paged(result, req.query))
})

// GET /api/clubs/:id : one club, or 404.
router.get('/clubs/:id', (req, res) => {
  const id = parseId(req, res)
  if (id === null) return
  const club = clubs.find((c) => c.id === id)
  if (!club) return res.status(404).json({ error: `No club with id ${id}.` })
  res.json(club)
})

const app = express()
app.disable('x-powered-by')

// Public data, so any website can call it.
app.use(cors({ methods: ['GET'] }))

// Read only: anything except GET gets 405.
app.use((req, res, next) => {
  if (req.method === 'GET' || req.method === 'OPTIONS') return next()
  res.set('Allow', 'GET').status(405).json({ error: 'This API is read only. Use GET.' })
})

// Data rarely changes, so browsers can cache it for 5 minutes.
app.use((req, res, next) => {
  res.set('Cache-Control', 'public, max-age=300, s-maxage=300')
  next()
})

// Through the website the path starts with /api, calling the function URL directly it does not.
app.use(['/api', '/'], router)

app.use((req, res) => res.status(404).json({ error: 'Unknown endpoint. See GET /api for the list.' }))

// Last safety net: log the real error, send a plain message.
// Express needs all 4 parameters to know this handles errors.
app.use((error, req, res, _next) => {
  console.error('API error:', error.message)
  res.status(500).json({ error: 'Something went wrong.' })
})

exports.api = onRequest({ maxInstances: 10, timeoutSeconds: 30 }, app)
