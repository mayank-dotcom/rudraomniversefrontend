"use client"

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import { useTheme } from "@/lib/theme-context";
import { getPublicSiteSettings } from "@/lib/chat-api";

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
        <div className={`min-h-screen ${isDarkMode ? "bg-[#0a0a0a] text-white" : "bg-white text-black"} selection:bg-white selection:text-black`}>
            <Navbar />

            <div className="pt-40 pb-32 px-6 md:px-20 max-w-4xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    <span className={`text-[10px] font-mono tracking-[0.3em] ${isDarkMode ? "text-white/40" : "text-black/40"}`}>§ 02</span>
                    <h1 className="text-5xl md:text-7xl font-display font-black tracking-tighter mt-6 mb-8">
                        Privacy <span className="font-serif italic font-normal">Policy</span>
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
