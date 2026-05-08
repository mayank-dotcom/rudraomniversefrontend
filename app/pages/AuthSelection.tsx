"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { ChevronLeft, GraduationCap, ShieldCheck, Users } from "lucide-react"

const RoleCard = ({ title, description, icon: Icon, index, onClick }: { title: string, description: string, icon: any, index: number, onClick: () => void }) => (
    <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: index * 0.1 }}
        onClick={onClick}
        className="group relative border border-white/5 bg-[#0a0a0a] hover:bg-[#111] transition-all duration-500 rounded-[2.5rem] cursor-pointer overflow-hidden"
    >
        <div className="absolute inset-0 bg-[linear-gradient(110deg,transparent_0%,rgba(255,255,255,0.03)_45%,rgba(255,255,255,0.06)_50%,rgba(255,255,255,0.03)_55%,transparent_100%)] pointer-events-none" />
        <div className="absolute inset-0 -translate-y-full group-hover:translate-y-full transition-transform duration-1000 bg-gradient-to-b from-transparent via-white/5 to-transparent pointer-events-none" />

        <div className="relative p-10 flex flex-col h-full">
            <div className="flex items-center justify-between mb-8">
                <div className="h-14 w-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                    <Icon className="h-6 w-6 text-white/60 group-hover:text-white transition-colors" />
                </div>
                <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-white/20 group-hover:text-white/40 transition-colors">
                    0{index + 1}
                </span>
            </div>

            <h3 className="font-display font-black text-2xl text-white mb-4 group-hover:translate-x-1 transition-transform duration-500">
                {title}
            </h3>
            <p className="text-white/40 text-sm font-light leading-relaxed flex-1 group-hover:text-white/60 transition-colors duration-500">
                {description}
            </p>

            <div className="mt-8 pt-6 border-t border-white/5">
                <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-white/30 group-hover:text-white transition-colors">
                        Continue
                    </span>
                    <span className="text-white/20 group-hover:text-white group-hover:translate-x-1 transition-all duration-500">
                        →
                    </span>
                </div>
            </div>
        </div>
    </motion.div>
)

// SchoolOptions component removed - now showing all 4 cards directly

export default function AuthSelection() {
    const roles = [
        {
            title: "Regular User",
            description: "Access AI tutoring, learning tools, and manage your account.",
            icon: GraduationCap,
            path: "/regular-user"
        },
        {
            title: "Admin Portal",
            description: "Common access for School Admin, Enterprise Admin, and Global Admin.",
            icon: ShieldCheck,
            path: "/admin"
        },
        {
            title: "School Faculty",
            description: "Faculty login via admin code and password to manage students and classes.",
            icon: Users,
            path: "/auth/school-faculty"
        }
    ]

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-white selection:text-black font-sans">
            <div className="absolute inset-0 noise opacity-[0.02] pointer-events-none" />

            {/* Navigation */}
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

                    <Link
                        href="/"
                        className="px-6 py-2.5 border border-white/10 text-white text-[10px] font-mono uppercase tracking-widest font-bold hover:bg-white/5 transition-all active:scale-95 flex items-center gap-2"
                    >
                        <ChevronLeft className="h-3.5 w-3.5" />
                        Back to Home
                    </Link>
                </div>
            </div>

            {/* Main Content */}
            <div className="pt-40 pb-20 px-6 md:px-20">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="text-center mb-16"
                >
                    <div className="flex items-baseline gap-1.5 justify-center mb-4">
                        <span className="font-display font-black text-5xl tracking-tighter text-white">Choose Your</span>
                        <span className="font-serif text-5xl text-white/40 italic">Role</span>
                    </div>
                    <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-white/40 max-w-md mx-auto">
                        Select how you want to access rudranex ai
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto"
                >
                    {roles.map((role, index) => (
                        <RoleCard
                            key={role.title}
                            index={index}
                            title={role.title}
                            description={role.description}
                            icon={role.icon}
                            onClick={() => {
                                window.location.href = role.path!
                            }}
                        />
                    ))}
                </motion.div>
            </div>
        </div>
    )
}
