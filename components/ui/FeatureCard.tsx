"use client"

import { useState } from "react";
import { motion } from "framer-motion";
import { useTheme } from "@/lib/theme-context";

interface FeatureCardProps {
    title: string;
    description: string;
    index: number;
    tag: string;
    mode?: "student" | "enterprise";
}

const FeatureCard = ({ title, description, index, tag, mode = "student" }: FeatureCardProps) => {
    const { isDarkMode } = useTheme();
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [isHovered, setIsHovered] = useState(false);
    
    // Choose active glow variables
    const activeColorClass = mode === "student" ? "text-[var(--color-cyan)]" : "text-indigo-400";
    
    // Proximity cursor-following spotlight gradient
    const bgGlowStyle = mode === "student"
        ? `radial-gradient(circle 220px at ${mousePos.x}px ${mousePos.y}px, rgba(0, 221, 221, 0.08), transparent 80%)`
        : `radial-gradient(circle 220px at ${mousePos.x}px ${mousePos.y}px, rgba(99, 102, 241, 0.08), transparent 80%)`;

    const hoverBorderClass = mode === "student"
        ? "hover:border-[var(--color-cyan)]/30 hover:shadow-[0_0_20px_rgba(0,221,221,0.05)]"
        : "hover:border-indigo-500/30 hover:shadow-[0_0_20px_rgba(99,102,241,0.05)]";

    const badgeStyle = mode === "student"
        ? "bg-[var(--color-cyan)]/10 text-[var(--color-cyan)] border-[var(--color-cyan)]/20 shadow-[0_0_10px_rgba(0,221,221,0.1)]"
        : "bg-indigo-500/10 text-indigo-400 border-indigo-500/20 shadow-[0_0_10px_rgba(99,102,241,0.1)]";

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setMousePos({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        });
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6, delay: index * 0.05 }}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={`group relative flex flex-col p-8 md:p-10 h-full transition-all duration-500 border ${
                isDarkMode 
                    ? `bg-[#0a0a0a]/60 border-white/5 backdrop-blur-md ${hoverBorderClass}` 
                    : "bg-white border-zinc-200 hover:border-zinc-300"
            } overflow-hidden`}
        >
            {/* Tech Scanlines overlay */}
            <div className="absolute inset-0 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity duration-500 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),_linear-gradient(90deg,rgba(0,221,221,0.03),rgba(129,140,248,0.01),rgba(0,221,221,0.03))] pointer-events-none" style={{ backgroundSize: "100% 4px, 4px 100%" }} />

            {/* Top Bar — Technical Labels & Coordinates */}
            <div className="flex items-center justify-between mb-10 text-[10px] font-mono tracking-widest text-zinc-500 uppercase">
                <span>{`[0${index + 1}.SYS]`}</span>
                <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">{`[PROXIMITY.DETECTOR]`}</span>
            </div>

            {/* Technical Category Badge */}
            <div className="flex items-center justify-start mb-8">
                <span
                    className={`font-sans font-bold uppercase border px-3.5 py-1 rounded text-[10px] tracking-[0.12em] transition-all duration-500 ${badgeStyle}`}
                >
                    {tag}
                </span>
            </div>

            {/* Card Title — 20px Semi-Bold, normal tracking */}
            <div className="flex-1 z-10">
                <h3
                    className={`font-display font-semibold mb-4 uppercase leading-snug transition-colors duration-500 ${
                        isDarkMode ? "text-white group-hover:text-white" : "text-black"
                    }`}
                    style={{ fontSize: "20px", letterSpacing: "normal" }}
                >
                    <span className="relative">
                        {title}
                        <span className={`absolute left-0 bottom-0 w-0 h-[1px] bg-current transition-all duration-500 group-hover:w-full ${activeColorClass}`} />
                    </span>
                </h3>

                {/* Body Copy — 14px/15px Regular */}
                <p
                    className={`font-sans font-normal leading-relaxed text-[14px] transition-colors duration-500 ${
                        isDarkMode ? "text-zinc-500 group-hover:text-zinc-300" : "text-zinc-600 group-hover:text-zinc-800"
                    }`}
                >
                    {description}
                </p>
            </div>

            {/* Futuristic Tech Corner Accents */}
            <div className={`absolute top-0 left-0 w-2 h-2 border-t border-l transition-colors duration-500 ${isDarkMode ? "border-white/10 group-hover:border-zinc-400" : "border-zinc-300"}`} />
            <div className={`absolute bottom-0 right-0 w-2 h-2 border-b border-r transition-colors duration-500 ${isDarkMode ? "border-white/10 group-hover:border-zinc-400" : "border-zinc-300"}`} />

            {/* Proximity Spotlight Gradient Glow */}
            <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{ background: isHovered ? bgGlowStyle : undefined }}
            />
        </motion.div>
    );
};

export default FeatureCard;
