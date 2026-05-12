"use client"

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import { useTheme } from "@/lib/theme-context";
import { getPublicSiteSettings } from "@/lib/chat-api";

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
        <div className={`min-h-screen ${isDarkMode ? "bg-[#0a0a0a] text-white" : "bg-white text-black"} selection:bg-white selection:text-black`}>
            <Navbar />

            <div className="pt-40 pb-32 px-6 md:px-20 max-w-4xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    <span className={`text-[10px] font-mono tracking-[0.3em] ${isDarkMode ? "text-white/40" : "text-black/40"}`}>§ 03</span>
                    <h1 className="text-5xl md:text-7xl font-display font-black tracking-tighter mt-6 mb-8">
                        Terms of <span className="font-serif italic font-normal">Service</span>
                    </h1>
                    <div className={`h-px w-full ${isDarkMode ? "bg-white/10" : "bg-black/10"} mb-12`} />

                    <p className={`text-sm font-mono mb-10 ${isDarkMode ? "text-white/40" : "text-black/50"}`}>Last updated: {data.lastUpdated}</p>

                    <div className={`space-y-10 text-base md:text-lg leading-relaxed ${isDarkMode ? "text-white/70" : "text-black/70"}`}>
                        {(data.sections || []).map((s, i) => (
                            <div key={i}>
                                <h2 className={`text-lg font-display font-bold tracking-tight mb-4 ${isDarkMode ? "text-white" : "text-black"}`}>{s.title}</h2>
                                <p>{s.content}</p>
                            </div>
                        ))}
                    </div>

                    <div className="mt-16">
                        <Link to="/" className={`text-[10px] font-mono uppercase tracking-widest ${isDarkMode ? "text-white/40 hover:text-white" : "text-black/40 hover:text-black"} transition`}>
                            ← Back to Home
                        </Link>
                    </div>
                </motion.div>
            </div>

            <Footer />
        </div>
    );
}
