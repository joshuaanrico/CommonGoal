<template>
  <div class="container mt-5">
    <h1>Route Map</h1>
    <p>
      See every active travel route on the map, search for a place, then get walking or riding
      directions from where you are, or from a place you searched, to the route you pick.
    </p>

    <div class="alert alert-warning" v-if="!MAPBOX_TOKEN">
      Map token missing. Add VITE_MAPBOX_TOKEN to .env.local and restart the dev server.
    </div>

    <div class="row g-4">
      <div class="col-lg-4">
        <!-- Feature 1: place search -->
        <form @submit.prevent="runSearch" role="search" aria-label="Search for a place">
          <label for="placeSearch" class="form-label">Search for a place</label>
          <div class="input-group">
            <input
              id="placeSearch"
              type="search"
              class="form-control"
              placeholder="e.g. Craigieburn Central"
              maxlength="80"
              v-model="query"
            />
            <button class="btn btn-primary" type="submit" :disabled="searching">
              {{ searching ? 'Searching...' : 'Search' }}
            </button>
          </div>
        </form>

        <p class="text-danger small mt-2" role="alert" v-if="error">{{ error }}</p>

        <ul class="list-group mt-2" aria-label="Search results" v-if="results.length">
          <li class="list-group-item p-0" v-for="place in results" :key="place.id">
            <button type="button" class="btn btn-link text-start text-decoration-none w-100" @click="choosePlace(place)">
              <span class="fw-semibold d-block">{{ place.name }}</span>
              <span class="small text-body-secondary">{{ place.address }}</span>
            </button>
          </li>
        </ul>
        <p class="small text-body-secondary mt-2" v-else-if="searched">No places found. Try another name.</p>

        <!-- Feature 2: directions and trip info -->
        <h2 class="h5 mt-4">Get directions</h2>
        <div class="mb-2">
          <label for="routePick" class="form-label">To route</label>
          <select id="routePick" class="form-select" v-model.number="routeId">
            <option v-for="route in routes" :key="route.id" :value="route.id">{{ route.name }}</option>
          </select>
        </div>
        <div class="mb-2">
          <label for="modePick" class="form-label">Travelling by</label>
          <select id="modePick" class="form-select" v-model="mode">
            <option value="walking">Walking</option>
            <option value="cycling">Riding</option>
          </select>
        </div>
        <p class="small mb-2">
          From: <strong>{{ origin ? origin.name : 'not set' }}</strong>
        </p>
        <div class="d-flex flex-wrap gap-2">
          <button type="button" class="btn btn-outline-primary btn-sm" @click="useMyLocation">Use my location</button>
          <button type="button" class="btn btn-primary btn-sm" :disabled="!origin || directing" @click="runDirections">
            {{ directing ? 'Working...' : 'Get directions' }}
          </button>
          <button type="button" class="btn btn-outline-secondary btn-sm" v-if="trip" @click="clearTrip">Clear</button>
        </div>

        <div class="card mt-3" v-if="trip" aria-live="polite">
          <div class="card-body">
            <h3 class="h6">{{ trip.distanceKm.toFixed(1) }} km, about {{ trip.durationMin }} min {{ mode === 'walking' ? 'walking' : 'riding' }}</h3>
            <ol class="small ps-3 mb-0">
              <li v-for="(step, index) in visibleSteps" :key="index">{{ step }}</li>
            </ol>
            <button
              type="button"
              class="btn btn-link btn-sm p-0 mt-1"
              v-if="trip.steps.length > STEP_PREVIEW"
              :aria-expanded="showAllSteps"
              @click="showAllSteps = !showAllSteps"
            >
              {{ showAllSteps ? 'Show fewer steps' : `Show all ${trip.steps.length} steps` }}
            </button>
          </div>
        </div>
      </div>

      <div class="col-lg-8">
        <!-- Screen readers can't see a map, so the routes are also listed as text. -->
        <div ref="mapEl" class="route-map" role="region" aria-label="Map of active travel routes, a list of the same routes follows"></div>

        <h2 class="h5 mt-4">Routes on the map</h2>
        <ul class="list-unstyled mb-0">
          <li v-for="route in routes" :key="route.id" class="mb-1">
            <button type="button" class="btn btn-link p-0 text-start" @click="focusRoute(route)">
              {{ route.name }}
            </button>
            <span class="text-body-secondary small">, {{ route.suburb }}, {{ route.distanceKm }} km</span>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import routes from '../assets/json/routes.json'
import { MAPBOX_TOKEN, HOME_CENTRE, searchPlaces, getDirections } from '../utils/mapbox'

const mapEl = ref(null)
const query = ref('')
const results = ref([])
const searched = ref(false)
const searching = ref(false)
const directing = ref(false)
const error = ref('')
const origin = ref(null)
const routeId = ref(routes[0].id)
const mode = ref('walking')
const trip = ref(null)
const showAllSteps = ref(false)

// Long trips have 40+ steps, so show 8 first.
const STEP_PREVIEW = 8
const visibleSteps = computed(() =>
  showAllSteps.value ? trip.value.steps : trip.value.steps.slice(0, STEP_PREVIEW),
)

let map = null
let searchMarker = null
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

// If the user turned on "reduce motion", jump instead of fly.
const moveTo = (lng, lat, zoom = 14) => {
  if (!map) return
  if (prefersReducedMotion) map.jumpTo({ center: [lng, lat], zoom })
  else map.flyTo({ center: [lng, lat], zoom })
}

onMounted(() => {
  if (!MAPBOX_TOKEN) return
  mapboxgl.accessToken = MAPBOX_TOKEN
  map = new mapboxgl.Map({ container: mapEl.value, style: 'mapbox://styles/mapbox/streets-v12', center: HOME_CENTRE, zoom: 10.5 })
  map.addControl(new mapboxgl.NavigationControl(), 'top-right')

  routes.forEach((route) => {
    // textContent (not HTML) so data can never run as code.
    const box = document.createElement('div')
    const title = document.createElement('strong')
    title.textContent = route.name
    const detail = document.createElement('div')
    detail.textContent = `${route.suburb}, ${route.distanceKm} km, ${route.surface}`
    box.append(title, detail)

    new mapboxgl.Marker({ color: '#198754' })
      .setLngLat([route.lng, route.lat])
      .setPopup(new mapboxgl.Popup({ offset: 24 }).setDOMContent(box))
      .addTo(map)
  })
})

onBeforeUnmount(() => map?.remove())

const focusRoute = (route) => {
  routeId.value = route.id
  moveTo(route.lng, route.lat)
}

const runSearch = async () => {
  error.value = ''
  searching.value = true
  try {
    results.value = await searchPlaces(query.value)
    searched.value = true
  } catch (err) {
    console.error('Place search failed:', err.message)
    error.value = 'Place search is unavailable right now. Please try again.'
  } finally {
    searching.value = false
  }
}

// Pick a result: drop a red pin and use it as the start point.
const choosePlace = (place) => {
  searchMarker?.remove()
  searchMarker = new mapboxgl.Marker({ color: '#dc3545' }).setLngLat([place.lng, place.lat]).addTo(map)
  origin.value = { name: place.name, lng: place.lng, lat: place.lat }
  results.value = []
  searched.value = false
  moveTo(place.lng, place.lat)
}

const useMyLocation = () => {
  error.value = ''
  if (!navigator.geolocation) {
    error.value = 'Your browser does not support location. Search for a place instead.'
    return
  }
  navigator.geolocation.getCurrentPosition(
    (position) => {
      origin.value = { name: 'My location', lng: position.coords.longitude, lat: position.coords.latitude }
      searchMarker?.remove()
      searchMarker = new mapboxgl.Marker({ color: '#dc3545' }).setLngLat([origin.value.lng, origin.value.lat]).addTo(map)
      moveTo(origin.value.lng, origin.value.lat, 13)
    },
    () => {
      error.value = 'Could not get your location. Allow location access, or search for a place instead.'
    },
  )
}

// Changing route or walking/riding gets new directions, so the numbers stay correct.
watch([routeId, mode], () => {
  if (trip.value && origin.value) runDirections()
})

const clearTrip = () => {
  trip.value = null
  if (map?.getLayer('trip-line')) map.removeLayer('trip-line')
  if (map?.getSource('trip-line')) map.removeSource('trip-line')
}

const runDirections = async () => {
  error.value = ''
  const destination = routes.find((route) => route.id === routeId.value)
  directing.value = true
  try {
    const result = await getDirections(origin.value, destination, mode.value)
    if (!result) {
      error.value = 'No path found between those points.'
      return
    }
    clearTrip()
    showAllSteps.value = false
    trip.value = result

    map.addSource('trip-line', { type: 'geojson', data: { type: 'Feature', geometry: result.line } })
    map.addLayer({
      id: 'trip-line',
      type: 'line',
      source: 'trip-line',
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: { 'line-color': '#0d6efd', 'line-width': 5 },
    })

    const bounds = result.line.coordinates.reduce(
      (box, point) => box.extend(point),
      new mapboxgl.LngLatBounds(result.line.coordinates[0], result.line.coordinates[0]),
    )
    map.fitBounds(bounds, { padding: 60, duration: prefersReducedMotion ? 0 : 800 })
  } catch (err) {
    console.error('Directions failed:', err.message)
    error.value = 'Directions are unavailable right now. Please try again.'
  } finally {
    directing.value = false
  }
}
</script>

<style scoped>
.route-map {
  width: 100%;
  height: 28rem;
  border-radius: 0.5rem;
}
</style>
