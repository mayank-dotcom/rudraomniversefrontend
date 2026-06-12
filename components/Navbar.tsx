"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AuthModal from "@/components/ui/AuthModal";
import { isAuthenticated } from "@/lib/auth";

const navLinks = [
  { label: "Features", href: "/#features" },
  { label: "Pricing", href: "/pricing" },
  { label: "FAQ", href: "/faq" },
  { label: "Support", href: "/support" },
  { label: "Schools", href: "/schools" },
  { label: "Enterprise", href: "/b2b" },
];

export default function Navbar({ visible }: { visible: boolean }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setIsLoggedIn(isAuthenticated());
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSignInClick = () => {
    if (isLoggedIn) {
      window.location.href = "/chat";
    } else {
      setAuthOpen(true);
    }
  };

  const handleGetStartedClick = () => {
    if (isLoggedIn) {
      window.location.href = "/chat";
    } else {
      setAuthOpen(true);
    }
  };

  return (
    <>
      <nav
      className={`fixed left-1/2 -translate-x-1/2 z-50 transition-all duration-500 w-[92%] md:w-[85%] max-w-5xl ${
        visible
          ? scrolled
            ? "top-4 opacity-100"
            : "top-6 opacity-100"
          : "-top-24 opacity-0 pointer-events-none"
      } bg-[#050308]/60 backdrop-blur-xl border border-white/[0.08] shadow-[0_12px_40px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.1)] ${
        mobileOpen ? "rounded-3xl" : "rounded-full"
      }`}
    >
      <div className="px-6 h-14 md:h-16 flex items-center justify-between">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-transform duration-200">
          <img src="/dark.png" alt="Rudranex Logo" className="h-7 w-auto object-contain" />
          <img src="/dark_text.png" alt="Rudranex" className="h-4.5 w-auto object-contain" />
        </a>

        {/* Desktop Navigation Links */}
        <div className="hidden md:flex items-center gap-1 bg-white/[0.02] border border-white/[0.05] rounded-full p-1">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="font-serif italic text-[13px] lg:text-[14px] font-normal text-white/60 hover:text-white px-4 py-2 rounded-full transition-all duration-300 hover:bg-white/[0.05]"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Buttons */}
        <div className="hidden md:flex items-center gap-2">
          <button onClick={handleSignInClick} className="font-serif italic text-[13px] lg:text-[14px] font-normal text-white/70 hover:text-white hover:bg-white/[0.05] px-4 py-2 rounded-full transition-all duration-300">
            {isLoggedIn ? "Back to Chat" : "Sign In"}
          </button>
          <button onClick={handleGetStartedClick} className="font-serif italic text-[13px] lg:text-[14px] bg-white hover:bg-neutral-100 text-black px-5 py-2 rounded-full font-bold transition-all duration-300 hover:shadow-[0_0_20px_rgba(255,255,255,0.25)] active:scale-95">
            Get Started
          </button>
        </div>

        {/* Mobile Toggle Button */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden text-white/70 hover:text-white p-2 rounded-full hover:bg-white/5 active:scale-95 transition-all"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {mobileOpen ? (
              <path d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Drawer Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden md:hidden"
          >
            <div className="px-6 pb-6 pt-2 flex flex-col gap-3.5 border-t border-white/[0.05]">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="font-serif italic text-sm font-normal text-white/50 hover:text-white py-1.5 transition-colors"
                >
                  {link.label}
                </a>
              ))}
              <div className="flex gap-3 pt-4 border-t border-white/[0.05]">
                <button onClick={() => { handleSignInClick(); setMobileOpen(false); }} className="font-serif italic text-sm font-normal flex-1 text-white/70 hover:text-white hover:bg-white/[0.05] py-2 rounded-full transition-all duration-300">
                  {isLoggedIn ? "Back to Chat" : "Sign In"}
                </button>
                <button onClick={() => { handleGetStartedClick(); setMobileOpen(false); }} className="font-serif italic text-sm font-bold flex-1 bg-white text-black py-2 rounded-full hover:bg-white/90 transition-all shadow-[0_0_15px_rgba(255,255,255,0.15)]">
                  Get Started
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
}
