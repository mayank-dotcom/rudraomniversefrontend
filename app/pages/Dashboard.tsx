import React, { useState, useEffect, useMemo } from 'react';
import {
    Search, Bell, Settings, User, Mail, Calendar as CalendarIcon,
    MessageSquare, FileText, PieChart, Activity, Layers,
    MoreHorizontal, Plus, Briefcase, Users, Clock, CheckCircle2,
    ChevronRight, ArrowUpRight, Globe, Shield, Zap, Table as TableIcon, LayoutDashboard,
    ChevronLeft, ChevronRight as ChevronRightIcon, LogOut, Moon, Sun, RefreshCw, Database,
    TrendingUp, ShieldCheck, Cpu
} from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { getAdminUsers, AdminUser, getSubscriptionStatus, updateTokens, getPlansList, updatePlan, Plan, adminLogin } from '@/lib/chat-api';
import { getApiKey, isAdminAuthenticated, setAdminKey, removeAdminKey, isAuthenticated } from '@/lib/auth';
import { toast } from 'sonner';

const PlanCard = ({ plan, isDarkMode, onEdit }: { plan: any, isDarkMode: boolean, onEdit: (plan: any) => void }) => {
    console.log("Rendering plan:", plan);

    return (
        <div
            key={plan.id}
            className={`relative border rounded-[2.5rem] p-8 transition-all hover:scale-105 ${
                plan.is_active
                    ? (isDarkMode ? "border-emerald-500/30 bg-emerald-500/5" : "border-emerald-500/30 bg-emerald-500/5")
                    : (isDarkMode ? "border-white/10 bg-white/5" : "border-black/10 bg-black/5")
            }`}
        >
            {plan.is_active && (
                <div className="absolute top-6 right-6">
                    <span className="px-3 py-1 bg-emerald-500 text-black text-[8px] font-mono uppercase tracking-widest font-bold rounded-full">
                        Active
                    </span>
                </div>
            )}
            
            <div className="absolute top-6 left-6">
                <button
                    onClick={() => onEdit(plan)}
                    className="px-3 py-1 border border-white/10 text-[8px] font-mono uppercase tracking-widest hover:bg-white/5 transition-all rounded-full"
                >
                    Edit
                </button>
            </div>
            
            <div className="mb-8 mt-8">
                <h3 className="text-xl font-display font-black uppercase tracking-tight mb-2">
                    {plan.name || plan.plan_name || 'Unnamed Plan'}
                </h3>
                <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-display font-black">
                        {plan.currency === 'INR' ? '₹' : '$'}{plan.price || plan.price_inr || 0}
                    </span>
                    <span className="text-[10px] font-mono opacity-40 uppercase tracking-widest">
                        /lifetime
                    </span>
                </div>
            </div>
            
            <div className="space-y-4 mb-8 text-[11px]">
                <div className="flex items-center justify-between">
                    <span className="text-[9px] font-mono uppercase tracking-widest opacity-40">Daily Chat</span>
                    <span className="font-bold">{plan.tokens_limit || plan.daily_chat_limit || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-[9px] font-mono uppercase tracking-widest opacity-40">Daily Coding</span>
                    <span className="font-bold">{plan.personas_limit || plan.daily_coding_limit || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-[9px] font-mono uppercase tracking-widest opacity-40">Daily Vision</span>
                    <span className="font-bold">{plan.daily_vision_limit || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-[9px] font-mono uppercase tracking-widest opacity-40">Monthly Images</span>
                    <span className="font-bold">{plan.images_limit || plan.monthly_image_limit || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-[9px] font-mono uppercase tracking-widest opacity-40">Monthly Flux</span>
                    <span className="font-bold">{plan.monthly_flux_limit || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-[9px] font-mono uppercase tracking-widest opacity-40">Daily TTS</span>
                    <span className="font-bold">{plan.daily_tts_limit || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-[9px] font-mono uppercase tracking-widest opacity-40">Daily STT</span>
                    <span className="font-bold">{plan.daily_stt_limit || 0}</span>
                </div>
            </div>
        </div>
    );
};

const ITEMS_PER_PAGE = 10;

const Dashboard = () => {
    const [isDarkMode, setIsDarkMode] = useState(true);
    const [isAuthChecked, setIsAuthChecked] = useState(false);
    const [isUserAuthenticated, setIsUserAuthenticated] = useState(false);
    const [view, setView] = useState<'visual' | 'table' | 'plans'>('visual');
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [isUpdatingTokens, setIsUpdatingTokens] = useState(false);
    const [plans, setPlans] = useState<Plan[]>([]);
    const [showPlans, setShowPlans] = useState(false);
    const [isPlansLoading, setIsPlansLoading] = useState(false);
    const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
    const [isUpdatingPlan, setIsUpdatingPlan] = useState(false);
    const [adminStatus, setAdminStatus] = useState<any>(null);
    const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
    const [loginKey, setLoginKey] = useState('');
    const [showLoginForm, setShowLoginForm] = useState(false);

    useEffect(() => {
        const isAuthed = isAuthenticated();
        setIsUserAuthenticated(isAuthed);
        setIsAdmin(isAdminAuthenticated());
        setIsAuthChecked(true);
    }, []);

    const filteredUsers = useMemo(() => {
        if (!searchQuery.trim()) return users;
        const query = searchQuery.toLowerCase();
        return users.filter(u =>
            u.name.toLowerCase().includes(query) ||
            u.email.toLowerCase().includes(query) ||
            u.id.toLowerCase().includes(query)
        );
    }, [users, searchQuery]);

    const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
    const paginatedUsers = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredUsers.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredUsers, currentPage]);

    const fetchData = async () => {
        setIsRefreshing(true);
        setIsLoading(true);
        setIsPlansLoading(true);
        try {
            const [usersData, statusData, plansData] = await Promise.all([
                getAdminUsers(),
                getSubscriptionStatus(),
                getPlansList()
            ]);

            if (usersData.success && usersData.users) {
                setUsers(usersData.users);
                // Keep the same user selected if they still exist
                if (selectedUser) {
                    const updatedSelected = usersData.users.find(u => u.id === selectedUser.id);
                    if (updatedSelected) setSelectedUser(updatedSelected);
                } else if (usersData.users.length > 0) {
                    setSelectedUser(usersData.users[0]);
                }
            }

            if (statusData.success) {
                setAdminStatus(statusData.subscription);
            }

            if (plansData.success && plansData.plans) {
                console.log("Plans API Response:", plansData);
                // Preserve ALL fields from API, just add missing computed fields
                const mappedPlans = plansData.plans.map((plan: any) => ({
                    ...plan, // Keep all original fields (daily_tts_limit, daily_stt_limit, etc.)
                    name: plan.plan_name || 'Unnamed',
                    price: parseFloat(plan.price_inr) || 0,
                    currency: 'INR',
                    tokens_limit: plan.daily_chat_limit || 0,
                    images_limit: plan.monthly_image_limit || 0,
                    personas_limit: plan.daily_coding_limit || 0,
                    features: [],
                    is_active: true,
                    description: ''
                }));
                console.log("Mapped Plans (complete):", mappedPlans);
                setPlans(mappedPlans);
            }
        } catch (err) {
            console.error("Dashboard Data Fetch Error:", err);
            toast.error("Failed to sync system data.");
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
            setIsPlansLoading(false);
        }
    };

    useEffect(() => {
        if (isAdmin === true) {
            fetchData();
        }
    }, [isAdmin]);

    const handleUpdateTokens = async (userId: string, currentLimit: number) => {
        const newTokens = prompt(`Enter new token limit for user:`, String(currentLimit));
        if (newTokens === null || isNaN(Number(newTokens))) return;

        setIsUpdatingTokens(true);
        try {
            await updateTokens({
                user_id: userId,
                tokens: Number(newTokens)
            });
            toast.success("Token limit updated successfully.");
            await fetchData();
        } catch (err) {
            toast.error("Failed to update tokens: " + (err as Error).message);
        } finally {
            setIsUpdatingTokens(false);
        }
    };

    const handleUpdatePlan = async (planId: string, updates: any) => {
        setIsUpdatingPlan(true);
        try {
            await updatePlan({
                plan_id: planId,
                ...updates
            });
            toast.success("Plan updated successfully.");
            await fetchData();
            setEditingPlan(null);
        } catch (err) {
            toast.error("Failed to update plan: " + (err as Error).message);
        } finally {
            setIsUpdatingPlan(false);
        }
    };

    // Chart Components for real data visualization
    const ProgressCircle = ({ value, limit, label, color }: { value: number, limit: number, label: string, color: string }) => {
        const percentage = limit > 0 ? Math.min(100, (value / limit) * 100) : 0;
        const radius = 44;
        const circumference = 2 * Math.PI * radius;
        const offset = circumference - (percentage / 100) * circumference;

        return (
            <div className="flex flex-col items-center">
                <div className="relative w-32 h-32 mb-4 group">
                    <svg className="w-full h-full rotate-[-90deg]">
                        <circle cx="64" cy="64" r={radius} fill="none" stroke="currentColor" strokeWidth="2" className="text-white/5" />
                        <motion.circle
                            cx="64" cy="64" r={radius} fill="none" stroke={color} strokeWidth="6" strokeLinecap="round"
                            initial={{ strokeDashoffset: circumference }}
                            animate={{ strokeDashoffset: offset }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                            style={{ strokeDasharray: circumference }}
                            className="drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]"
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-2xl font-display font-black leading-none">{percentage.toFixed(0)}%</span>
                        <span className="text-[8px] font-mono opacity-40 uppercase tracking-widest mt-1">Usage</span>
                    </div>
                </div>
                <span className="text-[10px] font-mono uppercase tracking-[0.2em] opacity-40">{label}</span>
                <p className="text-[11px] font-bold mt-1 tracking-tighter">
                    {value.toLocaleString()} / {limit.toLocaleString()}
                </p>
            </div>
        );
    };

    const handleExportCSV = () => {
        if (users.length === 0) {
            toast.error("No data available to export.");
            return;
        }

        const headers = ["ID", "Name", "Email", "Plan", "Status", "Tokens Used", "Tokens Limit", "Images Used", "Images Limit"];
        const csvRows = users.map(u => [
            u.id,
            u.name,
            u.email,
            u.subscription.plan,
            u.subscription.status,
            u.subscription.tokens_used,
            u.subscription.tokens_limit,
            u.subscription.images_used,
            u.subscription.images_limit
        ].map(val => `"${val}"`).join(","));

        const csvContent = [headers.join(","), ...csvRows].join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `rudranex_users_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Transaction logs exported successfully.");
    };

    const StatCard = ({ title, value, icon: Icon, color, subtext }: { title: string, value: string | number, icon: any, color: string, subtext?: string }) => (
        <div className={`relative overflow-hidden group border ${isDarkMode ? "bg-white/5 border-white/10" : "bg-black/5 border-black/10"} p-6 rounded-[2rem] transition-all hover:bg-white/10`}>
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Icon className="h-12 w-12" />
            </div>
            <span className="text-[9px] font-mono uppercase tracking-[0.3em] opacity-40">{title}</span>
            <div className="flex items-baseline gap-2 mt-2">
                <h4 className="text-2xl font-display font-black tracking-tight">{value}</h4>
                {subtext && <span className="text-[10px] font-mono opacity-30">{subtext}</span>}
            </div>
            <div className={`h-[2px] w-8 mt-4 rounded-full`} style={{ backgroundColor: color }} />
        </div>
    );

    const handleAdminLogin = async (key: string) => {
        const trimmedKey = key.trim();
        if (!trimmedKey) return;

        console.log("[Admin Login] Attempting authentication...");
        setIsLoading(true);
        try {
            const res = await adminLogin(trimmedKey);
            console.log("[Admin Login] Response received:", res);
            if (res.success || res.ok) {
                setAdminKey(trimmedKey);
                setIsAdmin(true);
                toast.success("Access Granted. Initializing Admin ...");
            } else {
                throw new Error(res.error || "Authentication failed");
            }
        } catch (err) {
            console.error("[Admin Login] Error:", err);
            toast.error("Access Denied: " + (err as Error).message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAdminLogout = () => {
        removeAdminKey();
        setIsAdmin(false);
        toast.info("Admin Session Terminated.");
    };

    if (!isAuthChecked || isAdmin === null) {
        return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
            <div className="h-8 w-8 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
        </div>;
    }

    if (!isUserAuthenticated) {
        return (
            <div className={`min-h-screen w-full ${isDarkMode ? "bg-[#0a0a0a] text-white" : "bg-white text-black"} flex flex-col items-center justify-center p-6 text-center`}>
                <div className={`absolute inset-0 noise opacity-[0.03] pointer-events-none ${isDarkMode ? "" : "invert"}`} />
                <div className="relative z-10 space-y-6">
                    <div className="h-20 w-20 bg-white/5 border border-white/10 rounded-[2rem] flex items-center justify-center mx-auto mb-8">
                        <Shield className="h-10 w-10 opacity-20" />
                    </div>
                    <h2 className="text-4xl font-display font-black tracking-tighter uppercase">Authentication Required</h2>
                    <p className="text-xs font-mono opacity-40 uppercase tracking-[0.3em] max-w-sm mx-auto">Please sign in to your Rudranex account to access administrative features.</p>
                    <Link href="/">
                        <button className="mt-8 px-10 py-4 bg-white text-black text-[10px] font-mono uppercase tracking-[0.3em] font-black rounded-2xl hover:scale-105 active:scale-95 transition-all">
                            Back to Core
                        </button>
                    </Link>
                </div>
            </div>
        );
    }

    if (isAdmin === false) {
        return (
            <div className={`min-h-screen w-full ${isDarkMode ? "bg-[#0a0a0a] text-white" : "bg-white text-black"} flex items-center justify-center p-6`}>
                <div className={`absolute inset-0 noise opacity-[0.03] pointer-events-none ${isDarkMode ? "" : "invert"}`} />
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`max-w-md w-full border ${isDarkMode ? "bg-white/5 border-white/10" : "bg-black/5 border-black/10"} p-12 rounded-[3rem] backdrop-blur-3xl relative overflow-hidden`}
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-[60px] rounded-full" />

                    <div className="flex flex-col items-center text-center mb-10">
                        <div className="h-16 w-16 bg-emerald-500 rounded-3xl flex items-center justify-center text-black mb-6 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                            <ShieldCheck className="h-8 w-8" />
                        </div>
                        <h2 className="text-3xl font-display font-black tracking-tighter uppercase mb-2">Admin Access</h2>
                        <p className="text-[10px] font-mono opacity-40 uppercase tracking-[0.3em]">Authorized Personnel Only</p>
                    </div>

                    <form onSubmit={(e) => {
                        e.preventDefault();
                        handleAdminLogin(loginKey);
                    }} className="space-y-6">
                        <div className="relative group">
                            <Shield className={`absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 transition-all ${isDarkMode ? "text-white/20 group-focus-within:text-emerald-500" : "text-black/20 group-focus-within:text-emerald-500"}`} />
                            <input
                                value={loginKey}
                                onChange={(e) => setLoginKey(e.target.value)}
                                type="password"
                                placeholder="ENTER X-ADMIN-KEY"
                                required
                                className={`w-full pl-12 pr-6 py-4 text-xs font-mono tracking-widest ${isDarkMode ? "bg-white/5 border-white/5" : "bg-black/5 border-black/5"} border rounded-2xl focus:outline-none focus:border-emerald-500/50 transition-all placeholder:opacity-20`}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-4 bg-white text-black text-[10px] font-mono uppercase tracking-[0.3em] font-black hover:scale-[1.02] active:scale-[0.98] transition-all rounded-2xl shadow-xl disabled:opacity-50"
                        >
                            {isLoading ? "AUTHENTICATING..." : "ESTABLISHING"}
                        </button>
                    </form>

                    <div className="mt-8 pt-8 border-t border-white/5 flex items-center justify-center gap-2 opacity-20">
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[8px] font-mono uppercase tracking-widest">Secure Handshake Protocol</span>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className={`h-screen w-full ${isDarkMode ? "bg-[#0a0a0a] text-white" : "bg-white text-black"} font-sans selection:bg-white selection:text-black overflow-hidden flex flex-col transition-colors duration-500`}>
            <div className={`absolute inset-0 noise opacity-[0.03] pointer-events-none ${isDarkMode ? "" : "invert"}`} />

            {/* Top Navigation */}
            <nav className={`h-20 flex items-center justify-between px-10 border-b ${isDarkMode ? "border-white/5 bg-[#0a0a0a]/80" : "border-black/5 bg-white/80"} backdrop-blur-2xl sticky top-0 z-[100]`}>
                <div className="flex items-center gap-12">
                    <Link href="/" className="flex items-center gap-4 group">
                        <div className={`h-6 w-6 ${isDarkMode ? "bg-white" : "bg-black"} flex items-center justify-center transition-transform group-hover:rotate-45`}>
                            <div className={`h-1.5 w-1.5 ${isDarkMode ? "bg-black" : "bg-white"}`} />
                        </div>
                        <div className="flex items-baseline gap-1">
                            <span className="font-display font-black tracking-tighter text-xl">RUDRANEX</span>
                            <span className="font-serif italic opacity-40 text-xl tracking-tighter">admin</span>
                        </div>
                    </Link>

                    <div className="hidden lg:flex items-center gap-8">
                        <button
                            onClick={() => setView('visual')}
                            className={`flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.2em] transition-all ${view === 'visual' ? "text-emerald-400 font-bold" : "opacity-40 hover:opacity-100"}`}
                        >
                            <LayoutDashboard className="h-3.5 w-3.5" /> Dashboard
                        </button>
                        <button
                            onClick={() => setView('table')}
                            className={`flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.2em] transition-all ${view === 'table' ? "text-emerald-400 font-bold" : "opacity-40 hover:opacity-100"}`}
                        >
                            <TableIcon className="h-3.5 w-3.5" /> Table Logs
                        </button>
                        <button
                            onClick={() => setView('plans')}
                            className={`flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.2em] transition-all ${view === 'plans' ? "text-emerald-400 font-bold" : "opacity-40 hover:opacity-100"}`}
                        >
                            <Zap className="h-3.5 w-3.5" /> Plans
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    {!isAdmin && (
                        <button
                            onClick={() => setShowLoginForm(true)}
                            className="px-4 py-2 border border-amber-500/30 text-amber-500 text-[10px] font-mono uppercase tracking-[0.2em] hover:bg-amber-500/10 transition-all rounded-full flex items-center gap-2"
                        >
                            <ShieldCheck className="h-3.5 w-3.5" />
                            Authenticate
                        </button>
                    )}

                    <button
                        onClick={fetchData}
                        disabled={isRefreshing}
                        className={`p-2 rounded-full border border-white/10 hover:bg-white/5 transition-all ${isRefreshing ? "animate-spin" : ""}`}
                    >
                        <RefreshCw className="h-4 w-4 opacity-40" />
                    </button>

                    <div className="h-8 w-[1px] bg-white/10 mx-2" />

                    <div className="flex items-center gap-4">
                        <div
                            onClick={() => setIsDarkMode(!isDarkMode)}
                            className={`h-10 w-10 rounded-2xl border flex items-center justify-center cursor-pointer transition-all ${isDarkMode ? "border-white/10 hover:bg-white/5" : "border-black/10 hover:bg-black/5"}`}
                        >
                            {isDarkMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                        </div>
                        <div
                            onClick={handleAdminLogout}
                            className="h-10 w-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center group cursor-pointer overflow-hidden hover:bg-amber-500 transition-all"
                        >
                            <LogOut className="h-4 w-4 text-amber-500 group-hover:text-black transition-colors" />
                        </div>
                    </div>
                </div>
            </nav>

            <main className="flex-1 overflow-y-auto p-10 relative z-10 w-full max-w-[1800px] mx-auto custom-scrollbar">
                <AnimatePresence mode="wait">
                    {view === 'visual' && (
                        <motion.div
                            key="visual"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="grid grid-cols-12 gap-8"
                        >
                            {/* Left Panel: Users List */}
                            <div className="col-span-12 lg:col-span-3 space-y-8">
                                <div className={`border ${isDarkMode ? "bg-white/5 border-white/10" : "bg-black/5 border-black/10"} p-8 rounded-[2.5rem] backdrop-blur-xl`}>
                                    <div className="flex items-center justify-between mb-8">
                                        <h3 className="text-xs font-display font-black uppercase tracking-[0.2em]">System Users</h3>
                                        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                    </div>

                                    <div className="relative mb-6">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 opacity-20" />
                                        <input
                                            type="text"
                                            placeholder="SEARCH ID / NAME..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className={`w-full pl-11 pr-4 py-3 text-[10px] font-mono tracking-widest ${isDarkMode ? "bg-white/5 border-white/5" : "bg-black/5 border-black/5"} border rounded-2xl focus:outline-none focus:border-emerald-500/50 transition-all`}
                                        />
                                    </div>

                                    <div className="space-y-2 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
                                        {isLoading ? (
                                            Array.from({ length: 5 }).map((_, i) => (
                                                <div key={i} className="h-12 w-full animate-pulse bg-white/5 rounded-xl" />
                                            ))
                                        ) : (
                                            filteredUsers.map((user) => (
                                                <button
                                                    key={user.id}
                                                    onClick={() => setSelectedUser(user)}
                                                    className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all group ${selectedUser?.id === user.id
                                                        ? "bg-emerald-500 text-black font-bold shadow-[0_10px_30px_rgba(16,185,129,0.2)]"
                                                        : (isDarkMode ? "hover:bg-white/5" : "hover:bg-black/5")
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-4 text-left">
                                                        <div className={`h-8 w-8 rounded-full border flex items-center justify-center ${selectedUser?.id === user.id ? "border-black/20" : "border-white/10"}`}>
                                                            <User className="h-3.5 w-3.5" />
                                                        </div>
                                                        <div className="flex flex-col min-w-0">
                                                            <span className="text-[11px] font-bold truncate tracking-tight">{user.name}</span>
                                                            <span className={`text-[9px] font-mono uppercase opacity-40 truncate ${selectedUser?.id === user.id ? "text-black" : ""}`}>{user.subscription.plan}</span>
                                                        </div>
                                                    </div>
                                                    <ChevronRight className={`h-3.5 w-3.5 transition-transform ${selectedUser?.id === user.id ? "translate-x-1" : "opacity-0 group-hover:opacity-100"}`} />
                                                </button>
                                            ))
                                        )}
                                    </div>
                                </div>

                                <div className={`border ${isDarkMode ? "bg-white/5 border-white/10" : "bg-black/5 border-black/10"} p-8 rounded-[2.5rem] backdrop-blur-xl text-center`}>
                                    <Database className="h-8 w-8 mx-auto mb-4 opacity-20" />
                                    <h4 className="text-[10px] font-mono uppercase tracking-[0.3em] opacity-40">System Core</h4>
                                    <p className="text-xs font-bold mt-2">Active Node: IND-01</p>
                                </div>
                            </div>

                            {/* Center Panel: Analytics */}
                            <div className="col-span-12 lg:col-span-9 space-y-8">
                                {selectedUser ? (
                                    <>
                                        {/* User Identity Header */}
                                        <div className={`border ${isDarkMode ? "bg-white/5 border-white/10" : "bg-black/5 border-black/10"} p-10 rounded-[3rem] relative overflow-hidden`}>
                                            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[100px] rounded-full" />
                                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10">
                                                <div className="flex items-center gap-8">
                                                    <div className="h-24 w-24 rounded-[2rem] bg-emerald-500 flex items-center justify-center text-black">
                                                        <User className="h-10 w-10" />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-3 mb-2">
                                                            <h2 className="text-4xl font-display font-black tracking-tighter">{selectedUser.name}</h2>
                                                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-mono uppercase tracking-widest ${selectedUser.subscription.status === 'active' ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-amber-500/20 text-amber-400 border border-amber-500/30"}`}>
                                                                {selectedUser.subscription.status}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm font-mono opacity-40 flex items-center gap-2 uppercase tracking-widest">
                                                            <Mail className="h-3.5 w-3.5" /> {selectedUser.email}
                                                        </p>
                                                        <p className="text-[10px] font-mono opacity-20 mt-1 uppercase tracking-widest">UUID: {selectedUser.id}</p>
                                                    </div>
                                                </div>
                                                <div className="flex flex-wrap items-center gap-4">
                                                    <button
                                                        onClick={() => handleUpdateTokens(selectedUser.id, selectedUser.subscription.tokens_limit)}
                                                        disabled={isUpdatingTokens}
                                                        className="px-8 py-4 bg-white text-black text-[10px] font-mono uppercase tracking-[0.2em] font-bold hover:scale-105 active:scale-95 transition-all rounded-2xl flex items-center gap-3"
                                                    >
                                                        <Zap className="h-4 w-4" /> {isUpdatingTokens ? 'UPDATING...' : 'MANAGE TOKENS'}
                                                    </button>
                                                    <button className="px-8 py-4 border border-white/10 text-[10px] font-mono uppercase tracking-[0.2em] font-bold hover:bg-white/5 transition-all rounded-2xl">
                                                        RESET ACCOUNT
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Core Metrics Grid */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                            <StatCard
                                                title="Subscription Plan"
                                                value={selectedUser.subscription.plan.toUpperCase()}
                                                icon={Briefcase}
                                                color="#10b981"
                                                subtext="Active"
                                            />
                                            <StatCard
                                                title="System Latency"
                                                value={selectedUser.subscription.latency_ms}
                                                icon={Activity}
                                                color="#3b82f6"
                                                subtext="ms"
                                            />
                                            <StatCard
                                                title="Total Personas"
                                                value={selectedUser.subscription.personas_used}
                                                icon={Users}
                                                color="#f59e0b"
                                                subtext={`/ ${selectedUser.subscription.personas_limit}`}
                                            />
                                            <StatCard
                                                title="Image Generation"
                                                value={selectedUser.subscription.images_used}
                                                icon={PieChart}
                                                color="#8b5cf6"
                                                subtext={`/ ${selectedUser.subscription.images_limit}`}
                                            />
                                        </div>

                                        {/* Visualization Section */}
                                        <div className="grid grid-cols-12 gap-8">
                                            <div className={`col-span-12 lg:col-span-8 border ${isDarkMode ? "bg-white/5 border-white/10" : "bg-black/5 border-black/10"} p-10 rounded-[3rem]`}>
                                                <div className="flex items-center justify-between mb-12">
                                                    <div>
                                                        <h3 className="text-lg font-display font-black tracking-tight uppercase">Resource Utilization</h3>
                                                        <p className="text-[10px] font-mono opacity-40 uppercase tracking-[0.3em] mt-1">Live spectral analysis of user assets</p>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <div className="flex items-center gap-2">
                                                            <div className="h-2 w-2 rounded-full bg-emerald-500" />
                                                            <span className="text-[9px] font-mono uppercase tracking-widest opacity-40">Healthy</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex flex-wrap justify-center gap-16 lg:justify-between px-6">
                                                    <ProgressCircle
                                                        value={selectedUser.subscription.tokens_used}
                                                        limit={selectedUser.subscription.tokens_limit}
                                                        label="Token Delta"
                                                        color="#10b981"
                                                    />
                                                    <ProgressCircle
                                                        value={selectedUser.subscription.images_used}
                                                        limit={selectedUser.subscription.images_limit}
                                                        label="Image Buffer"
                                                        color="#8b5cf6"
                                                    />
                                                    <ProgressCircle
                                                        value={selectedUser.subscription.personas_used}
                                                        limit={selectedUser.subscription.personas_limit}
                                                        label="Persona Load"
                                                        color="#f59e0b"
                                                    />
                                                </div>
                                            </div>

                                            <div className={`col-span-12 lg:col-span-4 border ${isDarkMode ? "bg-white/5 border-white/10" : "bg-black/5 border-black/10"} p-10 rounded-[3rem] flex flex-col justify-between`}>
                                                <div>
                                                    <div className="flex items-center gap-3 mb-6">
                                                        <TrendingUp className="h-5 w-5 text-emerald-400" />
                                                        <h3 className="text-xs font-display font-black uppercase tracking-[0.2em]">User Efficiency</h3>
                                                    </div>
                                                    <p className="text-[10px] font-mono opacity-40 uppercase leading-relaxed tracking-widest">
                                                        Current user is operating at <b>{(100 - (selectedUser.subscription.tokens_used / selectedUser.subscription.tokens_limit * 100)).toFixed(1)}%</b> headroom. Latency is optimal for region.
                                                    </p>
                                                </div>

                                                <div className="space-y-4 mt-8">
                                                    <div className="flex justify-between items-center text-[10px] font-mono opacity-40 tracking-widest">
                                                        <span>SECURITY</span>
                                                        <span>ENCRYPTED</span>
                                                    </div>
                                                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                                        <motion.div
                                                            className="h-full bg-emerald-500"
                                                            initial={{ width: 0 }}
                                                            animate={{ width: "100%" }}
                                                            transition={{ duration: 2 }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="h-[600px] flex items-center justify-center flex-col text-center opacity-20">
                                        <Cpu className="h-24 w-24 mb-6" />
                                        <h2 className="text-2xl font-display font-black uppercase tracking-[0.5em]">Syncing Neural Net...</h2>
                                        <p className="text-xs font-mono uppercase tracking-[0.3em] mt-4">Select a user node to initialize data </p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                    
                    {view === 'table' && (
                        <motion.div
                            key="table"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            className={`border ${isDarkMode ? "bg-white/5 border-white/10" : "bg-black/5 border-black/10"} rounded-[3rem] overflow-hidden backdrop-blur-3xl`}
                        >
                            <div className="p-10 border-b border-white/5 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                                <div>
                                    <h2 className="text-3xl font-display font-black tracking-tight uppercase">User Transaction Logs</h2>
                                    <p className="text-[10px] font-mono opacity-40 uppercase mt-2 tracking-[0.4em]">Full system registry • {users.length} active nodes</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="relative">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 opacity-20" />
                                        <input
                                            type="text"
                                            placeholder="FILTER LOGS..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className={`pl-11 pr-8 py-3 text-[10px] font-mono tracking-widest ${isDarkMode ? "bg-white/5 border-white/10" : "bg-black/5 border-black/10"} border rounded-2xl focus:outline-none focus:border-emerald-500/50 min-w-[300px]`}
                                        />
                                    </div>
                                    <button
                                        onClick={handleExportCSV}
                                        className="px-6 py-3.5 bg-white text-black text-[10px] font-mono uppercase tracking-[0.2em] font-bold hover:opacity-90 transition-all rounded-2xl"
                                    >
                                        Export CSV
                                    </button>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className={`${isDarkMode ? "bg-white/5" : "bg-black/5"} text-[9px] font-mono uppercase tracking-[0.3em] opacity-40`}>
                                            <th className="p-8 font-bold border-b border-white/5">Identity</th>
                                            <th className="p-8 font-bold border-b border-white/5">Subscription</th>
                                            <th className="p-8 font-bold border-b border-white/5 text-center">Resources</th>
                                            <th className="p-8 font-bold border-b border-white/5">Uptime / Latency</th>
                                            <th className="p-8 font-bold border-b border-white/5 text-right">Administrative</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-[11px] font-mono uppercase tracking-tight">
                                        {isLoading ? (
                                            Array.from({ length: 5 }).map((_, i) => (
                                                <tr key={i} className="animate-pulse opacity-20">
                                                    <td colSpan={5} className="p-8 border-b border-white/5 h-16 bg-white/5" />
                                                </tr>
                                            ))
                                        ) : paginatedUsers.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="p-20 text-center opacity-20 font-display font-black text-2xl uppercase tracking-[1em]">Void Found</td>
                                            </tr>
                                        ) : (
                                            paginatedUsers.map((user) => (
                                                <tr key={user.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                                                    <td className="p-8">
                                                        <div className="flex items-center gap-4">
                                                            <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                                                                <User className="h-4 w-4 opacity-40" />
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="text-[13px] font-bold tracking-tight">{user.name}</span>
                                                                <span className="text-[9px] opacity-30 lowercase font-sans">{user.email}</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-8">
                                                        <div className="flex flex-col gap-1.5">
                                                            <span className={`text-[10px] font-black w-fit px-2 py-0.5 rounded border ${user.subscription.plan === 'pro' ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/5" : "border-white/10 opacity-60"}`}>
                                                                {user.subscription.plan}
                                                            </span>
                                                            <div className="flex items-center gap-2">
                                                                <div className={`h-1 w-1 rounded-full ${user.subscription.status === 'active' ? "bg-emerald-500" : "bg-amber-500"}`} />
                                                                <span className="text-[9px] opacity-40">{user.subscription.status}</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-8">
                                                        <div className="flex flex-col gap-3 max-w-[200px] mx-auto">
                                                            <div className="flex justify-between text-[9px] opacity-40">
                                                                <span>TOKENS</span>
                                                                <span>{((user.subscription.tokens_used / user.subscription.tokens_limit) * 100).toFixed(0)}%</span>
                                                            </div>
                                                            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                                                <div className="h-full bg-white/20" style={{ width: `${(user.subscription.tokens_used / user.subscription.tokens_limit) * 100}%` }} />
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-8">
                                                        <div className="flex items-center gap-2">
                                                            <Activity className="h-3 w-3 text-emerald-500/50" />
                                                            <span className="font-bold">{user.subscription.latency_ms}</span>
                                                            <span className="text-[9px] opacity-30">MS</span>
                                                        </div>
                                                    </td>
                                                    <td className="p-8 text-right">
                                                        <button
                                                            onClick={() => {
                                                                setSelectedUser(user);
                                                                setView('visual');
                                                            }}
                                                            className="px-5 py-2.5 border border-white/5 hover:border-white/20 hover:bg-white/5 transition-all text-[9px] font-bold tracking-widest rounded-xl"
                                                        >
                                                            Visualize
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination Controls */}
                            <div className={`p-8 ${isDarkMode ? "bg-white/5" : "bg-black/5"} flex items-center justify-between`}>
                                <div className="flex items-center gap-4 text-[9px] font-mono opacity-40 tracking-[0.3em] uppercase">
                                    <Database className="h-4 w-4" />
                                    <span>Page {currentPage} // {totalPages || 1}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        className="p-3 border border-white/10 rounded-xl disabled:opacity-20 hover:bg-white/5 transition-all"
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </button>
                                    <div className="flex gap-2">
                                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                                            .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                                            .map((pageNum, i, arr) => (
                                                <React.Fragment key={pageNum}>
                                                    {i > 0 && arr[i - 1] !== pageNum - 1 && <span className="opacity-20 px-2">...</span>}
                                                    <button
                                                        onClick={() => setCurrentPage(pageNum)}
                                                        className={`h-10 w-10 text-[10px] font-mono rounded-xl transition-all ${currentPage === pageNum
                                                            ? 'bg-white text-black font-black'
                                                            : 'hover:bg-white/5 opacity-40'
                                                            }`}
                                                    >
                                                        {pageNum}
                                                    </button>
                                                </React.Fragment>
                                            ))
                                        }
                                    </div>
                                    <button
                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages || totalPages === 0}
                                        className="p-3 border border-white/10 rounded-xl disabled:opacity-20 hover:bg-white/5 transition-all"
                                    >
                                        <ChevronRightIcon className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                    
                    {/* Plans View */}
                    {view === 'plans' && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="p-10"
                        >
                            <div className={`border ${isDarkMode ? "bg-white/5 border-white/10" : "bg-black/5 border-black/10"} rounded-[3rem] overflow-hidden backdrop-blur-3xl`}>
                                <div className="p-10 border-b border-white/10 flex items-center justify-between">
                                    <div>
                                        <h2 className="text-3xl font-display font-black tracking-tight uppercase">Plans & Pricing</h2>
                                        <p className="text-[10px] font-mono opacity-40 uppercase mt-2 tracking-[0.4em]">System-wide subscription tiers</p>
                                    </div>
                                    <button
                                        onClick={fetchData}
                                        disabled={isPlansLoading}
                                        className={`p-3 rounded-full border border-white/10 hover:bg-white/5 transition-all ${isPlansLoading ? "animate-spin" : ""}`}
                                    >
                                        <RefreshCw className="h-4 w-4 opacity-40" />
                                    </button>
                                </div>
                                
                                <div className="p-10">
                                    {isPlansLoading ? (
                                        <div className="text-center py-20 text-[10px] font-mono uppercase tracking-widest opacity-40">
                                            Loading plans...
                                        </div>
                                    ) : plans.length === 0 ? (
                                        <div className="text-center py-20 text-[10px] font-mono uppercase tracking-widest opacity-40">
                                            No plans found
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                            {plans.map((plan, index) => (
                                                <PlanCard key={plan.id || index} plan={plan} isDarkMode={isDarkMode} onEdit={setEditingPlan} />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            {/* Edit Plan Modal */}
            {editingPlan && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={`relative w-full max-w-xl max-h-[80vh] overflow-y-auto border ${isDarkMode ? "bg-[#0a0a0a] border-white/10" : "bg-white border-black/10"} p-6 rounded-[2rem]`}
                    >
                        <button
                            onClick={() => setEditingPlan(null)}
                            className="absolute top-4 right-4 text-[10px] font-mono uppercase tracking-widest opacity-40 hover:opacity-100"
                        >
                            Close
                        </button>
                        
                        <h2 className="text-xl font-display font-black uppercase tracking-tight mb-6">Edit Plan</h2>
                        
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            const formData = new FormData(e.target as HTMLFormElement);
                            handleUpdatePlan(editingPlan.id?.toString() || '', {
                                plan_name: formData.get('plan_name') as string,
                                price_inr: Number(formData.get('price_inr')),
                                daily_chat_limit: Number(formData.get('daily_chat_limit')),
                                daily_coding_limit: Number(formData.get('daily_coding_limit')),
                                daily_vision_limit: Number(formData.get('daily_vision_limit')),
                                monthly_image_limit: Number(formData.get('monthly_image_limit')),
                                monthly_flux_limit: Number(formData.get('monthly_flux_limit')),
                                daily_tts_limit: Number(formData.get('daily_tts_limit')),
                                daily_stt_limit: Number(formData.get('daily_stt_limit'))
                            });
                        }} className="space-y-4">
                            <div>
                                <label className="text-[9px] font-mono uppercase tracking-widest opacity-40">Plan Name</label>
                                <input
                                    name="plan_name"
                                    defaultValue={editingPlan.plan_name || editingPlan.name || ''}
                                    required
                                    className={`w-full mt-1 p-3 text-xs font-mono ${isDarkMode ? "bg-white/5 border-white/10" : "bg-black/5 border-black/10"} border rounded-xl focus:outline-none focus:border-emerald-500/50`}
                                />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[9px] font-mono uppercase tracking-widest opacity-40">Price (INR)</label>
                                    <input
                                        name="price_inr"
                                        type="number"
                                        defaultValue={editingPlan.price_inr || editingPlan.price || 0}
                                        required
                                        className={`w-full mt-1 p-3 text-xs font-mono ${isDarkMode ? "bg-white/5 border-white/10" : "bg-black/5 border-black/10"} border rounded-xl focus:outline-none focus:border-emerald-500/50`}
                                    />
                                </div>
                                <div>
                                    <label className="text-[9px] font-mono uppercase tracking-widest opacity-40">Daily Chat</label>
                                    <input
                                        name="daily_chat_limit"
                                        type="number"
                                        defaultValue={editingPlan.daily_chat_limit || editingPlan.tokens_limit || 0}
                                        className={`w-full mt-1 p-3 text-xs font-mono ${isDarkMode ? "bg-white/5 border-white/10" : "bg-black/5 border-black/10"} border rounded-xl focus:outline-none focus:border-emerald-500/50`}
                                    />
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[9px] font-mono uppercase tracking-widest opacity-40">Daily Coding</label>
                                    <input
                                        name="daily_coding_limit"
                                        type="number"
                                        defaultValue={editingPlan.daily_coding_limit || editingPlan.personas_limit || 0}
                                        className={`w-full mt-1 p-3 text-xs font-mono ${isDarkMode ? "bg-white/5 border-white/10" : "bg-black/5 border-black/10"} border rounded-xl focus:outline-none focus:border-emerald-500/50`}
                                    />
                                </div>
                                <div>
                                    <label className="text-[9px] font-mono uppercase tracking-widest opacity-40">Daily Vision</label>
                                    <input
                                        name="daily_vision_limit"
                                        type="number"
                                        defaultValue={editingPlan.daily_vision_limit || 0}
                                        className={`w-full mt-1 p-3 text-xs font-mono ${isDarkMode ? "bg-white/5 border-white/10" : "bg-black/5 border-black/10"} border rounded-xl focus:outline-none focus:border-emerald-500/50`}
                                    />
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[9px] font-mono uppercase tracking-widest opacity-40">Monthly Images</label>
                                    <input
                                        name="monthly_image_limit"
                                        type="number"
                                        defaultValue={editingPlan.monthly_image_limit || editingPlan.images_limit || 0}
                                        className={`w-full mt-1 p-3 text-xs font-mono ${isDarkMode ? "bg-white/5 border-white/10" : "bg-black/5 border-black/10"} border rounded-xl focus:outline-none focus:border-emerald-500/50`}
                                    />
                                </div>
                                <div>
                                    <label className="text-[9px] font-mono uppercase tracking-widest opacity-40">Monthly Flux</label>
                                    <input
                                        name="monthly_flux_limit"
                                        type="number"
                                        defaultValue={editingPlan.monthly_flux_limit || 0}
                                        className={`w-full mt-1 p-3 text-xs font-mono ${isDarkMode ? "bg-white/5 border-white/10" : "bg-black/5 border-black/10"} border rounded-xl focus:outline-none focus:border-emerald-500/50`}
                                    />
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[9px] font-mono uppercase tracking-widest opacity-40">Daily TTS</label>
                                    <input
                                        name="daily_tts_limit"
                                        type="number"
                                        defaultValue={editingPlan.daily_tts_limit || 0}
                                        className={`w-full mt-1 p-3 text-xs font-mono ${isDarkMode ? "bg-white/5 border-white/10" : "bg-black/5 border-black/10"} border rounded-xl focus:outline-none focus:border-emerald-500/50`}
                                    />
                                </div>
                                <div>
                                    <label className="text-[9px] font-mono uppercase tracking-widest opacity-40">Daily STT</label>
                                    <input
                                        name="daily_stt_limit"
                                        type="number"
                                        defaultValue={editingPlan.daily_stt_limit || 0}
                                        className={`w-full mt-1 p-3 text-xs font-mono ${isDarkMode ? "bg-white/5 border-white/10" : "bg-black/5 border-black/10"} border rounded-xl focus:outline-none focus:border-emerald-500/50`}
                                    />
                                </div>
                            </div>
                            
                            <button
                                type="submit"
                                disabled={isUpdatingPlan}
                                className="w-full py-3 bg-emerald-500 text-black text-[10px] font-mono uppercase tracking-[0.3em] font-bold hover:scale-[1.02] transition-all rounded-xl disabled:opacity-50"
                            >
                                {isUpdatingPlan ? "UPDATING..." : "UPDATE PLAN"}
                            </button>
                        </form>
                    </motion.div>
                </div>
            )}

            {/* Footer Style Decoration */}
            <div className="fixed bottom-10 left-10 flex items-center gap-4 pointer-events-none opacity-10">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-mono tracking-[0.5em] uppercase">R_CORE_STABLE // NO_VULN</span>
            </div>
        </div>
    );
};

export default Dashboard;
