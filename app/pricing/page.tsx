"use client"

import { motion } from "framer-motion";
import Navbar from "@/components/ui/Navbar";
import { Check, Zap, Shield, Cpu, Code, Brain, Target, Image as ImageIcon, Rocket, BookOpen, GraduationCap, FileText, Bug, Battery, Terminal, Building2, Users } from "lucide-react";

const plans = [
    {
        name: "Basic Student",
        price: "99",
        period: "/mo",
        description: "The best AI study buddy for school and college students.",
        features: [
            { text: "Your 24/7 personal AI tutor. Ace assignments and crack exams effortlessly!", icon: GraduationCap },
            { text: "The ultimate study hack! Generate smart notes and instant answers in seconds.", icon: Zap },
            { text: "Say goodbye to study stress! Perfect for daily homework, projects, and exam prep.", icon: BookOpen },
            { text: "Unlock premium AI power. Your smart companion for top grades and quick learning.", icon: Rocket }
        ],
        tokens: "4,200",
        images: "50",
        personas: "5",
        tag: "BASIC",
        color: "white"
    },
    {
        name: "Pro Student",
        price: "199",
        period: "/mo",
        description: "Superfast AI power for complex homework and coding problems.",
        features: [
            { text: "Superfast AI Power: Solve complex homework, coding problems, and assignments instantly.", icon: Rocket },
            { text: "Smart PDF Intelligence: Upload heavy textbooks, chat with them, and extract summaries.", icon: FileText },
            { text: "Instant Mock Tests: Generate custom MCQs on any topic or PDF.", icon: Target },
            { text: "Vision & Image Gen: Create stunning AI images and build custom AI personas.", icon: ImageIcon },
            { text: "Priority Access: Enjoy the fastest server response times and a seamless experience.", icon: Zap }
        ],
        tokens: "10,000",
        images: "110",
        personas: "10",
        tag: "BEST VALUE",
        color: "white",
        highlight: true,
        highlightColor: "gold"
    },
    {
        name: "Developer pro",
        price: "499",
        period: "/mo",
        description: "Advanced AI for full-stack developers and heavy coding sessions.",
        features: [
            { text: "Advanced Coding AI: Tackle complex algorithms and build full-stack apps effortlessly.", icon: Code },
            { text: "GitHub Repo Analyzer: Paste any GitHub link to analyze and debug entire codebases.", icon: Code },
            { text: "Expert Debugging: Rapidly identify errors, refactor messy code, and optimize projects.", icon: Bug },
            { text: "Massive Token Capacity: Designed specifically for analyzing large code files and long scripts.", icon: Battery },
            { text: "Ultra-Fast Performance: Top-tier priority server access for zero-lag responses.", icon: Terminal }
        ],
        tokens: "100,000",
        images: "300",
        personas: "25",
        tag: "MOST POPULAR",
        color: "white",
        highlight: true,
        highlightColor: "gold"
    },
    {
        name: "Agencies / Heavy Duty",
        price: null,
        description: "Custom solutions for large-scale operations and high-volume needs.",
        features: [
            { text: "Custom Enterprise Grade AI: Dedicated compute and custom fine-tuned models.", icon: Building2 },
            { text: "Team Management: Multi-seat access, shared workspaces and advanced collaboration.", icon: Users },
            { text: "Unlimited Potential: Custom token limits and image generation quotas.", icon: Battery },
            { text: "Dedicated Support: 24/7 technical support and custom integration assistance.", icon: Shield },
            { text: "Security First: Enhanced data privacy, SSO, and on-premise deployment options.", icon: Shield }
        ],
        tokens: "CUSTOM",
        images: "UNLIMITED",
        personas: "CUSTOM",
        tag: "ENTERPRISE",
        color: "white",
        cta: "Contact Sales"
    }
];

const Pricing = () => {
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
                    {plans.map((plan, i) => (
                        <motion.div
                            key={plan.name}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: i * 0.1 }}
                            className={`group relative bg-[#0d0d0d] hover:bg-[#111] transition-all duration-500 flex flex-col p-8 md:p-12 overflow-hidden ${plan.highlight ? `ring-2 ${plan.highlightColor === 'gold' ? 'ring-[#D4AF37] shadow-[0_0_60px_-15px_rgba(212,175,55,0.3)]' : 'ring-white/20'} z-10 bg-[#0f0f0f]` : 'border-r border-white/5'}`}
                        >
                            {/* Shine Effect */}
                            {plan.highlightColor === 'gold' && (
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
                                <span className={`font-mono text-[10px] uppercase tracking-[0.4em] transition-colors ${plan.highlightColor === 'gold' ? 'text-[#D4AF37] font-bold' : 'text-white/30 group-hover:text-white/60'}`}>
                                    {plan.tag}
                                </span>
                                {plan.highlight && (
                                    <div className={`h-2 w-2 rotate-45 animate-pulse ${plan.highlightColor === 'gold' ? 'bg-[#D4AF37] shadow-[0_0_10px_#D4AF37]' : 'bg-white'}`} />
                                )}
                            </div>

                            {/* Plan Name & Price */}
                            <div className="mb-12">
                                <h2 className="font-orbitron text-2xl font-bold text-white mb-4 tracking-tight">
                                    {plan.name}
                                </h2>
                                {plan.price ? (
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-5xl font-display font-bold tracking-tighter">₹{plan.price}</span>
                                        <span className="text-white/40 font-mono text-xs uppercase tracking-widest">{plan.period}</span>
                                    </div>
                                ) : (
                                    <div className="h-[60px] flex items-center">
                                        <span className="text-2xl font-display font-bold tracking-tighter text-white/20 uppercase tracking-[0.2em]">Custom</span>
                                    </div>
                                )}
                            </div>

                            {/* Features */}
                            <div className="flex-1 space-y-6 mb-16">
                                <div className={`h-[1px] w-8 mb-8 ${plan.highlightColor === 'gold' ? 'bg-[#D4AF37]/40' : 'bg-white/20'}`} />
                                {plan.features.map((feature, idx) => (
                                    <div key={idx} className="flex gap-4">
                                        <div className="mt-1 shrink-0">
                                            <feature.icon className={`h-4 w-4 transition-colors ${plan.highlightColor === 'gold' ? 'text-[#D4AF37]' : 'text-white/40 group-hover:text-white/80'}`} />
                                        </div>
                                        <p className="text-white/50 text-sm leading-relaxed font-light group-hover:text-white/70 transition-colors">
                                            {feature.text}
                                        </p>
                                    </div>
                                ))}
                            </div>

                            {/* CTA */}
                            <button className={`w-full py-5 text-[10px] font-mono font-bold uppercase tracking-[0.3em] transition-all active:scale-[0.98] mb-12 ${plan.highlight || plan.cta === "Contact Sales"
                                ? (plan.highlightColor === 'gold' ? 'bg-[#D4AF37] text-black hover:bg-[#C5A028]' : 'bg-white text-black hover:bg-white/90')
                                : 'bg-transparent border border-white/20 text-white hover:bg-white/5'
                                }`}>
                                {plan.cta || "Select Plan"} →
                            </button>

                            {/* Metadata Footer */}
                            <div className={`pt-8 border-t space-y-4 ${plan.highlightColor === 'gold' ? 'border-[#D4AF37]/20' : 'border-white/5'}`}>
                                <div className="flex justify-between items-center text-[9px] font-mono uppercase tracking-[0.2em] text-white/30">
                                    <span>Tokens</span>
                                    <span className="text-white/60">{plan.tokens}</span>
                                </div>
                                <div className="flex justify-between items-center text-[9px] font-mono uppercase tracking-[0.2em] text-white/30">
                                    <span>Images</span>
                                    <span className="text-white/60">{plan.images}</span>
                                </div>
                                <div className="flex justify-between items-center text-[9px] font-mono uppercase tracking-[0.2em] text-white/30">
                                    <span>AI Personas</span>
                                    <span className="text-white/60">{plan.personas}</span>
                                </div>
                            </div>
                        </motion.div>
                    ))}
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
