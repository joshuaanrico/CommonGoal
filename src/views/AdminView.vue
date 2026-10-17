<template>
  <div class="container mt-5">
    <h1>Admin console</h1>

    <AdminOverview class="mt-4" />

    <!-- Lazy loaded so Chart.js is only downloaded when an admin opens this page. -->
    <AdminCharts class="mt-5" />

    <section class="mt-5">
      <h2 class="h4">Registered users</h2>
      <div class="alert alert-danger" v-if="loadError">{{ loadError }}</div>
      <div class="alert" :class="actionOk ? 'alert-success' : 'alert-danger'" role="status" v-if="actionMessage">
        {{ actionMessage }}
      </div>
      <label for="usersSearch" class="form-label">Search users</label>
      <input
        id="usersSearch"
        type="search"
        class="form-control mb-3"
        placeholder="Email, name or role"
        v-model="userFilters.global.value"
      />
      <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2">
        <p class="small text-body-secondary mb-0" aria-live="polite">
          {{ visibleUsers.length }} of {{ users.length }} users match.
        </p>
        <ExportButtons :rows="visibleUsers" :columns="userColumns" name="users" title="CommonGoal registered users" />
      </div>
      <div class="d-flex flex-wrap align-items-center gap-2 mb-2">
        <button
          type="button"
          class="btn btn-primary btn-sm"
          :disabled="selectedUsers.length === 0"
          @click="emailDialogOpen = true"
        >
          Email selected ({{ selectedUsers.length }})
        </button>
        <button
          type="button"
          class="btn btn-outline-secondary btn-sm"
          v-if="selectedUsers.length"
          @click="selectedUsers = []"
        >
          Clear selection
        </button>
        <span class="small text-body-secondary">Tick users in the first column, up to 50 at a time.</span>
      </div>
      <DataTable
        ref="usersTable"
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
        v-model:selection="selectedUsers"
        :loading="loadingUsers"
      >
        <template #empty>No users match.</template>
        <Column selectionMode="multiple" headerStyle="width: 3rem" :exportable="false"></Column>
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
        <!-- Calls the setUserRole Cloud Function, the only place a role can change. -->
        <Column header="Action">
          <template #body="{ data }">
            <span class="badge text-bg-secondary" v-if="data.uid === currentUser?.uid">You</span>
            <button
              v-else
              type="button"
              class="btn btn-sm btn-outline-primary"
              :disabled="busyUid === data.uid"
              @click="toggleRole(data)"
            >
              {{ busyUid === data.uid ? 'Saving...' : data.role === 'admin' ? 'Make member' : 'Make admin' }}
            </button>
          </template>
        </Column>
      </DataTable>
    </section>

    <BulkEmailDialog v-model:visible="emailDialogOpen" :recipients="selectedUsers" @sent="onBulkSent" />

    <section class="mt-5">
      <div class="d-flex flex-wrap justify-content-between align-items-center gap-2">
        <h2 class="h4 mb-0">Route ratings</h2>
        <button type="button" class="btn btn-sm btn-outline-secondary" :disabled="rebuilding" @click="rebuildStats">
          {{ rebuilding ? 'Recalculating...' : 'Recalculate route stats' }}
        </button>
      </div>
      <div class="mb-2">
        <ExportButtons :rows="ratingSummary" :columns="ratingColumns" name="route-ratings" title="CommonGoal route ratings" />
      </div>
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
import { ref, computed, onMounted, defineAsyncComponent } from 'vue'
import { collection, getDocs } from 'firebase/firestore'
import { FilterMatchMode } from '@primevue/core/api'
import { db } from '../firebase/init'
import { currentUser } from '../stores/auth'
import { callFunction } from '../api/functions'
import ExportButtons from '../components/ExportButtons.vue'
import AdminOverview from '../components/AdminOverview.vue'
import BulkEmailDialog from '../components/BulkEmailDialog.vue'

const AdminCharts = defineAsyncComponent(() => import('../components/AdminCharts.vue'))
import routes from '../assets/json/routes.json'

// Rows for export: the users table's own filtered and sorted rows, so the file matches the screen.
const usersTable = ref(null)
const visibleUsers = computed(() => usersTable.value?.processedData ?? users.value)
const userColumns = [
  { field: 'email', header: 'Email' },
  { field: 'fullName', header: 'Name' },
  { field: 'role', header: 'Role' },
  { field: 'createdLabel', header: 'Created' },
]
const ratingColumns = [
  { field: 'name', header: 'Route' },
  { field: 'average', header: 'Average rating' },
  { field: 'count', header: 'Number of ratings' },
]

// Bulk email: the ticked rows in the users table, and the compose dialog.
const selectedUsers = ref([])
const emailDialogOpen = ref(false)

const onBulkSent = (result) => {
  const skipped = result.skipped ? ` (${result.skipped} could not be found)` : ''
  showResult(true, `Email sent to ${result.sent} user${result.sent === 1 ? '' : 's'}${skipped}.`)
  selectedUsers.value = []
}

const busyUid = ref(null)
const rebuilding = ref(false)
const actionMessage = ref('')
const actionOk = ref(true)

const showResult = (ok, message) => {
  actionOk.value = ok
  actionMessage.value = message
}

const toggleRole = async (user) => {
  const role = user.role === 'admin' ? 'member' : 'admin'
  busyUid.value = user.uid
  const result = await callFunction('setUserRole', { uid: user.uid, role })
  busyUid.value = null
  if (result.ok) {
    user.role = role
    showResult(true, `${user.email} is now ${role === 'admin' ? 'an admin' : 'a member'}.`)
  } else {
    showResult(false, result.error)
  }
}

const rebuildStats = async () => {
  rebuilding.value = true
  const result = await callFunction('rebuildRouteStats')
  rebuilding.value = false
  showResult(result.ok, result.ok ? `Recalculated stats for ${result.data.rebuilt} routes.` : result.error)
}

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
