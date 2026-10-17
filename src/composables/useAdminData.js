// Live data for the admin dashboard and charts (BR F.1).
// onSnapshot = updates by itself when the data changes, no refresh.
// Listeners are closed when you leave the page, so they stop reading (and costing) in the background.

import { ref, onMounted, onUnmounted } from 'vue'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase/init'

export function useAdminData() {
  const users = ref([])
  const ratings = ref([])
  const emails = ref([])
  const loading = ref(true)
  const error = ref(null)

  const unsubscribers = []
  let waitingFor = 3

  const firstResult = () => {
    waitingFor -= 1
    if (waitingFor <= 0) loading.value = false
  }

  // Turn each doc into a simple object. Dates become numbers (ms) so they are easy to chart.
  const listen = (name, target, toRow) => {
    let first = true
    const unsubscribe = onSnapshot(
      collection(db, name),
      (snapshot) => {
        target.value = snapshot.docs.map(toRow)
        if (first) {
          first = false
          firstResult()
        }
      },
      (err) => {
        console.error(`Could not load ${name}:`, err.code)
        error.value = 'Some dashboard numbers could not be loaded.'
        if (first) {
          first = false
          firstResult()
        }
      },
    )
    unsubscribers.push(unsubscribe)
  }

  onMounted(() => {
    listen('users', users, (d) => ({
      uid: d.id,
      email: d.data().email,
      role: d.data().role,
      createdAtMs: d.data().createdAt?.toMillis() ?? 0,
    }))
    listen('ratings', ratings, (d) => ({
      routeId: d.data().routeId,
      score: d.data().score,
      updatedAtMs: d.data().updatedAt?.toMillis() ?? 0,
    }))
    listen('emailLog', emails, (d) => ({
      kind: d.data().kind,
      recipients: d.data().recipients ?? 1,
      atMs: d.data().at?.toMillis() ?? 0,
    }))
  })

  onUnmounted(() => unsubscribers.forEach((unsubscribe) => unsubscribe()))

  return { users, ratings, emails, loading, error }
}
