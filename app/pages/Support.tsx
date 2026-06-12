"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Navbar from "@/components/Navbar"
import Footer from "@/components/ui/Footer"
import { useTheme } from "@/lib/theme-context"
import { getPublicSiteSettings } from "@/lib/chat-api"
import { MessageSquare, Mail, Clock, Send, CheckCircle, Bug } from "lucide-react"

const API_BASE = process.env.NEXT_PUBLIC_BASE_URL!

const DEFAULT_TITLE = "We're Here to\nHelp."
const DEFAULT_DESC = "Having trouble? Have a suggestion? Our support team typically responds within 24 hours. You can also email us directly at hello@rudranex.ai."
const DEFAULT_EMAIL = "hello@rudranex.ai"
const DEFAULT_RESPONSE_TIME = "Usually within 24 hours"

const SUPPORT_CATEGORIES = [
    { value: "general", label: "General Inquiry" },
    { value: "account", label: "Account & Billing" },
    { value: "technical", label: "Technical Issue" },
    { value: "feature", label: "Feature Request" },
    { value: "bug", label: "Bug Report" },
    { value: "other", label: "Other" },
]

export default function Support() {
    const { isDarkMode } = useTheme()
    const [pageTitle, setPageTitle] = useState(DEFAULT_TITLE)
    const [pageDesc, setPageDesc] = useState(DEFAULT_DESC)
    const [pageEmail, setPageEmail] = useState(DEFAULT_EMAIL)
    const [pageResponseTime, setPageResponseTime] = useState(DEFAULT_RESPONSE_TIME)
    const [name, setName] = useState("")
    const [email, setEmail] = useState("")
    const [category, setCategory] = useState("general")
    const [subject, setSubject] = useState("")
    const [message, setMessage] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [success, setSuccess] = useState(false)

    useEffect(() => {
        getPublicSiteSettings().then(res => {
            const setting = res.settings?.find(s => s.key === "support_page")
            if (setting?.value) {
                try {
                    const parsed = JSON.parse(setting.value)
                    if (parsed.title) setPageTitle(parsed.title)
                    if (parsed.description) setPageDesc(parsed.description)
                    if (parsed.email) setPageEmail(parsed.email)
                    if (parsed.responseTime) setPageResponseTime(parsed.responseTime)
                } catch (e) {
                    console.error("Error parsing support settings", e)
                }
            }
        }).catch(() => {})
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError("")
        try {
            const payload: any = { name: name.trim(), email: email.trim(), message: `[${category}] ${subject}\n\n${message.trim()}` }
            const res = await fetch(`${API_BASE}/request/contact`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || "Failed to submit")
            setSuccess(true)
        } catch (e: any) {
            setError(e.message || "Something went wrong")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className={`min-h-screen ${isDarkMode ? "bg-[#050308] text-white" : "bg-[#fdfdfd] text-black"} selection:bg-[var(--color-cyan)] selection:text-white`}>
            <Navbar visible={true} />

            <section className="pt-48 pb-32 px-6 md:px-12 bg-mesh">
                <div className="container mx-auto max-w-4xl">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <span 
                            className={`font-sans font-bold uppercase ${isDarkMode ? "text-white/20" : "text-black/30"} block mb-8`}
                            style={{ fontSize: "11px", letterSpacing: "0.1em" }}
                        >
                            § 06 — SUPPORT
                        </span>

                        <h1 
                            className="font-display font-bold leading-none mb-6"
                            style={{ fontSize: "clamp(3.5rem, 8vw, 72px)", letterSpacing: "-0.04em" }}
                        >
                            {pageTitle.split('\n').map((line, idx, arr) => (
                                <span key={idx}>
                                    {idx > 0 && <br />}
                                    {idx === arr.length - 1 ? (
                                        <span className="font-serif italic font-normal text-black dark:text-white">{line}</span>
                                    ) : line}
                                </span>
                            ))}
                        </h1>

                        <p className={`text-base md:text-lg max-w-2xl leading-relaxed mb-16 ${isDarkMode ? "text-white/50" : "text-black/50"}`}>
                            {pageDesc}
                        </p>

                        <div className={`h-px w-full ${isDarkMode ? "bg-white/10" : "bg-black/10"} mb-20`} />

                        <div className="grid grid-cols-1 lg:grid-cols-5 gap-16">
                            <div className="lg:col-span-2 space-y-10">
                                <div className="flex items-center gap-6 group">
                                    <div className={`h-12 w-12 rounded-full border flex items-center justify-center transition-colors group-hover:border-[var(--brand-accent)] ${isDarkMode ? "border-white/10" : "border-black/10"}`}>
                                        <Mail className="h-5 w-5 text-[var(--brand-accent)]" />
                                    </div>
                                    <div>
                                        <p className={`font-sans font-bold uppercase tracking-widest ${isDarkMode ? "text-white/20" : "text-black/30"}`} style={{ fontSize: "10px" }}>Email</p>
                                        <p className="text-lg font-medium">{pageEmail}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6 group">
                                    <div className={`h-12 w-12 rounded-full border flex items-center justify-center transition-colors group-hover:border-[var(--brand-accent)] ${isDarkMode ? "border-white/10" : "border-black/10"}`}>
                                        <Clock className="h-5 w-5 text-[var(--brand-accent)]" />
                                    </div>
                                    <div>
                                        <p className={`font-sans font-bold uppercase tracking-widest ${isDarkMode ? "text-white/20" : "text-black/30"}`} style={{ fontSize: "10px" }}>Response Time</p>
                                        <p className="text-lg font-medium">{pageResponseTime}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6 group">
                                    <div className={`h-12 w-12 rounded-full border flex items-center justify-center transition-colors group-hover:border-[var(--brand-accent)] ${isDarkMode ? "border-white/10" : "border-black/10"}`}>
                                        <Bug className="h-5 w-5 text-[var(--brand-accent)]" />
                                    </div>
                                    <div>
                                        <p className={`font-sans font-bold uppercase tracking-widest ${isDarkMode ? "text-white/20" : "text-black/30"}`} style={{ fontSize: "10px" }}>Bug Reports</p>
                                        <p className="text-lg font-medium">Report technical issues</p>
                                    </div>
                                </div>

                                <div className={`pt-6 border-t ${isDarkMode ? "border-white/5" : "border-black/5"}`}>
                                    <p className={`text-[11px] font-sans font-bold uppercase tracking-widest mb-4 ${isDarkMode ? "text-white/20" : "text-black/30"}`}>
                                        Common Topics
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {["Account Issues", "Payment", "API Access", "Feature Request", "Bug Report", "Enterprise"].map((topic) => (
                                            <button
                                                key={topic}
                                                onClick={() => { setSubject(topic); setCategory(topic === "Bug Report" ? "bug" : topic === "Feature Request" ? "feature" : topic === "Account Issues" || topic === "Payment" ? "account" : "general") }}
                                                className={`px-4 py-2 text-[11px] font-sans font-bold uppercase tracking-widest border transition-all ${
                                                    isDarkMode ? "border-white/10 text-white/50 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/30 hover:text-white" : "border-black/10 text-black/50 bg-black/[0.01] hover:bg-black/[0.03] hover:border-black/30 hover:text-black"
                                                }`}
                                            >
                                                {topic}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className={`lg:col-span-3 p-10 md:p-14 border ${isDarkMode ? "bg-white/[0.02] border-white/10 backdrop-blur-md" : "bg-white border-black/10"}`}>
                                <AnimatePresence mode="wait">
                                    {success ? (
                                        <motion.div
                                            key="success"
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="text-center py-10"
                                        >
                                            <div className="h-16 w-16 rounded-full bg-[var(--brand-accent)]/10 flex items-center justify-center mx-auto mb-8">
                                                <Send className="h-8 w-8 text-[var(--brand-accent)]" />
                                            </div>
                                            <h3 className="font-display font-bold text-2xl mb-4 tracking-tighter uppercase">Ticket Submitted</h3>
                                            <p className={`text-[14px] leading-relaxed mb-10 ${isDarkMode ? "text-white/50" : "text-black/50"}`}>
                                                Thank you for reaching out. Our support team will get back to you at <span className="text-[var(--brand-accent)]">{email}</span> within 24 hours.
                                            </p>
                                            <button
                                                onClick={() => { setSuccess(false); setName(""); setEmail(""); setSubject(""); setMessage(""); setCategory("general") }}
                                                className={`px-10 py-4 font-sans font-bold uppercase tracking-widest text-[11px] transition-all active:scale-95 ${isDarkMode ? "bg-white text-black" : "bg-black text-white"}`}
                                            >
                                                Submit Another
                                            </button>
                                        </motion.div>
                                    ) : (
                                        <form onSubmit={handleSubmit} className="space-y-5">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                                <div className="space-y-1">
                                                    <label className={`text-[10px] font-sans font-bold uppercase tracking-widest ${isDarkMode ? "text-white/30" : "text-black/30"}`}>Your Name</label>
                                                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} required
                                                        className={`w-full px-5 py-4 text-[13px] font-sans border focus:outline-none focus:border-[var(--color-cyan)] transition-all ${isDarkMode ? "bg-white/[0.03] border-white/10 text-white" : "bg-black/5 border-black/5 text-black"}`}
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className={`text-[10px] font-sans font-bold uppercase tracking-widest ${isDarkMode ? "text-white/30" : "text-black/30"}`}>Email Address</label>
                                                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                                                        className={`w-full px-5 py-4 text-[13px] font-sans border focus:outline-none focus:border-[var(--color-cyan)] transition-all ${isDarkMode ? "bg-white/[0.03] border-white/10 text-white" : "bg-black/5 border-black/5 text-black"}`}
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <label className={`text-[10px] font-sans font-bold uppercase tracking-widest ${isDarkMode ? "text-white/30" : "text-black/30"}`}>Category</label>
                                                <select value={category} onChange={(e) => setCategory(e.target.value)}
                                                    className={`w-full px-5 py-4 text-[13px] font-sans border focus:outline-none focus:border-[var(--color-cyan)] transition-all ${isDarkMode ? "bg-white/[0.03] border-white/10 text-white" : "bg-black/5 border-black/5 text-black"}`}
                                                >
                                                    {SUPPORT_CATEGORIES.map(c => (
                                                        <option key={c.value} value={c.value} className={isDarkMode ? "bg-[#050308]" : "bg-white"}>{c.label}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="space-y-1">
                                                <label className={`text-[10px] font-sans font-bold uppercase tracking-widest ${isDarkMode ? "text-white/30" : "text-black/30"}`}>Subject</label>
                                                <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} required
                                                    className={`w-full px-5 py-4 text-[13px] font-sans border focus:outline-none focus:border-[var(--color-cyan)] transition-all ${isDarkMode ? "bg-white/[0.03] border-white/10 text-white" : "bg-black/5 border-black/5 text-black"}`}
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className={`text-[10px] font-sans font-bold uppercase tracking-widest ${isDarkMode ? "text-white/30" : "text-black/30"}`}>Message</label>
                                                <textarea rows={5} value={message} onChange={(e) => setMessage(e.target.value)} required
                                                    className={`w-full px-5 py-4 text-[13px] font-sans border focus:outline-none focus:border-[var(--color-cyan)] transition-all resize-none ${isDarkMode ? "bg-white/[0.03] border-white/10 text-white" : "bg-black/5 border-black/5 text-black"}`}
                                                />
                                            </div>

                                            {error && (
                                                <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-[11px] font-sans font-bold uppercase tracking-widest">
                                                    {error}
                                                </div>
                                            )}

                                            <button type="submit" disabled={loading}
                                                className={`w-full py-5 font-sans font-bold uppercase tracking-[0.2em] text-[11px] transition-all active:scale-95 disabled:opacity-50 mt-4 ${isDarkMode ? "bg-white text-black hover:bg-white/90" : "bg-black text-white hover:bg-black/90"}`}
                                            >
                                                {loading ? "SUBMITTING..." : "SUBMIT TICKET"}
                                            </button>
                                        </form>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            <Footer />
        </div>
    )
}
