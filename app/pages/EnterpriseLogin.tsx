"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { ArrowLeft, Building2, Mail, Lock } from "lucide-react"

export default function EnterpriseLogin() {
    const [isLogin, setIsLogin] = useState(true)
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [company, setCompany] = useState("")

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        window.location.href = "/chat"
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
                        <div className="h-16 w-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mx-auto mb-6">
                            <Building2 className="h-8 w-8 text-purple-500" />
                        </div>
                        <h2 className="font-display font-black text-4xl tracking-tighter text-white mb-4">
                            {isLogin ? "Welcome Back" : "Join Enterprise"}
                        </h2>
                        <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-white/40">
                            {isLogin ? "Sign in to enterprise account" : "Create enterprise account"}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {!isLogin && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative group">
                                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20 group-focus-within:text-white/60 transition-colors" />
                                <input type="text" placeholder="COMPANY NAME" value={company} onChange={(e) => setCompany(e.target.value)} className="w-full pl-12 pr-6 py-4 text-xs font-mono tracking-widest bg-white/5 border border-white/5 rounded-2xl focus:outline-none focus:border-purple-500/50 transition-all placeholder:text-white/20" required />
                            </motion.div>
                        )}
                        <div className="relative group">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20 group-focus-within:text-white/60 transition-colors" />
                            <input type="email" placeholder="EMAIL ADDRESS" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full pl-12 pr-6 py-4 text-xs font-mono tracking-widest bg-white/5 border border-white/5 rounded-2xl focus:outline-none focus:border-purple-500/50 transition-all placeholder:text-white/20" required />
                        </div>
                        <div className="relative group">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20 group-focus-within:text-white/60 transition-colors" />
                            <input type="password" placeholder="PASSWORD" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pl-12 pr-6 py-4 text-xs font-mono tracking-widest bg-white/5 border border-white/5 rounded-2xl focus:outline-none focus:border-purple-500/50 transition-all placeholder:text-white/20" required />
                        </div>
                        <button type="submit" className="w-full py-4 bg-purple-500 text-white text-[10px] font-mono uppercase tracking-[0.3em] font-black hover:scale-[1.02] active:scale-[0.98] transition-all rounded-2xl shadow-xl flex items-center justify-center gap-3">
                            {isLogin ? "Sign In" : "Create Account"} →
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <button onClick={() => setIsLogin(!isLogin)} className="text-[10px] font-mono uppercase tracking-[0.3em] text-white/40 hover:text-white transition-colors">
                            {isLogin ? "Need an account? Sign Up" : "Already have an account? Sign In"}
                        </button>
                    </div>
                </motion.div>
            </div>
        </div>
    )
}
