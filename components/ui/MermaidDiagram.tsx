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

    const sanitizeCode = (raw: string): string => {
        // Replace deprecated xychart-beta with xychart (mermaid v11+)
        let clean = raw.replace(/xychart-beta/g, 'xychart');

        // Strip customCss from %%{init}%% directive — it often has escaping issues
        clean = clean.replace(/%%\{init:[\s\S]*?(?=%%\}%%)\}%%/g, (match) => {
            return match.replace(/,\s*'customCss':\s*'[^']*'/g, '')
                        .replace(/,\s*"customCss":\s*"[^"]*"/g, '')
                        .replace(/,\s*customCss:\s*[^,}]*/g, '');
        });

        return clean;
    };

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

                const cleanCode = sanitizeCode(code);
                const id = "mermaid-" + Math.random().toString(36).slice(2, 9);
                const { svg } = await mermaid.render(id, cleanCode);

                if (ref.current && mounted) {
                    ref.current.innerHTML = svg;
                    setLoading(false);
                }
            } catch (err) {
                if (mounted) {
                    setError(err instanceof Error ? err.message : "Failed to render diagram");
                    console.warn("Mermaid render error:", err, "code:", code);
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
                className="my-4 p-4 rounded-lg"
                style={{
                    border: `1px solid ${isDarkMode ? "rgba(255,100,100,0.3)" : "rgba(200,0,0,0.2)"}`,
                    background: isDarkMode ? "rgba(255,0,0,0.08)" : "rgba(255,0,0,0.04)",
                }}
            >
                <p className={`text-xs font-mono mb-2 ${isDarkMode ? "text-red-400" : "text-red-600"}`}>
                    Diagram render error
                </p>
                <p className={`text-[10px] font-mono mb-1 ${isDarkMode ? "text-red-400/60" : "text-red-600/60"}`}>
                    {error}
                </p>
                <details>
                    <summary className={`text-[10px] font-mono cursor-pointer ${isDarkMode ? "text-white/40 hover:text-white" : "text-black/40 hover:text-black"}`}>
                        Show code
                    </summary>
                    <pre className={`text-xs font-mono whitespace-pre-wrap mt-1 p-2 rounded ${isDarkMode ? "text-white/60 bg-white/5" : "text-black/60 bg-black/5"}`}>
                        {code}
                    </pre>
                </details>
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
