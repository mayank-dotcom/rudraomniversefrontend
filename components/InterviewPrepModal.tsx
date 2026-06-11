"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Clock } from "lucide-react";

interface InterviewPrepModalProps {
    isOpen: boolean;
    onClose: () => void;
    onStart: (topic: string, duration: number) => void;
    isDarkMode: boolean;
}

export default function InterviewPrepModal({ isOpen, onClose, onStart, isDarkMode }: InterviewPrepModalProps) {
    const [topic, setTopic] = useState("");
    const [duration, setDuration] = useState(45);
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
        onStart(topic.trim(), duration);
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
                        className={`relative w-full max-w-md mx-4 rounded-3xl border p-8 shadow-2xl transition-all duration-300 ${
                            isDarkMode
                                ? "bg-[#222120] border-white/5 text-white"
                                : "bg-[#f2f1f0] border-black/5 text-black"
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

                        <div className="mb-8">
                            <h2 className={`text-xl font-sans font-bold tracking-tight ${isDarkMode ? "text-white" : "text-black"}`}>
                                Interview Preparation
                            </h2>
                            <p className={`text-[9px] font-mono uppercase tracking-[0.2em] ${isDarkMode ? "text-white/30" : "text-black/40"} mt-2`}>
                                Configure your interview session
                            </p>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className={`block text-[9px] font-mono uppercase tracking-[0.2em] ${isDarkMode ? "text-white/30" : "text-black/40"} mb-3`}>
                                    Topic / Role
                                </label>
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

                            <div>
                                <label className={`block text-[9px] font-mono uppercase tracking-[0.2em] ${isDarkMode ? "text-white/30" : "text-black/40"} mb-3`}>
                                    Duration (minutes)
                                </label>
                                <div className="flex items-center gap-3">
                                    <Clock className={`h-4 w-4 ${isDarkMode ? "text-white/40" : "text-black/40"}`} />
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
                            className={`w-full mt-8 py-3.5 rounded-xl text-[10px] font-mono uppercase tracking-[0.2em] font-bold transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed ${
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
