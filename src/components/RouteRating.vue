<template>
  <div class="mt-3 pt-3 border-top">
    <p class="mb-2 small">
      <strong v-if="average !== null">{{ average }} / 5</strong>
      <strong v-else>No ratings yet</strong>
      <span class="text-body-secondary" v-if="count > 0"> ({{ count }} rating{{ count === 1 ? '' : 's' }})</span>
    </p>

    <div v-if="isAuthenticated">
      <div class="btn-group btn-group-sm mb-2" role="group" aria-label="Rate this route">
        <button
          v-for="value in 5"
          :key="value"
          type="button"
          class="btn"
          :class="value <= selectedScore ? 'btn-primary' : 'btn-outline-primary'"
          @click="selectedScore = value"
        >
          {{ value }}
        </button>
      </div>
      <textarea
        class="form-control form-control-sm mb-2"
        rows="2"
        maxlength="300"
        placeholder="Optional comment"
        v-model="comment"
      ></textarea>
      <button type="button" class="btn btn-sm btn-secondary" :disabled="submitting" @click="submit">
        {{ submitting ? 'Saving...' : 'Submit rating' }}
      </button>
      <div class="text-danger small mt-1" v-if="submitError">{{ submitError }}</div>
    </div>
    <p class="small text-body-secondary" v-else>
      <RouterLink to="/login">Log in</RouterLink> to rate this route.
    </p>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { currentUser, isAuthenticated } from '../stores/auth'
import { averageFor, countFor, saveRating } from '../stores/ratings'

const props = defineProps({
  routeId: {
    type: Number,
    required: true,
  },
})

const selectedScore = ref(0)
const comment = ref('')
const submitting = ref(false)
const submitError = ref(null)

const average = computed(() => averageFor(props.routeId))
const count = computed(() => countFor(props.routeId))

const submit = async () => {
  if (selectedScore.value === 0) {
    submitError.value = 'Pick a score from 1 to 5 first.'
    return
  }

  submitError.value = null
  submitting.value = true

  const result = await saveRating(currentUser.value.uid, props.routeId, selectedScore.value, comment.value)

  submitting.value = false

  if (!result.ok) {
    submitError.value = result.error
  }
}
</script>
