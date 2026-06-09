"use client"

interface ShinyTextProps {
    text: string;
    disabled?: boolean;
    speed?: number; // duration in seconds
    className?: string;
}

export default function ShinyText({
    text,
    disabled = false,
    speed = 5,
    className = ""
}: ShinyTextProps) {
    const animationStyle = disabled 
        ? {} 
        : {
            backgroundImage: "linear-gradient(120deg, rgba(255, 255, 255, 0) 30%, rgba(255, 255, 255, 0.8) 50%, rgba(255, 255, 255, 0) 70%)",
            backgroundSize: "200% 100%",
            backgroundPositionX: "150%",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            animation: `shiny-text-slide ${speed}s linear infinite`,
        };

    return (
        <span 
            className={`inline-block select-none ${className}`}
            style={animationStyle}
        >
            {text}
        </span>
    );
}
