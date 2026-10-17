<template>
  <section aria-labelledby="overview-heading">
    <h2 id="overview-heading" class="h4">Overview</h2>

    <div class="alert alert-warning" role="alert" v-if="error">{{ error }}</div>

    <p class="text-body-secondary" v-if="loading" role="status">Loading the latest numbers...</p>

    <div class="row row-cols-2 row-cols-lg-3 g-3" v-else>
      <div class="col" v-for="stat in stats" :key="stat.label">
        <div class="card h-100">
          <div class="card-body">
            <p class="small text-body-secondary mb-1">{{ stat.label }}</p>
            <p class="display-6 fw-semibold mb-1">{{ stat.value }}</p>
            <p class="small mb-0" v-if="stat.note">{{ stat.note }}</p>
          </div>
        </div>
      </div>
    </div>

    <p class="mt-3 mb-0" v-if="!loading">
      Most rated route: <strong>{{ mostRated.name }}</strong
      ><span class="text-body-secondary" v-if="mostRated.count > 0"> ({{ mostRated.count }} ratings)</span>
    </p>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import routes from '../assets/json/routes.json'
import { useAdminData } from '../composables/useAdminData'

const { users, ratings, emails, loading, error } = useAdminData()

const WEEK_MS = 7 * 24 * 60 * 60 * 1000

const admins = computed(() => users.value.filter((user) => user.role === 'admin').length)
const members = computed(() => users.value.length - admins.value)

const newThisWeek = computed(() => {
  const since = Date.now() - WEEK_MS
  return users.value.filter((user) => user.createdAtMs >= since).length
})

const averageRating = computed(() => {
  if (!ratings.value.length) return null
  const total = ratings.value.reduce((sum, rating) => sum + rating.score, 0)
  return (total / ratings.value.length).toFixed(1)
})

const emailsSent = computed(() => emails.value.reduce((sum, entry) => sum + entry.recipients, 0))

const mostRated = computed(() => {
  const counts = {}
  ratings.value.forEach((rating) => {
    counts[rating.routeId] = (counts[rating.routeId] ?? 0) + 1
  })
  const [topId, topCount] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0] ?? []
  if (!topId) return { name: 'No ratings yet', count: 0 }
  const route = routes.find((r) => String(r.id) === topId)
  return { name: route?.name ?? `Route ${topId}`, count: topCount }
})

const stats = computed(() => [
  { label: 'Registered users', value: users.value.length },
  { label: 'Members / admins', value: `${members.value} / ${admins.value}`, note: 'Two roles: member and admin' },
  { label: 'New in the last 7 days', value: newThisWeek.value },
  { label: 'Ratings given', value: ratings.value.length },
  { label: 'Average rating', value: averageRating.value ?? 'None yet', note: averageRating.value ? 'out of 5, all routes' : '' },
  { label: 'Emails sent', value: emailsSent.value, note: 'counted per recipient' },
])
</script>
