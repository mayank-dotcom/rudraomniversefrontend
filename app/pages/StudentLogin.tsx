"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { ArrowLeft, GraduationCap, User, Phone, KeyRound, ChevronRight, Check } from "lucide-react"
import { sendFirebaseOTP, cleanupRecaptcha } from "@/lib/firebase"
import { setApiKey, setUserInfo } from "@/lib/auth"

type Step = "phone" | "otp" | "details" | "success"

export default function StudentLogin() {
  const [step, setStep] = useState<Step>("phone")
  const [phone, setPhone] = useState("")
  const [otp, setOtp] = useState("")
  const [name, setName] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [confirmation, setConfirmation] = useState<any>(null)
  const [apiKey, setApiKeyState] = useState("")

  useEffect(() => {
    return () => {
      cleanupRecaptcha("recaptcha-container")
    }
  }, [])

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
      console.error("[OTP Send Error]", e)
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
          setTimeout(() => { window.location.href = "/chat" }, 1000)
        } else {
          setStep("details")
        }
      } else {
        setError(data.message || "Verification failed")
      }
    } catch (e: any) {
      console.error("[OTP Verify Error]", e)
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
        body: JSON.stringify({ api_key: apiKey, name }),
      })
      const data = await res.json()

      if (res.ok && data.success) {
        setUserInfo(name, "")
        setStep("success")
        setTimeout(() => { window.location.href = "/chat" }, 1000)
      } else {
        setError(data.error || "Signup failed")
      }
    } catch (e: any) {
      console.error("[Signup Error]", e)
      setError(e.message || "Signup failed")
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-white selection:text-black font-sans">
      <div className="absolute inset-0 noise opacity-[0.02] pointer-events-none" />

      <div className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-black/20 backdrop-blur-2xl">
        <div className="w-full px-10 md:px-20 py-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-4">
            <div className="h-6 w-6 bg-white flex items-center justify-center">
              <div className="h-1.5 w-1.5 bg-black" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-display font-black text-lg tracking-tighter text-white">RUDRANEX</span>
              <span className="font-serif text-lg text-white/40 italic">ai</span>
            </div>
          </Link>

          <Link
            href="/auth"
            className="px-6 py-2.5 border border-white/10 text-white text-[10px] font-mono uppercase tracking-widest font-bold hover:bg-white/5 transition-all active:scale-95 flex items-center gap-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Roles
          </Link>
        </div>
      </div>

      <div className="pt-40 pb-20 px-6 md:px-20 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-12">
            <div className="h-16 w-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-6">
              <GraduationCap className="h-8 w-8 text-white/60" />
            </div>
            <div className="flex items-baseline gap-1.5 justify-center mb-4">
              <span className="font-display font-black text-4xl tracking-tighter text-white">
                {step === "details" ? "Complete Profile" : step === "success" ? "Welcome!" : "Sign Up"}
              </span>
            </div>
            <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-white/40">
              {step === "phone" && "Enter your phone number to get started"}
              {step === "otp" && "Enter the OTP sent to your phone"}
              {step === "details" && "Set up your profile to continue"}
              {step === "success" && "Redirecting to dashboard..."}
            </p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-xs font-mono text-center"
            >
              {error}
            </motion.div>
          )}

          <AnimatePresence mode="wait">
            {step === "phone" && (
              <motion.div key="phone" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <div className="relative group">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20 group-focus-within:text-white/60 transition-colors" />
                  <input
                    type="tel"
                    placeholder="+91XXXXXXXXXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendOTP()}
                    className="w-full pl-12 pr-6 py-4 text-xs font-mono tracking-widest bg-white/5 border border-white/5 rounded-2xl focus:outline-none focus:border-white/20 transition-all placeholder:text-white/20"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleSendOTP}
                  disabled={loading}
                  className="w-full py-4 bg-white text-black text-[10px] font-mono uppercase tracking-[0.3em] font-black hover:scale-[1.02] active:scale-[0.98] transition-all rounded-2xl shadow-xl disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? "Sending..." : "Verify"}
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </motion.div>
            )}

            {step === "otp" && (
              <motion.div key="otp" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <div className="relative group">
                  <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20 group-focus-within:text-white/60 transition-colors" />
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="Enter OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    onKeyDown={(e) => e.key === "Enter" && handleVerifyOTP()}
                    className="w-full pl-12 pr-6 py-4 text-xs font-mono tracking-widest bg-white/5 border border-white/5 rounded-2xl focus:outline-none focus:border-white/20 transition-all placeholder:text-white/20 text-center text-2xl tracking-[0.5em]"
                    maxLength={6}
                    autoFocus
                  />
                </div>

                <button
                  type="button"
                  onClick={handleVerifyOTP}
                  disabled={loading || otp.length < 6}
                  className="w-full py-4 bg-white text-black text-[10px] font-mono uppercase tracking-[0.3em] font-black hover:scale-[1.02] active:scale-[0.98] transition-all rounded-2xl shadow-xl disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? "Verifying..." : "Verify OTP"}
                  <Check className="h-3.5 w-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => { setStep("phone"); setOtp(""); setError("") }}
                  className="w-full text-center text-[10px] font-mono uppercase tracking-[0.3em] text-white/40 hover:text-white transition-colors"
                >
                  Change phone number
                </button>
              </motion.div>
            )}

            {step === "details" && (
              <motion.div key="details" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <form onSubmit={handleCompleteSignup} className="space-y-5">
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20 group-focus-within:text-white/60 transition-colors" />
                    <input
                      type="text"
                      placeholder="Full Name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-12 pr-6 py-4 text-xs font-mono tracking-widest bg-white/5 border border-white/5 rounded-2xl focus:outline-none focus:border-white/20 transition-all placeholder:text-white/20"
                      autoFocus
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 bg-white text-black text-[10px] font-mono uppercase tracking-[0.3em] font-black hover:scale-[1.02] active:scale-[0.98] transition-all rounded-2xl shadow-xl disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? "Setting up..." : "Create Account"}
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </form>
              </motion.div>
            )}

            {step === "success" && (
              <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  className="h-20 w-20 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center mx-auto mb-6"
                >
                  <Check className="h-10 w-10 text-green-400" />
                </motion.div>
                <p className="text-white/60 text-sm font-mono">You are being redirected</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  )
}
