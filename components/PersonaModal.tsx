"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, UserPlus, Check } from "lucide-react";

export interface Persona {
    name: string;
    systemPrompt: string;
    predefined: boolean;
}

const PREDEFINED_PERSONAS: Persona[] = [
    { name: "Teacher", systemPrompt: "You are a knowledgeable teacher who explains concepts thoroughly with examples, analogies, and structured lessons. Adapt your teaching style to the student's level.", predefined: true },
    { name: "Tutor", systemPrompt: "You are a patient tutor who guides students step-by-step without giving direct answers. Ask probing questions to help them discover solutions themselves.", predefined: true },
    { name: "Interviewer", systemPrompt: "You are a professional interviewer conducting a mock interview. Ask relevant questions, evaluate answers, provide constructive feedback, and track the candidate's performance.", predefined: true },
    { name: "Career Coach", systemPrompt: "You are a career coach providing professional advice on career paths, skill development, resume building, and interview preparation. Be practical and encouraging.", predefined: true },
    { name: "Study Buddy", systemPrompt: "You are a friendly study buddy who makes learning collaborative and fun. Use casual language, share tips, and help with revision in an engaging way.", predefined: true },
    { name: "Explainer", systemPrompt: "You are an expert at simplifying complex topics. Break down difficult concepts into simple terms using everyday examples. Assume no prior knowledge.", predefined: true },
];

interface PersonaModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (persona: Persona) => void;
    isDarkMode: boolean;
    currentPersona: Persona | null;
}

export default function PersonaModal({ isOpen, onClose, onSelect, isDarkMode, currentPersona }: PersonaModalProps) {
    const [tab, setTab] = useState<"predefined" | "custom">("predefined");
    const [customName, setCustomName] = useState("");
    const [customPrompt, setCustomPrompt] = useState("");

    const handleSelect = (persona: Persona) => {
        onSelect(persona);
        onClose();
    };

    const handleCreateCustom = () => {
        if (!customName.trim() || !customPrompt.trim()) return;
        const persona: Persona = {
            name: customName.trim(),
            systemPrompt: customPrompt.trim(),
            predefined: false,
        };
        onSelect(persona);
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[200] flex items-center justify-center p-6"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className={`absolute inset-0 backdrop-blur-sm ${isDarkMode ? "bg-black/80" : "bg-white/80"}`}
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className={`relative w-full max-w-lg border ${isDarkMode ? "bg-[#0d0d0d] border-white/10" : "bg-white border-black/20"} p-8 rounded-[2.5rem] shadow-2xl overflow-y-auto max-h-[85vh]`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Background Accents */}
                        <div className={`absolute top-0 right-0 w-32 h-32 blur-[60px] rounded-full ${isDarkMode ? "bg-white/5" : "bg-black/5"}`} />
                        <div className={`absolute bottom-0 left-0 w-32 h-32 blur-[60px] rounded-full ${isDarkMode ? "bg-white/5" : "bg-black/5"}`} />

                        <div className="relative z-10">
                            <div className="flex justify-between items-center mb-8">
                                <div className="flex items-center gap-4">
                                    <div className={`h-12 w-12 ${isDarkMode ? "bg-white text-black" : "bg-black text-white"} rounded-2xl flex items-center justify-center`}>
                                        <Sparkles className="h-6 w-6" />
                                    </div>
                                    <div className="flex flex-col text-left">
                                        <h2 className={`text-2xl font-display font-black tracking-tight ${isDarkMode ? "text-white" : "text-black"} uppercase`}>Persona Mode</h2>
                                        <p className={`text-[10px] font-mono ${isDarkMode ? "text-white/40" : "text-black/40"} uppercase tracking-[0.2em]`}>Choose your AI companion style</p>
                                    </div>
                                </div>
                                <button onClick={onClose} className={`p-2 rounded-full transition-colors ${isDarkMode ? "hover:bg-white/10 text-white/40 hover:text-white" : "hover:bg-black/10 text-black/40 hover:text-black"}`}>
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            {/* Tab Buttons */}
                            <div className={`flex mb-8 border-b ${isDarkMode ? "border-white/10" : "border-black/10"}`}>
                                <button
                                    onClick={() => setTab("predefined")}
                                    className={`flex-1 py-3 text-[9px] font-mono uppercase tracking-[0.2em] transition-all ${
                                        tab === "predefined"
                                            ? (isDarkMode ? "bg-white text-black font-bold" : "bg-black text-white font-bold")
                                            : (isDarkMode ? "text-white/40 hover:text-white" : "text-black/40 hover:text-black")
                                    }`}
                                >
                                    <Sparkles className="h-3 w-3 inline mr-1.5 -mt-0.5" />
                                    Predefined
                                </button>
                                <button
                                    onClick={() => setTab("custom")}
                                    className={`flex-1 py-3 text-[9px] font-mono uppercase tracking-[0.2em] transition-all ${
                                        tab === "custom"
                                            ? (isDarkMode ? "bg-white text-black font-bold" : "bg-black text-white font-bold")
                                            : (isDarkMode ? "text-white/40 hover:text-white" : "text-black/40 hover:text-black")
                                    }`}
                                >
                                    <UserPlus className="h-3 w-3 inline mr-1.5 -mt-0.5" />
                                    Custom
                                </button>
                            </div>

                            {tab === "predefined" && (
                                <div className="grid grid-cols-1 gap-3">
                                    {PREDEFINED_PERSONAS.map((p) => {
                                        const isActive = currentPersona?.name === p.name;
                                        return (
                                            <button
                                                key={p.name}
                                                onClick={() => handleSelect(p)}
                                                className={`w-full text-left p-5 rounded-2xl border text-sm transition-all ${
                                                    isActive
                                                        ? `${isDarkMode ? "bg-white text-black border-white" : "bg-black text-white border-black"} font-bold`
                                                        : `${isDarkMode ? "bg-white/5 border-white/10 text-white/70 hover:border-white/30 hover:bg-white/10" : "bg-black/5 border-black/10 text-black/70 hover:border-black/30 hover:bg-black/10"}`
                                                }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span className="font-semibold text-xs font-mono uppercase tracking-widest">{p.name}</span>
                                                    {isActive && <Check className="h-4 w-4" />}
                                                </div>
                                                <p className={`mt-2 text-[10px] leading-relaxed opacity-60 font-sans`}>{p.systemPrompt}</p>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}

                            {tab === "custom" && (
                                <div className="space-y-6">
                                    <div>
                                        <label className={`block text-[10px] font-mono uppercase tracking-[0.2em] ${isDarkMode ? "text-white/40" : "text-black/40"} mb-3`}>
                                            Persona Name
                                        </label>
                                        <input
                                            type="text"
                                            value={customName}
                                            onChange={(e) => setCustomName(e.target.value)}
                                            placeholder="e.g. Code Mentor, Math Genius..."
                                            className={`w-full p-4 text-xs font-mono ${isDarkMode ? "bg-white/5 border-white/10 text-white placeholder:text-white/20" : "bg-black/5 border-black/10 text-black placeholder:text-black/20"} border rounded-2xl focus:outline-none ${isDarkMode ? "focus:border-white/50" : "focus:border-black/50"} transition-all`}
                                        />
                                    </div>
                                    <div>
                                        <label className={`block text-[10px] font-mono uppercase tracking-[0.2em] ${isDarkMode ? "text-white/40" : "text-black/40"} mb-3`}>
                                            System Prompt
                                        </label>
                                        <textarea
                                            value={customPrompt}
                                            onChange={(e) => setCustomPrompt(e.target.value)}
                                            placeholder="Describe how this AI persona should behave, what tone to use, what knowledge areas to focus on..."
                                            rows={5}
                                            className={`w-full p-4 text-xs font-mono ${isDarkMode ? "bg-white/5 border-white/10 text-white placeholder:text-white/20" : "bg-black/5 border-black/10 text-black placeholder:text-black/20"} border rounded-2xl focus:outline-none ${isDarkMode ? "focus:border-white/50" : "focus:border-black/50"} transition-all resize-none`}
                                        />
                                    </div>
                                    <button
                                        onClick={handleCreateCustom}
                                        disabled={!customName.trim() || !customPrompt.trim()}
                                        className={`w-full py-5 ${isDarkMode ? "bg-white text-black" : "bg-black text-white"} text-[10px] font-mono font-black uppercase tracking-[0.3em] rounded-[2rem] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-30`}
                                    >
                                        <UserPlus className="h-4 w-4 inline mr-2 -mt-0.5" />
                                        Create Persona
                                    </button>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
