// client/src/firebase.js
// Initializes the Firebase client SDK, used only for Phone Number
// (SMS OTP) authentication on the "Forgot Password" flow. We don't use
// any other Firebase product here — MongoDB + our own Express/JWT setup
// stays exactly as it is for everything else.
//
// IMPORTANT: This is intentionally LAZY. Nothing in this file runs at
// import time. If we initialized Firebase as soon as this module was
// imported, a missing/incomplete client/.env (VITE_FIREBASE_*) would
// throw during the very first render and take down the ENTIRE app with
// a blank white page — not just the Forgot Password page. Instead,
// `getFirebaseAuth()` is only called when the user actually opens the
// Forgot Password flow, and any failure is caught there and shown as a
// normal on-page error message.

import { initializeApp, getApps } from 'firebase/app'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

// True only if every required env var was actually set in client/.env.
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId && firebaseConfig.appId
)

let cachedAuth = null

/**
 * Lazily creates (once) and returns the Firebase Auth instance.
 * Throws a clear, catchable error if the required env vars are missing,
 * instead of crashing at module-import time.
 */
export function getFirebaseAuth() {
  if (cachedAuth) return cachedAuth

  if (!isFirebaseConfigured) {
    throw new Error(
      'Firebase is not configured yet. Add VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, ' +
        'VITE_FIREBASE_PROJECT_ID and VITE_FIREBASE_APP_ID to client/.env, then restart the dev server.'
    )
  }

  const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig)
  cachedAuth = getAuth(app)
  return cachedAuth
}
