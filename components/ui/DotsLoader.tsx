"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";

const STATUS_TEXTS = [
    "Generating...",
    "Collecting...",
    "Processing...",
    "Analyzing...",
    "Compiling...",
    "Synthesizing..."
];

interface DotsLoaderProps {
    isDarkMode?: boolean;
}

export default function DotsLoader({ isDarkMode = true }: DotsLoaderProps) {
    const [textIndex, setTextIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setTextIndex(prev => (prev + 1) % STATUS_TEXTS.length);
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex flex-col items-center gap-3 py-6">
            <div className="flex items-center justify-center gap-1.5">
                {[0, 1, 2].map((i) => (
                    <motion.span
                        key={i}
                        className={`h-2.5 w-2.5 rounded-full ${isDarkMode ? "bg-white" : "bg-black"}`}
                        animate={{
                            y: [0, -10, 0],
                        }}
                        transition={{
                            duration: 0.6,
                            repeat: Infinity,
                            delay: i * 0.15,
                            ease: "easeInOut",
                        }}
                    />
                ))}
            </div>
            <span className={`text-[10px] font-mono uppercase tracking-[0.3em] ${isDarkMode ? "text-white/50" : "text-black/50"} animate-pulse`}>
                {STATUS_TEXTS[textIndex]}
            </span>
        </div>
    );
}
