"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { Building2, Lock, User, Briefcase, Users, Shield, KeyRound, Smartphone } from "lucide-react"
import Navbar from "@/components/ui/Navbar"
import { loginEnterprise, loginByAdminCode } from "@/lib/chat-api"
import { setApiKey, setUserInfo, setUserRole } from "@/lib/auth"
import { useTheme } from "@/lib/theme-context"

type RoleTab = "admin" | "manager" | "employee"

function InputGroup({ icon: Icon, placeholder, value, onChange, type, isDarkMode, accentColor }: {
    icon: any; placeholder: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; type: string; isDarkMode: boolean; accentColor: string
}) {
    const focusBorder = accentColor === "purple" ? "focus:border-purple-500/50" : "focus:border-orange-500/50"
    return (
        <div className="relative group">
            <Icon className={`absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors ${isDarkMode ? "text-white/20 group-focus-within:text-white/60" : "text-black/20 group-focus-within:text-black/60"}`} />
            <input
                type={type}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                className={`w-full pl-12 pr-6 py-4 text-xs font-mono tracking-widest border rounded-2xl focus:outline-none transition-all placeholder:opacity-40 ${
                    isDarkMode
                        ? "bg-white/5 border-white/5 text-white focus:border-white/30 placeholder:text-white/40"
                        : "bg-white border-black/10 text-black focus:border-black/30 placeholder:text-black/40 shadow-sm"
                } ${focusBorder}`}
                required
            />
        </div>
    )
}

export default function EnterprisePortalLogin() {
    const { isDarkMode } = useTheme()
    const [roleTab, setRoleTab] = useState<RoleTab>("admin")
    const [adminCode, setAdminCode] = useState("")
    const [password, setPassword] = useState("")
    const [mobileNumber, setMobileNumber] = useState("")
    const [enterpriseCode, setEnterpriseCode] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError("")
        try {
            if (roleTab === "employee") {
                const res = await loginEnterprise({
                    mobile_number: mobileNumber.trim(),
                    password: password.trim(),
                    enterprise_code: enterpriseCode.trim(),
                })
                if (res.api_key) {
                    setApiKey(res.api_key)
                    setUserInfo(res.name || "Employee", "")
                    setUserRole(res.role || "employee")
                }
                window.location.href = "/chat"
            } else {
                const res = await loginByAdminCode(adminCode.trim(), password.trim())
                if (res.api_key) {
                    setApiKey(res.api_key)
                    setUserInfo(res.name || "Admin", "")
                }
                const role = (res.role || "").toLowerCase()
                if (role === "enterprise_admin") {
                    window.location.href = "/admin/enterprise-admin"
                } else if (role === "manager") {
                    window.location.href = "/admin/enterprise-manager"
                } else {
                    throw new Error("Invalid enterprise role")
                }
            }
        } catch (e: any) {
            const msg = e.message || "Login failed"
            setError(msg.includes("404") ? "Enterprise login service unavailable. Please ensure the backend server is running the latest code." : msg)
        } finally {
            setLoading(false)
        }
    }

    const isAdmin = roleTab === "admin"
    const isManager = roleTab === "manager"
    const isEmployee = roleTab === "employee"
    const accentColor = isEmployee ? "purple" : isManager ? "blue" : "orange"

    return (
        <div className={`min-h-screen transition-colors duration-300 selection:bg-[var(--color-cyan)] selection:text-black font-sans ${
            isDarkMode ? "bg-[#0a0a0a] text-white" : "bg-[#f8f9fa] text-black"
        }`}>
            <div className="absolute inset-0 noise opacity-[0.02] pointer-events-none" />

            <Navbar onAuthClick={() => window.location.href = "/"} />

            <div className="pt-40 pb-20 px-6 md:px-20 flex items-center justify-center">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="w-full max-w-md">
                    <div className="text-center mb-10">
                        <div className={`h-16 w-16 rounded-2xl flex items-center justify-center mx-auto mb-6 ${accentColor === "purple" ? "bg-purple-500/10 border border-purple-500/20" : accentColor === "blue" ? "bg-blue-500/10 border border-blue-500/20" : "bg-orange-500/10 border border-orange-500/20"}`}>
                            <Building2 className={`h-8 w-8 ${accentColor === "purple" ? "text-purple-500" : accentColor === "blue" ? "text-blue-500" : "text-orange-500"}`} />
                        </div>
                        <h2 className={`font-display font-black text-4xl tracking-tighter mb-2 ${isDarkMode ? "text-white" : "text-black"}`}>Enterprise Portal</h2>
                        <p className={`text-[10px] font-mono uppercase tracking-[0.3em] ${isDarkMode ? "text-white/40" : "text-black/40"}`}>Sign in to your enterprise account</p>
                    </div>

                    <div className={`flex mb-8 border rounded-2xl p-1 transition-colors ${
                        isDarkMode ? "bg-white/5 border-white/5" : "bg-black/5 border-black/5"
                    }`}>
                        {([
                            { key: "admin" as RoleTab, label: "Admin", icon: Shield, color: "orange" },
                            { key: "manager" as RoleTab, label: "Manager", icon: Briefcase, color: "blue" },
                            { key: "employee" as RoleTab, label: "Employee", icon: Users, color: "purple" },
                        ]).map(({ key, label, icon: Icon, color }) => {
                            const isActive = roleTab === key
                            const activeClass = color === "orange" ? "bg-orange-500/20 text-orange-400" : color === "blue" ? "bg-blue-500/20 text-blue-400" : "bg-purple-500/20 text-purple-400"
                            return (
                                <button
                                    key={key}
                                    onClick={() => { setRoleTab(key); setError("") }}
                                    className={`flex-1 py-3 text-[10px] font-mono uppercase tracking-[0.15em] font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${isActive ? activeClass + " shadow-lg" : isDarkMode ? "text-white/30 hover:text-white/60" : "text-black/30 hover:text-black/60"}`}
                                >
                                    <Icon className="h-3.5 w-3.5" />
                                    {label}
                                </button>
                            )
                        })}
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs font-mono text-center">
                                {error}
                            </div>
                        )}

                        {isEmployee ? (
                            <>
                                <InputGroup icon={Smartphone} placeholder="MOBILE NUMBER (WITH COUNTRY CODE)" value={mobileNumber} onChange={(e) => setMobileNumber(e.target.value)} type="tel" isDarkMode={isDarkMode} accentColor="purple" />
                                <InputGroup icon={KeyRound} placeholder="ENTERPRISE CODE" value={enterpriseCode} onChange={(e) => setEnterpriseCode(e.target.value)} type="text" isDarkMode={isDarkMode} accentColor="purple" />
                                <InputGroup icon={Lock} placeholder="PASSWORD" value={password} onChange={(e) => setPassword(e.target.value)} type="password" isDarkMode={isDarkMode} accentColor="purple" />
                            </>
                        ) : (
                            <>
                                <InputGroup icon={Shield} placeholder="ADMIN CODE" value={adminCode} onChange={(e) => setAdminCode(e.target.value)} type="text" isDarkMode={isDarkMode} accentColor="orange" />
                                <InputGroup icon={Lock} placeholder="PASSWORD" value={password} onChange={(e) => setPassword(e.target.value)} type="password" isDarkMode={isDarkMode} accentColor="orange" />
                            </>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full py-4 text-white text-[10px] font-mono uppercase tracking-[0.3em] font-black hover:scale-[1.02] active:scale-[0.98] transition-all rounded-2xl shadow-xl flex items-center justify-center gap-3 disabled:opacity-50 ${accentColor === "orange" ? "bg-orange-500" : accentColor === "blue" ? "bg-blue-500" : "bg-purple-500"}`}
                        >
                            {loading ? "Signing In..." : `Sign In as ${roleTab.charAt(0).toUpperCase() + roleTab.slice(1)} →`}
                        </button>
                    </form>
                </motion.div>
            </div>
        </div>
    )
}
