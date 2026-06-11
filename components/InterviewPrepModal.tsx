"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Clock, Monitor, Smile, MessageSquare, Flame, Briefcase, Sliders, BookOpen, Terminal, Cpu } from "lucide-react";

interface InterviewPrepModalProps {
    isOpen: boolean;
    onClose: () => void;
    onStart: (topic: string, duration: number, difficulty: string, vibe: string, focus: string) => void;
    isDarkMode: boolean;
}

export default function InterviewPrepModal({ isOpen, onClose, onStart, isDarkMode }: InterviewPrepModalProps) {
    const [topic, setTopic] = useState("");
    const [duration, setDuration] = useState(45);
    const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
    const [vibe, setVibe] = useState<"friendly" | "standard" | "savage">("standard");
    const [focus, setFocus] = useState<"conceptual" | "coding" | "architecture">("coding");
    const [accent, setAccent] = useState<string>("");
    const [topicFocused, setTopicFocused] = useState(false);
    const [durationFocused, setDurationFocused] = useState(false);

    useEffect(() => {
        if (typeof window !== "undefined") {
            setAccent(localStorage.getItem("rudranex_accent") || "");
        }
    }, [isOpen]);

    const handleStart = () => {
        if (!topic.trim()) return;
        onStart(topic.trim(), duration, difficulty, vibe, focus);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                        className={`relative w-full max-w-md mx-4 rounded-3xl border p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto scrollbar-hide transition-all duration-300 ${
                            isDarkMode
                                ? "bg-[#222120] border-white/5 text-white"
                                : "bg-[#faf6ee] border-black/5 text-black"
                        }`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={onClose}
                            className={`absolute top-5 right-5 p-1.5 rounded-xl transition-all ${
                                isDarkMode
                                    ? "text-white/30 hover:text-white hover:bg-white/5"
                                    : "text-black/30 hover:text-black hover:bg-black/5"
                            }`}
                        >
                            <X className="h-4 w-4" />
                        </button>

                        <div className="flex items-center gap-4 mb-6">
                            <div className={`h-12 w-12 rounded-2xl flex items-center justify-center transition-all ${
                                accent
                                    ? "text-white"
                                    : (isDarkMode ? "bg-white text-black" : "bg-black text-white")
                            }`}
                            style={accent ? { backgroundColor: accent, color: isDarkMode ? "#000" : "#fff" } : undefined}
                            >
                                <Monitor className="h-6 w-6 animate-pulse" />
                            </div>
                            <div className="flex flex-col text-left">
                                <h2 className={`text-2xl font-sans font-bold tracking-tight ${isDarkMode ? "text-white" : "text-black"}`}>
                                    Interview Prep
                                </h2>
                                <p className={`text-[9px] font-mono uppercase tracking-[0.2em] ${isDarkMode ? "text-white/30" : "text-black/40"} mt-1`}>
                                    Configure your interactive AI session
                                </p>
                            </div>
                        </div>

                        <div className="space-y-5">
                            {/* Topic / Role */}
                            <div>
                                <div className={`flex items-center gap-3 ${isDarkMode ? "text-white/40" : "text-black/40"} mb-3 text-left`}>
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
                                    className={`w-full p-3.5 text-sm rounded-xl border transition-all duration-200 outline-none font-sans ${
                                        isDarkMode
                                            ? "bg-white/[0.03] border-white/10 text-white placeholder:text-white/20 focus:bg-white/[0.05]"
                                            : "bg-black/[0.03] border-black/10 text-black placeholder:text-black/20 focus:bg-black/[0.05]"
                                    }`}
                                    style={
                                        topicFocused && accent
                                            ? { borderColor: accent }
                                            : undefined
                                    }
                                />
                            </div>

                            {/* Difficulty */}
                            <div>
                                <div className={`flex items-center gap-3 ${isDarkMode ? "text-white/40" : "text-black/40"} mb-3 text-left`}>
                                    <Sliders className="h-3 w-3" />
                                    <label className="text-[9px] font-mono uppercase tracking-[0.2em]">
                                        Difficulty
                                    </label>
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    {(["easy", "medium", "hard"] as const).map((level) => {
                                        const isSelected = difficulty === level;
                                        return (
                                            <button
                                                key={level}
                                                type="button"
                                                onClick={() => setDifficulty(level)}
                                                className={`py-3 text-xs font-mono uppercase tracking-widest border rounded-xl transition-all duration-200 cursor-pointer flex items-center justify-center font-bold ${
                                                    isSelected
                                                        ? (accent ? "border-transparent text-white" : (isDarkMode ? "bg-white text-black border-white" : "bg-black text-white border-black"))
                                                        : (isDarkMode ? "bg-white/5 border-white/10 text-white/60 hover:border-white/30" : "bg-black/5 border-black/10 text-black/60 hover:border-black/30")
                                                }`}
                                                style={
                                                    isSelected && accent
                                                        ? { backgroundColor: accent, color: isDarkMode ? "#000" : "#fff", borderColor: accent }
                                                        : undefined
                                                }
                                            >
                                                {level}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Session Focus */}
                            <div>
                                <div className={`flex items-center gap-3 ${isDarkMode ? "text-white/40" : "text-black/40"} mb-3 text-left`}>
                                    <BookOpen className="h-3 w-3" />
                                    <label className="text-[9px] font-mono uppercase tracking-[0.2em]">
                                        Session Focus
                                    </label>
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    {(["conceptual", "coding", "architecture"] as const).map((focusOption) => {
                                        const isSelected = focus === focusOption;
                                        const FocusIcon = focusOption === "conceptual" ? BookOpen : focusOption === "coding" ? Terminal : Cpu;
                                        return (
                                            <button
                                                key={focusOption}
                                                type="button"
                                                onClick={() => setFocus(focusOption)}
                                                className={`py-3 text-[10px] font-mono uppercase tracking-wider border rounded-xl transition-all duration-200 cursor-pointer flex flex-col items-center justify-center gap-1.5 font-bold ${
                                                    isSelected
                                                        ? (accent ? "border-transparent text-white shadow-md" : (isDarkMode ? "bg-white text-black border-white" : "bg-black text-white border-black"))
                                                        : (isDarkMode ? "bg-white/5 border-white/10 text-white/60 hover:border-white/30" : "bg-black/5 border-black/10 text-black/60 hover:border-black/30")
                                                }`}
                                                style={
                                                    isSelected && accent
                                                        ? { backgroundColor: accent, color: isDarkMode ? "#000" : "#fff", borderColor: accent }
                                                        : undefined
                                                }
                                            >
                                                <FocusIcon className="h-3.5 w-3.5" />
                                                <span>{focusOption === "architecture" ? "Arch" : focusOption}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Interviewer Vibe */}
                            <div>
                                <div className={`flex items-center gap-3 ${isDarkMode ? "text-white/40" : "text-black/40"} mb-3 text-left`}>
                                    <Smile className="h-3 w-3" />
                                    <label className="text-[9px] font-mono uppercase tracking-[0.2em]">
                                        Interviewer Vibe
                                    </label>
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    {(["friendly", "standard", "savage"] as const).map((vibeOption) => {
                                        const isSelected = vibe === vibeOption;
                                        const VibeIcon = vibeOption === "friendly" ? Smile : vibeOption === "savage" ? Flame : MessageSquare;
                                        return (
                                            <button
                                                key={vibeOption}
                                                type="button"
                                                onClick={() => setVibe(vibeOption)}
                                                className={`py-3 text-[10px] font-mono uppercase tracking-wider border rounded-xl transition-all duration-200 cursor-pointer flex flex-col items-center justify-center gap-1.5 font-bold ${
                                                    isSelected
                                                        ? (accent ? "border-transparent text-white shadow-md" : (isDarkMode ? "bg-white text-black border-white" : "bg-black text-white border-black"))
                                                        : (isDarkMode ? "bg-white/5 border-white/10 text-white/60 hover:border-white/30" : "bg-black/5 border-black/10 text-black/60 hover:border-black/30")
                                                }`}
                                                style={
                                                    isSelected && accent
                                                        ? { backgroundColor: accent, color: isDarkMode ? "#000" : "#fff", borderColor: accent }
                                                        : undefined
                                                }
                                            >
                                                <VibeIcon className="h-3.5 w-3.5" />
                                                <span>{vibeOption}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Duration */}
                            <div>
                                <div className={`flex items-center gap-3 ${isDarkMode ? "text-white/40" : "text-black/40"} mb-3 text-left`}>
                                    <Clock className="h-3 w-3" />
                                    <label className="text-[9px] font-mono uppercase tracking-[0.2em]">
                                        Duration (minutes)
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
                                        className={`flex-1 p-3.5 text-sm rounded-xl border transition-all duration-200 outline-none font-mono ${
                                            isDarkMode
                                                ? "bg-white/[0.03] border-white/10 text-white focus:bg-white/[0.05]"
                                                : "bg-black/[0.03] border-black/10 text-black focus:bg-black/[0.05]"
                                        }`}
                                        style={
                                            durationFocused && accent
                                                ? { borderColor: accent }
                                                : undefined
                                        }
                                    />
                                    <span className={`text-[9px] font-mono uppercase ${isDarkMode ? "text-white/40" : "text-black/40"}`}>
                                        min
                                    </span>
                                </div>
                            </div>
                        </div>

                        <motion.button
                            onClick={handleStart}
                            disabled={!topic.trim()}
                            whileHover={topic.trim() ? { scale: 1.02 } : {}}
                            whileTap={topic.trim() ? { scale: 0.98 } : {}}
                            className={`w-full mt-6 py-3.5 rounded-xl text-[10px] font-mono uppercase tracking-[0.2em] font-bold transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed ${
                                accent
                                    ? "hover:opacity-90 shadow-md"
                                    : (isDarkMode ? "bg-white text-black hover:bg-white/95 shadow-md" : "bg-black text-white hover:bg-black/95 shadow-md")
                            }`}
                            style={
                                topic.trim() && accent
                                    ? {
                                        backgroundColor: accent,
                                        color: isDarkMode ? "#000" : "#fff"
                                    }
                                    : undefined
                            }
                        >
                            Start Interview →
                        </motion.button>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
