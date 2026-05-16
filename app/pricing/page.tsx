"use client"

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import { ThemeProvider } from "@/lib/theme-context";
import { Check, Zap, Code, Image as ImageIcon, GraduationCap, Building2, Loader2, ArrowRight } from "lucide-react";
import { getPlansList, Plan } from "@/lib/chat-api";
import { toast } from "sonner";
import { useTheme } from "@/lib/theme-context";

const PricingContent = () => {
    const { isDarkMode } = useTheme();
    const [plans, setPlans] = useState<Plan[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchPlans = async () => {
            try {
                const data = await getPlansList();
                if (data.success && data.plans) {
                    const mappedPlans = data.plans.map((plan: any) => ({
                        ...plan,
                        name: plan.plan_name || 'Unnamed Plan',
                        price: plan.price_inr || 0,
                        tokens: plan.daily_chat_limit || 0,
                        images: plan.monthly_image_limit || 0,
                        personas: plan.daily_coding_limit || 0,
                        daily_vision_limit: plan.daily_vision_limit || 0,
                        monthly_flux_limit: plan.monthly_flux_limit || 0,
                        daily_tts_limit: plan.daily_tts_limit || 0,
                        daily_stt_limit: plan.daily_stt_limit || 0
                    }));
                    setPlans(mappedPlans);
                }
            } catch (err) {
                console.error("Failed to fetch plans:", err);
                toast.error("Failed to load plans. Please refresh the page.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchPlans();
    }, []);

    const getPlanIcon = (planName: string) => {
        if (planName.toLowerCase().includes('student')) return GraduationCap;
        if (planName.toLowerCase().includes('developer')) return Code;
        if (planName.toLowerCase().includes('agenc')) return Building2;
        return Zap;
    };

    const getPlanTag = (planName: string) => {
        if (planName.toLowerCase().includes('basic')) return 'BASIC';
        if (planName.toLowerCase().includes('pro student')) return 'BEST VALUE';
        if (planName.toLowerCase().includes('developer')) return 'MOST POPULAR';
        if (planName.toLowerCase().includes('agenc')) return 'ENTERPRISE';
        return 'STANDARD';
    };

    if (isLoading) {
        return (
            <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? "bg-[#0a0a0a]" : "bg-[#fdfdfd]"}`}>
                <Loader2 className={`h-8 w-8 animate-spin ${isDarkMode ? "text-white/20" : "text-black/20"}`} />
            </div>
        );
    }

    return (
        <div className={`min-h-screen ${isDarkMode ? "bg-[#0a0a0a] text-white" : "bg-[#fdfdfd] text-black"} selection:bg-[var(--color-cyan)] selection:text-white`}>
            <Navbar />

            <section className="relative pt-48 pb-20 px-6 md:px-12 bg-mesh">
                <div className="container mx-auto">
                    <div className="flex flex-col lg:flex-row gap-20 mb-32">
                        <div className="lg:w-1/4">
                            {/* Technical Label */}
                            <span 
                                className={`font-sans font-bold uppercase ${isDarkMode ? "text-white/20" : "text-black/30"} block mb-8`}
                                style={{ fontSize: "11px", letterSpacing: "0.1em" }}
                            >
                                § 04 — ACCESS
                            </span>
                            <h2 
                                className={`font-sans font-bold uppercase leading-relaxed ${isDarkMode ? "text-white/30" : "text-black/40"}`}
                                style={{ fontSize: "11px", letterSpacing: "0.1em" }}
                            >
                                Subscription <br /> & Plans
                            </h2>
                        </div>
                        <div className="lg:w-3/4">
                            {/* Hero Headline — 72px Bold, -0.04em */}
                            <h1 
                                className="font-display font-bold leading-[0.9] mb-12"
                                style={{ fontSize: "clamp(3.5rem, 9vw, 72px)", letterSpacing: "-0.04em" }}
                            >
                                Quiet power. <br />
                                <span className="italic text-[var(--color-cyan)]">Tailored access.</span>
                            </h1>
                            {/* Body Copy — 16px Regular */}
                            <p 
                                className={`max-w-xl leading-relaxed ${isDarkMode ? "text-white/50" : "text-black/50"}`}
                                style={{ fontSize: "16px" }}
                            >
                                Choose the level of intelligence that fits your workflow. From late-night study sessions to building the next big thing.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 border-l border-t border-black/5 dark:border-white/5">
                        {plans.map((plan, i) => {
                            const Icon = getPlanIcon(plan.plan_name || '');
                            const tag = getPlanTag(plan.plan_name || '');
                            const isPro = plan.plan_name?.toLowerCase().includes('pro') || plan.plan_name?.toLowerCase().includes('developer');

                            return (
                                <motion.div
                                    key={plan.id || i}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.8, delay: i * 0.1 }}
                                    className={`relative p-10 flex flex-col border-r border-b border-black/5 dark:border-white/5 group transition-all duration-500 ${isPro ? (isDarkMode ? "bg-[#0d0d0d]" : "bg-white") : (isDarkMode ? "bg-transparent" : "bg-transparent")}`}
                                >
                                    {/* Plan Tag — Technical Label style */}
                                    <div className="flex justify-between items-center mb-16">
                                        <span 
                                            className={`font-sans font-bold uppercase ${isPro ? "text-[var(--color-cyan)]" : (isDarkMode ? "text-white/20" : "text-black/30")}`}
                                            style={{ fontSize: "11px", letterSpacing: "0.1em" }}
                                        >
                                            {tag}
                                        </span>
                                        {isPro && <div className="h-1.5 w-1.5 rounded-full bg-[var(--color-cyan)] animate-pulse" />}
                                    </div>

                                    {/* Plan Title & Price */}
                                    <div className="mb-12">
                                        <h3 
                                            className="font-display font-semibold uppercase mb-4 tracking-tight"
                                            style={{ fontSize: "20px" }}
                                        >
                                            {plan.plan_name}
                                        </h3>
                                        <div className="flex items-baseline gap-2">
                                            <span 
                                                className="font-display font-bold leading-none tracking-tighter"
                                                style={{ fontSize: "40px" }}
                                            >
                                                ₹{plan.price_inr || plan.price}
                                            </span>
                                            <span className={`font-sans font-bold uppercase tracking-widest ${isDarkMode ? "text-white/20" : "text-black/30"}`} style={{ fontSize: "10px" }}>/mo</span>
                                        </div>
                                    </div>

                                    {/* Features Grid */}
                                    <div className="flex-1 space-y-6 mb-16">
                                        {[
                                            { icon: Zap, label: "Chat Limit", value: plan.daily_chat_limit },
                                            { icon: Code, label: "Coding Limit", value: plan.daily_coding_limit },
                                            { icon: ImageIcon, label: "Vision Limit", value: plan.daily_vision_limit },
                                            { icon: ImageIcon, label: "Monthly Images", value: plan.monthly_image_limit },
                                        ].map((feature, idx) => (
                                            <div key={idx} className="flex items-center gap-4">
                                                <feature.icon className={`h-4 w-4 shrink-0 ${isDarkMode ? "text-white/20" : "text-black/20"}`} />
                                                <p className={`text-[13px] font-medium ${isDarkMode ? "text-white/40" : "text-black/50"}`}>
                                                    <span className={isDarkMode ? "text-white/60" : "text-black/70"}>{feature.label}:</span> {feature.value || 0}
                                                </p>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Button — 14px Semi-Bold */}
                                    <button 
                                        className={`w-full py-4 font-sans font-bold uppercase tracking-widest transition-all active:scale-95 ${isPro ? (isDarkMode ? "bg-white text-black hover:bg-white/90" : "bg-black text-white hover:bg-black/90") : (isDarkMode ? "border border-white/10 text-white hover:bg-white/5" : "border border-black/10 text-black hover:bg-black/5")}`}
                                        style={{ fontSize: "11px", letterSpacing: "0.2em" }}
                                    >
                                        {plan.price_inr === 0 ? "Current Plan" : "Select Plan"}
                                    </button>
                                </motion.div>
                            )
                        })}
                    </div>
                    
                    <div className="mt-32 text-center">
                        <p 
                            className={`font-sans font-bold uppercase ${isDarkMode ? "text-white/20" : "text-black/20"}`}
                            style={{ fontSize: "11px", letterSpacing: "0.1em" }}
                        >
                            All plans include core AI access, privacy-first processing, and 24/7 priority support.
                        </p>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default function Pricing() {
    return (
        <ThemeProvider>
            <PricingContent />
        </ThemeProvider>
    );
}
