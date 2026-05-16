"use client"

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import { useTheme } from "@/lib/theme-context";
import { getPublicSiteSettings } from "@/lib/chat-api";
import { ArrowLeft } from "lucide-react";

const DEFAULT_SECTIONS: { title: string; content: string }[] = [
  { title: "1. Acceptance of Terms", content: "By accessing or using Rudranex AI, you agree to be bound by these Terms of Service. If you do not agree, do not use our services." },
  { title: "2. Description of Service", content: "Rudranex AI provides AI-powered tools for students including chat-based tutoring, interview simulation, resume analysis, PDF intelligence, and vision-based problem solving. These tools are provided \"as is\" without warranty of any kind." },
  { title: "3. User Obligations", content: "You agree to use the service responsibly and not to misuse the AI systems for any illegal, harmful, or unauthorized purposes. You are responsible for maintaining the confidentiality of your account credentials." },
  { title: "4. Limitation of Liability", content: "Rudranex AI shall not be liable for any indirect, incidental, or consequential damages arising from the use of our services. Our total liability is limited to the amount paid by you in the past 12 months." },
  { title: "5. Changes to Terms", content: "We reserve the right to modify these terms at any time. Users will be notified of material changes via email or through the platform." }
];

const DEFAULT_LAST_UPDATED = "May 2026";

interface TermsData {
  lastUpdated?: string;
  sections?: { title: string; content: string }[];
}

function parseTerms(value: string): TermsData {
  try {
    const parsed = JSON.parse(value);
    if (parsed.sections || parsed.lastUpdated) return parsed;
  } catch {}
  return { lastUpdated: DEFAULT_LAST_UPDATED, sections: DEFAULT_SECTIONS };
}

export default function Terms() {
    const { isDarkMode } = useTheme();
    const [raw, setRaw] = useState("");
    const data = useMemo(() => parseTerms(raw), [raw]);

    useEffect(() => {
        getPublicSiteSettings().then(res => {
            const setting = res.settings?.find(s => s.key === "terms_conditions");
            if (setting?.value) setRaw(setting.value);
        }).catch(() => {});
    }, []);

    return (
        <div className={`min-h-screen ${isDarkMode ? "bg-[#0a0a0a] text-white" : "bg-[#fdfdfd] text-black"} selection:bg-[var(--color-cyan)] selection:text-white`}>
            <Navbar />

            <section className="pt-48 pb-32 px-6 md:px-12">
                <div className="container mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="max-w-4xl"
                    >
                        {/* Technical Label */}
                        <span 
                            className={`font-sans font-bold uppercase ${isDarkMode ? "text-white/20" : "text-black/30"} block mb-8`}
                            style={{ fontSize: "11px", letterSpacing: "0.1em" }}
                        >
                            § 03 — LEGAL
                        </span>

                        {/* Hero Headline */}
                        <h1 
                            className="font-display font-bold leading-none mb-12"
                            style={{ fontSize: "clamp(3.5rem, 8vw, 72px)", letterSpacing: "-0.04em" }}
                        >
                            Terms of <br />
                            <span className="italic text-[var(--color-cyan)]">Service.</span>
                        </h1>

                        <div className={`h-px w-full ${isDarkMode ? "bg-white/10" : "bg-black/10"} mb-12`} />

                        <p 
                            className={`font-sans font-bold uppercase mb-16 ${isDarkMode ? "text-white/30" : "text-black/40"}`}
                            style={{ fontSize: "11px", letterSpacing: "0.1em" }}
                        >
                            Last updated: {data.lastUpdated}
                        </p>

                        <div className="space-y-16">
                            {(data.sections || []).map((s, i) => (
                                <div key={i} className="max-w-2xl">
                                    <h2 
                                        className="font-display font-bold mb-6 tracking-tight uppercase"
                                        style={{ fontSize: "20px", letterSpacing: "0.05em" }}
                                    >
                                        {s.title}
                                    </h2>
                                    <p 
                                        className={`font-sans font-normal leading-relaxed ${isDarkMode ? "text-white/50" : "text-black/60"}`}
                                        style={{ fontSize: "16px" }}
                                    >
                                        {s.content}
                                    </p>
                                </div>
                            ))}
                        </div>

                        <div className="mt-24">
                            <Link 
                                href="/" 
                                className={`font-sans font-bold uppercase tracking-widest flex items-center gap-2 transition-all hover:gap-4 ${isDarkMode ? "text-white/40 hover:text-white" : "text-black/40 hover:text-black"}`}
                                style={{ fontSize: "11px" }}
                            >
                                <ArrowLeft className="h-3 w-3" /> Back to Home
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </section>

            <Footer />
        </div>
    );
}
