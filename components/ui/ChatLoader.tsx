"use client";

import { useEffect, useId, useRef } from "react";
import { animate } from "animejs";
import { useTheme } from "@/lib/theme-context";

interface ChatLoaderProps {
    isDarkMode?: boolean;
}

export default function ChatLoader({ isDarkMode }: ChatLoaderProps) {
    const svgRef = useRef<SVGSVGElement>(null);
    const filterId = `displacementFilter-${useId().replace(/:/g, "")}`;
    const { isDarkMode: globalDarkMode } = useTheme();
    const activeDarkMode = isDarkMode ?? globalDarkMode;
    const logoSrc = activeDarkMode ? "/dark.png" : "/light.png";

    useEffect(() => {
        if (!svgRef.current) return;

        const feTurbulence = svgRef.current.querySelector('feTurbulence');
        const feDisplacementMap = svgRef.current.querySelector('feDisplacementMap');
        const image = svgRef.current.querySelector('image');

        if (!feTurbulence || !feDisplacementMap || !image) return;

        const anim1 = animate([feTurbulence, feDisplacementMap], {
            baseFrequency: 0.05,
            scale: 15,
            alternate: true,
            loop: true,
            duration: 4000,
            easing: 'easeInOutQuad'
        });

        return () => {
            anim1.pause();
        };
    }, []);

    return (
        <div className="flex items-center justify-center py-4 select-none">
            <style dangerouslySetInnerHTML={{__html: `
                @keyframes pixelGlow {
                    0%, 100% { filter: drop-shadow(0 0 2px rgba(0,221,221,0.2)) contrast(1.1); }
                    50% { filter: drop-shadow(0 0 12px rgba(0,221,221,0.7)) contrast(1.4); }
                }
                .pixelated-logo-loader {
                    animation: pixelGlow 2s infinite ease-in-out;
                    image-rendering: pixelated;
                }
            `}} />
            <svg
                ref={svgRef}
                width="64"
                height="64"
                viewBox="0 0 128 128"
                className="pixelated-logo-loader"
                style={{ overflow: 'visible' }}
            >
                <filter id={filterId}>
                    <feTurbulence
                        type="turbulence"
                        numOctaves={3}
                        baseFrequency={0}
                        result="turbulence"
                    />
                    <feDisplacementMap
                        in2="turbulence"
                        in="SourceGraphic"
                        scale={1}
                        xChannelSelector="R"
                        yChannelSelector="G"
                    />
                </filter>
                <image
                    href={logoSrc}
                    x="0"
                    y="0"
                    width="128"
                    height="128"
                    filter={`url(#${filterId})`}
                    style={{ transformOrigin: 'center', transform: activeDarkMode ? 'scale(1.485)' : 'none', transition: 'transform 0.3s ease' }}
                />
            </svg>
        </div>
    );
}
