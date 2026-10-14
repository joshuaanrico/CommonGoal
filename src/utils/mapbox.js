// Mapbox web service helpers for CommonGoal (BR E.2).
//
// The pk. token is a public token, built to ship in browser code. It is restricted to this
// site's URLs in the Mapbox dashboard, and is the only Mapbox secret-like value in the app.
// Reference: https://docs.mapbox.com/api/search/geocoding/ and /api/navigation/directions/

export const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN

// Greenvale, Melbourne. Searches are biased towards here so "Coburg" means the Melbourne one.
export const HOME_CENTRE = [144.89, -37.65]

// Place search (geocoding). Returns up to 5 places in Australia, nearest to Greenvale first.
export async function searchPlaces(query) {
  const text = query.trim()
  if (text.length < 2) return []

  const params = new URLSearchParams({
    q: text,
    country: 'au',
    proximity: HOME_CENTRE.join(','),
    limit: '5',
    access_token: MAPBOX_TOKEN,
  })
  const response = await fetch(`https://api.mapbox.com/search/geocode/v6/forward?${params}`)
  if (!response.ok) throw new Error(`Geocoding failed (${response.status})`)

  const data = await response.json()
  return data.features.map((feature) => ({
    id: feature.id,
    name: feature.properties.name,
    address: feature.properties.place_formatted ?? '',
    lng: feature.geometry.coordinates[0],
    lat: feature.geometry.coordinates[1],
  }))
}

// Route between two points. mode is 'walking' or 'cycling'. Returns distance (km), duration
// (minutes), the line to draw and the turn by turn steps (trip information).
export async function getDirections(from, to, mode) {
  const coords = `${from.lng},${from.lat};${to.lng},${to.lat}`
  const params = new URLSearchParams({
    geometries: 'geojson',
    steps: 'true',
    overview: 'full',
    access_token: MAPBOX_TOKEN,
  })
  const response = await fetch(`https://api.mapbox.com/directions/v5/mapbox/${mode}/${coords}?${params}`)
  if (!response.ok) throw new Error(`Directions failed (${response.status})`)

  const data = await response.json()
  const route = data.routes?.[0]
  if (!route) return null

  return {
    distanceKm: route.distance / 1000,
    durationMin: Math.round(route.duration / 60),
    line: route.geometry,
    steps: route.legs[0].steps.map((step) => step.maneuver.instruction),
  }
}
