"use client";

import { Suspense, useEffect, useRef, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";
import { motion } from "framer-motion";
import { Swords, Users, Clock, Trophy, ArrowLeft, Copy, Check, Play, Loader2, RefreshCw, BarChart3, LineChart, User, Star, Target, X, Zap, AlertTriangle, Eye, Moon, Sun } from "lucide-react";
import { getApiKey } from "@/lib/auth";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart as ReLineChart, Line } from "recharts";
import { ThemeProvider, useTheme } from "@/lib/theme-context";

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
    const [showQuitConfirm, setShowQuitConfirm] = useState(false);
    const [hasSubmitted, setHasSubmitted] = useState(false);
    const audioCtxRef = useRef<AudioContext | null>(null);
    const audioBufferRef = useRef<AudioBuffer | null>(null);

    const { isDarkMode, toggleTheme } = useTheme();

    const QUESTION_TIME = 30;

    useEffect(() => {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioCtxRef.current = ctx;
        fetch("/sword_sound.mp3")

            .then((res) => res.arrayBuffer())
            .then((data) => ctx.decodeAudioData(data))
            .then((buffer) => { audioBufferRef.current = buffer; })
            .catch(() => { });
        return () => { ctx.close(); };
    }, []);

    const playSwordSound = useCallback(() => {
        const ctx = audioCtxRef.current;
        const buffer = audioBufferRef.current;
        if (ctx && buffer) {
            const source = ctx.createBufferSource();
            source.buffer = buffer;
            source.connect(ctx.destination);
            source.start(0);
        }
    }, []);

    const playSoundRef = useRef(playSwordSound);
    playSoundRef.current = playSwordSound;

    useEffect(() => {
        if (phase === "active" && questions.length > 0) {
            const timer = setTimeout(() => playSwordSound(), 80);
            return () => clearTimeout(timer);
        }
    }, [currentQuestionIndex, phase, playSwordSound, questions.length]);

    useEffect(() => {
        if (phase === "finished") {
            const timer = setTimeout(() => playSwordSound(), 300);
            return () => clearTimeout(timer);
        }
    }, [phase, playSwordSound]);

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
            setHasSubmitted(false);
        });

        socket.on("participant_progress", (updatedParticipants) => {
            setParticipants(updatedParticipants);
        });

        socket.on("arena_finished", (data) => {
            setLeaderboard(data.leaderboard);
            setPhase("finished");
            playSoundRef.current();
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
                if (prev <= 1) return 0;
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [phase, timeLeft, currentQuestionIndex, hasSubmitted]);

    useEffect(() => {
        if (phase === "active" && timeLeft === 0 && !hasSubmitted && questions.length > 0) {
            submitAnswer();
        }
    }, [timeLeft, phase, hasSubmitted, questions.length]);

    const handleSelectAnswer = (optionIndex: number) => {
        if (selectedAnswer !== null) return;
        setSelectedAnswer(optionIndex);
    };

    const submitAnswer = useCallback(() => {
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
            setHasSubmitted(true);
            setTimeout(() => {
                socket.emit("submit_answer", {
                    lobbyCode,
                    score: finalScore,
                    timeTaken: totalTime,
                });
            }, 1500);
        }
    }, [currentQuestionIndex, selectedAnswer, questions, answers, correctCount, startTime, lobbyCode]);

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
        <div className={`min-h-screen w-full ${isDarkMode ? "bg-[#0a0a0a] text-white" : "bg-white text-black"} selection:bg-white selection:text-black font-sans overflow-hidden`}>
            <div className="absolute inset-0 noise opacity-[0.02] pointer-events-none" />
            <div className={`fixed inset-0 z-0 pointer-events-none overflow-hidden ${isDarkMode ? "opacity-10" : "opacity-5"}`}>
                <div className="absolute inset-0" style={{
                    backgroundImage: `linear-gradient(to right, ${isDarkMode ? "#ffffff05" : "#00000008"} 1px, transparent 1px), linear-gradient(to bottom, ${isDarkMode ? "#ffffff05" : "#00000008"} 1px, transparent 1px)`,
                    backgroundSize: '100px 100px'
                }} />
            </div>

            <div className="relative z-10 h-screen flex flex-col">
                <header className={`h-16 flex-shrink-0 border-b-2 ${isDarkMode ? "border-white bg-[#0a0a0a]/80" : "border-black bg-white/80"} backdrop-blur-xl flex items-center justify-between px-6 relative z-30`}>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={toggleTheme}
                            className={`p-2 border transition-all duration-300 group ${isDarkMode ? "border-white/20 text-white/60 hover:text-white hover:border-white/40 hover:scale-110" : "border-[#00DDDD] text-[#00DDDD]/60 hover:text-[#00DDDD] hover:border-[#00DDDD] hover:scale-110"}`}
                            title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                        >
                            <div className="group-hover:rotate-180 transition-transform duration-500">
                                {isDarkMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                            </div>
                        </button>
                        <button
                            onClick={() => setShowQuitConfirm(true)}
                            className={`p-2 border transition-all text-[10px] font-mono uppercase tracking-wider font-bold ${isDarkMode ? "border-white/20 text-white/60 hover:bg-red-500 hover:text-white hover:border-red-500" : "border-[#00DDDD] text-[#00DDDD]/60 hover:bg-red-500 hover:text-white hover:border-red-500"}`}
                        >
                            Exit
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
                            <span className={`text-[9px] font-mono uppercase tracking-[0.2em] ${isDarkMode ? "text-white/40" : "text-black/40"}`}>Lobby</span>
                            <span className="text-lg font-black tracking-[0.3em]">{lobbyCode}</span>
                            <button
                                onClick={handleCopyCode}
                                className={`p-2 border transition-all ${isDarkMode ? "border-white/20 hover:border-white/50 text-white/60 hover:text-white" : "border-[#00DDDD]/20 hover:border-[#00DDDD]/50 text-[#00DDDD]/60 hover:text-[#00DDDD]"}`}
                            >
                                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                            </button>
                        </div>
                    )}
                    {phase === "active" && (
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                                <Zap className="h-3.5 w-3.5 text-emerald-400" />
                                <span className="text-sm font-black text-emerald-400">{correctCount + (selectedAnswer !== null && selectedAnswer === questions[currentQuestionIndex]?.correctOptionIndex ? 1 : 0)}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Clock className={`h-3.5 w-3.5 ${isDarkMode ? "text-white/60" : "text-black/60"}`} />
                                <span className={`text-sm font-black font-mono ${timeLeft <= 5 ? "text-red-400 animate-pulse" : `${isDarkMode ? "text-white" : "text-black"}`}`}>
                                    {timeLeft}s
                                </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Target className={`h-3.5 w-3.5 ${isDarkMode ? "text-white/60" : "text-black/60"}`} />
                                <span className="text-sm font-mono">{currentQuestionIndex + 1}/{questions.length}</span>
                            </div>
                        </div>
                    )}
                    {phase === "finished" && (
                        <div className="flex items-center gap-3">
                            <Trophy className="h-4 w-4 text-amber-400" />
                            <span className={`text-sm font-mono ${isDarkMode ? "text-white/80" : "text-black/80"}`}>Battle Complete</span>
                        </div>
                    )}
                </header>

                <main className="flex-1 overflow-y-auto scrollbar-hide p-6">
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
                                className={`border p-10 rounded-[2.5rem] ${isDarkMode ? "border-white/10 bg-[#0d0d0d]" : "border-black bg-white"}`}
                            >
                                <div className={`absolute top-0 right-0 w-32 h-32 blur-[60px] rounded-full pointer-events-none ${isDarkMode ? "bg-white/5" : "bg-black/5"}`} />
                                <div className={`absolute bottom-0 left-0 w-32 h-32 blur-[60px] rounded-full pointer-events-none ${isDarkMode ? "bg-white/5" : "bg-black/5"}`} />

                                <div className="relative z-10">
                                    <div className="flex items-center gap-4 mb-8">
                                        <div className="h-12 w-12 bg-white text-black rounded-2xl flex items-center justify-center">
                                            <Users className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-black tracking-tight uppercase">Waiting Room</h2>
                                            <p className={`text-[10px] font-mono uppercase tracking-[0.2em] ${isDarkMode ? "text-white/40" : "text-black/40"}`}>
                                                {isHost ? "Share the code to invite players" : "Waiting for host to start..."}
                                            </p>
                                        </div>
                                    </div>

                                    {isHost && lobbyCode && (
                                        <div className={`mb-10 p-6 border rounded-2xl text-center ${isDarkMode ? "border-white/10 bg-white/5" : "border-black/10 bg-black/5"}`}>
                                            <p className={`text-[9px] font-mono uppercase tracking-[0.3em] mb-3 ${isDarkMode ? "text-white/30" : "text-black/30"}`}>Invite Code</p>
                                            <div className="flex items-center justify-center gap-4">
                                                <span className="text-4xl font-black tracking-[0.4em]">{lobbyCode}</span>
                                                <button
                                                    onClick={handleCopyCode}
                                                    className={`p-3 border transition-all rounded-xl ${isDarkMode ? "bg-white/10 hover:bg-white/20 border-white/20" : "bg-[#00DDDD]/10 hover:bg-[#00DDDD]/20 border-[#00DDDD]/20"}`}
                                                >
                                                    {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                                                </button>
                                            </div>
                                            <div className={`flex items-center justify-center gap-2 mt-4 text-[10px] font-mono ${isDarkMode ? "text-white/40" : "text-black/40"}`}>
                                                <div className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                                Listening for connections...
                                            </div>
                                        </div>
                                    )}

                                    <div className="mb-8">
                                        <div className="flex items-center gap-2 mb-4">
                                            <Users className={`h-4 w-4 ${isDarkMode ? "text-white/40" : "text-black/40"}`} />
                                            <span className={`text-[10px] font-mono uppercase tracking-[0.2em] ${isDarkMode ? "text-white/40" : "text-black/40"}`}>
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
                                                    className={`flex items-center justify-between p-4 border rounded-2xl ${(isHost && p.name === adminName) || (!isHost && p.name === participantName)
                                                        ? `${isDarkMode ? "bg-white/10 border-white/30" : "bg-black/10 border-black/30"}`
                                                        : `${isDarkMode ? "bg-white/5 border-white/10" : "bg-black/5 border-black/10"}`
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className={`h-8 w-8 rounded-full flex items-center justify-center ${isDarkMode ? "bg-white/10" : "bg-black/10"}`}>
                                                            <User className="h-4 w-4" />
                                                        </div>
                                                        <div>
                                                            <span className="text-sm font-medium">{p.name}</span>
                                                            {((isHost && p.name === adminName) || (!isHost && p.name === participantName)) && (
                                                                <span className={`ml-2 text-[9px] font-mono ${isDarkMode ? "text-white/40" : "text-black/40"}`}>(You)</span>
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
                                                <div className={`p-8 text-center text-xs font-mono ${isDarkMode ? "text-white/20" : "text-black/20"}`}>
                                                    Waiting for players to join...
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {isHost && (
                                        <button
                                            onClick={handleStart}
                                            disabled={participants.length < 1 || isStarting}
                                            className={`w-full py-5 text-[10px] font-mono font-black uppercase tracking-[0.3em] rounded-[2rem] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-30 flex items-center justify-center gap-3 ${isDarkMode ? "bg-white text-black" : "bg-[#00DDDD] text-white"}`}
                                        >
                                            {isStarting ? (
                                                <>
                                                    <span className="relative flex items-center justify-center" style={{ width: 20, height: 20 }}>
                                                        <motion.span
                                                            className="absolute"
                                                            animate={{ rotate: [0, -20, 0], x: [0, -4, 0] }}
                                                            transition={{ repeat: Infinity, duration: 0.5, ease: "easeInOut" }}
                                                            style={{ display: 'flex' }}
                                                        >
                                                            <Swords className="h-4 w-4" style={{ transform: 'scaleX(-1)' }} />
                                                        </motion.span>
                                                        <motion.span
                                                            className="absolute"
                                                            animate={{ rotate: [0, 20, 0], x: [0, 4, 0] }}
                                                            transition={{ repeat: Infinity, duration: 0.5, ease: "easeInOut" }}
                                                            style={{ display: 'flex' }}
                                                        >
                                                            <Swords className="h-4 w-4" />
                                                        </motion.span>
                                                    </span>
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

                    {!error && phase === "active" && questions.length > 0 && !hasSubmitted && (
                        <div className="max-w-6xl mx-auto mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-2 space-y-4">
                                <motion.div
                                    key={currentQuestionIndex}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className={`p-6 sm:p-8 rounded-[2.5rem] ${isDarkMode ? "border border-white/10 bg-[#0d0d0d]" : "border border-black bg-white"}`}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className={`text-[9px] font-mono uppercase tracking-[0.2em] ${isDarkMode ? "text-white/30" : "text-black/30"}`}>
                                                Q{currentQuestionIndex + 1}/{questions.length}
                                            </span>
                                            <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full ${isDarkMode ? "bg-white/10 text-white/60" : "bg-black/10 text-black/60"}`}>
                                                {topic}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                                            <Zap className="h-3 w-3 text-emerald-400" />
                                            <span className="text-xs font-black text-emerald-400">{correctCount + (selectedAnswer !== null && selectedAnswer === questions[currentQuestionIndex]?.correctOptionIndex ? 1 : 0)}</span>
                                            <span className="text-[8px] font-mono text-emerald-400/60">pts</span>
                                        </div>
                                    </div>

                                    <div className={`h-1 w-full rounded-full mb-6 overflow-hidden ${isDarkMode ? "bg-white/10" : "bg-black/10"}`}>
                                        <div
                                            className={`h-full transition-all duration-500 ${isDarkMode ? "bg-white" : "bg-black"}`}
                                            style={{ width: `${progressPercent}%` }}
                                        />
                                    </div>

                                    <h3 className="text-lg sm:text-xl font-bold mb-6 leading-relaxed">
                                        {questions[currentQuestionIndex]?.question}
                                    </h3>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {questions[currentQuestionIndex]?.options.map((opt, i) => {
                                            const isSelected = selectedAnswer === i;
                                            const isCorrect = questions[currentQuestionIndex]?.correctOptionIndex === i;
                                            const showResult = selectedAnswer !== null;
                                            let optionClass = isDarkMode ? "bg-white/5 border-white/10 hover:border-white/30 hover:bg-white/10" : "bg-[#00DDDD]/5 border-[#00DDDD]/10 hover:border-[#00DDDD]/30 hover:bg-[#00DDDD]/10";

                                            if (showResult) {
                                                if (isCorrect) {
                                                    optionClass = "bg-emerald-500/20 border-emerald-500 text-emerald-400";
                                                } else if (isSelected && !isCorrect) {
                                                    optionClass = "bg-red-500/20 border-red-500 text-red-400";
                                                } else {
                                                    optionClass = isDarkMode ? "bg-white/5 border-white/10 text-white/40" : "bg-[#00DDDD]/5 border-[#00DDDD]/10 text-[#00DDDD]/40";
                                                }
                                            } else if (isSelected) {
                                                optionClass = `${isDarkMode ? "bg-white/10 border-white" : "bg-[#00DDDD]/10 border-[#00DDDD]"}`;
                                            }

                                            const optionLabels = ["A", "B", "C", "D", "E", "F"];

                                            return (
                                                <button
                                                    key={i}
                                                    onClick={() => handleSelectAnswer(i)}
                                                    disabled={selectedAnswer !== null}
                                                    className={`w-full text-left p-4 border rounded-2xl text-sm transition-all flex items-center gap-3 ${optionClass}`}
                                                >
                                                    <span className={`h-7 w-7 flex items-center justify-center rounded-full text-xs font-mono border flex-shrink-0 ${isSelected
                                                        ? `${isDarkMode ? "border-white bg-white text-black" : "border-[#00DDDD] bg-[#00DDDD] text-white"}`
                                                        : `${isDarkMode ? "border-white/20" : "border-[#00DDDD]/20"}`
                                                        }`}>
                                                        {optionLabels[i]}
                                                    </span>
                                                    <span className="flex-1 leading-tight">{opt}</span>
                                                    {showResult && isCorrect && <Check className="h-4 w-4 text-emerald-400 flex-shrink-0" />}
                                                    {showResult && isSelected && !isCorrect && <X className="h-4 w-4 text-red-400 flex-shrink-0" />}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {selectedAnswer !== null && questions[currentQuestionIndex]?.explanation && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className={`mt-5 p-4 border rounded-2xl ${isDarkMode ? "border-white/10 bg-white/5" : "border-black/10 bg-black/5"}`}
                                        >
                                            <span className={`text-[9px] font-mono uppercase tracking-[0.2em] block mb-2 ${isDarkMode ? "text-white/40" : "text-black/40"}`}>Explanation</span>
                                            <p className={`text-sm ${isDarkMode ? "text-white/80" : "text-black/80"}`}>{questions[currentQuestionIndex]?.explanation}</p>
                                        </motion.div>
                                    )}
                                </motion.div>

                                {(() => {
                                    const answered = answers.filter(a => a !== -1).length + (selectedAnswer !== null ? 1 : 0);
                                    const correct = correctCount + (selectedAnswer !== null && selectedAnswer === questions[currentQuestionIndex]?.correctOptionIndex ? 1 : 0);
                                    const accuracy = answered > 0 ? Math.round((correct / answered) * 100) : 0;
                                    const elapsed = startTime ? Math.floor((Date.now() - startTime) / 1000) : 0;
                                    return (
                                        <div className="grid grid-cols-3 gap-3">
                                            <div className={`border p-3 sm:p-4 rounded-2xl ${isDarkMode ? "border-white/10 bg-[#0d0d0d]" : "border-black/10 bg-white"}`}>
                                                <span className={`text-[8px] font-mono uppercase tracking-[0.2em] block mb-1 ${isDarkMode ? "text-white/30" : "text-black/30"}`}>Accuracy</span>
                                                <span className="text-base sm:text-lg font-black">{accuracy}%</span>
                                            </div>
                                            <div className={`border p-3 sm:p-4 rounded-2xl ${isDarkMode ? "border-white/10 bg-[#0d0d0d]" : "border-black/10 bg-white"}`}>
                                                <span className={`text-[8px] font-mono uppercase tracking-[0.2em] block mb-1 ${isDarkMode ? "text-white/30" : "text-black/30"}`}>Correct</span>
                                                <span className="text-base sm:text-lg font-black">{correct}/{answered}</span>
                                            </div>
                                            <div className={`border p-3 sm:p-4 rounded-2xl ${isDarkMode ? "border-white/10 bg-[#0d0d0d]" : "border-black/10 bg-white"}`}>
                                                <span className={`text-[8px] font-mono uppercase tracking-[0.2em] block mb-1 ${isDarkMode ? "text-white/30" : "text-black/30"}`}>Time</span>
                                                <span className="text-base sm:text-lg font-black">{elapsed}s</span>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>

                            <div className="lg:col-span-1 space-y-4">
                                <div className={`border p-5 rounded-[2.5rem] ${isDarkMode ? "border-white/10 bg-[#0d0d0d]" : "border-black/10 bg-white"}`}>
                                    <div className="flex items-center gap-2 mb-4">
                                        <Users className={`h-4 w-4 ${isDarkMode ? "text-white/40" : "text-black/40"}`} />
                                        <span className={`text-[10px] font-mono uppercase tracking-[0.2em] ${isDarkMode ? "text-white/40" : "text-black/40"}`}>Players</span>
                                    </div>
                                    <div className="space-y-3">
                                        {participants.map((p) => {
                                            const isMe = (isHost && p.name === adminName) || (!isHost && p.name === participantName);
                                            const myCurrentScore = correctCount + (selectedAnswer !== null && selectedAnswer === questions[currentQuestionIndex]?.correctOptionIndex ? 1 : 0);
                                            return (
                                                <div
                                                    key={p.id}
                                                    className={`p-3 rounded-2xl border ${isMe
                                                        ? `${isDarkMode ? "bg-white/10 border-white/30" : "bg-black/10 border-black/30"}`
                                                        : `${isDarkMode ? "bg-white/5 border-white/10" : "bg-black/5 border-black/10"}`
                                                        }`}
                                                >
                                                    <div className="flex items-center justify-between mb-2">
                                                        <div className="flex items-center gap-2 text-xs">
                                                            <div className={`h-2 w-2 rounded-full ${p.finished ? "bg-emerald-500" : "bg-amber-500 animate-pulse"}`} />
                                                            <span className={isMe ? "font-bold" : ""}>{p.name}</span>
                                                        </div>
                                                        <span className={`text-[10px] font-mono ${isDarkMode ? "text-white/40" : "text-black/40"}`}>{isMe ? myCurrentScore : p.score} pts</span>
                                                    </div>
                                                    <div className={`h-1 w-full rounded-full overflow-hidden ${isDarkMode ? "bg-white/10" : "bg-black/10"}`}>
                                                        <div
                                                            className={`h-full transition-all duration-500 ${p.finished ? "bg-emerald-500" : `${isDarkMode ? "bg-white" : "bg-black"}`}`}
                                                            style={{ width: `${p.finished ? 100 : Math.min(((currentQuestionIndex + (selectedAnswer !== null ? 1 : 0)) / questions.length) * 100, 100)}%` }}
                                                        />
                                                    </div>
                                                    <div className={`mt-1 text-[8px] font-mono text-right ${isDarkMode ? "text-white/30" : "text-black/30"}`}>
                                                        {p.finished ? "All done!" : isMe ? `Q${Math.min(currentQuestionIndex + 1, questions.length)}/${questions.length}` : "Playing..."}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {(() => {
                                    const answered = answers.filter(a => a !== -1).length + (selectedAnswer !== null ? 1 : 0);
                                    const correct = correctCount + (selectedAnswer !== null && selectedAnswer === questions[currentQuestionIndex]?.correctOptionIndex ? 1 : 0);
                                    const accuracy = answered > 0 ? Math.round((correct / answered) * 100) : 0;
                                    const elapsed = startTime ? Math.floor((Date.now() - startTime) / 1000) : 0;
                                    return (
                                        <div className={`border p-5 rounded-[2.5rem] ${isDarkMode ? "border-white/10 bg-[#0d0d0d]" : "border-black/10 bg-white"}`}>
                                            <div className="flex items-center gap-2 mb-4">
                                                <Zap className="h-4 w-4 text-emerald-400" />
                                                <span className={`text-[10px] font-mono uppercase tracking-[0.2em] ${isDarkMode ? "text-white/40" : "text-black/40"}`}>Your Stats</span>
                                            </div>
                                            <div className="space-y-2.5">
                                                <div className="flex justify-between items-center">
                                                    <span className={`text-[10px] font-mono ${isDarkMode ? "text-white/40" : "text-black/40"}`}>Score</span>
                                                    <span className="text-sm font-black text-emerald-400">{correct}</span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className={`text-[10px] font-mono ${isDarkMode ? "text-white/40" : "text-black/40"}`}>Accuracy</span>
                                                    <span className="text-sm font-black">{accuracy}%</span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className={`text-[10px] font-mono ${isDarkMode ? "text-white/40" : "text-black/40"}`}>Remaining</span>
                                                    <span className="text-sm font-black">{questions.length - currentQuestionIndex - (selectedAnswer !== null ? 1 : 0)}</span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className={`text-[10px] font-mono ${isDarkMode ? "text-white/40" : "text-black/40"}`}>Elapsed</span>
                                                    <span className="text-sm font-black">{elapsed}s</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })()}

                                {participants.filter(p => {
                                    const isMe = (isHost && p.name === adminName) || (!isHost && p.name === participantName);
                                    return !isMe;
                                }).map(opponent => (
                                    <div key={opponent.id} className={`border p-5 rounded-[2.5rem] ${isDarkMode ? "border-white/10 bg-[#0d0d0d]" : "border-black/10 bg-white"}`}>
                                        <div className="flex items-center gap-2 mb-4">
                                            <Eye className="h-4 w-4 text-blue-400" />
                                            <span className={`text-[10px] font-mono uppercase tracking-[0.2em] ${isDarkMode ? "text-white/40" : "text-black/40"}`}>Opponent</span>
                                        </div>
                                        <div className="text-center py-2">
                                            <div className="h-10 w-10 bg-blue-500/20 border border-blue-500/30 rounded-full flex items-center justify-center mx-auto mb-2">
                                                <User className="h-5 w-5 text-blue-400" />
                                            </div>
                                            <p className="text-sm font-bold">{opponent.name}</p>
                                            <div className="flex items-center justify-center gap-1.5 mt-2">
                                                <div className={`h-2 w-2 rounded-full ${opponent.finished ? "bg-emerald-500" : "bg-amber-500 animate-pulse"}`} />
                                                <span className={`text-[10px] font-mono ${isDarkMode ? "text-white/40" : "text-black/40"}`}>
                                                    {opponent.finished ? "Finished all questions" : "Answering..."}
                                                </span>
                                            </div>
                                            {opponent.finished && (
                                                <div className="mt-3 px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                                                    <span className="text-[10px] font-mono text-emerald-400">Score: {opponent.score} pts</span>
                                                </div>
                                            )}
                                            {!opponent.finished && (
                                                <div className={`mt-3 text-[9px] font-mono ${isDarkMode ? "text-white/30" : "text-black/30"}`}>
                                                    Waiting for opponent to finish...
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {!error && phase === "active" && hasSubmitted && (
                        <div className="max-w-lg mx-auto mt-20 text-center">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className={`border p-10 rounded-[2.5rem] ${isDarkMode ? "border-white/10 bg-[#0d0d0d]" : "border-black/10 bg-white"}`}
                            >
                                <div className="h-16 w-16 bg-amber-500/20 border border-amber-500/30 rounded-full flex items-center justify-center mx-auto mb-6 overflow-hidden">
                                    <div className="relative flex items-center justify-center" style={{ width: 40, height: 40 }}>
                                        <motion.div
                                            className="absolute"
                                            animate={{ rotate: [0, -25, 0], x: [0, -6, 0] }}
                                            transition={{ repeat: Infinity, duration: 0.5, ease: "easeInOut" }}
                                        >
                                            <Swords className="h-7 w-7 text-amber-400" style={{ transform: 'scaleX(-1)' }} />
                                        </motion.div>
                                        <motion.div
                                            className="absolute"
                                            animate={{ rotate: [0, 25, 0], x: [0, 6, 0] }}
                                            transition={{ repeat: Infinity, duration: 0.5, ease: "easeInOut" }}
                                        >
                                            <Swords className="h-7 w-7 text-amber-400" />
                                        </motion.div>
                                    </div>
                                </div>
                                <h2 className="text-xl font-black uppercase tracking-tight mb-2">You're All Set!</h2>
                                <p className={`text-sm mb-2 ${isDarkMode ? "text-white/60" : "text-black/60"}`}>
                                    You answered all {questions.length} questions.
                                </p>
                                <div className="flex items-center justify-center gap-2 mb-6">
                                    <div className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse" />
                                    <span className={`text-[10px] font-mono uppercase tracking-[0.2em] ${isDarkMode ? "text-white/40" : "text-black/40"}`}>
                                        Waiting for opponent to finish...
                                    </span>
                                </div>
                                <div className="flex items-center gap-3 justify-center mb-6">
                                    {participants.filter(p => {
                                        const isMe = (isHost && p.name === adminName) || (!isHost && p.name === participantName);
                                        return !isMe;
                                    }).map(opponent => (
                                        <div key={opponent.id} className={`flex items-center gap-2 px-4 py-2 border rounded-xl ${isDarkMode ? "bg-white/5 border-white/10" : "bg-black/5 border-black/10"}`}>
                                            <div className={`h-2 w-2 rounded-full ${opponent.finished ? "bg-emerald-500" : "bg-amber-500 animate-pulse"}`} />
                                            <span className="text-xs">{opponent.name}</span>
                                            <span className={`text-[9px] font-mono ${isDarkMode ? "text-white/40" : "text-black/40"}`}>{opponent.finished ? "Done" : "Playing..."}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className={`w-full rounded-full h-1 overflow-hidden ${isDarkMode ? "bg-white/10" : "bg-black/10"}`}>
                                    <motion.div
                                        className={`h-full ${isDarkMode ? "bg-white" : "bg-black"}`}
                                        animate={{ x: ["-100%", "100%"] }}
                                        transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                                    />
                                </div>
                                <button
                                    onClick={() => setShowQuitConfirm(true)}
                                    className="mt-6 px-6 py-3 border border-red-500/30 text-red-400 text-[10px] font-mono font-black uppercase tracking-[0.3em] rounded-[2rem] hover:bg-red-500/10 transition-all"
                                >
                                    Quit Battle
                                </button>
                            </motion.div>
                        </div>
                    )}

                    {!error && phase === "finished" && (
                        <div className="max-w-5xl mx-auto mt-6">
                            {/* Tab Switcher */}
                            <div className={`flex mb-6 border-b ${isDarkMode ? "border-white/10" : "border-black/10"}`}>
                                <button
                                    onClick={() => setTab("leaderboard")}
className={`px-6 py-3 text-[9px] font-mono uppercase tracking-[0.2em] transition-all ${tab === "leaderboard"
                                                        ? `${isDarkMode ? "bg-white text-black" : "bg-[#00DDDD] text-white"} font-bold`
                                                        : `${isDarkMode ? "text-white/40 hover:text-white" : "text-[#00DDDD]/40 hover:text-[#00DDDD]"}`
                                                        }`}
                                            >
                                                <Trophy className="h-3 w-3 inline mr-1.5 -mt-0.5" />
                                                Leaderboard
                                            </button>
                                            <button
                                                onClick={() => setTab("analysis")}
                                                className={`px-6 py-3 text-[9px] font-mono uppercase tracking-[0.2em] transition-all ${tab === "analysis"
                                                        ? `${isDarkMode ? "bg-white text-black" : "bg-[#00DDDD] text-white"} font-bold`
                                                        : `${isDarkMode ? "text-white/40 hover:text-white" : "text-[#00DDDD]/40 hover:text-[#00DDDD]"}`
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
                                    className={`border p-8 rounded-[2.5rem] ${isDarkMode ? "border-white/10 bg-[#0d0d0d]" : "border-black/10 bg-white"}`}
                                >
                                    <div className="flex items-center gap-4 mb-8">
                                        <div className="h-12 w-12 bg-amber-500 text-black rounded-2xl flex items-center justify-center">
                                            <Trophy className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-black tracking-tight uppercase">Final Rankings</h2>
                                            <p className={`text-[10px] font-mono uppercase tracking-[0.2em] ${isDarkMode ? "text-white/40" : "text-black/40"}`}>{topic} Battle</p>
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
                                                    className={`flex items-center p-5 rounded-2xl border transition-all ${isMe
                                                        ? `${isDarkMode ? "bg-white/10 border-white/30" : "bg-black/10 border-black/30"} scale-[1.02]`
                                                        : `${isDarkMode ? "bg-white/5 border-white/10" : "bg-black/5 border-black/10"}`
                                                        }`}
                                                >
                                                    <div className={`w-10 h-10 flex items-center justify-center text-lg font-black font-mono ${i < 3 ? medals[i] : `${isDarkMode ? "text-white/30" : "text-black/30"}`}`}>
                                                        {i === 0 ? <Trophy className="h-6 w-6" /> : `#${i + 1}`}
                                                    </div>
                                                    <div className="flex-1 ml-4">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-bold">{p.name}</span>
                                                            {isMe && <span className={`text-[8px] font-mono ${isDarkMode ? "text-white/40" : "text-black/40"}`}>(You)</span>}
                                                        </div>
                                                        <div className={`flex items-center gap-4 mt-1 text-[10px] font-mono ${isDarkMode ? "text-white/40" : "text-black/40"}`}>
                                                            <span>Score: {p.score}/{questions.length}</span>
                                                            <span>Time: {p.timeTaken}s</span>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-2xl font-black">{p.score}</div>
                                                        <div className={`text-[9px] font-mono ${isDarkMode ? "text-white/40" : "text-black/40"}`}>points</div>
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
                                    <div className={`border p-8 rounded-[2.5rem] ${isDarkMode ? "border-white/10 bg-[#0d0d0d]" : "border-black/10 bg-white"}`}>
                                        <div className="flex items-center gap-3 mb-6">
                                            <BarChart3 className={`h-5 w-5 ${isDarkMode ? "text-white/60" : "text-black/60"}`} />
                                            <span className={`text-[10px] font-mono uppercase tracking-[0.2em] ${isDarkMode ? "text-white/40" : "text-black/40"}`}>Score Comparison</span>
                                        </div>
                                        <div className="h-72">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={barData}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? "#ffffff10" : "#00000010"} />
                                                    <XAxis dataKey="name" tick={{ fill: isDarkMode ? "#ffffff60" : "#00000060", fontSize: 11 }} />
                                                    <YAxis tick={{ fill: isDarkMode ? "#ffffff60" : "#00000060", fontSize: 11 }} />
                                                    <Tooltip
                                                        contentStyle={{
                                                            backgroundColor: isDarkMode ? "#1a1a1a" : "#f5f5f5",
                                                            border: isDarkMode ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(0,0,0,0.1)",
                                                            borderRadius: "12px",
                                                            color: isDarkMode ? "#fff" : "#000",
                                                        }}
                                                    />
                                                    <Bar dataKey="score" fill={isDarkMode ? "#ffffff" : "#000000"} radius={[8, 8, 0, 0]} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>

                                    <div className={`border p-8 rounded-[2.5rem] ${isDarkMode ? "border-white/10 bg-[#0d0d0d]" : "border-black/10 bg-white"}`}>
                                        <div className="flex items-center gap-3 mb-6">
                                            <LineChart className={`h-5 w-5 ${isDarkMode ? "text-white/60" : "text-black/60"}`} />
                                            <span className={`text-[10px] font-mono uppercase tracking-[0.2em] ${isDarkMode ? "text-white/40" : "text-black/40"}`}>Performance Trend</span>
                                        </div>
                                        <div className="h-72">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <ReLineChart data={lineData}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? "#ffffff10" : "#00000010"} />
                                                    <XAxis dataKey="question" tick={{ fill: isDarkMode ? "#ffffff60" : "#00000060", fontSize: 11 }} />
                                                    <YAxis tick={{ fill: isDarkMode ? "#ffffff60" : "#00000060", fontSize: 11 }} />
                                                    <Tooltip
                                                        contentStyle={{
                                                            backgroundColor: isDarkMode ? "#1a1a1a" : "#f5f5f5",
                                                            border: isDarkMode ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(0,0,0,0.1)",
                                                            borderRadius: "12px",
                                                            color: isDarkMode ? "#fff" : "#000",
                                                        }}
                                                    />
                                                    <Legend
                                                        formatter={(value) => <span style={{ color: isDarkMode ? "#ffffff80" : "#00000080", fontSize: "11px" }}>{value}</span>}
                                                    />
                                                    {leaderboard.map((p, i) => (
                                                        <Line
                                                            key={p.id}
                                                            type="monotone"
                                                            dataKey={p.name}
                                                            stroke={isDarkMode ? ["#ffffff", "#60a5fa", "#f59e0b", "#ef4444", "#10b981"][i % 5] : ["#000000", "#3b82f6", "#d97706", "#dc2626", "#059669"][i % 5]}
                                                            strokeWidth={2}
                                                            dot={{ r: 4 }}
                                                        />
                                                    ))}
                                                </ReLineChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>

                                    {questions.length > 0 && (
                                        <div className={`border p-8 rounded-[2.5rem] ${isDarkMode ? "border-white/10 bg-[#0d0d0d]" : "border-black/10 bg-white"}`}>
                                            <div className="flex items-center gap-3 mb-6">
                                                <Star className={`h-5 w-5 ${isDarkMode ? "text-white/60" : "text-black/60"}`} />
                                                <span className={`text-[10px] font-mono uppercase tracking-[0.2em] ${isDarkMode ? "text-white/40" : "text-black/40"}`}>Answer Key & Explanations</span>
                                            </div>
                                            <div className="space-y-6">
                                                {questions.map((q, i) => {
                                                    const userAnswer = answers[i];
                                                    const isUserCorrect = userAnswer === q.correctOptionIndex;
                                                    return (
                                                        <div key={i} className={`p-5 border rounded-2xl ${isDarkMode ? "border-white/10 bg-white/5" : "border-black/10 bg-black/5"}`}>
                                                            <div className="flex items-start gap-3">
                                                                <div className={`h-7 w-7 flex items-center justify-center rounded-full text-xs font-mono border flex-shrink-0 mt-0.5 ${userAnswer === -1
                                                                    ? `${isDarkMode ? "border-white/10 text-white/30" : "border-black/10 text-black/30"}`
                                                                    : isUserCorrect
                                                                        ? "border-emerald-500 bg-emerald-500/20 text-emerald-400"
                                                                        : "border-red-500 bg-red-500/20 text-red-400"
                                                                    }`}>
                                                                    {userAnswer === -1 ? "—" : isUserCorrect ? "✓" : "✗"}
                                                                </div>
                                                                <div className="flex-1">
                                                                    <p className="text-sm font-bold mb-3">
                                                                        <span className={`font-mono text-[10px] mr-2 ${isDarkMode ? "text-white/40" : "text-black/40"}`}>Q{i + 1}.</span>
                                                                        {q.question}
                                                                    </p>
                                                                    <div className="grid grid-cols-2 gap-2 mb-3">
                                                                        {q.options.map((opt, oi) => {
                                                                            const isCorrectOpt = q.correctOptionIndex === oi;
                                                                            const isUserOpt = userAnswer === oi;
                                                                            return (
                                                                                <div key={oi} className={`p-3 rounded-xl text-xs border ${isCorrectOpt
                                                                                    ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400"
                                                                                    : isUserOpt && !isCorrectOpt
                                                                                        ? "border-red-500/50 bg-red-500/10 text-red-400"
                                                                                        : `${isDarkMode ? "border-white/5 text-white/50" : "border-black/5 text-black/50"}`
                                                                                    }`}>
                                                                                    <span className="font-mono text-[9px] opacity-60 mr-2">{String.fromCharCode(65 + oi)}</span>
                                                                                    {opt}
                                                                                    {isCorrectOpt && <Check className="h-3 w-3 inline ml-1" />}
                                                                                </div>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                    <p className={`text-[10px] italic ${isDarkMode ? "text-white/50" : "text-black/50"}`}>{q.explanation}</p>
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
                                            className={`px-8 py-5 border text-[10px] font-mono font-black uppercase tracking-[0.3em] rounded-[2rem] transition-all flex items-center gap-2 ${isDarkMode ? "border-white/20 text-white hover:bg-white/10 hover:border-white/40" : "border-[#00DDDD]/20 text-[#00DDDD] hover:bg-[#00DDDD]/10 hover:border-[#00DDDD]/40"}`}
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

            {showQuitConfirm && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm p-6 ${isDarkMode ? "bg-black/70" : "bg-white/70"}`}
                    onClick={() => setShowQuitConfirm(false)}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        onClick={(e: React.MouseEvent) => e.stopPropagation()}
                        className={`border p-8 rounded-[2.5rem] max-w-sm w-full text-center ${isDarkMode ? "border-white/10 bg-[#0d0d0d]" : "border-black/10 bg-white"}`}
                    >
                        <div className="h-14 w-14 bg-red-500/20 border border-red-500/30 rounded-full flex items-center justify-center mx-auto mb-5">
                            <AlertTriangle className="h-7 w-7 text-red-400" />
                        </div>
                        <h3 className="text-lg font-black uppercase tracking-tight mb-2">Quit Battle?</h3>
                        <p className={`text-sm mb-6 ${isDarkMode ? "text-white/60" : "text-black/60"}`}>
                            {phase === "active"
                                ? "You will forfeit the match and your progress will be lost."
                                : "Are you sure you want to leave the battle arena?"}
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowQuitConfirm(false)}
                                className={`flex-1 py-3 border text-[10px] font-mono font-black uppercase tracking-[0.2em] rounded-[2rem] transition-all ${isDarkMode ? "border-white/20 text-white/80 hover:bg-white/10" : "border-[#00DDDD]/20 text-[#00DDDD]/80 hover:bg-[#00DDDD]/10"}`}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    setShowQuitConfirm(false);
                                    handleLeave();
                                }}
                                className="flex-1 py-3 bg-red-500 text-white text-[10px] font-mono font-black uppercase tracking-[0.2em] rounded-[2rem] hover:bg-red-600 transition-all"
                            >
                                Quit
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </div>
    );
}

function LoadingFallback() {
    const { isDarkMode } = useTheme();
    return (
        <div className={`min-h-screen w-full ${isDarkMode ? "bg-[#0a0a0a] text-white" : "bg-white text-black"} flex items-center justify-center`}>
            <div className="text-center">
                <div className="relative flex items-center justify-center mx-auto mb-4" style={{ width: 48, height: 48 }}>
                    <motion.div
                        className="absolute"
                        animate={{ rotate: [0, -25, 0], x: [0, -8, 0] }}
                        transition={{ repeat: Infinity, duration: 0.5, ease: "easeInOut" }}
                    >
                        <Swords className={`h-8 w-8 ${isDarkMode ? "text-white/80" : "text-black/80"}`} style={{ transform: 'scaleX(-1)' }} />
                    </motion.div>
                    <motion.div
                        className="absolute"
                        animate={{ rotate: [0, 25, 0], x: [0, 8, 0] }}
                        transition={{ repeat: Infinity, duration: 0.5, ease: "easeInOut" }}
                    >
                        <Swords className={`h-8 w-8 ${isDarkMode ? "text-white/80" : "text-black/80"}`} />
                    </motion.div>
                </div>
                <p className={`text-[10px] font-mono uppercase tracking-[0.3em] ${isDarkMode ? "text-white/60" : "text-black/60"}`}>Loading Battle Arena...</p>
            </div>
        </div>
    );
}

export default function BattleArenaPage() {
    return (
        <ThemeProvider>
            <Suspense fallback={<LoadingFallback />}>
                <ArenaContent />
            </Suspense>
        </ThemeProvider>
    );
}
