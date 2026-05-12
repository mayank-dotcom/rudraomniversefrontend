"use client";
import React, { useEffect, useState, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Trophy, Search, Crown, Medal, Star, Users, TrendingUp, Zap, ArrowLeft, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown, History, Moon, Sun, ChevronLeft as ChevronLeftIcon, BarChart3, PieChart } from "lucide-react";
import { getGlobalLeaderboard, type GlobalLeaderboardEntry } from "@/lib/chat-api";
import { useTheme, ThemeProvider } from "@/lib/theme-context";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart as RePieChart, Pie, Cell, LineChart, Line, CartesianGrid } from "recharts";

type SortField = "score" | "name" | "arena_wins" | "mock_tests" | "activities";
type SortOrder = "asc" | "desc";

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
    const [entries, setEntries] = useState<GlobalLeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [sortField, setSortField] = useState<SortField>("score");
    const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [analyticsMode, setAnalyticsMode] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                const res = await getGlobalLeaderboard();
                if (res.success && res.leaderboard) setEntries(res.leaderboard);
                else if (res.success && !res.leaderboard) setEntries([]);
                else setError(res.error || "Failed to load");
            } catch (e: any) {
                setError(e.message);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const filtered = useMemo(() => {
        let list = search.trim()
            ? entries.filter(e => e.name?.toLowerCase().includes(search.toLowerCase()))
            : [...entries];
        list.sort((a, b) => {
            let va: any, vb: any;
            switch (sortField) {
                case "name": va = (a.name || "").toLowerCase(); vb = (b.name || "").toLowerCase(); break;
                case "arena_wins": va = a.arena_wins || 0; vb = b.arena_wins || 0; break;
                case "mock_tests": va = a.mock_tests || 0; vb = b.mock_tests || 0; break;
                case "activities": va = a.activities || 0; vb = b.activities || 0; break;
                default: va = a.score; vb = b.score;
            }
            if (va < vb) return sortOrder === "asc" ? -1 : 1;
            if (va > vb) return sortOrder === "asc" ? 1 : -1;
            return 0;
        });
        return list;
    }, [entries, search, sortField, sortOrder]);

    const totalPages = Math.ceil(filtered.length / pageSize);
    const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    const totalPlayers = entries.length;
    const avgScore = totalPlayers > 0 ? entries.reduce((s, e) => s + e.score, 0) / totalPlayers : null;
    const topScore = totalPlayers > 0 ? entries[0].score : 0;
    const totalArenaWins = entries.reduce((s, e) => s + (e.arena_wins || 0), 0);

    const toggleSort = (field: SortField) => {
        if (sortField === field) setSortOrder(o => o === "asc" ? "desc" : "asc");
        else { setSortField(field); setSortOrder("desc"); }
        setCurrentPage(1);
    };

    const SortIcon = ({ field }: { field: SortField }) => {
        if (sortField !== field) return <ArrowUpDown className="h-3 w-3 opacity-30" />;
        return sortOrder === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />;
    };

    const bg = isDarkMode ? "bg-[#0a0a0a]" : "bg-white";
    const text = isDarkMode ? "text-white" : "text-black";
    const border = isDarkMode ? "border-2 border-white" : "border-2 border-black";
    const borderLight = isDarkMode ? "border border-white" : "border border-black";
    const muted = isDarkMode ? "text-white/50" : "text-black/50";
    const cardBg = isDarkMode ? "bg-[#0d0d0d]" : "bg-gray-50";
    const hoverBg = isDarkMode ? "hover:bg-white/10" : "hover:bg-black/10";
    const rowBg = isDarkMode ? "bg-white/5" : "bg-black/5";
    const activeBg = isDarkMode ? "bg-white/20" : "bg-black/20";
    const sidebarBg = isDarkMode ? "bg-[#0d0d0d] border-r-2 border-white" : "bg-gray-50 border-r-2 border-black";

    return (
        <div className={`h-screen w-full ${bg} ${text} selection:bg-white selection:text-black font-sans flex overflow-hidden`}>
            {/* Left Sidebar */}
            <div className={`h-full flex flex-col ${sidebarBg} transition-all duration-300 ${collapsed ? "w-16" : "w-56"} flex-shrink-0`}>
                <Link href="/chat" className={`flex items-center gap-3 px-4 h-16 flex-shrink-0 ${collapsed ? "justify-center" : ""}`}>
                    <div className={`h-[26px] w-[26px] border-2 ${isDarkMode ? "border-white" : "border-black"} flex items-center justify-center flex-shrink-0`}>
                        <svg width="22" height="22" viewBox="0 0 128 128" className={isDarkMode ? "text-white" : "text-black"}>
                            <polygon points="20,20 86,20 86,55 58,55 58,40 42,40 42,55 42,68 104,108 78,108 50,72 42,72 42,108 20,108" fill="currentColor" />
                        </svg>
                    </div>
                    {!collapsed && (
                        <div className="flex items-baseline gap-1">
                            <span className={`font-display font-black text-sm tracking-tighter ${isDarkMode ? "text-white" : "text-black"}`}>RUDRANEX</span>
                            <span className={`font-serif text-xs italic ${isDarkMode ? "text-white/70" : "text-black/70"}`}>ai</span>
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
                            <Crown className="h-6 w-6" />
                        </div>
                        <div>
                            <h1 className={`text-2xl font-display font-black tracking-tight uppercase`}>Global Leaderboard</h1>
                            <p className={`text-[10px] font-mono ${muted} uppercase tracking-[0.2em]`}>Arena score + Mock tests + Activities</p>
                        </div>
                    </div>

                    {loading && (
                        <div className="flex items-center justify-center py-32">
                            <div className="relative h-16 w-16">
                                <svg className="absolute inset-0 animate-spin" width="64" height="64" viewBox="0 0 64 64">
                                    <circle cx="32" cy="32" r="28" fill="none" stroke={isDarkMode ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)"} strokeWidth="3" />
                                    <circle cx="32" cy="32" r="28" fill="none" stroke={isDarkMode ? "white" : "black"} strokeWidth="3" strokeLinecap="round" strokeDasharray={`${2 * Math.PI * 28 * 0.75} ${2 * Math.PI * 28 * 0.25}`} strokeDashoffset="0" />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <svg width="28" height="28" viewBox="0 0 128 128" className={isDarkMode ? "text-white" : "text-black"}>
                                        <polygon points="20,20 86,20 86,55 58,55 58,40 42,40 42,55 42,68 104,108 78,108 50,72 42,72 42,108 20,108" fill="currentColor" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="border border-red-500/30 bg-red-500/10 p-8 rounded-[2.5rem] text-center">
                            <p className="text-red-400 text-sm font-mono mb-4">{error}</p>
                        </div>
                    )}

                    {!loading && !error && (
                        <>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                                {[
                                    { icon: Users, label: "Total Players", value: totalPlayers, color: "#3b82f6" },
                                    { icon: Trophy, label: "Top Score", value: topScore, color: "#f59e0b" },
                                    { icon: TrendingUp, label: "Avg Score", value: avgScore, color: "#10b981" },
                                    { icon: Zap, label: "Arena Wins", value: totalArenaWins, color: "#8b5cf6" },
                                ].map((card, i) => (
                                    <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className={`border ${border} ${cardBg} p-5 rounded-[2rem]`}>
                                        <div className="flex items-center gap-2 mb-3">
                                            <card.icon className="h-4 w-4" style={{ color: card.color }} />
                                            <span className={`text-[8px] font-mono ${text} uppercase tracking-[0.2em]`}>{card.label}</span>
                                        </div>
                                        <span className="text-3xl font-black">{typeof card.value === "number" && isFinite(card.value) ? (String(card.value).includes("e") ? "—" : card.label === "Avg Score" ? Number(card.value).toFixed(2) : card.value) : "—"}</span>
                                        <div className={`mt-2 h-1 w-full ${isDarkMode ? "bg-white/15" : "bg-black/15"} rounded-full overflow-hidden`}>
                                            <motion.div initial={{ width: 0 }} animate={{ width: "100%" }} className="h-full rounded-full" style={{ backgroundColor: card.color }} />
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <button onClick={() => setAnalyticsMode(false)} className={`px-4 py-2 rounded-xl text-[10px] font-mono uppercase tracking-wider border transition-all ${!analyticsMode ? `bg-amber-500 ${isDarkMode ? "text-white" : "text-black"}` : `${border} ${text} opacity-60 ${hoverBg}`}`}>
                                        <Crown className="h-3 w-3 inline mr-1.5" />Leaderboard
                                    </button>
                                    <button onClick={() => setAnalyticsMode(true)} className={`px-4 py-2 rounded-xl text-[10px] font-mono uppercase tracking-wider border transition-all ${analyticsMode ? `bg-amber-500 ${isDarkMode ? "text-white" : "text-black"}` : `${border} ${text} opacity-60 ${hoverBg}`}`}>
                                        <BarChart3 className="h-3 w-3 inline mr-1.5" />Analytics
                                    </button>
                                </div>
                            </div>

                            {!analyticsMode && (
                                <>
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
                                        <div className="relative flex-1 max-w-md">
                                            <Search className={`absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 ${muted}`} />
                                            <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} placeholder="Search by name..." className={`w-full pl-12 pr-4 py-3 ${cardBg} border ${border} text-xs font-mono rounded-2xl focus:outline-none focus:border-white/50 transition-all ${isDarkMode ? "placeholder:text-white/50" : "placeholder:text-black/50"}`} />
                                        </div>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            {(["score", "name", "arena_wins", "mock_tests", "activities"] as SortField[]).map(f => (
                                                <button key={f} onClick={() => toggleSort(f)} className={`flex items-center gap-1 px-3 py-2 rounded-xl text-[9px] font-mono uppercase tracking-wider border transition-all ${sortField === f ? `bg-amber-500 ${isDarkMode ? "text-white" : "text-black"}` : `${border} ${text} opacity-60 ${hoverBg}`}`}>
                                                    {f === "arena_wins" ? "Arena" : f === "mock_tests" ? "Tests" : f === "activities" ? "Activity" : f}
                                                    <SortIcon field={f} />
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between mb-4">
                                        <span className={`text-[9px] font-mono ${muted}`}>{filtered.length} entries found</span>
                                        <div className="flex items-center gap-2">
                                            <span className={`text-[9px] font-mono ${muted}`}>Show</span>
                                            <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1); }} className={`px-3 py-1.5 text-[10px] font-mono ${cardBg} border ${border} rounded-xl focus:outline-none`}>
                                                {[10, 20, 30, 40, 50].map(n => <option key={n} value={n}>{n}</option>)}
                                            </select>
                                            <span className={`text-[9px] font-mono ${muted}`}>per page</span>
                                        </div>
                                    </div>

                                    {filtered.length === 0 && (
                                        <div className={`border ${border} ${cardBg} p-16 rounded-[2.5rem] text-center`}>
                                            <Trophy className="h-12 w-12 mx-auto mb-4 text-white/20" />
                                            <h2 className={`text-xl font-black uppercase tracking-tight mb-2`}>{search ? "No Results" : "No Rankings Yet"}</h2>
                                            <p className={`text-sm ${muted} font-mono`}>{search ? "Try a different name." : "Complete battles to appear on the leaderboard."}</p>
                                        </div>
                                    )}

                                    {filtered.length > 0 && (
                                        <>
                                            <div className={`border ${border} ${cardBg} rounded-[2.5rem] overflow-hidden`}>
                                                {paginated.map((entry, i) => {
                                                    const globalRank = (currentPage - 1) * pageSize + i + 1;
                                                    return (
                                                        <motion.div key={entry.rank ?? i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                                                            className={`flex items-center justify-between px-6 py-4 border-b ${borderLight} last:border-b-0 ${hoverBg} transition-all ${globalRank <= 3 ? `bg-gradient-to-r ${isDarkMode ? "from-amber-500/10" : "from-amber-500/10"} to-transparent` : ""}`}
                                                        >
                                                            <div className="flex items-center gap-4">
                                                                {globalRank === 1 ? (
                                                                    <div className="h-10 w-10 bg-amber-500 rounded-xl flex items-center justify-center"><Crown className="h-5 w-5 text-black" /></div>
                                                                ) : globalRank === 2 ? (
                                                                    <div className="h-10 w-10 bg-zinc-400 rounded-xl flex items-center justify-center"><Medal className="h-5 w-5 text-black" /></div>
                                                                ) : globalRank === 3 ? (
                                                                    <div className="h-10 w-10 bg-amber-700 rounded-xl flex items-center justify-center"><Medal className="h-5 w-5 text-white" /></div>
                                                                ) : (
                                                                    <div className={`h-10 w-10 ${rowBg || "bg-white/5"} rounded-xl flex items-center justify-center`}>
                                                                        <span className="text-sm font-mono font-bold opacity-40">#{globalRank}</span>
                                                                    </div>
                                                                )}
                                                                <div>
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-sm font-bold">{entry.name}</span>
                                                                        {globalRank <= 3 && <Star className="h-3 w-3 text-amber-400 fill-amber-400" />}
                                                                    </div>
                                                                    <div className={`flex items-center gap-3 text-[9px] font-mono ${muted} uppercase tracking-wider`}>
                                                                        <span>Score: {entry.score}</span>
                                                                        <span className="opacity-30">|</span>
                                                                        {entry.arena_wins !== undefined && <span>Arena: {entry.arena_wins}</span>}
                                                                        {entry.mock_tests !== undefined && <span>Tests: {entry.mock_tests}</span>}
                                                                        {entry.activities !== undefined && <span>Activities: {entry.activities}</span>}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <span className="text-lg font-black text-emerald-400">{entry.score}</span>
                                                                <span className={`text-[9px] font-mono ${muted} ml-1`}>pts</span>
                                                            </div>
                                                        </motion.div>
                                                    );
                                                })}
                                            </div>

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
                                                                    <button onClick={() => setCurrentPage(p)} className={`h-9 w-9 text-[10px] font-mono rounded-xl transition-all ${currentPage === p ? (isDarkMode ? "bg-white text-black font-black" : "bg-black text-white font-black") : `${hoverBg} opacity-60`}`}>{p}</button>
                                                                </span>
                                                            ))}
                                                        <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className={`p-2 border ${border} rounded-xl disabled:opacity-20 ${hoverBg} transition-all`}>
                                                            <ChevronRight className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </>
                            )}

                            {analyticsMode && (
                                <div className="space-y-8">
                                    <div className={`border ${border} ${cardBg} p-6 rounded-[2.5rem]`}>
                                        <div className="flex items-center gap-2 mb-6">
                                            <BarChart3 className="h-4 w-4 text-amber-400" />
                                            <span className={`text-[10px] font-mono ${text} uppercase tracking-[0.2em]`}>Top 10 — Score Distribution</span>
                                        </div>
                                        <ResponsiveContainer width="100%" height={300}>
                                            <BarChart data={[...entries].sort((a, b) => b.score - a.score).slice(0, 10)}>
                                                <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"} />
                                                <XAxis dataKey="name" tick={{ fontSize: 10, fill: isDarkMode ? "#ffffff80" : "#00000080" }} />
                                                <YAxis tick={{ fontSize: 10, fill: isDarkMode ? "#ffffff80" : "#00000080" }} />
                                                <Tooltip contentStyle={{ background: isDarkMode ? "#1a1a1a" : "#fff", border: "none", borderRadius: 12, color: isDarkMode ? "#fff" : "#000" }} />
                                                <Bar dataKey="score" radius={[8, 8, 0, 0]}>
                                                    {[...entries].sort((a, b) => b.score - a.score).slice(0, 10).map((_, i) => (
                                                        <Cell key={i} fill={["#f59e0b", "#10b981", "#3b82f6", "#8b5cf6", "#ef4444", "#ec4899", "#14b8a6", "#f97316", "#6366f1", "#84cc16"][i]} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        <div className={`border ${border} ${cardBg} p-6 rounded-[2.5rem]`}>
                                            <div className="flex items-center gap-2 mb-6">
                                                <PieChart className="h-4 w-4 text-emerald-400" />
                                                <span className={`text-[10px] font-mono ${text} uppercase tracking-[0.2em]`}>Score Tiers</span>
                                            </div>
                                            {(() => {
                                                const tiers = [
                                                    { name: "Top (≥500)", value: entries.filter(e => e.score >= 500).length, color: "#f59e0b" },
                                                    { name: "High (200-499)", value: entries.filter(e => e.score >= 200 && e.score < 500).length, color: "#10b981" },
                                                    { name: "Mid (50-199)", value: entries.filter(e => e.score >= 50 && e.score < 200).length, color: "#3b82f6" },
                                                    { name: "Low (<50)", value: entries.filter(e => e.score > 0 && e.score < 50).length, color: "#8b5cf6" },
                                                    { name: "No Score", value: entries.filter(e => e.score === 0).length, color: "#6b7280" },
                                                ].filter(t => t.value > 0);
                                                return (
                                                    <ResponsiveContainer width="100%" height={250}>
                                                        <RePieChart>
                                                            <Pie data={tiers} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={3}>
                                                                {tiers.map((t, i) => <Cell key={i} fill={t.color} />)}
                                                            </Pie>
                                                            <Tooltip contentStyle={{ background: isDarkMode ? "#1a1a1a" : "#fff", border: "none", borderRadius: 12, color: isDarkMode ? "#fff" : "#000" }} />
                                                        </RePieChart>
                                                    </ResponsiveContainer>
                                                );
                                            })()}
                                            <div className="flex flex-wrap gap-3 mt-4 justify-center">
                                                {[
                                                    { label: "Top", color: "#f59e0b" },
                                                    { label: "High", color: "#10b981" },
                                                    { label: "Mid", color: "#3b82f6" },
                                                    { label: "Low", color: "#8b5cf6" },
                                                    { label: "Zero", color: "#6b7280" },
                                                ].map((t, i) => (
                                                    <span key={i} className="flex items-center gap-1.5 text-[9px] font-mono uppercase tracking-wider">
                                                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: t.color }} />
                                                        <span className={muted}>{t.label}</span>
                                                    </span>
                                                ))}
                                            </div>
                                        </div>

                                        <div className={`border ${border} ${cardBg} p-6 rounded-[2.5rem]`}>
                                            <div className="flex items-center gap-2 mb-6">
                                                <TrendingUp className="h-4 w-4 text-purple-400" />
                                                <span className={`text-[10px] font-mono ${text} uppercase tracking-[0.2em]`}>Score vs Rank Trend</span>
                                            </div>
                                            <ResponsiveContainer width="100%" height={250}>
                                                <LineChart data={[...entries].sort((a, b) => a.score - b.score).slice(0, 50)}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"} />
                                                    <XAxis dataKey="name" hide />
                                                    <YAxis tick={{ fontSize: 10, fill: isDarkMode ? "#ffffff80" : "#00000080" }} />
                                                    <Tooltip contentStyle={{ background: isDarkMode ? "#1a1a1a" : "#fff", border: "none", borderRadius: 12, color: isDarkMode ? "#fff" : "#000" }} />
                                                    <Line type="monotone" dataKey="score" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 2, fill: "#8b5cf6" }} />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function GlobalLeaderboardPage() {
    return <ThemeProvider><PageContent /></ThemeProvider>;
}
