"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { LogIn, UserPlus, Mail, Lock, User, X, Loader2, ArrowRight } from "lucide-react"
import { register, login, setApiKey, setUserInfo } from "@/lib/auth"
import { useRouter } from "next/navigation"

interface AuthCardProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  initialMode?: "login" | "signup"
}

const AuthCard = ({ isOpen, onClose, onSuccess, initialMode = "login" }: AuthCardProps) => {
  const [mode, setMode] = useState<"login" | "signup">(initialMode)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setLoading(true)

    try {
      if (mode === "signup") {
        const res = await register(name, email, password)
        if (res.success) {
          setApiKey(res.api_key)
          setUserInfo(name, email)
          setSuccess(res.message)
          setTimeout(() => {
            onClose()
            onSuccess?.()
            router.push("/chat")
          }, 1000)
        } else {
          setError(res.error || "Registration failed")
        }
      } else {
        const res = await login(email, password)
        if (res.success) {
          setApiKey(res.api_key)
          // Store email always, use name from response or email as fallback
          const displayName = res.name || email.split('@')[0] || "User"
          setUserInfo(displayName, email)
          setSuccess(res.message)
          setTimeout(() => {
            onClose()
            onSuccess?.()
            router.push("/chat")
          }, 1000)
        } else {
          setError(res.error || "Login failed")
        }
      }
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

          {/* Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-md bg-[#0a0a0a] border border-white/5 rounded-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="px-8 pt-8 pb-6 border-b border-white/5">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-baseline gap-1.5">
                  <span className="font-display font-black text-2xl tracking-tighter text-white">
                    RUDRANEX
                  </span>
                  <span className="font-serif text-2xl text-white/40 italic">ai</span>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                >
                  <X className="h-4 w-4 text-white/40" />
                </button>
              </div>

              {/* Mode Toggle */}
              <div className="flex gap-1 p-1 bg-white/[0.03] rounded-lg">
                <button
                  onClick={() => { setMode("login"); setError(""); setSuccess("") }}
                  className={`flex-1 py-2.5 text-[10px] font-mono uppercase tracking-[0.2em] rounded-md transition-all duration-300 ${
                    mode === "login"
                      ? "bg-white text-black"
                      : "text-white/40 hover:text-white"
                  }`}
                >
                  <LogIn className="inline h-3.5 w-3.5 mr-2" />
                  Login
                </button>
                <button
                  onClick={() => { setMode("signup"); setError(""); setSuccess("") }}
                  className={`flex-1 py-2.5 text-[10px] font-mono uppercase tracking-[0.2em] rounded-md transition-all duration-300 ${
                    mode === "signup"
                      ? "bg-white text-black"
                      : "text-white/40 hover:text-white"
                  }`}
                >
                  <UserPlus className="inline h-3.5 w-3.5 mr-2" />
                  Sign Up
                </button>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-8 space-y-5">
              {mode === "signup" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <label className="block text-[10px] font-mono uppercase tracking-[0.2em] text-white/40 mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Doe"
                      className="w-full pl-10 pr-4 py-3 bg-white/[0.03] border border-white/5 rounded-lg text-white text-sm font-mono placeholder:text-white/20 focus:outline-none focus:border-white/20 transition-colors"
                    />
                  </div>
                </motion.div>
              )}

              <div>
                <label className="block text-[10px] font-mono uppercase tracking-[0.2em] text-white/40 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@university.edu"
                    required
                    className="w-full pl-10 pr-4 py-3 bg-white/[0.03] border border-white/5 rounded-lg text-white text-sm font-mono placeholder:text-white/20 focus:outline-none focus:border-white/20 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase tracking-[0.2em] text-white/40 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className="w-full pl-10 pr-4 py-3 bg-white/[0.03] border border-white/5 rounded-lg text-white text-sm font-mono placeholder:text-white/20 focus:outline-none focus:border-white/20 transition-colors"
                  />
                </div>
              </div>

              {/* Error/Success Messages */}
              {error && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-red-400 text-[11px] font-mono text-center"
                >
                  {error}
                </motion.p>
              )}
              {success && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-green-400 text-[11px] font-mono text-center"
                >
                  {success}
                </motion.p>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-white text-black text-[10px] font-mono uppercase tracking-[0.2em] font-bold hover:bg-white/90 transition-all active:scale-[0.98] rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    {mode === "signup" ? "Create Account" : "Sign In"}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </>
                )}
              </button>

              {/* Footer */}
              <p className="text-center text-[10px] font-mono text-white/30 mt-4">
                {mode === "signup" ? "Already have an account?" : "Don't have an account?"}{" "}
                <button
                  type="button"
                  onClick={() => { setMode(mode === "signup" ? "login" : "signup"); setError(""); setSuccess("") }}
                  className="text-white/60 hover:text-white underline underline-offset-4 transition-colors"
                >
                  {mode === "signup" ? "Sign In" : "Sign Up"}
                </button>
              </p>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default AuthCard
