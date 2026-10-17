<template>
  <Dialog
    v-model:visible="open"
    modal
    :draggable="false"
    header="Email selected users"
    :style="{ width: '34rem', maxWidth: '95vw' }"
    :closable="!sending"
  >
    <p class="small text-body-secondary">
      To <strong>{{ recipients.length }}</strong> user{{ recipients.length === 1 ? '' : 's' }}. Each person gets their
      own copy, so nobody sees anyone else's address. Type <code v-pre>{{name}}</code> to insert their first name.
    </p>

    <ul class="small mb-3 recipient-list" aria-label="Selected recipients">
      <li v-for="user in recipients" :key="user.uid">{{ user.fullName }} ({{ user.email }})</li>
    </ul>

    <div class="alert alert-danger" role="alert" v-if="error">{{ error }}</div>

    <div class="mb-3">
      <label for="bulkSubject" class="form-label">Subject</label>
      <input
        id="bulkSubject"
        type="text"
        class="form-control"
        maxlength="120"
        :aria-invalid="!!errors.subject"
        :aria-describedby="errors.subject ? 'bulkSubject-error' : undefined"
        v-model="subject"
        @blur="validateSubject(true)"
        @input="validateSubject(false)"
      />
      <div id="bulkSubject-error" class="text-danger small mt-1" role="alert" v-if="errors.subject">
        {{ errors.subject }}
      </div>
    </div>

    <div class="mb-3">
      <label for="bulkMessage" class="form-label">Message</label>
      <textarea
        id="bulkMessage"
        class="form-control"
        rows="6"
        maxlength="2000"
        :aria-invalid="!!errors.message"
        :aria-describedby="errors.message ? 'bulkMessage-error' : undefined"
        v-model="message"
        @blur="validateMessage(true)"
        @input="validateMessage(false)"
      ></textarea>
      <div class="d-flex justify-content-between">
        <div id="bulkMessage-error" class="text-danger small mt-1" role="alert">{{ errors.message }}</div>
        <div class="small text-body-secondary mt-1">{{ message.length }} / 2000</div>
      </div>
    </div>

    <template #footer>
      <button type="button" class="btn btn-outline-secondary" :disabled="sending" @click="open = false">Cancel</button>
      <button type="button" class="btn btn-primary" :disabled="sending || !isValid" @click="send">
        {{ sending ? 'Sending...' : `Send to ${recipients.length}` }}
      </button>
    </template>
  </Dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import Dialog from 'primevue/dialog'
import { callFunction } from '../api/functions'
import { sanitiseText } from '../utils/security'

const props = defineProps({
  recipients: { type: Array, required: true },
})
const emit = defineEmits(['sent'])

// The parent opens and closes the popup with v-model:visible.
const open = defineModel('visible', { type: Boolean, default: false })

const subject = ref('')
const message = ref('')
const errors = ref({ subject: null, message: null })
const error = ref(null)
const sending = ref(false)

// Empty form every time it opens.
watch(open, (isOpen) => {
  if (isOpen) {
    subject.value = ''
    message.value = 'Hi {{name}},\n\n'
    errors.value = { subject: null, message: null }
    error.value = null
  }
})

const validateSubject = (blur) => {
  if (subject.value.trim().length < 3) {
    if (blur) errors.value.subject = 'Subject must be at least 3 characters.'
  } else errors.value.subject = null
}

const validateMessage = (blur) => {
  if (message.value.trim().length < 5) {
    if (blur) errors.value.message = 'Message must be at least 5 characters.'
  } else errors.value.message = null
}

const isValid = computed(
  () => subject.value.trim().length >= 3 && message.value.trim().length >= 5 && props.recipients.length > 0,
)

const send = async () => {
  validateSubject(true)
  validateMessage(true)
  if (!isValid.value) return

  error.value = null
  sending.value = true
  const result = await callFunction('sendBulkEmail', {
    uids: props.recipients.map((user) => user.uid),
    subject: sanitiseText(subject.value.trim(), 120),
    message: sanitiseText(message.value.trim(), 2000),
  })
  sending.value = false

  if (result.ok) {
    emit('sent', result.data)
    open.value = false
  } else {
    error.value = result.error
  }
}
</script>

<style scoped>
.recipient-list {
  max-height: 7rem;
  overflow-y: auto;
}
</style>
