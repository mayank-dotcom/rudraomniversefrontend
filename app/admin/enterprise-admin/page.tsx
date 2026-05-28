"use client"

import React, { useState, useEffect, useMemo, useRef } from "react"
import {
  Building2, Users, Cpu, Layers, Plus, Trash2, Bell, Send, RefreshCw, Search,
  Lock, Mail, User, TrendingUp, LogOut, Activity, FileText, CheckCircle2, X,
  ChevronRight, ArrowUpRight, ShieldCheck, Database, Zap, Download, ChevronLeft, ArrowUpDown
} from "lucide-react"
import { removeApiKey, getApiKey } from "@/lib/auth"
import {
  getEnterpriseStats, getEnterpriseManagers, createEnterpriseManager,
  updateEnterpriseManagerQuota, deleteEnterpriseManager, getEnterpriseManagerStats,
  getEnterpriseEmployees, getEnterpriseAnnouncements, createEnterpriseAnnouncement,
  EnterpriseManager, EnterpriseEmployee, EnterpriseAnnouncement, EnterpriseStatsResponse
} from "@/lib/chat-api"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"

export default function EnterpriseAdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  
  // Tab control
  const [activeTab, setActiveTab] = useState<"dashboard" | "managers" | "employees" | "broadcast">("dashboard")
  
  // Data States
  const [stats, setStats] = useState<EnterpriseStatsResponse | null>(null)
  const [managers, setManagers] = useState<EnterpriseManager[]>([])
  const [employees, setEmployees] = useState<EnterpriseEmployee[]>([])
  const [announcements, setAnnouncements] = useState<EnterpriseAnnouncement[]>([])

  // Search & Pagination States
  const [managersSearch, setManagersSearch] = useState("")
  const [employeesSearch, setEmployeesSearch] = useState("")
  const [employeesPage, setEmployeesPage] = useState(1)
  const [employeesRowsPerPage, setEmployeesRowsPerPage] = useState(10)

  // Loading States
  const [isStatsLoading, setIsStatsLoading] = useState(false)
  const [isManagersLoading, setIsManagersLoading] = useState(false)
  const [isEmployeesLoading, setIsEmployeesLoading] = useState(false)
  const [isAnnouncementsLoading, setIsAnnouncementsLoading] = useState(false)
  const [isActionLoading, setIsActionLoading] = useState(false)

  // Manager Creation Modal States
  const [showCreateManagerModal, setShowCreateManagerModal] = useState(false)
  const [newManagerName, setNewManagerName] = useState("")
  const [newManagerEmail, setNewManagerEmail] = useState("")
  const [newManagerPassword, setNewManagerPassword] = useState("")
  const [newManagerQuota, setNewManagerQuota] = useState(10)
  const [newManagerClass, setNewManagerClass] = useState("DEVELOPMENT-NODE")
  const [newManagerAdminCode, setNewManagerAdminCode] = useState("")

  // Quota Management States
  const [editingQuotaManager, setEditingQuotaManager] = useState<EnterpriseManager | null>(null)
  const [newQuotaValue, setNewQuotaValue] = useState(10)

  // Manager Uplink Metrics Drawer States
  const [selectedManagerStats, setSelectedManagerStats] = useState<any | null>(null)
  const [isLoadingManagerStats, setIsLoadingManagerStats] = useState(false)

  // Announcement Creation States
  const [annTitle, setAnnTitle] = useState("")
  const [annContent, setAnnContent] = useState("")
  const [annTarget, setAnnTarget] = useState("all")
  const [annPriority, setAnnPriority] = useState("standard")
  const [annFile, setAnnFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ─── AUTHENTICATION CHECK ───
  useEffect(() => {
    const key = getApiKey()
    if (!key) {
      setIsAuthenticated(false)
      window.location.href = "/"
    } else {
      setIsAuthenticated(true)
      fetchAllData()
    }
  }, [])

  const handleLogout = () => {
    removeApiKey()
    window.location.href = "/"
  }

  // ─── DATA FETCHING ───
  const fetchAllData = async () => {
    await Promise.all([
      fetchStats(),
      fetchManagers(),
      fetchEmployees(),
      fetchAnnouncements()
    ])
  }

  const fetchStats = async () => {
    setIsStatsLoading(true)
    try {
      const res = await getEnterpriseStats()
      if (res.success) {
        setStats(res)
      }
    } catch (e: any) {
      toast.error("Failed to load enterprise stats")
    } finally {
      setIsStatsLoading(false)
    }
  }

  const fetchManagers = async () => {
    setIsManagersLoading(true)
    try {
      const res = await getEnterpriseManagers()
      if (res.success) {
        setManagers(res.manager || [])
      }
    } catch (e: any) {
      toast.error("Failed to fetch manager nodes")
    } finally {
      setIsManagersLoading(false)
    }
  }

  const fetchEmployees = async () => {
    setIsEmployeesLoading(true)
    try {
      const res = await getEnterpriseEmployees()
      if (res.success) {
        setEmployees(res.employees || [])
      }
    } catch (e: any) {
      toast.error("Failed to fetch employee database")
    } finally {
      setIsEmployeesLoading(false)
    }
  }

  const fetchAnnouncements = async () => {
    setIsAnnouncementsLoading(true)
    try {
      const res = await getEnterpriseAnnouncements()
      if (res.success) {
        setAnnouncements(res.announcements || [])
      }
    } catch (e: any) {
      toast.error("Failed to load broadcast history")
    } finally {
      setIsAnnouncementsLoading(false)
    }
  }

  // ─── MANAGER CRUD OPERATIONS ───
  const handleOpenCreateManager = () => {
    const code = "MGR-" + Math.floor(1000 + Math.random() * 9000)
    setNewManagerAdminCode(code)
    setNewManagerName("")
    setNewManagerEmail("")
    setNewManagerPassword("")
    setNewManagerQuota(10)
    setNewManagerClass("DEVELOPMENT-NODE")
    setShowCreateManagerModal(true)
  }

  const handleCreateManagerSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newManagerName.trim() || !newManagerAdminCode.trim() || !newManagerPassword.trim()) {
      toast.error("Required fields missing")
      return
    }

    setIsActionLoading(true)
    try {
      await createEnterpriseManager({
        name: newManagerName.trim(),
        email: newManagerEmail.trim() || undefined,
        password: newManagerPassword,
        quota: newManagerQuota,
        assigned_class: newManagerClass,
        admin_code: newManagerAdminCode.trim()
      })
      toast.success("Manager Node commissioned successfully!")
      setShowCreateManagerModal(false)
      fetchManagers()
      fetchStats()
    } catch (err: any) {
      toast.error(err.message || "Failed to create manager")
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleOpenEditQuota = (mgr: EnterpriseManager) => {
    setEditingQuotaManager(mgr)
    setNewQuotaValue(mgr.employee_quota || 10)
  }

  const handleUpdateQuotaSubmit = async () => {
    if (!editingQuotaManager || !editingQuotaManager.admin_code) return
    setIsActionLoading(true)
    try {
      await updateEnterpriseManagerQuota(editingQuotaManager.admin_code, newQuotaValue)
      toast.success(`Quota updated for ${editingQuotaManager.name}`)
      setEditingQuotaManager(null)
      fetchManagers()
      fetchStats()
    } catch (err: any) {
      toast.error(err.message || "Failed to update quota limit")
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleDeleteManagerConfirm = async (mgr: EnterpriseManager) => {
    if (!mgr.admin_code) return
    if (confirm(`Decommission manager node "${mgr.name}"? This action suspends all sub-employee credentials under their node.`)) {
      setIsActionLoading(true)
      try {
        await deleteEnterpriseManager(mgr.admin_code)
        toast.success(`Decommissioned manager node "${mgr.name}"`)
        fetchManagers()
        fetchStats()
      } catch (err: any) {
        toast.error(err.message || "Failed to decommission manager")
      } finally {
        setIsActionLoading(false)
      }
    }
  }

  const handleViewManagerStats = async (mgr: EnterpriseManager) => {
    if (!mgr.admin_code) return
    setIsLoadingManagerStats(true)
    setSelectedManagerStats({ mgr })
    try {
      const data = await getEnterpriseManagerStats(mgr.admin_code)
      if (data.success) {
        setSelectedManagerStats({ mgr, ...data })
      }
    } catch (e: any) {
      toast.error("Unable to connect manager uplink metrics")
      setSelectedManagerStats(null)
    } finally {
      setIsLoadingManagerStats(false)
    }
  }

  // ─── ANNOUNCEMENT SUBMIT ───
  const handleAnnouncementSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!annContent.trim()) {
      toast.error("Announcement content cannot be empty")
      return
    }

    setIsActionLoading(true)
    try {
      await createEnterpriseAnnouncement({
        title: annTitle.trim() || "Broadcast Alert",
        content: annContent.trim(),
        target: annTarget,
        priority: annPriority,
        file: annFile || undefined
      })
      toast.success("Broadcast successfully transmitted!")
      setAnnTitle("")
      setAnnContent("")
      setAnnTarget("all")
      setAnnPriority("standard")
      setAnnFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ""
      fetchAnnouncements()
    } catch (err: any) {
      toast.error(err.message || "Uplink transmission failure")
    } finally {
      setIsActionLoading(false)
    }
  }

  // ─── FILTER & PROCESS DATA ───
  const processedManagers = useMemo(() => {
    const q = managersSearch.trim().toLowerCase()
    if (!q) return managers
    return managers.filter(m => 
      m.name.toLowerCase().includes(q) || 
      (m.admin_code || "").toLowerCase().includes(q) || 
      (m.assigned_class || "").toLowerCase().includes(q)
    )
  }, [managers, managersSearch])

  const processedEmployees = useMemo(() => {
    const q = employeesSearch.trim().toLowerCase()
    if (!q) return employees
    return employees.filter(e => 
      e.name.toLowerCase().includes(q) || 
      (e.roll_no || "").toLowerCase().includes(q) || 
      (e.assigned_class || "").toLowerCase().includes(q)
    )
  }, [employees, employeesSearch])

  const employeesTotalPages = Math.ceil(processedEmployees.length / employeesRowsPerPage)
  const visibleEmployees = useMemo(() => {
    const start = (employeesPage - 1) * employeesRowsPerPage
    return processedEmployees.slice(start, start + employeesRowsPerPage)
  }, [processedEmployees, employeesPage, employeesRowsPerPage])

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-[#060606] flex items-center justify-center font-mono text-white">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="h-8 w-8 text-orange-500 animate-spin" />
          <span className="text-[10px] uppercase tracking-[0.4em] opacity-40">Verifying Handshake...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#060606] text-white font-sans selection:bg-orange-500 selection:text-black relative overflow-x-hidden pb-12">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(249,115,22,0.03),transparent_50%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.005)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.005)_1px,transparent_1px)] bg-[size:100px_100px] pointer-events-none" />

      {/* HEADER NAVBAR */}
      <nav className="h-20 flex items-center justify-between px-6 md:px-12 border-b border-white/5 bg-black/50 backdrop-blur-2xl sticky top-0 z-[100]">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-orange-400" />
            </div>
            <div>
              <h1 className="text-sm font-display font-black tracking-widest uppercase">
                {stats?.enterprise_name || "Enterprise Admin"}
              </h1>
              <p className="text-[8px] font-mono tracking-widest text-[#00DDDD] uppercase">
                B2B Core Panel // {stats?.enterprise_code || "SECURE-NODE"}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={fetchAllData}
            className="h-10 w-10 border border-white/5 hover:border-white/10 hover:bg-white/5 rounded-2xl flex items-center justify-center transition-all group"
            title="Refresh All Uplinks"
          >
            <RefreshCw className="h-4 w-4 opacity-40 group-hover:opacity-100 group-hover:rotate-180 transition-all duration-500" />
          </button>
          
          <div className="h-8 w-[1px] bg-white/15" />

          <button
            onClick={handleLogout}
            className="px-4 py-2 border border-red-500/30 bg-red-500/10 hover:bg-red-500 hover:text-black rounded-2xl text-[9px] font-mono uppercase tracking-[0.2em] font-bold transition-all flex items-center gap-2 text-red-400 hover:border-red-500"
          >
            <LogOut className="h-3.5 w-3.5" />
            Logout
          </button>
        </div>
      </nav>

      {/* SUB-HEADER TABS */}
      <div className="max-w-[1600px] mx-auto px-6 md:px-12 mt-8">
        <div className="flex items-center gap-3 border-b border-white/5 pb-4">
          {[
            { id: "dashboard", label: "Dashboard", icon: Cpu },
            { id: "managers", label: "Manager Nodes", icon: Layers },
            { id: "broadcast", label: "Broadcasts", icon: Bell },
            { id: "employees", label: "Employee Registry", icon: Users }
          ].map(tab => {
            const Icon = tab.icon
            const active = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2.5 px-6 py-3 rounded-2xl text-[10px] font-mono uppercase tracking-[0.2em] transition-all ${
                  active
                    ? "bg-gradient-to-r from-orange-500/20 to-orange-500/10 border border-orange-500/30 text-orange-400 font-bold"
                    : "border border-transparent hover:border-white/5 text-white/50 hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${active ? "text-orange-400" : "text-white/40"}`} />
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* MAIN CONTAINER */}
      <main className="max-w-[1600px] mx-auto px-6 md:px-12 mt-8">
        <AnimatePresence mode="wait">
          {/* TAB 1: DASHBOARD OVERVIEW */}
          {activeTab === "dashboard" && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-8"
            >
              {/* Stat Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="relative border border-white/5 p-6 rounded-[2.5rem] bg-white/[0.02] backdrop-blur-xl overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-500/[0.02] to-transparent pointer-events-none" />
                  <span className="text-[8px] font-mono uppercase tracking-[0.3em] opacity-40">COMMISSIONED MANAGERS</span>
                  <div className="flex items-baseline gap-2 mt-2">
                    <h4 className="text-3xl font-display font-black tracking-tight">{stats?.total_manager || 0}</h4>
                    <span className="text-[9px] font-mono text-[#00DDDD]">Active Uplinks</span>
                  </div>
                  <div className="h-[2px] w-8 mt-4 rounded-full bg-orange-500" />
                </div>

                <div className="relative border border-white/5 p-6 rounded-[2.5rem] bg-white/[0.02] backdrop-blur-xl overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#00DDDD]/[0.02] to-transparent pointer-events-none" />
                  <span className="text-[8px] font-mono uppercase tracking-[0.3em] opacity-40">EMPLOYEE SEATS</span>
                  <div className="flex items-baseline gap-2 mt-2">
                    <h4 className="text-3xl font-display font-black tracking-tight">{stats?.total_employees || 0}</h4>
                    <span className="text-[9px] font-mono text-[#00DDDD]">/ {stats?.employee_limit || "unlimited"} Max</span>
                  </div>
                  <div className="h-[2px] w-8 mt-4 rounded-full bg-[#00DDDD]" />
                </div>

                <div className="relative border border-white/5 p-6 rounded-[2.5rem] bg-white/[0.02] backdrop-blur-xl overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/[0.02] to-transparent pointer-events-none" />
                  <span className="text-[8px] font-mono uppercase tracking-[0.3em] opacity-40">MONTHLY COMPUTE BURN</span>
                  <div className="flex items-baseline gap-2 mt-2">
                    <h4 className="text-3xl font-display font-black tracking-tight">{stats?.token_economy?.monthly_burn || "0 M"}</h4>
                    <span className="text-[9px] font-mono text-purple-400">{stats?.token_economy?.efficiency || "0.0%"} efficiency</span>
                  </div>
                  <div className="h-[2px] w-8 mt-4 rounded-full bg-purple-500" />
                </div>

                <div className="relative border border-white/5 p-6 rounded-[2.5rem] bg-white/[0.02] backdrop-blur-xl overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.02] to-transparent pointer-events-none" />
                  <span className="text-[8px] font-mono uppercase tracking-[0.3em] opacity-40">ACTIVE COMPUTE NODES</span>
                  <div className="flex items-baseline gap-2 mt-2">
                    <h4 className="text-3xl font-display font-black tracking-tight">{stats?.total_nodes || 0}</h4>
                    <span className="text-[9px] font-mono text-emerald-400">Stable Uplink</span>
                  </div>
                  <div className="h-[2px] w-8 mt-4 rounded-full bg-emerald-500" />
                </div>
              </div>

              {/* Resource & Allocation Row */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left: Allocation Meter bars */}
                <div className="lg:col-span-8 border border-white/5 p-8 rounded-[3rem] bg-white/[0.01] backdrop-blur-2xl relative overflow-hidden">
                  <h3 className="text-xs font-display font-black uppercase tracking-[0.2em] mb-8">Node Compute Resource Allocations</h3>
                  <div className="space-y-6">
                    {/* Compute Allocation */}
                    <div>
                      <div className="flex items-center justify-between text-[10px] font-mono mb-2 uppercase opacity-80">
                        <span>CPU Core Cycles</span>
                        <span className="text-orange-400 font-bold">{stats?.resource_allocation?.compute || 0}% Allocated</span>
                      </div>
                      <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-orange-500 rounded-full transition-all duration-1000" style={{ width: `${stats?.resource_allocation?.compute || 0}%` }} />
                      </div>
                    </div>
                    {/* Storage Allocation */}
                    <div>
                      <div className="flex items-center justify-between text-[10px] font-mono mb-2 uppercase opacity-80">
                        <span>Cluster Storage quota</span>
                        <span className="text-[#00DDDD] font-bold">{stats?.resource_allocation?.storage || 0}% Assigned</span>
                      </div>
                      <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-[#00DDDD] rounded-full transition-all duration-1000" style={{ width: `${stats?.resource_allocation?.storage || 0}%` }} />
                      </div>
                    </div>
                    {/* Network Uplink Capacity */}
                    <div>
                      <div className="flex items-center justify-between text-[10px] font-mono mb-2 uppercase opacity-80">
                        <span>High-Speed Bandwidth Uplink</span>
                        <span className="text-emerald-400 font-bold">{stats?.resource_allocation?.network || 0}% Bandwidth</span>
                      </div>
                      <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-400 rounded-full transition-all duration-1000" style={{ width: `${stats?.resource_allocation?.network || 0}%` }} />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 mt-8 pt-8 border-t border-white/5 text-[9px] font-mono uppercase tracking-widest text-white/40">
                    <span className="flex items-center gap-1.5"><Database className="h-3 w-3 text-orange-400" /> DB Cluster: Rudra-Omniverse-2.0</span>
                    <span className="flex items-center gap-1.5"><ShieldCheck className="h-3 w-3 text-emerald-400" /> Secure Protocol Status: Stable</span>
                  </div>
                </div>

                {/* Right: Quick announcements panel */}
                <div className="lg:col-span-4 border border-white/5 p-8 rounded-[3rem] bg-white/[0.01] backdrop-blur-2xl flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs font-display font-black uppercase tracking-[0.2em] mb-6 flex items-center justify-between">
                      <span>Recent Broadcasts</span>
                      <Bell className="h-4 w-4 text-orange-400" />
                    </h3>
                    
                    {announcements.length === 0 ? (
                      <div className="text-center py-10 text-[10px] font-mono uppercase opacity-40">No active broadcasts</div>
                    ) : (
                      <div className="space-y-4">
                        {announcements.slice(0, 3).map(ann => (
                          <div key={ann.id} className="p-4 rounded-2xl bg-white/5 border border-white/5">
                            <div className="flex items-center justify-between mb-1.5">
                              <span className={`text-[8px] font-mono px-2 py-0.5 rounded-full uppercase tracking-widest ${
                                ann.priority === 'high' ? 'bg-red-500/20 text-red-400 border border-red-500/20' : 'bg-orange-500/20 text-orange-400 border border-orange-500/20'
                              }`}>{ann.priority}</span>
                              <span className="text-[8px] font-mono text-white/30">{new Date(ann.created_at).toLocaleDateString()}</span>
                            </div>
                            <h4 className="text-xs font-bold text-white mb-1 truncate">{ann.title}</h4>
                            <p className="text-[10px] text-white/50 line-clamp-2 leading-relaxed">{ann.content}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => setActiveTab("broadcast")}
                    className="w-full mt-6 py-3 border border-orange-500/30 hover:border-orange-500 bg-orange-500/10 hover:bg-orange-500 hover:text-black transition-all duration-300 rounded-2xl text-[9px] font-mono uppercase tracking-[0.2em] font-bold flex items-center justify-center gap-2 text-orange-400 hover:scale-[1.02]"
                  >
                    Open Broadcast Uplink
                  </button>
                </div>
              </div>

              {/* Bottom: Manager Node Status Summary */}
              <div className="border border-white/5 p-8 rounded-[3rem] bg-white/[0.01]">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xs font-display font-black uppercase tracking-[0.2em]">Manager Uplinks</h3>
                  <button onClick={() => setActiveTab("managers")} className="text-[9px] font-mono uppercase tracking-widest text-[#00DDDD] hover:underline flex items-center gap-1">
                    Manage Nodes <ChevronRight className="h-3 w-3" />
                  </button>
                </div>

                {managers.length === 0 ? (
                  <div className="text-center py-10 text-[10px] font-mono uppercase opacity-40">No manager nodes commissioned</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {managers.slice(0, 3).map(mgr => (
                      <div key={mgr.id} className="p-5 rounded-3xl bg-white/[0.02] border border-white/5 hover:border-orange-500/30 transition-all duration-300">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-bold truncate pr-3">{mgr.name}</span>
                          <span className="text-[8px] font-mono text-[#00DDDD] uppercase tracking-widest">{mgr.assigned_class}</span>
                        </div>
                        <div className="space-y-1.5 text-[10px] font-mono text-white/50">
                          <div className="flex justify-between">
                            <span>Uplink ID:</span>
                            <span className="text-white font-bold">{mgr.admin_code}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Employee Limit:</span>
                            <span className="text-white font-bold">{mgr.employee_quota || 0} seats</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* TAB 2: MANAGER NODES MANAGEMENT */}
          {activeTab === "managers" && (
            <motion.div
              key="managers"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-8"
            >
              {/* Controls bar */}
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 opacity-30" />
                  <input
                    value={managersSearch}
                    onChange={(e) => setManagersSearch(e.target.value)}
                    placeholder="Search node code, assigned class, name..."
                    className="w-full pl-10 pr-4 py-2.5 text-xs font-mono rounded-2xl border border-white/5 bg-white/5 text-white placeholder:text-white/30 focus:outline-none focus:border-orange-500/50"
                  />
                </div>

                <button
                  onClick={handleOpenCreateManager}
                  className="px-6 py-2.5 bg-orange-500 hover:scale-[1.02] text-black text-[10px] font-mono uppercase tracking-[0.2em] font-bold rounded-2xl transition-all flex items-center justify-center gap-2 self-start md:self-auto"
                >
                  <Plus className="h-4 w-4 stroke-[3px]" /> Commission Manager Node
                </button>
              </div>

              {/* Managers Table Grid */}
              <div className="border border-white/5 rounded-[2rem] bg-white/[0.01] overflow-hidden">
                <div className="p-6 border-b border-white/5 flex items-center justify-between">
                  <h3 className="text-xs font-display font-black uppercase tracking-[0.2em]">Active Department uplinks</h3>
                  <span className="text-[10px] font-mono text-white/40">{processedManagers.length} active nodes</span>
                </div>

                {isManagersLoading ? (
                  <div className="py-20 text-center text-[10px] font-mono uppercase opacity-40 animate-pulse">Establishing handshake...</div>
                ) : processedManagers.length === 0 ? (
                  <div className="py-20 text-center text-[10px] font-mono uppercase opacity-40">No manager nodes detected</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b border-white/5 text-[9px] font-mono uppercase tracking-widest text-white/40">
                          <th className="p-5 text-left">Node Name</th>
                          <th className="p-5 text-left">Admin Code</th>
                          <th className="p-5 text-left">Classification Node</th>
                          <th className="p-5 text-center">Seat Quota Limit</th>
                          <th className="p-5 text-center">Telemetry Stats</th>
                          <th className="p-5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {processedManagers.map(mgr => (
                          <tr key={mgr.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                            <td className="p-5 font-bold text-sm">{mgr.name}</td>
                            <td className="p-5 font-mono text-xs text-[#00DDDD]">{mgr.admin_code}</td>
                            <td className="p-5 font-mono text-xs opacity-70">
                              <span className="px-2 py-1 rounded bg-white/5 border border-white/5">{mgr.assigned_class}</span>
                            </td>
                            <td className="p-5 text-center font-mono text-xs">
                              <span className="font-bold text-white">{mgr.employee_quota || 0}</span> seats
                            </td>
                            <td className="p-5 text-center">
                              <button
                                onClick={() => handleViewManagerStats(mgr)}
                                className="px-3.5 py-1.5 border border-white/5 hover:border-orange-500/30 bg-white/5 hover:bg-orange-500/10 text-orange-400 text-[9px] font-mono uppercase tracking-widest rounded-xl transition-all"
                              >
                                Telemetry Link
                              </button>
                            </td>
                            <td className="p-5 text-right flex items-center justify-end gap-2.5">
                              <button
                                onClick={() => handleOpenEditQuota(mgr)}
                                className="px-3 py-1.5 border border-white/5 hover:border-white/20 bg-white/5 text-white/70 hover:text-white text-[9px] font-mono uppercase tracking-widest rounded-xl transition-all"
                              >
                                Edit Quota
                              </button>
                              <button
                                onClick={() => handleDeleteManagerConfirm(mgr)}
                                className="p-2 border border-red-500/10 bg-red-500/5 hover:bg-red-500 text-red-500 hover:text-black rounded-xl transition-all duration-300"
                                title="Decommission Node"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
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

          {/* TAB 3: BROADCASTS PORTAL */}
          {activeTab === "broadcast" && (
            <motion.div
              key="broadcast"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8"
            >
              {/* Left Form */}
              <div className="lg:col-span-5 border border-white/5 p-8 rounded-[3rem] bg-white/[0.01]">
                <h3 className="text-xs font-display font-black uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                  <Send className="h-4 w-4 text-orange-400" /> Transmit Priority Broadcast
                </h3>

                <form onSubmit={handleAnnouncementSubmit} className="space-y-5">
                  <div>
                    <label className="text-[9px] font-mono uppercase tracking-widest opacity-40">Broadcast Title</label>
                    <input
                      value={annTitle}
                      onChange={(e) => setAnnTitle(e.target.value)}
                      placeholder="e.g. System Protocol Upgrade"
                      className="w-full mt-1.5 p-3 text-xs font-mono border border-white/5 bg-white/5 rounded-2xl text-white placeholder:text-white/30 focus:outline-none focus:border-orange-500/50"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] font-mono uppercase tracking-widest opacity-40">Priority level</label>
                    <div className="flex gap-3 mt-1.5">
                      {[
                        { id: "standard", label: "STANDARD UPLINK", color: "border-orange-500/30 text-orange-400 bg-orange-500/10" },
                        { id: "high", label: "CRITICAL BROADCAST", color: "border-red-500/30 text-red-400 bg-red-500/10" }
                      ].map(prio => (
                        <button
                          key={prio.id}
                          type="button"
                          onClick={() => setAnnPriority(prio.id)}
                          className={`flex-1 py-3 border rounded-xl text-[9px] font-mono uppercase tracking-widest transition-all ${
                            annPriority === prio.id
                              ? `${prio.color} font-bold scale-[1.02]`
                              : "border-white/5 text-white/40 hover:bg-white/5"
                          }`}
                        >
                          {prio.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[9px] font-mono uppercase tracking-widest opacity-40">Target Audience</label>
                      <select
                        value={annTarget}
                        onChange={(e) => setAnnTarget(e.target.value)}
                        className="w-full mt-1.5 p-3 text-xs font-mono border border-white/5 bg-white/5 rounded-2xl text-white focus:outline-none"
                      >
                        <option value="all" className="bg-zinc-950">Transmit to All</option>
                        <option value="standard" className="bg-zinc-950">Standard Employees</option>
                        <option value="high" className="bg-zinc-950">High-Access Managers</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[9px] font-mono uppercase tracking-widest opacity-40">Upload resource file</label>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={(e) => setAnnFile(e.target.files ? e.target.files[0] : null)}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full mt-1.5 p-3 text-xs font-mono border border-dashed border-white/10 hover:border-orange-500/40 bg-white/5 rounded-2xl text-white/50 text-left truncate transition-all"
                      >
                        {annFile ? annFile.name : "Select attachment..."}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-[9px] font-mono uppercase tracking-widest opacity-40">Transmission Content</label>
                    <textarea
                      value={annContent}
                      onChange={(e) => setAnnContent(e.target.value)}
                      rows={5}
                      required
                      placeholder="Write broadcast details here..."
                      className="w-full mt-1.5 p-3 text-xs font-mono border border-white/5 bg-white/5 rounded-2xl text-white placeholder:text-white/30 focus:outline-none focus:border-orange-500/50 resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isActionLoading}
                    className="w-full py-3 bg-orange-500 hover:scale-[1.02] text-black text-[10px] font-mono uppercase tracking-[0.3em] font-bold rounded-2xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isActionLoading ? "TRANSMITTING..." : "INITIATE TRANSMISSION"}
                  </button>
                </form>
              </div>

              {/* Right List */}
              <div className="lg:col-span-7 border border-white/5 p-8 rounded-[3rem] bg-white/[0.01]">
                <h3 className="text-xs font-display font-black uppercase tracking-[0.2em] mb-6">Uplink Broadcast Logs</h3>
                
                {isAnnouncementsLoading ? (
                  <div className="py-20 text-center text-[10px] font-mono uppercase opacity-40 animate-pulse">Syncing logs...</div>
                ) : announcements.length === 0 ? (
                  <div className="py-20 text-center text-[10px] font-mono uppercase opacity-40">No records found</div>
                ) : (
                  <div className="space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
                    {announcements.map(ann => (
                      <div key={ann.id} className="p-5 rounded-3xl bg-white/5 border border-white/5">
                        <div className="flex items-center justify-between mb-3">
                          <span className={`text-[8px] font-mono px-2 py-0.5 rounded-full uppercase tracking-widest ${
                            ann.priority === 'high' ? 'bg-red-500/20 text-red-400 border border-red-500/20' : 'bg-orange-500/20 text-orange-400 border border-orange-500/20'
                          }`}>{ann.priority}</span>
                          <span className="text-[9px] font-mono text-white/30">{new Date(ann.created_at).toLocaleString()}</span>
                        </div>
                        <h4 className="text-sm font-bold text-white mb-2">{ann.title}</h4>
                        <p className="text-xs text-white/60 leading-relaxed whitespace-pre-line mb-3">{ann.content}</p>
                        
                        {ann.attachment_url && (
                          <div className="pt-3 border-t border-white/5 flex justify-between items-center">
                            <span className="text-[8px] font-mono text-white/30 uppercase tracking-widest truncate max-w-[200px]">Attached payload</span>
                            <a
                              href={ann.attachment_url}
                              target="_blank"
                              rel="noreferrer"
                              className="px-3 py-1 border border-white/5 hover:border-orange-500/30 bg-white/5 text-orange-400 hover:text-orange-300 text-[8px] font-mono uppercase tracking-widest rounded-lg flex items-center gap-1 transition-all"
                            >
                              <Download className="h-3 w-3" /> Fetch Resource
                            </a>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* TAB 4: UNIFIED EMPLOYEE DATABASE */}
          {activeTab === "employees" && (
            <motion.div
              key="employees"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-8"
            >
              {/* Search bar */}
              <div className="relative max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 opacity-30" />
                <input
                  value={employeesSearch}
                  onChange={(e) => { setEmployeesSearch(e.target.value); setEmployeesPage(1); }}
                  placeholder="Search employees by name, roll no, department class..."
                  className="w-full pl-10 pr-4 py-2.5 text-xs font-mono rounded-2xl border border-white/5 bg-white/5 text-white placeholder:text-white/30 focus:outline-none focus:border-orange-500/50"
                />
              </div>

              {/* Table */}
              <div className="border border-white/5 rounded-[2rem] bg-white/[0.01] overflow-hidden">
                <div className="p-6 border-b border-white/5 flex items-center justify-between">
                  <h3 className="text-xs font-display font-black uppercase tracking-[0.2em]">Active Employee registry</h3>
                  <span className="text-[10px] font-mono text-white/40">{processedEmployees.length} total entries</span>
                </div>

                {isEmployeesLoading ? (
                  <div className="py-20 text-center text-[10px] font-mono uppercase opacity-40 animate-pulse">Syncing database...</div>
                ) : processedEmployees.length === 0 ? (
                  <div className="py-20 text-center text-[10px] font-mono uppercase opacity-40">No employee records in registry</div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b border-white/5 text-[9px] font-mono uppercase tracking-widest text-white/40">
                            <th className="p-5 text-left">Employee Name</th>
                            <th className="p-5 text-left">Employee ID (Roll No)</th>
                            <th className="p-5 text-left">Mobile Number</th>
                            <th className="p-5 text-left">Designation Class</th>
                            <th className="p-5 text-center">Accuracy Score</th>
                            <th className="p-5 text-right">Enrolled Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {visibleEmployees.map(emp => (
                            <tr key={emp.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                              <td className="p-5 font-bold text-sm">{emp.name}</td>
                              <td className="p-5 font-mono text-xs text-orange-400">{emp.roll_no}</td>
                              <td className="p-5 font-mono text-xs opacity-75">{emp.mobile_number || "-"}</td>
                              <td className="p-5 font-mono text-xs opacity-70">
                                <span className="px-2 py-0.5 rounded bg-white/5 border border-white/5">{emp.assigned_class || "unassigned"}</span>
                              </td>
                              <td className="p-5 text-center font-mono text-xs font-bold text-emerald-400">{emp.total_score || 0}%</td>
                              <td className="p-5 text-right font-mono text-xs opacity-50">
                                {emp.created_at ? new Date(emp.created_at).toLocaleDateString() : "-"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination */}
                    <div className="p-4 flex items-center justify-between border-t border-white/5">
                      <div className="text-[10px] font-mono text-white/40">Page {employeesPage} / {employeesTotalPages || 1}</div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setEmployeesPage(p => Math.max(1, p - 1))}
                          disabled={employeesPage === 1}
                          className="px-3 py-1.5 rounded-lg border border-white/5 hover:bg-white/5 text-[10px] font-mono disabled:opacity-30"
                        >
                          Prev
                        </button>
                        <button
                          onClick={() => setEmployeesPage(p => Math.min(employeesTotalPages, p + 1))}
                          disabled={employeesPage === employeesTotalPages}
                          className="px-3 py-1.5 rounded-lg border border-white/5 hover:bg-white/5 text-[10px] font-mono disabled:opacity-30"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* ─── CREATION MODAL ─── */}
      {showCreateManagerModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/70 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative w-full max-w-md border border-white/10 p-6 rounded-[2.5rem] bg-[#0c0c0c] text-white"
          >
            <button
              onClick={() => setShowCreateManagerModal(false)}
              className="absolute top-4 right-4 p-2 rounded-xl transition-all opacity-40 hover:opacity-100 hover:bg-white/5"
            >
              <X className="h-4 w-4" />
            </button>

            <h2 className="text-lg font-display font-black uppercase tracking-tight mb-6 flex items-center gap-2">
              <Plus className="h-5 w-5 text-orange-400" /> Commission Manager Node
            </h2>

            <form onSubmit={handleCreateManagerSubmit} className="space-y-4">
              <div>
                <label className="text-[9px] font-mono uppercase tracking-widest opacity-40">Manager Name</label>
                <input
                  value={newManagerName}
                  onChange={(e) => setNewManagerName(e.target.value)}
                  required
                  placeholder="e.g. Vikramaditya Sharma"
                  className="w-full mt-1 p-3 text-xs font-mono border border-white/5 bg-white/5 rounded-2xl text-white focus:outline-none focus:border-orange-500/50"
                />
              </div>

              <div>
                <label className="text-[9px] font-mono uppercase tracking-widest opacity-40">Uplink Email ID</label>
                <input
                  type="email"
                  value={newManagerEmail}
                  onChange={(e) => setNewManagerEmail(e.target.value)}
                  placeholder="manager@enterprise.com"
                  className="w-full mt-1 p-3 text-xs font-mono border border-white/5 bg-white/5 rounded-2xl text-white focus:outline-none focus:border-orange-500/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[9px] font-mono uppercase tracking-widest opacity-40">Assign Code (Login ID)</label>
                  <input
                    value={newManagerAdminCode}
                    onChange={(e) => setNewManagerAdminCode(e.target.value.toUpperCase())}
                    required
                    className="w-full mt-1 p-3 text-xs font-mono border border-white/5 bg-white/5 rounded-2xl text-white focus:outline-none focus:border-orange-500/50"
                  />
                </div>

                <div>
                  <label className="text-[9px] font-mono uppercase tracking-widest opacity-40">Assign Password</label>
                  <input
                    type="password"
                    value={newManagerPassword}
                    onChange={(e) => setNewManagerPassword(e.target.value)}
                    required
                    className="w-full mt-1 p-3 text-xs font-mono border border-white/5 bg-white/5 rounded-2xl text-white focus:outline-none focus:border-orange-500/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[9px] font-mono uppercase tracking-widest opacity-40">Classification Node</label>
                  <input
                    value={newManagerClass}
                    onChange={(e) => setNewManagerClass(e.target.value)}
                    required
                    className="w-full mt-1 p-3 text-xs font-mono border border-white/5 bg-white/5 rounded-2xl text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[9px] font-mono uppercase tracking-widest opacity-40">Seats Quota Limit</label>
                  <input
                    type="number"
                    min={1}
                    max={1000}
                    value={newManagerQuota}
                    onChange={(e) => setNewManagerQuota(Math.max(1, parseInt(e.target.value) || 10))}
                    className="w-full mt-1 p-3 text-xs font-mono border border-white/5 bg-white/5 rounded-2xl text-white focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isActionLoading}
                className="w-full mt-2 py-3 bg-orange-500 hover:scale-[1.02] text-black text-[10px] font-mono uppercase tracking-[0.3em] font-bold rounded-2xl transition-all disabled:opacity-50"
              >
                {isActionLoading ? "COMMISSIONING..." : "COMMISSION ACTIVE NODE"}
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {/* ─── EDIT QUOTA MODAL ─── */}
      {editingQuotaManager && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/70 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative w-full max-w-sm border border-white/10 p-6 rounded-[2.5rem] bg-[#0c0c0c] text-white"
          >
            <button
              onClick={() => setEditingQuotaManager(null)}
              className="absolute top-4 right-4 p-2 rounded-xl transition-all opacity-40 hover:opacity-100 hover:bg-white/5"
            >
              <X className="h-4 w-4" />
            </button>

            <h2 className="text-md font-display font-black uppercase tracking-tight mb-4 text-orange-400">
              Update Seat Quota Limit
            </h2>
            <p className="text-[10px] font-mono text-white/50 mb-6 uppercase">
              Modify operational threshold for node "{editingQuotaManager.name}"
            </p>

            <div className="space-y-4">
              <div>
                <label className="text-[9px] font-mono uppercase tracking-widest opacity-40">Seat Count (Limit)</label>
                <input
                  type="number"
                  min={1}
                  max={5000}
                  value={newQuotaValue}
                  onChange={(e) => setNewQuotaValue(Math.max(1, parseInt(e.target.value) || 10))}
                  className="w-full mt-1.5 p-3 text-sm font-mono border border-white/5 bg-white/5 rounded-2xl text-white focus:outline-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingQuotaManager(null)}
                  className="flex-1 py-3 border border-white/5 text-[9px] font-mono uppercase tracking-widest hover:bg-white/5 transition-all rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleUpdateQuotaSubmit}
                  disabled={isActionLoading}
                  className="flex-1 py-3 bg-[#00DDDD] text-black font-bold text-[9px] font-mono uppercase tracking-widest hover:scale-[1.02] transition-all rounded-xl disabled:opacity-50"
                >
                  {isActionLoading ? "UPDATING..." : "SAVE LIMITS"}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* ─── MANAGER METRICS DRAWER / DIALOG ─── */}
      {selectedManagerStats && (
        <div className="fixed inset-0 z-[200] flex items-center justify-end bg-black/70 backdrop-blur-sm">
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="w-full max-w-lg h-full border-l border-white/10 p-8 bg-[#0b0b0b] text-white flex flex-col justify-between overflow-y-auto"
          >
            <div>
              <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-6">
                <div>
                  <h2 className="text-md font-display font-black uppercase tracking-tight text-orange-400">
                    Telemetry Uplink Metrics
                  </h2>
                  <p className="text-[9px] font-mono text-white/40 uppercase mt-0.5">
                    Live logs: Node {selectedManagerStats.mgr.admin_code}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedManagerStats(null)}
                  className="p-2 border border-white/5 rounded-xl hover:bg-white/5 transition-all"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {isLoadingManagerStats ? (
                <div className="py-20 text-center text-[10px] font-mono uppercase opacity-40 animate-pulse">Downloading cluster metrics...</div>
              ) : (
                <div className="space-y-6">
                  {/* Health Uptime Row */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                      <span className="text-[8px] font-mono text-white/30 uppercase tracking-widest block">Handshake Health</span>
                      <span className="text-sm font-bold text-emerald-400 flex items-center gap-1.5 mt-1">
                        <Activity className="h-3.5 w-3.5 animate-pulse" /> {selectedManagerStats.health?.index || "100% OK"}
                      </span>
                    </div>

                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                      <span className="text-[8px] font-mono text-white/30 uppercase tracking-widest block">Handshake Uptime</span>
                      <span className="text-sm font-bold text-[#00DDDD] flex items-center gap-1.5 mt-1">
                        <Zap className="h-3.5 w-3.5" /> {selectedManagerStats.health?.uptime || "99.9% Uptime"}
                      </span>
                    </div>
                  </div>

                  {/* Quota details */}
                  <div className="p-5 rounded-2xl bg-white/5 border border-white/5 space-y-3">
                    <h3 className="text-[9px] font-mono uppercase tracking-widest text-[#00DDDD] font-bold">Node Seat Quota Details</h3>
                    <div className="space-y-2 text-[11px] font-mono text-white/60">
                      <div className="flex justify-between">
                        <span>Current Occupied:</span>
                        <span className="text-white font-bold">{selectedManagerStats.quota?.current || 0} seats</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Allotted Seats Threshold:</span>
                        <span className="text-white font-bold">{selectedManagerStats.quota?.threshold || 0} seats</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Operational Utilization:</span>
                        <span className="text-orange-400 font-bold">{selectedManagerStats.quota?.utilization || "0.0%"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Recent growth / stability */}
                  <div className="grid grid-cols-2 gap-4 text-[10px] font-mono">
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                      <span className="text-white/40 block mb-1">MTD GROWTH</span>
                      <span className="text-xs font-bold text-white">{selectedManagerStats.growth?.mtd_growth || "0.0%"}</span>
                    </div>
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                      <span className="text-white/40 block mb-1">STABILITY STATUS</span>
                      <span className="text-xs font-bold text-white uppercase">{selectedManagerStats.stability?.status || "Stable"}</span>
                    </div>
                  </div>

                  {/* Event Log list */}
                  <div className="space-y-3">
                    <h3 className="text-[9px] font-mono uppercase tracking-widest text-orange-400 font-bold">Node Action Handshake Logs</h3>
                    <div className="space-y-2.5 max-h-[180px] overflow-y-auto custom-scrollbar pr-2 text-[10px] font-mono">
                      {!selectedManagerStats.logs || selectedManagerStats.logs.length === 0 ? (
                        <div className="py-4 text-center text-white/30 uppercase">No active handshake logs</div>
                      ) : (
                        selectedManagerStats.logs.map((log: any, index: number) => (
                          <div key={index} className="p-3 bg-white/[0.02] border border-white/5 rounded-xl flex items-start justify-between gap-3">
                            <div>
                              <span className="text-white font-bold block">{log.action}</span>
                              <span className="text-white/30 block text-[9px] mt-0.5">{log.type}</span>
                            </div>
                            <span className="text-white/30 text-[8px] mt-0.5 shrink-0">
                              {new Date(log.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => setSelectedManagerStats(null)}
              className="w-full mt-8 py-3.5 bg-orange-500 text-black text-[10px] font-mono uppercase tracking-[0.2em] font-bold rounded-2xl hover:scale-[1.01] transition-all"
            >
              Terminate Metrics Link
            </button>
          </motion.div>
        </div>
      )}
    </div>
  )
}
