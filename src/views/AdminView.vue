<template>
  <div class="container mt-5">
    <h1>Admin console</h1>

    <section class="mt-4">
      <h2 class="h4">Registered users</h2>
      <div class="alert alert-danger" v-if="loadError">{{ loadError }}</div>
      <label for="usersSearch" class="form-label">Search users</label>
      <input
        id="usersSearch"
        type="search"
        class="form-control mb-3"
        placeholder="Email, name or role"
        v-model="userFilters.global.value"
      />
      <DataTable
        :value="users"
        v-model:filters="userFilters"
        filterDisplay="row"
        :globalFilterFields="['email', 'fullName', 'role']"
        paginator
        :rows="10"
        :rowsPerPageOptions="[10, 20, 50]"
        removableSort
        scrollable
        tableStyle="min-width: 40rem"
        dataKey="uid"
        :loading="loadingUsers"
      >
        <template #empty>No users match.</template>
        <Column field="email" header="Email" sortable :showFilterMenu="false">
          <template #filter="{ filterModel, filterCallback }">
            <input
              type="text"
              class="form-control form-control-sm"
              aria-label="Filter by email"
              v-model="filterModel.value"
              @input="filterCallback()"
            />
          </template>
        </Column>
        <Column field="fullName" header="Name" sortable :showFilterMenu="false">
          <template #filter="{ filterModel, filterCallback }">
            <input
              type="text"
              class="form-control form-control-sm"
              aria-label="Filter by name"
              v-model="filterModel.value"
              @input="filterCallback()"
            />
          </template>
        </Column>
        <Column field="role" header="Role" sortable :showFilterMenu="false">
          <template #filter="{ filterModel, filterCallback }">
            <select
              class="form-select form-select-sm"
              aria-label="Filter by role"
              v-model="filterModel.value"
              @change="filterCallback()"
            >
              <option :value="null">All</option>
              <option value="member">member</option>
              <option value="admin">admin</option>
            </select>
          </template>
        </Column>
        <Column field="createdAtMs" header="Created" sortable>
          <template #body="{ data }">{{ data.createdLabel }}</template>
        </Column>
      </DataTable>
    </section>

    <section class="mt-5">
      <h2 class="h4">Route ratings</h2>
      <DataTable
        :value="ratingSummary"
        paginator
        :rows="10"
        removableSort
        scrollable
        tableStyle="min-width: 40rem"
        :loading="loadingRatings"
      >
        <Column field="name" header="Route" sortable></Column>
        <Column field="sortKey" header="Average" sortable>
          <template #body="{ data }">{{ data.average }}</template>
        </Column>
        <Column field="count" header="Ratings" sortable></Column>
      </DataTable>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { collection, getDocs } from 'firebase/firestore'
import { FilterMatchMode } from '@primevue/core/api'
import { db } from '../firebase/init'
import routes from '../assets/json/routes.json'

const userFilters = ref({
  global: { value: null, matchMode: FilterMatchMode.CONTAINS },
  email: { value: null, matchMode: FilterMatchMode.CONTAINS },
  fullName: { value: null, matchMode: FilterMatchMode.CONTAINS },
  role: { value: null, matchMode: FilterMatchMode.EQUALS },
})

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
        uid: docSnap.id,
        email: data.email,
        fullName: data.fullName,
        role: data.role,
        createdAtMs: data.createdAt?.toMillis() ?? 0,
        createdLabel: data.createdAt?.toDate().toLocaleDateString('en-AU') ?? 'unknown',
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
