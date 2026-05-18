"use client";
import React, { useEffect, useState, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Swords, Trophy, Clock, Users, BookOpen, Signal, Hash, History, Crown, TrendingUp, ArrowLeft, ChevronLeft, ChevronRight, Moon, Sun, ChevronLeft as ChevronLeftIcon, ChevronRight as ChevronRightIcon } from "lucide-react";
import { getArenaHistory, type ArenaHistoryItem } from "@/lib/chat-api";
import { useTheme, ThemeProvider } from "@/lib/theme-context";

const ITEMS_PER_PAGE = 10;

const navItems = [
    { href: "/arena-history", label: "Arena History", icon: History },
    { href: "/global-leaderboard", label: "Leaderboard", icon: Crown },
    { href: "/user-analytics", label: "My Stats", icon: TrendingUp },
];

function PageContent() {
    const router = useRouter();
    const pathname = usePathname();
    const { isDarkMode, toggleTheme } = useTheme();
    const [collapsed, setCollapsed] = useState(false);
    const [history, setHistory] = useState<ArenaHistoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        (async () => {
            try {
                const res = await getArenaHistory();
                if (res.success) setHistory(res.history || []);
                else setError(res.error || "Failed to load");
            } catch (e: any) {
                setError(e.message);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const totalPages = Math.ceil(history.length / ITEMS_PER_PAGE);
    const paginated = history.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const bg = isDarkMode ? "bg-[#0a0a0a]" : "bg-white";
    const text = isDarkMode ? "text-white" : "text-black";
    const border = isDarkMode ? "border-2 border-white" : "border-2 border-[#00DDDD]";
    const borderLight = isDarkMode ? "border border-white" : "border border-black";
    const muted = isDarkMode ? "text-white/50" : "text-black/50";
    const cardBg = isDarkMode ? "bg-[#0d0d0d]" : "bg-gray-50";
    const hoverBg = isDarkMode ? "hover:bg-white/10" : "hover:bg-[#00DDDD]/10";
    const activeBg = isDarkMode ? "bg-white/20" : "bg-[#00DDDD]/20";
    const sidebarBg = isDarkMode ? "bg-[#0d0d0d] border-r-2 border-white" : "bg-gray-50 border-r-2 border-black";
    const rowBg = isDarkMode ? "bg-white/5" : "bg-black/5";

    return (
        <div className={`h-screen w-full ${bg} ${text} selection:bg-white selection:text-black font-sans flex overflow-hidden`}>
            {/* Left Sidebar */}
            <div className={`h-full flex flex-col ${sidebarBg} transition-all duration-300 ${collapsed ? "w-16" : "w-56"} flex-shrink-0`}>
                <Link href="/chat" className={`flex items-center gap-3 px-4 h-16 flex-shrink-0 ${collapsed ? "justify-center" : ""}`}>
                    <div className="h-[26px] w-[26px] flex items-center justify-center flex-shrink-0 overflow-hidden">
                        <img 
                            src={isDarkMode ? "/dark.png" : "/light.png"} 
                            alt="Logo" 
                            className="h-full w-full object-contain transition-transform duration-300"
                            style={{ transform: isDarkMode ? "scale(1.5)" : "none" }}
                        />
                    </div>
                    {!collapsed && (
                        <div className="h-3.5 flex items-center shrink-0 overflow-hidden ml-1">
                            <img 
                                src={isDarkMode ? "/dark_text.png" : "/light_text.png"} 
                                alt="Rudranex" 
                                className="h-full object-contain"
                            />
                        </div>
                    )}
                </Link>
                <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
                    <Link href="/chat" className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs transition-all ${hoverBg} ${collapsed ? "justify-center" : ""}`}>
                        <ArrowLeft className="h-4 w-4 flex-shrink-0" />
                        {!collapsed && <span>Back to Chat</span>}
                    </Link>
                    <div className={`my-3 border-t ${borderLight}`} />
                    {navItems.map((item, idx) => {
                        const active = pathname === item.href;
                        return (
                            <React.Fragment key={item.href}>
                                {idx > 0 && <div className={`mx-3 border-t ${borderLight}`} />}
                                <Link href={item.href} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs transition-all ${active ? activeBg + " font-bold" : hoverBg} ${collapsed ? "justify-center" : ""}`} title={collapsed ? item.label : undefined}>
                                    <item.icon className="h-4 w-4 flex-shrink-0" />
                                    {!collapsed && <span>{item.label}</span>}
                                </Link>
                            </React.Fragment>
                        );
                    })}
                </nav>
                <div className={`px-2 py-4 space-y-2 flex-shrink-0`}>
                    <button onClick={toggleTheme} className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-xs transition-all ${hoverBg} ${collapsed ? "justify-center" : ""}`} title="Toggle Theme">
                        {isDarkMode ? <Sun className="h-4 w-4 flex-shrink-0" /> : <Moon className="h-4 w-4 flex-shrink-0" />}
                        {!collapsed && <span>{isDarkMode ? "Light Mode" : "Dark Mode"}</span>}
                    </button>
                    <div className={`mx-3 border-t ${borderLight}`} />
                    <button onClick={() => setCollapsed(!collapsed)} className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-xs transition-all ${hoverBg} ${collapsed ? "justify-center" : ""}`}>
                        {collapsed ? <ChevronRight className="h-4 w-4 flex-shrink-0" /> : <ChevronLeftIcon className="h-4 w-4 flex-shrink-0" />}
                        {!collapsed && <span>Collapse</span>}
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 h-full overflow-y-auto custom-scrollbar">
                <div className="max-w-5xl mx-auto px-6 py-10">
                    <div className="flex items-center gap-4 mb-10">
                        <div className="h-12 w-12 bg-amber-500 text-black rounded-2xl flex items-center justify-center">
                            <Trophy className="h-6 w-6" />
                        </div>
                        <div>
                            <h1 className={`text-2xl font-display font-black tracking-tight uppercase`}>Arena History</h1>
                            <p className={`text-[10px] font-mono ${muted} uppercase tracking-[0.2em]`}>Past battles & leaderboards</p>
                        </div>
                    </div>

                    {loading && (
                        <div className="flex items-center justify-center py-32">
                            <div className="relative h-16 w-16">
                                <svg className="absolute inset-0 animate-spin" width="64" height="64" viewBox="0 0 64 64">
                                    <circle cx="32" cy="32" r="28" fill="none" stroke={isDarkMode ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)"} strokeWidth="3" />
                                    <circle cx="32" cy="32" r="28" fill="none" stroke={isDarkMode ? "white" : "black"} strokeWidth="3" strokeLinecap="round" strokeDasharray={`${2 * Math.PI * 28 * 0.75} ${2 * Math.PI * 28 * 0.25}`} strokeDashoffset="0" />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
                                    <img 
                                        src={isDarkMode ? "/dark.png" : "/light.png"} 
                                        alt="Logo" 
                                        className="h-7 w-7 object-contain transition-transform duration-300"
                                        style={{ transform: isDarkMode ? "scale(1.5)" : "none" }}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="border border-red-500/30 bg-red-500/10 p-8 rounded-[2.5rem] text-center">
                            <p className="text-red-400 text-sm font-mono mb-4">{error}</p>
                        </div>
                    )}

                    {!loading && !error && paginated.length === 0 && (
                        <div className={`border ${border} ${cardBg} p-16 rounded-[2.5rem] text-center`}>
                            <Swords className="h-12 w-12 mx-auto mb-4 text-white/20" />
                            <h2 className={`text-xl font-black uppercase tracking-tight mb-2`}>No Battles Yet</h2>
                            <p className={`text-sm ${muted} font-mono`}>Host or join a battle to see your history here.</p>
                        </div>
                    )}

                    {!loading && !error && paginated.length > 0 && (
                        <div className="space-y-4">
                            {paginated.map((battle, i) => (
                                <motion.div key={battle.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                                    className={`border ${border} ${cardBg} p-6 rounded-[2rem] ${hoverBg} transition-all`}>
                                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
                                        <div className="flex items-center gap-4">
                                            <div className={`h-10 w-10 ${rowBg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                                                <BookOpen className={`h-5 w-5 ${muted}`} />
                                            </div>
                                            <div>
                                                <h3 className="text-base font-bold capitalize">{battle.topic}</h3>
                                                <div className={`flex items-center gap-3 mt-1`}>
                                                    <span className={`flex items-center gap-1 text-[9px] font-mono ${muted} uppercase tracking-wider`}>
                                                        <Signal className="h-3 w-3" /> {battle.difficulty}
                                                    </span>
                                                    <span className={`flex items-center gap-1 text-[9px] font-mono ${muted} uppercase tracking-wider`}>
                                                        <Hash className="h-3 w-3" /> {battle.question_count} Q
                                                    </span>
                                                    <span className={`flex items-center gap-1 text-[9px] font-mono ${muted} uppercase tracking-wider`}>
                                                        <Users className="h-3 w-3" /> {battle.participant_count || "?"}
                                                    </span>
                                                    <span className={`flex items-center gap-1 text-[9px] font-mono ${muted} uppercase tracking-wider`}>
                                                        <Clock className="h-3 w-3" /> {new Date(battle.created_at).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <span className={`text-[9px] font-mono uppercase tracking-wider px-3 py-1.5 rounded-full ${
                                            battle.status === "completed" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                                        }`}>
                                            {battle.status}
                                        </span>
                                    </div>

                                    {battle.leaderboard && battle.leaderboard.length > 0 && (
                                        <div className={`border-t ${borderLight} pt-4 mt-2`}>
                                            <div className="flex items-center gap-2 mb-3">
                                                <Trophy className="h-3 w-3 text-amber-400" />
                                                <span className={`text-[9px] font-mono ${muted} uppercase tracking-[0.2em]`}>Leaderboard</span>
                                            </div>
                                            <div className="space-y-1.5">
                                                {battle.leaderboard.map((entry, ei) => (
                                                    <div key={ei} className={`flex items-center justify-between px-3 py-2 rounded-xl ${ei === 0 ? "bg-amber-500/10 border border-amber-500/20" : rowBg}`}>
                                                        <div className="flex items-center gap-3">
                                                            <span className={`h-6 w-6 rounded-full flex items-center justify-center text-[9px] font-mono font-bold ${
                                                                ei === 0 ? "bg-amber-500 text-black" : ei === 1 ? "bg-zinc-400 text-black" : ei === 2 ? "bg-amber-700 text-white" : `${rowBg} ${muted}`
                                                            }`}>
                                                                {ei + 1}
                                                            </span>
                                                            <span className="text-sm font-medium">{entry.name}</span>
                                                        </div>
                                                        <div className="flex items-center gap-4">
                                                            <span className="text-sm font-black text-emerald-400">{entry.score} pts</span>
                                                            <span className={`text-[9px] font-mono ${muted}`}>{entry.time_taken}s</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                        </div>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className={`flex items-center justify-between mt-6 px-2`}>
                            <span className={`text-[9px] font-mono ${muted}`}>Page {currentPage} of {totalPages}</span>
                            <div className="flex items-center gap-2">
                                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className={`p-2 border ${border} rounded-xl disabled:opacity-20 ${hoverBg} transition-all`}>
                                    <ChevronLeft className="h-4 w-4" />
                                </button>
                                {Array.from({ length: totalPages }, (_, i) => i + 1)
                                    .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                                    .map((p, i, arr) => (
                                        <span key={p} className="flex items-center">
                                            {i > 0 && arr[i - 1] !== p - 1 && <span className={`px-1 text-[9px] ${muted}`}>...</span>}
                                            <button onClick={() => setCurrentPage(p)} className={`h-9 w-9 text-[10px] font-mono rounded-xl transition-all ${currentPage === p ? (isDarkMode ? "bg-white text-black font-black" : "bg-[#00DDDD] text-white font-black") : `${hoverBg} opacity-60`}`}>{p}</button>
                                        </span>
                                    ))}
                                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className={`p-2 border ${border} rounded-xl disabled:opacity-20 ${hoverBg} transition-all`}>
                                    <ChevronRight className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function ArenaHistoryPage() {
    return <ThemeProvider><PageContent /></ThemeProvider>;
}
