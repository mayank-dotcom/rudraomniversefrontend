"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { ArrowLeft, Building2, Lock } from "lucide-react"
import { loginByAdminCode } from "@/lib/chat-api"
import { setApiKey } from "@/lib/auth"

export default function EnterpriseAdminLogin() {
    const [adminCode, setAdminCode] = useState("")
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError("")
        try {
            const res = await loginByAdminCode(adminCode.trim(), password.trim())
            if (res.api_key) setApiKey(res.api_key)
            if ((res.role || "").toLowerCase() !== "enterprise_admin") {
                throw new Error("This code is not for Enterprise Admin login")
            }
            window.location.href = "/admin/enterprise-admin"
        } catch (e: any) {
            setError(e.message || "Login failed")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-white selection:text-black font-sans">
            <div className="absolute inset-0 noise opacity-[0.02] pointer-events-none" />

            <div className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-black/20 backdrop-blur-2xl">
                <div className="w-full px-10 md:px-20 py-6 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-4">
                        <div className="h-6 w-6 bg-white flex items-center justify-center">
                            <div className="h-1.5 w-1.5 bg-black" />
                        </div>
                        <div className="flex items-baseline gap-1.5">
                            <span className="font-display font-black text-lg tracking-tighter text-white">RUDRANEX</span>
                            <span className="font-serif text-lg text-white/40 italic">ai</span>
                        </div>
                    </Link>
                    <Link href="/auth" className="px-6 py-2.5 border border-white/10 text-white text-[10px] font-mono uppercase tracking-widest font-bold hover:bg-white/5 transition-all flex items-center gap-2">
                        <ArrowLeft className="h-3.5 w-3.5" />
                        Back to Roles
                    </Link>
                </div>
            </div>

            <div className="pt-40 pb-20 px-6 md:px-20 flex items-center justify-center">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="w-full max-w-md">
                    <div className="text-center mb-12">
                        <div className="h-16 w-16 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mx-auto mb-6">
                            <Building2 className="h-8 w-8 text-orange-500" />
                        </div>
                        <h2 className="font-display font-black text-4xl tracking-tighter text-white mb-4">Enterprise Admin</h2>
                        <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-white/40">Sign in to enterprise admin portal</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs font-mono text-center">
                                {error}
                            </div>
                        )}
                        <div className="relative group">
                            <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20 group-focus-within:text-white/60 transition-colors" />
                            <input type="text" placeholder="ENTERPRISE ADMIN CODE" value={adminCode} onChange={(e) => setAdminCode(e.target.value)} className="w-full pl-12 pr-6 py-4 text-xs font-mono tracking-widest bg-white/5 border border-white/5 rounded-2xl focus:outline-none focus:border-orange-500/50 transition-all placeholder:text-white/20" required />
                        </div>
                        <div className="relative group">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20 group-focus-within:text-white/60 transition-colors" />
                            <input type="password" placeholder="PASSWORD" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pl-12 pr-6 py-4 text-xs font-mono tracking-widest bg-white/5 border border-white/5 rounded-2xl focus:outline-none focus:border-orange-500/50 transition-all placeholder:text-white/20" required />
                        </div>
                        <button type="submit" disabled={loading} className="w-full py-4 bg-orange-500 text-white text-[10px] font-mono uppercase tracking-[0.3em] font-black hover:scale-[1.02] active:scale-[0.98] transition-all rounded-2xl shadow-xl flex items-center justify-center gap-3 disabled:opacity-50">
                            {loading ? "Signing In..." : "Sign In →"}
                        </button>
                    </form>
                </motion.div>
            </div>
        </div>
    )
}
