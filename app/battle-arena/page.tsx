"use client";

import { Suspense, useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";
import { motion, AnimatePresence } from "framer-motion";
import { Swords, Users, Clock, Trophy, Copy, Check, Play, RefreshCw, BarChart3, LineChart, User, Star, Target, X, Zap, AlertTriangle, Eye, Moon, Sun, ChevronLeft, Flag, Percent, Award, TrendingUp, LayoutDashboard, BookOpen, Bookmark, Settings, LogOut, ChevronDown, Flame, Shield, Sparkles, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { getApiKey, getUserInfo, getProfilePicture, getUserRole } from "@/lib/auth";
import { getGlobalLeaderboard, getArenaHistory, getUserAnalytics } from "@/lib/chat-api";
import type { GlobalLeaderboardEntry, ArenaHistoryItem, ArenaHistoryResponse } from "@/lib/chat-api";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart as ReLineChart, Line, AreaChart, Area, PieChart, Pie, Cell } from "recharts";
import { ThemeProvider, useTheme } from "@/lib/theme-context";
import { Poppins, Roboto, Space_Grotesk } from "next/font/google";
import Link from "next/link";

const chatHeadingFont = Poppins({
    subsets: ["latin"],
    weight: ["400", "500", "600", "700", "800"],
    variable: "--font-chat-heading",
});

const chatBodyFont = Roboto({
    subsets: ["latin"],
    weight: ["400", "500", "700"],
    variable: "--font-chat-body",
});

const chatAccentFont = Space_Grotesk({
    subsets: ["latin"],
    weight: ["400", "500", "700"],
    variable: "--font-chat-accent",
});

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

function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `00:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function ArenaContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const socketRef = useRef<Socket | null>(null);

    const [phase, setPhase] = useState<Phase>("lobby");
    const phaseRef = useRef<Phase>("lobby");
    useEffect(() => {
        phaseRef.current = phase;
    }, [phase]);

    const [lobbyCode, setLobbyCode] = useState(searchParams.get("code") || "");
    const [isHost, setIsHost] = useState(searchParams.get("host") === "true");
    const [adminName, setAdminName] = useState(searchParams.get("name") || "");
    const [participantName, setParticipantName] = useState(searchParams.get("name") || "");
    const [topic, setTopic] = useState(searchParams.get("topic") || "");
    const [difficulty, setDifficulty] = useState(searchParams.get("difficulty") || "medium");
    const [questionCount, setQuestionCount] = useState(parseInt(searchParams.get("count") || "5"));
    const [timePerQuestion, setTimePerQuestion] = useState(parseInt(searchParams.get("time") || "30"));
    const [gameMode, setGameMode] = useState(searchParams.get("mode") || "casual");
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [answers, setAnswers] = useState<number[]>([]);
    const [correctCount, setCorrectCount] = useState(0);
    const [timeLeft, setTimeLeft] = useState(0);
    const [isStarting, setIsStarting] = useState(false);
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [leaderboard, setLeaderboard] = useState<Participant[]>([]);
    const [showAnalysis, setShowAnalysis] = useState(false);
    const [showQuitConfirm, setShowQuitConfirm] = useState(false);
    const [hasSubmitted, setHasSubmitted] = useState(false);
    const [activeTab, setActiveTab] = useState<"results" | "leaderboard" | "history" | "stats">("results");
    const [lobbyView, setLobbyView] = useState<"lobby" | "leaderboard" | "history" | "stats">("lobby");
    const [globalLeaderboard, setGlobalLeaderboard] = useState<GlobalLeaderboardEntry[]>([]);
    const [arenaHistory, setArenaHistory] = useState<ArenaHistoryItem[]>([]);
    const [userStats, setUserStats] = useState<any>(null);
    const [tabLoading, setTabLoading] = useState(false);
    const audioCtxRef = useRef<AudioContext | null>(null);
    const audioBufferRef = useRef<AudioBuffer | null>(null);

    const [accent, setAccent] = useState<string>("#00DDDD");
    const [flaggedQuestions, setFlaggedQuestions] = useState<boolean[]>([]);
    const gameStartTimeRef = useRef<number>(0);

    const questionStartTimeRef = useRef<number>(0);
    const questionDurationRef = useRef<number>(30);
    const selectedAnswerRef = useRef<number | null>(null);
    const currentQuestionIndexRef = useRef<number>(0);
    const questionsRef = useRef<Question[]>([]);
    const correctCountRef = useRef<number>(0);
    const answersRef = useRef<number[]>([]);
    const hasTimerEmittedRef = useRef<boolean>(false);
    const lobbyCodeRef = useRef<string>(searchParams.get("code") || "");
    const hostRef = useRef<string>(searchParams.get("host") || "");
    const urlNameRef = useRef<string>(searchParams.get("name") || "");
    const urlTopicRef = useRef<string>(searchParams.get("topic") || "");
    const urlDifficultyRef = useRef<string>(searchParams.get("difficulty") || "");
    const urlCountRef = useRef<string>(searchParams.get("count") || "5");
    const urlTimeRef = useRef<string>(searchParams.get("time") || "30");
    const urlModeRef = useRef<string>(searchParams.get("mode") || "");

    const { isDarkMode, toggleTheme } = useTheme();

    const [sidebarWidth, setSidebarWidth] = useState(260);
    const [isResizing, setIsResizing] = useState(false);
    const [collapsed, setCollapsed] = useState(false);
    const [leaderboardSearch, setLeaderboardSearch] = useState("");
    const [leaderboardPage, setLeaderboardPage] = useState(1);
    const [leaderboardViewMode, setLeaderboardViewMode] = useState<"table" | "graph">("table");
    const [historyPage, setHistoryPage] = useState(1);
    const itemsPerPage = 10;
    const [arenaTopic, setArenaTopic] = useState("");
    const [arenaDifficulty, setArenaDifficulty] = useState("medium");
    const [arenaCount, setArenaCount] = useState(5);
    const [arenaTime, setArenaTime] = useState(30);
    const [arenaMode, setArenaMode] = useState("casual");
    const [joinCode, setJoinCode] = useState("");
    const [streak, setStreak] = useState(0);
    const [streakDays, setStreakDays] = useState<boolean[]>([false, false, false, false, false, false, false]);
    const [profilePic, setProfilePic] = useState<string | null>(null);
    const [userRole, setUserRole] = useState<string | null>(null);
    const [dbUser, setDbUser] = useState<{ name: string; email: string } | null>(null);

    const userName = dbUser?.name || (isHost ? adminName : participantName) || "Aman Verma";
    const userInitials = userName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

    const startResizing = useCallback((e: React.MouseEvent) => {
        setIsResizing(true);
        e.preventDefault();
    }, []);

    const stopResizing = useCallback(() => {
        setIsResizing(false);
    }, []);

    const resize = useCallback((e: MouseEvent) => {
        if (isResizing) {
            const newWidth = e.clientX;
            if (newWidth > 200 && newWidth < 450) {
                setSidebarWidth(newWidth);
            }
        }
    }, [isResizing]);

    useEffect(() => {
        window.addEventListener("mousemove", resize);
        window.addEventListener("mouseup", stopResizing);
        return () => {
            window.removeEventListener("mousemove", resize);
            window.removeEventListener("mouseup", stopResizing);
        };
    }, [resize, stopResizing]);

    useEffect(() => {
        if (isResizing) {
            document.body.style.userSelect = "none";
            document.body.style.cursor = "col-resize";
        } else {
            document.body.style.userSelect = "";
            document.body.style.cursor = "";
        }
        return () => {
            document.body.style.userSelect = "";
            document.body.style.cursor = "";
        };
    }, [isResizing]);

    useEffect(() => {
        if (typeof window !== "undefined") {
            const savedAccent = localStorage.getItem("rudranex_accent");
            if (savedAccent) setAccent(savedAccent);
            setProfilePic(getProfilePicture());
            setUserRole(getUserRole());

            const info = getUserInfo();
            if (info) {
                setDbUser(info);
            }

            const today = new Date().toDateString();
            const stored = localStorage.getItem("rudranex_streak");
            let currentStreak = 0;
            let days: boolean[] = [false, false, false, false, false, false, false];
            if (stored) {
                try {
                    const parsed = JSON.parse(stored);
                    if (parsed.date === today) {
                        currentStreak = parsed.streak;
                        days = parsed.days || days;
                    } else {
                        const last = new Date(parsed.date);
                        const diff = Math.floor((Date.now() - last.getTime()) / (1000 * 60 * 60 * 24));
                        if (diff === 1) {
                            currentStreak = parsed.streak + 1;
                        } else {
                            currentStreak = 1;
                        }
                        const dayIdx = new Date().getDay();
                        const newDays = [...(parsed.days || [false, false, false, false, false, false, false])];
                        newDays[dayIdx === 0 ? 6 : dayIdx - 1] = true;
                        days = newDays;
                    }
                } catch (e) {}
            } else {
                currentStreak = 1;
                const dayIdx = new Date().getDay();
                const newDays = [false, false, false, false, false, false, false];
                newDays[dayIdx === 0 ? 6 : dayIdx - 1] = true;
                days = newDays;
            }
            localStorage.setItem("rudranex_streak", JSON.stringify({ date: today, streak: currentStreak, days }));
            setStreak(currentStreak);
            setStreakDays(days);
        }
    }, []);

    useEffect(() => {
        if (questions.length > 0 && flaggedQuestions.length === 0) {
            setFlaggedQuestions(new Array(questions.length).fill(false));
        }
    }, [questions, flaggedQuestions.length]);

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

    const userNameRef = useRef<string>(userName);
    useEffect(() => {
        userNameRef.current = userName;
    }, [userName]);

    useEffect(() => {
        const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "";
        const SOCKET_URL = BASE_URL.replace("/api/v1", "");
        const apiKey = getApiKey();

        const socket = io(SOCKET_URL, {
            query: apiKey ? { auth_token: apiKey } : {},
            transports: ["websocket", "polling"],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
        });

        socketRef.current = socket;

        socket.on("connect", () => {
            setError(null);
            if (lobbyCodeRef.current) {
                socket.emit("join_arena", {
                    lobbyCode: lobbyCodeRef.current,
                    participantName: userNameRef.current,
                });
                return;
            }

            if (hostRef.current === "true") {
                socket.emit("create_arena", {
                    topic: urlTopicRef.current || "",
                    questionCount: parseInt(urlCountRef.current || "5"),
                    difficulty: urlDifficultyRef.current || "medium",
                    adminName: urlNameRef.current || "",
                    timePerQuestion: parseInt(urlTimeRef.current || "30"),
                    gameMode: urlModeRef.current || "casual",
                });
            } else if (lobbyCodeRef.current) {
                socket.emit("join_arena", {
                    lobbyCode: lobbyCodeRef.current,
                    participantName: urlNameRef.current || "",
                });
            }
        });

        socket.on("arena_created", (arena) => {
            setLobbyCode(arena.code);
            lobbyCodeRef.current = arena.code;
            setParticipants(arena.participants);
            setIsHost(true);
            if (arena.timePerQuestion) {
                setTimePerQuestion(arena.timePerQuestion);
                questionDurationRef.current = arena.timePerQuestion;
            }
            if (arena.gameMode) setGameMode(arena.gameMode);
        });

        socket.on("arena_joined", (arena) => {
            setLobbyCode(arena.code);
            lobbyCodeRef.current = arena.code;
            setParticipants(arena.participants);
            if (arena.timePerQuestion) {
                setTimePerQuestion(arena.timePerQuestion);
                questionDurationRef.current = arena.timePerQuestion;
            }
            if (arena.gameMode) setGameMode(arena.gameMode);
        });

        socket.on("participant_joined", (data) => setParticipants(data.participants));
        socket.on("participant_left", (data) => setParticipants(data.participants));
        socket.on("arena_starting", () => setIsStarting(true));

        socket.on("arena_started", (data) => {
            const tpq = data.timePerQuestion || 30;
            questionsRef.current = data.questions;
            correctCountRef.current = 0;
            currentQuestionIndexRef.current = 0;
            selectedAnswerRef.current = null;
            answersRef.current = new Array(data.questions.length).fill(-1);
            hasTimerEmittedRef.current = false;
            questionDurationRef.current = tpq;
            
            setQuestions(data.questions);
            setFlaggedQuestions(new Array(data.questions.length).fill(false));
            gameStartTimeRef.current = Date.now();
            setPhase("active");
            setCurrentQuestionIndex(0);
            setSelectedAnswer(null);
            setAnswers(new Array(data.questions.length).fill(-1));
            setTimePerQuestion(tpq);
            setTimeLeft(tpq);
            setCorrectCount(0);
            setHasSubmitted(false);
        });

        socket.on("question_timer_start", (data: { questionIndex: number; serverTime: number; duration: number }) => {
            if (currentQuestionIndexRef.current === 0 && answersRef.current.every(a => a === -1)) {
                questionStartTimeRef.current = data.serverTime;
                questionDurationRef.current = data.duration;
                hasTimerEmittedRef.current = false;
                const elapsed = Math.floor((Date.now() - data.serverTime) / 1000);
                const remaining = Math.max(0, data.duration - elapsed);
                setCurrentQuestionIndex(data.questionIndex);
                currentQuestionIndexRef.current = data.questionIndex;
                setSelectedAnswer(null);
                selectedAnswerRef.current = null;
                setHasSubmitted(false);
                setTimeLeft(remaining);
                setTimePerQuestion(data.duration);
            }
        });

        socket.on("participant_progress", (updatedParticipants) => setParticipants(updatedParticipants));
        socket.on("arena_finished", (data) => {
            setLeaderboard(data.leaderboard);
            setPhase("finished");
            playSoundRef.current();
        });

        socket.on("error", (data) => {
            if (phaseRef.current === "finished") return;
            setError(data.message);
            socket.disconnect();
        });

        socket.on("disconnect", (reason) => {
            if (phaseRef.current === "finished") return;
            if (reason !== "io client disconnect") setError("Connection lost. Reconnecting...");
        });

        socket.on("reconnect", () => setError(null));

        return () => { socket.disconnect(); };
    }, []);

    useEffect(() => {
        if (phase !== "finished") return;
        if (activeTab === "results") return;
        setTabLoading(true);
        (async () => {
            try {
                if (activeTab === "leaderboard") {
                    const res = await getGlobalLeaderboard();
                    setGlobalLeaderboard(res.leaderboard || []);
                } else if (activeTab === "history") {
                    const res = await getArenaHistory();
                    setArenaHistory(res.history || []);
                } else if (activeTab === "stats") {
                    const res = await getUserAnalytics();
                    setUserStats(res.analytics || {});
                }
            } catch (e: any) {
                console.error("[Tab] Error fetching:", e.message);
            } finally {
                setTabLoading(false);
            }
        })();
    }, [activeTab, phase]);

    useEffect(() => {
        if (phase !== "lobby" || lobbyView === "lobby") return;
        setTabLoading(true);
        (async () => {
            try {
                if (lobbyView === "leaderboard") {
                    const res = await getGlobalLeaderboard();
                    setGlobalLeaderboard(res.leaderboard || []);
                } else if (lobbyView === "history") {
                    const res = await getArenaHistory();
                    setArenaHistory(res.history || []);
                } else if (lobbyView === "stats") {
                    const res = await getUserAnalytics();
                    setUserStats(res.analytics || {});
                }
            } catch (e: any) {
                console.error("[LobbyView] Error fetching:", e.message);
            } finally {
                setTabLoading(false);
            }
        })();
    }, [lobbyView, phase]);

    const moveToNextQuestion = useCallback((updatedCorrectCount: number) => {
        const nextIdx = currentQuestionIndex + 1;
        if (nextIdx < questions.length) {
            setCurrentQuestionIndex(nextIdx);
            currentQuestionIndexRef.current = nextIdx;
            setSelectedAnswer(null);
            selectedAnswerRef.current = null;
            setTimeLeft(timePerQuestion);
        } else {
            const timeTaken = Math.max(1, Math.floor((Date.now() - gameStartTimeRef.current) / 1000));
            socketRef.current?.emit("submit_answer", {
                lobbyCode: lobbyCodeRef.current,
                score: updatedCorrectCount,
                timeTaken,
            });
            setHasSubmitted(true);
        }
    }, [currentQuestionIndex, questions.length, timePerQuestion]);

    useEffect(() => {
        if (phase !== "active" || hasSubmitted || questions.length === 0) return;
        const interval = setInterval(() => {
            setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(interval);
    }, [phase, hasSubmitted, questions.length]);

    useEffect(() => {
        if (phase === "active" && !hasSubmitted && timeLeft === 0 && questions.length > 0) {
            const newAnswers = [...answers];
            newAnswers[currentQuestionIndex] = -1;
            answersRef.current = newAnswers;
            setAnswers(newAnswers);
            socketRef.current?.emit("update_score", { lobbyCode: lobbyCodeRef.current, score: correctCount });
            moveToNextQuestion(correctCount);
        }
    }, [timeLeft, phase, hasSubmitted, questions.length, answers, correctCount, moveToNextQuestion]);

    const handleSelectAnswer = (optionIndex: number) => {
        if (selectedAnswer !== null) return;
        setSelectedAnswer(optionIndex);
        selectedAnswerRef.current = optionIndex;
        const newAnswers = [...answers];
        newAnswers[currentQuestionIndex] = optionIndex;
        setAnswers(newAnswers);
        answersRef.current = newAnswers;

        let nextCorrectCount = correctCount;
        if (optionIndex === questions[currentQuestionIndex]?.correctOptionIndex) {
            nextCorrectCount = correctCount + 1;
            setCorrectCount(nextCorrectCount);
            correctCountRef.current = nextCorrectCount;
        }
        socketRef.current?.emit("update_score", { lobbyCode: lobbyCodeRef.current, score: nextCorrectCount });
        moveToNextQuestion(nextCorrectCount);
    };

    const handleCreateArena = useCallback(() => {
        const socket = socketRef.current;
        if (socket) {
            socket.emit("create_arena", {
                topic: arenaTopic,
                questionCount: arenaCount,
                difficulty: arenaDifficulty,
                adminName: userName,
                timePerQuestion: arenaTime,
                gameMode: arenaMode,
            });
        }
    }, [arenaTopic, arenaCount, arenaDifficulty, userName, arenaTime, arenaMode]);

    const handleJoinArena = useCallback(() => {
        if (!joinCode) return;
        const socket = socketRef.current;
        if (socket) {
            socket.emit("join_arena", {
                lobbyCode: joinCode,
                participantName: userName,
            });
        }
    }, [joinCode, userName]);

    const handleStart = () => socketRef.current?.emit("start_arena", lobbyCode);
    const handleLeave = () => { socketRef.current?.disconnect(); router.push("/chat"); };
    const handleCopyCode = () => {
        navigator.clipboard.writeText(lobbyCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const progressChartData = useCallback(() => {
        return questions.map((_, i) => {
            let cumulativeCorrect = 0;
            for (let j = 0; j <= i; j++) {
                if (answers[j] !== undefined && answers[j] !== -1 && answers[j] === questions[j]?.correctOptionIndex) {
                    cumulativeCorrect++;
                }
            }
            return {
                name: `Q${i + 1}`,
                Score: (phase === "finished" || i <= currentQuestionIndex) ? (cumulativeCorrect * 100) : null,
            };
        });
    }, [questions, answers, currentQuestionIndex, phase]);


    const chartData = useMemo(() => progressChartData(), [progressChartData]);

    const myRecord = useMemo(() => {
        return leaderboard.find(p => p.id === socketRef.current?.id || p.name === userName);
    }, [leaderboard, userName]);

    const myRank = useMemo(() => {
        if (!myRecord) return 1;
        const index = leaderboard.findIndex(p => p.id === myRecord.id);
        return index !== -1 ? index + 1 : 1;
    }, [leaderboard, myRecord]);

    const myScore = myRecord ? myRecord.score : correctCount;
    const myTimeTaken = myRecord ? myRecord.timeTaken : 0;
    
    const myAccuracy = useMemo(() => {
        const totalAnswers = answers.filter(a => a !== -1).length;
        if (totalAnswers === 0) return 0;
        return Math.round((correctCount / totalAnswers) * 100);
    }, [answers, correctCount]);


    return (
        <div className={`${chatHeadingFont.variable} ${chatBodyFont.variable} ${chatAccentFont.variable} font-sans min-h-screen w-full ${
            isDarkMode ? "bg-[#0d0d0c] text-white" : "bg-[#ebeae7] text-black"
        } selection:bg-white selection:text-black overflow-hidden flex transition-colors duration-300`}>

            <div className="absolute inset-0 noise opacity-[0.02] pointer-events-none z-0" />
            <div className={`fixed inset-0 z-0 pointer-events-none overflow-hidden ${isDarkMode ? "opacity-[0.03]" : "opacity-[0.01]"}`}>
                <div className="absolute inset-0" style={{
                    backgroundImage: `linear-gradient(to right, ${isDarkMode ? "#ffffff05" : "#00000008"} 1px, transparent 1px), linear-gradient(to bottom, ${isDarkMode ? "#ffffff05" : "#00000008"} 1px, transparent 1px)`,
                    backgroundSize: '100px 100px'
                }} />
            </div>



            {/* Left Sidebar */}
            <aside 
                style={{ width: collapsed ? "72px" : `${sidebarWidth}px` }}
                className={`hidden md:flex flex-col h-screen flex-shrink-0 border-r relative z-20 ${
                    isResizing ? "transition-none select-none" : "transition-all duration-300"
                } ${
                    isDarkMode ? "bg-[#0d0d0c] border-white/10 text-white" : "bg-[#ebeae7] border-black/10 text-black"
                }`}
            >
                {/* Logo Header (shared across all phases, matches Query Mode) */}
                <div className={`h-16 flex items-center justify-between px-5 border-b ${isDarkMode ? "border-white/5" : "border-black/5"}`}>
                    {phase === "active" ? (
                        <div onClick={() => setShowQuitConfirm(true)} className="flex items-center gap-2 cursor-pointer select-none min-w-0">
                            <img
                                src={isDarkMode ? "/dark.png" : "/light.png"}
                                alt="Logo"
                                className={`${isDarkMode ? "w-6 h-6" : "w-[19px] h-[19px]"} object-contain shrink-0`}
                            />
                            {!collapsed && (
                                <img
                                    src={isDarkMode ? "/dark_text.png" : "/light_text.png"}
                                    alt="Rudra Nexus"
                                    className="h-4 object-contain"
                                />
                            )}
                        </div>
                    ) : (
                        <Link href="/" className="flex items-center gap-2 cursor-pointer select-none min-w-0">
                            <img
                                src={isDarkMode ? "/dark.png" : "/light.png"}
                                alt="Logo"
                                className={`${isDarkMode ? "w-6 h-6" : "w-[19px] h-[19px]"} object-contain shrink-0`}
                            />
                            {!collapsed && (
                                <img
                                    src={isDarkMode ? "/dark_text.png" : "/light_text.png"}
                                    alt="Rudra Nexus"
                                    className="h-4 object-contain"
                                />
                            )}
                        </Link>
                    )}
                    {!collapsed && (
                        <button
                            onClick={() => setCollapsed(true)}
                            className={`p-1.5 rounded-lg transition-colors ${isDarkMode ? "text-white/40 hover:text-white hover:bg-white/5" : "text-black/40 hover:text-black hover:bg-black/5"}`}
                        >
                            <PanelLeftClose className="h-4 w-4" />
                        </button>
                    )}
                </div>

                {/* Sidebar Body */}
                {phase === "active" && questions.length > 0 ? (
                    // Quiz Active Navigation Body
                    <div className="flex-1 overflow-y-auto scrollbar-hide px-6 py-6 space-y-5">
                        {/* Quiz Timer Card */}
                        <div className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${
                            timeLeft <= 5
                                ? "bg-red-500/10 border-red-500/30 text-red-500 animate-pulse"
                                : (isDarkMode ? "bg-white/5 border-white/5 text-white" : "bg-black/5 border-black/5 text-black")
                        }`}>
                            <div className="flex items-center gap-3">
                                <div className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 ${
                                    timeLeft <= 5 ? "bg-red-500/20 text-red-500" : "bg-amber-500/10 text-amber-500"
                                }`}>
                                    <Clock className={`h-4.5 w-4.5 ${timeLeft <= 5 ? "animate-pulse" : ""}`} />
                                </div>
                                <div className="flex flex-col text-left">
                                    <span 
                                        className="text-[8px] font-bold uppercase tracking-wider opacity-40" 
                                        style={{ fontFamily: "var(--font-chat-accent)" }}
                                    >
                                        Time Remaining
                                    </span>
                                    <span 
                                        className="text-sm font-black font-mono leading-none mt-0.5" 
                                        style={{ fontFamily: "var(--font-chat-heading)" }}
                                    >
                                        {formatTime(timeLeft)}
                                    </span>
                                </div>
                            </div>
                            <span 
                                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md ${
                                    timeLeft <= 5 ? "bg-red-500/20" : "bg-zinc-500/10"
                                }`}
                            >
                                {timeLeft}s
                            </span>
                        </div>

                        {/* Quiz Progress */}
                        <div className="space-y-1">
                            <div 
                                className={`text-[9px] font-bold uppercase tracking-[0.2em] ${isDarkMode ? "text-white/30" : "text-black/30"}`}
                                style={{ fontFamily: "var(--font-chat-accent)" }}
                            >
                                Quiz Progress
                            </div>
                            <div 
                                className="text-lg font-black tracking-tight leading-tight"
                                style={{ fontFamily: "var(--font-chat-heading)" }}
                            >
                                Question {currentQuestionIndex + 1} of {questions.length}
                            </div>
                            <div 
                                className={`text-[11px] font-medium ${isDarkMode ? "text-white/40" : "text-black/40"}`}
                                style={{ fontFamily: "var(--font-chat-body)" }}
                            >
                                {questions.length - (currentQuestionIndex + 1)} questions remaining
                            </div>
                            <div className={`w-full ${isDarkMode ? "bg-white/5" : "bg-black/5"} rounded-full h-1.5 mt-3.5 overflow-hidden`}>
                                <div 
                                    className="bg-amber-500 h-1.5 rounded-full transition-all duration-300"
                                    style={{ width: `${((currentQuestionIndex + (selectedAnswer !== null ? 1 : 0)) / questions.length) * 100}%` }}
                                />
                            </div>
                        </div>

                        {/* Question Navigator */}
                        <div className="space-y-3">
                            <div 
                                className={`text-[9px] font-bold uppercase tracking-[0.2em] ${isDarkMode ? "text-white/30" : "text-black/30"}`}
                                style={{ fontFamily: "var(--font-chat-accent)" }}
                            >
                                Question Navigator
                            </div>
                            <div className="grid grid-cols-4 gap-2.5">
                                {questions.map((_, idx) => {
                                    const isCurrent = idx === currentQuestionIndex;
                                    const isAnswered = answers[idx] !== -1;
                                    const isFlagged = flaggedQuestions[idx];
                                    
                                    let cardClass = "";
                                    if (isCurrent) {
                                        cardClass = isDarkMode 
                                            ? "bg-white text-black border-white" 
                                            : "bg-black text-white border-black shadow-md";
                                    } else if (isFlagged) {
                                        cardClass = "bg-red-500/10 border-red-500/30 text-red-500 hover:bg-red-500/20";
                                    } else if (isAnswered) {
                                        cardClass = isDarkMode 
                                            ? "bg-white/10 border-white/10 text-white/95 hover:bg-white/15" 
                                            : "bg-black/5 border-black/5 text-black/95 hover:bg-black/10";
                                    } else {
                                        cardClass = isDarkMode 
                                            ? "bg-white/5 border-white/5 text-white/30 hover:bg-white/10 hover:text-white/60" 
                                            : "bg-black/5 border-black/5 text-black/30 hover:bg-black/10 hover:text-black/60";
                                    }

                                    return (
                                        <button
                                            key={idx}
                                            onClick={() => {
                                                setCurrentQuestionIndex(idx);
                                                setSelectedAnswer(answers[idx] !== -1 ? answers[idx] : null);
                                            }}
                                            className={`h-10 rounded-xl border flex items-center justify-center text-xs font-black transition-all relative ${cardClass}`}
                                            style={{ fontFamily: "var(--font-chat-accent)" }}
                                        >
                                            {idx + 1}
                                            {isFlagged && <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-red-500 rounded-full" />}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Legend */}
                        <div 
                            className="flex flex-wrap gap-x-3 gap-y-1.5 text-[9px] font-bold uppercase opacity-40"
                            style={{ fontFamily: "var(--font-chat-accent)" }}
                        >
                            <div className="flex items-center gap-1"><div className={`h-1.5 w-1.5 rounded-full ${isDarkMode ? "bg-white/40" : "bg-black/40"}`} /> Answered</div>
                            <div className="flex items-center gap-1"><div className="h-1.5 w-1.5 rounded-full bg-amber-500" /> Current</div>
                            <div className="flex items-center gap-1"><div className="h-1.5 w-1.5 rounded-full bg-red-500" /> Marked</div>
                        </div>
                        
                        {/* Actions and Stats Card */}
                        <div className={`pt-5 border-t ${isDarkMode ? "border-white/10" : "border-black/10"} space-y-4`}>
                            <button 
                                onClick={() => {
                                    const n = [...flaggedQuestions];
                                    n[currentQuestionIndex] = !n[currentQuestionIndex];
                                    setFlaggedQuestions(n);
                                }} 
                                className={`w-full py-2.5 px-4 border rounded-xl text-[10px] font-mono uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                                    flaggedQuestions[currentQuestionIndex] 
                                        ? "bg-red-500/20 border-red-500 text-red-400" 
                                        : isDarkMode 
                                            ? "border-white/10 hover:bg-white/5 text-white/70 hover:text-white" 
                                            : "border-black/10 hover:bg-black/5 text-black/70 hover:text-black"
                                }`}
                                style={{ fontFamily: "var(--font-chat-accent)" }}
                            >
                                <Flag className={`h-3.5 w-3.5 ${flaggedQuestions[currentQuestionIndex] ? "fill-current" : ""}`} />
                                {flaggedQuestions[currentQuestionIndex] ? "Question Marked" : "Mark for Review"}
                            </button>

                            <div className={`p-3.5 border rounded-2xl flex items-center justify-between ${
                                isDarkMode ? "bg-white/5 border-white/5" : "bg-black/5 border-black/5"
                            }`}>
                                <div className="flex flex-col text-left">
                                    <span className="text-[8px] font-bold uppercase opacity-45" style={{ fontFamily: "var(--font-chat-accent)" }}>Accuracy</span>
                                    <span className="text-base font-black" style={{ fontFamily: "var(--font-chat-accent)" }}>
                                        {Math.round((correctCount / (answers.filter(a => a !== -1).length || 1)) * 100)}%
                                    </span>
                                </div>
                                <div className="flex flex-col text-right">
                                    <span className="text-[8px] font-bold uppercase opacity-45" style={{ fontFamily: "var(--font-chat-accent)" }}>Score</span>
                                    <span className="text-base font-black text-amber-500" style={{ fontFamily: "var(--font-chat-accent)" }}>{correctCount * 100} XP</span>
                                </div>
                            </div>

                            <button 
                                onClick={() => setShowQuitConfirm(true)} 
                                className="w-full py-3.5 bg-red-500/10 border border-red-500/20 hover:bg-red-500 hover:text-white text-red-500 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all"
                                style={{ fontFamily: "var(--font-chat-accent)" }}
                            >
                                End Quiz
                            </button>
                        </div>
                    </div>
                ) : (
                    // Standard Dashboard Navigation Body
                    <nav className={`flex-1 ${collapsed ? "py-6 px-2" : "py-6 px-4"} space-y-1 overflow-y-auto scrollbar-hide`}>
                        {phase === "finished" ? [
                            { label: "Results", value: "results" as const, icon: Trophy },
                            { label: "Leaderboard", value: "leaderboard" as const, icon: TrendingUp },
                            { label: "My Attempts", value: "history" as const, icon: RefreshCw },
                            { label: "Analytics", value: "stats" as const, icon: LineChart },
                        ].map((item) => {
                            const Icon = item.icon;
                            const isActive = activeTab === item.value;
                            return (
                                <button
                                    key={item.value}
                                    aria-label={item.label}
                                    onClick={() => setActiveTab(item.value)}
                                    className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs font-semibold transition-all group text-left ${
                                        isActive
                                            ? isDarkMode ? "bg-white/5 text-white" : "bg-black/5 text-black font-semibold"
                                            : isDarkMode ? "text-white/40 hover:text-white hover:bg-white/5" : "text-black/60 hover:text-black hover:bg-black/5"
                                    }`}
                                    style={{ fontFamily: "var(--font-chat-heading)" }}
                                >
                                    <Icon className="h-4.5 w-4.5 opacity-60 group-hover:opacity-100" />
                                    <span>{item.label}</span>
                                </button>
                            );
                        }) : [
                            { label: "Quizzes", icon: Trophy, active: true, lobbyView: "lobby" as "lobby" },
                            { label: "Leaderboard", icon: TrendingUp, lobbyView: "leaderboard" as "leaderboard" },
                            { label: "Arena History", icon: RefreshCw, lobbyView: "history" as "history" },
                            { label: "My Stats", icon: LineChart, lobbyView: "stats" as "stats" },
                        ].map((item, idx) => {
                            const Icon = item.icon;
                            const lv = (item as any).lobbyView as typeof lobbyView | undefined;
                            const isActive = lv ? lobbyView === lv : item.active;
                            return (
                                <button
                                    key={idx}
                                    aria-label={item.label}
                                                    onClick={() => {
                                                        const lv = (item as any).lobbyView;
                                                        if (lv) {
                                                            setLobbyView(lv);
                                                        } else if (!isActive && (item as any).href) {
                                                            router.push((item as any).href);
                                                        }
                                                    }}
                                    className={`w-full flex items-center ${collapsed ? "justify-center gap-0" : "gap-3.5"} px-4 py-3 rounded-xl text-xs font-semibold transition-all group text-left ${
                                        isActive
                                            ? isDarkMode ? "bg-white/5 text-white" : "bg-black/5 text-black font-semibold"
                                            : isDarkMode ? "text-white/40 hover:text-white hover:bg-white/5" : "text-black/60 hover:text-black hover:bg-black/5"
                                    }`}
                                    style={{ fontFamily: "var(--font-chat-heading)" }}
                                    title={collapsed ? item.label : undefined}
                                >
                                    <Icon className={`${collapsed ? "h-5 w-5" : "h-4.5 w-4.5"} opacity-60 group-hover:opacity-100`} />
                                    {!collapsed && <span>{item.label}</span>}
                                </button>
                            );
                        })}

                        {!collapsed && <div className={`mt-8 p-4 rounded-2xl border transition-all ${
                            isDarkMode ? "bg-[#1f1f1d] border-white/5" : "bg-[#f6f5f2] border-black/5 shadow-sm"
                        }`}>
                            <div className="flex items-center gap-3 mb-3">
                                <div className="h-9 w-9 bg-orange-500/10 border border-orange-500/20 rounded-xl flex items-center justify-center animate-pulse">
                                    <Flame className="h-5 w-5 text-orange-500 fill-current" />
                                </div>
                                <div className="flex flex-col text-left">
                                    <span className="text-sm font-black tracking-tight text-orange-500" style={{ fontFamily: "var(--font-chat-heading)" }}>{streak}</span>
                                    <span className="text-[8px] font-bold uppercase tracking-wider opacity-40" style={{ fontFamily: "var(--font-chat-accent)" }}>Day Streak</span>
                                </div>
                            </div>
                            <div className="flex justify-between items-center gap-1 mb-3">
                                {["M", "T", "W", "T", "F", "S", "S"].map((day, idx) => {
                                    const isDayActive = streakDays[idx] ?? false;
                                    return (
                                        <div key={idx} className="flex flex-col items-center gap-1.5">
                                            <span className="text-[8px] font-bold opacity-45" style={{ fontFamily: "var(--font-chat-accent)" }}>{day}</span>
                                            <div className={`h-4.5 w-4.5 rounded-full flex items-center justify-center border text-[9px] ${
                                                isDayActive
                                                    ? isDarkMode ? "bg-white border-white text-black" : "bg-black border-black text-white"
                                                    : isDarkMode ? "border-white/10" : "border-black/10"
                                            }`}>
                                                {isDayActive && <Check className="h-2.5 w-2.5 font-bold" />}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            <div 
                                className="text-[8px] font-black text-center uppercase tracking-wider text-orange-500"
                                style={{ fontFamily: "var(--font-chat-accent)" }}
                            >
                                You're on fire! 🔥
                            </div>
                        </div>}
                    </nav>
                )}

                {/* Profile Footer (shared across all phases, matches Query Mode) */}
                <div className={`p-4 border-t ${isDarkMode ? "border-white/5 bg-white/[0.01]" : "border-black/5 bg-black/[0.01]"} flex items-center ${collapsed ? "justify-center gap-2 flex-col" : "justify-between"} relative`}>
                    {collapsed ? (
                        <button
                            onClick={() => setCollapsed(false)}
                            className={`p-1.5 rounded-lg border transition-all ${isDarkMode ? "border-white/10 text-white/60 hover:text-white hover:bg-white/5" : "border-black/10 text-black/60 hover:text-black hover:bg-black/5"}`}
                        >
                            <PanelLeftOpen className="h-4 w-4" />
                        </button>
                    ) : (
                        <div className="flex items-center gap-2 min-w-0 text-left">
                            <div className={`h-8 w-8 rounded-full flex items-center justify-center relative shrink-0 ${
                                isDarkMode ? "bg-white/5 border-white/10" : "bg-black/5 border-black/10"
                            } border overflow-hidden`}>
                                {profilePic ? (
                                    <img src={profilePic} alt="Profile" className="h-full w-full object-cover" />
                                ) : (
                                    <User className={`h-4 w-4 ${isDarkMode ? "text-white/80" : "text-black/80"}`} />
                                )}
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span 
                                    className={`text-[11px] font-bold truncate ${isDarkMode ? "text-white" : "text-black"}`}
                                    style={{ fontFamily: "var(--font-chat-heading)" }}
                                >
                                    {userName || "User"}
                                </span>
                                <span 
                                    className={`text-[9px] font-mono uppercase tracking-widest ${isDarkMode ? "text-white/40" : "text-black/40"}`}
                                    style={{ fontFamily: "var(--font-chat-accent)" }}
                                >
                                    {userRole === "global_admin" ? "CEO" : (userRole === "school_admin" ? "Admin" : userRole === "faculty" ? "Faculty" : userRole === "enterprise_admin" ? "Admin" : userRole === "manager" ? "Manager" : "Learner")}
                                </span>
                            </div>
                        </div>
                    )}
                    {!collapsed && (
                        <div className="flex items-center gap-1.5 shrink-0">
                            <button 
                                onClick={toggleTheme} 
                                aria-label="Toggle Theme"
                                className={`p-1.5 rounded-lg border transition-all ${
                                    isDarkMode ? "border-white/10 text-white/60 hover:text-white hover:bg-white/5" : "border-black/10 text-black/60 hover:text-black hover:bg-black/5"
                                }`}
                            >
                                {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                            </button>
                            <button 
                                onClick={() => router.push("/chat")} 
                                aria-label="Exit to Chat"
                                className={`p-1.5 rounded-lg border transition-all ${
                                    isDarkMode ? "border-white/10 text-white/60 hover:text-white hover:bg-white/5" : "border-black/10 text-black/60 hover:text-black hover:bg-black/5"
                                }`}
                            >
                                <LogOut className="h-4 w-4" />
                            </button>
                        </div>
                    )}
                </div>

                {/* Resize Handle */}
                <div 
                    onMouseDown={startResizing}
                    className={`absolute top-0 right-0 bottom-0 w-[5px] cursor-col-resize hover:bg-amber-500/30 active:bg-amber-500 transition-colors z-30 ${
                        isResizing ? "bg-amber-500" : ""
                    }`}
                />
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 h-screen flex flex-col overflow-hidden relative z-10">
                {/* Faded Background Trophy Image (Centered in Main Content Area) */}
                <div className={`absolute inset-0 flex items-center justify-center pointer-events-none z-0 transition-all duration-300 translate-y-12 ${
                    isDarkMode ? "opacity-[0.07]" : "opacity-[0.09]"
                }`}>
                    <img 
                        src="/trophy-cup-flat-style-icon-illustration-vector.png" 
                        alt="Background Trophy" 
                        className={`w-[90vw] md:w-[80vw] lg:w-[70vw] max-w-[1000px] h-auto object-contain select-none pointer-events-none grayscale ${
                            isDarkMode ? "invert brightness-125 contrast-75" : ""
                        }`}
                    />
                </div>
                <div className="h-0 flex-shrink-0" />

                <main className="flex-1 overflow-y-auto scrollbar-hide p-2 sm:p-6 md:p-8">
                    {error && phase !== "finished" && (
                        <div className="max-w-xl mx-auto mt-20 p-6 border border-red-500/30 bg-red-500/10 text-center rounded-3xl">
                            <X className="h-8 w-8 mx-auto mb-4 text-red-400" />
                            <p className="text-red-400 text-sm font-mono mb-6">{error}</p>
                            <button onClick={() => router.push("/chat")} className="px-6 py-3 bg-[#f6f5f2] text-black text-[10px] font-black uppercase tracking-[0.3em] rounded-xl hover:scale-105 transition-all">Back to Chat</button>
                        </div>
                    )}

                    {!error && phase === "lobby" && (
                        lobbyView === "lobby" ? (
                            !lobbyCode && participants.length === 0 ? (
                                <div className="max-w-3xl mx-auto mt-12">
                                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                                        <div className={`border p-10 rounded-[2rem] text-center ${isDarkMode ? "border-white/5 bg-[#161615]" : "border-black/5 bg-[#fbfaf8] shadow-md"}`}>
                                            <Swords className="h-12 w-12 mx-auto mb-4 opacity-60" />
                                            <h2 className="text-3xl font-black tracking-tight uppercase mb-2">Battle Arena</h2>
                                            <p className="text-sm opacity-50 mb-8">Create or join a quiz battle to get started</p>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-xl mx-auto">
                                                <div className={`p-6 border rounded-2xl text-left ${isDarkMode ? "border-white/5 bg-white/[0.02]" : "border-black/5 bg-black/[0.01]"}`}>
                                                    <h3 className="text-sm font-black uppercase tracking-wider mb-4">Create Battle</h3>
                                                    <div className="space-y-3">
                                                        <input value={arenaTopic} onChange={e => setArenaTopic(e.target.value)} placeholder="Topic (e.g. JavaScript)" className={`w-full px-3 py-2.5 border rounded-xl text-xs bg-transparent ${isDarkMode ? "border-white/10 text-white placeholder:text-white/30" : "border-black/10 text-black placeholder:text-black/40"}`} />
                                                        <select value={arenaDifficulty} onChange={e => setArenaDifficulty(e.target.value)} className={`w-full px-3 py-2.5 border rounded-xl text-xs bg-transparent ${isDarkMode ? "border-white/10 text-white" : "border-black/10 text-black"}`}>
                                                            <option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option>
                                                        </select>
                                                        <div className="flex gap-2">
                                                            <input type="number" value={arenaCount} onChange={e => setArenaCount(Number(e.target.value))} min={3} max={20} className={`w-1/2 px-3 py-2.5 border rounded-xl text-xs bg-transparent ${isDarkMode ? "border-white/10 text-white" : "border-black/10 text-black"}`} />
                                                            <input type="number" value={arenaTime} onChange={e => setArenaTime(Number(e.target.value))} min={10} max={120} className={`w-1/2 px-3 py-2.5 border rounded-xl text-xs bg-transparent ${isDarkMode ? "border-white/10 text-white" : "border-black/10 text-black"}`} />
                                                        </div>
                                                        <select value={arenaMode} onChange={e => setArenaMode(e.target.value)} className={`w-full px-3 py-2.5 border rounded-xl text-xs bg-transparent ${isDarkMode ? "border-white/10 text-white" : "border-black/10 text-black"}`}>
                                                            <option value="casual">Casual</option><option value="competitive">Competitive</option>
                                                        </select>
                                                        <button onClick={handleCreateArena} className="w-full py-3 bg-amber-500 text-black rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-amber-600 transition-all">Create Arena</button>
                                                    </div>
                                                </div>
                                                <div className={`p-6 border rounded-2xl text-left ${isDarkMode ? "border-white/5 bg-white/[0.02]" : "border-black/5 bg-black/[0.01]"}`}>
                                                    <h3 className="text-sm font-black uppercase tracking-wider mb-4">Join Battle</h3>
                                                    <div className="space-y-3">
                                                        <input value={joinCode} onChange={e => setJoinCode(e.target.value)} placeholder="Enter lobby code" className={`w-full px-3 py-2.5 border rounded-xl text-xs bg-transparent uppercase tracking-widest ${isDarkMode ? "border-white/10 text-white placeholder:text-white/30" : "border-black/10 text-black placeholder:text-black/40"}`} />
                                                        <button onClick={handleJoinArena} className={`w-full py-3 border rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${isDarkMode ? "border-white/10 text-white hover:bg-white/5" : "border-black/10 text-black hover:bg-black/5"}`}>Join Arena</button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                </div>
                            ) : (
                                <div className="max-w-2xl mx-auto mt-12">
                                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={`border p-10 rounded-[2rem] ${isDarkMode ? "border-white/5 bg-[#161615]" : "border-black/5 bg-[#fbfaf8] shadow-md"}`}>
                                        <div className="relative z-10 text-center">
                                            <h2 className="text-2xl font-black tracking-tight uppercase mb-8">Waiting Room</h2>
                                            {isHost && (
                                                <div className={`mb-10 p-6 border rounded-2xl ${isDarkMode ? "border-white/5 bg-white/5" : "bg-black/5 border-black/5"}`}>
                                                    <p className="text-[9px] font-mono uppercase tracking-[0.3em] mb-3 opacity-30">Invite Code</p>
                                                    <div className="flex items-center justify-center gap-4">
                                                        <span className="text-4xl font-black tracking-[0.4em]">{lobbyCode}</span>
                                                        <button onClick={handleCopyCode} className={`p-3 border rounded-xl ${isDarkMode ? "bg-white/10 border-white/20" : "bg-[#f6f5f2] border-black/10 shadow-sm"}`}>
                                                            {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-2 mb-4 opacity-50"><Users className="h-4 w-4" /><span className="text-[10px] font-mono uppercase tracking-widest">Participants ({participants.length})</span></div>
                                                {participants.map((p, i) => (
                                                    <div key={p.id} className={`flex items-center justify-between p-4 border rounded-2xl ${isDarkMode ? "bg-white/5 border-white/10" : "bg-black/5 border-black/10"}`}>
                                                        <div className="flex items-center gap-3">
                                                            <div className={`h-8 w-8 rounded-full flex items-center justify-center ${isDarkMode ? "bg-white/10" : "bg-black/10"}`}><User className="h-4 w-4" /></div>
                                                            <span className="text-sm font-medium">{p.name}</span>
                                                        </div>
                                                        {i === 0 && <span className="text-[8px] font-mono px-2 py-1 bg-amber-500/20 text-amber-500 rounded-full uppercase">Host</span>}
                                                    </div>
                                                ))}
                                            </div>
                                            {isHost && (
                                                <button onClick={handleStart} disabled={isStarting} className={`mt-10 w-full py-5 text-[10px] font-black uppercase tracking-[0.3em] rounded-[2rem] transition-all flex items-center justify-center gap-3 ${isDarkMode ? "bg-white text-black" : "bg-black text-white"}`}>
                                                    {isStarting ? <><RefreshCw className="h-4 w-4 animate-spin" /> Starting...</> : "Start Battle"}
                                                </button>
                                            )}
                                        </div>
                                    </motion.div>
                                </div>
                            )
                        ) : (
                            <motion.div key={lobbyView} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={`border p-6 sm:p-8 rounded-[2rem] ${isDarkMode ? "border-white/5 bg-[#161615]" : "border-black/5 bg-[#fbfaf8] shadow-md"}`}>
                                {tabLoading ? (
                                    <div className="flex items-center justify-center py-20">
                                        <RefreshCw className="h-6 w-6 animate-spin opacity-50" />
                                    </div>
                                ) : lobbyView === "leaderboard" ? (
                                    <div>
                                        <div className="flex items-center justify-between mb-6">
                                            <div className="flex items-center gap-2">
                                                <TrendingUp className="h-5 w-5 opacity-60" />
                                                <h3 className="text-base font-black uppercase tracking-tight">Global Leaderboard</h3>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => setLeaderboardViewMode("table")} className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider border transition-all ${leaderboardViewMode === "table" ? (isDarkMode ? "bg-white/10 border-white/20 text-white" : "bg-black/10 border-black/20 text-black") : (isDarkMode ? "border-white/5 text-white/40 hover:text-white" : "border-black/5 text-black/40 hover:text-black")}`}><BarChart3 className="h-3.5 w-3.5 inline mr-1" />Table</button>
                                                <button onClick={() => setLeaderboardViewMode("graph")} className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider border transition-all ${leaderboardViewMode === "graph" ? (isDarkMode ? "bg-white/10 border-white/20 text-white" : "bg-black/10 border-black/20 text-black") : (isDarkMode ? "border-white/5 text-white/40 hover:text-white" : "border-black/5 text-black/40 hover:text-black")}`}><LineChart className="h-3.5 w-3.5 inline mr-1" />Graph</button>
                                            </div>
                                        </div>
                                        {globalLeaderboard.length === 0 ? (
                                            <p className="text-sm opacity-50 text-center py-10">No leaderboard data available.</p>
                                        ) : leaderboardViewMode === "graph" ? (
                                            <div className="h-80 w-full">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <BarChart data={globalLeaderboard.slice(0, 20)} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"} />
                                                        <XAxis dataKey="name" tick={{ fill: isDarkMode ? "#ffffff60" : "#00000060", fontSize: 10 }} axisLine={false} tickLine={false} />
                                                        <YAxis tick={{ fill: isDarkMode ? "#ffffff60" : "#00000060", fontSize: 10 }} axisLine={false} tickLine={false} />
                                                        <Tooltip contentStyle={{ backgroundColor: isDarkMode ? "#161615" : "#ffffff", border: isDarkMode ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(0,0,0,0.1)", borderRadius: "12px", fontSize: "12px" }} />
                                                        <Bar dataKey="score" radius={[4, 4, 0, 0]} fill={isDarkMode ? "#ffffff" : "#000000"} />
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="relative mb-4">
                                                    <input value={leaderboardSearch} onChange={e => { setLeaderboardSearch(e.target.value); setLeaderboardPage(1) }} placeholder="Search by name..." className={`w-full px-4 py-2.5 border rounded-xl text-xs bg-transparent pl-10 ${isDarkMode ? "border-white/10 text-white placeholder:text-white/30" : "border-black/10 text-black placeholder:text-black/40"}`} />
                                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-40" />
                                                </div>
                                                {(() => {
                                                    const filtered = globalLeaderboard.filter(e => e.name.toLowerCase().includes(leaderboardSearch.toLowerCase()));
                                                    const totalPages = Math.ceil(filtered.length / itemsPerPage);
                                                    const paged = filtered.slice((leaderboardPage - 1) * itemsPerPage, leaderboardPage * itemsPerPage);
                                                    return (
                                                        <div className="overflow-x-auto">
                                                            <table className="w-full text-xs">
                                                                <thead>
                                                                    <tr className={`border-b ${isDarkMode ? "border-white/5" : "border-black/5"}`}>
                                                                        <th className="text-left py-3 px-2 font-semibold opacity-50 uppercase tracking-wider">Rank</th>
                                                                        <th className="text-left py-3 px-2 font-semibold opacity-50 uppercase tracking-wider">Player</th>
                                                                        <th className="text-right py-3 px-2 font-semibold opacity-50 uppercase tracking-wider">Score</th>
                                                                        <th className="text-right py-3 px-2 font-semibold opacity-50 uppercase tracking-wider">Wins</th>
                                                                        <th className="text-right py-3 px-2 font-semibold opacity-50 uppercase tracking-wider">Activities</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {paged.map((entry) => (
                                                                        <tr key={entry.rank} className={`border-b ${isDarkMode ? "border-white/5" : "border-black/5"} ${isDarkMode ? "hover:bg-white/[0.02]" : "hover:bg-black/[0.02]"} transition-colors`}>
                                                                            <td className="py-3 px-2">
                                                                                <div className="relative h-8 w-8 flex items-center justify-center">
                                                                                    {entry.rank === 1 ? <img src="/1 medal.svg" alt="1st" className="h-full w-full object-contain" />
                                                                                    : entry.rank === 2 ? <img src="/2medal.svg" alt="2nd" className="h-full w-full object-contain" />
                                                                                    : entry.rank === 3 ? <img src="/3medal.svg" alt="3rd" className="h-full w-full object-contain" />
                                                                                    : <><img src="/badge.svg" alt="" className="h-full w-full object-contain absolute" /><span className="absolute text-[8px] font-black text-white">{entry.rank}</span></>}
                                                                                </div>
                                                                            </td>
                                                                            <td className="py-3 px-2 font-semibold">{entry.name}</td>
                                                                            <td className="py-3 px-2 text-right font-bold">{entry.score}</td>
                                                                            <td className="py-3 px-2 text-right">{entry.arena_wins ?? 0}</td>
                                                                            <td className="py-3 px-2 text-right opacity-60">{entry.activities ?? 0}</td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                            {totalPages > 1 && (
                                                                <div className="flex items-center justify-center gap-2 mt-4">
                                                                    <button onClick={() => setLeaderboardPage(Math.max(1, leaderboardPage - 1))} disabled={leaderboardPage === 1} className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider border transition-all disabled:opacity-30 ${isDarkMode ? "border-white/10 text-white/60" : "border-black/10 text-black/60"}`}>Prev</button>
                                                                    <span className="text-[10px] opacity-50">{leaderboardPage} / {totalPages}</span>
                                                                    <button onClick={() => setLeaderboardPage(Math.min(totalPages, leaderboardPage + 1))} disabled={leaderboardPage === totalPages} className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider border transition-all disabled:opacity-30 ${isDarkMode ? "border-white/10 text-white/60" : "border-black/10 text-black/60"}`}>Next</button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })()}
                                            </>
                                        )}
                                    </div>
                                ) : lobbyView === "history" ? (
                                    <div>
                                        <div className="flex items-center gap-2 mb-6">
                                            <RefreshCw className="h-5 w-5 opacity-60" />
                                            <h3 className="text-base font-black uppercase tracking-tight">Arena History</h3>
                                        </div>
                                        {arenaHistory.length === 0 ? (
                                            <p className="text-sm opacity-50 text-center py-10">No arena history available.</p>
                                        ) : (
                                            <>
                                                {/* Summary Stats */}
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                                    <div className={`p-4 border rounded-2xl text-center ${isDarkMode ? "border-white/5" : "border-black/5"}`}>
                                                        <span className="text-xl font-black">{arenaHistory.length}</span>
                                                        <span className="text-[8px] uppercase tracking-wider opacity-40 block mt-1">Total Battles</span>
                                                    </div>
                                                    <div className={`p-4 border rounded-2xl text-center ${isDarkMode ? "border-white/5" : "border-black/5"}`}>
                                                        <span className="text-xl font-black">{arenaHistory.filter(h => h.status === "completed").length}</span>
                                                        <span className="text-[8px] uppercase tracking-wider opacity-40 block mt-1">Completed</span>
                                                    </div>
                                                    <div className={`p-4 border rounded-2xl text-center ${isDarkMode ? "border-white/5" : "border-black/5"}`}>
                                                        <span className="text-xl font-black">{new Set(arenaHistory.map(h => h.topic)).size}</span>
                                                        <span className="text-[8px] uppercase tracking-wider opacity-40 block mt-1">Topics</span>
                                                    </div>
                                                    <div className={`p-4 border rounded-2xl text-center ${isDarkMode ? "border-white/5" : "border-black/5"}`}>
                                                        <span className="text-xl font-black">{arenaHistory.reduce((a, h) => a + (h.leaderboard?.length ?? 0), 0)}</span>
                                                        <span className="text-[8px] uppercase tracking-wider opacity-40 block mt-1">Total Players</span>
                                                    </div>
                                                </div>
                                                {/* Difficulty Distribution Chart */}
                                                <div className={`p-4 border rounded-2xl mb-6 ${isDarkMode ? "border-white/5" : "border-black/5"}`}>
                                                    <h4 className="text-[9px] font-bold uppercase tracking-wider opacity-50 mb-3">Difficulty Distribution</h4>
                                                    <div className="h-40">
                                                        <ResponsiveContainer width="100%" height="100%">
                                                            <PieChart>
                                                                <Pie data={(() => {
                                                                    const counts: Record<string, number> = {};
                                                                    arenaHistory.forEach(h => { counts[h.difficulty] = (counts[h.difficulty] || 0) + 1; });
                                                                    return Object.entries(counts).map(([name, value]) => ({ name, value }));
                                                                })()} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} label={({ name, percent }: any) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}>
                                                                    {["#22c55e", "#eab308", "#ef4444"].map((color, i) => <Cell key={i} fill={color} />)}
                                                                </Pie>
                                                                <Tooltip />
                                                            </PieChart>
                                                        </ResponsiveContainer>
                                                    </div>
                                                </div>
                                                {/* History Table */}
                                                <div className="overflow-x-auto">
                                                    {(() => {
                                                        const totalPages = Math.ceil(arenaHistory.length / itemsPerPage);
                                                        const paged = arenaHistory.slice((historyPage - 1) * itemsPerPage, historyPage * itemsPerPage);
                                                        return (
                                                            <>
                                                                <table className="w-full text-xs">
                                                                    <thead>
                                                                        <tr className={`border-b ${isDarkMode ? "border-white/5" : "border-black/5"}`}>
                                                                            <th className="text-left py-3 px-2 font-semibold opacity-50 uppercase tracking-wider">Topic</th>
                                                                            <th className="text-left py-3 px-2 font-semibold opacity-50 uppercase tracking-wider">Difficulty</th>
                                                                            <th className="text-center py-3 px-2 font-semibold opacity-50 uppercase tracking-wider">Questions</th>
                                                                            <th className="text-center py-3 px-2 font-semibold opacity-50 uppercase tracking-wider">Players</th>
                                                                            <th className="text-center py-3 px-2 font-semibold opacity-50 uppercase tracking-wider">Status</th>
                                                                            <th className="text-right py-3 px-2 font-semibold opacity-50 uppercase tracking-wider">Date</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                        {paged.map((item) => (
                                                                            <tr key={item.id} className={`border-b ${isDarkMode ? "border-white/5" : "border-black/5"} ${isDarkMode ? "hover:bg-white/[0.02]" : "hover:bg-black/[0.02]"} transition-colors`}>
                                                                                <td className="py-3 px-2 font-semibold">{item.topic}</td>
                                                                                <td className="py-3 px-2">
                                                                                    <span className={`text-[9px] px-2 py-0.5 rounded uppercase font-bold ${isDarkMode ? "bg-white/5 text-white/70" : "bg-black/5 text-black/70"}`}>{item.difficulty}</span>
                                                                                </td>
                                                                                <td className="py-3 px-2 text-center">{item.question_count}</td>
                                                                                <td className="py-3 px-2 text-center">{item.participant_count ?? 0}</td>
                                                                                <td className="py-3 px-2 text-center">
                                                                                    <span className={`text-[9px] px-2 py-0.5 rounded uppercase font-bold ${item.status === "completed" ? "text-emerald-500 bg-emerald-500/10" : "text-amber-500 bg-amber-500/10"}`}>{item.status}</span>
                                                                                </td>
                                                                                <td className="py-3 px-2 text-right opacity-60">{new Date(item.created_at).toLocaleDateString()}</td>
                                                                            </tr>
                                                                        ))}
                                                                    </tbody>
                                                                </table>
                                                                {totalPages > 1 && (
                                                                    <div className="flex items-center justify-center gap-2 mt-4">
                                                                        <button onClick={() => setHistoryPage(Math.max(1, historyPage - 1))} disabled={historyPage === 1} className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider border transition-all disabled:opacity-30 ${isDarkMode ? "border-white/10 text-white/60" : "border-black/10 text-black/60"}`}>Prev</button>
                                                                        <span className="text-[10px] opacity-50">{historyPage} / {totalPages}</span>
                                                                        <button onClick={() => setHistoryPage(Math.min(totalPages, historyPage + 1))} disabled={historyPage === totalPages} className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider border transition-all disabled:opacity-30 ${isDarkMode ? "border-white/10 text-white/60" : "border-black/10 text-black/60"}`}>Next</button>
                                                                    </div>
                                                                )}
                                                            </>
                                                        );
                                                    })()}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ) : lobbyView === "stats" ? (
                                    <div>
                                        <div className="flex items-center gap-2 mb-6">
                                            <LineChart className="h-5 w-5 opacity-60" />
                                            <h3 className="text-base font-black uppercase tracking-tight">My Stats</h3>
                                        </div>
                                        {userStats ? (
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className={`p-4 border rounded-2xl text-center ${isDarkMode ? "border-white/5" : "border-black/5"}`}>
                                                    <span className="text-2xl font-black">{userStats.total_battles ?? 0}</span>
                                                    <span className="text-[9px] uppercase tracking-wider opacity-40 block mt-1">Battles</span>
                                                </div>
                                                <div className={`p-4 border rounded-2xl text-center ${isDarkMode ? "border-white/5" : "border-black/5"}`}>
                                                    <span className="text-2xl font-black">{userStats.total_wins ?? 0}</span>
                                                    <span className="text-[9px] uppercase tracking-wider opacity-40 block mt-1">Wins</span>
                                                </div>
                                                <div className={`p-4 border rounded-2xl text-center ${isDarkMode ? "border-white/5" : "border-black/5"}`}>
                                                    <span className="text-2xl font-black">{userStats.total_participation ?? 0}</span>
                                                    <span className="text-[9px] uppercase tracking-wider opacity-40 block mt-1">Participation</span>
                                                </div>
                                                <div className={`p-4 border rounded-2xl text-center ${isDarkMode ? "border-white/5" : "border-black/5"}`}>
                                                    <span className="text-2xl font-black">{(userStats.win_rate ?? 0).toFixed(1)}%</span>
                                                    <span className="text-[9px] uppercase tracking-wider opacity-40 block mt-1">Win Rate</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <p className="text-sm opacity-50 text-center py-10">No stats available.</p>
                                        )}
                                    </div>
                                ) : null}
                            </motion.div>
                        )
                    )}

                    {!error && phase === "active" && questions.length > 0 && (
                        <div className="w-full max-w-3xl mx-auto py-2 sm:py-4 px-2 sm:px-0">
                            {hasSubmitted ? (
                                <div className="text-center py-20 space-y-6">
                                    <div className="relative h-20 w-20 mx-auto">
                                        <div className="absolute inset-0 rounded-full border-4 border-amber-500/20 border-t-amber-500 animate-spin" />
                                        <Trophy className="absolute inset-0 m-auto h-8 w-8 text-amber-500" />
                                    </div>
                                    <h2 className="text-2xl font-black uppercase">Waiting for other players...</h2>
                                    <p className="opacity-50">Great job! The final results will be ready shortly.</p>
                                </div>
                            ) : (
                                <>
                                    <motion.div 
                                        key={currentQuestionIndex} 
                                        initial={{ opacity: 0, y: 15 }} 
                                        animate={{ opacity: 1, y: 0 }} 
                                        className="w-full relative transition-all duration-300"
                                    >
                                        <div className="flex items-center justify-between mb-4 sm:mb-6 relative z-10">
                                            <span 
                                                className={`text-[10px] font-bold px-3 py-1.5 rounded-xl uppercase tracking-wider ${isDarkMode ? "bg-white/5 text-white/70" : "bg-black/5 text-black/70"}`}
                                                style={{ fontFamily: "var(--font-chat-accent)" }}
                                            >
                                                Single Choice
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <Clock className={`h-4 w-4 ${timeLeft <= 5 ? "text-red-500 animate-pulse" : "text-amber-500"}`} />
                                                <span 
                                                    className={`text-xs font-black font-mono px-3 py-1.5 rounded-xl border transition-all ${
                                                        timeLeft <= 5 
                                                            ? "bg-red-500/10 border-red-500/20 text-red-500 animate-pulse" 
                                                            : (isDarkMode ? "bg-white/5 border-white/10 text-white/70" : "bg-black/5 border-black/10 text-black/70")
                                                    }`}
                                                >
                                                    {timeLeft}s
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-4 sm:mb-6 lg:mb-8 relative z-10">
                                            <h3 
                                                className="text-sm sm:text-lg lg:text-2xl font-black tracking-tight leading-snug flex-1"
                                                style={{ fontFamily: "var(--font-chat-heading)" }}
                                            >
                                                {questions[currentQuestionIndex]?.question}
                                            </h3>
                                        </div>

                                        <div className="grid grid-cols-1 gap-2.5 sm:gap-3 relative z-10">
                                            {questions[currentQuestionIndex]?.options.map((opt, i) => {
                                                const isSelected = selectedAnswer === i;
                                                const isCorrect = questions[currentQuestionIndex]?.correctOptionIndex === i;
                                                const showResult = selectedAnswer !== null;
                                                const optionLabels = ["A", "B", "C", "D"];

                                                let btnClass = isDarkMode ? "bg-[#1f1f1d] border-white/5 hover:bg-white/5 text-white/80" : "bg-[#f6f5f2] border-black/5 hover:bg-black/5 text-black/80 shadow-sm";
                                                if (showResult) {
                                                    if (isCorrect) btnClass = "bg-emerald-500/10 border-emerald-500 text-emerald-500";
                                                    else if (isSelected) btnClass = "bg-red-500/10 border-red-500 text-red-500";
                                                    else btnClass += " opacity-40";
                                                } else if (isSelected) {
                                                    btnClass = isDarkMode ? "bg-white/5 border-white text-white shadow-lg" : "bg-black/5 border-black text-black shadow-md";
                                                }

                                                return (
                                                    <button 
                                                        key={i} 
                                                        onClick={() => handleSelectAnswer(i)} 
                                                        disabled={selectedAnswer !== null} 
                                                        className={`w-full text-left px-3.5 py-2.5 sm:px-4 sm:py-3.5 lg:p-5 border rounded-xl lg:rounded-2xl text-xs sm:text-sm lg:text-base font-semibold transition-all flex items-center gap-2.5 sm:gap-3 lg:gap-4 ${btnClass}`}
                                                        style={{ fontFamily: "var(--font-chat-body)" }}
                                                    >
                                                        <span 
                                                            className={`h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 flex items-center justify-center rounded-full text-[10px] sm:text-xs lg:text-sm font-mono border flex-shrink-0 ${
                                                                isSelected 
                                                                    ? (isDarkMode ? "bg-white border-white text-black" : "bg-black border-black text-white") 
                                                                    : (isDarkMode ? "border-white/20 bg-white/5" : "border-black/10 bg-black/5")
                                                            }`}
                                                            style={{ fontFamily: "var(--font-chat-accent)" }}
                                                        >
                                                            {optionLabels[i]}
                                                        </span>
                                                        <span className="flex-1 leading-normal">{opt}</span>
                                                        {showResult && (isCorrect ? <Check className="h-5 w-5" /> : isSelected && <X className="h-5 w-5" />)}
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        {selectedAnswer !== null && questions[currentQuestionIndex]?.explanation && (
                                            <motion.div 
                                                initial={{ opacity: 0, y: 10 }} 
                                                animate={{ opacity: 1, y: 0 }} 
                                                className={`mt-4 sm:mt-5 lg:mt-6 p-3 sm:p-4 lg:p-5 border rounded-xl lg:rounded-2xl ${
                                                    isDarkMode ? "border-white/10 bg-white/5" : "border-black/5 bg-black/5"
                                                }`}
                                            >
                                                <span 
                                                    className="text-[9px] uppercase tracking-widest opacity-40 block mb-2"
                                                    style={{ fontFamily: "var(--font-chat-accent)" }}
                                                >
                                                    Explanation
                                                </span>
                                                <p 
                                                    className="text-xs sm:text-sm opacity-80 leading-relaxed"
                                                    style={{ fontFamily: "var(--font-chat-body)" }}
                                                >
                                                    {questions[currentQuestionIndex]?.explanation}
                                                </p>
                                            </motion.div>
                                        )}
                                    </motion.div>
                                </>
                            )}
                        </div>
                    )}

                    {phase === "finished" && (
                        <div className="w-full mx-auto space-y-10">
                            {/* Party Popper Confetti Canvas Effect */}
                            <PartyPopperEffect />

                            {/* Section 1: Leaderboard Standings Grid */}
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full items-start">
                                {/* Left Column: Trophy Illustration & Podium Card + Action Card */}
                                <div className="lg:col-span-5 space-y-6 flex flex-col h-full justify-between">
                                    {/* Big Card: Final Standings with Trophy illustration */}
                                    <div className={`p-6 sm:p-8 rounded-[2rem] border relative overflow-hidden flex-1 ${
                                        isDarkMode ? "bg-[#161615] border-white/5" : "bg-[#fbfaf8] border-black/5 shadow-md"
                                    }`}>
                                        {/* Continuously falling/popping sparkles */}
                                        <TrophySparklesEffect />

                                        <div className="text-center py-4 relative z-10">
                                            {/* Laurel Leaves (Patte) and Trophy Image */}
                                            <div className="relative flex items-center justify-center mx-auto mb-2" style={{ width: 180, height: 140 }}>
                                                <img 
                                                    src="/trophy_4645225 (1).png" 
                                                    alt="Trophy" 
                                                    className="w-full h-full object-contain relative z-10 select-none pointer-events-none"
                                                />
                                            </div>
                                            <h2 className="text-xl font-black uppercase tracking-wider" style={{ fontFamily: "var(--font-chat-heading)" }}>Final Standings</h2>
                                            <span className="text-[10px] opacity-40 uppercase tracking-widest block mt-1" style={{ fontFamily: "var(--font-chat-accent)" }}>Battle Arena Results</span>
                                        </div>

                                        {/* Top Player Card (Cream background with orange border) */}
                                        {leaderboard.slice(0, 1).map((p) => (
                                            <div 
                                                key={p.id}
                                                className={`p-5 rounded-3xl border flex items-center justify-between relative z-10 mt-4 ${
                                                    isDarkMode 
                                                        ? "bg-orange-500/5 border-orange-500/20 text-orange-400" 
                                                        : "bg-orange-500/[0.03] border-orange-500/20 text-orange-600"
                                                }`}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="relative h-12 w-12 flex items-center justify-center shrink-0">
                                                        <img 
                                                            src="/1 medal.svg" 
                                                            alt="1st Medal" 
                                                            className="h-full w-full object-contain select-none pointer-events-none" 
                                                        />
                                                    </div>
                                                    <div className="flex flex-col text-left">
                                                        <span className="text-base font-black truncate max-w-[150px] leading-tight" style={{ fontFamily: "var(--font-chat-heading)" }}>
                                                            {p.name}
                                                        </span>
                                                        <span className="text-[9px] opacity-60 uppercase font-mono flex items-center gap-1 mt-1">
                                                            <Clock className="h-3 w-3" /> {p.timeTaken}s TAKEN
                                                        </span>
                                                    </div>
                                                </div>
                                                <span className="text-base font-black tracking-tight" style={{ fontFamily: "var(--font-chat-accent)" }}>
                                                    {p.score * 100} PTS
                                                </span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Action Card: Finish the session */}
                                    <div className={`p-5 rounded-3xl border flex items-center justify-between gap-4 ${
                                        isDarkMode ? "bg-[#161615] border-white/5" : "bg-[#fbfaf8] border-black/5 shadow-md"
                                    }`}>
                                        <div className="flex items-center gap-3.5 min-w-0">
                                            <div className={`h-11 w-11 rounded-full flex items-center justify-center shrink-0 ${
                                                isDarkMode ? "bg-indigo-500/10 text-indigo-400" : "bg-indigo-500/10 text-indigo-600"
                                            }`}>
                                                <Flag className="h-5 w-5" />
                                            </div>
                                            <div className="flex flex-col text-left min-w-0">
                                                <span className="text-xs font-black uppercase leading-tight" style={{ fontFamily: "var(--font-chat-heading)" }}>Finish the session</span>
                                                <span className="text-[9px] opacity-40 mt-1 leading-normal" style={{ fontFamily: "var(--font-chat-body)" }}>You can't make changes after finishing.</span>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => router.push("/chat")} 
                                            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shrink-0 shadow-lg shadow-indigo-600/20 hover:scale-102"
                                            style={{ fontFamily: "var(--font-chat-accent)" }}
                                        >
                                            <Flag className="h-3.5 w-3.5" />
                                            Finish Session
                                        </button>
                                    </div>
                                </div>

                                {/* Right Column: Detailed Standings */}
                                <div className="lg:col-span-7 h-full">
                                    <div className={`p-6 sm:p-8 rounded-[2rem] border h-full flex flex-col relative overflow-hidden min-h-[400px] ${
                                        isDarkMode ? "bg-[#161615] border-white/5" : "bg-[#fbfaf8] border-black/5 shadow-md"
                                    }`}>
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-sm font-black uppercase tracking-wider" style={{ fontFamily: "var(--font-chat-heading)" }}>Detailed Standings</h3>
                                            <div className="flex items-center gap-1.5 opacity-60">
                                                <Users className="h-4 w-4" />
                                                <span className="text-[10px] font-black uppercase tracking-wider" style={{ fontFamily: "var(--font-chat-accent)" }}>
                                                    {leaderboard.length} {leaderboard.length === 1 ? "PLAYER" : "PLAYERS"}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="relative flex items-center my-4">
                                            <div className={`flex-1 border-t ${isDarkMode ? "border-white/5" : "border-black/5"}`} />
                                            <div className={`mx-4 px-2.5 py-1 rounded-full border text-[10px] ${
                                                isDarkMode ? "bg-orange-500/10 border-orange-500/20 text-orange-400" : "bg-orange-500/5 border-orange-500/20 text-orange-500"
                                            }`}>
                                                <Trophy className="h-3.5 w-3.5" />
                                            </div>
                                            <div className={`flex-1 border-t ${isDarkMode ? "border-white/5" : "border-black/5"}`} />
                                        </div>

                                        <div className="space-y-2.5 overflow-y-auto scrollbar-hide flex-1 max-h-[350px] pr-1 relative z-10">
                                            {leaderboard.map((p, i) => (
                                                <div 
                                                    key={p.id} 
                                                    className={`flex items-center justify-between p-4 border rounded-2xl transition-all ${
                                                        (p.id === socketRef.current?.id || p.name === userName)
                                                            ? (isDarkMode ? "bg-orange-500/10 border-orange-500/20" : "bg-orange-500/[0.03] border-orange-500/20") 
                                                            : (isDarkMode ? "bg-white/[0.02] border-white/5" : "bg-black/[0.01] border-black/5")
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        {i < 3 ? (
                                                            <div className="relative h-9 w-9 flex items-center justify-center shrink-0 mr-1.5">
                                                                <img 
                                                                    src={i === 0 ? "/1 medal.svg" : i === 1 ? "/2medal.svg" : "/3medal.svg"} 
                                                                    alt={`Rank ${i + 1}`} 
                                                                    className="h-full w-full object-contain select-none pointer-events-none" 
                                                                />
                                                            </div>
                                                        ) : (
                                                            <div className="relative h-9 w-9 flex items-center justify-center shrink-0 mr-1.5">
                                                                <img 
                                                                    src="/badge.svg" 
                                                                    alt={`Rank ${i + 1}`} 
                                                                    className="h-full w-full object-contain select-none pointer-events-none" 
                                                                />
                                                                <span className="absolute text-[9px] font-black text-white" style={{ fontFamily: "var(--font-chat-accent)" }}>
                                                                    {i + 1}
                                                                </span>
                                                            </div>
                                                        )}

                                                        <span className="text-sm font-bold" style={{ fontFamily: "var(--font-chat-heading)" }}>
                                                            {p.name} {(p.id === socketRef.current?.id || p.name === userName) && "(You)"}
                                                        </span>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="block text-sm font-black" style={{ fontFamily: "var(--font-chat-heading)" }}>{p.score * 100}</span>
                                                        <span className="text-[9px] font-mono opacity-40 uppercase block mt-0.5">{p.timeTaken}s</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Decorative grid pattern in bottom right corner */}
                                        <div className="absolute bottom-4 right-4 opacity-[0.05] pointer-events-none">
                                            <svg width="60" height="60" viewBox="0 0 60 60" fill="currentColor">
                                                <circle cx="5" cy="5" r="1.5" />
                                                <circle cx="20" cy="5" r="1.5" />
                                                <circle cx="35" cy="5" r="1.5" />
                                                <circle cx="50" cy="5" r="1.5" />
                                                <circle cx="5" cy="20" r="1.5" />
                                                <circle cx="20" cy="20" r="1.5" />
                                                <circle cx="35" cy="20" r="1.5" />
                                                <circle cx="50" cy="20" r="1.5" />
                                                <circle cx="5" cy="35" r="1.5" />
                                                <circle cx="20" cy="35" r="1.5" />
                                                <circle cx="35" cy="35" r="1.5" />
                                                <circle cx="50" cy="35" r="1.5" />
                                                <circle cx="5" cy="50" r="1.5" />
                                                <circle cx="20" cy="50" r="1.5" />
                                                <circle cx="35" cy="50" r="1.5" />
                                                <circle cx="50" cy="50" r="1.5" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Section 2: Bottom Stats Card */}
                            <div className={`w-full grid grid-cols-2 md:grid-cols-7 gap-4 p-5 rounded-3xl border transition-all ${
                                isDarkMode ? "bg-[#161615] border-white/5" : "bg-[#fbfaf8] border-black/5 shadow-md"
                            }`}>
                                <div className="flex items-center gap-3 pl-2 md:col-span-1">
                                    <div className="h-9 w-9 bg-orange-500/10 rounded-full flex items-center justify-center text-orange-500 shrink-0">
                                        <Star className="h-4.5 w-4.5" />
                                    </div>
                                    <div className="flex flex-col text-left">
                                        <span className="text-[8px] font-bold uppercase tracking-wider opacity-40" style={{ fontFamily: "var(--font-chat-accent)" }}>Your Rank</span>
                                        <span className="text-sm font-black" style={{ fontFamily: "var(--font-chat-heading)" }}>
                                            #{myRank}
                                        </span>
                                    </div>
                                </div>

                                <div className="hidden md:block border-r border-inherit h-6 my-auto opacity-10 md:col-span-1 justify-self-center" />

                                <div className="flex items-center gap-3 pl-2 md:col-span-1">
                                    <div className="h-9 w-9 bg-blue-500/10 rounded-full flex items-center justify-center text-blue-500 shrink-0">
                                        <Target className="h-4.5 w-4.5" />
                                    </div>
                                    <div className="flex flex-col text-left">
                                        <span className="text-[8px] font-bold uppercase tracking-wider opacity-40" style={{ fontFamily: "var(--font-chat-accent)" }}>Your Score</span>
                                        <span className="text-sm font-black" style={{ fontFamily: "var(--font-chat-heading)" }}>
                                            {myScore * 100} PTS
                                        </span>
                                    </div>
                                </div>

                                <div className="hidden md:block border-r border-inherit h-6 my-auto opacity-10 md:col-span-1 justify-self-center" />

                                <div className="flex items-center gap-3 pl-2 md:col-span-1">
                                    <div className="h-9 w-9 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500 shrink-0">
                                        <Clock className="h-4.5 w-4.5" />
                                    </div>
                                    <div className="flex flex-col text-left">
                                        <span className="text-[8px] font-bold uppercase tracking-wider opacity-40" style={{ fontFamily: "var(--font-chat-accent)" }}>Time Taken</span>
                                        <span className="text-sm font-black" style={{ fontFamily: "var(--font-chat-heading)" }}>
                                            {myTimeTaken}s
                                        </span>
                                    </div>
                                </div>

                                <div className="hidden md:block border-r border-inherit h-6 my-auto opacity-10 md:col-span-1 justify-self-center" />

                                <div className="flex items-center gap-3 pl-2 md:col-span-1">
                                    <div className="h-9 w-9 bg-purple-500/10 rounded-full flex items-center justify-center text-purple-500 shrink-0">
                                        <BarChart3 className="h-4.5 w-4.5" />
                                    </div>
                                    <div className="flex flex-col text-left">
                                        <span className="text-[8px] font-bold uppercase tracking-wider opacity-40" style={{ fontFamily: "var(--font-chat-accent)" }}>Accuracy</span>
                                        <span className="text-sm font-black" style={{ fontFamily: "var(--font-chat-heading)" }}>
                                            {myAccuracy}%
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Section 3: Divider Line */}
                            <div className={`w-full border-t ${isDarkMode ? "border-white/5" : "border-black/5"}`} />

                            {/* Section 4: Battle Analysis Chart */}
                            <div className={`w-full p-6 sm:p-8 rounded-[2rem] border transition-all ${
                                isDarkMode ? "bg-[#161615] border-white text-white" : "bg-[#fbfaf8] border-black text-black shadow-md"
                            }`}>
                                <div className="flex items-center gap-2 mb-6">
                                    <BarChart3 className="h-5 w-5 opacity-60" />
                                    <h3 className="text-base font-black uppercase tracking-tight">Battle Analysis</h3>
                                </div>
                                <div className="h-80 w-full min-h-[300px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor={isDarkMode ? "#ffffff" : "#000000"} stopOpacity={0.15}/>
                                                    <stop offset="95%" stopColor={isDarkMode ? "#ffffff" : "#000000"} stopOpacity={0}/>
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"} />
                                            <XAxis 
                                                dataKey="name" 
                                                tick={{ fill: isDarkMode ? "#ffffff60" : "#00000060", fontSize: 10 }} 
                                                axisLine={false}
                                                tickLine={false}
                                            />
                                            <YAxis 
                                                tick={{ fill: isDarkMode ? "#ffffff60" : "#00000060", fontSize: 10 }} 
                                                axisLine={false}
                                                tickLine={false}
                                            />
                                            <Tooltip 
                                                contentStyle={{ 
                                                    backgroundColor: isDarkMode ? "#161615" : "#ffffff", 
                                                    border: isDarkMode ? "1px solid rgba(255, 255, 255, 0.1)" : "1px solid rgba(0, 0, 0, 0.1)", 
                                                    borderRadius: "12px",
                                                    fontSize: "12px",
                                                    color: isDarkMode ? "#ffffff" : "#000000"
                                                }} 
                                                itemStyle={{ color: isDarkMode ? "#ffffff" : "#000000" }}
                                                labelClassName="font-bold font-mono"
                                            />
                                            <Area 
                                                type="monotone" 
                                                dataKey="Score" 
                                                stroke={isDarkMode ? "#ffffff" : "#000000"} 
                                                strokeWidth={2.5} 
                                                fillOpacity={1} 
                                                fill="url(#chartGradient)" 
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Section 5: Divider Line */}
                            <div className={`w-full border-t ${isDarkMode ? "border-white/5" : "border-black/5"}`} />

                            {/* Section 6: Review Questions */}
                            <div className="w-full space-y-6">
                                <div className="flex items-center gap-2">
                                    <Star className="h-5 w-5 opacity-60" />
                                    <h3 className="text-base font-black uppercase tracking-tight">Review Questions</h3>
                                </div>
                                <div className="space-y-6">
                                    {questions.map((q, i) => (
                                        <div 
                                            key={i} 
                                            className={`pb-6 border-b last:border-b-0 ${
                                                isDarkMode ? "border-white/5" : "border-black/5"
                                            }`}
                                        >
                                            <div className="flex items-start gap-4">
                                                <div className={`h-8 w-8 rounded-full flex items-center justify-center border text-xs font-mono shrink-0 mt-0.5 ${
                                                    answers[i] === q.correctOptionIndex 
                                                        ? "border-emerald-500 bg-emerald-500/10 text-emerald-500" 
                                                        : "border-red-500 bg-red-500/10 text-red-500"
                                                }`}>
                                                    {answers[i] === q.correctOptionIndex ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold text-sm leading-normal mb-4">Q{i+1}. {q.question}</p>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                                                        {q.options.map((opt, oi) => (
                                                            <div 
                                                                key={oi} 
                                                                className={`p-3.5 rounded-xl text-xs border leading-normal ${
                                                                    oi === q.correctOptionIndex 
                                                                        ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-500 font-semibold" 
                                                                        : (oi === answers[i] ? "border-red-500/50 bg-red-500/10 text-red-500 font-semibold" : "opacity-35")
                                                                }`}
                                                            >
                                                                {String.fromCharCode(65+oi)}. {opt}
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <div className={`p-4 rounded-xl text-xs italic leading-normal ${
                                                        isDarkMode ? "bg-white/5 opacity-70" : "bg-black/5 opacity-70"
                                                    }`}>
                                                        {q.explanation}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </div>

            {showQuitConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md bg-black/60 p-6" onClick={() => setShowQuitConfirm(false)}>
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} onClick={e => e.stopPropagation()} className={`p-10 rounded-[2.5rem] border max-w-sm w-full text-center ${isDarkMode ? "bg-[#0d0d0c] border-white/10" : "bg-[#fbfaf8] border-black/10 shadow-2xl"}`}>
                        <div className="h-14 w-14 bg-red-500/20 border border-red-500/30 rounded-full flex items-center justify-center mx-auto mb-6"><AlertTriangle className="h-8 w-8 text-red-500" /></div>
                        <h3 className="text-xl font-black uppercase mb-2">Quit Battle?</h3>
                        <p className="text-sm opacity-50 mb-8">You will lose all current progress and forfeit the match.</p>
                        <div className="flex gap-4">
                            <button onClick={() => setShowQuitConfirm(false)} className={`flex-1 py-4 border rounded-2xl text-[10px] font-black uppercase transition-all hover:scale-[1.02] ${isDarkMode ? "border-white/10 text-white/60 hover:bg-white/5 hover:text-white" : "border-black/10 text-black/60 hover:bg-black/5 hover:text-black"}`}>Cancel</button>
                            <button onClick={handleLeave} className="flex-1 py-4 bg-red-500 text-white rounded-2xl text-[10px] font-black uppercase transition-all hover:bg-red-600 hover:scale-[1.02] shadow-lg shadow-red-500/20">Quit</button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}

function TrophySparklesEffect() {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let animationFrameId: number;
        let width = canvas.width = canvas.parentElement?.offsetWidth || 300;
        let height = canvas.height = canvas.parentElement?.offsetHeight || 300;

        const resizeObserver = new ResizeObserver((entries) => {
            for (let entry of entries) {
                width = canvas.width = entry.contentRect.width;
                height = canvas.height = entry.contentRect.height;
            }
        });
        if (canvas.parentElement) {
            resizeObserver.observe(canvas.parentElement);
        }

        const colors = ["#ffffff", "#ffca3a", "#ff9f1c", "#fbbf24", "#f59e0b", "#f97316"];
        
        type Sparkle = {
            x: number;
            y: number;
            size: number;
            scale: number;
            opacity: number;
            dx: number;
            dy: number;
            color: string;
            life: number;
            maxLife: number;
            pulseSpeed: number;
            pulseTime: number;
        };

        const sparkles: Sparkle[] = [];
        const maxSparkles = 25;

        const createSparkle = (initY = false): Sparkle => {
            const size = Math.random() * 8 + 4;
            const maxLife = Math.random() * 100 + 100;
            return {
                x: Math.random() * width,
                y: initY ? Math.random() * height : -20,
                size,
                scale: 0,
                opacity: 0,
                dx: Math.random() * 0.8 - 0.4,
                dy: Math.random() * 0.8 + 0.4,
                color: colors[Math.floor(Math.random() * colors.length)],
                life: 0,
                maxLife,
                pulseSpeed: Math.random() * 0.1 + 0.05,
                pulseTime: Math.random() * Math.PI
            };
        };

        for (let i = 0; i < maxSparkles; i++) {
            sparkles.push(createSparkle(true));
        }

        const drawStar = (c: CanvasRenderingContext2D, cx: number, cy: number, spikes: number, outer: number, inner: number, color: string, alpha: number) => {
            let rot = Math.PI / 2 * 3;
            let x = cx;
            let y = cy;
            let step = Math.PI / spikes;

            c.save();
            c.globalAlpha = alpha;
            c.beginPath();
            c.moveTo(cx, cy - outer);
            for (let i = 0; i < spikes; i++) {
                x = cx + Math.cos(rot) * outer;
                y = cy + Math.sin(rot) * outer;
                c.lineTo(x, y);
                rot += step;

                x = cx + Math.cos(rot) * inner;
                y = cy + Math.sin(rot) * inner;
                c.lineTo(x, y);
                rot += step;
            }
            c.lineTo(cx, cy - outer);
            c.closePath();
            c.fillStyle = color;
            c.shadowBlur = outer * 1.5;
            c.shadowColor = color;
            c.fill();
            c.restore();
        };

        const animate = () => {
            ctx.clearRect(0, 0, width, height);

            for (let i = 0; i < sparkles.length; i++) {
                const s = sparkles[i];
                s.life++;
                s.y += s.dy;
                s.x += s.dx;
                s.pulseTime += s.pulseSpeed;

                const lifeProgress = s.life / s.maxLife;
                if (lifeProgress < 0.2) {
                    s.opacity = lifeProgress * 5;
                } else if (lifeProgress > 0.8) {
                    s.opacity = (1 - lifeProgress) * 5;
                } else {
                    s.opacity = 1;
                }
                s.opacity = Math.max(0, Math.min(1, s.opacity));
                s.scale = (Math.sin(s.pulseTime) * 0.3 + 0.7);

                drawStar(ctx, s.x, s.y, 4, s.size * s.scale, s.size * s.scale * 0.3, s.color, s.opacity);

                if (s.y > height + 20 || s.x < -20 || s.x > width + 20 || s.life >= s.maxLife) {
                    sparkles[i] = createSparkle(false);
                }
            }

            animationFrameId = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            cancelAnimationFrame(animationFrameId);
            resizeObserver.disconnect();
        };
    }, []);

    return (
        <canvas 
            ref={canvasRef} 
            className="absolute inset-0 pointer-events-none z-0 w-full h-full rounded-[2rem]" 
        />
    );
}

function PartyPopperEffect() {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let animationFrameId: number;
        let width = canvas.width = window.innerWidth;
        let height = canvas.height = window.innerHeight;

        const handleResize = () => {
            if (canvas) {
                width = canvas.width = window.innerWidth;
                height = canvas.height = window.innerHeight;
            }
        };
        window.addEventListener("resize", handleResize);

        const colors = ["#ff595e", "#ffca3a", "#8ac926", "#1982c4", "#6a4c93", "#ff9f1c", "#00f5d4"];
        type Particle = {
            x: number;
            y: number;
            r: number;
            color: string;
            dx: number;
            dy: number;
            tilt: number;
            tiltAngle: number;
            tiltAngleSpeed: number;
        };

        const particles: Particle[] = [];
        for (let i = 0; i < 150; i++) {
            particles.push({
                x: Math.random() * width,
                y: Math.random() * -height - 20,
                r: Math.random() * 5 + 3,
                color: colors[Math.floor(Math.random() * colors.length)],
                dx: Math.random() * 2 - 1,
                dy: Math.random() * 4 + 2,
                tilt: Math.random() * 10 - 5,
                tiltAngle: Math.random() * Math.PI,
                tiltAngleSpeed: Math.random() * 0.05 + 0.02
            });
        }

        const draw = () => {
            ctx.clearRect(0, 0, width, height);

            particles.forEach((p) => {
                p.y += p.dy;
                p.x += p.dx;
                p.tiltAngle += p.tiltAngleSpeed;
                p.tilt = Math.sin(p.tiltAngle) * 12;

                ctx.beginPath();
                ctx.lineWidth = p.r * 2;
                ctx.strokeStyle = p.color;
                ctx.moveTo(p.x + p.tilt + p.r / 2, p.y);
                ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 2);
                ctx.stroke();
            });

            const activeParticles = particles.filter(p => p.y < height);
            if (activeParticles.length > 0) {
                animationFrameId = requestAnimationFrame(draw);
            }
        };

        draw();

        return () => {
            window.removeEventListener("resize", handleResize);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <canvas 
            ref={canvasRef} 
            className="fixed inset-0 pointer-events-none z-50 w-full h-full"
        />
    );
}

function LoadingFallback() {
    const { isDarkMode } = useTheme();
    return (
        <div className={`min-h-screen w-full ${isDarkMode ? "bg-[#0a0a0a] text-white" : "bg-[#ebeae7] text-black"} flex items-center justify-center`}>
            <div className="text-center">
                <div className="relative flex items-center justify-center mx-auto mb-4" style={{ width: 48, height: 48 }}>
                    <motion.div className="absolute" animate={{ rotate: [0, -25, 0], x: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 0.5, ease: "easeInOut" }}>
                        <Swords className={`h-8 w-8 ${isDarkMode ? "text-white/80" : "text-black/80"}`} style={{ transform: 'scaleX(-1)' }} />
                    </motion.div>
                    <motion.div className="absolute" animate={{ rotate: [0, 25, 0], x: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 0.5, ease: "easeInOut" }}>
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
