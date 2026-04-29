"use client";

import { useState } from "react";
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
                        className={`relative w-full max-w-md mx-4 ${isDarkMode ? "bg-[#0d0d0d] border-white/10" : "bg-white border-black/10"} border p-8 shadow-2xl`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={onClose}
                            className={`absolute top-4 right-4 p-1 transition-colors ${isDarkMode ? "text-white/40 hover:text-white" : "text-black/40 hover:text-black"}`}
                        >
                            <X className="h-4 w-4" />
                        </button>

                        <div className="mb-8">
                            <h2 className={`text-lg font-display font-bold tracking-tight ${isDarkMode ? "text-white" : "text-black"}`}>
                                Interview Preparation
                            </h2>
                            <p className={`text-[10px] font-mono uppercase tracking-[0.2em] ${isDarkMode ? "text-white/30" : "text-black/40"} mt-2`}>
                                Configure your interview session
                            </p>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className={`block text-[10px] font-mono uppercase tracking-[0.2em] ${isDarkMode ? "text-white/30" : "text-black/40"} mb-3`}>
                                    Topic / Role
                                </label>
                                <input
                                    type="text"
                                    value={topic}
                                    onChange={(e) => setTopic(e.target.value)}
                                    placeholder="e.g. Frontend Developer, System Design..."
                                    className={`w-full p-3 text-sm ${isDarkMode ? "bg-white/5 border-white/10 text-white placeholder:text-white/20" : "bg-black/5 border-black/10 text-black placeholder:text-black/20"} border focus:outline-none focus:border-emerald-400/50 transition-all font-sans`}
                                />
                            </div>

                            <div>
                                <label className={`block text-[10px] font-mono uppercase tracking-[0.2em] ${isDarkMode ? "text-white/30" : "text-black/40"} mb-3`}>
                                    Duration (minutes)
                                </label>
                                <div className="flex items-center gap-3">
                                    <Clock className={`h-4 w-4 ${isDarkMode ? "text-white/40" : "text-black/40"}`} />
                                    <input
                                        type="number"
                                        value={duration}
                                        onChange={(e) => setDuration(Math.max(1, parseInt(e.target.value) || 1))}
                                        min="1"
                                        max="180"
                                        className={`flex-1 p-3 text-sm ${isDarkMode ? "bg-white/5 border-white/10 text-white" : "bg-black/5 border-black/10 text-black"} border focus:outline-none focus:border-emerald-400/50 transition-all font-mono`}
                                    />
                                    <span className={`text-[10px] font-mono uppercase ${isDarkMode ? "text-white/40" : "text-black/40"}`}>
                                        min
                                    </span>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleStart}
                            disabled={!topic.trim()}
                            className={`w-full mt-8 py-3 text-[10px] font-mono uppercase tracking-[0.2em] font-bold transition-all active:scale-95 disabled:opacity-50 ${
                                isDarkMode
                                    ? "bg-white text-black hover:bg-white/90"
                                    : "bg-black text-white hover:bg-black/90"
                            }`}
                        >
                            Start Interview →
                        </button>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
