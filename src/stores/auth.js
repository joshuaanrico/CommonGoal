// Auth store: who is logged in and their role (BR C.1, C.2, D.1).

import { ref, computed } from 'vue'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '../firebase/init'
import { sanitiseText } from '../utils/security'

export const currentUser = ref(null)
export const userProfile = ref(null)

export const isAuthenticated = computed(() => currentUser.value !== null)
export const userRole = computed(() => userProfile.value?.role ?? null)
export const isAdmin = computed(() => userRole.value === 'admin')

// Firebase needs a moment to restore the login after a refresh.
// The router waits for this promise, or it would send logged-in users to /login.
let resolveAuthReady
export const authReady = new Promise((resolve) => {
  resolveAuthReady = resolve
})

// Which user's profile we already loaded. Stops a slow read from wiping a profile
// that register() or loginWithGoogle() just created.
let profileUid = null

// Saves a new member profile and shows it straight away.
async function createMemberProfile(uid, email, fullName) {
  const profile = { email, fullName, role: 'member', createdAt: serverTimestamp() }
  await setDoc(doc(db, 'users', uid), profile)
  userProfile.value = { ...profile, createdAt: new Date() }
  profileUid = uid
}

onAuthStateChanged(auth, async (user) => {
  currentUser.value = user

  if (user) {
    try {
      const snap = await getDoc(doc(db, 'users', user.uid))
      if (snap.exists()) {
        userProfile.value = snap.data()
        profileUid = user.uid
      } else if (profileUid !== user.uid) {
        userProfile.value = null
      }
    } catch (error) {
      console.error('Failed to load user profile:', error.code)
      userProfile.value = null
    }
  } else {
    userProfile.value = null
    profileUid = null
  }

  resolveAuthReady()
})

// Same message for every login failure, so nobody can find out which emails have accounts.
const GENERIC_AUTH_ERROR = 'Email or password is incorrect.'

export async function register({ fullName, email, password }) {
  try {
    const credential = await createUserWithEmailAndPassword(auth, email, password)
    // Always a member. The Firestore rules also block role: 'admin'.
    await createMemberProfile(credential.user.uid, email, fullName)
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

// Google sign-in (BR D.1). Google checks the password, our app never sees it.
// First time in, we create a member profile, same as normal register.
export async function loginWithGoogle() {
  try {
    const provider = new GoogleAuthProvider()
    provider.setCustomParameters({ prompt: 'select_account' })
    const { user } = await signInWithPopup(auth, provider)

    const snap = await getDoc(doc(db, 'users', user.uid))
    if (snap.exists()) {
      userProfile.value = snap.data()
      profileUid = user.uid
    } else {
      const name = sanitiseText(user.displayName || user.email.split('@')[0], 80)
      await createMemberProfile(user.uid, user.email, name)
    }
    return { ok: true }
  } catch (error) {
    if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
      return { ok: false, error: 'Google sign-in was cancelled.' }
    }
    if (error.code === 'auth/popup-blocked') {
      return { ok: false, error: 'Your browser blocked the Google window. Allow pop-ups and try again.' }
    }
    console.error('Google sign-in failed:', error.code)
    return { ok: false, error: 'Google sign-in failed. Please try again.' }
  }
}

export async function logout() {
  await signOut(auth)
}
