"use client"

import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import { useTheme } from "@/lib/theme-context";
import { Mail, MessageSquare, Send } from "lucide-react";

export default function Contact() {
    const { isDarkMode } = useTheme();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [sent, setSent] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSent(true);
        setName("");
        setEmail("");
        setMessage("");
    };

    return (
        <div className={`min-h-screen ${isDarkMode ? "bg-[#0a0a0a] text-white" : "bg-white text-black"} selection:bg-white selection:text-black`}>
            <Navbar />

            <div className="pt-40 pb-32 px-6 md:px-20 max-w-4xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    <span className={`text-[10px] font-mono tracking-[0.3em] ${isDarkMode ? "text-white/40" : "text-black/40"}`}>§ 04</span>
                    <h1 className="text-5xl md:text-7xl font-display font-black tracking-tighter mt-6 mb-8">
                        Contact <span className="font-serif italic font-normal">Us</span>
                    </h1>
                    <div className={`h-px w-full ${isDarkMode ? "bg-white/10" : "bg-black/10"} mb-12`} />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                        <div className={`space-y-6 text-base leading-relaxed ${isDarkMode ? "text-white/70" : "text-black/70"}`}>
                            <p className="font-medium text-lg">
                                Have a question, suggestion, or want to partner with us? We'd love to hear from you.
                            </p>

                            <div className="flex items-center gap-4 mt-10">
                                <div className={`h-10 w-10 rounded-full border flex items-center justify-center ${isDarkMode ? "border-white/20" : "border-black/20"}`}>
                                    <Mail className="h-4 w-4" />
                                </div>
                                <div>
                                    <p className={`text-[9px] font-mono uppercase tracking-widest ${isDarkMode ? "text-white/30" : "text-black/30"}`}>Email</p>
                                    <p className="text-sm">hello@rudranex.ai</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className={`h-10 w-10 rounded-full border flex items-center justify-center ${isDarkMode ? "border-white/20" : "border-black/20"}`}>
                                    <MessageSquare className="h-4 w-4" />
                                </div>
                                <div>
                                    <p className={`text-[9px] font-mono uppercase tracking-widest ${isDarkMode ? "text-white/30" : "text-black/30"}`}>Response Time</p>
                                    <p className="text-sm">Usually within 24 hours</p>
                                </div>
                            </div>
                        </div>

                        <div>
                            {sent ? (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className={`p-8 border text-center ${isDarkMode ? "border-white/10 bg-white/5" : "border-black/10 bg-black/5"}`}
                                >
                                    <div className="text-4xl mb-4">✓</div>
                                    <h3 className="font-display font-bold text-lg mb-2">Message Sent</h3>
                                    <p className={`text-sm ${isDarkMode ? "text-white/50" : "text-black/50"}`}>We'll get back to you within 24 hours.</p>
                                    <button
                                        onClick={() => setSent(false)}
                                        className={`mt-6 text-[10px] font-mono uppercase tracking-widest ${isDarkMode ? "text-white/40 hover:text-white" : "text-black/40 hover:text-black"} transition`}
                                    >
                                        Send Another
                                    </button>
                                </motion.div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div>
                                        <input
                                            type="text"
                                            placeholder="Your Name"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            required
                                            className={`w-full p-4 text-sm font-mono border bg-transparent focus:outline-none transition ${isDarkMode ? "border-white/10 focus:border-white/30 text-white" : "border-black/10 focus:border-black/30 text-black"}`}
                                        />
                                    </div>
                                    <div>
                                        <input
                                            type="email"
                                            placeholder="Your Email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            className={`w-full p-4 text-sm font-mono border bg-transparent focus:outline-none transition ${isDarkMode ? "border-white/10 focus:border-white/30 text-white" : "border-black/10 focus:border-black/30 text-black"}`}
                                        />
                                    </div>
                                    <div>
                                        <textarea
                                            placeholder="Your Message"
                                            rows={5}
                                            value={message}
                                            onChange={(e) => setMessage(e.target.value)}
                                            required
                                            className={`w-full p-4 text-sm font-mono border bg-transparent focus:outline-none transition resize-none ${isDarkMode ? "border-white/10 focus:border-white/30 text-white" : "border-black/10 focus:border-black/30 text-black"}`}
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        className="w-full px-8 py-4 bg-white text-black border-2 border-black text-[10px] font-mono font-bold uppercase tracking-widest hover:bg-white/90 transition-all active:scale-95 flex items-center justify-center gap-3"
                                    >
                                        <Send className="h-3.5 w-3.5" />
                                        Send Message
                                    </button>
                                </form>
                            )}
                        </div>
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
