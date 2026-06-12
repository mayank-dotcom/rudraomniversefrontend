"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    X, Clock, Monitor, Smile, MessageSquare, Flame, Briefcase, Sliders,
    BookOpen, Terminal, Cpu, Sparkles, Volume2, Mic, ChevronRight,
    Zap, Brain, Code2, ServerCog, UserCheck, Swords
} from "lucide-react";

interface InterviewPrepModalProps {
    isOpen: boolean;
    onClose: () => void;
    onStart: (topic: string, duration: number, difficulty: string, vibe: string, focus: string) => void;
    isDarkMode: boolean;
}

const DIFFICULTY_OPTIONS = [
    {
        id: "easy" as const,
        label: "Easy",
        desc: "Foundational concepts & basic problem-solving.",
        Icon: Sparkles,
    },
    {
        id: "medium" as const,
        label: "Medium",
        desc: "Standard interview depth for working professionals.",
        Icon: Sliders,
    },
    {
        id: "hard" as const,
        label: "Hard",
        desc: "Deep system architecture & edge-case scenarios.",
        Icon: Flame,
    },
];

const FOCUS_OPTIONS = [
    {
        id: "conceptual" as const,
        label: "Conceptual",
        desc: "Theory, design paradigms, fundamental principles.",
        Icon: Brain,
    },
    {
        id: "coding" as const,
        label: "Coding",
        desc: "Algorithms, data structures, logic verbalization.",
        Icon: Code2,
    },
    {
        id: "architecture" as const,
        label: "Architecture",
        desc: "System design, scalability, distributed systems.",
        Icon: ServerCog,
    },
];

const VIBE_OPTIONS = [
    {
        id: "friendly" as const,
        label: "Friendly",
        desc: "Warm, encouraging, and supportive tone.",
        Icon: UserCheck,
    },
    {
        id: "standard" as const,
        label: "Standard",
        desc: "Balanced, neutral, professional interviewer.",
        Icon: MessageSquare,
    },
    {
        id: "savage" as const,
        label: "Savage",
        desc: "Brutal, hyper-critical, pressure-testing grill.",
        Icon: Swords,
    },
];

export default function InterviewPrepModal({ isOpen, onClose, onStart, isDarkMode }: InterviewPrepModalProps) {
    const [topic, setTopic] = useState("");
    const [duration, setDuration] = useState(45);
    const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
    const [vibe, setVibe] = useState<"friendly" | "standard" | "savage">("standard");
    const [focus, setFocus] = useState<"conceptual" | "coding" | "architecture">("coding");
    const [accent, setAccent] = useState<string>("");
    const [topicFocused, setTopicFocused] = useState(false);
    const [durationFocused, setDurationFocused] = useState(false);
    const [hoveredCard, setHoveredCard] = useState<string | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    useEffect(() => {
        if (typeof window !== "undefined") {
            setAccent(localStorage.getItem("rudranex_accent") || "");
        }
    }, [isOpen]);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        setMousePos({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        });
    };

    const handleStart = () => {
        if (!topic.trim()) return;
        onStart(topic.trim(), duration, difficulty, vibe, focus);
    };

    const renderOptionCard = <T extends string>(
        option: { id: T; label: string; desc: string; Icon: any },
        current: T,
        onSelect: (id: T) => void,
        groupKey: string
    ) => {
        const isSelected = current === option.id;
        const isHovered = hoveredCard === `${groupKey}-${option.id}`;
        const accentRgb = accent ? hexToRgb(accent) : "0, 221, 221";

        return (
            <motion.button
                key={option.id}
                type="button"
                onClick={() => onSelect(option.id)}
                onMouseEnter={() => setHoveredCard(`${groupKey}-${option.id}`)}
                onMouseLeave={() => setHoveredCard(null)}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                className={`group relative flex flex-col text-left p-4 rounded-2xl border transition-all duration-300 overflow-hidden ${isSelected
                    ? (isDarkMode ? "border-white/30 bg-white/[0.06]" : "border-black/30 bg-black/[0.04]")
                    : (isDarkMode ? "border-white/[0.07] bg-white/[0.015] hover:border-white/20 hover:bg-white/[0.03]" : "border-black/[0.08] bg-black/[0.01] hover:border-black/25 hover:bg-black/[0.03]")
                    }`}
            >
                {/* Subtle scanline overlay */}
                <div
                    className="absolute inset-0 opacity-[0.025] group-hover:opacity-[0.06] transition-opacity duration-500 pointer-events-none"
                    style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.08) 50%, transparent 50%), linear-gradient(90deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01), rgba(255,255,255,0.04))", backgroundSize: "100% 4px, 4px 100%" }}
                />

                {/* Proximity spotlight */}
                {(isHovered || isSelected) && (
                    <div
                        className="absolute inset-0 pointer-events-none transition-opacity duration-300"
                        style={{
                            background: `radial-gradient(circle 200px at ${isHovered ? "50%" : "20%"} 0%, ${isSelected ? `rgba(${accentRgb}, 0.12)` : `rgba(${accentRgb}, 0.06)`}, transparent 70%)`
                        }}
                    />
                )}

                {/* Selection indicator */}
                <div className="flex items-center justify-between mb-2 relative z-10">
                    <div className={`h-9 w-9 rounded-xl flex items-center justify-center transition-all duration-300 ${isSelected
                        ? (accent ? "text-black" : (isDarkMode ? "bg-white text-black" : "bg-black text-white"))
                        : (isDarkMode ? "bg-white/[0.04] text-white/60 group-hover:text-white group-hover:bg-white/[0.08]" : "bg-black/[0.04] text-black/60 group-hover:text-black group-hover:bg-black/[0.08]")
                        }`}
                    style={isSelected && accent ? { backgroundColor: accent, color: isDarkMode ? "#000" : "#fff" } : undefined}
                    >
                        <option.Icon className="h-4 w-4" />
                    </div>
                    <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center transition-all ${isSelected
                        ? (accent ? "border-transparent" : (isDarkMode ? "border-white bg-white" : "border-black bg-black"))
                        : (isDarkMode ? "border-white/15" : "border-black/15")
                        }`}
                    style={isSelected && accent ? { backgroundColor: accent, borderColor: accent } : undefined}
                    >
                        {isSelected && (
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="h-1.5 w-1.5 rounded-full"
                                style={{ backgroundColor: accent ? (isDarkMode ? "#000" : "#fff") : (isDarkMode ? "#000" : "#fff") }}
                            />
                        )}
                    </div>
                </div>

                <p className={`text-sm font-sans font-bold tracking-tight mb-1 relative z-10 ${isDarkMode ? "text-white" : "text-black"}`}>
                    {option.label}
                </p>
                <p className={`text-[10px] font-mono leading-relaxed relative z-10 ${isDarkMode ? "text-white/40 group-hover:text-white/55" : "text-black/45 group-hover:text-black/65"} transition-colors`}>
                    {option.desc}
                </p>
            </motion.button>
        );
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
                    onClick={onClose}
                >
                    <motion.div
                        ref={containerRef}
                        onMouseMove={handleMouseMove}
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                        className={`relative w-full max-w-4xl rounded-3xl border overflow-hidden shadow-2xl transition-all duration-300 ${isDarkMode
                            ? "bg-[#0a0a0a]/90 border-white/10 text-white backdrop-blur-xl"
                            : "bg-[#faf6ee]/95 border-black/10 text-black backdrop-blur-xl"
                            }`}
                        style={{
                            backgroundImage: isDarkMode
                                ? `radial-gradient(circle 600px at ${mousePos.x}px ${mousePos.y}px, rgba(${accent ? hexToRgb(accent) : "168, 85, 247"}, 0.04), transparent 60%)`
                                : `radial-gradient(circle 600px at ${mousePos.x}px ${mousePos.y}px, rgba(${accent ? hexToRgb(accent) : "0, 221, 221"}, 0.03), transparent 60%)`
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Top mesh background */}
                        <div className={`absolute inset-0 pointer-events-none ${isDarkMode ? "opacity-40" : "opacity-30"}`}
                            style={{
                                backgroundImage: isDarkMode
                                    ? "radial-gradient(at 0% 0%, hsla(270, 100%, 65%, 0.06) 0px, transparent 50%), radial-gradient(at 100% 100%, hsla(190, 100%, 65%, 0.04) 0px, transparent 50%)"
                                    : "radial-gradient(at 0% 0%, hsla(180, 100%, 50%, 0.05) 0px, transparent 50%), radial-gradient(at 100% 100%, hsla(270, 100%, 65%, 0.04) 0px, transparent 50%)"
                            }}
                        />

                        <button
                            onClick={onClose}
                            className={`absolute top-4 right-4 z-20 p-1.5 rounded-xl transition-all ${isDarkMode
                                ? "text-white/30 hover:text-white hover:bg-white/5"
                                : "text-black/30 hover:text-black hover:bg-black/5"
                                }`}
                        >
                            <X className="h-4 w-4" />
                        </button>

                        <div className="relative z-10 p-6 sm:p-8 max-h-[90vh] overflow-y-auto scrollbar-hide">
                            {/* Header */}
                            <div className="flex items-center gap-4 mb-6">
                                <div className={`h-12 w-12 rounded-2xl flex items-center justify-center transition-all ${accent
                                    ? "text-white"
                                    : (isDarkMode ? "bg-white text-black" : "bg-black text-white")
                                    }`}
                                    style={accent ? { backgroundColor: accent, color: isDarkMode ? "#000" : "#fff" } : undefined}
                                >
                                    <Monitor className="h-6 w-6 animate-pulse" />
                                </div>
                                <div className="flex flex-col text-left flex-1">
                                    <div className="flex items-center gap-2">
                                        <h2 className={`text-2xl font-sans font-bold tracking-tight ${isDarkMode ? "text-white" : "text-black"}`}>
                                            Interview Prep
                                        </h2>
                                        <span className={`text-[8px] font-mono uppercase tracking-[0.2em] px-1.5 py-0.5 rounded ${isDarkMode ? "bg-white/5 text-white/40 border border-white/10" : "bg-black/5 text-black/50 border border-black/10"}`}>
                                            Live
                                        </span>
                                    </div>
                                    <p className={`text-[9px] font-mono uppercase tracking-[0.2em] ${isDarkMode ? "text-white/30" : "text-black/40"} mt-1`}>
                                        Configure your interactive AI session
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-5">
                                {/* Topic / Role */}
                                <div>
                                    <div className={`flex items-center gap-3 ${isDarkMode ? "text-white/40" : "text-black/40"} mb-2 text-left`}>
                                        <Briefcase className="h-3 w-3" />
                                        <label className="text-[9px] font-mono uppercase tracking-[0.2em]">
                                            Topic / Role
                                        </label>
                                    </div>
                                    <input
                                        type="text"
                                        value={topic}
                                        onChange={(e) => setTopic(e.target.value)}
                                        onFocus={() => setTopicFocused(true)}
                                        onBlur={() => setTopicFocused(false)}
                                        placeholder="e.g. Frontend Developer, System Design..."
                                        className={`w-full p-3.5 text-sm rounded-2xl border transition-all duration-200 outline-none font-sans ${isDarkMode
                                            ? "bg-white/[0.03] border-white/10 text-white placeholder:text-white/20 focus:bg-white/[0.05] focus:border-white/25"
                                            : "bg-black/[0.03] border-black/10 text-black placeholder:text-black/20 focus:bg-black/[0.05] focus:border-black/25"
                                            }`}
                                        style={topicFocused && accent ? { borderColor: accent } : undefined}
                                    />
                                </div>

                                {/* Duration + Difficulty row */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Duration */}
                                    <div>
                                        <div className={`flex items-center gap-3 ${isDarkMode ? "text-white/40" : "text-black/40"} mb-2 text-left`}>
                                            <Clock className="h-3 w-3" />
                                            <label className="text-[9px] font-mono uppercase tracking-[0.2em]">
                                                Duration (min)
                                            </label>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="number"
                                                value={duration}
                                                onChange={(e) => setDuration(Math.max(1, parseInt(e.target.value) || 1))}
                                                onFocus={() => setDurationFocused(true)}
                                                onBlur={() => setDurationFocused(false)}
                                                min="1"
                                                max="180"
                                                className={`flex-1 p-3.5 text-sm rounded-2xl border transition-all duration-200 outline-none font-mono ${isDarkMode
                                                    ? "bg-white/[0.03] border-white/10 text-white focus:bg-white/[0.05] focus:border-white/25"
                                                    : "bg-black/[0.03] border-black/10 text-black focus:bg-black/[0.05] focus:border-black/25"
                                                    }`}
                                                style={durationFocused && accent ? { borderColor: accent } : undefined}
                                            />
                                            <span className={`text-[9px] font-mono uppercase ${isDarkMode ? "text-white/40" : "text-black/40"}`}>
                                                min
                                            </span>
                                        </div>
                                    </div>

                                    {/* Difficulty */}
                                    <div>
                                        <div className={`flex items-center gap-3 ${isDarkMode ? "text-white/40" : "text-black/40"} mb-2 text-left`}>
                                            <Sliders className="h-3 w-3" />
                                            <label className="text-[9px] font-mono uppercase tracking-[0.2em]">
                                                Difficulty
                                            </label>
                                        </div>
                                        <div className="grid grid-cols-3 gap-2">
                                            {DIFFICULTY_OPTIONS.map((opt) =>
                                                renderOptionCard(opt, difficulty, (id) => setDifficulty(id as any), "diff")
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Session Focus */}
                                <div>
                                    <div className={`flex items-center gap-3 ${isDarkMode ? "text-white/40" : "text-black/40"} mb-2 text-left`}>
                                        <BookOpen className="h-3 w-3" />
                                        <label className="text-[9px] font-mono uppercase tracking-[0.2em]">
                                            Session Focus
                                        </label>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2">
                                        {FOCUS_OPTIONS.map((opt) =>
                                            renderOptionCard(opt, focus, (id) => setFocus(id as any), "focus")
                                        )}
                                    </div>
                                </div>

                                {/* Interviewer Vibe */}
                                <div>
                                    <div className={`flex items-center gap-3 ${isDarkMode ? "text-white/40" : "text-black/40"} mb-2 text-left`}>
                                        <Smile className="h-3 w-3" />
                                        <label className="text-[9px] font-mono uppercase tracking-[0.2em]">
                                            Interviewer Vibe
                                        </label>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2">
                                        {VIBE_OPTIONS.map((opt) =>
                                            renderOptionCard(opt, vibe, (id) => setVibe(id as any), "vibe")
                                        )}
                                    </div>
                                </div>

                                {/* Info Strip */}
                                <div className={`flex items-center justify-between gap-3 p-3 rounded-2xl border ${isDarkMode ? "border-white/[0.06] bg-white/[0.015]" : "border-black/[0.06] bg-black/[0.015]"}`}>
                                    <div className="flex items-center gap-2">
                                        <div className={`h-7 w-7 rounded-lg flex items-center justify-center ${isDarkMode ? "bg-white/5" : "bg-black/5"}`}>
                                            <Volume2 className={`h-3.5 w-3.5 ${isDarkMode ? "text-white/50" : "text-black/50"}`} />
                                        </div>
                                        <div>
                                            <p className={`text-[9px] font-mono uppercase tracking-[0.15em] ${isDarkMode ? "text-white/50" : "text-black/55"}`}>
                                                Voice Engine
                                            </p>
                                            <p className={`text-[10px] font-sans font-medium ${isDarkMode ? "text-white/80" : "text-black/80"}`}>
                                                Sarvam AI <span className="opacity-50">· bulbul:v3</span>
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className={`h-7 w-7 rounded-lg flex items-center justify-center ${isDarkMode ? "bg-white/5" : "bg-black/5"}`}>
                                            <Mic className={`h-3.5 w-3.5 ${isDarkMode ? "text-white/50" : "text-black/50"}`} />
                                        </div>
                                        <div>
                                            <p className={`text-[9px] font-mono uppercase tracking-[0.15em] ${isDarkMode ? "text-white/50" : "text-black/55"}`}>
                                                STT Engine
                                            </p>
                                            <p className={`text-[10px] font-sans font-medium ${isDarkMode ? "text-white/80" : "text-black/80"}`}>
                                                Whisper
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Start Button */}
                            <motion.button
                                onClick={handleStart}
                                disabled={!topic.trim()}
                                whileHover={topic.trim() ? { scale: 1.01 } : {}}
                                whileTap={topic.trim() ? { scale: 0.99 } : {}}
                                className={`w-full mt-6 py-3.5 rounded-2xl text-[10px] font-mono uppercase tracking-[0.2em] font-bold transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${accent
                                    ? "hover:opacity-90 shadow-lg"
                                    : (isDarkMode ? "bg-white text-black hover:bg-white/95 shadow-lg shadow-white/5" : "bg-black text-white hover:bg-black/95 shadow-lg shadow-black/5")
                                    }`}
                                style={topic.trim() && accent ? { backgroundColor: accent, color: isDarkMode ? "#000" : "#fff" } : undefined}
                            >
                                <Zap className="h-3.5 w-3.5" />
                                <span>Start Interview</span>
                                <ChevronRight className="h-3.5 w-3.5" />
                            </motion.button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

function hexToRgb(hex: string): string {
    if (!hex) return "0, 221, 221";
    const h = hex.replace("#", "");
    return `${parseInt(h.substring(0, 2), 16)}, ${parseInt(h.substring(2, 4), 16)}, ${parseInt(h.substring(4, 6), 16)}`;
}
