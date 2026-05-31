"use client"

import { useTheme } from "@/lib/theme-context";
import { useState, useEffect } from "react";
import { getPublicSiteSettings } from "@/lib/chat-api";

export default function Footer() {
    const { isDarkMode } = useTheme();
    const [socialLinks, setSocialLinks] = useState({
        twitter: "#",
        linkedin: "#",
        github: "#"
    });

    useEffect(() => {
        try {
            const local = localStorage.getItem("rudranex_social_media_links");
            if (local) {
                const parsed = JSON.parse(local);
                setSocialLinks({
                    twitter: parsed.twitter || "#",
                    linkedin: parsed.linkedin || "#",
                    github: parsed.github || "#"
                });
                return;
            }
        } catch (e) {
            console.error("Local storage footer fetch error:", e);
        }

        getPublicSiteSettings().then(res => {
            const setting = res.settings?.find(s => s.key === "social_media_links");
            if (setting?.value) {
                try {
                    const parsed = JSON.parse(setting.value);
                    setSocialLinks({
                        twitter: parsed.twitter || "#",
                        linkedin: parsed.linkedin || "#",
                        github: parsed.github || "#"
                    });
                } catch (e) {
                    console.error("Error parsing social links", e);
                }
            }
        }).catch(() => {});
    }, []);

    return (
        <footer className={`py-24 border-t ${isDarkMode ? "bg-[#0a0a0a] border-white/5" : "bg-white border-black/5"}`}>
            <div className="container mx-auto px-6 md:px-12">
                <div className="flex flex-col lg:flex-row justify-between gap-20 mb-32">
                    <div className="flex flex-col gap-6">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 flex items-center justify-center shrink-0 overflow-hidden">
                                <img 
                                    src={isDarkMode ? "/dark.png" : "/light.png"} 
                                    alt="Logo" 
                                    className="h-full w-full object-contain transition-transform duration-300"
                                    style={{ transform: isDarkMode ? "scale(1.5)" : "none" }}
                                />
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
                            { heading: "Platforms", links: [{ label: "For Schools", href: "/schools" }, { label: "For B2B", href: "/b2b" }, { label: "Pricing", href: "/pricing" }] },
                            { heading: "Social", links: [{ label: "X / Twitter", href: socialLinks.twitter }, { label: "LinkedIn", href: socialLinks.linkedin }, { label: "GitHub", href: socialLinks.github }] },
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
