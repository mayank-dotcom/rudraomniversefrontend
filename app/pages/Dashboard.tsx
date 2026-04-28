import React, { useState } from 'react';
import { 
    Search, Bell, Settings, User, Mail, Calendar as CalendarIcon, 
    MessageSquare, FileText, PieChart, Activity, Layers, 
    MoreHorizontal, Plus, Briefcase, Users, Clock, CheckCircle2,
    ChevronRight, ArrowUpRight, Globe, Shield, Zap, Table as TableIcon, LayoutDashboard
} from 'lucide-react';
import Link from 'next/link';

const Dashboard = () => {
    const [isDarkMode, setIsDarkMode] = useState(true);
    const [view, setView] = useState<'visual' | 'table'>('visual');

    const stats = [
        { label: "Student Mode", value: "92%", color: "white" },
        { label: "Coding Mode", value: "88%", color: "white" },
        { label: "Mock Test", value: "45%", color: "white" },
        { label: "Study Plan", value: "72%", color: "white" }
    ];

    const quickLinks = [
        { icon: Activity, label: "Stats" },
        { icon: Layers, label: "Vault" },
        { icon: Briefcase, label: "Work" },
        { icon: Shield, label: "Secure" },
        { icon: Globe, label: "Web" },
        { icon: Zap, label: "Fast" },
        { icon: Users, label: "Team" },
        { icon: Clock, label: "Logs" },
        { icon: Plus, label: "Add" },
    ];

    const recentDocs = [
        { name: "Project_Proposal.pdf", time: "2 hours ago" },
        { name: "Q3_Financial_Report.xlsx", time: "5 hours ago" },
        { name: "System_Architecture.drawio", time: "Yesterday" }
    ];

    return (
        <div className={`min-h-screen w-full ${isDarkMode ? "bg-[#0a0a0a] text-white" : "bg-white text-black"} font-sans selection:bg-white selection:text-black overflow-x-hidden`}>
            {/* Top Navigation */}
            <nav className={`h-16 flex items-center justify-between px-8 border-b ${isDarkMode ? "border-white/10 bg-[#0d0d0d]" : "border-black/10 bg-[#f9f9f9]"} sticky top-0 z-50`}>
                <div className="flex items-center gap-8">
                    <Link href="/" className="flex items-center gap-3 group">
                        <div className={`h-6 w-6 ${isDarkMode ? "bg-white" : "bg-black"} flex items-center justify-center`}>
                            <div className={`h-1.5 w-1.5 ${isDarkMode ? "bg-black" : "bg-white"}`} />
                        </div>
                        <span className="font-display font-black tracking-tighter text-lg">RUDRANEX</span>
                    </Link>
                    <div className="hidden md:flex items-center gap-6">
                        {[Briefcase, Users, Layers, Shield, Settings].map((Icon, i) => (
                            <Icon key={i} className="h-4 w-4 opacity-40 hover:opacity-100 cursor-pointer transition-opacity" />
                        ))}
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2 p-1 bg-white/5 border border-white/10 rounded-full mr-4">
                        <button 
                            onClick={() => setView('visual')}
                            className={`px-4 py-1.5 rounded-full text-[10px] font-mono uppercase tracking-widest flex items-center gap-2 transition-all ${view === 'visual' ? "bg-white text-black font-bold" : "text-white/40 hover:text-white"}`}
                        >
                            <LayoutDashboard className="h-3 w-3" /> Visual
                        </button>
                        <button 
                            onClick={() => setView('table')}
                            className={`px-4 py-1.5 rounded-full text-[10px] font-mono uppercase tracking-widest flex items-center gap-2 transition-all ${view === 'table' ? "bg-white text-black font-bold" : "text-white/40 hover:text-white"}`}
                        >
                            <TableIcon className="h-3 w-3" /> Table
                        </button>
                    </div>
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 opacity-20" />
                        <input 
                            type="text" 
                            placeholder="SEARCH..." 
                            className={`w-64 pl-10 pr-4 py-2 text-[10px] font-mono tracking-widest ${isDarkMode ? "bg-white/5 border-white/10" : "bg-black/5 border-black/10"} border focus:outline-none focus:border-white/40 transition-all rounded-full`}
                        />
                    </div>
                    <div className="flex items-center gap-4 border-l border-white/10 pl-6">
                        <Mail className="h-4 w-4 opacity-40 hover:opacity-100 cursor-pointer" />
                        <Bell className="h-4 w-4 opacity-40 hover:opacity-100 cursor-pointer" />
                        <div 
                            onClick={() => setIsDarkMode(!isDarkMode)}
                            className="h-8 w-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center cursor-pointer hover:bg-white/10"
                        >
                            <div className={`h-2 w-2 rounded-full ${isDarkMode ? "bg-white" : "bg-black"}`} />
                        </div>
                    </div>
                </div>
            </nav>

            {view === 'visual' ? (
                <div className="p-8 grid grid-cols-12 gap-6">
                    {/* Left Column - Profile & Quick Links */}
                    <div className="col-span-12 lg:col-span-2 space-y-6">
                        <div className={`${isDarkMode ? "bg-white/5 border-white/10 backdrop-blur-xl" : "bg-black/5 border-black/10 backdrop-blur-xl"} border p-8 text-center relative group overflow-hidden rounded-[2rem]`}>
                            <div className="absolute top-0 left-0 w-1 h-full bg-white scale-y-0 group-hover:scale-y-100 transition-transform origin-top" />
                            <div className="relative mx-auto w-24 h-24 mb-6">
                                <div className={`absolute inset-0 rounded-full border border-dashed ${isDarkMode ? "border-white/20 animate-spin-slow" : "border-black/20 animate-spin-slow"}`} />
                                <div className={`absolute inset-2 rounded-full border ${isDarkMode ? "border-white/10" : "border-black/10"} flex items-center justify-center overflow-hidden bg-white/5`}>
                                    <User className="h-10 w-10 opacity-40" />
                                </div>
                            </div>
                            <h2 className="font-display font-bold text-lg mb-1 tracking-tight">JOHN SMITH</h2>
                            <p className="text-[10px] font-mono tracking-[0.2em] opacity-40 uppercase mb-8">System Admin</p>
                            <div className="space-y-3">
                                {["Profile", "Settings", "Billing", "Logout"].map((item) => (
                                    <button key={item} className={`w-full text-left px-4 py-2 text-[10px] font-mono uppercase tracking-widest ${isDarkMode ? "hover:bg-white/5" : "hover:bg-black/5"} transition-colors flex items-center justify-between group rounded-xl`}>
                                        {item}
                                        <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className={`${isDarkMode ? "bg-white/5 border-white/10 backdrop-blur-xl" : "bg-black/5 border-black/10 backdrop-blur-xl"} border p-6 rounded-[2rem]`}>
                            <h3 className="text-[10px] font-mono tracking-[0.3em] opacity-20 uppercase mb-6">Quick Links</h3>
                            <div className="grid grid-cols-3 gap-2">
                                {quickLinks.map((link, i) => (
                                    <button key={i} className={`aspect-square flex items-center justify-center border rounded-2xl ${isDarkMode ? "border-white/5 hover:bg-white text-white hover:text-black" : "border-black/5 hover:bg-black text-black hover:text-white"} transition-all group`}>
                                        <link.icon className="h-4 w-4 opacity-40 group-hover:opacity-100" />
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className={`${isDarkMode ? "bg-white text-black" : "bg-black text-white"} p-6 flex items-center justify-between rounded-[2rem]`}>
                            <div className="flex items-center gap-3">
                                <MessageSquare className="h-4 w-4" />
                                <span className="text-[10px] font-mono tracking-widest uppercase font-bold">Chat Support</span>
                            </div>
                            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        </div>
                    </div>

                    {/* Center Column - Main Dashboard */}
                    <div className="col-span-12 lg:col-span-7 space-y-6">
                        {/* Top Stats Cards */}
                        <div className={`${isDarkMode ? "bg-white/5 border-white/10 backdrop-blur-xl" : "bg-black/5 border-black/10 backdrop-blur-xl"} border p-8 grid grid-cols-4 gap-8 rounded-[2.5rem]`}>
                            {stats.map((stat, i) => (
                                <div key={i} className="text-center group">
                                    <div className="relative w-24 h-24 mx-auto mb-4">
                                        <svg className="w-full h-full rotate-[-90deg]">
                                            <circle cx="48" cy="48" r="44" fill="none" stroke={isDarkMode ? "white" : "black"} strokeWidth="1" strokeDasharray="276" strokeDashoffset={276 - (parseInt(stat.value) * 2.76)} className="opacity-10 group-hover:opacity-40 transition-opacity" />
                                            <circle cx="48" cy="48" r="44" fill="none" stroke={isDarkMode ? "white" : "black"} strokeWidth="4" strokeDasharray="276" strokeDashoffset={276 - (parseInt(stat.value) * 2.76)} className="transition-all duration-1000" />
                                        </svg>
                                        <div className="absolute inset-0 flex items-center justify-center flex-col">
                                            <span className="text-xl font-display font-bold">{stat.value}</span>
                                        </div>
                                    </div>
                                    <span className="text-[9px] font-mono uppercase tracking-[0.2em] opacity-40">{stat.label}</span>
                                </div>
                            ))}
                        </div>

                        {/* Middle Row */}
                        <div className="grid grid-cols-2 gap-6">
                            <div className={`${isDarkMode ? "bg-white/5 border-white/10 backdrop-blur-xl" : "bg-black/5 border-black/10 backdrop-blur-xl"} border p-8 h-[320px] flex flex-col rounded-[2.5rem]`}>
                                <div className="flex items-center justify-between mb-8">
                                    <h3 className="text-xs font-display font-bold uppercase tracking-widest">Recent Activity</h3>
                                    <MoreHorizontal className="h-4 w-4 opacity-20" />
                                </div>
                                <div className="space-y-4 flex-1">
                                    {[
                                        { u: "User_892", m: "Student Mode", t: "2m ago" },
                                        { u: "Dev_Alpha", m: "Coding Mode", t: "5m ago" },
                                        { u: "User_441", m: "Mock Test", t: "12m ago" },
                                        { u: "Study_Bot", m: "Custom Persona", t: "15m ago" }
                                    ].map((act, i) => (
                                        <div key={i} className="flex items-center gap-4 group cursor-pointer">
                                            <div className={`h-10 w-10 border rounded-xl ${isDarkMode ? "border-white/10 group-hover:bg-white group-hover:text-black" : "border-black/10 group-hover:bg-black group-hover:text-white"} transition-all flex items-center justify-center`}>
                                                <Users className="h-4 w-4" />
                                            </div>
                                            <div className="flex-1 border-b border-white/5 pb-2">
                                                <p className="text-[10px] font-bold uppercase mb-1">{act.u} accessed {act.m}</p>
                                                <p className="text-[9px] font-mono opacity-40 uppercase">{act.t}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className={`${isDarkMode ? "bg-white/5 border-white/10 backdrop-blur-xl" : "bg-black/5 border-black/10 backdrop-blur-xl"} border p-8 h-[320px] flex flex-col items-center justify-center text-center group rounded-[2.5rem]`}>
                                <div className="w-20 h-20 mb-6 bg-white/5 border border-white/10 flex items-center justify-center rounded-[2rem] group-hover:scale-110 transition-transform">
                                    <Zap className="h-8 w-8 opacity-40" />
                                </div>
                                <h3 className="text-sm font-display font-bold mb-3 uppercase tracking-tighter">Usage Pulse</h3>
                                <p className="text-[10px] font-sans opacity-40 leading-relaxed mb-8 max-w-[200px]">Real-time tracking of AI cognitive engines across global sessions.</p>
                                <div className="flex gap-4">
                                    <button className={`px-6 py-2 text-[9px] font-mono uppercase tracking-widest ${isDarkMode ? "bg-white text-black" : "bg-black text-white"} hover:opacity-80 transition-opacity rounded-full`}>View Live</button>
                                    <button className={`px-6 py-2 text-[9px] font-mono uppercase tracking-widest border rounded-full ${isDarkMode ? "border-white/10 hover:bg-white/5" : "border-black/10 hover:bg-black/5"} transition-all`}>Logs</button>
                                </div>
                            </div>
                        </div>

                        {/* Bottom Row Stat Bars */}
                        <div className="grid grid-cols-2 gap-6">
                            <div className={`${isDarkMode ? "bg-white/5 border-white/10 backdrop-blur-xl" : "bg-black/5 border-black/10 backdrop-blur-xl"} border p-8 rounded-[2.5rem]`}>
                                <h3 className="text-[10px] font-mono tracking-[0.3em] opacity-20 uppercase mb-8">Popularity Index</h3>
                                <div className="space-y-8">
                                    {[
                                        { label: "Student Tutor", val: 85 },
                                        { label: "Coding Engine", val: 62 },
                                        { label: "Voice Interview", val: 28 }
                                    ].map((bar, i) => (
                                        <div key={i} className="space-y-3">
                                            <div className="flex justify-between items-end">
                                                <span className="text-[10px] font-bold uppercase">{bar.label}</span>
                                                <span className="text-[10px] font-mono opacity-40">{bar.val}%</span>
                                            </div>
                                            <div className={`h-1 w-full ${isDarkMode ? "bg-white/5" : "bg-black/5"} relative rounded-full overflow-hidden`}>
                                                <div 
                                                    className={`absolute top-0 left-0 h-full ${isDarkMode ? "bg-white" : "bg-black"} transition-all duration-1000 rounded-full`} 
                                                    style={{ width: `${bar.val}%` }} 
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className={`${isDarkMode ? "bg-white/5 border-white/10 backdrop-blur-xl" : "bg-black/5 border-black/10 backdrop-blur-xl"} border p-8 flex items-center justify-center rounded-[2.5rem]`}>
                                <div className="relative w-40 h-40">
                                    <svg className="w-full h-full rotate-[-90deg]">
                                        <circle cx="80" cy="80" r="70" fill="none" stroke={isDarkMode ? "white" : "black"} strokeWidth="20" strokeDasharray="440" strokeDashoffset="120" className="opacity-10" />
                                        <circle cx="80" cy="80" r="70" fill="none" stroke={isDarkMode ? "white" : "black"} strokeWidth="20" strokeDasharray="440" strokeDashoffset="300" />
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-3xl font-display font-black">82%</span>
                                        <span className="text-[8px] font-mono uppercase tracking-[0.2em] opacity-40">Global Engagement</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Tasks & Calendar */}
                    <div className="col-span-12 lg:col-span-3 space-y-6">
                        <div className={`${isDarkMode ? "bg-white/5 border-white/10 backdrop-blur-xl" : "bg-black/5 border-black/10 backdrop-blur-xl"} border p-8 rounded-[2rem]`}>
                            <h3 className="text-xs font-display font-bold uppercase tracking-widest mb-8">User Logs</h3>
                            <div className="space-y-6">
                                {recentDocs.map((doc, i) => (
                                    <div key={i} className="flex gap-4 group cursor-pointer">
                                        <div className={`h-10 w-10 flex-shrink-0 rounded-xl ${isDarkMode ? "bg-white/5 text-white/40" : "bg-black/5 text-black/40"} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                                            <FileText className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold uppercase mb-1 line-clamp-1">{doc.name}</p>
                                            <p className="text-[9px] font-mono opacity-20 uppercase">{doc.time}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className={`${isDarkMode ? "bg-white/5 border-white/10 backdrop-blur-xl" : "bg-black/5 border-black/10 backdrop-blur-xl"} border p-8 rounded-[2rem]`}>
                            <h3 className="text-xs font-display font-bold uppercase tracking-widest mb-8">System Tasks</h3>
                            <div className="space-y-4">
                                {[
                                    { t: "Sync User Database", d: "Today", c: true },
                                    { t: "Update AI Weights", d: "Tomorrow", c: false },
                                    { t: "Review Latency Logs", d: "May 04", c: false }
                                ].map((task, i) => (
                                    <div key={i} className="flex items-center gap-4 group cursor-pointer">
                                        <div className={`h-4 w-4 border rounded ${task.c ? "bg-white border-white" : "border-white/20"} flex items-center justify-center`}>
                                            {task.c && <CheckCircle2 className="h-3 w-3 text-black" />}
                                        </div>
                                        <div className="flex-1">
                                            <p className={`text-[10px] font-medium uppercase ${task.c ? "line-through opacity-20" : ""}`}>{task.t}</p>
                                            <p className="text-[8px] font-mono opacity-20 uppercase">{task.d}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className={`${isDarkMode ? "bg-white/5 border-white/10 backdrop-blur-xl" : "bg-black/5 border-black/10 backdrop-blur-xl"} border p-8 rounded-[2.5rem]`}>
                            <h3 className="text-xs font-display font-bold uppercase tracking-widest mb-8">Deployment Map</h3>
                            <div className="grid grid-cols-7 gap-2 text-center mb-4">
                                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (
                                    <span key={d} className="text-[8px] font-mono opacity-20 font-bold">{d}</span>
                                ))}
                            </div>
                            <div className="grid grid-cols-7 gap-1">
                                {Array.from({ length: 31 }, (_, i) => (
                                    <div 
                                        key={i} 
                                        className={`aspect-square flex items-center justify-center text-[9px] font-mono rounded-lg ${
                                            i + 1 === 24 
                                            ? (isDarkMode ? "bg-white text-black font-bold" : "bg-black text-white font-bold") 
                                            : "hover:bg-white/5 opacity-40"
                                        } transition-colors cursor-pointer`}
                                    >
                                        {i + 1}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                /* Table View */
                <div className="p-8">
                    <div className={`${isDarkMode ? "bg-white/5 border-white/10 backdrop-blur-2xl" : "bg-black/5 border-black/10 backdrop-blur-2xl"} border rounded-[2.5rem] overflow-hidden`}>
                        <div className="p-8 border-b border-white/10 flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-display font-bold uppercase tracking-tight">User Interaction Logs</h2>
                                <p className="text-[10px] font-mono opacity-40 uppercase mt-1 tracking-widest">Complete system data in tabular format</p>
                            </div>
                            <button className={`px-6 py-2 bg-white text-black text-[10px] font-mono uppercase tracking-[0.2em] font-bold hover:opacity-90 transition-all rounded-full`}>
                                Export Data (.CSV)
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className={`${isDarkMode ? "bg-white/5" : "bg-black/5"} text-[10px] font-mono uppercase tracking-[0.3em]`}>
                                        <th className="p-6 font-bold border-r border-white/5">Session ID</th>
                                        <th className="p-6 font-bold border-r border-white/5">User Identity</th>
                                        <th className="p-6 font-bold border-r border-white/5">Cognitive Mode</th>
                                        <th className="p-6 font-bold border-r border-white/5">Tokens Used</th>
                                        <th className="p-6 font-bold border-r border-white/5">Status</th>
                                        <th className="p-6 font-bold">Timestamp</th>
                                    </tr>
                                </thead>
                                <tbody className="text-[11px] font-mono uppercase">
                                    {[
                                        { id: "RX-9912", u: "Mayank_Dev", m: "Student Tutor", t: "1,240", s: "Active", time: "12:44:21" },
                                        { id: "RX-9913", u: "User_Alpha", m: "Coding Engine", t: "4,200", s: "Success", time: "12:45:02" },
                                        { id: "RX-9914", u: "Student_98", m: "Mock Test", t: "890", s: "Success", time: "12:46:15" },
                                        { id: "RX-9915", u: "Edu_Admin", m: "Study Plan", t: "2,100", s: "Processing", time: "12:48:30" },
                                        { id: "RX-9916", u: "User_Beta", m: "Voice Interview", t: "3,400", s: "Success", time: "12:50:11" },
                                        { id: "RX-9917", u: "Dev_Kishore", m: "Coding Engine", t: "5,600", s: "Active", time: "12:52:00" },
                                        { id: "RX-9918", u: "Learning_AI", m: "Student Tutor", t: "1,100", s: "Success", time: "12:55:44" },
                                    ].map((row, i) => (
                                        <tr key={i} className={`border-b border-white/5 hover:bg-white/5 transition-colors group`}>
                                            <td className="p-6 border-r border-white/5 font-bold tracking-widest">{row.id}</td>
                                            <td className="p-6 border-r border-white/5 opacity-60">{row.u}</td>
                                            <td className="p-6 border-r border-white/5">
                                                <span className={`px-3 py-1 rounded-full border ${isDarkMode ? "border-white/20 bg-white/5" : "border-black/20 bg-black/5"} text-[9px]`}>
                                                    {row.m}
                                                </span>
                                            </td>
                                            <td className="p-6 border-r border-white/5 font-bold">{row.t}</td>
                                            <td className="p-6 border-r border-white/5">
                                                <div className="flex items-center gap-2">
                                                    <div className={`h-1.5 w-1.5 rounded-full ${row.s === 'Active' ? 'bg-emerald-500 animate-pulse' : row.s === 'Processing' ? 'bg-amber-500 animate-pulse' : 'bg-white/40'}`} />
                                                    {row.s}
                                                </div>
                                            </td>
                                            <td className="p-6 opacity-40">{row.time}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="p-6 bg-white/5 flex items-center justify-center gap-4">
                            <span className="text-[9px] font-mono opacity-20 uppercase tracking-[0.5em]">End of Audit Trail — Rudranex Ledger v1.0</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Footer Style Decoration */}
            <div className="fixed bottom-8 right-8 flex items-center gap-4 pointer-events-none opacity-20">
                <span className="text-[10px] font-mono tracking-[0.5em] uppercase">Rudranex Terminal v2.0</span>
                <div className="h-[1px] w-12 bg-white" />
            </div>
        </div>
    );
};

export default Dashboard;
