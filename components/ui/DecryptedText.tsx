"use client"

import { useEffect, useState, useRef } from "react";

interface DecryptedTextProps {
    text: string;
    speed?: number;
    maxIterations?: number;
    revealDirection?: "start" | "end" | "center";
    animateOn?: "hover" | "mount";
    className?: string;
    enableHoverEffect?: boolean;
}

export default function DecryptedText({
    text,
    speed = 40,
    maxIterations = 8,
    revealDirection = "start",
    animateOn = "mount",
    className = "",
    enableHoverEffect = true
}: DecryptedTextProps) {
    const [displayText, setDisplayText] = useState(text);
    const [isAnimating, setIsAnimating] = useState(false);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+[]{}|;:,.<>?";

    const startAnimation = () => {
        if (isAnimating) return;
        setIsAnimating(true);
        
        let iteration = 0;
        const textLength = text.length;

        // Create an array representing the reveal order based on revealDirection
        let revealOrder: number[] = [];
        if (revealDirection === "start") {
            revealOrder = Array.from({ length: textLength }, (_, i) => i);
        } else if (revealDirection === "end") {
            revealOrder = Array.from({ length: textLength }, (_, i) => textLength - 1 - i);
        } else {
            // center reveal
            const center = Math.floor(textLength / 2);
            let left = center - 1;
            let right = center;
            while (left >= 0 || right < textLength) {
                if (right < textLength) {
                    revealOrder.push(right);
                    right++;
                }
                if (left >= 0) {
                    revealOrder.push(left);
                    left--;
                }
            }
        }

        if (intervalRef.current) clearInterval(intervalRef.current);

        intervalRef.current = setInterval(() => {
            const currentRevealedCount = Math.floor(iteration / maxIterations);
            
            const scrambled = text.split("").map((char, index) => {
                if (char === " ") return " ";
                
                // Determine if this index has been revealed yet
                const orderIndex = revealOrder.indexOf(index);
                if (orderIndex < currentRevealedCount) {
                    return text[index];
                }
                
                // Otherwise return a random character
                return CHARS[Math.floor(Math.random() * CHARS.length)];
            }).join("");

            setDisplayText(scrambled);
            iteration++;

            if (currentRevealedCount >= textLength) {
                setDisplayText(text);
                setIsAnimating(false);
                if (intervalRef.current) clearInterval(intervalRef.current);
            }
        }, speed);
    };

    useEffect(() => {
        if (animateOn === "mount") {
            startAnimation();
        }
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [text]);

    const handleMouseEnter = () => {
        if (enableHoverEffect) {
            startAnimation();
        }
    };

    return (
        <span 
            className={className}
            onMouseEnter={handleMouseEnter}
        >
            {displayText}
        </span>
    );
}
