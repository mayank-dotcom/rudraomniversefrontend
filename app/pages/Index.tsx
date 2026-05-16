"use client"

import { useState } from "react";
import { motion } from "framer-motion";
import Navbar from "@/components/ui/Navbar";
import FeatureCard from "@/components/ui/FeatureCard";
import AuthModal from "@/components/ui/AuthModal";
import Footer from "@/components/ui/Footer";
import { useTheme } from "@/lib/theme-context";

const Index = () => {
    const { isDarkMode } = useTheme();
    const [showAuth, setShowAuth] = useState(false);

    const tickerItems = [
        "Privacy First", "Adaptive Practice", "PDF Intelligence",
        "Code Co-pilot", "Vision AI", "Career Path",
    ];

    const features = [
        { number: "01", title: "Tech Interview Simulator", tag: "INTERVIEW", description: "Practice live tech interviews with an AI that adapts in real time. DSA, system design, behavioural — all simulated with structured, instant feedback." },
        { number: "02", title: "Resume Analyzer", tag: "CAREER", description: "Upload your resume. Get pinpoint feedback — ATS score, missing keywords, role-specific rewrites for engineering and management tracks." },
        { number: "03", title: "Career Predictor", tag: "SILENT", description: "Discover the career paths that fit you best — backed by deep ML on skills, projects and interviews." },
        { number: "04", title: "PDF Intelligence", tag: "READING", description: "Stop reading 100-page textbooks. Chat with them. Extract summaries, ask questions, find exact answers — instantly." },
        { number: "05", title: "Mock Tests", tag: "PRACTICE", description: "Generate adaptive MCQs from any topic or file. Quizzes that actually adjust to your weak spots." },
        { number: "06", title: "Code & GitHub", tag: "CODE", description: "Paste a GitHub link. We pull the raw code and help you debug, explain, refactor or rewrite — line by line." },
        { number: "07", title: "Vision AI & Generation", tag: "VISION", description: "Snap handwritten math for step-by-step solutions, or describe an idea and let AI render stunning visuals for your projects." },
        { number: "08", title: "Personalised Learning", tag: "MEMORY", description: "Your AI study companion remembers what you struggle with — and crafts custom plans that actually move the needle." },
    ];

    return (
        <div className={`min-h-screen ${isDarkMode ? "bg-[#121212] text-white custom-scrollbar" : "bg-[#fdfdfd] text-black light-scrollbar"} selection:bg-[var(--color-cyan)] selection:text-white transition-colors duration-500`}>
            <Navbar onAuthClick={() => setShowAuth(true)} />
            <AuthModal open={showAuth} onClose={() => setShowAuth(false)} />

            {/* ═══════════════════════════════════════
                SECTION 1 — HERO
            ═══════════════════════════════════════ */}
            <section id="hero" className={`relative min-h-screen flex flex-col justify-center overflow-hidden bg-mesh pt-20 ${isDarkMode ? "bg-[#121212]" : "bg-[#fdfdfd]"}`}>
                {/* Background Watermark */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0">
                    <span
                        className={`font-display font-bold ${isDarkMode ? "text-white/[0.03]" : "text-black/[0.02]"} leading-none transition-colors duration-500`}
                        style={{ fontSize: "clamp(8rem, 28vw, 36rem)", letterSpacing: "-0.04em" }}
                    >
                        RUDRAN
                    </span>
                </div>

                {/* Decorative Glows for Dark Mode */}
                {isDarkMode && (
                    <>
                        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-[var(--color-cyan)]/5 blur-[120px] rounded-full pointer-events-none" />
                        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-[var(--color-cyan)]/3 blur-[100px] rounded-full pointer-events-none" />
                    </>
                )}

                <div className="container mx-auto px-6 md:px-12 relative z-10">
                    <div className="flex flex-col items-center">
                        {/* Technical Label — 11px Bold, 0.1em tracking */}
                        <p
                            className={`font-sans font-bold uppercase ${isDarkMode ? "text-white/50" : "text-black/30"} mb-12`}
                            style={{ fontSize: "11px", letterSpacing: "0.1em" }}
                        >
                            EST • 2026 • INDIA
                        </p>

                        {/* Hero Headline — 72px Bold, -0.04em tracking */}
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 1 }}
                            className="flex items-baseline gap-1 md:gap-2 mb-20"
                            style={{ fontSize: "clamp(3.5rem, 9vw, 72px)", fontWeight: 700, letterSpacing: "-0.04em" }}
                        >
                            <span className={`font-display leading-none ${isDarkMode ? "text-white" : "text-black"}`}>RUDRA</span>
                            <span className="font-display leading-none italic text-[var(--color-cyan)]">NEX</span>

                        </motion.h1>

                        {/* Taglines - Technical Labels for num, Body Copy for text */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-20 w-full max-w-5xl mb-20">
                            {[
                                { num: "01", label: "INTELLIGENCE", text: "Systems that integrate seamlessly into the human experience." },
                                { num: "02", label: "PRECISION", text: "Clinical efficiency meets sophisticated AI architecture." },
                                { num: "03", label: "IMPACT", text: "High-performance tools for the world's leading minds." },
                            ].map((tag, i) => (
                                <div key={i} className="flex flex-col gap-4">
                                    {/* Technical Label — 11px Bold, 0.1em */}
                                    <span
                                        className="font-sans font-bold uppercase text-[var(--color-cyan)]"
                                        style={{ fontSize: "11px", letterSpacing: "0.1em" }}
                                    >
                                        {tag.num} — {tag.label}
                                    </span>
                                    {/* Body Copy — 16px Regular */}
                                    <p
                                        className={`font-sans font-normal ${isDarkMode ? "text-white/80" : "text-black/60"} leading-relaxed`}
                                        style={{ fontSize: "16px", letterSpacing: "normal" }}
                                    >
                                        {tag.text}
                                    </p>
                                </div>
                            ))}
                        </div>

                        {/* CTA Buttons — 14px Semi-Bold */}
                        <div className="flex flex-col sm:flex-row items-center gap-4 mb-24">
                            <button
                                onClick={() => setShowAuth(true)}
                                className={`px-12 py-4 font-sans font-semibold uppercase transition-all active:scale-95 flex items-center gap-3 ${isDarkMode ? "bg-white text-black hover:bg-white/90" : "bg-black text-white hover:bg-black/90"}`}
                                style={{ fontSize: "14px", letterSpacing: "0.05em" }}
                            >
                                Start Free <span>→</span>
                            </button>
                            <button
                                className={`px-12 py-4 border font-sans font-semibold uppercase transition-all active:scale-95 ${isDarkMode ? "border-white/30 text-white hover:bg-white/5" : "border-black/15 text-black hover:bg-black/5"}`}
                                style={{ fontSize: "14px", letterSpacing: "0.05em" }}
                            >
                                Watch Demo
                            </button>
                        </div>
                    </div>
                </div>

                {/* Footer Ticker — Technical Label style */}
                <div className={`absolute bottom-0 left-0 right-0 border-t py-5 backdrop-blur-sm overflow-hidden ${isDarkMode ? "border-white/5 bg-black/40" : "border-black/5 bg-white/60"}`}>
                    <div className="flex animate-infinite-scroll whitespace-nowrap items-center">
                        {[...tickerItems, ...tickerItems].map((item, i) => (
                            <div key={i} className="flex items-center gap-3 mx-10">
                                <svg width="8" height="8" viewBox="0 0 8 8" className="text-[var(--color-cyan)] fill-current shrink-0">
                                    <path d="M4 0L8 4L4 8L0 4Z" />
                                </svg>
                                <span
                                    className={`font-sans font-bold uppercase ${isDarkMode ? "text-white/20" : "text-black/35"}`}
                                    style={{ fontSize: "11px", letterSpacing: "0.1em" }}
                                >
                                    {item}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════
                SECTION 2 — CAPABILITIES & TOOLS
            ═══════════════════════════════════════ */}
            <section id="features" className={`${isDarkMode ? "bg-[#080808]" : "bg-[#f9f9f9]"} py-32 px-6 md:px-12 transition-colors duration-500`}>
                <div className="container mx-auto">
                    <div className="flex flex-col lg:flex-row gap-20 mb-24">
                        <div className="lg:w-1/4">
                            <div className="flex items-center gap-4 mb-8">
                                {/* Technical Label */}
                                <span
                                    className="font-sans font-bold uppercase text-[var(--color-cyan)]"
                                    style={{ fontSize: "11px", letterSpacing: "0.1em" }}
                                >
                                    § AI
                                </span>
                                <div className={`h-px flex-1 ${isDarkMode ? "bg-white/10" : "bg-black/10"}`} />
                            </div>
                            {/* Technical Label */}
                            <h2
                                className={`font-sans font-bold uppercase ${isDarkMode ? "text-white/25" : "text-black/35"} leading-relaxed`}
                                style={{ fontSize: "11px", letterSpacing: "0.1em" }}
                            >
                                Capabilities <br /> & Tools
                            </h2>
                        </div>
                        <div className="lg:w-3/4">
                            {/* Section Title — 48px Bold, -0.02em */}
                            <h3
                                className={`font-display font-bold leading-[0.9] mb-8 ${isDarkMode ? "text-white" : "text-black"}`}
                                style={{ fontSize: "clamp(2.5rem, 5vw, 48px)", letterSpacing: "-0.02em" }}
                            >
                                Eight quiet tools. <br />
                                <span className="italic text-[var(--color-cyan)]">One obvious advantage.</span>
                            </h3>
                            {/* Body Copy — 16px Regular */}
                            <p
                                className={`font-sans font-normal max-w-xl leading-relaxed ${isDarkMode ? "text-white/35" : "text-black/40"}`}
                                style={{ fontSize: "16px" }}
                            >
                                A complete, monochrome toolkit — engineered to make you study smarter, prepare faster, and ship better projects.
                            </p>
                        </div>
                    </div>

                    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 border-l border-t ${isDarkMode ? "border-white/5" : "border-black/5"}`}>
                        {features.map((feature, i) => (
                            <div key={i} className={`border-r border-b ${isDarkMode ? "border-white/5" : "border-black/5"}`}>
                                <FeatureCard {...feature} index={i} />
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════
                SECTION 3 — PHILOSOPHY
            ═══════════════════════════════════════ */}
            <section id="manifesto" className={`py-40 border-t ${isDarkMode ? "bg-[#050505] border-white/5" : "bg-[#fdfdfd] border-black/5"} transition-colors duration-500`}>
                <div className="container mx-auto px-6 md:px-12">
                    <div className="max-w-6xl">
                        {/* Technical Label */}
                        <span
                            className={`font-sans font-bold uppercase ${isDarkMode ? "text-white/20" : "text-black/30"} mb-12 block`}
                            style={{ fontSize: "11px", letterSpacing: "0.1em" }}
                        >
                            Our Philosophy
                        </span>

                        {/* Section Title — 48px Bold, -0.02em + Serif Italic Accent at 48px */}
                        <h2
                            className={`font-display font-bold leading-[1.1] mb-24 ${isDarkMode ? "text-white" : "text-black"}`}
                            style={{ fontSize: "clamp(2.5rem, 5vw, 48px)", letterSpacing: "-0.02em" }}
                        >
                            Intelligence should be{" "}
                            <span
                                className="font-serif italic font-normal text-[var(--color-cyan)]"
                                style={{ fontSize: "clamp(2.5rem, 5vw, 48px)", letterSpacing: "normal" }}
                            >
                                invisible
                            </span>{" "}
                            yet omnipresent.
                        </h2>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-end">
                            <div className="flex flex-col gap-10">
                                {/* Body Copy — 16px Regular */}
                                <p
                                    className={`font-sans font-normal leading-relaxed border-l-2 border-[var(--color-cyan)] pl-8 ${isDarkMode ? "text-white/60" : "text-black/75"}`}
                                    style={{ fontSize: "16px" }}
                                >
                                    At Rudranex, we believe the most powerful AI systems are those that integrate
                                    seamlessly into the human experience. We aren't just building tools; we are
                                    crafting the cognitive fabric of the next century.
                                </p>
                                {/* Body Copy */}
                                <p
                                    className={`font-sans font-normal leading-relaxed pl-8 ${isDarkMode ? "text-white/30" : "text-black/45"}`}
                                    style={{ fontSize: "16px" }}
                                >
                                    Through rigorous research and radical innovation, we are pushing the boundaries
                                    of what machines can perceive, understand, and create. Our manifesto is simple:{" "}
                                    <span className={`font-semibold ${isDarkMode ? "text-white/50" : "text-black/70"}`}>excellence without compromise.</span>
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-12 md:gap-20">
                                <div className="flex flex-col gap-3">
                                    {/* Hero Headline weight for stats */}
                                    <span
                                        className="font-display font-bold text-[var(--color-cyan)] leading-none"
                                        style={{ fontSize: "clamp(2.5rem, 5vw, 56px)", letterSpacing: "-0.04em" }}
                                    >
                                        99.8%
                                    </span>
                                    {/* Technical Label */}
                                    <span
                                        className={`font-sans font-bold uppercase ${isDarkMode ? "text-white/20" : "text-black/30"}`}
                                        style={{ fontSize: "11px", letterSpacing: "0.1em" }}
                                    >
                                        System Accuracy
                                    </span>
                                </div>
                                <div className="flex flex-col gap-3">
                                    <span
                                        className="font-display font-bold text-[var(--color-cyan)] leading-none"
                                        style={{ fontSize: "clamp(2.5rem, 5vw, 56px)", letterSpacing: "-0.04em" }}
                                    >
                                        10ms
                                    </span>
                                    <span
                                        className={`font-sans font-bold uppercase ${isDarkMode ? "text-white/20" : "text-black/30"}`}
                                        style={{ fontSize: "11px", letterSpacing: "0.1em" }}
                                    >
                                        Response Latency
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════
                SECTION 4 — GLOBAL ACCESS
            ═══════════════════════════════════════ */}
            <section id="cta" className={`relative py-40 overflow-hidden ${isDarkMode ? "bg-[#0a0a0a]" : "bg-[#f5f5f5]"} transition-colors duration-500`}>
                <div className={`absolute top-0 right-0 bottom-0 w-1/3 diagonal-lines z-0 border-l ${isDarkMode ? "opacity-30 border-white/5" : "opacity-60 border-black/5"}`} />

                <div className="container mx-auto px-6 md:px-12 relative z-10">
                    <div className="flex flex-col lg:flex-row items-start gap-12">
                        <div className="lg:w-1/4">
                            {/* Technical Label */}
                            <span
                                className={`font-sans font-bold uppercase ${isDarkMode ? "text-white/20" : "text-black/30"}`}
                                style={{ fontSize: "11px", letterSpacing: "0.1em" }}
                            >
                                § 04
                            </span>
                            <h3
                                className={`font-sans font-bold uppercase leading-relaxed mt-8 ${isDarkMode ? "text-white/25" : "text-black/40"}`}
                                style={{ fontSize: "11px", letterSpacing: "0.1em" }}
                            >
                                Global <br /> Access
                            </h3>
                            <div className={`h-px w-full max-w-[200px] mt-8 ${isDarkMode ? "bg-white/10" : "bg-black/10"}`} />
                        </div>

                        <div className="lg:w-3/4 max-w-2xl">
                            {/* Hero Headline — 72px Bold, -0.04em */}
                            <h2
                                className={`font-display font-bold leading-[0.9] mb-10 ${isDarkMode ? "text-white" : "text-black"}`}
                                style={{ fontSize: "clamp(3rem, 7vw, 72px)", letterSpacing: "-0.04em" }}
                            >
                                Ready to <br />
                                <span
                                    className={`font-serif italic font-normal ${isDarkMode ? "text-white/10" : "text-black/15"}`}
                                    style={{ letterSpacing: "normal" }}
                                >
                                    level up?
                                </span>
                            </h2>
                            {/* Body Copy — 16px Regular */}
                            <p
                                className={`font-sans font-normal mb-12 leading-relaxed ${isDarkMode ? "text-white/40" : "text-black/55"}`}
                                style={{ fontSize: "16px" }}
                            >
                                Join thousands of students already moving faster, sharper, and quieter — with Rudranex AI.
                            </p>
                            {/* Button — 14px Semi-Bold */}
                            <button
                                onClick={() => setShowAuth(true)}
                                className={`px-12 py-4 font-sans font-semibold uppercase transition-all active:scale-95 flex items-center gap-3 ${isDarkMode ? "bg-white text-black hover:bg-white/90" : "bg-black text-white hover:bg-black/90"}`}
                                style={{ fontSize: "14px", letterSpacing: "0.05em" }}
                            >
                                Get Started — Free <span>⚡</span>
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default Index;
