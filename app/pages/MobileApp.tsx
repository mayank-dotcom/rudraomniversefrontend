"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import Navbar from "@/components/ui/Navbar"
import Footer from "@/components/ui/Footer"
import { useTheme } from "@/lib/theme-context"
import { Smartphone, Cpu, Sparkles, Calendar, Download, CheckCircle } from "lucide-react"

export default function MobileApp() {
  const { isDarkMode } = useTheme()

  const [pageData, setPageData] = useState({
    title: "Rudranex AI Mobile",
    description: "Take Rudranex AI wherever you go. Practice interviews, get code assistance, and learn on the move with our native mobile experience.",
    buttonText: "Download for Android",
    buttonUrl: "#"
  });

  useEffect(() => {
    try {
      const local = localStorage.getItem("rudranex_mobile_app_page");
      if (local) {
        const parsed = JSON.parse(local);
        setPageData({
          title: parsed.title || "Rudranex AI Mobile",
          description: parsed.description || "Take Rudranex AI wherever you go. Practice interviews, get code assistance, and learn on the move with our native mobile experience.",
          buttonText: parsed.buttonText || "Download for Android",
          buttonUrl: parsed.buttonUrl || "#"
        });
      }
    } catch (e) {
      console.error("Local storage mobile fetch error:", e);
    }
  }, []);

  const features = [
    { icon: Cpu, title: "AI on the Go", desc: "Full Rudranex AI capabilities in your pocket — code assistance, interview prep, and learning anywhere." },
    { icon: Sparkles, title: "Voice Enabled", desc: "Speak your queries and get AI-powered responses hands-free with built-in voice recognition." },
    { icon: Calendar, title: "Schedule Planner", desc: "Plan your study sessions, set reminders for interviews, and track your learning milestones effortlessly." },
    { icon: Smartphone, title: "Cross Platform", desc: "Optimized for both iOS and Android with native performance and seamless sync across devices." },
  ]

  const steps = [
    { num: "01", label: "Visit Google Play Store" },
    { num: "02", label: "Download the App" },
    { num: "03", label: "Create Your Account" },
    { num: "04", label: "Start Learning Anywhere" },
  ]

  return (
    <div className={`min-h-screen ${isDarkMode ? "bg-[#0a0a0a] text-white" : "bg-[#fdfdfd] text-black"} selection:bg-[var(--color-cyan)] selection:text-white overflow-x-hidden`}>
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-48 pb-20 px-6 md:px-12 bg-mesh overflow-hidden">
        {isDarkMode && (
          <div className="absolute top-1/3 right-1/3 w-[500px] h-[500px] bg-[var(--color-cyan)]/5 blur-[120px] rounded-full pointer-events-none" />
        )}
        <div className="container mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="flex flex-col items-center text-center mb-32"
          >
            <span
              className={`font-sans font-bold uppercase ${isDarkMode ? "text-white/20" : "text-black/30"} block mb-12`}
              style={{ fontSize: "11px", letterSpacing: "0.1em" }}
            >
              § MOBILE APPLICATION
            </span>

            <div className={`flex items-center justify-center h-20 w-20 rounded-2xl mb-10 ${isDarkMode ? "bg-white/5" : "bg-black/5"}`}>
              <Smartphone className="h-10 w-10 text-[var(--color-cyan)]" />
            </div>

            <h1
              className="font-display font-bold leading-[0.9] mb-8"
              style={{ fontSize: "clamp(3rem, 8vw, 64px)", letterSpacing: "-0.04em" }}
            >
              {pageData.title.split(' ').map((word, idx, arr) => (
                <span key={idx}>
                  {idx > 0 && ' '}
                  {idx === arr.length - 1 ? (
                    <span className="text-[var(--color-cyan)]">{word}</span>
                  ) : (
                    word
                  )}
                </span>
              ))}
            </h1>

            <p
              className={`text-base md:text-lg max-w-2xl leading-relaxed mb-12 ${isDarkMode ? "text-white/50" : "text-black/50"}`}
              style={{ fontSize: "16px" }}
            >
              {pageData.description}
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <a
                href={pageData.buttonUrl}
                className={`flex items-center gap-3 px-8 py-4 font-sans font-semibold uppercase transition-all active:scale-95 ${isDarkMode ? "bg-white text-black hover:bg-white/90" : "bg-black text-white hover:bg-black/90"}`}
                style={{ fontSize: "13px", letterSpacing: "0.05em" }}
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.523 16.435c-.756.802-1.518 1.622-2.286 2.422-.547.57-1.109 1.14-1.688 1.688a3.424 3.424 0 0 1-2.41.972 3.613 3.613 0 0 1-2.387-.972c-.58-.549-1.14-1.119-1.677-1.688-.768-.802-1.53-1.62-2.297-2.422-2.347-2.499-2.613-4.981-1.136-7.242a4.527 4.527 0 0 1 2.357-1.994 4.108 4.108 0 0 1 2.953.02c.545.239.846.539.946.843.055.161.092.185.122.183.043-.005.213-.094.466-.196a4.898 4.898 0 0 1 2.045-.438c.82.011 1.563.195 2.22.557l-.019.012a4.91 4.91 0 0 1 1.11.796c.254.252.45.538.643.86l-.004-.007c.624-.336 1.316-.531 2.07-.531.18 0 .36.009.537.028l.014.001c.045.008.167.028.31.06a4.862 4.862 0 0 1 2.656 1.583c.433.532.74 1.12.936 1.733l.007.025c.023.073.045.146.066.22.25.89.27 1.778.084 2.637l-.007.026c-.138.614-.405 1.2-.797 1.736l-.009.012a4.222 4.222 0 0 1-1.803 1.476l-.012.005a3.383 3.383 0 0 0-.758.38 2.544 2.544 0 0 0-.314.259c-.11.107-.2.238-.259.384zm-5.008-13.328c0-.376.084-.76.251-1.15a3.39 3.39 0 0 1 .724-1.082c.366-.367.8-.632 1.274-.767a3.168 3.168 0 0 1 .904-.131c.258.006.525.036.8.09l-.017-.003c.416.082.652.193.652.422-.003.013-.006.026-.011.039a2.884 2.884 0 0 1-.234.477 3.48 3.48 0 0 1-.839 1.048 3.336 3.336 0 0 1-1.213.65 3.584 3.584 0 0 1-.93.14c-.27 0-.542-.036-.806-.108l.012.003a2.332 2.332 0 0 1-.483-.146l.01.004-.071-.035a1.216 1.216 0 0 1-.232-.138 1.212 1.212 0 0 1-.188-.154c-.094-.093-.176-.192-.246-.296l-.005-.008a1.78 1.78 0 0 1-.28-.505l-.003-.01z" />
                </svg>
                {pageData.buttonText}
                <Download className="h-4 w-4 ml-1" />
              </a>
            </div>
          </motion.div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-32">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 * i }}
                className={`group p-8 rounded-xl border transition-all duration-300 ${isDarkMode ? "bg-black/40 border-white/5 hover:border-white/10 hover:bg-black/60" : "bg-white border-black/5 hover:border-black/10 hover:bg-black/[0.02]"}`}
              >
                <feature.icon className={`h-6 w-6 mb-6 ${isDarkMode ? "text-white/30 group-hover:text-[var(--color-cyan)]" : "text-black/30 group-hover:text-[var(--color-cyan)]"} transition-colors duration-300`} />
                <h3 className={`font-display font-semibold text-lg mb-3 uppercase tracking-tight ${isDarkMode ? "text-white group-hover:text-[var(--color-cyan)]" : "text-black group-hover:text-[var(--color-cyan)]"} transition-colors duration-300`}>
                  {feature.title}
                </h3>
                <p className={`font-sans text-sm leading-relaxed ${isDarkMode ? "text-white/35" : "text-black/35"}`}>
                  {feature.desc}
                </p>
              </motion.div>
            ))}
          </div>

          {/* How to Install */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="max-w-2xl mx-auto"
          >
            <div className={`p-10 md:p-14 rounded-xl border ${isDarkMode ? "bg-black/40 border-white/10" : "bg-white border-black/10"}`}>
              <h2 className="text-2xl font-display font-bold mb-3 tracking-tighter uppercase">How to Get Started</h2>
              <p className={`text-[11px] font-sans font-bold uppercase tracking-[0.1em] mb-10 ${isDarkMode ? "text-white/30" : "text-black/40"}`}>
                Download and start learning in minutes
              </p>
              <div className="space-y-6">
                {steps.map((step, i) => (
                  <div key={i} className="flex items-center gap-5">
                    <span className={`font-sans font-bold text-[11px] ${isDarkMode ? "text-white/20" : "text-black/20"}`} style={{ letterSpacing: "0.1em", minWidth: "24px" }}>
                      {step.num}
                    </span>
                    <CheckCircle className="h-4 w-4 text-[var(--color-cyan)] shrink-0" />
                    <span className={`font-sans text-sm ${isDarkMode ? "text-white/60" : "text-black/60"}`}>
                      {step.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
