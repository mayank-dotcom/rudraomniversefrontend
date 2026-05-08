import React, { useState, useEffect, useMemo } from 'react';
import {
    Search, Bell, Settings, User, Mail, Calendar as CalendarIcon,
    MessageSquare, FileText, PieChart, Activity, Layers,
    MoreHorizontal, Plus, Briefcase, Users, Clock, CheckCircle2,
    ChevronRight, ArrowUpRight, Globe, Shield, Zap, Table as TableIcon, LayoutDashboard,
    ChevronLeft, ChevronRight as ChevronRightIcon, LogOut, Moon, Sun, RefreshCw, Database,
    TrendingUp, ShieldCheck, Cpu, X
} from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { getAdminUsers, AdminUser, getSubscriptionStatus, updateTokens, getPlansList, updatePlan, createPlan, Plan, adminLoginWithCredentials, loginByAdminCode, createSchoolAdmin } from '@/lib/chat-api';
import { isAdminAuthenticated, setAdminKey, removeAdminKey, setApiKey } from '@/lib/auth';
import { toast } from 'sonner';

const PlanCard = ({ plan, isDarkMode, onEdit }: { plan: any, isDarkMode: boolean, onEdit: (plan: any) => void }) => {
    return (
        <div
            className={`relative border rounded-[2.5rem] p-8 transition-all hover:scale-105 overflow-hidden group ${
                isDarkMode
                    ? (plan.is_active ? "border-emerald-500/30 bg-gradient-to-br from-zinc-900 via-black to-zinc-900" : "border-zinc-800/50 bg-gradient-to-br from-zinc-900 via-black to-zinc-900")
                    : (plan.is_active ? "border-emerald-500/30 bg-gradient-to-br from-zinc-100 via-white to-zinc-100" : "border-zinc-800/50 bg-gradient-to-br from-zinc-100 via-white to-zinc-100")
            }`}
        >
            <div className={`absolute inset-0 bg-[linear-gradient(110deg,transparent_0%,rgba(255,255,255,0.03)_45%,rgba(255,255,255,0.06)_50%,rgba(255,255,255,0.03)_55%,transparent_100%)] pointer-events-none`} />
            <div className="absolute inset-0 -translate-y-full group-hover:translate-y-full transition-transform duration-1000 bg-gradient-to-b from-transparent via-white/5 to-transparent pointer-events-none" />
            <div className="flex items-center justify-between mb-4">
                <h3 className={`text-lg font-display font-black ${isDarkMode ? "text-white" : "text-black"}`}>{plan.plan_name || plan.name}</h3>
                {plan.is_active && <span className="text-[9px] font-mono uppercase tracking-widest text-emerald-400">Active</span>}
            </div>
            <p className={`text-3xl font-display font-black mb-6 ${isDarkMode ? "text-white" : "text-black"}`}>₹{plan.price_inr || plan.price}</p>

            <div className={`space-y-2 mb-6 text-[10px] font-mono ${isDarkMode ? "text-white/60" : "text-black/60"}`}>
                <div className="flex justify-between">
                    <span>Daily Chat</span>
                    <span className="font-bold">{plan.daily_chat_limit || 0}</span>
                </div>
                <div className="flex justify-between">
                    <span>Daily Coding</span>
                    <span className="font-bold">{plan.daily_coding_limit || 0}</span>
                </div>
                <div className="flex justify-between">
                    <span>Daily Vision</span>
                    <span className="font-bold">{plan.daily_vision_limit || 0}</span>
                </div>
                <div className="flex justify-between">
                    <span>Monthly Images</span>
                    <span className="font-bold">{plan.monthly_image_limit || 0}</span>
                </div>
                <div className="flex justify-between">
                    <span>Monthly Flux</span>
                    <span className="font-bold">{plan.monthly_flux_limit || 0}</span>
                </div>
                <div className="flex justify-between">
                    <span>Daily TTS</span>
                    <span className="font-bold">{plan.daily_tts_limit || 0}</span>
                </div>
                <div className="flex justify-between">
                    <span>Daily STT</span>
                    <span className="font-bold">{plan.daily_stt_limit || 0}</span>
                </div>
            </div>

            <button onClick={() => onEdit(plan)} className={`text-[10px] font-mono uppercase tracking-widest ${isDarkMode ? "text-white/40 hover:text-white" : "text-black/40 hover:text-black"}`}>Edit Plan</button>
        </div>
    );
};

const StatCard = ({ title, value, icon: Icon, color, subtext, isDarkMode }: { title: string, value: any, icon: any, color: string, subtext?: string, isDarkMode: boolean }) => (
    <div className={`relative border rounded-[2.5rem] p-8 overflow-hidden group ${isDarkMode ? "bg-gradient-to-br from-zinc-900 via-black to-zinc-900 border-zinc-800/50" : "bg-gradient-to-br from-zinc-100 via-white to-zinc-100 border-zinc-800/50"}`}>
        <div className={`absolute inset-0 bg-[linear-gradient(110deg,transparent_0%,rgba(255,255,255,0.03)_45%,rgba(255,255,255,0.06)_50%,rgba(255,255,255,0.03)_55%,transparent_100%)] pointer-events-none`} />
        <div className="absolute inset-0 -translate-y-full group-hover:translate-y-full transition-transform duration-1000 bg-gradient-to-b from-transparent via-white/5 to-transparent pointer-events-none" />
        <span className={`text-[9px] font-mono uppercase tracking-[0.3em] ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>{title}</span>
        <div className="flex items-baseline gap-2 mt-2">
            <h4 className={`text-2xl font-display font-black tracking-tight ${isDarkMode ? "text-white" : "text-black"}`}>{value}</h4>
            {subtext && <span className={`text-[10px] font-mono ${isDarkMode ? "opacity-30 text-white" : "opacity-50 text-black"}`}>{subtext}</span>}
        </div>
        <div className={`h-[2px] w-8 mt-4 rounded-full`} style={{ backgroundColor: color }} />
    </div>
);

const ProgressCircle = ({ value, limit, label, color, isDarkMode }: { value: number, limit: number, label: string, color: string, isDarkMode: boolean }) => {
    const percentage = Math.min((value / limit) * 100, 100);
    return (
        <div className="flex flex-col items-center gap-4">
            <div className="relative h-32 w-32">
                <svg className="transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="45" stroke={isDarkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"} strokeWidth="8" fill="none" />
                    <circle cx="50" cy="50" r="45" stroke={color} strokeWidth="8" fill="none" strokeDasharray={`${percentage * 2.83} 283`} strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`text-2xl font-display font-black ${isDarkMode ? "text-white" : "text-black"}`}>{percentage.toFixed(0)}%</span>
                </div>
            </div>
            <span className={`text-[9px] font-mono uppercase tracking-[0.3em] ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>{label}</span>
        </div>
    );
};

const Dashboard = () => {
    const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
    const [isAuthChecked, setIsAuthChecked] = useState(false);
    const [adminCode, setAdminCode] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [view, setView] = useState<'visual' | 'table' | 'plans'>('visual');
    const [isDarkMode, setIsDarkMode] = useState(true);
    const [plans, setPlans] = useState<Plan[]>([]);
    const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
    const [isUpdatingTokens, setIsUpdatingTokens] = useState(false);
    const [isUpdatingPlan, setIsUpdatingPlan] = useState(false);
    const [isCreatingPlan, setIsCreatingPlan] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isPlansLoading, setIsPlansLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [showCreateSchoolAdminModal, setShowCreateSchoolAdminModal] = useState(false);
    const [newSchoolName, setNewSchoolName] = useState("");
    const [newSchoolCode, setNewSchoolCode] = useState("");
    const [newSchoolAdminName, setNewSchoolAdminName] = useState("");
    const [newSchoolAdminEmail, setNewSchoolAdminEmail] = useState("");
    const [newSchoolAdminPassword, setNewSchoolAdminPassword] = useState("");
    const [isCreatingSchoolAdmin, setIsCreatingSchoolAdmin] = useState(false);
    const USERS_PER_PAGE = 10;

    const filteredUsers = useMemo(() => {
        if (!searchQuery) return users;
        return users.filter(u => u.name.toLowerCase().includes(searchQuery.toLowerCase()) || u.id.toLowerCase().includes(searchQuery.toLowerCase()));
    }, [users, searchQuery]);

    const totalPages = Math.ceil(filteredUsers.length / USERS_PER_PAGE);
    const paginatedUsers = filteredUsers.slice((currentPage - 1) * USERS_PER_PAGE, currentPage * USERS_PER_PAGE);

    const fetchData = async () => {
        setIsLoading(true);
        setIsRefreshing(true);
        try {
            const [usersRes, plansRes] = await Promise.all([getAdminUsers(), getPlansList()]);
            if (usersRes.success) setUsers(usersRes.users || []);
            if (plansRes.success) setPlans(plansRes.plans || []);
        } catch (e) { toast.error("Failed to fetch data"); }
        finally { setIsRefreshing(false); setIsLoading(false); }
    };

    useEffect(() => {
        const checkAuth = async () => {
            const adminAuth = isAdminAuthenticated();
            setIsAdmin(adminAuth);
            if (adminAuth) await fetchData();
            else setIsLoading(false);
            setIsAuthChecked(true);
        };
        checkAuth();
    }, []);

    const handleAdminLogin = async () => {
        const code = adminCode.trim();
        const pass = password.trim();
        if (!code || !pass) return;

        setIsLoading(true);
        try {
            const globalRes = await adminLoginWithCredentials(code, pass);
            if (!globalRes.api_key) {
                throw new Error("Global admin key missing in response")
            }
            setAdminKey(globalRes.api_key);
            setIsAdmin(true);
            await fetchData();
            toast.success("Global Admin login successful");
            return;
        } catch (globalError) {
            try {
                const scopedRes = await loginByAdminCode(code, pass);
                if (scopedRes.api_key) setApiKey(scopedRes.api_key);
                const role = (scopedRes.role || "").toLowerCase();

                if (role === "school_admin") {
                    window.location.href = "/admin/school-admin";
                    return;
                }
                if (role === "faculty") {
                    window.location.href = "/admin/school-faculty";
                    return;
                }
                if (role === "enterprise_admin") {
                    window.location.href = "/admin/enterprise-admin";
                    return;
                }

                throw new Error("Unsupported admin designation");
            } catch (scopedError) {
                setIsAdmin(false);
                toast.error("Access Denied: Invalid admin credentials");
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleAdminLogout = () => {
        removeAdminKey();
        setIsAdmin(false);
        toast.info("Admin Session Terminated.");
    };

    const handleCreateSchoolAdmin = async (e: React.FormEvent) => {
        e.preventDefault();
        const schoolName = newSchoolName.trim();
        const schoolCode = newSchoolCode.trim().toUpperCase();
        const name = newSchoolAdminName.trim();
        const email = newSchoolAdminEmail.trim();
        const adminPassword = newSchoolAdminPassword.trim();

        if (!schoolName || !schoolCode || !name || !email || !adminPassword) {
            toast.error("All fields are required");
            return;
        }

        if (!/^[A-Z0-9_-]{3,30}$/.test(schoolCode)) {
            toast.error("School code must be 3-30 chars: A-Z, 0-9, _ or -");
            return;
        }

        if (adminPassword.length < 8) {
            toast.error("Admin password must be at least 8 characters");
            return;
        }

        setIsCreatingSchoolAdmin(true);
        try {
            const res = await createSchoolAdmin({
                school_name: schoolName,
                school_code: schoolCode,
                admin_name: name,
                admin_email: email,
                admin_password: adminPassword,
            });
            toast.success(`School + Admin created. Code: ${res.admin?.admin_code || schoolCode}`);
            setShowCreateSchoolAdminModal(false);
            setNewSchoolName("");
            setNewSchoolCode("");
            setNewSchoolAdminName("");
            setNewSchoolAdminEmail("");
            setNewSchoolAdminPassword("");
        } catch (err) {
            toast.error("Failed to create school admin: " + (err as Error).message);
        } finally {
            setIsCreatingSchoolAdmin(false);
        }
    };

    const handleUpdateTokens = async (userId: string, newLimit: number) => {
        setIsUpdatingTokens(true);
        try {
            const res = await updateTokens(userId, newLimit);
            if (res.success) {
                toast.success("Tokens updated successfully");
                fetchData();
            } else throw new Error(res.error || "Failed to update");
        } catch (err) {
            toast.error("Error updating tokens: " + (err as Error).message);
        } finally {
            setIsUpdatingTokens(false);
        }
    };

    const handleUpdatePlan = async (planId: string, data: Partial<Plan>) => {
        setIsUpdatingPlan(true);
        try {
            const res = await updatePlan(planId, data);
            if (res.success) {
                toast.success("Plan updated successfully");
                setEditingPlan(null);
                fetchData();
            } else throw new Error(res.error || "Failed to update");
        } catch (err) {
            toast.error("Error updating plan: " + (err as Error).message);
        } finally {
            setIsUpdatingPlan(false);
        }
    };

    // Wrapper for the form submission
    const handleUpdatePlanWrapper = async (planId: string, formData: any) => {
        return handleUpdatePlan(planId, formData);
    };

    const handleExportCSV = () => {
        const headers = ["ID", "Name", "Email", "Plan", "Status", "Tokens", "Images", "Personas", "Latency"];
        const rows = users.map(u => [u.id, u.name, u.email, u.subscription.plan, u.subscription.status, u.subscription.tokens_used + "/" + u.subscription.tokens_limit, u.subscription.images_used + "/" + u.subscription.images_limit, u.subscription.personas_used + "/" + u.subscription.personas_limit, u.subscription.latency_ms]);
        const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "rudranex_users.csv";
        a.click();
        URL.revokeObjectURL(url);
    };

    if (!isAuthChecked || isAdmin === null) {
        return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
            <div className="h-8 w-8 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
        </div>;
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
                        handleAdminLogin();
                    }} className="space-y-6">
                        <div className="relative group">
                            <Shield className={`absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 transition-all ${isDarkMode ? "text-white/20 group-focus-within:text-emerald-500" : "text-black/20 group-focus-within:text-emerald-500"}`} />
                            <input
                                value={adminCode}
                                onChange={(e) => setAdminCode(e.target.value)}
                                type="text"
                                placeholder="ENTER ADMIN CODE"
                                required
                                className={`w-full pl-12 pr-6 py-4 text-xs font-mono tracking-widest ${isDarkMode ? "bg-white/5 border-white/5" : "bg-black/5 border-black/5"} border rounded-2xl focus:outline-none focus:border-emerald-500/50 transition-all placeholder:opacity-20`}
                            />
                        </div>
                        <div className="relative group">
                            <Shield className={`absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 transition-all ${isDarkMode ? "text-white/20 group-focus-within:text-emerald-500" : "text-black/20 group-focus-within:text-emerald-500"}`} />
                            <input
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                type="password"
                                placeholder="ENTER PASSWORD"
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
             <nav className={`h-20 flex items-center justify-between px-10 border-b ${isDarkMode ? "border-white/5 bg-black/80" : "border-black/5 bg-white/80"} backdrop-blur-2xl sticky top-0 z-[100]`}>
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
                             <LayoutDashboard className="h-3.5 w-3.5 text-white" /> Dashboard
                         </button>
                         <button
                             onClick={() => setView('table')}
                             className={`flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.2em] transition-all ${view === 'table' ? "text-emerald-400 font-bold" : "opacity-40 hover:opacity-100"}`}
                         >
                             <TableIcon className="h-3.5 w-3.5 text-white" /> Table Logs
                         </button>
                         <button
                             onClick={() => setView('plans')}
                             className={`flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.2em] transition-all ${view === 'plans' ? "text-emerald-400 font-bold" : "opacity-40 hover:opacity-100"}`}
                         >
                             <Zap className="h-3.5 w-3.5 text-white" /> Plans
                         </button>
                     </div>
                </div>

                <div className="flex items-center gap-6">
                    <button
                        onClick={() => setShowCreateSchoolAdminModal(true)}
                        className="px-4 py-2 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono uppercase tracking-[0.2em] hover:bg-emerald-500/10 transition-all rounded-full flex items-center gap-2"
                    >
                        <Plus className="h-3.5 w-3.5" />
                        Add School Admin
                    </button>
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

             <main className={`flex-1 overflow-y-auto p-10 relative z-10 w-full max-w-[1800px] mx-auto custom-scrollbar ${isDarkMode ? "text-white" : "text-black"}`}>
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
                                 <div className={`relative border border-zinc-800/50 p-8 rounded-[2.5rem] backdrop-blur-xl overflow-hidden group ${
                                        isDarkMode ? "bg-gradient-to-br from-zinc-900 via-black to-zinc-900" : "bg-gradient-to-br from-zinc-100 via-white to-zinc-100"
                                    }`}>
                 <div className={`absolute inset-0 bg-[linear-gradient(110deg,transparent_0%,rgba(255,255,255,0.03)_45%,rgba(255,255,255,0.06)_50%,rgba(255,255,255,0.03)_55%,transparent_100%)] pointer-events-none`} />
                                            <div className="absolute inset-0 -translate-y-full group-hover:translate-y-full transition-transform duration-1000 bg-gradient-to-b from-transparent via-white/5 to-transparent pointer-events-none" />
                                            <div className="flex items-center justify-between mb-8">
                                           <h3 className={`text-xs font-display font-black uppercase tracking-[0.2em] ${isDarkMode ? "text-white" : "text-black"}`}>System Users</h3>
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
                                                 <div key={i} className={`h-12 w-full animate-pulse rounded-xl ${isDarkMode ? "bg-white/5" : "bg-black/5"}`} />
                                             ))
                                         ) : (
                                             filteredUsers.map((user) => (
                                                 <button
                                                     key={user.id}
                                                     onClick={() => setSelectedUser(user)}
                                                     className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all group ${selectedUser?.id === user.id
                                                         ? "bg-emerald-500 text-black font-bold shadow-[0_10px_30px_rgba(16,185,129,0.2)]"
                                                         : (isDarkMode ? "hover:bg-white/5 text-white" : "hover:bg-black/5 text-black")
                                                         }`}
                                                 >
                                                     <div className="flex items-center gap-4 text-left">
                                                         <div className={`h-8 w-8 rounded-full border flex items-center justify-center ${selectedUser?.id === user.id ? "border-black/20" : isDarkMode ? "border-white/10" : "border-black/10"}`}>
                                                             <User className={`h-3.5 w-3.5 ${selectedUser?.id === user.id ? "text-black" : ""}`} />
                                                         </div>
                                                         <div className="flex flex-col min-w-0">
                                                             <span className="text-[11px] font-bold truncate tracking-tight">{user.name}</span>
                                                             <span className={`text-[9px] font-mono uppercase truncate ${selectedUser?.id === user.id ? "text-black" : isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>{user.subscription.plan}</span>
                                                         </div>
                                                     </div>
                                                     <ChevronRight className={`h-3.5 w-3.5 transition-transform ${selectedUser?.id === user.id ? "translate-x-1 text-black" : isDarkMode ? "opacity-0 group-hover:opacity-100 text-white" : "opacity-0 group-hover:opacity-100 text-black"}`} />
                                                 </button>
                                             ))
                                         )}
                                     </div>
                                </div>

                                 <div className={`relative border border-zinc-800/50 p-8 rounded-[2.5rem] backdrop-blur-xl text-center overflow-hidden group ${
                                        isDarkMode ? "bg-gradient-to-br from-zinc-900 via-black to-zinc-900" : "bg-gradient-to-br from-zinc-100 via-white to-zinc-100"
                                    }`}>
                                       <div className={`absolute inset-0 bg-[linear-gradient(110deg,transparent_0%,rgba(255,255,255,0.03)_45%,rgba(255,255,255,0.06)_50%,rgba(255,255,255,0.03)_55%,transparent_100%)] pointer-events-none`} />
                                       <div className="absolute inset-0 -translate-y-full group-hover:translate-y-full transition-transform duration-1000 bg-gradient-to-b from-transparent via-white/5 to-transparent pointer-events-none" />
                                       <Database className={`h-8 w-8 mx-auto mb-4 ${isDarkMode ? "opacity-20 text-white" : "opacity-30 text-black"}`} />
                                       <h4 className={`text-[10px] font-mono uppercase tracking-[0.3em] ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>System Core</h4>
                                       <p className={`text-xs font-bold mt-2 ${isDarkMode ? "text-white" : "text-black"}`}>Active Node: IND-01</p>
                                   </div>
                            </div>

                            {/* Center Panel: Analytics */}
                            <div className="col-span-12 lg:col-span-9 space-y-8">
                                {selectedUser ? (
                                    <>
                                        {/* User Identity Header */}
                                         <div className={`relative border border-zinc-800/50 p-10 rounded-[3rem] overflow-hidden group ${
                                                isDarkMode ? "bg-gradient-to-br from-zinc-900 via-black to-zinc-900" : "bg-gradient-to-br from-zinc-100 via-white to-zinc-100"
                                            }`}>
                                               <div className={`absolute inset-0 bg-[linear-gradient(110deg,transparent_0%,rgba(255,255,255,0.03)_45%,rgba(255,255,255,0.06)_50%,rgba(255,255,255,0.03)_55%,transparent_100%)] pointer-events-none`} />
                                               <div className="absolute inset-0 -translate-y-full group-hover:translate-y-full transition-transform duration-1000 bg-gradient-to-b from-transparent via-white/5 to-transparent pointer-events-none" />
                                               <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[100px] rounded-full" />
                                              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10">
                                                <div className="flex items-center gap-8">
                                                    <div className="h-24 w-24 rounded-[2rem] bg-emerald-500 flex items-center justify-center text-black">
                                                        <User className="h-10 w-10" />
                                                    </div>
                                                     <div>
                                                         <div className="flex items-center gap-3 mb-2">
                                                             <h2 className={`text-4xl font-display font-black tracking-tighter ${isDarkMode ? "text-white" : "text-black"}`}>{selectedUser.name}</h2>
                                                             <span className={`px-4 py-1.5 rounded-full text-[10px] font-mono uppercase tracking-widest ${selectedUser.subscription.status === 'active' ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-amber-500/20 text-amber-400 border border-amber-500/30"}`}>
                                                                 {selectedUser.subscription.status}
                                                             </span>
                                                         </div>
                                                         <p className={`text-sm font-mono flex items-center gap-2 uppercase tracking-widest ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>
                                                             <Mail className="h-3.5 w-3.5" /> {selectedUser.email}
                                                         </p>
                                                         <p className={`text-[10px] font-mono mt-1 uppercase tracking-widest ${isDarkMode ? "opacity-20 text-white" : "opacity-40 text-black"}`}>UUID: {selectedUser.id}</p>
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
                                                 isDarkMode={isDarkMode}
                                             />
                                            <StatCard
                                                 title="System Latency"
                                                 value={selectedUser.subscription.latency_ms}
                                                 icon={Activity}
                                                 color="#3b82f6"
                                                 subtext="ms"
                                                 isDarkMode={isDarkMode}
                                             />
                                            <StatCard
                                                 title="Total Personas"
                                                 value={selectedUser.subscription.personas_used}
                                                 icon={Users}
                                                 color="#f59e0b"
                                                 subtext={`/ ${selectedUser.subscription.personas_limit}`}
                                                 isDarkMode={isDarkMode}
                                             />
                                            <StatCard
                                                 title="Image Generation"
                                                 value={selectedUser.subscription.images_used}
                                                 icon={PieChart}
                                                 color="#8b5cf6"
                                                 subtext={`/ ${selectedUser.subscription.images_limit}`}
                                                 isDarkMode={isDarkMode}
                                             />
                                        </div>

                                        {/* Visualization Section */}
                                        <div className="grid grid-cols-12 gap-8">
                                                <div className={`relative col-span-12 lg:col-span-8 border border-zinc-800/50 p-10 rounded-[3rem] overflow-hidden group ${
                                                    isDarkMode ? "bg-gradient-to-br from-zinc-900 via-black to-zinc-900" : "bg-gradient-to-br from-zinc-100 via-white to-zinc-100"
                                                }`}>
                                                     <div className={`absolute inset-0 bg-[linear-gradient(110deg,transparent_0%,rgba(255,255,255,0.03)_45%,rgba(255,255,255,0.06)_50%,rgba(255,255,255,0.03)_55%,transparent_100%)] pointer-events-none`} />
                                                     <div className="absolute inset-0 -translate-y-full group-hover:translate-y-full transition-transform duration-1000 bg-gradient-to-b from-transparent via-white/5 to-transparent pointer-events-none" />
                                                 <div className="flex items-center justify-between mb-12">
                                                     <div>
                                                         <h3 className={`text-lg font-display font-black tracking-tight uppercase ${isDarkMode ? "text-white" : "text-black"}`}>Resource Utilization</h3>
                                                         <p className={`text-[10px] font-mono uppercase tracking-[0.3em] mt-1 ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>Live spectral analysis of user assets</p>
                                                     </div>
                                                     <div className="flex items-center gap-4">
                                                         <div className="flex items-center gap-2">
                                                             <div className="h-2 w-2 rounded-full bg-emerald-500" />
                                                             <span className={`text-[9px] font-mono uppercase tracking-widest ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>Healthy</span>
                                                         </div>
                                                     </div>
                                                 </div>

                                                <div className="flex flex-wrap justify-center gap-16 lg:justify-between px-6">
                                                    <ProgressCircle
                                                         value={selectedUser.subscription.tokens_used}
                                                         limit={selectedUser.subscription.tokens_limit}
                                                         label="Token Delta"
                                                         color="#10b981"
                                                         isDarkMode={isDarkMode}
                                                     />
                                                    <ProgressCircle
                                                         value={selectedUser.subscription.images_used}
                                                         limit={selectedUser.subscription.images_limit}
                                                         label="Image Buffer"
                                                         color="#8b5cf6"
                                                         isDarkMode={isDarkMode}
                                                     />
                                                    <ProgressCircle
                                                         value={selectedUser.subscription.personas_used}
                                                         limit={selectedUser.subscription.personas_limit}
                                                         label="Persona Load"
                                                         color="#f59e0b"
                                                         isDarkMode={isDarkMode}
                                                     />
                                                </div>
                                            </div>

                                             <div className={`relative col-span-12 lg:col-span-4 border border-zinc-800/50 p-10 rounded-[3rem] flex flex-col justify-between overflow-hidden group ${
                                                isDarkMode ? "bg-gradient-to-br from-zinc-900 via-black to-zinc-900" : "bg-gradient-to-br from-zinc-100 via-white to-zinc-100"
                                            }`}>
                                                 <div className={`absolute inset-0 bg-[linear-gradient(110deg,transparent_0%,rgba(255,255,255,0.03)_45%,rgba(255,255,255,0.06)_50%,rgba(255,255,255,0.03)_55%,transparent_100%)] pointer-events-none`} />
                                                 <div className="absolute inset-0 -translate-y-full group-hover:translate-y-full transition-transform duration-1000 bg-gradient-to-b from-transparent via-white/5 to-transparent pointer-events-none" />
                                                 <div>
                                                     <div className="flex items-center gap-3 mb-6">
                                                         <TrendingUp className={`h-5 w-5 ${isDarkMode ? "text-emerald-400" : "text-emerald-600"}`} />
                                                         <h3 className={`text-xs font-display font-black uppercase tracking-[0.2em] ${isDarkMode ? "text-white" : "text-black"}`}>User Efficiency</h3>
                                                     </div>
                                                     <p className={`text-[10px] font-mono uppercase leading-relaxed tracking-widest ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>
                                                         Current user is operating at <b>{(100 - (selectedUser.subscription.tokens_used / selectedUser.subscription.tokens_limit * 100)).toFixed(1)}%</b> headroom. Latency is optimal for region.
                                                     </p>
                                                 </div>

                                                 <div className="space-y-4 mt-8">
                                                     <div className={`flex justify-between items-center text-[10px] font-mono tracking-widest ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>
                                                         <span>SECURITY</span>
                                                         <span>ENCRYPTED</span>
                                                     </div>
                                                     <div className={`h-1.5 w-full rounded-full overflow-hidden ${isDarkMode ? "bg-white/5" : "bg-black/5"}`}>
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
                              className={`relative border border-zinc-800/50 rounded-[3rem] overflow-hidden backdrop-blur-3xl group ${
                                isDarkMode ? "bg-gradient-to-br from-zinc-900 via-black to-zinc-900" : "bg-gradient-to-br from-zinc-100 via-white to-zinc-100"
                              }`}
                          >
                              <div className={`absolute inset-0 bg-[linear-gradient(110deg,transparent_0%,rgba(255,255,255,0.03)_45%,rgba(255,255,255,0.06)_50%,rgba(255,255,255,0.03)_55%,transparent_100%)] pointer-events-none`} />
                              <div className="absolute inset-0 -translate-y-full group-hover:translate-y-full transition-transform duration-1000 bg-gradient-to-b from-transparent via-white/5 to-transparent pointer-events-none" />
                              <div className={`p-10 border-b flex flex-col lg:flex-row lg:items-center justify-between gap-6 ${isDarkMode ? "bg-black border-white/5" : "bg-white border-black/10"}`}>
                                 <div>
                                     <h2 className={`text-3xl font-display font-black tracking-tight uppercase ${isDarkMode ? "text-white" : "text-black"}`}>User Transaction Logs</h2>
                                     <p className={`text-[10px] font-mono uppercase mt-2 tracking-[0.4em] ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>Full system registry • {users.length} active nodes</p>
                                 </div>
                                 <div className="flex items-center gap-4">
                                     <div className="relative">
                                         <Search className={`absolute left-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 ${isDarkMode ? "opacity-20 text-white" : "opacity-40 text-black"}`} />
                                         <input
                                             type="text"
                                             placeholder="FILTER LOGS..."
                                             value={searchQuery}
                                             onChange={(e) => setSearchQuery(e.target.value)}
                                             className={`pl-11 pr-8 py-3 text-[10px] font-mono tracking-widest border rounded-2xl focus:outline-none focus:border-emerald-500/50 min-w-[300px] ${
                                                isDarkMode ? "bg-white/5 border-white/10 text-white" : "bg-black/5 border-black/10 text-black placeholder:text-black/40"
                                             }`}
                                         />
                                     </div>
                                     <button
                                         onClick={handleExportCSV}
                                         className={`px-6 py-3.5 text-[10px] font-mono uppercase tracking-[0.2em] font-bold hover:opacity-90 transition-all rounded-2xl ${
                                            isDarkMode ? "bg-white text-black" : "bg-black text-white"
                                         }`}
                                     >
                                         Export CSV
                                     </button>
                                 </div>
                             </div>

                              <div className="overflow-x-auto relative overflow-hidden group">
                                  <div className="absolute inset-0 -translate-y-full group-hover:translate-y-full transition-transform duration-1000 bg-gradient-to-b from-transparent via-white/5 to-transparent pointer-events-none" />
                                  <table className="w-full text-left border-collapse">
                                      <thead>
                                          <tr className={`text-[9px] font-mono uppercase tracking-[0.3em] ${isDarkMode ? "bg-black text-white opacity-40" : "bg-white text-black opacity-60"}`}>
                                              <th className={`p-8 font-bold border-b ${isDarkMode ? "border-white/5" : "border-black/10"}`}>Identity</th>
                                              <th className={`p-8 font-bold border-b ${isDarkMode ? "border-white/5" : "border-black/10"}`}>Subscription</th>
                                              <th className={`p-8 font-bold border-b ${isDarkMode ? "border-white/5" : "border-black/10"} text-center`}>Resources</th>
                                              <th className={`p-8 font-bold border-b ${isDarkMode ? "border-white/5" : "border-black/10"}`}>Uptime / Latency</th>
                                              <th className={`p-8 font-bold border-b ${isDarkMode ? "border-white/5" : "border-black/10"} text-right`}>Administrative</th>
                                          </tr>
                                      </thead>
                                      <tbody className={`text-[11px] font-mono uppercase tracking-tight ${isDarkMode ? "text-white" : "text-black"}`}>
                                         {isLoading ? (
                                             Array.from({ length: 5 }).map((_, i) => (
                                                 <tr key={i} className="animate-pulse opacity-20">
                                                     <td colSpan={5} className={`p-8 border-b h-16 ${isDarkMode ? "border-white/5 bg-white/5" : "border-black/10 bg-black/5"}`} />
                                                 </tr>
                                             ))
                                         ) : paginatedUsers.length === 0 ? (
                                             <tr>
                                                 <td colSpan={5} className={`p-20 text-center font-display font-black text-2xl uppercase tracking-[1em] ${isDarkMode ? "opacity-20 text-white" : "opacity-40 text-black"}`}>Void Found</td>
                                             </tr>
                                          ) : (
                                              paginatedUsers.map((user) => (
                                                  <tr key={user.id} className={`border-b transition-colors group ${isDarkMode ? "border-white/5 hover:bg-white/[0.02]" : "border-black/10 hover:bg-black/[0.02]"}`}>
                                                      <td className="p-8">
                                                          <div className="flex items-center gap-4">
                                                              <div className={`h-10 w-10 rounded-xl flex items-center justify-center border ${isDarkMode ? "bg-white/5 border-white/10" : "bg-black/5 border-black/10"}`}>
                                                                  <User className={`h-4 w-4 ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`} />
                                                              </div>
                                                              <div className="flex flex-col">
                                                                  <span className={`text-[13px] font-bold tracking-tight ${isDarkMode ? "text-white" : "text-black"}`}>{user.name}</span>
                                                                  <span className={`text-[9px] lowercase font-sans ${isDarkMode ? "opacity-30 text-white" : "opacity-50 text-black"}`}>{user.email}</span>
                                                              </div>
                                                          </div>
                                                      </td>
                                                      <td className="p-8">
                                                          <div className="flex flex-col gap-1.5">
                                                              <span className={`text-[10px] font-black w-fit px-2 py-0.5 rounded border ${user.subscription.plan === 'pro' ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/5" : isDarkMode ? "border-white/10 text-white" : "border-black/10 text-black"}`}>
                                                                  {user.subscription.plan}
                                                              </span>
                                                              <div className="flex items-center gap-2">
                                                                  <div className={`h-1 w-1 rounded-full ${user.subscription.status === 'active' ? "bg-emerald-500" : "bg-amber-500"}`} />
                                                                  <span className={`text-[9px] ${isDarkMode ? "text-white opacity-40" : "text-black opacity-60"}`}>{user.subscription.status}</span>
                                                              </div>
                                                          </div>
                                                      </td>
                                                      <td className="p-8">
                                                          <div className="flex flex-col gap-3 max-w-[200px] mx-auto">
                                                              <div className={`flex justify-between text-[9px] ${isDarkMode ? "text-white opacity-40" : "text-black opacity-60"}`}>
                                                                  <span>TOKENS</span>
                                                                  <span>{((user.subscription.tokens_used / user.subscription.tokens_limit) * 100).toFixed(0)}%</span>
                                                              </div>
                                                              <div className={`h-1 w-full rounded-full overflow-hidden ${isDarkMode ? "bg-white/5" : "bg-black/5"}`}>
                                                                  <div className={`h-full ${isDarkMode ? "bg-white/20" : "bg-black/20"}`} style={{ width: `${(user.subscription.tokens_used / user.subscription.tokens_limit) * 100}%` }} />
                                                              </div>
                                                          </div>
                                                      </td>
                                                      <td className="p-8">
                                                          <div className="flex items-center gap-2">
                                                              <Activity className="h-3 w-3 text-emerald-500/50" />
                                                              <span className={`font-bold ${isDarkMode ? "text-white" : "text-black"}`}>{user.subscription.latency_ms}</span>
                                                             <span className={`text-[9px] ${isDarkMode ? "opacity-30 text-white" : "opacity-50 text-black"}`}>MS</span>
                                                         </div>
                                                     </td>
                                                     <td className="p-8 text-right">
                                                         <button
                                                             onClick={() => {
                                                                 setSelectedUser(user);
                                                                 setView('visual');
                                                             }}
                                                             className={`px-5 py-2.5 border transition-all text-[9px] font-bold tracking-widest rounded-xl ${
                                                                isDarkMode ? "border-white/5 hover:border-white/20 hover:bg-white/5 text-white" : "border-black/10 hover:border-black/20 hover:bg-black/5 text-black"
                                                             }`}
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
                              <div className={`p-8 flex items-center justify-between border-t ${isDarkMode ? "bg-black border-white/10" : "bg-white border-black/10"}`}>
                                  <div className={`flex items-center gap-4 text-[9px] font-mono tracking-[0.3em] uppercase ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>
                                      <Database className={`h-4 w-4 ${isDarkMode ? "text-white" : "text-black"}`} />
                                      <span>Page {currentPage} // {totalPages || 1}</span>
                                  </div>
                                  <div className="flex items-center gap-3">
                                      <button
                                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                          disabled={currentPage === 1}
                                          className={`p-3 border rounded-xl disabled:opacity-20 hover:bg-white/5 transition-all ${isDarkMode ? "border-white/10 text-white" : "border-black/10 text-black"}`}
                                      >
                                          <ChevronLeft className="h-4 w-4" />
                                      </button>
                                      <div className="flex gap-2">
                                          {Array.from({ length: totalPages }, (_, i) => i + 1)
                                              .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                                              .map((pageNum, i, arr) => (
                                                  <React.Fragment key={pageNum}>
                                                      {i > 0 && arr[i - 1] !== pageNum - 1 && <span className={`opacity-20 px-2 ${isDarkMode ? "text-white" : "text-black"}`}>...</span>}
                                                      <button
                                                          onClick={() => setCurrentPage(pageNum)}
                                                          className={`h-10 w-10 text-[10px] font-mono rounded-xl transition-all ${currentPage === pageNum
                                                              ? (isDarkMode ? 'bg-white text-black font-black' : 'bg-black text-white font-black')
                                                              : (isDarkMode ? 'hover:bg-white/5 opacity-40 text-white' : 'hover:bg-black/5 opacity-60 text-black')
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
                                         className={`p-3 border rounded-xl disabled:opacity-20 hover:bg-white/5 transition-all ${isDarkMode ? "border-white/10 text-white" : "border-black/10 text-black"}`}
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
                             <div className={`border border-zinc-800/50 rounded-[3rem] overflow-hidden backdrop-blur-3xl ${
                                isDarkMode ? "bg-gradient-to-br from-zinc-900 via-black to-zinc-900" : "bg-gradient-to-br from-zinc-100 via-white to-zinc-100"
                             }`}>
                                 <div className={`p-10 border-b flex items-center justify-between ${isDarkMode ? "border-white/10" : "border-black/10"}`}>
                                     <div>
                                         <h2 className={`text-3xl font-display font-black tracking-tight uppercase ${isDarkMode ? "text-white" : "text-black"}`}>Plans & Pricing</h2>
                                         <p className={`text-[10px] font-mono uppercase mt-2 tracking-[0.4em] ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>System-wide subscription tiers</p>
                                     </div>
                                     <button
                                         onClick={fetchData}
                                         disabled={isPlansLoading}
                                         className={`p-3 rounded-full border transition-all ${isDarkMode ? "border-white/10 hover:bg-white/5 text-white" : "border-black/10 hover:bg-black/5 text-black"} ${isPlansLoading ? "animate-spin" : ""}`}
                                     >
                                         <RefreshCw className={`h-4 w-4 ${isDarkMode ? "opacity-40" : "opacity-60"}`} />
                                     </button>
                                 </div>
                                 
                                  <div className="p-10">
                                      <div className="flex items-center justify-between mb-8">
                                          <h3 className={`text-lg font-display font-black uppercase tracking-tight ${isDarkMode ? "text-white" : "text-black"}`}>All Plans</h3>
                                          <button
                                              onClick={() => setEditingPlan({ id: 'new', name: '', price: 0, tokens_limit: 0, images_limit: 0, personas_limit: 0, plan_name: '', price_inr: 0, daily_chat_limit: 0, daily_coding_limit: 0, daily_vision_limit: 0, monthly_image_limit: 0, monthly_flux_limit: 0, daily_tts_limit: 0, daily_stt_limit: 0 })}
                                              className="px-6 py-3 bg-emerald-500 text-black text-[10px] font-mono uppercase tracking-[0.2em] font-bold hover:scale-105 transition-all rounded-2xl flex items-center gap-2"
                                          >
                                              <Plus className="h-4 w-4" /> Create Plan
                                          </button>
                                      </div>
                                      {isPlansLoading ? (
                                          <div className={`text-center py-20 text-[10px] font-mono uppercase tracking-widest ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>
                                              Loading plans...
                                          </div>
                                      ) : plans.length === 0 ? (
                                          <div className={`text-center py-20 text-[10px] font-mono uppercase tracking-widest ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>
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

             {/* Edit/Create Plan Modal */}
              {editingPlan && (
                  <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm">
                       <motion.div
                           initial={{ opacity: 0, scale: 0.95 }}
                           animate={{ opacity: 1, scale: 1 }}
                           className={`relative w-full max-w-xl max-h-[80vh] overflow-y-auto border border-zinc-800/50 p-6 rounded-[2rem] overflow-hidden group ${
                             isDarkMode ? "bg-gradient-to-br from-zinc-900 via-black to-zinc-900 text-white" : "bg-gradient-to-br from-zinc-100 via-white to-zinc-100 text-black"
                           }`}
                       >
                           <div className={`absolute inset-0 bg-[linear-gradient(110deg,transparent_0%,rgba(255,255,255,0.03)_45%,rgba(255,255,255,0.06)_50%,rgba(255,255,255,0.03)_55%,transparent_100%)] pointer-events-none`} />
                           <div className="absolute inset-0 -translate-y-full group-hover:translate-y-full transition-transform duration-1000 bg-gradient-to-b from-transparent via-white/5 to-transparent pointer-events-none" />
                          <button
                              onClick={() => setEditingPlan(null)}
                              className={`absolute top-4 right-4 p-2 rounded-xl transition-all ${isDarkMode ? "opacity-40 text-white hover:opacity-100 hover:bg-white/5" : "opacity-60 text-black hover:opacity-100 hover:bg-black/5"}`}
                          >
                              <X className="h-4 w-4" />
                          </button>

                          <h2 className={`text-xl font-display font-black uppercase tracking-tight mb-6 ${isDarkMode ? "text-white" : "text-black"}`}>
                              {editingPlan.id === 'new' ? 'Create New Plan' : 'Edit Plan'}
                          </h2>

                          <form onSubmit={(e) => {
                              e.preventDefault();
                              const formData = new FormData(e.target as HTMLFormElement);
                              if (editingPlan.id === 'new') {
                                  setIsCreatingPlan(true);
                                  createPlan({
                                      plan_name: formData.get('plan_name') as string,
                                      price_inr: Number(formData.get('price_inr')),
                                      daily_chat_limit: Number(formData.get('daily_chat_limit')),
                                      daily_coding_limit: Number(formData.get('daily_coding_limit')),
                                      daily_vision_limit: Number(formData.get('daily_vision_limit')),
                                      monthly_image_limit: Number(formData.get('monthly_image_limit')),
                                      monthly_flux_limit: Number(formData.get('monthly_flux_limit')),
                                      daily_tts_limit: Number(formData.get('daily_tts_limit')),
                                      daily_stt_limit: Number(formData.get('daily_stt_limit'))
                                  }).then(() => {
                                      toast.success("Plan created successfully");
                                      setEditingPlan(null);
                                      fetchData();
                                  }).catch(err => {
                                      toast.error("Error creating plan: " + (err as Error).message);
                                  }).finally(() => {
                                      setIsCreatingPlan(false);
                                  });
                              } else {
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
                              }
                          }} className="space-y-4">
                              <div>
                                  <label className={`text-[9px] font-mono uppercase tracking-widest ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>Plan Name</label>
                                  <input
                                      name="plan_name"
                                      defaultValue={editingPlan.plan_name || editingPlan.name || ''}
                                      required
                                      className={`w-full mt-1 p-3 text-xs font-mono border rounded-xl focus:outline-none focus:border-emerald-500/50 ${
                                         isDarkMode ? "bg-white/5 border-white/10 text-white" : "bg-black/5 border-black/10 text-black"
                                      }`}
                                  />
                              </div>

                              <div className="grid grid-cols-2 gap-3">
                                  <div>
                                      <label className={`text-[9px] font-mono uppercase tracking-widest ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>Price (INR)</label>
                                      <input
                                          name="price_inr"
                                          type="number"
                                          defaultValue={editingPlan.price_inr || editingPlan.price || 0}
                                          required
                                          className={`w-full mt-1 p-3 text-xs font-mono border rounded-xl focus:outline-none focus:border-emerald-500/50 ${
                                             isDarkMode ? "bg-white/5 border-white/10 text-white" : "bg-black/5 border-black/10 text-black"
                                          }`}
                                      />
                                  </div>
                                  <div>
                                      <label className={`text-[9px] font-mono uppercase tracking-widest ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>Daily Chat</label>
                                      <input
                                          name="daily_chat_limit"
                                          type="number"
                                          defaultValue={editingPlan.daily_chat_limit || 0}
                                          className={`w-full mt-1 p-3 text-xs font-mono border rounded-xl focus:outline-none focus:border-emerald-500/50 ${
                                             isDarkMode ? "bg-white/5 border-white/10 text-white" : "bg-black/5 border-black/10 text-black"
                                          }`}
                                      />
                                  </div>
                              </div>

                              <div className="grid grid-cols-2 gap-3">
                                  <div>
                                      <label className={`text-[9px] font-mono uppercase tracking-widest ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>Daily Coding</label>
                                      <input
                                          name="daily_coding_limit"
                                          type="number"
                                          defaultValue={editingPlan.daily_coding_limit || 0}
                                          className={`w-full mt-1 p-3 text-xs font-mono border rounded-xl focus:outline-none focus:border-emerald-500/50 ${
                                             isDarkMode ? "bg-white/5 border-white/10 text-white" : "bg-black/5 border-black/10 text-black"
                                          }`}
                                      />
                                  </div>
                                  <div>
                                      <label className={`text-[9px] font-mono uppercase tracking-widest ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>Daily Vision</label>
                                      <input
                                          name="daily_vision_limit"
                                          type="number"
                                          defaultValue={editingPlan.daily_vision_limit || 0}
                                          className={`w-full mt-1 p-3 text-xs font-mono border rounded-xl focus:outline-none focus:border-emerald-500/50 ${
                                             isDarkMode ? "bg-white/5 border-white/10 text-white" : "bg-black/5 border-black/10 text-black"
                                          }`}
                                      />
                                  </div>
                              </div>

                              <div className="grid grid-cols-2 gap-3">
                                  <div>
                                      <label className={`text-[9px] font-mono uppercase tracking-widest ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>Monthly Images</label>
                                      <input
                                          name="monthly_image_limit"
                                          type="number"
                                          defaultValue={editingPlan.monthly_image_limit || 0}
                                          className={`w-full mt-1 p-3 text-xs font-mono border rounded-xl focus:outline-none focus:border-emerald-500/50 ${
                                             isDarkMode ? "bg-white/5 border-white/10 text-white" : "bg-black/5 border-black/10 text-black"
                                          }`}
                                      />
                                  </div>
                                  <div>
                                      <label className={`text-[9px] font-mono uppercase tracking-widest ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>Monthly Flux</label>
                                      <input
                                          name="monthly_flux_limit"
                                          type="number"
                                          defaultValue={editingPlan.monthly_flux_limit || 0}
                                          className={`w-full mt-1 p-3 text-xs font-mono border rounded-xl focus:outline-none focus:border-emerald-500/50 ${
                                             isDarkMode ? "bg-white/5 border-white/10 text-white" : "bg-black/5 border-black/10 text-black"
                                          }`}
                                      />
                                  </div>
                              </div>

                              <div className="grid grid-cols-2 gap-3">
                                  <div>
                                      <label className={`text-[9px] font-mono uppercase tracking-widest ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>Daily TTS</label>
                                      <input
                                          name="daily_tts_limit"
                                          type="number"
                                          defaultValue={editingPlan.daily_tts_limit || 0}
                                          className={`w-full mt-1 p-3 text-xs font-mono border rounded-xl focus:outline-none focus:border-emerald-500/50 ${
                                             isDarkMode ? "bg-white/5 border-white/10 text-white" : "bg-black/5 border-black/10 text-black"
                                          }`}
                                      />
                                  </div>
                                  <div>
                                      <label className={`text-[9px] font-mono uppercase tracking-widest ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>Daily STT</label>
                                      <input
                                          name="daily_stt_limit"
                                          type="number"
                                          defaultValue={editingPlan.daily_stt_limit || 0}
                                          className={`w-full mt-1 p-3 text-xs font-mono border rounded-xl focus:outline-none focus:border-emerald-500/50 ${
                                             isDarkMode ? "bg-white/5 border-white/10 text-white" : "bg-black/5 border-black/10 text-black"
                                          }`}
                                      />
                                  </div>
                              </div>

                              <button
                                  type="submit"
                                  disabled={isUpdatingPlan || isCreatingPlan}
                                  className="w-full py-3 bg-emerald-500 text-black text-[10px] font-mono uppercase tracking-[0.3em] font-bold hover:scale-[1.02] transition-all rounded-xl disabled:opacity-50"
                              >
                                  {isUpdatingPlan || isCreatingPlan ? "PROCESSING..." : (editingPlan.id === 'new' ? "CREATE PLAN" : "UPDATE PLAN")}
                              </button>
                          </form>
                      </motion.div>
                  </div>
              )}

            {/* Create School Admin Modal */}
            {showCreateSchoolAdminModal && (
                <div className="fixed inset-0 z-[210] flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={`relative w-full max-w-lg border border-zinc-800/50 p-6 rounded-[2rem] ${
                            isDarkMode ? "bg-gradient-to-br from-zinc-900 via-black to-zinc-900 text-white" : "bg-gradient-to-br from-zinc-100 via-white to-zinc-100 text-black"
                        }`}
                    >
                        <button
                            onClick={() => setShowCreateSchoolAdminModal(false)}
                            className={`absolute top-4 right-4 p-2 rounded-xl transition-all ${isDarkMode ? "opacity-40 text-white hover:opacity-100 hover:bg-white/5" : "opacity-60 text-black hover:opacity-100 hover:bg-black/5"}`}
                        >
                            <X className="h-4 w-4" />
                        </button>

                        <h2 className={`text-xl font-display font-black uppercase tracking-tight mb-6 ${isDarkMode ? "text-white" : "text-black"}`}>
                            Add School Admin
                        </h2>

                        <form onSubmit={handleCreateSchoolAdmin} className="space-y-4">
                            <div>
                                <label className={`text-[9px] font-mono uppercase tracking-widest ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>School Name</label>
                                <input
                                    value={newSchoolName}
                                    onChange={(e) => setNewSchoolName(e.target.value)}
                                    required
                                    className={`w-full mt-1 p-3 text-xs font-mono border rounded-xl focus:outline-none focus:border-emerald-500/50 ${isDarkMode ? "bg-white/5 border-white/10 text-white" : "bg-black/5 border-black/10 text-black"}`}
                                />
                            </div>
                            <div>
                                <label className={`text-[9px] font-mono uppercase tracking-widest ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>School ID (Cluster Code)</label>
                                <input
                                    value={newSchoolCode}
                                    onChange={(e) => setNewSchoolCode(e.target.value.toUpperCase())}
                                    required
                                    className={`w-full mt-1 p-3 text-xs font-mono border rounded-xl focus:outline-none focus:border-emerald-500/50 ${isDarkMode ? "bg-white/5 border-white/10 text-white" : "bg-black/5 border-black/10 text-black"}`}
                                />
                            </div>
                            <div>
                                <label className={`text-[9px] font-mono uppercase tracking-widest ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>Name</label>
                                <input
                                    value={newSchoolAdminName}
                                    onChange={(e) => setNewSchoolAdminName(e.target.value)}
                                    required
                                    className={`w-full mt-1 p-3 text-xs font-mono border rounded-xl focus:outline-none focus:border-emerald-500/50 ${isDarkMode ? "bg-white/5 border-white/10 text-white" : "bg-black/5 border-black/10 text-black"}`}
                                />
                            </div>
                            <div>
                                <label className={`text-[9px] font-mono uppercase tracking-widest ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>Admin Email</label>
                                <input
                                    type="email"
                                    value={newSchoolAdminEmail}
                                    onChange={(e) => setNewSchoolAdminEmail(e.target.value)}
                                    required
                                    className={`w-full mt-1 p-3 text-xs font-mono border rounded-xl focus:outline-none focus:border-emerald-500/50 ${isDarkMode ? "bg-white/5 border-white/10 text-white" : "bg-black/5 border-black/10 text-black"}`}
                                />
                            </div>
                            <div>
                                <label className={`text-[9px] font-mono uppercase tracking-widest ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>Admin Password</label>
                                <input
                                    type="password"
                                    value={newSchoolAdminPassword}
                                    onChange={(e) => setNewSchoolAdminPassword(e.target.value)}
                                    required
                                    className={`w-full mt-1 p-3 text-xs font-mono border rounded-xl focus:outline-none focus:border-emerald-500/50 ${isDarkMode ? "bg-white/5 border-white/10 text-white" : "bg-black/5 border-black/10 text-black"}`}
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={isCreatingSchoolAdmin}
                                className="w-full py-3 bg-emerald-500 text-black text-[10px] font-mono uppercase tracking-[0.3em] font-bold hover:scale-[1.02] transition-all rounded-xl disabled:opacity-50"
                            >
                                {isCreatingSchoolAdmin ? "CREATING..." : "CREATE SCHOOL ADMIN"}
                            </button>
                        </form>
                    </motion.div>
                </div>
            )}

            {/* Footer Style Decoration */}
             <div className="fixed bottom-10 left-10 flex items-center gap-4 pointer-events-none opacity-10">
                 <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                 <span className={`text-[10px] font-mono tracking-[0.5em] uppercase ${isDarkMode ? "text-white" : "text-black"}`}>R_CORE_STABLE // NO_VULN</span>
             </div>
        </div>
    );
};

export default Dashboard;
