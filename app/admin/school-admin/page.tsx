"use client"

import React, { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { ShieldCheck, LogOut, Users, GraduationCap, RefreshCw, Plus, X, Search, BarChart3, Sun, Moon, User, Activity, TrendingUp, LayoutDashboard, ChevronLeft, ChevronRight as ChevronRightIcon, Database, Phone, MessageSquare, Building2, Shield, Clock, BookOpen, Table as TableIcon } from "lucide-react"
import { removeApiKey } from "@/lib/auth"
import { createSchoolFaculty, getSchoolFaculty, getSchoolStats, getSchoolStudents, getAdminSchools, getAdminSchoolAdmins, getAdminActivity, getAdminPlans, SchoolFacultyMember, SchoolStudent, AdminSchool, AdminSchoolAdmin, AdminActivityItem, AdminPlan } from "@/lib/chat-api"
import { toast } from "sonner"

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
  const [view, setView] = useState<"overview" | "faculty" | "students" | "schools" | "admins" | "plans" | "activity" | "usage">("overview")
  const [adminSchools, setAdminSchools] = useState<AdminSchool[]>([])
  const [schoolAdmins, setSchoolAdmins] = useState<AdminSchoolAdmin[]>([])
  const [activityLogs, setActivityLogs] = useState<AdminActivityItem[]>([])
  const [allPlans, setAllPlans] = useState<AdminPlan[]>([])
  const [adminDataError, setAdminDataError] = useState<string | null>(null)
  const [query, setQuery] = useState("")
  const [showAddFaculty, setShowAddFaculty] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [creatingFaculty, setCreatingFaculty] = useState(false)
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
    setAdminDataError(null)
    try {
      const [statsRes, facultyRes, studentsRes] = await Promise.all([
        getSchoolStats(),
        getSchoolFaculty(),
        getSchoolStudents(),
      ])

      setStats({
        total_students: Number(statsRes.total_students || 0),
        total_faculty: Number(statsRes.total_faculty || 0),
        leaderboard: statsRes.leaderboard || [],
      })
      setFaculty(facultyRes.faculty || [])
      setStudents(studentsRes.students || [])

      // Admin-level data (may fail if no admin key)
      try {
        const [schoolsRes, adminsRes, activityRes, plansRes] = await Promise.all([
          getAdminSchools(),
          getAdminSchoolAdmins(),
          getAdminActivity(),
          getAdminPlans(),
        ])
        if (schoolsRes.success) setAdminSchools(schoolsRes.schools || [])
        if (adminsRes.success) setSchoolAdmins(adminsRes.admins || [])
        if (activityRes.success) setActivityLogs(activityRes.activity || [])
        if (plansRes.success) setAllPlans(plansRes.plans || [])
      } catch (adminErr) {
        setAdminDataError((adminErr as Error).message)
      }
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

  const filteredStudents = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return students
    return students.filter((s) => [s.name, s.mobile_number, s.assigned_class].some((v) => (v || "").toLowerCase().includes(q)))
  }, [students, query])

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

  const handleLogout = () => {
    removeApiKey()
    window.location.href = "/admin"
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
      name: f.name,
      contact: f.email || "—",
      codeOrClass: f.admin_code || "—",
      metric: String(f.student_quota || 0),
      metricLabel: "Quota" as const,
      created: f.created_at ? new Date(f.created_at).toLocaleDateString() : "—",
    }))
    const studentEntries = students.map(s => ({
      type: "Student" as const,
      name: s.name,
      contact: s.mobile_number || "—",
      codeOrClass: s.assigned_class || "—",
      metric: String(s.daily_chats || 0),
      metricLabel: "Chats" as const,
      created: s.created_at ? new Date(s.created_at).toLocaleDateString() : "—",
    }))
    const all = [...facultyEntries, ...studentEntries]
    const q = query.trim().toLowerCase()
    if (!q) return all
    return all.filter(item =>
      [item.name, item.contact, item.codeOrClass, item.type].some(v => v.toLowerCase().includes(q))
    )
  }, [faculty, students, query])

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
      <nav className={`h-20 flex items-center justify-between px-10 border-b ${isDarkMode ? "border-white/5 bg-black/80" : "border-black/5 bg-white/80"} backdrop-blur-2xl sticky top-0 z-[100]`}>
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

          <div className={`flex items-center gap-1 p-1 rounded-2xl border ${isDarkMode ? "border-white/10 bg-white/5" : "border-black/10 bg-black/5"}`}>
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
          {displayMode === 'dashboard' && (
            <div className="hidden xl:flex items-center gap-6">
              <button
                onClick={() => { setView('overview'); setCurrentPage(1) }}
                className={`flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.2em] transition-all ${view === 'overview' ? "text-emerald-400 font-bold" : "opacity-40 hover:opacity-100"}`}
              >
                <LayoutDashboard className="h-3.5 w-3.5" /> Overview
              </button>
              <button
                onClick={() => { setView('faculty'); setCurrentPage(1) }}
                className={`flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.2em] transition-all ${view === 'faculty' ? "text-emerald-400 font-bold" : "opacity-40 hover:opacity-100"}`}
              >
                <Users className="h-3.5 w-3.5" /> Faculty
              </button>
              <button
                onClick={() => { setView('students'); setCurrentPage(1) }}
                className={`flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.2em] transition-all ${view === 'students' ? "text-emerald-400 font-bold" : "opacity-40 hover:opacity-100"}`}
              >
                <GraduationCap className="h-3.5 w-3.5" /> Students
              </button>
              <div className="h-6 w-[1px] bg-white/10" />
              <button
                onClick={() => { setView('schools'); setCurrentPage(1) }}
                className={`flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.2em] transition-all ${view === 'schools' ? "text-emerald-400 font-bold" : "opacity-40 hover:opacity-100"}`}
              >
                <Building2 className="h-3.5 w-3.5" /> Schools
              </button>
              <button
                onClick={() => { setView('admins'); setCurrentPage(1) }}
                className={`flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.2em] transition-all ${view === 'admins' ? "text-emerald-400 font-bold" : "opacity-40 hover:opacity-100"}`}
              >
                <Shield className="h-3.5 w-3.5" /> Admins
              </button>
              <button
                onClick={() => { setView('plans'); setCurrentPage(1) }}
                className={`flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.2em] transition-all ${view === 'plans' ? "text-emerald-400 font-bold" : "opacity-40 hover:opacity-100"}`}
              >
                <BookOpen className="h-3.5 w-3.5" /> Plans
              </button>
              <button
                onClick={() => { setView('activity'); setCurrentPage(1) }}
                className={`flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.2em] transition-all ${view === 'activity' ? "text-emerald-400 font-bold" : "opacity-40 hover:opacity-100"}`}
              >
                <Clock className="h-3.5 w-3.5" /> Activity
              </button>
            </div>
          )}
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
            className={`p-2 rounded-full border border-white/10 hover:bg-white/5 transition-all ${refreshing ? "animate-spin" : ""}`}
          >
            <RefreshCw className="h-4 w-4 opacity-40" />
          </button>

          <div className="h-8 w-[1px] bg-white/10 mx-2" />

          <div className="flex items-center gap-4">
            <button
              onClick={() => { setDisplayMode('dashboard'); setView('overview'); setCurrentPage(1); setQuery("") }}
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
                <div className={`relative border border-zinc-800/50 p-8 rounded-[2.5rem] backdrop-blur-xl overflow-hidden group ${
                  isDarkMode ? "bg-gradient-to-br from-zinc-900 via-black to-zinc-900" : "bg-gradient-to-br from-zinc-100 via-white to-zinc-100"
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

                <div className={`relative border border-zinc-800/50 p-8 rounded-[2.5rem] backdrop-blur-xl text-center overflow-hidden group ${
                  isDarkMode ? "bg-gradient-to-br from-zinc-900 via-black to-zinc-900" : "bg-gradient-to-br from-zinc-100 via-white to-zinc-100"
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
                <div className={`relative border border-zinc-800/50 p-10 rounded-[3rem] overflow-hidden group ${
                  isDarkMode ? "bg-gradient-to-br from-zinc-900 via-black to-zinc-900" : "bg-gradient-to-br from-zinc-100 via-white to-zinc-100"
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
                <div className={`relative border border-zinc-800/50 p-10 rounded-[3rem] overflow-hidden group ${
                  isDarkMode ? "bg-gradient-to-br from-zinc-900 via-black to-zinc-900" : "bg-gradient-to-br from-zinc-100 via-white to-zinc-100"
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
                      isDarkMode ? "bg-white/5 border-white/10" : "bg-black/5 border-black/10"
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
                      isDarkMode ? "bg-white/5 border-white/10" : "bg-black/5 border-black/10"
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
                        <button
                          onClick={() => setView("students")}
                          className={`w-full p-5 border rounded-[2rem] text-left transition-all hover:scale-[1.02] active:scale-[0.98] group ${
                            isDarkMode ? "border-blue-500/30 bg-blue-500/5 hover:bg-blue-500/10" : "border-blue-500/30 bg-blue-500/5 hover:bg-blue-500/10"
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-2xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
                              <GraduationCap className="h-5 w-5 text-blue-400" />
                            </div>
                            <div>
                              <h4 className="text-sm font-display font-black text-blue-400">Manage Students</h4>
                              <p className={`text-[9px] font-mono uppercase tracking-widest mt-1 ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>View all registered students</p>
                            </div>
                          </div>
                        </button>
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
                          onClick={() => setView("activity")}
                          className={`w-full p-5 border rounded-[2rem] text-left transition-all hover:scale-[1.02] active:scale-[0.98] group ${
                            isDarkMode ? "border-zinc-500/30 bg-zinc-500/5 hover:bg-zinc-500/10" : "border-zinc-500/30 bg-zinc-500/5 hover:bg-zinc-500/10"
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-2xl bg-zinc-500/20 border border-zinc-500/30 flex items-center justify-center">
                              <Clock className="h-5 w-5 text-zinc-400" />
                            </div>
                            <div>
                              <h4 className="text-sm font-display font-black text-zinc-400">Activity Logs</h4>
                              <p className={`text-[9px] font-mono uppercase tracking-widest mt-1 ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>View system-wide institution activity</p>
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
                                  <span className={`font-bold ${isDarkMode ? "text-white" : "text-black"}`}>{s.daily_chats || 0}</span>
                                </td>
                                <td className="py-3 pl-4 text-right">
                                  <div className="flex items-center justify-end gap-3">
                                    <div className="w-24 h-1.5 rounded-full bg-white/10">
                                      <div className="h-full rounded-full bg-purple-500" style={{ width: `${Math.min(((s.daily_chats || 0) / 100) * 100, 100)}%` }} />
                                    </div>
                                    <span className={`text-[10px] font-mono ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>
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
              className={`relative border border-zinc-800/50 rounded-[3rem] overflow-hidden backdrop-blur-3xl group ${
                isDarkMode ? "bg-gradient-to-br from-zinc-900 via-black to-zinc-900" : "bg-gradient-to-br from-zinc-100 via-white to-zinc-100"
              }`}
            >
              <div className={`absolute inset-0 bg-[linear-gradient(110deg,transparent_0%,rgba(255,255,255,0.03)_45%,rgba(255,255,255,0.06)_50%,rgba(255,255,255,0.03)_55%,transparent_100%)] pointer-events-none`} />
              <div className="absolute inset-0 -translate-y-full group-hover:translate-y-full transition-transform duration-1000 bg-gradient-to-b from-transparent via-white/5 to-transparent pointer-events-none" />
              <div className={`p-10 border-b flex flex-col lg:flex-row lg:items-center justify-between gap-6 ${isDarkMode ? "bg-black border-white/5" : "bg-white border-black/10"}`}>
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
                        isDarkMode ? "bg-white/5 border-white/10 text-white" : "bg-black/5 border-black/10 text-black placeholder:text-black/40"
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
                      <th className={`p-8 font-bold border-b ${isDarkMode ? "border-white/5" : "border-black/10"}`}>Identity</th>
                      <th className={`p-8 font-bold border-b ${isDarkMode ? "border-white/5" : "border-black/10"}`}>Admin Code</th>
                      <th className={`p-8 font-bold border-b ${isDarkMode ? "border-white/5" : "border-black/10"} text-center`}>Assigned Class</th>
                      <th className={`p-8 font-bold border-b ${isDarkMode ? "border-white/5" : "border-black/10"}`}>Quota</th>
                      <th className={`p-8 font-bold border-b ${isDarkMode ? "border-white/5" : "border-black/10"} text-right`}>Created</th>
                    </tr>
                  </thead>
                  <tbody className={`text-[11px] font-mono uppercase tracking-tight ${isDarkMode ? "text-white" : "text-black"}`}>
                    {paginatedFaculty.length === 0 ? (
                      <tr>
                        <td colSpan={5} className={`p-20 text-center font-display font-black text-2xl uppercase tracking-[1em] ${isDarkMode ? "opacity-20 text-white" : "opacity-40 text-black"}`}>Void Found</td>
                      </tr>
                    ) : (
                      paginatedFaculty.map((f) => (
                        <tr key={f.id} className={`border-b transition-colors group ${isDarkMode ? "border-white/5 hover:bg-white/[0.02]" : "border-black/10 hover:bg-black/[0.02]"}`}>
                          <td className="p-8">
                            <div className="flex items-center gap-4">
                              <div className={`h-10 w-10 rounded-xl flex items-center justify-center border ${isDarkMode ? "bg-white/5 border-white/10" : "bg-black/5 border-black/10"}`}>
                                <User className={`h-4 w-4 ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`} />
                              </div>
                              <div className="flex flex-col">
                                <span className={`text-[13px] font-bold tracking-tight ${isDarkMode ? "text-white" : "text-black"}`}>{f.name}</span>
                                <span className={`text-[9px] lowercase font-sans ${isDarkMode ? "opacity-30 text-white" : "opacity-50 text-black"}`}>{f.email || "—"}</span>
                              </div>
                            </div>
                          </td>
                          <td className="p-8">
                            <span className={`text-[10px] font-black w-fit px-2 py-0.5 rounded border ${isDarkMode ? "border-white/10 text-white" : "border-black/10 text-black"}`}>
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
                          <td className="p-8 text-right text-[10px] opacity-40">
                            {f.created_at ? new Date(f.created_at).toLocaleDateString() : "—"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className={`p-8 flex items-center justify-between border-t ${isDarkMode ? "bg-black border-white/10" : "bg-white border-black/10"}`}>
                <div className={`flex items-center gap-4 text-[9px] font-mono tracking-[0.3em] uppercase ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>
                  <Database className={`h-4 w-4 ${isDarkMode ? "text-white" : "text-black"}`} />
                  <span>Page {currentPage} // {totalFacultyPages || 1}</span>
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
                    className={`p-3 border rounded-xl disabled:opacity-20 hover:bg-white/5 transition-all ${isDarkMode ? "border-white/10 text-white" : "border-black/10 text-black"}`}
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
              className={`relative border border-zinc-800/50 rounded-[3rem] overflow-hidden backdrop-blur-3xl group ${
                isDarkMode ? "bg-gradient-to-br from-zinc-900 via-black to-zinc-900" : "bg-gradient-to-br from-zinc-100 via-white to-zinc-100"
              }`}
            >
              <div className={`absolute inset-0 bg-[linear-gradient(110deg,transparent_0%,rgba(255,255,255,0.03)_45%,rgba(255,255,255,0.06)_50%,rgba(255,255,255,0.03)_55%,transparent_100%)] pointer-events-none`} />
              <div className="absolute inset-0 -translate-y-full group-hover:translate-y-full transition-transform duration-1000 bg-gradient-to-b from-transparent via-white/5 to-transparent pointer-events-none" />
              <div className={`p-10 border-b flex flex-col lg:flex-row lg:items-center justify-between gap-6 ${isDarkMode ? "bg-black border-white/5" : "bg-white border-black/10"}`}>
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
                        isDarkMode ? "bg-white/5 border-white/10 text-white" : "bg-black/5 border-black/10 text-black placeholder:text-black/40"
                      }`}
                    />
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto relative overflow-hidden group">
                <div className="absolute inset-0 -translate-y-full group-hover:translate-y-full transition-transform duration-1000 bg-gradient-to-b from-transparent via-white/5 to-transparent pointer-events-none" />
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className={`text-[9px] font-mono uppercase tracking-[0.3em] ${isDarkMode ? "bg-black text-white opacity-40" : "bg-white text-black opacity-60"}`}>
                      <th className={`p-8 font-bold border-b ${isDarkMode ? "border-white/5" : "border-black/10"}`}>Identity</th>
                      <th className={`p-8 font-bold border-b ${isDarkMode ? "border-white/5" : "border-black/10"}`}>Mobile</th>
                      <th className={`p-8 font-bold border-b ${isDarkMode ? "border-white/5" : "border-black/10"} text-center`}>Class</th>
                      <th className={`p-8 font-bold border-b ${isDarkMode ? "border-white/5" : "border-black/10"} text-right`}>Daily Chats</th>
                    </tr>
                  </thead>
                  <tbody className={`text-[11px] font-mono uppercase tracking-tight ${isDarkMode ? "text-white" : "text-black"}`}>
                    {paginatedStudents.length === 0 ? (
                      <tr>
                        <td colSpan={4} className={`p-20 text-center font-display font-black text-2xl uppercase tracking-[1em] ${isDarkMode ? "opacity-20 text-white" : "opacity-40 text-black"}`}>Void Found</td>
                      </tr>
                    ) : (
                      paginatedStudents.map((s) => (
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
                              <span className={`font-bold ${isDarkMode ? "text-white" : "text-black"}`}>{s.daily_chats || 0}</span>
                              <span className={`text-[9px] ${isDarkMode ? "opacity-30 text-white" : "opacity-50 text-black"}`}>CHATS</span>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className={`p-8 flex items-center justify-between border-t ${isDarkMode ? "bg-black border-white/10" : "bg-white border-black/10"}`}>
                <div className={`flex items-center gap-4 text-[9px] font-mono tracking-[0.3em] uppercase ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>
                  <Database className={`h-4 w-4 ${isDarkMode ? "text-white" : "text-black"}`} />
                  <span>Page {currentPage} // {totalStudentPages || 1}</span>
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
                    className={`p-3 border rounded-xl disabled:opacity-20 hover:bg-white/5 transition-all ${isDarkMode ? "border-white/10 text-white" : "border-black/10 text-black"}`}
                  >
                    <ChevronRightIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {displayMode === 'dashboard' && view === "schools" && (
            <motion.div
              key="schools"
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
                <div>
                  <h2 className={`text-3xl font-display font-black tracking-tight uppercase ${isDarkMode ? "text-white" : "text-black"}`}>Schools Registry</h2>
                  <p className={`text-[10px] font-mono uppercase mt-2 tracking-[0.4em] ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>All registered institutions • {adminSchools.length} schools</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className={`text-[9px] font-mono uppercase tracking-[0.3em] ${isDarkMode ? "bg-black text-white opacity-40" : "bg-white text-black opacity-60"}`}>
                      <th className={`p-8 font-bold border-b ${isDarkMode ? "border-white/5" : "border-black/10"}`}>ID</th>
                      <th className={`p-8 font-bold border-b ${isDarkMode ? "border-white/5" : "border-black/10"}`}>School Name</th>
                      <th className={`p-8 font-bold border-b ${isDarkMode ? "border-white/5" : "border-black/10"}`}>School Code</th>
                      <th className={`p-8 font-bold border-b ${isDarkMode ? "border-white/5" : "border-black/10"}`}>Created</th>
                    </tr>
                  </thead>
                  <tbody className={`text-[11px] font-mono uppercase tracking-tight ${isDarkMode ? "text-white" : "text-black"}`}>
                    {adminSchools.length === 0 ? (
                      <tr>
                        <td colSpan={4} className={`p-20 text-center font-display font-black text-2xl uppercase tracking-[1em] ${isDarkMode ? "opacity-20 text-white" : "opacity-40 text-black"}`}>
                          {adminDataError || "Void Found"}
                        </td>
                      </tr>
                    ) : (
                      adminSchools.map((s) => (
                        <tr key={s.id} className={`border-b transition-colors ${isDarkMode ? "border-white/5 hover:bg-white/[0.02]" : "border-black/10 hover:bg-black/[0.02]"}`}>
                          <td className="p-8 opacity-40">{s.id}</td>
                          <td className="p-8">
                            <div className="flex items-center gap-3">
                              <Building2 className={`h-4 w-4 ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`} />
                              <span className="text-[13px] font-bold tracking-tight">{s.school_name}</span>
                            </div>
                          </td>
                          <td className="p-8">
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded border ${isDarkMode ? "border-white/10 text-white" : "border-black/10 text-black"}`}>
                              {s.school_code}
                            </span>
                          </td>
                          <td className={`p-8 text-[10px] ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>
                            {new Date(s.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {displayMode === 'dashboard' && view === "admins" && (
            <motion.div
              key="admins"
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
                <h2 className={`text-3xl font-display font-black tracking-tight uppercase ${isDarkMode ? "text-white" : "text-black"}`}>School Admins</h2>
                <p className={`text-[10px] font-mono uppercase mt-2 tracking-[0.4em] ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>Admin personnel • {schoolAdmins.length} records</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className={`text-[9px] font-mono uppercase tracking-[0.3em] ${isDarkMode ? "bg-black text-white opacity-40" : "bg-white text-black opacity-60"}`}>
                      <th className={`p-8 font-bold border-b ${isDarkMode ? "border-white/5" : "border-black/10"}`}>Name</th>
                      <th className={`p-8 font-bold border-b ${isDarkMode ? "border-white/5" : "border-black/10"}`}>Email</th>
                      <th className={`p-8 font-bold border-b ${isDarkMode ? "border-white/5" : "border-black/10"}`}>Admin Code</th>
                      <th className={`p-8 font-bold border-b ${isDarkMode ? "border-white/5" : "border-black/10"}`}>School</th>
                      <th className={`p-8 font-bold border-b ${isDarkMode ? "border-white/5" : "border-black/10"} text-center`}>Students</th>
                    </tr>
                  </thead>
                  <tbody className={`text-[11px] font-mono uppercase tracking-tight ${isDarkMode ? "text-white" : "text-black"}`}>
                    {schoolAdmins.length === 0 ? (
                      <tr>
                        <td colSpan={5} className={`p-20 text-center font-display font-black text-2xl uppercase tracking-[1em] ${isDarkMode ? "opacity-20 text-white" : "opacity-40 text-black"}`}>
                          {adminDataError || "Void Found"}
                        </td>
                      </tr>
                    ) : (
                      schoolAdmins.map((a) => (
                        <tr key={a.id} className={`border-b transition-colors ${isDarkMode ? "border-white/5 hover:bg-white/[0.02]" : "border-black/10 hover:bg-black/[0.02]"}`}>
                          <td className="p-8">
                            <div className="flex items-center gap-3">
                              <Shield className={`h-4 w-4 ${isDarkMode ? "text-amber-400" : "text-amber-600"}`} />
                              <span className="text-[13px] font-bold tracking-tight">{a.name}</span>
                            </div>
                          </td>
                          <td className={`p-8 text-[10px] ${isDarkMode ? "opacity-60 text-white" : "opacity-80 text-black"}`}>{a.email || "—"}</td>
                          <td className="p-8">
                            <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${isDarkMode ? "border-white/10 text-white" : "border-black/10 text-black"}`}>
                              {a.admin_code}
                            </span>
                          </td>
                          <td className={`p-8 text-[10px] ${isDarkMode ? "opacity-60 text-white" : "opacity-80 text-black"}`}>{a.school_name}</td>
                          <td className="p-8 text-center">
                            <span className={`px-3 py-1 rounded-lg text-[10px] font-bold ${isDarkMode ? "bg-emerald-500/10 text-emerald-400" : "bg-emerald-500/10 text-emerald-600"}`}>
                              {a.student_count}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {displayMode === 'dashboard' && view === "plans" && (
            <motion.div
              key="plans"
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
                <h2 className={`text-3xl font-display font-black tracking-tight uppercase ${isDarkMode ? "text-white" : "text-black"}`}>Subscription Plans</h2>
                <p className={`text-[10px] font-mono uppercase mt-2 tracking-[0.4em] ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>Available tiers • {allPlans.length} plans</p>
              </div>

              <div className="p-10">
                {allPlans.length === 0 ? (
                  <div className={`text-center py-20 text-[10px] font-mono uppercase tracking-widest ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>
                    {adminDataError || "No plans found"}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {allPlans.map((plan) => (
                      <div
                        key={plan.id}
                        className={`relative border rounded-[2.5rem] p-8 transition-all hover:scale-105 overflow-hidden group ${
                          isDarkMode
                            ? "border-zinc-800/50 bg-gradient-to-br from-zinc-900 via-black to-zinc-900"
                            : "border-zinc-800/50 bg-gradient-to-br from-zinc-100 via-white to-zinc-100"
                        }`}
                      >
                        <div className={`absolute inset-0 bg-[linear-gradient(110deg,transparent_0%,rgba(255,255,255,0.03)_45%,rgba(255,255,255,0.06)_50%,rgba(255,255,255,0.03)_55%,transparent_100%)] pointer-events-none`} />
                        <div className="absolute inset-0 -translate-y-full group-hover:translate-y-full transition-transform duration-1000 bg-gradient-to-b from-transparent via-white/5 to-transparent pointer-events-none" />
                        <h3 className={`text-lg font-display font-black mb-4 ${isDarkMode ? "text-white" : "text-black"}`}>{plan.plan_name}</h3>
                        <p className={`text-3xl font-display font-black mb-6 ${isDarkMode ? "text-white" : "text-black"}`}>₹{plan.price_inr}</p>
                        <div className={`space-y-2 mb-6 text-[10px] font-mono ${isDarkMode ? "text-white/60" : "text-black/60"}`}>
                          <div className="flex justify-between"><span>Daily Chat</span><span className="font-bold">{plan.daily_chat_limit}</span></div>
                          <div className="flex justify-between"><span>Daily Coding</span><span className="font-bold">{plan.daily_coding_limit}</span></div>
                          <div className="flex justify-between"><span>Daily Vision</span><span className="font-bold">{plan.daily_vision_limit}</span></div>
                          <div className="flex justify-between"><span>Monthly Images</span><span className="font-bold">{plan.monthly_image_limit}</span></div>
                          <div className="flex justify-between"><span>Monthly Flux</span><span className="font-bold">{plan.monthly_flux_limit}</span></div>
                          <div className="flex justify-between"><span>Daily TTS</span><span className="font-bold">{plan.daily_tts_limit}</span></div>
                          <div className="flex justify-between"><span>Daily STT</span><span className="font-bold">{plan.daily_stt_limit}</span></div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {displayMode === 'dashboard' && view === "activity" && (
            <motion.div
              key="activity"
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
                <h2 className={`text-3xl font-display font-black tracking-tight uppercase ${isDarkMode ? "text-white" : "text-black"}`}>Activity Logs</h2>
                <p className={`text-[10px] font-mono uppercase mt-2 tracking-[0.4em] ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>System-wide institution activity</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className={`text-[9px] font-mono uppercase tracking-[0.3em] ${isDarkMode ? "bg-black text-white opacity-40" : "bg-white text-black opacity-60"}`}>
                      <th className={`p-8 font-bold border-b ${isDarkMode ? "border-white/5" : "border-black/10"}`}>Type</th>
                      <th className={`p-8 font-bold border-b ${isDarkMode ? "border-white/5" : "border-black/10"}`}>Institution</th>
                      <th className={`p-8 font-bold border-b ${isDarkMode ? "border-white/5" : "border-black/10"}`}>User</th>
                      <th className={`p-8 font-bold border-b ${isDarkMode ? "border-white/5" : "border-black/10"}`}>Activity</th>
                      <th className={`p-8 font-bold border-b ${isDarkMode ? "border-white/5" : "border-black/10"}`}>Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className={`text-[11px] font-mono uppercase tracking-tight ${isDarkMode ? "text-white" : "text-black"}`}>
                    {activityLogs.length === 0 ? (
                      <tr>
                        <td colSpan={5} className={`p-20 text-center font-display font-black text-2xl uppercase tracking-[1em] ${isDarkMode ? "opacity-20 text-white" : "opacity-40 text-black"}`}>
                          {adminDataError || "Void Found"}
                        </td>
                      </tr>
                    ) : (
                      activityLogs.map((log, idx) => (
                        <tr key={idx} className={`border-b transition-colors ${isDarkMode ? "border-white/5 hover:bg-white/[0.02]" : "border-black/10 hover:bg-black/[0.02]"}`}>
                          <td className="p-8">
                            <span className={`px-3 py-1 rounded-lg text-[10px] ${
                              log.type === "school"
                                ? (isDarkMode ? "bg-emerald-500/10 text-emerald-400" : "bg-emerald-500/10 text-emerald-600")
                                : (isDarkMode ? "bg-blue-500/10 text-blue-400" : "bg-blue-500/10 text-blue-600")
                            }`}>
                              {log.type}
                            </span>
                          </td>
                          <td className={`p-8 text-[11px] font-bold ${isDarkMode ? "text-white" : "text-black"}`}>{log.institution}</td>
                          <td className={`p-8 text-[10px] ${isDarkMode ? "opacity-60 text-white" : "opacity-80 text-black"}`}>{log.user_name}</td>
                          <td className={`p-8 text-[10px] ${isDarkMode ? "opacity-60 text-white" : "opacity-80 text-black"}`}>{log.activity_type}</td>
                          <td className={`p-8 text-[10px] ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>
                            {new Date(log.created_at).toLocaleString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {displayMode === 'dashboard' && view === "usage" && (
            <motion.div
              key="usage"
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
                      isDarkMode ? "bg-white/5 border-white/10 text-white" : "bg-black/5 border-black/10 text-black placeholder:text-black/40"
                    }`}
                  />
                </div>
              </div>

              <div className="overflow-x-auto relative overflow-hidden group">
                <div className="absolute inset-0 -translate-y-full group-hover:translate-y-full transition-transform duration-1000 bg-gradient-to-b from-transparent via-white/5 to-transparent pointer-events-none" />
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className={`text-[9px] font-mono uppercase tracking-[0.3em] ${isDarkMode ? "bg-black text-white opacity-40" : "bg-white text-black opacity-60"}`}>
                      <th className={`p-8 font-bold border-b ${isDarkMode ? "border-white/5" : "border-black/10"}`}>Student</th>
                      <th className={`p-8 font-bold border-b ${isDarkMode ? "border-white/5" : "border-black/10"} text-center`}>Class</th>
                      <th className={`p-8 font-bold border-b ${isDarkMode ? "border-white/5" : "border-black/10"} text-center`}>Daily Chats</th>
                      <th className={`p-8 font-bold border-b ${isDarkMode ? "border-white/5" : "border-black/10"} text-center`}>Chats Used</th>
                      <th className={`p-8 font-bold border-b ${isDarkMode ? "border-white/5" : "border-black/10"} text-right`}>Last Active</th>
                    </tr>
                  </thead>
                  <tbody className={`text-[11px] font-mono uppercase tracking-tight ${isDarkMode ? "text-white" : "text-black"}`}>
                    {paginatedStudents.length === 0 ? (
                      <tr>
                        <td colSpan={5} className={`p-20 text-center font-display font-black text-2xl uppercase tracking-[1em] ${isDarkMode ? "opacity-20 text-white" : "opacity-40 text-black"}`}>Void Found</td>
                      </tr>
                    ) : (
                      paginatedStudents.map((s) => (
                        <tr key={s.id} className={`border-b transition-colors group ${isDarkMode ? "border-white/5 hover:bg-white/[0.02]" : "border-black/10 hover:bg-black/[0.02]"}`}>
                          <td className="p-8">
                            <div className="flex items-center gap-4">
                              <div className={`h-10 w-10 rounded-xl flex items-center justify-center border ${isDarkMode ? "bg-white/5 border-white/10" : "bg-black/5 border-black/10"}`}>
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
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className={`p-8 flex items-center justify-between border-t ${isDarkMode ? "bg-black border-white/10" : "bg-white border-black/10"}`}>
                <div className={`flex items-center gap-4 text-[9px] font-mono tracking-[0.3em] uppercase ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>
                  <BarChart3 className={`h-4 w-4 ${isDarkMode ? "text-white" : "text-black"}`} />
                  <span>Page {currentPage} // {totalStudentPages || 1}</span>
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
                    className={`p-3 border rounded-xl disabled:opacity-20 hover:bg-white/5 transition-all ${isDarkMode ? "border-white/10 text-white" : "border-black/10 text-black"}`}
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
              className={`relative border border-zinc-800/50 rounded-[3rem] overflow-hidden backdrop-blur-3xl group ${
                isDarkMode ? "bg-gradient-to-br from-zinc-900 via-black to-zinc-900" : "bg-gradient-to-br from-zinc-100 via-white to-zinc-100"
              }`}
            >
              <div className={`absolute inset-0 bg-[linear-gradient(110deg,transparent_0%,rgba(255,255,255,0.03)_45%,rgba(255,255,255,0.06)_50%,rgba(255,255,255,0.03)_55%,transparent_100%)] pointer-events-none`} />
              <div className="absolute inset-0 -translate-y-full group-hover:translate-y-full transition-transform duration-1000 bg-gradient-to-b from-transparent via-white/5 to-transparent pointer-events-none" />
              <div className={`p-10 border-b flex flex-col lg:flex-row lg:items-center justify-between gap-6 ${isDarkMode ? "bg-black border-white/5" : "bg-white border-black/10"}`}>
                <div>
                  <h2 className={`text-3xl font-display font-black tracking-tight uppercase ${isDarkMode ? "text-white" : "text-black"}`}>Consolidated Records</h2>
                  <p className={`text-[10px] font-mono uppercase mt-2 tracking-[0.4em] ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>All institution data • {allTableData.length} entries</p>
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
                      <th className={`p-8 font-bold border-b ${isDarkMode ? "border-white/5" : "border-black/10"}`}>Type</th>
                      <th className={`p-8 font-bold border-b ${isDarkMode ? "border-white/5" : "border-black/10"}`}>Identity</th>
                      <th className={`p-8 font-bold border-b ${isDarkMode ? "border-white/5" : "border-black/10"}`}>Contact</th>
                      <th className={`p-8 font-bold border-b ${isDarkMode ? "border-white/5" : "border-black/10"}`}>Code / Class</th>
                      <th className={`p-8 font-bold border-b ${isDarkMode ? "border-white/5" : "border-black/10"} text-center`}>Quota / Chats</th>
                      <th className={`p-8 font-bold border-b ${isDarkMode ? "border-white/5" : "border-black/10"}`}>Created</th>
                    </tr>
                  </thead>
                  <tbody className={`text-[11px] font-mono uppercase tracking-tight ${isDarkMode ? "text-white" : "text-black"}`}>
                    {paginatedTableData.length === 0 ? (
                      <tr>
                        <td colSpan={6} className={`p-20 text-center font-display font-black text-2xl uppercase tracking-[1em] ${isDarkMode ? "opacity-20 text-white" : "opacity-40 text-black"}`}>Void Found</td>
                      </tr>
                    ) : (
                      paginatedTableData.map((item, idx) => (
                        <tr key={idx} className={`border-b transition-colors group ${isDarkMode ? "border-white/5 hover:bg-white/[0.02]" : "border-black/10 hover:bg-black/[0.02]"}`}>
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
                              <div className={`h-10 w-10 rounded-xl flex items-center justify-center border ${isDarkMode ? "bg-white/5 border-white/10" : "bg-black/5 border-black/10"}`}>
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
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className={`p-8 flex items-center justify-between border-t ${isDarkMode ? "bg-black border-white/10" : "bg-white border-black/10"}`}>
                <div className={`flex items-center gap-4 text-[9px] font-mono tracking-[0.3em] uppercase ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>
                  <Database className={`h-4 w-4 ${isDarkMode ? "text-white" : "text-black"}`} />
                  <span>Page {currentPage} // {totalTablePages || 1}</span>
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
                    className={`p-3 border rounded-xl disabled:opacity-20 hover:bg-white/5 transition-all ${isDarkMode ? "border-white/10 text-white" : "border-black/10 text-black"}`}
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
            className={`relative w-full max-w-lg max-h-[80vh] overflow-y-auto border border-zinc-800/50 p-6 rounded-[2rem] overflow-hidden group ${
              isDarkMode ? "bg-gradient-to-br from-zinc-900 via-black to-zinc-900 text-white" : "bg-gradient-to-br from-zinc-100 via-white to-zinc-100 text-black"
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
                    isDarkMode ? "bg-white/5 border-white/10 text-white" : "bg-black/5 border-black/10 text-black"
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
                    isDarkMode ? "bg-white/5 border-white/10 text-white" : "bg-black/5 border-black/10 text-black"
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
                    isDarkMode ? "bg-white/5 border-white/10 text-white" : "bg-black/5 border-black/10 text-black"
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
                    isDarkMode ? "bg-white/5 border-white/10 text-white" : "bg-black/5 border-black/10 text-black"
                  }`}
                />
              </div>
              <div>
                <label className={`text-[9px] font-mono uppercase tracking-widest ${isDarkMode ? "opacity-40 text-white" : "opacity-60 text-black"}`}>Assigned Class (optional)</label>
                <input
                  value={facultyForm.assigned_class}
                  onChange={(e) => setFacultyForm((prev) => ({ ...prev, assigned_class: e.target.value }))}
                  className={`w-full mt-1 p-3 text-xs font-mono border rounded-xl focus:outline-none focus:border-emerald-500/50 ${
                    isDarkMode ? "bg-white/5 border-white/10 text-white" : "bg-black/5 border-black/10 text-black"
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
                    isDarkMode ? "bg-white/5 border-white/10 text-white" : "bg-black/5 border-black/10 text-black"
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
