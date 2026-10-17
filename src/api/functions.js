// Calls our Cloud Functions with the user's login token, so the server knows who is asking.

import { auth } from '../firebase/init'

const BASE_URL =
  import.meta.env.VITE_FUNCTIONS_BASE_URL ??
  'https://australia-southeast2-commongoal-4a77b.cloudfunctions.net'

export async function callFunction(name, body = {}) {
  const user = auth.currentUser
  if (!user) return { ok: false, error: 'Sign in first.' }

  try {
    const token = await user.getIdToken()
    const response = await fetch(`${BASE_URL}/${name}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    })
    const data = await response.json().catch(() => ({}))
    if (!response.ok) return { ok: false, error: data.error ?? `Request failed (${response.status}).` }
    return { ok: true, data }
  } catch (error) {
    console.error(`Function ${name} failed:`, error.message)
    return { ok: false, error: 'Could not reach the server. Check your connection.' }
  }
}
