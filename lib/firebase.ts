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
let recaptchaVerifierInstance: RecaptchaVerifier | null = null
let recaptchaWidgetId: number | null = null
let isRecaptchaEnterpriseFallbackWarningSuppressed = false
const RECAPTCHA_ENTERPRISE_FALLBACK_WARNING =
  "Failed to initialize reCAPTCHA Enterprise config. Triggering the reCAPTCHA v2 verification."

function suppressRecaptchaEnterpriseFallbackWarning() {
  if (typeof window === "undefined" || isRecaptchaEnterpriseFallbackWarningSuppressed) return

  const originalWarn = console.warn.bind(console)
  const originalError = console.error.bind(console)
  const originalLog = console.log.bind(console)
  const shouldSuppress = (message: unknown) =>
    typeof message === "string" && message.includes(RECAPTCHA_ENTERPRISE_FALLBACK_WARNING)

  console.warn = (...args: unknown[]) => {
    if (shouldSuppress(args[0])) return
    originalWarn(...args)
  }
  console.error = (...args: unknown[]) => {
    if (shouldSuppress(args[0])) return
    originalError(...args)
  }
  console.log = (...args: unknown[]) => {
    if (shouldSuppress(args[0])) return
    originalLog(...args)
  }

  isRecaptchaEnterpriseFallbackWarningSuppressed = true
}

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

export function setupRecaptcha(containerId: string): RecaptchaVerifier {
  suppressRecaptchaEnterpriseFallbackWarning()
  const auth = getFirebaseAuth()

  let container = document.getElementById(containerId)
  if (!container) {
    container = document.createElement("div")
    container.id = containerId
    document.body.appendChild(container)
  }
  container.style.position = "fixed"
  container.style.bottom = "0"
  container.style.right = "0"
  container.style.width = "256px"
  container.style.height = "80px"
  container.style.opacity = "1"
  container.style.zIndex = "9999"
  container.style.pointerEvents = "auto"

  if (!recaptchaVerifierInstance) {
    recaptchaVerifierInstance = new RecaptchaVerifier(auth, containerId, {
      size: "normal",
      callback: () => {},
      "expired-callback": () => {
        console.warn("[reCAPTCHA] Token expired")
      },
    })
  }
  return recaptchaVerifierInstance
}

async function resetRecaptcha(verifier: RecaptchaVerifier) {
  try {
    const widgetId = recaptchaWidgetId ?? (await verifier.render())
    recaptchaWidgetId = widgetId
    if ((window as any).grecaptcha?.reset) {
      ;(window as any).grecaptcha.reset(widgetId)
    }
  } catch {
    console.warn("[reCAPTCHA] Reset failed")
  }
}

export function cleanupRecaptcha(containerId: string) {
  const el = document.getElementById(containerId)
  if (el) {
    el.style.opacity = "0"
    el.style.pointerEvents = "none"
  }
}

export async function sendFirebaseOTP(phoneNumber: string, containerId: string): Promise<ConfirmationResult> {
  const auth = getFirebaseAuth()
  const verifier = setupRecaptcha(containerId)
  recaptchaWidgetId = await verifier.render()
  try {
    const confirmation = await signInWithPhoneNumber(auth, phoneNumber, verifier)
    return confirmation
  } catch (error) {
    await resetRecaptcha(verifier)
    throw error
  }
}
