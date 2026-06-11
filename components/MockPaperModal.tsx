import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, GraduationCap, Clock, ListOrdered, ChevronRight, FileText } from 'lucide-react';

interface MockPaperModalProps {
    isOpen: boolean;
    onClose: () => void;
    onGenerate: (config: MockPaperConfig) => void;
    isDarkMode: boolean;
}

export interface MockPaperConfig {
    examType: string;
    customExamType?: string;
    duration: string;
    numQuestions: number;
    mode: "paper" | "mcq";
}

const MockPaperModal: React.FC<MockPaperModalProps> = ({ isOpen, onClose, onGenerate, isDarkMode }) => {
    const [config, setConfig] = useState<MockPaperConfig>({
        examType: 'IIT JEE',
        duration: '3 HR',
        numQuestions: 10,
        mode: "paper"
    });
    const [showCustom, setShowCustom] = useState(false);
    const [accent, setAccent] = useState<string>("");
    const [customFocused, setCustomFocused] = useState(false);
    const [qtyFocused, setQtyFocused] = useState(false);
    const [durationFocused, setDurationFocused] = useState(false);

    useEffect(() => {
        if (typeof window !== "undefined") {
            setAccent(localStorage.getItem("rudranex_accent") || "");
        }
    }, [isOpen]);

    const examTypes = ['IIT JEE', 'UPSC', 'NEET', 'React Interview', 'Other'];
    const durations = ['0.5 HR', '1 HR', '2 HR', '3 HR'];

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className={`absolute inset-0 backdrop-blur-sm ${isDarkMode ? "bg-black/80" : "bg-[#faf6ee]/80"}`}
                />
                
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    className={`relative w-full max-w-xl rounded-3xl border p-10 shadow-2xl overflow-y-auto max-h-[85vh] transition-all duration-300 ${
                        isDarkMode
                            ? "bg-[#222120] border-white/5 text-white"
                            : "bg-[#faf6ee] border-black/5 text-black"
                    }`}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Background Accents */}
                    <div className={`absolute top-0 right-0 w-32 h-32 blur-[60px] rounded-full ${isDarkMode ? "bg-white/5" : "bg-black/5"}`} />
                    <div className={`absolute bottom-0 left-0 w-32 h-32 blur-[60px] rounded-full ${isDarkMode ? "bg-white/5" : "bg-black/5"}`} />

                    <div className="relative z-10">
                        <div className="flex justify-between items-center mb-10">
                            <div className="flex items-center gap-4">
                                <div className={`h-12 w-12 rounded-2xl flex items-center justify-center transition-all ${
                                    accent
                                        ? "text-white"
                                        : (isDarkMode ? "bg-white text-black" : "bg-black text-white")
                                }`}
                                style={accent ? { backgroundColor: accent, color: isDarkMode ? "#000" : "#fff" } : undefined}
                                >
                                    <GraduationCap className="h-6 w-6" />
                                </div>
                                <div className="flex flex-col text-left">
                                    <h2 className={`text-2xl font-sans font-black tracking-tight ${isDarkMode ? "text-white" : "text-black"} uppercase`}>Mock Paper</h2>
                                    <p className={`text-[9px] font-mono ${isDarkMode ? "text-white/40" : "text-black/40"} uppercase tracking-[0.2em] mt-1`}>Synthesize professional assessment modules</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className={`p-1.5 rounded-xl transition-all ${
                                    isDarkMode
                                        ? "text-white/30 hover:text-white hover:bg-white/5"
                                        : "text-black/30 hover:text-black hover:bg-black/5"
                                }`}
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="space-y-8">
                            {/* Mode Selector */}
                            <div className="space-y-4">
                                <div className={`flex items-center gap-3 ${isDarkMode ? "text-white/40" : "text-black/40"} text-left`}>
                                    <ListOrdered className="h-3 w-3" />
                                    <span className="text-[9px] font-mono uppercase tracking-[0.2em]">Assessment Mode</span>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    {(["paper", "mcq"] as const).map((mode) => {
                                        const isSelected = config.mode === mode;
                                        return (
                                            <button
                                                key={mode}
                                                type="button"
                                                onClick={() => setConfig({ ...config, mode })}
                                                className={`p-4 text-xs font-mono border rounded-2xl transition-all flex items-center justify-between group cursor-pointer font-bold ${
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
                                                {mode === "paper" ? "Paper Mode" : "MCQ Mode"}
                                                {isSelected && <ChevronRight className="h-3 w-3" />}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Exam Type */}
                            <div className="space-y-4">
                                <div className={`flex items-center gap-3 ${isDarkMode ? "text-white/40" : "text-black/40"} text-left`}>
                                    <FileText className="h-3 w-3" />
                                    <span className="text-[9px] font-mono uppercase tracking-[0.2em]">Select Examination Domain</span>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    {examTypes.map((type) => {
                                        const isSelected = config.examType === type;
                                        return (
                                            <button
                                                key={type}
                                                type="button"
                                                onClick={() => {
                                                    setConfig({ ...config, examType: type });
                                                    setShowCustom(type === 'Other');
                                                }}
                                                className={`p-4 text-xs font-mono border rounded-2xl transition-all text-left flex items-center justify-between group cursor-pointer font-bold ${
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
                                                {type}
                                                {isSelected && <ChevronRight className="h-3 w-3" />}
                                            </button>
                                        );
                                    })}
                                </div>
                                {showCustom && (
                                    <motion.input
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        type="text"
                                        placeholder="TYPE CUSTOM EXAM NAME..."
                                        onFocus={() => setCustomFocused(true)}
                                        onBlur={() => setCustomFocused(false)}
                                        onChange={(e) => setConfig({ ...config, customExamType: e.target.value })}
                                        className={`w-full p-3.5 text-[10px] font-mono tracking-widest rounded-xl border transition-all duration-200 outline-none ${
                                            isDarkMode
                                                ? "bg-white/[0.03] border-white/10 text-white placeholder:text-white/20 focus:bg-white/[0.05]"
                                                : "bg-black/[0.03] border-black/10 text-black placeholder:text-black/30 focus:bg-black/[0.05]"
                                        }`}
                                        style={
                                            customFocused && accent
                                                ? { borderColor: accent }
                                                : undefined
                                        }
                                    />
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-8">
                                {/* Time Allocation — only for Paper Mode */}
                                {config.mode === "paper" && (
                                    <div className="space-y-4 text-left">
                                        <div className={`flex items-center gap-3 ${isDarkMode ? "text-white/40" : "text-black/40"}`}>
                                            <Clock className="h-3 w-3" />
                                            <span className="text-[9px] font-mono uppercase tracking-[0.2em]">Duration</span>
                                        </div>
                                        <select
                                            value={config.duration}
                                            onFocus={() => setDurationFocused(true)}
                                            onBlur={() => setDurationFocused(false)}
                                            onChange={(e) => setConfig({ ...config, duration: e.target.value })}
                                            className={`w-full p-3.5 text-xs font-mono rounded-xl border transition-all duration-200 outline-none cursor-pointer ${
                                                isDarkMode
                                                    ? "bg-white/[0.03] border-white/10 text-white focus:bg-white/[0.05]"
                                                    : "bg-black/[0.03] border-black/10 text-black focus:bg-black/[0.05]"
                                            }`}
                                            style={
                                                durationFocused && accent
                                                    ? { borderColor: accent }
                                                    : undefined
                                            }
                                        >
                                            {durations.map(d => (
                                                <option key={d} value={d} className={isDarkMode ? "bg-[#222120] text-white" : "bg-[#faf6ee] text-black"}>
                                                    {d}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {/* Questions Qty */}
                                <div className="space-y-4 text-left">
                                    <div className={`flex items-center gap-3 ${isDarkMode ? "text-white/40" : "text-black/40"}`}>
                                        <ListOrdered className="h-3 w-3" />
                                        <span className="text-[9px] font-mono uppercase tracking-[0.2em]">Quantity</span>
                                    </div>
                                    <input
                                        type="number"
                                        min={1}
                                        max={50}
                                        value={config.numQuestions}
                                        onFocus={() => setQtyFocused(true)}
                                        onBlur={() => setQtyFocused(false)}
                                        onChange={(e) => setConfig({ ...config, numQuestions: parseInt(e.target.value) || 1 })}
                                        className={`w-full p-3.5 text-xs font-mono rounded-xl border transition-all duration-200 outline-none ${
                                            isDarkMode
                                                ? "bg-white/[0.03] border-white/10 text-white focus:bg-white/[0.05]"
                                                : "bg-black/[0.03] border-black/10 text-black focus:bg-black/[0.05]"
                                        }`}
                                        style={
                                            qtyFocused && accent
                                                ? { borderColor: accent }
                                                : undefined
                                        }
                                    />
                                </div>
                            </div>

                            <motion.button
                                onClick={() => onGenerate(config)}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className={`w-full py-4 text-[10px] font-mono font-bold uppercase tracking-[0.3em] rounded-xl shadow-xl transition-all duration-200 mt-6 cursor-pointer ${
                                    accent
                                        ? "hover:opacity-90"
                                        : (isDarkMode ? "bg-white text-black shadow-white/5" : "bg-black text-white shadow-black/5")
                                }`}
                                style={
                                    accent
                                        ? { backgroundColor: accent, color: isDarkMode ? "#000" : "#fff" }
                                        : undefined
                                }
                            >
                                {config.mode === "paper" ? "Generate Neural Paper" : "Start MCQ Quiz"}
                            </motion.button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default MockPaperModal;
