import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, GraduationCap, Clock, ListOrdered, ChevronRight, FileText, Sparkles, Smile, Award, Zap, CheckSquare } from 'lucide-react';

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
    cognitiveFocus?: "conceptual" | "practical" | "creative";
    evaluationRigor?: "lax" | "standard" | "rigorous";
    customNotes?: string;
    includeAnswerKey?: boolean;
}

const MockPaperModal: React.FC<MockPaperModalProps> = ({ isOpen, onClose, onGenerate, isDarkMode }) => {
    const [config, setConfig] = useState<MockPaperConfig>({
        examType: 'IIT JEE',
        duration: '3 HR',
        numQuestions: 10,
        mode: "paper",
        cognitiveFocus: "conceptual",
        evaluationRigor: "standard",
        includeAnswerKey: false
    });
    const [showCustom, setShowCustom] = useState(false);
    const [accent, setAccent] = useState<string>("");
    const [customFocused, setCustomFocused] = useState(false);
    const [qtyFocused, setQtyFocused] = useState(false);
    const [durationFocused, setDurationFocused] = useState(false);
    
    // Custom Notes & File Upload States
    const [customSource, setCustomSource] = useState<"name" | "notes" | "document">("name");
    const [uploadedFileName, setUploadedFileName] = useState<string>("");
    const [isExtracting, setIsExtracting] = useState(false);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsExtracting(true);
        try {
            const { processFile } = await import('@/lib/file-processor');
            const processed = await processFile(file);
            setConfig(prev => ({
                ...prev,
                customExamType: file.name.replace(/\.[^/.]+$/, ""), // Use filename without extension
                customNotes: processed.content
            }));
            setUploadedFileName(file.name);
        } catch (err) {
            console.error("File processing failed:", err);
            alert("Failed to parse file: " + (err as Error).message);
        } finally {
            setIsExtracting(false);
        }
    };

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
                    className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                />
                
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    className={`relative w-full max-w-xl rounded-3xl border p-6 sm:p-8 shadow-2xl overflow-y-auto scrollbar-hide max-h-[90vh] transition-all duration-300 ${
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
                        <div className="flex justify-between items-center mb-6">
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

                        <div className="space-y-5 sm:space-y-6">
                            {/* Mode Selector */}
                            <div className="space-y-4">
                                <div className={`flex items-center gap-3 ${isDarkMode ? "text-white/40" : "text-black/40"} text-left`}>
                                    <ListOrdered className="h-3 w-3" />
                                    <span className="text-[9px] font-mono uppercase tracking-[0.2em]">Assessment Mode</span>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    {(["paper", "mcq"] as const).map((mode) => {
                                        const isSelected = config.mode === mode;
                                        const ModeIcon = mode === "paper" ? FileText : CheckSquare;
                                        return (
                                            <button
                                                key={mode}
                                                type="button"
                                                onClick={() => setConfig({ ...config, mode })}
                                                className={`p-4 border rounded-2xl transition-all flex flex-col items-start gap-1.5 group cursor-pointer text-left ${
                                                    isSelected
                                                        ? (accent ? "border-transparent text-white shadow-md font-bold" : (isDarkMode ? "bg-white text-black border-white font-bold" : "bg-black text-white border-black font-bold"))
                                                        : (isDarkMode ? "bg-white/5 border-white/10 text-white/60 hover:border-white/30" : "bg-black/5 border-black/10 text-black/60 hover:border-black/30")
                                                }`}
                                                style={
                                                    isSelected && accent
                                                        ? { backgroundColor: accent, color: isDarkMode ? "#000" : "#fff", borderColor: accent }
                                                        : undefined
                                                }
                                            >
                                                <div className="flex items-center gap-2 w-full justify-between">
                                                    <div className="flex items-center gap-2 font-bold text-xs">
                                                        <ModeIcon className="h-4 w-4" />
                                                        <span>{mode === "paper" ? "Paper Mode" : "MCQ Mode"}</span>
                                                    </div>
                                                    {isSelected && <ChevronRight className="h-3 w-3" />}
                                                </div>
                                                <p className={`text-[9px] font-medium leading-tight ${isSelected ? (isDarkMode ? "text-black/60" : "text-white/70") : (isDarkMode ? "text-white/40" : "text-black/50")}`}>
                                                    {mode === "paper" ? "Standard essay & written structure" : "Fast-paced auto-graded questions"}
                                                </p>
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
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="space-y-4 pt-2 border-t border-white/5"
                                    >
                                        <div className="flex gap-2">
                                            {(["name", "notes", "document"] as const).map((source) => {
                                                const isActive = customSource === source;
                                                return (
                                                    <button
                                                        key={source}
                                                        type="button"
                                                        onClick={() => {
                                                            setCustomSource(source);
                                                            setConfig(prev => ({
                                                                ...prev,
                                                                customExamType: source === "name" ? prev.customExamType : "",
                                                                customNotes: source === "notes" ? prev.customNotes : ""
                                                            }));
                                                            setUploadedFileName("");
                                                        }}
                                                        className={`flex-1 py-2 text-[8px] font-mono uppercase tracking-wider border rounded-xl transition-all cursor-pointer font-bold ${
                                                            isActive
                                                                ? (accent ? "border-transparent text-white shadow-sm" : (isDarkMode ? "bg-white text-black border-white" : "bg-black text-white border-black"))
                                                                : (isDarkMode ? "bg-white/5 border-white/10 text-white/50 hover:border-white/20" : "bg-black/5 border-black/10 text-black/50 hover:border-black/20")
                                                        }`}
                                                        style={isActive && accent ? { backgroundColor: accent, color: isDarkMode ? "#000" : "#fff", borderColor: accent } : undefined}
                                                    >
                                                        {source === "name" ? "Exam Name" : source === "notes" ? "Paste Notes" : "Upload File"}
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        {customSource === "name" && (
                                            <input
                                                type="text"
                                                placeholder="TYPE CUSTOM EXAM NAME..."
                                                onFocus={() => setCustomFocused(true)}
                                                onBlur={() => setCustomFocused(false)}
                                                value={config.customExamType || ""}
                                                onChange={(e) => setConfig({ ...config, customExamType: e.target.value })}
                                                className={`w-full p-3.5 text-xs font-mono rounded-xl border transition-all duration-200 outline-none ${
                                                    isDarkMode
                                                        ? "bg-white/[0.03] border-white/10 text-white placeholder:text-white/20 focus:bg-white/[0.05]"
                                                        : "bg-black/[0.03] border-black/10 text-black placeholder:text-black/40 focus:bg-black/[0.05]"
                                                }`}
                                                style={customFocused && accent ? { borderColor: accent } : undefined}
                                            />
                                        )}

                                        {customSource === "notes" && (
                                            <textarea
                                                placeholder="PASTE YOUR STUDY NOTES / SYLLABUS CONTENT HERE..."
                                                onFocus={() => setCustomFocused(true)}
                                                onBlur={() => setCustomFocused(false)}
                                                value={config.customNotes || ""}
                                                onChange={(e) => setConfig({ ...config, customExamType: "Notes Study", customNotes: e.target.value })}
                                                className={`w-full p-3.5 text-xs font-mono h-24 rounded-xl border transition-all duration-200 outline-none resize-none scrollbar-hide ${
                                                    isDarkMode
                                                        ? "bg-white/[0.03] border-white/10 text-white placeholder:text-white/20 focus:bg-white/[0.05]"
                                                        : "bg-black/[0.03] border-black/10 text-black placeholder:text-black/40 focus:bg-black/[0.05]"
                                                }`}
                                                style={customFocused && accent ? { borderColor: accent } : undefined}
                                            />
                                        )}

                                        {customSource === "document" && (
                                            <div 
                                                className={`border border-dashed rounded-xl p-4 text-center cursor-pointer transition-all duration-200 relative ${
                                                    isDarkMode 
                                                        ? "border-white/20 hover:border-white/40 hover:bg-white/[0.02]" 
                                                        : "border-black/20 hover:border-black/40 hover:bg-black/[0.02]"
                                                }`}
                                            >
                                                <input 
                                                    type="file" 
                                                    accept=".pdf,.txt,.md,.csv" 
                                                    onChange={handleFileUpload} 
                                                    className="absolute inset-0 opacity-0 cursor-pointer" 
                                                    disabled={isExtracting}
                                                />
                                                {isExtracting ? (
                                                    <div className="flex flex-col items-center justify-center gap-1.5 py-1">
                                                        <div className={`h-4 w-4 border-2 border-t-transparent animate-spin rounded-full ${isDarkMode ? "border-white" : "border-black"}`} />
                                                        <p className="text-[9px] font-mono uppercase tracking-wider animate-pulse">Extracting text...</p>
                                                    </div>
                                                ) : uploadedFileName ? (
                                                    <div className="py-1">
                                                        <p className="text-[10px] font-mono font-bold text-emerald-500 truncate px-2">📄 {uploadedFileName}</p>
                                                        <p className="text-[8px] font-mono uppercase tracking-wider opacity-40 mt-1">Click to replace file</p>
                                                    </div>
                                                ) : (
                                                    <div className="py-1">
                                                        <p className="text-[10px] font-mono font-bold">Upload PDF or Text Document</p>
                                                        <p className="text-[8px] font-mono uppercase tracking-wider opacity-40 mt-1">Supports PDF, TXT, MD, CSV</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                            </div>

                            {/* Cognitive Focus */}
                            <div className="space-y-4">
                                <div className={`flex items-center gap-3 ${isDarkMode ? "text-white/40" : "text-black/40"} text-left`}>
                                    <Sparkles className="h-3 w-3" />
                                    <span className="text-[9px] font-mono uppercase tracking-[0.2em]">Cognitive Focus</span>
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    {(["conceptual", "practical", "creative"] as const).map((focusType) => {
                                        const isSelected = config.cognitiveFocus === focusType;
                                        return (
                                            <button
                                                key={focusType}
                                                type="button"
                                                onClick={() => setConfig({ ...config, cognitiveFocus: focusType })}
                                                className={`py-3 text-[10px] font-mono uppercase tracking-wider border rounded-xl transition-all duration-200 cursor-pointer flex items-center justify-center font-bold ${
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
                                                {focusType}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Evaluation Rigor */}
                            <div className="space-y-4">
                                <div className={`flex items-center gap-3 ${isDarkMode ? "text-white/40" : "text-black/40"} text-left`}>
                                    <Zap className="h-3 w-3" />
                                    <span className="text-[9px] font-mono uppercase tracking-[0.2em]">Evaluation Rigor</span>
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    {(["lax", "standard", "rigorous"] as const).map((rigorType) => {
                                        const isSelected = config.evaluationRigor === rigorType;
                                        const RigorIcon = rigorType === "lax" ? Smile : rigorType === "standard" ? Award : Zap;
                                        return (
                                            <button
                                                key={rigorType}
                                                type="button"
                                                onClick={() => setConfig({ ...config, evaluationRigor: rigorType })}
                                                className={`py-3 text-[10px] font-mono uppercase tracking-wider border rounded-xl transition-all duration-200 cursor-pointer flex flex-col items-center justify-center gap-1.5 font-bold ${
                                                    isSelected
                                                        ? (accent ? "border-transparent text-white shadow-md shadow-black/10" : (isDarkMode ? "bg-white text-black border-white" : "bg-black text-white border-black"))
                                                        : (isDarkMode ? "bg-white/5 border-white/10 text-white/60 hover:border-white/30" : "bg-black/5 border-black/10 text-black/60 hover:border-black/30")
                                                }`}
                                                style={
                                                    isSelected && accent
                                                        ? { backgroundColor: accent, color: isDarkMode ? "#000" : "#fff", borderColor: accent }
                                                        : undefined
                                                }
                                            >
                                                <RigorIcon className="h-3.5 w-3.5" />
                                                <span>{rigorType}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Include Answer Key Option — only for Paper Mode */}
                            {config.mode === "paper" && (
                                <div className="flex items-center justify-between border rounded-2xl p-4 border-white/5 transition-all">
                                    <div className="flex flex-col text-left">
                                        <span className="text-xs font-bold font-sans">Include Answer Key</span>
                                        <span className={`text-[9px] font-mono uppercase tracking-wider ${isDarkMode ? "text-white/30" : "text-black/40"}`}>
                                            Appends solutions at the end
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setConfig({ ...config, includeAnswerKey: !config.includeAnswerKey })}
                                        className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors duration-200 focus:outline-none ${
                                            config.includeAnswerKey 
                                                ? (accent ? "" : "bg-white") 
                                                : (isDarkMode ? "bg-white/10" : "bg-black/10")
                                        }`}
                                        style={config.includeAnswerKey && accent ? { backgroundColor: accent } : undefined}
                                    >
                                        <div
                                            className={`w-4 h-4 rounded-full shadow-md transform duration-200 ease-in-out ${
                                                config.includeAnswerKey 
                                                    ? "translate-x-6 bg-black" 
                                                    : "bg-white"
                                            }`}
                                        />
                                    </button>
                                </div>
                            )}

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
