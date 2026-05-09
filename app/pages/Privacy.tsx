"use client"

import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import { useTheme } from "@/lib/theme-context";

export default function Privacy() {
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
                    <span className={`text-[10px] font-mono tracking-[0.3em] ${isDarkMode ? "text-white/40" : "text-black/40"}`}>§ 02</span>
                    <h1 className="text-5xl md:text-7xl font-display font-black tracking-tighter mt-6 mb-8">
                        Privacy <span className="font-serif italic font-normal">Policy</span>
                    </h1>
                    <div className={`h-px w-full ${isDarkMode ? "bg-white/10" : "bg-black/10"} mb-12`} />

                    <div className={`space-y-8 text-base md:text-lg leading-relaxed ${isDarkMode ? "text-white/70" : "text-black/70"}`}>
                        <p className="font-medium">Last updated: May 2026</p>

                        <h2 className={`text-lg font-display font-bold tracking-tight mt-10 ${isDarkMode ? "text-white" : "text-black"}`}>1. Information We Collect</h2>
                        <p>We collect only the data necessary to provide our services: account information (name, email), chat messages and uploaded files for AI processing, and basic usage analytics to improve performance.</p>

                        <h2 className={`text-lg font-display font-bold tracking-tight mt-10 ${isDarkMode ? "text-white" : "text-black"}`}>2. How We Use Your Data</h2>
                        <p>Your data is used exclusively to process AI requests, generate responses, and improve your experience. We do not sell your data to third parties. Chat history is stored to provide session continuity and can be deleted at any time.</p>

                        <h2 className={`text-lg font-display font-bold tracking-tight mt-10 ${isDarkMode ? "text-white" : "text-black"}`}>3. Data Security</h2>
                        <p>We use industry-standard encryption for data in transit and at rest. API keys and authentication tokens are stored securely and never exposed client-side beyond what is necessary.</p>

                        <h2 className={`text-lg font-display font-bold tracking-tight mt-10 ${isDarkMode ? "text-white" : "text-black"}`}>4. Your Rights</h2>
                        <p>You have the right to access, correct, or delete your personal data at any time. Contact us at privacy@rudranex.ai for any data-related requests.</p>

                        <h2 className={`text-lg font-display font-bold tracking-tight mt-10 ${isDarkMode ? "text-white" : "text-black"}`}>5. Contact</h2>
                        <p>For questions about this policy, reach out to privacy@rudranex.ai.</p>
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
