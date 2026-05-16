"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Swords, Key, User, BookOpen, ListOrdered, Signal, Trophy, TrendingUp, History } from "lucide-react";
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
}

export interface JoinConfig {
    lobbyCode: string;
    participantName: string;
}

const difficulties = ["easy", "medium", "hard"];

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

    useEffect(() => {
        if (isOpen) playSwordSound();
    }, [isOpen]);

    const [hostConfig, setHostConfig] = useState<HostConfig>({
        adminName: "",
        topic: "",
        difficulty: "medium",
        questionCount: 5,
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
                    className={`absolute inset-0 backdrop-blur-sm ${isDarkMode ? "bg-black/80" : "bg-white/80"}`}
                />

                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className={`relative w-full max-w-xl border ${isDarkMode ? "bg-[#0d0d0d] border-white/10" : "bg-white border-black/10"} p-10 rounded-[2.5rem] shadow-2xl overflow-y-auto scrollbar-hide max-h-[85vh]`}
                >
                    <div className={`absolute top-0 right-0 w-32 h-32 blur-[60px] rounded-full ${isDarkMode ? "bg-white/5" : "bg-black/5"}`} />
                    <div className={`absolute bottom-0 left-0 w-32 h-32 blur-[60px] rounded-full ${isDarkMode ? "bg-white/5" : "bg-black/5"}`} />

                    <div className="relative z-10">
                        <div className="flex justify-between items-center mb-10">
                            <div className="flex items-center gap-4">
                                <div className={`h-12 w-12 ${isDarkMode ? "bg-white text-black" : "bg-black text-white"} rounded-2xl flex items-center justify-center`}>
                                    <Swords className="h-6 w-6" />
                                </div>
                                <div className="flex flex-col text-left">
                                    <h2 className={`text-2xl font-display font-black tracking-tight ${isDarkMode ? "text-white" : "text-black"} uppercase`}>Battle Arena</h2>
                                    <p className={`text-[10px] font-mono ${isDarkMode ? "text-white/40" : "text-black/40"} uppercase tracking-[0.2em]`}>Real-time multiplayer quiz battle</p>
                                </div>
                            </div>
                            <button onClick={onClose} className={`p-2 rounded-full transition-colors ${isDarkMode ? "hover:bg-white/10 text-white/40 hover:text-white" : "hover:bg-black/10 text-black/40 hover:text-black"}`}>
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Quick Navigation */}
                        <div className="flex gap-2 mb-6">
                            <Link
                                href="/arena-history"
                                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[8px] font-mono uppercase tracking-wider transition-all ${
                                    isDarkMode ? "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white" : "bg-black/5 text-black/50 hover:bg-black/10 hover:text-black"
                                }`}
                            >
                                <History className="h-3 w-3" />
                                History
                            </Link>
                            <Link
                                href="/global-leaderboard"
                                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[8px] font-mono uppercase tracking-wider transition-all ${
                                    isDarkMode ? "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white" : "bg-black/5 text-black/50 hover:bg-black/10 hover:text-black"
                                }`}
                            >
                                <Trophy className="h-3 w-3" />
                                Leaderboard
                            </Link>
                            <Link
                                href="/user-analytics"
                                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[8px] font-mono uppercase tracking-wider transition-all ${
                                    isDarkMode ? "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white" : "bg-black/5 text-black/50 hover:bg-black/10 hover:text-black"
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
                                className={`flex-1 py-3 text-[9px] font-mono uppercase tracking-[0.2em] transition-all ${
                                    tab === "host"
                                        ? (isDarkMode ? "bg-white text-black font-bold" : "bg-black text-white font-bold")
                                        : (isDarkMode ? "text-white/40 hover:text-white" : "text-black/40 hover:text-black")
                                }`}
                            >
                                <Swords className="h-3 w-3 inline mr-1.5 -mt-0.5" />
                                Host Battle
                            </button>
                            <button
                                onClick={() => setTab("join")}
                                className={`flex-1 py-3 text-[9px] font-mono uppercase tracking-[0.2em] transition-all ${
                                    tab === "join"
                                        ? (isDarkMode ? "bg-white text-black font-bold" : "bg-black text-white font-bold")
                                        : (isDarkMode ? "text-white/40 hover:text-white" : "text-black/40 hover:text-black")
                                }`}
                            >
                                <Key className="h-3 w-3 inline mr-1.5 -mt-0.5" />
                                Join Battle
                            </button>
                        </div>

                        {tab === "host" && (
                            <div className="space-y-8">
                                <div className="space-y-4">
                                    <div className={`flex items-center gap-3 ${isDarkMode ? "text-white/40" : "text-black"}`}>
                                        <User className="h-3 w-3" />
                                        <span className="text-[10px] font-mono uppercase tracking-[0.2em]">Admin Name</span>
                                    </div>
                                    <input
                                        type="text"
                                        value={hostConfig.adminName}
                                        onChange={(e) => setHostConfig({ ...hostConfig, adminName: e.target.value })}
                                        placeholder="Enter your name..."
                                        className={`w-full p-4 text-xs font-mono ${isDarkMode ? "bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-white/50" : "bg-black/5 border-black text-black placeholder:text-black/60 focus:border-black"} border rounded-2xl focus:outline-none transition-all`}
                                    />
                                </div>

                                <div className="space-y-4">
                                    <div className={`flex items-center gap-3 ${isDarkMode ? "text-white/40" : "text-black"}`}>
                                        <BookOpen className="h-3 w-3" />
                                        <span className="text-[10px] font-mono uppercase tracking-[0.2em]">Topic</span>
                                    </div>
                                    <input
                                        type="text"
                                        value={hostConfig.topic}
                                        onChange={(e) => setHostConfig({ ...hostConfig, topic: e.target.value })}
                                        placeholder="e.g. JavaScript, Science, History..."
                                        className={`w-full p-4 text-xs font-mono ${isDarkMode ? "bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-white/50" : "bg-black/5 border-black text-black placeholder:text-black/60 focus:border-black"} border rounded-2xl focus:outline-none transition-all`}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-4">
                                        <div className={`flex items-center gap-3 ${isDarkMode ? "text-white/40" : "text-black"}`}>
                                            <Signal className="h-3 w-3" />
                                            <span className="text-[10px] font-mono uppercase tracking-[0.2em]">Difficulty</span>
                                        </div>
                                        <select
                                            value={hostConfig.difficulty}
                                            onChange={(e) => setHostConfig({ ...hostConfig, difficulty: e.target.value })}
                                            className={`w-full p-4 text-xs font-mono ${isDarkMode ? "bg-white/5 border-white/10 text-white" : "bg-black/5 border-black text-black"} border rounded-2xl focus:outline-none`}
                                        >
                                            {difficulties.map(d => (
                                                <option key={d} value={d} className={isDarkMode ? "bg-[#0d0d0d]" : "bg-white"}>
                                                    {d.charAt(0).toUpperCase() + d.slice(1)}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-4">
                                        <div className={`flex items-center gap-3 ${isDarkMode ? "text-white/40" : "text-black"}`}>
                                            <ListOrdered className="h-3 w-3" />
                                            <span className="text-[10px] font-mono uppercase tracking-[0.2em]">Questions</span>
                                        </div>
                                        <input
                                            type="number"
                                            min={3}
                                            max={20}
                                            value={hostConfig.questionCount}
                                            onChange={(e) => {
                                                setHostConfig({ ...hostConfig, questionCount: parseInt(e.target.value) || 5 });
                                                playSwordSound();
                                            }}
                                            className={`w-full p-4 text-xs font-mono ${isDarkMode ? "bg-white/5 border-white/10 text-white" : "bg-black/5 border-black text-black"} border rounded-2xl focus:outline-none`}
                                        />
                                    </div>
                                </div>

                                <button
                                    onClick={() => {
                                        if (hostConfig.adminName.trim() && hostConfig.topic.trim()) {
                                            playSwordSound();
                                            onHost(hostConfig);
                                        }
                                    }}
                                    disabled={!hostConfig.adminName.trim() || !hostConfig.topic.trim()}
                                    className={`w-full py-5 ${isDarkMode ? "bg-white text-black shadow-xl shadow-white/10" : "bg-black text-white shadow-xl shadow-black/10"} text-[10px] font-mono font-black uppercase tracking-[0.3em] rounded-[2rem] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-30`}
                                >
                                    <Swords className="h-4 w-4 inline mr-2 -mt-0.5" />
                                    Host Arena
                                </button>
                            </div>
                        )}

                        {tab === "join" && (
                            <div className="space-y-8">
                                <div className="space-y-4">
                                    <div className={`flex items-center gap-3 ${isDarkMode ? "text-white/40" : "text-black"}`}>
                                        <Key className="h-3 w-3" />
                                        <span className="text-[10px] font-mono uppercase tracking-[0.2em]">Invite Code</span>
                                    </div>
                                    <input
                                        type="text"
                                        value={joinConfig.lobbyCode}
                                        onChange={(e) => setJoinConfig({ ...joinConfig, lobbyCode: e.target.value.toUpperCase() })}
                                        placeholder="e.g. ABC123"
                                        maxLength={6}
                                        className={`w-full p-4 text-xs font-mono tracking-widest uppercase ${isDarkMode ? "bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-white/50" : "bg-black/5 border-black text-black placeholder:text-black/60 focus:border-black"} border rounded-2xl focus:outline-none transition-all`}
                                    />
                                </div>

                                <div className="space-y-4">
                                    <div className={`flex items-center gap-3 ${isDarkMode ? "text-white/40" : "text-black"}`}>
                                        <User className="h-3 w-3" />
                                        <span className="text-[10px] font-mono uppercase tracking-[0.2em]">Your Name</span>
                                    </div>
                                    <input
                                        type="text"
                                        value={joinConfig.participantName}
                                        onChange={(e) => setJoinConfig({ ...joinConfig, participantName: e.target.value })}
                                        placeholder="Enter your display name..."
                                        className={`w-full p-4 text-xs font-mono ${isDarkMode ? "bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-white/50" : "bg-black/5 border-black text-black placeholder:text-black/60 focus:border-black"} border rounded-2xl focus:outline-none transition-all`}
                                    />
                                </div>

                                <button
                                    onClick={() => {
                                        if (joinConfig.lobbyCode.trim() && joinConfig.participantName.trim()) {
                                            playSwordSound();
                                            onJoin(joinConfig);
                                        }
                                    }}
                                    disabled={!joinConfig.lobbyCode.trim() || !joinConfig.participantName.trim()}
                                    className={`w-full py-5 ${isDarkMode ? "bg-white text-black shadow-xl shadow-white/10" : "bg-black text-white shadow-xl shadow-black/10"} text-[10px] font-mono font-black uppercase tracking-[0.3em] rounded-[2rem] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-30`}
                                >
                                    <Key className="h-4 w-4 inline mr-2 -mt-0.5" />
                                    Join Arena
                                </button>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default BattleArenaModal;
