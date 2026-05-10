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
    const [typedChars, setTypedChars] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setTextIndex(prev => (prev + 1) % STATUS_TEXTS.length);
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        setTypedChars(0);
    }, [textIndex]);

    useEffect(() => {
        const text = STATUS_TEXTS[textIndex];
        if (typedChars < text.length) {
            const timeout = setTimeout(() => {
                setTypedChars(prev => Math.min(prev + 1, text.length));
            }, 35);
            return () => clearTimeout(timeout);
        }
    }, [typedChars, textIndex]);

    return (
        <div className="flex items-center justify-start gap-4 py-6">
            <span className={`text-[10px] font-mono uppercase tracking-[0.3em] min-w-[120px] ${isDarkMode ? "text-white/50" : "text-black/50"}`}>
                {STATUS_TEXTS[textIndex].slice(0, typedChars)}
                {typedChars < STATUS_TEXTS[textIndex].length && (
                    <span className="animate-pulse">|</span>
                )}
            </span>
            <div className="flex items-center gap-1.5">
                {[0, 1, 2].map((i) => (
                    <motion.span
                        key={i}
                        className={`h-2 w-2 rounded-full ${isDarkMode ? "bg-white" : "bg-black"}`}
                        animate={{
                            y: [0, -8, 0],
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
        </div>
    );
}
