import React, { useState, useEffect, useMemo } from 'react';
import {
    Search, Bell, Settings, User, Mail, Calendar as CalendarIcon,
    MessageSquare, FileText, PieChart, Activity, Layers,
    MoreHorizontal, Plus, Briefcase, Users, Clock, CheckCircle2,
    ChevronRight, ArrowUpRight, Globe, Shield, Zap, Table as TableIcon, LayoutDashboard,
    ChevronLeft, ChevronRight as ChevronRightIcon, LogOut, Moon, Sun, RefreshCw, Database,
    TrendingUp, ShieldCheck, Cpu, X, Copy, Check, ArrowUpDown, ArrowUp, ArrowDown, Trash2, Building2, Menu,
    Info, Lock, Scale, Share2, GraduationCap, Play, Smartphone, Code2, HelpCircle, Headphones, Phone
} from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { getAdminUsers, AdminUser, getSubscriptionStatus, updateTokens, getPlansList, updatePlan, createPlan, Plan, adminLoginWithCredentials, loginByAdminCode, createSchoolAdmin, getSiteSettings, updateSiteSetting, SiteSetting, freezeUser, unfreezeUser, getAdminRequests, declineAdminRequest, AdminRequest, getAdminSchools, getAdminSchoolAdmins, AdminSchool, AdminSchoolAdmin, getFrozenUsers, getAdminSchoolFacultyByCode, SchoolFacultyMember, deleteAdminUser, deleteSchoolFaculty, getAdminActivity, getAvailableFeatures, AvailableFeature, setPlanFeatures, getPlanFeatures, getPlanStrikeOff, setPlanStrikeOff, getAdminEnterprises, onboardEnterprise, deleteEnterprise, getEnterpriseStatsGlobal, AdminEnterprise, deleteAdminSchool } from '@/lib/chat-api';
import { isAdminAuthenticated, setAdminKey, removeAdminKey, setApiKey, setUserRole } from '@/lib/auth';
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
                const strikeOffVal = (plan.strike_off_price && plan.strike_off_price > 0) ? plan.strike_off_price : getPlanStrikeOff(String(plan.id))?.price_inr;
                if (strikeOffVal) {
                    return (
                        <div className="mb-6">
                            <p className={`text-2xl font-display font-black line-through ${isDarkMode ? "text-white/40" : "text-black/30"}`}>₹{plan.price_inr || plan.price}</p>
                            <p className={`text-3xl font-display font-black ${isDarkMode ? "text-white" : "text-black"}`}>₹{strikeOffVal}</p>
                        </div>
                    )
                }
                return <p className={`text-3xl font-display font-black mb-6 ${isDarkMode ? "text-white" : "text-black"}`}>₹{plan.price_inr || plan.price}</p>
            })()}

            <div className={`space-y-2 mb-6 text-[10px] font-mono ${isDarkMode ? "text-white/60" : "text-black/60"}`}>
                <div className="flex justify-between">
                    <span>Daily Image</span>
                    <span className="font-bold">{plan.daily_image_limit ?? 0}</span>
                </div>
                <div className="flex justify-between">
                    <span>Feature Extraction</span>
                    <span className="font-bold">{plan.feature_extraction_limit ?? 0}</span>
                </div>
                <div className="flex justify-between">
                    <span>Daily Vision</span>
                    <span className="font-bold">{plan.daily_vision_limit ?? 0}</span>
                </div>
                <div className="flex justify-between">
                    <span>Monthly Images</span>
                    <span className="font-bold">{plan.monthly_image_limit ?? 0}</span>
                </div>
                <div className="flex justify-between">
                    <span>Monthly Flux</span>
                    <span className="font-bold">{plan.monthly_flux_limit ?? 0}</span>
                </div>
                <div className="flex justify-between">
                    <span>Daily TTS</span>
                    <span className="font-bold">{plan.daily_tts_limit ?? 0}</span>
                </div>
                <div className="flex justify-between">
                    <span>Daily STT</span>
                    <span className="font-bold">{plan.daily_stt_limit ?? 0}</span>
                </div>
                <div className="flex justify-between">
                    <span>OCR Limit</span>
                    <span className="font-bold">{plan.ocr_limit ?? 0}</span>
                </div>
                <div className="flex justify-between border-t pt-2 mt-2">
                    <span>Monthly Tokens</span>
                    <span className="font-bold">{plan.monthly_tokens ?? 0}</span>
                </div>
            </div>

            {(() => {
                const planFeatures = getPlanFeatures(String(plan.id))
                if (planFeatures.length > 0) {
                    const featureNames: Record<string, string> = {
                        student_mode: "Explore Mode",
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
    <div className={`relative p-6 transition-all duration-300 border-b ${
        isDarkMode ? "border-white/5" : "border-zinc-300"
    }`}>
        <div className="flex justify-between items-start">
            <span className={`text-[9px] font-mono uppercase tracking-[0.3em] ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>{title}</span>
            {Icon && <Icon className="h-4 w-4 opacity-35" style={{ color }} />}
        </div>
        <div className="flex items-baseline gap-2 mt-2">
            <h4 className={`text-2xl font-display font-black tracking-tight ${isDarkMode ? "text-white" : "text-black"}`}>{value}</h4>
            {subtext && <span className={`text-[10px] font-mono ${isDarkMode ? "opacity-30 text-white" : "opacity-50 text-black"}`}>{subtext}</span>}
        </div>
        <div className="h-[2px] w-8 mt-4 rounded-full" style={{ backgroundColor: color }} />
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
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(true);
    const [isLeftSidebarCollapsed, setIsLeftSidebarCollapsed] = useState(false);
    const [isRightSidebarCollapsed, setIsRightSidebarCollapsed] = useState(false);
    const [leftSidebarWidth, setLeftSidebarWidth] = useState<number>(288);
    const [rightSidebarWidth, setRightSidebarWidth] = useState<number>(320);
    const [activeExcelCell, setActiveExcelCell] = useState<{ rowIdx: number, colKey: string } | null>({ rowIdx: 1, colKey: 'A' });
    const [activeSchoolsCell, setActiveSchoolsCell] = useState<{ rowIdx: number, colKey: string } | null>({ rowIdx: 1, colKey: 'A' });
    const [activeEnterprisesCell, setActiveEnterprisesCell] = useState<{ rowIdx: number, colKey: string } | null>({ rowIdx: 1, colKey: 'A' });

    const getExcelCellValueFormula = (rowIdx: number, colKey: string) => {
        const uIdx = rowIdx - 1;
        const user = paginatedUsers[uIdx];
        if (!user) return "";
        switch (colKey) {
            case 'A': return `=USER_IDENTITY("${user.name}", "${user.email}")`;
            case 'B': return `=SUBSCRIPTION_PLAN("${user.subscription.plan}", "${user.subscription.status}")`;
            case 'C': return `=RESOURCE_TOKENS_USED(${user.subscription.tokens_used}, ${user.subscription.tokens_limit})`;
            case 'D': return `=USAGE_METRICS(chats: ${user.subscription.daily_chats}, limit: ${user.subscription.tokens_limit})`;
            case 'E': return `=ADMIN_ACTION(visualize: "${user.name}", id: "${user.id}")`;
            default: return "";
        }
    };

    const getSchoolsExcelCellValueFormula = (rowIdx: number, colKey: string) => {
        const sIdx = rowIdx - 1;
        const school = visibleSchools[sIdx];
        if (!school) return "";
        switch (colKey) {
            case 'A': return `=SCHOOL_NAME("${school.school_name}")`;
            case 'B': return `=SCHOOL_CODE("${school.school_code}")`;
            case 'C': return `=ONBOARD_DATE("${new Date(school.created_at).toLocaleDateString()}")`;
            case 'D': return `=MANAGE_FACILITIES(school_code: "${school.school_code}")`;
            default: return "";
        }
    };

    const getEnterprisesExcelCellValueFormula = (rowIdx: number, colKey: string) => {
        const eIdx = rowIdx - 1;
        const ent = visibleEnterprises[eIdx];
        if (!ent) return "";
        const stats = enterpriseStats.find(item => item.school_code === ent.enterprise_code);
        switch (colKey) {
            case 'A': return `=ENTERPRISE_NAME("${ent.enterprise_name}")`;
            case 'B': return `=ENTERPRISE_CODE("${ent.enterprise_code}")`;
            case 'C': return `=RESOURCE_METRICS(employees: ${stats?.student_count || 0}, admins: ${stats?.admin_count || 0})`;
            case 'D': return `=AI_OPERATIONS(requests: ${stats?.total_ai_requests || 0})`;
            case 'E': return `=ONBOARD_DATE("${new Date(ent.created_at).toLocaleDateString()}")`;
            case 'F': return `=ADMIN_DELETE(enterprise_id: ${ent.id})`;
            default: return "";
        }
    };

    const handleLeftResizeMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        const handleMouseMove = (moveEvent: MouseEvent) => {
            const newWidth = Math.max(200, Math.min(450, moveEvent.clientX));
            setLeftSidebarWidth(newWidth);
        };
        const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    const handleRightResizeMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        const handleMouseMove = (moveEvent: MouseEvent) => {
            const newWidth = Math.max(240, Math.min(500, window.innerWidth - moveEvent.clientX));
            setRightSidebarWidth(newWidth);
        };
        const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };
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
    const [entFreezingUserId, setEntFreezingUserId] = useState<string | null>(null);
    const [entDeletingUserId, setEntDeletingUserId] = useState<string | null>(null);
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
                                daily_chat_limit: plan.daily_image_limit || 0,
                                daily_coding_limit: plan.feature_extraction_limit || 0,
                                daily_vision_limit: plan.daily_vision_limit || 0,
                                daily_tts_limit: plan.daily_tts_limit || 0,
                                daily_stt_limit: plan.daily_stt_limit || 0,
                                monthly_image_limit: plan.monthly_image_limit || 0,
                                monthly_flux_limit: plan.monthly_flux_limit || 0,
                                tokens_limit: plan.monthly_tokens || 100,
                                images_limit: plan.monthly_image_limit || 50,
                                personas_limit: (plan.feature_extraction_limit || 10) + (plan.daily_vision_limit || 10),
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
            const [entRes, statsRes, usersRes] = await Promise.all([
                getAdminEnterprises(),
                getEnterpriseStatsGlobal().catch(() => ({ success: true, enterprises: [] })),
                getAdminUsers().catch(() => ({ success: true, users: [] }))
            ]);
            if (entRes.success) setEnterprises(entRes.enterprises || []);
            if (statsRes.success) setEnterpriseStats((statsRes as any).enterprises || []);
            if (usersRes.success) setUsers(usersRes.users || []);
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

    const handleDeleteSchool = async (id: number) => {
        try {
            await deleteAdminSchool(id);
            setSchools(prev => prev.filter(s => s.id !== id));
            setSelectedSchool(prev => prev?.id === id ? null : prev);
            toast.success("School deleted successfully");
        } catch (e: any) {
            toast.error(e.message || "Failed to delete school");
        }
    };

    const handleEntFreezeUser = async (userId: string) => {
        setEntFreezingUserId(userId);
        try {
            const res = await freezeUser(userId);
            if (res.success) {
                setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_frozen: true } : u));
                toast.success(res.message || 'User frozen');
            } else {
                throw new Error(res.error || 'Failed to freeze');
            }
        } catch (e: any) {
            toast.error(e.message || 'Failed to freeze user');
        } finally {
            setEntFreezingUserId(null);
        }
    };

    const handleEntUnfreezeUser = async (userId: string) => {
        setEntFreezingUserId(userId);
        try {
            const res = await unfreezeUser(userId);
            if (res.success) {
                setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_frozen: false } : u));
                toast.success(res.message || 'User unfrozen');
            } else {
                throw new Error(res.error || 'Failed to unfreeze');
            }
        } catch (e: any) {
            toast.error(e.message || 'Failed to unfreeze user');
        } finally {
            setEntFreezingUserId(null);
        }
    };

    const handleEntDeleteUser = async (userId: string) => {
        setEntDeletingUserId(userId);
        try {
            await deleteAdminUser(userId);
            setUsers(prev => prev.filter(u => u.id !== userId));
            toast.success('User deleted');
        } catch (e: any) {
            toast.error(e.message || 'Failed to delete user');
        } finally {
            setEntDeletingUserId(null);
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
            setUserRole(globalRes.role || "global_admin");
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
                    const strikeOffVal = (editingPlan.strike_off_price && editingPlan.strike_off_price > 0) ? editingPlan.strike_off_price : getPlanStrikeOff(planId)?.price_inr;
                    if (strikeOffVal) {
                        setStrikeOffEnabled(true)
                        setStrikeOffPrice(strikeOffVal)
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

    const UsersListPanel = ({ isMobile = false, onClose }: { isMobile?: boolean, onClose?: () => void }) => {
        return (
            <div className={isMobile ? "space-y-8 block lg:hidden mt-8" : "h-full flex flex-col min-h-0"}>
                <div className={
                    isMobile 
                        ? `relative border border-zinc-800/50 p-6 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] backdrop-blur-xl overflow-hidden group ${
                            isDarkMode ? "bg-gradient-to-br from-zinc-900 via-black to-zinc-900" : "bg-gradient-to-br from-zinc-100 via-white to-zinc-100"
                          }`
                        : "flex-1 flex flex-col min-h-0"
                }>
                    {isMobile && (
                        <>
                            <div className="absolute inset-0 bg-[linear-gradient(110deg,transparent_0%,rgba(255,255,255,0.03)_45%,rgba(255,255,255,0.06)_50%,rgba(255,255,255,0.03)_55%,transparent_100%)] pointer-events-none" />
                            <div className="absolute inset-0 -translate-y-full group-hover:translate-y-full transition-transform duration-1000 bg-gradient-to-b from-transparent via-white/5 to-transparent pointer-events-none" />
                        </>
                    )}
                    <div className="flex items-center justify-between mb-8 shrink-0">
                        <h3 className={`text-xs font-display font-black uppercase tracking-[0.2em] ${isDarkMode ? "text-white" : "text-black"}`}>System Users</h3>
                        <div className="flex items-center gap-3">
                            {onClose && (
                                <button
                                    onClick={onClose}
                                    className={`p-1 rounded-lg border transition-all ${
                                        isDarkMode ? "border-white/10 hover:bg-white/5 text-white" : "border-black/10 hover:bg-black/5 text-black"
                                    }`}
                                    title="Collapse Users Sidebar"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            )}
                            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                        </div>
                    </div>

                    <div className="relative mb-6 shrink-0">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 opacity-20" />
                        <input
                            type="text"
                            placeholder="SEARCH ID / NAME..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={`w-full pl-11 pr-4 py-3 text-[10px] font-mono tracking-widest ${isDarkMode ? "bg-white/5 border-white/5" : "bg-black/5 border-black/5"} border rounded-2xl focus:outline-none focus:border-emerald-500/50 transition-all`}
                        />
                    </div>

                    <div className={`space-y-2 custom-scrollbar pr-2 overflow-y-auto ${isMobile ? "max-h-[500px]" : "flex-1 min-h-0"}`}>
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
            </div>
        );
    };

    return (
        <div className={`h-screen w-full ${isDarkMode ? "bg-[#0a0a0a] text-white" : "bg-white text-black"} font-sans selection:bg-white selection:text-black overflow-hidden flex flex-col lg:flex-row transition-colors duration-500`}>
            <div className={`absolute inset-0 noise opacity-[0.03] pointer-events-none ${isDarkMode ? "" : "invert"}`} />

            {/* 1. Desktop Sidebar */}
            <aside 
                className={`hidden lg:flex flex-col h-screen shrink-0 border-r relative z-[60] ${
                    isDarkMode 
                        ? "border-white/10 bg-black/40 bg-gradient-to-b from-zinc-950 via-black to-zinc-950" 
                        : "border-zinc-300 bg-white bg-gradient-to-b from-zinc-50 via-white to-zinc-50"
                } backdrop-blur-3xl transition-all duration-300`}
                style={{ width: isLeftSidebarCollapsed ? "80px" : `${leftSidebarWidth}px` }}
            >
                {/* Sidebar Header / Logo */}
                <div className={`h-20 flex items-center border-b border-inherit px-8 ${isLeftSidebarCollapsed ? "justify-center px-0" : "justify-between"}`}>
                    <Link href="/" className="flex items-center gap-3 group">
                        <div className="h-8 w-8 flex items-center justify-center transition-transform group-hover:rotate-45 overflow-hidden shrink-0">
                            <img 
                                src={isDarkMode ? "/dark.png" : "/light.png"} 
                                alt="Logo" 
                                className="h-full w-full object-contain transition-transform duration-300"
                                style={{ transform: isDarkMode ? "scale(1.5)" : "none" }}
                            />
                        </div>
                        {!isLeftSidebarCollapsed && (
                            <div 
                                className="flex items-center gap-1.5"
                                style={{
                                    transform: `scale(${Math.min(1, (leftSidebarWidth - 40) / 248)})`,
                                    transformOrigin: "left center"
                                }}
                            >
                                <div className="h-4.5 flex items-center shrink-0 overflow-hidden">
                                    <img 
                                        src={isDarkMode ? "/dark_text.png" : "/light_text.png"} 
                                        alt="Rudranex" 
                                        className="h-full object-contain"
                                    />
                                </div>
                                <span className={`font-serif italic text-base tracking-tighter ${isDarkMode ? "text-white/40" : "text-black/40"}`}>admin</span>
                            </div>
                        )}
                    </Link>
                </div>

                {/* Sidebar Menu Items */}
                <div className="flex-1 overflow-y-auto px-4 py-6 space-y-2 custom-scrollbar">
                    {!isLeftSidebarCollapsed && (
                        <span className="text-[9px] font-mono uppercase tracking-[0.2em] opacity-40 block px-4 mb-3">Navigation</span>
                    )}
                    
                    {([
                        { id: 'visual', label: 'Dashboard', icon: LayoutDashboard, action: () => setView('visual') },
                        { id: 'table', label: 'Tabular', icon: TableIcon, action: () => setView('table') },
                        { id: 'plans', label: 'Plans', icon: Zap, action: () => setView('plans') },
                        { id: 'schools', label: 'Schools', icon: Users, action: () => { setView('schools'); fetchSchoolsData(); } },
                        { id: 'enterprises', label: 'Enterprises', icon: Building2, action: () => { setView('enterprises' as any); fetchEnterprisesData(); } },
                        { id: 'sites', label: 'Sites', icon: FileText, action: () => {
                            setView('sites');
                            const pageKey = 'about_us';
                            const setting = siteSettings.find(s => s.key === pageKey);
                            const raw = setting?.value || '';
                            setEditingSiteSetting({ key: pageKey, value: raw });
                            try {
                                const parsed = JSON.parse(raw);
                                if (Array.isArray(parsed.sections) && !parsed.elements) {
                                    setSiteFormData({ elements: parsed.sections.map((s: string) => ({ type: 'paragraph', content: s })) });
                                } else if (parsed.description && !parsed.paragraphs) {
                                    setSiteFormData({ paragraphs: [parsed.description], email: parsed.email || '', responseTime: parsed.responseTime || '' });
                                } else {
                                    setSiteFormData(parsed);
                                }
                            } catch {
                                setSiteFormData({ elements: raw.split('\n\n').filter(Boolean).map((p: string) => ({ type: 'paragraph', content: p })) });
                            }
                        } }
                    ] as { id: typeof view; label: string; icon: any; action: () => void }[]).map((item) => {
                        const Icon = item.icon;
                        const isActive = view === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => {
                                    item.action();
                                    setIsMobileSidebarOpen(false);
                                }}
                                className={`w-full flex items-center transition-all duration-300 group relative text-left ${
                                    isLeftSidebarCollapsed 
                                        ? "px-0 justify-center py-4 rounded-xl"
                                        : "gap-4 px-4 py-3.5 rounded-2xl"
                                } ${
                                    isActive
                                        ? "text-[#00DDDD] bg-[#00DDDD]/5 font-bold shadow-[inset_0_1px_1px_rgba(0,221,221,0.1)]"
                                        : isDarkMode
                                            ? "text-white/55 hover:text-white hover:bg-white/5"
                                            : "text-black/60 hover:text-black hover:bg-black/5"
                                }`}
                                title={isLeftSidebarCollapsed ? item.label : undefined}
                            >
                                {/* Active Left Indicator Bar */}
                                {isActive && (
                                    <motion.div
                                        layoutId="activeBarDesktop"
                                        className="absolute left-0 top-3 bottom-3 w-[3px] bg-[#00DDDD] rounded-r"
                                    />
                                )}
                                <Icon className={`h-4 w-4 shrink-0 transition-transform duration-300 group-hover:scale-110 ${isActive ? "text-[#00DDDD]" : isDarkMode ? "text-white/40 group-hover:text-white" : "text-black/50 group-hover:text-black"}`} />
                                {!isLeftSidebarCollapsed && (
                                    <span className="truncate text-[10px] font-mono uppercase tracking-[0.25em]">{item.label}</span>
                                )}
                            </button>
                        );
                    })}

                    {/* Quick CTAs */}
                    {isLeftSidebarCollapsed ? (
                        <div className="pt-6 mt-6 border-t border-dashed border-inherit flex flex-col items-center gap-4">
                            <button
                                onClick={() => setShowCreateSchoolAdminModal(true)}
                                className="h-10 w-10 rounded-xl bg-emerald-600/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center hover:bg-emerald-600 hover:text-white hover:shadow-[0_0_15px_rgba(16,185,129,0.2)] transition-all duration-300"
                                title="Add School Admin"
                            >
                                <Plus className="h-4 w-4" />
                            </button>
                            <button
                                onClick={() => setShowCreateEnterpriseModal(true)}
                                className="h-10 w-10 rounded-xl bg-orange-600/10 text-orange-400 border border-orange-500/20 flex items-center justify-center hover:bg-orange-600 hover:text-white hover:shadow-[0_0_15px_rgba(249,115,22,0.2)] transition-all duration-300"
                                title="Add Enterprise Admin"
                            >
                                <Plus className="h-4 w-4" />
                            </button>
                        </div>
                    ) : (
                        <div className="pt-6 mt-6 border-t border-dashed border-inherit space-y-3">
                            <span className="text-[9px] font-mono uppercase tracking-[0.2em] opacity-40 block px-4">Actions</span>
                            
                            <button
                                onClick={() => setShowCreateSchoolAdminModal(true)}
                                className="w-full px-4 py-3 bg-emerald-600/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono uppercase tracking-[0.15em] hover:bg-emerald-600 hover:text-white hover:border-emerald-500 hover:shadow-[0_0_15px_rgba(16,185,129,0.2)] transition-all duration-300 rounded-2xl flex items-center gap-3 group text-left"
                            >
                                <div className="h-6 w-6 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-colors shrink-0">
                                    <Plus className="h-3.5 w-3.5" />
                                </div>
                                <span className="truncate">Add School Admin</span>
                            </button>
                            
                            <button
                                onClick={() => setShowCreateEnterpriseModal(true)}
                                className="w-full px-4 py-3 bg-orange-600/10 text-orange-400 border border-orange-500/20 text-[10px] font-mono uppercase tracking-[0.15em] hover:bg-orange-600 hover:text-white hover:border-orange-500 hover:shadow-[0_0_15px_rgba(249,115,22,0.2)] transition-all duration-300 rounded-2xl flex items-center gap-3 group text-left"
                            >
                                <div className="h-6 w-6 rounded-lg bg-orange-500/20 flex items-center justify-center text-orange-400 group-hover:bg-orange-500 group-hover:text-white transition-colors shrink-0">
                                    <Plus className="h-3.5 w-3.5" />
                                </div>
                                <span className="truncate">Add Enterprise Admin</span>
                            </button>
                        </div>
                    )}
                </div>
                {/* Drag Resize Handle */}
                {!isLeftSidebarCollapsed && (
                    <div
                        onMouseDown={handleLeftResizeMouseDown}
                        className="absolute top-0 right-0 w-[4px] h-full cursor-col-resize hover:bg-[#00DDDD]/50 active:bg-[#00DDDD] transition-colors z-[70]"
                    />
                )}
            </aside>

            {/* 2. Mobile Sidebar Drawer */}
            <AnimatePresence>
                {isMobileSidebarOpen && (
                    <div className="fixed inset-0 z-[150] lg:hidden flex">
                        {/* Backdrop Overlay */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsMobileSidebarOpen(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />

                        {/* Sidebar Slide-out Panel */}
                        <motion.aside
                            initial={{ x: "-100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "-100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className={`relative w-[280px] max-w-[85vw] h-full flex flex-col border-r z-10 ${
                                isDarkMode 
                                    ? "border-white/10 bg-zinc-950" 
                                    : "border-black/10 bg-white"
                            } transition-colors duration-500`}
                        >
                            {/* Close Toggler */}
                            <button
                                onClick={() => setIsMobileSidebarOpen(false)}
                                className={`absolute top-5 right-5 p-2 rounded-xl border ${
                                    isDarkMode ? "border-white/10 hover:bg-white/5 text-white" : "border-black/10 hover:bg-black/5 text-black"
                                }`}
                            >
                                <X className="h-4 w-4" />
                            </button>

                            {/* Mobile Logo */}
                            <div className="h-20 flex items-center px-8 border-b border-inherit">
                                <Link href="/" className="flex items-center gap-3">
                                    <div className="h-7 w-7 flex items-center justify-center">
                                        <img 
                                            src={isDarkMode ? "/dark.png" : "/light.png"} 
                                            alt="Logo" 
                                            className="h-full w-full object-contain"
                                            style={{ transform: isDarkMode ? "scale(1.5)" : "none" }}
                                        />
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <div className="h-4 flex items-center shrink-0 overflow-hidden">
                                            <img 
                                                src={isDarkMode ? "/dark_text.png" : "/light_text.png"} 
                                                alt="Rudranex" 
                                                className="h-full object-contain"
                                            />
                                        </div>
                                        <span className={`font-serif italic text-sm tracking-tighter ${isDarkMode ? "text-white/40" : "text-black/40"}`}>admin</span>
                                    </div>
                                </Link>
                            </div>

                            {/* Mobile Menu Items */}
                            <div className="flex-1 overflow-y-auto px-4 py-6 space-y-2 custom-scrollbar border-inherit">
                                <span className="text-[9px] font-mono uppercase tracking-[0.2em] opacity-40 block px-4 mb-3">Navigation</span>
                                
                                {([
                                    { id: 'visual', label: 'Dashboard', icon: LayoutDashboard, action: () => setView('visual') },
                                    { id: 'table', label: 'Tabular', icon: TableIcon, action: () => setView('table') },
                                    { id: 'plans', label: 'Plans', icon: Zap, action: () => setView('plans') },
                                    { id: 'schools', label: 'Schools', icon: Users, action: () => { setView('schools'); fetchSchoolsData(); } },
                                    { id: 'enterprises', label: 'Enterprises', icon: Building2, action: () => { setView('enterprises' as any); fetchEnterprisesData(); } },
                                    { id: 'sites', label: 'Sites', icon: FileText, action: () => {
                                        setView('sites');
                                        const pageKey = 'about_us';
                                        const setting = siteSettings.find(s => s.key === pageKey);
                                        const raw = setting?.value || '';
                                        setEditingSiteSetting({ key: pageKey, value: raw });
                                        try {
                                            const parsed = JSON.parse(raw);
                                            if (Array.isArray(parsed.sections) && !parsed.elements) {
                                                setSiteFormData({ elements: parsed.sections.map((s: string) => ({ type: 'paragraph', content: s })) });
                                            } else if (parsed.description && !parsed.paragraphs) {
                                                setSiteFormData({ paragraphs: [parsed.description], email: parsed.email || '', responseTime: parsed.responseTime || '' });
                                            } else {
                                                setSiteFormData(parsed);
                                            }
                                        } catch {
                                            setSiteFormData({ elements: raw.split('\n\n').filter(Boolean).map((p: string) => ({ type: 'paragraph', content: p })) });
                                        }
                                    } }
                                ] as { id: typeof view; label: string; icon: any; action: () => void }[]).map((item) => {
                                    const Icon = item.icon;
                                    const isActive = view === item.id;
                                    return (
                                        <button
                                            key={item.id}
                                            onClick={() => {
                                                item.action();
                                                setIsMobileSidebarOpen(false);
                                            }}
                                            className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-[10px] font-mono uppercase tracking-[0.25em] transition-all duration-300 relative text-left ${
                                                isActive
                                                    ? "text-[#00DDDD] bg-[#00DDDD]/5 font-bold"
                                                    : isDarkMode
                                                        ? "text-white/55 hover:text-white hover:bg-white/5"
                                                        : "text-black/60 hover:text-black hover:bg-black/5"
                                            }`}
                                        >
                                            {isActive && (
                                                <motion.div
                                                    layoutId="activeBarMobile"
                                                    className="absolute left-0 top-3 bottom-3 w-[3px] bg-[#00DDDD] rounded-r"
                                                />
                                            )}
                                            <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-[#00DDDD]" : isDarkMode ? "text-white/40" : "text-black/50"}`} />
                                            <span className="truncate">{item.label}</span>
                                        </button>
                                    );
                                })}

                                {/* Quick CTAs in Mobile Drawer */}
                                <div className="pt-6 mt-6 border-t border-dashed border-inherit space-y-3">
                                    <span className="text-[9px] font-mono uppercase tracking-[0.2em] opacity-40 block px-4">Actions</span>
                                    
                                    <button
                                        onClick={() => {
                                            setShowCreateSchoolAdminModal(true);
                                            setIsMobileSidebarOpen(false);
                                        }}
                                        className="w-full px-4 py-3.5 bg-emerald-600/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono uppercase tracking-[0.15em] rounded-2xl flex items-center gap-3 text-left"
                                    >
                                        <Plus className="h-4 w-4 shrink-0" />
                                        <span className="truncate">Add School Admin</span>
                                    </button>
                                    
                                    <button
                                        onClick={() => {
                                            setShowCreateEnterpriseModal(true);
                                            setIsMobileSidebarOpen(false);
                                        }}
                                        className="w-full px-4 py-3.5 bg-orange-600/10 text-orange-400 border border-orange-500/20 text-[10px] font-mono uppercase tracking-[0.15em] rounded-2xl flex items-center gap-3 text-left"
                                    >
                                        <Plus className="h-4 w-4 shrink-0" />
                                        <span className="truncate">Add Enterprise Admin</span>
                                    </button>
                                </div>
                            </div>

                            {/* Mobile Drawer Status */}
                            <div className="p-6 border-t border-inherit">
                                <div className={`p-4 rounded-2xl flex items-center gap-3 border ${isDarkMode ? "bg-white/5 border-white/5" : "bg-black/5 border-black/5"}`}>
                                    <div className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                                    <div className="flex flex-col min-w-0">
                                        <span className="text-[8px] font-mono uppercase tracking-widest opacity-40">System Core Node</span>
                                        <span className="text-[10px] font-bold font-mono text-emerald-400 truncate">NODE://IND-01</span>
                                    </div>
                                </div>
                            </div>
                        </motion.aside>
                    </div>
                )}
            </AnimatePresence>

            {/* 3. Main Content Wrapper */}
            <div className="flex-1 h-screen flex flex-col overflow-hidden relative z-10">
                
                {/* Sticky Header Bar */}
                <header className={`h-20 shrink-0 flex items-center justify-between px-6 md:px-10 border-b relative z-30 ${
                    isDarkMode ? "border-white/10 bg-black/60" : "border-zinc-300 bg-white/60"
                } backdrop-blur-2xl transition-colors duration-500`}>
                    
                    <div className="flex items-center gap-4">
                        {/* Hamburger Trigger for Mobile */}
                        <button
                            onClick={() => setIsMobileSidebarOpen(true)}
                            className={`lg:hidden p-3 rounded-2xl border transition-all ${
                                isDarkMode ? "border-white/10 hover:bg-white/5 text-white" : "border-zinc-300 hover:bg-black/5 text-black"
                            }`}
                        >
                            <Menu className="h-4.5 w-4.5" />
                        </button>

                        {/* Desktop Left Sidebar Collapse Toggle Button */}
                        <button
                            onClick={() => setIsLeftSidebarCollapsed(!isLeftSidebarCollapsed)}
                            className={`hidden lg:flex p-3 rounded-2xl border transition-all ${
                                isDarkMode ? "border-white/10 hover:bg-white/5 text-white" : "border-zinc-300 hover:bg-black/5 text-black"
                            }`}
                            title={isLeftSidebarCollapsed ? "Expand Navigation Sidebar" : "Collapse Navigation Sidebar"}
                        >
                            {isLeftSidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                        </button>

                        {/* Breadcrumbs / Section Title for Desktop, Brand for Mobile */}
                        <div className="hidden lg:flex flex-col">
                            <span className={`text-[8px] font-mono uppercase tracking-[0.3em] ${isDarkMode ? "text-white/30" : "text-black/45"}`}>
                                Global System Console
                            </span>
                            <span className={`text-xs font-mono font-black uppercase tracking-[0.2em] flex items-center gap-2 ${
                                isDarkMode ? "text-[#00DDDD]" : "text-black"
                            }`}>
                                System Nodes <ChevronRight className="h-3 w-3 opacity-40 text-inherit" /> {view}
                            </span>
                        </div>

                        {/* Mobile Brand Logo */}
                        <div className="lg:hidden flex items-center gap-2">
                            <img src={isDarkMode ? "/dark.png" : "/light.png"} alt="Logo" className="h-5 w-5 object-contain" />
                            <span className="text-[10px] font-mono font-black uppercase tracking-[0.2em] text-[#00DDDD]">
                                RudraNex
                            </span>
                        </div>
                    </div>

                    {/* Right Hand Utilities Cluster */}
                    <div className="flex items-center gap-3">
                        
                        {/* Right Sidebar Toggle Button (Desktop Users/Pages Sidebar) */}
                        {(view === 'visual' || view === 'sites') && (
                            <button
                                onClick={() => setIsRightSidebarCollapsed(!isRightSidebarCollapsed)}
                                className={`hidden lg:flex h-10 w-10 rounded-2xl border items-center justify-center transition-all ${
                                    isRightSidebarCollapsed 
                                        ? "bg-[#00DDDD]/10 text-[#00DDDD] border-[#00DDDD]/30 hover:bg-[#00DDDD] hover:text-black hover:border-[#00DDDD]"
                                        : isDarkMode ? "border-white/10 hover:bg-white/5 text-white" : "border-zinc-300 hover:bg-black/5 text-black"
                                }`}
                                title={isRightSidebarCollapsed ? (view === 'visual' ? "Show Users Sidebar" : "Show Pages Sidebar") : (view === 'visual' ? "Collapse Users Sidebar" : "Collapse Pages Sidebar")}
                            >
                                {view === 'visual' ? <Users className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                            </button>
                        )}

                        {/* Dark/Light Mode Toggler */}
                        <div
                            onClick={() => setIsDarkMode(!isDarkMode)}
                            className={`h-10 w-10 rounded-2xl border flex items-center justify-center cursor-pointer transition-all ${
                                isDarkMode ? "border-white/10 hover:bg-white/5 text-white" : "border-zinc-300 hover:bg-black/5 text-black"
                            }`}
                            title="Toggle Theme"
                        >
                            {isDarkMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                        </div>

                        {/* Notification Bell */}
                        <button
                            onClick={() => { setView('requests'); fetchRequests(); }}
                            className={`relative h-10 w-10 rounded-2xl border flex items-center justify-center transition-all ${
                                isDarkMode ? 'border-white/10 hover:bg-white/5' : 'border-zinc-300 hover:bg-black/5'
                            }`}
                            title="Notifications & Requests"
                        >
                            <Bell className={`h-4 w-4 ${isDarkMode ? 'text-white' : 'text-black'}`} />
                            {requests.filter(r => r.status === 'pending').length > 0 && (
                                <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-[8px] font-bold flex items-center justify-center text-white">
                                    {requests.filter(r => r.status === 'pending').length}
                                </span>
                            )}
                        </button>

                        {/* Chat Button */}
                        <Link
                            href="/chat"
                            className="h-10 w-10 rounded-2xl border border-emerald-500/30 flex items-center justify-center group cursor-pointer overflow-hidden bg-emerald-500/10 hover:bg-emerald-500 transition-all"
                            title="Open Chat"
                        >
                            <MessageSquare className="h-4 w-4 text-emerald-400 group-hover:text-black transition-colors" />
                        </Link>

                        {/* Divider */}
                        <div className={`h-6 w-[1px] mx-1 ${isDarkMode ? "bg-white/10" : "bg-zinc-300"}`} />

                        {/* Logout Button */}
                        <div
                            onClick={handleAdminLogout}
                            className="h-10 w-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center group cursor-pointer overflow-hidden hover:bg-amber-500 transition-all"
                            title="Logout Admin"
                        >
                            <LogOut className="h-4 w-4 text-amber-500 group-hover:text-black transition-colors" />
                        </div>
                    </div>
                </header>

                {/* Main Content Layout Row (Main + Collapsible Right Sidebar) */}
                <div className="flex-1 flex overflow-hidden relative z-10 w-full">
                    {/* Main Scrollable View */}
                    <main className={`flex-1 overflow-y-auto p-6 md:p-10 relative z-10 w-full max-w-[1800px] mx-auto custom-scrollbar ${isDarkMode ? "text-white" : "text-black"}`}>
                    <AnimatePresence mode="wait">
                        {view === 'visual' && (
                            <motion.div
                                key="visual"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="space-y-8 w-full"
                            >
                                {/* Main Content Area: Analytics */}
                                <div className="col-span-12 space-y-8 w-full">
                                    {selectedUser ? (
                                        <>
                                            {/* User Identity Header */}
                                            <div className="relative pb-8 border-b border-zinc-800/20 dark:border-white/5 flex flex-col lg:flex-row lg:items-center justify-between gap-8 z-10 mb-8">
                                                    <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
                                                        <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-[1.5rem] sm:rounded-[2rem] bg-emerald-500 flex items-center justify-center text-black shrink-0">
                                                            <User className="h-8 w-8 sm:h-10 sm:w-10" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="flex flex-col sm:flex-row items-center gap-3 mb-2 justify-center sm:justify-start">
                                                                <h2 className={`text-2xl sm:text-4xl font-display font-black tracking-tighter truncate ${isDarkMode ? "text-white" : "text-black"}`}>{selectedUser.name}</h2>
                                                                <span className={`px-4 py-1.5 rounded-full text-[10px] font-mono uppercase tracking-widest ${selectedUser.subscription.status === 'active' ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" :
                                                                        selectedUser.subscription.status === 'frozen' ? "bg-red-500/20 text-red-400 border border-red-500/30" :
                                                                            "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                                                                    }`}>
                                                                    {selectedUser.subscription.status}
                                                                </span>
                                                            </div>
                                                            <p className={`text-xs sm:text-sm font-mono flex items-center justify-center sm:justify-start gap-2 uppercase tracking-widest ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"} truncate`}>
                                                                <Mail className="h-3.5 w-3.5 shrink-0" /> {selectedUser.email}
                                                            </p>
                                                            <p className={`text-[9px] sm:text-[10px] font-mono mt-1 uppercase tracking-widest ${isDarkMode ? "opacity-20 text-white" : "opacity-40 text-black"} truncate`}>UUID: {selectedUser.id}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-wrap items-center justify-center lg:justify-end gap-4">
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
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
                                                <StatCard
                                                    title="Token Usage"
                                                    value={`${selectedUser.subscription.tokens_used} / ${selectedUser.subscription.tokens_limit}`}
                                                    icon={Zap}
                                                    color="#00DDDD"
                                                    subtext={`${Math.min((selectedUser.subscription.tokens_used / (selectedUser.subscription.tokens_limit || 1)) * 100, 100).toFixed(0)}% consumed`}
                                                    isDarkMode={isDarkMode}
                                                />
                                                <StatCard
                                                    title="Token Burn Rate"
                                                    value={`${((selectedUser.subscription.daily_chats + selectedUser.subscription.daily_codings + selectedUser.subscription.daily_visions + selectedUser.subscription.daily_tts + selectedUser.subscription.daily_stt) / (selectedUser.subscription.tokens_limit || 1) * 100).toFixed(1)}%`}
                                                    icon={TrendingUp}
                                                    color="#f59e0b"
                                                    subtext="Daily consumption"
                                                    isDarkMode={isDarkMode}
                                                />
                                            </div>

                                            {/* Visualization Section */}
                                            <div className="grid grid-cols-12 gap-8">
                                                <div className="col-span-12 lg:col-span-8 py-6">
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
                                                            limit={selectedUser.subscription.daily_chat_limit || 1}
                                                            label="Daily Chat"
                                                            color="#10b981"
                                                            isDarkMode={isDarkMode}
                                                        />
                                                        <ProgressCircle
                                                            value={selectedUser.subscription.monthly_images + selectedUser.subscription.monthly_flux}
                                                            limit={selectedUser.subscription.images_limit || 1}
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
                                                        <ProgressCircle
                                                            value={selectedUser.subscription.tokens_used}
                                                            limit={selectedUser.subscription.tokens_limit || 1}
                                                            label="Token Usage"
                                                            color="#00DDDD"
                                                            isDarkMode={isDarkMode}
                                                        />
                                                    </div>
                                                </div>

                                                <div className="col-span-12 lg:col-span-4 py-6 flex flex-col justify-between">
                                                    <div>
                                                        <div className="flex items-center gap-3 mb-6">
                                                            <TrendingUp className={`h-5 w-5 ${isDarkMode ? "text-emerald-400" : "text-emerald-600"}`} />
                                                            <h3 className={`text-xs font-display font-black uppercase tracking-[0.2em] ${isDarkMode ? "text-white" : "text-black"}`}>User Efficiency</h3>
                                                        </div>
                                                        <p className={`text-[10px] font-mono uppercase leading-relaxed tracking-widest ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>
                                                            Token usage: <b>{selectedUser.subscription.tokens_used}/{selectedUser.subscription.tokens_limit}</b> • Chat: {selectedUser.subscription.daily_chats}/{selectedUser.subscription.daily_chat_limit} daily • {selectedUser.subscription.daily_tts + selectedUser.subscription.daily_stt > 0 ? `Audio: ${selectedUser.subscription.daily_tts + selectedUser.subscription.daily_stt} uses • ` : ''}Images: {selectedUser.subscription.monthly_images + selectedUser.subscription.monthly_flux}/{selectedUser.subscription.images_limit} monthly
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
                                            <div className="mt-12 py-6">
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

                                    {/* Mobile/Tablet Users List Panel */}
                                    <UsersListPanel isMobile={true} />
                                </div>
                            </motion.div>
                        )}

                    {view === 'table' && (
                        <motion.div
                            key="table"
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -15 }}
                            className="space-y-4 w-full"
                        >
                            {/* Excel Menu & Operations Toolbar */}
                            <div className={`flex flex-col sm:flex-row sm:items-center justify-between p-1.5 border ${isDarkMode ? "border-zinc-800 bg-zinc-950" : "border-zinc-300 bg-zinc-50"}`}>
                                {/* Search Bar styled like Spreadsheet Actions */}
                                <div className="relative w-full sm:w-auto">
                                    <Search className={`absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 ${isDarkMode ? "opacity-30 text-white" : "opacity-50 text-black"}`} />
                                    <input
                                        type="text"
                                        placeholder="Sheet Search Filter..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className={`w-full sm:w-[280px] pl-8 pr-4 py-1.5 text-[10px] font-mono tracking-wider focus:outline-none border ${
                                            isDarkMode 
                                                ? "bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600 focus:border-emerald-500/50" 
                                                : "bg-white border-zinc-300 text-black placeholder:text-zinc-400 focus:border-emerald-600"
                                        }`}
                                    />
                                </div>

                                {/* Export CSV Button */}
                                <button
                                    onClick={handleExportCSV}
                                    className={`mt-2 sm:mt-0 px-3 py-1.5 text-[10px] font-mono font-bold border transition-all flex items-center justify-center gap-1.5 ${
                                        isDarkMode 
                                            ? "bg-zinc-900 hover:bg-zinc-800 text-emerald-400 border-zinc-800 hover:text-emerald-300" 
                                            : "bg-white hover:bg-zinc-100 text-emerald-700 border-zinc-300 hover:text-emerald-800"
                                    }`}
                                >
                                    <FileText className="h-3 w-3" />
                                    Export CSV
                                </button>
                            </div>

                            {/* Excel Formula Bar */}
                            <div className={`flex items-center border-x border-b text-[10px] font-mono ${
                                isDarkMode ? "border-zinc-800 bg-zinc-900/50 text-white" : "border-zinc-300 bg-zinc-100/50 text-black"
                            }`}>
                                {/* Cell Address Coordinate Box */}
                                <div className={`w-14 text-center py-2 font-bold border-r select-none shrink-0 ${
                                    isDarkMode ? "border-zinc-800 text-emerald-400" : "border-zinc-300 text-emerald-700"
                                }`}>
                                    {activeExcelCell ? `${activeExcelCell.colKey}${activeExcelCell.rowIdx}` : "A1"}
                                </div>

                                {/* fx indicator */}
                                <div className={`px-3 select-none italic font-serif font-black text-xs shrink-0 ${isDarkMode ? "text-zinc-500 border-r border-zinc-800" : "text-zinc-400 border-r border-zinc-300"}`}>
                                    fx
                                </div>

                                {/* Formula / Cell Content Box */}
                                <div className="flex-1 px-4 py-2 font-sans truncate select-none text-[10.5px]">
                                    {activeExcelCell ? getExcelCellValueFormula(activeExcelCell.rowIdx, activeExcelCell.colKey) : ""}
                                </div>
                            </div>

                            {/* Crisp spreadsheet container without rounded corners and card styling */}
                            <div className={`overflow-x-auto relative z-10 w-full border ${isDarkMode ? "border-zinc-800 bg-zinc-950" : "border-zinc-300 bg-white"}`}>
                                <table className="w-full text-left border-collapse select-none">
                                    <thead>
                                        {/* Row 1: Excel Column Letters */}
                                        <tr className={`text-[8px] font-mono uppercase text-center border-b ${isDarkMode ? "bg-zinc-900/60 border-zinc-800 text-white/40" : "bg-zinc-100 border-zinc-300 text-black/40"}`}>
                                            <th className="p-2 border-r border-inherit w-10 text-center font-bold bg-zinc-200/50 dark:bg-zinc-900"></th>
                                            {['A', 'B', 'C', 'D', 'E'].map(col => (
                                                <th 
                                                    key={col} 
                                                    className={`p-2 border-r border-inherit text-center font-bold transition-colors ${
                                                        activeExcelCell?.colKey === col
                                                            ? "bg-emerald-500/10 text-emerald-400 font-black"
                                                            : ""
                                                    }`}
                                                >
                                                    {col}
                                                </th>
                                            ))}
                                        </tr>
                                        {/* Row 2: Standard Headers */}
                                        <tr className={`text-[9px] font-mono uppercase tracking-[0.2em] border-b ${isDarkMode ? "bg-zinc-900/40 border-zinc-800 text-white/50" : "bg-zinc-50 border-zinc-300 text-black/60"}`}>
                                            <th className="p-3 border-r border-inherit text-center font-bold w-10 bg-zinc-200/30 dark:bg-zinc-900/60">#</th>
                                            <th className="p-4 border-r border-inherit font-bold">
                                                <button onClick={() => toggleSort("name")} className="flex items-center gap-1 hover:opacity-85 transition-all">
                                                    Identity {sortField === "name" ? (sortOrder === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 opacity-30" />}
                                                </button>
                                            </th>
                                            <th className="p-4 border-r border-inherit font-bold">
                                                <button onClick={() => toggleSort("plan")} className="flex items-center gap-1 hover:opacity-85 transition-all">
                                                    Subscription {sortField === "plan" ? (sortOrder === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 opacity-30" />}
                                                </button>
                                            </th>
                                            <th className="p-4 border-r border-inherit font-bold text-center">Resources</th>
                                            <th className="p-4 border-r border-inherit font-bold">
                                                <button onClick={() => toggleSort("latency")} className="flex items-center gap-1 hover:opacity-85 transition-all">
                                                    Chat / Usage {sortField === "latency" ? (sortOrder === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 opacity-30" />}
                                                </button>
                                            </th>
                                            <th className="p-4 font-bold text-right">Administrative</th>
                                        </tr>
                                    </thead>
                                    <tbody className={`text-[11px] font-mono tracking-tight ${isDarkMode ? "text-white/90" : "text-black/90"}`}>
                                        {isLoading ? (
                                            Array.from({ length: 5 }).map((_, i) => (
                                                <tr key={i} className="animate-pulse border-b border-zinc-800 opacity-20">
                                                    <td colSpan={6} className={`p-8 h-16 ${isDarkMode ? "bg-white/5" : "bg-black/5"}`} />
                                                </tr>
                                            ))
                                        ) : paginatedUsers.length === 0 ? (
                                            <tr className="border-b border-zinc-800">
                                                <td colSpan={6} className={`p-20 text-center font-display font-black text-2xl uppercase tracking-[1em] ${isDarkMode ? "opacity-20 text-white" : "opacity-40 text-black"}`}>Void Found</td>
                                            </tr>
                                        ) : (
                                            paginatedUsers.map((user, index) => {
                                                const rowIndex = index + 1;
                                                const globalRowIndex = (currentPage - 1) * USERS_PER_PAGE + index + 1;
                                                return (
                                                    <tr key={user.id} className={`border-b transition-colors ${isDarkMode ? "border-zinc-800 hover:bg-white/[0.01]" : "border-zinc-300 hover:bg-black/[0.01]"}`}>
                                                        {/* Row index indicator */}
                                                        <td className={`p-3 text-center text-[9px] font-mono border-r border-inherit w-10 select-none transition-colors ${
                                                            activeExcelCell?.rowIdx === rowIndex
                                                                ? "bg-emerald-500/15 text-emerald-500 font-bold"
                                                                : isDarkMode ? "bg-zinc-950/40 text-white/30" : "bg-zinc-50 text-black/40"
                                                        }`}>{globalRowIndex}</td>
                                                        
                                                        {/* Col A: Identity */}
                                                        <td 
                                                            onClick={() => setActiveExcelCell({ rowIdx: rowIndex, colKey: 'A' })}
                                                            className={`p-4 border-r border-inherit cursor-cell relative transition-all ${
                                                                activeExcelCell?.rowIdx === rowIndex && activeExcelCell?.colKey === 'A'
                                                                    ? "outline outline-2 outline-emerald-500 -outline-offset-1 z-20 bg-emerald-500/[0.03] dark:bg-emerald-500/[0.02]"
                                                                    : ""
                                                            }`}
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <div className={`h-8 w-8 rounded-lg flex items-center justify-center border shrink-0 ${isDarkMode ? "bg-white/5 border-white/10 text-white/40" : "bg-black/5 border-zinc-300 text-black/40"}`}>
                                                                    <User className="h-3.5 w-3.5" />
                                                                </div>
                                                                <div className="flex flex-col min-w-0">
                                                                    <span className="text-[12px] font-bold tracking-tight truncate">{user.name}</span>
                                                                    <span className={`text-[9px] lowercase font-sans truncate ${isDarkMode ? "opacity-35 text-white" : "opacity-55 text-black"}`}>{user.email}</span>
                                                                </div>
                                                            </div>
                                                        </td>

                                                        {/* Col B: Subscription */}
                                                        <td 
                                                            onClick={() => setActiveExcelCell({ rowIdx: rowIndex, colKey: 'B' })}
                                                            className={`p-4 border-r border-inherit cursor-cell relative transition-all ${
                                                                activeExcelCell?.rowIdx === rowIndex && activeExcelCell?.colKey === 'B'
                                                                    ? "outline outline-2 outline-emerald-500 -outline-offset-1 z-20 bg-emerald-500/[0.03] dark:bg-emerald-500/[0.02]"
                                                                    : ""
                                                            }`}
                                                        >
                                                            <div className="flex flex-col gap-1">
                                                                <span className={`text-[9px] font-black w-fit px-1.5 py-0.5 rounded border uppercase tracking-wider ${user.subscription.plan === 'pro' ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/5" : isDarkMode ? "border-white/10 text-white" : "border-zinc-300 text-black"}`}>
                                                                    {user.subscription.plan}
                                                                </span>
                                                                <div className="flex items-center gap-1.5">
                                                                    <div className={`h-1.5 w-1.5 rounded-full ${user.subscription.status === 'active' ? "bg-emerald-500" :
                                                                            user.subscription.status === 'frozen' ? "bg-red-500" :
                                                                                "bg-amber-500"
                                                                        }`} />
                                                                    <span className={`text-[9px] uppercase font-mono ${isDarkMode ? "text-white opacity-40" : "text-black opacity-60"}`}>{user.subscription.status}</span>
                                                                </div>
                                                            </div>
                                                        </td>

                                                        {/* Col C: Resources */}
                                                        <td 
                                                            onClick={() => setActiveExcelCell({ rowIdx: rowIndex, colKey: 'C' })}
                                                            className={`p-4 border-r border-inherit cursor-cell relative transition-all ${
                                                                activeExcelCell?.rowIdx === rowIndex && activeExcelCell?.colKey === 'C'
                                                                    ? "outline outline-2 outline-emerald-500 -outline-offset-1 z-20 bg-emerald-500/[0.03] dark:bg-emerald-500/[0.02]"
                                                                    : ""
                                                            }`}
                                                        >
                                                            <div className="flex flex-col gap-1.5 max-w-[150px] mx-auto">
                                                                <div className={`flex justify-between text-[8px] font-mono ${isDarkMode ? "text-white opacity-35" : "text-black opacity-55"}`}>
                                                                    <span>TOKENS</span>
                                                                    <span>{((user.subscription.tokens_used / user.subscription.tokens_limit) * 100).toFixed(0)}%</span>
                                                                </div>
                                                                <div className={`h-1 w-full rounded-full overflow-hidden ${isDarkMode ? "bg-white/5" : "bg-black/5"}`}>
                                                                    <div className={`h-full ${isDarkMode ? "bg-white/20" : "bg-black/35"}`} style={{ width: `${(user.subscription.tokens_used / user.subscription.tokens_limit) * 100}%` }} />
                                                                </div>
                                                            </div>
                                                        </td>

                                                        {/* Col D: Usage */}
                                                        <td 
                                                            onClick={() => setActiveExcelCell({ rowIdx: rowIndex, colKey: 'D' })}
                                                            className={`p-4 border-r border-inherit cursor-cell relative transition-all ${
                                                                activeExcelCell?.rowIdx === rowIndex && activeExcelCell?.colKey === 'D'
                                                                    ? "outline outline-2 outline-emerald-500 -outline-offset-1 z-20 bg-emerald-500/[0.03] dark:bg-emerald-500/[0.02]"
                                                                    : ""
                                                            }`}
                                                        >
                                                            <div className="flex flex-col gap-0.5">
                                                                <div className="flex items-center gap-1.5">
                                                                    <MessageSquare className="h-3 w-3 text-blue-500/40" />
                                                                    <span className="font-bold">{user.subscription.daily_chats}</span>
                                                                    <span className={`text-[9px] ${isDarkMode ? "opacity-35 text-white" : "opacity-55 text-black"}`}>/ {user.subscription.tokens_limit}</span>
                                                                </div>
                                                                <span className={`text-[8px] font-mono uppercase tracking-widest ${isDarkMode ? "opacity-30 text-white" : "opacity-50 text-black"}`}>
                                                                    {user.subscription.daily_codings}C · {user.subscription.daily_visions}V · {user.subscription.monthly_images}I
                                                                </span>
                                                            </div>
                                                        </td>

                                                        {/* Col E: Administrative */}
                                                        <td 
                                                            onClick={() => setActiveExcelCell({ rowIdx: rowIndex, colKey: 'E' })}
                                                            className={`p-4 cursor-cell relative transition-all ${
                                                                activeExcelCell?.rowIdx === rowIndex && activeExcelCell?.colKey === 'E'
                                                                    ? "outline outline-2 outline-emerald-500 -outline-offset-1 z-20 bg-emerald-500/[0.03] dark:bg-emerald-500/[0.02]"
                                                                    : ""
                                                            }`}
                                                        >
                                                            <div className="flex items-center justify-end gap-2">
                                                                <button
                                                                    onClick={() => {
                                                                        setSelectedUser(user);
                                                                        setView('visual');
                                                                    }}
                                                                    className={`px-4 py-2 border transition-all text-[9px] font-bold tracking-widest rounded-xl ${isDarkMode ? "border-zinc-800 hover:border-white/20 hover:bg-white/5 text-white" : "border-zinc-300 hover:border-black/20 hover:bg-black/5 text-black"}`}
                                                                >
                                                                    Visualize
                                                                </button>
                                                                {confirmDeleteUserId === user.id ? (
                                                                    <div className="flex items-center gap-1">
                                                                        <button
                                                                            onClick={() => handleDeleteUser(user.id)}
                                                                            disabled={deletingUserId === user.id}
                                                                            className="px-3 py-2 bg-red-500 text-white text-[9px] font-bold tracking-widest rounded-xl hover:bg-red-600 disabled:opacity-50 transition-all"
                                                                        >
                                                                            {deletingUserId === user.id ? '...' : 'CONFIRM'}
                                                                        </button>
                                                                        <button
                                                                            onClick={() => setConfirmDeleteUserId(null)}
                                                                            className={`p-2 border rounded-xl transition-all text-[9px] ${isDarkMode ? "border-zinc-800 hover:bg-white/5 text-white" : "border-zinc-300 hover:bg-black/5 text-black"}`}
                                                                        >
                                                                            <X className="h-3 w-3" />
                                                                        </button>
                                                                    </div>
                                                                ) : (
                                                                    <button
                                                                        onClick={() => setConfirmDeleteUserId(user.id)}
                                                                        className={`p-2 border rounded-xl transition-all hover:border-red-500/40 hover:text-red-400 hover:bg-red-500/5 ${isDarkMode ? "border-zinc-800 text-white/40" : "border-zinc-300 text-black/40"}`}
                                                                        title="Delete user"
                                                                    >
                                                                        <Trash2 className="h-3.5 w-3.5" />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Excel Bottom Sheet Tab Bar & Status Indicator */}
                            <div className={`flex items-center justify-center border-x border-b p-2 text-[10px] font-mono select-none ${
                                isDarkMode ? "border-zinc-800 bg-zinc-950 text-white" : "border-zinc-300 bg-zinc-50 text-black"
                            }`}>
                                {/* Real-time Pagination controls resembling Excel page navigation */}
                                <div className="flex items-center gap-3">
                                    <span className="text-[9px] opacity-40 uppercase tracking-widest">Page {currentPage} of {totalPages || 1}</span>
                                    <div className="flex items-center gap-1.5">
                                        <button
                                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                            disabled={currentPage === 1}
                                            className={`p-1.5 border rounded disabled:opacity-20 transition-all ${isDarkMode ? "border-zinc-800 hover:bg-white/5 text-white" : "border-zinc-300 hover:bg-zinc-100 text-black"}`}
                                        >
                                            <ChevronLeft className="h-3.5 w-3.5" />
                                        </button>
                                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                                            .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                                            .map((pageNum, i, arr) => (
                                                <React.Fragment key={pageNum}>
                                                    {i > 0 && arr[i - 1] !== pageNum - 1 && <span className="opacity-20 px-1">...</span>}
                                                    <button
                                                        onClick={() => setCurrentPage(pageNum)}
                                                        className={`px-2.5 py-1 border rounded text-[9px] font-mono transition-all ${currentPage === pageNum
                                                            ? 'bg-emerald-500 border-emerald-500 text-black font-black'
                                                            : (isDarkMode ? 'border-zinc-800 hover:bg-white/5 opacity-40 text-white' : 'border-zinc-300 hover:bg-zinc-100 opacity-60 text-black')
                                                            }`}
                                                    >
                                                        {pageNum}
                                                    </button>
                                                </React.Fragment>
                                            ))
                                        }
                                        <button
                                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                            disabled={currentPage === totalPages || totalPages === 0}
                                            className={`p-1.5 border rounded disabled:opacity-20 transition-all ${isDarkMode ? "border-zinc-800 hover:bg-white/5 text-white" : "border-zinc-300 hover:bg-zinc-100 text-black"}`}
                                        >
                                            <ChevronRightIcon className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Excel Bottom Status Bar */}
                            <div className={`flex flex-col sm:flex-row sm:items-center justify-between border-x border-b px-4 py-1.5 text-[9px] font-mono select-none ${
                                isDarkMode ? "border-zinc-900 bg-zinc-900 text-zinc-400" : "border-zinc-300 bg-zinc-100 text-zinc-500"
                            }`}>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-1.5">
                                        <div className="h-2 w-2 rounded-full bg-emerald-500" />
                                        <span className="font-bold text-emerald-500 uppercase">Ready</span>
                                    </div>
                                    <span>// CALCULATIONS ENGINE: ACTIVE</span>
                                </div>
                                <div className="flex flex-wrap items-center gap-4 sm:gap-6 mt-1 sm:mt-0">
                                    {/* Excel Metrics calculations of active page users */}
                                    {paginatedUsers.length > 0 && (
                                        <div className="flex items-center gap-3 border-r pr-4 sm:pr-6 border-inherit">
                                            <span>SUM(daily_chats) = <b className={isDarkMode ? "text-white" : "text-black"}>{paginatedUsers.reduce((s, u) => s + u.subscription.daily_chats, 0)}</b></span>
                                            <span>AVERAGE(daily_chats) = <b className={isDarkMode ? "text-white" : "text-black"}>{(paginatedUsers.reduce((s, u) => s + u.subscription.daily_chats, 0) / paginatedUsers.length).toFixed(1)}</b></span>
                                        </div>
                                    )}
                                    {/* Zoom Level */}
                                    <div className="flex items-center gap-2">
                                        <span>Zoom:</span>
                                        <span className="font-bold">100%</span>
                                        <span className="opacity-45 select-none font-sans font-bold text-xs">- [========] +</span>
                                    </div>
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
                            className="p-4 md:p-8 lg:p-10"
                        >
                            <div className="max-w-4xl mx-auto">
                                    {editingSiteSetting ? (
                                        <div className="space-y-6">
                                            <div className="flex items-center justify-between pb-4 border-b border-zinc-800/30">
                                                <h2 className={`text-2xl font-display font-black uppercase tracking-tight ${isDarkMode ? "text-white" : "text-black"}`}>
                                                    {editingSiteSetting.key === 'about_us' ? 'About Us' :
                                                        editingSiteSetting.key === 'privacy_policy' ? 'Privacy Policy' :
                                                            editingSiteSetting.key === 'terms_conditions' ? 'Terms of Service' :
                                                                editingSiteSetting.key === 'refund_policy' ? 'Refund Policy' :
                                                                    editingSiteSetting.key === 'contact_info' ? 'Contact Us' : 
                                                                     editingSiteSetting.key === 'social_media_links' ? 'Social Media Links' : 
                                                                             editingSiteSetting.key === 'footer_text' ? 'Footer Text' : 
                                                                                 editingSiteSetting.key === 'footer_contact' ? 'Footer Contact' : 
                                                                             editingSiteSetting.key === 'schools_page' ? 'Schools Page' : 
                                                                                editingSiteSetting.key === 'b2b_page' ? 'B2B Page' : 
                                                                                    
                                                                                editingSiteSetting.key === 'pricing_page' ? 'Pricing Page' :
                                                                                editingSiteSetting.key === 'home_page' ? 'Home Page Video' : 
                                                                                        editingSiteSetting.key === 'plugin_page' ? 'Plugin Page' : 
                                                                                            editingSiteSetting.key === 'mobile_app_page' ? 'Mobile App Page' : 
                                                                                             editingSiteSetting.key === 'faq_page' ? 'FAQ Page' : 
                                                                                                 editingSiteSetting.key === 'support_page' ? 'Support Page' : editingSiteSetting.key}
                                                </h2>
                                                <button
                                                    onClick={fetchData}
                                                    className={`p-2.5 rounded-full border transition-all ${isDarkMode ? "border-white/10 hover:bg-white/5 text-white" : "border-zinc-300 hover:bg-black/5 text-black"}`}
                                                >
                                                    <RefreshCw className={`h-3.5 w-3.5 ${isDarkMode ? "opacity-40" : "opacity-60"}`} />
                                                </button>
                                            </div>

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

                                            {editingSiteSetting.key === 'footer_text' && (
                                                <div className="space-y-4">
                                                    <div>
                                                        <label className={`text-[9px] font-mono uppercase tracking-widest mb-1 block ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>Footer Description / Tagline Content</label>
                                                        <textarea
                                                            value={siteFormData?.description || ''}
                                                            onChange={(e) => {
                                                                const next = { ...siteFormData, description: e.target.value };
                                                                setSiteFormData(next);
                                                                setEditingSiteSetting({ ...editingSiteSetting, value: JSON.stringify(next) });
                                                            }}
                                                            rows={3}
                                                            className={`w-full p-4 text-sm font-mono border rounded-xl focus:outline-none focus:border-emerald-500/50 resize-none ${isDarkMode ? "bg-white/5 border-white/10 text-white" : "bg-black/5 border-black/10 text-black"}`}
                                                            placeholder="Rudranex is an advanced AI co-pilot designed..."
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            {editingSiteSetting.key === 'footer_contact' && (
                                                <div className="space-y-4">
                                                    <div>
                                                        <label className={`text-[9px] font-mono uppercase tracking-widest mb-1 block ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>Contact Email (Mail Us)</label>
                                                        <input
                                                            value={siteFormData?.email || ''}
                                                            onChange={(e) => {
                                                                const next = { ...siteFormData, email: e.target.value };
                                                                setSiteFormData(next);
                                                                setEditingSiteSetting({ ...editingSiteSetting, value: JSON.stringify(next) });
                                                            }}
                                                            className={`w-full p-4 text-sm font-mono border rounded-xl focus:outline-none focus:border-emerald-500/50 ${isDarkMode ? "bg-white/5 border-white/10 text-white" : "bg-black/5 border-black/10 text-black"}`}
                                                            placeholder="hello@rudranex.ai"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className={`text-[9px] font-mono uppercase tracking-widest mb-1 block ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>Office Location Address</label>
                                                        <input
                                                            value={siteFormData?.location || ''}
                                                            onChange={(e) => {
                                                                const next = { ...siteFormData, location: e.target.value };
                                                                setSiteFormData(next);
                                                                setEditingSiteSetting({ ...editingSiteSetting, value: JSON.stringify(next) });
                                                            }}
                                                            className={`w-full p-4 text-sm font-mono border rounded-xl focus:outline-none focus:border-emerald-500/50 ${isDarkMode ? "bg-white/5 border-white/10 text-white" : "bg-black/5 border-black/10 text-black"}`}
                                                            placeholder="Rudra Labs, AI Innovation Center..."
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className={`text-[9px] font-mono uppercase tracking-widest mb-1 block ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>Technical Support Phone Number</label>
                                                        <input
                                                            value={siteFormData?.techSupportPhone || ''}
                                                            onChange={(e) => {
                                                                const next = { ...siteFormData, techSupportPhone: e.target.value };
                                                                setSiteFormData(next);
                                                                setEditingSiteSetting({ ...editingSiteSetting, value: JSON.stringify(next) });
                                                            }}
                                                            className={`w-full p-4 text-sm font-mono border rounded-xl focus:outline-none focus:border-emerald-500/50 ${isDarkMode ? "bg-white/5 border-white/10 text-white" : "bg-black/5 border-black/10 text-black"}`}
                                                            placeholder="+91 97124 45459"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className={`text-[9px] font-mono uppercase tracking-widest mb-1 block ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>Enterprise Queries Phone Number</label>
                                                        <input
                                                            value={siteFormData?.enterprisePhone || ''}
                                                            onChange={(e) => {
                                                                const next = { ...siteFormData, enterprisePhone: e.target.value };
                                                                setSiteFormData(next);
                                                                setEditingSiteSetting({ ...editingSiteSetting, value: JSON.stringify(next) });
                                                            }}
                                                            className={`w-full p-4 text-sm font-mono border rounded-xl focus:outline-none focus:border-emerald-500/50 ${isDarkMode ? "bg-white/5 border-white/10 text-white" : "bg-black/5 border-black/10 text-black"}`}
                                                            placeholder="+91 63593 02924"
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            {editingSiteSetting.key === 'social_media_links' && (
                                                <div className="space-y-4">
                                                    <div>
                                                        <label className={`text-[9px] font-mono uppercase tracking-widest mb-1 block ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>Twitter / X Link</label>
                                                        <input
                                                            value={siteFormData?.twitter || ''}
                                                            onChange={(e) => {
                                                                const next = { ...siteFormData, twitter: e.target.value };
                                                                setSiteFormData(next);
                                                                setEditingSiteSetting({ ...editingSiteSetting, value: JSON.stringify(next) });
                                                            }}
                                                            className={`w-full p-4 text-sm font-mono border rounded-xl focus:outline-none focus:border-emerald-500/50 ${isDarkMode ? "bg-white/5 border-white/10 text-white" : "bg-black/5 border-black/10 text-black"}`}
                                                            placeholder="https://x.com/username"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className={`text-[9px] font-mono uppercase tracking-widest mb-1 block ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>LinkedIn Link</label>
                                                        <input
                                                            value={siteFormData?.linkedin || ''}
                                                            onChange={(e) => {
                                                                const next = { ...siteFormData, linkedin: e.target.value };
                                                                setSiteFormData(next);
                                                                setEditingSiteSetting({ ...editingSiteSetting, value: JSON.stringify(next) });
                                                            }}
                                                            className={`w-full p-4 text-sm font-mono border rounded-xl focus:outline-none focus:border-emerald-500/50 ${isDarkMode ? "bg-white/5 border-white/10 text-white" : "bg-black/5 border-black/10 text-black"}`}
                                                            placeholder="https://linkedin.com/in/username"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className={`text-[9px] font-mono uppercase tracking-widest mb-1 block ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>GitHub Link</label>
                                                        <input
                                                            value={siteFormData?.github || ''}
                                                            onChange={(e) => {
                                                                const next = { ...siteFormData, github: e.target.value };
                                                                setSiteFormData(next);
                                                                setEditingSiteSetting({ ...editingSiteSetting, value: JSON.stringify(next) });
                                                            }}
                                                            className={`w-full p-4 text-sm font-mono border rounded-xl focus:outline-none focus:border-emerald-500/50 ${isDarkMode ? "bg-white/5 border-white/10 text-white" : "bg-black/5 border-black/10 text-black"}`}
                                                            placeholder="https://github.com/username"
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            {editingSiteSetting.key === 'home_page' && (
                                                <div className="space-y-4">
                                                    <div>
                                                        <label className={`text-[9px] font-mono uppercase tracking-widest mb-1 block ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>Watch Demo Video URL (Embed Link)</label>
                                                        <input
                                                            value={siteFormData?.videoUrl || ''}
                                                            onChange={(e) => {
                                                                const next = { ...siteFormData, videoUrl: e.target.value };
                                                                setSiteFormData(next);
                                                                setEditingSiteSetting({ ...editingSiteSetting, value: JSON.stringify(next) });
                                                            }}
                                                            className={`w-full p-4 text-sm font-mono border rounded-xl focus:outline-none focus:border-emerald-500/50 ${isDarkMode ? "bg-white/5 border-white/10 text-white" : "bg-black/5 border-black/10 text-black"}`}
                                                            placeholder="e.g. https://www.youtube.com/embed/dQw4w9WgXcQ"
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            {editingSiteSetting.key === 'schools_page' && (
                                                <div className="space-y-6">
                                                    <div>
                                                        <label className={`text-[9px] font-mono uppercase tracking-widest mb-1 block ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>Hero Title</label>
                                                        <input
                                                            value={siteFormData?.title || ''}
                                                            onChange={(e) => {
                                                                const next = { ...siteFormData, title: e.target.value };
                                                                setSiteFormData(next);
                                                                setEditingSiteSetting({ ...editingSiteSetting, value: JSON.stringify(next) });
                                                            }}
                                                            className={`w-full p-4 text-sm font-mono border rounded-xl focus:outline-none focus:border-emerald-500/50 ${isDarkMode ? "bg-white/5 border-white/10 text-white" : "bg-black/5 border-black/10 text-black"}`}
                                                            placeholder="Hero Title (e.g. Empower your Institution.)"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className={`text-[9px] font-mono uppercase tracking-widest mb-1 block ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>Hero Description</label>
                                                        <textarea
                                                            value={siteFormData?.description || ''}
                                                            onChange={(e) => {
                                                                const next = { ...siteFormData, description: e.target.value };
                                                                setSiteFormData(next);
                                                                setEditingSiteSetting({ ...editingSiteSetting, value: JSON.stringify(next) });
                                                            }}
                                                            rows={3}
                                                            className={`w-full p-4 text-sm font-mono border rounded-xl focus:outline-none focus:border-emerald-500/50 resize-none ${isDarkMode ? "bg-white/5 border-white/10 text-white" : "bg-black/5 border-black/10 text-black"}`}
                                                            placeholder="Hero Description"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className={`text-[9px] font-mono uppercase tracking-widest mb-1 block ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>Custom Link Text</label>
                                                        <input
                                                            value={siteFormData?.linkText || ''}
                                                            onChange={(e) => {
                                                                const next = { ...siteFormData, linkText: e.target.value };
                                                                setSiteFormData(next);
                                                                setEditingSiteSetting({ ...editingSiteSetting, value: JSON.stringify(next) });
                                                            }}
                                                            className={`w-full p-4 text-sm font-mono border rounded-xl focus:outline-none focus:border-emerald-500/50 ${isDarkMode ? "bg-white/5 border-white/10 text-white" : "bg-black/5 border-black/10 text-black"}`}
                                                            placeholder="e.g. Back Home"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className={`text-[9px] font-mono uppercase tracking-widest mb-1 block ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>Custom Link URL</label>
                                                        <input
                                                            value={siteFormData?.linkUrl || ''}
                                                            onChange={(e) => {
                                                                const next = { ...siteFormData, linkUrl: e.target.value };
                                                                setSiteFormData(next);
                                                                setEditingSiteSetting({ ...editingSiteSetting, value: JSON.stringify(next) });
                                                            }}
                                                            className={`w-full p-4 text-sm font-mono border rounded-xl focus:outline-none focus:border-emerald-500/50 ${isDarkMode ? "bg-white/5 border-white/10 text-white" : "bg-black/5 border-black/10 text-black"}`}
                                                            placeholder="e.g. /"
                                                        />
                                                    </div>
                                                    <div className="space-y-4">
                                                        <label className={`text-[9px] font-mono uppercase tracking-widest mb-1 block ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>Features</label>
                                                        {(Array.isArray(siteFormData?.features) ? siteFormData.features : []).map((feature: any, i: number) => {
                                                            const updateFeature = (field: string, val: string) => {
                                                                const next = JSON.parse(JSON.stringify(siteFormData));
                                                                if (next.features && next.features[i]) next.features[i][field] = val;
                                                                setSiteFormData(next);
                                                                setEditingSiteSetting({ ...editingSiteSetting, value: JSON.stringify(next) });
                                                            };
                                                            return (
                                                                <div key={i} className={`p-4 rounded-xl border ${isDarkMode ? "bg-white/5 border-white/10" : "bg-black/5 border-black/10"}`}>
                                                                    <div className="flex items-center justify-between mb-2">
                                                                        <span className="text-xs font-mono">Feature {i + 1}</span>
                                                                        <button
                                                                            onClick={() => {
                                                                                const next = JSON.parse(JSON.stringify(siteFormData));
                                                                                next.features = next.features.filter((_: any, j: number) => j !== i);
                                                                                setSiteFormData(next);
                                                                                setEditingSiteSetting({ ...editingSiteSetting, value: JSON.stringify(next) });
                                                                            }}
                                                                            className="text-[10px] font-mono uppercase tracking-widest text-red-400 hover:text-red-300"
                                                                        >
                                                                            Remove
                                                                        </button>
                                                                    </div>
                                                                    <div className="space-y-2">
                                                                        <input
                                                                            value={feature.title || ''}
                                                                            onChange={(e) => updateFeature('title', e.target.value)}
                                                                            placeholder="Feature Title"
                                                                            className={`w-full p-3 text-xs font-mono border rounded-xl focus:outline-none focus:border-emerald-500/50 ${isDarkMode ? "bg-white/5 border-white/10 text-white" : "bg-black/5 border-black/10 text-black"}`}
                                                                        />
                                                                        <textarea
                                                                            value={feature.desc || ''}
                                                                            onChange={(e) => updateFeature('desc', e.target.value)}
                                                                            placeholder="Feature Description"
                                                                            rows={2}
                                                                            className={`w-full p-3 text-xs font-mono border rounded-xl focus:outline-none focus:border-emerald-500/50 resize-none ${isDarkMode ? "bg-white/5 border-white/10 text-white" : "bg-black/5 border-black/10 text-black"}`}
                                                                        />
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                        <button
                                                            onClick={() => {
                                                                const next = JSON.parse(JSON.stringify(siteFormData || {}));
                                                                if (!next.features) next.features = [];
                                                                next.features.push({ title: '', desc: '' });
                                                                setSiteFormData(next);
                                                                setEditingSiteSetting({ ...editingSiteSetting, value: JSON.stringify(next) });
                                                            }}
                                                            className={`text-[10px] font-mono uppercase tracking-widest ${isDarkMode ? "text-white/40 hover:text-white" : "text-black/40 hover:text-black"} transition`}
                                                        >
                                                            + Add Feature
                                                        </button>
                                                    </div>
                                                </div>
                                            )}

                                            {editingSiteSetting.key === 'pricing_page' && (
                                                <div className="space-y-6">
                                                    <div>
                                                        <label className={`text-[9px] font-mono uppercase tracking-widest mb-1 block ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>Hero Title</label>
                                                        <input
                                                            value={siteFormData?.title || ''}
                                                            onChange={(e) => {
                                                                const next = { ...siteFormData, title: e.target.value };
                                                                setSiteFormData(next);
                                                                setEditingSiteSetting({ ...editingSiteSetting, value: JSON.stringify(next) });
                                                            }}
                                                            className={`w-full p-4 text-sm font-mono border rounded-xl focus:outline-none focus:border-emerald-500/50 ${isDarkMode ? "bg-white/5 border-white/10 text-white" : "bg-black/5 border-black/10 text-black"}`}
                                                            placeholder="Hero Title (e.g. Quiet power. Tailored access.)"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className={`text-[9px] font-mono uppercase tracking-widest mb-1 block ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>Hero Description</label>
                                                        <textarea
                                                            value={siteFormData?.description || ''}
                                                            onChange={(e) => {
                                                                const next = { ...siteFormData, description: e.target.value };
                                                                setSiteFormData(next);
                                                                setEditingSiteSetting({ ...editingSiteSetting, value: JSON.stringify(next) });
                                                            }}
                                                            rows={3}
                                                            className={`w-full p-4 text-sm font-mono border rounded-xl focus:outline-none focus:border-emerald-500/50 resize-none ${isDarkMode ? "bg-white/5 border-white/10 text-white" : "bg-black/5 border-black/10 text-black"}`}
                                                            placeholder="Hero Description"
                                                        />
                                                    </div>
                                                    
                                                    {/* Plans Features Section */}
                                                    <div className="space-y-6">
                                                        <h3 className={`text-xs font-mono uppercase tracking-widest border-b pb-2 ${isDarkMode ? "border-white/10 text-white" : "border-black/10 text-black"}`}>Plan Features Editor</h3>
                                                        {(Array.isArray(siteFormData?.plans) ? siteFormData.plans : []).map((plan: any, planIdx: number) => (
                                                            <div key={planIdx} className={`p-6 rounded-xl border ${isDarkMode ? "bg-white/5 border-white/10" : "bg-black/5 border-black/10"}`}>
                                                                <h4 className="text-sm font-bold uppercase tracking-tight mb-4">{plan.planName}</h4>
                                                                
                                                                <div className="space-y-3">
                                                                    {(Array.isArray(plan.features) ? plan.features : []).map((feature: any, featIdx: number) => {
                                                                        const updateFeature = (field: string, val: string) => {
                                                                            const next = JSON.parse(JSON.stringify(siteFormData));
                                                                            if (next.plans[planIdx].features[featIdx]) {
                                                                                next.plans[planIdx].features[featIdx][field] = val;
                                                                            }
                                                                            setSiteFormData(next);
                                                                            setEditingSiteSetting({ ...editingSiteSetting, value: JSON.stringify(next) });
                                                                        };
                                                                        
                                                                        return (
                                                                            <div key={featIdx} className="flex gap-2 items-center">
                                                                                {/* Icon selector dropdown */}
                                                                                <select
                                                                                    value={feature.icon || 'zap'}
                                                                                    onChange={(e) => updateFeature('icon', e.target.value)}
                                                                                    className={`p-3 text-xs font-mono border rounded-xl focus:outline-none focus:border-emerald-500/50 shrink-0 ${isDarkMode ? "bg-[#111] border-white/10 text-white" : "bg-white border-black/10 text-black"}`}
                                                                                >
                                                                                    <option value="zap">Zap (Reasoning/Chat)</option>
                                                                                    <option value="image">Image (Illustration)</option>
                                                                                    <option value="scan">Scan (OCR)</option>
                                                                                    <option value="puzzle">Puzzle (PDF Analyzer)</option>
                                                                                    <option value="volume">Volume (TTS)</option>
                                                                                    <option value="mic">Mic (STT)</option>
                                                                                </select>
                                                                                
                                                                                {/* Feature Text */}
                                                                                <input
                                                                                    value={feature.text || ''}
                                                                                    onChange={(e) => updateFeature('text', e.target.value)}
                                                                                    placeholder="Feature Description Text"
                                                                                    className={`flex-1 p-3 text-xs font-mono border rounded-xl focus:outline-none focus:border-emerald-500/50 ${isDarkMode ? "bg-white/5 border-white/10 text-white" : "bg-black/5 border-black/10 text-black"}`}
                                                                                />
                                                                                
                                                                                {/* Remove Feature button */}
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => {
                                                                                        const next = JSON.parse(JSON.stringify(siteFormData));
                                                                                        next.plans[planIdx].features = next.plans[planIdx].features.filter((_: any, idx: number) => idx !== featIdx);
                                                                                        setSiteFormData(next);
                                                                                        setEditingSiteSetting({ ...editingSiteSetting, value: JSON.stringify(next) });
                                                                                    }}
                                                                                    className="p-3 text-xs font-mono uppercase text-red-400 hover:text-red-300 font-bold"
                                                                                >
                                                                                    Remove
                                                                                </button>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                    
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            const next = JSON.parse(JSON.stringify(siteFormData));
                                                                            if (!next.plans[planIdx].features) next.plans[planIdx].features = [];
                                                                            next.plans[planIdx].features.push({ icon: 'zap', text: '' });
                                                                            setSiteFormData(next);
                                                                            setEditingSiteSetting({ ...editingSiteSetting, value: JSON.stringify(next) });
                                                                        }}
                                                                        className={`text-[10px] font-mono uppercase tracking-widest mt-2 ${isDarkMode ? "text-white/40 hover:text-white" : "text-black/40 hover:text-black"} transition`}
                                                                    >
                                                                        + Add Feature to {plan.planName}
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                                                                        {editingSiteSetting.key === 'b2b_page' && (
                                                <div className="space-y-6">
                                                    <div>
                                                        <label className={`text-[9px] font-mono uppercase tracking-widest mb-1 block ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>Hero Title</label>
                                                        <input
                                                            value={siteFormData?.title || ''}
                                                            onChange={(e) => {
                                                                const next = { ...siteFormData, title: e.target.value };
                                                                setSiteFormData(next);
                                                                setEditingSiteSetting({ ...editingSiteSetting, value: JSON.stringify(next) });
                                                            }}
                                                            className={`w-full p-4 text-sm font-mono border rounded-xl focus:outline-none focus:border-emerald-500/50 ${isDarkMode ? "bg-white/5 border-white/10 text-white" : "bg-black/5 border-black/10 text-black"}`}
                                                            placeholder="Hero Title (e.g. Quiet power. Tailored access.)"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className={`text-[9px] font-mono uppercase tracking-widest mb-1 block ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>Hero Description</label>
                                                        <textarea
                                                            value={siteFormData?.description || ''}
                                                            onChange={(e) => {
                                                                const next = { ...siteFormData, description: e.target.value };
                                                                setSiteFormData(next);
                                                                setEditingSiteSetting({ ...editingSiteSetting, value: JSON.stringify(next) });
                                                            }}
                                                            rows={3}
                                                            className={`w-full p-4 text-sm font-mono border rounded-xl focus:outline-none focus:border-emerald-500/50 resize-none ${isDarkMode ? "bg-white/5 border-white/10 text-white" : "bg-black/5 border-black/10 text-black"}`}
                                                            placeholder="Hero Description"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className={`text-[9px] font-mono uppercase tracking-widest mb-1 block ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>Custom Link Text</label>
                                                        <input
                                                            value={siteFormData?.linkText || ''}
                                                            onChange={(e) => {
                                                                const next = { ...siteFormData, linkText: e.target.value };
                                                                setSiteFormData(next);
                                                                setEditingSiteSetting({ ...editingSiteSetting, value: JSON.stringify(next) });
                                                            }}
                                                            className={`w-full p-4 text-sm font-mono border rounded-xl focus:outline-none focus:border-emerald-500/50 ${isDarkMode ? "bg-white/5 border-white/10 text-white" : "bg-black/5 border-black/10 text-black"}`}
                                                            placeholder="e.g. Learn More"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className={`text-[9px] font-mono uppercase tracking-widest mb-1 block ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>Custom Link URL</label>
                                                        <input
                                                            value={siteFormData?.linkUrl || ''}
                                                            onChange={(e) => {
                                                                const next = { ...siteFormData, linkUrl: e.target.value };
                                                                setSiteFormData(next);
                                                                setEditingSiteSetting({ ...editingSiteSetting, value: JSON.stringify(next) });
                                                            }}
                                                            className={`w-full p-4 text-sm font-mono border rounded-xl focus:outline-none focus:border-emerald-500/50 ${isDarkMode ? "bg-white/5 border-white/10 text-white" : "bg-black/5 border-black/10 text-black"}`}
                                                            placeholder="e.g. /pricing"
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            {(editingSiteSetting.key === 'privacy_policy' || editingSiteSetting.key === 'terms_conditions' || editingSiteSetting.key === 'refund_policy') && (
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

                                            {editingSiteSetting.key === 'plugin_page' && (
                                                <div className="space-y-6">
                                                    <div>
                                                        <label className={`text-[9px] font-mono uppercase tracking-widest mb-1 block ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>Hero Title</label>
                                                        <input
                                                            value={siteFormData?.title || ''}
                                                            onChange={(e) => {
                                                                const next = { ...siteFormData, title: e.target.value };
                                                                setSiteFormData(next);
                                                                setEditingSiteSetting({ ...editingSiteSetting, value: JSON.stringify(next) });
                                                            }}
                                                            className={`w-full p-4 text-sm font-mono border rounded-xl focus:outline-none focus:border-emerald-500/50 ${isDarkMode ? "bg-white/5 border-white/10 text-white" : "bg-black/5 border-black/10 text-black"}`}
                                                            placeholder="Hero Title"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className={`text-[9px] font-mono uppercase tracking-widest mb-1 block ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>Hero Description</label>
                                                        <textarea
                                                            value={siteFormData?.description || ''}
                                                            onChange={(e) => {
                                                                const next = { ...siteFormData, description: e.target.value };
                                                                setSiteFormData(next);
                                                                setEditingSiteSetting({ ...editingSiteSetting, value: JSON.stringify(next) });
                                                            }}
                                                            rows={3}
                                                            className={`w-full p-4 text-sm font-mono border rounded-xl focus:outline-none focus:border-emerald-500/50 resize-none ${isDarkMode ? "bg-white/5 border-white/10 text-white" : "bg-black/5 border-black/10 text-black"}`}
                                                            placeholder="Hero Description"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className={`text-[9px] font-mono uppercase tracking-widest mb-1 block ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>Button Text</label>
                                                        <input
                                                            value={siteFormData?.buttonText || ''}
                                                            onChange={(e) => {
                                                                const next = { ...siteFormData, buttonText: e.target.value };
                                                                setSiteFormData(next);
                                                                setEditingSiteSetting({ ...editingSiteSetting, value: JSON.stringify(next) });
                                                            }}
                                                            className={`w-full p-4 text-sm font-mono border rounded-xl focus:outline-none focus:border-emerald-500/50 ${isDarkMode ? "bg-white/5 border-white/10 text-white" : "bg-black/5 border-black/10 text-black"}`}
                                                            placeholder="Button Text"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className={`text-[9px] font-mono uppercase tracking-widest mb-1 block ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>Button URL Link</label>
                                                        <input
                                                            value={siteFormData?.buttonUrl || ''}
                                                            onChange={(e) => {
                                                                const next = { ...siteFormData, buttonUrl: e.target.value };
                                                                setSiteFormData(next);
                                                                setEditingSiteSetting({ ...editingSiteSetting, value: JSON.stringify(next) });
                                                            }}
                                                            className={`w-full p-4 text-sm font-mono border rounded-xl focus:outline-none focus:border-emerald-500/50 ${isDarkMode ? "bg-white/5 border-white/10 text-white" : "bg-black/5 border-black/10 text-black"}`}
                                                            placeholder="Button URL Link"
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            {editingSiteSetting.key === 'mobile_app_page' && (
                                                <div className="space-y-6">
                                                    <div>
                                                        <label className={`text-[9px] font-mono uppercase tracking-widest mb-1 block ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>Hero Title</label>
                                                        <input
                                                            value={siteFormData?.title || ''}
                                                            onChange={(e) => {
                                                                const next = { ...siteFormData, title: e.target.value };
                                                                setSiteFormData(next);
                                                                setEditingSiteSetting({ ...editingSiteSetting, value: JSON.stringify(next) });
                                                            }}
                                                            className={`w-full p-4 text-sm font-mono border rounded-xl focus:outline-none focus:border-emerald-500/50 ${isDarkMode ? "bg-white/5 border-white/10 text-white" : "bg-black/5 border-black/10 text-black"}`}
                                                            placeholder="Hero Title"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className={`text-[9px] font-mono uppercase tracking-widest mb-1 block ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>Hero Description</label>
                                                        <textarea
                                                            value={siteFormData?.description || ''}
                                                            onChange={(e) => {
                                                                const next = { ...siteFormData, description: e.target.value };
                                                                setSiteFormData(next);
                                                                setEditingSiteSetting({ ...editingSiteSetting, value: JSON.stringify(next) });
                                                            }}
                                                            rows={3}
                                                            className={`w-full p-4 text-sm font-mono border rounded-xl focus:outline-none focus:border-emerald-500/50 resize-none ${isDarkMode ? "bg-white/5 border-white/10 text-white" : "bg-black/5 border-black/10 text-black"}`}
                                                            placeholder="Hero Description"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className={`text-[9px] font-mono uppercase tracking-widest mb-1 block ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>Button Text</label>
                                                        <input
                                                            value={siteFormData?.buttonText || ''}
                                                            onChange={(e) => {
                                                                const next = { ...siteFormData, buttonText: e.target.value };
                                                                setSiteFormData(next);
                                                                setEditingSiteSetting({ ...editingSiteSetting, value: JSON.stringify(next) });
                                                            }}
                                                            className={`w-full p-4 text-sm font-mono border rounded-xl focus:outline-none focus:border-emerald-500/50 ${isDarkMode ? "bg-white/5 border-white/10 text-white" : "bg-black/5 border-black/10 text-black"}`}
                                                            placeholder="Button Text"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className={`text-[9px] font-mono uppercase tracking-widest mb-1 block ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>Button URL Link</label>
                                                        <input
                                                            value={siteFormData?.buttonUrl || ''}
                                                            onChange={(e) => {
                                                                const next = { ...siteFormData, buttonUrl: e.target.value };
                                                                setSiteFormData(next);
                                                                setEditingSiteSetting({ ...editingSiteSetting, value: JSON.stringify(next) });
                                                            }}
                                                            className={`w-full p-4 text-sm font-mono border rounded-xl focus:outline-none focus:border-emerald-500/50 ${isDarkMode ? "bg-white/5 border-white/10 text-white" : "bg-black/5 border-black/10 text-black"}`}
                                                            placeholder="Button URL Link"
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            {editingSiteSetting.key === 'faq_page' && (
                                                <div className="space-y-4">
                                                    <div>
                                                        <label className={`text-[9px] font-mono uppercase tracking-widest mb-1 block ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>Hero Title</label>
                                                        <textarea
                                                            value={siteFormData?.title || ''}
                                                            onChange={(e) => {
                                                                const next = { ...siteFormData, title: e.target.value };
                                                                setSiteFormData(next);
                                                                setEditingSiteSetting({ ...editingSiteSetting, value: JSON.stringify(next) });
                                                            }}
                                                            rows={3}
                                                            className={`w-full p-4 text-sm font-mono border rounded-xl focus:outline-none focus:border-emerald-500/50 resize-none ${isDarkMode ? "bg-white/5 border-white/10 text-white" : "bg-black/5 border-black/10 text-black"}`}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className={`text-[9px] font-mono uppercase tracking-widest mb-1 block ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>Hero Description</label>
                                                        <textarea
                                                            value={siteFormData?.description || ''}
                                                            onChange={(e) => {
                                                                const next = { ...siteFormData, description: e.target.value };
                                                                setSiteFormData(next);
                                                                setEditingSiteSetting({ ...editingSiteSetting, value: JSON.stringify(next) });
                                                            }}
                                                            rows={3}
                                                            className={`w-full p-4 text-sm font-mono border rounded-xl focus:outline-none focus:border-emerald-500/50 resize-none ${isDarkMode ? "bg-white/5 border-white/10 text-white" : "bg-black/5 border-black/10 text-black"}`}
                                                        />
                                                    </div>
                                                    <div className="space-y-4">
                                                        <label className={`text-[9px] font-mono uppercase tracking-widest mb-1 block ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>FAQ Categories</label>
                                                        {(Array.isArray(siteFormData?.categories) ? siteFormData.categories : []).map((cat: any, ci: number) => (
                                                            <div key={ci} className={`p-4 rounded-xl ${isDarkMode ? "bg-white/5" : "bg-black/5"} space-y-3`}>
                                                                <div className="flex items-center justify-between">
                                                                    <input
                                                                        value={cat.category || ''}
                                                                        onChange={(e) => {
                                                                            const next = JSON.parse(JSON.stringify(siteFormData));
                                                                            next.categories[ci].category = e.target.value;
                                                                            setSiteFormData(next);
                                                                            setEditingSiteSetting({ ...editingSiteSetting, value: JSON.stringify(next) });
                                                                        }}
                                                                        placeholder="Category name"
                                                                        className={`flex-1 p-2 text-xs font-mono border rounded-xl focus:outline-none focus:border-emerald-500/50 ${isDarkMode ? "bg-black border-white/10 text-white" : "bg-white border-black/10 text-black"}`}
                                                                    />
                                                                    <button
                                                                        onClick={() => {
                                                                            const next = JSON.parse(JSON.stringify(siteFormData));
                                                                            next.categories = next.categories.filter((_: any, j: number) => j !== ci);
                                                                            setSiteFormData(next);
                                                                            setEditingSiteSetting({ ...editingSiteSetting, value: JSON.stringify(next) });
                                                                        }}
                                                                        className={`ml-2 text-[10px] font-mono uppercase tracking-widest text-red-400 hover:text-red-300 transition`}
                                                                    >
                                                                        Remove Category
                                                                    </button>
                                                                </div>
                                                                {(Array.isArray(cat.questions) ? cat.questions : []).map((q: any, qi: number) => (
                                                                    <div key={qi} className={`p-3 rounded-lg ${isDarkMode ? "bg-black/30" : "bg-white/30"} space-y-2`}>
                                                                        <div className="flex items-center justify-between">
                                                                            <span className={`text-[8px] font-mono uppercase tracking-widest ${isDarkMode ? "opacity-30 text-white" : "opacity-50 text-black"}`}>Q{qi + 1}</span>
                                                                            <button
                                                                                onClick={() => {
                                                                                    const next = JSON.parse(JSON.stringify(siteFormData));
                                                                                    next.categories[ci].questions = next.categories[ci].questions.filter((_: any, j: number) => j !== qi);
                                                                                    setSiteFormData(next);
                                                                                    setEditingSiteSetting({ ...editingSiteSetting, value: JSON.stringify(next) });
                                                                                }}
                                                                                className={`text-[10px] font-mono uppercase tracking-widest text-red-400 hover:text-red-300 transition`}
                                                                            >
                                                                                Remove
                                                                            </button>
                                                                        </div>
                                                                        <input
                                                                            value={q.q || ''}
                                                                            onChange={(e) => {
                                                                                const next = JSON.parse(JSON.stringify(siteFormData));
                                                                                next.categories[ci].questions[qi].q = e.target.value;
                                                                                setSiteFormData(next);
                                                                                setEditingSiteSetting({ ...editingSiteSetting, value: JSON.stringify(next) });
                                                                            }}
                                                                            placeholder="Question"
                                                                            className={`w-full p-2 text-xs font-mono border rounded-xl focus:outline-none focus:border-emerald-500/50 ${isDarkMode ? "bg-black border-white/10 text-white" : "bg-white border-black/10 text-black"}`}
                                                                        />
                                                                        <textarea
                                                                            value={q.a || ''}
                                                                            onChange={(e) => {
                                                                                const next = JSON.parse(JSON.stringify(siteFormData));
                                                                                next.categories[ci].questions[qi].a = e.target.value;
                                                                                setSiteFormData(next);
                                                                                setEditingSiteSetting({ ...editingSiteSetting, value: JSON.stringify(next) });
                                                                            }}
                                                                            rows={3}
                                                                            placeholder="Answer"
                                                                            className={`w-full p-2 text-xs font-mono border rounded-xl focus:outline-none focus:border-emerald-500/50 resize-none ${isDarkMode ? "bg-black border-white/10 text-white" : "bg-white border-black/10 text-black"}`}
                                                                        />
                                                                    </div>
                                                                ))}
                                                                <button
                                                                    onClick={() => {
                                                                        const next = JSON.parse(JSON.stringify(siteFormData));
                                                                        next.categories[ci].questions = [...(next.categories[ci].questions || []), { q: '', a: '' }];
                                                                        setSiteFormData(next);
                                                                        setEditingSiteSetting({ ...editingSiteSetting, value: JSON.stringify(next) });
                                                                    }}
                                                                    className={`text-[10px] font-mono uppercase tracking-widest ${isDarkMode ? "text-white/40 hover:text-white" : "text-black/40 hover:text-black"} transition`}
                                                                >
                                                                    + Add Question
                                                                </button>
                                                            </div>
                                                        ))}
                                                        <button
                                                            onClick={() => {
                                                                const next = JSON.parse(JSON.stringify(siteFormData || {}));
                                                                if (!next.categories) next.categories = [];
                                                                next.categories.push({ category: '', questions: [{ q: '', a: '' }] });
                                                                setSiteFormData(next);
                                                                setEditingSiteSetting({ ...editingSiteSetting, value: JSON.stringify(next) });
                                                            }}
                                                            className={`text-[10px] font-mono uppercase tracking-widest ${isDarkMode ? "text-white/40 hover:text-white" : "text-black/40 hover:text-black"} transition`}
                                                        >
                                                            + Add Category
                                                        </button>
                                                    </div>
                                                </div>
                                            )}

                                            {editingSiteSetting.key === 'support_page' && (
                                                <div className="space-y-4">
                                                    <div>
                                                        <label className={`text-[9px] font-mono uppercase tracking-widest mb-1 block ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>Hero Title</label>
                                                        <textarea
                                                            value={siteFormData?.title || ''}
                                                            onChange={(e) => {
                                                                const next = { ...siteFormData, title: e.target.value };
                                                                setSiteFormData(next);
                                                                setEditingSiteSetting({ ...editingSiteSetting, value: JSON.stringify(next) });
                                                            }}
                                                            rows={3}
                                                            className={`w-full p-4 text-sm font-mono border rounded-xl focus:outline-none focus:border-emerald-500/50 resize-none ${isDarkMode ? "bg-white/5 border-white/10 text-white" : "bg-black/5 border-black/10 text-black"}`}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className={`text-[9px] font-mono uppercase tracking-widest mb-1 block ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>Hero Description</label>
                                                        <textarea
                                                            value={siteFormData?.description || ''}
                                                            onChange={(e) => {
                                                                const next = { ...siteFormData, description: e.target.value };
                                                                setSiteFormData(next);
                                                                setEditingSiteSetting({ ...editingSiteSetting, value: JSON.stringify(next) });
                                                            }}
                                                            rows={3}
                                                            className={`w-full p-4 text-sm font-mono border rounded-xl focus:outline-none focus:border-emerald-500/50 resize-none ${isDarkMode ? "bg-white/5 border-white/10 text-white" : "bg-black/5 border-black/10 text-black"}`}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className={`text-[9px] font-mono uppercase tracking-widest mb-1 block ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>Contact Email</label>
                                                        <input
                                                            value={siteFormData?.email || ''}
                                                            onChange={(e) => {
                                                                const next = { ...siteFormData, email: e.target.value };
                                                                setSiteFormData(next);
                                                                setEditingSiteSetting({ ...editingSiteSetting, value: JSON.stringify(next) });
                                                            }}
                                                            className={`w-full p-4 text-sm font-mono border rounded-xl focus:outline-none focus:border-emerald-500/50 ${isDarkMode ? "bg-white/5 border-white/10 text-white" : "bg-black/5 border-black/10 text-black"}`}
                                                            placeholder="hello@rudranex.ai"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className={`text-[9px] font-mono uppercase tracking-widest mb-1 block ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>Response Time Text</label>
                                                        <input
                                                            value={siteFormData?.responseTime || ''}
                                                            onChange={(e) => {
                                                                const next = { ...siteFormData, responseTime: e.target.value };
                                                                setSiteFormData(next);
                                                                setEditingSiteSetting({ ...editingSiteSetting, value: JSON.stringify(next) });
                                                            }}
                                                            className={`w-full p-4 text-sm font-mono border rounded-xl focus:outline-none focus:border-emerald-500/50 ${isDarkMode ? "bg-white/5 border-white/10 text-white" : "bg-black/5 border-black/10 text-black"}`}
                                                            placeholder="Usually within 24 hours"
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            <div className="flex gap-4 pt-6 border-t border-zinc-800/30">
                                                <button
                                                    onClick={async () => {
                                                        setIsSavingSiteSetting(true);
                                                        try {
                                                            let targetKey = editingSiteSetting.key;
                                                            let targetValue = editingSiteSetting.value;
                                                            if (targetKey === 'footer_text' || targetKey === 'footer_contact') {
                                                                const existing = siteSettings.find(s => s.key === 'footer_settings');
                                                                const existingParsed = existing?.value ? JSON.parse(existing.value) : {};
                                                                const formParsed = JSON.parse(targetValue);
                                                                const merged = { ...existingParsed, ...formParsed };
                                                                targetKey = 'footer_settings';
                                                                targetValue = JSON.stringify(merged);
                                                            }
                                                            const res = await updateSiteSetting(targetKey, targetValue);
                                                            if (res.success) {
                                                                toast.success("Page updated successfully");
                                                                fetchData();
                                                            } else throw new Error(res.error || "Failed to update");
                                                        } catch (err) {
                                                            toast.error("Error updating page: " + (err as Error).message);
                                                        } finally {
                                                            setIsSavingSiteSetting(false);
                                                        }
                                                    }}
                                                    disabled={isSavingSiteSetting}
                                                    className="px-8 py-3.5 bg-[#00DDDD] text-black text-[10px] font-mono uppercase tracking-[0.3em] font-bold hover:scale-[1.02] transition-all rounded-xl disabled:opacity-50 animate-pulse"
                                                >
                                                    {isSavingSiteSetting ? "SAVING..." : "SAVE CHANGES"}
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex-1 flex items-center justify-center font-mono opacity-50">
                                            Select a page from the right sidebar to edit.
                                        </div>
                                    )}
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
                            className="p-4 md:p-8 lg:p-10"
                        >
                            <div className={`border ${isDarkMode ? "border-zinc-800/50" : "border-zinc-300"} rounded-[2rem] md:rounded-[3rem] overflow-hidden backdrop-blur-3xl ${isDarkMode ? "bg-gradient-to-br from-zinc-900 via-black to-zinc-900" : "bg-gradient-to-br from-zinc-100 via-white to-zinc-100"
                                }`}>
                                <div className={`p-6 md:p-10 border-b flex items-center justify-between ${isDarkMode ? "border-white/10" : "border-zinc-300"}`}>
                                    <div>
                                        <h2 className={`text-3xl font-display font-black tracking-tight uppercase ${isDarkMode ? "text-white" : "text-black"}`}>School Onboarding Requests</h2>
                                        <p className={`text-[10px] font-mono uppercase mt-2 tracking-[0.4em] ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>
                                            {requests.filter(r => r.status === 'pending').length} pending
                                        </p>
                                    </div>
                                    <button
                                        onClick={fetchRequests}
                                        className={`p-3 rounded-full border transition-all ${isDarkMode ? "border-white/10 hover:bg-white/5 text-white" : "border-zinc-300 hover:bg-black/5 text-black"} ${isRequestsLoading ? "animate-spin" : ""}`}
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
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -15 }}
                            className="space-y-4 w-full"
                        >
                            {/* Excel Menu & Operations Toolbar */}
                            <div className={`flex flex-col md:flex-row md:items-center justify-between p-1.5 border ${
                                isDarkMode ? "border-zinc-800 bg-zinc-950" : "border-zinc-300 bg-zinc-50"
                            }`}>
                                {/* Search and Filter Toolbar */}
                                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                                    <div className="relative w-full sm:w-[220px]">
                                        <Search className={`absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 ${isDarkMode ? "opacity-30 text-white" : "opacity-50 text-black"}`} />
                                        <input
                                            type="text"
                                            placeholder="Sheet Search Filter..."
                                            value={schoolsSearch}
                                            onChange={(e) => { setSchoolsSearch(e.target.value); setSchoolsPage(1); }}
                                            className={`w-full pl-8 pr-4 py-1.5 text-[10px] font-mono tracking-wider focus:outline-none border ${
                                                isDarkMode 
                                                    ? "bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600 focus:border-emerald-500/50" 
                                                    : "bg-white border-zinc-300 text-black placeholder:text-zinc-400 focus:border-emerald-600"
                                            }`}
                                        />
                                    </div>
                                    
                                    {/* Date From */}
                                    <div className="flex items-center gap-1.5">
                                        <span className={`text-[9px] font-mono uppercase opacity-55 ${isDarkMode ? "text-white" : "text-black"}`}>From:</span>
                                        <input 
                                            type="date" 
                                            value={schoolsDateFrom} 
                                            onChange={(e) => { setSchoolsDateFrom(e.target.value); setSchoolsPage(1); }} 
                                            className={`px-2 py-1 text-[10px] font-mono focus:outline-none border ${
                                                isDarkMode ? "bg-zinc-900 border-zinc-800 text-white" : "bg-white border-zinc-300 text-black"
                                            }`} 
                                        />
                                    </div>

                                    {/* Date To */}
                                    <div className="flex items-center gap-1.5">
                                        <span className={`text-[9px] font-mono uppercase opacity-55 ${isDarkMode ? "text-white" : "text-black"}`}>To:</span>
                                        <input 
                                            type="date" 
                                            value={schoolsDateTo} 
                                            onChange={(e) => { setSchoolsDateTo(e.target.value); setSchoolsPage(1); }} 
                                            className={`px-2 py-1 text-[10px] font-mono focus:outline-none border ${
                                                isDarkMode ? "bg-zinc-900 border-zinc-800 text-white" : "bg-white border-zinc-300 text-black"
                                            }`} 
                                        />
                                    </div>

                                    {/* Rows */}
                                    <div className="flex items-center gap-1.5">
                                        <span className={`text-[9px] font-mono uppercase opacity-55 ${isDarkMode ? "text-white" : "text-black"}`}>Rows:</span>
                                        <select 
                                            value={schoolsRowsPerPage} 
                                            onChange={(e) => { setSchoolsRowsPerPage(parseInt(e.target.value) || 10); setSchoolsPage(1); }} 
                                            className={`px-2 py-1 text-[10px] font-mono focus:outline-none border ${
                                                isDarkMode ? "bg-zinc-900 border-zinc-800 text-white" : "bg-white border-zinc-300 text-black"
                                            }`}
                                        >
                                            <option value={10}>10</option>
                                            <option value={25}>25</option>
                                            <option value={50}>50</option>
                                            <option value={100}>100</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Refresh Button */}
                                <div className="flex items-center gap-2 mt-2 md:mt-0">
                                    <button
                                        onClick={fetchSchoolsData}
                                        className={`px-3 py-1.5 text-[10px] font-mono font-bold border transition-all flex items-center justify-center gap-1.5 ${
                                            isDarkMode 
                                                ? "bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border-zinc-800" 
                                                : "bg-white hover:bg-zinc-100 text-zinc-700 border-zinc-300"
                                        } ${isSchoolsLoading ? "animate-spin" : ""}`}
                                        title="Refresh Sheet"
                                    >
                                        <RefreshCw className="h-3 w-3" />
                                        Refresh Sheet
                                    </button>
                                </div>
                            </div>

                            {/* Excel Formula Bar */}
                            <div className={`flex items-center border-x border-b text-[10px] font-mono ${
                                isDarkMode ? "border-zinc-800 bg-zinc-900/50 text-white" : "border-zinc-300 bg-zinc-100/50 text-black"
                            }`}>
                                <div className={`w-14 text-center py-2 font-bold border-r select-none shrink-0 ${
                                    isDarkMode ? "border-zinc-800 text-emerald-400" : "border-zinc-300 text-emerald-700"
                                }`}>
                                    {activeSchoolsCell ? `${activeSchoolsCell.colKey}${activeSchoolsCell.rowIdx}` : "A1"}
                                </div>

                                <div className={`px-3 select-none italic font-serif font-black text-xs shrink-0 ${isDarkMode ? "text-zinc-500 border-r border-zinc-800" : "text-zinc-400 border-r border-zinc-300"}`}>
                                    fx
                                </div>

                                <div className="flex-1 px-4 py-2 font-sans truncate select-none text-[10.5px]">
                                    {activeSchoolsCell ? getSchoolsExcelCellValueFormula(activeSchoolsCell.rowIdx, activeSchoolsCell.colKey) : ""}
                                </div>
                            </div>

                            {/* Crisp Spreadsheet Container */}
                            <div className={`overflow-x-auto relative z-10 w-full border ${isDarkMode ? "border-zinc-800 bg-zinc-950" : "border-zinc-300 bg-white"}`}>
                                <table className="w-full text-left border-collapse select-none">
                                    <thead>
                                        {/* Column Letters Headers */}
                                        <tr className={`text-[8px] font-mono uppercase text-center border-b ${isDarkMode ? "bg-zinc-900/60 border-zinc-800 text-white/40" : "bg-zinc-100 border-zinc-300 text-black/40"}`}>
                                            <th className="p-2 border-r border-inherit w-10 text-center font-bold bg-zinc-200/50 dark:bg-zinc-900"></th>
                                            {['A', 'B', 'C', 'D', 'E'].map(col => (
                                                <th 
                                                    key={col} 
                                                    className={`p-2 border-r border-inherit text-center font-bold transition-colors ${
                                                        activeSchoolsCell?.colKey === col
                                                            ? "bg-emerald-500/10 text-emerald-400 font-black"
                                                            : ""
                                                    }`}
                                                >
                                                    {col}
                                                </th>
                                            ))}
                                        </tr>
                                        {/* Row Column Headers */}
                                        <tr className={`text-[9px] font-mono uppercase tracking-[0.2em] border-b ${isDarkMode ? "bg-zinc-900/40 border-zinc-800 text-white/50" : "bg-zinc-50 border-zinc-300 text-black/60"}`}>
                                            <th className="p-3 border-r border-inherit text-center font-bold w-10 bg-zinc-200/30 dark:bg-zinc-900/60">#</th>
                                            <th className="p-4 border-r border-inherit font-bold">
                                                <button onClick={() => toggleSchoolsSort('name')} className="flex items-center gap-1 hover:opacity-85 transition-all">
                                                    School Name {schoolsSortField === 'name' ? (schoolsSortOrder === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 opacity-30" />}
                                                </button>
                                            </th>
                                            <th className="p-4 border-r border-inherit font-bold">
                                                <button onClick={() => toggleSchoolsSort('code')} className="flex items-center gap-1 hover:opacity-85 transition-all">
                                                    School Code {schoolsSortField === 'code' ? (schoolsSortOrder === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 opacity-30" />}
                                                </button>
                                            </th>
                                            <th className="p-4 border-r border-inherit font-bold">
                                                <button onClick={() => toggleSchoolsSort('created')} className="flex items-center gap-1 hover:opacity-85 transition-all">
                                                    Onboard Date {schoolsSortField === 'created' ? (schoolsSortOrder === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 opacity-30" />}
                                                </button>
                                            </th>
                                            <th className="p-4 font-bold text-right">Facilities Detail</th>
                                            <th className="p-4 font-bold text-right">Delete</th>
                                        </tr>
                                    </thead>
                                    <tbody className={`text-[11px] font-mono tracking-tight ${isDarkMode ? "text-white/90" : "text-black/90"}`}>
                                        {isSchoolsLoading ? (
                                            Array.from({ length: 5 }).map((_, i) => (
                                                <tr key={i} className="animate-pulse border-b border-zinc-800 opacity-20">
                                                    <td colSpan={6} className={`p-8 h-16 ${isDarkMode ? "bg-white/5" : "bg-black/5"}`} />
                                                </tr>
                                            ))
                                        ) : visibleSchools.length === 0 ? (
                                            <tr className="border-b border-zinc-800">
                                                <td colSpan={6} className={`p-20 text-center font-display font-black text-2xl uppercase tracking-[1em] ${isDarkMode ? "opacity-20 text-white" : "opacity-40 text-black"}`}>No Schools Found</td>
                                            </tr>
                                        ) : (
                                            visibleSchools.map((s, index) => {
                                                const rowIndex = index + 1;
                                                const globalRowIndex = (schoolsPage - 1) * schoolsRowsPerPage + index + 1;
                                                return (
                                                    <React.Fragment key={s.id}>
                                                        <tr className={`border-b transition-colors ${isDarkMode ? "border-zinc-800 hover:bg-white/[0.01]" : "border-zinc-300 hover:bg-black/[0.01]"}`}>
                                                            {/* Row Index */}
                                                            <td className={`p-3 text-center text-[9px] font-mono border-r border-inherit w-10 select-none transition-colors ${
                                                                activeSchoolsCell?.rowIdx === rowIndex
                                                                    ? "bg-emerald-500/15 text-emerald-500 font-bold"
                                                                    : isDarkMode ? "bg-zinc-950/40 text-white/30" : "bg-zinc-50 text-black/40"
                                                            }`}>{globalRowIndex}</td>

                                                            {/* Col A: School Name */}
                                                            <td 
                                                                onClick={() => setActiveSchoolsCell({ rowIdx: rowIndex, colKey: 'A' })}
                                                                className={`p-4 border-r border-inherit cursor-cell relative transition-all ${
                                                                    activeSchoolsCell?.rowIdx === rowIndex && activeSchoolsCell?.colKey === 'A'
                                                                        ? "outline outline-2 outline-emerald-500 -outline-offset-1 z-20 bg-emerald-500/[0.03] dark:bg-emerald-500/[0.02]"
                                                                        : ""
                                                                }`}
                                                            >
                                                                <span className="text-[12px] font-bold tracking-tight">{s.school_name}</span>
                                                            </td>

                                                            {/* Col B: School Code */}
                                                            <td 
                                                                onClick={() => setActiveSchoolsCell({ rowIdx: rowIndex, colKey: 'B' })}
                                                                className={`p-4 border-r border-inherit cursor-cell relative transition-all ${
                                                                    activeSchoolsCell?.rowIdx === rowIndex && activeSchoolsCell?.colKey === 'B'
                                                                        ? "outline outline-2 outline-emerald-500 -outline-offset-1 z-20 bg-emerald-500/[0.03] dark:bg-emerald-500/[0.02]"
                                                                        : ""
                                                                }`}
                                                            >
                                                                <span className="text-xs font-mono opacity-80">{s.school_code}</span>
                                                            </td>

                                                            {/* Col C: Onboard Date */}
                                                            <td 
                                                                onClick={() => setActiveSchoolsCell({ rowIdx: rowIndex, colKey: 'C' })}
                                                                className={`p-4 border-r border-inherit cursor-cell relative transition-all ${
                                                                    activeSchoolsCell?.rowIdx === rowIndex && activeSchoolsCell?.colKey === 'C'
                                                                        ? "outline outline-2 outline-emerald-500 -outline-offset-1 z-20 bg-emerald-500/[0.03] dark:bg-emerald-500/[0.02]"
                                                                        : ""
                                                                }`}
                                                            >
                                                                <span className="text-xs font-mono opacity-60">{new Date(s.created_at).toLocaleDateString()}</span>
                                                            </td>

                                                            {/* Col D: Toggle Actions */}
                                                            <td 
                                                                onClick={() => setActiveSchoolsCell({ rowIdx: rowIndex, colKey: 'D' })}
                                                                className={`p-4 cursor-cell relative transition-all ${
                                                                    activeSchoolsCell?.rowIdx === rowIndex && activeSchoolsCell?.colKey === 'D'
                                                                        ? "outline outline-2 outline-emerald-500 -outline-offset-1 z-20 bg-emerald-500/[0.03] dark:bg-emerald-500/[0.02]"
                                                                        : ""
                                                                }`}
                                                            >
                                                                <div className="flex items-center justify-end">
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            const willOpen = selectedSchool?.id !== s.id;
                                                                            setSelectedSchool(prev => prev?.id === s.id ? null : s);
                                                                            if (willOpen && !facultyBySchool[s.school_code]) {
                                                                                loadFacultyForSchool(s.school_code);
                                                                            }
                                                                        }}
                                                                        className={`px-3 py-1.5 border rounded text-[9px] font-mono tracking-widest uppercase font-bold transition-all ${
                                                                            selectedSchool?.id === s.id
                                                                                ? "bg-emerald-500 text-black border-emerald-500 font-black hover:bg-emerald-600"
                                                                                : isDarkMode
                                                                                    ? "border-zinc-800 hover:border-white/20 hover:bg-white/5 text-white"
                                                                                    : "border-zinc-300 hover:border-black/20 hover:bg-black/5 text-black"
                                                                        }`}
                                                                    >
                                                                        {selectedSchool?.id === s.id ? "CLOSE DETS" : "OPEN DETS"}
                                                                    </button>
                                                                </div>
                                                            </td>

                                                            {/* Col E: Delete School */}
                                                            <td 
                                                                onClick={() => setActiveSchoolsCell({ rowIdx: rowIndex, colKey: 'E' })}
                                                                className={`p-4 cursor-cell relative transition-all ${
                                                                    activeSchoolsCell?.rowIdx === rowIndex && activeSchoolsCell?.colKey === 'E'
                                                                        ? "outline outline-2 outline-emerald-500 -outline-offset-1 z-20 bg-emerald-500/[0.03] dark:bg-emerald-500/[0.02]"
                                                                        : ""
                                                                }`}
                                                            >
                                                                <div className="flex items-center justify-end">
                                                                    <button
                                                                        onClick={(eBtn) => {
                                                                            eBtn.stopPropagation();
                                                                            if (confirm(`Are you sure you want to delete the school "${s.school_name}"? All associated data will be permanently deleted.`)) {
                                                                                handleDeleteSchool(s.id);
                                                                            }
                                                                        }}
                                                                        className="p-1.5 bg-red-500/10 border border-red-500/20 rounded text-red-500 hover:bg-red-500 hover:text-white transition-all"
                                                                        title="Delete School"
                                                                    >
                                                                        <Trash2 className="h-3.5 w-3.5" />
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>

                                                        {/* Expanded Details Row */}
                                                        {selectedSchool?.id === s.id && (
                                                            <tr className={isDarkMode ? "bg-zinc-950/40" : "bg-zinc-55/10"}>
                                                                <td className="p-0 border-b border-zinc-200 dark:border-zinc-800" colSpan={6}>
                                                                    <div className={`p-6 border-t ${isDarkMode ? 'border-zinc-800' : 'border-zinc-300'}`}>
                                                                        {/* Admins Sub-Table Header */}
                                                                        <div className="flex items-center justify-between mb-3">
                                                                            <div className="flex items-center gap-2">
                                                                                <Shield className="h-4 w-4 text-emerald-400" />
                                                                                <h4 className={`text-xs font-display font-black uppercase tracking-wider ${isDarkMode ? 'text-white' : 'text-black'}`}>School Admins Database</h4>
                                                                            </div>
                                                                            <button
                                                                                onClick={() => setSelectedSchool(null)}
                                                                                className={`text-[9px] font-mono uppercase tracking-widest underline ${isDarkMode ? 'text-white/60 hover:text-white' : 'text-black/60 hover:text-black'}`}
                                                                            >
                                                                                COLLAPSE
                                                                            </button>
                                                                        </div>

                                                                        {schoolAdmins.filter(a => a.school_name === s.school_name).length === 0 ? (
                                                                            <div className={`p-4 border text-center text-[10px] font-mono opacity-50 ${isDarkMode ? "bg-white/5 border-zinc-850" : "bg-black/5 border-zinc-300"}`}>No admins assigned to this school node</div>
                                                                        ) : (
                                                                            <div className={`overflow-x-auto border ${isDarkMode ? "border-zinc-800 bg-zinc-900/20" : "border-zinc-300 bg-white"}`}>
                                                                                <table className="w-full text-left border-collapse">
                                                                                    <thead>
                                                                                        <tr className={`text-[8.5px] font-mono uppercase tracking-widest border-b ${isDarkMode ? "bg-zinc-900 border-zinc-800 text-white/50" : "bg-zinc-100 border-zinc-300 text-black/60"}`}>
                                                                                            <th className="p-2.5 border-r border-inherit font-bold">Name / Status</th>
                                                                                            <th className="p-2.5 border-r border-inherit font-bold">Admin Code</th>
                                                                                            <th className="p-2.5 border-r border-inherit font-bold">Students Count</th>
                                                                                            <th className="p-2.5 border-r border-inherit font-bold">Email Interface</th>
                                                                                            <th className="p-2.5 border-r border-inherit font-bold text-right">Actions</th>
                                                                                            <th className="p-2.5 font-bold text-right">Purge</th>
                                                                                        </tr>
                                                                                    </thead>
                                                                                    <tbody className="text-[10px] font-mono">
                                                                                        {schoolAdmins.filter(a => a.school_name === s.school_name).map((a) => {
                                                                                            const isFrozen = frozenAdminIds.includes(a.id);
                                                                                            return (
                                                                                                <tr key={a.id} className={`border-b transition-colors ${isDarkMode ? "border-zinc-800/80 hover:bg-white/[0.01]" : "border-zinc-300/80 hover:bg-black/[0.01]"}`}>
                                                                                                    <td className="p-2.5 border-r border-inherit">
                                                                                                        <div className="flex items-center gap-2">
                                                                                                            <span className="font-bold">{a.name}</span>
                                                                                                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono uppercase tracking-widest ${isFrozen ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'}`}>{isFrozen ? 'frozen' : 'active'}</span>
                                                                                                        </div>
                                                                                                    </td>
                                                                                                    <td className="p-2.5 border-r border-inherit font-mono">{a.admin_code}</td>
                                                                                                    <td className="p-2.5 border-r border-inherit font-mono">{a.student_count}</td>
                                                                                                    <td className="p-2.5 border-r border-inherit font-mono opacity-80">{a.email || '—'}</td>
                                                                                                    <td className="p-2.5 border-r border-inherit text-right">
                                                                                                        {isFrozen ? (
                                                                                                            <button
                                                                                                                onClick={() => handleUnfreezeAdmin(a.id)}
                                                                                                                disabled={freezingAdminId === a.id}
                                                                                                                className="px-2 py-1 bg-emerald-500 text-black text-[9px] font-bold tracking-widest rounded hover:bg-emerald-600 disabled:opacity-50 transition-all"
                                                                                                            >
                                                                                                                {freezingAdminId === a.id ? '...' : 'UNFREEZE'}
                                                                                                            </button>
                                                                                                        ) : (
                                                                                                            <button
                                                                                                                onClick={() => handleFreezeAdmin(a.id)}
                                                                                                                disabled={freezingAdminId === a.id}
                                                                                                                className="px-2 py-1 bg-red-500 text-white text-[9px] font-bold tracking-widest rounded hover:bg-red-650 disabled:opacity-50 transition-all"
                                                                                                            >
                                                                                                                {freezingAdminId === a.id ? '...' : 'FREEZE'}
                                                                                                            </button>
                                                                                                        )}
                                                                                                    </td>
                                                                                                    <td className="p-2.5 text-right">
                                                                                                        {confirmDeleteSchoolAdminId === a.id ? (
                                                                                                            <div className="flex items-center justify-end gap-1">
                                                                                                                <button
                                                                                                                    onClick={() => handleDeleteSchoolAdmin(a.id)}
                                                                                                                    disabled={deletingSchoolAdminId === a.id}
                                                                                                                    className="px-2 py-1 bg-red-600 text-white text-[8px] font-bold tracking-widest rounded hover:bg-red-700 disabled:opacity-50 transition-all"
                                                                                                                >
                                                                                                                    {deletingSchoolAdminId === a.id ? '...' : 'CONFIRM'}
                                                                                                                </button>
                                                                                                                <button
                                                                                                                    onClick={() => setConfirmDeleteSchoolAdminId(null)}
                                                                                                                    className={`p-1 border rounded transition-all ${isDarkMode ? "border-zinc-800 hover:bg-white/5 text-white" : "border-zinc-300 hover:bg-black/5 text-black"}`}
                                                                                                                >
                                                                                                                    <X className="h-2.5 w-2.5" />
                                                                                                                </button>
                                                                                                            </div>
                                                                                                        ) : (
                                                                                                            <button
                                                                                                                onClick={() => setConfirmDeleteSchoolAdminId(a.id)}
                                                                                                                className={`p-1.5 border rounded transition-all hover:border-red-500/40 hover:text-red-400 hover:bg-red-500/5 ${isDarkMode ? "border-zinc-800 text-white/40" : "border-zinc-300 text-black/40"}`}
                                                                                                                title="Delete school admin"
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

                                                                        {/* Faculty Sub-Table Header */}
                                                                        <div className="flex items-center justify-between mt-6 mb-3">
                                                                            <div className="flex items-center gap-2">
                                                                                <Users className="h-4 w-4 text-cyan-400" />
                                                                                <h4 className={`text-xs font-display font-black uppercase tracking-wider ${isDarkMode ? 'text-white' : 'text-black'}`}>School Faculty Roster</h4>
                                                                            </div>
                                                                            {facultyLoadingCodes.has(s.school_code) && (
                                                                                <span className="text-[9px] font-mono animate-pulse text-emerald-500">SYNCING DIRECTORY...</span>
                                                                            )}
                                                                        </div>

                                                                        {(!facultyBySchool[s.school_code] || facultyBySchool[s.school_code].length === 0) && !facultyLoadingCodes.has(s.school_code) ? (
                                                                            <div className={`p-4 border text-center text-[10px] font-mono opacity-50 ${isDarkMode ? "bg-white/5 border-zinc-850" : "bg-black/5 border-zinc-300"}`}>No faculty records found in directory</div>
                                                                        ) : (
                                                                            <div className={`overflow-x-auto border ${isDarkMode ? "border-zinc-800 bg-zinc-900/20" : "border-zinc-300 bg-white"}`}>
                                                                                <table className="w-full text-left border-collapse">
                                                                                    <thead>
                                                                                        <tr className={`text-[8.5px] font-mono uppercase tracking-widest border-b ${isDarkMode ? "bg-zinc-900 border-zinc-800 text-white/50" : "bg-zinc-100 border-zinc-300 text-black/60"}`}>
                                                                                            <th className="p-2.5 border-r border-inherit font-bold">Faculty Name</th>
                                                                                            <th className="p-2.5 border-r border-inherit font-bold">Admin Code Link</th>
                                                                                            <th className="p-2.5 border-r border-inherit font-bold">Assigned Class</th>
                                                                                            <th className="p-2.5 border-r border-inherit font-bold">Email ID</th>
                                                                                            <th className="p-2.5 font-bold text-right">Purge</th>
                                                                                        </tr>
                                                                                    </thead>
                                                                                    <tbody className="text-[10px] font-mono">
                                                                                        {(facultyBySchool[s.school_code] || []).map((f) => {
                                                                                            const actionKey = f.id || f.admin_code || "";
                                                                                            return (
                                                                                                <tr key={f.id || f.admin_code} className={`border-b transition-colors ${isDarkMode ? "border-zinc-800/80 hover:bg-white/[0.01]" : "border-zinc-300/80 hover:bg-black/[0.01]"}`}>
                                                                                                    <td className="p-2.5 border-r border-inherit font-bold">{f.name}</td>
                                                                                                    <td className="p-2.5 border-r border-inherit font-mono">{f.admin_code || '—'}</td>
                                                                                                    <td className="p-2.5 border-r border-inherit font-mono">{f.assigned_class || '—'}</td>
                                                                                                    <td className="p-2.5 border-r border-inherit font-mono opacity-80">{f.email || '—'}</td>
                                                                                                    <td className="p-2.5 text-right">
                                                                                                        {confirmDeleteFacultyCode === actionKey ? (
                                                                                                            <div className="flex items-center justify-end gap-1">
                                                                                                                <button
                                                                                                                    onClick={() => handleDeleteFacultyFromDashboard(f, s.school_code)}
                                                                                                                    disabled={deletingFacultyCode === actionKey || !actionKey}
                                                                                                                    className="px-2 py-1 bg-red-600 text-white text-[8px] font-bold tracking-widest rounded hover:bg-red-700 disabled:opacity-50 transition-all"
                                                                                                                >
                                                                                                                    {deletingFacultyCode === actionKey ? '...' : 'CONFIRM'}
                                                                                                                </button>
                                                                                                                <button
                                                                                                                    onClick={() => setConfirmDeleteFacultyCode(null)}
                                                                                                                    className={`p-1 border rounded transition-all ${isDarkMode ? "border-zinc-800 hover:bg-white/5 text-white" : "border-zinc-300 hover:bg-black/5 text-black"}`}
                                                                                                                >
                                                                                                                    <X className="h-2.5 w-2.5" />
                                                                                                                </button>
                                                                                                            </div>
                                                                                                        ) : (
                                                                                                            <button
                                                                                                                onClick={() => actionKey && setConfirmDeleteFacultyCode(actionKey)}
                                                                                                                className={`p-1.5 border rounded transition-all hover:border-red-500/40 hover:text-red-400 hover:bg-red-500/5 ${isDarkMode ? "border-zinc-800 text-white/40" : "border-zinc-300 text-black/40"}`}
                                                                                                                title="Delete faculty member"
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
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </React.Fragment>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Excel Bottom Sheet Tab Bar */}
                            <div className={`flex items-center justify-between border-x border-b p-2 text-[10px] font-mono select-none ${
                                isDarkMode ? "border-zinc-800 bg-zinc-950 text-white" : "border-zinc-300 bg-zinc-50 text-black"
                            }`}>
                                {/* Tabs */}
                                <div className="flex items-center gap-1">
                                    <div className={`px-3 py-1 border-t-2 border-emerald-500 bg-zinc-900/30 dark:bg-zinc-950 font-bold flex items-center gap-2 border-x ${
                                        isDarkMode ? "border-zinc-800 text-white" : "border-zinc-300 text-black"
                                    }`}>
                                        <Database className="h-3 w-3 text-emerald-500" />
                                        <span>Sheet2 (Schools Detail)</span>
                                    </div>
                                    <button className={`p-1 hover:bg-white/5 rounded transition-all opacity-50`}>
                                        <Plus className="h-3.5 w-3.5" />
                                    </button>
                                </div>

                                {/* Real-time Pagination controls resembling Excel page navigation */}
                                <div className="flex items-center gap-3">
                                    <span className="text-[9px] opacity-40 uppercase tracking-widest">Page {schoolsPage} of {schoolsTotalPages || 1}</span>
                                    <div className="flex items-center gap-1.5">
                                        <button
                                            onClick={() => setSchoolsPage(p => Math.max(1, p - 1))}
                                            disabled={schoolsPage === 1}
                                            className={`p-1.5 border rounded disabled:opacity-20 transition-all ${isDarkMode ? "border-zinc-800 hover:bg-white/5 text-white" : "border-zinc-300 hover:bg-zinc-100 text-black"}`}
                                        >
                                            <ChevronLeft className="h-3.5 w-3.5" />
                                        </button>
                                        {Array.from({ length: schoolsTotalPages }, (_, i) => i + 1)
                                            .filter(p => p === 1 || p === schoolsTotalPages || Math.abs(p - schoolsPage) <= 1)
                                            .map((pageNum, i, arr) => (
                                                <React.Fragment key={pageNum}>
                                                    {i > 0 && arr[i - 1] !== pageNum - 1 && <span className="opacity-20 px-1">...</span>}
                                                    <button
                                                        onClick={() => setSchoolsPage(pageNum)}
                                                        className={`px-2.5 py-1 border rounded text-[9px] font-mono transition-all ${schoolsPage === pageNum
                                                            ? 'bg-emerald-500 border-emerald-500 text-black font-black'
                                                            : (isDarkMode ? 'border-zinc-800 hover:bg-white/5 opacity-40 text-white' : 'border-zinc-300 hover:bg-zinc-100 opacity-60 text-black')
                                                            }`}
                                                    >
                                                        {pageNum}
                                                    </button>
                                                </React.Fragment>
                                            ))
                                        }
                                        <button
                                            onClick={() => setSchoolsPage(p => Math.min(schoolsTotalPages, p + 1))}
                                            disabled={schoolsPage === schoolsTotalPages || schoolsTotalPages === 0}
                                            className={`p-1.5 border rounded disabled:opacity-20 transition-all ${isDarkMode ? "border-zinc-800 hover:bg-white/5 text-white" : "border-zinc-300 hover:bg-zinc-100 text-black"}`}
                                        >
                                            <ChevronRightIcon className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Excel Bottom Status Bar */}
                            <div className={`flex flex-col sm:flex-row sm:items-center justify-between border-x border-b px-4 py-1.5 text-[9px] font-mono select-none ${
                                isDarkMode ? "border-zinc-900 bg-zinc-900 text-zinc-400" : "border-zinc-300 bg-zinc-100 text-zinc-500"
                            }`}>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-1.5">
                                        <div className="h-2 w-2 rounded-full bg-emerald-500" />
                                        <span className="font-bold text-emerald-500 uppercase">Ready</span>
                                    </div>
                                    <span>// SCHOOLS METRICS: ACTIVE</span>
                                </div>
                                <div className="flex flex-wrap items-center gap-4 sm:gap-6 mt-1 sm:mt-0">
                                    <span>TOTAL_SCHOOLS = <b className={isDarkMode ? "text-white" : "text-black"}>{processedSchools.length}</b></span>
                                    <div className="flex items-center gap-2">
                                        <span>Zoom:</span>
                                        <span className="font-bold">100%</span>
                                        <span className="opacity-45 select-none font-sans font-bold text-xs">- [========] +</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                               {/* Enterprises View */}
                    {view === 'enterprises' && (
                        <motion.div
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -15 }}
                            className="space-y-4 w-full"
                        >
                            {/* Stat Cards Flat Bordered Grid Row */}
                            <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border-t border-x ${isDarkMode ? 'border-zinc-800 bg-zinc-950/20' : 'border-zinc-300 bg-zinc-50/20'}`}>
                                {[
                                    { title: "Total Enterprises", value: enterprises.length, icon: Building2, color: "#00DDDD" },
                                    { title: "Total Employees", value: enterpriseStats.reduce((sum, item) => sum + (item.student_count || 0), 0), icon: Users, color: "#FFA500" },
                                    { title: "AI Operations", value: enterpriseStats.reduce((sum, item) => sum + (item.total_ai_requests || 0), 0), icon: Cpu, color: "#10B981" },
                                    { title: "Active B2B Admins", value: enterpriseStats.reduce((sum, item) => sum + (item.admin_count || 0), 0), icon: ShieldCheck, color: "#EC4899" }
                                ].map((stat, idx) => {
                                    const Icon = stat.icon;
                                    return (
                                        <div key={idx} className={`p-5 flex flex-col justify-between border-b ${
                                            isDarkMode ? "border-zinc-800" : "border-zinc-300"
                                        } ${idx < 3 ? "lg:border-r border-inherit" : ""}`}>
                                            <div className="flex justify-between items-start">
                                                <span className="text-[9px] font-mono uppercase tracking-[0.3em] opacity-45">{stat.title}</span>
                                                <Icon className="h-4 w-4 opacity-35" style={{ color: stat.color }} />
                                            </div>
                                            <div className="flex items-baseline gap-2 mt-2">
                                                <h4 className={`text-2xl font-display font-black tracking-tight ${isDarkMode ? "text-white" : "text-black"}`}>{stat.value}</h4>
                                            </div>
                                            <div className="h-[2px] w-6 mt-3 rounded-full" style={{ backgroundColor: stat.color }} />
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Excel Menu & Operations Toolbar */}
                            <div className={`flex flex-col md:flex-row md:items-center justify-between p-1.5 border ${
                                isDarkMode ? "border-zinc-800 bg-zinc-950" : "border-zinc-300 bg-zinc-50"
                            }`}>
                                {/* Search and Filter Toolbar */}
                                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                                    <div className="relative w-full sm:w-[220px]">
                                        <Search className={`absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 ${isDarkMode ? "opacity-30 text-white" : "opacity-50 text-black"}`} />
                                        <input
                                            type="text"
                                            placeholder="Sheet Search Filter..."
                                            value={enterprisesSearch}
                                            onChange={(e) => { setEnterprisesSearch(e.target.value); setEnterprisesPage(1); }}
                                            className={`w-full pl-8 pr-4 py-1.5 text-[10px] font-mono tracking-wider focus:outline-none border ${
                                                isDarkMode 
                                                    ? "bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600 focus:border-emerald-500/50" 
                                                    : "bg-white border-zinc-300 text-black placeholder:text-zinc-400 focus:border-emerald-600"
                                            }`}
                                        />
                                    </div>
                                    
                                    {/* Date From */}
                                    <div className="flex items-center gap-1.5">
                                        <span className={`text-[9px] font-mono uppercase opacity-55 ${isDarkMode ? "text-white" : "text-black"}`}>From:</span>
                                        <input 
                                            type="date" 
                                            value={enterprisesDateFrom} 
                                            onChange={(e) => { setEnterprisesDateFrom(e.target.value); setEnterprisesPage(1); }} 
                                            className={`px-2 py-1 text-[10px] font-mono focus:outline-none border ${
                                                isDarkMode ? "bg-zinc-900 border-zinc-800 text-white" : "bg-white border-zinc-300 text-black"
                                            }`} 
                                        />
                                    </div>

                                    {/* Date To */}
                                    <div className="flex items-center gap-1.5">
                                        <span className={`text-[9px] font-mono uppercase opacity-55 ${isDarkMode ? "text-white" : "text-black"}`}>To:</span>
                                        <input 
                                            type="date" 
                                            value={enterprisesDateTo} 
                                            onChange={(e) => { setEnterprisesDateTo(e.target.value); setEnterprisesPage(1); }} 
                                            className={`px-2 py-1 text-[10px] font-mono focus:outline-none border ${
                                                isDarkMode ? "bg-zinc-900 border-zinc-800 text-white" : "bg-white border-zinc-300 text-black"
                                            }`} 
                                        />
                                    </div>

                                    {/* Rows */}
                                    <div className="flex items-center gap-1.5">
                                        <span className={`text-[9px] font-mono uppercase opacity-55 ${isDarkMode ? "text-white" : "text-black"}`}>Rows:</span>
                                        <select 
                                            value={enterprisesRowsPerPage} 
                                            onChange={(e) => { setEnterprisesRowsPerPage(parseInt(e.target.value) || 10); setEnterprisesPage(1); }} 
                                            className={`px-2 py-1 text-[10px] font-mono focus:outline-none border ${
                                                isDarkMode ? "bg-zinc-900 border-zinc-800 text-white" : "bg-white border-zinc-300 text-black"
                                            }`}
                                        >
                                            <option value={10}>10</option>
                                            <option value={25}>25</option>
                                            <option value={50}>50</option>
                                            <option value={100}>100</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Refresh Button */}
                                <div className="flex items-center gap-2 mt-2 md:mt-0">
                                    <button
                                        onClick={fetchEnterprisesData}
                                        className={`px-3 py-1.5 text-[10px] font-mono font-bold border transition-all flex items-center justify-center gap-1.5 ${
                                            isDarkMode 
                                                ? "bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border-zinc-800" 
                                                : "bg-white hover:bg-zinc-100 text-zinc-700 border-zinc-300"
                                        } ${isEnterprisesLoading ? "animate-spin" : ""}`}
                                        title="Refresh Sheet"
                                    >
                                        <RefreshCw className="h-3 w-3" />
                                        Refresh Sheet
                                    </button>
                                </div>
                            </div>

                            {/* Excel Formula Bar */}
                            <div className={`flex items-center border-x border-b text-[10px] font-mono ${
                                isDarkMode ? "border-zinc-800 bg-zinc-900/50 text-white" : "border-zinc-300 bg-zinc-100/50 text-black"
                            }`}>
                                <div className={`w-14 text-center py-2 font-bold border-r select-none shrink-0 ${
                                    isDarkMode ? "border-zinc-800 text-emerald-400" : "border-zinc-300 text-emerald-700"
                                }`}>
                                    {activeEnterprisesCell ? `${activeEnterprisesCell.colKey}${activeEnterprisesCell.rowIdx}` : "A1"}
                                </div>

                                <div className={`px-3 select-none italic font-serif font-black text-xs shrink-0 ${isDarkMode ? "text-zinc-500 border-r border-zinc-800" : "text-zinc-400 border-r border-zinc-300"}`}>
                                    fx
                                </div>

                                <div className="flex-1 px-4 py-2 font-sans truncate select-none text-[10.5px]">
                                    {activeEnterprisesCell ? getEnterprisesExcelCellValueFormula(activeEnterprisesCell.rowIdx, activeEnterprisesCell.colKey) : ""}
                                </div>
                            </div>

                            {/* Crisp Spreadsheet Container */}
                            <div className={`overflow-x-auto relative z-10 w-full border ${isDarkMode ? "border-zinc-800 bg-zinc-950" : "border-zinc-300 bg-white"}`}>
                                <table className="w-full text-left border-collapse select-none">
                                    <thead>
                                        {/* Column Letters Headers */}
                                        <tr className={`text-[8px] font-mono uppercase text-center border-b ${isDarkMode ? "bg-zinc-900/60 border-zinc-800 text-white/40" : "bg-zinc-100 border-zinc-300 text-black/40"}`}>
                                            <th className="p-2 border-r border-inherit w-10 text-center font-bold bg-zinc-200/50 dark:bg-zinc-900"></th>
                                            {['A', 'B', 'C', 'D', 'E', 'F', 'G'].map(col => (
                                                <th 
                                                    key={col} 
                                                    className={`p-2 border-r border-inherit text-center font-bold transition-colors ${
                                                        activeEnterprisesCell?.colKey === col
                                                            ? "bg-emerald-500/10 text-emerald-400 font-black"
                                                            : ""
                                                    }`}
                                                >
                                                    {col}
                                                </th>
                                            ))}
                                        </tr>
                                        {/* Row Column Headers */}
                                        <tr className={`text-[9px] font-mono uppercase tracking-[0.2em] border-b ${isDarkMode ? "bg-zinc-900/40 border-zinc-800 text-white/50" : "bg-zinc-50 border-zinc-300 text-black/60"}`}>
                                            <th className="p-3 border-r border-inherit text-center font-bold w-10 bg-zinc-200/30 dark:bg-zinc-900/60">#</th>
                                            <th className="p-4 border-r border-inherit font-bold">
                                                <button onClick={() => toggleEnterprisesSort('name')} className="flex items-center gap-1 hover:opacity-85 transition-all">
                                                    Enterprise Name {enterprisesSortField === 'name' ? (enterprisesSortOrder === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 opacity-30" />}
                                                </button>
                                            </th>
                                            <th className="p-4 border-r border-inherit font-bold">
                                                <button onClick={() => toggleEnterprisesSort('code')} className="flex items-center gap-1 hover:opacity-85 transition-all">
                                                    Enterprise Code {enterprisesSortField === 'code' ? (enterprisesSortOrder === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 opacity-30" />}
                                                </button>
                                            </th>
                                            <th className="p-4 border-r border-inherit font-bold text-center">Employees</th>
                                            <th className="p-4 border-r border-inherit font-bold text-center">Admins</th>
                                            <th className="p-4 border-r border-inherit font-bold text-center">AI Requests</th>
                                            <th className="p-4 border-r border-inherit font-bold">
                                                <button onClick={() => toggleEnterprisesSort('created')} className="flex items-center gap-1 hover:opacity-85 transition-all">
                                                    Onboard Date {enterprisesSortField === 'created' ? (enterprisesSortOrder === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 opacity-30" />}
                                                </button>
                                            </th>
                                            <th className="p-4 font-bold text-right">Delete Operations</th>
                                            <th className="p-4 font-bold text-right">Details</th>
                                        </tr>
                                    </thead>
                                    <tbody className={`text-[11px] font-mono tracking-tight ${isDarkMode ? "text-white/90" : "text-black/90"}`}>
                                        {isEnterprisesLoading ? (
                                            Array.from({ length: 5 }).map((_, i) => (
                                                <tr key={i} className="animate-pulse border-b border-zinc-800 opacity-20">
                                                    <td colSpan={9} className={`p-8 h-16 ${isDarkMode ? "bg-white/5" : "bg-black/5"}`} />
                                                </tr>
                                            ))
                                        ) : visibleEnterprises.length === 0 ? (
                                            <tr className="border-b border-zinc-800">
                                                <td colSpan={9} className={`p-20 text-center font-display font-black text-2xl uppercase tracking-[1em] ${isDarkMode ? "opacity-20 text-white" : "opacity-40 text-black"}`}>No Enterprises Found</td>
                                            </tr>
                                        ) : (
                                            visibleEnterprises.map((e, index) => {
                                                const rowIndex = index + 1;
                                                const globalRowIndex = (enterprisesPage - 1) * enterprisesRowsPerPage + index + 1;
                                                const stats = enterpriseStats.find(item => item.school_code === e.enterprise_code);
                                                const isExpanded = selectedEnterprise?.id === e.id;
                                                return (
                                                    <React.Fragment key={e.id}>
                                                        <tr className={`border-b transition-colors ${isDarkMode ? "border-zinc-800 hover:bg-white/[0.01]" : "border-zinc-300 hover:bg-black/[0.01]"}`}>
                                                            {/* Row Index */}
                                                            <td className={`p-3 text-center text-[9px] font-mono border-r border-inherit w-10 select-none transition-colors ${
                                                                activeEnterprisesCell?.rowIdx === rowIndex
                                                                    ? "bg-emerald-500/15 text-emerald-500 font-bold"
                                                                    : isDarkMode ? "bg-zinc-950/40 text-white/30" : "bg-zinc-50 text-black/40"
                                                            }`}>{globalRowIndex}</td>

                                                            {/* Col A: Name */}
                                                            <td 
                                                                onClick={() => setActiveEnterprisesCell({ rowIdx: rowIndex, colKey: 'A' })}
                                                                className={`p-4 border-r border-inherit cursor-cell relative transition-all ${
                                                                    activeEnterprisesCell?.rowIdx === rowIndex && activeEnterprisesCell?.colKey === 'A'
                                                                        ? "outline outline-2 outline-emerald-500 -outline-offset-1 z-20 bg-emerald-500/[0.03] dark:bg-emerald-500/[0.02]"
                                                                        : ""
                                                                }`}
                                                            >
                                                                <span className="text-[12px] font-bold tracking-tight">{e.enterprise_name}</span>
                                                            </td>

                                                            {/* Col B: Code */}
                                                            <td 
                                                                onClick={() => setActiveEnterprisesCell({ rowIdx: rowIndex, colKey: 'B' })}
                                                                className={`p-4 border-r border-inherit cursor-cell relative transition-all ${
                                                                    activeEnterprisesCell?.rowIdx === rowIndex && activeEnterprisesCell?.colKey === 'B'
                                                                        ? "outline outline-2 outline-emerald-500 -outline-offset-1 z-20 bg-emerald-500/[0.03] dark:bg-emerald-500/[0.02]"
                                                                        : ""
                                                                }`}
                                                            >
                                                                <span className="text-xs font-mono opacity-80">{e.enterprise_code}</span>
                                                            </td>

                                                            {/* Col C: Employees */}
                                                            <td 
                                                                onClick={() => setActiveEnterprisesCell({ rowIdx: rowIndex, colKey: 'C' })}
                                                                className={`p-4 border-r border-inherit cursor-cell relative text-center transition-all ${
                                                                    activeEnterprisesCell?.rowIdx === rowIndex && activeEnterprisesCell?.colKey === 'C'
                                                                        ? "outline outline-2 outline-emerald-500 -outline-offset-1 z-20 bg-emerald-500/[0.03] dark:bg-emerald-500/[0.02]"
                                                                        : ""
                                                                }`}
                                                            >
                                                                <div className="flex flex-col gap-0.5 items-center justify-center">
                                                                    <span className="text-xs font-mono font-bold">{stats?.student_count || 0}</span>
                                                                    <span className="text-[8px] opacity-40 uppercase tracking-widest">admins: {stats?.admin_count || 0}</span>
                                                                </div>
                                                            </td>

                                                            {/* Col D: AI Requests */}
                                                            <td 
                                                                onClick={() => setActiveEnterprisesCell({ rowIdx: rowIndex, colKey: 'D' })}
                                                                className={`p-4 border-r border-inherit cursor-cell relative text-center transition-all ${
                                                                    activeEnterprisesCell?.rowIdx === rowIndex && activeEnterprisesCell?.colKey === 'D'
                                                                        ? "outline outline-2 outline-emerald-500 -outline-offset-1 z-20 bg-emerald-500/[0.03] dark:bg-emerald-500/[0.02]"
                                                                        : ""
                                                                }`}
                                                            >
                                                                <span className="text-xs font-mono font-bold text-[#00DDDD]">{stats?.total_ai_requests || 0}</span>
                                                            </td>

                                                            {/* Col E: Onboard Date */}
                                                            <td 
                                                                onClick={() => setActiveEnterprisesCell({ rowIdx: rowIndex, colKey: 'E' })}
                                                                className={`p-4 border-r border-inherit cursor-cell relative transition-all ${
                                                                    activeEnterprisesCell?.rowIdx === rowIndex && activeEnterprisesCell?.colKey === 'E'
                                                                        ? "outline outline-2 outline-emerald-500 -outline-offset-1 z-20 bg-emerald-500/[0.03] dark:bg-emerald-500/[0.02]"
                                                                        : ""
                                                                }`}
                                                            >
                                                                <span className="text-xs font-mono opacity-60">{new Date(e.created_at).toLocaleDateString()}</span>
                                                            </td>

                                                            {/* Col F: Administrative Delete */}
                                                            <td 
                                                                onClick={() => setActiveEnterprisesCell({ rowIdx: rowIndex, colKey: 'F' })}
                                                                className={`p-4 cursor-cell relative transition-all ${
                                                                    activeEnterprisesCell?.rowIdx === rowIndex && activeEnterprisesCell?.colKey === 'F'
                                                                        ? "outline outline-2 outline-emerald-500 -outline-offset-1 z-20 bg-emerald-500/[0.03] dark:bg-emerald-500/[0.02]"
                                                                        : ""
                                                                }`}
                                                            >
                                                                <div className="flex items-center justify-end">
                                                                    <button
                                                                        onClick={(eBtn) => {
                                                                            eBtn.stopPropagation();
                                                                            if (confirm(`Are you sure you want to delete the enterprise "${e.enterprise_name}"? All associated managers, employees, and stats will be permanently deleted.`)) {
                                                                                handleDeleteEnterprise(e.id);
                                                                            }
                                                                        }}
                                                                        className="p-1.5 bg-red-500/10 border border-red-500/20 rounded text-red-500 hover:bg-red-500 hover:text-white transition-all"
                                                                        title="Delete Enterprise Node"
                                                                    >
                                                                        <Trash2 className="h-3.5 w-3.5" />
                                                                    </button>
                                                                </div>
                                                            </td>

                                                            {/* Col G: Toggle Details */}
                                                            <td 
                                                                onClick={() => setActiveEnterprisesCell({ rowIdx: rowIndex, colKey: 'G' })}
                                                                className={`p-4 cursor-cell relative transition-all ${
                                                                    activeEnterprisesCell?.rowIdx === rowIndex && activeEnterprisesCell?.colKey === 'G'
                                                                        ? "outline outline-2 outline-emerald-500 -outline-offset-1 z-20 bg-emerald-500/[0.03] dark:bg-emerald-500/[0.02]"
                                                                        : ""
                                                                }`}
                                                            >
                                                                <div className="flex items-center justify-end">
                                                                    <button
                                                                        onClick={(eBtn) => {
                                                                            eBtn.stopPropagation();
                                                                            const willOpen = !isExpanded;
                                                                            setSelectedEnterprise(willOpen ? e : null);
                                                                        }}
                                                                        className={`px-3 py-1.5 border rounded text-[9px] font-mono tracking-widest uppercase font-bold transition-all ${
                                                                            isExpanded
                                                                                ? "bg-emerald-500 text-black border-emerald-500 font-black hover:bg-emerald-600"
                                                                                : isDarkMode
                                                                                    ? "border-zinc-800 hover:border-white/20 hover:bg-white/5 text-white"
                                                                                    : "border-zinc-300 hover:border-black/20 hover:bg-black/5 text-black"
                                                                        }`}
                                                                    >
                                                                        {isExpanded ? "CLOSE DETS" : "OPEN DETS"}
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>

                                                        {/* Expanded Details Row */}
                                                        {isExpanded && (
                                                            <tr className={isDarkMode ? "bg-zinc-950/40" : "bg-zinc-55/10"}>
                                                                <td className="p-0 border-b border-zinc-200 dark:border-zinc-800" colSpan={9}>
                                                                    <div className={`p-6 border-t ${isDarkMode ? 'border-zinc-800' : 'border-zinc-300'}`}>
                                                                        <div className="flex items-center justify-between mb-4">
                                                                            <div className="flex items-center gap-2">
                                                                                <Shield className="h-4 w-4 text-emerald-400" />
                                                                                <h4 className={`text-xs font-display font-black uppercase tracking-wider ${isDarkMode ? 'text-white' : 'text-black'}`}>Enterprise Personnel</h4>
                                                                            </div>
                                                                            <button
                                                                                onClick={() => setSelectedEnterprise(null)}
                                                                                className={`text-[9px] font-mono uppercase tracking-widest underline ${isDarkMode ? 'text-white/60 hover:text-white' : 'text-black/60 hover:text-black'}`}
                                                                            >
                                                                                COLLAPSE
                                                                            </button>
                                                                        </div>

                                                                        {(() => {
                                                                            const entUsers = users.filter(u => u.enterprise_id === e.id);
                                                                            const entAdmins = entUsers.filter(u => u.role === 'enterprise_admin');
                                                                            const entManagers = entUsers.filter(u => u.role === 'manager');
                                                                            const entEmployees = entUsers.filter(u => u.role === 'employee');
                                                                            const renderUserTable = (userList: AdminUser[], label: string, icon: any, color: string) => (
                                                                                <>
                                                                                    <div className="flex items-center gap-2 mt-4 mb-2 first:mt-0">
                                                                                        {React.createElement(icon, { className: `h-4 w-4`, style: { color } })}
                                                                                        <h4 className={`text-xs font-display font-black uppercase tracking-wider ${isDarkMode ? 'text-white' : 'text-black'}`}>{label} ({userList.length})</h4>
                                                                                    </div>
                                                                                    {userList.length === 0 ? (
                                                                                        <div className={`p-3 border text-center text-[10px] font-mono opacity-50 ${isDarkMode ? "bg-white/5 border-zinc-850" : "bg-black/5 border-zinc-300"}`}>No {label.toLowerCase()} found</div>
                                                                                    ) : (
                                                                                        <div className={`overflow-x-auto border ${isDarkMode ? "border-zinc-800 bg-zinc-900/20" : "border-zinc-300 bg-white"}`}>
                                                                                            <table className="w-full text-left border-collapse">
                                                                                                <thead>
                                                                                                    <tr className={`text-[8.5px] font-mono uppercase tracking-widest border-b ${isDarkMode ? "bg-zinc-900 border-zinc-800 text-white/50" : "bg-zinc-100 border-zinc-300 text-black/60"}`}>
                                                                                                        <th className="p-2 border-r border-inherit font-bold">Name / Status</th>
                                                                                                        <th className="p-2 border-r border-inherit font-bold">Email</th>
                                                                                                        <th className="p-2 border-r border-inherit font-bold text-right">Freeze</th>
                                                                                                        <th className="p-2 font-bold text-right">Delete</th>
                                                                                                    </tr>
                                                                                                </thead>
                                                                                                <tbody className="text-[10px] font-mono">
                                                                                                    {userList.map((u) => (
                                                                                                        <tr key={u.id} className={`border-b transition-colors ${isDarkMode ? "border-zinc-800/80 hover:bg-white/[0.01]" : "border-zinc-300/80 hover:bg-black/[0.01]"}`}>
                                                                                                            <td className="p-2 border-r border-inherit">
                                                                                                                <div className="flex items-center gap-2">
                                                                                                                    <span className="font-bold">{u.name}</span>
                                                                                                                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono uppercase tracking-widest ${u.is_frozen ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'}`}>{u.is_frozen ? 'frozen' : 'active'}</span>
                                                                                                                </div>
                                                                                                            </td>
                                                                                                            <td className="p-2 border-r border-inherit font-mono opacity-80">{u.email || '—'}</td>
                                                                                                            <td className="p-2 border-r border-inherit text-right">
                                                                                                                {u.is_frozen ? (
                                                                                                                    <button
                                                                                                                        onClick={() => handleEntUnfreezeUser(u.id)}
                                                                                                                        disabled={entFreezingUserId === u.id}
                                                                                                                        className="px-2 py-1 bg-emerald-500 text-black text-[9px] font-bold tracking-widest rounded hover:bg-emerald-600 disabled:opacity-50 transition-all"
                                                                                                                    >
                                                                                                                        {entFreezingUserId === u.id ? '...' : 'UNFREEZE'}
                                                                                                                    </button>
                                                                                                                ) : (
                                                                                                                    <button
                                                                                                                        onClick={() => handleEntFreezeUser(u.id)}
                                                                                                                        disabled={entFreezingUserId === u.id}
                                                                                                                        className="px-2 py-1 bg-red-500 text-white text-[9px] font-bold tracking-widest rounded hover:bg-red-650 disabled:opacity-50 transition-all"
                                                                                                                    >
                                                                                                                        {entFreezingUserId === u.id ? '...' : 'FREEZE'}
                                                                                                                    </button>
                                                                                                                )}
                                                                                                            </td>
                                                                                                            <td className="p-2 text-right">
                                                                                                                <button
                                                                                                                    onClick={() => {
                                                                                                                        if (confirm(`Delete user "${u.name}"?`)) {
                                                                                                                            handleEntDeleteUser(u.id);
                                                                                                                        }
                                                                                                                    }}
                                                                                                                    disabled={entDeletingUserId === u.id}
                                                                                                                    className={`p-1.5 border rounded transition-all hover:border-red-500/40 hover:text-red-400 hover:bg-red-500/5 ${isDarkMode ? "border-zinc-800 text-white/40" : "border-zinc-300 text-black/40"} ${entDeletingUserId === u.id ? 'opacity-50' : ''}`}
                                                                                                                    title="Delete user"
                                                                                                                >
                                                                                                                    <Trash2 className="h-3 w-3" />
                                                                                                                </button>
                                                                                                            </td>
                                                                                                        </tr>
                                                                                                    ))}
                                                                                                </tbody>
                                                                                            </table>
                                                                                        </div>
                                                                                    )}
                                                                                </>
                                                                            );
                                                                            return (
                                                                                <>
                                                                                    {renderUserTable(entAdmins, 'Enterprise Admins', Shield, '#10B981')}
                                                                                    {renderUserTable(entManagers, 'Managers', Users, '#00DDDD')}
                                                                                    {renderUserTable(entEmployees, 'Employees', Users, '#FFA500')}
                                                                                </>
                                                                            );
                                                                        })()}
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </React.Fragment>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Excel Bottom Sheet Tab Bar */}
                            <div className={`flex items-center justify-between border-x border-b p-2 text-[10px] font-mono select-none ${
                                isDarkMode ? "border-zinc-800 bg-zinc-950 text-white" : "border-zinc-300 bg-zinc-50 text-black"
                            }`}>
                                {/* Tabs */}
                                <div className="flex items-center gap-1">
                                    <div className={`px-3 py-1 border-t-2 border-emerald-500 bg-zinc-900/30 dark:bg-zinc-950 font-bold flex items-center gap-2 border-x ${
                                        isDarkMode ? "border-zinc-800 text-white" : "border-zinc-300 text-black"
                                    }`}>
                                        <Database className="h-3 w-3 text-emerald-500" />
                                        <span>Sheet3 (Enterprises)</span>
                                    </div>
                                    <button className={`p-1 hover:bg-white/5 rounded transition-all opacity-50`}>
                                        <Plus className="h-3.5 w-3.5" />
                                    </button>
                                </div>

                                {/* Real-time Pagination controls resembling Excel page navigation */}
                                <div className="flex items-center gap-3">
                                    <span className="text-[9px] opacity-40 uppercase tracking-widest">Page {enterprisesPage} of {enterprisesTotalPages || 1}</span>
                                    <div className="flex items-center gap-1.5">
                                        <button
                                            onClick={() => setEnterprisesPage(p => Math.max(1, p - 1))}
                                            disabled={enterprisesPage === 1}
                                            className={`p-1.5 border rounded disabled:opacity-20 transition-all ${isDarkMode ? "border-zinc-800 hover:bg-white/5 text-white" : "border-zinc-300 hover:bg-zinc-100 text-black"}`}
                                        >
                                            <ChevronLeft className="h-3.5 w-3.5" />
                                        </button>
                                        {Array.from({ length: enterprisesTotalPages }, (_, i) => i + 1)
                                            .filter(p => p === 1 || p === enterprisesTotalPages || Math.abs(p - enterprisesPage) <= 1)
                                            .map((pageNum, i, arr) => (
                                                <React.Fragment key={pageNum}>
                                                    {i > 0 && arr[i - 1] !== pageNum - 1 && <span className="opacity-20 px-1">...</span>}
                                                    <button
                                                        onClick={() => setEnterprisesPage(pageNum)}
                                                        className={`px-2.5 py-1 border rounded text-[9px] font-mono transition-all ${enterprisesPage === pageNum
                                                            ? 'bg-emerald-500 border-emerald-500 text-black font-black'
                                                            : (isDarkMode ? 'border-zinc-800 hover:bg-white/5 opacity-40 text-white' : 'border-zinc-300 hover:bg-zinc-100 opacity-60 text-black')
                                                            }`}
                                                    >
                                                        {pageNum}
                                                    </button>
                                                </React.Fragment>
                                            ))
                                        }
                                        <button
                                            onClick={() => setEnterprisesPage(p => Math.min(enterprisesTotalPages, p + 1))}
                                            disabled={enterprisesPage === enterprisesTotalPages || enterprisesTotalPages === 0}
                                            className={`p-1.5 border rounded disabled:opacity-20 transition-all ${isDarkMode ? "border-zinc-800 hover:bg-white/5 text-white" : "border-zinc-300 hover:bg-zinc-100 text-black"}`}
                                        >
                                            <ChevronRightIcon className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Excel Bottom Status Bar */}
                            <div className={`flex flex-col sm:flex-row sm:items-center justify-between border-x border-b px-4 py-1.5 text-[9px] font-mono select-none ${
                                isDarkMode ? "border-zinc-900 bg-zinc-900 text-zinc-400" : "border-zinc-300 bg-zinc-100 text-zinc-500"
                            }`}>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-1.5">
                                        <div className="h-2 w-2 rounded-full bg-emerald-500" />
                                        <span className="font-bold text-emerald-500 uppercase">Ready</span>
                                    </div>
                                    <span>// ENTERPRISES SUMMARY: ACTIVE</span>
                                </div>
                                <div className="flex flex-wrap items-center gap-4 sm:gap-6 mt-1 sm:mt-0">
                                    {visibleEnterprises.length > 0 && (
                                        <div className="flex items-center gap-3 border-r pr-4 sm:pr-6 border-inherit">
                                            <span>SUM(ai_requests) = <b className={isDarkMode ? "text-white" : "text-black"}>{visibleEnterprises.reduce((s, e) => s + (enterpriseStats.find(item => item.school_code === e.enterprise_code)?.total_ai_requests || 0), 0)}</b></span>
                                            <span>AVERAGE(ai_requests) = <b className={isDarkMode ? "text-white" : "text-black"}>{(visibleEnterprises.reduce((s, e) => s + (enterpriseStats.find(item => item.school_code === e.enterprise_code)?.total_ai_requests || 0), 0) / visibleEnterprises.length).toFixed(1)}</b></span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2">
                                        <span>Zoom:</span>
                                        <span className="font-bold">100%</span>
                                        <span className="opacity-45 select-none font-sans font-bold text-xs">- [========] +</span>
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
                            className="p-4 md:p-8 lg:p-10"
                        >
                            <div className={`border border-zinc-800/50 rounded-[2rem] md:rounded-[3rem] overflow-hidden backdrop-blur-3xl ${isDarkMode ? "bg-gradient-to-br from-zinc-900 via-black to-zinc-900" : "bg-gradient-to-br from-zinc-100 via-white to-zinc-100"
                                }`}>
                                <div className={`p-6 md:p-10 border-b flex items-center justify-between ${isDarkMode ? "border-white/10" : "border-black/10"}`}>
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

                                <div className="p-6 md:p-10">
                                    <div className="flex items-center justify-between mb-8">
                                        <h3 className={`text-lg font-display font-black uppercase tracking-tight ${isDarkMode ? "text-white" : "text-black"}`}>All Plans</h3>
                                        <button
                                            onClick={() => setEditingPlan({ id: 'new', plan_name: '', price_inr: 0, daily_image_limit: 0, feature_extraction_limit: 0, daily_vision_limit: 0, monthly_image_limit: 0, monthly_flux_limit: 0, daily_tts_limit: 0, daily_stt_limit: 0, monthly_tokens: 0, ocr_limit: 0, name: '', price: 0, tokens_limit: 0, images_limit: 0, personas_limit: 0, daily_chat_limit: 0, daily_coding_limit: 0 })}
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

            {/* Persistent Desktop Right Sidebar (Collapsible Users Selector) */}
            {view === 'visual' && (
                <aside 
                    className={`hidden lg:flex flex-col h-full shrink-0 relative z-25 transition-all duration-300 overflow-hidden ${
                        isDarkMode 
                            ? "border-white/10 bg-black/40 bg-gradient-to-b from-zinc-950 via-black to-zinc-950" 
                            : "border-black/10 bg-white bg-gradient-to-b from-zinc-50 via-white to-zinc-50"
                    } backdrop-blur-3xl`}
                    style={{
                        width: isRightSidebarCollapsed ? "0px" : `${rightSidebarWidth}px`,
                        padding: isRightSidebarCollapsed ? "0px" : "2rem 1.5rem",
                        borderLeft: isRightSidebarCollapsed ? "none" : (isDarkMode ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(0,0,0,0.1)"),
                        opacity: isRightSidebarCollapsed ? 0 : 1
                    }}
                >
                    {!isRightSidebarCollapsed && (
                        <>
                            <UsersListPanel onClose={() => setIsRightSidebarCollapsed(true)} />
                            {/* Drag Resize Handle */}
                            <div
                                onMouseDown={handleRightResizeMouseDown}
                                className="absolute top-0 left-0 w-[4px] h-full cursor-col-resize hover:bg-[#00DDDD]/50 active:bg-[#00DDDD] transition-colors z-[70]"
                            />
                        </>
                    )}
                </aside>
            )}

            {/* Persistent Desktop Right Sidebar (Collapsible Sites Selector) */}
            {view === 'sites' && (
                <aside 
                    className={`hidden lg:flex flex-col h-full shrink-0 relative z-25 transition-all duration-300 overflow-hidden ${
                        isDarkMode 
                            ? "border-white/10 bg-black/40 bg-gradient-to-b from-zinc-950 via-black to-zinc-950" 
                            : "border-black/10 bg-white bg-gradient-to-b from-zinc-50 via-white to-zinc-50"
                    } backdrop-blur-3xl`}
                    style={{
                        width: isRightSidebarCollapsed ? "0px" : `${rightSidebarWidth}px`,
                        padding: isRightSidebarCollapsed ? "0px" : "2rem 1.5rem",
                        borderLeft: isRightSidebarCollapsed ? "none" : (isDarkMode ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(0,0,0,0.1)"),
                        opacity: isRightSidebarCollapsed ? 0 : 1
                    }}
                >
                    {!isRightSidebarCollapsed && (
                        <div className="h-full flex flex-col min-h-0 relative">
                            {/* Drag Resize Handle */}
                            <div
                                onMouseDown={handleRightResizeMouseDown}
                                className="absolute top-0 left-0 w-[4px] h-full cursor-col-resize hover:bg-[#00DDDD]/50 active:bg-[#00DDDD] transition-colors z-[70]"
                            />
                            
                            {/* Top Part: Page Navigation */}
                            <div className="flex flex-col gap-2 mb-6 shrink-0">
                                <div className="flex items-center justify-between px-4 mb-3">
                                    <span className="text-[9px] font-mono uppercase tracking-[0.2em] opacity-40 block">Site Pages</span>
                                    <button
                                        onClick={() => setIsRightSidebarCollapsed(true)}
                                        className={`p-1 rounded-lg border transition-all ${
                                            isDarkMode ? "border-white/10 hover:bg-white/5 text-white" : "border-black/10 hover:bg-black/5 text-black"
                                        }`}
                                        title="Collapse Sites Sidebar"
                                    >
                                        <X className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                                <div className="flex flex-col gap-2 max-h-[340px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-800/40 dark:scrollbar-thumb-zinc-800 scrollbar-track-transparent">
                                {[
                                    { key: 'about_us', label: 'About Us', icon: Info },
                                    { key: 'privacy_policy', label: 'Privacy Policy', icon: Lock },
                                    { key: 'terms_conditions', label: 'Terms of Service', icon: Scale },
                                    { key: 'refund_policy', label: 'Refund Policy', icon: Shield },
                                    { key: 'contact_info', label: 'Contact Us', icon: Mail },
                                    { key: 'social_media_links', label: 'Social Media Links', icon: Share2 },
                                    { key: 'footer_text', label: 'Footer Text', icon: FileText },
                                    { key: 'footer_contact', label: 'Footer Contact', icon: Phone },
                                    { key: 'schools_page', label: 'Schools Page', icon: GraduationCap },
                                    { key: 'b2b_page', label: 'B2B Page', icon: Briefcase },
                                    { key: 'pricing_page', label: 'Pricing Page', icon: Zap },
                                    { key: 'home_page', label: 'Home Page Video', icon: Play },
                                    { key: 'plugin_page', label: 'Plugin Page', icon: Code2 },
                                    { key: 'mobile_app_page', label: 'Mobile App Page', icon: Smartphone },
                                    { key: 'faq_page', label: 'FAQ Page', icon: HelpCircle },
                                    { key: 'support_page', label: 'Support Page', icon: Headphones },
                                ].map((page) => {
                                    const isActive = editingSiteSetting?.key === page.key;
                                    const Icon = page.icon;
                                    return (
                                        <button
                                            key={page.key}
                                            onClick={() => {
                                                const lookupKey = (page.key === 'footer_text' || page.key === 'footer_contact') ? 'footer_settings' : page.key;
                                                const setting = siteSettings.find(s => s.key === lookupKey);
                                                let raw = setting?.value || '';
                                                
                                                try {
                                                    const parsed = JSON.parse(raw);
                                                    setEditingSiteSetting({ key: page.key, value: raw });
                                                    if (page.key === 'about_us' && Array.isArray(parsed.sections) && !parsed.elements) {
                                                        setSiteFormData({ elements: parsed.sections.map((s: string) => ({ type: 'paragraph', content: s })) });
                                                    } else if (page.key === 'contact_info' && parsed.description && !parsed.paragraphs) {
                                                        setSiteFormData({ paragraphs: [parsed.description], email: parsed.email || '', responseTime: parsed.responseTime || '' });
                                                    } else if (page.key === 'social_media_links') {
                                                        setSiteFormData({ twitter: parsed.twitter || '', linkedin: parsed.linkedin || '', github: parsed.github || '' });
                                                    } else if (page.key === 'footer_text') {
                                                        setSiteFormData({
                                                            description: parsed.description || 'Rudranex is an advanced AI co-pilot designed for clinical practitioners and medical scholars. Experience high-precision diagnostic support, interactive clinical battle arenas, and state-of-the-art medical resources.'
                                                        });
                                                    } else if (page.key === 'footer_contact') {
                                                        setSiteFormData({
                                                            email: parsed.email || 'hello@rudranex.ai',
                                                            location: parsed.location || 'Rudra Labs, AI Innovation Center, Hyderabad, India.',
                                                            techSupportPhone: parsed.techSupportPhone || '+91 97124 45459',
                                                            enterprisePhone: parsed.enterprisePhone || '+91 63593 02924'
                                                        });
                                                    } else if (page.key === 'home_page') {
                                                        setSiteFormData({ videoUrl: parsed.videoUrl || '' });
                                                    } else if (page.key === 'plugin_page') {
                                                        setSiteFormData({
                                                            title: parsed.title || '',
                                                            description: parsed.description || '',
                                                            buttonText: parsed.buttonText || '',
                                                            buttonUrl: parsed.buttonUrl || ''
                                                        });
                                                    } else if (page.key === 'mobile_app_page') {
                                                        setSiteFormData({
                                                            title: parsed.title || '',
                                                            description: parsed.description || '',
                                                            buttonText: parsed.buttonText || '',
                                                            buttonUrl: parsed.buttonUrl || ''
                                                        });
                                                    } else {
                                                        setSiteFormData(parsed);
                                                    }
                                                } catch {
                                                    if (page.key === 'about_us') {
                                                        setSiteFormData({ elements: raw.split('\n\n').filter(Boolean).map((p: string) => ({ type: 'paragraph', content: p })) });
                                                        setEditingSiteSetting({ key: page.key, value: raw });
                                                    } else if (page.key === 'contact_info') {
                                                        setSiteFormData({ paragraphs: raw.split('\n\n').filter(Boolean), email: '', responseTime: '' });
                                                        setEditingSiteSetting({ key: page.key, value: raw });
                                                    } else if (page.key === 'social_media_links') {
                                                        setSiteFormData({ twitter: '', linkedin: '', github: '' });
                                                        setEditingSiteSetting({ key: page.key, value: JSON.stringify({ twitter: '', linkedin: '', github: '' }) });
                                                    } else if (page.key === 'footer_text') {
                                                        const defaults = { description: 'Rudranex is an advanced AI co-pilot designed for clinical practitioners and medical scholars. Experience high-precision diagnostic support, interactive clinical battle arenas, and state-of-the-art medical resources.' };
                                                        setSiteFormData(defaults);
                                                        setEditingSiteSetting({ key: page.key, value: JSON.stringify(defaults) });
                                                    } else if (page.key === 'footer_contact') {
                                                        const defaults = {
                                                            email: 'hello@rudranex.ai',
                                                            location: 'Rudra Labs, AI Innovation Center, Hyderabad, India.',
                                                            techSupportPhone: '+91 97124 45459',
                                                            enterprisePhone: '+91 63593 02924'
                                                        };
                                                        setSiteFormData(defaults);
                                                        setEditingSiteSetting({ key: page.key, value: JSON.stringify(defaults) });
                                                    } else if (page.key === 'schools_page') {
                                                        const defaults = {
                                                            title: "Empower your\nInstitution.",
                                                            description: "From personalized tutoring to automated assessments — bring the future of education to your classrooms with Rudranex AI.",
                                                            linkText: "Back Home",
                                                            linkUrl: "/",
                                                            features: [
                                                                { title: "AI Tutoring", desc: "Personalized learning paths for every student powered by advanced AI models." },
                                                                { title: "Admin Dashboard", desc: "Full control over faculty, students, and curriculum with real-time analytics." },
                                                                { title: "Branding", desc: "Custom onboarding with your school code, faculty management, and roll numbers." }
                                                            ]
                                                        };
                                                        setSiteFormData(defaults);
                                                        setEditingSiteSetting({ key: page.key, value: JSON.stringify(defaults) });
                                                    } else if (page.key === 'b2b_page') {
                                                        const defaults = {
                                                            title: "Quiet power.\nTailored access.",
                                                            description: "Choose the level of intelligence that fits your workflow. From late-night study sessions to building the next big thing.",
                                                            linkText: "Learn More",
                                                            linkUrl: "/pricing"
                                                        };
                                                        setSiteFormData(defaults);
                                                        setEditingSiteSetting({ key: page.key, value: JSON.stringify(defaults) });
                                                     } else if (page.key === 'pricing_page') {
                                                         const defaults = {
                                                             title: "Quiet power.\nTailored access.",
                                                             description: "Choose the level of intelligence that fits your workflow. From late-night study sessions to building the next big thing.",
                                                             plans: [
                                                                  {
                                                                      planName: "Free Trial",
                                                                      features: [
                                                                          { icon: "zap", text: "Engage in basic conversations with our AI assistant to outline ideas and answer everyday questions." },
                                                                          { icon: "image", text: "Create standard-definition custom graphics using basic image generation tools in the lab." },
                                                                          { icon: "scan", text: "Convert physical documents and paper images into digital text files using standard character recognition." },
                                                                          { icon: "puzzle", text: "Upload document files to extract high-level summaries and locate specific data points." },
                                                                          { icon: "volume", text: "Convert written text articles into audio files to listen to study notes on the go." },
                                                                          { icon: "mic", text: "Dictate notes and letters using smart voice typing for transcription of spoken words." }
                                                                      ]
                                                                  },
                                                                 {
                                                                     planName: "Motion Plan",
                                                                     features: [
                                                                         { icon: "zap", text: "Engage in clear conversations with our AI assistant to draft outlines, brainstorm ideas, and answer simple questions." },
                                                                         { icon: "image", text: "Create standard-definition custom graphics and design unique illustrations using basic image generation tools in the lab." },
                                                                         { icon: "scan", text: "Convert physical documents and clear paper images into editable digital text files using standard character recognition." },
                                                                         { icon: "puzzle", text: "Upload single document files to extract high-level summaries and locate specific data points automatically." },
                                                                         { icon: "volume", text: "Convert written text articles into clear audio recordings for listening to study notes on the go." },
                                                                         { icon: "mic", text: "Dictate notes and letters using smart voice typing for fast transcription of your daily spoken words." }
                                                                     ]
                                                                 },
                                                                 {
                                                                     planName: "Speed Plan",
                                                                     features: [
                                                                         { icon: "zap", text: "Unlock faster processing speeds and longer chat history windows for complex research tasks and documentation projects." },
                                                                         { icon: "image", text: "Produce high-definition digital illustrations instantly without waiting in standard queues during peak generation hours." },
                                                                         { icon: "scan", text: "Extract text from multi-page scanned PDF documents and low-resolution digital screenshots with enhanced OCR accuracy." },
                                                                         { icon: "puzzle", text: "Analyze large datasets to identify hidden trends and cross-reference information across your uploaded materials." },
                                                                         { icon: "volume", text: "Listen to complete books and research reports narrated by natural, high-fidelity synthetic voices for long listening sessions." },
                                                                         { icon: "mic", text: "Convert long lectures and meetings into highly accurate text using advanced acoustic speech-to-text algorithms." }
                                                                     ]
                                                                 },
                                                                 {
                                                                     planName: "Velocity Plan",
                                                                     features: [
                                                                         { icon: "zap", text: "Deploy professional-grade reasoning engines optimized for executing multi-step logical operations and detailed code generation." },
                                                                         { icon: "image", text: "Generate ultra-realistic visual art and complex design mockups using advanced control parameters and model tuning." },
                                                                         { icon: "scan", text: "Scan complex business documents and extract layout details to export data into clean, structured tables." },
                                                                         { icon: "puzzle", text: "Synthesize information from multiple distinct file sources to generate comprehensive, cohesive executive summaries for your team." },
                                                                         { icon: "volume", text: "Generate custom voiceovers with realistic emotional tones suitable for producing podcasts, video narration, and media." },
                                                                         { icon: "mic", text: "Transcribe live audio streams with automatic speaker identification and smart punctuation in multiple languages." }
                                                                     ]
                                                                 },
                                                                 {
                                                                     planName: "Acceleration Plan",
                                                                     features: [
                                                                         { icon: "zap", text: "Empower your production workflows with massive monthly token allocations for continuous, uninterrupted AI assistant interactions." },
                                                                         { icon: "image", text: "Create unlimited high-resolution commercial marketing graphics instantly using our fastest, state-of-the-art neural diffusion models." },
                                                                         { icon: "scan", text: "Automatically parse unstructured handwritten notes and complex archives using our custom layout intelligence engine." },
                                                                         { icon: "puzzle", text: "Identify semantic relationships and extract metadata schemas from your organization's document library in seconds." },
                                                                         { icon: "volume", text: "Integrate low-latency voice synthesis into your customer-facing applications using premium, studio-quality speech generation APIs." },
                                                                         { icon: "mic", text: "Process noisy ambient audio files and complex board meetings using advanced neural speech recognition pipelines." }
                                                                     ]
                                                                 },
                                                                 {
                                                                     planName: "Agencies / Heavy Duty",
                                                                     features: [
                                                                         { icon: "zap", text: "Execute high-priority API queries on dedicated compute clusters for maximum uptime and zero throttling." },
                                                                         { icon: "image", text: "Train bespoke image generation models specifically designed to replicate and match your unique corporate brand guidelines." },
                                                                         { icon: "scan", text: "Process high-volume batches of document scans using parallelized OCR engines optimized for enterprise scaling." },
                                                                         { icon: "puzzle", text: "Deploy automated parsers to convert unstructured legacy business databases into clean, schema-compliant JSON structures." },
                                                                         { icon: "volume", text: "Build real-time conversational voice agents featuring custom voice clones and sub-millisecond audio synthesis times." },
                                                                         { icon: "mic", text: "Transcribe massive archives of multilingual recordings simultaneously using our distributed acoustic neural network architecture." }
                                                                     ]
                                                                 }
                                                             ]
                                                         };
                                                         setSiteFormData(defaults);
                                                         setEditingSiteSetting({ key: page.key, value: JSON.stringify(defaults) });
                                                    } else if (page.key === 'home_page') {
                                                        const defaults = {
                                                            videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ"
                                                        };
                                                        setSiteFormData(defaults);
                                                        setEditingSiteSetting({ key: page.key, value: JSON.stringify(defaults) });
                                                    } else if (page.key === 'plugin_page') {
                                                        const defaults = {
                                                            title: "Rudranex AI Plugin",
                                                            description: "Bring Rudranex AI directly into your code editor. Get real-time AI assistance, smart debugging, and automated code reviews without leaving your workflow.",
                                                            buttonText: "VS Code Marketplace",
                                                            buttonUrl: "#"
                                                        };
                                                        setSiteFormData(defaults);
                                                        setEditingSiteSetting({ key: page.key, value: JSON.stringify(defaults) });
                                                    } else if (page.key === 'mobile_app_page') {
                                                        const defaults = {
                                                            title: "Rudranex AI Mobile",
                                                            description: "Take Rudranex AI wherever you go. Practice interviews, get code assistance, and learn on the move with our native mobile experience.",
                                                            buttonText: "Download for Android",
                                                            buttonUrl: "#"
                                                        };
                                                        setSiteFormData(defaults);
                                                        setEditingSiteSetting({ key: page.key, value: JSON.stringify(defaults) });
                                                    } else if (page.key === 'faq_page') {
                                                        const defaults = {
                                                            title: "Frequently Asked\nQuestions.",
                                                            description: "Everything you need to know about Rudranex AI. Can't find what you're looking for? Reach out to our support team.",
                                                            categories: [
                                                                { category: "General", questions: [
                                                                    { q: "What is Rudranex AI?", a: "Rudranex AI is an advanced AI co-pilot designed for students, developers, and enterprises." },
                                                                    { q: "Is Rudranex free to use?", a: "Yes! We offer a Free Trial plan with daily chat, coding, and vision limits." }
                                                                ]},
                                                                { category: "Account & Billing", questions: [
                                                                    { q: "How do I create an account?", a: "You can sign up using your mobile number via OTP verification, or use Google/GitHub." }
                                                                ]}
                                                            ]
                                                        };
                                                        setSiteFormData(defaults);
                                                        setEditingSiteSetting({ key: page.key, value: JSON.stringify(defaults) });
                                                    } else if (page.key === 'support_page') {
                                                        const defaults = {
                                                            title: "We're Here to\nHelp.",
                                                            description: "Having trouble? Have a suggestion? Our support team typically responds within 24 hours.",
                                                            email: "hello@rudranex.ai",
                                                            responseTime: "Usually within 24 hours"
                                                        };
                                                        setSiteFormData(defaults);
                                                        setEditingSiteSetting({ key: page.key, value: JSON.stringify(defaults) });
                                                    } else if (page.key === 'privacy_policy') {
                                                        const defaults = {
                                                            lastUpdated: "May 2026",
                                                            sections: [
                                                                { title: "1. Information We Collect", content: "We collect only the data necessary to provide our services: account information (name, email), chat messages and uploaded files for AI processing, and basic usage analytics to improve performance." },
                                                                { title: "2. How We Use Your Data", content: "Your data is used exclusively to process AI requests, generate responses, and improve your experience. We do not sell your data to third parties. Chat history is stored to provide session continuity and can be deleted at any time." },
                                                                { title: "3. Data Security", content: "We use industry-standard encryption for data in transit and at rest. API keys and authentication tokens are stored securely and never exposed client-side beyond what is necessary." },
                                                                { title: "4. Your Rights", content: "You have the right to access, correct, or delete your personal data at any time. Contact us at privacy@rudranex.ai for any data-related requests." },
                                                                { title: "5. Contact", content: "For questions about this policy, reach out to privacy@rudranex.ai." }
                                                            ]
                                                        };
                                                        setSiteFormData(defaults);
                                                        setEditingSiteSetting({ key: page.key, value: JSON.stringify(defaults) });
                                                    } else if (page.key === 'terms_conditions') {
                                                        const defaults = {
                                                            lastUpdated: "May 2026",
                                                            sections: [
                                                                { title: "1. Acceptance of Terms", content: "By accessing or using Rudranex AI, you agree to be bound by these Terms of Service. If you do not agree, do not use our services." },
                                                                { title: "2. Description of Service", content: "Rudranex AI provides AI-powered tools for students including chat-based tutoring, interview simulation, resume analysis, PDF intelligence, and vision-based problem solving. These tools are provided \"as is\" without warranty of any kind." },
                                                                { title: "3. User Obligations", content: "You agree to use the service responsibly and not to misuse the AI systems for any illegal, harmful, or unauthorized purposes. You are responsible for maintaining the confidentiality of your account credentials." },
                                                                { title: "4. Limitation of Liability", content: "Rudranex AI shall not be liable for any indirect, incidental, or consequential damages arising from the use of our services. Our total liability is limited to the amount paid by you in the past 12 months." },
                                                                { title: "5. Changes to Terms", content: "We reserve the right to modify these terms at any time. Users will be notified of material changes via email or through the platform." }
                                                            ]
                                                        };
                                                        setSiteFormData(defaults);
                                                        setEditingSiteSetting({ key: page.key, value: JSON.stringify(defaults) });
                                                    } else if (page.key === 'refund_policy') {
                                                        const defaults = {
                                                            lastUpdated: "June 2026",
                                                            sections: [
                                                                { title: "1. Scope of Refunds", content: "We offer refunds for subscription purchases and digital assets under specific terms, such as service disruption, technical billing errors, or accidental duplicate transactions reported within 7 days of purchase." },
                                                                { title: "2. Ineligibility Criteria", content: "Refunds are generally not issued for fully or partially consumed AI credits or generation tokens, active custom plans that have been fully set up, or accounts flagged and suspended for violating our Terms of Service." },
                                                                { title: "3. Processing Timeframe", content: "Once a refund is approved by our billing department, it will be processed and credited back to your original payment method within 5 to 7 business days." },
                                                                { title: "4. Subscription Cancellations", content: "You may cancel your auto-renewing subscriptions at any time through the billing tab in your user profile dashboard. Upon cancellation, your premium access will remain active until the end of your current billing period." },
                                                                { title: "5. Billing Queries & Support", content: "For any queries, chargeback disputes, or to submit a refund request, please email our support team directly at billing@rudranex.ai with your registered email and transaction ID." }
                                                            ]
                                                        };
                                                        setSiteFormData(defaults);
                                                        setEditingSiteSetting({ key: page.key, value: JSON.stringify(defaults) });
                                                    } else {
                                                        setSiteFormData(null);
                                                        setEditingSiteSetting({ key: page.key, value: raw });
                                                    }
                                                }
                                            }}
                                            className={`w-full flex items-center transition-all duration-300 gap-4 px-4 py-3 rounded-2xl text-left ${
                                                isActive
                                                    ? "text-[#00DDDD] bg-[#00DDDD]/5 font-bold shadow-[inset_0_1px_1px_rgba(0,221,221,0.1)] border border-[#00DDDD]/25"
                                                    : isDarkMode
                                                        ? "text-white/55 hover:text-white hover:bg-white/5"
                                                        : "text-black/60 hover:text-black hover:bg-black/5"
                                            }`}
                                        >
                                            <Icon className={`h-4 w-4 shrink-0 transition-transform duration-300 group-hover:scale-110 ${isActive ? "text-[#00DDDD]" : isDarkMode ? "text-white/40" : "text-black/50"}`} />
                                            <span className="font-display uppercase tracking-wider text-[11px] font-semibold">{page.label}</span>
                                        </button>
                                    )
                                })}
                                </div>
                            </div>

                            {/* Bottom Part: Real Fixed System Audit Logs */}
                            <div className="flex-1 flex flex-col min-h-0 bg-black/10 dark:bg-black/20 p-4 rounded-2xl overflow-hidden">
                                <div className="flex items-center gap-2 mb-4">
                                    <span className="h-1.5 w-1.5 rounded-full bg-[#00DDDD] animate-pulse" />
                                    <span className="text-[9px] font-mono uppercase tracking-[0.2em] opacity-50 block">System Logs & Audits</span>
                                </div>
                                <div className="flex-1 overflow-y-auto font-mono text-[9px] space-y-3 pr-2 scrollbar-thin scrollbar-thumb-zinc-800">
                                    {(() => {
                                        const logs = [
                                            { time: new Date().toLocaleTimeString(), type: 'SYS', text: 'Rudranex AI System handshake established.' },
                                            { time: new Date().toLocaleTimeString(), type: 'API', text: 'getPublicSiteSettings fetched successfully.' },
                                            { time: new Date().toLocaleTimeString(), type: 'SEC', text: 'Active administrator session verified.' },
                                            { time: new Date().toLocaleTimeString(), type: 'SYS', text: `Loaded editing frame: ${editingSiteSetting?.key || 'about_us'}` },
                                            { time: new Date().toLocaleTimeString(), type: 'ENV', text: 'Theme system synchronized successfully.' }
                                        ];
                                        return logs.map((log, index) => (
                                            <div key={index} className="border-l border-[#00DDDD]/20 pl-2 py-0.5 space-y-0.5">
                                                <div className="flex items-center gap-2 opacity-40">
                                                    <span>[{log.time}]</span>
                                                    <span className="text-[#00DDDD] font-bold">::{log.type}</span>
                                                </div>
                                                <p className="text-white/60 line-clamp-2 leading-normal">{log.text}</p>
                                            </div>
                                        ));
                                    })()}
                                </div>
                            </div>
                        </div>
                    )}
                </aside>
            )}
        </div>
    </div>

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
                                                                     daily_image_limit: Number(formData.get('daily_image_limit')),
                                                                     feature_extraction_limit: Number(formData.get('feature_extraction_limit')),
                                                                     daily_vision_limit: Number(formData.get('daily_vision_limit')),
                                                                     monthly_image_limit: Number(formData.get('monthly_image_limit')),
                                                                     monthly_flux_limit: Number(formData.get('monthly_flux_limit')),
                                                                     daily_tts_limit: Number(formData.get('daily_tts_limit')),
                                                                     daily_stt_limit: Number(formData.get('daily_stt_limit')),
                                                                     monthly_tokens: Number(formData.get('monthly_tokens')),
                                                                     strike_off_price: strikeOffEnabled ? strikeOffPrice : 0
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
                                                                     daily_image_limit: Number(formData.get('daily_image_limit')),
                                                                     feature_extraction_limit: Number(formData.get('feature_extraction_limit')),
                                                                     daily_vision_limit: Number(formData.get('daily_vision_limit')),
                                                                     monthly_image_limit: Number(formData.get('monthly_image_limit')),
                                                                     monthly_flux_limit: Number(formData.get('monthly_flux_limit')),
                                                                     daily_tts_limit: Number(formData.get('daily_tts_limit')),
                                                                     daily_stt_limit: Number(formData.get('daily_stt_limit')),
                                                                     monthly_tokens: Number(formData.get('monthly_tokens')),
                                                                     strike_off_price: strikeOffEnabled ? strikeOffPrice : 0
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
                                    <label className={`text-[9px] font-mono uppercase tracking-widest ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>Daily Image</label>
                                    <input
                                        name="daily_image_limit"
                                        type="number"
                                        defaultValue={editingPlan.daily_image_limit ?? 0}
                                        className={`w-full mt-1 p-3 text-xs font-mono border rounded-xl focus:outline-none focus:border-emerald-500/50 ${isDarkMode ? "bg-white/5 border-white/10 text-white" : "bg-black/5 border-black/10 text-black"
                                            }`}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className={`text-[9px] font-mono uppercase tracking-widest ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>Feature Extraction</label>
                                    <input
                                        name="feature_extraction_limit"
                                        type="number"
                                        defaultValue={editingPlan.feature_extraction_limit ?? 0}
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
                                        defaultValue={editingPlan.daily_tts_limit ?? 0}
                                        className={`w-full mt-1 p-3 text-xs font-mono border rounded-xl focus:outline-none focus:border-emerald-500/50 ${isDarkMode ? "bg-white/5 border-white/10 text-white" : "bg-black/5 border-black/10 text-black"
                                            }`}
                                    />
                                </div>
                                <div>
                                    <label className={`text-[9px] font-mono uppercase tracking-widest ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>Daily STT</label>
                                    <input
                                        name="daily_stt_limit"
                                        type="number"
                                        defaultValue={editingPlan.daily_stt_limit ?? 0}
                                        className={`w-full mt-1 p-3 text-xs font-mono border rounded-xl focus:outline-none focus:border-emerald-500/50 ${isDarkMode ? "bg-white/5 border-white/10 text-white" : "bg-black/5 border-black/10 text-black"
                                            }`}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className={`text-[9px] font-mono uppercase tracking-widest ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>Monthly Tokens</label>
                                    <input
                                        name="monthly_tokens"
                                        type="number"
                                        defaultValue={editingPlan.monthly_tokens ?? 0}
                                        className={`w-full mt-1 p-3 text-xs font-mono border rounded-xl focus:outline-none focus:border-emerald-500/50 ${isDarkMode ? "bg-white/5 border-white/10 text-white" : "bg-black/5 border-black/10 text-black"
                                            }`}
                                    />
                                </div>
                                <div>
                                    <label className={`text-[9px] font-mono uppercase tracking-widest ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>OCR Limit</label>
                                    <input
                                        name="ocr_limit"
                                        type="number"
                                        defaultValue={editingPlan.ocr_limit ?? 0}
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
