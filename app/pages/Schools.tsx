"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Navbar from "@/components/ui/Navbar"
import Footer from "@/components/ui/Footer"
import { Building2, GraduationCap, Users, CheckCircle, ArrowRight, Sparkles, Send, ArrowLeft } from "lucide-react"
import { useTheme } from "@/lib/theme-context"

const API_BASE = process.env.NEXT_PUBLIC_BASE_URL!

export default function Schools() {
  const { isDarkMode } = useTheme()
  const [schoolName, setSchoolName] = useState("")
  const [adminName, setAdminName] = useState("")
  const [adminEmail, setAdminEmail] = useState("")
  const [adminPassword, setAdminPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      const res = await fetch(`${API_BASE}/request/admin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          school_name: schoolName.trim(),
          admin_name: adminName.trim(),
          admin_email: adminEmail.trim(),
          admin_password: adminPassword,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit request")
      }
      setSuccess(true)
    } catch (e: any) {
      setError(e.message || "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? "bg-[#0a0a0a] text-white" : "bg-white text-black"} selection:bg-white selection:text-black overflow-x-hidden`}>
      <div className="absolute inset-0 noise opacity-[0.02] pointer-events-none" />

      {/* Background Effects */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-emerald-500/5 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-blue-500/5 blur-[120px] rounded-full pointer-events-none" />

      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-40 pb-20 px-6 md:px-20">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="text-center mb-20"
          >
            <div className="flex items-center justify-center gap-2 mb-6">
              <Sparkles className="h-4 w-4 text-emerald-400" />
              <span className="text-[9px] font-mono uppercase tracking-[0.4em] text-white/40">School Onboarding</span>
              <Sparkles className="h-4 w-4 text-emerald-400" />
            </div>
            <h1 className="flex flex-col items-center leading-[0.85] tracking-[-0.04em] select-none">
              <span className={`text-[5rem] md:text-[10rem] font-black font-display ${isDarkMode ? "text-white" : "text-black"}`}>
                BRING YOUR
              </span>
              <span className={`text-[5rem] md:text-[10rem] font-black font-display -mt-6 md:-mt-10 ${isDarkMode ? "text-white/10" : "text-black/10"}`}>
                SCHOOL TO
              </span>
              <span className="flex items-baseline gap-4 -mt-6 md:-mt-10">
                <span className={`text-[6rem] md:text-[12rem] font-black font-display ${isDarkMode ? "text-white" : "text-black"}`}>RU
                  <span className={isDarkMode ? "text-white" : "text-white [-webkit-text-stroke:2px_black]"}>DRA</span>
                </span>
                <span className={`text-[3rem] md:text-[6rem] font-serif italic ${isDarkMode ? "text-white/80" : "text-black/80"} -ml-2`}>nex</span>
              </span>
            </h1>
            <p className={`text-sm md:text-base max-w-2xl mx-auto mt-8 leading-relaxed ${isDarkMode ? "text-white/50" : "text-black/50"}`}>
              Empower your institution with AI-powered learning. From personalized tutoring to automated assessments — bring the future of education to your classrooms.
            </p>
          </motion.div>

          {/* Features Grid */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20"
          >
            {[
              {
                icon: GraduationCap,
                title: "AI Tutoring",
                desc: "Personalized learning paths for every student powered by advanced AI models.",
                color: "emerald",
              },
              {
                icon: Users,
                title: "Admin Dashboard",
                desc: "Full control over faculty, students, and curriculum with real-time analytics.",
                color: "blue",
              },
              {
                icon: Building2,
                title: "Institution Branding",
                desc: "Custom onboarding with your school code, faculty management, and student roll numbers.",
                color: "purple",
              },
            ].map((feature, i) => (
              <div
                key={i}
                className={`relative border rounded-[2.5rem] p-10 overflow-hidden group transition-all duration-500 hover:scale-[1.02] ${
                  isDarkMode
                    ? "border-white/5 bg-gradient-to-br from-white/[0.04] to-transparent hover:from-white/[0.08]"
                    : "border-black bg-gradient-to-br from-black/[0.02] to-transparent hover:from-black/[0.04]"
                }`}
              >
                <div className="absolute inset-0 bg-[linear-gradient(110deg,transparent_0%,rgba(255,255,255,0.03)_45%,rgba(255,255,255,0.06)_50%,rgba(255,255,255,0.03)_55%,transparent_100%)] pointer-events-none" />
                <div className="absolute inset-0 -translate-y-full group-hover:translate-y-full transition-transform duration-1000 bg-gradient-to-b from-transparent via-white/5 to-transparent pointer-events-none" />
                <feature.icon className={`h-8 w-8 mb-6 ${isDarkMode ? "text-white/40" : "text-black"} group-hover:scale-110 transition-transform duration-500`} />
                <h3 className={`text-xl font-display font-black mb-3 ${isDarkMode ? "text-white" : "text-black"}`}>{feature.title}</h3>
                <p className={`text-xs leading-relaxed ${isDarkMode ? "text-white/40" : "text-black"}`}>{feature.desc}</p>
              </div>
            ))}
          </motion.div>

          {/* Request Form */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="max-w-2xl mx-auto"
          >
            <AnimatePresence mode="wait">
              {success ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`relative border rounded-[3rem] p-14 text-center overflow-hidden ${
                    isDarkMode
                      ? "border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-transparent"
                      : "border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-transparent"
                  }`}
                >
                  <div className="absolute inset-0 bg-[linear-gradient(110deg,transparent_0%,rgba(255,255,255,0.03)_45%,rgba(255,255,255,0.06)_50%,rgba(255,255,255,0.03)_55%,transparent_100%)] pointer-events-none" />
                  <div className="h-20 w-20 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="h-10 w-10 text-emerald-400" />
                  </div>
                  <h2 className={`text-3xl font-display font-black mb-4 ${isDarkMode ? "text-white" : "text-black"}`}>Request Submitted</h2>
                  <p className={`text-sm max-w-md mx-auto leading-relaxed ${isDarkMode ? "text-white/50" : "text-black/50"}`}>
                    Your school onboarding request has been received. Our team will review it and reach out to <span className="font-bold text-emerald-400">{adminEmail}</span> with next steps.
                  </p>
                  <div className="flex items-center justify-center gap-6 mt-10">
                    <a
                      href="/"
                      className={`px-8 py-4 bg-white text-black text-[10px] font-mono uppercase tracking-[0.2em] font-black rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-3`}
                    >
                      <ArrowLeft className="h-3.5 w-3.5" /> Back Home
                    </a>
                    <button
                      onClick={() => { setSuccess(false); setSchoolName(""); setAdminName(""); setAdminEmail(""); setAdminPassword("") }}
                      className={`px-8 py-4 border text-[10px] font-mono uppercase tracking-[0.2em] font-bold rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-3 ${
                        isDarkMode ? "border-white/10 text-white hover:bg-white/5" : "border-black/10 text-black hover:bg-black/5"
                      }`}
                    >
                      <Send className="h-3.5 w-3.5" /> Submit Another
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="form"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`relative border rounded-[3rem] p-10 md:p-14 overflow-hidden ${
                    isDarkMode
                      ? "border-white/5 bg-gradient-to-br from-white/[0.04] to-transparent"
                      : "border-black bg-gradient-to-br from-black/[0.02] to-transparent"
                  }`}
                >
                  <div className="absolute inset-0 bg-[linear-gradient(110deg,transparent_0%,rgba(255,255,255,0.03)_45%,rgba(255,255,255,0.06)_50%,rgba(255,255,255,0.03)_55%,transparent_100%)] pointer-events-none" />
                  <div className="absolute -top-20 -right-20 w-40 h-40 bg-emerald-500/10 blur-[80px] rounded-full" />

                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-2">
                      <Send className="h-5 w-5 text-emerald-400" />
                      <h2 className={`text-2xl font-display font-black tracking-tight ${isDarkMode ? "text-white" : "text-black"}`}>Request School Onboarding</h2>
                    </div>
                    <p className={`text-xs mb-10 max-w-lg ${isDarkMode ? "text-white/40" : "text-black"}`}>
                      Fill in the details below and our team will review your request to bring your school onto the Rudranex AI platform.
                    </p>

                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-xs font-mono text-center"
                      >
                        {error}
                      </motion.div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="relative group">
                        <Building2 className={`absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors ${isDarkMode ? "text-white/20 group-focus-within:text-emerald-400" : "text-black/20 group-focus-within:text-emerald-500"}`} />
                        <input
                          type="text"
                          placeholder="School Name"
                          value={schoolName}
                          onChange={(e) => setSchoolName(e.target.value)}
                          required
                          className={`w-full pl-12 pr-6 py-4 text-xs font-mono tracking-widest border rounded-2xl focus:outline-none focus:border-emerald-500/50 transition-all ${
                            isDarkMode ? "bg-white/5 border-white/5 text-white placeholder:text-white/20" : "bg-black/5 border-black text-black placeholder:text-black/60"
                          }`}
                        />
                      </div>
                      <div className="relative group">
                        <Users className={`absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors ${isDarkMode ? "text-white/20 group-focus-within:text-emerald-400" : "text-black/20 group-focus-within:text-emerald-500"}`} />
                        <input
                          type="text"
                          placeholder="Your Name"
                          value={adminName}
                          onChange={(e) => setAdminName(e.target.value)}
                          required
                          className={`w-full pl-12 pr-6 py-4 text-xs font-mono tracking-widest border rounded-2xl focus:outline-none focus:border-emerald-500/50 transition-all ${
                            isDarkMode ? "bg-white/5 border-white/5 text-white placeholder:text-white/20" : "bg-black/5 border-black text-black placeholder:text-black/60"
                          }`}
                        />
                      </div>
                      <div className="relative group">
                        <svg className={`absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors ${isDarkMode ? "text-white/20 group-focus-within:text-emerald-400" : "text-black/20 group-focus-within:text-emerald-500"}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="2" y="4" width="20" height="16" rx="2" />
                          <path d="M22 7l-10 7L2 7" />
                        </svg>
                        <input
                          type="email"
                          placeholder="Email Address"
                          value={adminEmail}
                          onChange={(e) => setAdminEmail(e.target.value)}
                          required
                          className={`w-full pl-12 pr-6 py-4 text-xs font-mono tracking-widest border rounded-2xl focus:outline-none focus:border-emerald-500/50 transition-all ${
                            isDarkMode ? "bg-white/5 border-white/5 text-white placeholder:text-white/20" : "bg-black/5 border-black text-black placeholder:text-black/60"
                          }`}
                        />
                      </div>
                      <div className="relative group">
                        <svg className={`absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors ${isDarkMode ? "text-white/20 group-focus-within:text-emerald-400" : "text-black/20 group-focus-within:text-emerald-500"}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                          <path d="M7 11V7a5 5 0 0110 0v4" />
                        </svg>
                        <input
                          type="password"
                          placeholder="Password"
                          value={adminPassword}
                          onChange={(e) => setAdminPassword(e.target.value)}
                          required
                          minLength={6}
                          className={`w-full pl-12 pr-6 py-4 text-xs font-mono tracking-widest border rounded-2xl focus:outline-none focus:border-emerald-500/50 transition-all ${
                            isDarkMode ? "bg-white/5 border-white/5 text-white placeholder:text-white/20" : "bg-black/5 border-black text-black placeholder:text-black/60"
                          }`}
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 bg-white text-black text-[10px] font-mono uppercase tracking-[0.3em] font-black hover:scale-[1.02] active:scale-[0.98] transition-all rounded-2xl shadow-xl disabled:opacity-50 flex items-center justify-center gap-3"
                      >
                        {loading ? (
                          <>SUBMITTING...</>
                        ) : (
                          <><Send className="h-4 w-4" /> Submit Request</>
                        )}
                      </button>
                    </form>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

        </div>
      </section>

      <Footer />
    </div>
  )
}
