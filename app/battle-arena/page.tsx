"use client";

import { Suspense, useEffect, useRef, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";
import { motion } from "framer-motion";
import { Swords, Users, Clock, Trophy, ArrowLeft, Copy, Check, Play, Loader2, RefreshCw, BarChart3, LineChart, User, Star, Target, X } from "lucide-react";
import { getApiKey } from "@/lib/auth";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart as ReLineChart, Line } from "recharts";

type Phase = "lobby" | "active" | "finished";
type Question = {
    question: string;
    options: string[];
    correctOptionIndex: number;
    explanation: string;
};
type Participant = {
    id: string;
    userId: string | null;
    name: string;
    score: number;
    timeTaken: number;
    finished?: boolean;
};

function ArenaContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const socketRef = useRef<Socket | null>(null);

    const [phase, setPhase] = useState<Phase>("lobby");
    const [lobbyCode, setLobbyCode] = useState(searchParams.get("code") || "");
    const [isHost, setIsHost] = useState(searchParams.get("host") === "true");
    const [adminName, setAdminName] = useState(searchParams.get("name") || "");
    const [participantName, setParticipantName] = useState(searchParams.get("name") || "");
    const [topic, setTopic] = useState(searchParams.get("topic") || "");
    const [difficulty, setDifficulty] = useState(searchParams.get("difficulty") || "medium");
    const [questionCount, setQuestionCount] = useState(parseInt(searchParams.get("count") || "5"));
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [answers, setAnswers] = useState<number[]>([]);
    const [correctCount, setCorrectCount] = useState(0);
    const [startTime, setStartTime] = useState<number | null>(null);
    const [timeLeft, setTimeLeft] = useState(0);
    const [isStarting, setIsStarting] = useState(false);
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [leaderboard, setLeaderboard] = useState<Participant[]>([]);
    const [showAnalysis, setShowAnalysis] = useState(false);
    const [tab, setTab] = useState<"leaderboard" | "analysis">("leaderboard");

    const QUESTION_TIME = 30;

    useEffect(() => {
        const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "";
        const SOCKET_URL = BASE_URL.replace("/api/v1", "");
        const apiKey = getApiKey();

        const socket = io(SOCKET_URL, {
            query: apiKey ? { auth_token: apiKey } : {},
            transports: ["websocket", "polling"],
        });

        socketRef.current = socket;

        socket.on("connect", () => {
            setError(null);
            if (searchParams.get("host") === "true") {
                socket.emit("create_arena", {
                    topic: searchParams.get("topic") || "",
                    questionCount: parseInt(searchParams.get("count") || "5"),
                    difficulty: searchParams.get("difficulty") || "medium",
                    adminName: searchParams.get("name") || "",
                });
            } else if (searchParams.get("code")) {
                socket.emit("join_arena", {
                    lobbyCode: searchParams.get("code"),
                    participantName: searchParams.get("name") || "",
                });
            }
        });

        socket.on("arena_created", (arena) => {
            setLobbyCode(arena.code);
            setParticipants(arena.participants);
        });

        socket.on("arena_joined", (arena) => {
            setLobbyCode(arena.code);
            setParticipants(arena.participants);
        });

        socket.on("participant_joined", (data) => {
            setParticipants(data.participants);
        });

        socket.on("participant_left", (data) => {
            setParticipants(data.participants);
        });

        socket.on("arena_starting", () => {
            setIsStarting(true);
        });

        socket.on("arena_started", (data) => {
            setQuestions(data.questions);
            setStartTime(data.startTime);
            setPhase("active");
            setCurrentQuestionIndex(0);
            setSelectedAnswer(null);
            setAnswers(new Array(data.questions.length).fill(-1));
            setTimeLeft(QUESTION_TIME);
        });

        socket.on("participant_progress", (updatedParticipants) => {
            setParticipants(updatedParticipants);
        });

        socket.on("arena_finished", (data) => {
            setLeaderboard(data.leaderboard);
            setPhase("finished");
        });

        socket.on("error", (data) => {
            setError(data.message);
            socket.disconnect();
        });

        socket.on("disconnect", () => {
            setError("Connection lost. Reconnecting...");
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    useEffect(() => {
        if (phase !== "active" || timeLeft <= 0) return;
        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    handleTimeUp();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [phase, timeLeft, currentQuestionIndex]);

    const handleTimeUp = useCallback(() => {
        submitAnswer();
    }, [currentQuestionIndex, selectedAnswer, questions]);

    const handleSelectAnswer = (optionIndex: number) => {
        if (selectedAnswer !== null) return;
        setSelectedAnswer(optionIndex);
    };

    const submitAnswer = () => {
        const socket = socketRef.current;
        if (!socket) return;

        const newAnswers = [...answers];
        newAnswers[currentQuestionIndex] = selectedAnswer ?? -1;
        setAnswers(newAnswers);

        if (selectedAnswer === questions[currentQuestionIndex]?.correctOptionIndex) {
            setCorrectCount((prev) => prev + 1);
        }

        if (currentQuestionIndex < questions.length - 1) {
            setTimeout(() => {
                setCurrentQuestionIndex((prev) => prev + 1);
                setSelectedAnswer(null);
                setTimeLeft(QUESTION_TIME);
            }, 1000);
        } else {
            const totalTime = startTime ? Math.floor((Date.now() - startTime) / 1000) : 0;
            const finalScore = correctCount + (selectedAnswer === questions[currentQuestionIndex]?.correctOptionIndex ? 1 : 0);
            setTimeout(() => {
                socket.emit("submit_answer", {
                    lobbyCode,
                    score: finalScore,
                    timeTaken: totalTime,
                });
            }, 1500);
        }
    };

    const handleStart = () => {
        socketRef.current?.emit("start_arena", lobbyCode);
    };

    const handleLeave = () => {
        socketRef.current?.disconnect();
        router.push("/");
    };

    const handleCopyCode = () => {
        navigator.clipboard.writeText(lobbyCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const progressPercent = questions.length > 0
        ? ((currentQuestionIndex + (selectedAnswer !== null ? 1 : 0)) / questions.length) * 100
        : 0;

    const totalScore = leaderboard.find((p) => {
        const myName = isHost ? adminName : participantName;
        return p.name === myName;
    })?.score || 0;

    const barData = leaderboard.map((p) => ({
        name: p.name,
        score: p.score,
    }));

    const lineData = questions.map((_, i) => {
        const entry: Record<string, any> = { question: `Q${i + 1}` };
        leaderboard.forEach((p) => {
            entry[p.name] = Math.round((p.score / questions.length) * (i + 1));
        });
        return entry;
    });

    return (
        <div className="min-h-screen w-full bg-[#0a0a0a] text-white selection:bg-white selection:text-black font-sans overflow-hidden">
            <div className="absolute inset-0 noise opacity-[0.02] pointer-events-none" />
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden opacity-10">
                <div className="absolute inset-0" style={{
                    backgroundImage: `linear-gradient(to right, #ffffff05 1px, transparent 1px), linear-gradient(to bottom, #ffffff05 1px, transparent 1px)`,
                    backgroundSize: '100px 100px'
                }} />
            </div>

            <div className="relative z-10 h-screen flex flex-col">
                <header className="h-16 flex-shrink-0 border-b-2 border-white bg-[#0a0a0a]/80 backdrop-blur-xl flex items-center justify-between px-6 relative z-30">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={handleLeave}
                            className="p-2 border border-white/20 hover:border-white/50 text-white/60 hover:text-white transition-all"
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </button>
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 bg-white text-black flex items-center justify-center">
                                <Swords className="h-4 w-4" />
                            </div>
                            <span className="text-sm font-bold uppercase tracking-wider">Battle Arena</span>
                        </div>
                    </div>
                    {phase === "lobby" && lobbyCode && (
                        <div className="flex items-center gap-3">
                            <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-white/40">Lobby</span>
                            <span className="text-lg font-black tracking-[0.3em]">{lobbyCode}</span>
                            <button
                                onClick={handleCopyCode}
                                className="p-2 border border-white/20 hover:border-white/50 text-white/60 hover:text-white transition-all"
                            >
                                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                            </button>
                        </div>
                    )}
                    {phase === "active" && (
                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-white/60" />
                                <span className={`text-lg font-black font-mono ${timeLeft <= 5 ? "text-red-400 animate-pulse" : "text-white"}`}>
                                    {timeLeft}s
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Target className="h-4 w-4 text-white/60" />
                                <span className="text-sm font-mono">{currentQuestionIndex + 1}/{questions.length}</span>
                            </div>
                        </div>
                    )}
                    {phase === "finished" && (
                        <div className="flex items-center gap-3">
                            <Trophy className="h-4 w-4 text-amber-400" />
                            <span className="text-sm font-mono text-white/80">Battle Complete</span>
                        </div>
                    )}
                </header>

                <main className="flex-1 overflow-y-auto custom-scrollbar p-6">
                    {error && (
                        <div className="max-w-xl mx-auto mt-20 p-6 border border-red-500/30 bg-red-500/10 text-center">
                            <X className="h-8 w-8 mx-auto mb-4 text-red-400" />
                            <p className="text-red-400 text-sm font-mono mb-4">{error}</p>
                            <button
                                onClick={() => router.push("/")}
                                className="px-6 py-3 bg-white text-black text-[10px] font-mono font-black uppercase tracking-[0.3em] hover:scale-105 transition-all"
                            >
                                Back to Chat
                            </button>
                        </div>
                    )}

                    {!error && phase === "lobby" && (
                        <div className="max-w-2xl mx-auto mt-12">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="border border-white/10 bg-[#0d0d0d] p-10 rounded-[2.5rem]"
                            >
                                <div className="absolute top-0 right-0 w-32 h-32 blur-[60px] rounded-full bg-white/5 pointer-events-none" />
                                <div className="absolute bottom-0 left-0 w-32 h-32 blur-[60px] rounded-full bg-white/5 pointer-events-none" />

                                <div className="relative z-10">
                                    <div className="flex items-center gap-4 mb-8">
                                        <div className="h-12 w-12 bg-white text-black rounded-2xl flex items-center justify-center">
                                            <Users className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-black tracking-tight uppercase">Waiting Room</h2>
                                            <p className="text-[10px] font-mono text-white/40 uppercase tracking-[0.2em]">
                                                {isHost ? "Share the code to invite players" : "Waiting for host to start..."}
                                            </p>
                                        </div>
                                    </div>

                                    {isHost && lobbyCode && (
                                        <div className="mb-10 p-6 border border-white/10 bg-white/5 rounded-2xl text-center">
                                            <p className="text-[9px] font-mono text-white/30 uppercase tracking-[0.3em] mb-3">Invite Code</p>
                                            <div className="flex items-center justify-center gap-4">
                                                <span className="text-4xl font-black tracking-[0.4em]">{lobbyCode}</span>
                                                <button
                                                    onClick={handleCopyCode}
                                                    className="p-3 bg-white/10 hover:bg-white/20 border border-white/20 transition-all rounded-xl"
                                                >
                                                    {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                                                </button>
                                            </div>
                                            <div className="flex items-center justify-center gap-2 mt-4 text-white/40 text-[10px] font-mono">
                                                <div className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                                Listening for connections...
                                            </div>
                                        </div>
                                    )}

                                    <div className="mb-8">
                                        <div className="flex items-center gap-2 mb-4">
                                            <Users className="h-4 w-4 text-white/40" />
                                            <span className="text-[10px] font-mono text-white/40 uppercase tracking-[0.2em]">
                                                Participants ({participants.length})
                                            </span>
                                        </div>
                                        <div className="space-y-2">
                                            {participants.map((p, i) => (
                                                <motion.div
                                                    key={p.id}
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: i * 0.1 }}
                                                    className={`flex items-center justify-between p-4 border rounded-2xl ${
                                                        (isHost && p.name === adminName) || (!isHost && p.name === participantName)
                                                            ? "bg-white/10 border-white/30"
                                                            : "bg-white/5 border-white/10"
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-8 w-8 bg-white/10 rounded-full flex items-center justify-center">
                                                            <User className="h-4 w-4" />
                                                        </div>
                                                        <div>
                                                            <span className="text-sm font-medium">{p.name}</span>
                                                            {((isHost && p.name === adminName) || (!isHost && p.name === participantName)) && (
                                                                <span className="ml-2 text-[9px] font-mono text-white/40">(You)</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    {i === 0 && (
                                                        <span className="text-[8px] font-mono px-2 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-full uppercase tracking-wider">
                                                            Host
                                                        </span>
                                                    )}
                                                </motion.div>
                                            ))}
                                            {participants.length === 0 && (
                                                <div className="p-8 text-center text-white/20 text-xs font-mono">
                                                    Waiting for players to join...
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {isHost && (
                                        <button
                                            onClick={handleStart}
                                            disabled={participants.length < 1 || isStarting}
                                            className={`w-full py-5 bg-white text-black text-[10px] font-mono font-black uppercase tracking-[0.3em] rounded-[2rem] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-30 flex items-center justify-center gap-3`}
                                        >
                                            {isStarting ? (
                                                <>
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                    Generating Questions...
                                                </>
                                            ) : (
                                                <>
                                                    <Play className="h-4 w-4" />
                                                    Start Battle
                                                </>
                                            )}
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        </div>
                    )}

                    {!error && phase === "active" && questions.length > 0 && (
                        <div className="max-w-5xl mx-auto mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-2">
                                <motion.div
                                    key={currentQuestionIndex}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="border border-white/10 bg-[#0d0d0d] p-8 rounded-[2.5rem]"
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-[9px] font-mono text-white/30 uppercase tracking-[0.2em]">
                                            Question {currentQuestionIndex + 1} of {questions.length}
                                        </span>
                                        <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-white/60">
                                            {topic}
                                        </span>
                                    </div>

                                    <div className="h-1 w-full bg-white/10 rounded-full mb-6 overflow-hidden">
                                        <div
                                            className="h-full bg-white transition-all duration-500"
                                            style={{ width: `${progressPercent}%` }}
                                        />
                                    </div>

                                    <h3 className="text-xl font-bold mb-8 leading-relaxed">
                                        {questions[currentQuestionIndex].question}
                                    </h3>

                                    <div className="space-y-3">
                                        {questions[currentQuestionIndex].options.map((opt, i) => {
                                            const isSelected = selectedAnswer === i;
                                            const isCorrect = questions[currentQuestionIndex].correctOptionIndex === i;
                                            const showResult = selectedAnswer !== null;
                                            let optionClass = "bg-white/5 border-white/10 hover:border-white/30 hover:bg-white/10";

                                            if (showResult) {
                                                if (isCorrect) {
                                                    optionClass = "bg-emerald-500/20 border-emerald-500 text-emerald-400";
                                                } else if (isSelected && !isCorrect) {
                                                    optionClass = "bg-red-500/20 border-red-500 text-red-400";
                                                } else {
                                                    optionClass = "bg-white/5 border-white/10 text-white/40";
                                                }
                                            } else if (isSelected) {
                                                optionClass = "bg-white/10 border-white";
                                            }

                                            return (
                                                <button
                                                    key={i}
                                                    onClick={() => handleSelectAnswer(i)}
                                                    disabled={selectedAnswer !== null}
                                                    className={`w-full text-left p-5 border rounded-2xl text-sm transition-all flex items-center gap-4 ${optionClass}`}
                                                >
                                                    <span className={`h-7 w-7 flex items-center justify-center rounded-full text-xs font-mono border ${isSelected ? "border-white bg-white text-black" : "border-white/20"}`}>
                                                        {String.fromCharCode(65 + i)}
                                                    </span>
                                                    <span className="flex-1">{opt}</span>
                                                    {showResult && isCorrect && <Check className="h-4 w-4 text-emerald-400" />}
                                                    {showResult && isSelected && !isCorrect && <X className="h-4 w-4 text-red-400" />}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {selectedAnswer !== null && questions[currentQuestionIndex].explanation && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="mt-6 p-4 border border-white/10 bg-white/5 rounded-2xl"
                                        >
                                            <span className="text-[9px] font-mono text-white/40 uppercase tracking-[0.2em] block mb-2">Explanation</span>
                                            <p className="text-sm text-white/80">{questions[currentQuestionIndex].explanation}</p>
                                        </motion.div>
                                    )}
                                </motion.div>
                            </div>

                            <div className="lg:col-span-1">
                                <div className="border border-white/10 bg-[#0d0d0d] p-6 rounded-[2.5rem] sticky top-6">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Users className="h-4 w-4 text-white/40" />
                                        <span className="text-[10px] font-mono text-white/40 uppercase tracking-[0.2em]">Live Progress</span>
                                    </div>
                                    <div className="space-y-3">
                                        {participants.map((p, i) => {
                                            const isMe = (isHost && p.name === adminName) || (!isHost && p.name === participantName);
                                            return (
                                                <div
                                                    key={p.id}
                                                    className={`p-3 rounded-2xl border ${isMe ? "bg-white/10 border-white/30" : "bg-white/5 border-white/10"}`}
                                                >
                                                    <div className="flex items-center justify-between mb-2">
                                                        <div className="flex items-center gap-2 text-xs">
                                                            <div className={`h-2 w-2 rounded-full ${p.finished ? "bg-emerald-500" : "bg-amber-500 animate-pulse"}`} />
                                                            <span className={isMe ? "font-bold" : ""}>{p.name}</span>
                                                        </div>
                                                        <span className="text-[10px] font-mono text-white/40">{p.score} pts</span>
                                                    </div>
                                                    <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full transition-all duration-500 ${p.finished ? "bg-emerald-500" : "bg-white"}`}
                                                            style={{ width: `${p.finished ? 100 : Math.min((currentQuestionIndex / questions.length) * 100, 100)}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {!error && phase === "finished" && (
                        <div className="max-w-5xl mx-auto mt-6">
                            {/* Tab Switcher */}
                            <div className="flex mb-6 border-b border-white/10">
                                <button
                                    onClick={() => setTab("leaderboard")}
                                    className={`px-6 py-3 text-[9px] font-mono uppercase tracking-[0.2em] transition-all ${
                                        tab === "leaderboard"
                                            ? "bg-white text-black font-bold"
                                            : "text-white/40 hover:text-white"
                                    }`}
                                >
                                    <Trophy className="h-3 w-3 inline mr-1.5 -mt-0.5" />
                                    Leaderboard
                                </button>
                                <button
                                    onClick={() => setTab("analysis")}
                                    className={`px-6 py-3 text-[9px] font-mono uppercase tracking-[0.2em] transition-all ${
                                        tab === "analysis"
                                            ? "bg-white text-black font-bold"
                                            : "text-white/40 hover:text-white"
                                    }`}
                                >
                                    <BarChart3 className="h-3 w-3 inline mr-1.5 -mt-0.5" />
                                    Analysis
                                </button>
                            </div>

                            {tab === "leaderboard" && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="border border-white/10 bg-[#0d0d0d] p-8 rounded-[2.5rem]"
                                >
                                    <div className="flex items-center gap-4 mb-8">
                                        <div className="h-12 w-12 bg-amber-500 text-black rounded-2xl flex items-center justify-center">
                                            <Trophy className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-black tracking-tight uppercase">Final Rankings</h2>
                                            <p className="text-[10px] font-mono text-white/40 uppercase tracking-[0.2em]">{topic} Battle</p>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        {leaderboard.map((p, i) => {
                                            const isMe = (isHost && p.name === adminName) || (!isHost && p.name === participantName);
                                            const medals = ["text-amber-400", "text-gray-300", "text-amber-600"];
                                            return (
                                                <motion.div
                                                    key={p.id}
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: i * 0.1 }}
                                                    className={`flex items-center p-5 rounded-2xl border transition-all ${
                                                        isMe
                                                            ? "bg-white/10 border-white/30 scale-[1.02]"
                                                            : "bg-white/5 border-white/10"
                                                    }`}
                                                >
                                                    <div className={`w-10 h-10 flex items-center justify-center text-lg font-black font-mono ${i < 3 ? medals[i] : "text-white/30"}`}>
                                                        {i === 0 ? <Trophy className="h-6 w-6" /> : `#${i + 1}`}
                                                    </div>
                                                    <div className="flex-1 ml-4">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-bold">{p.name}</span>
                                                            {isMe && <span className="text-[8px] font-mono text-white/40">(You)</span>}
                                                        </div>
                                                        <div className="flex items-center gap-4 mt-1 text-[10px] font-mono text-white/40">
                                                            <span>Score: {p.score}/{questions.length}</span>
                                                            <span>Time: {p.timeTaken}s</span>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-2xl font-black">{p.score}</div>
                                                        <div className="text-[9px] font-mono text-white/40">points</div>
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                    </div>

                                    <button
                                        onClick={() => router.push("/")}
                                        className="w-full mt-8 py-5 bg-white text-black text-[10px] font-mono font-black uppercase tracking-[0.3em] rounded-[2rem] hover:scale-[1.02] active:scale-[0.98] transition-all"
                                    >
                                        Back to Chat
                                    </button>
                                </motion.div>
                            )}

                            {tab === "analysis" && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="space-y-6"
                                >
                                    {/* Score Comparison Bar Chart */}
                                    <div className="border border-white/10 bg-[#0d0d0d] p-8 rounded-[2.5rem]">
                                        <div className="flex items-center gap-3 mb-6">
                                            <BarChart3 className="h-5 w-5 text-white/60" />
                                            <span className="text-[10px] font-mono text-white/40 uppercase tracking-[0.2em]">Score Comparison</span>
                                        </div>
                                        <div className="h-72">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={barData}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                                                    <XAxis dataKey="name" tick={{ fill: "#ffffff60", fontSize: 11 }} />
                                                    <YAxis tick={{ fill: "#ffffff60", fontSize: 11 }} />
                                                    <Tooltip
                                                        contentStyle={{
                                                            backgroundColor: "#1a1a1a",
                                                            border: "1px solid rgba(255,255,255,0.1)",
                                                            borderRadius: "12px",
                                                            color: "#fff",
                                                        }}
                                                    />
                                                    <Bar dataKey="score" fill="#ffffff" radius={[8, 8, 0, 0]} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>

                                    <div className="border border-white/10 bg-[#0d0d0d] p-8 rounded-[2.5rem]">
                                        <div className="flex items-center gap-3 mb-6">
                                            <LineChart className="h-5 w-5 text-white/60" />
                                            <span className="text-[10px] font-mono text-white/40 uppercase tracking-[0.2em]">Performance Trend</span>
                                        </div>
                                        <div className="h-72">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <ReLineChart data={lineData}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                                                    <XAxis dataKey="question" tick={{ fill: "#ffffff60", fontSize: 11 }} />
                                                    <YAxis tick={{ fill: "#ffffff60", fontSize: 11 }} />
                                                    <Tooltip
                                                        contentStyle={{
                                                            backgroundColor: "#1a1a1a",
                                                            border: "1px solid rgba(255,255,255,0.1)",
                                                            borderRadius: "12px",
                                                            color: "#fff",
                                                        }}
                                                    />
                                                    <Legend
                                                        formatter={(value) => <span style={{ color: "#ffffff80", fontSize: "11px" }}>{value}</span>}
                                                    />
                                                    {leaderboard.map((p, i) => (
                                                        <Line
                                                            key={p.id}
                                                            type="monotone"
                                                            dataKey={p.name}
                                                            stroke={["#ffffff", "#60a5fa", "#f59e0b", "#ef4444", "#10b981"][i % 5]}
                                                            strokeWidth={2}
                                                            dot={{ r: 4 }}
                                                        />
                                                    ))}
                                                </ReLineChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>

                                    {questions.length > 0 && (
                                        <div className="border border-white/10 bg-[#0d0d0d] p-8 rounded-[2.5rem]">
                                            <div className="flex items-center gap-3 mb-6">
                                                <Star className="h-5 w-5 text-white/60" />
                                                <span className="text-[10px] font-mono text-white/40 uppercase tracking-[0.2em]">Answer Key & Explanations</span>
                                            </div>
                                            <div className="space-y-6">
                                                {questions.map((q, i) => {
                                                    const userAnswer = answers[i];
                                                    const isUserCorrect = userAnswer === q.correctOptionIndex;
                                                    return (
                                                        <div key={i} className="p-5 border border-white/10 rounded-2xl bg-white/5">
                                                            <div className="flex items-start gap-3">
                                                                <div className={`h-7 w-7 flex items-center justify-center rounded-full text-xs font-mono border flex-shrink-0 mt-0.5 ${
                                                                    userAnswer === -1
                                                                        ? "border-white/10 text-white/30"
                                                                        : isUserCorrect
                                                                            ? "border-emerald-500 bg-emerald-500/20 text-emerald-400"
                                                                            : "border-red-500 bg-red-500/20 text-red-400"
                                                                }`}>
                                                                    {userAnswer === -1 ? "—" : isUserCorrect ? "✓" : "✗"}
                                                                </div>
                                                                <div className="flex-1">
                                                                    <p className="text-sm font-bold mb-3">
                                                                        <span className="text-white/40 font-mono text-[10px] mr-2">Q{i + 1}.</span>
                                                                        {q.question}
                                                                    </p>
                                                                    <div className="grid grid-cols-2 gap-2 mb-3">
                                                                        {q.options.map((opt, oi) => {
                                                                            const isCorrectOpt = q.correctOptionIndex === oi;
                                                                            const isUserOpt = userAnswer === oi;
                                                                            return (
                                                                                <div key={oi} className={`p-3 rounded-xl text-xs border ${
                                                                                    isCorrectOpt
                                                                                        ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400"
                                                                                        : isUserOpt && !isCorrectOpt
                                                                                            ? "border-red-500/50 bg-red-500/10 text-red-400"
                                                                                            : "border-white/5 text-white/50"
                                                                                }`}>
                                                                                    <span className="font-mono text-[9px] opacity-60 mr-2">{String.fromCharCode(65 + oi)}</span>
                                                                                    {opt}
                                                                                    {isCorrectOpt && <Check className="h-3 w-3 inline ml-1" />}
                                                                                </div>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                    <p className="text-[10px] text-white/50 italic">{q.explanation}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex gap-4">
                                        <button
                                            onClick={() => router.push("/")}
                                            className="flex-1 py-5 bg-white text-black text-[10px] font-mono font-black uppercase tracking-[0.3em] rounded-[2rem] hover:scale-[1.02] active:scale-[0.98] transition-all"
                                        >
                                            Back to Chat
                                        </button>
                                        <button
                                            onClick={() => router.push(`/?arena=host&topic=${encodeURIComponent(topic)}&difficulty=${difficulty}&count=${questionCount}`)}
                                            className="px-8 py-5 border border-white/20 text-white text-[10px] font-mono font-black uppercase tracking-[0.3em] rounded-[2rem] hover:bg-white/10 hover:border-white/40 transition-all flex items-center gap-2"
                                        >
                                            <RefreshCw className="h-4 w-4" />
                                            Rematch
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}

export default function BattleArenaPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen w-full bg-[#0a0a0a] text-white flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                    <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-white/60">Loading Battle Arena...</p>
                </div>
            </div>
        }>
            <ArenaContent />
        </Suspense>
    );
}
