<template>
  <div class="container mt-5">
    <div class="row">
      <div class="col-md-6 offset-md-3">
        <h1 class="text-center">Log in</h1>

        <div class="alert alert-danger" v-if="formError">{{ formError }}</div>

        <form @submit.prevent="submitForm">
          <div class="mb-3">
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

          <div class="mb-3">
            <label for="password" class="form-label">Password</label>
            <input
              type="password"
              class="form-control"
              id="password"
              @blur="() => validatePassword(true)"
              @input="() => validatePassword(false)"
              v-model="formData.password"
            />
            <div class="text-danger" v-if="errors.password">{{ errors.password }}</div>
          </div>

          <div class="text-center">
            <button type="submit" class="btn btn-primary" :disabled="!isFormValid || submitting">
              {{ submitting ? 'Logging in...' : 'Log in' }}
            </button>
          </div>
        </form>

        <p class="text-center mt-3">
          No account yet? <RouterLink to="/register">Register</RouterLink>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { login } from '../stores/auth'

const router = useRouter()
const route = useRoute()

const formData = ref({
  email: '',
  password: '',
})

const errors = ref({
  email: null,
  password: null,
})

const formError = ref(null)
const submitting = ref(false)

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const validateEmail = (blur) => {
  if (!EMAIL_PATTERN.test(formData.value.email)) {
    if (blur) errors.value.email = 'Enter a valid email address.'
  } else {
    errors.value.email = null
  }
}

const validatePassword = (blur) => {
  if (formData.value.password.length === 0) {
    if (blur) errors.value.password = 'Enter your password.'
  } else {
    errors.value.password = null
  }
}

const isFormValid = computed(() => {
  return EMAIL_PATTERN.test(formData.value.email) && formData.value.password.length > 0
})

const submitForm = async () => {
  validateEmail(true)
  validatePassword(true)
  if (!isFormValid.value) return

  formError.value = null
  submitting.value = true

  const result = await login(formData.value.email, formData.value.password)

  submitting.value = false

  if (result.ok) {
    // If login was triggered by visiting a protected page, go back there.
    router.push(route.query.redirect || '/dashboard')
  } else {
    formError.value = result.error
  }
}
</script>
