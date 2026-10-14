// Ratings store for CommonGoal (BR C.3, E.1).

import { ref } from 'vue'
import { collection, doc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase/init'
import { sanitiseText } from '../utils/security'

// routeStats/{routeId} holds { average, count }, calculated by the onRatingWritten Cloud
// Function. The browser only reads it, so the score on every card is the server's number.
const statsByRoute = ref({})

onSnapshot(collection(db, 'routeStats'), (snapshot) => {
  const next = {}
  snapshot.docs.forEach((docSnap) => {
    next[docSnap.id] = docSnap.data()
  })
  statsByRoute.value = next
})

export function averageFor(routeId) {
  return statsByRoute.value[routeId]?.average ?? null
}

export function countFor(routeId) {
  return statsByRoute.value[routeId]?.count ?? 0
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
