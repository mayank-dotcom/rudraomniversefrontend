"use client";

import { useEffect, useId, useRef } from "react";
import { animate } from "animejs";

interface ChatLoaderProps {
    isDarkMode?: boolean;
}

export default function ChatLoader({ isDarkMode = true }: ChatLoaderProps) {
    const svgRef = useRef<SVGSVGElement>(null);
    const filterId = `displacementFilter-${useId().replace(/:/g, "")}`;

    useEffect(() => {
        if (!svgRef.current) return;

        const feTurbulence = svgRef.current.querySelector('feTurbulence');
        const feDisplacementMap = svgRef.current.querySelector('feDisplacementMap');
        const polygon = svgRef.current.querySelector('polygon');

        if (!feTurbulence || !feDisplacementMap || !polygon) return;

        const anim1 = animate([feTurbulence, feDisplacementMap], {
            baseFrequency: 0.05,
            scale: 15,
            alternate: true,
            loop: true,
        });

        const anim2 = animate(polygon, {
            points: '18,22 90,18 82,58 60,52 54,38 38,44 44,58 38,72 108,104 76,112 48,70 44,76 38,104 18,112',
            alternate: true,
            loop: true,
        });

        return () => {
            anim1.pause();
            anim2.pause();
        };
    }, []);

    return (
        <div className="flex items-center justify-center py-4">
            <svg
                ref={svgRef}
                width="64"
                height="64"
                viewBox="0 0 128 128"
                className={isDarkMode ? "text-white/80" : "text-black/80"}
            >
                <filter id={filterId}>
                    <feTurbulence
                        type="turbulence"
                        numOctaves={2}
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
                <polygon
                    points="20,20 86,20 86,55 58,55 58,40 42,40 42,55 42,68 104,108 78,108 50,72 42,72 42,108 20,108"
                    fill="currentColor"
                    filter={`url(#${filterId})`}
                />
            </svg>
        </div>
    );
}
