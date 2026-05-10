import { initializeApp, getApps, FirebaseApp } from "firebase/app"
import { getAuth, Auth, RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from "firebase/auth"

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

let app: FirebaseApp | undefined
let auth: Auth | undefined

export function getFirebaseApp(): FirebaseApp {
  if (!app) {
    if (getApps().length === 0) {
      app = initializeApp(firebaseConfig)
    } else {
      app = getApps()[0]
    }
  }
  return app
}

export function getFirebaseAuth(): Auth {
  if (!auth) {
    auth = getAuth(getFirebaseApp())
  }
  return auth
}

function ensureContainer(containerId: string): HTMLElement {
  let container = document.getElementById(containerId)
  if (!container) {
    container = document.createElement("div")
    container.id = containerId
    container.style.position = "fixed"
    container.style.bottom = "0"
    container.style.right = "0"
    container.style.width = "256px"
    container.style.height = "80px"
    container.style.zIndex = "9999"
    document.body.appendChild(container)
  }
  return container
}

export async function sendFirebaseOTP(phoneNumber: string, containerId: string): Promise<ConfirmationResult> {
  const authInstance = getFirebaseAuth()
  ensureContainer(containerId)

  const verifier = new RecaptchaVerifier(authInstance, containerId, {
    size: "invisible",
    callback: () => {},
  })

  try {
    const confirmation = await signInWithPhoneNumber(authInstance, phoneNumber, verifier)
    return confirmation
  } catch (error) {
    try { verifier.clear() } catch {}
    throw error
  }
}

export function cleanupRecaptcha(containerId: string) {
  const el = document.getElementById(containerId)
  if (el) {
    el.style.opacity = "0"
    el.style.pointerEvents = "none"
  }
}
