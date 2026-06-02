"use client"

import { useTheme } from "@/lib/theme-context";
import { useState, useEffect } from "react";
import { getPublicSiteSettings } from "@/lib/chat-api";
import { Mail, MapPin, Phone, ArrowRight } from "lucide-react";

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
        <footer className={`py-20 border-t transition-colors duration-300 ${isDarkMode ? "bg-[#0a0a0a] border-white/5 text-white" : "bg-[#fdfdfd] border-black/5 text-black"}`}>
            <div className="container mx-auto px-6 md:px-12 max-w-7xl">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 mb-20">
                    {/* Left Section - occupies 7 columns on desktop */}
                    <div className="lg:col-span-7 flex flex-col gap-12">
                        {/* Brand & Logo */}
                        <div className="flex flex-col gap-5">
                            <div className="flex items-center gap-3">
                                <div className="h-9 w-9 flex items-center justify-center shrink-0 overflow-hidden">
                                    <img 
                                        src={isDarkMode ? "/dark.png" : "/light.png"} 
                                        alt="Logo" 
                                        className="h-full w-full object-contain"
                                        style={{ transform: isDarkMode ? "scale(1.5)" : "none" }}
                                    />
                                </div>
                                <span className={`font-display font-extrabold tracking-tight text-2xl ${isDarkMode ? "text-white" : "text-black"}`}>
                                    RUDRANEX
                                </span>
                            </div>
                            
                            <p className={`font-sans font-bold uppercase tracking-widest text-[11px] ${isDarkMode ? "text-white/40" : "text-black/50"}`}>
                                AI CO-PILOT FOR THE CLINICAL MIND.
                            </p>
                            
                            <p className={`max-w-xl text-[13px] leading-relaxed ${isDarkMode ? "text-white/50" : "text-black/60"}`}>
                                Rudranex is an advanced AI co-pilot designed for clinical practitioners and medical scholars. Experience high-precision diagnostic support, interactive clinical battle arenas, and state-of-the-art medical resources.
                            </p>
                        </div>

                        {/* Link Grid - 3 columns */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">
                            {[
                                { 
                                    heading: "Company", 
                                    links: [
                                        { label: "About Us", href: "/about" }, 
                                        { label: "FAQ", href: "/faq" }, 
                                        { label: "Support", href: "/support" }, 
                                        { label: "Contact Us", href: "/contact" }
                                    ] 
                                },
                                { 
                                    heading: "Policy", 
                                    links: [
                                        { label: "Privacy Policy", href: "/privacy" }, 
                                        { label: "Terms of Service", href: "/terms" }, 
                                        { label: "Refund Policy", href: "/refund-policy" }
                                    ] 
                                },
                                { 
                                    heading: "Platforms", 
                                    links: [
                                        { label: "For Schools", href: "/schools" }, 
                                        { label: "For B2B", href: "/b2b" }, 
                                        { label: "Pricing", href: "/pricing" }
                                    ] 
                                },
                            ].map((col) => (
                                <div key={col.heading} className="flex flex-col gap-4">
                                    {/* Capsule Column Header */}
                                    <div>
                                        <span
                                            className={`inline-block font-sans font-bold uppercase text-[11px] tracking-widest px-4 py-1.5 rounded-full ${
                                                isDarkMode 
                                                    ? "bg-white/10 text-white border border-white/5" 
                                                    : "bg-black text-white"
                                            }`}
                                        >
                                            {col.heading}
                                        </span>
                                    </div>
                                    
                                    {/* Column Links */}
                                    <div className="flex flex-col gap-3 mt-2">
                                        {col.links.map((l) => (
                                            <a
                                                key={l.label}
                                                href={l.href}
                                                className={`text-[13px] font-medium transition-colors duration-200 ${
                                                    isDarkMode 
                                                        ? "text-white/50 hover:text-white" 
                                                        : "text-black/60 hover:text-black"
                                                }`}
                                            >
                                                {l.label}
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Bottom of Left Section: Feedback + Social Links */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8 pt-8 border-t border-dashed border-current/10">
                            <div className="flex flex-col gap-2 max-w-sm">
                                <h4 className={`text-sm font-bold uppercase tracking-wider ${isDarkMode ? "text-white" : "text-black"}`}>
                                    We Value Your Feedback
                                </h4>
                                <p className={`text-xs ${isDarkMode ? "text-white/40" : "text-black/50"}`}>
                                    Share your thoughts with us to help improve your experience!
                                </p>
                            </div>

                            <div className="flex items-center gap-6 shrink-0">
                                {/* Feedback Button */}
                                <a
                                    href="/support"
                                    className={`flex items-center gap-2 px-5 py-2.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all duration-300 ${
                                        isDarkMode 
                                            ? "bg-white text-black hover:bg-white/95" 
                                            : "bg-black text-white hover:bg-black/95"
                                    }`}
                                >
                                    Feedback <ArrowRight className="w-3.5 h-3.5" />
                                </a>

                                {/* Social Links */}
                                <div className="flex items-center gap-3.5">
                                    {[
                                        { 
                                            label: "Twitter", 
                                            href: socialLinks.twitter, 
                                            svg: <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg> 
                                        },
                                        { 
                                            label: "LinkedIn", 
                                            href: socialLinks.linkedin, 
                                            svg: <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                                        },
                                        { 
                                            label: "GitHub", 
                                            href: socialLinks.github, 
                                            svg: <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>
                                        }
                                    ].map((social) => (
                                        <a
                                            key={social.label}
                                            href={social.href}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={`p-2 rounded-lg border transition-colors duration-200 ${
                                                isDarkMode 
                                                    ? "border-white/5 bg-white/5 text-white/60 hover:text-white hover:border-white/20" 
                                                    : "border-black/5 bg-black/5 text-black/60 hover:text-black hover:border-black/20"
                                            }`}
                                        >
                                            {social.svg}
                                        </a>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Section - occupies 5 columns on desktop, with left border */}
                    <div className={`lg:col-span-5 flex flex-col gap-8 lg:pl-12 lg:border-l ${isDarkMode ? "border-white/5" : "border-black/10"}`}>
                        
                        {/* Connect with Us */}
                        <div className="flex flex-col gap-5">
                            <h3 className={`text-sm font-bold uppercase tracking-wider ${isDarkMode ? "text-white" : "text-black"}`}>
                                Connect with Us
                            </h3>

                            <div className="flex flex-col gap-4">
                                {/* Mail Card */}
                                <a
                                    href="mailto:hello@rudranex.ai"
                                    className={`flex items-start gap-4 p-4 rounded-xl border transition-all duration-300 hover:scale-[1.01] ${
                                        isDarkMode 
                                            ? "bg-white/[0.03] border-white/5 hover:bg-white/[0.05]" 
                                            : "bg-black/[0.03] border-black/5 hover:bg-black/[0.05]"
                                    }`}
                                >
                                    <div className={`p-2.5 rounded-lg flex items-center justify-center shrink-0 ${
                                        isDarkMode ? "bg-white/10 text-[#00DDDD]" : "bg-black text-[#00DDDD]"
                                    }`}>
                                        <Mail className="w-5 h-5" />
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <span className={`text-[10px] font-bold uppercase tracking-widest ${isDarkMode ? "text-white/30" : "text-black/40"}`}>
                                            Mail Us
                                        </span>
                                        <span className={`text-[14px] font-semibold break-all ${isDarkMode ? "text-white" : "text-black"}`}>
                                            hello@rudranex.ai
                                        </span>
                                    </div>
                                </a>

                                {/* Location Card */}
                                <div
                                    className={`flex items-start gap-4 p-4 rounded-xl border ${
                                        isDarkMode 
                                            ? "bg-white/[0.03] border-white/5" 
                                            : "bg-black/[0.03] border-black/5"
                                    }`}
                                >
                                    <div className={`p-2.5 rounded-lg flex items-center justify-center shrink-0 ${
                                        isDarkMode ? "bg-white/10 text-[#00DDDD]" : "bg-black text-[#00DDDD]"
                                    }`}>
                                        <MapPin className="w-5 h-5" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className={`text-[10px] font-bold uppercase tracking-widest ${isDarkMode ? "text-white/30" : "text-black/40"}`}>
                                            Find Us Here
                                        </span>
                                        <span className={`text-[13px] font-medium leading-relaxed ${isDarkMode ? "text-white/80" : "text-black/80"}`}>
                                            Rudra Labs, AI Innovation Center, Hyderabad, India.
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className={`h-px w-full ${isDarkMode ? "bg-white/5" : "bg-black/10"}`} />

                        {/* Customer Support */}
                        <div className="flex flex-col gap-5">
                            <h3 className={`text-sm font-bold uppercase tracking-wider ${isDarkMode ? "text-white" : "text-black"}`}>
                                Customer Support
                            </h3>

                            <div className="flex flex-col gap-3">
                                {[
                                    { name: "Technical Support", phone: "+91 97124 45459" },
                                    { name: "Enterprise Queries", phone: "+91 63593 02924" }
                                ].map((support) => (
                                    <a
                                        key={support.name}
                                        href={`tel:${support.phone.replace(/\s+/g, '')}`}
                                        className={`flex items-center gap-4 p-3.5 rounded-xl border transition-all duration-300 hover:scale-[1.01] ${
                                            isDarkMode 
                                                ? "bg-white/[0.03] border-white/5 hover:bg-white/[0.05]" 
                                                : "bg-black/[0.03] border-black/5 hover:bg-black/[0.05]"
                                        }`}
                                    >
                                        <div className={`p-2 rounded-lg flex items-center justify-center shrink-0 ${
                                            isDarkMode ? "bg-white/10 text-[#00DDDD]" : "bg-black text-[#00DDDD]"
                                        }`}>
                                            <Phone className="w-4 h-4" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className={`text-[12px] font-bold ${isDarkMode ? "text-white" : "text-black"}`}>
                                                {support.name}
                                            </span>
                                            <span className={`text-[13px] font-medium tracking-wide ${isDarkMode ? "text-white/50" : "text-black/60"}`}>
                                                {support.phone}
                                            </span>
                                        </div>
                                    </a>
                                ))}
                            </div>
                        </div>

                    </div>
                </div>

                {/* Footer Bottom Bar */}
                <div className={`flex flex-col md:flex-row items-center justify-between border-t ${isDarkMode ? "border-white/5" : "border-black/10"} pt-6 pb-2 gap-4`}>
                    <p className={`font-sans font-bold uppercase text-center md:text-left ${isDarkMode ? "text-white/20" : "text-black/30"}`} style={{ fontSize: "11px", letterSpacing: "0.1em" }}>
                        © 2026 Rudranex AI Systems. All rights reserved.
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
                        {[
                            { label: "Terms of use", href: "/terms" },
                            { label: "Privacy Policies", href: "/privacy" },
                            { label: "Copyright & Disclaimer", href: "/terms" },
                            { label: "Refund Policy", href: "/refund-policy" },
                            { label: "Cookie Policy", href: "/privacy" }
                        ].map((item, idx, arr) => (
                            <div key={item.label} className="flex items-center">
                                <a
                                    href={item.href}
                                    className={`font-sans font-bold uppercase transition-colors duration-200 hover:underline ${
                                        isDarkMode ? "text-white/20 hover:text-white" : "text-black/30 hover:text-black"
                                    }`}
                                    style={{ fontSize: "11px", letterSpacing: "0.1em" }}
                                >
                                    {item.label}
                                </a>
                                {idx < arr.length - 1 && (
                                    <span className={`mx-3 select-none ${isDarkMode ? "text-white/10" : "text-black/10"}`}>|</span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </footer>
    );
}
