<template>
  <div class="container mt-5">
    <h1>Admin console</h1>

    <section class="mt-4">
      <h2 class="h4">Registered users</h2>
      <div class="alert alert-danger" v-if="loadError">{{ loadError }}</div>
      <DataTable :value="users" tableStyle="min-width: 40rem" :loading="loadingUsers">
        <Column field="email" header="Email"></Column>
        <Column field="fullName" header="Name"></Column>
        <Column field="role" header="Role"></Column>
        <Column field="createdLabel" header="Created"></Column>
      </DataTable>
    </section>

    <section class="mt-5">
      <h2 class="h4">Route ratings</h2>
      <DataTable :value="ratingSummary" tableStyle="min-width: 40rem" :loading="loadingRatings">
        <Column field="name" header="Route"></Column>
        <Column field="average" header="Average"></Column>
        <Column field="count" header="Ratings"></Column>
      </DataTable>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../firebase/init'
import routes from '../assets/json/routes.json'

const users = ref([])
const loadingUsers = ref(true)
const ratingSummary = ref([])
const loadingRatings = ref(true)
const loadError = ref(null)

onMounted(async () => {
  try {
    const usersSnap = await getDocs(collection(db, 'users'))
    users.value = usersSnap.docs.map((docSnap) => {
      const data = docSnap.data()
      return {
        email: data.email,
        fullName: data.fullName,
        role: data.role,
        createdLabel: data.createdAt?.toDate().toLocaleDateString() ?? 'unknown',
      }
    })
  } catch (error) {
    console.error('Failed to load users:', error.code)
    loadError.value = 'Could not load registered users.'
  } finally {
    loadingUsers.value = false
  }

  try {
    const ratingsSnap = await getDocs(collection(db, 'ratings'))
    const totals = {}

    ratingsSnap.docs.forEach((docSnap) => {
      const { routeId, score } = docSnap.data()
      if (!totals[routeId]) totals[routeId] = { sum: 0, count: 0 }
      totals[routeId].sum += score
      totals[routeId].count += 1
    })

    ratingSummary.value = routes
      .map((route) => {
        const totalsForRoute = totals[route.id]
        const average = totalsForRoute ? totalsForRoute.sum / totalsForRoute.count : null
        return {
          name: route.name,
          average: average !== null ? average.toFixed(1) : 'No ratings yet',
          count: totalsForRoute ? totalsForRoute.count : 0,
          sortKey: average ?? -1,
        }
      })
      .sort((a, b) => b.sortKey - a.sortKey)
  } catch (error) {
    console.error('Failed to load ratings:', error.code)
  } finally {
    loadingRatings.value = false
  }
})
</script>
