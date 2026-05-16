"use client"

import { useTheme } from "@/lib/theme-context";

export default function Footer() {
    const { isDarkMode } = useTheme();

    return (
        <footer className={`py-24 border-t ${isDarkMode ? "bg-[#0a0a0a] border-white/5" : "bg-white border-black/5"}`}>
            <div className="container mx-auto px-6 md:px-12">
                <div className="flex flex-col lg:flex-row justify-between gap-20 mb-32">
                    <div className="flex flex-col gap-6">
                        <div className="flex items-center gap-3">
                            <div className={`h-8 w-8 border ${isDarkMode ? "border-white" : "border-black"} flex items-center justify-center shrink-0`}>
                                <svg width="24" height="24" viewBox="0 0 128 128" className={isDarkMode ? "text-white" : "text-black"}>
                                    <polygon points="20,20 86,20 86,55 58,55 58,40 42,40 42,55 42,68 104,108 78,108 50,72 42,72 42,108 20,108" fill="currentColor" />
                                </svg>
                            </div>
                            <div className="flex items-baseline gap-1">
                                <span
                                    className={`font-display font-bold ${isDarkMode ? "text-white" : "text-black"}`}
                                    style={{ fontSize: "24px", letterSpacing: "-0.02em" }}
                                >
                                    RUDRANEX
                                </span>
                                <span className={`font-serif italic text-2xl ${isDarkMode ? "text-white/20" : "text-black/20"}`}> ai</span>
                            </div>
                        </div>
                        {/* Technical Label — 11px Bold, 0.1em */}
                        <p
                            className={`font-sans font-bold uppercase ${isDarkMode ? "text-white/30" : "text-black/40"}`}
                            style={{ fontSize: "11px", letterSpacing: "0.1em" }}
                        >
                            AI CO-PILOT FOR THE CLINICAL MIND.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-16 md:gap-24">
                        {[
                            { heading: "Company", links: [{ label: "About Us", href: "/about" }, { label: "Privacy Policy", href: "/privacy" }, { label: "Terms of Service", href: "/terms" }, { label: "Contact Us", href: "/contact" }] },
                            { heading: "Platforms", links: [{ label: "For Schools", href: "/schools" }, { label: "For B2B", href: "/pricing" }, { label: "Pricing", href: "/pricing" }] },
                            { heading: "Social", links: [{ label: "X / Twitter", href: "#" }, { label: "LinkedIn", href: "#" }, { label: "GitHub", href: "#" }] },
                        ].map((col) => (
                            <div key={col.heading} className="flex flex-col gap-5">
                                {/* Technical Label for column headers */}
                                <span
                                    className={`font-sans font-bold uppercase ${isDarkMode ? "text-white/20" : "text-black/20"} mb-2`}
                                    style={{ fontSize: "11px", letterSpacing: "0.1em" }}
                                >
                                    {col.heading}
                                </span>
                                {col.links.map((l) => (
                                    <a
                                        key={l.label}
                                        href={l.href}
                                        className={`font-sans font-medium uppercase transition-colors ${isDarkMode ? "text-white/50 hover:text-white" : "text-black/50 hover:text-black"}`}
                                        style={{ fontSize: "12px", letterSpacing: "0.05em" }}
                                    >
                                        {l.label}
                                    </a>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>

                <div className={`flex flex-col md:flex-row justify-between items-center gap-6 border-t ${isDarkMode ? "border-white/5" : "border-black/5"} pt-10`}>
                    <p
                        className={`font-sans font-bold uppercase ${isDarkMode ? "text-white/20" : "text-black/20"}`}
                        style={{ fontSize: "11px", letterSpacing: "0.1em" }}
                    >
                        © 2026 Rudranex AI Systems. All rights reserved.
                    </p>
                    <div className="flex items-center gap-4">
                        <span
                            className={`font-sans font-bold uppercase ${isDarkMode ? "text-white/30" : "text-black/30"}`}
                            style={{ fontSize: "11px", letterSpacing: "0.1em" }}
                        >
                            Manual Interface
                        </span>
                        <div className="h-1.5 w-1.5 rounded-full bg-[var(--color-cyan)] shadow-[0_0_8px_var(--color-cyan)]" />
                        <span
                            className="font-sans font-bold uppercase text-[var(--color-cyan)]"
                            style={{ fontSize: "11px", letterSpacing: "0.1em" }}
                        >
                            System Online
                        </span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
