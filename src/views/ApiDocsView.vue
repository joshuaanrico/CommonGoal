<template>
  <div class="container mt-5">
    <h1>CommonGoal public API</h1>
    <p>
      Anyone can read CommonGoal's routes, clubs and route ratings as JSON. It is free, needs no account or
      key, and is read only (<code>GET</code> only). Schools, councils and clubs can use it to show
      active travel routes on their own sites.
    </p>

    <div class="card mb-4">
      <div class="card-body">
        <h2 class="h5">Base URL</h2>
        <p class="mb-2">
          <code>{{ publicBase }}</code>
        </p>
        <h2 class="h5 mt-3">Quick start</h2>
        <pre class="bg-body-secondary p-3 rounded mb-2"><code>curl "{{ publicBase }}/routes?limit=2"</code></pre>
        <pre class="bg-body-secondary p-3 rounded mb-0"><code>fetch("{{ publicBase }}/clubs?sport=Soccer")
  .then((res) => res.json())
  .then((data) => console.log(data))</code></pre>
      </div>
    </div>

    <h2 class="h4">Endpoints</h2>
    <p class="text-body-secondary small">
      Lists are paged: <code>limit</code> (1 to 100, default 20) and <code>offset</code>. Responses are cached
      for 5 minutes. Errors are JSON like <code>{ "error": "..." }</code> with a proper status code
      (400, 404, 405).
    </p>

    <div class="card mb-3" v-for="endpoint in endpoints" :key="endpoint.path">
      <div class="card-body">
        <h3 class="h6 d-flex flex-wrap align-items-center gap-2">
          <span class="badge text-bg-success">GET</span>
          <code>{{ endpoint.label }}</code>
        </h3>
        <p class="mb-2">{{ endpoint.description }}</p>
        <p class="small text-body-secondary mb-2" v-if="endpoint.params">Parameters: {{ endpoint.params }}</p>
        <button
          type="button"
          class="btn btn-outline-primary btn-sm"
          :disabled="loadingPath === endpoint.path"
          @click="tryIt(endpoint)"
        >
          {{ loadingPath === endpoint.path ? 'Loading...' : `Try it: ${endpoint.path}` }}
        </button>

        <div v-if="result && result.path === endpoint.path" class="mt-3">
          <p class="small mb-1" aria-live="polite">
            <span class="badge" :class="result.ok ? 'text-bg-success' : 'text-bg-danger'">{{ result.status }}</span>
            <span class="ms-2 text-body-secondary">{{ result.ms }} ms</span>
          </p>
          <!-- {{ }} escapes the text, so whatever the API returns can never run as HTML. -->
          <pre class="bg-body-secondary p-3 rounded mb-0 api-output" tabindex="0" aria-label="API response">{{ result.body }}</pre>
        </div>
      </div>
    </div>

    <h2 class="h4 mt-4">Good to know</h2>
    <ul>
      <li>Only public data is exposed. User accounts, emails and individual ratings are never in the API.</li>
      <li>Rating stats (<code>/routes/:id/stats</code>) are calculated by a Cloud Function, so they cannot be faked.</li>
      <li>CORS is open for <code>GET</code>, so browsers on any website can call it.</li>
    </ul>
  </div>
</template>

<script setup>
import { ref } from 'vue'

// On the live site /api is rewritten to the Cloud Function. The local dev server has no such
// rewrite, so while developing the page calls the live API instead.
const publicBase = 'https://commongoal-4a77b.web.app/api'
const apiBase = import.meta.env.DEV ? publicBase : '/api'

const endpoints = [
  {
    path: '/routes?limit=3',
    label: '/routes',
    description: 'List active travel routes.',
    params: 'suburb, shade=true, stepFree=true, limit, offset',
  },
  { path: '/routes/1', label: '/routes/:id', description: 'One route by id, with its coordinates.' },
  {
    path: '/routes/1/stats',
    label: '/routes/:id/stats',
    description: 'The live average rating and number of ratings for a route.',
  },
  {
    path: '/clubs?sport=Soccer&limit=3',
    label: '/clubs',
    description: 'List partner clubs.',
    params: 'sport, suburb, limit, offset',
  },
  { path: '/clubs/1', label: '/clubs/:id', description: 'One club by id.' },
]

const loadingPath = ref(null)
const result = ref(null)

const tryIt = async (endpoint) => {
  loadingPath.value = endpoint.path
  const started = performance.now()
  try {
    const response = await fetch(`${apiBase}${endpoint.path}`)
    const json = await response.json()
    result.value = {
      path: endpoint.path,
      ok: response.ok,
      status: `${response.status} ${response.statusText || ''}`.trim(),
      ms: Math.round(performance.now() - started),
      body: JSON.stringify(json, null, 2),
    }
  } catch (error) {
    console.error('API request failed:', error.message)
    result.value = {
      path: endpoint.path,
      ok: false,
      status: 'Network error',
      ms: Math.round(performance.now() - started),
      body: 'Could not reach the API. Check your connection and try again.',
    }
  } finally {
    loadingPath.value = null
  }
}
</script>

<style scoped>
.api-output {
  max-height: 20rem;
  overflow: auto;
  font-size: 0.8rem;
}
</style>
