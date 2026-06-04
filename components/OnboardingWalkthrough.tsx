"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, X, Sparkles, CheckCircle, Check } from "lucide-react";

interface WalkthroughStep {
  title: string;
  description: string;
  targetSelector?: string;
  placement: "top" | "bottom" | "left" | "right" | "center";
  offsetY?: number;
}

interface OnboardingWalkthroughProps {
  isOpen: boolean;
  onClose: () => void;
  isMobile: boolean;
  setIsSidebarCollapsed: (v: boolean) => void;
  setIsRightSidebarCollapsed: (v: boolean) => void;
  isDarkMode: boolean;
}

export default function OnboardingWalkthrough({
  isOpen,
  onClose,
  isMobile,
  setIsSidebarCollapsed,
  setIsRightSidebarCollapsed,
  isDarkMode,
}: OnboardingWalkthroughProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [coords, setCoords] = useState<{ x: number; y: number; placement: string } | null>(null);

  // Steps configuration
  const steps = useMemo<WalkthroughStep[]>(() => {
    return [
      {
        title: "Welcome to RUDRANEX AI! 🚀",
        description: "Your personalized study-pilot is ready to power your learning. Let's take a quick 1-minute visual tour of your workspace.",
        placement: "center",
      },
      {
        title: "Select AI Modes & Engines",
        description: "Switch between different AI engines tailored for your tasks—Student Mode for coursework, Persona Mode for character study, or AI Image Lab for generating artwork.",
        targetSelector: "#walkthrough-engine-select",
        placement: "top",
        offsetY: 20,
      },
      {
        title: "Session History & Settings",
        description: isMobile 
          ? "Tap the message icon in the header to open the sidebar. Here you can start a new chat, search sessions, and review your history."
          : "Collapse or expand this sidebar to view your chat sessions history, start a new chat, or search previous discussions.",
        targetSelector: isMobile ? undefined : "#walkthrough-sidebar-toggle",
        placement: isMobile ? "center" : "right",
      },
      {
        title: "Message Input & Tools",
        description: "Type your query here. You can attach PDFs or images for AI analysis, use the mic button for voice typing, or change models directly.",
        targetSelector: "#walkthrough-input-area",
        placement: "top",
      },
      {
        title: "Token Usage & Wallet",
        description: isMobile
          ? "Tap the settings icon in the header to check your active token metrics or top up your wallet."
          : "Open this sidebar to monitor your token usage metrics (CHT, COD, IMG, OCR, TTS, STT) or top up your wallet.",
        targetSelector: isMobile ? undefined : "#walkthrough-right-sidebar-toggle",
        placement: isMobile ? "center" : "left",
      },
      {
        title: "Profile & Theme Selection",
        description: "Manage your active session details, switch between dark and light themes, or log out of your account.",
        targetSelector: isMobile ? undefined : "#walkthrough-profile-area",
        placement: isMobile ? "center" : "top",
      },
      {
        title: "You're Ready to Roll! 🎉",
        description: "You're all set to experience RUDRANEX AI. Type your first prompt or attach a document to get started. Happy learning!",
        placement: "center",
      }
    ];
  }, [isMobile]);

  // Handle side-effects of step transitions (automatic expanding/collapsing of sidebars)
  useEffect(() => {
    if (!isOpen) return;

    switch (currentStep) {
      case 0: // Welcome screen - close sidebars
        setIsSidebarCollapsed(true);
        setIsRightSidebarCollapsed(true);
        break;
      case 1: // Engine Select dropdown - keep sidebars collapsed
        setIsSidebarCollapsed(true);
        setIsRightSidebarCollapsed(true);
        break;
      case 2: // Left Sidebar Panel - expand left sidebar (if desktop)
        if (!isMobile) {
          setIsSidebarCollapsed(false);
          setIsRightSidebarCollapsed(true);
        }
        break;
      case 3: // Input Box - collapse left sidebar again
        setIsSidebarCollapsed(true);
        setIsRightSidebarCollapsed(true);
        break;
      case 4: // Right Sidebar Toggle - expand right sidebar (if desktop)
        if (!isMobile) {
          setIsSidebarCollapsed(true);
          setIsRightSidebarCollapsed(false);
        }
        break;
      case 5: // Profile Area - expand left sidebar to see profile (if desktop)
        if (!isMobile) {
          setIsSidebarCollapsed(false);
          setIsRightSidebarCollapsed(true);
        }
        break;
      case 6: // Final Success screen - collapse all sidebars
        setIsSidebarCollapsed(true);
        setIsRightSidebarCollapsed(true);
        break;
    }
  }, [currentStep, isOpen, isMobile, setIsSidebarCollapsed, setIsRightSidebarCollapsed]);

  // Track target element bounding rect in real-time
  useEffect(() => {
    const stepConfig = steps[currentStep];
    const selector = stepConfig?.targetSelector;

    if (!selector) {
      setRect(null);
      return;
    }

    let active = true;
    const update = () => {
      if (!active) return;
      const el = document.querySelector(selector);
      if (el) {
        const r = el.getBoundingClientRect();
        setRect((prev) => {
          if (
            prev &&
            prev.left === r.left &&
            prev.top === r.top &&
            prev.width === r.width &&
            prev.height === r.height
          ) {
            return prev;
          }
          return r;
        });
      } else {
        setRect(null);
      }
      requestAnimationFrame(update);
    };

    update();
    return () => {
      active = false;
    };
  }, [currentStep, steps]);

  // Calculate coordinates for floating tooltip based on highlighted element and placement
  useEffect(() => {
    const stepConfig = steps[currentStep];
    if (!stepConfig) return;

    const cardWidth = 340; // width of card text area + optional horizontal arrow
    const cardHeight = 250; // estimated height of card text area + vertical arrow

    if (!rect || stepConfig.placement === "center") {
      // Center placement
      setCoords({
        x: window.innerWidth / 2 - cardWidth / 2,
        y: window.innerHeight / 2 - cardHeight / 2,
        placement: "center",
      });
      return;
    }

    const placement = stepConfig.placement;
    const offsetY = stepConfig.offsetY || 0;
    const gap = 20 + offsetY;
    let x = 0;
    let y = 0;

    if (placement === "bottom") {
      x = rect.left + rect.width / 2 - cardWidth / 2;
      y = rect.bottom + gap;
    } else if (placement === "top") {
      x = rect.left + rect.width / 2 - cardWidth / 2;
      y = rect.top - cardHeight - gap;
    } else if (placement === "left") {
      x = rect.left - cardWidth - gap;
      y = rect.top + rect.height / 2 - cardHeight / 2;
    } else if (placement === "right") {
      x = rect.right + gap;
      y = rect.top + rect.height / 2 - cardHeight / 2;
    }

    // Keep tooltip within screen boundaries
    const padding = 16;
    if (x < padding) x = padding;
    if (x + cardWidth > window.innerWidth - padding) {
      x = window.innerWidth - cardWidth - padding;
    }
    if (y < padding) y = padding;
    if (y + cardHeight > window.innerHeight - padding) {
      y = window.innerHeight - cardHeight - padding;
    }

    setCoords({ x, y, placement });
  }, [rect, currentStep, steps]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleClose();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleClose = () => {
    setCurrentStep(0);
    onClose();
  };

  // Reset steps on mount/open
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
    }
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "ArrowRight") {
        handleNext();
      } else if (e.key === "ArrowLeft") {
        handleBack();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, currentStep]);

  const progressPercentage = (currentStep / (steps.length - 1)) * 100;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] overflow-hidden pointer-events-none select-none">
          {/* Backdrop with cutout mask */}
          <svg className="absolute inset-0 w-full h-full pointer-events-auto">
            <defs>
              <mask id="walkthrough-mask">
                <rect x="0" y="0" width="100%" height="100%" fill="white" />
                {rect && (
                  <motion.rect
                    animate={{
                      x: rect.left - 8,
                      y: rect.top - 8,
                      width: rect.width + 16,
                      height: rect.height + 16,
                    }}
                    transition={{ type: "spring", stiffness: 140, damping: 20 }}
                    rx="12"
                    fill="black"
                  />
                )}
              </mask>
            </defs>
            <rect
              x="0"
              y="0"
              width="100%"
              height="100%"
              fill="rgba(0, 0, 0, 0.6)"
              mask="url(#walkthrough-mask)"
            />
          </svg>

          {/* Floating borderless content & bouncing neon pointers */}
          {coords && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1, x: coords.x, y: coords.y }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 140, damping: 20 }}
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "340px",
              }}
              className="pointer-events-auto text-white flex flex-col font-sans select-none drop-shadow-[0_4px_12px_rgba(0,0,0,0.95)]"
            >
              {/* Pointer Arrow: TOP (pointing UP to target) */}
              {coords.placement === "bottom" && (
                <div className="w-full flex justify-center mb-3">
                  <motion.div
                    animate={{ y: [-4, 2, -4] }}
                    transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
                    className="text-[#00DDDD] drop-shadow-[0_0_8px_rgba(0,221,221,0.8)]"
                  >
                    <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                      <path d="M12 4l-8 8h6v8h4v-8h6z" />
                    </svg>
                  </motion.div>
                </div>
              )}

              <div className="flex gap-4 items-start">
                {/* Pointer Arrow: LEFT (pointing LEFT to target) */}
                {coords.placement === "right" && (
                  <div className="flex items-center h-full pt-1">
                    <motion.div
                      animate={{ x: [-4, 2, -4] }}
                      transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
                      className="text-[#00DDDD] shrink-0 drop-shadow-[0_0_8px_rgba(0,221,221,0.8)]"
                    >
                      <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                        <path d="M4 12l8-8v6h8v4h-8v6z" />
                      </svg>
                    </motion.div>
                  </div>
                )}

                {/* Minimal Content Wrapper (Glassmorphism & Round Border) */}
                <div className={`flex-1 p-5 rounded-3xl border transition-all duration-300 ${
                  isDarkMode
                    ? "bg-white/10 border-white/20 backdrop-blur-md text-white shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
                    : "bg-white/60 border-white/40 backdrop-blur-md text-black shadow-[0_8px_32px_rgba(255,255,255,0.15),0_8px_20px_rgba(0,0,0,0.08)]"
                }`}>
                  {/* Progress Line */}
                  <div className="w-full h-0.5 bg-white/10 mb-4 rounded-full overflow-hidden">
                    <motion.div
                      animate={{ width: `${progressPercentage}%` }}
                      className="h-full bg-[#00DDDD]"
                      transition={{ duration: 0.3 }}
                    />
                  </div>

                  {/* Header Info */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[8px] font-mono tracking-[0.25em] text-[#00DDDD] uppercase">
                      RUDRANEX TOUR // STEP {String(currentStep + 1).padStart(2, "0")}
                    </span>
                    <button
                      onClick={handleClose}
                      className={`p-1 transition-all rounded ${
                        isDarkMode ? "hover:bg-white/5 hover:text-[#00DDDD]" : "hover:bg-black/5 hover:text-[#00c5c5]"
                      }`}
                      title="Skip Tour"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Title & Description */}
                  <div className="mb-5">
                    <h3 className={`text-sm font-bold tracking-tight mb-2 flex items-center gap-2 ${isDarkMode ? "text-white" : "text-black"}`}>
                      {currentStep === 0 && <Sparkles className="h-4 w-4 text-[#00DDDD] animate-pulse" />}
                      {currentStep === steps.length - 1 && <CheckCircle className="h-4 w-4 text-[#00DDDD]" />}
                      {steps[currentStep].title}
                    </h3>
                    <p className={`text-xs leading-relaxed font-sans font-light ${isDarkMode ? "text-white/95" : "text-neutral-800"}`}>
                      {steps[currentStep].description}
                    </p>
                  </div>

                  {/* Navigation Controls */}
                  <div className={`flex items-center justify-between pt-3 border-t ${isDarkMode ? "border-white/10" : "border-black/10"}`}>
                    <button
                      onClick={handleClose}
                      className={`text-[10px] font-mono uppercase tracking-widest transition-colors ${
                        isDarkMode ? "text-white/40 hover:text-white" : "text-neutral-500 hover:text-black"
                      }`}
                    >
                      Skip
                    </button>

                    <div className="flex items-center gap-2">
                      {currentStep > 0 && (
                        <button
                          onClick={handleBack}
                          className={`px-3 py-1.5 border rounded-lg flex items-center justify-center gap-1.5 transition-all text-xs font-mono uppercase tracking-wider ${
                            isDarkMode
                              ? "border-white/10 hover:border-white/20 text-white bg-black/40 backdrop-blur-xs"
                              : "border-black/10 hover:border-black/20 text-black bg-white/40 backdrop-blur-xs"
                          }`}
                        >
                          <ArrowLeft className="h-3 w-3" /> Back
                        </button>
                      )}
                      <button
                        onClick={handleNext}
                        className="p-2.5 bg-[#00DDDD] text-black hover:bg-[#00c5c5] hover:shadow-[0_0_15px_rgba(0,221,221,0.6)] hover:scale-105 active:scale-95 rounded-full flex items-center justify-center transition-all"
                        title={currentStep === steps.length - 1 ? "Finish" : "Next"}
                      >
                        {currentStep === steps.length - 1 ? (
                          <Check className="h-4 w-4 stroke-[3]" />
                        ) : (
                          <ArrowRight className="h-4 w-4 stroke-[3]" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Pointer Arrow: RIGHT (pointing RIGHT to target) */}
                {coords.placement === "left" && (
                  <div className="flex items-center h-full pt-1">
                    <motion.div
                      animate={{ x: [2, -4, 2] }}
                      transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
                      className="text-[#00DDDD] shrink-0 drop-shadow-[0_0_8px_rgba(0,221,221,0.8)]"
                    >
                      <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                        <path d="M20 12l-8-8v6H4v4h8v6z" />
                      </svg>
                    </motion.div>
                  </div>
                )}
              </div>

              {/* Pointer Arrow: BOTTOM (pointing DOWN to target) */}
              {coords.placement === "top" && (
                <div className="w-full flex justify-center mt-3">
                  <motion.div
                    animate={{ y: [2, -4, 2] }}
                    transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
                    className="text-[#00DDDD] drop-shadow-[0_0_8px_rgba(0,221,221,0.8)]"
                  >
                    <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                      <path d="M12 20l-8-8h6V4h4v8h6z" />
                    </svg>
                  </motion.div>
                </div>
              )}
            </motion.div>
          )}
        </div>
      )}
    </AnimatePresence>
  );
}
