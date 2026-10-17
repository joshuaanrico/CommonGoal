<template>
  <div class="container mt-5">
    <h1>Active Travel Routes</h1>
    <p>Find a walking or riding route near your club's training and game days.</p>

    <div class="row mb-4">
      <div class="col-md-8">
        <label for="search" class="form-label">Search by name or suburb</label>
        <input
          type="text"
          class="form-control"
          id="search"
          placeholder="e.g. Greenvale, wetlands..."
          v-model="searchTerm"
        />
      </div>
      <div class="col-md-4 d-flex align-items-end">
        <div class="form-check">
          <input
            type="checkbox"
            class="form-check-input"
            id="shadeOnly"
            v-model="shadeOnly"
          />
          <label class="form-check-label" for="shadeOnly">Shaded routes only</label>
        </div>
      </div>
    </div>

    <p class="text-muted" aria-live="polite">Showing {{ filteredRoutes.length }} of {{ routes.length }} routes</p>

    <div class="row" v-if="filteredRoutes.length">
      <div class="col-lg-4 col-md-6 col-12 mb-4" v-for="route in filteredRoutes" :key="route.id">
        <div class="card h-100">
          <div class="card-body">
            <h5 class="card-title">{{ route.name }}</h5>
            <h6 class="card-subtitle mb-2 text-muted">{{ route.suburb }}</h6>
            <p class="card-text">{{ route.description }}</p>
            <ul class="list-unstyled small">
              <li>Distance: {{ route.distanceKm }} km</li>
              <li>Surface: {{ route.surface }}</li>
              <li>Shade: {{ route.hasShade ? 'Yes' : 'No' }}</li>
              <li>Step-free: {{ route.stepFree ? 'Yes' : 'No' }}</li>
            </ul>
            <RouteRating :route-id="route.id" :route-name="route.name" />
          </div>
        </div>
      </div>
    </div>

    <p v-else class="text-center text-muted mt-5">
      No routes match your search. Try a different suburb or clear the shade filter.
    </p>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import routes from '../assets/json/routes.json'
import RouteRating from '../components/RouteRating.vue'

const searchTerm = ref('')
const shadeOnly = ref(false)

const filteredRoutes = computed(() => {
  return routes.filter((route) => {
    const term = searchTerm.value.toLowerCase()
    const matchesSearch =
      route.name.toLowerCase().includes(term) || route.suburb.toLowerCase().includes(term)
    const matchesShade = !shadeOnly.value || route.hasShade
    return matchesSearch && matchesShade
  })
})
</script>
