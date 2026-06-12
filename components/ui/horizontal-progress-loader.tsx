"use client";

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Loader2, Sparkles, Brain, FileText, Database, ArrowRight, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

type LoadingState = {
    text: string;
    icon?: any;
};

interface HorizontalProgressLoaderProps {
    loadingStates: LoadingState[];
    loading?: boolean;
    duration?: number;
    loop?: boolean;
    title?: string;
    subtitle?: string;
}

const DefaultIcon = Zap;

/**
 * Horizontal progress bar loader with a fully opaque black background.
 * Designed for fullscreen post-action moments (e.g. interview feedback generation).
 */
export const HorizontalProgressLoader = ({
    loadingStates,
    loading,
    duration = 1800,
    loop = true,
    title = "Analyzing Your Interview",
    subtitle = "Hold tight while our AI engine prepares your performance report",
}: HorizontalProgressLoaderProps) => {
    const [currentState, setCurrentState] = useState(0);
    const total = loadingStates.length;
    const progress = total > 0 ? ((currentState + 1) / total) * 100 : 0;

    useEffect(() => {
        if (!loading) {
            setCurrentState(0);
            return;
        }
        const timeout = setTimeout(() => {
            setCurrentState((prevState) =>
                loop
                    ? prevState === loadingStates.length - 1
                        ? 0
                        : prevState + 1
                    : Math.min(prevState + 1, loadingStates.length - 1)
            );
        }, duration);
        return () => clearTimeout(timeout);
    }, [currentState, loading, loop, loadingStates.length, duration]);

    return (
        <AnimatePresence mode="wait">
            {loading && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    className="w-full h-full fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black"
                >
                    {/* Subtle radial glow accent */}
                    <div
                        className="absolute inset-0 pointer-events-none opacity-40"
                        style={{
                            backgroundImage:
                                "radial-gradient(circle 600px at 50% 50%, rgba(57, 255, 20, 0.06), transparent 60%)"
                        }}
                    />

                    <div className="relative w-full max-w-2xl px-6 sm:px-8 z-10">
                        {/* Header */}
                        <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                            className="flex flex-col items-center text-center mb-10"
                        >
                            <div className="flex items-center gap-2 mb-4">
                                <span className="h-1.5 w-1.5 rounded-full bg-[#39FF14] shadow-[0_0_8px_#39FF14] animate-pulse" />
                                <span className="text-[9px] font-mono uppercase tracking-[0.3em] text-white/40">
                                    Processing
                                </span>
                                <span className="h-1.5 w-1.5 rounded-full bg-[#39FF14] shadow-[0_0_8px_#39FF14] animate-pulse" />
                            </div>
                            <h2 className="text-3xl sm:text-4xl font-sans font-bold tracking-tight text-white mb-3">
                                {title}
                            </h2>
                            <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-white/35 max-w-md">
                                {subtitle}
                            </p>
                        </motion.div>

                        {/* Horizontal Progress Bar */}
                        <div className="mb-8">
                            <div className="relative h-2 w-full rounded-full overflow-hidden bg-white/[0.04] border border-white/[0.06]">
                                <motion.div
                                    key={currentState}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progress}%` }}
                                    transition={{ duration: duration / 1000, ease: "easeInOut" }}
                                    className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#39FF14]/70 via-[#39FF14] to-[#39FF14]"
                                    style={{
                                        boxShadow: "0 0 18px rgba(57, 255, 20, 0.6), 0 0 4px rgba(57, 255, 20, 0.9)"
                                    }}
                                />
                                {/* Trailing shimmer pulse */}
                                <motion.div
                                    key={`shimmer-${currentState}`}
                                    initial={{ x: "-100%" }}
                                    animate={{ x: "200%" }}
                                    transition={{ duration: duration / 1000 * 0.9, ease: "easeInOut", repeat: Infinity }}
                                    className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                                />
                            </div>
                            <div className="flex items-center justify-between mt-2">
                                <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-white/35">
                                    Step {String(currentState + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
                                </span>
                                <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-[#39FF14]/80 font-bold">
                                    {Math.round(progress)}%
                                </span>
                            </div>
                        </div>

                        {/* Step Pills (horizontal) */}
                        <div className="flex items-stretch gap-2 overflow-x-auto pb-2 scrollbar-hide">
                            {loadingStates.map((state, index) => {
                                const isComplete = index < currentState || (!loop && index === currentState);
                                const isActive = index === currentState;
                                const Icon = state.icon || DefaultIcon;
                                return (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05, duration: 0.3 }}
                                        className={cn(
                                            "flex-1 min-w-[140px] flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all duration-500",
                                            isActive
                                                ? "border-[#39FF14]/40 bg-[#39FF14]/[0.04] shadow-[0_0_20px_rgba(57,255,20,0.08)]"
                                                : isComplete
                                                    ? "border-white/10 bg-white/[0.02]"
                                                    : "border-white/[0.05] bg-white/[0.01] opacity-40"
                                        )}
                                    >
                                        <div
                                            className={cn(
                                                "h-8 w-8 rounded-xl flex items-center justify-center transition-all",
                                                isActive
                                                    ? "bg-[#39FF14] text-black shadow-[0_0_12px_rgba(57,255,20,0.6)]"
                                                    : isComplete
                                                        ? "bg-white/10 text-white/80"
                                                        : "bg-white/[0.04] text-white/30"
                                            )}
                                        >
                                            {isActive ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : isComplete ? (
                                                <Check className="h-4 w-4" strokeWidth={3} />
                                            ) : (
                                                <Icon className="h-4 w-4" />
                                            )}
                                        </div>
                                        <p
                                            className={cn(
                                                "text-[9px] font-mono uppercase tracking-[0.1em] text-center leading-tight transition-colors",
                                                isActive
                                                    ? "text-white font-bold"
                                                    : isComplete
                                                        ? "text-white/60"
                                                        : "text-white/30"
                                            )}
                                        >
                                            {state.text}
                                        </p>
                                    </motion.div>
                                );
                            })}
                        </div>

                        {/* Bottom helper text */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5, duration: 0.5 }}
                            className="mt-10 flex items-center justify-center gap-2 text-[9px] font-mono uppercase tracking-[0.25em] text-white/25"
                        >
                            <span className="h-px w-8 bg-white/10" />
                            <span>Do not close this window</span>
                            <span className="h-px w-8 bg-white/10" />
                        </motion.div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default HorizontalProgressLoader;
