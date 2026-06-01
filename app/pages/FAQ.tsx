"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Navbar from "@/components/ui/Navbar"
import Footer from "@/components/ui/Footer"
import { useTheme } from "@/lib/theme-context"
import { getPublicSiteSettings } from "@/lib/chat-api"
import { ChevronDown, Search } from "lucide-react"

const DEFAULT_TITLE = "Frequently Asked\nQuestions."
const DEFAULT_DESC = "Everything you need to know about Rudranex AI. Can't find what you're looking for? Reach out to our support team."
const DEFAULT_CATEGORIES: { category: string; questions: { q: string; a: string }[] }[] = [
    {
        category: "General",
        questions: [
            { q: "What is Rudranex AI?", a: "Rudranex AI is an advanced AI co-pilot designed for students, developers, and enterprises. It offers chat-based assistance, coding help, image generation, document analysis, and more across multiple platforms including web, mobile, and IDE plugins." },
            { q: "Is Rudranex free to use?", a: "Yes! We offer a Free Trial plan with daily chat, coding, and vision limits. For heavier usage, we have paid plans starting at just ₹99/month for students. Check our Pricing page for detailed plan comparisons." },
            { q: "Which platforms does Rudranex support?", a: "Rudranex is available as a web app, a native mobile app, and IDE plugins for VS Code, JetBrains, and more. Your data syncs seamlessly across all platforms." },
        ]
    },
    {
        category: "Account & Billing",
        questions: [
            { q: "How do I create an account?", a: "You can sign up using your mobile number via OTP verification, or use Google/GitHub for a quick 3rd-party login. Students can also sign up using their school code." },
            { q: "Can I upgrade or downgrade my plan?", a: "Absolutely. You can change your plan anytime from your account dashboard. When upgrading, the new limits apply immediately. Downgrades take effect at the start of the next billing cycle." },
            { q: "What payment methods do you accept?", a: "We accept all major UPI apps (Google Pay, PhonePe, Paytm), credit/debit cards, and net banking. Enterprise plans can be invoiced for bulk payments." },
            { q: "How do referrals work?", a: "Share your unique referral code with friends. When they sign up, you earn referral credits that can be redeemed for plan discounts or free months." },
        ]
    },
    {
        category: "Features & Usage",
        questions: [
            { q: "What AI models does Rudranex use?", a: "Rudranex leverages cutting-edge models including Gemini, DeepSeek, and GPT-4o-mini via OpenRouter. The system automatically routes your queries to the best model for the task." },
            { q: "Can I generate images with Rudranex?", a: "Yes! Use the AI Image Lab in chat mode to generate images with various style presets. Image generation is available on all paid plans." },
            { q: "Does Rudranex support voice input?", a: "Yes, both speech-to-text (STT) and text-to-speech (TTS) are supported on all plans. Dictate your queries or have responses read out to you." },
            { q: "Can I analyze documents and PDFs?", a: "Absolutely. Upload PDFs, images, or documents and Rudranex will extract and analyze the content. This works for academic papers, contracts, reports, and more." },
            { q: "Is there a mobile app?", a: "Yes, the Rudranex mobile app is available for both iOS and Android, offering the full AI experience on the go with voice input and clipboard sync." },
        ]
    },
    {
        category: "Schools & Enterprises",
        questions: [
            { q: "How can my school join Rudranex?", a: "School administrators can submit a request on our Schools page. Our team will onboard your institution with custom student limits, faculty management, and analytics dashboards." },
            { q: "What features are available for enterprises?", a: "Enterprises get dedicated workspaces, employee management, custom AI personas, team analytics, bulk email agent capabilities, and priority support. Visit our B2B page to get started." },
            { q: "Can I manage multiple teams under one account?", a: "Yes, enterprise admins can create multiple managers, each with their own team of employees. Usage quotas and analytics are available at every level." },
        ]
    },
    {
        category: "Technical",
        questions: [
            { q: "Is my data secure?", a: "We take security seriously. All data is encrypted in transit (TLS) and at rest. API keys are hashed, and we never share your personal data with third parties. See our Privacy Policy for details." },
            { q: "Does Rudranex have an API?", a: "Yes, developers can integrate Rudranex's AI capabilities via our REST API. Contact our sales team for API access and documentation." },
            { q: "What is the clipboard sync feature?", a: "Clipboard sync allows you to copy text on one device and paste it on another seamlessly. It works across web, mobile, and IDE plugins when you're logged into the same account." },
        ]
    }
]

export default function FAQ() {
    const { isDarkMode } = useTheme()
    const [openItems, setOpenItems] = useState<Set<string>>(new Set())
    const [searchQuery, setSearchQuery] = useState("")
    const [pageTitle, setPageTitle] = useState(DEFAULT_TITLE)
    const [pageDesc, setPageDesc] = useState(DEFAULT_DESC)
    const [categories, setCategories] = useState(DEFAULT_CATEGORIES)

    useEffect(() => {
        getPublicSiteSettings().then(res => {
            const setting = res.settings?.find(s => s.key === "faq_page")
            if (setting?.value) {
                try {
                    const parsed = JSON.parse(setting.value)
                    if (parsed.title) setPageTitle(parsed.title)
                    if (parsed.description) setPageDesc(parsed.description)
                    if (Array.isArray(parsed.categories)) setCategories(parsed.categories)
                } catch (e) {
                    console.error("Error parsing FAQ settings", e)
                }
            }
        }).catch(() => {})
    }, [])

    const toggleItem = (key: string) => {
        setOpenItems(prev => {
            const next = new Set(prev)
            if (next.has(key)) next.delete(key)
            else next.add(key)
            return next
        })
    }

    const filteredCategories = categories.map(cat => ({
        ...cat,
        questions: cat.questions.filter(
            item => item.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    item.a.toLowerCase().includes(searchQuery.toLowerCase())
        )
    })).filter(cat => cat.questions.length > 0)

    return (
        <div className={`min-h-screen ${isDarkMode ? "bg-[#0a0a0a] text-white" : "bg-[#fdfdfd] text-black"} selection:bg-[var(--color-cyan)] selection:text-white`}>
            <Navbar />

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
                            § 05 — FAQ
                        </span>

                        <h1 
                            className="font-display font-bold leading-none mb-6"
                            style={{ fontSize: "clamp(3.5rem, 8vw, 72px)", letterSpacing: "-0.04em" }}
                        >
                            {pageTitle.split('\n').map((line, idx, arr) => (
                                <span key={idx}>
                                    {idx > 0 && <br />}
                                    {idx === arr.length - 1 ? (
                                        <span className="italic text-[var(--color-cyan)]">{line}</span>
                                    ) : line}
                                </span>
                            ))}
                        </h1>

                        <p className={`text-base md:text-lg max-w-2xl leading-relaxed mb-16 ${isDarkMode ? "text-white/50" : "text-black/50"}`}>
                            {pageDesc}
                        </p>

                        <div className={`relative mb-20 ${isDarkMode ? "text-white" : "text-black"}`}>
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 opacity-40" />
                            <input
                                type="text"
                                placeholder="Search questions..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className={`w-full px-14 py-5 text-[13px] font-sans border focus:outline-none focus:border-[var(--color-cyan)] transition-all ${
                                    isDarkMode ? "bg-white/5 border-white/5 text-white placeholder-white/30" : "bg-black/5 border-black/5 text-black placeholder-black/30"
                                }`}
                            />
                        </div>

                        <div className={`h-px w-full ${isDarkMode ? "bg-white/10" : "bg-black/10"} mb-20`} />

                        <div className="space-y-16">
                            {filteredCategories.map((cat) => (
                                <div key={cat.category}>
                                    <h2 
                                        className={`font-sans font-bold uppercase tracking-[0.1em] mb-8 ${isDarkMode ? "text-white/30" : "text-black/40"}`}
                                        style={{ fontSize: "11px" }}
                                    >
                                        {cat.category}
                                    </h2>
                                    <div className="space-y-2">
                                        {cat.questions.map((item) => {
                                            const key = `${cat.category}-${item.q}`
                                            const isOpen = openItems.has(key)
                                            return (
                                                <div
                                                    key={key}
                                                    className={`border transition-all duration-300 ${
                                                        isDarkMode ? "border-white/5 hover:border-white/10" : "border-black/5 hover:border-black/10"
                                                    } ${isOpen ? (isDarkMode ? "border-white/10" : "border-black/10") : ""}`}
                                                >
                                                    <button
                                                        onClick={() => toggleItem(key)}
                                                        className="w-full flex items-center justify-between gap-4 px-8 py-6 text-left"
                                                    >
                                                        <span className="font-sans font-semibold text-sm md:text-base leading-snug tracking-tight">
                                                            {item.q}
                                                        </span>
                                                        <ChevronDown className={`h-4 w-4 shrink-0 transition-transform duration-300 ${isOpen ? "rotate-180" : ""} opacity-40`} />
                                                    </button>
                                                    <AnimatePresence>
                                                        {isOpen && (
                                                            <motion.div
                                                                initial={{ height: 0, opacity: 0 }}
                                                                animate={{ height: "auto", opacity: 1 }}
                                                                exit={{ height: 0, opacity: 0 }}
                                                                transition={{ duration: 0.3, ease: "easeInOut" }}
                                                                className="overflow-hidden"
                                                            >
                                                                <div className={`px-8 pb-6 text-sm md:text-base leading-relaxed ${isDarkMode ? "text-white/50" : "text-black/50"}`}>
                                                                    {item.a}
                                                                </div>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {filteredCategories.length === 0 && (
                            <div className="text-center py-20">
                                <p className={`text-base ${isDarkMode ? "text-white/30" : "text-black/30"}`}>
                                    No results found for &quot;{searchQuery}&quot;
                                </p>
                            </div>
                        )}
                    </motion.div>
                </div>
            </section>

            <Footer />
        </div>
    )
}
