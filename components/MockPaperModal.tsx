import React, { useState } from 'react';
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
                    className={`absolute inset-0 backdrop-blur-sm ${isDarkMode ? "bg-black/80" : "bg-white/80"}`}
                />
                
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className={`relative w-full max-w-xl border ${isDarkMode ? "bg-[#0d0d0d] border-white/10" : "bg-white border-black/10"} p-10 rounded-[2.5rem] shadow-2xl overflow-y-auto max-h-[85vh]`}
                >
                    {/* Background Accents */}
                    <div className={`absolute top-0 right-0 w-32 h-32 blur-[60px] rounded-full ${isDarkMode ? "bg-white/5" : "bg-black/5"}`} />
                    <div className={`absolute bottom-0 left-0 w-32 h-32 blur-[60px] rounded-full ${isDarkMode ? "bg-white/5" : "bg-black/5"}`} />

                    <div className="relative z-10">
                        <div className="flex justify-between items-center mb-10">
                            <div className="flex items-center gap-4">
                                <div className={`h-12 w-12 ${isDarkMode ? "bg-white text-black" : "bg-black text-white"} rounded-2xl flex items-center justify-center`}>
                                    <GraduationCap className="h-6 w-6" />
                                </div>
                                <div className="flex flex-col text-left">
                                    <h2 className={`text-2xl font-display font-black tracking-tight ${isDarkMode ? "text-white" : "text-black"} uppercase`}>Mock Paper Generator</h2>
                                    <p className={`text-[10px] font-mono ${isDarkMode ? "text-white/40" : "text-black/40"} uppercase tracking-[0.2em]`}>Synthesize professional assessment modules</p>
                                </div>
                            </div>
                            <button onClick={onClose} className={`p-2 rounded-full transition-colors ${isDarkMode ? "hover:bg-white/10 text-white/40 hover:text-white" : "hover:bg-black/10 text-black/40 hover:text-black"}`}>
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="space-y-8">
                            {/* Mode Selector */}
                            <div className="space-y-4">
                                <div className={`flex items-center gap-3 ${isDarkMode ? "text-white/40" : "text-black/40"}`}>
                                    <ListOrdered className="h-3 w-3" />
                                    <span className="text-[10px] font-mono uppercase tracking-[0.2em]">Assessment Mode</span>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => setConfig({ ...config, mode: "paper" })}
                                        className={`p-4 text-xs font-mono border rounded-2xl transition-all flex items-center justify-between group ${
                                            config.mode === "paper"
                                                ? `${isDarkMode ? "bg-white text-black border-white" : "bg-black text-white border-black"} font-bold`
                                                : (isDarkMode ? "bg-white/5 border-white/10 text-white/60 hover:border-white/30" : "bg-black/5 border-black/10 text-black/60 hover:border-black/30")
                                        }`}
                                    >
                                        Paper Mode
                                        {config.mode === "paper" && <ChevronRight className="h-3 w-3" />}
                                    </button>
                                    <button
                                        onClick={() => setConfig({ ...config, mode: "mcq" })}
                                        className={`p-4 text-xs font-mono border rounded-2xl transition-all flex items-center justify-between group ${
                                            config.mode === "mcq"
                                                ? `${isDarkMode ? "bg-white text-black border-white" : "bg-black text-white border-black"} font-bold`
                                                : (isDarkMode ? "bg-white/5 border-white/10 text-white/60 hover:border-white/30" : "bg-black/5 border-black/10 text-black/60 hover:border-black/30")
                                        }`}
                                    >
                                        MCQ Mode
                                        {config.mode === "mcq" && <ChevronRight className="h-3 w-3" />}
                                    </button>
                                </div>
                            </div>

                            {/* Exam Type */}
                            <div className="space-y-4">
                                <div className={`flex items-center gap-3 ${isDarkMode ? "text-white/40" : "text-black/40"}`}>
                                    <FileText className="h-3 w-3" />
                                    <span className="text-[10px] font-mono uppercase tracking-[0.2em]">Select Examination Domain</span>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    {examTypes.map((type) => (
                                        <button
                                            key={type}
                                            onClick={() => {
                                                setConfig({ ...config, examType: type });
                                                setShowCustom(type === 'Other');
                                            }}
                                            className={`p-4 text-xs font-mono border rounded-2xl transition-all text-left flex items-center justify-between group ${
                                                config.examType === type 
                                                    ? `${isDarkMode ? "bg-white text-black border-white" : "bg-black text-white border-black"} font-bold`
                                                    : (isDarkMode ? "bg-white/5 border-white/10 text-white/60 hover:border-white/30" : "bg-black/5 border-black/10 text-black/60 hover:border-black/30")
                                            }`}
                                        >
                                            {type}
                                            {config.examType === type && <ChevronRight className="h-3 w-3" />}
                                        </button>
                                    ))}
                                </div>
                                {showCustom && (
                                    <motion.input
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        type="text"
                                        placeholder="TYPE CUSTOM EXAM NAME..."
                                        onChange={(e) => setConfig({ ...config, customExamType: e.target.value })}
                                        className={`w-full p-4 text-[10px] font-mono tracking-widest ${isDarkMode ? "bg-white/5 border-white/10 focus:border-white/50" : "bg-black/5 border-black/10 focus:border-black/50"} border rounded-2xl focus:outline-none transition-all`}
                                    />
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-8">
                                {/* Time Allocation — only for Paper Mode */}
                                {config.mode === "paper" && (
                                    <div className="space-y-4 text-left">
                                    <div className={`flex items-center gap-3 ${isDarkMode ? "text-white/40" : "text-black/40"}`}>
                                        <Clock className="h-3 w-3" />
                                            <span className="text-[10px] font-mono uppercase tracking-[0.2em]">Duration</span>
                                        </div>
                                        <select
                                            value={config.duration}
                                            onChange={(e) => setConfig({ ...config, duration: e.target.value })}
                                            className={`w-full p-4 text-xs font-mono ${isDarkMode ? "bg-white/5 border-white/10 text-white" : "bg-black/5 border-black/10 text-black"} border rounded-2xl focus:outline-none`}
                                        >
                                            {durations.map(d => <option key={d} value={d} className={isDarkMode ? "bg-[#0d0d0d]" : "bg-white"}>{d}</option>)}
                                        </select>
                                    </div>
                                )}

                                {/* Questions Qty */}
                                <div className="space-y-4 text-left">
                                    <div className={`flex items-center gap-3 ${isDarkMode ? "text-white/40" : "text-black/40"}`}>
                                        <ListOrdered className="h-3 w-3" />
                                        <span className="text-[10px] font-mono uppercase tracking-[0.2em]">Quantity</span>
                                    </div>
                                    <input
                                        type="number"
                                        min={1}
                                        max={50}
                                        value={config.numQuestions}
                                        onChange={(e) => setConfig({ ...config, numQuestions: parseInt(e.target.value) })}
                                        className={`w-full p-4 text-xs font-mono ${isDarkMode ? "bg-white/5 border-white/10 text-white" : "bg-black/5 border-black/10 text-black"} border rounded-2xl focus:outline-none`}
                                    />
                                </div>
                            </div>

                            <button
                                onClick={() => onGenerate(config)}
                                className={`w-full py-5 ${isDarkMode ? "bg-white text-black shadow-xl shadow-white/10" : "bg-black text-white shadow-xl shadow-black/10"} text-[10px] font-mono font-black uppercase tracking-[0.3em] rounded-[2rem] hover:scale-[1.02] active:scale-[0.98] transition-all mt-6`}
                            >
                                {config.mode === "paper" ? "Generate Neural Paper" : "Start MCQ Quiz"}
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default MockPaperModal;
