<template>
  <div class="container mt-5">
    <h1>Climate-ready Clubs</h1>
    <p>
      Partner clubs across Melbourne's north, how many members they have, how many already walk or
      ride to sport, and how far along the CommonGoal climate-ready program they are.
    </p>

    <div class="row g-2 align-items-end mb-3">
      <div class="col-md-6">
        <label for="clubsSearch" class="form-label">Search all columns</label>
        <input
          id="clubsSearch"
          type="search"
          class="form-control"
          placeholder="e.g. Coburg, netball, Gold"
          v-model="filters.global.value"
        />
      </div>
      <div class="col-md-6 text-md-end">
        <button type="button" class="btn btn-outline-secondary" @click="clearFilters">Clear filters</button>
      </div>
    </div>

    <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2">
      <p class="text-body-secondary small mb-0" aria-live="polite">
        {{ visibleRows.length }} of {{ clubs.length }} clubs match.
      </p>
      <ExportButtons :rows="visibleRows" :columns="exportColumns" name="clubs" title="CommonGoal partner clubs" />
    </div>

    <!-- BR D.3: sort on every column, global search, a filter per column, 10 rows per page. -->
    <DataTable
      ref="tableRef"
      :value="clubs"
      v-model:filters="filters"
      filterDisplay="row"
      :globalFilterFields="['name', 'sport', 'suburb', 'climateLevel']"
      paginator
      :rows="10"
      :rowsPerPageOptions="[10, 20, 50]"
      removableSort
      stripedRows
      scrollable
      tableStyle="min-width: 56rem"
      dataKey="id"
    >
      <template #empty>No clubs match these filters.</template>

      <Column field="name" header="Club" sortable :showFilterMenu="false">
        <template #filter="{ filterModel, filterCallback }">
          <input
            type="text"
            class="form-control form-control-sm"
            aria-label="Filter by club name"
            placeholder="Name"
            v-model="filterModel.value"
            @input="filterCallback()"
          />
        </template>
      </Column>

      <Column field="sport" header="Sport" sortable :showFilterMenu="false">
        <template #filter="{ filterModel, filterCallback }">
          <select
            class="form-select form-select-sm"
            aria-label="Filter by sport"
            v-model="filterModel.value"
            @change="filterCallback()"
          >
            <option :value="null">All</option>
            <option v-for="sport in sports" :key="sport" :value="sport">{{ sport }}</option>
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

      <Column field="members" header="Members" sortable :showFilterMenu="false">
        <template #filter="{ filterModel, filterCallback }">
          <input
            type="number"
            min="0"
            class="form-control form-control-sm"
            aria-label="Minimum members"
            placeholder="At least"
            v-model.number="filterModel.value"
            @input="filterCallback()"
          />
        </template>
      </Column>

      <Column field="activeTravelPct" header="Active travel" sortable :showFilterMenu="false">
        <template #body="{ data }">{{ data.activeTravelPct }}%</template>
        <template #filter="{ filterModel, filterCallback }">
          <input
            type="number"
            min="0"
            max="100"
            class="form-control form-control-sm"
            aria-label="Minimum active travel percent"
            placeholder="At least %"
            v-model.number="filterModel.value"
            @input="filterCallback()"
          />
        </template>
      </Column>

      <Column field="climateLevel" header="Climate level" sortable :showFilterMenu="false">
        <template #filter="{ filterModel, filterCallback }">
          <select
            class="form-select form-select-sm"
            aria-label="Filter by climate level"
            v-model="filterModel.value"
            @change="filterCallback()"
          >
            <option :value="null">All</option>
            <option v-for="level in levels" :key="level" :value="level">{{ level }}</option>
          </select>
        </template>
      </Column>
    </DataTable>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { FilterMatchMode } from '@primevue/core/api'
import clubs from '../assets/json/clubs.json'
import ExportButtons from '../components/ExportButtons.vue'

const uniqueSorted = (key) => [...new Set(clubs.map((club) => club[key]))].sort()
const sports = uniqueSorted('sport')
const suburbs = uniqueSorted('suburb')
const levels = ['Getting started', 'Bronze', 'Silver', 'Gold']

const emptyFilters = () => ({
  global: { value: null, matchMode: FilterMatchMode.CONTAINS },
  name: { value: null, matchMode: FilterMatchMode.CONTAINS },
  sport: { value: null, matchMode: FilterMatchMode.EQUALS },
  suburb: { value: null, matchMode: FilterMatchMode.EQUALS },
  members: { value: null, matchMode: FilterMatchMode.GREATER_THAN_OR_EQUAL_TO },
  activeTravelPct: { value: null, matchMode: FilterMatchMode.GREATER_THAN_OR_EQUAL_TO },
  climateLevel: { value: null, matchMode: FilterMatchMode.EQUALS },
})

const filters = ref(emptyFilters())

// The table's own filtered and sorted rows (all pages), so the count line and the export always
// match what the person sees on screen.
const tableRef = ref(null)
const visibleRows = computed(() => tableRef.value?.processedData ?? clubs)

const exportColumns = [
  { field: 'name', header: 'Club' },
  { field: 'sport', header: 'Sport' },
  { field: 'suburb', header: 'Suburb' },
  { field: 'members', header: 'Members' },
  { field: 'activeTravelPct', header: 'Active travel (%)' },
  { field: 'climateLevel', header: 'Climate level' },
]

const clearFilters = () => {
  filters.value = emptyFilters()
}
</script>
