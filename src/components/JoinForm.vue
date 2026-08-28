<template>
  <div class="container mt-5">
    <div class="row">
      <div class="col-md-8 offset-md-2">
        <h1 class="text-center">Join CommonGoal</h1>
        <p class="text-center text-muted">
          Sign up your family or club to start using our routes and sessions.
        </p>
        <form @submit.prevent="submitForm">
          <div class="row mb-3">
            <div class="col-6">
              <label for="fullName" class="form-label">Full name</label>
              <input
                type="text"
                class="form-control"
                id="fullName"
                @blur="() => validateFullName(true)"
                @input="() => validateFullName(false)"
                v-model="formData.fullName"
              />
              <div class="text-danger" v-if="errors.fullName">{{ errors.fullName }}</div>
            </div>
            <div class="col-6">
              <label for="email" class="form-label">Email</label>
              <input
                type="email"
                class="form-control"
                id="email"
                @blur="() => validateEmail(true)"
                @input="() => validateEmail(false)"
                v-model="formData.email"
              />
              <div class="text-danger" v-if="errors.email">{{ errors.email }}</div>
            </div>
          </div>
          <div class="row mb-3">
            <div class="col-6">
              <label for="weeklyKm" class="form-label">Weekly km travelled to training</label>
              <input
                type="number"
                class="form-control"
                id="weeklyKm"
                @blur="() => validateWeeklyKm(true)"
                @input="() => validateWeeklyKm(false)"
                v-model="formData.weeklyKm"
              />
              <div class="text-danger" v-if="errors.weeklyKm">{{ errors.weeklyKm }}</div>
            </div>
            <div class="col-6">
              <label for="suburb" class="form-label">Suburb</label>
              <select
                class="form-select"
                id="suburb"
                @blur="() => validateSuburb(true)"
                @change="() => validateSuburb(true)"
                v-model="formData.suburb"
              >
                <option value="">Select suburb</option>
                <option value="Greenvale">Greenvale</option>
                <option value="Craigieburn">Craigieburn</option>
                <option value="Gladstone Park">Gladstone Park</option>
                <option value="Attwood">Attwood</option>
                <option value="Tullamarine">Tullamarine</option>
                <option value="Meadow Heights">Meadow Heights</option>
                <option value="Roxburgh Park">Roxburgh Park</option>
                <option value="Westmeadows">Westmeadows</option>
              </select>
              <div class="text-danger" v-if="errors.suburb">{{ errors.suburb }}</div>
            </div>
          </div>
          <div class="text-center">
            <button type="submit" class="btn btn-primary me-2" :disabled="!isFormValid">
              Submit
            </button>
            <button type="button" class="btn btn-secondary" @click="clearForm">Clear</button>
          </div>
        </form>
      </div>
    </div>

    <div class="row mt-5" v-if="submittedJoins.length">
      <h2 class="text-center">Recent sign-ups</h2>
      <DataTable :value="submittedJoins" tableStyle="min-width: 40rem">
        <Column field="fullName" header="Name"></Column>
        <Column field="email" header="Email"></Column>
        <Column field="suburb" header="Suburb"></Column>
        <Column field="weeklyKm" header="Weekly km"></Column>
      </DataTable>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const formData = ref({
  fullName: '',
  email: '',
  weeklyKm: '',
  suburb: '',
})

const errors = ref({
  fullName: null,
  email: null,
  weeklyKm: null,
  suburb: null,
})

const submittedJoins = ref([])

const validateFullName = (blur) => {
  if (formData.value.fullName.trim().length < 3) {
    if (blur) errors.value.fullName = 'Full name must be at least 3 characters.'
  } else {
    errors.value.fullName = null
  }
}

const validateEmail = (blur) => {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailPattern.test(formData.value.email)) {
    if (blur) errors.value.email = 'Enter a valid email address.'
  } else {
    errors.value.email = null
  }
}

const validateWeeklyKm = (blur) => {
  const km = Number(formData.value.weeklyKm)
  if (formData.value.weeklyKm === '' || Number.isNaN(km) || km < 0 || km > 200) {
    if (blur) errors.value.weeklyKm = 'Enter a number between 0 and 200 km.'
  } else {
    errors.value.weeklyKm = null
  }
}

const validateSuburb = (blur) => {
  if (!formData.value.suburb) {
    if (blur) errors.value.suburb = 'Please select a suburb.'
  } else {
    errors.value.suburb = null
  }
}

const isFormValid = computed(() => {
  return (
    formData.value.fullName.trim().length >= 3 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.value.email) &&
    formData.value.weeklyKm !== '' &&
    Number(formData.value.weeklyKm) >= 0 &&
    Number(formData.value.weeklyKm) <= 200 &&
    !!formData.value.suburb
  )
})

const clearForm = () => {
  formData.value = {
    fullName: '',
    email: '',
    weeklyKm: '',
    suburb: '',
  }
  errors.value = {
    fullName: null,
    email: null,
    weeklyKm: null,
    suburb: null,
  }
}

const submitForm = () => {
  validateFullName(true)
  validateEmail(true)
  validateWeeklyKm(true)
  validateSuburb(true)
  if (isFormValid.value) {
    submittedJoins.value.push({ ...formData.value })
    clearForm()
  }
}
</script>
