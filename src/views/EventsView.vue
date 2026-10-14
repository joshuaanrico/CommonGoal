<template>
  <div class="container mt-5">
    <h1>Upcoming Events</h1>
    <p>
      Walk to the game days, bike buses, workshops and tree plantings run with partner clubs. Filter by
      type, suburb or date to find one near you.
    </p>

    <div class="row g-2 align-items-end mb-3">
      <div class="col-md-6">
        <label for="eventsSearch" class="form-label">Search all columns</label>
        <input
          id="eventsSearch"
          type="search"
          class="form-control"
          placeholder="e.g. bike, Preston, workshop"
          v-model="filters.global.value"
        />
      </div>
      <div class="col-md-6 text-md-end">
        <button type="button" class="btn btn-outline-secondary" @click="clearFilters">Clear filters</button>
      </div>
    </div>

    <p class="text-body-secondary small" aria-live="polite">
      {{ visibleCount }} of {{ events.length }} events match.
    </p>

    <!-- BR D.3: second interactive table, same features as Clubs. -->
    <DataTable
      :value="rows"
      v-model:filters="filters"
      filterDisplay="row"
      :globalFilterFields="['title', 'category', 'suburb']"
      paginator
      :rows="10"
      :rowsPerPageOptions="[10, 20, 40]"
      removableSort
      stripedRows
      scrollable
      sortField="date"
      :sortOrder="1"
      tableStyle="min-width: 56rem"
      dataKey="id"
      @filter="onFilter"
    >
      <template #empty>No events match these filters.</template>

      <Column field="title" header="Event" sortable :showFilterMenu="false">
        <template #filter="{ filterModel, filterCallback }">
          <input
            type="text"
            class="form-control form-control-sm"
            aria-label="Filter by event name"
            placeholder="Event"
            v-model="filterModel.value"
            @input="filterCallback()"
          />
        </template>
      </Column>

      <Column field="category" header="Type" sortable :showFilterMenu="false">
        <template #filter="{ filterModel, filterCallback }">
          <select
            class="form-select form-select-sm"
            aria-label="Filter by event type"
            v-model="filterModel.value"
            @change="filterCallback()"
          >
            <option :value="null">All</option>
            <option v-for="category in categories" :key="category" :value="category">{{ category }}</option>
          </select>
        </template>
      </Column>

      <Column field="suburb" header="Suburb" sortable :showFilterMenu="false">
        <template #filter="{ filterModel, filterCallback }">
          <select
            class="form-select form-select-sm"
            aria-label="Filter by suburb"
            v-model="filterModel.value"
            @change="filterCallback()"
          >
            <option :value="null">All</option>
            <option v-for="suburb in suburbs" :key="suburb" :value="suburb">{{ suburb }}</option>
          </select>
        </template>
      </Column>

      <!-- ISO date strings sort and compare correctly as text, the body shows the friendly format. -->
      <Column field="date" header="Date" sortable :showFilterMenu="false">
        <template #body="{ data }">{{ formatDate(data.date) }}</template>
        <template #filter="{ filterModel, filterCallback }">
          <input
            type="date"
            class="form-control form-control-sm"
            aria-label="Events on or after date"
            v-model="filterModel.value"
            @change="filterCallback()"
          />
        </template>
      </Column>

      <Column field="spotsLeft" header="Spots left" sortable :showFilterMenu="false">
        <template #body="{ data }">
          <span :class="{ 'text-danger fw-semibold': data.spotsLeft === 0 }">
            {{ data.spotsLeft === 0 ? 'Full' : data.spotsLeft }}
          </span>
        </template>
        <template #filter="{ filterModel, filterCallback }">
          <input
            type="number"
            min="0"
            class="form-control form-control-sm"
            aria-label="Minimum spots left"
            placeholder="At least"
            v-model.number="filterModel.value"
            @input="filterCallback()"
          />
        </template>
      </Column>

      <Column field="cost" header="Cost" sortable :showFilterMenu="false">
        <template #filter="{ filterModel, filterCallback }">
          <select
            class="form-select form-select-sm"
            aria-label="Filter by cost"
            v-model="filterModel.value"
            @change="filterCallback()"
          >
            <option :value="null">All</option>
            <option value="Free">Free</option>
            <option value="Paid">Paid</option>
          </select>
        </template>
      </Column>
    </DataTable>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { FilterMatchMode } from '@primevue/core/api'
import events from '../assets/json/events.json'

// Derived columns are computed once so they can be sorted and filtered like real fields.
const rows = events.map((event) => ({
  ...event,
  spotsLeft: event.capacity - event.booked,
  cost: event.free ? 'Free' : 'Paid',
}))

const uniqueSorted = (key) => [...new Set(events.map((event) => event[key]))].sort()
const categories = uniqueSorted('category')
const suburbs = uniqueSorted('suburb')

const formatDate = (iso) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('en-AU', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

const emptyFilters = () => ({
  global: { value: null, matchMode: FilterMatchMode.CONTAINS },
  title: { value: null, matchMode: FilterMatchMode.CONTAINS },
  category: { value: null, matchMode: FilterMatchMode.EQUALS },
  suburb: { value: null, matchMode: FilterMatchMode.EQUALS },
  date: { value: null, matchMode: FilterMatchMode.GREATER_THAN_OR_EQUAL_TO },
  spotsLeft: { value: null, matchMode: FilterMatchMode.GREATER_THAN_OR_EQUAL_TO },
  cost: { value: null, matchMode: FilterMatchMode.EQUALS },
})

const filters = ref(emptyFilters())
const visibleCount = ref(rows.length)

const onFilter = (event) => {
  visibleCount.value = event.filteredValue.length
}

const clearFilters = () => {
  filters.value = emptyFilters()
}
</script>
