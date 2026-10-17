<template>
  <section aria-labelledby="charts-heading">
    <h2 id="charts-heading" class="h4">Charts</h2>
    <p class="text-body-secondary small">
      Live from Firestore. Click a bar in the first chart to see that route's score breakdown.
    </p>

    <p class="text-body-secondary" v-if="loading" role="status">Loading charts...</p>

    <div class="row g-4" v-else>
      <!-- 1. Average rating per route. Click a bar for details. -->
      <div class="col-lg-7">
        <div class="card h-100">
          <div class="card-body">
            <h3 class="h6">Average rating per route</h3>
            <Chart
              type="bar"
              :data="barData"
              :options="barOptions"
              class="chart-box"
              aria-label="Bar chart of the average rating for each route"
              @select="onBarSelect"
            />
            <p class="small mt-2 mb-0" aria-live="polite">{{ barSummary }}</p>
          </div>
        </div>
      </div>

      <!-- 2. Users by role. -->
      <div class="col-lg-5">
        <div class="card h-100">
          <div class="card-body">
            <h3 class="h6">Users by role</h3>
            <Chart
              type="doughnut"
              :data="roleData"
              :options="roleOptions"
              class="chart-box"
              aria-label="Doughnut chart of users by role"
            />
            <p class="small mt-2 mb-0">{{ roleSummary }}</p>
          </div>
        </div>
      </div>

      <!-- 3. Ratings per day. -->
      <div class="col-12">
        <div class="card">
          <div class="card-body">
            <h3 class="h6">Ratings given per day</h3>
            <Chart
              type="line"
              :data="lineData"
              :options="lineOptions"
              class="chart-box"
              aria-label="Line chart of ratings given per day"
            />
            <p class="small mt-2 mb-0">{{ lineSummary }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Shows after clicking a bar. -->
    <div class="card mt-3" v-if="picked" role="status">
      <div class="card-body">
        <h3 class="h6">{{ picked.name }}</h3>
        <p class="mb-1">
          Average <strong>{{ picked.average }}</strong> out of 5 from {{ picked.count }}
          rating{{ picked.count === 1 ? '' : 's' }}.
        </p>
        <p class="small text-body-secondary mb-0">
          Scores: {{ picked.breakdown }}
          <RouterLink class="ms-2" to="/routes">Open routes</RouterLink>
        </p>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed } from 'vue'
import Chart from 'primevue/chart'
import routes from '../assets/json/routes.json'
import { useAdminData } from '../composables/useAdminData'

const { users, ratings, loading } = useAdminData()

const GREEN = '#198754'
const BLUE = '#0d6efd'
const GREY = '#6c757d'

// Charts draw on a canvas, so give them the page's text colour.
const textColour = getComputedStyle(document.documentElement).getPropertyValue('--bs-body-color') || '#212529'

const picked = ref(null)

// ---- per route stats from the live ratings ----
const perRoute = computed(() =>
  routes.map((route) => {
    const mine = ratings.value.filter((rating) => rating.routeId === route.id)
    const total = mine.reduce((sum, rating) => sum + rating.score, 0)
    const counts = [1, 2, 3, 4, 5].map((score) => mine.filter((rating) => rating.score === score).length)
    return {
      id: route.id,
      name: route.name,
      count: mine.length,
      average: mine.length ? Number((total / mine.length).toFixed(1)) : 0,
      breakdown: counts.map((n, i) => `${i + 1} star: ${n}`).join(', '),
    }
  }),
)

const barData = computed(() => ({
  labels: perRoute.value.map((route) => route.name),
  datasets: [
    {
      label: 'Average rating (out of 5)',
      data: perRoute.value.map((route) => route.average),
      backgroundColor: GREEN,
      borderRadius: 4,
    },
  ],
}))

const barOptions = computed(() => ({
  maintainAspectRatio: false,
  indexAxis: 'y',
  scales: {
    x: { min: 0, max: 5, ticks: { color: textColour, stepSize: 1 } },
    y: { ticks: { color: textColour } },
  },
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (item) => {
          const route = perRoute.value[item.dataIndex]
          return route.count
            ? `${route.average} from ${route.count} rating${route.count === 1 ? '' : 's'}`
            : 'No ratings yet'
        },
      },
    },
  },
}))

const onBarSelect = (event) => {
  const index = event.element?.index
  if (index === undefined) return
  picked.value = perRoute.value[index]
}

const barSummary = computed(() => {
  const rated = perRoute.value.filter((route) => route.count > 0)
  if (!rated.length) return 'No ratings yet.'
  const best = [...rated].sort((a, b) => b.average - a.average)[0]
  return `${rated.length} of ${routes.length} routes have ratings. Highest: ${best.name} at ${best.average}.`
})

// ---- users by role ----
const roleCounts = computed(() => ({
  member: users.value.filter((user) => user.role === 'member').length,
  admin: users.value.filter((user) => user.role === 'admin').length,
}))

const roleData = computed(() => ({
  labels: ['Members', 'Admins'],
  datasets: [{ data: [roleCounts.value.member, roleCounts.value.admin], backgroundColor: [BLUE, GREY] }],
}))

const roleOptions = {
  maintainAspectRatio: false,
  plugins: { legend: { position: 'bottom', labels: { color: textColour } } },
}

const roleSummary = computed(
  () =>
    `${roleCounts.value.member} members and ${roleCounts.value.admin} admin${roleCounts.value.admin === 1 ? '' : 's'}.`,
)

// ---- ratings per day ----
const dayKey = (ms) => new Date(ms).toLocaleDateString('en-CA')

const perDay = computed(() => {
  const counts = {}
  ratings.value.forEach((rating) => {
    if (!rating.updatedAtMs) return
    const key = dayKey(rating.updatedAtMs)
    counts[key] = (counts[key] ?? 0) + 1
  })
  return Object.entries(counts).sort(([a], [b]) => a.localeCompare(b))
})

const lineData = computed(() => ({
  labels: perDay.value.map(([day]) => day),
  datasets: [
    {
      label: 'Ratings',
      data: perDay.value.map(([, count]) => count),
      borderColor: GREEN,
      backgroundColor: GREEN,
      tension: 0.3,
      fill: false,
    },
  ],
}))

const lineOptions = {
  maintainAspectRatio: false,
  scales: {
    x: { ticks: { color: textColour } },
    y: { beginAtZero: true, ticks: { color: textColour, precision: 0 } },
  },
  plugins: { legend: { display: false } },
}

const lineSummary = computed(() => {
  if (!perDay.value.length) return 'No ratings yet.'
  const busiest = [...perDay.value].sort((a, b) => b[1] - a[1])[0]
  const days = perDay.value.length
  return `${ratings.value.length} ratings over ${days} day${days === 1 ? '' : 's'}. Busiest day: ${busiest[0]} with ${busiest[1]}.`
})
</script>

<style scoped>
.chart-box {
  height: 18rem;
}
</style>
