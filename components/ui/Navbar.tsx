"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion";
import Link from "next/link";
import { Moon, Sun, Menu, X, Code2, Smartphone, ChevronDown } from "lucide-react"
import { isAuthenticated } from "@/lib/auth"
import { useTheme } from "@/lib/theme-context"

interface NavbarProps {
    onAuthClick?: () => void
}

const Navbar = ({ onAuthClick }: NavbarProps) => {
    const [authed, setAuthed] = useState(false)
    const { isDarkMode, toggleTheme } = useTheme()
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isAccessOpen, setIsAccessOpen] = useState(false);

    useEffect(() => {
        setAuthed(isAuthenticated());
    }, []);

    const navLinks = [
        { label: "Features", href: "/#features" },
        { label: "Pricing", href: "/pricing" },
        { label: "Library", href: "/library" },
        { label: "FAQ", href: "/faq" },
        { label: "Support", href: "/support" },
        { label: "Schools", href: "/schools" },
    ];

    const accessItems = [
        { label: "Plugin", href: "/plugin", icon: Code2, desc: "For VS Code, JetBrains & more" },
        { label: "Mobile App", href: "/mobile-app", icon: Smartphone, desc: "Native mobile experience" },
    ];

    return (
        <motion.nav
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className={`fixed top-0 left-0 right-0 z-50 px-6 md:px-12 py-4 border-b ${isDarkMode ? "bg-[#0a0a0a]/80 border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.5)]" : "bg-white/80 border-black/5 shadow-sm"} backdrop-blur-md transition-all duration-500`}
        >
            <div className="max-w-[1400px] mx-auto flex items-center justify-between">
                {/* Logo — 24px Bold, -0.02em tracking */}
                <Link href="/" className="flex items-center gap-3 group shrink-0">
                    <div className="h-8 w-8 flex items-center justify-center shrink-0 overflow-hidden">
                        <img 
                            src={isDarkMode ? "/dark.png" : "/light.png"} 
                            alt="Logo" 
                            className="h-full w-full object-contain transition-transform duration-300"
                            style={{ transform: isDarkMode ? "scale(1.5)" : "none" }}
                        />
                    </div>
                    <div className="h-6 flex items-center shrink-0 overflow-hidden ml-1">
                        <img 
                            src={isDarkMode ? "/dark_text.png" : "/light_text.png"} 
                            alt="Rudranex" 
                            className="h-full object-contain"
                        />
                    </div>
                </Link>

                {/* Desktop Nav Links — 12px Medium, 0.05em tracking */}
                <div className="hidden lg:flex items-center gap-10">
                    {navLinks.map((link) => (
                        <Link
                            key={link.label}
                            href={link.href}
                            className={`group flex items-center gap-2 font-sans font-medium uppercase transition-all duration-300 ${isDarkMode ? "text-white/40 hover:text-white" : "text-black/40 hover:text-black"}`}
                            style={{ fontSize: "12px", letterSpacing: "0.05em" }}
                        >
                            <span className="group-hover:text-[var(--color-cyan)] transition-colors duration-300">{link.label}</span>
                        </Link>
                    ))}

                    {/* Access Dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setIsAccessOpen((prev) => !prev)}
                            className={`group flex items-center gap-2 font-sans font-medium uppercase transition-all duration-300 cursor-pointer ${isDarkMode ? "text-white/40 hover:text-white" : "text-black/40 hover:text-black"}`}
                            style={{ fontSize: "12px", letterSpacing: "0.05em" }}
                        >
                            <span className="group-hover:text-[var(--color-cyan)] transition-colors duration-300">Access</span>
                            <ChevronDown className={`h-3 w-3 transition-transform duration-300 ${isAccessOpen ? "rotate-180" : ""}`} />
                        </button>
                        {isAccessOpen && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setIsAccessOpen(false)} />
                                <motion.div
                                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                                    transition={{ duration: 0.2, ease: "easeOut" }}
                                    className={`absolute top-full left-1/2 -translate-x-1/2 mt-3 w-64 rounded-xl border p-2 shadow-2xl z-20 ${isDarkMode ? "bg-[#0a0a0a]/95 border-white/10 backdrop-blur-xl" : "bg-white/95 border-black/5 backdrop-blur-xl"}`}
                                >
                                    {accessItems.map((item) => (
                                        <Link
                                            key={item.label}
                                            href={item.href}
                                            className={`flex items-start gap-4 rounded-lg p-3.5 transition-all duration-200 group/drop ${isDarkMode ? "hover:bg-white/5" : "hover:bg-black/5"}`}
                                            onClick={() => setIsAccessOpen(false)}
                                        >
                                            <div className={`flex items-center justify-center h-10 w-10 rounded-lg shrink-0 ${isDarkMode ? "bg-white/5" : "bg-black/5"} group-hover/drop:bg-[var(--color-cyan)]/10 transition-colors duration-200`}>
                                                <item.icon className={`h-5 w-5 ${isDarkMode ? "text-white/60" : "text-black/60"} group-hover/drop:text-[var(--color-cyan)] transition-colors duration-200`} />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className={`font-sans font-semibold text-sm ${isDarkMode ? "text-white/80" : "text-black/80"} group-hover/drop:text-[var(--color-cyan)] transition-colors duration-200`}>
                                                    {item.label}
                                                </span>
                                                <span className={`font-sans text-xs mt-0.5 ${isDarkMode ? "text-white/30" : "text-black/30"}`}>
                                                    {item.desc}
                                                </span>
                                            </div>
                                        </Link>
                                    ))}
                                </motion.div>
                            </>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-5">
                    <button
                        onClick={toggleTheme}
                        className={`p-2 transition-all duration-300 ${isDarkMode ? "text-white/40 hover:text-white" : "text-black/35 hover:text-black"}`}
                        title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                        aria-label="Toggle theme"
                    >
                        {isDarkMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                    </button>

                    {authed ? (
                        <Link
                            href="/chat"
                            className={`hidden md:flex items-center gap-2 px-5 py-2.5 font-sans font-semibold uppercase transition-all active:scale-95 ${isDarkMode ? "border border-white/10 text-white hover:bg-white/5" : "border border-black/10 text-black hover:bg-black/5"}`}
                            style={{ fontSize: "14px", letterSpacing: "0.05em" }}
                        >
                            Back to Chat
                        </Link>
                    ) : (
                        /* Button — 14px Semi-Bold, 0.05em tracking */
                        <button
                            onClick={onAuthClick}
                            className={`hidden md:block px-7 py-3 font-sans font-semibold uppercase transition-all duration-300 active:scale-95 ${isDarkMode ? "bg-white text-black hover:bg-white/90" : "bg-black text-white hover:bg-black/85"}`}
                            style={{ fontSize: "14px", letterSpacing: "0.05em" }}
                            aria-label="Login or Sign Up"
                        >
                            Login / Sign Up
                        </button>
                    )}

                    {/* Mobile Menu Button */}
                    <button
                        className={`lg:hidden p-2 ${isDarkMode ? "text-white/60" : "text-black/60"}`}
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        aria-label={isMenuOpen ? "Close menu" : "Open menu"}
                    >
                        {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMenuOpen && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className={`lg:hidden overflow-hidden flex flex-col gap-1 py-6 border-t ${isDarkMode ? "bg-[#0a0a0a] border-white/10" : "bg-white border-black/5"}`}
                >
                    {navLinks.map((link) => (
                        <Link
                            key={link.label}
                            href={link.href}
                            className={`flex items-center gap-4 px-6 py-3 font-sans font-medium uppercase transition-colors ${isDarkMode ? "text-white/60 hover:text-white" : "text-black/60 hover:text-black"}`}
                            style={{ fontSize: "12px", letterSpacing: "0.05em" }}
                            onClick={() => setIsMenuOpen(false)}
                        >
                            {link.label}
                        </Link>
                    ))}
                    {/* Mobile Access Label */}
                    <div className={`px-6 pt-3 pb-1 font-sans font-semibold uppercase text-[10px] tracking-[0.1em] ${isDarkMode ? "text-white/20" : "text-black/20"}`}>
                        Access
                    </div>
                    {accessItems.map((item) => (
                        <Link
                            key={item.label}
                            href={item.href}
                            className={`flex items-center gap-4 px-6 py-3 font-sans font-medium transition-colors ${isDarkMode ? "text-white/60 hover:text-white" : "text-black/60 hover:text-black"}`}
                            style={{ fontSize: "12px", letterSpacing: "0.05em" }}
                            onClick={() => setIsMenuOpen(false)}
                        >
                            <item.icon className="h-4 w-4" />
                            {item.label}
                        </Link>
                    ))}
                    <div className="px-6 mt-4">
                        {!authed ? (
                            <button
                                onClick={() => {
                                    onAuthClick?.();
                                    setIsMenuOpen(false);
                                }}
                                className={`w-full py-4 font-sans font-semibold uppercase ${isDarkMode ? "bg-white text-black" : "bg-black text-white"}`}
                                style={{ fontSize: "14px", letterSpacing: "0.05em" }}
                            >
                                Login / Sign Up
                            </button>
                        ) : (
                            <Link
                                href="/chat"
                                onClick={() => setIsMenuOpen(false)}
                                className={`block w-full py-4 text-center font-sans font-semibold uppercase ${isDarkMode ? "border border-white/10 text-white" : "border border-black/10 text-black"}`}
                                style={{ fontSize: "14px", letterSpacing: "0.05em" }}
                            >
                                Back to Chat
                            </Link>
                        )}
                    </div>
                </motion.div>
            )}
        </motion.nav>
    );
};

export default Navbar;
