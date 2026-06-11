"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Swords, Key, User, BookOpen, ListOrdered, Signal, Clock, Trophy, TrendingUp, History, Compass, Plus, Minus } from "lucide-react";
import Link from "next/link";

interface BattleArenaModalProps {
    isOpen: boolean;
    onClose: () => void;
    onHost: (config: HostConfig) => void;
    onJoin: (config: JoinConfig) => void;
    isDarkMode: boolean;
}

export interface HostConfig {
    adminName: string;
    topic: string;
    difficulty: string;
    questionCount: number;
    timePerQuestion: number;
    gameMode: "casual" | "ranked" | "hardcore";
}

export interface JoinConfig {
    lobbyCode: string;
    participantName: string;
}

const playSwordSound = () => {
    try {
        const audio = new Audio("/sword_sound.mp3");
        audio.volume = 0.5;
        audio.play();
    } catch (e) {
        console.warn("Sword sound play failed:", e);
    }
};

const BattleArenaModal: React.FC<BattleArenaModalProps> = ({ isOpen, onClose, onHost, onJoin, isDarkMode }) => {
    const [tab, setTab] = useState<"host" | "join">("host");
    const [accent, setAccent] = useState<string>("");
    
    // Focus States
    const [adminNameFocused, setAdminNameFocused] = useState(false);
    const [topicFocused, setTopicFocused] = useState(false);
    const [lobbyFocused, setLobbyFocused] = useState(false);
    const [participantFocused, setParticipantFocused] = useState(false);

    useEffect(() => {
        if (isOpen) {
            playSwordSound();
            if (typeof window !== "undefined") {
                setAccent(localStorage.getItem("rudranex_accent") || "");
            }
        }
    }, [isOpen]);

    const [hostConfig, setHostConfig] = useState<HostConfig>({
        adminName: "",
        topic: "",
        difficulty: "medium",
        questionCount: 5,
        timePerQuestion: 30,
        gameMode: "casual"
    });
    const [joinConfig, setJoinConfig] = useState<JoinConfig>({
        lobbyCode: "",
        participantName: "",
    });

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
                                    <Swords className="h-6 w-6" />
                                </div>
                                <div className="flex flex-col text-left">
                                    <h2 className={`text-2xl font-sans font-black tracking-tight ${isDarkMode ? "text-white" : "text-black"} uppercase`}>Battle Arena</h2>
                                    <p className={`text-[9px] font-mono ${isDarkMode ? "text-white/40" : "text-black/40"} uppercase tracking-[0.2em] mt-1`}>Real-time multiplayer quiz battle</p>
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

                        {/* Quick Navigation */}
                        <div className="flex gap-2 mb-6">
                            <Link
                                href="/arena-history"
                                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[8px] font-mono uppercase tracking-wider transition-all ${
                                    isDarkMode 
                                        ? "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white" 
                                        : "bg-black/5 text-black/50 hover:bg-black/10 hover:text-black"
                                }`}
                            >
                                <History className="h-3 w-3" />
                                History
                            </Link>
                            <Link
                                href="/global-leaderboard"
                                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[8px] font-mono uppercase tracking-wider transition-all ${
                                    isDarkMode 
                                        ? "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white" 
                                        : "bg-black/5 text-black/50 hover:bg-black/10 hover:text-black"
                                }`}
                            >
                                <Trophy className="h-3 w-3" />
                                Leaderboard
                            </Link>
                            <Link
                                href="/user-analytics"
                                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[8px] font-mono uppercase tracking-wider transition-all ${
                                    isDarkMode 
                                        ? "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white" 
                                        : "bg-black/5 text-black/50 hover:bg-black/10 hover:text-black"
                                }`}
                            >
                                <TrendingUp className="h-3 w-3" />
                                My Stats
                            </Link>
                        </div>

                        {/* Tab Switcher */}
                        <div className={`flex mb-8 border-b ${isDarkMode ? "border-white/10" : "border-black/10"}`}>
                            <button
                                onClick={() => setTab("host")}
                                type="button"
                                className={`flex-1 py-3 text-[10px] font-mono uppercase tracking-[0.2em] transition-all relative font-bold cursor-pointer ${
                                    tab === "host"
                                        ? (isDarkMode ? "text-white" : "text-black")
                                        : (isDarkMode ? "text-white/40 hover:text-white" : "text-black/40 hover:text-black")
                                }`}
                            >
                                <Swords className="h-3.5 w-3.5 inline mr-1.5 -mt-0.5" />
                                Host Battle
                                {tab === "host" && (
                                    <motion.div
                                        layoutId="activeTabUnderline"
                                        className="absolute bottom-0 left-0 right-0 h-0.5"
                                        style={{ backgroundColor: accent || (isDarkMode ? "#fff" : "#000") }}
                                    />
                                )}
                            </button>
                            <button
                                onClick={() => setTab("join")}
                                type="button"
                                className={`flex-1 py-3 text-[10px] font-mono uppercase tracking-[0.2em] transition-all relative font-bold cursor-pointer ${
                                    tab === "join"
                                        ? (isDarkMode ? "text-white" : "text-black")
                                        : (isDarkMode ? "text-white/40 hover:text-white" : "text-black/40 hover:text-black")
                                }`}
                            >
                                <Key className="h-3.5 w-3.5 inline mr-1.5 -mt-0.5" />
                                Join Battle
                                {tab === "join" && (
                                    <motion.div
                                        layoutId="activeTabUnderline"
                                        className="absolute bottom-0 left-0 right-0 h-0.5"
                                        style={{ backgroundColor: accent || (isDarkMode ? "#fff" : "#000") }}
                                    />
                                )}
                            </button>
                        </div>

                        {tab === "host" && (
                            <div className="space-y-4 sm:space-y-5">
                                {/* Admin Name */}
                                <div className="space-y-3">
                                    <div className={`flex items-center gap-3 ${isDarkMode ? "text-white/40" : "text-black/40"} text-left`}>
                                        <User className="h-3 w-3" />
                                        <span className="text-[9px] font-mono uppercase tracking-[0.2em]">Admin Name</span>
                                    </div>
                                    <input
                                        type="text"
                                        value={hostConfig.adminName}
                                        onChange={(e) => setHostConfig({ ...hostConfig, adminName: e.target.value })}
                                        onFocus={() => setAdminNameFocused(true)}
                                        onBlur={() => setAdminNameFocused(false)}
                                        placeholder="Enter your name..."
                                        className={`w-full p-3.5 text-xs font-mono rounded-xl border transition-all duration-200 outline-none ${
                                            isDarkMode
                                                ? "bg-white/[0.03] border-white/10 text-white placeholder:text-white/20 focus:bg-white/[0.05]"
                                                : "bg-black/[0.03] border-black/10 text-black placeholder:text-black/40 focus:bg-black/[0.05]"
                                        }`}
                                        style={adminNameFocused && accent ? { borderColor: accent } : undefined}
                                    />
                                </div>

                                {/* Topic */}
                                <div className="space-y-3">
                                    <div className={`flex items-center gap-3 ${isDarkMode ? "text-white/40" : "text-black/40"} text-left`}>
                                        <BookOpen className="h-3 w-3" />
                                        <span className="text-[9px] font-mono uppercase tracking-[0.2em]">Topic</span>
                                    </div>
                                    <input
                                        type="text"
                                        value={hostConfig.topic}
                                        onChange={(e) => setHostConfig({ ...hostConfig, topic: e.target.value })}
                                        onFocus={() => setTopicFocused(true)}
                                        onBlur={() => setTopicFocused(false)}
                                        placeholder="e.g. JavaScript, Science, History..."
                                        className={`w-full p-3.5 text-xs font-mono rounded-xl border transition-all duration-200 outline-none ${
                                            isDarkMode
                                                ? "bg-white/[0.03] border-white/10 text-white placeholder:text-white/20 focus:bg-white/[0.05]"
                                                : "bg-black/[0.03] border-black/10 text-black placeholder:text-black/40 focus:bg-black/[0.05]"
                                        }`}
                                        style={topicFocused && accent ? { borderColor: accent } : undefined}
                                    />
                                </div>

                                {/* Difficulty */}
                                <div className="space-y-3">
                                    <div className={`flex items-center gap-3 ${isDarkMode ? "text-white/40" : "text-black/40"} text-left`}>
                                        <Signal className="h-3 w-3" />
                                        <span className="text-[9px] font-mono uppercase tracking-[0.2em]">Difficulty</span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2">
                                        {(["easy", "medium", "hard"] as const).map((level) => {
                                            const isSelected = hostConfig.difficulty === level;
                                            return (
                                                <button
                                                    key={level}
                                                    type="button"
                                                    onClick={() => setHostConfig({ ...hostConfig, difficulty: level })}
                                                    className={`py-3 text-[10px] font-mono uppercase tracking-widest border rounded-xl transition-all duration-200 cursor-pointer flex items-center justify-center font-bold ${
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
                                                    {level}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Game Mode */}
                                <div className="space-y-3">
                                    <div className={`flex items-center gap-3 ${isDarkMode ? "text-white/40" : "text-black/40"} text-left`}>
                                        <Trophy className="h-3 w-3" />
                                        <span className="text-[9px] font-mono uppercase tracking-[0.2em]">Game Mode</span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2">
                                        {(["casual", "ranked", "hardcore"] as const).map((mode) => {
                                            const isSelected = hostConfig.gameMode === mode;
                                            const ModeIcon = mode === "casual" ? Compass : mode === "ranked" ? Trophy : Swords;
                                            return (
                                                <button
                                                    key={mode}
                                                    type="button"
                                                    onClick={() => setHostConfig({ ...hostConfig, gameMode: mode })}
                                                    className={`py-3 text-[10px] font-mono uppercase tracking-wider border rounded-xl transition-all duration-200 cursor-pointer flex flex-col items-center justify-center gap-1.5 font-bold ${
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
                                                    <ModeIcon className="h-3.5 w-3.5" />
                                                    <span>{mode}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Question Count & Duration Incrementors */}
                                <div className="grid grid-cols-2 gap-6">
                                    {/* Questions Count */}
                                    <div className="space-y-3 text-left">
                                        <div className={`flex items-center gap-3 ${isDarkMode ? "text-white/40" : "text-black/40"}`}>
                                            <ListOrdered className="h-3 w-3" />
                                            <span className="text-[9px] font-mono uppercase tracking-[0.2em]">Questions</span>
                                        </div>
                                        <div className={`flex items-center justify-between border rounded-xl p-1.5 ${isDarkMode ? "bg-white/5 border-white/10" : "bg-black/5 border-black/10"}`}>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setHostConfig({ ...hostConfig, questionCount: Math.max(3, hostConfig.questionCount - 1) });
                                                    playSwordSound();
                                                }}
                                                className={`p-2 rounded-lg transition-all cursor-pointer ${isDarkMode ? "hover:bg-white/10 text-white/60 hover:text-white" : "hover:bg-black/10 text-black/60 hover:text-black"}`}
                                            >
                                                <Minus className="h-3.5 w-3.5" />
                                            </button>
                                            <span className="text-xs font-mono font-bold">{hostConfig.questionCount}</span>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setHostConfig({ ...hostConfig, questionCount: Math.min(20, hostConfig.questionCount + 1) });
                                                    playSwordSound();
                                                }}
                                                className={`p-2 rounded-lg transition-all cursor-pointer ${isDarkMode ? "hover:bg-white/10 text-white/60 hover:text-white" : "hover:bg-black/10 text-black/60 hover:text-black"}`}
                                            >
                                                <Plus className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Time Per Question */}
                                    <div className="space-y-3 text-left">
                                        <div className={`flex items-center gap-3 ${isDarkMode ? "text-white/40" : "text-black/40"}`}>
                                            <Clock className="h-3 w-3" />
                                            <span className="text-[9px] font-mono uppercase tracking-[0.2em]">Time/Q (sec)</span>
                                        </div>
                                        <div className={`flex items-center justify-between border rounded-xl p-1.5 ${isDarkMode ? "bg-white/5 border-white/10" : "bg-black/5 border-black/10"}`}>
                                            <button
                                                type="button"
                                                onClick={() => setHostConfig({ ...hostConfig, timePerQuestion: Math.max(10, hostConfig.timePerQuestion - 5) })}
                                                className={`p-2 rounded-lg transition-all cursor-pointer ${isDarkMode ? "hover:bg-white/10 text-white/60 hover:text-white" : "hover:bg-black/10 text-black/60 hover:text-black"}`}
                                            >
                                                <Minus className="h-3.5 w-3.5" />
                                            </button>
                                            <span className="text-xs font-mono font-bold">{hostConfig.timePerQuestion}s</span>
                                            <button
                                                type="button"
                                                onClick={() => setHostConfig({ ...hostConfig, timePerQuestion: Math.min(120, hostConfig.timePerQuestion + 5) })}
                                                className={`p-2 rounded-lg transition-all cursor-pointer ${isDarkMode ? "hover:bg-white/10 text-white/60 hover:text-white" : "hover:bg-black/10 text-black/60 hover:text-black"}`}
                                            >
                                                <Plus className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <motion.button
                                    onClick={() => {
                                        if (hostConfig.adminName.trim() && hostConfig.topic.trim()) {
                                            playSwordSound();
                                            onHost(hostConfig);
                                        }
                                    }}
                                    disabled={!hostConfig.adminName.trim() || !hostConfig.topic.trim()}
                                    whileHover={hostConfig.adminName.trim() && hostConfig.topic.trim() ? { scale: 1.02 } : {}}
                                    whileTap={hostConfig.adminName.trim() && hostConfig.topic.trim() ? { scale: 0.98 } : {}}
                                    className={`w-full py-4 text-[10px] font-mono font-bold uppercase tracking-[0.3em] rounded-xl shadow-xl transition-all duration-200 mt-5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                                        accent
                                            ? "hover:opacity-90"
                                            : (isDarkMode ? "bg-white text-black shadow-white/5" : "bg-black text-white shadow-black/5")
                                    }`}
                                    style={
                                        hostConfig.adminName.trim() && hostConfig.topic.trim() && accent
                                            ? { backgroundColor: accent, color: isDarkMode ? "#000" : "#fff" }
                                            : undefined
                                    }
                                >
                                    <Swords className="h-4 w-4 inline mr-2 -mt-0.5" />
                                    Host Arena
                                </motion.button>
                            </div>
                        )}

                        {tab === "join" && (
                            <div className="space-y-4 sm:space-y-5">
                                {/* Invite Code */}
                                <div className="space-y-3">
                                    <div className={`flex items-center gap-3 ${isDarkMode ? "text-white/40" : "text-black/40"} text-left`}>
                                        <Key className="h-3 w-3" />
                                        <span className="text-[9px] font-mono uppercase tracking-[0.2em]">Invite Code</span>
                                    </div>
                                    <input
                                        type="text"
                                        value={joinConfig.lobbyCode}
                                        onChange={(e) => setJoinConfig({ ...joinConfig, lobbyCode: e.target.value.toUpperCase() })}
                                        onFocus={() => setLobbyFocused(true)}
                                        onBlur={() => setLobbyFocused(false)}
                                        placeholder="e.g. ABC123"
                                        maxLength={6}
                                        className={`w-full p-4 text-center text-sm font-mono tracking-[0.3em] uppercase rounded-xl border transition-all duration-200 outline-none ${
                                            isDarkMode
                                                ? "bg-white/[0.03] border-white/10 text-white placeholder:text-white/20 focus:bg-white/[0.05]"
                                                : "bg-black/[0.03] border-black/10 text-black placeholder:text-black/40 focus:bg-black/[0.05]"
                                        }`}
                                        style={lobbyFocused && accent ? { borderColor: accent } : undefined}
                                    />
                                </div>

                                {/* Participant Name */}
                                <div className="space-y-3">
                                    <div className={`flex items-center gap-3 ${isDarkMode ? "text-white/40" : "text-black/40"} text-left`}>
                                        <User className="h-3 w-3" />
                                        <span className="text-[9px] font-mono uppercase tracking-[0.2em]">Your Name</span>
                                    </div>
                                    <input
                                        type="text"
                                        value={joinConfig.participantName}
                                        onChange={(e) => setJoinConfig({ ...joinConfig, participantName: e.target.value })}
                                        onFocus={() => setParticipantFocused(true)}
                                        onBlur={() => setParticipantFocused(false)}
                                        placeholder="Enter your display name..."
                                        className={`w-full p-3.5 text-xs font-mono rounded-xl border transition-all duration-200 outline-none ${
                                            isDarkMode
                                                ? "bg-white/[0.03] border-white/10 text-white placeholder:text-white/20 focus:bg-white/[0.05]"
                                                : "bg-black/[0.03] border-black/10 text-black placeholder:text-black/40 focus:bg-black/[0.05]"
                                        }`}
                                        style={participantFocused && accent ? { borderColor: accent } : undefined}
                                    />
                                </div>

                                <motion.button
                                    onClick={() => {
                                        if (joinConfig.lobbyCode.trim() && joinConfig.participantName.trim()) {
                                            playSwordSound();
                                            onJoin(joinConfig);
                                        }
                                    }}
                                    disabled={!joinConfig.lobbyCode.trim() || !joinConfig.participantName.trim()}
                                    whileHover={joinConfig.lobbyCode.trim() && joinConfig.participantName.trim() ? { scale: 1.02 } : {}}
                                    whileTap={joinConfig.lobbyCode.trim() && joinConfig.participantName.trim() ? { scale: 0.98 } : {}}
                                    className={`w-full py-4 text-[10px] font-mono font-bold uppercase tracking-[0.3em] rounded-xl shadow-xl transition-all duration-200 mt-5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                                        accent
                                            ? "hover:opacity-90"
                                            : (isDarkMode ? "bg-white text-black shadow-white/5" : "bg-black text-white shadow-black/5")
                                    }`}
                                    style={
                                        joinConfig.lobbyCode.trim() && joinConfig.participantName.trim() && accent
                                            ? { backgroundColor: accent, color: isDarkMode ? "#000" : "#fff" }
                                            : undefined
                                    }
                                >
                                    <Key className="h-4 w-4 inline mr-2 -mt-0.5" />
                                    Join Arena
                                </motion.button>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default BattleArenaModal;
