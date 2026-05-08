"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { ArrowLeft, User, Lock, Eye, EyeOff, LogIn, ChevronRight } from "lucide-react"
import { setApiKey, setUserInfo } from "@/lib/auth"

export default function Login() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username) return setError("Enter username")
    if (!password) return setError("Enter password")

    setLoading(true)
    setError("")

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      })
      const data = await res.json()

      if (res.ok && data.api_key) {
        setApiKey(data.api_key)
        setUserInfo(data.name || username, data.email || "")
        window.location.href = "/chat"
      } else {
        setError(data.error || "Login failed")
      }
    } catch (e: any) {
      setError(e.message || "Login failed")
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
              Enter your credentials to continue
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

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="relative group">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20 group-focus-within:text-white/60 transition-colors" />
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-12 pr-6 py-4 text-xs font-mono tracking-widest bg-white/5 border border-white/5 rounded-2xl focus:outline-none focus:border-white/20 transition-all placeholder:text-white/20"
                autoFocus
              />
            </div>

            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20 group-focus-within:text-white/60 transition-colors" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-12 py-4 text-xs font-mono tracking-widest bg-white/5 border border-white/5 rounded-2xl focus:outline-none focus:border-white/20 transition-all placeholder:text-white/20"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/60 transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-white text-black text-[10px] font-mono uppercase tracking-[0.3em] font-black hover:scale-[1.02] active:scale-[0.98] transition-all rounded-2xl shadow-xl disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? "Logging in..." : "Login"}
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/30">
              Don't have an account?{" "}
              <Link href="/regular-user" className="text-white/60 hover:text-white transition-colors">
                Sign Up
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
