// Auth store for CommonGoal (BR C.1, C.2).

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

// Firebase checks who is signed in a moment after the app loads. The router
// guard waits for this, or it wrongly redirects a signed-in user to login on every refresh.
let resolveAuthReady
export const authReady = new Promise((resolve) => {
  resolveAuthReady = resolve
})

// uid whose profile is already loaded, so a slow first read cannot wipe a profile that
// loginWithGoogle has just created for the same user.
let profileUid = null

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

// Same message for every login failure, so nobody can tell which emails have accounts.
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

// External sign-in with a Google account (BR D.1). Google checks the password and 2-step
// verification, the app never sees it. The first time someone signs in this way they get a
// users/{uid} profile as a member, exactly like email registration, so the same Firestore
// rules apply (nobody can sign up as an admin).
export async function loginWithGoogle() {
  try {
    const provider = new GoogleAuthProvider()
    provider.setCustomParameters({ prompt: 'select_account' })
    const { user } = await signInWithPopup(auth, provider)

    const profileRef = doc(db, 'users', user.uid)
    const snap = await getDoc(profileRef)
    if (snap.exists()) {
      userProfile.value = snap.data()
    } else {
      const profile = {
        email: user.email,
        fullName: sanitiseText(user.displayName || user.email.split('@')[0], 80),
        role: 'member',
        createdAt: serverTimestamp(),
      }
      await setDoc(profileRef, profile)
      userProfile.value = { ...profile, createdAt: new Date() }
    }
    profileUid = user.uid
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
