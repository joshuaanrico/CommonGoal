// Public, read only REST API for CommonGoal (BR F.1: API access for third parties).
//
// Anyone can fetch routes, clubs and route rating stats as JSON, no account or key needed. Only
// public data is exposed: no users, emails, individual ratings or comments, and nothing can be
// written through it (GET only). Served at /api/* through a Firebase Hosting rewrite, so the URL
// looks like part of the website: https://commongoal-4a77b.web.app/api/routes

const { onRequest } = require('firebase-functions/v2/https')
const admin = require('firebase-admin')
const express = require('express')
const cors = require('cors')

const routes = require('./data/routes.json')
const clubs = require('./data/clubs.json')

const router = express.Router()

const MAX_LIMIT = 100
const DEFAULT_LIMIT = 20

// Reads ?limit= and ?offset= safely, so a client cannot ask for a million rows or send junk.
function paging(query) {
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || DEFAULT_LIMIT, 1), MAX_LIMIT)
  const offset = Math.max(parseInt(query.offset, 10) || 0, 0)
  return { limit, offset }
}

function paged(items, query) {
  const { limit, offset } = paging(query)
  return { total: items.length, limit, offset, data: items.slice(offset, offset + limit) }
}

// Ids in the URL must be whole positive numbers, anything else is a client error (400).
function parseId(req, res) {
  const id = Number(req.params.id)
  if (!Number.isInteger(id) || id < 1) {
    res.status(400).json({ error: 'The id must be a positive whole number.' })
    return null
  }
  return id
}

const clean = (value) => String(value ?? '').trim().toLowerCase()

// GET /api  : a short index so the API describes itself.
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

// GET /api/routes : every active travel route, with optional filters.
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

// GET /api/routes/:id/stats : the live rating average and count, calculated by the
// onRatingWritten Cloud Function. Only the numbers are shared, never who rated or what they wrote.
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

// GET /api/clubs : partner clubs, filter by sport or suburb.
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

// Public data, so any website may call it from the browser. GET only.
app.use(cors({ methods: ['GET'] }))

// Anything but GET is refused with 405 and the Allow header, as REST expects.
app.use((req, res, next) => {
  if (req.method === 'GET' || req.method === 'OPTIONS') return next()
  res.set('Allow', 'GET').status(405).json({ error: 'This API is read only. Use GET.' })
})

// Static data changes rarely, so browsers and the hosting CDN may keep it for 5 minutes.
app.use((req, res, next) => {
  res.set('Cache-Control', 'public, max-age=300, s-maxage=300')
  next()
})

// Mounted twice: hosting sends the full path (/api/routes), a direct call to the function URL
// sends it without the prefix (/routes).
app.use(['/api', '/'], router)

app.use((req, res) => res.status(404).json({ error: 'Unknown endpoint. See GET /api for the list.' }))

// Last resort: log the real error on the server, tell the client nothing sensitive.
app.use((error, req, res, next) => {
  console.error('API error:', error.message)
  res.status(500).json({ error: 'Something went wrong.' })
})

exports.api = onRequest({ maxInstances: 10, timeoutSeconds: 30 }, app)
