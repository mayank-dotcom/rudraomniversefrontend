"use client"

import { motion } from "framer-motion"
import Navbar from "@/components/ui/Navbar"
import { GraduationCap, ShieldCheck, ArrowRight, Sparkles } from "lucide-react"

export default function AuthSelection() {
  const roles = [
    {
      title: "Regular User",
      description: "Access AI tutoring, learning tools, and manage your account.",
      icon: GraduationCap,
      path: "/regular-user",
      color: "emerald",
      gradient: "from-emerald-500/20 via-emerald-500/5 to-transparent",
      borderColor: "border-emerald-500/20",
      iconBg: "bg-emerald-500/10",
      iconColor: "text-emerald-400",
      tag: "student",
    },
    {
      title: "Admin Portal",
      description: "Common access for School Admin, Enterprise Admin, and Global Admin.",
      icon: ShieldCheck,
      path: "/admin",
      color: "amber",
      gradient: "from-amber-500/20 via-amber-500/5 to-transparent",
      borderColor: "border-amber-500/20",
      iconBg: "bg-amber-500/10",
      iconColor: "text-amber-400",
      tag: "admin",
    },
  ]

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-white selection:text-black font-sans overflow-hidden">
      <div className="absolute inset-0 noise opacity-[0.02] pointer-events-none" />

      {/* Background decorative elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/5 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/5 blur-[120px] rounded-full pointer-events-none" />

      <Navbar />

      {/* Main Content */}
      <div className="relative z-10 pt-32 pb-20 px-6 md:px-20 min-h-screen flex flex-col">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-16 mt-8"
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="h-4 w-4 text-white/30" />
            <span className="text-[9px] font-mono uppercase tracking-[0.4em] text-white/30">Authentication</span>
            <Sparkles className="h-4 w-4 text-white/30" />
          </div>
          <div className="flex items-baseline gap-2 justify-center">
            <span className="font-display font-black text-6xl md:text-7xl tracking-tighter text-white">Choose Your</span>
            <span className="font-serif text-6xl md:text-7xl text-white/40 italic">Role</span>
          </div>
          <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-white/40 max-w-md mx-auto mt-4">
            Select how you want to access rudranex ai
          </p>
        </motion.div>

        {/* Role Cards — 2 Column Split */}
        <div className="flex-1 flex items-center justify-center pb-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-5xl">
            {roles.map((role, index) => (
              <motion.div
                key={role.title}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 + index * 0.15, ease: [0.22, 1, 0.36, 1] }}
                onClick={() => { window.location.href = role.path }}
                className="group relative border border-white/10 bg-gradient-to-br from-white/[0.04] to-transparent hover:from-white/[0.08] transition-all duration-700 rounded-[3rem] cursor-pointer overflow-hidden h-full"
              >
                {/* Glow effect */}
                <div className={`absolute inset-0 bg-gradient-to-b ${role.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-700`} />

                {/* Shine effect */}
                <div className="absolute inset-0 bg-[linear-gradient(110deg,transparent_0%,rgba(255,255,255,0.03)_45%,rgba(255,255,255,0.06)_50%,rgba(255,255,255,0.03)_55%,transparent_100%)] pointer-events-none" />

                {/* Slide shine */}
                <div className="absolute inset-0 -translate-y-full group-hover:translate-y-full transition-transform duration-1000 bg-gradient-to-b from-transparent via-white/5 to-transparent pointer-events-none" />

                <div className="relative p-12 md:p-14 flex flex-col h-full">
                  {/* Top section: icon + number */}
                  <div className="flex items-start justify-between mb-10">
                    <div className={`h-16 w-16 rounded-2xl ${role.iconBg} border ${role.borderColor} flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}>
                      <role.icon className={`h-7 w-7 ${role.iconColor}`} />
                    </div>
                    <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/20 group-hover:text-white/40 transition-colors">
                      {`0${index + 1}`}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <h3 className="font-display font-black text-3xl md:text-4xl text-white mb-5 group-hover:translate-x-1 transition-transform duration-500">
                      {role.title}
                    </h3>
                    <p className="text-white/40 text-sm font-light leading-relaxed group-hover:text-white/60 transition-colors duration-500 max-w-sm">
                      {role.description}
                    </p>
                  </div>

                  {/* Bottom: tag + continue */}
                  <div className="mt-10 pt-6 border-t border-white/5">
                    <div className="flex items-center justify-between">
                      <span className={`text-[9px] font-mono uppercase tracking-[0.3em] px-3 py-1 rounded-full border ${role.borderColor} ${role.iconColor}`}>
                        {role.tag}
                      </span>
                      <div className="flex items-center gap-2 text-white/30 group-hover:text-white transition-all duration-500">
                        <span className="text-[10px] font-mono uppercase tracking-[0.3em]">Continue</span>
                        <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/5 py-4 flex items-center justify-between text-[9px] font-mono uppercase tracking-[0.3em] text-white/20">
          <div className="flex items-center gap-4">
            <div className="h-1.5 w-1.5 bg-white/20 rotate-45" />
            <span>Secure Access</span>
          </div>
          <span>Rudranex AI &copy; 2026</span>
        </div>
      </div>
    </div>
  )
}
