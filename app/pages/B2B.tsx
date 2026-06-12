"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Navbar from "@/components/Navbar"
import Footer from "@/components/ui/Footer"
import { Building2, ShieldCheck, Cpu, CheckCircle, ArrowLeft } from "lucide-react"
import { useTheme } from "@/lib/theme-context"
import { getPublicSiteSettings } from "@/lib/chat-api"

const API_BASE = process.env.NEXT_PUBLIC_BASE_URL!

export default function B2B() {
  const { isDarkMode } = useTheme()
  const [enterpriseName, setEnterpriseName] = useState("")
  const [adminName, setAdminName] = useState("")
  const [adminEmail, setAdminEmail] = useState("")
  const [adminPassword, setAdminPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  // Dynamic Site Settings
  const [pageData, setPageData] = useState<{
    title: string;
    description: string;
    linkText: string;
    linkUrl: string;
    features: { title: string; desc: string }[];
  }>({
    title: "Quiet power.\nTailored access.",
    description: "Choose the level of intelligence that fits your workflow. From late-night study sessions to building the next big thing.",
    linkText: "Learn More",
    linkUrl: "/pricing",
    features: [
      { title: "Dedicated Workspace", desc: "Full control over your organization's members, custom workspaces, quotas, and shared team folders." },
      { title: "Enterprise Analytics", desc: "Track overall team productivity, usage stats, model distributions, and custom metrics in real-time." },
      { title: "Custom Personas", desc: "Build tailored AI agents trained specifically on your company's documents, codebase, policies, and guidelines." }
    ]
  });

  useEffect(() => {
    getPublicSiteSettings().then(res => {
      const setting = res.settings?.find(s => s.key === "b2b_page");
      if (setting?.value) {
        try {
          const parsed = JSON.parse(setting.value);
          setPageData(prev => ({
            ...prev,
            title: parsed.title || "Quiet power.\nTailored access.",
            description: parsed.description || "Choose the level of intelligence that fits your workflow. From late-night study sessions to building the next big thing.",
            linkText: parsed.linkText || "Learn More",
            linkUrl: parsed.linkUrl || "/pricing",
            features: Array.isArray(parsed.features) && parsed.features.length > 0 ? parsed.features : prev.features
          }));
        } catch (e) {
          console.error("Error parsing B2B settings", e);
        }
      }
    }).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      const res = await fetch(`${API_BASE}/request/enterprise`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enterprise_name: enterpriseName.trim(),
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
    <div className={`min-h-screen ${isDarkMode ? "bg-[#050308] text-white" : "bg-[#fdfdfd] text-black"} selection:bg-[var(--color-cyan)] selection:text-white overflow-x-hidden`}>
      <Navbar visible={true} />

      {/* Hero Section */}
      <section className="relative pt-48 pb-20 px-6 md:px-12 bg-mesh">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="flex flex-col items-center text-center mb-32"
          >
            {/* Technical Label */}
            <span 
              className={`font-sans font-bold uppercase ${isDarkMode ? "text-white/20" : "text-black/30"} block mb-12`}
              style={{ fontSize: "11px", letterSpacing: "0.1em" }}
            >
              § ENTERPRISE SOLUTIONS
            </span>

            {/* Hero Headline — 72px Bold, -0.04em */}
            <h1 
              className="font-display font-bold leading-[0.9] mb-12"
              style={{ fontSize: "clamp(3.5rem, 9vw, 72px)", letterSpacing: "-0.04em" }}
            >
              {pageData.title.split('\n').map((line, idx, arr) => (
                <span key={idx}>
                  {idx > 0 && <br />}
                  {idx === arr.length - 1 ? (
                    <span className="font-serif italic font-normal text-black dark:text-white">{line}</span>
                  ) : (
                    line
                  )}
                </span>
              ))}
            </h1>

            {/* Body Copy — 16px Regular */}
            <p 
              className={`text-base md:text-lg max-w-2xl leading-relaxed ${isDarkMode ? "text-white/50" : "text-black/50"}`}
              style={{ fontSize: "16px" }}
            >
              {pageData.description}
            </p>
          </motion.div>

          {/* Features Grid */}
          <div className={`grid grid-cols-1 md:grid-cols-3 gap-0 border mb-32 overflow-hidden ${isDarkMode ? "border-white/5 bg-black/20" : "border-black/5 bg-black/[0.02]"}`}>
            {pageData.features.map((feature, i) => {
              const Icon = i === 0 ? Building2 : i === 1 ? ShieldCheck : Cpu;
              return (
                <div
                  key={i}
                  className={`p-12 border-r last:border-r-0 ${
                    isDarkMode ? "border-white/5 bg-white/[0.02] hover:bg-white/[0.04]" : "border-black/5 bg-white hover:bg-zinc-50"
                  } transition-all duration-500 group`}
                >
                  <div className="flex justify-between items-center mb-12">
                    <Icon className={`h-6 w-6 ${isDarkMode ? "text-white/30" : "text-black/35"} group-hover:text-[var(--brand-accent)] transition-colors`} />
                    <span className={`font-sans font-bold text-[11px] ${isDarkMode ? "text-white/10 group-hover:text-white/20" : "text-black/10 group-hover:text-black/20"}`} style={{ letterSpacing: "0.1em" }}>0{i + 1}</span>
                  </div>
                  <h3 className={`font-display font-semibold ${isDarkMode ? "text-white" : "text-black"} text-xl mb-4 uppercase tracking-tight group-hover:text-[var(--brand-accent)] transition-colors`}>{feature.title}</h3>
                  <p className={`font-sans font-normal ${isDarkMode ? "text-white/35 group-hover:text-white/50" : "text-black/45 group-hover:text-black/60"} text-[14px] leading-relaxed transition-colors`}>{feature.desc}</p>
                </div>
              );
            })}
          </div>

          {/* Request Form */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="max-w-xl mx-auto"
          >
            <AnimatePresence mode="wait">
              {success ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`border p-12 text-center ${isDarkMode ? "bg-black/40 border-white/10" : "bg-white border-black/10"}`}
                >
                  <div className="h-16 w-16 rounded-full bg-[var(--brand-accent)]/10 flex items-center justify-center mx-auto mb-8">
                    <CheckCircle className="h-8 w-8 text-[var(--brand-accent)]" />
                  </div>
                  <h2 className="text-2xl font-display font-bold mb-4 tracking-tighter">Request Received</h2>
                  <p className={`text-[14px] mb-10 leading-relaxed ${isDarkMode ? "text-white/50" : "text-black/50"}`}>
                    Our enterprise team will review your application and reach out to <span className="text-[var(--brand-accent)]">{adminEmail}</span> with your dedicated onboarding package.
                  </p>
                  <div className="flex flex-col gap-4">
                    <button
                      onClick={() => { setSuccess(false); setEnterpriseName(""); setAdminName(""); setAdminEmail(""); setAdminPassword("") }}
                      className={`w-full py-4 font-sans font-semibold uppercase tracking-widest text-[11px] transition-all active:scale-95 ${isDarkMode ? "bg-white text-black" : "bg-black text-white"}`}
                    >
                      Submit Another Request
                    </button>
                    <a
                      href={pageData.linkUrl}
                      className={`w-full py-4 border font-sans font-semibold uppercase tracking-widest text-[11px] transition-all active:scale-95 flex items-center justify-center gap-2 ${isDarkMode ? "border-white/10 text-white" : "border-black/10 text-black"}`}
                    >
                      <ArrowLeft className="h-3 w-3" /> {pageData.linkText}
                    </a>
                  </div>
                </motion.div>
              ) : (
                <div className={`p-10 md:p-14 border ${isDarkMode ? "bg-white/[0.02] border-white/10 backdrop-blur-md" : "bg-white border-black/10"}`}>
                  <h2 className="text-2xl font-display font-bold mb-2 tracking-tighter uppercase">Enterprise Request</h2>
                  <p className={`text-[11px] font-sans font-bold uppercase tracking-[0.1em] mb-10 ${isDarkMode ? "text-white/30" : "text-black/40"}`}>
                    Corporate Onboarding Form
                  </p>

                  {error && (
                    <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-[11px] font-sans font-bold uppercase tracking-widest">
                      {error}
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-1">
                      <label className={`text-[10px] font-sans font-bold uppercase tracking-widest ${isDarkMode ? "text-white/30" : "text-black/30"}`}>Company / Enterprise Name</label>
                      <input
                        type="text"
                        value={enterpriseName}
                        onChange={(e) => setEnterpriseName(e.target.value)}
                        required
                        className={`w-full px-5 py-4 text-[13px] font-sans border focus:outline-none focus:border-[var(--color-cyan)] transition-all ${
                          isDarkMode ? "bg-white/[0.03] border-white/10 text-white" : "bg-black/5 border-black/5 text-black"
                        }`}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className={`text-[10px] font-sans font-bold uppercase tracking-widest ${isDarkMode ? "text-white/30" : "text-black/30"}`}>Admin Name</label>
                      <input
                        type="text"
                        value={adminName}
                        onChange={(e) => setAdminName(e.target.value)}
                        required
                        className={`w-full px-5 py-4 text-[13px] font-sans border focus:outline-none focus:border-[var(--color-cyan)] transition-all ${
                          isDarkMode ? "bg-white/[0.03] border-white/10 text-white" : "bg-black/5 border-black/5 text-black"
                        }`}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className={`text-[10px] font-sans font-bold uppercase tracking-widest ${isDarkMode ? "text-white/30" : "text-black/30"}`}>Official Business Email</label>
                      <input
                        type="email"
                        value={adminEmail}
                        onChange={(e) => setAdminEmail(e.target.value)}
                        required
                        className={`w-full px-5 py-4 text-[13px] font-sans border focus:outline-none focus:border-[var(--color-cyan)] transition-all ${
                          isDarkMode ? "bg-white/[0.03] border-white/10 text-white" : "bg-black/5 border-black/5 text-black"
                        }`}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className={`text-[10px] font-sans font-bold uppercase tracking-widest ${isDarkMode ? "text-white/30" : "text-black/30"}`}>Password</label>
                      <input
                        type="password"
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        required
                        minLength={6}
                        className={`w-full px-5 py-4 text-[13px] font-sans border focus:outline-none focus:border-[var(--color-cyan)] transition-all ${
                          isDarkMode ? "bg-white/[0.03] border-white/10 text-white" : "bg-black/5 border-black/5 text-black"
                        }`}
                      />
                    </div>
                    
                    <button
                      type="submit"
                      disabled={loading}
                      className={`w-full py-5 font-sans font-bold uppercase tracking-[0.2em] text-[11px] transition-all active:scale-95 disabled:opacity-50 mt-4 ${
                        isDarkMode ? "bg-white text-black hover:bg-white/90" : "bg-black text-white hover:bg-black/90"
                      }`}
                    >
                      {loading ? "SUBMITTING..." : "SUBMIT B2B REQUEST"}
                    </button>
                  </form>
                </div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
