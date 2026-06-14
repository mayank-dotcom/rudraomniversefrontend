"use client"

import React, { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Users, LogOut, GraduationCap, RefreshCw, Plus, X, Search, BarChart3, Sun, Moon, User, Activity, TrendingUp, LayoutDashboard, ChevronLeft, ChevronRight as ChevronRightIcon, Database, Phone, MessageSquare, Clock, BookOpen, ArrowUpDown, ArrowUp, ArrowDown, Trash2 } from "lucide-react"
import { removeApiKey } from "@/lib/auth"
import { getSchoolStats, getSchoolStudents, createSchoolStudent, SchoolStudent, SchoolStatsResponse, deleteSchoolStudent, freezeUser, getFrozenUsers, unfreezeUser } from "@/lib/chat-api"
import { toast } from "sonner"

const CircularProgress = ({ value, max, size = 100, strokeWidth = 8, color = "#8b5cf6", label }: { value: number; max: number; size?: number; strokeWidth?: number; color?: string; label: string }) => {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const progress = Math.min(value / max, 1)
  const offset = circumference - progress * circumference
  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={strokeWidth} className="opacity-10" />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} className="transition-all duration-1000" />
      </svg>
      <div className="absolute flex flex-col items-center justify-center" style={{ width: size, height: size }}>
        <span className="text-lg font-black">{value}</span>
        <span className="text-[8px] font-mono uppercase tracking-widest opacity-40">{max > 0 ? `${Math.round(progress * 100)}%` : ""}</span>
      </div>
      <span className="text-[9px] font-mono uppercase tracking-widest opacity-40">{label}</span>
    </div>
  )
}

const StatCard = ({ title, value, icon: Icon, color, isDarkMode }: { title: string; value: any; icon: any; color: string; isDarkMode: boolean }) => (
  <div className={`relative border rounded-[2.5rem] p-8 overflow-hidden group ${isDarkMode ? "bg-gradient-to-br from-zinc-900 via-black to-zinc-900 border-zinc-800/50" : "bg-gradient-to-br from-zinc-100 via-white to-zinc-100 border-zinc-800/50"}`}>
    <div className={`absolute inset-0 bg-[linear-gradient(110deg,transparent_0%,rgba(255,255,255,0.03)_45%,rgba(255,255,255,0.06)_50%,rgba(255,255,255,0.03)_55%,transparent_100%)] pointer-events-none`} />
    <div className="absolute inset-0 -translate-y-full group-hover:translate-y-full transition-transform duration-1000 bg-gradient-to-b from-transparent via-white/5 to-transparent pointer-events-none" />
    <span className={`text-[9px] font-mono uppercase tracking-[0.3em] ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>{title}</span>
    <div className="flex items-baseline gap-2 mt-2">
      <h4 className={`text-2xl font-display font-black tracking-tight ${isDarkMode ? "text-white" : "text-black"}`}>{value}</h4>
    </div>
    <div className="h-[2px] w-8 mt-4 rounded-full" style={{ backgroundColor: color }} />
  </div>
)

function parseCSVLine(line: string): string[] {
  const trimmed = line.trim()
  if (!trimmed) return []
  if (trimmed.includes("\t")) return trimmed.split("\t")
  const result: string[] = []
  let current = ""
  let inQuotes = false
  for (const ch of trimmed) {
    if (ch === '"') { inQuotes = !inQuotes; continue }
    if (ch === "," && !inQuotes) { result.push(current.trim()); current = ""; continue }
    current += ch
  }
  result.push(current.trim())
  return result
}

export default function SchoolFacultyAdminPage() {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(true)
  const [students, setStudents] = useState<SchoolStudent[]>([])
  const [stats, setStats] = useState<SchoolStatsResponse & { leaderboard: Array<{ name: string; daily_chats: number }> }>({
    success: false,
    total_students: 0,
    total_faculty: 0,
    leaderboard: [],
  })
  const [view, setView] = useState<"overview" | "students" | "performance">("overview")
  const [query, setQuery] = useState("")
  const [showAddStudent, setShowAddStudent] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [sortField, setSortField] = useState<"name" | "daily_chats" | "assigned_class">("name")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
  const [creatingStudent, setCreatingStudent] = useState(false)
  const [confirmDeleteStudentId, setConfirmDeleteStudentId] = useState<string | null>(null)
  const [deletingStudentId, setDeletingStudentId] = useState<string | null>(null)
  const [frozenUserIds, setFrozenUserIds] = useState<string[]>([])
  const [togglingFreezeUserId, setTogglingFreezeUserId] = useState<string | null>(null)
  const [studentForm, setStudentForm] = useState({
    name: "",
    roll_no: "",
    password: "",
    assigned_class: "",
  })
  const [uploadTab, setUploadTab] = useState<"manual" | "csv">("manual")
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState<{ added: number; failed: number; errors: string[] } | null>(null)

  const ITEMS_PER_PAGE = 8

  const loadDashboard = async () => {
    setRefreshing(true)
    try {
      const [statsRes, studentsRes, frozenRes] = await Promise.all([
        getSchoolStats(),
        getSchoolStudents(),
        getFrozenUsers().catch(() => ({ success: true, frozen_users: [] as { user_id: string }[] })),
      ])
      console.log('[FacultyDashboard] Stats:', statsRes)
      console.log('[FacultyDashboard] Students:', studentsRes)

      const studentList = studentsRes.students || []
      const leaderboard = [...studentList]
        .sort((a, b) => (Number(b.total_score || 0)) - (Number(a.total_score || 0)))
        .slice(0, 10)
        .map((s) => ({ name: s.name, daily_chats: Number(s.total_score || 0) }))

      setStats({
        ...statsRes,
        total_students: Number(statsRes.total_students || 0),
        total_faculty: Number(statsRes.total_faculty || 0),
        leaderboard,
      })
      setStudents(studentList)
      setFrozenUserIds((frozenRes as any).frozen_users?.map((item: any) => item.user_id) || [])
    } catch (err) {
      console.error('[FacultyDashboard] Load Error:', err)
      toast.error("Failed to load dashboard: " + (err as Error).message)
    } finally {
      setRefreshing(false)
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboard()
  }, [])

  useEffect(() => {
    if (showAddStudent) {
      setUploadTab("manual")
      setUploadFile(null)
      setUploadResult(null)
    }
  }, [showAddStudent])

  const sortedStudents = useMemo(() => {
    const list = [...students]
    list.sort((a, b) => {
      let va: any, vb: any
      switch (sortField) {
        case "name": va = (a.name || "").toLowerCase(); vb = (b.name || "").toLowerCase(); break
        case "assigned_class": va = (a.assigned_class || "").toLowerCase(); vb = (b.assigned_class || "").toLowerCase(); break
        default: va = a.daily_chats || 0; vb = b.daily_chats || 0
      }
      if (va < vb) return sortOrder === "asc" ? -1 : 1
      if (va > vb) return sortOrder === "asc" ? 1 : -1
      return 0
    })
    return list
  }, [students, sortField, sortOrder])

  const filteredStudents = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return sortedStudents
    return sortedStudents.filter((s) => [s.name, s.mobile_number, s.assigned_class].some((v) => (v || "").toLowerCase().includes(q)))
  }, [sortedStudents, query])

  const totalPages = Math.ceil(filteredStudents.length / ITEMS_PER_PAGE)
  const paginatedStudents = filteredStudents.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  const toggleSort = (field: "name" | "daily_chats" | "assigned_class") => {
    if (sortField === field) setSortOrder(o => o === "asc" ? "desc" : "asc")
    else { setSortField(field); setSortOrder("asc") }
  }

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault()
    const payload = {
      name: studentForm.name.trim(),
      roll_no: studentForm.roll_no.trim(),
      password: studentForm.password,
      assigned_class: studentForm.assigned_class.trim() || undefined,
    }
    if (!payload.name || !payload.roll_no || !payload.password) {
      toast.error("Name, Roll No and Password are required")
      return
    }
    if (payload.password.length < 6) {
      toast.error("Password minimum 6 chars")
      return
    }
    setCreatingStudent(true)
    try {
      await createSchoolStudent(payload)
      toast.success("Student added successfully")
      setShowAddStudent(false)
      setStudentForm({ name: "", roll_no: "", password: "", assigned_class: "" })
      await loadDashboard()
    } catch (err) {
      toast.error("Failed to add student: " + (err as Error).message)
    } finally {
      setCreatingStudent(false)
    }
  }

  const handleDeleteStudent = async (studentId: string) => {
    setDeletingStudentId(studentId)
    try {
      await deleteSchoolStudent(studentId)
      setStudents(prev => prev.filter(s => s.id !== studentId))
      setConfirmDeleteStudentId(null)
      toast.success("Student deleted successfully")
    } catch (err) {
      toast.error("Failed to delete student: " + (err as Error).message)
    } finally {
      setDeletingStudentId(null)
    }
  }

  const handleToggleFreeze = async (studentId: string, isFrozen: boolean) => {
    setTogglingFreezeUserId(studentId)
    try {
      if (isFrozen) {
        await unfreezeUser(studentId)
        setFrozenUserIds(prev => prev.filter(id => id !== studentId))
        toast.success("Student unfrozen successfully")
      } else {
        await freezeUser(studentId)
        setFrozenUserIds(prev => Array.from(new Set([...prev, studentId])))
        toast.success("Student frozen successfully")
      }
    } catch (err) {
      toast.error(`Failed to ${isFrozen ? "unfreeze" : "freeze"} student: ` + (err as Error).message)
    } finally {
      setTogglingFreezeUserId(null)
    }
  }

  const handleLogout = () => {
    removeApiKey()
    window.location.href = "/"
  }

  if (loading) {
    return (
      <div className={`admin-portal-page ${isDarkMode ? "dark-mode" : "light-mode"} min-h-screen ${isDarkMode ? "bg-[#0d0d0c]" : "bg-[#ebeae7]"} flex items-center justify-center`}>
        <div className="h-8 w-8 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className={`admin-portal-page ${isDarkMode ? "dark-mode" : "light-mode"} h-screen w-full ${isDarkMode ? "bg-[#0d0d0c] text-white" : "bg-[#ebeae7] text-black"} font-sans selection:bg-white selection:text-black overflow-hidden flex flex-col transition-colors duration-500`}>
      <div className={`absolute inset-0 noise opacity-[0.03] pointer-events-none ${isDarkMode ? "" : "invert"}`} />

      {/* Top Navigation */}
      <nav className={`h-20 flex items-center justify-between px-10 border-b ${isDarkMode ? "border-white/5 bg-black/80" : "border-black/5 bg-white/80"} backdrop-blur-2xl sticky top-0 z-[100]`}>
        <div className="flex items-center gap-12">
          <div className="flex items-center gap-4">
            <div className={`h-6 w-6 ${isDarkMode ? "bg-white" : "bg-black"} flex items-center justify-center`}>
              <div className={`h-1.5 w-1.5 ${isDarkMode ? "bg-black" : "bg-white"}`} />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="font-display font-black tracking-tighter text-xl">{stats.school_name || "RUDRANEX"}</span>
              <span className="font-serif italic opacity-40 text-xl tracking-tighter">{stats.school_code ? `${stats.school_code}` : "faculty"}</span>
            </div>
          </div>

          <div className={`flex items-center gap-1 p-1 rounded-2xl border ${isDarkMode ? "border-white/10 bg-white/5" : "border-black/10 bg-black/5"}`}>
            <button
              onClick={() => { setView('overview'); setCurrentPage(1) }}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-mono uppercase tracking-[0.2em] transition-all ${view === 'overview' ? (isDarkMode ? "bg-white text-black font-bold" : "bg-black text-white font-bold") : "opacity-40 hover:opacity-100"}`}
            >
              <LayoutDashboard className="h-3.5 w-3.5 inline-block mr-1.5 -mt-0.5" /> Dashboard
            </button>
            <button
              onClick={() => { setView('students'); setCurrentPage(1) }}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-mono uppercase tracking-[0.2em] transition-all ${view === 'students' ? (isDarkMode ? "bg-white text-black font-bold" : "bg-black text-white font-bold") : "opacity-40 hover:opacity-100"}`}
            >
              <GraduationCap className="h-3.5 w-3.5 inline-block mr-1.5 -mt-0.5" /> Students
            </button>
            <button
              onClick={() => { setView('performance'); setCurrentPage(1) }}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-mono uppercase tracking-[0.2em] transition-all ${view === 'performance' ? (isDarkMode ? "bg-white text-black font-bold" : "bg-black text-white font-bold") : "opacity-40 hover:opacity-100"}`}
            >
              <BarChart3 className="h-3.5 w-3.5 inline-block mr-1.5 -mt-0.5" /> Performance
            </button>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <button
            onClick={() => setShowAddStudent(true)}
            className="px-4 py-2 border border-blue-500/30 text-blue-400 text-[10px] font-mono uppercase tracking-[0.2em] hover:bg-blue-500/10 transition-all rounded-full flex items-center gap-2"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Student
          </button>
          <button
            onClick={loadDashboard}
            disabled={refreshing}
            className={`p-2 rounded-full border border-white/10 hover:bg-white/5 transition-all ${refreshing ? "animate-spin" : ""}`}
          >
            <RefreshCw className="h-4 w-4 opacity-40" />
          </button>

          <Link
            href="/chat"
            className={`h-10 w-10 rounded-2xl border flex items-center justify-center transition-all ${isDarkMode ? "border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500 hover:text-black" : "border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500 hover:text-white"}`}
            title="Chat"
          >
            <MessageSquare className="h-4 w-4 text-emerald-400" />
          </Link>

          <div className="h-8 w-[1px] bg-white/10 mx-2" />

          <div className="flex items-center gap-4">
            <button
              onClick={() => { setView('overview'); setCurrentPage(1); setQuery("") }}
              className={`h-10 w-10 rounded-2xl border flex items-center justify-center transition-all ${isDarkMode ? "border-white/10 hover:bg-white/5" : "border-black/10 hover:bg-black/5"}`}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`h-10 w-10 rounded-2xl border flex items-center justify-center cursor-pointer transition-all ${isDarkMode ? "border-white/10 hover:bg-white/5" : "border-black/10 hover:bg-black/5"}`}
            >
              {isDarkMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </div>
            <div
              onClick={handleLogout}
              className="h-10 w-10 rounded-2xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center group cursor-pointer overflow-hidden hover:bg-blue-500 transition-all"
            >
              <LogOut className="h-4 w-4 text-blue-500 group-hover:text-black transition-colors" />
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className={`flex-1 overflow-y-auto p-10 relative z-10 w-full max-w-[1800px] mx-auto custom-scrollbar ${isDarkMode ? "text-white" : "text-black"}`}>
        <AnimatePresence mode="wait">
          {view === "overview" && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-12 gap-8"
            >
              {/* Left Panel: Stats Summary */}
              <div className="col-span-12 lg:col-span-3 space-y-8">
                <div className={`relative border border-zinc-800/50 p-8 rounded-[2.5rem] backdrop-blur-xl overflow-hidden group ${
                  isDarkMode ? "bg-gradient-to-br from-zinc-900 via-black to-zinc-900" : "bg-gradient-to-br from-zinc-100 via-white to-zinc-100"
                }`}>
                  <div className={`absolute inset-0 bg-[linear-gradient(110deg,transparent_0%,rgba(255,255,255,0.03)_45%,rgba(255,255,255,0.06)_50%,rgba(255,255,255,0.03)_55%,transparent_100%)] pointer-events-none`} />
                  <div className="absolute inset-0 -translate-y-full group-hover:translate-y-full transition-transform duration-1000 bg-gradient-to-b from-transparent via-white/5 to-transparent pointer-events-none" />
                  <div className="flex items-center justify-between mb-8">
                    <h3 className={`text-xs font-display font-black uppercase tracking-[0.2em] ${isDarkMode ? "text-white" : "text-black"}`}>Class Summary</h3>
                    <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                  </div>

                  <div className="space-y-4">
                    <div className={`flex items-center justify-between p-4 rounded-2xl ${isDarkMode ? "bg-white/5" : "bg-black/5"}`}>
                      <div className="flex items-center gap-3">
                        <GraduationCap className="h-4 w-4 text-blue-400" />
                        <span className="text-[10px] font-mono uppercase tracking-widest opacity-60">
                          {stats.faculty_stats ? "Assigned Students" : "Total Students"}
                        </span>
                      </div>
                      <span className="text-lg font-display font-black">
                        {stats.faculty_stats ? stats.faculty_stats.assigned : stats.total_students}
                      </span>
                    </div>
                    <div className={`flex items-center justify-between p-4 rounded-2xl ${isDarkMode ? "bg-white/5" : "bg-black/5"}`}>
                      <div className="flex items-center gap-3">
                        <Users className="h-4 w-4 text-emerald-400" />
                        <span className="text-[10px] font-mono uppercase tracking-widest opacity-60">
                          {stats.faculty_stats ? "Student Quota" : "Total Faculty"}
                        </span>
                      </div>
                      <span className="text-lg font-display font-black">
                        {stats.faculty_stats ? stats.faculty_stats.quota : stats.total_faculty}
                      </span>
                    </div>
                    <div className={`flex items-center justify-between p-4 rounded-2xl ${isDarkMode ? "bg-white/5" : "bg-black/5"}`}>
                      <div className="flex items-center gap-3">
                        <MessageSquare className="h-4 w-4 text-emerald-400" />
                        <span className="text-[10px] font-mono uppercase tracking-widest opacity-60">Total Chats</span>
                      </div>
                      <span className="text-lg font-display font-black">{stats.leaderboard.reduce((sum, l) => sum + (l.daily_chats || 0), 0)}</span>
                    </div>
                    <div className={`flex items-center justify-between p-4 rounded-2xl ${isDarkMode ? "bg-white/5" : "bg-black/5"}`}>
                      <div className="flex items-center gap-3">
                        <TrendingUp className="h-4 w-4 text-amber-400" />
                        <span className="text-[10px] font-mono uppercase tracking-widest opacity-60">Top Student</span>
                      </div>
                      <span className="text-xs font-mono text-right leading-tight">
                        {stats.leaderboard[0] ? `${stats.leaderboard[0].name} (${stats.leaderboard[0].daily_chats || 0})` : "N/A"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className={`relative border border-zinc-800/50 p-8 rounded-[2.5rem] backdrop-blur-xl text-center overflow-hidden group ${
                  isDarkMode ? "bg-gradient-to-br from-zinc-900 via-black to-zinc-900" : "bg-gradient-to-br from-zinc-100 via-white to-zinc-100"
                }`}>
                  <div className={`absolute inset-0 bg-[linear-gradient(110deg,transparent_0%,rgba(255,255,255,0.03)_45%,rgba(255,255,255,0.06)_50%,rgba(255,255,255,0.03)_55%,transparent_100%)] pointer-events-none`} />
                  <div className="absolute inset-0 -translate-y-full group-hover:translate-y-full transition-transform duration-1000 bg-gradient-to-b from-transparent via-white/5 to-transparent pointer-events-none" />
                  <Users className={`h-8 w-8 mx-auto mb-4 ${isDarkMode ? "opacity-20 text-white" : "opacity-30 text-black"}`} />
                  <h4 className={`text-[10px] font-mono uppercase tracking-[0.3em] ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>Faculty Portal</h4>
                  <p className={`text-xs font-bold mt-2 ${isDarkMode ? "text-white" : "text-black"}`}>Active Session: FACULTY-ACCESS</p>
                </div>
              </div>

              {/* Right Panel */}
              <div className="col-span-12 lg:col-span-9 space-y-8">
                {/* Analytics */}
                <div className={`relative border border-zinc-800/50 p-10 rounded-[3rem] overflow-hidden group ${
                  isDarkMode ? "bg-gradient-to-br from-zinc-900 via-black to-zinc-900" : "bg-gradient-to-br from-zinc-100 via-white to-zinc-100"
                }`}>
                  <div className={`absolute inset-0 bg-[linear-gradient(110deg,transparent_0%,rgba(255,255,255,0.03)_45%,rgba(255,255,255,0.06)_50%,rgba(255,255,255,0.03)_55%,transparent_100%)] pointer-events-none`} />
                  <div className="absolute inset-0 -translate-y-full group-hover:translate-y-full transition-transform duration-1000 bg-gradient-to-b from-transparent via-white/5 to-transparent pointer-events-none" />
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className={`text-lg font-display font-black tracking-tight uppercase ${isDarkMode ? "text-white" : "text-black"}`}>Faculty Analytics</h3>
                      <p className={`text-[10px] font-mono uppercase tracking-[0.3em] mt-1 ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>Live classroom metrics & student engagement</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard title={stats.faculty_stats ? "Assigned" : "Students"} value={stats.faculty_stats ? stats.faculty_stats.assigned : stats.total_students} icon={GraduationCap} color="#3b82f6" isDarkMode={isDarkMode} />
                    <StatCard title={stats.faculty_stats ? "Quota" : "Faculty"} value={stats.faculty_stats ? stats.faculty_stats.quota : stats.total_faculty} icon={Users} color="#10b981" isDarkMode={isDarkMode} />
                    <StatCard title="Active Chats" value={stats.leaderboard.reduce((sum, l) => sum + (l.daily_chats || 0), 0)} icon={MessageSquare} color="#f59e0b" isDarkMode={isDarkMode} />
                    <StatCard title="Performance" value={stats.faculty_stats ? stats.faculty_stats.performance_avg : (stats.leaderboard[0]?.name || "N/A")} icon={TrendingUp} color="#8b5cf6" isDarkMode={isDarkMode} />
                  </div>
                </div>

                {/* Classroom Dashboard */}
                <div className={`relative border border-zinc-800/50 p-10 rounded-[3rem] overflow-hidden group ${
                  isDarkMode ? "bg-gradient-to-br from-zinc-900 via-black to-zinc-900" : "bg-gradient-to-br from-zinc-100 via-white to-zinc-100"
                }`}>
                  <div className={`absolute inset-0 bg-[linear-gradient(110deg,transparent_0%,rgba(255,255,255,0.03)_45%,rgba(255,255,255,0.06)_50%,rgba(255,255,255,0.03)_55%,transparent_100%)] pointer-events-none`} />
                  <div className="absolute inset-0 -translate-y-full group-hover:translate-y-full transition-transform duration-1000 bg-gradient-to-b from-transparent via-white/5 to-transparent pointer-events-none" />
                  <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-[100px] rounded-full" />

                  <div className="flex items-center justify-between mb-10 relative z-10">
                    <div>
                      <h2 className={`text-3xl font-display font-black tracking-tight uppercase ${isDarkMode ? "text-white" : "text-black"}`}>Classroom Dashboard</h2>
                      <p className={`text-[10px] font-mono uppercase mt-2 tracking-[0.4em] ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>Faculty control center &bull; {stats.total_students} students enrolled</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative z-10">
                    {/* Leaderboard */}
                    <div className={`relative border rounded-[2.5rem] p-8 overflow-hidden group ${
                      isDarkMode ? "bg-white/5 border-white/10" : "bg-black/5 border-black/10"
                    }`}>
                      <div className={`absolute inset-0 bg-[linear-gradient(110deg,transparent_0%,rgba(255,255,255,0.03)_45%,rgba(255,255,255,0.06)_50%,rgba(255,255,255,0.03)_55%,transparent_100%)] pointer-events-none`} />
                      <div className="flex items-center gap-3 mb-6">
                        <TrendingUp className={`h-5 w-5 ${isDarkMode ? "text-blue-400" : "text-blue-600"}`} />
                        <h3 className={`text-xs font-display font-black uppercase tracking-[0.2em] ${isDarkMode ? "text-white" : "text-black"}`}>Top Student Activity</h3>
                      </div>
                      <div className="space-y-3">
                        {stats.leaderboard.length === 0 && (
                          <p className={`text-[10px] font-mono uppercase tracking-widest ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>No leaderboard data yet</p>
                        )}
                        {stats.leaderboard.slice(0, 10).map((item, idx) => (
                          <div key={`${item.name}-${idx}`} className={`flex items-center justify-between p-3 rounded-xl transition-all ${isDarkMode ? "hover:bg-white/5" : "hover:bg-black/5"}`}>
                            <div className="flex items-center gap-3">
                              <span className={`h-6 w-6 rounded-lg flex items-center justify-center text-[9px] font-mono font-bold ${idx === 0 ? "bg-blue-500/20 text-blue-400" : idx === 1 ? "bg-zinc-500/20 text-zinc-400" : idx === 2 ? "bg-amber-700/20 text-amber-600" : isDarkMode ? "bg-white/5 text-white/40" : "bg-black/5 text-black/40"}`}>
                                {idx + 1}
                              </span>
                              <span className={`text-xs font-mono ${isDarkMode ? "text-white/80" : "text-black/80"}`}>{item.name}</span>
                            </div>
                            <span className={`text-[10px] font-mono ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>{item.daily_chats || 0} chats</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className={`relative border rounded-[2.5rem] p-8 overflow-hidden group ${
                      isDarkMode ? "bg-white/5 border-white/10" : "bg-black/5 border-black/10"
                    }`}>
                      <div className={`absolute inset-0 bg-[linear-gradient(110deg,transparent_0%,rgba(255,255,255,0.03)_45%,rgba(255,255,255,0.06)_50%,rgba(255,255,255,0.03)_55%,transparent_100%)] pointer-events-none`} />
                      <div className="flex items-center gap-3 mb-6">
                        <Activity className={`h-5 w-5 ${isDarkMode ? "text-blue-400" : "text-blue-600"}`} />
                        <h3 className={`text-xs font-display font-black uppercase tracking-[0.2em] ${isDarkMode ? "text-white" : "text-black"}`}>Quick Actions</h3>
                      </div>
                      <div className="grid grid-cols-1 gap-4">
                        <button
                          onClick={() => setShowAddStudent(true)}
                          className={`w-full p-5 border rounded-[2rem] text-left transition-all hover:scale-[1.02] active:scale-[0.98] group ${
                            isDarkMode ? "border-blue-500/30 bg-blue-500/5 hover:bg-blue-500/10" : "border-blue-500/30 bg-blue-500/5 hover:bg-blue-500/10"
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-2xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
                              <Plus className="h-5 w-5 text-blue-400" />
                            </div>
                            <div>
                              <h4 className="text-sm font-display font-black text-blue-400">Add Student</h4>
                              <p className={`text-[9px] font-mono uppercase tracking-widest mt-1 ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>Enroll a new student in the class</p>
                            </div>
                          </div>
                        </button>
                        <button
                          onClick={() => setView("performance")}
                          className={`w-full p-5 border rounded-[2rem] text-left transition-all hover:scale-[1.02] active:scale-[0.98] group ${
                            isDarkMode ? "border-purple-500/30 bg-purple-500/5 hover:bg-purple-500/10" : "border-purple-500/30 bg-purple-500/5 hover:bg-purple-500/10"
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
                              <BarChart3 className="h-5 w-5 text-purple-400" />
                            </div>
                            <div>
                              <h4 className="text-sm font-display font-black text-purple-400">Student Performance</h4>
                              <p className={`text-[9px] font-mono uppercase tracking-widest mt-1 ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>View circular analytics & usage metrics</p>
                            </div>
                          </div>
                        </button>
                        <button
                          onClick={() => setView("students")}
                          className={`w-full p-5 border rounded-[2rem] text-left transition-all hover:scale-[1.02] active:scale-[0.98] group ${
                            isDarkMode ? "border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10" : "border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10"
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                              <GraduationCap className="h-5 w-5 text-emerald-400" />
                            </div>
                            <div>
                              <h4 className="text-sm font-display font-black text-emerald-400">Student Directory</h4>
                              <p className={`text-[9px] font-mono uppercase tracking-widest mt-1 ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>View all registered students & their details</p>
                            </div>
                          </div>
                        </button>
                        <button
                          onClick={loadDashboard}
                          className={`w-full p-5 border rounded-[2rem] text-left transition-all hover:scale-[1.02] active:scale-[0.98] group ${
                            isDarkMode ? "border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10" : "border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10"
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                              <RefreshCw className="h-5 w-5 text-amber-400" />
                            </div>
                            <div>
                              <h4 className="text-sm font-display font-black text-amber-400">Refresh Data</h4>
                              <p className={`text-[9px] font-mono uppercase tracking-widest mt-1 ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>Sync latest classroom metrics</p>
                            </div>
                          </div>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Student Usage Summary */}
                  <div className={`relative border rounded-[2.5rem] p-8 overflow-hidden group mt-8 ${
                    isDarkMode ? "bg-white/5 border-white/10" : "bg-black/5 border-black/10"
                  }`}>
                    <div className={`absolute inset-0 bg-[linear-gradient(110deg,transparent_0%,rgba(255,255,255,0.03)_45%,rgba(255,255,255,0.06)_50%,rgba(255,255,255,0.03)_55%,transparent_100%)] pointer-events-none`} />
                    <div className="flex items-center gap-3 mb-6">
                      <BarChart3 className={`h-5 w-5 ${isDarkMode ? "text-purple-400" : "text-purple-600"}`} />
                      <h3 className={`text-xs font-display font-black uppercase tracking-[0.2em] ${isDarkMode ? "text-white" : "text-black"}`}>Student AI Usage</h3>
                      <span className={`ml-auto text-[9px] font-mono tracking-widest ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>{students.length} students active today</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className={`text-[9px] font-mono uppercase tracking-[0.3em] ${isDarkMode ? "text-white/40" : "text-black/60"}`}>
                            <th className="pb-4 font-bold">
                              <button onClick={() => toggleSort("name")} className="flex items-center gap-1 hover:opacity-80 transition-all">
                                Student {sortField === "name" ? (sortOrder === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 opacity-30" />}
                              </button>
                            </th>
                            <th className="pb-4 font-bold text-center">
                              <button onClick={() => toggleSort("assigned_class")} className="flex items-center gap-1 hover:opacity-80 transition-all mx-auto">
                                Class {sortField === "assigned_class" ? (sortOrder === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 opacity-30" />}
                              </button>
                            </th>
                            <th className="pb-4 font-bold text-center">
                              <button onClick={() => toggleSort("daily_chats")} className="flex items-center gap-1 hover:opacity-80 transition-all mx-auto">
                                Chats {sortField === "daily_chats" ? (sortOrder === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 opacity-30" />}
                              </button>
                            </th>
                            <th className="pb-4 font-bold text-right">Usage</th>
                          </tr>
                        </thead>
                        <tbody>
                          {students.length === 0 ? (
                            <tr>
                              <td colSpan={4} className={`py-12 text-center text-[10px] font-mono uppercase tracking-widest ${isDarkMode ? "opacity-20 text-white" : "opacity-40 text-black"}`}>No student data available</td>
                            </tr>
                          ) : (
                            students.slice(0, 10).map((s) => (
                              <tr key={s.id} className={`border-t transition-colors ${isDarkMode ? "border-white/5 hover:bg-white/[0.02]" : "border-black/10 hover:bg-black/[0.02]"}`}>
                                <td className="py-3 pr-4">
                                  <div className="flex items-center gap-3">
                                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center border ${isDarkMode ? "bg-white/5 border-white/10" : "bg-black/5 border-black/10"}`}>
                                      <User className={`h-3.5 w-3.5 ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`} />
                                    </div>
                                    <span className={`text-xs font-bold ${isDarkMode ? "text-white" : "text-black"}`}>{s.name}</span>
                                  </div>
                                </td>
                                <td className="py-3 px-4 text-center">
                                  <span className={`text-[10px] px-2 py-0.5 rounded ${isDarkMode ? "bg-blue-500/10 text-blue-400" : "bg-blue-500/10 text-blue-600"}`}>
                                    {s.assigned_class || "—"}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-center">
                                <span className={`font-bold ${isDarkMode ? "text-white" : "text-black"}`}>{s.total_score || 0}</span>
                                </td>
                                <td className="py-3 pl-4 text-right">
                                  <div className="flex items-center justify-end gap-3">
                                    <div className="w-24 h-1.5 rounded-full bg-white/10">
                                      <div className="h-full rounded-full bg-purple-500" style={{ width: `${Math.min(((s.total_score || 0) / 100) * 100, 100)}%` }} />
                                    </div>
                                    <span className={`text-[10px] font-mono ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>
                                      {Math.min(((s.total_score || 0) / 100) * 100, 100).toFixed(0)}%
                                    </span>
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {view === "students" && (
            <motion.div
              key="students"
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
                  <h2 className={`text-3xl font-display font-black tracking-tight uppercase ${isDarkMode ? "text-white" : "text-black"}`}>Student Directory</h2>
                  <p className={`text-[10px] font-mono uppercase mt-2 tracking-[0.4em] ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>Enrolled learners &bull; {filteredStudents.length} records</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Search className={`absolute left-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 ${isDarkMode ? "opacity-20 text-white" : "opacity-40 text-black"}`} />
                    <input
                      type="text"
                      placeholder="FILTER STUDENTS..."
                      value={query}
                      onChange={(e) => { setQuery(e.target.value); setCurrentPage(1) }}
                      className={`pl-11 pr-8 py-3 text-[10px] font-mono tracking-widest border rounded-2xl focus:outline-none focus:border-blue-500/50 min-w-[250px] ${
                        isDarkMode ? "bg-white/5 border-white/10 text-white" : "bg-black/5 border-black/10 text-black placeholder:text-black/40"
                      }`}
                    />
                  </div>
                  <button
                    onClick={() => setShowAddStudent(true)}
                    className={`px-6 py-3.5 text-[10px] font-mono uppercase tracking-[0.2em] font-bold hover:opacity-90 transition-all rounded-2xl bg-blue-500 text-black flex items-center gap-2`}
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Student
                  </button>
                </div>
              </div>

              {/* Sort Toggle */}
              <div className={`px-10 py-4 border-b flex items-center gap-2 ${isDarkMode ? "bg-black/50 border-white/5" : "bg-white/50 border-black/10"}`}>
                <span className={`text-[9px] font-mono uppercase tracking-[0.3em] mr-2 ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>Sort:</span>
                <button
                  onClick={() => setSortOrder(o => o === "asc" ? "desc" : "asc")}
                  className={`px-4 py-2 rounded-xl text-[10px] font-mono uppercase tracking-[0.15em] transition-all flex items-center gap-2 ${
                    isDarkMode ? "hover:bg-white/5 text-white" : "hover:bg-black/5 text-black"
                  }`}
                >
                  {sortOrder === "asc" ? "A→Z" : "Z→A"}
                  <ChevronLeft className={`h-3 w-3 transition-transform ${sortOrder === "desc" ? "rotate-90" : "-rotate-90"}`} />
                </button>
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
                      <th className={`p-8 font-bold border-b ${isDarkMode ? "border-white/5" : "border-black/10"}`}>Mobile</th>
                      <th className={`p-8 font-bold border-b ${isDarkMode ? "border-white/5" : "border-black/10"} text-center`}>
                        <button onClick={() => toggleSort("assigned_class")} className="flex items-center gap-1 hover:opacity-80 transition-all mx-auto">
                          Class {sortField === "assigned_class" ? (sortOrder === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 opacity-30" />}
                        </button>
                      </th>
                      <th className={`p-8 font-bold border-b ${isDarkMode ? "border-white/5" : "border-black/10"}`}>
                        <button onClick={() => toggleSort("daily_chats")} className="flex items-center gap-1 hover:opacity-80 transition-all">
                          Score {sortField === "daily_chats" ? (sortOrder === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 opacity-30" />}
                        </button>
                      </th>
                      <th className={`p-8 font-bold border-b ${isDarkMode ? "border-white/5" : "border-black/10"} text-right`}>Actions</th>
                    </tr>
                  </thead>
                  <tbody className={`text-[11px] font-mono uppercase tracking-tight ${isDarkMode ? "text-white" : "text-black"}`}>
                    {paginatedStudents.length === 0 ? (
                      <tr>
                        <td colSpan={5} className={`p-20 text-center font-display font-black text-2xl uppercase tracking-[1em] ${isDarkMode ? "opacity-20 text-white" : "opacity-40 text-black"}`}>Void Found</td>
                      </tr>
                    ) : (
                      paginatedStudents.map((s) => {
                        const isFrozen = frozenUserIds.includes(s.id)
                        return (
                        <tr key={s.id} className={`border-b transition-colors group ${isDarkMode ? "border-white/5 hover:bg-white/[0.02]" : "border-black/10 hover:bg-black/[0.02]"}`}>
                          <td className="p-8">
                            <div className="flex items-center gap-4">
                              <div className={`h-10 w-10 rounded-xl flex items-center justify-center border ${isDarkMode ? "bg-white/5 border-white/10" : "bg-black/5 border-black/10"}`}>
                                <User className={`h-4 w-4 ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`} />
                              </div>
                              <div className="flex flex-col">
                                <span className={`text-[13px] font-bold tracking-tight ${isDarkMode ? "text-white" : "text-black"}`}>{s.name}</span>
                              </div>
                            </div>
                          </td>
                          <td className="p-8">
                            <div className="flex items-center gap-2">
                              <Phone className={`h-3 w-3 ${isDarkMode ? "opacity-30 text-white" : "opacity-50 text-black"}`} />
                              <span className={`text-[10px] ${isDarkMode ? "opacity-60 text-white" : "opacity-80 text-black"}`}>{s.mobile_number || "—"}</span>
                            </div>
                          </td>
                          <td className="p-8 text-center">
                            <span className={`px-3 py-1 rounded-lg text-[10px] ${isDarkMode ? "bg-blue-500/10 text-blue-400" : "bg-blue-500/10 text-blue-600"}`}>
                              {s.assigned_class || "—"}
                            </span>
                          </td>
                          <td className="p-8 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <span className={`font-bold ${isDarkMode ? "text-white" : "text-black"}`}>{s.total_score || 0}</span>
                              <span className={`text-[9px] ${isDarkMode ? "opacity-30 text-white" : "opacity-50 text-black"}`}>SCORE</span>
                            </div>
                          </td>
                          <td className="p-8 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleToggleFreeze(s.id, isFrozen)}
                                disabled={togglingFreezeUserId === s.id}
                                className={`px-3 py-2 text-[9px] font-bold tracking-widest rounded-xl transition-all disabled:opacity-50 ${
                                  isFrozen
                                    ? "bg-emerald-500 text-black hover:bg-emerald-400"
                                    : "bg-amber-500 text-black hover:bg-amber-400"
                                }`}
                              >
                                {togglingFreezeUserId === s.id ? "..." : isFrozen ? "UNFREEZE" : "FREEZE"}
                              </button>
                              {confirmDeleteStudentId === s.id ? (
                                <>
                                  <button
                                    onClick={() => handleDeleteStudent(s.id)}
                                    disabled={deletingStudentId === s.id}
                                    className="px-3 py-2 bg-red-600 text-white text-[9px] font-bold tracking-widest rounded-xl hover:bg-red-700 disabled:opacity-50 transition-all"
                                  >
                                    {deletingStudentId === s.id ? "..." : "CONFIRM"}
                                  </button>
                                  <button
                                    onClick={() => setConfirmDeleteStudentId(null)}
                                    className={`p-2 border rounded-xl transition-all ${isDarkMode ? "border-white/30 hover:bg-white/5 text-white" : "border-black/10 hover:bg-black/5 text-black"}`}
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={() => setConfirmDeleteStudentId(s.id)}
                                  className={`p-2.5 border rounded-xl transition-all hover:border-red-500/40 hover:text-red-400 hover:bg-red-500/5 ${isDarkMode ? "border-white/30 text-white/40" : "border-black/10 text-black/40"}`}
                                  title="Delete student"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )})
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
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

          {view === "performance" && (
            <motion.div
              key="performance"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className={`relative border border-zinc-800/50 rounded-[3rem] overflow-hidden backdrop-blur-3xl group ${
                isDarkMode ? "bg-gradient-to-br from-zinc-900 via-black to-zinc-900" : "bg-gradient-to-br from-zinc-100 via-white to-zinc-100"
              }`}
            >
              <div className={`absolute inset-0 bg-[linear-gradient(110deg,transparent_0%,rgba(255,255,255,0.03)_45%,rgba(255,255,255,0.06)_50%,rgba(255,255,255,0.03)_55%,transparent_100%)] pointer-events-none`} />
              <div className="absolute inset-0 -translate-y-full group-hover:translate-y-full transition-transform duration-1000 bg-gradient-to-b from-transparent via-white/5 to-transparent pointer-events-none" />
              <div className={`p-10 border-b ${isDarkMode ? "bg-black border-white/5" : "bg-white border-black/10"}`}>
                <h2 className={`text-3xl font-display font-black tracking-tight uppercase ${isDarkMode ? "text-white" : "text-black"}`}>Student Performance</h2>
                <p className={`text-[10px] font-mono uppercase mt-2 tracking-[0.4em] ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>Circular analytics &bull; per-student AI usage breakdown</p>
              </div>

              <div className="p-10">
                {students.length === 0 ? (
                  <div className={`text-center py-20 text-[10px] font-mono uppercase tracking-widest ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>No student data available</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {students.map((s) => (
                      <div
                        key={s.id}
                        className={`relative border rounded-[2.5rem] p-8 transition-all hover:scale-105 overflow-hidden group flex flex-col items-center ${
                          isDarkMode
                            ? "border-zinc-800/50 bg-gradient-to-br from-zinc-900 via-black to-zinc-900"
                            : "border-zinc-800/50 bg-gradient-to-br from-zinc-100 via-white to-zinc-100"
                        }`}
                      >
                        <div className={`absolute inset-0 bg-[linear-gradient(110deg,transparent_0%,rgba(255,255,255,0.03)_45%,rgba(255,255,255,0.06)_50%,rgba(255,255,255,0.03)_55%,transparent_100%)] pointer-events-none`} />
                        <div className="absolute inset-0 -translate-y-full group-hover:translate-y-full transition-transform duration-1000 bg-gradient-to-b from-transparent via-white/5 to-transparent pointer-events-none" />

                        <div className={`h-14 w-14 rounded-2xl flex items-center justify-center border mb-4 ${isDarkMode ? "bg-white/5 border-white/10" : "bg-black/5 border-black/10"}`}>
                          <User className={`h-6 w-6 ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`} />
                        </div>
                        <h3 className={`text-sm font-display font-black text-center mb-1 ${isDarkMode ? "text-white" : "text-black"}`}>{s.name}</h3>
                        <span className={`text-[9px] font-mono uppercase tracking-widest mb-6 ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>{s.assigned_class || "Unassigned"}</span>

                        <div className="relative flex items-center justify-center mb-4">
                          <CircularProgress value={s.total_score || 0} max={100} size={110} strokeWidth={10} color="#3b82f6" label="Score" />
                        </div>

                        <div className="w-full mt-2 space-y-2">
                          <div className="flex items-center justify-between text-[9px] font-mono">
                            <span className="opacity-40">Mobile</span>
                            <span className="font-bold">{s.mobile_number || "—"}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Add Student Modal */}
      {showAddStudent && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`relative w-full max-w-lg max-h-[80vh] overflow-y-auto border border-zinc-800/50 p-6 rounded-[2rem] ${
              isDarkMode ? "bg-gradient-to-br from-zinc-900 via-black to-zinc-900 text-white" : "bg-gradient-to-br from-zinc-100 via-white to-zinc-100 text-black"
            }`}
          >
            <div className={`absolute inset-0 bg-[linear-gradient(110deg,transparent_0%,rgba(255,255,255,0.03)_45%,rgba(255,255,255,0.06)_50%,rgba(255,255,255,0.03)_55%,transparent_100%)] pointer-events-none`} />
            <div className="absolute inset-0 -translate-y-full group-hover:translate-y-full transition-transform duration-1000 bg-gradient-to-b from-transparent via-white/5 to-transparent pointer-events-none" />
            <button
              onClick={() => { setShowAddStudent(false); setUploadTab("manual"); setUploadFile(null); setUploadResult(null) }}
              className={`absolute top-4 right-4 p-2 rounded-xl transition-all ${isDarkMode ? "opacity-40 text-white hover:opacity-100 hover:bg-white/5" : "opacity-60 text-black hover:opacity-100 hover:bg-black/5"}`}
            >
              <X className="h-4 w-4" />
            </button>

            <h2 className={`text-xl font-display font-black uppercase tracking-tight mb-6 ${isDarkMode ? "text-white" : "text-black"}`}>
              Add Student
            </h2>

            {/* Tabs */}
            <div className={`flex items-center gap-1 p-1 rounded-2xl border mb-6 ${isDarkMode ? "border-white/10 bg-white/5" : "border-black/10 bg-black/5"}`}>
              <button
                onClick={() => { setUploadTab("manual"); setUploadResult(null) }}
                className={`flex-1 px-3 py-1.5 rounded-xl text-[10px] font-mono uppercase tracking-[0.2em] transition-all ${uploadTab === "manual" ? (isDarkMode ? "bg-white text-black font-bold" : "bg-black text-white font-bold") : "opacity-40 hover:opacity-100"}`}
              >
                <User className="h-3 w-3 inline-block mr-1.5 -mt-0.5" /> Manual Entry
              </button>
              <button
                onClick={() => { setUploadTab("csv"); setUploadResult(null) }}
                className={`flex-1 px-3 py-1.5 rounded-xl text-[10px] font-mono uppercase tracking-[0.2em] transition-all ${uploadTab === "csv" ? (isDarkMode ? "bg-white text-black font-bold" : "bg-black text-white font-bold") : "opacity-40 hover:opacity-100"}`}
              >
                <Database className="h-3 w-3 inline-block mr-1.5 -mt-0.5" /> CSV Upload
              </button>
            </div>

            {uploadTab === "manual" ? (
              <form onSubmit={handleAddStudent} className="space-y-4">
                <div>
                  <label className={`text-[9px] font-mono uppercase tracking-widest ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>Student Name</label>
                  <input
                    value={studentForm.name}
                    onChange={(e) => setStudentForm((prev) => ({ ...prev, name: e.target.value }))}
                    required
                    placeholder="Full name"
                    className={`w-full mt-1 p-3 text-xs font-mono border rounded-xl focus:outline-none focus:border-blue-500/50 ${
                      isDarkMode ? "bg-white/5 border-white/10 text-white placeholder:text-white/20" : "bg-black/5 border-black/10 text-black placeholder:text-black/30"
                    }`}
                  />
                </div>
                <div>
                  <label className={`text-[9px] font-mono uppercase tracking-widest ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>Roll No</label>
                  <input
                    value={studentForm.roll_no}
                    onChange={(e) => setStudentForm((prev) => ({ ...prev, roll_no: e.target.value }))}
                    required
                    placeholder="e.g. STD001"
                    className={`w-full mt-1 p-3 text-xs font-mono border rounded-xl focus:outline-none focus:border-blue-500/50 ${
                      isDarkMode ? "bg-white/5 border-white/10 text-white placeholder:text-white/20" : "bg-black/5 border-black/10 text-black placeholder:text-black/30"
                    }`}
                  />
                </div>
                <div>
                  <label className={`text-[9px] font-mono uppercase tracking-widest ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>Assigned Class <span className="opacity-50">(optional)</span></label>
                  <input
                    value={studentForm.assigned_class}
                    onChange={(e) => setStudentForm((prev) => ({ ...prev, assigned_class: e.target.value }))}
                    placeholder="e.g. Class 10A"
                    className={`w-full mt-1 p-3 text-xs font-mono border rounded-xl focus:outline-none focus:border-blue-500/50 ${
                      isDarkMode ? "bg-white/5 border-white/10 text-white placeholder:text-white/20" : "bg-black/5 border-black/10 text-black placeholder:text-black/30"
                    }`}
                  />
                </div>
                <div>
                  <label className={`text-[9px] font-mono uppercase tracking-widest ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>Password</label>
                  <input
                    type="password"
                    value={studentForm.password}
                    onChange={(e) => setStudentForm((prev) => ({ ...prev, password: e.target.value }))}
                    required
                    placeholder="Min 6 characters"
                    className={`w-full mt-1 p-3 text-xs font-mono border rounded-xl focus:outline-none focus:border-blue-500/50 ${
                      isDarkMode ? "bg-white/5 border-white/10 text-white placeholder:text-white/20" : "bg-black/5 border-black/10 text-black placeholder:text-black/30"
                    }`}
                  />
                </div>
                <button
                  type="submit"
                  disabled={creatingStudent}
                  className="w-full py-3 bg-blue-500 text-black text-[10px] font-mono uppercase tracking-[0.3em] font-bold hover:scale-[1.02] transition-all rounded-xl disabled:opacity-50"
                >
                  {creatingStudent ? "ADDING..." : "ADD STUDENT"}
                </button>
              </form>
            ) : (
              <div className="space-y-4">
                {/* Expected format info */}
                <div className={`p-4 rounded-2xl border ${isDarkMode ? "bg-white/5 border-white/10" : "bg-black/5 border-black/10"}`}>
                  <p className={`text-[9px] font-mono uppercase tracking-widest mb-2 ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>Expected CSV Columns</p>
                  <div className={`text-[10px] font-mono space-y-0.5 ${isDarkMode ? "text-white/60" : "text-black/60"}`}>
                    <p><span className="text-blue-400 font-bold">name</span> <span className="opacity-40">(required)</span> — Student name</p>
                    <p><span className="text-blue-400 font-bold">roll_no</span> <span className="opacity-40">(required)</span> — Unique roll number</p>
                    <p><span className="opacity-80">class</span> <span className="opacity-40">(optional)</span> — Class/section</p>
                    <p><span className="opacity-80">password</span> <span className="opacity-40">(optional, defaults to roll_no)</span></p>
                  </div>
                </div>

                {/* File drop zone */}
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) setUploadFile(f) }}
                  className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer hover:border-blue-500/50 ${
                    uploadFile
                      ? (isDarkMode ? "border-blue-500/50 bg-blue-500/5" : "border-blue-500/50 bg-blue-500/5")
                      : (isDarkMode ? "border-white/20 hover:border-white/40" : "border-black/20 hover:border-black/40")
                  }`}
                  onClick={() => document.getElementById("csv-file-input")?.click()}
                >
                  <input
                    id="csv-file-input"
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) setUploadFile(f) }}
                  />
                  {uploadFile ? (
                    <div className="flex flex-col items-center gap-2">
                      <Database className={`h-6 w-6 ${isDarkMode ? "text-blue-400" : "text-blue-600"}`} />
                      <span className={`text-xs font-mono font-bold ${isDarkMode ? "text-white" : "text-black"}`}>{uploadFile.name}</span>
                      <span className={`text-[9px] font-mono opacity-40`}>{(uploadFile.size / 1024).toFixed(1)} KB</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); setUploadFile(null); setUploadResult(null) }}
                        className="text-[9px] font-mono uppercase tracking-widest text-red-400 hover:text-red-300 mt-1"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <Database className={`h-6 w-6 ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`} />
                      <span className={`text-[10px] font-mono uppercase tracking-widest ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>
                        Drop CSV file here or click to browse
                      </span>
                    </div>
                  )}
                </div>

                {/* Upload button */}
                {uploadFile && !uploadResult && (
                  <button
                    onClick={async () => {
                      if (!uploadFile) return
                      setUploading(true)
                      setUploadResult(null)
                      const total: { added: number; failed: number; errors: string[] } = { added: 0, failed: 0, errors: [] }
                      try {
                        const text = await new Promise<string>((resolve, reject) => {
                          const reader = new FileReader()
                          reader.onload = (e) => resolve(e.target?.result as string)
                          reader.onerror = () => reject(new Error("Failed to read file"))
                          reader.readAsText(uploadFile)
                        })

                        const lines = text.split(/\r?\n/).filter(Boolean)
                        if (lines.length < 2) {
                          total.failed++
                          total.errors.push("CSV must have a header row and at least one data row")
                        } else {
                          const headers = parseCSVLine(lines[0])
                          const nameIdx = headers.findIndex((h) => /name/i.test(h))
                          const rollIdx = headers.findIndex((h) => /roll/i.test(h))
                          const classIdx = headers.findIndex((h) => /class/i.test(h))
                          const passIdx = headers.findIndex((h) => /pass/i.test(h))

                          if (nameIdx === -1 || rollIdx === -1) {
                            total.errors.push('CSV must have "name" and "roll_no" columns')
                            total.failed++
                          } else {
                            for (let i = 1; i < lines.length; i++) {
                              const cols = parseCSVLine(lines[i])
                              const name = cols[nameIdx]?.trim()
                              const roll_no = cols[rollIdx]?.trim()
                              if (!name || !roll_no) {
                                total.failed++
                                total.errors.push(`Row ${i}: missing name or roll_no`)
                                continue
                              }
                              try {
                                await createSchoolStudent({
                                  name,
                                  roll_no,
                                  password: passIdx !== -1 ? (cols[passIdx]?.trim() || roll_no) : roll_no,
                                  assigned_class: classIdx !== -1 ? (cols[classIdx]?.trim() || undefined) : undefined,
                                })
                                total.added++
                              } catch (err: any) {
                                total.failed++
                                total.errors.push(`Row ${i} (${name}): ${err.message}`)
                              }
                            }
                          }
                        }

                        setUploadResult(total)
                        if (total.added > 0) {
                          toast.success(`${total.added} students added successfully`)
                          await loadDashboard()
                        }
                      } catch (err) {
                        toast.error("Upload failed: " + (err as Error).message)
                      } finally {
                        setUploading(false)
                      }
                    }}
                    disabled={uploading}
                    className="w-full py-3 bg-blue-500 text-black text-[10px] font-mono uppercase tracking-[0.3em] font-bold hover:scale-[1.02] transition-all rounded-xl disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {uploading ? (
                      <>
                        <div className="h-3.5 w-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                        PROCESSING...
                      </>
                    ) : "UPLOAD CSV"}
                  </button>
                )}

                {/* Upload results */}
                {uploadResult && (
                  <div className={`p-4 rounded-2xl border ${isDarkMode ? "bg-white/5 border-white/10" : "bg-black/5 border-black/10"}`}>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className={`text-[10px] font-mono uppercase tracking-widest font-bold ${isDarkMode ? "text-white" : "text-black"}`}>Upload Results</h3>
                      <button
                        onClick={() => setUploadResult(null)}
                        className={`p-1 rounded-lg transition-all ${isDarkMode ? "hover:bg-white/5" : "hover:bg-black/5"}`}
                      >
                        <X className="h-3 w-3 opacity-40" />
                      </button>
                    </div>
                    <div className="flex gap-4 mb-3">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-emerald-500" />
                        <span className={`text-[10px] font-mono ${isDarkMode ? "text-white/60" : "text-black/60"}`}>{uploadResult.added} added</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full ${uploadResult.failed > 0 ? "bg-red-500" : "bg-zinc-500"}`} />
                        <span className={`text-[10px] font-mono ${isDarkMode ? "text-white/60" : "text-black/60"}`}>{uploadResult.failed} failed</span>
                      </div>
                    </div>
                    {uploadResult.errors.length > 0 && (
                      <div className={`max-h-32 overflow-y-auto space-y-1 custom-scrollbar`}>
                        {uploadResult.errors.map((err, i) => (
                          <p key={i} className="text-[9px] font-mono text-red-400/80 leading-relaxed">{err}</p>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </div>
      )}

      {/* Footer */}
      <div className="fixed bottom-10 left-10 flex items-center gap-4 pointer-events-none opacity-10">
        <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
        <span className={`text-[10px] font-mono tracking-[0.5em] uppercase ${isDarkMode ? "text-white" : "text-black"}`}>FACULTY_PORTAL // ACTIVE</span>
      </div>
    </div>
  )
}
