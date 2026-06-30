"use client"

import { useState, useEffect, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { GithubAuthProvider, GoogleAuthProvider, signInWithPopup } from "firebase/auth"

import { getFirebaseAuth, sendFirebaseOTP, cleanupRecaptcha } from "@/lib/firebase"
import { setApiKey, setUserInfo, getApiKey } from "@/lib/auth"
import { googleLogin, githubLogin } from "@/lib/chat-api"
import { useTheme } from "@/lib/theme-context"
import { Code, Mail, GitBranch, Phone, KeyRound, Check, ChevronRight, Terminal, User, X } from "lucide-react"

type PhoneStep = "phone" | "otp" | "details" | "success"

function getEditorScheme(): string {
  if (typeof window === "undefined") return "vscode"
  return new URLSearchParams(window.location.search).get("editor") || "vscode"
}

function getExtensionId(): string | null {
  if (typeof window === "undefined") return null
  return new URLSearchParams(window.location.search).get("extension_id") || null
}

function buildRedirectUrl(key: string): string {
  const scheme = getEditorScheme()
  const extId = getExtensionId()
  if (extId) {
    return `${scheme}://${extId}/auth?key=${encodeURIComponent(key)}`
  }
  return `${scheme}://rudraomniverse.rudranex-assistant/auth?key=${encodeURIComponent(key)}`
}

function getEditorDisplayName(scheme: string): string {
  const names: Record<string, string> = {
    "vscode": "VS Code",
    "vscode-insiders": "VS Code Insiders",
    "cursor": "Cursor",
    "windsurf": "Windsurf",
    "antigravity-ide": "Antigravity IDE",
  }
  return names[scheme] || scheme.charAt(0).toUpperCase() + scheme.slice(1)
}

export default function IDELogin() {
  const { isDarkMode } = useTheme()
  const initialKey = getApiKey()
  const [loggedIn, setLoggedIn] = useState(!!initialKey)
  const editorName = useMemo(() => getEditorDisplayName(getEditorScheme()), [])

  useEffect(() => {
    if (initialKey) {
      const timer = setTimeout(() => {
        window.location.href = buildRedirectUrl(initialKey)
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [initialKey])

  const handleConnected = (key: string) => {
    setLoggedIn(true)
    setTimeout(() => {
      window.location.href = buildRedirectUrl(key)
    }, 500)
  }

  if (loggedIn) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 ${isDarkMode ? "bg-[#0a0a0a]" : "bg-white"}`}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className={`h-20 w-20 rounded-full ${isDarkMode ? "bg-indigo-500/20 border border-indigo-500/30" : "bg-indigo-100 border border-indigo-200"} flex items-center justify-center mx-auto mb-6`}
          >
            <Terminal className={`h-10 w-10 ${isDarkMode ? "text-indigo-400" : "text-indigo-600"}`} />
          </motion.div>
          <h1 className={`text-2xl font-bold mb-3 ${isDarkMode ? "text-white" : "text-black"}`}>Connecting {editorName}...</h1>
          <p className={`text-sm ${isDarkMode ? "text-white/60" : "text-black/60"}`}>
            Your Rudranex account is authenticated. Redirecting to {editorName} extension.
          </p>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ duration: 2, ease: "easeInOut" }}
            className={`h-1 rounded-full mt-6 ${isDarkMode ? "bg-indigo-500" : "bg-indigo-600"}`}
          />
        </motion.div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${isDarkMode ? "bg-[#0a0a0a]" : "bg-white"}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`relative w-full max-w-md rounded-[2rem] p-6 sm:p-8 ${isDarkMode ? "bg-[#0a0a0a] border border-white/10" : "bg-white border border-black/10"}`}
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className={`h-16 w-16 rounded-2xl ${isDarkMode ? "bg-indigo-500/10 border border-indigo-500/20" : "bg-indigo-50 border border-indigo-200"} flex items-center justify-center mx-auto mb-4`}>
            <Code className={`h-8 w-8 ${isDarkMode ? "text-indigo-400" : "text-indigo-600"}`} />
          </div>
          <h1 className={`text-2xl font-bold mb-2 ${isDarkMode ? "text-white" : "text-black"}`}>{editorName} Extension Login</h1>
          <p className={`text-xs font-mono uppercase tracking-[0.2em] ${isDarkMode ? "text-white/40" : "text-black/40"}`}>
            Sign in to connect your {editorName} extension
          </p>
        </div>

        <LoginForm onSuccess={handleConnected} isDarkMode={isDarkMode} />
      </motion.div>
    </div>
  )
}

function LoginForm({ onSuccess, isDarkMode }: { onSuccess: (key: string) => void; isDarkMode: boolean }) {
  const editorName = useMemo(() => getEditorDisplayName(getEditorScheme()), [])
  const [step, setStep] = useState<PhoneStep>("phone")
  const [phone, setPhone] = useState("")
  const [otp, setOtp] = useState("")
  const [name, setName] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [confirmation, setConfirmation] = useState<any>(null)
  const [apiKeyState, setApiKeyState] = useState("")

  useEffect(() => {
    return () => { cleanupRecaptcha("recaptcha-container-ide") }
  }, [])

  const handleGoogleLogin = async () => {
    setLoading(true); setError("")
    try {
      const provider = new GoogleAuthProvider()
      const auth = getFirebaseAuth()
      const result = await signInWithPopup(auth, provider)
      const user = result.user
      const googleProviderData = user.providerData.find((p) => p.providerId === 'google.com')
      const googleId = (googleProviderData && googleProviderData.uid) || user.uid
      const data = await googleLogin({
        google_id: googleId,
        email: user.email || "",
        name: user.displayName || "Google User",
      })
      if (data.api_key) {
        setApiKey(data.api_key)
        setUserInfo(user.displayName || "Google User", user.email || "")
        onSuccess(data.api_key)
      }
    } catch (e: any) {
      if (e?.code === 'auth/popup-closed-by-user') return
      setError(e.message || "Google sign-in failed")
    }
    setLoading(false)
  }

  const handleXLogin = async () => {
    setLoading(true); setError("")
    try {
      const extId = getExtensionId()
      const editorScheme = getEditorScheme()
      const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || '').replace(/\/api\/v1\/?$/, '')
      const params = new URLSearchParams({
        redirect_uri: `${window.location.origin}/x-connected`,
      })
      if (extId) params.set('extension_id', extId)
      if (editorScheme) params.set('editor', editorScheme)
      const res = await fetch(`${baseUrl}/api/v1/x/auth-url/public?${params.toString()}`, {
        method: 'GET',
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        setError(data.error || "Failed to get X auth URL")
      }
    } catch (e: any) {
      setError(e.message || "X sign-in failed")
    }
    setLoading(false)
  }

  const handleGithubLogin = async () => {
    setLoading(true); setError("")
    try {
      const provider = new GithubAuthProvider()
      const auth = getFirebaseAuth()
      const result = await signInWithPopup(auth, provider)
      const user = result.user
      const ghProviderData = user.providerData.find((p) => p.providerId === 'github.com')
      const githubId = (ghProviderData && ghProviderData.uid) || user.uid
      const data = await githubLogin({
        github_id: githubId,
        email: user.email || "",
        name: user.displayName || "GitHub User",
      })
      if (data.api_key) {
        setApiKey(data.api_key)
        setUserInfo(user.displayName || "GitHub User", "")
        onSuccess(data.api_key)
      }
    } catch (e: any) {
      if (e.code === "auth/popup-closed-by-user") return
      setError(e.message || "GitHub sign-in failed")
    }
    setLoading(false)
  }

  const handleSendOTP = async () => {
    const cleaned = phone.replace(/\s/g, "")
    if (!cleaned) return setError("Enter mobile number")
    if (cleaned.length < 10) return setError("Enter a valid mobile number")
    setLoading(true); setError("")
    try {
      const formattedPhone = cleaned.startsWith("+") ? cleaned : `+91${cleaned}`
      const confirmationResult = await sendFirebaseOTP(formattedPhone, "recaptcha-container-ide")
      setConfirmation(confirmationResult)
      setStep("otp")
    } catch (e: any) {
      if (e.code === "auth/invalid-phone-number") setError("Invalid phone number format")
      else if (e.code === "auth/too-many-requests") setError("Too many attempts. Please try again later.")
      else setError(e.message || "Failed to send OTP")
    }
    setLoading(false)
  }

  const handleVerifyOTP = async () => {
    if (!otp) return setError("Enter OTP")
    setLoading(true); setError("")
    try {
      const result = await confirmation.confirm(otp)
      const user = result.user
      const idToken = await user.getIdToken()
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/auth/otp/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firebase_token: idToken }),
      })
      const data = await res.json()
      if (res.ok && data.api_key) {
        setApiKeyState(data.api_key)
        setApiKey(data.api_key)
        if (data.is_signup_complete) {
          setUserInfo(data.name || user.displayName || "User", data.email || "")
          setStep("success")
          setTimeout(() => onSuccess(data.api_key), 1000)
        } else {
          setStep("details")
        }
      } else {
        setError(data.message || "Verification failed")
      }
    } catch (e: any) {
      if (e.code === "auth/invalid-verification-code") setError("Invalid OTP")
      else if (e.code === "auth/code-expired") setError("OTP expired. Request a new one.")
      else setError(e.message || "Failed to verify OTP")
    }
    setLoading(false)
  }

  const handleCompleteSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name) return setError("Enter your name")
    setLoading(true); setError("")
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/auth/register/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ api_key: apiKeyState, name }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setUserInfo(name, "")
        setStep("success")
        setTimeout(() => onSuccess(apiKeyState), 1000)
      } else {
        setError(data.error || "Signup failed")
      }
    } catch (e: any) {
      setError(e.message || "Signup failed")
    }
    setLoading(false)
  }

  if (step === "success") {
    return (
      <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="h-16 w-16 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center mx-auto mb-4"
        >
          <Check className="h-8 w-8 text-green-400" />
        </motion.div>
        <p className={`text-sm font-mono ${isDarkMode ? "text-white/60" : "text-black/60"}`}>Connected! Opening {editorName}...</p>
      </motion.div>
    )
  }

  return (
    <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-[10px] font-mono text-center`}
        >
          {error}
        </motion.div>
      )}

      {/* Social Login Buttons */}
      <div className="space-y-3 mb-6">
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full py-3.5 rounded-2xl text-[10px] font-mono uppercase tracking-[0.15em] font-bold transition-all flex items-center justify-center gap-3 disabled:opacity-50 bg-[#4285F4] text-white hover:bg-[#3367D6] border border-[#4285F4]"
        >
          <Mail className="h-4 w-4" /> Sign in with Google
        </button>
        <button
          onClick={handleGithubLogin}
          disabled={loading}
          className="w-full py-3.5 rounded-2xl text-[10px] font-mono uppercase tracking-[0.15em] font-bold transition-all flex items-center justify-center gap-3 disabled:opacity-50 bg-[#24292e] text-white hover:bg-[#1b1f23] border border-[#24292e]"
        >
          <GitBranch className="h-4 w-4" /> Sign in with GitHub
        </button>
        <button
          onClick={handleXLogin}
          disabled={loading}
          className="w-full py-3.5 rounded-2xl text-[10px] font-mono uppercase tracking-[0.15em] font-bold transition-all flex items-center justify-center gap-3 disabled:opacity-50 bg-black text-white hover:bg-[#1a1a1a] border border-white/20"
        >
          <X className="h-4 w-4" /> Sign in with X
        </button>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3 mb-6">
        <div className={`flex-1 h-[1px] ${isDarkMode ? "bg-white/10" : "bg-black/10"}`} />
        <span className={`text-[9px] font-mono uppercase tracking-[0.3em] ${isDarkMode ? "text-white/30" : "text-black/30"}`}>Or continue with phone</span>
        <div className={`flex-1 h-[1px] ${isDarkMode ? "bg-white/10" : "bg-black/10"}`} />
      </div>

      {/* Phone OTP */}
      <AnimatePresence mode="wait">
        {step === "phone" && (
          <motion.div key="phone" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            <div className="relative group">
              <Phone className={`absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 ${isDarkMode ? "text-white/20 group-focus-within:text-white/60" : "text-black/20 group-focus-within:text-black/60"} transition-colors`} />
              <input
                type="tel"
                placeholder="+91XXXXXXXXXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendOTP()}
                className={`w-full pl-12 pr-6 py-3.5 text-xs font-mono tracking-widest rounded-2xl focus:outline-none transition-all ${isDarkMode ? "bg-white/5 border border-white/5 focus:border-white/20 placeholder:text-white/20" : "bg-black/5 border border-black/5 focus:border-black/40 placeholder:text-black/40"}`}
                autoFocus
              />
            </div>
            <button
              onClick={handleSendOTP}
              disabled={loading}
              className={`w-full py-3.5 text-[10px] font-mono uppercase tracking-[0.2em] font-black hover:scale-[1.02] active:scale-[0.98] transition-all rounded-2xl shadow-xl disabled:opacity-50 flex items-center justify-center gap-2 ${isDarkMode ? "bg-white text-black" : "bg-black text-white"}`}
            >
              {loading ? "Sending..." : "Send OTP"} <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </motion.div>
        )}

        {step === "otp" && (
          <motion.div key="otp" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            <div className="relative group">
              <KeyRound className={`absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 ${isDarkMode ? "text-white/20 group-focus-within:text-white/60" : "text-black/20 group-focus-within:text-black/60"} transition-colors`} />
              <input
                type="text"
                inputMode="numeric"
                placeholder="Enter OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                onKeyDown={(e) => e.key === "Enter" && handleVerifyOTP()}
                className={`w-full pl-12 pr-6 py-3.5 text-xs font-mono tracking-widest rounded-2xl focus:outline-none transition-all text-center text-lg tracking-[0.5em] ${isDarkMode ? "bg-white/5 border border-white/5 focus:border-white/20 placeholder:text-white/20" : "bg-black/5 border border-black/5 focus:border-black/40 placeholder:text-black/40"}`}
                maxLength={6}
                autoFocus
              />
            </div>
            <button
              onClick={handleVerifyOTP}
              disabled={loading || otp.length < 6}
              className={`w-full py-3.5 text-[10px] font-mono uppercase tracking-[0.2em] font-black hover:scale-[1.02] active:scale-[0.98] transition-all rounded-2xl shadow-xl disabled:opacity-50 flex items-center justify-center gap-2 ${isDarkMode ? "bg-white text-black" : "bg-black text-white"}`}
            >
              {loading ? "Verifying..." : "Verify OTP"} <Check className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => { setStep("phone"); setOtp(""); setError("") }}
              className={`w-full text-center text-[10px] font-mono uppercase tracking-[0.3em] transition-colors ${isDarkMode ? "text-white/40 hover:text-white" : "text-black/40 hover:text-black"}`}
            >
              Change phone number
            </button>
          </motion.div>
        )}

        {step === "details" && (
          <motion.form key="details" onSubmit={handleCompleteSignup} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            <div className="relative group">
              <User className={`absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 ${isDarkMode ? "text-white/20 group-focus-within:text-white/60" : "text-black/20 group-focus-within:text-black/60"} transition-colors`} />
              <input
                type="text"
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`w-full pl-12 pr-6 py-3.5 text-xs font-mono tracking-widest rounded-2xl focus:outline-none transition-all ${isDarkMode ? "bg-white/5 border border-white/5 focus:border-white/20 placeholder:text-white/20" : "bg-black/5 border border-black/5 focus:border-black/40 placeholder:text-black/40"}`}
                autoFocus
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3.5 text-[10px] font-mono uppercase tracking-[0.2em] font-black hover:scale-[1.02] active:scale-[0.98] transition-all rounded-2xl shadow-xl disabled:opacity-50 flex items-center justify-center gap-2 ${isDarkMode ? "bg-white text-black" : "bg-black text-white"}`}
            >
              {loading ? "Setting up..." : "Create Account"} <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      <div id="recaptcha-container-ide" className="absolute opacity-0 pointer-events-none" />
    </motion.div>
  )
}


