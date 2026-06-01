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
  { title: "1. Scope of Refunds", content: "We offer refunds for subscription purchases and digital assets under specific terms, such as service disruption, technical billing errors, or accidental duplicate transactions reported within 7 days of purchase." },
  { title: "2. Ineligibility Criteria", content: "Refunds are generally not issued for fully or partially consumed AI credits or generation tokens, active custom plans that have been fully set up, or accounts flagged and suspended for violating our Terms of Service." },
  { title: "3. Processing Timeframe", content: "Once a refund is approved by our billing department, it will be processed and credited back to your original payment method (credit card, UPI, bank account) within 5 to 7 business days." },
  { title: "4. Subscription Cancellations", content: "You may cancel your auto-renewing subscriptions at any time through the billing tab in your user profile dashboard. Upon cancellation, your premium access will remain active until the end of your current billing period." },
  { title: "5. Billing Queries & Support", content: "For any queries, chargeback disputes, or to submit a refund request, please email our support team directly at billing@rudranex.ai with your registered email and transaction ID." }
];

const DEFAULT_LAST_UPDATED = "June 2026";

interface RefundData {
  lastUpdated?: string;
  sections?: { title: string; content: string }[];
}

function parseRefund(value: string): RefundData {
  try {
    const parsed = JSON.parse(value);
    if (parsed.sections || parsed.lastUpdated) return parsed;
  } catch {}
  return { lastUpdated: DEFAULT_LAST_UPDATED, sections: DEFAULT_SECTIONS };
}

export default function Refund() {
    const { isDarkMode } = useTheme();
    const [raw, setRaw] = useState("");
    const data = useMemo(() => parseRefund(raw), [raw]);

    useEffect(() => {
        getPublicSiteSettings().then(res => {
            const setting = res.settings?.find(s => s.key === "refund_policy");
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
                            § 04 — LEGAL
                        </span>

                        {/* Hero Headline */}
                        <h1 
                            className="font-display font-bold leading-none mb-12"
                            style={{ fontSize: "clamp(3.5rem, 8vw, 72px)", letterSpacing: "-0.04em" }}
                        >
                            Refund <br />
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
