// Ratings store for CommonGoal (BR C.3).

import { ref, computed } from 'vue'
import { collection, doc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase/init'
import { sanitiseText } from '../utils/security'

const ratings = ref([])

onSnapshot(collection(db, 'ratings'), (snapshot) => {
  ratings.value = snapshot.docs.map((docSnap) => docSnap.data())
})

// Group every rating by routeId, once, so averageFor and countFor do not re-scan the whole list on every call.
const byRoute = computed(() => {
  const grouped = {}
  ratings.value.forEach((rating) => {
    if (!grouped[rating.routeId]) grouped[rating.routeId] = []
    grouped[rating.routeId].push(rating)
  })
  return grouped
})

export function averageFor(routeId) {
  const routeRatings = byRoute.value[routeId]
  if (!routeRatings || routeRatings.length === 0) return null
  const total = routeRatings.reduce((sum, rating) => sum + rating.score, 0)
  return Number((total / routeRatings.length).toFixed(1))
}

export function countFor(routeId) {
  return byRoute.value[routeId]?.length ?? 0
}

// Fixed id (uid + routeId) means re-rating just overwrites the same doc, no lookup needed first.
export async function saveRating(uid, routeId, score, comment) {
  try {
    await setDoc(doc(db, 'ratings', `${uid}_${routeId}`), {
      uid,
      routeId,
      score,
      comment: sanitiseText(comment, 300),
      updatedAt: serverTimestamp(),
    })
    return { ok: true }
  } catch (error) {
    console.error('Failed to save rating:', error.code)
    return { ok: false, error: 'Could not save your rating. Please try again.' }
  }
}
