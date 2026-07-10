"use client";

import { useMemo, useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
    Trophy, Target, CheckCircle2, XCircle, Lightbulb,
    ClipboardList, Mic, Star, TrendingUp, BookOpen, MessageCircle, Download, Loader2
} from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

interface ReportCardProps {
    content: string;
    isDarkMode: boolean;
    onExplainMore?: (topic: string) => void;
}

type ReportType = "interview" | "mcq" | "unknown";

interface MCQResult {
    question: string;
    isCorrect: boolean;
    userAnswer: string;
    correctAnswer: string;
    explanation: string;
}

function detectReportType(content: string): ReportType {
    if (content.includes("Interview Analysis Report")) return "interview";
    if (content.includes("Quiz Complete")) return "mcq";
    return "unknown";
}

function parseMCQResults(content: string): { score: string; results: MCQResult[] } {
    const scoreMatch = content.match(/\*\*Score:\s*(\d+\/\d+\s*\(\d+%\))/);
    const score = scoreMatch ? scoreMatch[1] : "";

    const results: MCQResult[] = [];
    const qBlocks = content.split(/\*\*Q\d+\.\*\*/).slice(1);

    for (const block of qBlocks) {
        const isCorrect = block.includes("[Correct]");
        const lines = block.trim().split("\n").map(l => l.trim()).filter(Boolean);
        const question = lines[0]?.replace(/\[(Correct|Wrong)\]\s*/, "") || "";

        let userAnswer = "";
        let correctAnswer = "";
        let explanation = "";

        for (const line of lines) {
            if (line.startsWith("> Your answer:")) userAnswer = line.replace("> Your answer:", "").trim();
            if (line.startsWith("> Correct answer:")) correctAnswer = line.replace("> Correct answer:", "").trim();
            if (line.startsWith("> *") && line.endsWith("*")) explanation = line.replace(/^>\s*\*|\*$/g, "");
        }

        results.push({ question, isCorrect, userAnswer, correctAnswer, explanation });
    }

    return { score, results };
}

function parseInterviewSections(content: string): { title: string; blocks: { heading: string; content: string }[] } {
    const withoutHeader = content.replace(/##\s*Interview Analysis Report\s*/i, "").trim();
    const lines = withoutHeader.split("\n");
    const blocks: { heading: string; content: string }[] = [];
    let currentHeading = "";
    let currentContent: string[] = [];

    for (const line of lines) {
        const headingMatch = line.match(/^#{1,3}\s+(.+)/);
        if (headingMatch) {
            if (currentHeading) {
                blocks.push({ heading: currentHeading, content: currentContent.join("\n").trim() });
            }
            currentHeading = headingMatch[1];
            currentContent = [];
        } else {
            currentContent.push(line);
        }
    }
    if (currentHeading) {
        blocks.push({ heading: currentHeading, content: currentContent.join("\n").trim() });
    }

    if (blocks.length === 0 && withoutHeader) {
        blocks.push({ heading: "Analysis", content: withoutHeader });
    }

    return { title: "Interview Analysis Report", blocks };
}

function BoldText({ text, isDarkMode }: { text: string; isDarkMode: boolean }) {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return (
        <>
            {parts.map((part, i) => {
                if (part.startsWith("**") && part.endsWith("**")) {
                    return (
                        <strong key={i} className={`font-bold ${isDarkMode ? "text-white" : "text-black"}`}>
                            {part.slice(2, -2)}
                        </strong>
                    );
                }
                return <span key={i}>{part}</span>;
            })}
        </>
    );
}

function ExplainButton({ onClick, isDarkMode }: { onClick: () => void; isDarkMode: boolean }) {
    return (
        <button
            onClick={(e) => { e.stopPropagation(); onClick(); }}
            className={`mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-mono font-bold uppercase tracking-wider transition-all ${
                isDarkMode
                    ? "bg-white text-black hover:bg-white/90 border border-white/20"
                    : "bg-black text-white hover:bg-black/90 border border-black/20"
            }`}
        >
            <MessageCircle className="h-3 w-3" />
            Explain More
        </button>
    );
}

function DownloadButton({ targetRef, filename, isDarkMode }: { targetRef: React.RefObject<HTMLDivElement | null>; filename: string; isDarkMode: boolean }) {
    const [downloading, setDownloading] = useState(false);

    const handleDownload = useCallback(async () => {
        if (!targetRef.current || downloading) return;
        setDownloading(true);
        try {
            const el = targetRef.current;
            const canvas = await html2canvas(el, {
                scale: 2,
                useCORS: true,
                backgroundColor: isDarkMode ? "#111111" : "#ffffff",
                logging: false,
            });
            const imgData = canvas.toDataURL("image/png");
            const pdf = new jsPDF("p", "mm", "a4");
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
            pdf.save(`${filename}.pdf`);
        } catch (err) {
            console.error("PDF download failed:", err);
        } finally {
            setDownloading(false);
        }
    }, [targetRef, filename, isDarkMode, downloading]);

    return (
        <button
            onClick={(e) => { e.stopPropagation(); handleDownload(); }}
            disabled={downloading}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-mono font-bold uppercase tracking-wider transition-all ${
                isDarkMode
                    ? "bg-white/10 text-white/60 hover:text-white hover:bg-white/15 border border-white/10"
                    : "bg-black/5 text-black/50 hover:text-black hover:bg-black/10 border border-black/10"
            }`}
        >
            {downloading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
            {downloading ? "Saving..." : "Download PDF"}
        </button>
    );
}

function MCQReport({ content, isDarkMode, onExplainMore }: ReportCardProps) {
    const { score, results } = useMemo(() => parseMCQResults(content), [content]);
    const correctCount = results.filter(r => r.isCorrect).length;
    const wrongCount = results.length - correctCount;
    const percentage = results.length > 0 ? Math.round((correctCount / results.length) * 100) : 0;
    const cardRef = useRef<HTMLDivElement>(null);

    const getGrade = (pct: number) => {
        if (pct >= 90) return { label: "Outstanding", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" };
        if (pct >= 70) return { label: "Good", color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" };
        if (pct >= 50) return { label: "Average", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" };
        return { label: "Needs Improvement", color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20" };
    };

    const grade = getGrade(percentage);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className={`w-full max-w-[520px] rounded-3xl border overflow-hidden ${
                isDarkMode
                    ? "bg-gradient-to-br from-[#1a1a1a] to-[#111] border-white/10"
                    : "bg-gradient-to-br from-white to-gray-50 border-black/10"
            }`}
        >
            {/* Header */}
            <div className={`relative px-6 py-5 ${
                isDarkMode
                    ? "bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-red-500/10"
                    : "bg-gradient-to-r from-amber-500/5 via-orange-500/5 to-red-500/5"
            }`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl ${isDarkMode ? "bg-amber-500/15" : "bg-amber-500/10"}`}>
                            <Trophy className={`h-5 w-5 ${isDarkMode ? "text-amber-400" : "text-amber-600"}`} />
                        </div>
                        <div>
                            <h3 className={`text-sm font-bold tracking-wide ${isDarkMode ? "text-white" : "text-black"}`}>
                                Quiz Complete
                            </h3>
                            <p className={`text-[10px] font-mono uppercase tracking-wider ${isDarkMode ? "text-white/40" : "text-black/40"}`}>
                                Results Summary
                            </p>
                        </div>
                    </div>
                    <DownloadButton targetRef={cardRef} filename="MCQ-Quiz-Report" isDarkMode={isDarkMode} />
                </div>
            </div>

            <div ref={cardRef}>
                {/* Score Section */}
                <div className="px-6 py-4">
                    <div className={`flex items-center gap-4 p-4 rounded-2xl border ${grade.bg} ${grade.border}`}>
                        <div className="flex-1">
                            <div className={`text-3xl font-black tracking-tight ${grade.color}`}>
                                {percentage}%
                            </div>
                            <div className={`text-[10px] font-mono uppercase tracking-wider mt-1 ${isDarkMode ? "text-white/40" : "text-black/40"}`}>
                                {correctCount} of {results.length} correct
                            </div>
                        </div>
                        <div className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${grade.bg} ${grade.color} border ${grade.border}`}>
                            {grade.label}
                        </div>
                    </div>

                    {/* Stats Row */}
                    <div className="flex gap-2 mt-3">
                        <div className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-xl ${isDarkMode ? "bg-emerald-500/5 border border-emerald-500/10" : "bg-emerald-500/5 border border-emerald-500/10"}`}>
                            <CheckCircle2 className={`h-3.5 w-3.5 ${isDarkMode ? "text-emerald-400" : "text-emerald-600"}`} />
                            <span className={`text-[10px] font-mono font-bold ${isDarkMode ? "text-emerald-400" : "text-emerald-600"}`}>{correctCount} Correct</span>
                        </div>
                        <div className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-xl ${isDarkMode ? "bg-red-500/5 border border-red-500/10" : "bg-red-500/5 border border-red-500/10"}`}>
                            <XCircle className={`h-3.5 w-3.5 ${isDarkMode ? "text-red-400" : "text-red-600"}`} />
                            <span className={`text-[10px] font-mono font-bold ${isDarkMode ? "text-red-400" : "text-red-600"}`}>{wrongCount} Wrong</span>
                        </div>
                    </div>
                </div>

                {/* Question Results */}
                <div className="px-6 pb-5">
                    <div className={`flex items-center gap-2 mb-3`}>
                        <ClipboardList className={`h-3.5 w-3.5 ${isDarkMode ? "text-white/30" : "text-black/30"}`} />
                        <span className={`text-[10px] font-mono uppercase tracking-wider ${isDarkMode ? "text-white/30" : "text-black/30"}`}>
                            Question Breakdown
                        </span>
                    </div>
                    <div className="space-y-2">
                        {results.map((r, idx) => (
                            <div
                                key={idx}
                                className={`p-3 rounded-xl border transition-all ${
                                    r.isCorrect
                                        ? isDarkMode
                                            ? "bg-emerald-500/[0.03] border-emerald-500/15"
                                            : "bg-emerald-500/[0.03] border-emerald-500/15"
                                        : isDarkMode
                                            ? "bg-red-500/[0.03] border-red-500/15"
                                            : "bg-red-500/[0.03] border-red-500/15"
                                }`}
                            >
                                <div className="flex items-start gap-2.5">
                                    {r.isCorrect ? (
                                        <CheckCircle2 className={`h-4 w-4 mt-0.5 shrink-0 ${isDarkMode ? "text-emerald-400" : "text-emerald-600"}`} />
                                    ) : (
                                        <XCircle className={`h-4 w-4 mt-0.5 shrink-0 ${isDarkMode ? "text-red-400" : "text-red-600"}`} />
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-[11px] font-bold leading-relaxed ${isDarkMode ? "text-white/80" : "text-black/80"}`}>
                                            Q{idx + 1}. <BoldText text={r.question} isDarkMode={isDarkMode} />
                                        </p>
                                        <div className="mt-1.5 space-y-0.5">
                                            {!r.isCorrect && (
                                                <p className={`text-[9px] ${isDarkMode ? "text-red-400/70" : "text-red-600/70"}`}>
                                                    Your answer: {r.userAnswer}
                                                </p>
                                            )}
                                            <p className={`text-[9px] ${isDarkMode ? "text-emerald-400/70" : "text-emerald-600/70"}`}>
                                                Correct: {r.correctAnswer}
                                            </p>
                                        </div>
                                        {r.explanation && (
                                            <div className={`mt-2 flex items-start gap-1.5 p-2 rounded-lg ${isDarkMode ? "bg-white/[0.03]" : "bg-black/[0.03]"}`}>
                                                <Lightbulb className={`h-3 w-3 mt-0.5 shrink-0 ${isDarkMode ? "text-amber-400/60" : "text-amber-600/60"}`} />
                                                <p className={`text-[9px] leading-relaxed ${isDarkMode ? "text-white/40" : "text-black/40"}`}>
                                                    {r.explanation}
                                                </p>
                                            </div>
                                        )}
                                        {!r.isCorrect && onExplainMore && (
                                            <ExplainButton
                                                isDarkMode={isDarkMode}
                                                onClick={() => onExplainMore(
                                                    `Explain this concept in detail for Q${idx + 1}: "${r.question}"\nThe correct answer is "${r.correctAnswer}". Why is this correct? Provide a thorough explanation with examples.`
                                                )}
                                            />
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

function InterviewReport({ content, isDarkMode, onExplainMore }: ReportCardProps) {
    const { blocks } = useMemo(() => parseInterviewSections(content), [content]);
    const cardRef = useRef<HTMLDivElement>(null);

    const getBlockIcon = (heading: string) => {
        const h = heading.toLowerCase();
        if (h.includes("question") || h.includes("asked")) return <Mic className="h-3.5 w-3.5" />;
        if (h.includes("ideal") || h.includes("correct") || h.includes("answer")) return <Target className="h-3.5 w-3.5" />;
        if (h.includes("recommend") || h.includes("improve") || h.includes("tip")) return <TrendingUp className="h-3.5 w-3.5" />;
        if (h.includes("topic") || h.includes("study")) return <BookOpen className="h-3.5 w-3.5" />;
        if (h.includes("user") || h.includes("actual") || h.includes("response")) return <Star className="h-3.5 w-3.5" />;
        return <ClipboardList className="h-3.5 w-3.5" />;
    };

    const getBlockColor = (heading: string) => {
        const h = heading.toLowerCase();
        if (h.includes("question") || h.includes("asked")) return { icon: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/15" };
        if (h.includes("ideal") || h.includes("correct") || h.includes("answer")) return { icon: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/15" };
        if (h.includes("recommend") || h.includes("improve")) return { icon: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/15" };
        if (h.includes("topic") || h.includes("study")) return { icon: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/15" };
        if (h.includes("user") || h.includes("actual")) return { icon: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/15" };
        return { icon: "text-neutral-400", bg: "bg-neutral-500/10", border: "border-neutral-500/15" };
    };

    const shouldShowExplain = (heading: string) => {
        const h = heading.toLowerCase();
        return h.includes("recommend") || h.includes("improve") || h.includes("user") || h.includes("actual") || h.includes("topic") || h.includes("study");
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className={`w-full max-w-[560px] rounded-3xl border overflow-hidden ${
                isDarkMode
                    ? "bg-gradient-to-br from-[#1a1a1a] to-[#111] border-white/10"
                    : "bg-gradient-to-br from-white to-gray-50 border-black/10"
            }`}
        >
            {/* Header */}
            <div className={`relative px-6 py-5 ${
                isDarkMode
                    ? "bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10"
                    : "bg-gradient-to-r from-blue-500/5 via-indigo-500/5 to-purple-500/5"
            }`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl ${isDarkMode ? "bg-blue-500/15" : "bg-blue-500/10"}`}>
                            <Mic className={`h-5 w-5 ${isDarkMode ? "text-blue-400" : "text-blue-600"}`} />
                        </div>
                        <div>
                            <h3 className={`text-sm font-bold tracking-wide ${isDarkMode ? "text-white" : "text-black"}`}>
                                Interview Analysis Report
                            </h3>
                            <p className={`text-[10px] font-mono uppercase tracking-wider ${isDarkMode ? "text-white/40" : "text-black/40"}`}>
                                Performance Review
                            </p>
                        </div>
                    </div>
                    <DownloadButton targetRef={cardRef} filename="Interview-Analysis-Report" isDarkMode={isDarkMode} />
                </div>
            </div>

            <div ref={cardRef}>
                {/* Blocks */}
                <div className="px-6 py-4 space-y-3">
                    {blocks.map((block, idx) => {
                        const colors = getBlockColor(block.heading);
                        return (
                            <div
                                key={idx}
                                className={`p-4 rounded-2xl border ${colors.bg} ${colors.border}`}
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    <span className={colors.icon}>{getBlockIcon(block.heading)}</span>
                                    <h4 className={`text-[11px] font-bold uppercase tracking-wider ${isDarkMode ? "text-white/70" : "text-black/70"}`}>
                                        {block.heading}
                                    </h4>
                                </div>
                                <div className={`text-[11px] leading-relaxed whitespace-pre-wrap ${isDarkMode ? "text-white/50" : "text-black/50"}`}>
                                    <BoldText text={block.content} isDarkMode={isDarkMode} />
                                </div>
                                {shouldShowExplain(block.heading) && onExplainMore && (
                                    <ExplainButton
                                        isDarkMode={isDarkMode}
                                        onClick={() => onExplainMore(
                                            `Explain in detail about the interview section "${block.heading}". Content: ${block.content}. Provide a comprehensive explanation with examples and study tips.`
                                        )}
                                    />
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </motion.div>
    );
}

export default function ReportCard({ content, isDarkMode, onExplainMore }: ReportCardProps) {
    const reportType = useMemo(() => detectReportType(content), [content]);

    if (reportType === "mcq") return <MCQReport content={content} isDarkMode={isDarkMode} onExplainMore={onExplainMore} />;
    if (reportType === "interview") return <InterviewReport content={content} isDarkMode={isDarkMode} onExplainMore={onExplainMore} />;
    return null;
}

export function isReportMessage(content: string): boolean {
    return detectReportType(content) !== "unknown";
}
