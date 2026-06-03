"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Phone, Mail, GitBranch, KeyRound, Check, ChevronRight, User, GraduationCap } from "lucide-react"
import { GithubAuthProvider, GoogleAuthProvider, signInWithPopup } from "firebase/auth"
import { getFirebaseAuth, sendFirebaseOTP, cleanupRecaptcha } from "@/lib/firebase"
import { setApiKey, setUserInfo, setSchoolName, setUserRole } from "@/lib/auth"
import { googleLogin, githubLogin, studentLogin } from "@/lib/chat-api"
import { useTheme } from "@/lib/theme-context"

interface AuthModalProps {
  open: boolean
  onClose: () => void
}

type AuthTab = "user" | "student"
type PhoneStep = "phone" | "otp" | "details" | "success"

export default function AuthModal({ open, onClose }: AuthModalProps) {
  const [tab, setTab] = useState<AuthTab>("user")

  const handleClose = () => {
    onClose()
  }

  const { isDarkMode } = useTheme()

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={`fixed inset-0 z-[300] flex items-center justify-center p-4 backdrop-blur-sm ${isDarkMode ? "bg-black/60" : "bg-white/60"}`}
          onClick={(e) => { if (e.target === e.currentTarget) handleClose() }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className={`relative w-full max-w-md max-h-[92vh] overflow-y-auto ${isDarkMode ? "bg-[#0a0a0a] border border-white/10 custom-scrollbar" : "bg-white border border-black/10 light-scrollbar"} rounded-[2rem] p-6 sm:p-8`}
          >
            {/* Close */}
            <button
              onClick={handleClose}
              className={`absolute top-4 right-4 p-2 rounded-xl ${isDarkMode ? "text-white/40 hover:text-white hover:bg-white/5" : "text-black/40 hover:text-black hover:bg-black/5"} transition-all`}
            >
              <X className="h-4 w-4" />
            </button>

            {/* Header */}
            <div className="text-center mb-8">
              <div className={`h-14 w-14 rounded-2xl ${isDarkMode ? "bg-white/5 border border-white/10" : "bg-black/5 border border-black/10"} flex items-center justify-center mx-auto mb-4 overflow-hidden p-2`}>
                <img
                  src={isDarkMode ? "/dark.png" : "/light.png"}
                  alt="Logo"
                  className="h-full w-full object-contain transition-transform duration-300"
                  style={{ transform: isDarkMode ? "scale(1.5)" : "none" }}
                />
              </div>
              <h2 className={`font-display font-black text-2xl tracking-tight ${isDarkMode ? "text-white" : "text-black"}`}>Get Started</h2>
              <p className={`text-[10px] font-mono uppercase tracking-[0.3em] ${isDarkMode ? "text-white/40" : "text-black/40"} mt-2`}>Sign in to Rudranex AI</p>
            </div>

            {/* Tab Toggle: User / Student */}
            <div className={`flex mb-6 ${isDarkMode ? "bg-white/5 border border-white/5" : "bg-black/5 border border-black/5"} rounded-2xl p-1`}>
              <button
                onClick={() => setTab("user")}
                className={`flex-1 py-2.5 text-[10px] font-mono uppercase tracking-[0.2em] font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
                  tab === "user"
                    ? "bg-white text-black shadow-lg"
                    : isDarkMode
                      ? "text-white/40 hover:text-white/60"
                      : "text-black/40 hover:text-black/60"
                }`}
              >
                <User className="h-3.5 w-3.5" /> Regular User
              </button>
              <button
                onClick={() => setTab("student")}
                className={`flex-1 py-2.5 text-[10px] font-mono uppercase tracking-[0.2em] font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
                  tab === "student"
                    ? "bg-white text-black shadow-lg"
                    : isDarkMode
                      ? "text-white/40 hover:text-white/60"
                      : "text-black/40 hover:text-black/60"
                }`}
              >
                <GraduationCap className="h-3.5 w-3.5" /> Student
              </button>
            </div>

            <AnimatePresence mode="wait">
              {tab === "user" ? (
                <RegularUserAuth key="user" onSuccess={handleClose} isDarkMode={isDarkMode} />
              ) : (
                <StudentAuth
                  key="student"
                  onSuccess={handleClose}
                  isDarkMode={isDarkMode}
                />
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function RegularUserAuth({ onSuccess, isDarkMode }: { onSuccess: () => void; isDarkMode: boolean }) {
  const [step, setStep] = useState<PhoneStep>("phone")
  const [phone, setPhone] = useState("")
  const [otp, setOtp] = useState("")
  const [name, setName] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [confirmation, setConfirmation] = useState<any>(null)
  const [apiKeyState, setApiKeyState] = useState("")

  useEffect(() => {
    return () => { cleanupRecaptcha("recaptcha-container") }
  }, [])

  const handleGoogleLogin = async () => {
    setLoading(true)
    setError("")
    try {
      // Firebase Google sign-in via popup
      const provider = new GoogleAuthProvider()
      const auth = getFirebaseAuth()
      const result = await signInWithPopup(auth, provider)
      const user = result.user

      // Prefer provider UID for Google if available, else fallback to Firebase UID
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
        onSuccess()
        window.location.href = "/chat"
      }
    } catch (e: any) {
      if (e?.code === 'auth/popup-closed-by-user') return
      setError(e.message || "Google sign-in failed")
    }
    setLoading(false)
  }

  const handleGithubLogin = async () => {
    setLoading(true)
    setError("")
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
        onSuccess()
        window.location.href = "/chat"
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
    setLoading(true)
    setError("")
    try {
      const formattedPhone = cleaned.startsWith("+") ? cleaned : `+91${cleaned}`
      const confirmationResult = await sendFirebaseOTP(formattedPhone, "recaptcha-container")
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
    setLoading(true)
    setError("")
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
          setTimeout(() => { onSuccess(); window.location.href = "/chat" }, 1000)
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
    setLoading(true)
    setError("")
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
        setTimeout(() => { onSuccess(); window.location.href = "/chat" }, 1000)
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
        <p className={`text-sm font-mono ${isDarkMode ? "text-white/60" : "text-black/60"}`}>Redirecting...</p>
      </motion.div>
    )
  }

  return (
    <motion.div key="user" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-[10px] font-mono text-center"
        >
          {error}
        </motion.div>
      )}

      <AnimatePresence>
        {!phone.trim() && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
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
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3 mb-6">
              <div className={`flex-1 h-[1px] ${isDarkMode ? "bg-white/10" : "bg-black/10"}`} />
              <span className={`text-[9px] font-mono uppercase tracking-[0.3em] ${isDarkMode ? "text-white/30" : "text-black/30"}`}>Or continue with phone</span>
              <div className={`flex-1 h-[1px] ${isDarkMode ? "bg-white/10" : "bg-black/10"}`} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Phone OTP */}
      {step === "phone" && (
        <div className="space-y-4">
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
        </div>
      )}

      {step === "otp" && (
        <div className="space-y-4">
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
        </div>
      )}

      {step === "details" && (
        <form onSubmit={handleCompleteSignup} className="space-y-4">
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
        </form>
      )}

      <div id="recaptcha-container" className="absolute opacity-0 pointer-events-none" />
    </motion.div>
  )
}

function StudentAuth({ onSuccess, isDarkMode }: { onSuccess: () => void; isDarkMode: boolean }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const [loginRollNo, setLoginRollNo] = useState("")
  const [loginSchoolCode, setLoginSchoolCode] = useState("")
  const [loginPassword, setLoginPassword] = useState("")

  const [success, setSuccess] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!loginRollNo || !loginSchoolCode || !loginPassword) {
      return setError("All fields are required")
    }
    setLoading(true)
    setError("")
    try {
      const data = await studentLogin({
        roll_no: loginRollNo,
        school_code: loginSchoolCode,
        password: loginPassword,
      })
      if (data.api_key) {
        setApiKey(data.api_key)
        setUserInfo(data.name || "Student", "")
        if (data.school_name) setSchoolName(data.school_name)
        if (data.role) setUserRole(data.role)
        setSuccess(true)
        setTimeout(() => { onSuccess(); window.location.href = "/chat" }, 1000)
      }
    } catch (e: any) {
      setError(e.message || "Login failed")
    }
    setLoading(false)
  }

  if (success) {
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
        <p className={`text-sm font-mono ${isDarkMode ? "text-white/60" : "text-black/60"}`}>Redirecting...</p>
      </motion.div>
    )
  }

  return (
    <motion.div key="student" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-[10px] font-mono text-center"
        >
          {error}
        </motion.div>
      )}

      <form onSubmit={handleLogin} className="space-y-4">
        <div className="relative group">
          <User className={`absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 ${isDarkMode ? "text-white/20 group-focus-within:text-white/60" : "text-black/20 group-focus-within:text-black/60"} transition-colors`} />
          <input
            type="text"
            placeholder="Roll No"
            value={loginRollNo}
            onChange={(e) => setLoginRollNo(e.target.value)}
            className={`w-full pl-12 pr-6 py-3.5 text-xs font-mono tracking-widest rounded-2xl focus:outline-none transition-all ${isDarkMode ? "bg-white/5 border border-white/5 focus:border-white/20 placeholder:text-white/20" : "bg-black/5 border border-black/5 focus:border-black/40 placeholder:text-black/40"}`}
            autoFocus
          />
        </div>
        <div className="relative group">
          <GraduationCap className={`absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 ${isDarkMode ? "text-white/20 group-focus-within:text-white/60" : "text-black/20 group-focus-within:text-black/60"} transition-colors`} />
          <input
            type="text"
            placeholder="School Code"
            value={loginSchoolCode}
            onChange={(e) => setLoginSchoolCode(e.target.value.toUpperCase())}
            className={`w-full pl-12 pr-6 py-3.5 text-xs font-mono tracking-widest rounded-2xl focus:outline-none transition-all ${isDarkMode ? "bg-white/5 border border-white/5 focus:border-white/20 placeholder:text-white/20" : "bg-black/5 border border-black/5 focus:border-black/40 placeholder:text-black/40"}`}
          />
        </div>
        <div className="relative group">
          <KeyRound className={`absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 ${isDarkMode ? "text-white/20 group-focus-within:text-white/60" : "text-black/20 group-focus-within:text-black/60"} transition-colors`} />
          <input
            type="password"
            placeholder="Password"
            value={loginPassword}
            onChange={(e) => setLoginPassword(e.target.value)}
            className={`w-full pl-12 pr-6 py-3.5 text-xs font-mono tracking-widest rounded-2xl focus:outline-none transition-all ${isDarkMode ? "bg-white/5 border border-white/5 focus:border-white/20 placeholder:text-white/20" : "bg-black/5 border border-black/5 focus:border-black/40 placeholder:text-black/40"}`}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className={`w-full py-3.5 text-[10px] font-mono uppercase tracking-[0.2em] font-black hover:scale-[1.02] active:scale-[0.98] transition-all rounded-2xl shadow-xl disabled:opacity-50 flex items-center justify-center gap-2 ${isDarkMode ? "bg-white text-black" : "bg-black text-white"}`}
        >
          {loading ? "Signing in..." : "Sign In"} <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </form>
    </motion.div>
  )
}
