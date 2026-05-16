"use client"

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import { useTheme } from "@/lib/theme-context";
import { getPublicSiteSettings } from "@/lib/chat-api";

const DEFAULT_ELEMENTS: { type: string; content: string }[] = [
  { type: "paragraph", content: "We believe the most powerful AI systems are those that integrate seamlessly into the human experience." },
  { type: "paragraph", content: "Rudranex is an AI co-pilot built exclusively for students. From cracking tech interviews to mastering 100-page textbooks, we provide a quiet, precise intelligence that adapts to your learning journey." },
  { type: "paragraph", content: "Our suite of tools — including the Tech Interview Simulator, Resume Analyzer, PDF Intelligence, Vision AI, and more — are designed to work together as a monochrome toolkit. No distractions. No noise. Just focused, effective learning." },
  { type: "paragraph", content: "Founded in 2026, we are a small team of engineers, designers, and educators committed to reimagining how students interact with AI." }
];

function parseAbout(value: string): { type: string; content: string }[] {
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed.elements)) return parsed.elements;
    if (Array.isArray(parsed.sections)) return parsed.sections.map((s: string) => ({ type: 'paragraph', content: s }));
  } catch {}
  return value ? value.split("\n\n").filter(Boolean).map((p: string) => ({ type: 'paragraph', content: p })) : DEFAULT_ELEMENTS;
}

export default function About() {
    const { isDarkMode } = useTheme();
    const [raw, setRaw] = useState("");
    const elements = useMemo(() => parseAbout(raw), [raw]);

    useEffect(() => {
        getPublicSiteSettings().then(res => {
            const setting = res.settings?.find(s => s.key === "about_us");
            if (setting?.value) setRaw(setting.value);
        }).catch(() => {});
    }, []);

    return (
        <div className={`min-h-screen ${isDarkMode ? "bg-[#0a0a0a] text-white" : "bg-[#fdfdfd] text-black"} selection:bg-[var(--color-cyan)] selection:text-white`}>
            <Navbar />

            <section className="pt-48 pb-32 px-6 md:px-12 bg-mesh">
                <div className="container mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="max-w-4xl"
                    >
                        {/* Technical Label — 11px Bold, 0.1em tracking */}
                        <span 
                            className={`font-sans font-bold uppercase ${isDarkMode ? "text-white/20" : "text-black/30"} block mb-8`}
                            style={{ fontSize: "11px", letterSpacing: "0.1em" }}
                        >
                            § 01 — COMPANY
                        </span>

                        {/* Hero Headline — 72px Bold, -0.04em tracking */}
                        <h1 
                            className="font-display font-bold leading-none mb-12"
                            style={{ fontSize: "clamp(3.5rem, 8vw, 72px)", letterSpacing: "-0.04em" }}
                        >
                            The Quiet <br />
                            <span className="italic text-[var(--color-cyan)]">Intelligence.</span>
                        </h1>

                        <div className={`h-px w-full ${isDarkMode ? "bg-white/10" : "bg-black/10"} mb-20`} />

                        <div className="space-y-12">
                            {elements.map((el, i) => {
                                if (el.type === 'heading') return (
                                    <h2 
                                        key={i} 
                                        className="font-display font-bold tracking-tight mb-8"
                                        style={{ fontSize: "clamp(1.5rem, 4vw, 32px)", letterSpacing: "-0.02em" }}
                                    >
                                        {el.content}
                                    </h2>
                                );
                                
                                // Body Copy — 16px Regular
                                return (
                                    <p 
                                        key={i} 
                                        className={`font-sans font-normal leading-relaxed max-w-2xl ${isDarkMode ? "text-white/60" : "text-black/70"}`}
                                        style={{ fontSize: "18px", lineHeight: "1.7" }}
                                    >
                                        {el.content}
                                    </p>
                                );
                            })}
                        </div>

                        <div className="mt-20">
                            {/* Button — 14px Semi-Bold */}
                            <Link href="/#cta" className={`inline-block px-12 py-5 font-sans font-semibold uppercase transition-all active:scale-95 flex items-center gap-3 w-fit ${isDarkMode ? "bg-white text-black hover:bg-white/90" : "bg-black text-white hover:bg-black/90"}`}
                                style={{ fontSize: "14px", letterSpacing: "0.05em" }}
                            >
                                Start Your Journey <span>→</span>
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </section>

            <Footer />
        </div>
    );
}
