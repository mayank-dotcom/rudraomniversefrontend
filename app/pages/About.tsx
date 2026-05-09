"use client"

import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import { useTheme } from "@/lib/theme-context";

export default function About() {
    const { isDarkMode } = useTheme();

    return (
        <div className={`min-h-screen ${isDarkMode ? "bg-[#0a0a0a] text-white" : "bg-white text-black"} selection:bg-white selection:text-black`}>
            <Navbar />

            <div className="pt-40 pb-32 px-6 md:px-20 max-w-4xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    <span className={`text-[10px] font-mono tracking-[0.3em] ${isDarkMode ? "text-white/40" : "text-black/40"}`}>§ 01</span>
                    <h1 className="text-5xl md:text-7xl font-display font-black tracking-tighter mt-6 mb-8">
                        About <span className="font-serif italic font-normal">Rudranex</span>
                    </h1>
                    <div className={`h-px w-full ${isDarkMode ? "bg-white/10" : "bg-black/10"} mb-12`} />

                    <div className={`space-y-8 text-base md:text-lg leading-relaxed ${isDarkMode ? "text-white/70" : "text-black/70"}`}>
                        <p className="font-medium text-xl">
                            We believe the most powerful AI systems are those that integrate seamlessly into the human experience.
                        </p>
                        <p>
                            Rudranex is an AI co-pilot built exclusively for students. From cracking tech interviews to mastering 100-page textbooks, we provide a quiet, precise intelligence that adapts to your learning journey.
                        </p>
                        <p>
                            Our suite of tools — including the Tech Interview Simulator, Resume Analyzer, PDF Intelligence, Vision AI, and more — are designed to work together as a monochrome toolkit. No distractions. No noise. Just focused, effective learning.
                        </p>
                        <p>
                            Founded in 2026, we are a small team of engineers, designers, and educators committed to reimagining how students interact with AI.
                        </p>
                    </div>

                    <div className="mt-16">
                        <Link to="/chat" className="inline-block px-8 py-4 bg-white text-black border-2 border-black text-[10px] font-mono font-bold uppercase tracking-widest hover:bg-white/90 transition-all active:scale-95">
                            Start Free →
                        </Link>
                    </div>
                </motion.div>
            </div>

            <Footer />
        </div>
    );
}
