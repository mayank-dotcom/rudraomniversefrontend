"use client"

import { useState, useEffect } from "react";
import { getPublicSiteSettings } from "@/lib/chat-api";
import { Mail, MapPin, Phone, ArrowRight } from "lucide-react";

export default function Footer() {
    const isDarkMode = false;
    const [socialLinks, setSocialLinks] = useState({
        twitter: "#",
        linkedin: "#",
        github: "#"
    });

    const [footerData, setFooterData] = useState({
        description: "Rudranex is an advanced AI co-pilot designed for clinical practitioners and medical scholars. Experience high-precision diagnostic support, interactive clinical battle arenas, and state-of-the-art medical resources.",
        email: "hello@rudranex.ai",
        location: "Rudra Labs, AI Innovation Center, Hyderabad, India.",
        techSupportPhone: "+91 97124 45459",
        enterprisePhone: "+91 63593 02924"
    });

    useEffect(() => {
        getPublicSiteSettings().then(res => {
            const socialSetting = res.settings?.find(s => s.key === "social_media_links");
            if (socialSetting?.value) {
                try {
                    const parsed = JSON.parse(socialSetting.value);
                    setSocialLinks({
                        twitter: parsed.twitter || "#",
                        linkedin: parsed.linkedin || "#",
                        github: parsed.github || "#"
                    });
                } catch (e) {
                    console.error("Error parsing social links", e);
                }
            }

            const footerSetting = res.settings?.find(s => s.key === "footer_settings");
            if (footerSetting?.value) {
                try {
                    const parsed = JSON.parse(footerSetting.value);
                    setFooterData({
                        description: parsed.description || "Rudranex is an advanced AI co-pilot designed for clinical practitioners and medical scholars. Experience high-precision diagnostic support, interactive clinical battle arenas, and state-of-the-art medical resources.",
                        email: parsed.email || "hello@rudranex.ai",
                        location: parsed.location || "Rudra Labs, AI Innovation Center, Hyderabad, India.",
                        techSupportPhone: parsed.techSupportPhone || "+91 97124 45459",
                        enterprisePhone: parsed.enterprisePhone || "+91 63593 02924"
                    });
                } catch (e) {
                    console.error("Error parsing footer settings", e);
                }
            }
        }).catch(() => {});
    }, []);

    return (
        <footer className={`border-t transition-colors duration-300 ${isDarkMode ? "bg-[#050308] border-white/5 text-white" : "bg-white border-black/5 text-black"} rounded-b-[40px]`}>
          <div className="max-w-7xl mx-auto px-6 py-10 md:py-12">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10 mb-10">
              {/* Brand - 4 cols */}
              <div className="lg:col-span-4 flex flex-col gap-5 text-left">
                  <div className="flex items-center gap-2">
                    <img src={isDarkMode ? "/dark.png" : "/light.png"} alt="Rudranex" className="h-9 w-9 object-contain" />
                    <img src={isDarkMode ? "/dark_text.png" : "/light_text.png"} alt="Rudranex" className="h-7 md:h-8 w-auto object-contain" />
                  </div>
                <p className={`font-sans font-bold uppercase tracking-widest text-[11px] ${isDarkMode ? "text-white/40" : "text-black/40"}`}>AI Co-Pilot for the Clinical Mind</p>
                <p className={`text-sm leading-relaxed max-w-xs ${isDarkMode ? "text-white/50" : "text-black/50"}`}>
                  {footerData.description}
                </p>
              </div>

              {/* Quick Links - 2 cols */}
              <div className="lg:col-span-2 text-left">
                <h4 className={`text-xs font-semibold uppercase tracking-[0.2em] mb-5 ${isDarkMode ? "text-white/60" : "text-black/60"}`}>Company</h4>
                <ul className="flex flex-col gap-3">
                  {[
                    { label: "About Us", href: "/about" },
                    { label: "FAQ", href: "/faq" },
                    { label: "Support", href: "/support" },
                    { label: "Contact Us", href: "/contact" }
                  ].map((link) => (
                    <li key={link.label}>
                      <a href={link.href} className={`text-sm transition-colors ${isDarkMode ? "text-white/40 hover:text-white/80" : "text-black/40 hover:text-black/80"}`}>
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Policy Links - 2 cols */}
              <div className="lg:col-span-2 text-left">
                <h4 className={`text-xs font-semibold uppercase tracking-[0.2em] mb-5 ${isDarkMode ? "text-white/60" : "text-black/60"}`}>Policy</h4>
                <ul className="flex flex-col gap-3">
                  {[
                    { label: "Privacy Policy", href: "/privacy" },
                    { label: "Terms of Service", href: "/terms" },
                    { label: "Refund Policy", href: "/refund-policy" },
                    { label: "Cookie Policy", href: "/privacy" }
                  ].map((link) => (
                    <li key={link.label}>
                      <a href={link.href} className={`text-sm transition-colors ${isDarkMode ? "text-white/40 hover:text-white/80" : "text-black/40 hover:text-black/80"}`}>
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Connect - 2 cols */}
              <div className="lg:col-span-2 flex flex-col gap-6 text-left">
                <h4 className={`text-xs font-semibold uppercase tracking-[0.2em] ${isDarkMode ? "text-white/60" : "text-black/60"}`}>Connect</h4>
                <div className="flex flex-col gap-4">
                  <a href={`mailto:${footerData.email}`} className={`flex items-center gap-3 text-sm transition-colors group ${isDarkMode ? "text-white hover:text-white/80" : "text-black hover:text-black/80"}`}>
                    <div className={`w-9 h-9 rounded-lg border flex items-center justify-center transition-all duration-300 ${
                      isDarkMode 
                        ? "border-white/10 group-hover:border-white group-hover:scale-110 group-hover:bg-white group-hover:text-black" 
                        : "border-black group-hover:border-black group-hover:scale-110 group-hover:bg-black group-hover:text-white"
                    }`}>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                    </div>
                    <span className="text-xs truncate">{footerData.email}</span>
                  </a>
                  <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(footerData.location)}`} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-3 text-sm transition-colors group ${isDarkMode ? "text-white hover:text-white/80" : "text-black hover:text-black/80"}`}>
                    <div className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 transition-all duration-300 hover:scale-110 ${
                      isDarkMode 
                        ? "border-white/10 hover:bg-white hover:text-black" 
                        : "border-black hover:bg-black hover:text-white"
                    }`}>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    </div>
                    <span className="text-xs">{footerData.location}</span>
                  </a>
                  <div className="flex flex-col gap-2">
                    <a href={`tel:${footerData.techSupportPhone.replace(/\s+/g, '')}`} className={`flex items-center gap-3 text-sm transition-colors group ${isDarkMode ? "text-white hover:text-white/80" : "text-black hover:text-black/80"}`}>
                      <div className={`w-9 h-9 rounded-lg border flex items-center justify-center transition-all duration-300 ${
                        isDarkMode 
                          ? "border-white/10 group-hover:border-white group-hover:scale-110 group-hover:bg-white group-hover:text-black" 
                          : "border-black group-hover:border-black group-hover:scale-110 group-hover:bg-black group-hover:text-white"
                      }`}>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                      </div>
                      <span className="text-xs">{footerData.techSupportPhone}</span>
                    </a>
                    <a href={`tel:${footerData.enterprisePhone.replace(/\s+/g, '')}`} className={`flex items-center gap-3 text-sm transition-colors group ml-12 ${isDarkMode ? "text-white hover:text-white/80" : "text-black hover:text-black/80"}`}>
                      <span className="text-xs">{footerData.enterprisePhone}</span>
                    </a>
                  </div>
                </div>
              </div>

              {/* Social - 2 cols */}
              <div className="lg:col-span-2 flex flex-col gap-6 text-left">
                <h4 className={`text-xs font-semibold uppercase tracking-[0.2em] ${isDarkMode ? "text-white/60" : "text-black/60"}`}>Follow Us</h4>
                <div className="flex items-center gap-3">
                  {[
                    { href: socialLinks.twitter, label: "Twitter", path: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" },
                    { href: socialLinks.linkedin, label: "LinkedIn", path: "M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2zM4 6a2 2 0 100-4 2 2 0 000 4z" },
                    { href: socialLinks.github, label: "GitHub", path: "M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" },
                  ].map((social) => (
                    <a key={social.label} href={social.href} aria-label={social.label} className={`w-9 h-9 rounded-lg border flex items-center justify-center transition-all duration-300 ${
                      isDarkMode 
                        ? "border-white/10 text-white hover:bg-white hover:text-black hover:scale-110" 
                        : "border-black text-black hover:bg-black hover:text-white hover:scale-110"
                    }`}>
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d={social.path} />
                      </svg>
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Bar */}
            <div className={`pt-3 border-t flex items-center justify-center ${isDarkMode ? "border-white/5" : "border-black/5"}`}>
              <span className={`text-xs ${isDarkMode ? "text-white/30" : "text-black/30"}`}>
                &copy; 2026 Rudranex AI Systems. All rights reserved.
              </span>
            </div>
          </div>
        </footer>
    );
}
