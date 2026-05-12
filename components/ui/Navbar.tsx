"use client"

import { useState } from "react"
import { motion } from "framer-motion";
import Link from "next/link";
import { LogOut, Moon, Sun } from "lucide-react"
import { isAuthenticated, removeApiKey } from "@/lib/auth"
import { useTheme } from "@/lib/theme-context"

interface NavbarProps {
    onAuthClick?: () => void
}

const Navbar = ({ onAuthClick }: NavbarProps) => {
    const [authed, setAuthed] = useState(false)
    const { isDarkMode, toggleTheme } = useTheme()

    const handleLogout = () => {
        removeApiKey()
        setAuthed(false)
        window.location.reload()
    }

    return (
        <motion.nav
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
            className={`fixed top-0 left-0 right-0 z-50 border-b-2 backdrop-blur-2xl ${isDarkMode ? "border-white bg-black/20" : "border-black bg-white/80"}`}
        >
            <div className="w-full px-10 md:px-20 py-6 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-4">
                    <div className={`h-[30px] w-[30px] border-2 ${isDarkMode ? "border-white" : "border-black"} flex items-center justify-center`}>
                        <svg width="28" height="28" viewBox="0 0 128 128" className={isDarkMode ? "text-white" : "text-black"}>
                            <polygon points="20,20 86,20 86,55 58,55 58,40 42,40 42,55 42,68 104,108 78,108 50,72 42,72 42,108 20,108" fill="currentColor" />
                        </svg>
                    </div>
                    <div className="flex items-baseline gap-1.5">
                        <span className={`font-display font-black text-lg tracking-tighter ${isDarkMode ? "text-white" : "text-black"}`}>RUDRANEX</span>
                        <span className={`font-serif text-lg ${isDarkMode ? "text-white/40" : "text-black/40"} italic`}>ai</span>
                    </div>
                </Link>
                
                <div className={`hidden md:flex items-center gap-12 text-[10px] font-mono uppercase tracking-[0.2em] ${isDarkMode ? "text-white/40" : "text-black"} absolute left-1/2 -translate-x-1/2`}>
                    <a href="/#features" className={`transition-colors duration-300 ${isDarkMode ? "hover:text-white" : "hover:text-gray-400"}`}>01 — Features</a>
                    <Link href="/pricing" className={`transition-colors duration-300 ${isDarkMode ? "hover:text-white" : "hover:text-gray-400"}`}>02 — Pricing</Link>
                    <a href="/#manifesto" className={`transition-colors duration-300 ${isDarkMode ? "hover:text-white" : "hover:text-gray-400"}`}>03 — Manifesto</a>
                    <a href="/#cta" className={`transition-colors duration-300 ${isDarkMode ? "hover:text-white" : "hover:text-gray-400"}`}>04 — Access</a>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={toggleTheme}
                        className={`p-2.5 border transition-all duration-300 ${isDarkMode ? "border-white/20 text-white/60 hover:text-white hover:border-white/40 hover:scale-110" : "border-black/20 text-black/60 hover:text-black hover:border-black/40 hover:scale-110"}`}
                        title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                    >
                        {isDarkMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                    </button>

                    {authed ? (
                        <button
                            onClick={handleLogout}
                            className="px-6 py-2.5 border border-white/10 text-white text-[10px] font-mono uppercase tracking-widest font-bold hover:bg-white/5 transition-all active:scale-95 flex items-center gap-2"
                        >
                            <LogOut className="h-3.5 w-3.5" />
                            Logout
                        </button>
                    ) : (
                        <button
                            onClick={onAuthClick}
                            className={`px-6 py-2.5 text-[10px] font-mono uppercase tracking-widest font-bold transition-all active:scale-95 ${isDarkMode ? "bg-white text-black hover:bg-white/90" : "bg-black text-white hover:bg-black/90"}`}
                        >
                            Login / Sign Up
                        </button>
                    )}
                </div>
            </div>
        </motion.nav>
    );
};

export default Navbar;
