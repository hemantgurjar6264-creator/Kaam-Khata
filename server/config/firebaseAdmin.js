// server/config/firebaseAdmin.js
// Initializes the Firebase Admin SDK so the backend can verify the
// Firebase ID token that the client gets after a user confirms an
// SMS OTP with Firebase Phone Auth.
//
// We never use Firebase to *send* the OTP from the server — Firebase
// Phone Auth is designed so the OTP is sent from the browser (client
// SDK) using an invisible reCAPTCHA. The server's only job is to
// verify the resulting ID token and read the phone number out of it.

import admin from 'firebase-admin'

let initialized = false

function getPrivateKey() {
  const raw = process.env.FIREBASE_PRIVATE_KEY || ''
  // .env files can't hold real newlines, so the key is stored with
  // literal "\n" sequences — convert them back to real newlines.
  return raw.replace(/\\n/g, '\n')
}

export function initFirebaseAdmin() {
  if (initialized) return admin

  const projectId = process.env.FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  const privateKey = getPrivateKey()

  if (!projectId || !clientEmail || !privateKey) {
    console.warn(
      '⚠️  Firebase Admin not configured — FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / ' +
        'FIREBASE_PRIVATE_KEY are missing from server/.env. OTP-based password reset will fail ' +
        'until these are set (see server/.env.example).'
    )
    return admin
  }

  admin.initializeApp({
    credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
  })

  initialized = true
  return admin
}

export default admin
