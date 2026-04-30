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
            points: '64 68.64 8.574 100 63.446 67.68 64 4 64.554 67.68 119.426 100',
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
                    points="64 128 8.574 96 8.574 32 64 0 119.426 32 119.426 96"
                    fill="currentColor"
                    filter={`url(#${filterId})`}
                />
            </svg>
        </div>
    );
}
