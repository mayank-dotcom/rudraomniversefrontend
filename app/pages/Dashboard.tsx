import React, { useState, useEffect, useMemo } from 'react';
import {
    Search, Bell, Settings, User, Mail, Calendar as CalendarIcon,
    MessageSquare, FileText, PieChart, Activity, Layers,
    MoreHorizontal, Plus, Briefcase, Users, Clock, CheckCircle2,
    ChevronRight, ArrowUpRight, Globe, Shield, Zap, Table as TableIcon, LayoutDashboard,
    ChevronLeft, ChevronRight as ChevronRightIcon, LogOut, Moon, Sun, RefreshCw, Database,
    TrendingUp, ShieldCheck, Cpu, X, Copy, Check, ArrowUpDown, ArrowUp, ArrowDown, Trash2, Building2
} from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { getAdminUsers, AdminUser, getSubscriptionStatus, updateTokens, getPlansList, updatePlan, createPlan, Plan, adminLoginWithCredentials, loginByAdminCode, createSchoolAdmin, getSiteSettings, updateSiteSetting, SiteSetting, freezeUser, unfreezeUser, getAdminRequests, declineAdminRequest, AdminRequest, getAdminSchools, getAdminSchoolAdmins, AdminSchool, AdminSchoolAdmin, getFrozenUsers, getAdminSchoolFacultyByCode, SchoolFacultyMember, deleteAdminUser, deleteSchoolFaculty, getAdminActivity, getAvailableFeatures, AvailableFeature, setPlanFeatures, getPlanFeatures, getPlanStrikeOff, setPlanStrikeOff, getAdminEnterprises, onboardEnterprise, deleteEnterprise, getEnterpriseStatsGlobal, AdminEnterprise } from '@/lib/chat-api';
import { isAdminAuthenticated, setAdminKey, removeAdminKey, setApiKey } from '@/lib/auth';
import { toast } from 'sonner';

const PlanCard = ({ plan, isDarkMode, onEdit }: { plan: any, isDarkMode: boolean, onEdit: (plan: any) => void }) => {
    return (
        <div
            className={`relative border rounded-[2.5rem] p-8 transition-all hover:scale-105 overflow-hidden group ${isDarkMode
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
            {(() => {
                const strikeOff = getPlanStrikeOff(String(plan.id))
                if (strikeOff) {
                    return (
                        <div className="mb-6">
                            <p className={`text-2xl font-display font-black line-through ${isDarkMode ? "text-white/40" : "text-black/30"}`}>₹{plan.price_inr || plan.price}</p>
                            <p className={`text-3xl font-display font-black ${isDarkMode ? "text-white" : "text-black"}`}>₹{strikeOff.price_inr}</p>
                        </div>
                    )
                }
                return <p className={`text-3xl font-display font-black mb-6 ${isDarkMode ? "text-white" : "text-black"}`}>₹{plan.price_inr || plan.price}</p>
            })()}

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

            {(() => {
                const planFeatures = getPlanFeatures(String(plan.id))
                if (planFeatures.length > 0) {
                    const featureNames: Record<string, string> = {
                        student_mode: "Student Mode",
                        interview_prep: "Interview Prep",
                        mock_paper_generator: "Mock Paper",
                        persona_mode: "Persona Mode",
                        ai_image_lab: "AI Image Lab",
                        battle_arena: "Battle Arena",
                    }
                    return (
                        <div className="mb-6">
                            <span className={`text-[8px] font-mono uppercase tracking-widest ${isDarkMode ? "text-white/40" : "text-black/40"}`}>Modes</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                                {planFeatures.map(fid => (
                                    <span key={fid} className={`text-[8px] font-mono px-1.5 py-0.5 rounded ${isDarkMode ? "bg-emerald-500/10 text-emerald-400" : "bg-emerald-500/10 text-emerald-600"}`}>
                                        {featureNames[fid] || fid}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )
                }
                return null
            })()}

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
    const [view, setView] = useState<'visual' | 'table' | 'plans' | 'sites' | 'requests' | 'schools' | 'enterprises'>('visual');
    const [isDarkMode, setIsDarkMode] = useState(true);
    const [plans, setPlans] = useState<Plan[]>([]);
    const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
    const [isUpdatingTokens, setIsUpdatingTokens] = useState(false);
    const [isFreezing, setIsFreezing] = useState(false);
    const [isUnfreezing, setIsUnfreezing] = useState(false);
    const [isUpdatingPlan, setIsUpdatingPlan] = useState(false);
    const [isCreatingPlan, setIsCreatingPlan] = useState(false);
    const [availableFeatures, setAvailableFeatures] = useState<AvailableFeature[]>([]);
    const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
    const [isFeaturesLoading, setIsFeaturesLoading] = useState(false);
    const [strikeOffEnabled, setStrikeOffEnabled] = useState(false);
    const [strikeOffPrice, setStrikeOffPrice] = useState(0);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isPlansLoading, setIsPlansLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [sortField, setSortField] = useState<"name" | "plan" | "status" | "latency">("name");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
    const [showCreateSchoolAdminModal, setShowCreateSchoolAdminModal] = useState(false);
    const [newSchoolName, setNewSchoolName] = useState("");
    const [newSchoolCode, setNewSchoolCode] = useState("");
    const [newSchoolAdminName, setNewSchoolAdminName] = useState("");
    const [newSchoolAdminEmail, setNewSchoolAdminEmail] = useState("");
    const [newSchoolAdminPassword, setNewSchoolAdminPassword] = useState("");
    const [newSchoolStudentLimit, setNewSchoolStudentLimit] = useState<number>(100);
    const [isCreatingSchoolAdmin, setIsCreatingSchoolAdmin] = useState(false);
    const [createdAdminInfo, setCreatedAdminInfo] = useState<{
        schoolName: string;
        schoolCode: string;
        adminName: string;
        adminEmail: string;
        adminPassword: string;
        adminCode: string;
    } | null>(null);
    const [siteSettings, setSiteSettings] = useState<SiteSetting[]>([]);
    const [editingSiteSetting, setEditingSiteSetting] = useState<{ key: string; value: string } | null>(null);
    const [siteFormData, setSiteFormData] = useState<any>(null);
    const [isSavingSiteSetting, setIsSavingSiteSetting] = useState(false);
    const [requests, setRequests] = useState<AdminRequest[]>([]);
    const [isRequestsLoading, setIsRequestsLoading] = useState(false);
    const [decliningRequestId, setDecliningRequestId] = useState<number | null>(null);
    const [copied, setCopied] = useState(false);
    const [platformActivity, setPlatformActivity] = useState<any[]>([]);

    // Schools view state
    const [schools, setSchools] = useState<AdminSchool[]>([]);
    const [schoolAdmins, setSchoolAdmins] = useState<AdminSchoolAdmin[]>([]);
    const [isSchoolsLoading, setIsSchoolsLoading] = useState(false);
    const [freezingAdminId, setFreezingAdminId] = useState<string | null>(null);
    const [frozenAdminIds, setFrozenAdminIds] = useState<string[]>([]);
    const [selectedSchool, setSelectedSchool] = useState<AdminSchool | null>(null);
    const [facultyBySchool, setFacultyBySchool] = useState<Record<string, SchoolFacultyMember[]>>({});
    const [facultyLoadingCodes, setFacultyLoadingCodes] = useState<Set<string>>(new Set());
    const [schoolsSearch, setSchoolsSearch] = useState("");
    const [schoolsSortField, setSchoolsSortField] = useState<'name' | 'code' | 'created'>("created");
    const [schoolsSortOrder, setSchoolsSortOrder] = useState<'asc' | 'desc'>('desc');
    const [schoolsRowsPerPage, setSchoolsRowsPerPage] = useState<number>(10);
    const [schoolsPage, setSchoolsPage] = useState<number>(1);
    const [schoolsDateFrom, setSchoolsDateFrom] = useState<string>("");
    const [schoolsDateTo, setSchoolsDateTo] = useState<string>("");
    const [confirmDeleteUserId, setConfirmDeleteUserId] = useState<string | null>(null);
    const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
    const [confirmDeleteSchoolAdminId, setConfirmDeleteSchoolAdminId] = useState<string | null>(null);
    const [deletingSchoolAdminId, setDeletingSchoolAdminId] = useState<string | null>(null);
    const [confirmDeleteFacultyCode, setConfirmDeleteFacultyCode] = useState<string | null>(null);
    const [deletingFacultyCode, setDeletingFacultyCode] = useState<string | null>(null);

    // Enterprises view state
    const [enterprises, setEnterprises] = useState<AdminEnterprise[]>([]);
    const [enterpriseStats, setEnterpriseStats] = useState<any[]>([]);
    const [isEnterprisesLoading, setIsEnterprisesLoading] = useState(false);
    const [enterprisesSearch, setEnterprisesSearch] = useState("");
    const [enterprisesSortField, setEnterprisesSortField] = useState<'name' | 'code' | 'created'>("created");
    const [enterprisesSortOrder, setEnterprisesSortOrder] = useState<'asc' | 'desc'>('desc');
    const [enterprisesRowsPerPage, setEnterprisesRowsPerPage] = useState<number>(10);
    const [enterprisesPage, setEnterprisesPage] = useState<number>(1);
    const [enterprisesDateFrom, setEnterprisesDateFrom] = useState<string>("");
    const [enterprisesDateTo, setEnterprisesDateTo] = useState<string>("");
    const [showCreateEnterpriseModal, setShowCreateEnterpriseModal] = useState(false);
    const [newEnterpriseName, setNewEnterpriseName] = useState("");
    const [newEnterpriseCode, setNewEnterpriseCode] = useState("");
    const [newEnterpriseAdminName, setNewEnterpriseAdminName] = useState("");
    const [newEnterpriseAdminEmail, setNewEnterpriseAdminEmail] = useState("");
    const [newEnterpriseAdminPassword, setNewEnterpriseAdminPassword] = useState("");
    const [isCreatingEnterprise, setIsCreatingEnterprise] = useState(false);
    const [createdEnterpriseInfo, setCreatedEnterpriseInfo] = useState<any>(null);
    const [selectedEnterprise, setSelectedEnterprise] = useState<any>(null);
    const USERS_PER_PAGE = 10;

    const sortedUsers = useMemo(() => {
        const list = [...users];
        list.sort((a, b) => {
            let va: any, vb: any;
            switch (sortField) {
                case "plan": va = a.subscription.plan.toLowerCase(); vb = b.subscription.plan.toLowerCase(); break;
                case "status": va = a.subscription.status.toLowerCase(); vb = b.subscription.status.toLowerCase(); break;
                case "latency": va = a.subscription.latency_ms; vb = b.subscription.latency_ms; break;
                default: va = a.name.toLowerCase(); vb = b.name.toLowerCase();
            }
            if (va < vb) return sortOrder === "asc" ? -1 : 1;
            if (va > vb) return sortOrder === "asc" ? 1 : -1;
            return 0;
        });
        return list;
    }, [users, sortField, sortOrder]);

    const filteredUsers = useMemo(() => {
        if (!searchQuery) return sortedUsers;
        return sortedUsers.filter(u => u.name.toLowerCase().includes(searchQuery.toLowerCase()) || u.id.toLowerCase().includes(searchQuery.toLowerCase()));
    }, [sortedUsers, searchQuery]);

    const totalPages = Math.ceil(filteredUsers.length / USERS_PER_PAGE);
    const paginatedUsers = filteredUsers.slice((currentPage - 1) * USERS_PER_PAGE, currentPage * USERS_PER_PAGE);

    const toggleSort = (field: "name" | "plan" | "status" | "latency") => {
        if (sortField === field) setSortOrder(o => o === "asc" ? "desc" : "asc");
        else { setSortField(field); setSortOrder("asc"); }
    };

    const fetchData = async () => {
        setIsLoading(true);
        setIsRefreshing(true);
        try {
            const [usersRes, plansRes, settingsRes, activityRes] = await Promise.all([
                getAdminUsers(), 
                getPlansList(), 
                getSiteSettings(),
                getAdminActivity().catch(() => ({ success: true, activity: [] }))
            ]);
            if (plansRes.success) setPlans(plansRes.plans || []);
            if (settingsRes.success) setSiteSettings(settingsRes.settings || []);
            if (activityRes.success) setPlatformActivity(activityRes.activity || []);
            if (usersRes.success) {
                const planMap = new Map((plansRes.plans || []).map(p => [p.plan_name, p]));
                const enriched = (usersRes.users || []).map(u => {
                    const plan = planMap.get(u.subscription.plan) || planMap.get(u.plan_name);
                    if (plan) {
                        return {
                            ...u,
                            subscription: {
                                ...u.subscription,
                                daily_chat_limit: plan.daily_chat_limit || 0,
                                daily_coding_limit: plan.daily_coding_limit || 0,
                                daily_vision_limit: plan.daily_vision_limit || 0,
                                daily_tts_limit: plan.daily_tts_limit || 0,
                                daily_stt_limit: plan.daily_stt_limit || 0,
                                monthly_image_limit: plan.monthly_image_limit || 0,
                                monthly_flux_limit: plan.monthly_flux_limit || 0,
                                tokens_limit: plan.daily_chat_limit || 100,
                                images_limit: plan.monthly_image_limit || 50,
                                personas_limit: (plan.daily_coding_limit || 10) + (plan.daily_vision_limit || 10),
                            }
                        };
                    }
                    return u;
                });
                setUsers(enriched);
            }
        } catch (e) { toast.error("Failed to fetch data"); }
        finally { setIsRefreshing(false); setIsLoading(false); }
    };

    // Load schools and school-admins lists
    const fetchSchoolsData = async () => {
        setIsSchoolsLoading(true);
        try {
            const [schoolsRes, adminsRes, frozenRes] = await Promise.all([
                getAdminSchools(),
                getAdminSchoolAdmins(),
                getFrozenUsers().catch(() => ({ success: true, frozen_users: [] as { user_id: string }[] })),
            ]);
            if (schoolsRes.success) setSchools(schoolsRes.schools || []);
            if (adminsRes.success) setSchoolAdmins(adminsRes.admins || []);
            const ids = (frozenRes as any).frozen_users?.map((f: any) => f.user_id) || [];
            setFrozenAdminIds(ids);
        } catch (e) {
            toast.error("Failed to load schools data");
        } finally {
            setIsSchoolsLoading(false);
        }
    };

    const fetchEnterprisesData = async () => {
        setIsEnterprisesLoading(true);
        try {
            const [entRes, statsRes] = await Promise.all([
                getAdminEnterprises(),
                getEnterpriseStatsGlobal().catch(() => ({ success: true, enterprises: [] }))
            ]);
            if (entRes.success) setEnterprises(entRes.enterprises || []);
            if (statsRes.success) setEnterpriseStats((statsRes as any).enterprises || []);
        } catch (e) {
            toast.error("Failed to load enterprises data");
        } finally {
            setIsEnterprisesLoading(false);
        }
    };

    const handleCreateEnterprise = async (e: React.FormEvent) => {
        e.preventDefault();
        const enterpriseName = newEnterpriseName.trim();
        const enterpriseCode = newEnterpriseCode.trim().toUpperCase();
        const name = newEnterpriseAdminName.trim();
        const email = newEnterpriseAdminEmail.trim();
        const adminPassword = newEnterpriseAdminPassword.trim();

        if (!enterpriseName || !enterpriseCode || !name || !email || !adminPassword) {
            toast.error("All fields are required");
            return;
        }

        if (!/^[A-Z0-9_-]{3,30}$/.test(enterpriseCode)) {
            toast.error("Enterprise code must be 3-30 chars: A-Z, 0-9, _ or -");
            return;
        }

        if (adminPassword.length < 8) {
            toast.error("Admin password must be at least 8 characters");
            return;
        }

        setIsCreatingEnterprise(true);
        try {
            const res = await onboardEnterprise({
                enterprise_name: enterpriseName,
                enterprise_code: enterpriseCode,
                admin_name: name,
                admin_email: email,
                admin_password: adminPassword,
            });
            const adminCode = res.admin?.admin_code || enterpriseCode;
            setCreatedEnterpriseInfo({
                enterpriseName,
                enterpriseCode,
                adminName: name,
                adminEmail: email,
                adminPassword,
                adminCode,
            });
            setShowCreateEnterpriseModal(false);
            setNewEnterpriseName("");
            setNewEnterpriseCode("");
            setNewEnterpriseAdminName("");
            setNewEnterpriseAdminEmail("");
            setNewEnterpriseAdminPassword("");

            toast.success("Enterprise onboarded successfully!");
            await fetchEnterprisesData();
        } catch (err: any) {
            toast.error("Failed to create enterprise admin: " + err.message);
        } finally {
            setIsCreatingEnterprise(false);
        }
    };

    const handleDeleteEnterprise = async (id: number) => {
        try {
            await deleteEnterprise(id);
            setEnterprises(prev => prev.filter(e => e.id !== id));
            toast.success("Enterprise deleted successfully");
        } catch (e: any) {
            toast.error(e.message || "Failed to delete enterprise");
        }
    };

    const handleFreezeAdmin = async (userId: string) => {
        setFreezingAdminId(userId);
        try {
            const res = await freezeUser(userId);
            if (res.success) {
                toast.success(res.message || 'Admin frozen');
                await fetchSchoolsData();
            } else {
                throw new Error(res.error || 'Failed to freeze');
            }
        } catch (e: any) {
            toast.error(e.message || 'Freeze failed');
        } finally {
            setFreezingAdminId(null);
        }
    };

    const handleUnfreezeAdmin = async (userId: string) => {
        setFreezingAdminId(userId);
        try {
            const res = await unfreezeUser(userId);
            if (res.success) {
                toast.success(res.message || 'Admin unfrozen');
                await fetchSchoolsData();
            } else {
                throw new Error(res.error || 'Failed to unfreeze');
            }
        } catch (e: any) {
            toast.error(e.message || 'Unfreeze failed');
        } finally {
            setFreezingAdminId(null);
        }
    };

    const handleDeleteUser = async (userId: string) => {
        setDeletingUserId(userId);
        try {
            await deleteAdminUser(userId);
            setUsers(prev => prev.filter(u => u.id !== userId));
            setConfirmDeleteUserId(null);
            if (selectedUser?.id === userId) setSelectedUser(null);
            toast.success("User deleted successfully");
        } catch (e: any) {
            toast.error(e.message || "Failed to delete user");
        } finally {
            setDeletingUserId(null);
        }
    };

    const handleDeleteSchoolAdmin = async (userId: string) => {
        setDeletingSchoolAdminId(userId);
        try {
            await deleteAdminUser(userId);
            setSchoolAdmins(prev => prev.filter(a => a.id !== userId));
            setConfirmDeleteSchoolAdminId(null);
            toast.success("School admin deleted successfully");
        } catch (e: any) {
            toast.error(e.message || "Failed to delete school admin");
        } finally {
            setDeletingSchoolAdminId(null);
        }
    };

    const handleDeleteFacultyFromDashboard = async (faculty: SchoolFacultyMember, schoolCode: string) => {
        const actionKey = faculty.id || faculty.admin_code || "";
        setDeletingFacultyCode(actionKey);
        try {
            // Global admin can reliably delete faculty through the admin user id route.
            if (faculty.id) {
                await deleteAdminUser(faculty.id);
            } else if (faculty.admin_code) {
                await deleteSchoolFaculty(faculty.admin_code);
            } else {
                throw new Error("Faculty identifier not found");
            }

            setFacultyBySchool(prev => ({
                ...prev,
                [schoolCode]: (prev[schoolCode] || []).filter(f => {
                    if (faculty.id && f.id) return f.id !== faculty.id;
                    if (faculty.admin_code && f.admin_code) return f.admin_code !== faculty.admin_code;
                    return true;
                }),
            }));
            setConfirmDeleteFacultyCode(null);
            toast.success("Faculty deleted successfully");
        } catch (e: any) {
            toast.error(e.message || "Failed to delete faculty");
        } finally {
            setDeletingFacultyCode(null);
        }
    };

    const loadFacultyForSchool = async (schoolCode: string) => {
        setFacultyLoadingCodes(prev => {
            const next = new Set(prev);
            next.add(schoolCode);
            return next;
        })
        try {
            const res = await getAdminSchoolFacultyByCode(schoolCode)
            if (res.success) {
                setFacultyBySchool(prev => ({ ...prev, [schoolCode]: res.faculty || [] }))
            }
        } catch (e: any) {
            toast.error(e.message || 'Failed to load faculty')
        } finally {
            setFacultyLoadingCodes(prev => {
                const next = new Set(prev);
                next.delete(schoolCode);
                return next;
            })
        }
    }

    // Derived schools list: filter -> sort -> paginate
    const processedSchools = useMemo(() => {
        let list = [...schools];
        const q = schoolsSearch.trim().toLowerCase();
        if (q) {
            list = list.filter(s => s.school_name.toLowerCase().includes(q) || s.school_code.toLowerCase().includes(q));
        }
        if (schoolsDateFrom) {
            const from = new Date(schoolsDateFrom);
            list = list.filter(s => new Date(s.created_at) >= from);
        }
        if (schoolsDateTo) {
            const to = new Date(schoolsDateTo);
            // include entire end date
            to.setHours(23, 59, 59, 999);
            list = list.filter(s => new Date(s.created_at) <= to);
        }
        list.sort((a, b) => {
            let va: any, vb: any;
            if (schoolsSortField === 'name') { va = a.school_name.toLowerCase(); vb = b.school_name.toLowerCase(); }
            else if (schoolsSortField === 'code') { va = a.school_code.toLowerCase(); vb = b.school_code.toLowerCase(); }
            else { va = new Date(a.created_at).getTime(); vb = new Date(b.created_at).getTime(); }
            if (va < vb) return schoolsSortOrder === 'asc' ? -1 : 1;
            if (va > vb) return schoolsSortOrder === 'asc' ? 1 : -1;
            return 0;
        });
        return list;
    }, [schools, schoolsSearch, schoolsDateFrom, schoolsDateTo, schoolsSortField, schoolsSortOrder]);

    const schoolsTotalPages = useMemo(() => Math.max(1, Math.ceil(processedSchools.length / Math.max(1, schoolsRowsPerPage))), [processedSchools.length, schoolsRowsPerPage]);
    const visibleSchools = useMemo(() => processedSchools.slice((schoolsPage - 1) * schoolsRowsPerPage, schoolsPage * schoolsRowsPerPage), [processedSchools, schoolsPage, schoolsRowsPerPage]);

    const toggleSchoolsSort = (field: 'name' | 'code' | 'created') => {
        if (schoolsSortField === field) setSchoolsSortOrder(o => o === 'asc' ? 'desc' : 'asc');
        else { setSchoolsSortField(field); setSchoolsSortOrder('asc'); }
        setSchoolsPage(1);
    };

    // Derived enterprises list: filter -> sort -> paginate
    const processedEnterprises = useMemo(() => {
        let list = [...enterprises];
        const q = enterprisesSearch.trim().toLowerCase();
        if (q) {
            list = list.filter(e => e.enterprise_name.toLowerCase().includes(q) || e.enterprise_code.toLowerCase().includes(q));
        }
        if (enterprisesDateFrom) {
            const from = new Date(enterprisesDateFrom);
            list = list.filter(e => new Date(e.created_at) >= from);
        }
        if (enterprisesDateTo) {
            const to = new Date(enterprisesDateTo);
            // include entire end date
            to.setHours(23, 59, 59, 999);
            list = list.filter(e => new Date(e.created_at) <= to);
        }
        list.sort((a, b) => {
            let va: any, vb: any;
            if (enterprisesSortField === 'name') { va = a.enterprise_name.toLowerCase(); vb = b.enterprise_name.toLowerCase(); }
            else if (enterprisesSortField === 'code') { va = a.enterprise_code.toLowerCase(); vb = b.enterprise_code.toLowerCase(); }
            else { va = new Date(a.created_at).getTime(); vb = new Date(b.created_at).getTime(); }
            if (va < vb) return enterprisesSortOrder === 'asc' ? -1 : 1;
            if (va > vb) return enterprisesSortOrder === 'asc' ? 1 : -1;
            return 0;
        });
        return list;
    }, [enterprises, enterprisesSearch, enterprisesDateFrom, enterprisesDateTo, enterprisesSortField, enterprisesSortOrder]);

    const enterprisesTotalPages = useMemo(() => Math.max(1, Math.ceil(processedEnterprises.length / Math.max(1, enterprisesRowsPerPage))), [processedEnterprises.length, enterprisesRowsPerPage]);
    const visibleEnterprises = useMemo(() => processedEnterprises.slice((enterprisesPage - 1) * enterprisesRowsPerPage, enterprisesPage * enterprisesRowsPerPage), [processedEnterprises, enterprisesPage, enterprisesRowsPerPage]);

    const toggleEnterprisesSort = (field: 'name' | 'code' | 'created') => {
        if (enterprisesSortField === field) setEnterprisesSortOrder(o => o === 'asc' ? 'desc' : 'asc');
        else { setEnterprisesSortField(field); setEnterprisesSortOrder('asc'); }
        setEnterprisesPage(1);
    };

    const fetchRequests = async () => {
        setIsRequestsLoading(true)
        try {
            const res = await getAdminRequests()
            if (res.success) setRequests(res.requests || [])
        } catch (e) {
            // silently fail, not critical
        } finally {
            setIsRequestsLoading(false)
        }
    }

    const handleApproveRequest = (req: AdminRequest) => {
        const schoolCode = req.school_name.substring(0, 4).toUpperCase() + Math.floor(100 + Math.random() * 900)
        setNewSchoolName(req.school_name)
        setNewSchoolCode(schoolCode)
        setNewSchoolAdminName(req.admin_name)
        setNewSchoolAdminEmail(req.admin_email)
        setNewSchoolAdminPassword(req.admin_password)
        setNewSchoolStudentLimit(100)
        setShowCreateSchoolAdminModal(true)
    }

    const handleDeclineRequest = async (req: AdminRequest) => {
        setDecliningRequestId(req.id)
        try {
            const res = await declineAdminRequest(req.id)
            if (res.success) {
                toast.success(`Request from "${req.school_name}" declined`)
                fetchRequests()
            } else {
                toast.error("Failed to decline request")
            }
        } catch (e: any) {
            toast.error(e.message || "Failed to decline request")
        } finally {
            setDecliningRequestId(null)
        }
    }

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
        window.location.href = "/";
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
                student_limit: newSchoolStudentLimit,
            });
            const adminCode = res.admin?.admin_code || schoolCode;
            setCreatedAdminInfo({
                schoolName,
                schoolCode,
                adminName: name,
                adminEmail: email,
                adminPassword,
                adminCode,
            });
            setShowCreateSchoolAdminModal(false);
            setNewSchoolName("");
            setNewSchoolCode("");
            setNewSchoolAdminName("");
            setNewSchoolAdminEmail("");
            setNewSchoolAdminPassword("");
            setNewSchoolStudentLimit(100);

            toast.success("School onboarded successfully!");
            toast.warning("Copy credentials from the dialog — email delivery is not guaranteed.", { duration: 6000 });
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

    const handleFreezeUser = async (userId: string) => {
        setIsFreezing(true);
        try {
            const res = await freezeUser(userId);
            if (res.success) {
                toast.success(res.message || "User frozen successfully");
                setSelectedUser(prev => prev && prev.id === userId ? {
                    ...prev,
                    is_frozen: true,
                    subscription: { ...prev.subscription, plan: "Frozen", status: "frozen" }
                } : prev);
                fetchData();
            } else throw new Error(res.error || "Failed to freeze");
        } catch (err) {
            toast.error("Error freezing user: " + (err as Error).message);
        } finally {
            setIsFreezing(false);
        }
    };

    const handleUnfreezeUser = async (userId: string) => {
        setIsUnfreezing(true);
        try {
            const res = await unfreezeUser(userId);
            if (res.success) {
                toast.success(res.message || "User unfrozen successfully");
                setSelectedUser(prev => prev && prev.id === userId ? {
                    ...prev,
                    is_frozen: false,
                    subscription: { ...prev.subscription, plan: "Free Trial", status: "active" }
                } : prev);
                fetchData();
            } else throw new Error(res.error || "Failed to unfreeze");
        } catch (err) {
            toast.error("Error unfreezing user: " + (err as Error).message);
        } finally {
            setIsUnfreezing(false);
        }
    };

    useEffect(() => {
        if (!editingPlan) return
        setIsFeaturesLoading(true)
        getAvailableFeatures()
            .then(res => {
                setAvailableFeatures(res.features || [])
                const planId = editingPlan.id?.toString()
                if (planId && planId !== 'new') {
                    const saved = getPlanFeatures(planId)
                    setSelectedFeatures(saved)
                    const strikeOff = getPlanStrikeOff(planId)
                    if (strikeOff) {
                        setStrikeOffEnabled(true)
                        setStrikeOffPrice(strikeOff.price_inr)
                    } else {
                        setStrikeOffEnabled(false)
                        setStrikeOffPrice(0)
                    }
                } else {
                    setSelectedFeatures([])
                    setStrikeOffEnabled(false)
                    setStrikeOffPrice(0)
                }
            })
            .catch(() => {
                setAvailableFeatures([])
                setSelectedFeatures([])
            })
            .finally(() => setIsFeaturesLoading(false))
    }, [editingPlan?.id])

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
        const headers = ["ID", "Name", "Email", "Plan", "Status", "Chats", "Coding", "Vision", "Images", "Flux", "TTS", "STT"];
        const rows = users.map(u => [u.id, u.name, u.email, u.subscription.plan, u.subscription.status, u.subscription.daily_chats, u.subscription.daily_codings, u.subscription.daily_visions, u.subscription.monthly_images, u.subscription.monthly_flux, u.subscription.daily_tts, u.subscription.daily_stt]);
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
            <nav className={`h-20 flex items-center justify-between px-10 border-b ${isDarkMode ? "border-white bg-black/80" : "border-black bg-white/80"} backdrop-blur-2xl sticky top-0 z-[100]`}>
                <div className="flex items-center gap-12">
                    <Link href="/" className="flex items-center gap-4 group">
                        <div className="h-[30px] w-[30px] flex items-center justify-center transition-transform group-hover:rotate-45 overflow-hidden">
                            <img 
                                src={isDarkMode ? "/dark.png" : "/light.png"} 
                                alt="Logo" 
                                className="h-full w-full object-contain transition-transform duration-300"
                                style={{ transform: isDarkMode ? "scale(1.5)" : "none" }}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="h-5 flex items-center shrink-0 overflow-hidden">
                                <img 
                                    src={isDarkMode ? "/dark_text.png" : "/light_text.png"} 
                                    alt="Rudranex" 
                                    className="h-full object-contain"
                                />
                            </div>
                            <span className={`font-serif italic text-xl tracking-tighter ${isDarkMode ? "text-white/40" : "text-black/40"}`}>admin</span>
                        </div>
                    </Link>

                    <div className="hidden lg:flex items-center gap-8">
                        <button
                            onClick={() => setView('visual')}
                            className={`flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.2em] transition-all ${view === 'visual' ? "text-[#00DDDD] font-bold" : `${isDarkMode ? "text-white/40 hover:text-white" : "text-black hover:text-gray-500"}`}`}
                        >
                            <LayoutDashboard className={`h-3.5 w-3.5 ${isDarkMode ? "text-white" : "text-black"}`} /> Dashboard
                        </button>
                        <button
                            onClick={() => setView('table')}
                            className={`flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.2em] transition-all ${view === 'table' ? "text-[#00DDDD] font-bold" : `${isDarkMode ? "text-white/40 hover:text-white" : "text-black hover:text-gray-500"}`}`}
                        >
                            <TableIcon className={`h-3.5 w-3.5 ${isDarkMode ? "text-white" : "text-black"}`} /> Tabular
                        </button>
                        <button
                            onClick={() => setView('plans')}
                            className={`flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.2em] transition-all ${view === 'plans' ? "text-[#00DDDD] font-bold" : `${isDarkMode ? "text-white/40 hover:text-white" : "text-black hover:text-gray-500"}`}`}
                        >
                            <Zap className={`h-3.5 w-3.5 ${isDarkMode ? "text-white" : "text-black"}`} /> Plans
                        </button>
                        <button
                            onClick={() => { setView('schools'); fetchSchoolsData(); }}
                            className={`flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.2em] transition-all ${view === 'schools' ? "text-[#00DDDD] font-bold" : `${isDarkMode ? "text-white/40 hover:text-white" : "text-black hover:text-gray-500"}`}`}
                        >
                            <Users className={`h-3.5 w-3.5 ${isDarkMode ? "text-white" : "text-black"}`} /> Schools
                        </button>
                        <button
                            onClick={() => { setView('enterprises' as any); fetchEnterprisesData(); }}
                            className={`flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.2em] transition-all ${view === ('enterprises' as any) ? "text-[#00DDDD] font-bold" : `${isDarkMode ? "text-white/40 hover:text-white" : "text-black hover:text-gray-500"}`}`}
                        >
                            <Building2 className={`h-3.5 w-3.5 ${isDarkMode ? "text-white" : "text-black"}`} /> Enterprises
                        </button>
                        <button
                            onClick={() => setView('sites')}
                            className={`flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.2em] transition-all ${view === 'sites' ? "text-[#00DDDD] font-bold" : `${isDarkMode ? "text-white/40 hover:text-white" : "text-black hover:text-gray-500"}`}`}
                        >
                            <FileText className={`h-3.5 w-3.5 ${isDarkMode ? "text-white" : "text-black"}`} /> Sites
                        </button>
                        {/* Requests text tab removed; icon moved to right cluster */}
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <button
                        onClick={() => setShowCreateSchoolAdminModal(true)}
                        className="px-4 py-2 bg-emerald-600 text-white border border-emerald-500 text-[10px] font-mono uppercase tracking-[0.2em] hover:bg-emerald-500 transition-all rounded-full flex items-center gap-2"
                    >
                        <Plus className="h-3.5 w-3.5" />
                        Add School Admin
                    </button>
                    <button
                        onClick={() => setShowCreateEnterpriseModal(true)}
                        className="px-4 py-2 bg-orange-600 text-white border border-orange-500 text-[10px] font-mono uppercase tracking-[0.2em] hover:bg-orange-500 transition-all rounded-full flex items-center gap-2"
                    >
                        <Plus className="h-3.5 w-3.5" />
                        Add Enterprise Admin
                    </button>
                    {/* Navbar refresh removed as requested */}

                    <div className={`h-8 w-[1px] mx-2 ${isDarkMode ? "bg-white/20" : "bg-black/20"}`} />

                    <div className="flex items-center gap-4">
                        <div
                            onClick={() => setIsDarkMode(!isDarkMode)}
                            className={`h-10 w-10 rounded-2xl border flex items-center justify-center cursor-pointer transition-all ${isDarkMode ? "border-white/10 hover:bg-white/5" : "border-black/10 hover:bg-black/5"}`}
                        >
                            {isDarkMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                        </div>
                        <button
                            onClick={() => { setView('requests'); fetchRequests(); }}
                            className={`relative h-10 w-10 rounded-2xl border flex items-center justify-center transition-all ${isDarkMode ? 'border-white/10 hover:bg-white/5' : 'border-black/10 hover:bg-black/5'}`}
                            title="Notifications"
                        >
                            <Bell className={`h-4 w-4 ${isDarkMode ? 'text-white' : 'text-black'}`} />
                            {requests.filter(r => r.status === 'pending').length > 0 && (
                                <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-[8px] font-bold flex items-center justify-center text-white">
                                    {requests.filter(r => r.status === 'pending').length}
                                </span>
                            )}
                        </button>
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
                                <div className={`relative border border-zinc-800/50 p-8 rounded-[2.5rem] backdrop-blur-xl overflow-hidden group ${isDarkMode ? "bg-gradient-to-br from-zinc-900 via-black to-zinc-900" : "bg-gradient-to-br from-zinc-100 via-white to-zinc-100"
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

                                <div className={`relative border border-zinc-800/50 p-8 rounded-[2.5rem] backdrop-blur-xl text-center overflow-hidden group ${isDarkMode ? "bg-gradient-to-br from-zinc-900 via-black to-zinc-900" : "bg-gradient-to-br from-zinc-100 via-white to-zinc-100"
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
                                        <div className={`relative border border-zinc-800/50 p-10 rounded-[3rem] overflow-hidden group ${isDarkMode ? "bg-gradient-to-br from-zinc-900 via-black to-zinc-900" : "bg-gradient-to-br from-zinc-100 via-white to-zinc-100"
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
                                                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-mono uppercase tracking-widest ${selectedUser.subscription.status === 'active' ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" :
                                                                    selectedUser.subscription.status === 'frozen' ? "bg-red-500/20 text-red-400 border border-red-500/30" :
                                                                        "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                                                                }`}>
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
                                                    {selectedUser.is_frozen ? (
                                                        <button
                                                            onClick={() => handleUnfreezeUser(selectedUser.id)}
                                                            disabled={isUnfreezing}
                                                            className="px-8 py-4 bg-emerald-500 text-black text-[10px] font-mono uppercase tracking-[0.2em] font-bold hover:scale-105 active:scale-95 transition-all rounded-2xl flex items-center gap-3"
                                                        >
                                                            <Zap className="h-4 w-4" /> {isUnfreezing ? 'UNFREEZING...' : 'UNFREEZE'}
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleFreezeUser(selectedUser.id)}
                                                            disabled={isFreezing}
                                                            className="px-8 py-4 bg-red-500 text-white text-[10px] font-mono uppercase tracking-[0.2em] font-bold hover:scale-105 active:scale-95 transition-all rounded-2xl flex items-center gap-3"
                                                        >
                                                            <Zap className="h-4 w-4" /> {isFreezing ? 'FREEZING...' : 'FREEZE'}
                                                        </button>
                                                    )}
                                                    {confirmDeleteUserId === selectedUser.id ? (
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                onClick={() => handleDeleteUser(selectedUser.id)}
                                                                disabled={deletingUserId === selectedUser.id}
                                                                className="px-8 py-4 bg-red-600 text-white text-[10px] font-mono uppercase tracking-[0.2em] font-bold hover:scale-105 active:scale-95 transition-all rounded-2xl flex items-center gap-3 disabled:opacity-50"
                                                            >
                                                                {deletingUserId === selectedUser.id ? 'DELETING...' : 'CONFIRM DELETE'}
                                                            </button>
                                                            <button
                                                                onClick={() => setConfirmDeleteUserId(null)}
                                                                className={`p-4 border rounded-2xl transition-all ${isDarkMode ? "border-white/10 hover:bg-white/5 text-white" : "border-black/10 hover:bg-black/5 text-black"}`}
                                                            >
                                                                <X className="h-4 w-4" />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={() => setConfirmDeleteUserId(selectedUser.id)}
                                                            className="px-8 py-4 bg-red-500/10 border border-red-500/30 text-red-400 text-[10px] font-mono uppercase tracking-[0.2em] font-bold hover:scale-105 active:scale-95 transition-all rounded-2xl flex items-center gap-3"
                                                        >
                                                            <Trash2 className="h-4 w-4" /> DELETE
                                                        </button>
                                                    )}
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
                                                title="Audio Intelligence"
                                                value={selectedUser.subscription.daily_tts + selectedUser.subscription.daily_stt}
                                                icon={Activity}
                                                color="#00DDDD"
                                                subtext="TTS + STT"
                                                isDarkMode={isDarkMode}
                                            />
                                            <StatCard
                                                title="Intelligence Suite"
                                                value={selectedUser.subscription.daily_codings + selectedUser.subscription.daily_visions}
                                                icon={Cpu}
                                                color="#f59e0b"
                                                subtext="Code + Vision"
                                                isDarkMode={isDarkMode}
                                            />
                                            <StatCard
                                                title="Creative Suite"
                                                value={selectedUser.subscription.monthly_images + selectedUser.subscription.monthly_flux}
                                                icon={PieChart}
                                                color="#8b5cf6"
                                                subtext="Img + Flux"
                                                isDarkMode={isDarkMode}
                                            />
                                        </div>

                                        {/* Visualization Section */}
                                        <div className="grid grid-cols-12 gap-8">
                                            <div className={`relative col-span-12 lg:col-span-8 border border-zinc-800/50 p-10 rounded-[3rem] overflow-hidden group ${isDarkMode ? "bg-gradient-to-br from-zinc-900 via-black to-zinc-900" : "bg-gradient-to-br from-zinc-100 via-white to-zinc-100"
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
                                                        value={selectedUser.subscription.daily_chats}
                                                        limit={selectedUser.subscription.tokens_limit}
                                                        label="Daily Chat"
                                                        color="#10b981"
                                                        isDarkMode={isDarkMode}
                                                    />
                                                    <ProgressCircle
                                                        value={selectedUser.subscription.monthly_images + selectedUser.subscription.monthly_flux}
                                                        limit={selectedUser.subscription.images_limit}
                                                        label="Image Lab"
                                                        color="#8b5cf6"
                                                        isDarkMode={isDarkMode}
                                                    />
                                                    <ProgressCircle
                                                        value={selectedUser.subscription.daily_codings + selectedUser.subscription.daily_visions}
                                                        limit={Math.max(selectedUser.subscription.daily_coding_limit + selectedUser.subscription.daily_vision_limit, 1)}
                                                        label="AI Engine Load"
                                                        color="#f59e0b"
                                                        isDarkMode={isDarkMode}
                                                    />
                                                </div>
                                            </div>

                                            <div className={`relative col-span-12 lg:col-span-4 border border-zinc-800/50 p-10 rounded-[3rem] flex flex-col justify-between overflow-hidden group ${isDarkMode ? "bg-gradient-to-br from-zinc-900 via-black to-zinc-900" : "bg-gradient-to-br from-zinc-100 via-white to-zinc-100"
                                                }`}>
                                                <div className={`absolute inset-0 bg-[linear-gradient(110deg,transparent_0%,rgba(255,255,255,0.03)_45%,rgba(255,255,255,0.06)_50%,rgba(255,255,255,0.03)_55%,transparent_100%)] pointer-events-none`} />
                                                <div className="absolute inset-0 -translate-y-full group-hover:translate-y-full transition-transform duration-1000 bg-gradient-to-b from-transparent via-white/5 to-transparent pointer-events-none" />
                                                <div>
                                                    <div className="flex items-center gap-3 mb-6">
                                                        <TrendingUp className={`h-5 w-5 ${isDarkMode ? "text-emerald-400" : "text-emerald-600"}`} />
                                                        <h3 className={`text-xs font-display font-black uppercase tracking-[0.2em] ${isDarkMode ? "text-white" : "text-black"}`}>User Efficiency</h3>
                                                    </div>
                                                    <p className={`text-[10px] font-mono uppercase leading-relaxed tracking-widest ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>
                                                        Chat usage: <b>{selectedUser.subscription.daily_chats}/{selectedUser.subscription.tokens_limit}</b> daily • {selectedUser.subscription.daily_tts + selectedUser.subscription.daily_stt > 0 ? `Audio: ${selectedUser.subscription.daily_tts + selectedUser.subscription.daily_stt} uses • ` : ''}Images: {selectedUser.subscription.monthly_images + selectedUser.subscription.monthly_flux}/{selectedUser.subscription.images_limit} monthly
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

                                        {/* Activity Log Section */}
                                        <div className={`mt-8 border border-zinc-800/50 p-10 rounded-[3rem] overflow-hidden group ${isDarkMode ? "bg-gradient-to-br from-zinc-900 via-black to-zinc-900" : "bg-gradient-to-br from-zinc-100 via-white to-zinc-100"}`}>
                                            <div className="flex items-center justify-between mb-8">
                                                <div className="flex items-center gap-3">
                                                    <Activity className={`h-5 w-5 ${isDarkMode ? "text-cyan-400" : "text-cyan-600"}`} />
                                                    <h3 className={`text-xs font-display font-black uppercase tracking-[0.2em] ${isDarkMode ? "text-white" : "text-black"}`}>Neural Interaction Log</h3>
                                                </div>
                                                <span className={`text-[9px] font-mono uppercase tracking-widest ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>Live Uplink • Selected User</span>
                                            </div>
                                            <div className="space-y-3">
                                                {platformActivity.filter(a => a.user_name === selectedUser.name).slice(0, 5).map((log, i) => (
                                                    <div key={i} className={`flex items-center justify-between p-4 rounded-2xl border ${isDarkMode ? "bg-white/5 border-white/5" : "bg-black/5 border-black/5"}`}>
                                                        <div className="flex items-center gap-4">
                                                            <div className={`h-8 w-8 rounded-full flex items-center justify-center ${isDarkMode ? "bg-cyan-500/10 text-cyan-400" : "bg-cyan-500/10 text-cyan-600"}`}>
                                                                <MessageSquare className="h-4 w-4" />
                                                            </div>
                                                            <div>
                                                                <p className={`text-[11px] font-bold uppercase tracking-wider ${isDarkMode ? "text-white" : "text-black"}`}>{log.activity_type.replace('_', ' ')}</p>
                                                                <p className={`text-[9px] font-mono uppercase tracking-widest mt-0.5 ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>{log.institution}</p>
                                                            </div>
                                                        </div>
                                                        <span className={`text-[9px] font-mono ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>
                                                            {new Date(log.created_at).toLocaleTimeString()}
                                                        </span>
                                                    </div>
                                                ))}
                                                {platformActivity.filter(a => a.user_name === selectedUser.name).length === 0 && (
                                                    <div className="py-8 text-center opacity-30">
                                                        <p className="text-[10px] font-mono uppercase tracking-[0.2em]">No recent neural spikes detected</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div>
                                        <div className="flex flex-col justify-center h-[600px] text-center opacity-20">
                                            <Cpu className="h-24 w-24 mb-6 mx-auto" />
                                            <h2 className="text-2xl font-display font-black uppercase tracking-[0.5em]">Syncing Neural Net...</h2>
                                            <p className="text-xs font-mono uppercase tracking-[0.3em] mt-4">Select a user node to initialize data </p>
                                        </div>
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
                            className={`relative border border-zinc-800/50 rounded-[3rem] overflow-hidden backdrop-blur-3xl group ${isDarkMode ? "bg-gradient-to-br from-zinc-900 via-black to-zinc-900" : "bg-gradient-to-br from-zinc-100 via-white to-zinc-100"
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
                                            className={`pl-11 pr-8 py-3 text-[10px] font-mono tracking-widest border rounded-2xl focus:outline-none focus:border-emerald-500/50 min-w-[300px] ${isDarkMode ? "bg-white/5 border-white/10 text-white" : "bg-black/5 border-black/10 text-black placeholder:text-black/40"
                                                }`}
                                        />
                                    </div>
                                    <button
                                        onClick={handleExportCSV}
                                        className={`px-6 py-3.5 text-[10px] font-mono uppercase tracking-[0.2em] font-bold hover:opacity-90 transition-all rounded-2xl ${isDarkMode ? "bg-white text-black" : "bg-black text-white"
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
                                            <th className={`p-8 font-bold border-b ${isDarkMode ? "border-white/5" : "border-black/10"}`}>
                                                <button onClick={() => toggleSort("name")} className="flex items-center gap-1 hover:opacity-80 transition-all">
                                                    Identity {sortField === "name" ? (sortOrder === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 opacity-30" />}
                                                </button>
                                            </th>
                                            <th className={`p-8 font-bold border-b ${isDarkMode ? "border-white/5" : "border-black/10"}`}>
                                                <button onClick={() => toggleSort("plan")} className="flex items-center gap-1 hover:opacity-80 transition-all">
                                                    Subscription {sortField === "plan" ? (sortOrder === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 opacity-30" />}
                                                </button>
                                            </th>
                                            <th className={`p-8 font-bold border-b ${isDarkMode ? "border-white/5" : "border-black/10"} text-center`}>Resources</th>
                                            <th className={`p-8 font-bold border-b ${isDarkMode ? "border-white/5" : "border-black/10"}`}>
                                                <button onClick={() => toggleSort("latency")} className="flex items-center gap-1 hover:opacity-80 transition-all">
                                                    Chat / Usage {sortField === "latency" ? (sortOrder === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 opacity-30" />}
                                                </button>
                                            </th>
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
                                                                <div className={`h-1 w-1 rounded-full ${user.subscription.status === 'active' ? "bg-emerald-500" :
                                                                        user.subscription.status === 'frozen' ? "bg-red-500" :
                                                                            "bg-amber-500"
                                                                    }`} />
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
                                                        <div className="flex flex-col gap-1">
                                                            <div className="flex items-center gap-2">
                                                                <MessageSquare className="h-3 w-3 text-blue-500/50" />
                                                                <span className={`font-bold ${isDarkMode ? "text-white" : "text-black"}`}>{user.subscription.daily_chats}</span>
                                                                <span className={`text-[9px] ${isDarkMode ? "opacity-30 text-white" : "opacity-50 text-black"}`}>/ {user.subscription.tokens_limit} chats</span>
                                                            </div>
                                                            <span className={`text-[8px] font-mono ${isDarkMode ? "opacity-30 text-white" : "opacity-50 text-black"}`}>
                                                                {user.subscription.daily_codings}C · {user.subscription.daily_visions}V · {user.subscription.monthly_images}I
                                                            </span>
                                                        </div>
                                                    </td>
                                                     <td className="p-8 text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedUser(user);
                                                                    setView('visual');
                                                                }}
                                                                className={`px-5 py-2.5 border transition-all text-[9px] font-bold tracking-widest rounded-xl ${isDarkMode ? "border-white/5 hover:border-white/20 hover:bg-white/5 text-white" : "border-black/10 hover:border-black/20 hover:bg-black/5 text-black"}`}
                                                            >
                                                                Visualize
                                                            </button>
                                                            {confirmDeleteUserId === user.id ? (
                                                                <div className="flex items-center gap-1.5">
                                                                    <button
                                                                        onClick={() => handleDeleteUser(user.id)}
                                                                        disabled={deletingUserId === user.id}
                                                                        className="px-3 py-2 bg-red-500 text-white text-[9px] font-bold tracking-widest rounded-xl hover:bg-red-600 disabled:opacity-50 transition-all"
                                                                    >
                                                                        {deletingUserId === user.id ? '...' : 'CONFIRM'}
                                                                    </button>
                                                                    <button
                                                                        onClick={() => setConfirmDeleteUserId(null)}
                                                                        className={`p-2 border rounded-xl transition-all text-[9px] ${isDarkMode ? "border-white/10 hover:bg-white/5 text-white" : "border-black/10 hover:bg-black/5 text-black"}`}
                                                                    >
                                                                        <X className="h-3 w-3" />
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <button
                                                                    onClick={() => setConfirmDeleteUserId(user.id)}
                                                                    className={`p-2.5 border rounded-xl transition-all hover:border-red-500/40 hover:text-red-400 hover:bg-red-500/5 ${isDarkMode ? "border-white/5 text-white/40" : "border-black/10 text-black/40"}`}
                                                                    title="Delete user"
                                                                >
                                                                    <Trash2 className="h-3.5 w-3.5" />
                                                                </button>
                                                            )}
                                                        </div>
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

                    {/* Sites View */}
                    {view === 'sites' && (
                        <motion.div
                            key="sites"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="p-4 sm:p-6 lg:p-10"
                        >
                            <div className={`border border-zinc-800/50 rounded-[3rem] overflow-hidden backdrop-blur-3xl ${isDarkMode ? "bg-gradient-to-br from-zinc-900 via-black to-zinc-900" : "bg-gradient-to-br from-zinc-100 via-white to-zinc-100"
                                }`}>
                                <div className={`p-10 border-b flex items-center justify-between ${isDarkMode ? "border-white/10" : "border-black/10"}`}>
                                    <div>
                                        <h2 className={`text-3xl font-display font-black tracking-tight uppercase ${isDarkMode ? "text-white" : "text-black"}`}>Site Pages</h2>
                                        <p className={`text-[10px] font-mono uppercase mt-2 tracking-[0.4em] ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>Manage About Us, Privacy Policy, Terms & Contact</p>
                                    </div>
                                    <button
                                        onClick={fetchData}
                                        className={`p-3 rounded-full border transition-all ${isDarkMode ? "border-white/10 hover:bg-white/5 text-white" : "border-black/10 hover:bg-black/5 text-black"}`}
                                    >
                                        <RefreshCw className={`h-4 w-4 ${isDarkMode ? "opacity-40" : "opacity-60"}`} />
                                    </button>
                                </div>
                                <div className="p-10">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {[
                                            { key: 'about_us', label: 'About Us', icon: 'ℹ️' },
                                            { key: 'privacy_policy', label: 'Privacy Policy', icon: '🔒' },
                                            { key: 'terms_conditions', label: 'Terms of Service', icon: '📜' },
                                            { key: 'contact_info', label: 'Contact Us', icon: '📧' },
                                        ].map((page) => {
                                            const setting = siteSettings.find(s => s.key === page.key)
                                            return (
                                                <div
                                                    key={page.key}
                                                    className={`relative border rounded-[2.5rem] p-8 transition-all hover:scale-[1.02] overflow-hidden group cursor-pointer ${isDarkMode
                                                            ? "border-zinc-800/50 bg-gradient-to-br from-zinc-900 via-black to-zinc-900"
                                                            : "border-zinc-800/50 bg-gradient-to-br from-zinc-100 via-white to-zinc-100"
                                                        }`}
                                                    onClick={() => {
                                                        const raw = setting?.value || '';
                                                        setEditingSiteSetting({ key: page.key, value: raw });
                                                        try {
                                                            const parsed = JSON.parse(raw);
                                                            if (page.key === 'about_us' && Array.isArray(parsed.sections) && !parsed.elements) {
                                                                setSiteFormData({ elements: parsed.sections.map((s: string) => ({ type: 'paragraph', content: s })) });
                                                            } else if (page.key === 'contact_info' && parsed.description && !parsed.paragraphs) {
                                                                setSiteFormData({ paragraphs: [parsed.description], email: parsed.email || '', responseTime: parsed.responseTime || '' });
                                                            } else {
                                                                setSiteFormData(parsed);
                                                            }
                                                        } catch {
                                                            if (page.key === 'about_us') {
                                                                setSiteFormData({ elements: raw.split('\n\n').filter(Boolean).map((p: string) => ({ type: 'paragraph', content: p })) });
                                                            } else if (page.key === 'contact_info') {
                                                                setSiteFormData({ paragraphs: raw.split('\n\n').filter(Boolean), email: '', responseTime: '' });
                                                            } else {
                                                                setSiteFormData(null);
                                                            }
                                                        }
                                                    }}
                                                >
                                                    <div className={`absolute inset-0 bg-[linear-gradient(110deg,transparent_0%,rgba(255,255,255,0.03)_45%,rgba(255,255,255,0.06)_50%,rgba(255,255,255,0.03)_55%,transparent_100%)] pointer-events-none`} />
                                                    <div className="absolute inset-0 -translate-y-full group-hover:translate-y-full transition-transform duration-1000 bg-gradient-to-b from-transparent via-white/5 to-transparent pointer-events-none" />
                                                    <div className="flex items-center justify-between mb-4">
                                                        <h3 className={`text-lg font-display font-black tracking-tight ${isDarkMode ? "text-white" : "text-black"}`}>{page.label}</h3>
                                                        <span className="text-2xl">{page.icon}</span>
                                                    </div>
                                                    <p className={`text-[10px] font-mono line-clamp-3 leading-relaxed ${isDarkMode ? "text-white/40" : "text-black/50"}`}>
                                                        {setting?.value?.substring(0, 150) || 'No content yet...'}
                                                    </p>
                                                    <div className={`mt-4 text-[9px] font-mono uppercase tracking-widest ${isDarkMode ? "text-white/20" : "text-black/30"}`}>
                                                        Click to edit
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Requests View */}
                    {view === 'requests' && (
                        <motion.div
                            key="requests"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="p-4 sm:p-6 lg:p-10"
                        >
                            <div className={`border border-zinc-800/50 rounded-[3rem] overflow-hidden backdrop-blur-3xl ${isDarkMode ? "bg-gradient-to-br from-zinc-900 via-black to-zinc-900" : "bg-gradient-to-br from-zinc-100 via-white to-zinc-100"
                                }`}>
                                <div className={`p-10 border-b flex items-center justify-between ${isDarkMode ? "border-white/10" : "border-black/10"}`}>
                                    <div>
                                        <h2 className={`text-3xl font-display font-black tracking-tight uppercase ${isDarkMode ? "text-white" : "text-black"}`}>School Onboarding Requests</h2>
                                        <p className={`text-[10px] font-mono uppercase mt-2 tracking-[0.4em] ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>
                                            {requests.filter(r => r.status === 'pending').length} pending
                                        </p>
                                    </div>
                                    <button
                                        onClick={fetchRequests}
                                        className={`p-3 rounded-full border transition-all ${isDarkMode ? "border-white/10 hover:bg-white/5 text-white" : "border-black/10 hover:bg-black/5 text-black"} ${isRequestsLoading ? "animate-spin" : ""}`}
                                    >
                                        <RefreshCw className={`h-4 w-4 ${isDarkMode ? "opacity-40" : "opacity-60"}`} />
                                    </button>
                                </div>

                                {requests.length === 0 ? (
                                    <div className="p-20 text-center">
                                        <Bell className={`h-12 w-12 mx-auto mb-6 ${isDarkMode ? "opacity-20 text-white" : "opacity-30 text-black"}`} />
                                        <h3 className={`text-xl font-display font-black mb-2 ${isDarkMode ? "text-white" : "text-black"}`}>No Requests</h3>
                                        <p className={`text-xs max-w-md mx-auto ${isDarkMode ? "text-white/40" : "text-black/40"}`}>
                                            No school onboarding requests yet. Schools can submit requests from the /schools page.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className={`border-b ${isDarkMode ? "border-white/5" : "border-black/5"}`}>
                                                    <th className="text-left p-6 text-[9px] font-mono uppercase tracking-[0.3em] opacity-40">School</th>
                                                    <th className="text-left p-6 text-[9px] font-mono uppercase tracking-[0.3em] opacity-40">Admin</th>
                                                    <th className="text-left p-6 text-[9px] font-mono uppercase tracking-[0.3em] opacity-40">Email</th>
                                                    <th className="text-left p-6 text-[9px] font-mono uppercase tracking-[0.3em] opacity-40">Status</th>
                                                    <th className="text-left p-6 text-[9px] font-mono uppercase tracking-[0.3em] opacity-40">Date</th>
                                                    <th className="text-right p-6 text-[9px] font-mono uppercase tracking-[0.3em] opacity-40">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {requests.map((req) => (
                                                    <tr key={req.id} className={`border-b transition-all ${isDarkMode ? "border-white/5 hover:bg-white/[0.02]" : "border-black/5 hover:bg-black/[0.02]"}`}>
                                                        <td className="p-6">
                                                            <span className={`text-xs font-bold ${isDarkMode ? "text-white" : "text-black"}`}>{req.school_name}</span>
                                                        </td>
                                                        <td className="p-6">
                                                            <span className={`text-xs ${isDarkMode ? "text-white/60" : "text-black/60"}`}>{req.admin_name}</span>
                                                        </td>
                                                        <td className="p-6">
                                                            <span className={`text-xs font-mono ${isDarkMode ? "text-white/40" : "text-black/40"}`}>{req.admin_email}</span>
                                                        </td>
                                                        <td className="p-6">
                                                            <span className={`px-3 py-1 rounded-full text-[9px] font-mono uppercase tracking-widest font-bold ${req.status === 'pending'
                                                                    ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                                                                    : req.status === 'approved'
                                                                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                                                        : "bg-red-500/20 text-red-400 border border-red-500/30"
                                                                }`}>
                                                                {req.status}
                                                            </span>
                                                        </td>
                                                        <td className="p-6">
                                                            <span className={`text-[10px] font-mono ${isDarkMode ? "text-white/30" : "text-black/30"}`}>
                                                                {new Date(req.created_at).toLocaleDateString()}
                                                            </span>
                                                        </td>
                                                        <td className="p-6 text-right">
                                                            {req.status === 'pending' && (
                                                                <div className="flex items-center justify-end gap-3">
                                                                    <button
                                                                        onClick={() => handleApproveRequest(req)}
                                                                        className="px-5 py-2 bg-emerald-500 text-black text-[9px] font-mono uppercase tracking-[0.2em] font-bold rounded-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                                                                    >
                                                                        <Check className="h-3 w-3" />
                                                                        Approve
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleDeclineRequest(req)}
                                                                        disabled={decliningRequestId === req.id}
                                                                        className="px-5 py-2 bg-red-500/20 border border-red-500/30 text-red-400 text-[9px] font-mono uppercase tracking-[0.2em] font-bold rounded-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2"
                                                                    >
                                                                        {decliningRequestId === req.id ? (
                                                                            <RefreshCw className="h-3 w-3 animate-spin" />
                                                                        ) : (
                                                                            <X className="h-3 w-3" />
                                                                        )}
                                                                        Decline
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {/* Schools View */}
                    {view === 'schools' && (
                        <motion.div
                            key="schools"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="p-0 sm:p-0 lg:p-0"
                        >
                            <div className={`${isDarkMode ? 'bg-gradient-to-br from-zinc-900 via-black to-zinc-900 border-white/20' : 'bg-gradient-to-br from-zinc-100 via-white to-zinc-100 border-black'} border rounded-none overflow-hidden backdrop-blur-3xl min-h-[calc(100vh-80px)]`}>
                                <div className="p-4 lg:p-6">
                                    {/* Controls: search, dates, rows per page */}
                                    <div className="flex flex-col md:flex-row md:items-end gap-4 mb-6 justify-between">
                                        <div className="flex-1 min-w-[220px]">
                                            <label className={`block text-[9px] font-mono uppercase tracking-widest mb-1 ${isDarkMode ? 'opacity-50' : 'opacity-60'}`}>Search</label>
                                            <div className="relative">
                                                <Search className={`absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 ${isDarkMode ? 'opacity-30 text-white' : 'opacity-40 text-black'}`} />
                                                <input
                                                    value={schoolsSearch}
                                                    onChange={(e) => { setSchoolsSearch(e.target.value); setSchoolsPage(1); }}
                                                    placeholder="Search name or code..."
                                                    className={`w-full pl-9 pr-3 py-2 text-xs font-mono rounded-xl border ${isDarkMode ? 'bg-white/5 border-white/10 text-white placeholder:text-white/30' : 'bg-black/5 border-black/10 text-black placeholder:text-black/40'}`}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className={`block text-[9px] font-mono uppercase tracking-widest mb-1 ${isDarkMode ? 'opacity-50' : 'opacity-60'}`}>From</label>
                                            <input type="date" value={schoolsDateFrom} onChange={(e) => { setSchoolsDateFrom(e.target.value); setSchoolsPage(1); }} className={`px-3 py-2 text-xs font-mono rounded-xl border ${isDarkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-black/5 border-black/10 text-black'}`} />
                                        </div>
                                        <div>
                                            <label className={`block text-[9px] font-mono uppercase tracking-widest mb-1 ${isDarkMode ? 'opacity-50' : 'opacity-60'}`}>To</label>
                                            <input type="date" value={schoolsDateTo} onChange={(e) => { setSchoolsDateTo(e.target.value); setSchoolsPage(1); }} className={`px-3 py-2 text-xs font-mono rounded-xl border ${isDarkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-black/5 border-black/10 text-black'}`} />
                                        </div>
                                        <div>
                                            <label className={`block text-[9px] font-mono uppercase tracking-widest mb-1 ${isDarkMode ? 'opacity-50' : 'opacity-60'}`}>Rows</label>
                                            <select value={schoolsRowsPerPage} onChange={(e) => { setSchoolsRowsPerPage(parseInt(e.target.value) || 10); setSchoolsPage(1); }} className={`px-3 py-2 text-xs font-mono rounded-xl border ${isDarkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-black/5 border-black/10 text-black'}`}>
                                                <option value={10}>10</option>
                                                <option value={25}>25</option>
                                                <option value={50}>50</option>
                                                <option value={100}>100</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className={`block text-[9px] font-mono uppercase tracking-widest mb-1 opacity-0 select-none`}>Refresh</label>
                                            <button
                                                onClick={fetchSchoolsData}
                                                className={`h-10 w-10 rounded-xl border flex items-center justify-center transition-all ${isDarkMode ? 'border-white/10 hover:bg-white/5 text-white' : 'border-black/10 hover:bg-black/5 text-black'} ${isSchoolsLoading ? 'animate-spin' : ''}`}
                                                title="Refresh"
                                            >
                                                <RefreshCw className={`h-4 w-4 ${isDarkMode ? 'opacity-60' : 'opacity-60'}`} />
                                            </button>
                                        </div>
                                    </div>
                                    {/* Schools List */}
                                    <div className={`relative border rounded-[1rem] overflow-hidden ${isDarkMode ? 'border-white/10 bg-white/[0.03]' : 'border-black bg-black/[0.02]'}`}>
                                        <div className={`p-6 border-b ${isDarkMode ? 'border-white/10' : 'border-black' } flex items-center justify-between`}>
                                            <h3 className={`text-lg font-display font-black ${isDarkMode ? 'text-white' : 'text-black'}`}>Schools</h3>
                                            <span className={`text-[10px] font-mono uppercase tracking-widest ${isDarkMode ? 'opacity-40' : 'opacity-60'}`}>{processedSchools.length} results</span>
                                        </div>
                                        {isSchoolsLoading ? (
                                            <div className="p-10 text-center text-[10px] font-mono opacity-40">Loading...</div>
                                        ) : processedSchools.length === 0 ? (
                                            <div className="p-10 text-center text-[10px] font-mono opacity-40">No schools found</div>
                                        ) : (
                                            <div className="overflow-x-auto">
                                                <table className={`w-full border ${isDarkMode ? 'border-white/10' : 'border-black'} rounded-xl overflow-hidden`}>
                                                    <thead>
                                                        <tr className={`${isDarkMode ? 'text-white/60' : 'text-black/70'} text-[9px] font-mono uppercase tracking-[0.3em] border-b ${isDarkMode ? 'border-white/10' : 'border-black'}`}>
                                                            <th className="p-4 text-left">
                                                                <button onClick={() => toggleSchoolsSort('name')} className="flex items-center gap-1 hover:opacity-80">
                                                                    Name {schoolsSortField === 'name' ? (schoolsSortOrder === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 opacity-40" />}
                                                                </button>
                                                            </th>
                                                            <th className="p-4 text-left">
                                                                <button onClick={() => toggleSchoolsSort('code')} className="flex items-center gap-1 hover:opacity-80">
                                                                    Code {schoolsSortField === 'code' ? (schoolsSortOrder === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 opacity-40" />}
                                                                </button>
                                                            </th>
                                                            <th className="p-4 text-left">
                                                                <button onClick={() => toggleSchoolsSort('created')} className="flex items-center gap-1 hover:opacity-80">
                                                                    Created {schoolsSortField === 'created' ? (schoolsSortOrder === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 opacity-40" />}
                                                                </button>
                                                            </th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {visibleSchools.map((s) => (
                                                            <React.Fragment key={s.id}>
                                                                 <tr
                                                                     onClick={() => {
                                                                         const willOpen = selectedSchool?.id !== s.id;
                                                                         setSelectedSchool(prev => prev?.id === s.id ? null : s);
                                                                         if (willOpen && !facultyBySchool[s.school_code]) {
                                                                             loadFacultyForSchool(s.school_code)
                                                                         }
                                                                     }}
                                                                     className={`border-b cursor-pointer transition-colors ${isDarkMode ? 'border-white/10 hover:bg-white/[0.04]' : 'border-black/20 hover:bg-black/[0.03]'} ${selectedSchool?.id === s.id ? (isDarkMode ? 'bg-emerald-500/10' : 'bg-emerald-500/10') : ''}`}
                                                                 >
                                                                    <td className="p-4 text-sm font-bold">{s.school_name}</td>
                                                                    <td className="p-4 text-xs font-mono opacity-80">{s.school_code}</td>
                                                                    <td className="p-4 text-xs font-mono opacity-60">{new Date(s.created_at).toLocaleDateString()}</td>
                                                                </tr>
                                                                {selectedSchool?.id === s.id && (
                                                                    <tr>
                                                                        <td className="p-0" colSpan={3}>
                                                                            <div className={`p-4 sm:p-6 ${isDarkMode ? 'bg-white/[0.02] border-t border-white/10' : 'bg-black/[0.02] border-t border-black'}`}>
                                                                                <div className="flex items-center justify-between mb-3">
                                                                                    <h4 className={`text-sm font-display font-black ${isDarkMode ? 'text-white' : 'text-black'}`}>Admins</h4>
                                                                                    <button
                                                                                        onClick={() => setSelectedSchool(null)}
                                                                                        className={`text-[10px] font-mono uppercase tracking-widest underline ${isDarkMode ? 'text-white/80 hover:text-white' : 'text-black/60 hover:text-black'}`}
                                                                                    >
                                                                                        Close
                                                                                    </button>
                                                                                </div>
                                                                                  {schoolAdmins.filter(a => a.school_name === s.school_name).length === 0 ? (
                                                                                      <div className={`text-[10px] font-mono opacity-60 ${isDarkMode ? 'text-white' : 'text-black'}`}>No admins for this school</div>
                                                                                  ) : (
                                                                                      <div className="overflow-x-auto">
                                                                                          <table className={`w-full border ${isDarkMode ? 'border-white/10' : 'border-black'} rounded-xl overflow-hidden`}>
                                                                                              <thead>
                                                                                                  <tr className={`${isDarkMode ? 'text-white/60' : 'text-black/70'} text-[9px] font-mono uppercase tracking-[0.3em] border-b ${isDarkMode ? 'border-white/10' : 'border-black'}`}>
                                                                                                      <th className="p-3 text-left">Name</th>
                                                                                                      <th className="p-3 text-left">Admin Code</th>
                                                                                                      <th className="p-3 text-left">Students</th>
                                                                                                      <th className="p-3 text-left">Email</th>
                                                                                                      <th className="p-3 text-right">Actions</th>
                                                                                                      <th className="p-3 text-right">Delete</th>
                                                                                                  </tr>
                                                                                              </thead>
                                                                                              <tbody>
                                                                                                  {schoolAdmins.filter(a => a.school_name === s.school_name).map((a) => {
                                                                                                      const isFrozen = frozenAdminIds.includes(a.id);
                                                                                                      return (
                                                                                                          <tr key={a.id} className={`${isDarkMode ? 'border-white/10' : 'border-black/20'} border-b`}>
                                                                                                              <td className="p-3">
                                                                                                                  <div className="flex items-center gap-2">
                                                                                                                      <span className="text-sm font-bold">{a.name}</span>
                                                                                                                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono uppercase tracking-widest ${isFrozen ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'}`}>{isFrozen ? 'frozen' : 'active'}</span>
                                                                                                                  </div>
                                                                                                              </td>
                                                                                                              <td className="p-3 text-xs font-mono">{a.admin_code}</td>
                                                                                                              <td className="p-3 text-xs font-mono">{a.student_count}</td>
                                                                                                              <td className="p-3 text-xs font-mono opacity-80">{a.email || '-'}</td>
                                                                                                               <td className="p-3 text-right">
                                                                                                                  {isFrozen ? (
                                                                                                                      <button
                                                                                                                          onClick={() => handleUnfreezeAdmin(a.id)}
                                                                                                                          disabled={freezingAdminId === a.id}
                                                                                                                          className="px-3 py-1.5 bg-emerald-500 text-black text-[10px] font-mono uppercase tracking-[0.2em] rounded-lg hover:scale-105 active:scale-95 transition-all"
                                                                                                                      >
                                                                                                                          {freezingAdminId === a.id ? 'UNFREEZING...' : 'UNFREEZE'}
                                                                                                                      </button>
                                                                                                                  ) : (
                                                                                                                      <button
                                                                                                                          onClick={() => handleFreezeAdmin(a.id)}
                                                                                                                          disabled={freezingAdminId === a.id}
                                                                                                                          className="px-3 py-1.5 bg-red-500 text-white text-[10px] font-mono uppercase tracking-[0.2em] rounded-lg hover:scale-105 active:scale-95 transition-all"
                                                                                                                      >
                                                                                                                          {freezingAdminId === a.id ? 'FREEZING...' : 'FREEZE'}
                                                                                                                      </button>
                                                                                                                  )}
                                                                                                               </td>
                                                                                                               <td className="p-3 text-right">
                                                                                                                   {confirmDeleteSchoolAdminId === a.id ? (
                                                                                                                       <div className="flex items-center justify-end gap-1">
                                                                                                                           <button
                                                                                                                               onClick={() => handleDeleteSchoolAdmin(a.id)}
                                                                                                                               disabled={deletingSchoolAdminId === a.id}
                                                                                                                               className="px-2 py-1.5 bg-red-600 text-white text-[9px] font-bold tracking-widest rounded-lg hover:bg-red-700 disabled:opacity-50 transition-all"
                                                                                                                           >
                                                                                                                               {deletingSchoolAdminId === a.id ? '...' : 'CONFIRM'}
                                                                                                                           </button>
                                                                                                                           <button
                                                                                                                               onClick={() => setConfirmDeleteSchoolAdminId(null)}
                                                                                                                               className={`p-1.5 border rounded-lg transition-all ${isDarkMode ? "border-white/10 hover:bg-white/5 text-white" : "border-black/10 hover:bg-black/5 text-black"}`}
                                                                                                                           >
                                                                                                                               <X className="h-3 w-3" />
                                                                                                                           </button>
                                                                                                                       </div>
                                                                                                                   ) : (
                                                                                                                       <button
                                                                                                                           onClick={() => setConfirmDeleteSchoolAdminId(a.id)}
                                                                                                                           className={`p-1.5 border rounded-lg transition-all hover:border-red-500/40 hover:text-red-400 hover:bg-red-500/5 ${isDarkMode ? "border-white/10 text-white/40" : "border-black/10 text-black/40"}`}
                                                                                                                           title="Delete admin"
                                                                                                                       >
                                                                                                                           <Trash2 className="h-3 w-3" />
                                                                                                                       </button>
                                                                                                                   )}
                                                                                                               </td>
                                                                                                          </tr>
                                                                                                      );
                                                                                                  })}
                                                                                              </tbody>
                                                                                          </table>
                                                                                      </div>
                                                                                  )}

                                                                                  {/* Faculty List */}
                                                                                  <div className={`mt-6 ${isDarkMode ? '' : ''}`}>
                                                                                      <div className="flex items-center justify-between mb-2">
                                                                                          <h4 className={`text-sm font-display font-black ${isDarkMode ? 'text-white' : 'text-black'}`}>Faculty</h4>
                                                                                          {facultyLoadingCodes.has(s.school_code) && (
                                                                                              <span className={`text-[10px] font-mono ${isDarkMode ? 'text-white/60' : 'text-black/60'}`}>Loading...</span>
                                                                                          )}
                                                                                      </div>
                                                                                      {(!facultyBySchool[s.school_code] || facultyBySchool[s.school_code].length === 0) && !facultyLoadingCodes.has(s.school_code) ? (
                                                                                          <div className={`text-[10px] font-mono opacity-60 ${isDarkMode ? 'text-white' : 'text-black'}`}>No faculty found</div>
                                                                                      ) : (
                                                                                          <div className="overflow-x-auto">
                                                                                              <table className={`w-full border ${isDarkMode ? 'border-white/10' : 'border-black'} rounded-xl overflow-hidden`}>
                                                                                                  <thead>
                                                                                                      <tr className={`${isDarkMode ? 'text-white/60' : 'text-black/70'} text-[9px] font-mono uppercase tracking-[0.3em] border-b ${isDarkMode ? 'border-white/10' : 'border-black'}`}>
                                                                                                          <th className="p-3 text-left">Name</th>
                                                                                                          <th className="p-3 text-left">Admin Code</th>
                                                                                                          <th className="p-3 text-left">Class</th>
                                                                                                          <th className="p-3 text-left">Email</th>
                                                                                                          <th className="p-3 text-right">Delete</th>
                                                                                                      </tr>
                                                                                                  </thead>
                                                                                                  <tbody>
                                                                                                      {(facultyBySchool[s.school_code] || []).map((f) => {
                                                                                                          const actionKey = f.id || f.admin_code || "";
                                                                                                          return (
                                                                                                          <tr key={f.id || f.admin_code} className={`${isDarkMode ? 'border-white/10' : 'border-black/20'} border-b`}>
                                                                                                              <td className="p-3 text-sm font-bold">{f.name}</td>
                                                                                                              <td className="p-3 text-xs font-mono">{f.admin_code || '—'}</td>
                                                                                                              <td className="p-3 text-xs font-mono">{f.assigned_class || '—'}</td>
                                                                                                              <td className="p-3 text-xs font-mono opacity-80">{f.email || '—'}</td>
                                                                                                              <td className="p-3 text-right">
                                                                                                                  {confirmDeleteFacultyCode === actionKey ? (
                                                                                                                      <div className="flex items-center justify-end gap-1">
                                                                                                                          <button
                                                                                                                              onClick={() => handleDeleteFacultyFromDashboard(f, s.school_code)}
                                                                                                                              disabled={deletingFacultyCode === actionKey || !actionKey}
                                                                                                                              className="px-2 py-1.5 bg-red-600 text-white text-[9px] font-bold tracking-widest rounded-lg hover:bg-red-700 disabled:opacity-50 transition-all"
                                                                                                                          >
                                                                                                                              {deletingFacultyCode === actionKey ? '...' : 'CONFIRM'}
                                                                                                                          </button>
                                                                                                                          <button
                                                                                                                              onClick={() => setConfirmDeleteFacultyCode(null)}
                                                                                                                              className={`p-1.5 border rounded-lg transition-all ${isDarkMode ? "border-white/10 hover:bg-white/5 text-white" : "border-black/10 hover:bg-black/5 text-black"}`}
                                                                                                                          >
                                                                                                                              <X className="h-3 w-3" />
                                                                                                                          </button>
                                                                                                                      </div>
                                                                                                                  ) : (
                                                                                                                      <button
                                                                                                                          onClick={() => actionKey && setConfirmDeleteFacultyCode(actionKey)}
                                                                                                                          className={`p-1.5 border rounded-lg transition-all hover:border-red-500/40 hover:text-red-400 hover:bg-red-500/5 ${isDarkMode ? "border-white/10 text-white/40" : "border-black/10 text-black/40"}`}
                                                                                                                          title="Delete faculty"
                                                                                                                          disabled={!actionKey}
                                                                                                                      >
                                                                                                                          <Trash2 className="h-3 w-3" />
                                                                                                                      </button>
                                                                                                                  )}
                                                                                                              </td>
                                                                                                          </tr>
                                                                                                          );
                                                                                                      })}
                                                                                                  </tbody>
                                                                                              </table>
                                                                                          </div>
                                                                                      )}
                                                                                  </div>
                                                                              </div>
                                                                          </td>
                                                                      </tr>
                                                                  )}
                                                            </React.Fragment>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                        {/* Pagination */}
                                        <div className={`p-4 flex items-center justify-between border-t ${isDarkMode ? 'border-white/10' : 'border-black/10'}`}>
                                            <div className={`text-[10px] font-mono ${isDarkMode ? 'text-white/60' : 'text-black/60'}`}>Page {schoolsPage} / {schoolsTotalPages}</div>
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => setSchoolsPage(p => Math.max(1, p - 1))} disabled={schoolsPage === 1} className={`px-3 py-1.5 rounded-lg border text-[10px] ${isDarkMode ? 'border-white/10 text-white/80 disabled:opacity-30 hover:bg-white/5' : 'border-black/10 text-black/80 disabled:opacity-30 hover:bg-black/5'}`}>Prev</button>
                                                <button onClick={() => setSchoolsPage(p => Math.min(schoolsTotalPages, p + 1))} disabled={schoolsPage === schoolsTotalPages} className={`px-3 py-1.5 rounded-lg border text-[10px] ${isDarkMode ? 'border-white/10 text-white/80 disabled:opacity-30 hover:bg-white/5' : 'border-black/10 text-black/80 disabled:opacity-30 hover:bg-black/5'}`}>Next</button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Admins are rendered inline within the selected school's row */}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Enterprises View */}
                    {view === 'enterprises' && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="p-10"
                        >
                            <div className={`${isDarkMode ? 'bg-gradient-to-br from-zinc-900 via-black to-zinc-900 border-white/20' : 'bg-gradient-to-br from-zinc-100 via-white to-zinc-100 border-black'} border rounded-none overflow-hidden backdrop-blur-3xl min-h-[calc(100vh-80px)]`}>
                                <div className="p-4 lg:p-6">
                                    {/* Stat Cards Row */}
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                                        <StatCard
                                            title="Total Enterprises"
                                            value={enterprises.length}
                                            icon={Building2}
                                            color="#00DDDD"
                                            isDarkMode={isDarkMode}
                                        />
                                        <StatCard
                                            title="Total Employees"
                                            value={enterpriseStats.reduce((sum, item) => sum + (item.student_count || 0), 0)}
                                            icon={Users}
                                            color="#FFA500"
                                            isDarkMode={isDarkMode}
                                        />
                                        <StatCard
                                            title="AI Operations"
                                            value={enterpriseStats.reduce((sum, item) => sum + (item.total_ai_requests || 0), 0)}
                                            icon={Cpu}
                                            color="#10B981"
                                            isDarkMode={isDarkMode}
                                        />
                                        <StatCard
                                            title="Active B2B Admins"
                                            value={enterpriseStats.reduce((sum, item) => sum + (item.admin_count || 0), 0)}
                                            icon={ShieldCheck}
                                            color="#EC4899"
                                            isDarkMode={isDarkMode}
                                        />
                                    </div>

                                    {/* Controls: search, dates, rows per page */}
                                    <div className="flex flex-col md:flex-row md:items-end gap-4 mb-6 justify-between">
                                        <div className="flex-1 min-w-[220px]">
                                            <label className={`block text-[9px] font-mono uppercase tracking-widest mb-1 ${isDarkMode ? 'opacity-50' : 'opacity-60'}`}>Search</label>
                                            <div className="relative">
                                                <Search className={`absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 ${isDarkMode ? 'opacity-30 text-white' : 'opacity-40 text-black'}`} />
                                                <input
                                                    value={enterprisesSearch}
                                                    onChange={(e) => { setEnterprisesSearch(e.target.value); setEnterprisesPage(1); }}
                                                    placeholder="Search enterprise name or code..."
                                                    className={`w-full pl-9 pr-3 py-2 text-xs font-mono rounded-xl border ${isDarkMode ? 'bg-white/5 border-white/10 text-white placeholder:text-white/30' : 'bg-black/5 border-black/10 text-black placeholder:text-black/40'}`}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className={`block text-[9px] font-mono uppercase tracking-widest mb-1 ${isDarkMode ? 'opacity-50' : 'opacity-60'}`}>From</label>
                                            <input type="date" value={enterprisesDateFrom} onChange={(e) => { setEnterprisesDateFrom(e.target.value); setEnterprisesPage(1); }} className={`px-3 py-2 text-xs font-mono rounded-xl border ${isDarkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-black/5 border-black/10 text-black'}`} />
                                        </div>
                                        <div>
                                            <label className={`block text-[9px] font-mono uppercase tracking-widest mb-1 ${isDarkMode ? 'opacity-50' : 'opacity-60'}`}>To</label>
                                            <input type="date" value={enterprisesDateTo} onChange={(e) => { setEnterprisesDateTo(e.target.value); setEnterprisesPage(1); }} className={`px-3 py-2 text-xs font-mono rounded-xl border ${isDarkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-black/5 border-black/10 text-black'}`} />
                                        </div>
                                        <div>
                                            <label className={`block text-[9px] font-mono uppercase tracking-widest mb-1 ${isDarkMode ? 'opacity-50' : 'opacity-60'}`}>Rows</label>
                                            <select value={enterprisesRowsPerPage} onChange={(e) => { setEnterprisesRowsPerPage(parseInt(e.target.value) || 10); setEnterprisesPage(1); }} className={`px-3 py-2 text-xs font-mono rounded-xl border ${isDarkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-black/5 border-black/10 text-black'}`}>
                                                <option value={10}>10</option>
                                                <option value={25}>25</option>
                                                <option value={50}>50</option>
                                                <option value={100}>100</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className={`block text-[9px] font-mono uppercase tracking-widest mb-1 opacity-0 select-none`}>Refresh</label>
                                            <button
                                                onClick={fetchEnterprisesData}
                                                className={`h-10 w-10 rounded-xl border flex items-center justify-center transition-all ${isDarkMode ? 'border-white/10 hover:bg-white/5 text-white' : 'border-black/10 hover:bg-black/5 text-black'} ${isEnterprisesLoading ? 'animate-spin' : ''}`}
                                                title="Refresh"
                                            >
                                                <RefreshCw className={`h-4 w-4 ${isDarkMode ? 'opacity-60' : 'opacity-60'}`} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Table View */}
                                    <div className={`relative border rounded-[1rem] overflow-hidden ${isDarkMode ? 'border-white/10 bg-white/[0.03]' : 'border-black bg-black/[0.02]'}`}>
                                        <div className={`p-6 border-b ${isDarkMode ? 'border-white/10' : 'border-black'} flex items-center justify-between`}>
                                            <h3 className={`text-lg font-display font-black ${isDarkMode ? 'text-white' : 'text-black'}`}>Enterprises</h3>
                                            <span className={`text-[10px] font-mono uppercase tracking-widest ${isDarkMode ? 'opacity-40' : 'opacity-60'}`}>{processedEnterprises.length} results</span>
                                        </div>

                                        {isEnterprisesLoading ? (
                                            <div className="p-10 text-center text-[10px] font-mono opacity-40">Loading...</div>
                                        ) : processedEnterprises.length === 0 ? (
                                            <div className="p-10 text-center text-[10px] font-mono opacity-40">No enterprises found</div>
                                        ) : (
                                            <div className="overflow-x-auto">
                                                <table className={`w-full border ${isDarkMode ? 'border-white/10' : 'border-black'} rounded-xl overflow-hidden`}>
                                                    <thead>
                                                        <tr className={`${isDarkMode ? 'text-white/60' : 'text-black/70'} text-[9px] font-mono uppercase tracking-[0.3em] border-b ${isDarkMode ? 'border-white/10' : 'border-black'}`}>
                                                            <th className="p-4 text-left">
                                                                <button onClick={() => toggleEnterprisesSort('name')} className="flex items-center gap-1 hover:opacity-80">
                                                                    Name {enterprisesSortField === 'name' ? (enterprisesSortOrder === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 opacity-40" />}
                                                                </button>
                                                            </th>
                                                            <th className="p-4 text-left">
                                                                <button onClick={() => toggleEnterprisesSort('code')} className="flex items-center gap-1 hover:opacity-80">
                                                                    Code {enterprisesSortField === 'code' ? (enterprisesSortOrder === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 opacity-40" />}
                                                                </button>
                                                            </th>
                                                            <th className="p-4 text-center">Employees</th>
                                                            <th className="p-4 text-center">Admins</th>
                                                            <th className="p-4 text-center">AI Requests</th>
                                                            <th className="p-4 text-left">
                                                                <button onClick={() => toggleEnterprisesSort('created')} className="flex items-center gap-1 hover:opacity-80">
                                                                    Created {enterprisesSortField === 'created' ? (enterprisesSortOrder === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 opacity-40" />}
                                                                </button>
                                                            </th>
                                                            <th className="p-4 text-right">Delete</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {visibleEnterprises.map((e) => {
                                                            const stats = enterpriseStats.find(item => item.school_code === e.enterprise_code);
                                                            return (
                                                                <tr
                                                                    key={e.id}
                                                                    className={`border-b transition-colors ${isDarkMode ? 'border-white/10 hover:bg-white/[0.04]' : 'border-black/20 hover:bg-black/[0.03]'}`}
                                                                >
                                                                    <td className="p-4 text-sm font-bold">{e.enterprise_name}</td>
                                                                    <td className="p-4 text-xs font-mono opacity-80">{e.enterprise_code}</td>
                                                                    <td className="p-4 text-center text-xs font-mono">{stats?.student_count || 0}</td>
                                                                    <td className="p-4 text-center text-xs font-mono">{stats?.admin_count || 0}</td>
                                                                    <td className="p-4 text-center text-xs font-mono text-[#00DDDD]">{stats?.total_ai_requests || 0}</td>
                                                                    <td className="p-4 text-xs font-mono opacity-60">{new Date(e.created_at).toLocaleDateString()}</td>
                                                                    <td className="p-4 text-right">
                                                                        <button
                                                                            onClick={() => {
                                                                                if (confirm(`Are you sure you want to delete the enterprise "${e.enterprise_name}"? All associated managers, employees, and stats will be permanently deleted.`)) {
                                                                                    handleDeleteEnterprise(e.id);
                                                                                }
                                                                            }}
                                                                            className="p-2 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 hover:bg-red-500 hover:text-white transition-all duration-300"
                                                                            title="Delete Enterprise"
                                                                        >
                                                                            <Trash2 className="h-4 w-4" />
                                                                        </button>
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}

                                        {/* Pagination */}
                                        <div className={`p-4 flex items-center justify-between border-t ${isDarkMode ? 'border-white/10' : 'border-black/10'}`}>
                                            <div className={`text-[10px] font-mono ${isDarkMode ? 'text-white/60' : 'text-black/60'}`}>Page {enterprisesPage} / {enterprisesTotalPages}</div>
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => setEnterprisesPage(p => Math.max(1, p - 1))} disabled={enterprisesPage === 1} className={`px-3 py-1.5 rounded-lg border text-[10px] ${isDarkMode ? 'border-white/10 text-white/80 disabled:opacity-30 hover:bg-white/5' : 'border-black/10 text-black/80 disabled:opacity-30 hover:bg-black/5'}`}>Prev</button>
                                                <button onClick={() => setEnterprisesPage(p => Math.min(enterprisesTotalPages, p + 1))} disabled={enterprisesPage === enterprisesTotalPages} className={`px-3 py-1.5 rounded-lg border text-[10px] ${isDarkMode ? 'border-white/10 text-white/80 disabled:opacity-30 hover:bg-white/5' : 'border-black/10 text-black/80 disabled:opacity-30 hover:bg-black/5'}`}>Next</button>
                                            </div>
                                        </div>
                                    </div>
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
                            <div className={`border border-zinc-800/50 rounded-[3rem] overflow-hidden backdrop-blur-3xl ${isDarkMode ? "bg-gradient-to-br from-zinc-900 via-black to-zinc-900" : "bg-gradient-to-br from-zinc-100 via-white to-zinc-100"
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
                        className={`relative w-full max-w-xl max-h-[80vh] overflow-y-auto border border-zinc-800/50 p-6 rounded-[2rem] overflow-hidden group ${isDarkMode ? "bg-gradient-to-br from-zinc-900 via-black to-zinc-900 text-white" : "bg-gradient-to-br from-zinc-100 via-white to-zinc-100 text-black"
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
                                                                 }).then((res) => {
                                                                        const newPlanId = res?.plan?.id?.toString()
                                                                        if (newPlanId) {
                                                                            setPlanFeatures(newPlanId, selectedFeatures)
                                                                            if (strikeOffEnabled && strikeOffPrice > 0) {
                                                                                setPlanStrikeOff(newPlanId, { price_inr: strikeOffPrice })
                                                                            } else {
                                                                                setPlanStrikeOff(newPlanId, null)
                                                                            }
                                                                        }
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
                                                                setPlanFeatures(editingPlan.id?.toString() || '', selectedFeatures);
                                                                if (strikeOffEnabled && strikeOffPrice > 0) {
                                                                    setPlanStrikeOff(editingPlan.id?.toString() || '', { price_inr: strikeOffPrice })
                                                                } else {
                                                                    setPlanStrikeOff(editingPlan.id?.toString() || '', null)
                                                                }
                                                            }
                                                        }} className="space-y-4">
                            <div>
                                <label className={`text-[9px] font-mono uppercase tracking-widest ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>Plan Name</label>
                                <input
                                    name="plan_name"
                                    defaultValue={editingPlan.plan_name || editingPlan.name || ''}
                                    required
                                    className={`w-full mt-1 p-3 text-xs font-mono border rounded-xl focus:outline-none focus:border-emerald-500/50 ${isDarkMode ? "bg-white/5 border-white/10 text-white" : "bg-black/5 border-black/10 text-black"
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
                                        className={`w-full mt-1 p-3 text-xs font-mono border rounded-xl focus:outline-none focus:border-emerald-500/50 ${isDarkMode ? "bg-white/5 border-white/10 text-white" : "bg-black/5 border-black/10 text-black"
                                            }`}
                                    />
                                </div>
                                <div>
                                    <label className={`text-[9px] font-mono uppercase tracking-widest ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>Daily Chat</label>
                                    <input
                                        name="daily_chat_limit"
                                        type="number"
                                        defaultValue={editingPlan.daily_chat_limit || 0}
                                        className={`w-full mt-1 p-3 text-xs font-mono border rounded-xl focus:outline-none focus:border-emerald-500/50 ${isDarkMode ? "bg-white/5 border-white/10 text-white" : "bg-black/5 border-black/10 text-black"
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
                                        className={`w-full mt-1 p-3 text-xs font-mono border rounded-xl focus:outline-none focus:border-emerald-500/50 ${isDarkMode ? "bg-white/5 border-white/10 text-white" : "bg-black/5 border-black/10 text-black"
                                            }`}
                                    />
                                </div>
                                <div>
                                    <label className={`text-[9px] font-mono uppercase tracking-widest ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>Daily Vision</label>
                                    <input
                                        name="daily_vision_limit"
                                        type="number"
                                        defaultValue={editingPlan.daily_vision_limit || 0}
                                        className={`w-full mt-1 p-3 text-xs font-mono border rounded-xl focus:outline-none focus:border-emerald-500/50 ${isDarkMode ? "bg-white/5 border-white/10 text-white" : "bg-black/5 border-black/10 text-black"
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
                                        className={`w-full mt-1 p-3 text-xs font-mono border rounded-xl focus:outline-none focus:border-emerald-500/50 ${isDarkMode ? "bg-white/5 border-white/10 text-white" : "bg-black/5 border-black/10 text-black"
                                            }`}
                                    />
                                </div>
                                <div>
                                    <label className={`text-[9px] font-mono uppercase tracking-widest ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>Monthly Flux</label>
                                    <input
                                        name="monthly_flux_limit"
                                        type="number"
                                        defaultValue={editingPlan.monthly_flux_limit || 0}
                                        className={`w-full mt-1 p-3 text-xs font-mono border rounded-xl focus:outline-none focus:border-emerald-500/50 ${isDarkMode ? "bg-white/5 border-white/10 text-white" : "bg-black/5 border-black/10 text-black"
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
                                        className={`w-full mt-1 p-3 text-xs font-mono border rounded-xl focus:outline-none focus:border-emerald-500/50 ${isDarkMode ? "bg-white/5 border-white/10 text-white" : "bg-black/5 border-black/10 text-black"
                                            }`}
                                    />
                                </div>
                                <div>
                                    <label className={`text-[9px] font-mono uppercase tracking-widest ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>Daily STT</label>
                                    <input
                                        name="daily_stt_limit"
                                        type="number"
                                        defaultValue={editingPlan.daily_stt_limit || 0}
                                        className={`w-full mt-1 p-3 text-xs font-mono border rounded-xl focus:outline-none focus:border-emerald-500/50 ${isDarkMode ? "bg-white/5 border-white/10 text-white" : "bg-black/5 border-black/10 text-black"
                                            }`}
                                    />
                                </div>
                            </div>

                            {/* Available Modes / Features */}
                            <div>
                                <label className={`text-[9px] font-mono uppercase tracking-widest ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>Available Modes / Features</label>
                                {isFeaturesLoading ? (
                                    <div className={`mt-2 text-[10px] font-mono ${isDarkMode ? "text-white/40" : "text-black/40"}`}>Loading modes...</div>
                                ) : availableFeatures.length === 0 ? (
                                    <div className={`mt-2 text-[10px] font-mono ${isDarkMode ? "text-white/40" : "text-black/40"}`}>No modes available</div>
                                ) : (
                                    <div className="grid grid-cols-2 gap-2 mt-2">
                                        {availableFeatures.map((feature) => (
                                            <label
                                                key={feature.id}
                                                className={`flex items-center gap-2 p-2 rounded-xl cursor-pointer transition-all ${
                                                    selectedFeatures.includes(feature.id)
                                                        ? (isDarkMode ? "bg-emerald-500/10 border border-emerald-500/30" : "bg-emerald-500/10 border border-emerald-500/30")
                                                        : (isDarkMode ? "bg-white/5 border border-white/10 hover:bg-white/10" : "bg-black/5 border border-black/10 hover:bg-black/10")
                                                }`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={selectedFeatures.includes(feature.id)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setSelectedFeatures(prev => [...prev, feature.id])
                                                        } else {
                                                            setSelectedFeatures(prev => prev.filter(id => id !== feature.id))
                                                        }
                                                    }}
                                                    className="h-4 w-4 rounded border-gray-300 text-emerald-500 focus:ring-emerald-500"
                                                />
                                                <div className="flex flex-col">
                                                    <span className={`text-[10px] font-bold ${isDarkMode ? "text-white" : "text-black"}`}>{feature.name}</span>
                                                    <span className={`text-[8px] font-mono ${isDarkMode ? "text-white/40" : "text-black/40"}`}>{feature.description}</span>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Strike-off Price */}
                            <div>
                                <label className={`flex items-center gap-2 cursor-pointer`}>
                                    <input
                                        type="checkbox"
                                        checked={strikeOffEnabled}
                                        onChange={(e) => {
                                            setStrikeOffEnabled(e.target.checked)
                                            if (!e.target.checked) {
                                                setStrikeOffPrice(0)
                                            }
                                        }}
                                        className="h-4 w-4 rounded border-gray-300 text-emerald-500 focus:ring-emerald-500"
                                    />
                                    <span className={`text-[9px] font-mono uppercase tracking-widest ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>Strike-off Price</span>
                                </label>
                                {strikeOffEnabled && (
                                    <div className="mt-2">
                                        <label className={`text-[9px] font-mono uppercase tracking-widest ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>New Price (INR)</label>
                                        <input
                                            type="number"
                                            value={strikeOffPrice}
                                            onChange={(e) => setStrikeOffPrice(Number(e.target.value))}
                                            placeholder="Enter new price"
                                            className={`w-full mt-1 p-3 text-xs font-mono border rounded-xl focus:outline-none focus:border-emerald-500/50 ${isDarkMode ? "bg-white/5 border-white/10 text-white" : "bg-black/5 border-black/10 text-black"}`}
                                        />
                                    </div>
                                )}
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

            {/* Site Settings Editor Modal */}
            {editingSiteSetting && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={`relative w-full max-w-3xl max-h-[85vh] overflow-y-auto border border-zinc-800/50 p-6 rounded-[2rem] ${isDarkMode ? "bg-gradient-to-br from-zinc-900 via-black to-zinc-900 text-white" : "bg-gradient-to-br from-zinc-100 via-white to-zinc-100 text-black"
                            }`}
                    >
                        <button
                            onClick={() => { setEditingSiteSetting(null); setSiteFormData(null); }}
                            className={`absolute top-4 right-4 p-2 rounded-xl transition-all ${isDarkMode ? "opacity-40 text-white hover:opacity-100 hover:bg-white/5" : "opacity-60 text-black hover:opacity-100 hover:bg-black/5"}`}
                        >
                            <X className="h-4 w-4" />
                        </button>

                        <h2 className={`text-xl font-display font-black uppercase tracking-tight mb-6 ${isDarkMode ? "text-white" : "text-black"}`}>
                            {editingSiteSetting.key === 'about_us' ? 'About Us' :
                                editingSiteSetting.key === 'privacy_policy' ? 'Privacy Policy' :
                                    editingSiteSetting.key === 'terms_conditions' ? 'Terms of Service' :
                                        editingSiteSetting.key === 'contact_info' ? 'Contact Us' : editingSiteSetting.key}
                        </h2>

                        {editingSiteSetting.key === 'about_us' && (
                            <div className="space-y-4">
                                {(Array.isArray(siteFormData?.elements) ? siteFormData.elements : []).map((el: any, i: number) => {
                                    const updateField = (field: string, val: string) => {
                                        const next = JSON.parse(JSON.stringify(siteFormData));
                                        if (next.elements && next.elements[i]) next.elements[i][field] = val;
                                        setSiteFormData(next);
                                        setEditingSiteSetting({ ...editingSiteSetting, value: JSON.stringify(next) });
                                    };
                                    return (
                                        <div key={i} className={`p-4 rounded-xl ${isDarkMode ? "bg-white/5" : "bg-black/5"}`}>
                                            <div className="flex items-center justify-between gap-3 mb-2">
                                                <select
                                                    value={el.type || 'paragraph'}
                                                    onChange={(e) => updateField('type', e.target.value)}
                                                    className={`p-2 text-[10px] font-mono border rounded-xl focus:outline-none focus:border-emerald-500/50 ${isDarkMode ? "bg-black border-white/10 text-white" : "bg-white border-black/10 text-black"
                                                        }`}
                                                >
                                                    <option value="heading">Heading</option>
                                                    <option value="subheading">Subheading</option>
                                                    <option value="paragraph">Paragraph</option>
                                                </select>
                                                <button
                                                    onClick={() => {
                                                        const next = JSON.parse(JSON.stringify(siteFormData));
                                                        next.elements = next.elements.filter((_: any, j: number) => j !== i);
                                                        setSiteFormData(next);
                                                        setEditingSiteSetting({ ...editingSiteSetting, value: JSON.stringify(next) });
                                                    }}
                                                    className={`text-[10px] font-mono uppercase tracking-widest text-red-400 hover:text-red-300 transition`}
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                            <textarea
                                                value={el.content || ''}
                                                onChange={(e) => updateField('content', e.target.value)}
                                                rows={4}
                                                placeholder={el.type === 'paragraph' ? 'Paragraph text...' : el.type === 'heading' ? 'Heading text...' : 'Subheading text...'}
                                                className={`w-full p-4 text-sm font-mono border rounded-xl focus:outline-none focus:border-emerald-500/50 resize-none ${isDarkMode ? "bg-white/5 border-white/10 text-white" : "bg-black/5 border-black/10 text-black"
                                                    }`}
                                            />
                                        </div>
                                    );
                                })}
                                <button
                                    onClick={() => {
                                        const next = JSON.parse(JSON.stringify(siteFormData || {}));
                                        if (!next.elements) next.elements = [];
                                        next.elements.push({ type: 'paragraph', content: '' });
                                        setSiteFormData(next);
                                        setEditingSiteSetting({ ...editingSiteSetting, value: JSON.stringify(next) });
                                    }}
                                    className={`text-[10px] font-mono uppercase tracking-widest ${isDarkMode ? "text-white/40 hover:text-white" : "text-black/40 hover:text-black"} transition`}
                                >
                                    + Add Element
                                </button>
                            </div>
                        )}

                        {editingSiteSetting.key === 'contact_info' && (
                            <div className="space-y-4">
                                <div>
                                    <label className={`text-[9px] font-mono uppercase tracking-widest mb-1 block ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>Paragraphs</label>
                                    {(Array.isArray(siteFormData?.paragraphs) ? siteFormData.paragraphs : ['']).map((p: string, i: number) => (
                                        <div key={i} className="mb-2">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className={`text-[8px] font-mono ${isDarkMode ? "opacity-30 text-white" : "opacity-50 text-black"}`}>Paragraph {i + 1}</span>
                                                {siteFormData?.paragraphs?.length > 1 && (
                                                    <button
                                                        onClick={() => {
                                                            const next = JSON.parse(JSON.stringify(siteFormData));
                                                            next.paragraphs = next.paragraphs.filter((_: any, j: number) => j !== i);
                                                            setSiteFormData(next);
                                                            setEditingSiteSetting({ ...editingSiteSetting, value: JSON.stringify(next) });
                                                        }}
                                                        className={`text-[10px] font-mono uppercase tracking-widest text-red-400 hover:text-red-300 transition`}
                                                    >
                                                        Remove
                                                    </button>
                                                )}
                                            </div>
                                            <textarea
                                                value={p}
                                                onChange={(e) => {
                                                    const next = JSON.parse(JSON.stringify(siteFormData));
                                                    if (next.paragraphs && next.paragraphs[i] !== undefined) next.paragraphs[i] = e.target.value;
                                                    setSiteFormData(next);
                                                    setEditingSiteSetting({ ...editingSiteSetting, value: JSON.stringify(next) });
                                                }}
                                                rows={3}
                                                className={`w-full p-4 text-sm font-mono border rounded-xl focus:outline-none focus:border-emerald-500/50 resize-none ${isDarkMode ? "bg-white/5 border-white/10 text-white" : "bg-black/5 border-black/10 text-black"
                                                    }`}
                                            />
                                        </div>
                                    ))}
                                    <button
                                        onClick={() => {
                                            const next = JSON.parse(JSON.stringify(siteFormData || {}));
                                            if (!next.paragraphs) next.paragraphs = [];
                                            next.paragraphs.push('');
                                            setSiteFormData(next);
                                            setEditingSiteSetting({ ...editingSiteSetting, value: JSON.stringify(next) });
                                        }}
                                        className={`text-[10px] font-mono uppercase tracking-widest ${isDarkMode ? "text-white/40 hover:text-white" : "text-black/40 hover:text-black"} transition`}
                                    >
                                        + Add Paragraph
                                    </button>
                                </div>
                                <div>
                                    <label className={`text-[9px] font-mono uppercase tracking-widest mb-1 block ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>Email</label>
                                    <input
                                        value={siteFormData?.email || ''}
                                        onChange={(e) => {
                                            const next = { ...siteFormData, email: e.target.value };
                                            setSiteFormData(next);
                                            setEditingSiteSetting({ ...editingSiteSetting, value: JSON.stringify(next) });
                                        }}
                                        className={`w-full p-4 text-sm font-mono border rounded-xl focus:outline-none focus:border-emerald-500/50 ${isDarkMode ? "bg-white/5 border-white/10 text-white" : "bg-black/5 border-black/10 text-black"
                                            }`}
                                    />
                                </div>
                                <div>
                                    <label className={`text-[9px] font-mono uppercase tracking-widest mb-1 block ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>Response Time</label>
                                    <input
                                        value={siteFormData?.responseTime || ''}
                                        onChange={(e) => {
                                            const next = { ...siteFormData, responseTime: e.target.value };
                                            setSiteFormData(next);
                                            setEditingSiteSetting({ ...editingSiteSetting, value: JSON.stringify(next) });
                                        }}
                                        className={`w-full p-4 text-sm font-mono border rounded-xl focus:outline-none focus:border-emerald-500/50 ${isDarkMode ? "bg-white/5 border-white/10 text-white" : "bg-black/5 border-black/10 text-black"
                                            }`}
                                    />
                                </div>
                            </div>
                        )}

                        {(editingSiteSetting.key === 'privacy_policy' || editingSiteSetting.key === 'terms_conditions') && (
                            <div className="space-y-4">
                                <div>
                                    <label className={`text-[9px] font-mono uppercase tracking-widest mb-1 block ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>Last Updated</label>
                                    <input
                                        value={siteFormData?.lastUpdated || ''}
                                        onChange={(e) => {
                                            const next = { ...siteFormData, lastUpdated: e.target.value };
                                            setSiteFormData(next);
                                            setEditingSiteSetting({ ...editingSiteSetting, value: JSON.stringify(next) });
                                        }}
                                        className={`w-full p-4 text-sm font-mono border rounded-xl focus:outline-none focus:border-emerald-500/50 ${isDarkMode ? "bg-white/5 border-white/10 text-white" : "bg-black/5 border-black/10 text-black"
                                            }`}
                                    />
                                </div>
                                {(Array.isArray(siteFormData?.sections) ? siteFormData.sections : []).map((s: any, i: number) => {
                                    const updateField = (field: string, val: string) => {
                                        const next = JSON.parse(JSON.stringify(siteFormData));
                                        if (next.sections && next.sections[i]) next.sections[i][field] = val;
                                        setSiteFormData(next);
                                        setEditingSiteSetting({ ...editingSiteSetting, value: JSON.stringify(next) });
                                    };
                                    return (
                                        <div key={i} className={`p-4 rounded-xl ${isDarkMode ? "bg-white/5" : "bg-black/5"}`}>
                                            <div className="flex items-center justify-between mb-2">
                                                <label className={`text-[9px] font-mono uppercase tracking-widest ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>Section {i + 1}</label>
                                                <button
                                                    onClick={() => {
                                                        const next = JSON.parse(JSON.stringify(siteFormData));
                                                        next.sections = next.sections.filter((_: any, j: number) => j !== i);
                                                        setSiteFormData(next);
                                                        setEditingSiteSetting({ ...editingSiteSetting, value: JSON.stringify(next) });
                                                    }}
                                                    className={`text-[10px] font-mono uppercase tracking-widest text-red-400 hover:text-red-300 transition`}
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                            <input
                                                value={s.title || ''}
                                                onChange={(e) => updateField('title', e.target.value)}
                                                placeholder="Section title"
                                                className={`w-full mb-2 p-3 text-xs font-mono border rounded-xl focus:outline-none focus:border-emerald-500/50 ${isDarkMode ? "bg-white/5 border-white/10 text-white" : "bg-black/5 border-black/10 text-black"
                                                    }`}
                                            />
                                            <textarea
                                                value={s.content || ''}
                                                onChange={(e) => updateField('content', e.target.value)}
                                                rows={4}
                                                placeholder="Section content"
                                                className={`w-full p-3 text-xs font-mono border rounded-xl focus:outline-none focus:border-emerald-500/50 resize-none ${isDarkMode ? "bg-white/5 border-white/10 text-white" : "bg-black/5 border-black/10 text-black"
                                                    }`}
                                            />
                                        </div>
                                    );
                                })}
                                <button
                                    onClick={() => {
                                        const next = JSON.parse(JSON.stringify(siteFormData || {}));
                                        if (!next.sections) next.sections = [];
                                        next.sections.push({ title: '', content: '' });
                                        setSiteFormData(next);
                                        setEditingSiteSetting({ ...editingSiteSetting, value: JSON.stringify(next) });
                                    }}
                                    className={`text-[10px] font-mono uppercase tracking-widest ${isDarkMode ? "text-white/40 hover:text-white" : "text-black/40 hover:text-black"} transition`}
                                >
                                    + Add Section
                                </button>
                            </div>
                        )}

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => { setEditingSiteSetting(null); setSiteFormData(null); }}
                                className={`flex-1 py-3 border text-[10px] font-mono uppercase tracking-[0.3em] font-bold hover:scale-[1.02] transition-all rounded-xl ${isDarkMode ? "border-white/10 text-white hover:bg-white/5" : "border-black/10 text-black hover:bg-black/5"
                                    }`}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={async () => {
                                    setIsSavingSiteSetting(true);
                                    try {
                                        const res = await updateSiteSetting(editingSiteSetting.key, editingSiteSetting.value);
                                        if (res.success) {
                                            toast.success("Page updated successfully");
                                            setEditingSiteSetting(null);
                                            setSiteFormData(null);
                                            fetchData();
                                        } else throw new Error(res.error || "Failed to update");
                                    } catch (err) {
                                        toast.error("Error updating page: " + (err as Error).message);
                                    } finally {
                                        setIsSavingSiteSetting(false);
                                    }
                                }}
                                disabled={isSavingSiteSetting}
                                className="flex-1 py-3 bg-emerald-500 text-black text-[10px] font-mono uppercase tracking-[0.3em] font-bold hover:scale-[1.02] transition-all rounded-xl disabled:opacity-50"
                            >
                                {isSavingSiteSetting ? "SAVING..." : "SAVE CHANGES"}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Create School Admin Modal */}
            {showCreateSchoolAdminModal && (
                <div className="fixed inset-0 z-[210] flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={`relative w-full max-w-lg border border-zinc-800/50 p-6 rounded-[2rem] ${isDarkMode ? "bg-gradient-to-br from-zinc-900 via-black to-zinc-900 text-white" : "bg-gradient-to-br from-zinc-100 via-white to-zinc-100 text-black"
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
                            <div>
                                <label className={`text-[9px] font-mono uppercase tracking-widest ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>Student Limit <span className="opacity-50">(default: 100)</span></label>
                                <input
                                    type="number"
                                    min={1}
                                    max={10000}
                                    value={newSchoolStudentLimit}
                                    onChange={(e) => setNewSchoolStudentLimit(Math.max(1, parseInt(e.target.value) || 100))}
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

            {/* Admin Created Success Dialog */}
            {createdAdminInfo && (
                <div className="fixed inset-0 z-[220] flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={`relative w-full max-w-lg border border-zinc-800/50 p-6 rounded-[2rem] overflow-hidden ${isDarkMode ? "bg-gradient-to-br from-zinc-900 via-black to-zinc-900 text-white" : "bg-gradient-to-br from-zinc-100 via-white to-zinc-100 text-black"
                            }`}
                    >
                        <button
                            onClick={() => setCreatedAdminInfo(null)}
                            className={`absolute top-4 right-4 p-2 rounded-xl transition-all ${isDarkMode ? "opacity-40 text-white hover:opacity-100 hover:bg-white/5" : "opacity-60 text-black hover:opacity-100 hover:bg-black/5"}`}
                        >
                            <X className="h-4 w-4" />
                        </button>

                        {/* Warning Banner */}
                        <div className="mb-5 px-4 py-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
                            <Zap className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
                            <div>
                                <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-amber-400">Email Delivery Not Guaranteed</p>
                                <p className="text-[10px] font-mono text-amber-400/70 mt-0.5 leading-relaxed">
                                    SMTP may not be configured on the server. Copy & save these credentials NOW — this dialog will not reappear.
                                </p>
                            </div>
                        </div>

                        <div className="text-center mb-5">
                            <div className="h-12 w-12 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto mb-3">
                                <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                            </div>
                            <h2 className={`text-xl font-display font-black uppercase tracking-tight ${isDarkMode ? "text-white" : "text-black"}`}>
                                School Onboarded
                            </h2>
                        </div>

                        {/* Credential rows with individual copy */}
                        <div className={`space-y-2 p-4 rounded-2xl text-xs font-mono ${isDarkMode ? "bg-white/5" : "bg-black/5"}`}>
                            {([
                                { label: 'School', value: createdAdminInfo.schoolName },
                                { label: 'School Code', value: createdAdminInfo.schoolCode },
                                { label: 'Admin Name', value: createdAdminInfo.adminName },
                                { label: 'Login Email', value: createdAdminInfo.adminEmail },
                                { label: 'Admin Code', value: createdAdminInfo.adminCode, highlight: true },
                                { label: 'Password', value: createdAdminInfo.adminPassword, highlight: true },
                            ] as { label: string; value: string; highlight?: boolean }[]).map(({ label, value, highlight }) => (
                                <div key={label} className={`flex items-center justify-between gap-4 px-3 py-2 rounded-xl ${highlight ? (isDarkMode ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-emerald-500/10 border border-emerald-500/20') : ''
                                    }`}>
                                    <span className={`text-[9px] uppercase tracking-widest shrink-0 ${isDarkMode ? 'opacity-40' : 'opacity-60'}`}>{label}</span>
                                    <span className={`font-bold truncate ${highlight ? 'text-emerald-400' : ''}`}>{value}</span>
                                    <button
                                        onClick={() => navigator.clipboard.writeText(value)}
                                        className={`shrink-0 p-1 rounded-lg transition-all hover:scale-110 ${isDarkMode ? 'opacity-30 hover:opacity-80 hover:bg-white/10' : 'opacity-40 hover:opacity-80 hover:bg-black/10'}`}
                                        title={`Copy ${label}`}
                                    >
                                        <Copy className="h-3 w-3" />
                                    </button>
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={() => {
                                const text = `School: ${createdAdminInfo.schoolName}\nSchool Code: ${createdAdminInfo.schoolCode}\nAdmin Name: ${createdAdminInfo.adminName}\nEmail: ${createdAdminInfo.adminEmail}\nAdmin Code (Login ID): ${createdAdminInfo.adminCode}\nPassword: ${createdAdminInfo.adminPassword}\n\nLogin at: ${window.location.origin}/auth/school-admin`;
                                navigator.clipboard.writeText(text).then(() => {
                                    setCopied(true);
                                    setTimeout(() => setCopied(false), 2000);
                                });
                            }}
                            className="w-full mt-4 py-3 bg-emerald-500 text-black text-[10px] font-mono uppercase tracking-[0.3em] font-bold hover:scale-[1.02] transition-all rounded-xl flex items-center justify-center gap-2"
                        >
                            {copied ? (
                                <><Check className="h-3.5 w-3.5" />Copied!</>
                            ) : (
                                <><Copy className="h-3.5 w-3.5" />Copy All Credentials</>
                            )}
                        </button>
                    </motion.div>
                </div>
            )}

            {/* Create Enterprise Admin Modal */}
            {showCreateEnterpriseModal && (
                <div className="fixed inset-0 z-[210] flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={`relative w-full max-w-lg border border-zinc-800/50 p-6 rounded-[2rem] ${isDarkMode ? "bg-gradient-to-br from-zinc-900 via-black to-zinc-900 text-white" : "bg-gradient-to-br from-zinc-100 via-white to-zinc-100 text-black"
                            }`}
                    >
                        <button
                            onClick={() => setShowCreateEnterpriseModal(false)}
                            className={`absolute top-4 right-4 p-2 rounded-xl transition-all ${isDarkMode ? "opacity-40 text-white hover:opacity-100 hover:bg-white/5" : "opacity-60 text-black hover:opacity-100 hover:bg-black/5"}`}
                        >
                            <X className="h-4 w-4" />
                        </button>

                        <h2 className={`text-xl font-display font-black uppercase tracking-tight mb-6 ${isDarkMode ? "text-white" : "text-black"}`}>
                            Add Enterprise Admin
                        </h2>

                        <form onSubmit={handleCreateEnterprise} className="space-y-4">
                            <div>
                                <label className={`text-[9px] font-mono uppercase tracking-widest ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>Enterprise Name</label>
                                <input
                                    value={newEnterpriseName}
                                    onChange={(e) => setNewEnterpriseName(e.target.value)}
                                    required
                                    className={`w-full mt-1 p-3 text-xs font-mono border rounded-xl focus:outline-none focus:border-emerald-500/50 ${isDarkMode ? "bg-white/5 border-white/10 text-white" : "bg-black/5 border-black/10 text-black"}`}
                                />
                            </div>
                            <div>
                                <label className={`text-[9px] font-mono uppercase tracking-widest ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>Enterprise Code (Unique Key)</label>
                                <input
                                    value={newEnterpriseCode}
                                    onChange={(e) => setNewEnterpriseCode(e.target.value.toUpperCase())}
                                    required
                                    className={`w-full mt-1 p-3 text-xs font-mono border rounded-xl focus:outline-none focus:border-emerald-500/50 ${isDarkMode ? "bg-white/5 border-white/10 text-white" : "bg-black/5 border-black/10 text-black"}`}
                                />
                            </div>
                            <div>
                                <label className={`text-[9px] font-mono uppercase tracking-widest ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>Name</label>
                                <input
                                    value={newEnterpriseAdminName}
                                    onChange={(e) => setNewEnterpriseAdminName(e.target.value)}
                                    required
                                    className={`w-full mt-1 p-3 text-xs font-mono border rounded-xl focus:outline-none focus:border-emerald-500/50 ${isDarkMode ? "bg-white/5 border-white/10 text-white" : "bg-black/5 border-black/10 text-black"}`}
                                />
                            </div>
                            <div>
                                <label className={`text-[9px] font-mono uppercase tracking-widest ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>Admin Email</label>
                                <input
                                    type="email"
                                    value={newEnterpriseAdminEmail}
                                    onChange={(e) => setNewEnterpriseAdminEmail(e.target.value)}
                                    required
                                    className={`w-full mt-1 p-3 text-xs font-mono border rounded-xl focus:outline-none focus:border-emerald-500/50 ${isDarkMode ? "bg-white/5 border-white/10 text-white" : "bg-black/5 border-black/10 text-black"}`}
                                />
                            </div>
                            <div>
                                <label className={`text-[9px] font-mono uppercase tracking-widest ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>Admin Password</label>
                                <input
                                    type="password"
                                    value={newEnterpriseAdminPassword}
                                    onChange={(e) => setNewEnterpriseAdminPassword(e.target.value)}
                                    required
                                    className={`w-full mt-1 p-3 text-xs font-mono border rounded-xl focus:outline-none focus:border-emerald-500/50 ${isDarkMode ? "bg-white/5 border-white/10 text-white" : "bg-black/5 border-black/10 text-black"}`}
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={isCreatingEnterprise}
                                className="w-full py-3 bg-orange-500 text-white text-[10px] font-mono uppercase tracking-[0.3em] font-bold hover:scale-[1.02] transition-all rounded-xl disabled:opacity-50"
                            >
                                {isCreatingEnterprise ? "CREATING..." : "CREATE ENTERPRISE ADMIN"}
                            </button>
                        </form>
                    </motion.div>
                </div>
            )}

            {/* Enterprise Created Success Dialog */}
            {createdEnterpriseInfo && (
                <div className="fixed inset-0 z-[220] flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={`relative w-full max-w-lg border border-zinc-800/50 p-6 rounded-[2rem] overflow-hidden ${isDarkMode ? "bg-gradient-to-br from-zinc-900 via-black to-zinc-900 text-white" : "bg-gradient-to-br from-zinc-100 via-white to-zinc-100 text-black"
                            }`}
                    >
                        <button
                            onClick={() => setCreatedEnterpriseInfo(null)}
                            className={`absolute top-4 right-4 p-2 rounded-xl transition-all ${isDarkMode ? "opacity-40 text-white hover:opacity-100 hover:bg-white/5" : "opacity-60 text-black hover:opacity-100 hover:bg-black/5"}`}
                        >
                            <X className="h-4 w-4" />
                        </button>

                        <div className="mb-5 px-4 py-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
                            <Zap className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
                            <div>
                                <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-amber-400">Email Delivery Warning</p>
                                <p className="text-[10px] font-mono text-amber-400/70 mt-0.5 leading-relaxed">
                                    Copy & save these credentials now — they are not shown again.
                                </p>
                            </div>
                        </div>

                        <div className="text-center mb-5">
                            <div className="h-12 w-12 rounded-full bg-orange-500/20 border border-orange-500/30 flex items-center justify-center mx-auto mb-3">
                                <CheckCircle2 className="h-6 w-6 text-orange-400" />
                            </div>
                            <h2 className={`text-xl font-display font-black uppercase tracking-tight ${isDarkMode ? "text-white" : "text-black"}`}>
                                Enterprise Onboarded
                            </h2>
                        </div>

                        {/* Credential rows with copy */}
                        <div className={`space-y-2 p-4 rounded-2xl text-xs font-mono ${isDarkMode ? "bg-white/5" : "bg-black/5"}`}>
                            {([
                                { label: 'Enterprise', value: createdEnterpriseInfo.enterpriseName },
                                { label: 'Enterprise Code', value: createdEnterpriseInfo.enterpriseCode },
                                { label: 'Admin Name', value: createdEnterpriseInfo.adminName },
                                { label: 'Login Email', value: createdEnterpriseInfo.adminEmail },
                                { label: 'Admin Code', value: createdEnterpriseInfo.adminCode, highlight: true },
                                { label: 'Password', value: createdEnterpriseInfo.adminPassword, highlight: true },
                            ] as { label: string; value: string; highlight?: boolean }[]).map(({ label, value, highlight }) => (
                                <div key={label} className={`flex items-center justify-between gap-4 px-3 py-2 rounded-xl ${highlight ? (isDarkMode ? 'bg-orange-500/10 border border-orange-500/20' : 'bg-orange-500/10 border border-orange-500/20') : ''
                                    }`}>
                                     <span className={`text-[9px] uppercase tracking-widest shrink-0 ${isDarkMode ? 'opacity-40' : 'opacity-60'}`}>{label}</span>
                                     <span className={`font-bold truncate ${highlight ? 'text-orange-400' : ''}`}>{value}</span>
                                     <button
                                         onClick={() => navigator.clipboard.writeText(value)}
                                         className={`shrink-0 p-1 rounded-lg transition-all hover:scale-110 ${isDarkMode ? 'opacity-30 hover:opacity-80 hover:bg-white/10' : 'opacity-40 hover:opacity-80 hover:bg-black/10'}`}
                                         title={`Copy ${label}`}
                                     >
                                         <Copy className="h-3 w-3" />
                                     </button>
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={() => {
                                const text = `Enterprise: ${createdEnterpriseInfo.enterpriseName}\nEnterprise Code: ${createdEnterpriseInfo.enterpriseCode}\nAdmin Name: ${createdEnterpriseInfo.adminName}\nEmail: ${createdEnterpriseInfo.adminEmail}\nAdmin Code (Login ID): ${createdEnterpriseInfo.adminCode}\nPassword: ${createdEnterpriseInfo.adminPassword}\n\nLogin at: ${window.location.origin}/admin`;
                                navigator.clipboard.writeText(text).then(() => {
                                    toast.success("All credentials copied to clipboard!");
                                });
                            }}
                            className="w-full mt-4 py-3 bg-orange-500 text-white text-[10px] font-mono uppercase tracking-[0.3em] font-bold hover:scale-[1.02] transition-all rounded-xl flex items-center justify-center gap-2"
                        >
                            <Copy className="h-3.5 w-3.5" /> Copy All Credentials
                        </button>
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
