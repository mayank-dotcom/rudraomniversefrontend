"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, X, Sparkles, CheckCircle } from "lucide-react";

interface WalkthroughStep {
  title: string;
  description: string;
  targetSelector?: string;
  placement: "top" | "bottom" | "left" | "right" | "center";
}

interface OnboardingWalkthroughProps {
  isOpen: boolean;
  onClose: () => void;
  isMobile: boolean;
  setIsSidebarCollapsed: (v: boolean) => void;
  setIsRightSidebarCollapsed: (v: boolean) => void;
}

export default function OnboardingWalkthrough({
  isOpen,
  onClose,
  isMobile,
  setIsSidebarCollapsed,
  setIsRightSidebarCollapsed,
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
        placement: "bottom",
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

  // Track target element bounding rect in real-time (runs update on every animation frame)
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

  // Calculate coordinates for floating tooltip card based on highlighted element and placement
  useEffect(() => {
    const stepConfig = steps[currentStep];
    if (!stepConfig) return;

    if (!rect || stepConfig.placement === "center") {
      // Center placement (e.g. step 0 and step 6)
      setCoords({
        x: window.innerWidth / 2 - 160, // card is 320px wide
        y: window.innerHeight / 2 - 120, // estimated card half-height
        placement: "center",
      });
      return;
    }

    const placement = stepConfig.placement;
    const gap = 16;
    const cardWidth = 320;
    const cardHeight = 220; // approximate estimation
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

    // Keep tooltip within screen boundaries with some padding
    const padding = 12;
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

  const progressPercentage = (currentStep / (steps.length - 1)) * 100;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] overflow-hidden pointer-events-none select-none">
          {/* Backdrop with cutout mask */}
          <svg className="absolute inset-0 w-full h-full pointer-events-auto">
            <defs>
              <mask id="walkthrough-mask">
                {/* Screen mask coverage */}
                <rect x="0" y="0" width="100%" height="100%" fill="white" />
                {/* Cutout hole */}
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
              fill="rgba(0, 0, 0, 0.75)"
              mask="url(#walkthrough-mask)"
            />
          </svg>

          {/* Floating Tooltip Card */}
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
                width: "320px",
              }}
              className="pointer-events-auto bg-[#0a0a0af0] border-2 border-[#00DDDD]/30 text-white rounded-2xl p-5 shadow-[0_10px_50px_rgba(0,221,221,0.15)] backdrop-blur-md flex flex-col font-sans"
            >
              {/* Progress Bar (at top of card) */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-white/5 overflow-hidden rounded-t-2xl">
                <motion.div
                  animate={{ width: `${progressPercentage}%` }}
                  className="h-full bg-[#00DDDD]"
                  transition={{ duration: 0.3 }}
                />
              </div>

              {/* Header Info */}
              <div className="flex items-center justify-between mb-4 mt-1">
                <span className="text-[8px] font-mono tracking-[0.25em] text-[#00DDDD] uppercase">
                  RUDRANEX TOUR // STEP {String(currentStep + 1).padStart(2, "0")}
                </span>
                <button
                  onClick={handleClose}
                  className="p-1 hover:bg-white/5 hover:text-[#00DDDD] transition-all rounded"
                  title="Skip Tour"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Title & Description */}
              <div className="flex-1 mb-6">
                <h3 className="text-sm font-bold tracking-tight mb-2 flex items-center gap-2">
                  {currentStep === 0 && <Sparkles className="h-4 w-4 text-[#00DDDD] animate-pulse" />}
                  {currentStep === steps.length - 1 && <CheckCircle className="h-4 w-4 text-[#00DDDD]" />}
                  {steps[currentStep].title}
                </h3>
                <p className="text-xs text-white/70 leading-relaxed font-sans font-light">
                  {steps[currentStep].description}
                </p>
              </div>

              {/* Navigation Controls */}
              <div className="flex items-center justify-between pt-3 border-t border-white/10">
                <button
                  onClick={handleClose}
                  className="text-[10px] font-mono uppercase tracking-widest text-white/40 hover:text-white transition-colors"
                >
                  Skip
                </button>

                <div className="flex items-center gap-2">
                  {currentStep > 0 && (
                    <button
                      onClick={handleBack}
                      className="px-3 py-1.5 border border-white/10 hover:border-white/20 text-white rounded-lg flex items-center justify-center gap-1.5 transition-all text-xs font-mono uppercase tracking-wider"
                    >
                      <ArrowLeft className="h-3 w-3" /> Back
                    </button>
                  )}
                  <button
                    onClick={handleNext}
                    className="px-4 py-2 bg-white text-black hover:bg-[#00DDDD] hover:shadow-[0_0_15px_rgba(0,221,221,0.4)] hover:scale-105 active:scale-95 text-xs font-bold font-mono uppercase tracking-wider rounded-lg flex items-center justify-center gap-1.5 transition-all"
                  >
                    {currentStep === steps.length - 1 ? "Finish" : "Next"}{" "}
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      )}
    </AnimatePresence>
  );
}
