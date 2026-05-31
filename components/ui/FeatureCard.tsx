"use client"

import { motion } from "framer-motion";
import { useTheme } from "@/lib/theme-context";

interface FeatureCardProps {
    title: string;
    description: string;
    index: number;
    tag: string;
}

const FeatureCard = ({ title, description, index, tag }: FeatureCardProps) => {
    const { isDarkMode } = useTheme();

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: index * 0.08 }}
            className={`group relative flex flex-col p-8 md:p-9 h-full transition-all duration-500 ${isDarkMode ? "bg-[#0d0d0d] hover:bg-[#111]" : "bg-white hover:bg-gray-50"}`}
        >
            {/* Top Bar — Technical Labels (11px Bold, 0.1em) */}
            <div className="flex items-center justify-end mb-14">
                <span
                    className={`font-sans font-bold uppercase border px-3 py-1 ${isDarkMode ? "text-white/25 border-white/10" : "text-black/25 border-black/10"}`}
                    style={{ fontSize: "11px", letterSpacing: "0.1em" }}
                >
                    {tag}
                </span>
            </div>

            {/* Card Title — 20px Semi-Bold, normal tracking */}
            <div className="flex-1">
                <h3
                    className={`font-display font-semibold mb-5 uppercase leading-snug group-hover:text-[var(--color-cyan)] transition-colors duration-500 ${isDarkMode ? "text-white" : "text-black"}`}
                    style={{ fontSize: "20px", letterSpacing: "normal" }}
                >
                    {title}
                </h3>

                {/* Body Copy — 16px Regular */}
                <p
                    className={`font-sans font-normal leading-relaxed mb-10 group-hover:transition-colors duration-500 ${isDarkMode ? "text-white/35 group-hover:text-white/55" : "text-black/45 group-hover:text-black/65"}`}
                    style={{ fontSize: "16px", letterSpacing: "normal" }}
                >
                    {description}
                </p>
            </div>

            {/* Hover Glow */}
            <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
                style={{ background: isDarkMode ? "radial-gradient(circle at top right, rgba(0, 221, 221, 0.04), transparent 60%)" : "radial-gradient(circle at top right, rgba(0, 221, 221, 0.08), transparent 60%)" }}
            />
        </motion.div>
    );
};

export default FeatureCard;
