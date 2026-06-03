"use client"

import React, { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { LogOut, Users, GraduationCap, RefreshCw, Plus, X, Search, BarChart3, Sun, Moon, User, Activity, TrendingUp, LayoutDashboard, ChevronLeft, ChevronRight as ChevronRightIcon, Database, Phone, MessageSquare, Trash2 } from "lucide-react"
import { removeApiKey } from "@/lib/auth"
import { createSchoolFaculty, getSchoolFaculty, getSchoolStats, getSchoolStudents, SchoolFacultyMember, SchoolStudent, deleteSchoolFaculty, deleteSchoolStudent, freezeUser, getFrozenUsers, unfreezeUser } from "@/lib/chat-api"
import { toast } from "sonner"

const StatCard = ({ title, value, icon: Icon, color, subtext, isDarkMode }: { title: string, value: any, icon: any, color: string, subtext?: string, isDarkMode: boolean }) => (
    <div className={`relative border rounded-[2.5rem] p-8 overflow-hidden group ${isDarkMode ? "bg-gradient-to-br from-zinc-900 via-black to-zinc-900 border-white/30" : "bg-gradient-to-br from-zinc-100 via-white to-zinc-100 border-zinc-800/50"}`}>
        <div className={`absolute inset-0 bg-[linear-gradient(110deg,transparent_0%,rgba(255,255,255,0.03)_45%,rgba(255,255,255,0.06)_50%,rgba(255,255,255,0.03)_55%,transparent_100%)] pointer-events-none`} />
        <div className="absolute inset-0 -translate-y-full group-hover:translate-y-full transition-transform duration-1000 bg-gradient-to-b from-transparent via-white/5 to-transparent pointer-events-none" />
        <span className={`text-[9px] font-mono uppercase tracking-[0.3em] ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>{title}</span>
        <div className="flex items-baseline gap-2 mt-2">
            <h4 className={`text-2xl font-display font-black tracking-tight ${isDarkMode ? "text-white" : "text-black"}`}>{value}</h4>
            {subtext && <span className={`text-[10px] font-mono ${isDarkMode ? "opacity-30 text-white" : "opacity-50 text-black"}`}>{subtext}</span>}
        </div>
        <div className={`h-[2px] w-8 mt-4 rounded-full`} style={{ backgroundColor: color }} />
    </div>
)

export default function SchoolAdminPage() {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(true)
  const [faculty, setFaculty] = useState<SchoolFacultyMember[]>([])
  const [students, setStudents] = useState<SchoolStudent[]>([])
  const [stats, setStats] = useState<{ total_students: number; total_faculty: number; leaderboard: Array<{ name: string; daily_chats: number }> }>({
    total_students: 0,
    total_faculty: 0,
    leaderboard: [],
  })
  const [displayMode, setDisplayMode] = useState<"dashboard" | "table">("dashboard")
  const [view, setView] = useState<"overview" | "faculty" | "students" | "usage">("overview")
  const [tableFilter, setTableFilter] = useState<"all" | "faculty" | "students">("all")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
  const [query, setQuery] = useState("")
  const [sectionFilter, setSectionFilter] = useState("")
  const [showAddFaculty, setShowAddFaculty] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [creatingFaculty, setCreatingFaculty] = useState(false)
  const [confirmDeleteFacultyCode, setConfirmDeleteFacultyCode] = useState<string | null>(null)
  const [deletingFacultyCode, setDeletingFacultyCode] = useState<string | null>(null)
  const [confirmDeleteStudentId, setConfirmDeleteStudentId] = useState<string | null>(null)
  const [deletingStudentId, setDeletingStudentId] = useState<string | null>(null)
  const [frozenUserIds, setFrozenUserIds] = useState<string[]>([])
  const [togglingFreezeUserId, setTogglingFreezeUserId] = useState<string | null>(null)
  const [facultyForm, setFacultyForm] = useState({
    name: "",
    email: "",
    password: "",
    admin_code: "",
    quota: "50",
    assigned_class: "",
  })

  const ITEMS_PER_PAGE = 8

  const loadDashboard = async () => {
    setRefreshing(true)
    try {
      const [statsRes, facultyRes, studentsRes, frozenRes] = await Promise.all([
        getSchoolStats(),
        getSchoolFaculty(),
        getSchoolStudents(),
        getFrozenUsers().catch(() => ({ success: true, frozen_users: [] as { user_id: string }[] })),
      ])

      setStats({
        total_students: Number(statsRes.total_students || 0),
        total_faculty: Number(statsRes.total_faculty || 0),
        leaderboard: statsRes.leaderboard || [],
      })
      setFaculty(facultyRes.faculty || [])
      setStudents(studentsRes.students || [])
      setFrozenUserIds((frozenRes as any).frozen_users?.map((item: any) => item.user_id) || [])
    } catch (err) {
      toast.error("Failed to load school dashboard: " + (err as Error).message)
    } finally {
      setRefreshing(false)
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboard()
  }, [])

  const filteredFaculty = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return faculty
    return faculty.filter((f) => [f.name, f.email, f.admin_code, f.assigned_class].some((v) => (v || "").toLowerCase().includes(q)))
  }, [faculty, query])

  const uniqueClasses = useMemo(() => {
    const classes = new Set(students.map(s => s.assigned_class).filter(Boolean) as string[])
    return ["", ...Array.from(classes).sort()]
  }, [students])

  const filteredStudents = useMemo(() => {
    const q = query.trim().toLowerCase()
    let list = students
    if (sectionFilter) {
      list = list.filter(s => s.assigned_class === sectionFilter)
    }
    if (!q) return list
    return list.filter((s) => [s.name, s.mobile_number, s.assigned_class].some((v) => (v || "").toLowerCase().includes(q)))
  }, [students, query, sectionFilter])

  const totalFacultyPages = Math.ceil(filteredFaculty.length / ITEMS_PER_PAGE)
  const paginatedFaculty = filteredFaculty.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  const totalStudentPages = Math.ceil(filteredStudents.length / ITEMS_PER_PAGE)
  const paginatedStudents = filteredStudents.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  const handleCreateFaculty = async (e: React.FormEvent) => {
    e.preventDefault()
    const payload = {
      name: facultyForm.name.trim(),
      email: facultyForm.email.trim() || undefined,
      password: facultyForm.password,
      admin_code: facultyForm.admin_code.trim().toUpperCase(),
      quota: Number(facultyForm.quota || 50),
      assigned_class: facultyForm.assigned_class.trim() || undefined,
    }

    if (!payload.name || !payload.password || !payload.admin_code) {
      toast.error("Name, Admin Code and Password are required")
      return
    }
    if (payload.password.length < 8) {
      toast.error("Faculty password minimum 8 chars")
      return
    }

    setCreatingFaculty(true)
    try {
      await createSchoolFaculty(payload)
      toast.success("Faculty added successfully")
      setShowAddFaculty(false)
      setFacultyForm({ name: "", email: "", password: "", admin_code: "", quota: "50", assigned_class: "" })
      await loadDashboard()
    } catch (err) {
      toast.error("Failed to add faculty: " + (err as Error).message)
    } finally {
      setCreatingFaculty(false)
    }
  }

  const handleDeleteFaculty = async (adminCode: string) => {
    setDeletingFacultyCode(adminCode)
    try {
      await deleteSchoolFaculty(adminCode)
      setFaculty(prev => prev.filter(f => f.admin_code !== adminCode))
      setConfirmDeleteFacultyCode(null)
      toast.success("Faculty deleted successfully")
    } catch (err) {
      toast.error("Failed to delete faculty: " + (err as Error).message)
    } finally {
      setDeletingFacultyCode(null)
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

  const handleToggleFreeze = async (userId: string, isFrozen: boolean, label: string) => {
    setTogglingFreezeUserId(userId)
    try {
      if (isFrozen) {
        await unfreezeUser(userId)
        setFrozenUserIds(prev => prev.filter(id => id !== userId))
        toast.success(`${label} unfrozen successfully`)
      } else {
        await freezeUser(userId)
        setFrozenUserIds(prev => Array.from(new Set([...prev, userId])))
        toast.success(`${label} frozen successfully`)
      }
    } catch (err) {
      toast.error(`Failed to ${isFrozen ? "unfreeze" : "freeze"} ${label.toLowerCase()}: ` + (err as Error).message)
    } finally {
      setTogglingFreezeUserId(null)
    }
  }

  const handleLogout = () => {
    removeApiKey()
    window.location.href = "/"
  }

  const handleExportCSV = () => {
    const headers = ["Type", "Name", "Email / Mobile", "Code / Class", "Quota / Chats", "Created"]
    const facultyRows = faculty.map(f => ["Faculty", f.name, f.email || "—", f.admin_code || "—", String(f.student_quota || 0), f.created_at ? new Date(f.created_at).toLocaleDateString() : "—"])
    const studentRows = students.map(s => ["Student", s.name, s.mobile_number || "—", s.assigned_class || "—", String(s.daily_chats || 0), s.created_at ? new Date(s.created_at).toLocaleDateString() : "—"])
    const allRows = [...facultyRows, ...studentRows]
    const csv = [headers, ...allRows].map(r => r.join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "school_data_export.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  const allTableData = useMemo(() => {
    const facultyEntries = faculty.map(f => ({
      type: "Faculty" as const,
      id: f.id,
      admin_code: f.admin_code,
      name: f.name,
      contact: f.email || "—",
      codeOrClass: f.admin_code || "—",
      metric: String(f.student_quota || 0),
      metricLabel: "Quota" as const,
      created: f.created_at ? new Date(f.created_at).toLocaleDateString() : "—",
      isFrozen: frozenUserIds.includes(f.id),
    }))
    const studentEntries = students.map(s => ({
      type: "Student" as const,
      id: s.id,
      name: s.name,
      contact: s.mobile_number || "—",
      codeOrClass: s.assigned_class || "—",
      metric: String(s.daily_chats || 0),
      metricLabel: "Chats" as const,
      created: s.created_at ? new Date(s.created_at).toLocaleDateString() : "—",
      isFrozen: frozenUserIds.includes(s.id),
    }))
    const combined = tableFilter === "faculty" ? facultyEntries : tableFilter === "students" ? studentEntries : [...facultyEntries, ...studentEntries]
    const sectioned = sectionFilter ? combined.filter(item => item.type !== "Student" || item.codeOrClass === sectionFilter) : combined
    const q = query.trim().toLowerCase()
    const filtered = !q ? sectioned : sectioned.filter(item =>
      [item.name, item.contact, item.codeOrClass, item.type].some(v => v.toLowerCase().includes(q))
    )
    return filtered.sort((a, b) => {
      const cmp = a.name.localeCompare(b.name)
      return sortOrder === "asc" ? cmp : -cmp
    })
  }, [faculty, students, query, tableFilter, sortOrder, sectionFilter, frozenUserIds])

  const totalTablePages = Math.ceil(allTableData.length / ITEMS_PER_PAGE)
  const paginatedTableData = allTableData.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  if (loading) {
    return (
      <div className={`min-h-screen ${isDarkMode ? "bg-[#0a0a0a]" : "bg-white"} flex items-center justify-center`}>
        <div className="h-8 w-8 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className={`h-screen w-full ${isDarkMode ? "bg-[#0a0a0a] text-white" : "bg-white text-black"} font-sans selection:bg-white selection:text-black overflow-hidden flex flex-col transition-colors duration-500`}>
      <div className={`absolute inset-0 noise opacity-[0.03] pointer-events-none ${isDarkMode ? "" : "invert"}`} />

      {/* Top Navigation */}
      <nav className={`h-20 flex items-center justify-between px-10 border-b ${isDarkMode ? "border-white/30 bg-black/80" : "border-black/5 bg-white/80"} backdrop-blur-2xl sticky top-0 z-[100]`}>
        <div className="flex items-center gap-12">
          <Link href="/" className="flex items-center gap-4 group">
            <div className={`h-6 w-6 ${isDarkMode ? "bg-white" : "bg-black"} flex items-center justify-center transition-transform group-hover:rotate-45`}>
              <div className={`h-1.5 w-1.5 ${isDarkMode ? "bg-black" : "bg-white"}`} />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="font-display font-black tracking-tighter text-xl">RUDRANEX</span>
              <span className="font-serif italic opacity-40 text-xl tracking-tighter">school</span>
            </div>
          </Link>

          <div className={`flex items-center gap-1 p-1 rounded-2xl border ${isDarkMode ? "border-white/30 bg-white/5" : "border-black/10 bg-black/5"}`}>
            <button
              onClick={() => { setDisplayMode('dashboard'); setCurrentPage(1) }}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-mono uppercase tracking-[0.2em] transition-all ${displayMode === 'dashboard' ? (isDarkMode ? "bg-white text-black font-bold" : "bg-black text-white font-bold") : "opacity-40 hover:opacity-100"}`}
            >
              <LayoutDashboard className="h-3.5 w-3.5 inline-block mr-1.5 -mt-0.5" /> Dashboard
            </button>
            <button
              onClick={() => { setDisplayMode('table'); setCurrentPage(1) }}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-mono uppercase tracking-[0.2em] transition-all ${displayMode === 'table' ? (isDarkMode ? "bg-white text-black font-bold" : "bg-black text-white font-bold") : "opacity-40 hover:opacity-100"}`}
            >
              <Database className="h-3.5 w-3.5 inline-block mr-1.5 -mt-0.5" /> Table
            </button>
          </div>

        </div>

        <div className="flex items-center gap-6">
          <button
            onClick={() => setShowAddFaculty(true)}
            className="px-4 py-2 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono uppercase tracking-[0.2em] hover:bg-emerald-500/10 transition-all rounded-full flex items-center gap-2"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Faculty
          </button>
          <button
            onClick={loadDashboard}
            disabled={refreshing}
            className={`p-2 rounded-full border ${isDarkMode ? "border-white/30 hover:bg-white/10" : "border-white/10 hover:bg-white/5"} transition-all ${refreshing ? "animate-spin" : ""}`}
          >
            <RefreshCw className="h-4 w-4 opacity-40" />
          </button>

          <Link
            href="/chat"
            className={`h-10 w-10 rounded-2xl border flex items-center justify-center transition-all ${isDarkMode ? "border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500 hover:text-black" : "border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500 hover:text-white"}`}
            title="Chat"
          >
            <MessageSquare className="h-4 w-4 text-emerald-400 group-hover:text-black" />
          </Link>

          <div className="h-8 w-[1px] bg-white/10 mx-2" />

          <div className="flex items-center gap-4">
            <button
              onClick={() => { setDisplayMode('dashboard'); setView('overview'); setCurrentPage(1); setQuery("") }}
              className={`h-10 w-10 rounded-2xl border flex items-center justify-center transition-all ${isDarkMode ? "border-white/30 hover:bg-white/10" : "border-black/10 hover:bg-black/5"}`}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`h-10 w-10 rounded-2xl border flex items-center justify-center cursor-pointer transition-all ${isDarkMode ? "border-white/30 hover:bg-white/10" : "border-black/10 hover:bg-black/5"}`}
            >
              {isDarkMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </div>
            <div
              onClick={handleLogout}
              className="h-10 w-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center group cursor-pointer overflow-hidden hover:bg-amber-500 transition-all"
            >
              <LogOut className="h-4 w-4 text-amber-500 group-hover:text-black transition-colors" />
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className={`flex-1 overflow-y-auto p-10 relative z-10 w-full max-w-[1800px] mx-auto custom-scrollbar ${isDarkMode ? "text-white" : "text-black"}`}>
        <AnimatePresence mode="wait">
{displayMode === 'dashboard' && view === "overview" && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-12 gap-8"
            >
              {/* Left Panel: Stats Summary */}
              <div className="col-span-12 lg:col-span-3 space-y-8">
                <div className={`relative border p-8 rounded-[2.5rem] backdrop-blur-xl overflow-hidden group ${
                  isDarkMode ? "bg-gradient-to-br from-zinc-900 via-black to-zinc-900 border-white/30" : "bg-gradient-to-br from-zinc-100 via-white to-zinc-100 border-zinc-800/50"
                }`}>
                  <div className={`absolute inset-0 bg-[linear-gradient(110deg,transparent_0%,rgba(255,255,255,0.03)_45%,rgba(255,255,255,0.06)_50%,rgba(255,255,255,0.03)_55%,transparent_100%)] pointer-events-none`} />
                  <div className="absolute inset-0 -translate-y-full group-hover:translate-y-full transition-transform duration-1000 bg-gradient-to-b from-transparent via-white/5 to-transparent pointer-events-none" />
                  <div className="flex items-center justify-between mb-8">
                    <h3 className={`text-xs font-display font-black uppercase tracking-[0.2em] ${isDarkMode ? "text-white" : "text-black"}`}>Institution Summary</h3>
                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  </div>

                  <div className="space-y-4">
                    <div className={`flex items-center justify-between p-4 rounded-2xl ${isDarkMode ? "bg-white/5" : "bg-black/5"}`}>
                      <div className="flex items-center gap-3">
                        <GraduationCap className="h-4 w-4 text-blue-400" />
                        <span className="text-[10px] font-mono uppercase tracking-widest opacity-60">Students</span>
                      </div>
                      <span className="text-lg font-display font-black">{stats.total_students}</span>
                    </div>
                    <div className={`flex items-center justify-between p-4 rounded-2xl ${isDarkMode ? "bg-white/5" : "bg-black/5"}`}>
                      <div className="flex items-center gap-3">
                        <Users className="h-4 w-4 text-emerald-400" />
                        <span className="text-[10px] font-mono uppercase tracking-widest opacity-60">Faculty</span>
                      </div>
                      <span className="text-lg font-display font-black">{stats.total_faculty}</span>
                    </div>
                    <div className={`flex items-center justify-between p-4 rounded-2xl ${isDarkMode ? "bg-white/5" : "bg-black/5"}`}>
                      <div className="flex items-center gap-3">
                        <BarChart3 className="h-4 w-4 text-amber-400" />
                        <span className="text-[10px] font-mono uppercase tracking-widest opacity-60">Top Activity</span>
                      </div>
                      <span className="text-xs font-mono text-right leading-tight">
                        {stats.leaderboard[0] ? `${stats.leaderboard[0].name} (${stats.leaderboard[0].daily_chats || 0})` : "N/A"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className={`relative border p-8 rounded-[2.5rem] backdrop-blur-xl text-center overflow-hidden group ${
                  isDarkMode ? "bg-gradient-to-br from-zinc-900 via-black to-zinc-900 border-white/30" : "bg-gradient-to-br from-zinc-100 via-white to-zinc-100 border-zinc-800/50"
                }`}>
                  <div className={`absolute inset-0 bg-[linear-gradient(110deg,transparent_0%,rgba(255,255,255,0.03)_45%,rgba(255,255,255,0.06)_50%,rgba(255,255,255,0.03)_55%,transparent_100%)] pointer-events-none`} />
                  <div className="absolute inset-0 -translate-y-full group-hover:translate-y-full transition-transform duration-1000 bg-gradient-to-b from-transparent via-white/5 to-transparent pointer-events-none" />
                  <Database className={`h-8 w-8 mx-auto mb-4 ${isDarkMode ? "opacity-20 text-white" : "opacity-30 text-black"}`} />
                  <h4 className={`text-[10px] font-mono uppercase tracking-[0.3em] ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>System Core</h4>
                  <p className={`text-xs font-bold mt-2 ${isDarkMode ? "text-white" : "text-black"}`}>Active Node: EDU-01</p>
                </div>
              </div>

              {/* Right Panel */}
              <div className="col-span-12 lg:col-span-9 space-y-8">
                {/* Institution Analytics */}
                <div className={`relative border p-10 rounded-[3rem] overflow-hidden group ${
                  isDarkMode ? "bg-gradient-to-br from-zinc-900 via-black to-zinc-900 border-white/30" : "bg-gradient-to-br from-zinc-100 via-white to-zinc-100 border-zinc-800/50"
                }`}>
                  <div className={`absolute inset-0 bg-[linear-gradient(110deg,transparent_0%,rgba(255,255,255,0.03)_45%,rgba(255,255,255,0.06)_50%,rgba(255,255,255,0.03)_55%,transparent_100%)] pointer-events-none`} />
                  <div className="absolute inset-0 -translate-y-full group-hover:translate-y-full transition-transform duration-1000 bg-gradient-to-b from-transparent via-white/5 to-transparent pointer-events-none" />
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className={`text-lg font-display font-black tracking-tight uppercase ${isDarkMode ? "text-white" : "text-black"}`}>Institution Analytics</h3>
                      <p className={`text-[10px] font-mono uppercase tracking-[0.3em] mt-1 ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>Live spectral analysis of school assets</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-emerald-500" />
                        <span className={`text-[9px] font-mono uppercase tracking-widest ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>Healthy</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard title="Total Students" value={stats.total_students} icon={GraduationCap} color="#3b82f6" isDarkMode={isDarkMode} />
                    <StatCard title="Total Faculty" value={stats.total_faculty} icon={Users} color="#10b981" isDarkMode={isDarkMode} />
                    <StatCard title="Active Chats" value={stats.leaderboard.reduce((sum, l) => sum + (l.daily_chats || 0), 0)} icon={MessageSquare} color="#f59e0b" isDarkMode={isDarkMode} />
                    <StatCard title="Top Student" value={stats.leaderboard[0]?.name || "N/A"} icon={TrendingUp} color="#8b5cf6" isDarkMode={isDarkMode} />
                  </div>
                </div>

                {/* School Dashboard */}
                <div className={`relative border p-10 rounded-[3rem] overflow-hidden group ${
                  isDarkMode ? "bg-gradient-to-br from-zinc-900 via-black to-zinc-900 border-white/30" : "bg-gradient-to-br from-zinc-100 via-white to-zinc-100 border-zinc-800/50"
                }`}>
                  <div className={`absolute inset-0 bg-[linear-gradient(110deg,transparent_0%,rgba(255,255,255,0.03)_45%,rgba(255,255,255,0.06)_50%,rgba(255,255,255,0.03)_55%,transparent_100%)] pointer-events-none`} />
                  <div className="absolute inset-0 -translate-y-full group-hover:translate-y-full transition-transform duration-1000 bg-gradient-to-b from-transparent via-white/5 to-transparent pointer-events-none" />
                  <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[100px] rounded-full" />

                  <div className="flex items-center justify-between mb-10 relative z-10">
                    <div>
                      <h2 className={`text-3xl font-display font-black tracking-tight uppercase ${isDarkMode ? "text-white" : "text-black"}`}>School Dashboard</h2>
                      <p className={`text-[10px] font-mono uppercase mt-2 tracking-[0.4em] ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>Institution control center • {stats.total_students + stats.total_faculty} total members</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative z-10">
                    {/* Leaderboard */}
                    <div className={`relative border rounded-[2.5rem] p-8 overflow-hidden group ${
                      isDarkMode ? "bg-white/5 border-white/30" : "bg-black/5 border-black/10"
                    }`}>
                      <div className={`absolute inset-0 bg-[linear-gradient(110deg,transparent_0%,rgba(255,255,255,0.03)_45%,rgba(255,255,255,0.06)_50%,rgba(255,255,255,0.03)_55%,transparent_100%)] pointer-events-none`} />
                      <div className="flex items-center gap-3 mb-6">
                        <TrendingUp className={`h-5 w-5 ${isDarkMode ? "text-emerald-400" : "text-emerald-600"}`} />
                        <h3 className={`text-xs font-display font-black uppercase tracking-[0.2em] ${isDarkMode ? "text-white" : "text-black"}`}>Top Student Activity</h3>
                      </div>
                      <div className="space-y-3">
                        {stats.leaderboard.length === 0 && (
                          <p className={`text-[10px] font-mono uppercase tracking-widest ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>No leaderboard data yet</p>
                        )}
                        {stats.leaderboard.slice(0, 10).map((item, idx) => (
                          <div key={`${item.name}-${idx}`} className={`flex items-center justify-between p-3 rounded-xl transition-all ${isDarkMode ? "hover:bg-white/5" : "hover:bg-black/5"}`}>
                            <div className="flex items-center gap-3">
                              <span className={`h-6 w-6 rounded-lg flex items-center justify-center text-[9px] font-mono font-bold ${idx === 0 ? "bg-amber-500/20 text-amber-400" : idx === 1 ? "bg-zinc-500/20 text-zinc-400" : idx === 2 ? "bg-amber-700/20 text-amber-600" : isDarkMode ? "bg-white/5 text-white/40" : "bg-black/5 text-black/40"}`}>
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
                      isDarkMode ? "bg-white/5 border-white/30" : "bg-black/5 border-black/10"
                    }`}>
                      <div className={`absolute inset-0 bg-[linear-gradient(110deg,transparent_0%,rgba(255,255,255,0.03)_45%,rgba(255,255,255,0.06)_50%,rgba(255,255,255,0.03)_55%,transparent_100%)] pointer-events-none`} />
                      <div className="flex items-center gap-3 mb-6">
                        <Activity className={`h-5 w-5 ${isDarkMode ? "text-emerald-400" : "text-emerald-600"}`} />
                        <h3 className={`text-xs font-display font-black uppercase tracking-[0.2em] ${isDarkMode ? "text-white" : "text-black"}`}>Quick Actions</h3>
                      </div>
                      <div className="grid grid-cols-1 gap-4">
                        <button
                          onClick={() => setShowAddFaculty(true)}
                          className={`w-full p-5 border rounded-[2rem] text-left transition-all hover:scale-[1.02] active:scale-[0.98] group ${
                            isDarkMode ? "border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10" : "border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10"
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                              <Users className="h-5 w-5 text-emerald-400" />
                            </div>
                            <div>
                              <h4 className="text-sm font-display font-black text-emerald-400">Add Faculty Member</h4>
                              <p className={`text-[9px] font-mono uppercase tracking-widest mt-1 ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>Create a new faculty account</p>
                            </div>
                          </div>
                        </button>
                        {/* Removed: Manage Students quick action per request */}
                        <button
                          onClick={() => setView("usage")}
                          className={`w-full p-5 border rounded-[2rem] text-left transition-all hover:scale-[1.02] active:scale-[0.98] group ${
                            isDarkMode ? "border-purple-500/30 bg-purple-500/5 hover:bg-purple-500/10" : "border-purple-500/30 bg-purple-500/5 hover:bg-purple-500/10"
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
                              <BarChart3 className="h-5 w-5 text-purple-400" />
                            </div>
                            <div>
                              <h4 className="text-sm font-display font-black text-purple-400">Student Usage</h4>
                              <p className={`text-[9px] font-mono uppercase tracking-widest mt-1 ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>View per-student AI usage & tokens</p>
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
                              <p className={`text-[9px] font-mono uppercase tracking-widest mt-1 ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>Sync latest institution metrics</p>
                            </div>
                          </div>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Student Usage Summary */}
                  <div className={`relative border rounded-[2.5rem] p-8 overflow-hidden group mt-8 ${
                    isDarkMode ? "bg-white/5 border-white/30" : "bg-black/5 border-black/10"
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
                            <th className="pb-4 font-bold">Student</th>
                            <th className="pb-4 font-bold text-center">Class</th>
                            <th className="pb-4 font-bold text-center">Chats</th>
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
                              <tr key={s.id} className={`border-t transition-colors ${isDarkMode ? "border-white/30 hover:bg-white/[0.02]" : "border-black/10 hover:bg-black/[0.02]"}`}>
                                <td className="py-3 pr-4">
                                  <div className="flex items-center gap-3">
                                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center border ${isDarkMode ? "bg-white/5 border-white/30" : "bg-black/5 border-black/10"}`}>
                                      <User className={`h-3.5 w-3.5 ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`} />
                                    </div>
                                      <div className="flex flex-col">
                                      <span className={`text-xs font-bold ${isDarkMode ? "text-white" : "text-black"}`}>{s.name}</span>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-3 px-4 text-center">
                                  <span className={`text-[10px] px-2 py-0.5 rounded ${isDarkMode ? "bg-blue-500/10 text-blue-400" : "bg-blue-500/10 text-blue-600"}`}>
                                    {s.assigned_class || "—"}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-center">
                                  <span className={`font-bold ${isDarkMode ? "text-white" : "text-black"}`}>{s.daily_chats || 0}</span>
                                </td>
                                <td className="py-3 pl-4 text-right">
                                  <div className="flex items-center justify-end gap-3">
                                    <div className="w-24 h-1.5 rounded-full bg-white/10">
                                      <div className="h-full rounded-full bg-purple-500" style={{ width: `${Math.min(((s.daily_chats || 0) / 100) * 100, 100)}%` }} />
                                    </div>
                                  <span className={(isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black") + " text-[10px] font-mono"}>
                                    {Math.min(((s.daily_chats || 0) / 100) * 100, 100).toFixed(0)}%
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
          
          {displayMode === 'dashboard' && view === "faculty" && (
            <motion.div
              key="faculty"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className={`relative border rounded-[3rem] overflow-hidden backdrop-blur-3xl group ${
                isDarkMode ? "bg-gradient-to-br from-zinc-900 via-black to-zinc-900 border-white/30" : "bg-gradient-to-br from-zinc-100 via-white to-zinc-100 border-zinc-800/50"
              }`}
            >
              <div className={`absolute inset-0 bg-[linear-gradient(110deg,transparent_0%,rgba(255,255,255,0.03)_45%,rgba(255,255,255,0.06)_50%,rgba(255,255,255,0.03)_55%,transparent_100%)] pointer-events-none`} />
              <div className="absolute inset-0 -translate-y-full group-hover:translate-y-full transition-transform duration-1000 bg-gradient-to-b from-transparent via-white/5 to-transparent pointer-events-none" />
              <div className={`p-10 border-b flex flex-col lg:flex-row lg:items-center justify-between gap-6 ${isDarkMode ? "bg-black border-white/30" : "bg-white border-black/10"}`}>
                <div>
                  <h2 className={`text-3xl font-display font-black tracking-tight uppercase ${isDarkMode ? "text-white" : "text-black"}`}>Faculty Registry</h2>
                  <p className={`text-[10px] font-mono uppercase mt-2 tracking-[0.4em] ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>Institution educators • {filteredFaculty.length} members</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Search className={`absolute left-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 ${isDarkMode ? "opacity-20 text-white" : "opacity-40 text-black"}`} />
                    <input
                      type="text"
                      placeholder="FILTER FACULTY..."
                      value={query}
                      onChange={(e) => { setQuery(e.target.value); setCurrentPage(1) }}
                      className={`pl-11 pr-8 py-3 text-[10px] font-mono tracking-widest border rounded-2xl focus:outline-none focus:border-emerald-500/50 min-w-[250px] ${
                        isDarkMode ? "bg-white/5 border-white/30 text-white" : "bg-black/5 border-black/10 text-black placeholder:text-black/40"
                      }`}
                    />
                  </div>
                  <button
                    onClick={() => setShowAddFaculty(true)}
                    className={`px-6 py-3.5 text-[10px] font-mono uppercase tracking-[0.2em] font-bold hover:opacity-90 transition-all rounded-2xl bg-emerald-500 text-black flex items-center gap-2`}
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Faculty
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto relative overflow-hidden group">
                <div className="absolute inset-0 -translate-y-full group-hover:translate-y-full transition-transform duration-1000 bg-gradient-to-b from-transparent via-white/5 to-transparent pointer-events-none" />
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className={`text-[9px] font-mono uppercase tracking-[0.3em] ${isDarkMode ? "bg-black text-white opacity-40" : "bg-white text-black opacity-60"}`}>
                      <th className={`p-8 font-bold border-b ${isDarkMode ? "border-white/30" : "border-black/10"}`}>Identity</th>
                      <th className={`p-8 font-bold border-b ${isDarkMode ? "border-white/30" : "border-black/10"}`}>Admin Code</th>
                      <th className={`p-8 font-bold border-b ${isDarkMode ? "border-white/30" : "border-black/10"} text-center`}>Assigned Class</th>
                      <th className={`p-8 font-bold border-b ${isDarkMode ? "border-white/30" : "border-black/10"}`}>Quota</th>
                      <th className={`p-8 font-bold border-b ${isDarkMode ? "border-white/30" : "border-black/10"}`}>Created</th>
                      <th className={`p-8 font-bold border-b ${isDarkMode ? "border-white/30" : "border-black/10"} text-right`}>Actions</th>
                    </tr>
                  </thead>
                  <tbody className={`text-[11px] font-mono uppercase tracking-tight ${isDarkMode ? "text-white" : "text-black"}`}>
                    {paginatedFaculty.length === 0 ? (
                      <tr>
                        <td colSpan={6} className={`p-20 text-center font-display font-black text-2xl uppercase tracking-[1em] ${isDarkMode ? "opacity-20 text-white" : "opacity-40 text-black"}`}>Void Found</td>
                      </tr>
                    ) : (
                      paginatedFaculty.map((f) => {
                        const isFrozen = frozenUserIds.includes(f.id)
                        return (
                        <tr key={f.id} className={`border-b transition-colors group ${isDarkMode ? "border-white/30 hover:bg-white/[0.02]" : "border-black/10 hover:bg-black/[0.02]"}`}>
                          <td className="p-8">
                            <div className="flex items-center gap-4">
                              <div className={`h-10 w-10 rounded-xl flex items-center justify-center border ${isDarkMode ? "bg-white/5 border-white/30" : "bg-black/5 border-black/10"}`}>
                                <User className={`h-4 w-4 ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`} />
                              </div>
                              <div className="flex flex-col">
                                <span className={`text-[13px] font-bold tracking-tight ${isDarkMode ? "text-white" : "text-black"}`}>{f.name}</span>
                                <span className={`text-[9px] lowercase font-sans ${isDarkMode ? "opacity-30 text-white" : "opacity-50 text-black"}`}>{f.email || "—"}</span>
                              </div>
                            </div>
                          </td>
                          <td className="p-8">
                            <span className={`text-[10px] font-black w-fit px-2 py-0.5 rounded border ${isDarkMode ? "border-white/30 text-white" : "border-black/10 text-black"}`}>
                              {f.admin_code || "—"}
                            </span>
                          </td>
                          <td className="p-8 text-center">
                            <span className={`px-3 py-1 rounded-lg text-[10px] ${isDarkMode ? "bg-emerald-500/10 text-emerald-400" : "bg-emerald-500/10 text-emerald-600"}`}>
                              {f.assigned_class || "—"}
                            </span>
                          </td>
                          <td className="p-8">
                            <div className="flex items-center gap-2">
                              <span className={`font-bold ${isDarkMode ? "text-white" : "text-black"}`}>{f.student_quota || 0}</span>
                              <span className={`text-[9px] ${isDarkMode ? "opacity-30 text-white" : "opacity-50 text-black"}`}>SEATS</span>
                            </div>
                          </td>
                          <td className="p-8 text-[10px] opacity-40">
                            {f.created_at ? new Date(f.created_at).toLocaleDateString() : "—"}
                          </td>
                          <td className="p-8 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleToggleFreeze(f.id, isFrozen, "Faculty")}
                                disabled={togglingFreezeUserId === f.id}
                                className={`px-3 py-2 text-[9px] font-bold tracking-widest rounded-xl transition-all disabled:opacity-50 ${
                                  isFrozen
                                    ? "bg-emerald-500 text-black hover:bg-emerald-400"
                                    : "bg-amber-500 text-black hover:bg-amber-400"
                                }`}
                              >
                                {togglingFreezeUserId === f.id ? "..." : isFrozen ? "UNFREEZE" : "FREEZE"}
                              </button>
                              {confirmDeleteFacultyCode === f.admin_code ? (
                                <>
                                  <button
                                    onClick={() => f.admin_code && handleDeleteFaculty(f.admin_code)}
                                    disabled={deletingFacultyCode === f.admin_code}
                                    className="px-3 py-2 bg-red-600 text-white text-[9px] font-bold tracking-widest rounded-xl hover:bg-red-700 disabled:opacity-50 transition-all"
                                  >
                                    {deletingFacultyCode === f.admin_code ? "..." : "CONFIRM"}
                                  </button>
                                  <button
                                    onClick={() => setConfirmDeleteFacultyCode(null)}
                                    className={`p-2 border rounded-xl transition-all ${isDarkMode ? "border-white/30 hover:bg-white/5 text-white" : "border-black/10 hover:bg-black/5 text-black"}`}
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={() => f.admin_code && setConfirmDeleteFacultyCode(f.admin_code)}
                                  className={`p-2.5 border rounded-xl transition-all hover:border-red-500/40 hover:text-red-400 hover:bg-red-500/5 ${isDarkMode ? "border-white/30 text-white/40" : "border-black/10 text-black/40"}`}
                                  title="Delete faculty"
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
              <div className={`p-8 flex items-center justify-between border-t ${isDarkMode ? "bg-black border-white/30" : "bg-white border-black/10"}`}>
                <div className={`flex items-center gap-4 text-[9px] font-mono tracking-[0.3em] uppercase ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>
                  <Database className={`h-4 w-4 ${isDarkMode ? "text-white" : "text-black"}`} />
                  <span>Page {currentPage} // {totalFacultyPages || 1}</span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className={`p-3 border rounded-xl disabled:opacity-20 hover:bg-white/5 transition-all ${isDarkMode ? "border-white/30 text-white" : "border-black/10 text-black"}`}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <div className="flex gap-2">
                    {Array.from({ length: totalFacultyPages }, (_, i) => i + 1)
                      .filter(p => p === 1 || p === totalFacultyPages || Math.abs(p - currentPage) <= 1)
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
                    onClick={() => setCurrentPage(p => Math.min(totalFacultyPages, p + 1))}
                    disabled={currentPage === totalFacultyPages || totalFacultyPages === 0}
                    className={`p-3 border rounded-xl disabled:opacity-20 hover:bg-white/5 transition-all ${isDarkMode ? "border-white/30 text-white" : "border-black/10 text-black"}`}
                  >
                    <ChevronRightIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {displayMode === 'dashboard' && view === "students" && (
            <motion.div
              key="students"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className={`relative border rounded-[3rem] overflow-hidden backdrop-blur-3xl group ${
                isDarkMode ? "bg-gradient-to-br from-zinc-900 via-black to-zinc-900 border-white/30" : "bg-gradient-to-br from-zinc-100 via-white to-zinc-100 border-zinc-800/50"
              }`}
            >
              <div className={`absolute inset-0 bg-[linear-gradient(110deg,transparent_0%,rgba(255,255,255,0.03)_45%,rgba(255,255,255,0.06)_50%,rgba(255,255,255,0.03)_55%,transparent_100%)] pointer-events-none`} />
              <div className="absolute inset-0 -translate-y-full group-hover:translate-y-full transition-transform duration-1000 bg-gradient-to-b from-transparent via-white/5 to-transparent pointer-events-none" />
              <div className={`p-10 border-b flex flex-col lg:flex-row lg:items-center justify-between gap-6 ${isDarkMode ? "bg-black border-white/30" : "bg-white border-black/10"}`}>
                <div>
                  <h2 className={`text-3xl font-display font-black tracking-tight uppercase ${isDarkMode ? "text-white" : "text-black"}`}>Student Directory</h2>
                  <p className={`text-[10px] font-mono uppercase mt-2 tracking-[0.4em] ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>Enrolled learners • {filteredStudents.length} records</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Search className={`absolute left-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 ${isDarkMode ? "opacity-20 text-white" : "opacity-40 text-black"}`} />
                    <input
                      type="text"
                      placeholder="FILTER STUDENTS..."
                      value={query}
                      onChange={(e) => { setQuery(e.target.value); setCurrentPage(1) }}
                      className={`pl-11 pr-8 py-3 text-[10px] font-mono tracking-widest border rounded-2xl focus:outline-none focus:border-emerald-500/50 min-w-[250px] ${
                        isDarkMode ? "bg-white/5 border-white/30 text-white" : "bg-black/5 border-black/10 text-black placeholder:text-black/40"
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Section Filter */}
              <div className={`px-10 py-4 border-b flex items-center gap-2 overflow-x-auto ${isDarkMode ? "bg-black/50 border-white/30" : "bg-white/50 border-black/5"}`}>
                <span className={`text-[9px] font-mono uppercase tracking-[0.3em] mr-2 ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>Section:</span>
                {uniqueClasses.map((cls) => (
                  <button
                    key={cls || "all"}
                    onClick={() => { setSectionFilter(cls); setCurrentPage(1) }}
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-mono uppercase tracking-[0.15em] transition-all whitespace-nowrap ${
                      sectionFilter === cls
                        ? (isDarkMode ? "bg-white text-black font-bold" : "bg-black text-white font-bold")
                        : (isDarkMode ? "opacity-40 hover:opacity-100 text-white" : "opacity-60 hover:opacity-100 text-black")
                    }`}
                  >
                    {cls || "All"}
                  </button>
                ))}
              </div>

              <div className="overflow-x-auto relative overflow-hidden group">
                <div className="absolute inset-0 -translate-y-full group-hover:translate-y-full transition-transform duration-1000 bg-gradient-to-b from-transparent via-white/5 to-transparent pointer-events-none" />
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className={`text-[9px] font-mono uppercase tracking-[0.3em] ${isDarkMode ? "bg-black text-white opacity-40" : "bg-white text-black opacity-60"}`}>
                      <th className={`p-8 font-bold border-b ${isDarkMode ? "border-white/30" : "border-black/10"}`}>Identity</th>
                      <th className={`p-8 font-bold border-b ${isDarkMode ? "border-white/30" : "border-black/10"}`}>Mobile</th>
                      <th className={`p-8 font-bold border-b ${isDarkMode ? "border-white/30" : "border-black/10"} text-center`}>Class</th>
                      <th className={`p-8 font-bold border-b ${isDarkMode ? "border-white/30" : "border-black/10"}`}>Daily Chats</th>
                      <th className={`p-8 font-bold border-b ${isDarkMode ? "border-white/30" : "border-black/10"} text-right`}>Actions</th>
                    </tr>
                  </thead>
                  <tbody className={`text-[11px] font-mono uppercase tracking-tight ${isDarkMode ? "text-white" : "text-black"}`}>
                    {paginatedStudents.length === 0 ? (
                      <tr>
                        <td colSpan={4} className={`p-20 text-center font-display font-black text-2xl uppercase tracking-[1em] ${isDarkMode ? "opacity-20 text-white" : "opacity-40 text-black"}`}>Void Found</td>
                      </tr>
                    ) : (
                      paginatedStudents.map((s) => {
                        const isFrozen = frozenUserIds.includes(s.id)
                        return (
                        <tr key={s.id} className={`border-b transition-colors group ${isDarkMode ? "border-white/30 hover:bg-white/[0.02]" : "border-black/10 hover:bg-black/[0.02]"}`}>
                          <td className="p-8">
                            <div className="flex items-center gap-4">
                              <div className={`h-10 w-10 rounded-xl flex items-center justify-center border ${isDarkMode ? "bg-white/5 border-white/30" : "bg-black/5 border-black/10"}`}>
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
                          <td className="p-8">
                            <div className="flex items-center gap-2">
                              <span className={`font-bold ${isDarkMode ? "text-white" : "text-black"}`}>{s.daily_chats || 0}</span>
                              <span className={`text-[9px] ${isDarkMode ? "opacity-30 text-white" : "opacity-50 text-black"}`}>CHATS</span>
                            </div>
                          </td>
                          <td className="p-8 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleToggleFreeze(s.id, isFrozen, "Student")}
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
                      )}))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className={`p-8 flex items-center justify-between border-t ${isDarkMode ? "bg-black border-white/30" : "bg-white border-black/10"}`}>
                <div className={`flex items-center gap-4 text-[9px] font-mono tracking-[0.3em] uppercase ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>
                  <Database className={`h-4 w-4 ${isDarkMode ? "text-white" : "text-black"}`} />
                  <span>Page {currentPage} // {totalStudentPages || 1}</span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className={`p-3 border rounded-xl disabled:opacity-20 hover:bg-white/5 transition-all ${isDarkMode ? "border-white/30 text-white" : "border-black/10 text-black"}`}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <div className="flex gap-2">
                    {Array.from({ length: totalStudentPages }, (_, i) => i + 1)
                      .filter(p => p === 1 || p === totalStudentPages || Math.abs(p - currentPage) <= 1)
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
                      ))}
                  </div>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalStudentPages, p + 1))}
                    disabled={currentPage === totalStudentPages || totalStudentPages === 0}
                    className={`p-3 border rounded-xl disabled:opacity-20 hover:bg-white/5 transition-all ${isDarkMode ? "border-white/30 text-white" : "border-black/10 text-black"}`}
                  >
                    <ChevronRightIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}



          {displayMode === 'dashboard' && view === "usage" && (
            <motion.div
              key="usage"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className={`relative border rounded-[3rem] overflow-hidden backdrop-blur-3xl group ${
                isDarkMode ? "bg-gradient-to-br from-zinc-900 via-black to-zinc-900 border-white/30" : "bg-gradient-to-br from-zinc-100 via-white to-zinc-100 border-zinc-800/50"
              }`}
            >
              <div className={`absolute inset-0 bg-[linear-gradient(110deg,transparent_0%,rgba(255,255,255,0.03)_45%,rgba(255,255,255,0.06)_50%,rgba(255,255,255,0.03)_55%,transparent_100%)] pointer-events-none`} />
              <div className="absolute inset-0 -translate-y-full group-hover:translate-y-full transition-transform duration-1000 bg-gradient-to-b from-transparent via-white/5 to-transparent pointer-events-none" />
              <div className={`p-10 border-b flex flex-col lg:flex-row lg:items-center justify-between gap-6 ${isDarkMode ? "bg-black border-white/30" : "bg-white border-black/10"}`}>
                <div>
                  <h2 className={`text-3xl font-display font-black tracking-tight uppercase ${isDarkMode ? "text-white" : "text-black"}`}>Student Token Usage</h2>
                  <p className={`text-[10px] font-mono uppercase mt-2 tracking-[0.4em] ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>Per-student AI usage statistics &bull; {filteredStudents.length} students</p>
                </div>
                <div className="relative">
                  <Search className={`absolute left-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 ${isDarkMode ? "opacity-20 text-white" : "opacity-40 text-black"}`} />
                  <input
                    type="text"
                    placeholder="FILTER STUDENTS..."
                    value={query}
                    onChange={(e) => { setQuery(e.target.value); setCurrentPage(1) }}
                    className={`pl-11 pr-8 py-3 text-[10px] font-mono tracking-widest border rounded-2xl focus:outline-none focus:border-emerald-500/50 min-w-[250px] ${
                      isDarkMode ? "bg-white/5 border-white/30 text-white" : "bg-black/5 border-black/10 text-black placeholder:text-black/40"
                    }`}
                  />
                </div>
              </div>

              <div className="overflow-x-auto relative overflow-hidden group">
                <div className="absolute inset-0 -translate-y-full group-hover:translate-y-full transition-transform duration-1000 bg-gradient-to-b from-transparent via-white/5 to-transparent pointer-events-none" />
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className={`text-[9px] font-mono uppercase tracking-[0.3em] ${isDarkMode ? "bg-black text-white opacity-40" : "bg-white text-black opacity-60"}`}>
                      <th className={`p-8 font-bold border-b ${isDarkMode ? "border-white/30" : "border-black/10"}`}>Student</th>
                      <th className={`p-8 font-bold border-b ${isDarkMode ? "border-white/30" : "border-black/10"} text-center`}>Class</th>
                      <th className={`p-8 font-bold border-b ${isDarkMode ? "border-white/30" : "border-black/10"} text-center`}>Daily Chats</th>
                      <th className={`p-8 font-bold border-b ${isDarkMode ? "border-white/30" : "border-black/10"} text-center`}>Chats Used</th>
                      <th className={`p-8 font-bold border-b ${isDarkMode ? "border-white/30" : "border-black/10"} text-right`}>Last Active</th>
                    </tr>
                  </thead>
                  <tbody className={`text-[11px] font-mono uppercase tracking-tight ${isDarkMode ? "text-white" : "text-black"}`}>
                    {paginatedStudents.length === 0 ? (
                      <tr>
                        <td colSpan={5} className={`p-20 text-center font-display font-black text-2xl uppercase tracking-[1em] ${isDarkMode ? "opacity-20 text-white" : "opacity-40 text-black"}`}>Void Found</td>
                      </tr>
                    ) : (
                      paginatedStudents.map((s) => (
                        <tr key={s.id} className={`border-b transition-colors group ${isDarkMode ? "border-white/30 hover:bg-white/[0.02]" : "border-black/10 hover:bg-black/[0.02]"}`}>
                          <td className="p-8">
                            <div className="flex items-center gap-4">
                              <div className={`h-10 w-10 rounded-xl flex items-center justify-center border ${isDarkMode ? "bg-white/5 border-white/30" : "bg-black/5 border-black/10"}`}>
                                <User className={`h-4 w-4 ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`} />
                              </div>
                              <div className="flex flex-col">
                                <span className={`text-[13px] font-bold tracking-tight ${isDarkMode ? "text-white" : "text-black"}`}>{s.name}</span>
                                <span className={`text-[9px] lowercase font-sans ${isDarkMode ? "opacity-30 text-white" : "opacity-50 text-black"}`}>{s.mobile_number || "—"}</span>
                              </div>
                            </div>
                          </td>
                          <td className="p-8 text-center">
                            <span className={`px-3 py-1 rounded-lg text-[10px] ${isDarkMode ? "bg-blue-500/10 text-blue-400" : "bg-blue-500/10 text-blue-600"}`}>
                              {s.assigned_class || "—"}
                            </span>
                          </td>
                          <td className="p-8 text-center">
                            <span className={`font-bold text-lg ${isDarkMode ? "text-white" : "text-black"}`}>{s.daily_chats || 0}</span>
                          </td>
                          <td className="p-8 text-center">
                            <div className={`w-full max-w-[120px] mx-auto h-2 rounded-full ${isDarkMode ? "bg-white/10" : "bg-black/10"}`}>
                              <div
                                className="h-full rounded-full bg-purple-500"
                                style={{ width: `${Math.min(((s.daily_chats || 0) / 100) * 100, 100)}%` }}
                              />
                            </div>
                          </td>
                          <td className={`p-8 text-right text-[10px] ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>
                            {s.created_at ? new Date(s.created_at).toLocaleDateString() : "—"}
                          </td>
                          </tr>
                      )))}
                    </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className={`p-8 flex items-center justify-between border-t ${isDarkMode ? "bg-black border-white/30" : "bg-white border-black/10"}`}>
                <div className={`flex items-center gap-4 text-[9px] font-mono tracking-[0.3em] uppercase ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>
                  <BarChart3 className={`h-4 w-4 ${isDarkMode ? "text-white" : "text-black"}`} />
                  <span>Page {currentPage} // {totalStudentPages || 1}</span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className={`p-3 border rounded-xl disabled:opacity-20 hover:bg-white/5 transition-all ${isDarkMode ? "border-white/30 text-white" : "border-black/10 text-black"}`}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <div className="flex gap-2">
                    {Array.from({ length: totalStudentPages }, (_, i) => i + 1)
                      .filter(p => p === 1 || p === totalStudentPages || Math.abs(p - currentPage) <= 1)
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
                    onClick={() => setCurrentPage(p => Math.min(totalStudentPages, p + 1))}
                    disabled={currentPage === totalStudentPages || totalStudentPages === 0}
                    className={`p-3 border rounded-xl disabled:opacity-20 hover:bg-white/5 transition-all ${isDarkMode ? "border-white/30 text-white" : "border-black/10 text-black"}`}
                  >
                    <ChevronRightIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {displayMode === "table" && (
            <motion.div
              key="table"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className={`relative border rounded-[3rem] overflow-hidden backdrop-blur-3xl group ${
                isDarkMode ? "bg-gradient-to-br from-zinc-900 via-black to-zinc-900 border-white/30" : "bg-gradient-to-br from-zinc-100 via-white to-zinc-100 border-zinc-800/50"
              }`}
            >
              <div className={`absolute inset-0 bg-[linear-gradient(110deg,transparent_0%,rgba(255,255,255,0.03)_45%,rgba(255,255,255,0.06)_50%,rgba(255,255,255,0.03)_55%,transparent_100%)] pointer-events-none`} />
              <div className="absolute inset-0 -translate-y-full group-hover:translate-y-full transition-transform duration-1000 bg-gradient-to-b from-transparent via-white/5 to-transparent pointer-events-none" />
              <div className={`p-10 border-b flex flex-col lg:flex-row lg:items-center justify-between gap-6 ${isDarkMode ? "bg-black border-white/30" : "bg-white border-black/10"}`}>
                <div>
                  <h2 className={`text-3xl font-display font-black tracking-tight uppercase ${isDarkMode ? "text-white" : "text-black"}`}>Consolidated Records</h2>
                  <p className={`text-[10px] font-mono uppercase mt-2 tracking-[0.4em] ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>{tableFilter === "all" ? "All" : tableFilter === "faculty" ? "Faculty" : "Student"} records • {allTableData.length} entries</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Search className={`absolute left-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 ${isDarkMode ? "opacity-20 text-white" : "opacity-40 text-black"}`} />
                    <input
                      type="text"
                      placeholder="FILTER ALL..."
                      value={query}
                      onChange={(e) => { setQuery(e.target.value); setCurrentPage(1) }}
                      className={`pl-11 pr-8 py-3 text-[10px] font-mono tracking-widest border rounded-2xl focus:outline-none focus:border-emerald-500/50 min-w-[250px] ${
                        isDarkMode ? "bg-white/5 border-white/30 text-white" : "bg-black/5 border-black/10 text-black placeholder:text-black/40"
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

              {/* Filter & Sort Toolbar */}
              <div className={`px-10 py-4 border-b flex flex-col gap-3 ${isDarkMode ? "bg-black/50 border-white/30" : "bg-white/50 border-black/5"}`}>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    {(["all", "faculty", "students"] as const).map((f) => (
                      <button
                        key={f}
                        onClick={() => { setTableFilter(f); setCurrentPage(1) }}
                        className={`px-4 py-2 rounded-xl text-[10px] font-mono uppercase tracking-[0.15em] transition-all ${
                          tableFilter === f
                            ? (isDarkMode ? "bg-white text-black font-bold" : "bg-black text-white font-bold")
                            : (isDarkMode ? "opacity-40 hover:opacity-100 text-white" : "opacity-60 hover:opacity-100 text-black")
                        }`}
                      >
                        {f === "all" ? "All" : f === "faculty" ? "Faculty" : "Students"}
                      </button>
                    ))}
                  </div>
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
                <div className="flex items-center gap-2 overflow-x-auto">
                  <span className={`text-[9px] font-mono uppercase tracking-[0.3em] mr-2 ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>Section:</span>
                  {uniqueClasses.map((cls) => (
                    <button
                      key={cls || "all"}
                      onClick={() => { setSectionFilter(cls); setCurrentPage(1) }}
                      className={`px-3 py-1.5 rounded-xl text-[10px] font-mono uppercase tracking-[0.15em] transition-all whitespace-nowrap ${
                        sectionFilter === cls
                          ? (isDarkMode ? "bg-white text-black font-bold" : "bg-black text-white font-bold")
                          : (isDarkMode ? "opacity-40 hover:opacity-100 text-white" : "opacity-60 hover:opacity-100 text-black")
                      }`}
                    >
                      {cls || "All"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="overflow-x-auto relative overflow-hidden group">
                <div className="absolute inset-0 -translate-y-full group-hover:translate-y-full transition-transform duration-1000 bg-gradient-to-b from-transparent via-white/5 to-transparent pointer-events-none" />
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className={`text-[9px] font-mono uppercase tracking-[0.3em] ${isDarkMode ? "bg-black text-white opacity-40" : "bg-white text-black opacity-60"}`}>
                      <th className={`p-8 font-bold border-b ${isDarkMode ? "border-white/30" : "border-black/10"}`}>Type</th>
                      <th className={`p-8 font-bold border-b ${isDarkMode ? "border-white/30" : "border-black/10"}`}>Identity</th>
                      <th className={`p-8 font-bold border-b ${isDarkMode ? "border-white/30" : "border-black/10"}`}>Contact</th>
                      <th className={`p-8 font-bold border-b ${isDarkMode ? "border-white/30" : "border-black/10"}`}>Code / Class</th>
                      <th className={`p-8 font-bold border-b ${isDarkMode ? "border-white/30" : "border-black/10"} text-center`}>Quota / Chats</th>
                      <th className={`p-8 font-bold border-b ${isDarkMode ? "border-white/30" : "border-black/10"}`}>Created</th>
                      <th className={`p-8 font-bold border-b ${isDarkMode ? "border-white/30" : "border-black/10"} text-right`}>Actions</th>
                    </tr>
                  </thead>
                  <tbody className={`text-[11px] font-mono uppercase tracking-tight ${isDarkMode ? "text-white" : "text-black"}`}>
                    {paginatedTableData.length === 0 ? (
                      <tr>
                        <td colSpan={7} className={`p-20 text-center font-display font-black text-2xl uppercase tracking-[1em] ${isDarkMode ? "opacity-20 text-white" : "opacity-40 text-black"}`}>Void Found</td>
                      </tr>
                    ) : (
                      paginatedTableData.map((item, idx) => (
                        <tr key={idx} className={`border-b transition-colors group ${isDarkMode ? "border-white/30 hover:bg-white/[0.02]" : "border-black/10 hover:bg-black/[0.02]"}`}>
                          <td className="p-8">
                            <span className={`px-3 py-1 rounded-lg text-[10px] ${
                              item.type === "Faculty"
                                ? (isDarkMode ? "bg-emerald-500/10 text-emerald-400" : "bg-emerald-500/10 text-emerald-600")
                                : (isDarkMode ? "bg-blue-500/10 text-blue-400" : "bg-blue-500/10 text-blue-600")
                            }`}>
                              {item.type}
                            </span>
                          </td>
                          <td className="p-8">
                            <div className="flex items-center gap-4">
                              <div className={`h-10 w-10 rounded-xl flex items-center justify-center border ${isDarkMode ? "bg-white/5 border-white/30" : "bg-black/5 border-black/10"}`}>
                                <User className={`h-4 w-4 ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`} />
                              </div>
                              <span className={`text-[13px] font-bold tracking-tight ${isDarkMode ? "text-white" : "text-black"}`}>{item.name}</span>
                            </div>
                          </td>
                          <td className={`p-8 text-[10px] ${isDarkMode ? "opacity-60 text-white" : "opacity-80 text-black"}`}>{item.contact}</td>
                          <td className={`p-8 text-[10px] ${isDarkMode ? "opacity-60 text-white" : "opacity-80 text-black"}`}>{item.codeOrClass}</td>
                          <td className="p-8 text-center">
                            <span className={`font-bold ${isDarkMode ? "text-white" : "text-black"}`}>{item.metric}</span>
                            <span className={`text-[9px] ml-1 ${isDarkMode ? "opacity-30 text-white" : "opacity-50 text-black"}`}>{item.metricLabel}</span>
                          </td>
                          <td className={`p-8 text-[10px] ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>{item.created}</td>
                          <td className="p-8 text-right">
                            {item.type === "Faculty" && item.id && item.admin_code ? (
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => handleToggleFreeze(item.id, item.isFrozen, "Faculty")}
                                  disabled={togglingFreezeUserId === item.id}
                                  className={`px-3 py-2 text-[9px] font-bold tracking-widest rounded-xl transition-all disabled:opacity-50 ${
                                    item.isFrozen
                                      ? "bg-emerald-500 text-black hover:bg-emerald-400"
                                      : "bg-amber-500 text-black hover:bg-amber-400"
                                  }`}
                                >
                                  {togglingFreezeUserId === item.id ? "..." : item.isFrozen ? "UNFREEZE" : "FREEZE"}
                                </button>
                                {confirmDeleteFacultyCode === item.admin_code ? (
                                  <>
                                    <button
                                      onClick={() => item.admin_code && handleDeleteFaculty(item.admin_code)}
                                      disabled={deletingFacultyCode === item.admin_code}
                                      className="px-3 py-2 bg-red-600 text-white text-[9px] font-bold tracking-widest rounded-xl hover:bg-red-700 disabled:opacity-50 transition-all"
                                    >
                                      {deletingFacultyCode === item.admin_code ? "..." : "CONFIRM"}
                                    </button>
                                    <button
                                      onClick={() => setConfirmDeleteFacultyCode(null)}
                                      className={`p-2 border rounded-xl transition-all ${isDarkMode ? "border-white/30 hover:bg-white/5 text-white" : "border-black/10 hover:bg-black/5 text-black"}`}
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  </>
                                ) : (
                                  <button
                                    onClick={() => item.admin_code && setConfirmDeleteFacultyCode(item.admin_code)}
                                    className={`p-2.5 border rounded-xl transition-all hover:border-red-500/40 hover:text-red-400 hover:bg-red-500/5 ${isDarkMode ? "border-white/30 text-white/40" : "border-black/10 text-black/40"}`}
                                    title="Delete faculty"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                )}
                              </div>
                            ) : item.type === "Student" && item.id ? (
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => handleToggleFreeze(item.id, item.isFrozen, "Student")}
                                  disabled={togglingFreezeUserId === item.id}
                                  className={`px-3 py-2 text-[9px] font-bold tracking-widest rounded-xl transition-all disabled:opacity-50 ${
                                    item.isFrozen
                                      ? "bg-emerald-500 text-black hover:bg-emerald-400"
                                      : "bg-amber-500 text-black hover:bg-amber-400"
                                  }`}
                                >
                                  {togglingFreezeUserId === item.id ? "..." : item.isFrozen ? "UNFREEZE" : "FREEZE"}
                                </button>
                                {confirmDeleteStudentId === item.id ? (
                                  <>
                                    <button
                                      onClick={() => handleDeleteStudent(item.id)}
                                      disabled={deletingStudentId === item.id}
                                      className="px-3 py-2 bg-red-600 text-white text-[9px] font-bold tracking-widest rounded-xl hover:bg-red-700 disabled:opacity-50 transition-all"
                                    >
                                      {deletingStudentId === item.id ? "..." : "CONFIRM"}
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
                                    onClick={() => setConfirmDeleteStudentId(item.id)}
                                    className={`p-2.5 border rounded-xl transition-all hover:border-red-500/40 hover:text-red-400 hover:bg-red-500/5 ${isDarkMode ? "border-white/30 text-white/40" : "border-black/10 text-black/40"}`}
                                    title="Delete student"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                )}
                              </div>
                            ) : null}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className={`p-8 flex items-center justify-between border-t ${isDarkMode ? "bg-black border-white/30" : "bg-white border-black/10"}`}>
                <div className={`flex items-center gap-4 text-[9px] font-mono tracking-[0.3em] uppercase ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>
                  <Database className={`h-4 w-4 ${isDarkMode ? "text-white" : "text-black"}`} />
                  <span>Page {currentPage} // {totalTablePages || 1}</span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className={`p-3 border rounded-xl disabled:opacity-20 hover:bg-white/5 transition-all ${isDarkMode ? "border-white/30 text-white" : "border-black/10 text-black"}`}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <div className="flex gap-2">
                    {Array.from({ length: totalTablePages }, (_, i) => i + 1)
                      .filter(p => p === 1 || p === totalTablePages || Math.abs(p - currentPage) <= 1)
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
                    onClick={() => setCurrentPage(p => Math.min(totalTablePages, p + 1))}
                    disabled={currentPage === totalTablePages || totalTablePages === 0}
                    className={`p-3 border rounded-xl disabled:opacity-20 hover:bg-white/5 transition-all ${isDarkMode ? "border-white/30 text-white" : "border-black/10 text-black"}`}
                  >
                    <ChevronRightIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Add Faculty Modal */}
      {showAddFaculty && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`relative w-full max-w-lg max-h-[80vh] overflow-y-auto border p-6 rounded-[2rem] overflow-hidden group ${
              isDarkMode ? "bg-gradient-to-br from-zinc-900 via-black to-zinc-900 border-white/30 text-white" : "bg-gradient-to-br from-zinc-100 via-white to-zinc-100 border-zinc-800/50 text-black"
            }`}
          >
            <div className={`absolute inset-0 bg-[linear-gradient(110deg,transparent_0%,rgba(255,255,255,0.03)_45%,rgba(255,255,255,0.06)_50%,rgba(255,255,255,0.03)_55%,transparent_100%)] pointer-events-none`} />
            <div className="absolute inset-0 -translate-y-full group-hover:translate-y-full transition-transform duration-1000 bg-gradient-to-b from-transparent via-white/5 to-transparent pointer-events-none" />
            <button
              onClick={() => setShowAddFaculty(false)}
              className={`absolute top-4 right-4 p-2 rounded-xl transition-all ${isDarkMode ? "opacity-40 text-white hover:opacity-100 hover:bg-white/5" : "opacity-60 text-black hover:opacity-100 hover:bg-black/5"}`}
            >
              <X className="h-4 w-4" />
            </button>

            <h2 className={`text-xl font-display font-black uppercase tracking-tight mb-6 ${isDarkMode ? "text-white" : "text-black"}`}>
              Add Faculty
            </h2>

            <form onSubmit={handleCreateFaculty} className="space-y-4">
              <div>
                <label className={`text-[9px] font-mono uppercase tracking-widest ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>Faculty Name</label>
                <input
                  value={facultyForm.name}
                  onChange={(e) => setFacultyForm((prev) => ({ ...prev, name: e.target.value }))}
                  required
                  className={`w-full mt-1 p-3 text-xs font-mono border rounded-xl focus:outline-none focus:border-emerald-500/50 ${
                    isDarkMode ? "bg-white/5 border-white/30 text-white" : "bg-black/5 border-black/10 text-black"
                  }`}
                />
              </div>
              <div>
                <label className={`text-[9px] font-mono uppercase tracking-widest ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>Email (optional)</label>
                <input
                  type="email"
                  value={facultyForm.email}
                  onChange={(e) => setFacultyForm((prev) => ({ ...prev, email: e.target.value }))}
                  className={`w-full mt-1 p-3 text-xs font-mono border rounded-xl focus:outline-none focus:border-emerald-500/50 ${
                    isDarkMode ? "bg-white/5 border-white/30 text-white" : "bg-black/5 border-black/10 text-black"
                  }`}
                />
              </div>
              <div>
                <label className={`text-[9px] font-mono uppercase tracking-widest ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>Admin Code</label>
                <input
                  value={facultyForm.admin_code}
                  onChange={(e) => setFacultyForm((prev) => ({ ...prev, admin_code: e.target.value.toUpperCase() }))}
                  required
                  className={`w-full mt-1 p-3 text-xs font-mono border rounded-xl focus:outline-none focus:border-emerald-500/50 ${
                    isDarkMode ? "bg-white/5 border-white/30 text-white" : "bg-black/5 border-black/10 text-black"
                  }`}
                />
              </div>
              <div>
                <label className={`text-[9px] font-mono uppercase tracking-widest ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>Password</label>
                <input
                  type="password"
                  value={facultyForm.password}
                  onChange={(e) => setFacultyForm((prev) => ({ ...prev, password: e.target.value }))}
                  required
                  className={`w-full mt-1 p-3 text-xs font-mono border rounded-xl focus:outline-none focus:border-emerald-500/50 ${
                    isDarkMode ? "bg-white/5 border-white/30 text-white" : "bg-black/5 border-black/10 text-black"
                  }`}
                />
              </div>
              <div>
                <label className={`text-[9px] font-mono uppercase tracking-widest ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>Assigned Class (optional)</label>
                <input
                  value={facultyForm.assigned_class}
                  onChange={(e) => setFacultyForm((prev) => ({ ...prev, assigned_class: e.target.value }))}
                  className={`w-full mt-1 p-3 text-xs font-mono border rounded-xl focus:outline-none focus:border-emerald-500/50 ${
                    isDarkMode ? "bg-white/5 border-white/30 text-white" : "bg-black/5 border-black/10 text-black"
                  }`}
                />
              </div>
              <div>
                <label className={`text-[9px] font-mono uppercase tracking-widest ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>Student Quota</label>
                <input
                  type="number"
                  value={facultyForm.quota}
                  onChange={(e) => setFacultyForm((prev) => ({ ...prev, quota: e.target.value }))}
                  min={1}
                  className={`w-full mt-1 p-3 text-xs font-mono border rounded-xl focus:outline-none focus:border-emerald-500/50 ${
                    isDarkMode ? "bg-white/5 border-white/30 text-white" : "bg-black/5 border-black/10 text-black"
                  }`}
                />
              </div>
              <button
                type="submit"
                disabled={creatingFaculty}
                className="w-full py-3 bg-emerald-500 text-black text-[10px] font-mono uppercase tracking-[0.3em] font-bold hover:scale-[1.02] transition-all rounded-xl disabled:opacity-50"
              >
                {creatingFaculty ? "CREATING..." : "ADD FACULTY"}
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {/* Footer Style Decoration */}
      <div className="fixed bottom-10 left-10 flex items-center gap-4 pointer-events-none opacity-10">
        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className={`text-[10px] font-mono tracking-[0.5em] uppercase ${isDarkMode ? "text-white" : "text-black"}`}>EDU_CORE_STABLE // NO_VULN</span>
      </div>
    </div>
  )
}
