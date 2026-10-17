<template>
  <div class="container mt-5">
    <div class="row">
      <div class="col-md-8 offset-md-2">
        <h1>Share a route</h1>
        <p>
          Email a route to a friend or a club teammate, with an optional attachment such as a map or a
          timetable. Attachments can be a PDF, PNG, JPG, TXT or CSV file up to 2 MB.
        </p>

        <div class="alert alert-success" role="status" v-if="sent">
          Email sent to {{ lastRecipient }}. They can reply to you directly.
        </div>
        <div class="alert alert-danger" role="alert" v-if="serverError">{{ serverError }}</div>

        <form @submit.prevent="handleSubmit" novalidate>
          <div class="mb-3">
            <label for="routePick" class="form-label">Route to share (optional)</label>
            <select id="routePick" class="form-select" v-model.number="routeId" @change="fillFromRoute">
              <option :value="0">No route, write my own message</option>
              <option v-for="route in routes" :key="route.id" :value="route.id">{{ route.name }}</option>
            </select>
          </div>

          <div class="mb-3">
            <label for="to" class="form-label">Friend's email</label>
            <input
              id="to"
              type="email"
              class="form-control"
              autocomplete="off"
              maxlength="254"
              :aria-invalid="!!errors.to"
              aria-describedby="toError"
              v-model="form.to"
              @blur="validateTo(true)"
              @input="validateTo(false)"
            />
            <div id="toError" class="text-danger small mt-1" role="alert" v-if="errors.to">{{ errors.to }}</div>
          </div>

          <div class="mb-3">
            <label for="subject" class="form-label">Subject</label>
            <input
              id="subject"
              type="text"
              class="form-control"
              maxlength="120"
              :aria-invalid="!!errors.subject"
              aria-describedby="subjectError"
              v-model="form.subject"
              @blur="validateSubject(true)"
              @input="validateSubject(false)"
            />
            <div id="subjectError" class="text-danger small mt-1" role="alert" v-if="errors.subject">
              {{ errors.subject }}
            </div>
          </div>

          <div class="mb-3">
            <label for="message" class="form-label">Message</label>
            <textarea
              id="message"
              class="form-control"
              rows="6"
              maxlength="2000"
              :aria-invalid="!!errors.message"
              aria-describedby="messageError messageCount"
              v-model="form.message"
              @blur="validateMessage(true)"
              @input="validateMessage(false)"
            ></textarea>
            <div class="d-flex justify-content-between">
              <div id="messageError" class="text-danger small mt-1" role="alert">{{ errors.message }}</div>
              <div id="messageCount" class="small text-body-secondary mt-1">{{ form.message.length }} / 2000</div>
            </div>
          </div>

          <div class="mb-3">
            <label for="attachment" class="form-label">Attachment (optional)</label>
            <input
              id="attachment"
              ref="fileInput"
              type="file"
              class="form-control"
              accept=".pdf,.png,.jpg,.jpeg,.txt,.csv,application/pdf,image/png,image/jpeg,text/plain,text/csv"
              :aria-invalid="!!errors.file"
              aria-describedby="fileError"
              @change="onFileChange"
            />
            <div id="fileError" class="text-danger small mt-1" role="alert" v-if="errors.file">{{ errors.file }}</div>
          </div>

          <button type="submit" class="btn btn-primary" :disabled="sending || !isValid">
            {{ sending ? 'Sending...' : 'Send email' }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import routes from '../assets/json/routes.json'
import { callFunction } from '../api/functions'
import { sanitiseText } from '../utils/security'

const ALLOWED_TYPES = ['application/pdf', 'image/png', 'image/jpeg', 'text/plain', 'text/csv']
const MAX_FILE_BYTES = 2 * 1024 * 1024
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const form = reactive({ to: '', subject: '', message: '' })
const errors = reactive({ to: null, subject: null, message: null, file: null })
const routeId = ref(0)
const file = ref(null)
const fileInput = ref(null)
const sending = ref(false)
const sent = ref(false)
const lastRecipient = ref('')
const serverError = ref('')

// Same as the Join form: show the error when you leave the field, then update it as you type.
const validateTo = (blur) => {
  if (!EMAIL_PATTERN.test(form.to.trim())) {
    if (blur) errors.to = 'Enter a valid email address.'
  } else errors.to = null
}
const validateSubject = (blur) => {
  const length = form.subject.trim().length
  if (length < 3) {
    if (blur) errors.subject = 'Subject must be at least 3 characters.'
  } else errors.subject = null
}
const validateMessage = (blur) => {
  const length = form.message.trim().length
  if (length < 5) {
    if (blur) errors.message = 'Message must be at least 5 characters.'
  } else errors.message = null
}

const isValid = computed(
  () =>
    EMAIL_PATTERN.test(form.to.trim()) &&
    form.subject.trim().length >= 3 &&
    form.message.trim().length >= 5 &&
    !errors.file,
)

const fillFromRoute = () => {
  const route = routes.find((r) => r.id === routeId.value)
  if (!route) return
  form.subject = `Walk or ride the ${route.name}?`
  form.message =
    `Hi,\n\nHave a look at the ${route.name} in ${route.suburb}. It is ${route.distanceKm} km on a ` +
    `${route.surface}, ${route.hasShade ? 'with shade' : 'with little shade'}.\n\n${route.description}\n\nWant to try it together?`
  validateSubject(false)
  validateMessage(false)
}

const onFileChange = (event) => {
  errors.file = null
  file.value = null
  const chosen = event.target.files[0]
  if (!chosen) return

  if (!ALLOWED_TYPES.includes(chosen.type)) {
    errors.file = 'Attach a PDF, PNG, JPG, TXT or CSV file.'
    return
  }
  if (chosen.size > MAX_FILE_BYTES) {
    errors.file = 'File must be 2 MB or smaller.'
    return
  }
  file.value = chosen
}

// Turn the file into base64 text so it can go inside the JSON.
const toBase64 = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result.split(',')[1])
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })

const handleSubmit = async () => {
  validateTo(true)
  validateSubject(true)
  validateMessage(true)
  if (!isValid.value) return

  sent.value = false
  serverError.value = ''
  sending.value = true

  try {
    const body = {
      to: form.to.trim(),
      subject: sanitiseText(form.subject.trim(), 120),
      message: sanitiseText(form.message.trim(), 2000),
    }
    if (file.value) {
      body.attachment = { name: file.value.name, type: file.value.type, content: await toBase64(file.value) }
    }

    const result = await callFunction('sendEmail', body)
    if (result.ok) {
      sent.value = true
      lastRecipient.value = body.to
      form.to = ''
      form.subject = ''
      form.message = ''
      routeId.value = 0
      file.value = null
      if (fileInput.value) fileInput.value.value = ''
    } else {
      serverError.value = result.error
    }
  } catch (error) {
    console.error('Could not read the attachment:', error.message)
    serverError.value = 'Could not read that file. Try another one.'
  } finally {
    sending.value = false
  }
}
</script>
