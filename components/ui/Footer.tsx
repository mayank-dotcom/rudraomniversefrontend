"use client"

import { Link } from "react-router-dom";
import { useTheme } from "@/lib/theme-context";

export default function Footer() {
    const { isDarkMode } = useTheme();

    return (
        <footer className={`py-12 border-t ${isDarkMode ? "border-white/5" : "border-black/10"}`}>
            <div className="container mx-auto px-6">
                <div className="flex flex-col md:flex-row justify-between gap-12 mb-10">
                    <div className="flex flex-col gap-4">
                        <div className="flex items-baseline gap-2">
                            <span className={`font-display font-black text-2xl tracking-tighter ${isDarkMode ? "text-white" : "text-black"}`}>RUDRANEX</span>
                            <span className={`font-serif text-2xl ${isDarkMode ? "text-muted-foreground" : "text-black/40"}`}>ai</span>
                        </div>
                        <p className={`text-[10px] font-mono uppercase tracking-widest max-w-xs ${isDarkMode ? "text-muted-foreground/60" : "text-black/40"}`}>
                            AI co-pilot for student life
                        </p>
                    </div>

                    <div className="flex flex-col gap-3">
                        <span className={`text-[9px] font-mono uppercase tracking-[0.3em] ${isDarkMode ? "text-white/30" : "text-black/30"}`}>Company</span>
                        <Link to="/about" className={`text-[10px] font-mono uppercase tracking-widest transition-all duration-300 ${isDarkMode ? "text-muted-foreground hover:text-white" : "text-black/60 hover:text-black"} hover:translate-x-1`}>About Us</Link>
                        <Link to="/privacy" className={`text-[10px] font-mono uppercase tracking-widest transition-all duration-300 ${isDarkMode ? "text-muted-foreground hover:text-white" : "text-black/60 hover:text-black"} hover:translate-x-1`}>Privacy Policy</Link>
                        <Link to="/terms" className={`text-[10px] font-mono uppercase tracking-widest transition-all duration-300 ${isDarkMode ? "text-muted-foreground hover:text-white" : "text-black/60 hover:text-black"} hover:translate-x-1`}>Terms of Service</Link>
                        <Link to="/contact" className={`text-[10px] font-mono uppercase tracking-widest transition-all duration-300 ${isDarkMode ? "text-muted-foreground hover:text-white" : "text-black/60 hover:text-black"} hover:translate-x-1`}>Contact Us</Link>
                    </div>

                    <div className="flex flex-col gap-3">
                        <span className={`text-[9px] font-mono uppercase tracking-[0.3em] ${isDarkMode ? "text-white/30" : "text-black/30"}`}>Platforms</span>
                        <a href="#" className={`text-[10px] font-mono uppercase tracking-widest transition-all duration-300 ${isDarkMode ? "text-muted-foreground hover:text-white" : "text-black/60 hover:text-black"} hover:translate-x-1`}>For Schools</a>
                        <a href="#" className={`text-[10px] font-mono uppercase tracking-widest transition-all duration-300 ${isDarkMode ? "text-muted-foreground hover:text-white" : "text-black/60 hover:text-black"} hover:translate-x-1`}>For B2B</a>
                        <Link to="/pricing" className={`text-[10px] font-mono uppercase tracking-widest transition-all duration-300 ${isDarkMode ? "text-muted-foreground hover:text-white" : "text-black/60 hover:text-black"} hover:translate-x-1`}>Pricing</Link>
                    </div>

                    <div className="flex flex-col gap-3">
                        <span className={`text-[9px] font-mono uppercase tracking-[0.3em] ${isDarkMode ? "text-white/30" : "text-black/30"}`}>Social</span>
                        <a href="#" className={`text-[10px] font-mono uppercase tracking-widest transition-all duration-300 ${isDarkMode ? "text-muted-foreground hover:text-white" : "text-black/60 hover:text-black"} hover:translate-x-1`}>X / Twitter</a>
                        <a href="#" className={`text-[10px] font-mono uppercase tracking-widest transition-all duration-300 ${isDarkMode ? "text-muted-foreground hover:text-white" : "text-black/60 hover:text-black"} hover:translate-x-1`}>LinkedIn</a>
                        <a href="#" className={`text-[10px] font-mono uppercase tracking-widest transition-all duration-300 ${isDarkMode ? "text-muted-foreground hover:text-white" : "text-black/60 hover:text-black"} hover:translate-x-1`}>GitHub</a>
                    </div>
                </div>

                <div className={`border-t pt-6 text-center ${isDarkMode ? "border-white/5" : "border-black/10"}`}>
                    <p className={`text-[10px] font-mono uppercase tracking-widest ${isDarkMode ? "text-muted-foreground/40" : "text-black/30"}`}>
                        © 2026 Rudranex AI Systems. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
}
