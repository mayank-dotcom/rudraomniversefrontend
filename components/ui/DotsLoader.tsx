"use client";
import { motion } from "framer-motion";

interface DotsLoaderProps {
    isDarkMode?: boolean;
}

export default function DotsLoader({ isDarkMode = true }: DotsLoaderProps) {
    return (
        <div className="flex items-center justify-center gap-1.5 py-6">
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
    );
}
