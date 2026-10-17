<template>
  <div class="mt-3 pt-3 border-top">
    <p class="mb-2 small" :aria-label="summaryLabel">
      <strong v-if="average !== null">{{ average }} / 5</strong>
      <strong v-else>No ratings yet</strong>
      <span class="text-body-secondary" v-if="count > 0"> ({{ count }} rating{{ count === 1 ? '' : 's' }})</span>
    </p>

    <div v-if="isAuthenticated">
      <div class="btn-group btn-group-sm mb-2" role="group" :aria-label="`Your rating for ${routeName}`">
        <!-- aria-pressed tells a screen reader which score is chosen, the label says what each button means. -->
        <button
          v-for="value in 5"
          :key="value"
          type="button"
          class="btn"
          :class="value <= selectedScore ? 'btn-primary' : 'btn-outline-primary'"
          :aria-pressed="value === selectedScore"
          :aria-label="`Rate ${value} out of 5`"
          @click="selectedScore = value"
        >
          {{ value }}
        </button>
      </div>
      <label :for="`comment-${routeId}`" class="visually-hidden">Optional comment about {{ routeName }}</label>
      <textarea
        :id="`comment-${routeId}`"
        class="form-control form-control-sm mb-2"
        rows="2"
        maxlength="300"
        placeholder="Optional comment"
        v-model="comment"
      ></textarea>
      <button type="button" class="btn btn-sm btn-secondary" :disabled="submitting" @click="submit">
        {{ submitting ? 'Saving...' : 'Submit rating' }}
      </button>
      <div class="text-danger small mt-1" role="alert" v-if="submitError">{{ submitError }}</div>
      <div class="text-success small mt-1" role="status" v-if="saved">Thanks, your rating was saved.</div>
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
  routeName: {
    type: String,
    default: 'this route',
  },
})

const selectedScore = ref(0)
const saved = ref(false)
const comment = ref('')
const submitting = ref(false)
const submitError = ref(null)

const average = computed(() => averageFor(props.routeId))
const count = computed(() => countFor(props.routeId))

// Spoken summary, so a screen reader hears one clear sentence instead of "3.5 / 5 (2 ratings)".
const summaryLabel = computed(() =>
  average.value === null
    ? `${props.routeName} has no ratings yet`
    : `${props.routeName} is rated ${average.value} out of 5 from ${count.value} rating${count.value === 1 ? '' : 's'}`,
)

const submit = async () => {
  if (selectedScore.value === 0) {
    submitError.value = 'Pick a score from 1 to 5 first.'
    return
  }

  submitError.value = null
  saved.value = false
  submitting.value = true

  const result = await saveRating(currentUser.value.uid, props.routeId, selectedScore.value, comment.value)

  submitting.value = false

  if (result.ok) {
    saved.value = true
  } else {
    submitError.value = result.error
  }
}
</script>
