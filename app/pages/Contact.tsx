"use client"

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/ui/Footer";
import { useTheme } from "@/lib/theme-context";
import { getPublicSiteSettings } from "@/lib/chat-api";
import { Mail, MessageSquare, Send, ArrowLeft } from "lucide-react";

const DEFAULT_PARAGRAPHS = ["Have a question, suggestion, or want to partner with us? We'd love to hear from you. Feel free to reach out through the form below, or email us directly. Our team typically responds within 24 hours."];
const DEFAULT_EMAIL = "hello@rudranex.ai";
const DEFAULT_RESPONSE_TIME = "Usually within 24 hours";

interface ContactData {
  paragraphs?: string[];
  email?: string;
  responseTime?: string;
}

function parseContact(value: string): ContactData {
  try {
    const parsed = JSON.parse(value);
    if (parsed.paragraphs || parsed.email || parsed.responseTime) return parsed;
    if (parsed.description) return { paragraphs: [parsed.description], email: parsed.email, responseTime: parsed.responseTime };
  } catch {}
  if (value) return { paragraphs: value.split("\n\n").filter(Boolean) };
  return {};
}

export default function Contact() {
    const { isDarkMode } = useTheme();
    const [raw, setRaw] = useState("");
    const data = useMemo(() => parseContact(raw), [raw]);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [sent, setSent] = useState(false);

    useEffect(() => {
        getPublicSiteSettings().then(res => {
            const setting = res.settings?.find(s => s.key === "contact_info");
            if (setting?.value) setRaw(setting.value);
        }).catch(() => {});
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSent(true);
        setName("");
        setEmail("");
        setMessage("");
    };

    return (
        <div className={`min-h-screen ${isDarkMode ? "bg-[#050308] text-white" : "bg-[#fdfdfd] text-black"} selection:bg-[var(--color-cyan)] selection:text-white`}>
            <Navbar visible={true} />

            <section className="pt-48 pb-32 px-6 md:px-12 bg-mesh">
                <div className="container mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="max-w-6xl"
                    >
                        {/* Technical Label */}
                        <span 
                            className={`font-sans font-bold uppercase ${isDarkMode ? "text-white/20" : "text-black/30"} block mb-8`}
                            style={{ fontSize: "11px", letterSpacing: "0.1em" }}
                        >
                            § 04 — CONNECT
                        </span>

                        {/* Hero Headline */}
                        <h1 
                            className="font-display font-bold leading-none mb-12"
                            style={{ fontSize: "clamp(3.5rem, 8vw, 72px)", letterSpacing: "-0.04em" }}
                        >
                            Get in <br />
                            <span className="font-serif italic font-normal text-black dark:text-white">Touch.</span>
                        </h1>

                        <div className={`h-px w-full ${isDarkMode ? "bg-white/10" : "bg-black/10"} mb-20`} />

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
                            <div className="space-y-12">
                                <div className={`space-y-6 text-base leading-relaxed ${isDarkMode ? "text-white/50" : "text-black/60"}`}>
                                    {(data.paragraphs || DEFAULT_PARAGRAPHS).map((p, i) => (
                                        <p key={i} className={i === 0 ? "font-semibold text-xl leading-snug" : "font-medium"}>{p}</p>
                                    ))}
                                </div>

                                <div className="space-y-8 pt-8">
                                    <div className="flex items-center gap-6 group">
                                        <div className={`h-12 w-12 rounded-full border flex items-center justify-center transition-colors group-hover:border-[var(--brand-accent)] ${isDarkMode ? "border-white/10" : "border-black/10"}`}>
                                            <Mail className="h-5 w-5 text-[var(--brand-accent)]" />
                                        </div>
                                        <div>
                                            <p 
                                                className={`font-sans font-bold uppercase tracking-widest ${isDarkMode ? "text-white/20" : "text-black/30"}`}
                                                style={{ fontSize: "10px" }}
                                            >
                                                Email Address
                                            </p>
                                            <p className="text-lg font-medium">{data.email || DEFAULT_EMAIL}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-6 group">
                                        <div className={`h-12 w-12 rounded-full border flex items-center justify-center transition-colors group-hover:border-[var(--brand-accent)] ${isDarkMode ? "border-white/10" : "border-black/10"}`}>
                                            <MessageSquare className="h-5 w-5 text-[var(--brand-accent)]" />
                                        </div>
                                        <div>
                                            <p 
                                                className={`font-sans font-bold uppercase tracking-widest ${isDarkMode ? "text-white/20" : "text-black/30"}`}
                                                style={{ fontSize: "10px" }}
                                            >
                                                Response Time
                                            </p>
                                            <p className="text-lg font-medium">{data.responseTime || DEFAULT_RESPONSE_TIME}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className={`p-10 md:p-14 border ${isDarkMode ? "bg-black/40 border-white/10" : "bg-white border-black/10"}`}>
                                {sent ? (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="text-center py-10"
                                    >
                                        <div className="h-16 w-16 rounded-full bg-[var(--brand-accent)]/10 flex items-center justify-center mx-auto mb-8">
                                            <Send className="h-8 w-8 text-[var(--brand-accent)]" />
                                        </div>
                                        <h3 className="font-display font-bold text-2xl mb-4 tracking-tighter uppercase">Message Sent</h3>
                                        <p className={`text-[14px] leading-relaxed mb-10 ${isDarkMode ? "text-white/50" : "text-black/50"}`}>
                                            Thank you for reaching out. We'll get back to you shortly.
                                        </p>
                                        <button
                                            onClick={() => setSent(false)}
                                            className={`px-10 py-4 font-sans font-bold uppercase tracking-widest text-[11px] transition-all active:scale-95 ${isDarkMode ? "bg-white text-black" : "bg-black text-white"}`}
                                        >
                                            Send Another
                                        </button>
                                    </motion.div>
                                ) : (
                                    <form onSubmit={handleSubmit} className="space-y-6">
                                        <div className="space-y-1">
                                            <label className={`text-[10px] font-sans font-bold uppercase tracking-widest ${isDarkMode ? "text-white/30" : "text-black/30"}`}>Your Name</label>
                                            <input
                                                type="text"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                required
                                                className={`w-full px-5 py-4 text-[13px] font-sans border focus:outline-none focus:border-[var(--color-cyan)] transition-all ${
                                                    isDarkMode ? "bg-white/5 border-white/5 text-white" : "bg-black/5 border-black/5 text-black"
                                                }`}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className={`text-[10px] font-sans font-bold uppercase tracking-widest ${isDarkMode ? "text-white/30" : "text-black/30"}`}>Email Address</label>
                                            <input
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                required
                                                className={`w-full px-5 py-4 text-[13px] font-sans border focus:outline-none focus:border-[var(--color-cyan)] transition-all ${
                                                    isDarkMode ? "bg-white/5 border-white/5 text-white" : "bg-black/5 border-black/5 text-black"
                                                }`}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className={`text-[10px] font-sans font-bold uppercase tracking-widest ${isDarkMode ? "text-white/30" : "text-black/30"}`}>Your Message</label>
                                            <textarea
                                                rows={5}
                                                value={message}
                                                onChange={(e) => setMessage(e.target.value)}
                                                required
                                                className={`w-full px-5 py-4 text-[13px] font-sans border focus:outline-none focus:border-[var(--color-cyan)] transition-all resize-none ${
                                                    isDarkMode ? "bg-white/5 border-white/5 text-white" : "bg-black/5 border-black/5 text-black"
                                                }`}
                                            />
                                        </div>
                                        <button
                                            type="submit"
                                            className={`w-full py-5 font-sans font-bold uppercase tracking-[0.2em] text-[11px] transition-all active:scale-95 mt-4 ${
                                                isDarkMode ? "bg-white text-black hover:bg-white/90" : "bg-black text-white hover:bg-black/90"
                                            }`}
                                        >
                                            SEND MESSAGE
                                        </button>
                                    </form>
                                )}
                            </div>
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
