<template>
  <div class="container mt-5">
    <div class="row">
      <div class="col-md-8 offset-md-2">
        <h1 class="text-center">Create an account</h1>
        <p class="text-center text-muted">
          Register to rate routes and see your dashboard. Every new account is a member;
          there is no way to register as an admin through this form.
        </p>

        <div class="alert alert-danger" v-if="formError">{{ formError }}</div>

        <form @submit.prevent="submitForm">
          <div class="mb-3">
            <label for="fullName" class="form-label">Full name</label>
            <input
              type="text"
              class="form-control"
              id="fullName"
              maxlength="80"
              @blur="() => validateFullName(true)"
              @input="() => validateFullName(false)"
              v-model="formData.fullName"
            />
            <div class="text-danger" v-if="errors.fullName">{{ errors.fullName }}</div>
          </div>

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

          <div class="row mb-3">
            <div class="col-6">
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
              <div class="form-text">At least 8 characters, with a letter and a number.</div>
            </div>
            <div class="col-6">
              <label for="confirmPassword" class="form-label">Confirm password</label>
              <input
                type="password"
                class="form-control"
                id="confirmPassword"
                @blur="() => validateConfirmPassword(true)"
                @input="() => validateConfirmPassword(false)"
                v-model="formData.confirmPassword"
              />
              <div class="text-danger" v-if="errors.confirmPassword">
                {{ errors.confirmPassword }}
              </div>
            </div>
          </div>

          <div class="text-center">
            <button type="submit" class="btn btn-primary" :disabled="!isFormValid || submitting">
              {{ submitting ? 'Creating account...' : 'Register' }}
            </button>
          </div>
        </form>

        <p class="text-center mt-3">
          Already have an account? <RouterLink to="/login">Log in</RouterLink>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { register } from '../stores/auth'

const router = useRouter()

const formData = ref({
  fullName: '',
  email: '',
  password: '',
  confirmPassword: '',
})

const errors = ref({
  fullName: null,
  email: null,
  password: null,
  confirmPassword: null,
})

const formError = ref(null)
const submitting = ref(false)

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PASSWORD_PATTERN = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/

const validateFullName = (blur) => {
  if (formData.value.fullName.trim().length < 3) {
    if (blur) errors.value.fullName = 'Full name must be at least 3 characters.'
  } else {
    errors.value.fullName = null
  }
}

const validateEmail = (blur) => {
  if (!EMAIL_PATTERN.test(formData.value.email)) {
    if (blur) errors.value.email = 'Enter a valid email address.'
  } else {
    errors.value.email = null
  }
}

const validatePassword = (blur) => {
  if (!PASSWORD_PATTERN.test(formData.value.password)) {
    if (blur) errors.value.password = 'Password needs at least 8 characters, a letter and a number.'
  } else {
    errors.value.password = null
  }
  // Re-check the confirm field too, in case the password changed after it was filled.
  validateConfirmPassword(formData.value.confirmPassword !== '')
}

const validateConfirmPassword = (blur) => {
  if (formData.value.confirmPassword !== formData.value.password) {
    if (blur) errors.value.confirmPassword = 'Passwords do not match.'
  } else {
    errors.value.confirmPassword = null
  }
}

const isFormValid = computed(() => {
  return (
    formData.value.fullName.trim().length >= 3 &&
    EMAIL_PATTERN.test(formData.value.email) &&
    PASSWORD_PATTERN.test(formData.value.password) &&
    formData.value.confirmPassword === formData.value.password
  )
})

const submitForm = async () => {
  validateFullName(true)
  validateEmail(true)
  validatePassword(true)
  validateConfirmPassword(true)
  if (!isFormValid.value) return

  formError.value = null
  submitting.value = true

  const result = await register({
    fullName: formData.value.fullName.trim(),
    email: formData.value.email,
    password: formData.value.password,
  })

  submitting.value = false

  if (result.ok) {
    router.push('/dashboard')
  } else {
    formError.value = result.error
  }
}
</script>
