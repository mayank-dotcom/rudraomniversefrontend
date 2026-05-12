"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Bot, GraduationCap, Code2, FileText, UserCog, Mic, Calendar, ChevronLeft, ChevronRight
} from "lucide-react";
import ChatLoader from "@/components/ui/ChatLoader";

interface FeatureCardData {
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    description: string;
    category: string;
    engine: string;
}

const allCards: FeatureCardData[] = [
    {
        icon: GraduationCap,
        title: "Student Mode",
        description: "AI-powered explanations, summaries, and study help for any subject.",
        category: "Text",
        engine: "Student Mode",
    },
    {
        icon: Code2,
        title: "Code & GitHub",
        description: "Write, debug, and review code with intelligent AI assistance.",
        category: "Text",
        engine: "Coding & GitHub",
    },
    {
        icon: GraduationCap,
        title: "Mock Paper Generator",
        description: "Generate full practice exam papers for any subject instantly.",
        category: "Text",
        engine: "Mock Paper Generator",
    },
    {
        icon: UserCog,
        title: "Interview Prep",
        description: "Practice technical and HR interviews with AI-driven mock sessions.",
        category: "Text",
        engine: "Interview Prep",
    },
    {
        icon: Mic,
        title: "Vision Solver",
        description: "Upload images to analyze, explain diagrams, or solve visual problems.",
        category: "Image",
        engine: "Vision Solver",
    },
    {
        icon: Calendar,
        title: "PDF Research",
        description: "Extract insights and answers from any PDF document with AI.",
        category: "PDF",
        engine: "PDF Research",
    },
    {
        icon: FileText,
        title: "Resume Audit",
        description: "Get detailed AI feedback to optimize your resume for any role.",
        category: "PDF",
        engine: "Resume Audit",
    },
];

interface WelcomeBoxProps {
    isDarkMode: boolean;
    onSelectEngine: (engine: string) => void;
    onOpenMockPaper: () => void;
    onOpenInterview: () => void;
}

const WelcomeBox = ({ isDarkMode, onSelectEngine, onOpenMockPaper, onOpenInterview }: WelcomeBoxProps) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    const displayCards = allCards.slice(currentIndex, currentIndex + 2);

    const handlePrev = () => {
        setCurrentIndex((prev) => Math.max(0, prev - 2));
    };

    const handleNext = () => {
        setCurrentIndex((prev) => Math.min(allCards.length - 2, prev + 2));
    };

    const handleCardClick = (card: FeatureCardData) => {
        if (card.engine === "Mock Paper Generator") {
            onOpenMockPaper();
        } else if (card.engine === "Interview Prep") {
            onOpenInterview();
        } else {
            onSelectEngine(card.engine);
        }
    };

    const totalPages = Math.ceil(allCards.length / 2);
    const currentPage = Math.floor(currentIndex / 2);

    return (
        <motion.div
            key="welcome-box"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col items-center justify-center text-center w-full py-8 px-2"
        >
            {/* Top Icon */}
            <div className={`mt-10 mb-6 h-14 w-14 rounded-full flex items-center justify-center border-2 border-dotted border-emerald-500/60 ${isDarkMode
                ? "bg-emerald-500/10"
                : "bg-emerald-600/10"
                } overflow-hidden`}>
                <div className="scale-[0.4] flex items-center justify-center">
                    <ChatLoader isDarkMode={isDarkMode} />
                </div>
            </div>






            {/* Dots Indicator */}
            <div className="flex gap-2 mb-6">
                {Array.from({ length: totalPages }).map((_, idx) => (
                    <div
                        key={idx}
                        className={`h-1.5 rounded-full transition-all duration-300 ${currentPage === idx
                            ? isDarkMode ? "w-6 bg-emerald-500" : "w-6 bg-emerald-600"
                            : isDarkMode ? "w-2 bg-white/20" : "w-2 bg-black/20"
                            }`}
                    />
                ))}
            </div>

            {/* Feature Cards Container with Arrows */}
            <div className="flex items-center justify-center w-full gap-2 sm:gap-6 mb-8 px-4">
                {/* Left Arrow */}
                <button
                    onClick={handlePrev}
                    disabled={currentIndex === 0}
                    className={`p-2 sm:p-3 border rounded-full transition-all flex-shrink-0 ${isDarkMode
                        ? "border-white/10 text-white/40 hover:text-white hover:border-white/30 hover:bg-white/5 disabled:opacity-20 disabled:hover:bg-transparent"
                        : "border-black/10 text-black/40 hover:text-black hover:border-black/30 hover:bg-black/5 disabled:opacity-20 disabled:hover:bg-transparent"
                        }`}
                >
                    <ChevronLeft className="h-5 w-5" />
                </button>

                <div className="flex-1">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentIndex}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.25 }}
                            className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full"
                        >
                            {displayCards.map((card) => {
                                const Icon = card.icon;
                                return (
                                     <motion.button
                                         key={card.engine}
                                         whileHover={{ scale: 1.02 }}
                                         whileTap={{ scale: 0.97 }}
                                         onClick={() => handleCardClick(card)}
                                         className={`p-4 border text-left transition-all duration-300 cursor-pointer group relative overflow-hidden ${
                                            isDarkMode 
                                                ? "border-zinc-800/50 bg-gradient-to-br from-zinc-900 via-black to-zinc-900 hover:border-white/20" 
                                                : "border-zinc-800/50 bg-gradient-to-br from-zinc-100 via-white to-zinc-100 hover:border-black/20"
                                         }`}
                                     >
                                        <div className={`absolute inset-0 bg-[linear-gradient(110deg,transparent_0%,rgba(255,255,255,0.03)_45%,rgba(255,255,255,0.06)_50%,rgba(255,255,255,0.03)_55%,transparent_100%)]`} />
                                        <div className="flex items-center gap-3 mb-2">
                                             <Icon
                                                 className={`h-5 w-5 flex-shrink-0 transition-colors duration-300 ${
                                                     isDarkMode
                                                         ? (Icon === Calendar ? 'text-white' : 'text-emerald-500/60 group-hover:text-emerald-400')
                                                         : 'text-emerald-600/60 group-hover:text-emerald-500'
                                                 }`}
                                             />
                                             <h3 className={`text-xs font-bold tracking-wide ${isDarkMode ? "text-white" : "text-black"
                                                 }`}>
                                                 {card.title}
                                             </h3>
                                         </div>
                                         <p className={`text-[10px] font-mono leading-relaxed ${isDarkMode ? "text-white/40" : "text-black/60"
                                             }`}>
                                             {card.description}
                                         </p>
                                    </motion.button>
                                );
                            })}
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Right Arrow */}
                <button
                    onClick={handleNext}
                    disabled={currentIndex >= allCards.length - 2}
                    className={`p-2 sm:p-3 border rounded-full transition-all flex-shrink-0 ${isDarkMode
                        ? "border-white/10 text-white/40 hover:text-white hover:border-white/30 hover:bg-white/5 disabled:opacity-20 disabled:hover:bg-transparent"
                        : "border-black/10 text-black/40 hover:text-black hover:border-black/30 hover:bg-black/5 disabled:opacity-20 disabled:hover:bg-transparent"
                        }`}
                >
                    <ChevronRight className="h-5 w-5" />
                </button>
            </div>
        </motion.div>
    );
};

export default WelcomeBox;
