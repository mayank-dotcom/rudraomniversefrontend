"use client"

import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/ui/Navbar";
import { Check, Zap, Shield, Cpu, Code, Brain, Target, Image as ImageIcon, Rocket, BookOpen, GraduationCap, FileText, Bug, Battery, Terminal, Building2, Users, Loader2 } from "lucide-react";
import { getPlansList, Plan } from "@/lib/chat-api";
import { useState, useEffect } from "react";
import { toast } from "sonner";

const Pricing = () => {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchPlans = async () => {
            try {
                const data = await getPlansList();
                if (data.success && data.plans) {
                    // Map API data to include all fields
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
        if (planName.toLowerCase().includes('basic')) return BookOpen;
        if (planName.toLowerCase().includes('agenc')) return Building2;
        return Zap;
    };

    const getPlanTag = (planName: string) => {
        if (planName.toLowerCase().includes('basic')) return 'BASIC';
        if (planName.toLowerCase().includes('pro student')) return 'BEST VALUE';
        if (planName.toLowerCase().includes('developer')) return 'MOST POPULAR';
        if (planName.toLowerCase().includes('agenc')) return 'ENTERPRISE';
        return '';
    };

    const getPlanColor = (planName: string) => {
        if (planName.toLowerCase().includes('pro')) return 'gold';
        if (planName.toLowerCase().includes('developer')) return 'white';
        return 'white';
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-white selection:text-black flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-white/50" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-white selection:text-black">
            <Navbar />

            <div className="pt-32 pb-20 px-6 container mx-auto">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row gap-12 mb-24 px-4 md:px-10">
                    <div className="md:w-1/3">
                        <div className="flex items-center gap-3 mb-6">
                            <span className="text-[10px] font-mono tracking-[0.3em] text-white">§ 04</span>
                            <div className="h-[1px] flex-1 bg-white/20" />
                        </div>
                        <h3 className="text-[10px] font-mono uppercase tracking-[0.3em] text-white/40">
                            Subscription <br /> & Access
                        </h3>
                    </div>
                    <div className="md:w-2/3">
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-6xl md:text-8xl font-display font-bold tracking-tighter leading-[0.9] mb-10"
                        >
                            Quiet power. <br />
                            <span className="font-serif italic font-normal text-white/80">Tailored</span>
                            <span className="font-black"> plans.</span>
                        </motion.h1>
                        <p className="text-white/50 text-lg md:text-xl max-w-2xl leading-relaxed">
                            Choose the level of intelligence that fits your workflow. From late-night study sessions to building the next big thing.
                        </p>
                    </div>
                </div>

                {/* Pricing Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-white/10 border border-white/10 overflow-hidden">
                    {plans.filter(plan => (plan.price_inr || plan.price) > 0).map((plan, i) => {
                        const Icon = getPlanIcon(plan.plan_name || '');
                        const tag = getPlanTag(plan.plan_name || '');
                        const color = getPlanColor(plan.plan_name || '');
                        const isHighlight = plan.plan_name?.toLowerCase().includes('pro');
                        
                        return (
                            <motion.div
                                key={plan.id || i}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, delay: i * 0.1 }}
                                className={`group relative bg-[#0d0d0d] hover:bg-[#111] transition-all duration-500 flex flex-col p-8 md:p-12 overflow-hidden ${isHighlight ? `ring-2 ring-[#D4AF37] shadow-[0_0_60px_-15px_rgba(212,175,55,0.3)] z-10 bg-[#0f0f0f]` : 'border-r border-white/5'}`}
                            >
                                {/* Shine Effect */}
                                {color === 'gold' && (
                                    <motion.div
                                        initial={{ x: '-150%', skewX: -45 }}
                                        animate={{ x: '150%' }}
                                        transition={{
                                            repeat: Infinity,
                                            duration: 3,
                                            repeatDelay: 4,
                                            ease: "linear"
                                        }}
                                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent z-20 pointer-events-none"
                                    />
                                )}
                                {/* Tag */}
                                <div className="flex justify-between items-start mb-16">
                                    <span className={`font-mono text-[10px] uppercase tracking-[0.4em] transition-colors ${color === 'gold' ? 'text-[#D4AF37] font-bold' : 'text-white/30 group-hover:text-white/60'}`}>
                                        {tag}
                                    </span>
                                    {isHighlight && (
                                        <div className={`h-2 w-2 rotate-45 animate-pulse ${color === 'gold' ? 'bg-[#D4AF37] shadow-[0_0_10px_#D4AF37]' : 'bg-white'}`} />
                                    )}
                                </div>

                                {/* Plan Name & Price */}
                                <div className="mb-12">
                                    <h2 className="font-orbitron text-2xl font-bold text-white mb-4 tracking-tight">
                                        {plan.plan_name}
                                    </h2>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-5xl font-display font-bold tracking-tighter">₹{plan.price_inr || plan.price}</span>
                                        <span className="text-white/40 font-mono text-xs uppercase tracking-widest">/mo</span>
                                    </div>
                                </div>

                                {/* Features - Show all fields */}
                                <div className="flex-1 space-y-4 mb-16">
                                    <div className={`h-[1px] w-8 mb-8 ${color === 'gold' ? 'bg-[#D4AF37]/40' : 'bg-white/20'}`} />
                                    
                                    <div className="flex gap-4">
                                        <div className="mt-1 shrink-0">
                                            <Icon className={`h-4 w-4 transition-colors ${color === 'gold' ? 'text-[#D4AF37]' : 'text-white/40 group-hover:text-white/80'}`} />
                                        </div>
                                        <p className="text-white/50 text-sm leading-relaxed font-light group-hover:text-white/70 transition-colors">
                                            Daily Chat: {plan.daily_chat_limit || 0}
                                        </p>
                                    </div>
                                    
                                    <div className="flex gap-4">
                                        <div className="mt-1 shrink-0">
                                            <Code className={`h-4 w-4 transition-colors ${color === 'gold' ? 'text-[#D4AF37]' : 'text-white/40 group-hover:text-white/80'}`} />
                                        </div>
                                        <p className="text-white/50 text-sm leading-relaxed font-light group-hover:text-white/70 transition-colors">
                                            Daily Coding: {plan.daily_coding_limit || 0}
                                        </p>
                                    </div>
                                    
                                    <div className="flex gap-4">
                                        <div className="mt-1 shrink-0">
                                            <ImageIcon className={`h-4 w-4 transition-colors ${color === 'gold' ? 'text-[#D4AF37]' : 'text-white/40 group-hover:text-white/80'}`} />
                                        </div>
                                        <p className="text-white/50 text-sm leading-relaxed font-light group-hover:text-white/70 transition-colors">
                                            Daily Vision: {plan.daily_vision_limit || 0}
                                        </p>
                                    </div>
                                    
                                    <div className="flex gap-4">
                                        <div className="mt-1 shrink-0">
                                            <ImageIcon className={`h-4 w-4 transition-colors ${color === 'gold' ? 'text-[#D4AF37]' : 'text-white/40 group-hover:text-white/80'}`} />
                                        </div>
                                        <p className="text-white/50 text-sm leading-relaxed font-light group-hover:text-white/70 transition-colors">
                                            Monthly Images: {plan.monthly_image_limit || 0}
                                        </p>
                                    </div>
                                    
                                    <div className="flex gap-4">
                                        <div className="mt-1 shrink-0">
                                            <Zap className={`h-4 w-4 transition-colors ${color === 'gold' ? 'text-[#D4AF37]' : 'text-white/40 group-hover:text-white/80'}`} />
                                        </div>
                                        <p className="text-white/50 text-sm leading-relaxed font-light group-hover:text-white/70 transition-colors">
                                            Monthly Flux: {plan.monthly_flux_limit || 0}
                                        </p>
                                    </div>
                                    
                                    <div className="flex gap-4">
                                        <div className="mt-1 shrink-0">
                                            <Zap className={`h-4 w-4 transition-colors ${color === 'gold' ? 'text-[#D4AF37]' : 'text-white/40 group-hover:text-white/80'}`} />
                                        </div>
                                        <p className="text-white/50 text-sm leading-relaxed font-light group-hover:text-white/70 transition-colors">
                                            Daily TTS: {plan.daily_tts_limit || 0}
                                        </p>
                                    </div>
                                    
                                    <div className="flex gap-4">
                                        <div className="mt-1 shrink-0">
                                            <Zap className={`h-4 w-4 transition-colors ${color === 'gold' ? 'text-[#D4AF37]' : 'text-white/40 group-hover:text-white/80'}`} />
                                        </div>
                                        <p className="text-white/50 text-sm leading-relaxed font-light group-hover:text-white/70 transition-colors">
                                            Daily STT: {plan.daily_stt_limit || 0}
                                        </p>
                                    </div>
                                </div>

                                {/* CTA */}
                                <button className={`w-full py-5 text-[10px] font-mono font-bold uppercase tracking-[0.3em] transition-all active:scale-[0.98] mb-12 ${isHighlight ? 'bg-[#D4AF37] text-black hover:bg-[#C5A028]' : 'bg-transparent border border-white/20 text-white hover:bg-white/5'}`}>
                                    {plan.price_inr === '0' || plan.price === 0 ? 'Current Plan' : 'Select Plan'} →
                                </button>
                            </motion.div>
                        );
                    })}
                </div>

                {/* FAQ / Simple Footer */}
                <div className="mt-32 text-center">
                    <p className="text-white/30 font-mono text-[10px] uppercase tracking-[0.3em]">
                        All plans include core AI access, privacy-first processing, and 24/7 support.
                    </p>
                </div>
            </div>

            {/* Footer */}
            <footer className="py-20 border-t border-white/5 mt-20">
                <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-12 text-muted-foreground">
                    <div className="flex items-baseline gap-2">
                        <span className="font-display font-black text-2xl tracking-tighter text-white">RUDRANEX</span>
                        <span className="font-serif text-2xl">ai</span>
                    </div>
                    <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/40">
                        © 2026 Rudranex AI Systems
                    </p>
                </div>
            </footer>
        </div>
    );
};

export default Pricing;
