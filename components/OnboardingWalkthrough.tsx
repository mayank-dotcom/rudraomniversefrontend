"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, X, Sparkles, CheckCircle, Check, Zap } from "lucide-react";

interface WalkthroughStep {
  title: string;
  description: string;
  targetSelector?: string;
  placement: "top" | "bottom" | "left" | "right" | "center";
  offsetY?: number;
  icon?: React.ReactNode;
}

interface OnboardingWalkthroughProps {
  isOpen: boolean;
  onClose: () => void;
  isMobile: boolean;
  setIsSidebarCollapsed: (v: boolean) => void;
  setIsRightSidebarCollapsed: (v: boolean) => void;
  isDarkMode: boolean;
  accent?: string;
}

function getContrastColor(hex: string): string {
  if (!hex) return "#ffffff";
  const h = hex.replace("#", "");
  if (h.length < 6) return "#ffffff";
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? "#000000" : "#ffffff";
}

export default function OnboardingWalkthrough({
  isOpen,
  onClose,
  isMobile,
  setIsSidebarCollapsed,
  setIsRightSidebarCollapsed,
  isDarkMode,
  accent,
}: OnboardingWalkthroughProps) {
  const activeAccent = isDarkMode ? "#ffffff" : "#000000";
  const [currentStep, setCurrentStep] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [coords, setCoords] = useState<{ x: number; y: number; placement: string } | null>(null);

  const steps = useMemo<WalkthroughStep[]>(() => {
    return [
      {
        title: "Welcome to RUDRANEX AI",
        description: "Your personalized study-pilot is ready to power your learning. Let's take a quick visual tour of your workspace.",
        placement: "center",
        icon: <Sparkles className="h-4 w-4" />,
      },
      {
        title: "Session History & Settings",
        description: isMobile
          ? "Tap the message icon in the header to open the sidebar. Start a new chat, search sessions, and review your history."
          : "Collapse or expand this sidebar to view your chat sessions history, start a new chat, or search previous discussions.",
        targetSelector: isMobile ? undefined : "#walkthrough-sidebar",
        placement: isMobile ? "center" : "right",
      },
      {
        title: "Message Input & Tools",
        description: "Type your query here. Attach PDFs or images for AI analysis, use the mic for voice typing, or change models directly.",
        targetSelector: "#walkthrough-input-area",
        placement: "top",
      },
      {
        title: "AI Mode Switcher",
        description: "Quickly toggle between specialized AI modes directly from these buttons below the input area — choose Student Mode, Persona Mode, AI Image Lab, or other engines.",
        targetSelector: "#walkthrough-input-modes",
        placement: "top",
        offsetY: 10,
        icon: <Zap className="h-4 w-4" />,
      },
      {
        title: "Profile & Theme Selection",
        description: "Manage your active session, switch between dark and light themes, or log out of your account.",
        targetSelector: isMobile ? undefined : "#walkthrough-profile-area",
        placement: isMobile ? "center" : "top",
      },
      {
        title: "You're Ready to Roll!",
        description: "You're all set to experience RUDRANEX AI. Type your first prompt or attach a document to get started. Happy learning!",
        placement: "center",
        icon: <CheckCircle className="h-4 w-4" />,
      },
    ];
  }, [isMobile]);

  useEffect(() => {
    if (!isOpen) return;
    switch (currentStep) {
      case 0:
        setIsSidebarCollapsed(true);
        setIsRightSidebarCollapsed(true);
        break;
      case 1:
        if (!isMobile) {
          setIsSidebarCollapsed(false);
          setIsRightSidebarCollapsed(true);
        }
        break;
      case 2:
        setIsSidebarCollapsed(true);
        setIsRightSidebarCollapsed(true);
        break;
      case 3:
        setIsSidebarCollapsed(true);
        setIsRightSidebarCollapsed(true);
        break;
      case 4:
        if (!isMobile) {
          setIsSidebarCollapsed(false);
          setIsRightSidebarCollapsed(true);
        }
        break;
      case 5:
        setIsSidebarCollapsed(true);
        setIsRightSidebarCollapsed(true);
        break;
    }
  }, [currentStep, isOpen, isMobile, setIsSidebarCollapsed, setIsRightSidebarCollapsed]);

  useEffect(() => {
    const stepConfig = steps[currentStep];
    const selector = stepConfig?.targetSelector;
    if (!selector) { setRect(null); return; }
    let active = true;
    const update = () => {
      if (!active) return;
      const el = document.querySelector(selector);
      if (el) {
        const r = el.getBoundingClientRect();
        setRect((prev) => {
          if (prev && prev.left === r.left && prev.top === r.top && prev.width === r.width && prev.height === r.height) return prev;
          return r;
        });
      } else { setRect(null); }
      requestAnimationFrame(update);
    };
    update();
    return () => { active = false; };
  }, [currentStep, steps]);

  useEffect(() => {
    const stepConfig = steps[currentStep];
    if (!stepConfig) return;
    const cardWidth = 340;
    const cardHeight = 260;

    if (!rect || stepConfig.placement === "center") {
      setCoords({ x: window.innerWidth / 2 - cardWidth / 2, y: window.innerHeight / 2 - cardHeight / 2, placement: "center" });
      return;
    }

    const placement = stepConfig.placement;
    const offsetY = stepConfig.offsetY || 0;
    const gap = 20 + offsetY;
    let x = 0, y = 0;

    if (placement === "bottom") { x = rect.left + rect.width / 2 - cardWidth / 2; y = rect.bottom + gap; }
    else if (placement === "top") { x = rect.left + rect.width / 2 - cardWidth / 2; y = rect.top - cardHeight - gap; }
    else if (placement === "left") { x = rect.left - cardWidth - gap; y = rect.top + rect.height / 2 - cardHeight / 2; }
    else if (placement === "right") { x = rect.right + gap; y = rect.top + rect.height / 2 - cardHeight / 2; }

    const padding = 16;
    if (x < padding) x = padding;
    if (x + cardWidth > window.innerWidth - padding) x = window.innerWidth - cardWidth - padding;
    if (y < padding) y = padding;
    if (y + cardHeight > window.innerHeight - padding) y = window.innerHeight - cardHeight - padding;

    setCoords({ x, y, placement });
  }, [rect, currentStep, steps]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) setCurrentStep((prev) => prev + 1);
    else handleClose();
  };
  const handleBack = () => { if (currentStep > 0) setCurrentStep((prev) => prev - 1); };
  const handleClose = () => { setCurrentStep(0); onClose(); };

  useEffect(() => { if (isOpen) setCurrentStep(0); }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "ArrowRight") handleNext();
      else if (e.key === "ArrowLeft") handleBack();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, currentStep]);

  // Animated neon bouncing arrow
  const NeonArrow = ({ dir }: { dir: "up" | "down" | "left" | "right" }) => {
    const paths: Record<string, string> = {
      up: "M12 4l-8 8h6v8h4v-8h6z",
      down: "M12 20l-8-8h6V4h4v8h6z",
      left: "M4 12l8-8v6h8v4h-8v6z",
      right: "M20 12l-8-8v6H4v4h8v6z",
    };
    const animateProps =
      dir === "up" || dir === "down"
        ? { y: dir === "down" ? [2, -5, 2] : [-4, 2, -4] }
        : { x: dir === "right" ? [2, -4, 2] : [-4, 2, -4] };
    return (
      <motion.div
        animate={animateProps}
        transition={{ repeat: Infinity, duration: 1.1, ease: "easeInOut" }}
        style={{ 
          color: activeAccent, 
          filter: isDarkMode 
            ? `drop-shadow(0 0 10px rgba(255,255,255,0.45)) drop-shadow(0 0 4px rgba(255,255,255,0.25))` 
            : `drop-shadow(0 0 4px rgba(0,0,0,0.15))`
        }}
      >
        <svg className="w-7 h-7 fill-current" viewBox="0 0 24 24">
          <path d={paths[dir]} />
        </svg>
      </motion.div>
    );
  };

  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;
  const currentIcon = steps[currentStep]?.icon;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] overflow-hidden pointer-events-none select-none">

          {/* Backdrop with spotlight cutout */}
          <svg className="absolute inset-0 w-full h-full pointer-events-auto">
            <defs>
              <mask id="walkthrough-mask">
                <rect x="0" y="0" width="100%" height="100%" fill="white" />
                {rect && (
                  <motion.rect
                    animate={{ x: rect.left - 10, y: rect.top - 10, width: rect.width + 20, height: rect.height + 20 }}
                    transition={{ type: "spring", stiffness: 140, damping: 20 }}
                    rx="14"
                    fill="black"
                  />
                )}
              </mask>
            </defs>
            <rect x="0" y="0" width="100%" height="100%"
              fill={isDarkMode ? "rgba(5, 3, 8, 0.82)" : "rgba(0, 0, 0, 0.55)"}
              mask="url(#walkthrough-mask)"
            />
            {/* Subtle teal ambient glow in backdrop */}
            {rect && (
              <motion.ellipse
                animate={{ cx: rect.left + rect.width / 2, cy: rect.top + rect.height / 2, rx: rect.width * 1.5 + 60, ry: rect.height * 1.5 + 60 }}
                transition={{ type: "spring", stiffness: 140, damping: 20 }}
                fill={isDarkMode ? "rgba(0,221,221,0.04)" : "rgba(0,112,112,0.04)"}
                mask="url(#walkthrough-mask)"
              />
            )}
          </svg>

          {/* Highlighted element glow ring */}
          {rect && (
            <motion.div
              animate={{ left: rect.left - 10, top: rect.top - 10, width: rect.width + 20, height: rect.height + 20 }}
              transition={{ type: "spring", stiffness: 140, damping: 20 }}
              style={{
                position: "fixed",
                borderRadius: "14px",
                border: isDarkMode ? "1.5px solid rgba(255,255,255,0.7)" : "1.5px solid rgba(0,0,0,0.6)",
                boxShadow: isDarkMode 
                  ? "0 0 18px rgba(255,255,255,0.2), inset 0 0 10px rgba(255,255,255,0.05)" 
                  : "0 0 12px rgba(0,0,0,0.15), inset 0 0 8px rgba(0,0,0,0.03)",
                pointerEvents: "none",
              }}
            />
          )}

          {/* Tour Card */}
          {coords && (
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, scale: 0.93, y: 6 }}
              animate={{ opacity: 1, scale: 1, y: 0, x: coords.x, top: coords.y }}
              exit={{ opacity: 0, scale: 0.93 }}
              transition={{ type: "spring", stiffness: 200, damping: 22 }}
              style={{ position: "fixed", top: 0, left: 0, width: "340px" }}
              className="pointer-events-auto select-none"
            >
              {/* Arrow: TOP (card is below target) */}
              {coords.placement === "bottom" && (
                <div className="w-full flex justify-center mb-2">
                  <NeonArrow dir="up" />
                </div>
              )}

              <div className="flex gap-3 items-start">
                {/* Arrow: LEFT (card is to the right of target) */}
                {coords.placement === "right" && (
                  <div className="flex items-center pt-8">
                    <NeonArrow dir="left" />
                  </div>
                )}

                {/* ── The Card ── */}
                <div className={`flex-1 rounded-2xl overflow-hidden relative ${
                  isDarkMode
                    ? "border border-white/[0.07] shadow-[0_20px_60px_rgba(0,0,0,0.85),0_0_30px_rgba(255,255,255,0.02)]"
                    : "border border-black/[0.08] shadow-[0_20px_50px_rgba(0,0,0,0.12),0_0_20px_rgba(0,0,0,0.015)]"
                }`}>

                  {/* Background: glass + subtle mesh */}
                  <div className={`absolute inset-0 ${
                    isDarkMode
                      ? "bg-[#0d0d0c]/90 backdrop-blur-2xl"
                      : "bg-white/85 backdrop-blur-2xl"
                  }`} />
                  {/* Subtle grayscale glows */}
                  <div className="absolute -top-10 -left-10 w-32 h-32 rounded-full opacity-20 blur-2xl pointer-events-none"
                    style={{ background: `radial-gradient(circle, ${activeAccent}, transparent 70%)` }} />
                  <div className="absolute -bottom-8 -right-8 w-24 h-24 rounded-full opacity-10 blur-2xl pointer-events-none"
                    style={{ background: `radial-gradient(circle, ${activeAccent}, transparent 70%)` }} />

                  <div className="relative z-10 p-5">
                    {/* Step indicator dots */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-1.5">
                        {steps.map((_, i) => (
                          <motion.div
                            key={i}
                            animate={{ width: i === currentStep ? 20 : 6, opacity: i <= currentStep ? 1 : 0.25 }}
                            transition={{ duration: 0.3 }}
                            style={{ backgroundColor: i === currentStep ? activeAccent : isDarkMode ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.25)" }}
                            className="h-1.5 rounded-full"
                          />
                        ))}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] font-mono tracking-[0.2em] uppercase ${isDarkMode ? "text-white/30" : "text-black/35"}`}>
                          {currentStep + 1}/{steps.length}
                        </span>
                        <motion.button
                          onClick={handleClose}
                          whileHover={{ rotate: 90, scale: 1.15 }}
                          whileTap={{ scale: 0.85 }}
                          className={`p-1 rounded-lg transition-colors ${isDarkMode ? "hover:bg-white/8 text-white/40 hover:text-white/70" : "hover:bg-black/6 text-black/35 hover:text-black/60"}`}
                          title="Skip Tour"
                        >
                          <X className="h-3 w-3" />
                        </motion.button>
                      </div>
                    </div>

                    {/* Label */}
                    <div className="mb-1">
                      <span
                        className="text-[9px] font-mono tracking-[0.22em] uppercase"
                        style={{ color: activeAccent }}
                      >
                        RUDRANEX TOUR
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className={`text-sm font-bold tracking-tight mb-2.5 flex items-center gap-2 ${isDarkMode ? "text-white" : "text-black"}`}>
                      {currentIcon && (
                        <span style={{ color: activeAccent }}>{currentIcon}</span>
                      )}
                      {steps[currentStep].title}
                    </h3>

                    {/* Description */}
                    <p className={`text-[12px] leading-[1.65] ${isDarkMode ? "text-white/70" : "text-neutral-600"}`}>
                      {steps[currentStep].description}
                    </p>

                    {/* Divider */}
                    <div className={`my-4 h-px ${isDarkMode ? "bg-white/[0.06]" : "bg-black/[0.07]"}`} />

                    {/* Navigation */}
                    <div className="flex items-center justify-between">
                      <motion.button
                        onClick={handleClose}
                        whileHover={{ scale: 1.05, x: 3 }}
                        whileTap={{ scale: 0.95 }}
                        className={`text-[10px] font-mono uppercase tracking-widest transition-colors ${
                          isDarkMode ? "text-white/30 hover:text-white/60" : "text-black/30 hover:text-black/60"
                        }`}
                      >
                        Skip
                      </motion.button>

                      <div className="flex items-center gap-2">
                        {currentStep > 0 && (
                          <motion.button
                            onClick={handleBack}
                            whileHover={{ scale: 1.05, x: [0, 2.5, -5, 0] }}
                            whileTap={{ scale: 0.95 }}
                            transition={{
                              x: {
                                times: [0, 0.2, 0.7, 1],
                                duration: 0.5,
                                ease: "easeInOut"
                              }
                            }}
                            className={`h-8 px-3 rounded-lg border text-[11px] font-mono uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                              isDarkMode
                                ? "border-white/10 text-white/50 hover:text-white hover:border-white/20 bg-white/[0.03] hover:bg-white/[0.07]"
                                : "border-black/10 text-black/50 hover:text-black hover:border-black/20 bg-black/[0.02] hover:bg-black/[0.05]"
                            }`}
                          >
                            <ArrowLeft className="h-3 w-3" /> Back
                          </motion.button>
                        )}
                        <motion.button
                          onClick={handleNext}
                          whileHover={{ scale: 1.05, x: [0, -3, 6, 0] }}
                          whileTap={{ scale: 0.93 }}
                          transition={{
                            x: {
                              times: [0, 0.2, 0.7, 1],
                              duration: 0.5,
                              ease: "easeInOut"
                            }
                          }}
                          style={{
                            background: isLastStep
                              ? `linear-gradient(135deg, ${activeAccent}, ${isDarkMode ? "#737373" : "#3f3f3f"})`
                              : activeAccent,
                            color: getContrastColor(activeAccent),
                            boxShadow: isDarkMode ? "0 0 15px rgba(255,255,255,0.12)" : "0 0 10px rgba(0,0,0,0.08)",
                          }}
                          className={`h-8 rounded-lg font-mono text-[11px] uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                            isLastStep ? "px-4" : "px-3"
                          }`}
                          title={isLastStep ? "Finish" : "Next"}
                        >
                          {isLastStep ? (
                            <><Check className="h-3.5 w-3.5 stroke-[2.5]" /> Done</>
                          ) : (
                            <>Next <ArrowRight className="h-3.5 w-3.5 stroke-[2.5]" /></>
                          )}
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Arrow: RIGHT (card is to the left of target) */}
                {coords.placement === "left" && (
                  <div className="flex items-center pt-8">
                    <NeonArrow dir="right" />
                  </div>
                )}
              </div>

              {/* Arrow: BOTTOM (card is above target) */}
              {coords.placement === "top" && (
                <div className="w-full flex justify-center mt-2">
                  <NeonArrow dir="down" />
                </div>
              )}
            </motion.div>
          )}
        </div>
      )}
    </AnimatePresence>
  );
}
