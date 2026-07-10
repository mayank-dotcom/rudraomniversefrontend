"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ThumbsDown, AlertCircle, MessageSquare, Frown, Ban, Sparkles } from "lucide-react";

interface DislikeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (reason: string) => void;
    isDarkMode: boolean;
}

const PRESET_OPTIONS = [
    { id: "inaccurate", label: "Inaccurate information", icon: AlertCircle },
    { id: "not Helpful", label: "Not helpful", icon: Frown },
    { id: "offensive", label: "Offensive or inappropriate", icon: Ban },
];

export default function DislikeModal({ isOpen, onClose, onSubmit, isDarkMode }: DislikeModalProps) {
    const [selected, setSelected] = useState<string | null>(null);
    const [customText, setCustomText] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        const reason = selected === "other" ? customText.trim() : selected;
        if (!reason) return;
        setIsSubmitting(true);
        onSubmit(reason);
        setSelected(null);
        setCustomText("");
        setIsSubmitting(false);
        onClose();
    };

    const handleClose = () => {
        setSelected(null);
        setCustomText("");
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4"
                    onClick={handleClose}
                >
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                        onClick={(e) => e.stopPropagation()}
                        className={`relative w-full max-w-[400px] rounded-3xl border overflow-hidden ${
                            isDarkMode
                                ? "bg-[#1a1a1a] border-white/10"
                                : "bg-white border-black/10"
                        }`}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 pt-5 pb-2">
                            <div className="flex items-center gap-2.5">
                                <div className={`p-2 rounded-xl ${isDarkMode ? "bg-red-500/10" : "bg-red-500/10"}`}>
                                    <ThumbsDown className={`h-4 w-4 ${isDarkMode ? "text-red-400" : "text-red-500"}`} />
                                </div>
                                <h3 className={`text-sm font-bold tracking-wide ${isDarkMode ? "text-white" : "text-black"}`}>
                                    What went wrong?
                                </h3>
                            </div>
                            <button
                                onClick={handleClose}
                                className={`p-1.5 rounded-lg transition-all ${isDarkMode ? "text-white/40 hover:text-white hover:bg-white/5" : "text-black/40 hover:text-black hover:bg-black/5"}`}
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <p className={`px-6 text-[10px] font-mono tracking-wider ${isDarkMode ? "text-white/30" : "text-black/30"}`}>
                            Select a reason to help us improve
                        </p>

                        {/* Options */}
                        <div className="px-6 py-4 space-y-2">
                            {PRESET_OPTIONS.map((opt) => {
                                const Icon = opt.icon;
                                const isActive = selected === opt.id;
                                return (
                                    <button
                                        key={opt.id}
                                        onClick={() => setSelected(isActive ? null : opt.id)}
                                        className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                                            isActive
                                                ? isDarkMode
                                                    ? "bg-white/10 border-white/20 text-white"
                                                    : "bg-black/5 border-black/15 text-black"
                                                : isDarkMode
                                                    ? "bg-white/[0.03] border-white/5 text-white/60 hover:border-white/15 hover:bg-white/[0.06]"
                                                    : "bg-black/[0.02] border-black/5 text-black/60 hover:border-black/15 hover:bg-black/[0.04]"
                                        }`}
                                    >
                                        <Icon className={`h-4 w-4 shrink-0 ${isActive ? (isDarkMode ? "text-white" : "text-black") : (isDarkMode ? "text-white/40" : "text-black/40")}`} />
                                        <span className="text-[11px] font-sans font-medium">{opt.label}</span>
                                    </button>
                                );
                            })}

                            {/* Other option */}
                            <button
                                onClick={() => setSelected(selected === "other" ? null : "other")}
                                className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                                    selected === "other"
                                        ? isDarkMode
                                            ? "bg-white/10 border-white/20 text-white"
                                            : "bg-black/5 border-black/15 text-black"
                                        : isDarkMode
                                            ? "bg-white/[0.03] border-white/5 text-white/60 hover:border-white/15 hover:bg-white/[0.06]"
                                            : "bg-black/[0.02] border-black/5 text-black/60 hover:border-black/15 hover:bg-black/[0.04]"
                                }`}
                            >
                                <MessageSquare className={`h-4 w-4 shrink-0 ${selected === "other" ? (isDarkMode ? "text-white" : "text-black") : (isDarkMode ? "text-white/40" : "text-black/40")}`} />
                                <span className="text-[11px] font-sans font-medium">Other</span>
                            </button>

                            {/* Custom input */}
                            <AnimatePresence>
                                {selected === "other" && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="overflow-hidden"
                                    >
                                        <textarea
                                            value={customText}
                                            onChange={(e) => setCustomText(e.target.value)}
                                            placeholder="Tell us more..."
                                            rows={3}
                                            autoFocus
                                            className={`w-full p-3 text-[11px] font-sans border rounded-xl resize-none focus:outline-none ${
                                                isDarkMode
                                                    ? "bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-white/25"
                                                    : "bg-black/[0.03] border-black/10 text-black placeholder:text-black/20 focus:border-black/25"
                                            }`}
                                        />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Submit */}
                        <div className="px-6 pb-5">
                            <button
                                onClick={handleSubmit}
                                disabled={!selected || (selected === "other" && !customText.trim()) || isSubmitting}
                                className={`w-full py-3 rounded-xl text-[11px] font-mono font-bold uppercase tracking-wider transition-all disabled:opacity-30 ${
                                    isDarkMode
                                        ? "bg-white text-black hover:bg-white/90"
                                        : "bg-black text-white hover:bg-black/90"
                                }`}
                            >
                                Submit Feedback
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
