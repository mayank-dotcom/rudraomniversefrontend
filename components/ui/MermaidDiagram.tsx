"use client";

import React, { useEffect, useRef, useState } from "react";

interface MermaidDiagramProps {
    code: string;
    isDarkMode: boolean;
}

export default function MermaidDiagram({ code, isDarkMode }: MermaidDiagramProps) {
    const ref = useRef<HTMLDivElement>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;

        async function renderDiagram() {
            try {
                const mermaid = (await import("mermaid")).default;

                mermaid.initialize({
                    startOnLoad: false,
                    theme: isDarkMode ? "dark" : "base",
                    themeVariables: isDarkMode
                        ? {
                              primaryColor: "#1a1a2e",
                              primaryTextColor: "#fff",
                              primaryBorderColor: "#0dd",
                              lineColor: "#0dd",
                              secondaryColor: "#16213e",
                              tertiaryColor: "#0f3460",
                          }
                        : {
                              primaryColor: "#f0f4ff",
                              primaryTextColor: "#000",
                              primaryBorderColor: "#333",
                              lineColor: "#333",
                              secondaryColor: "#e8f0fe",
                              tertiaryColor: "#d0e0ff",
                          },
                    securityLevel: "loose",
                });

                if (!ref.current || !mounted) return;

                const id = "mermaid-" + Math.random().toString(36).slice(2, 9);
                const { svg } = await mermaid.render(id, code);

                if (ref.current && mounted) {
                    ref.current.innerHTML = svg;
                    setLoading(false);
                }
            } catch (err) {
                if (mounted) {
                    setError(err instanceof Error ? err.message : "Failed to render diagram");
                    setLoading(false);
                }
            }
        }

        renderDiagram();

        return () => {
            mounted = false;
        };
    }, [code, isDarkMode]);

    if (error) {
        return (
            <div
                className="my-4 p-4 rounded-lg border border-red-500/30 bg-red-500/10"
                style={{
                    border: `1px solid ${isDarkMode ? "rgba(255,100,100,0.3)" : "rgba(200,0,0,0.2)"}`,
                    background: isDarkMode ? "rgba(255,0,0,0.08)" : "rgba(255,0,0,0.04)",
                }}
            >
                <p className={`text-xs font-mono mb-2 ${isDarkMode ? "text-red-400" : "text-red-600"}`}>
                    Diagram render error
                </p>
                <pre className={`text-xs font-mono whitespace-pre-wrap ${isDarkMode ? "text-white/60" : "text-black/60"}`}>
                    {code}
                </pre>
            </div>
        );
    }

    if (loading) {
        return (
            <div
                className="my-4 p-8 rounded-lg flex items-center justify-center"
                style={{
                    border: `1px solid ${isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`,
                }}
            >
                <div className={`animate-pulse text-sm font-mono ${isDarkMode ? "text-white/40" : "text-black/40"}`}>
                    Rendering diagram...
                </div>
            </div>
        );
    }

    return (
        <div
            ref={ref}
            className="my-4 p-4 rounded-lg overflow-x-auto"
            style={{
                background: isDarkMode ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
                border: `1px solid ${isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`,
            }}
        />
    );
}
