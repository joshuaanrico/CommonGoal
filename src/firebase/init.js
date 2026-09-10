// Firebase initialisation for CommonGoal.
//
// Config is read from environment variables, not hard coded. The real values live in
// .env.local, which is gitignored. See .env.example for the shape and the README for
// setup steps.
//
// A note on the API key, because it looks like a secret and is not one: a Firebase web
// API key identifies the project, it does not authorise anything. It ships in the client
// bundle by design. What actually protects the data is firestore.rules plus the
// authorised domain list in the Firebase console.
// Reference: https://firebase.google.com/docs/projects/api-keys

import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

// Fail loudly during development rather than letting Firebase throw a vague error later.
if (!firebaseConfig.apiKey) {
  console.error(
    'Firebase config is missing. Create assignment/commongoal/.env.local from .env.example, then restart the dev server.',
  )
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
