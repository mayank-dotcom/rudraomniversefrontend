"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import Navbar from "@/components/ui/Navbar"
import Footer from "@/components/ui/Footer"
import { useTheme } from "@/lib/theme-context"
import { Code2, Brackets, GitBranch, BugPlay, Download, ArrowRight, CheckCircle, ExternalLink } from "lucide-react"

export default function Plugin() {
  const { isDarkMode } = useTheme()

  const [pageData, setPageData] = useState({
    title: "Rudranex AI Plugin",
    description: "Bring Rudranex AI directly into your code editor. Get real-time AI assistance, smart debugging, and automated code reviews without leaving your workflow.",
    buttonText: "VS Code Marketplace",
    buttonUrl: "#"
  });

  useEffect(() => {
    try {
      const local = localStorage.getItem("rudranex_plugin_page");
      if (local) {
        const parsed = JSON.parse(local);
        setPageData({
          title: parsed.title || "Rudranex AI Plugin",
          description: parsed.description || "Bring Rudranex AI directly into your code editor. Get real-time AI assistance, smart debugging, and automated code reviews without leaving your workflow.",
          buttonText: parsed.buttonText || "VS Code Marketplace",
          buttonUrl: parsed.buttonUrl || "#"
        });
      }
    } catch (e) {
      console.error("Local storage plugin fetch error:", e);
    }
  }, []);

  const features = [
    { icon: Brackets, title: "Inline Code Assist", desc: "Get AI-powered code suggestions, completions, and refactors directly inside your editor without switching context." },
    { icon: GitBranch, title: "Multi-Editor Support", desc: "Works seamlessly with VS Code, JetBrains IDEs, Vim, Neovim, and more — pick your weapon." },
    { icon: BugPlay, title: "Smart Debugging", desc: "AI-driven error analysis and fix suggestions as you code. Understand stack traces in plain English." },
    { icon: Code2, title: "Code Review AI", desc: "Automated pull request reviews with contextual feedback — catch issues before they reach production." },
  ]

  const editors = [
    { name: "VS Code", icon: "⬡" },
    { name: "JetBrains", icon: "◈" },
    { name: "Vim / Neovim", icon: "▽" },
    { name: "Sublime Text", icon: "◇" },
  ]

  const steps = [
    { num: "01", label: "Open your editor's marketplace" },
    { num: "02", label: "Search for 'Rudranex AI'" },
    { num: "03", label: "Install the plugin" },
    { num: "04", label: "Authenticate and start coding with AI" },
  ]

  return (
    <div className={`min-h-screen ${isDarkMode ? "bg-[#0a0a0a] text-white" : "bg-[#fdfdfd] text-black"} selection:bg-[var(--color-cyan)] selection:text-white overflow-x-hidden`}>
      <Navbar />

      <section className="relative pt-48 pb-20 px-6 md:px-12 bg-mesh overflow-hidden">
        {isDarkMode && (
          <div className="absolute top-1/3 left-1/3 w-[500px] h-[500px] bg-[var(--color-cyan)]/5 blur-[120px] rounded-full pointer-events-none" />
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
              § CODE EDITOR PLUGIN
            </span>

            <div className={`flex items-center justify-center h-20 w-20 rounded-2xl mb-10 ${isDarkMode ? "bg-white/5" : "bg-black/5"}`}>
              <Code2 className="h-10 w-10 text-[var(--color-cyan)]" />
            </div>

            <h1
              className="font-display font-bold leading-[0.9] mb-8"
              style={{ fontSize: "clamp(3rem, 8vw, 64px)", letterSpacing: "-0.04em" }}
            >
              {pageData.title.split('\n').map((line, idx, arr) => (
                <span key={idx}>
                  {idx > 0 && <br />}
                  {idx === arr.length - 1 ? (
                    <span className="text-[var(--color-cyan)]">{line}</span>
                  ) : (
                    line
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
                target={pageData.buttonUrl.startsWith("http") ? "_blank" : undefined}
                rel={pageData.buttonUrl.startsWith("http") ? "noopener noreferrer" : undefined}
                className={`flex items-center gap-3 px-8 py-4 font-sans font-semibold uppercase transition-all active:scale-95 ${isDarkMode ? "bg-white text-black hover:bg-white/90" : "bg-black text-white hover:bg-black/90"}`}
                style={{ fontSize: "13px", letterSpacing: "0.05em" }}
              >
                <ExternalLink className="h-5 w-5" />
                {pageData.buttonText}
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </motion.div>

          {/* Supported Editors */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-wrap justify-center gap-4 mb-32"
          >
            {editors.map((editor) => (
              <div
                key={editor.name}
                className={`flex items-center gap-3 px-6 py-3 rounded-full border text-sm font-sans font-medium transition-all duration-300 ${isDarkMode ? "border-white/5 text-white/50 hover:border-white/20 hover:text-white" : "border-black/5 text-black/50 hover:border-black/20 hover:text-black"}`}
              >
                <span className="text-[var(--color-cyan)]">{editor.icon}</span>
                {editor.name}
              </div>
            ))}
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
              <h2 className="text-2xl font-display font-bold mb-3 tracking-tighter uppercase">How to Install</h2>
              <p className={`text-[11px] font-sans font-bold uppercase tracking-[0.1em] mb-10 ${isDarkMode ? "text-white/30" : "text-black/40"}`}>
                Get started in 4 simple steps
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
