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
  { title: "1. Information We Collect", content: "We collect only the data necessary to provide our services: account information (name, email), chat messages and uploaded files for AI processing, and basic usage analytics to improve performance." },
  { title: "2. How We Use Your Data", content: "Your data is used exclusively to process AI requests, generate responses, and improve your experience. We do not sell your data to third parties. Chat history is stored to provide session continuity and can be deleted at any time." },
  { title: "3. Data Security", content: "We use industry-standard encryption for data in transit and at rest. API keys and authentication tokens are stored securely and never exposed client-side beyond what is necessary." },
  { title: "4. Your Rights", content: "You have the right to access, correct, or delete your personal data at any time. Contact us at privacy@rudranex.ai for any data-related requests." },
  { title: "5. Contact", content: "For questions about this policy, reach out to privacy@rudranex.ai." }
];

const DEFAULT_LAST_UPDATED = "May 2026";

interface PrivacyData {
  lastUpdated?: string;
  sections?: { title: string; content: string }[];
}

function parsePrivacy(value: string): PrivacyData {
  try {
    const parsed = JSON.parse(value);
    if (parsed.sections || parsed.lastUpdated) return parsed;
  } catch {}
  return { lastUpdated: DEFAULT_LAST_UPDATED, sections: DEFAULT_SECTIONS };
}

export default function Privacy() {
    const { isDarkMode } = useTheme();
    const [raw, setRaw] = useState("");
    const data = useMemo(() => parsePrivacy(raw), [raw]);

    useEffect(() => {
        getPublicSiteSettings().then(res => {
            const setting = res.settings?.find(s => s.key === "privacy_policy");
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
                            § 02 — LEGAL
                        </span>

                        {/* Hero Headline */}
                        <h1 
                            className="font-display font-bold leading-none mb-12"
                            style={{ fontSize: "clamp(3.5rem, 8vw, 72px)", letterSpacing: "-0.04em" }}
                        >
                            Privacy <br />
                            <span className="italic text-[var(--color-cyan)]">Policy.</span>
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
