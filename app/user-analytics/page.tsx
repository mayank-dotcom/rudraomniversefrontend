"use client";
import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Swords, Trophy, Users, TrendingUp, ArrowLeft, Clock, Target, Zap, Star, Activity, Award, History, Crown, Moon, Sun, LogOut, ChevronLeft, ChevronRight } from "lucide-react";
import { getUserAnalytics, type UserAnalyticsData } from "@/lib/chat-api";
import { useTheme, ThemeProvider } from "@/lib/theme-context";
import { isAuthenticated, removeApiKey } from "@/lib/auth";

const CircularProgress = ({ value, max, label, color, dark }: { value: number; max: number; label: string; color: string; dark: boolean }) => {
    const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
    const trackStroke = dark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)";
    return (
        <div className="flex flex-col items-center gap-3">
            <div className="relative h-28 w-28">
                <svg className="transform -rotate-90 w-full h-full" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="42" stroke={trackStroke} strokeWidth="8" fill="none" />
                    <circle cx="50" cy="50" r="42" stroke={color} strokeWidth="8" fill="none" strokeDasharray={`${pct * 2.64} 264`} strokeLinecap="round" className="transition-all duration-1000" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xl font-black">{value}</span>
                    {max > 0 && <span className="text-[8px] font-mono opacity-30">/ {max}</span>}
                </div>
            </div>
            <span className="text-[8px] font-mono opacity-40 uppercase tracking-[0.2em] text-center">{label}</span>
        </div>
    );
};

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
    const [analytics, setAnalytics] = useState<UserAnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        (async () => {
            try {
                const res = await getUserAnalytics();
                if (res.success && res.analytics) setAnalytics(res.analytics);
                else if (res.success && !res.analytics) setAnalytics(null);
                else setError(res.error || "Failed to load");
            } catch (e: any) {
                setError(e.message);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const bg = isDarkMode ? "bg-[#0a0a0a]" : "bg-white";
    const text = isDarkMode ? "text-white" : "text-black";
    const border = isDarkMode ? "border-2 border-white" : "border-2 border-[#00DDDD]";
    const borderLight = isDarkMode ? "border border-white" : "border border-black";
    const muted = isDarkMode ? "text-white/40" : "text-black/40";
    const cardBg = isDarkMode ? "bg-[#0d0d0d]" : "bg-gray-50";
    const hoverBg = isDarkMode ? "hover:bg-white/10" : "hover:bg-[#00DDDD]/10";
    const activeBg = isDarkMode ? "bg-white/20" : "bg-[#00DDDD]/20";
    const sidebarBg = isDarkMode ? "bg-[#0d0d0d] border-r-2 border-white" : "bg-gray-50 border-r-2 border-black";
    const gridLine = isDarkMode ? "#ffffff05" : "#00000008";

    return (
        <div className={`h-screen w-full ${bg} ${text} selection:bg-white selection:text-black font-sans flex overflow-hidden`}>
            <div className={`fixed inset-0 z-0 pointer-events-none overflow-hidden opacity-10`}>
                <div className="absolute inset-0" style={{
                    backgroundImage: `linear-gradient(to right, ${gridLine} 1px, transparent 1px), linear-gradient(to bottom, ${gridLine} 1px, transparent 1px)`,
                    backgroundSize: '100px 100px'
                }} />
            </div>

            {/* Left Sidebar */}
            <div className={`relative z-20 h-screen flex flex-col ${sidebarBg} transition-all duration-300 ${collapsed ? "w-16" : "w-56"} flex-shrink-0`}>
                {/* Logo */}
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

                {/* Nav Items */}
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
                                <Link
                                    href={item.href}
                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs transition-all ${active ? activeBg + " font-bold" : hoverBg} ${collapsed ? "justify-center" : ""}`}
                                    title={collapsed ? item.label : undefined}
                                >
                                    <item.icon className="h-4 w-4 flex-shrink-0" />
                                    {!collapsed && <span>{item.label}</span>}
                                </Link>
                            </React.Fragment>
                        );
                    })}
                </nav>

                {/* Bottom actions */}
                <div className={`px-2 py-4 space-y-2`}>
                    <button onClick={toggleTheme} className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-xs transition-all ${hoverBg} ${collapsed ? "justify-center" : ""}`} title="Toggle Theme">
                        {isDarkMode ? <Sun className="h-4 w-4 flex-shrink-0" /> : <Moon className="h-4 w-4 flex-shrink-0" />}
                        {!collapsed && <span>{isDarkMode ? "Light Mode" : "Dark Mode"}</span>}
                    </button>
                    <div className={`mx-3 border-t ${borderLight}`} />
                    <button onClick={() => { setCollapsed(!collapsed); }} className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-xs transition-all ${hoverBg} ${collapsed ? "justify-center" : ""}`}>
                        {collapsed ? <ChevronRight className="h-4 w-4 flex-shrink-0" /> : <ChevronLeft className="h-4 w-4 flex-shrink-0" />}
                        {!collapsed && <span>Collapse</span>}
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="relative z-10 flex-1 h-full overflow-y-auto custom-scrollbar">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
                    <div className="flex items-center gap-4 mb-10">
                        <div className="h-12 w-12 bg-emerald-500 text-black rounded-2xl flex items-center justify-center">
                            <TrendingUp className="h-6 w-6" />
                        </div>
                        <div>
                            <h1 className={`text-2xl font-display font-black tracking-tight uppercase ${isDarkMode ? "text-white" : "text-black"}`}>My Arena Stats</h1>
                            <p className={`text-[10px] font-mono ${muted} uppercase tracking-[0.2em]`}>Personal battle analytics & performance</p>
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
                        <div className={`border border-red-500/30 bg-red-500/10 p-8 rounded-[2.5rem] text-center`}>
                            <p className="text-red-400 text-sm font-mono mb-4">{error}</p>
                        </div>
                    )}

                    {!loading && !error && analytics && (
                        <div className="space-y-8">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {[
                                    { icon: Swords, label: "Total Battles", value: analytics.total_battles, color: "#10b981", pct: 100 },
                                    { icon: Trophy, label: "Total Wins", value: analytics.total_wins, color: "#f59e0b", pct: analytics.total_battles > 0 ? (analytics.total_wins / analytics.total_battles) * 100 : 0 },
                                    { icon: Users, label: "Participation", value: analytics.total_participation, color: "#3b82f6", pct: 100 },
                                    { icon: Target, label: "Win Rate", value: `${analytics.win_rate}%`, color: "#8b5cf6", pct: analytics.win_rate },
                                ].map((card, i) => (
                                <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className={`border ${border} ${cardBg} p-4 sm:p-5 rounded-[2.5rem]`}>
                                        <div className="flex items-center gap-2 mb-3">
                                            <card.icon className="h-4 w-4" style={{ color: card.color }} />
                                            <span className={`text-[8px] font-mono ${text} uppercase tracking-[0.2em]`}>{card.label}</span>
                                        </div>
                                        <span className="text-2xl sm:text-3xl font-black">{card.value}</span>
                                        <div className={`mt-2 h-1 w-full ${isDarkMode ? "bg-white/15" : "bg-black/15"} rounded-full overflow-hidden`}>
                                            <motion.div initial={{ width: 0 }} animate={{ width: `${card.pct}%` }} className="h-full rounded-full" style={{ backgroundColor: card.color }} />
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className={`border ${border} ${cardBg} p-6 sm:p-8 rounded-[2.5rem]`}>
                                    <div className="flex items-center gap-2 mb-6 sm:mb-8">
                                        <Activity className="h-4 w-4 text-white/40" />
                                        <span className={`text-[10px] font-mono ${text} uppercase tracking-[0.2em]`}>Performance Overview</span>
                                    </div>
                                    <div className="flex justify-center items-center flex-wrap gap-6 sm:gap-8">
                                        <CircularProgress value={analytics.total_wins} max={analytics.total_battles} label="Win Ratio" color="#10b981" dark={isDarkMode} />
                                        <CircularProgress value={analytics.win_rate} max={100} label="Win Rate %" color="#8b5cf6" dark={isDarkMode} />
                                        <CircularProgress value={analytics.total_participation} max={Math.max(analytics.total_participation, 1)} label="Participation" color="#3b82f6" dark={isDarkMode} />
                                    </div>
                                </motion.div>

                                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className={`border ${border} ${cardBg} p-6 sm:p-8 rounded-[2.5rem]`}>
                                    <div className="flex items-center gap-2 mb-8">
                                        <Award className="h-4 w-4 text-amber-400" />
                                        <span className={`text-[10px] font-mono ${text} uppercase tracking-[0.2em]`}>Achievements</span>
                                    </div>
                                    <div className="space-y-3">
                                        {[
                                            { icon: Zap, label: "First Battle", achieved: analytics.total_battles >= 1, color: "text-emerald-400", border: "border-emerald-500/40", bg: isDarkMode ? "bg-emerald-500/8" : "bg-emerald-500/8" },
                                            { icon: Trophy, label: "First Win", achieved: analytics.total_wins >= 1, color: "text-amber-400", border: "border-amber-500/40", bg: isDarkMode ? "bg-amber-500/8" : "bg-amber-500/8" },
                                            { icon: Star, label: "5 Battles", achieved: analytics.total_battles >= 5, color: "text-purple-400", border: "border-purple-500/40", bg: isDarkMode ? "bg-purple-500/8" : "bg-purple-500/8" },
                                            { icon: Target, label: "50% Win Rate", achieved: analytics.win_rate >= 50, color: "text-blue-400", border: "border-blue-500/40", bg: isDarkMode ? "bg-blue-500/8" : "bg-blue-500/8" },
                                            { icon: Activity, label: "10 Participations", achieved: analytics.total_participation >= 10, color: "text-emerald-400", border: "border-emerald-500/40", bg: isDarkMode ? "bg-emerald-500/8" : "bg-emerald-500/8" },
                                        ].map((ach, i) => (
                                            <div key={i} className={`flex items-center justify-between px-4 py-3 ${ach.bg} border ${ach.border} rounded-xl`}>
                                                <div className="flex items-center gap-3">
                                                    <ach.icon className={`h-4 w-4 ${ach.achieved ? ach.color : "opacity-30"}`} />
                                                    <span className={`text-xs ${ach.achieved ? text : "opacity-40"}`}>{ach.label}</span>
                                                </div>
                                                <span className={`text-[8px] font-mono uppercase ${ach.achieved ? "text-emerald-400" : "opacity-30"}`}>
                                                    {ach.achieved ? "Unlocked" : "Locked"}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            </div>

                            {analytics.recent_battles && analytics.recent_battles.length > 0 && (
                                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className={`border ${border} ${cardBg} p-4 sm:p-6 rounded-[2.5rem]`}>
                                    <div className="flex items-center gap-2 mb-6">
                                        <Clock className="h-4 w-4 text-white/40" />
                                        <span className={`text-[10px] font-mono ${text} uppercase tracking-[0.2em]`}>Recent Battles</span>
                                    </div>
                                    <div className="space-y-2">
                                        {analytics.recent_battles.map((battle, i) => (
                                            <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className={`flex items-center justify-between px-4 py-3 ${isDarkMode ? "bg-white/5" : "bg-black/5"} rounded-xl ${hoverBg} transition-all`}>
                                                <div className="flex items-center gap-3">
                                                    <div className={`h-8 w-8 ${isDarkMode ? "bg-white/10" : "bg-black/10"} rounded-lg flex items-center justify-center`}>
                                                        <Swords className={`h-4 w-4 ${muted}`} />
                                                    </div>
                                                    <div>
                                                        <span className="text-sm font-medium capitalize">{battle.topic}</span>
                                                        <div className={`flex items-center gap-2 text-[9px] font-mono ${muted} uppercase`}>
                                                            <span>{battle.difficulty}</span>
                                                            <span>|</span>
                                                            <span>{new Date(battle.created_at).toLocaleDateString()}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-sm font-black text-emerald-400">{battle.score} pts</span>
                                                    <br />
                                                    <span className={`text-[9px] font-mono ${muted}`}>#{battle.rank}</span>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </div>
                    )}

                    {!loading && !error && !analytics && (
                        <div className={`border ${border} ${cardBg} p-16 rounded-[2.5rem] text-center`}>
                            <TrendingUp className="h-12 w-12 mx-auto mb-4 text-white/20" />
                            <h2 className={`text-xl font-black uppercase tracking-tight mb-2 ${isDarkMode ? "text-white" : "text-black"}`}>No Data Yet</h2>
                            <p className={`text-sm ${muted} font-mono`}>Participate in arena battles to see your stats here.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function UserAnalyticsPage() {
    return <ThemeProvider><PageContent /></ThemeProvider>;
}
