// Live admin data for the dashboard and charts (BR F.1).
//
// Opens one onSnapshot listener per collection, so every number and chart updates the moment a
// user registers, rates a route or an email is sent, with no refresh. The listeners are closed
// when the page is left, otherwise they would keep reading (and billing) in the background.
// Only admins can read users and emailLog, the Firestore rules enforce that on the server.

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

  // Maps each Firestore doc to a plain object with timestamps as milliseconds, easy to chart.
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
