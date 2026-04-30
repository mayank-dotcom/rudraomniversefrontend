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
}

const MockPaperModal: React.FC<MockPaperModalProps> = ({ isOpen, onClose, onGenerate, isDarkMode }) => {
    const [config, setConfig] = useState<MockPaperConfig>({
        examType: 'IIT JEE',
        duration: '3 HR',
        numQuestions: 10
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
                    className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                />
                
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className={`relative w-full max-w-xl border ${isDarkMode ? "bg-[#0d0d0d] border-white/10" : "bg-white border-black/10"} p-10 rounded-[2.5rem] shadow-2xl overflow-hidden`}
                >
                    {/* Background Accents */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-[60px] rounded-full" />
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/10 blur-[60px] rounded-full" />

                    <div className="relative z-10">
                        <div className="flex justify-between items-center mb-10">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-black shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                                    <GraduationCap className="h-6 w-6" />
                                </div>
                                <div className="flex flex-col text-left">
                                    <h2 className={`text-2xl font-display font-black tracking-tight ${isDarkMode ? "text-white" : "text-black"} uppercase`}>Mock Paper Generator</h2>
                                    <p className="text-[10px] font-mono opacity-40 uppercase tracking-[0.2em]">Synthesize professional assessment modules</p>
                                </div>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors opacity-40 hover:opacity-100">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="space-y-8">
                            {/* Exam Type */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 opacity-40">
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
                                                    ? "bg-emerald-500 text-black border-emerald-500 font-bold" 
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
                                        className={`w-full p-4 text-[10px] font-mono tracking-widest ${isDarkMode ? "bg-white/5 border-white/10" : "bg-black/5 border-black/10"} border rounded-2xl focus:outline-none focus:border-emerald-500/50 transition-all`}
                                    />
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-8">
                                {/* Time Allocation */}
                                <div className="space-y-4 text-left">
                                    <div className="flex items-center gap-3 opacity-40">
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

                                {/* Questions Qty */}
                                <div className="space-y-4 text-left">
                                    <div className="flex items-center gap-3 opacity-40">
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
                                className="w-full py-5 bg-white text-black text-[10px] font-mono font-black uppercase tracking-[0.3em] rounded-[2rem] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-emerald-500/10 mt-6"
                            >
                                Generate Neural Paper
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default MockPaperModal;
