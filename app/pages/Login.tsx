"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { ArrowLeft, Phone, KeyRound, ChevronRight, Check, LogIn } from "lucide-react"
import { sendFirebaseOTP, cleanupRecaptcha } from "@/lib/firebase"
import { setApiKey, setUserInfo } from "@/lib/auth"

export default function Login() {
  const [step, setStep] = useState<"phone" | "otp">("phone")
  const [phone, setPhone] = useState("")
  const [otp, setOtp] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [confirmation, setConfirmation] = useState<any>(null)

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
        setApiKey(data.api_key)
        if (data.is_signup_complete) {
          setUserInfo(data.name || user.displayName || "User", data.email || "")
          window.location.href = "/chat"
        } else {
          setError("No account found. Please sign up first.")
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
              <LogIn className="h-8 w-8 text-white/60" />
            </div>
            <div className="flex items-baseline gap-1.5 justify-center mb-4">
              <span className="font-display font-black text-4xl tracking-tighter text-white">Welcome Back</span>
            </div>
            <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-white/40">
              {step === "phone" ? "Enter your phone number to login" : "Enter the OTP sent to your phone"}
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
                    autoFocus
                  />
                </div>

                <button
                  type="button"
                  onClick={handleSendOTP}
                  disabled={loading}
                  className="w-full py-4 bg-white text-black text-[10px] font-mono uppercase tracking-[0.3em] font-black hover:scale-[1.02] active:scale-[0.98] transition-all rounded-2xl shadow-xl disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? "Sending OTP..." : "Send OTP"}
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
          </AnimatePresence>

          <div className="mt-8 text-center">
            <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/30">
              Don't have an account?{" "}
              <Link href="/auth/regular-user" className="text-white/60 hover:text-white transition-colors">
                Sign Up
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
