"use client"

import React, { useState, useEffect, useMemo, useRef } from "react"
import {
  Bell, Users, User, Mail, Plus, Trash2, Edit2, Upload, Search, FileText, Activity,
  RefreshCw, LogOut, CheckCircle2, X, Cpu, TrendingUp, ShieldCheck, Database, Zap,
  Briefcase, Award, BarChart3, Clock, AlertTriangle, ArrowUpRight, Download,
  Sun, Moon
} from "lucide-react"
import { useTheme } from "@/lib/theme-context"
import { removeApiKey, getApiKey } from "@/lib/auth"
import {
  getEnterpriseStats, getEnterpriseEmployees, createEnterpriseEmployee,
  uploadEnterpriseEmployeesBulk, getEnterpriseEmployeeStats, updateEnterpriseEmployee,
  deleteEnterpriseEmployee, getEnterpriseAnnouncements, EnterpriseEmployee,
  EnterpriseAnnouncement, EnterpriseStatsResponse, EmployeeStatsResponse
} from "@/lib/chat-api"
import { getLocalEmployees, addLocalEmployee, updateLocalEmployee, removeLocalEmployee } from "@/lib/employee-store"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"

export default function EnterpriseManagerPage() {
  const { isDarkMode, toggleTheme } = useTheme()
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  
  // Tab control
  const [activeTab, setActiveTab] = useState<"dashboard" | "employees" | "bulk" | "broadcast">("dashboard")
  
  // Data States
  const [stats, setStats] = useState<EnterpriseStatsResponse | null>(null)
  const [employees, setEmployees] = useState<EnterpriseEmployee[]>([])
  const [announcements, setAnnouncements] = useState<EnterpriseAnnouncement[]>([])

  // Search & Pagination States
  const [employeesSearch, setEmployeesSearch] = useState("")
  const [employeesPage, setEmployeesPage] = useState(1)
  const [employeesRowsPerPage, setEmployeesRowsPerPage] = useState(10)

  // Loading States
  const [isStatsLoading, setIsStatsLoading] = useState(false)
  const [isEmployeesLoading, setIsEmployeesLoading] = useState(false)
  const [isAnnouncementsLoading, setIsAnnouncementsLoading] = useState(false)
  const [isActionLoading, setIsActionLoading] = useState(false)

  // Single Employee Creation Form States
  const [showCreateEmpModal, setShowCreateEmpModal] = useState(false)
  const [empName, setEmpName] = useState("")
  const [empRollNo, setEmpRollNo] = useState("")
  const [empMobile, setEmpMobile] = useState("")
  const [empPassword, setEmpPassword] = useState("")
  const [empClass, setEmpClass] = useState("DEVELOPMENT-NODE")

  // Edit Employee States
  const [editingEmployee, setEditingEmployee] = useState<EnterpriseEmployee | null>(null)
  const [editName, setEditName] = useState("")
  const [editClass, setEditClass] = useState("")

  // Bulk Upload States
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadResult, setUploadResult] = useState<{
    processed: number
    added: number
    failed: number
    errors: string[]
  } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Deep Profile Inspector States
  const [inspectorEmployeeId, setInspectorEmployeeId] = useState<string | null>(null)
  const [inspectorStats, setInspectorStats] = useState<EmployeeStatsResponse | null>(null)
  const [isInspectorLoading, setIsInspectorLoading] = useState(false)

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
        if (res.enterprise_code) {
          setEmpClass(res.enterprise_code)
        }
      }
    } catch (e: any) {
      // Stats unavailable for manager role — silently handled
    } finally {
      setIsStatsLoading(false)
    }
  }

  const fetchEmployees = async () => {
    setIsEmployeesLoading(true)
    try {
      const res = await getEnterpriseEmployees()
      if (res.success) {
        const localEmps = getLocalEmployees()
        setEmployees([...(res.employees || []), ...localEmps])
      }
    } catch (e: any) {
      const localEmps = getLocalEmployees()
      setEmployees(localEmps)
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
      // Announcements unavailable for manager role — silently handled
    } finally {
      setIsAnnouncementsLoading(false)
    }
  }

  // ─── SINGLE EMPLOYEE CRUD ───
  const handleCreateEmployeeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!empName.trim() || !empRollNo.trim() || !empMobile.trim() || !empPassword.trim()) {
      toast.error("All fields are required")
      return
    }

    if (!empClass.trim()) {
      toast.error("Department / Class is required")
      return
    }

    setIsActionLoading(true)
    try {
      await createEnterpriseEmployee({
        name: empName.trim(),
        roll_no: empRollNo.trim(),
        mobile_number: empMobile.trim(),
        password: empPassword.trim(),
        assigned_class: empClass.trim(),
      })
      const newLocalEmp = addLocalEmployee({
        name: empName.trim(),
        roll_no: empRollNo.trim(),
        mobile_number: empMobile.trim() || empRollNo.trim(),
        assigned_class: empClass.trim(),
      })
      setEmployees(prev => [...prev, newLocalEmp])
      toast.success("Employee onboarded successfully!")
      setShowCreateEmpModal(false)
      setEmpName("")
      setEmpRollNo("")
      setEmpMobile("")
      setEmpPassword("")
      setEmpClass(stats?.enterprise_code || "DEVELOPMENT-NODE")
    } catch (err: any) {
      toast.error(err.message || "Failed to onboard employee")
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleOpenEditEmployee = (emp: EnterpriseEmployee) => {
    setEditingEmployee(emp)
    setEditName(emp.name)
    setEditClass(emp.assigned_class || "")
  }

  const handleEditEmployeeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingEmployee) return

    setIsActionLoading(true)
    const isLocal = 'isLocal' in editingEmployee && (editingEmployee as any).isLocal
    try {
      if (isLocal) {
        updateLocalEmployee(editingEmployee.id, {
          name: editName.trim(),
          assigned_class: editClass.trim() || undefined
        })
        setEmployees(prev => prev.map(e =>
          e.id === editingEmployee.id
            ? { ...e, name: editName.trim(), assigned_class: editClass.trim() }
            : e
        ))
      } else {
        await updateEnterpriseEmployee(editingEmployee.id, {
          name: editName.trim(),
          assigned_class: editClass.trim() || undefined
        })
        fetchEmployees()
      }
      toast.success(`Updated details for employee ${editName}`)
      setEditingEmployee(null)
    } catch (err: any) {
      toast.error(err.message || "Failed to update employee details")
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleDeleteEmployeeConfirm = async (emp: EnterpriseEmployee) => {
    if (confirm(`Are you sure you want to delete employee "${emp.name}" (ID: ${emp.roll_no})? All their scores and statistics will be permanently cleared.`)) {
      setIsActionLoading(true)
      const isLocal = 'isLocal' in emp && (emp as any).isLocal
      try {
        if (isLocal) {
          removeLocalEmployee(emp.id)
          setEmployees(prev => prev.filter(e => e.id !== emp.id))
        } else {
          await deleteEnterpriseEmployee(emp.id)
          fetchEmployees()
        }
        toast.success(`Removed employee "${emp.name}" from database`)
      } catch (err: any) {
        toast.error(err.message || "Failed to delete employee")
      } finally {
        setIsActionLoading(false)
      }
    }
  }

  // ─── BULK EXCEL UPLOADER ───
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0])
      setUploadResult(null)
    }
  }

  const handleFileSelectChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
      setUploadResult(null)
    }
  }

  const handleBulkUploadSubmit = async () => {
    if (!selectedFile) return
    setIsActionLoading(true)
    setUploadResult(null)
    try {
      const res = await uploadEnterpriseEmployeesBulk(selectedFile)
      toast.success("Excel sheet parsed successfully!")
      setUploadResult(res)
      setSelectedFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ""
      fetchEmployees()
      fetchStats()
    } catch (err: any) {
      toast.error("Bulk upload unavailable for manager role. Please use 'Onboard Employee' to add employees individually.")
    } finally {
      setIsActionLoading(false)
    }
  }

  // ─── DEEP PROFILE INSPECTOR ───
  const handleOpenInspector = async (emp: EnterpriseEmployee) => {
    const isLocal = 'isLocal' in emp && (emp as any).isLocal
    if (isLocal) {
      toast.error("Deep Inspector is unavailable for newly onboarded employees. Stats will appear once the employee starts activities.")
      return
    }
    setInspectorEmployeeId(emp.id)
    setInspectorStats(null)
    setIsInspectorLoading(true)
    try {
      const data = await getEnterpriseEmployeeStats(emp.id)
      if (data.success) {
        setInspectorStats(data)
      }
    } catch (e: any) {
      toast.error("Failed to fetch employee intelligence summary")
      setInspectorEmployeeId(null)
    } finally {
      setIsInspectorLoading(false)
    }
  }

  // ─── SEARCH & FILTER PROCESSORS ───
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

  // Quota percentage calculations
  const quotaUsedPercent = useMemo(() => {
    if (!stats || !stats.total_quota_assigned) return 0
    return Math.min(Math.round(((stats.total_employees || 0) / stats.total_quota_assigned) * 100), 100)
  }, [stats])

  if (isAuthenticated === null) {
    return (
      <div className={`min-h-screen flex items-center justify-center font-mono transition-colors duration-300 ${
        isDarkMode ? "bg-[#050505] text-white" : "bg-[#f8f9fa] text-black"
      }`}>
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="h-8 w-8 text-[#00DDDD] animate-spin" />
          <span className="text-[10px] uppercase tracking-[0.4em] opacity-40">Syncing node key...</span>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen font-sans selection:bg-[#00DDDD] selection:text-black relative overflow-x-hidden pb-12 transition-colors duration-300 ${
      isDarkMode ? "bg-[#050505] text-white" : "bg-[#f8f9fa] text-black"
    }`}>
      <div className={`absolute inset-0 pointer-events-none transition-colors duration-300 ${
        isDarkMode ? "bg-[radial-gradient(ellipse_at_top_right,rgba(0,221,221,0.02),transparent_50%)]" : ""
      }`} />
      <div className={`absolute inset-0 bg-[size:100px_100px] pointer-events-none transition-opacity duration-300 ${
        isDarkMode ? "bg-[linear-gradient(rgba(255,255,255,0.005)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.005)_1px,transparent_1px)]" : "opacity-0"
      }`} />

      {/* NAVBAR */}
      <nav className={`h-20 flex items-center justify-between px-6 md:px-12 border-b sticky top-0 z-[100] transition-colors duration-300 ${
        isDarkMode ? "border-white/5 bg-black/50 backdrop-blur-2xl" : "border-black/5 bg-white/80 backdrop-blur-2xl shadow-sm"
      }`}>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-[#00DDDD]/20 border border-[#00DDDD]/30 flex items-center justify-center">
            <Users className="h-5 w-5 text-[#00DDDD]" />
          </div>
          <div>
            <h1 className="text-sm font-display font-black tracking-widest uppercase">
              {stats?.enterprise_name || "Manager Panel"}
            </h1>
            <p className="text-[8px] font-mono tracking-widest text-orange-400 uppercase">
              Operational Cluster Node // {stats?.enterprise_code || "MANAGER-NODE"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={toggleTheme}
            className={`h-10 w-10 border rounded-2xl flex items-center justify-center transition-all ${isDarkMode ? "border-white/5 hover:border-white/10 hover:bg-white/5" : "border-black/5 hover:border-black/10 hover:bg-black/5"}`}
            title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDarkMode ? <Sun className="h-4 w-4 opacity-40" /> : <Moon className="h-4 w-4 opacity-40" />}
          </button>

          <button
            onClick={fetchAllData}
            className={`h-10 w-10 border rounded-2xl flex items-center justify-center transition-all group ${isDarkMode ? "border-white/5 hover:border-white/10 hover:bg-white/5" : "border-black/5 hover:border-black/10 hover:bg-black/5"}`}
            title="Refresh Registry"
          >
            <RefreshCw className={`h-4 w-4 opacity-40 group-hover:opacity-100 group-hover:rotate-180 transition-all duration-500 ${isDarkMode ? "" : "text-black"}`} />
          </button>
          
          <div className={`h-8 w-[1px] ${isDarkMode ? "bg-white/15" : "bg-black/15"}`} />

          <button
            onClick={handleLogout}
            className="px-4 py-2 border border-red-500/30 bg-red-500/10 hover:bg-red-500 hover:text-black rounded-2xl text-[9px] font-mono uppercase tracking-[0.2em] font-bold transition-all flex items-center gap-2 text-red-400 hover:border-red-500"
          >
            <LogOut className="h-3.5 w-3.5" />
            Logout
          </button>
        </div>
      </nav>

      {/* TABS */}
      <div className="max-w-[1600px] mx-auto px-6 md:px-12 mt-8">
        <div className={`flex items-center gap-3 border-b pb-4 transition-colors duration-300 ${
          isDarkMode ? "border-white/5" : "border-black/5"
        }`}>
          {[
            { id: "dashboard", label: "Overview", icon: Cpu },
            { id: "employees", label: "Employees Roster", icon: Users },
            { id: "bulk", label: "Excel Upload", icon: Upload },
            { id: "broadcast", label: "Announcements", icon: Bell }
          ].map(tab => {
            const Icon = tab.icon
            const active = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2.5 px-6 py-3 rounded-2xl text-[10px] font-mono uppercase tracking-[0.2em] transition-all ${
                  active
                    ? "bg-gradient-to-r from-[#00DDDD]/20 to-[#00DDDD]/10 border border-[#00DDDD]/30 text-[#00DDDD] font-bold"
                    : "border border-transparent hover:border-white/5 text-white/50 hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${active ? "text-[#00DDDD]" : "text-white/40"}`} />
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* CONTENT */}
      <main className="max-w-[1600px] mx-auto px-6 md:px-12 mt-8">
        <AnimatePresence mode="wait">
          {/* TAB 1: OVERVIEW */}
          {activeTab === "dashboard" && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8"
            >
              {/* Left Column: Department Head Analytics */}
              <div className="lg:col-span-8 space-y-8">
                {/* Analytics Ring & Stats */}
                <div className="border border-white/5 p-8 rounded-[3rem] bg-white/[0.01] backdrop-blur-3xl relative overflow-hidden flex flex-col md:flex-row items-center justify-around gap-8">
                  {/* Quota ring */}
                  <div className="flex flex-col items-center gap-4">
                    <div className="relative h-44 w-44">
                      <svg className="transform -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="42" stroke="rgba(255,255,255,0.03)" strokeWidth="6" fill="none" />
                        <circle
                          cx="50"
                          cy="50"
                          r="42"
                          stroke="#00DDDD"
                          strokeWidth="6"
                          fill="none"
                          strokeDasharray={`${quotaUsedPercent * 2.63} 263`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-3xl font-display font-black text-white">{quotaUsedPercent}%</span>
                        <span className="text-[7px] font-mono uppercase tracking-widest text-[#00DDDD] mt-1 font-bold">Quota Used</span>
                      </div>
                    </div>
                  </div>

                  {/* Quota Stats details */}
                  <div className="space-y-4 max-w-sm flex-1">
                    <div>
                      <span className="text-[8px] font-mono uppercase tracking-[0.2em] opacity-40">DEPARTMENT CLUSTER SCALE</span>
                      <h2 className="text-xl font-display font-black tracking-tight text-[#00DDDD] mt-1">Operational Seats Allocated</h2>
                    </div>

                    <div className="space-y-2 text-xs font-mono text-white/60">
                      <div className="flex justify-between py-1 border-b border-white/5">
                        <span>Current Occupied:</span>
                        <span className="text-white font-bold">{stats?.total_employees || 0} employees</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-white/5">
                        <span>Assigned Limit:</span>
                        <span className="text-white font-bold">{stats?.total_quota_assigned || 0} seats</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-white/5">
                        <span>Efficiency Rating:</span>
                        <span className="text-orange-400 font-bold">{stats?.token_economy?.efficiency || "100.0%"}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Engagement grid & classification */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="border border-white/5 p-6 rounded-3xl bg-white/[0.01]">
                    <div className="flex items-center justify-between mb-3 text-white/40">
                      <span className="text-[8px] font-mono uppercase tracking-widest">Global engagement</span>
                      <Activity className="h-4 w-4 text-[#00DDDD] animate-pulse" />
                    </div>
                    <h3 className="text-xl font-display font-black tracking-tight text-white">{stats?.global_engagement || "Active"}</h3>
                    <p className="text-[9px] font-mono text-white/30 uppercase mt-1">Node network integrity</p>
                  </div>

                  <div className="border border-white/5 p-6 rounded-3xl bg-white/[0.01]">
                    <div className="flex items-center justify-between mb-3 text-white/40">
                      <span className="text-[8px] font-mono uppercase tracking-widest">Monthly computational burn</span>
                      <Cpu className="h-4 w-4 text-orange-400" />
                    </div>
                    <h3 className="text-xl font-display font-black tracking-tight text-white">{stats?.token_economy?.monthly_burn || "0 M"}</h3>
                    <p className="text-[9px] font-mono text-white/30 uppercase mt-1">AI core usage bandwidth</p>
                  </div>

                  <div className="border border-white/5 p-6 rounded-3xl bg-white/[0.01]">
                    <div className="flex items-center justify-between mb-3 text-white/40">
                      <span className="text-[8px] font-mono uppercase tracking-widest">Allocated class</span>
                      <ShieldCheck className="h-4 w-4 text-emerald-400" />
                    </div>
                    <h3 className="text-xl font-display font-black tracking-tight text-white truncate">{stats?.enterprise_code || "B2B-SECURE"}</h3>
                    <p className="text-[9px] font-mono text-white/30 uppercase mt-1">Cluster designation</p>
                  </div>
                </div>
              </div>

              {/* Right Column: Broadcast Alerts feed */}
              <div className="lg:col-span-4 border border-white/5 p-8 rounded-[3rem] bg-white/[0.01] flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-display font-black uppercase tracking-[0.2em] mb-6 flex items-center justify-between">
                    <span>Priority Bulletins</span>
                    <AlertTriangle className="h-4 w-4 text-orange-400" />
                  </h3>
                  
                  {announcements.length === 0 ? (
                    <div className="text-center py-10 text-[10px] font-mono uppercase opacity-40">No notifications issued</div>
                  ) : (
                    <div className="space-y-4 max-h-[340px] overflow-y-auto custom-scrollbar pr-1">
                      {announcements.map(ann => (
                        <div key={ann.id} className="p-4 rounded-2xl bg-white/5 border border-white/5">
                          <div className="flex items-center justify-between mb-2">
                            <span className={`text-[7px] font-mono px-2 py-0.5 rounded-full uppercase tracking-widest ${
                              ann.priority === 'high' ? 'bg-red-500/20 text-red-400 border border-red-500/20' : 'bg-[#00DDDD]/20 text-[#00DDDD] border border-[#00DDDD]/20'
                            }`}>{ann.priority}</span>
                            <span className="text-[8px] font-mono text-white/30">{new Date(ann.created_at).toLocaleDateString()}</span>
                          </div>
                          <h4 className="text-xs font-bold text-white mb-1">{ann.title}</h4>
                          <p className="text-[10px] text-white/50 leading-relaxed line-clamp-3">{ann.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setActiveTab("broadcast")}
                  className="w-full mt-6 py-3 border border-[#00DDDD]/30 hover:border-[#00DDDD] bg-[#00DDDD]/10 hover:bg-[#00DDDD] hover:text-black transition-all duration-300 rounded-2xl text-[9px] font-mono uppercase tracking-[0.2em] font-bold flex items-center justify-center gap-2 text-[#00DDDD] hover:scale-[1.02]"
                >
                  View All Bulletins
                </button>
              </div>
            </motion.div>
          )}

          {/* TAB 2: EMPLOYEES ROSTER */}
          {activeTab === "employees" && (
            <motion.div
              key="employees"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              {/* Controls bar */}
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 opacity-30" />
                  <input
                    value={employeesSearch}
                    onChange={(e) => { setEmployeesSearch(e.target.value); setEmployeesPage(1); }}
                    placeholder="Search name, employee ID, designation..."
                    className="w-full pl-10 pr-4 py-2.5 text-xs font-mono rounded-2xl border border-white/5 bg-white/5 text-white placeholder:text-white/30 focus:outline-none focus:border-[#00DDDD]/50"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setActiveTab("bulk")}
                    className="px-5 py-2.5 border border-white/5 hover:border-white/15 hover:bg-white/5 text-[9px] font-mono uppercase tracking-[0.2em] font-bold rounded-2xl transition-all flex items-center gap-2"
                  >
                    <Upload className="h-4 w-4" /> Excel Roster
                  </button>
                  <button
                    onClick={() => setShowCreateEmpModal(true)}
                    className="px-5 py-2.5 bg-[#00DDDD] hover:scale-[1.02] text-black text-[9px] font-mono uppercase tracking-[0.2em] font-bold rounded-2xl transition-all flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4 stroke-[3px]" /> Onboard Employee
                  </button>
                </div>
              </div>

              {/* Roster table */}
              <div className="border border-white/5 rounded-[2rem] bg-white/[0.01] overflow-hidden">
                <div className="p-6 border-b border-white/5 flex items-center justify-between">
                  <h3 className="text-xs font-display font-black uppercase tracking-[0.2em]">Operational Node Registry</h3>
                  <span className="text-[10px] font-mono text-white/40">{processedEmployees.length} employees onboarded</span>
                </div>

                {isEmployeesLoading ? (
                  <div className="py-20 text-center text-[10px] font-mono uppercase opacity-40 animate-pulse">Establishing secure link...</div>
                ) : processedEmployees.length === 0 ? (
                  <div className="py-20 text-center text-[10px] font-mono uppercase opacity-40">No employees listed in node</div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b border-white/5 text-[9px] font-mono uppercase tracking-widest text-white/40">
                            <th className="p-5 text-left">Employee Name</th>
                            <th className="p-5 text-left">Employee ID</th>
                            <th className="p-5 text-left">Mobile Number</th>
                            <th className="p-5 text-left">Designation Code</th>
                            <th className="p-5 text-center">Score Index</th>
                            <th className="p-5 text-center">Inspector</th>
                            <th className="p-5 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {visibleEmployees.map(emp => (
                            <tr key={emp.id} className="border-b border-white/5 hover:bg-white/[0.01] transition-colors">
                              <td className="p-5 font-bold text-sm">{emp.name}</td>
                              <td className="p-5 font-mono text-xs text-[#00DDDD]">{emp.roll_no}</td>
                              <td className="p-5 font-mono text-xs opacity-75">{emp.mobile_number || "-"}</td>
                              <td className="p-5 font-mono text-xs opacity-70">
                                <span className="px-2 py-0.5 rounded bg-white/5 border border-white/5">{emp.assigned_class || "unassigned"}</span>
                              </td>
                              <td className="p-5 text-center font-mono text-xs font-bold text-emerald-400">
                                {emp.total_score || 0}%
                              </td>
                              <td className="p-5 text-center">
                                <button
                                  onClick={() => handleOpenInspector(emp)}
                                  className="px-3.5 py-1.5 border border-white/5 hover:border-[#00DDDD]/30 bg-white/5 hover:bg-[#00DDDD]/10 text-[#00DDDD] text-[9px] font-mono uppercase tracking-widest rounded-xl transition-all"
                                >
                                  Deep Inspector
                                </button>
                              </td>
                              <td className="p-5 text-right flex items-center justify-end gap-2.5">
                                <button
                                  onClick={() => handleOpenEditEmployee(emp)}
                                  className="p-2 border border-white/5 hover:border-white/20 bg-white/5 text-white/70 hover:text-white rounded-xl transition-all"
                                  title="Edit Employee"
                                >
                                  <Edit2 className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteEmployeeConfirm(emp)}
                                  className="p-2 border border-red-500/10 bg-red-500/5 hover:bg-red-500 text-red-500 hover:text-black rounded-xl transition-all duration-300"
                                  title="Delete Employee"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
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

          {/* TAB 3: EXCEL BULK UPLOADER */}
          {activeTab === "bulk" && (
            <motion.div
              key="bulk"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="max-w-2xl mx-auto space-y-8"
            >
              {/* Drag-drop box */}
              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className="border-2 border-dashed border-white/10 hover:border-[#00DDDD]/30 bg-white/[0.01] hover:bg-white/[0.02] p-10 rounded-[3rem] text-center transition-all cursor-pointer flex flex-col items-center gap-4 relative overflow-hidden"
              >
                <div className="h-16 w-16 rounded-full bg-[#00DDDD]/10 border border-[#00DDDD]/20 flex items-center justify-center text-[#00DDDD]">
                  <Upload className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Drag & drop employee register Excel sheet</h4>
                  <p className="text-[10px] font-mono text-white/40 uppercase mt-1">Supports standard .xlsx formatted roster logs</p>
                </div>

                <input
                  type="file"
                  accept=".xlsx, .xls"
                  ref={fileInputRef}
                  onChange={handleFileSelectChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl text-[9px] font-mono uppercase tracking-widest text-white transition-all mt-2"
                >
                  Browse Files
                </button>
              </div>

              {/* Upload file confirmation */}
              {selectedFile && (
                <div className="p-5 border border-white/5 rounded-3xl bg-white/[0.02] flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <FileText className="h-8 w-8 text-[#00DDDD]" />
                    <div>
                      <span className="text-xs font-bold block truncate max-w-xs">{selectedFile.name}</span>
                      <span className="text-[8px] font-mono text-white/30 uppercase mt-0.5">{(selectedFile.size / 1024).toFixed(1)} KB</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedFile(null)}
                      className="px-4 py-2 border border-white/5 hover:bg-white/5 text-[9px] font-mono uppercase tracking-widest rounded-xl transition-all"
                    >
                      Clear
                    </button>
                    <button
                      onClick={handleBulkUploadSubmit}
                      disabled={isActionLoading}
                      className="px-4 py-2 bg-[#00DDDD] text-black font-bold text-[9px] font-mono uppercase tracking-widest hover:scale-[1.02] transition-all rounded-xl disabled:opacity-50"
                    >
                      {isActionLoading ? "PARSING..." : "PARSE REGISTER"}
                    </button>
                  </div>
                </div>
              )}

              {/* Upload Feedback Result logs */}
              {uploadResult && (
                <div className="p-6 border border-white/5 rounded-[2rem] bg-white/[0.02] space-y-4">
                  <h3 className="text-xs font-display font-black uppercase tracking-[0.2em] text-[#00DDDD] flex items-center gap-2">
                    <CheckCircle2 className="h-4.5 w-4.5 text-emerald-400" /> Handshake Parsing Completed
                  </h3>

                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="p-3.5 bg-white/5 border border-white/5 rounded-2xl">
                      <span className="text-[8px] font-mono text-white/40 uppercase block">Processed</span>
                      <span className="text-lg font-bold text-white mt-1 block">{uploadResult.processed}</span>
                    </div>
                    <div className="p-3.5 bg-white/5 border border-white/5 rounded-2xl">
                      <span className="text-[8px] font-mono text-white/40 uppercase block text-emerald-400">Added</span>
                      <span className="text-lg font-bold text-emerald-400 mt-1 block">{uploadResult.added}</span>
                    </div>
                    <div className="p-3.5 bg-white/5 border border-white/5 rounded-2xl">
                      <span className="text-[8px] font-mono text-white/40 uppercase block text-red-400">Failed</span>
                      <span className="text-lg font-bold text-red-400 mt-1 block">{uploadResult.failed}</span>
                    </div>
                  </div>

                  {uploadResult.errors.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-white/5">
                      <span className="text-[8px] font-mono text-red-400 uppercase tracking-widest font-bold">Error Logs Stack:</span>
                      <div className="p-3 rounded-2xl bg-red-500/5 border border-red-500/10 max-h-36 overflow-y-auto custom-scrollbar text-[10px] font-mono text-red-400/80 space-y-1.5">
                        {uploadResult.errors.map((err, i) => (
                          <div key={i} className="flex gap-2 items-start">
                            <span className="opacity-40">[{i+1}]</span>
                            <p>{err}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {/* TAB 4: BULLETINS/BROADCAST FEED */}
          {activeTab === "broadcast" && (
            <motion.div
              key="broadcast"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="max-w-3xl mx-auto space-y-6"
            >
              <h3 className="text-xs font-display font-black uppercase tracking-[0.2em] mb-4">Uplink Bulletin Feed</h3>

              {isAnnouncementsLoading ? (
                <div className="py-20 text-center text-[10px] font-mono uppercase opacity-40 animate-pulse">Syncing satellite feed...</div>
              ) : announcements.length === 0 ? (
                <div className="py-20 text-center text-[10px] font-mono uppercase opacity-40">No operational bulletins transmitted</div>
              ) : (
                <div className="space-y-4">
                  {announcements.map(ann => (
                    <div key={ann.id} className="p-6 border border-white/5 rounded-3xl bg-white/[0.01] hover:border-[#00DDDD]/20 transition-all duration-300">
                      <div className="flex items-center justify-between mb-3.5">
                        <span className={`text-[8px] font-mono px-2 py-0.5 rounded-full uppercase tracking-widest ${
                          ann.priority === 'high' ? 'bg-red-500/20 text-red-400 border border-red-500/20' : 'bg-[#00DDDD]/20 text-[#00DDDD] border border-[#00DDDD]/20'
                        }`}>{ann.priority}</span>
                        <span className="text-[9px] font-mono text-white/30">{new Date(ann.created_at).toLocaleString()}</span>
                      </div>
                      <h4 className="text-sm font-bold text-white mb-2">{ann.title}</h4>
                      <p className="text-xs text-white/60 leading-relaxed whitespace-pre-line mb-3">{ann.content}</p>
                      
                      {ann.attachment_url && (
                        <div className="pt-3 border-t border-white/5 flex justify-between items-center">
                          <span className="text-[8px] font-mono text-white/30 uppercase tracking-widest">Resource file available</span>
                          <a
                            href={ann.attachment_url}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3.5 py-1.5 border border-white/5 hover:border-[#00DDDD]/30 bg-white/5 text-[#00DDDD] hover:text-[#00DDDD] text-[8px] font-mono uppercase tracking-widest rounded-lg flex items-center gap-1 transition-all"
                          >
                            <Download className="h-3 w-3" /> Fetch Resource
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* ─── CREATION MODAL ─── */}
      {showCreateEmpModal && (
        <div className={`fixed inset-0 z-[200] flex items-center justify-center p-6 transition-colors duration-300 ${
          isDarkMode ? "bg-black/70" : "bg-white/80"
        } backdrop-blur-sm`}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`relative w-full max-w-md border p-6 rounded-[2.5rem] transition-colors duration-300 ${
              isDarkMode ? "border-white/10 bg-[#0a0a0a] text-white" : "border-black/10 bg-white text-black"
            }`}
          >
            <button
              onClick={() => setShowCreateEmpModal(false)}
              className="absolute top-4 right-4 p-2 rounded-xl transition-all opacity-40 hover:opacity-100 hover:bg-white/5"
            >
              <X className="h-4 w-4" />
            </button>

            <h2 className="text-lg font-display font-black uppercase tracking-tight mb-6 flex items-center gap-2 text-[#00DDDD]">
              <Plus className="h-5 w-5 text-[#00DDDD]" /> Onboard Employee
            </h2>

            <form onSubmit={handleCreateEmployeeSubmit} className="space-y-4">
              <div>
                <label className="text-[9px] font-mono uppercase tracking-widest opacity-40">Employee Name</label>
                <input
                  value={empName}
                  onChange={(e) => setEmpName(e.target.value)}
                  required
                  placeholder="e.g. Mayank Rawat"
                  className="w-full mt-1.5 p-3 text-xs font-mono border border-white/5 bg-white/5 rounded-2xl text-white focus:outline-none focus:border-[#00DDDD]/50"
                />
              </div>

              <div>
                <label className="text-[9px] font-mono uppercase tracking-widest opacity-40">Unique Employee ID (Roll No)</label>
                <input
                  value={empRollNo}
                  onChange={(e) => setEmpRollNo(e.target.value)}
                  required
                  placeholder="e.g. EMP-9981"
                  className="w-full mt-1.5 p-3 text-xs font-mono border border-white/5 bg-white/5 rounded-2xl text-white focus:outline-none focus:border-[#00DDDD]/50"
                />
              </div>

              <div>
                <label className="text-[9px] font-mono uppercase tracking-widest opacity-40">Phone Number (with country code)</label>
                <input
                  value={empMobile}
                  onChange={(e) => setEmpMobile(e.target.value)}
                  required
                  placeholder="e.g. +91 9876543210"
                  className="w-full mt-1.5 p-3 text-xs font-mono border border-white/5 bg-white/5 rounded-2xl text-white focus:outline-none focus:border-[#00DDDD]/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[9px] font-mono uppercase tracking-widest opacity-40">Department / Class</label>
                  <input
                    value={empClass}
                    onChange={(e) => setEmpClass(e.target.value)}
                    required
                    placeholder="e.g. Engineering"
                    className="w-full mt-1.5 p-3 text-xs font-mono border border-white/5 bg-white/5 rounded-2xl text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[9px] font-mono uppercase tracking-widest opacity-40">Login Password</label>
                  <input
                    type="password"
                    value={empPassword}
                    onChange={(e) => setEmpPassword(e.target.value)}
                    required
                    placeholder="Min 6 chars"
                    className="w-full mt-1.5 p-3 text-xs font-mono border border-white/5 bg-white/5 rounded-2xl text-white focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isActionLoading}
                className="w-full mt-2 py-3 bg-[#00DDDD] hover:scale-[1.02] text-black text-[10px] font-mono uppercase tracking-[0.3em] font-bold rounded-2xl transition-all disabled:opacity-50"
              >
                {isActionLoading ? "ONBOARDING..." : "COMMISSION EMPLOYEE ENTRY"}
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {/* ─── EDIT EMPLOYEE MODAL ─── */}
      {editingEmployee && (
        <div className={`fixed inset-0 z-[200] flex items-center justify-center p-6 transition-colors duration-300 ${
          isDarkMode ? "bg-black/70" : "bg-white/80"
        } backdrop-blur-sm`}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`relative w-full max-w-sm border p-6 rounded-[2.5rem] transition-colors duration-300 ${
              isDarkMode ? "border-white/10 bg-[#0c0c0c] text-white" : "border-black/10 bg-white text-black"
            }`}
          >
            <button
              onClick={() => setEditingEmployee(null)}
              className="absolute top-4 right-4 p-2 rounded-xl transition-all opacity-40 hover:opacity-100 hover:bg-white/5"
            >
              <X className="h-4 w-4" />
            </button>

            <h2 className="text-md font-display font-black uppercase tracking-tight mb-6 text-[#00DDDD]">
              Edit Employee Details
            </h2>

            <form onSubmit={handleEditEmployeeSubmit} className="space-y-4">
              <div>
                <label className="text-[9px] font-mono uppercase tracking-widest opacity-40">Employee Name</label>
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                  className="w-full mt-1.5 p-3 text-xs font-mono border border-white/5 bg-white/5 rounded-2xl text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[9px] font-mono uppercase tracking-widest opacity-40">Designation Class</label>
                <input
                  value={editClass}
                  onChange={(e) => setEditClass(e.target.value)}
                  required
                  className="w-full mt-1.5 p-3 text-xs font-mono border border-white/5 bg-white/5 rounded-2xl text-white focus:outline-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingEmployee(null)}
                  className="flex-1 py-3 border border-white/5 text-[9px] font-mono uppercase tracking-widest hover:bg-white/5 transition-all rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isActionLoading}
                  className="flex-1 py-3 bg-[#00DDDD] text-black font-bold text-[9px] font-mono uppercase tracking-widest hover:scale-[1.02] transition-all rounded-xl disabled:opacity-50"
                >
                  {isActionLoading ? "SAVING..." : "SAVE DETAILS"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* ─── DEEP PROFILE INSPECTOR MODAL ─── */}
      {inspectorEmployeeId && (
        <div className={`fixed inset-0 z-[200] flex items-center justify-center p-6 transition-colors duration-300 ${
          isDarkMode ? "bg-black/80" : "bg-white/80"
        } backdrop-blur-sm`}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`relative w-full max-w-xl border p-6 rounded-[2.5rem] flex flex-col justify-between overflow-y-auto max-h-[85vh] custom-scrollbar transition-colors duration-300 ${
              isDarkMode ? "border-white/10 bg-[#0c0c0c] text-white" : "border-black/10 bg-white text-black"
            }`}
          >
            <button
              onClick={() => setInspectorEmployeeId(null)}
              className="absolute top-4 right-4 p-2 rounded-xl transition-all opacity-40 hover:opacity-100 hover:bg-white/5"
            >
              <X className="h-4 w-4" />
            </button>

            {isInspectorLoading ? (
              <div className="py-20 text-center text-[10px] font-mono uppercase opacity-40 animate-pulse">Syncing profile uplink...</div>
            ) : inspectorStats ? (
              <div className="space-y-6">
                <div className="flex items-center gap-4 border-b border-white/5 pb-4">
                  <div className="h-12 w-12 rounded-2xl bg-[#00DDDD]/10 border border-[#00DDDD]/20 flex items-center justify-center">
                    <User className="h-6 w-6 text-[#00DDDD]" />
                  </div>
                  <div>
                    <h2 className="text-lg font-display font-black uppercase tracking-tight text-white">
                      {inspectorStats.profile?.name}
                    </h2>
                    <p className="text-[9px] font-mono text-[#00DDDD] uppercase tracking-widest mt-0.5">
                      ID: {inspectorStats.profile?.code} // {inspectorStats.profile?.protocol || "STANDARD-NODE"}
                    </p>
                  </div>
                </div>

                {/* Score Stats Ring / cards */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-center">
                    <span className="text-[8px] font-mono text-white/30 uppercase block">Quiz Accuracy</span>
                    <span className="text-md font-bold text-emerald-400 mt-1 block">{inspectorStats.performance?.quiz_accuracy || "0.0%"}</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-center">
                    <span className="text-[8px] font-mono text-white/30 uppercase block">Interview Rate</span>
                    <span className="text-md font-bold text-[#00DDDD] mt-1 block">{inspectorStats.performance?.interview_success || "0.0%"}</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-center">
                    <span className="text-[8px] font-mono text-white/30 uppercase block">Battle Ready</span>
                    <span className="text-md font-bold text-orange-400 mt-1 block">{inspectorStats.performance?.battle_readiness || "0.0%"}</span>
                  </div>
                </div>

                {/* Ranking Summary */}
                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex justify-between items-center text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-[#00DDDD]" />
                    <span className="text-white/50">Enterprise Rank Percentile:</span>
                  </div>
                  <span className="font-bold text-[#00DDDD] text-sm">
                    {inspectorStats.ranking?.rank} / {inspectorStats.ranking?.total || 1} ({inspectorStats.ranking?.percentile || "0.0%"})
                  </span>
                </div>

                {/* Skills distributes progress bars */}
                {inspectorStats.skills && inspectorStats.skills.length > 0 && (
                  <div className="space-y-3">
                    <span className="text-[9px] font-mono text-white/40 uppercase tracking-widest font-bold">Skills Matrix Spectrum:</span>
                    <div className="space-y-2">
                      {inspectorStats.skills.map((skill, idx) => (
                        <div key={idx}>
                          <div className="flex items-center justify-between text-[10px] font-mono mb-1 text-white/70">
                            <span>{skill.label}</span>
                            <span className="font-bold text-[#00DDDD]">{skill.value}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-[#00DDDD]/50 to-[#00DDDD] rounded-full" style={{ width: `${skill.value}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* System event logs */}
                {inspectorStats.logs && inspectorStats.logs.length > 0 && (
                  <div className="space-y-3">
                    <span className="text-[9px] font-mono text-white/40 uppercase tracking-widest font-bold">Event Protocol Logs:</span>
                    <div className="space-y-2 max-h-32 overflow-y-auto custom-scrollbar pr-1 text-[10px] font-mono">
                      {inspectorStats.logs.map((log, idx) => (
                        <div key={idx} className="p-2.5 bg-white/5 border border-white/5 rounded-xl flex justify-between items-start">
                          <div>
                            <span className="text-white font-bold block">{log.title}</span>
                            <span className="text-white/40 block text-[9px] mt-0.5">{log.type} // {log.meta}</span>
                          </div>
                          <div className="text-right text-[8px] text-white/30 shrink-0">
                            <span>{log.time}</span>
                            <span className="block mt-0.5">{log.date}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-10 text-center text-white/30 uppercase font-mono">Error syncing profile</div>
            )}

            <button
              onClick={() => setInspectorEmployeeId(null)}
              className="w-full mt-6 py-3 bg-[#00DDDD] text-black text-[10px] font-mono uppercase tracking-[0.2em] font-bold rounded-2xl hover:scale-[1.01] transition-all"
            >
              Close inspector Profile
            </button>
          </motion.div>
        </div>
      )}
    </div>
  )
}
