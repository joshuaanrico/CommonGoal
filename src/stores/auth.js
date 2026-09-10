// Auth store for CommonGoal (BR C.1, C.2).
// Same style as the week 5 / week 7 studios: plain refs and functions, no Pinia.

import { ref, computed } from 'vue'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '../firebase/init'

export const currentUser = ref(null)
export const userProfile = ref(null)

export const isAuthenticated = computed(() => currentUser.value !== null)
export const userRole = computed(() => userProfile.value?.role ?? null)
export const isAdmin = computed(() => userRole.value === 'admin')

// Firebase tells us who is signed in asynchronously, a bit after the app loads.
// The router guard needs to wait for that first check to finish before deciding
// whether to redirect, otherwise it sees "nobody signed in yet" and kicks a
// signed-in user back to login every time they refresh the page.
let resolveAuthReady
export const authReady = new Promise((resolve) => {
  resolveAuthReady = resolve
})

onAuthStateChanged(auth, async (user) => {
  currentUser.value = user

  if (user) {
    try {
      const snap = await getDoc(doc(db, 'users', user.uid))
      userProfile.value = snap.exists() ? snap.data() : null
    } catch (error) {
      console.error('Failed to load user profile:', error.code)
      userProfile.value = null
    }
  } else {
    userProfile.value = null
  }

  resolveAuthReady()
})

// Same message for every login failure. If we said "wrong password" vs "no
// account found" separately, someone could use that to figure out which emails
// are registered.
const GENERIC_AUTH_ERROR = 'Email or password is incorrect.'

export async function register({ fullName, email, password }) {
  try {
    const credential = await createUserWithEmailAndPassword(auth, email, password)

    // Every new account is a member. There is no admin option on the form, and
    // the Firestore rules block anyone from writing role: 'admin' themselves.
    await setDoc(doc(db, 'users', credential.user.uid), {
      email,
      fullName,
      role: 'member',
      createdAt: serverTimestamp(),
    })

    return { ok: true }
  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      return { ok: false, error: 'An account with this email already exists.' }
    }
    if (error.code === 'auth/invalid-email') {
      return { ok: false, error: 'Enter a valid email address.' }
    }
    if (error.code === 'auth/weak-password') {
      return { ok: false, error: 'Password is too weak.' }
    }
    console.error('Registration failed:', error.code)
    return { ok: false, error: 'Registration failed. Please try again.' }
  }
}

export async function login(email, password) {
  try {
    await signInWithEmailAndPassword(auth, email, password)
    return { ok: true }
  } catch (error) {
    console.error('Login failed:', error.code)
    return { ok: false, error: GENERIC_AUTH_ERROR }
  }
}

export async function logout() {
  await signOut(auth)
}
