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

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-16 md:gap-24">
                        {[
                            { heading: "Company", links: [{ label: "About Us", href: "/about" }, { label: "FAQ", href: "/faq" }, { label: "Support", href: "/support" }, { label: "Contact Us", href: "/contact" }] },
                            { heading: "Policy", links: [{ label: "Privacy Policy", href: "/privacy" }, { label: "Terms of Service", href: "/terms" }, { label: "Refund Policy", href: "/refund-policy" }] },
                            { heading: "Platforms", links: [{ label: "For Schools", href: "/schools" }, { label: "For B2B", href: "/b2b" }, { label: "Pricing", href: "/pricing" }] },
                            { heading: "Social", links: [{ label: "X / Twitter", href: socialLinks.twitter, icon: "twitter" }, { label: "LinkedIn", href: socialLinks.linkedin, icon: "linkedin" }, { label: "GitHub", href: socialLinks.github, icon: "github" }] },
                        ].map((col) => (
                            <div key={col.heading} className="flex flex-col gap-5">
                                {/* Technical Label for column headers */}
                                <span
                                    className={`font-sans font-bold uppercase ${isDarkMode ? "text-white/80" : "text-black/80"} mb-2`}
                                    style={{ fontSize: "11px", letterSpacing: "0.1em" }}
                                >
                                    {col.heading}
                                </span>
                                {col.heading === "Social" ? (
                          <div className="flex flex-row flex-wrap gap-4">
                            {col.links.map((l: any) => (
                              <a
                                key={l.label}
                                href={l.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`font-sans font-medium uppercase transition-colors text-2xl ${
                                  isDarkMode ? "text-white/50 hover:text-white" : "text-black/50 hover:text-black"
                                }`}
                              >
                                {l.icon === "twitter" ? (
                                  <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
                                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                                  </svg>
                                ) : l.icon === "linkedin" ? (
                                  <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
                                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                                  </svg>
                                ) : l.icon === "github" ? (
                                  <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
                                    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
                                  </svg>
                                ) : (
                                  l.label
                                )}
                              </a>
                            ))}
                          </div>
                        ) : (
                          col.links.map((l: any) => (
                            <a
                              key={l.label}
                              href={l.href}
                              className={`flex items-center gap-2.5 font-sans font-medium uppercase transition-colors ${
                                isDarkMode ? "text-white/50 hover:text-white" : "text-black/50 hover:text-black"
                              }`}
                              style={{ fontSize: "12px", letterSpacing: "0.05em" }}
                            >
                              {l.label}
                            </a>
                          ))
                        )}
                            </div>
                        ))}
                    </div>
                </div>

                <div className={`flex justify-center items-center border-t ${isDarkMode ? "border-white/5" : "border-black/5"} pt-4 pb-2`}>
                    <p
                        className={`font-sans font-bold uppercase text-center ${isDarkMode ? "text-white/20" : "text-black/20"}`}
                        style={{ fontSize: "11px", letterSpacing: "0.1em" }}
                    >
                        © 2026 Rudranex AI Systems. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
}
