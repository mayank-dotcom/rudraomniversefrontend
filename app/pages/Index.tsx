"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/ui/Footer";
import { isAuthenticated } from "@/lib/auth";
import AuthModal from "@/components/ui/AuthModal";
import { useIsMobile } from "@/hooks/use-mobile";

const LapViewer = dynamic(() => import("@/components/LapViewer"), { ssr: false });
const MobilePhoneViewer = dynamic(() => import("@/components/MobilePhoneViewer"), { ssr: false });
const InfiniteMenu = dynamic(() => import("@/components/InfiniteMenu"), { ssr: false });
const CardSwap = dynamic(() => import("@/components/CardSwap"), { ssr: false });
import { Card } from "@/components/CardSwap";

const romanNumerals = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV", "XV"];

const tools = [
  {
    name: "PDF Analyze",
    desc: "Upload any PDF and get instant AI-powered analysis, summaries, and key insights in seconds.",
    category: "Student",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
  },
  {
    name: "Live Interview Simulator",
    desc: "Practice with AI-driven mock interviews tailored to your role, industry, and experience level.",
    category: "Student",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    name: "Mock Paper Generator",
    desc: "Generate custom practice papers with adaptive difficulty based on your syllabus and performance.",
    category: "Student",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        <line x1="8" y1="7" x2="16" y2="7" />
        <line x1="8" y1="11" x2="14" y2="11" />
      </svg>
    ),
  },
  {
    name: "Persona Mode",
    desc: "Replicate any persona — historical figures, experts, or custom characters — for immersive conversations.",
    category: "Student",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    name: "Image Generation",
    desc: "Create stunning AI-generated images from text prompts for projects, presentations, and creative work.",
    category: "Student",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21 15 16 10 5 21" />
      </svg>
    ),
  },
  {
    name: "Image Library",
    desc: "Browse, organize, and manage a growing library of AI-generated and uploaded images in one place.",
    category: "Student",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    name: "Battle Arena",
    desc: "Challenge friends in real-time quiz battles. Test knowledge across subjects and climb the leaderboard.",
    category: "Student",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
        <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
        <path d="M4 22h16" />
        <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
        <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
        <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
      </svg>
    ),
  },
  {
    name: "Gmail Manager",
    desc: "Connect your Gmail and manage emails, labels, and conversations directly through the AI interface.",
    category: "Enterprise",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <path d="M22 7l-10 7L2 7" />
      </svg>
    ),
  },
  {
    name: "Auto Reply & Bulk Email",
    desc: "Set up intelligent auto-replies and send bulk personalized emails to thousands with a single click.",
    category: "Enterprise",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <polyline points="22,6 12,13 2,6" />
        <line x1="12" y1="13" x2="2" y2="6" />
        <line x1="22" y1="6" x2="12" y2="13" />
      </svg>
    ),
  },
  {
    name: "Enterprise Manager",
    desc: "Full enterprise management dashboard — users, teams, billing, analytics, and role-based access control.",
    category: "Enterprise",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
      </svg>
    ),
  },
  {
    name: "Admin Panel",
    desc: "Enterprise admin panel with system-wide controls, audit logs, user management, and compliance tools.",
    category: "Enterprise",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    ),
  },
];

const studentTools = tools.filter((t) => t.category === "Student");
const enterpriseTools = tools.filter((t) => t.category === "Enterprise");

const getCardLayout = (index: number) => {
  switch (index) {
    case 0: // PDF Analyze (Large 2x2) - Deep Matte Black
      return {
        span: "md:col-span-2 md:row-span-2",
        bg: "bg-[#040306]/95 border border-white/[0.04] group-hover:bg-neutral-200 group-hover:border-transparent",
        glow: "hover:shadow-[0_20px_50px_rgba(255,255,255,0.08)] hover:-translate-y-2",
        type: "large"
      };
    case 1: // Live Interview (Standard 1x1) - Sleek Medium Grey
      return {
        span: "md:col-span-1 md:row-span-1",
        bg: "bg-[#111014]/80 border border-white/[0.06] group-hover:bg-neutral-200 group-hover:border-transparent",
        glow: "hover:shadow-[0_20px_50px_rgba(255,255,255,0.08)] hover:-translate-y-2",
        type: "standard"
      };
    case 2: // Mock Paper (Tall 1x2) - Light Silver/Translucent White Glass
      return {
        span: "md:col-span-1 md:row-span-2",
        bg: "bg-white/[0.03] border border-white/[0.06] group-hover:bg-neutral-200 group-hover:border-transparent",
        glow: "hover:shadow-[0_20px_50px_rgba(255,255,255,0.08)] hover:-translate-y-2",
        type: "tall"
      };
    case 3: // Persona Mode (Standard 1x1) - Deep Matte Black
      return {
        span: "md:col-span-1 md:row-span-1",
        bg: "bg-[#040306]/95 border border-white/[0.04] group-hover:bg-neutral-200 group-hover:border-transparent",
        glow: "hover:shadow-[0_20px_50px_rgba(255,255,255,0.08)] hover:-translate-y-2",
        type: "standard"
      };
    case 4: // Image Generation (Wide 2x1) - Sleek Medium Grey
      return {
        span: "md:col-span-2 md:row-span-1",
        bg: "bg-[#111014]/80 border border-white/[0.06] group-hover:bg-neutral-200 group-hover:border-transparent",
        glow: "hover:shadow-[0_20px_50px_rgba(255,255,255,0.08)] hover:-translate-y-2",
        type: "wide"
      };
    case 5: // Image Library (Standard 1x1) - Light Silver/Translucent White Glass
      return {
        span: "md:col-span-1 md:row-span-1",
        bg: "bg-white/[0.03] border border-white/[0.06] group-hover:bg-neutral-200 group-hover:border-transparent",
        glow: "hover:shadow-[0_20px_50px_rgba(255,255,255,0.08)] hover:-translate-y-2",
        type: "standard"
      };
    case 6: // Battle Arena (Wide 2x1) - Deep Matte Black
      return {
        span: "md:col-span-2 md:row-span-1",
        bg: "bg-[#040306]/95 border border-white/[0.04] group-hover:bg-neutral-200 group-hover:border-transparent",
        glow: "hover:shadow-[0_20px_50px_rgba(255,255,255,0.08)] hover:-translate-y-2",
        type: "wide"
      };
    case 7: // Gmail Manager (Tall 1x2) - Sleek Medium Grey
      return {
        span: "md:col-span-1 md:row-span-2",
        bg: "bg-[#111014]/80 border border-white/[0.06] group-hover:bg-neutral-200 group-hover:border-transparent",
        glow: "hover:shadow-[0_20px_50px_rgba(255,255,255,0.08)] hover:-translate-y-2",
        type: "tall"
      };
    case 8: // Auto Reply & Bulk Email (Large 2x2) - Light Silver/Translucent White Glass
      return {
        span: "md:col-span-2 md:row-span-2",
        bg: "bg-white/[0.03] border border-white/[0.06] group-hover:bg-neutral-200 group-hover:border-transparent",
        glow: "hover:shadow-[0_20px_50px_rgba(255,255,255,0.08)] hover:-translate-y-2",
        type: "large"
      };
    case 9: // Enterprise Manager (Large 2x2) - Deep Matte Black
      return {
        span: "md:col-span-2 md:row-span-2",
        bg: "bg-[#040306]/95 border border-white/[0.04] group-hover:bg-neutral-200 group-hover:border-transparent",
        glow: "hover:shadow-[0_20px_50px_rgba(255,255,255,0.08)] hover:-translate-y-2",
        type: "large"
      };
    case 10: // Admin Panel (Standard 1x1) - Sleek Medium Grey
      return {
        span: "md:col-span-1 md:row-span-1",
        bg: "bg-[#111014]/80 border border-white/[0.06] group-hover:bg-neutral-200 group-hover:border-transparent",
        glow: "hover:shadow-[0_20px_50px_rgba(255,255,255,0.08)] hover:-translate-y-2",
        type: "standard"
      };
    default:
      return {
        span: "md:col-span-1 md:row-span-1",
        bg: "bg-white/[0.02] border border-white/[0.05] group-hover:bg-neutral-200 group-hover:border-transparent",
        glow: "hover:shadow-none hover:-translate-y-2",
        type: "standard"
      };
  }
};

const getCardBackInfo = (index: number) => {
  switch (index) {
    case 0: // PDF Analyze (Large 2x2)
      return [
        "Instant automated summarization of extremely long PDF documents",
        "High-accuracy OCR text extraction from scanned images and handwriting",
        "Interactive Q&A AI chatbot with persistent document-aware context",
        "Exportable structured notes, study guides, and key takeaways",
        "Side-by-side comparative analysis of multiple document versions",
        "Searchable index mapping of cited sources and referenced chapters",
        "Multi-language translation support for global research papers"
      ];
    case 1: // Live Interview (Standard 1x1)
      return [
        "Adaptive AI interviewer customized to specific job descriptions",
        "Real-time voice-to-text audio input analysis with low latency",
        "Detailed performance dashboard tracking confidence and pace"
      ];
    case 2: // Mock Paper (Tall 1x2)
      return [
        "Syllabus-aligned practice paper generation in seconds",
        "Adaptive question difficulty matching user's current performance",
        "Step-by-step detailed answer explanations for active learning",
        "Ready-to-print PDF exports with professional layout designs",
        "Diverse question formats including MCQs, short and long answers",
        "Timer-enabled exam simulator mode to practice time management",
        "Topic-wise strength and weakness analysis report card"
      ];
    case 3: // Persona Mode (Standard 1x1)
      return [
        "Simulate historical characters, subject experts, or custom bots",
        "Interactive voice text-to-speech with high-fidelity speech synthesis",
        "Upload local reference documents to anchor the persona's knowledge"
      ];
    case 4: // Image Generation (Wide 2x1)
      return [
        "Ultra high-fidelity text-to-image prompt processing engine",
        "Dozens of custom art style presets, models, and filter configurations",
        "Lossless super-resolution upscaling up to 4K resolution"
      ];
    case 5: // Image Library (Standard 1x1)
      return [
        "Secure cloud storage sync across all logged-in devices",
        "Smart tag auto-categorization filters powered by computer vision",
        "One-click shareable public links for quick image distribution"
      ];
    case 6: // Battle Arena (Wide 2x1)
      return [
        "Live multiplayer game rooms and competitive study lobbies",
        "Matchmaking matching you against players of similar skill levels",
        "Subject-specific trivia and competitive quiz question formats"
      ];
    case 7: // Gmail Manager (Tall 1x2)
      return [
        "AI-drafted email replies personalized to thread context",
        "Smart category auto-labeling based on urgency and topic",
        "Unified inbox workspace linking multiple accounts seamlessly",
        "One-click unsubscribe and newsletter cleanup assistant",
        "Intelligent reply reminders for important pending conversations",
        "Custom canned templates generation powered by user style analysis",
        "Deep search filters mapping sender attachments and contents"
      ];
    case 8: // Auto Reply & Bulk Email (Large 2x2)
      return [
        "Automated drip campaigns and multi-stage email sequences",
        "Domain deliverability warmup systems to bypass spam filters",
        "Bulk template personalization using custom CSV placeholder mapping",
        "Comprehensive analytics tracking clicks, opens, and replies",
        "Automated A/B split testing for email subject lines and body",
        "Outbox scheduling optimized for target recipient time zones",
        "Smart unsubscribe link handling and list cleaning filters"
      ];
    case 9: // Enterprise Manager (Large 2x2)
      return [
        "SAML/OIDC Single Sign-On (SSO) integration for active orgs",
        "Granular audit trails tracking system configuration updates",
        "Role-based user access controls (RBAC) with custom permissions",
        "Resource allocation and billing consumption usage analytics",
        "Encrypted automatic nightly backup and key rotation scheduling",
        "Multi-tenant support with custom white-label branding options",
        "Compliance reports matching SOC2, HIPAA, and GDPR standards"
      ];
    case 10: // Admin Panel (Standard 1x1)
      return [
        "Enterprise billing and subscription invoicing pipelines",
        "Custom API key management and request rate-limiting configurations",
        "Real-time system health checks and server uptime telemetry logs"
      ];
    default:
      return [
        "Cutting-edge AI-powered tool features and functionalities",
        "High-performance cloud computation with zero local system load",
        "Advanced deep learning model pipelines updated dynamically"
      ];
  }
};

const reviewColumns = [
  [
    {
      initials: "AK",
      name: "Arjun Kumar",
      role: "Engineering Student",
      text: "The interview simulator is a game-changer. I practiced 20+ mock interviews and landed my dream internship. Highly recommend for every student."
    },
    {
      initials: "SP",
      name: "Sneha Patel",
      role: "Product Manager",
      text: "Enterprise admin panel gave us complete control over team access and billing. The bulk email feature saved us hundreds of hours."
    },
    {
      initials: "KK",
      name: "Karan Kapoor",
      role: "UI/UX Designer",
      text: "The image generation presets are top-notch. Love the clean layouts and customization options."
    },
    {
      initials: "MD",
      name: "Meera Dutt",
      role: "Content Creator",
      text: "Creating localized blogs with custom translations is seamless. The AI tools are highly responsive."
    }
  ],
  [
    {
      initials: "RJ",
      name: "Ravi Joshi",
      role: "Research Scholar",
      text: "PDF Analyze is incredible — it summarizes 100-page research papers in seconds. Persona Mode helped me prepare for my viva by simulating my professor."
    },
    {
      initials: "AM",
      name: "Ananya Mehta",
      role: "Startup Founder",
      text: "We use the Enterprise Manager across our entire org of 200+ people. The AI auto-reply feature alone cut our support response time by 80%."
    },
    {
      initials: "RY",
      name: "Rahul Yadav",
      role: "Software Developer",
      text: "The multi-language translation and speed are fantastic. Highly recommended for reading complex documentation."
    },
    {
      initials: "PS",
      name: "Pooja Sharma",
      role: "HR Consultant",
      text: "SSO support and audit logs in the admin panel are extremely robust. Fits perfectly with our security requirements."
    }
  ],
  [
    {
      initials: "VS",
      name: "Vikram Singh",
      role: "College Student",
      text: "Battle Arena is so much fun! My friends and I have weekly quiz wars. Mock Paper Generator helped me score 95% in my finals."
    },
    {
      initials: "NC",
      name: "Neha Choudhary",
      role: "HR Manager",
      text: "Gmail Manager integration is seamless. Managing hundreds of applications through the admin panel has streamlined our entire recruitment pipeline."
    },
    {
      initials: "AG",
      name: "Amit Gupta",
      role: "Data Analyst",
      text: "Dashboard telemetry and usage analytics are beautiful. Very clean presentation of complex data."
    },
    {
      initials: "DK",
      name: "Divya Krishnan",
      role: "Marketing Lead",
      text: "Bulk campaigns and outbox scheduling work flawlessly. Our click rates improved by 25%."
    }
  ]
];

const createReviewCardImage = (review: { initials: string; name: string; role: string; text: string }): string => {
  if (typeof window === "undefined") return "";

  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  // 1. Draw rounded card background with sleek dark gradient
  const bgGrad = ctx.createLinearGradient(0, 0, 512, 512);
  bgGrad.addColorStop(0, "#111014");
  bgGrad.addColorStop(1, "#050308");
  ctx.fillStyle = bgGrad;

  const radius = 24;
  ctx.beginPath();
  ctx.roundRect(0, 0, 512, 512, radius);
  ctx.fill();

  // 2. Draw a subtle radial glow spotlight
  const glow = ctx.createRadialGradient(0, 0, 50, 0, 0, 250);
  glow.addColorStop(0, "rgba(0, 255, 255, 0.05)");
  glow.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.roundRect(0, 0, 512, 512, radius);
  ctx.fill();

  // 3. Draw Quotation Mark watermark in background
  ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
  ctx.font = "italic bold 180px Georgia, serif";
  ctx.textAlign = "right";
  ctx.textBaseline = "top";
  ctx.fillText("“", 480, 160);

  // 4. Draw border with gradient rim light
  const borderGrad = ctx.createLinearGradient(0, 0, 512, 512);
  borderGrad.addColorStop(0, "rgba(0, 255, 255, 0.3)"); // Cyan rim at top-left
  borderGrad.addColorStop(0.3, "rgba(255, 255, 255, 0.08)");
  borderGrad.addColorStop(1, "rgba(255, 255, 255, 0.03)");
  ctx.strokeStyle = borderGrad;
  ctx.lineWidth = 3;
  ctx.stroke();

  // 5. Draw initials badge circle
  ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
  ctx.beginPath();
  ctx.arc(120, 120, 40, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "rgba(0, 255, 255, 0.15)";
  ctx.lineWidth = 2;
  ctx.stroke();

  // Initials Text
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 28px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(review.initials, 120, 120);

  // 6. Draw Name (Serif & Elegant)
  ctx.fillStyle = "#ffffff";
  ctx.font = "italic 24px Georgia, serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(review.name, 180, 108);

  // 7. Draw Role (Muted, Monospace style)
  ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
  ctx.font = "12px sans-serif";
  ctx.fillText(review.role.toUpperCase(), 180, 136);

  // 8. Draw Testimonial text wrapping
  ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
  ctx.font = "20px sans-serif";
  ctx.textBaseline = "top";

  const wrapText = (text: string, x: number, y: number, maxWidth: number, lineHeight: number) => {
    const words = text.split(" ");
    let line = "";
    let currentY = y;
    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + " ";
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;
      if (testWidth > maxWidth && n > 0) {
        ctx.fillText(line, x, currentY);
        line = words[n] + " ";
        currentY += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, x, currentY);
  };

  wrapText(review.text, 60, 200, 392, 32);

  return canvas.toDataURL("image/png");
};

const ENTER_END = 1 / 3;
const ZOOM_END = 2 / 3;

const Typewriter = ({ text, delay = 20, active = false }: { text: string; delay?: number; active?: boolean }) => {
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (!active) {
      setDisplayedText("");
      setIsTyping(false);
      return;
    }

    setIsTyping(true);
    let currentIndex = 0;
    setDisplayedText("");

    const interval = setInterval(() => {
      if (currentIndex < text.length) {
        setDisplayedText(text.slice(0, currentIndex + 1));
        currentIndex++;
      } else {
        setIsTyping(false);
        clearInterval(interval);
      }
    }, delay);

    return () => {
      clearInterval(interval);
      setIsTyping(false);
    };
  }, [text, delay, active]);

  return (
    <span className="relative" style={{ whiteSpace: "pre-wrap" }}>
      {displayedText}
      {isTyping && (
        <span className="inline-block w-1.5 h-3 ml-0.5 bg-current animate-pulse align-middle" />
      )}
    </span>
  );
};

const PdfAnalyzeDemo = ({ active }: { active: boolean }) => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!active) {
      setStep(0);
      return;
    }
    const t1 = setTimeout(() => setStep(1), 300);
    const t2 = setTimeout(() => setStep(2), 1500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [active]);

  return (
    <div className="flex flex-col h-full bg-[#08070b]/60 rounded-xl p-3 border border-white/5 text-[11px] font-sans justify-between">
      <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-2">
        <span className="font-mono text-white/70 truncate">📜 quarterly_report.pdf</span>
        <span className="text-[9px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded border border-green-500/20">Analyzed</span>
      </div>
      <div className="flex-grow flex flex-col gap-2 overflow-y-auto mb-2 pr-1">
        {step >= 1 && (
          <div className="self-end bg-white/5 rounded-lg px-2.5 py-1.5 max-w-[85%] text-white/80">
            <Typewriter text="Summarize Q2 key metrics." active={active && step >= 1} />
          </div>
        )}
        {step >= 2 && (
          <div className="self-start bg-cyan-950/20 border border-cyan-500/20 rounded-lg px-2.5 py-1.5 max-w-[85%] text-cyan-300">
            <Typewriter
              text={`• Revenue: $4.2M (+12% YoY)
• Net Margin: 18.4%
• User Growth: +40,000 active`}
              active={active && step >= 2}
              delay={15}
            />
          </div>
        )}
      </div>
      <div className="border-t border-white/5 pt-2 flex items-center justify-between text-white/40">
        <span>Ask anything about the document...</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 2 11 13 22 22"></polyline><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
      </div>
    </div>
  );
};

const LiveInterviewDemo = ({ active }: { active: boolean }) => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!active) {
      setStep(0);
      return;
    }
    const t1 = setTimeout(() => setStep(1), 300);
    const t2 = setTimeout(() => setStep(2), 1800);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [active]);

  return (
    <div className="flex flex-col h-full bg-[#08070b]/60 rounded-xl p-3 border border-white/5 text-[11px] font-sans justify-between">
      <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-2">
        <span className="font-mono text-white/70">🎙️ AI Mock Interview (Frontend)</span>
        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
      </div>
      <div className="flex-grow flex flex-col gap-2 overflow-y-auto mb-2 pr-1 justify-center">
        {step >= 1 && (
          <div className="bg-white/5 rounded-lg p-2 text-white/80 border-l-2 border-white/20">
            <span className="text-white/40 block text-[9px] mb-0.5">AI INTERVIEWER</span>
            <Typewriter text="Explain event delegation in JavaScript and its benefits." active={active && step >= 1} />
          </div>
        )}
        {step >= 2 && (
          <div className="bg-emerald-950/20 border border-emerald-500/10 rounded-lg p-2 text-emerald-400">
            <span className="text-emerald-500/50 block text-[9px] mb-0.5">YOUR RESPONSE</span>
            <Typewriter text="Handling events at a parent element using bubble propagation to reduce listeners." active={active && step >= 2} />
          </div>
        )}
      </div>
      <div className="border-t border-white/5 pt-2 flex items-center justify-between text-[9px] font-mono text-white/50">
        <span>CONFIDENCE: {step >= 2 ? "94%" : "ANALYZING..."}</span>
        <span>PACE: {step >= 2 ? "EXCELLENT" : "CALCULATING..."}</span>
      </div>
    </div>
  );
};

const MockPaperDemo = ({ active }: { active: boolean }) => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!active) {
      setStep(0);
      return;
    }
    const t1 = setTimeout(() => setStep(1), 300);
    const t2 = setTimeout(() => setStep(2), 1500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [active]);

  return (
    <div className="flex flex-col h-full bg-[#08070b]/60 rounded-xl p-3 border border-white/5 text-[11px] font-sans justify-between">
      <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-2">
        <span className="font-mono text-white/70">📝 Physics Mock Test (Unit 4)</span>
        <span className="text-[9px] text-white/40">Time Left: 14:20</span>
      </div>
      <div className="flex-grow flex flex-col gap-2 overflow-y-auto mb-2 pr-1 justify-center">
        {step >= 1 && (
          <div className="text-white/80 mb-1">
            <Typewriter text="Q: What is the escape velocity of an object from Earth's surface?" active={active && step >= 1} />
          </div>
        )}
        {step >= 2 && (
          <div className="flex flex-col gap-1.5 transition-all duration-500">
            <div className="border border-white/10 rounded p-1 bg-white/5 text-white/60">A) 9.8 km/s</div>
            <div className="border border-emerald-500/30 rounded p-1 bg-emerald-950/30 text-emerald-400 flex items-center justify-between">
              <span>B) 11.2 km/s</span>
              <span className="text-[9px] bg-emerald-500/20 px-1 rounded">Correct</span>
            </div>
            <div className="border border-white/10 rounded p-1 bg-white/5 text-white/60">C) 15.4 km/s</div>
          </div>
        )}
      </div>
      <div className="border-t border-white/5 pt-2 flex items-center justify-between text-[9px] font-mono text-white/50">
        <span>SCORE: {step >= 2 ? "92/100" : "--"}</span>
        <span>DIFFICULTY: ADAPTIVE</span>
      </div>
    </div>
  );
};

const PersonaModeDemo = ({ active }: { active: boolean }) => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!active) {
      setStep(0);
      return;
    }
    const t1 = setTimeout(() => setStep(1), 300);
    const t2 = setTimeout(() => setStep(2), 1500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [active]);

  return (
    <div className="flex flex-col h-full bg-[#08070b]/60 rounded-xl p-3 border border-white/5 text-[11px] font-sans justify-between">
      <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-2">
        <div className="flex items-center gap-1.5">
          <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-[10px]">AE</span>
          <span className="font-mono text-white/70">Albert Einstein 🏛️</span>
        </div>
        <span className="text-[9px] text-cyan-400">Active</span>
      </div>
      <div className="flex-grow flex flex-col gap-2 overflow-y-auto mb-2 pr-1 justify-end">
        {step >= 1 && (
          <div className="self-end bg-white/5 rounded-lg px-2.5 py-1.5 max-w-[85%] text-white/80">
            <Typewriter text="Why is the speed of light constant?" active={active && step >= 1} />
          </div>
        )}
        {step >= 2 && (
          <div className="self-start bg-cyan-950/20 border border-cyan-500/20 rounded-lg px-2.5 py-1.5 max-w-[85%] text-cyan-300">
            <Typewriter text="Ah, my friend! To make physics same for everyone, time and space must bend, leaving light's speed absolute." active={active && step >= 2} delay={15} />
          </div>
        )}
      </div>
      <div className="border-t border-white/5 pt-2 text-white/30 text-[9px]">
        Immersive learning in Persona Mode
      </div>
    </div>
  );
};

const ImageGenerationDemo = ({ active }: { active: boolean }) => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!active) {
      setStep(0);
      return;
    }
    const t1 = setTimeout(() => setStep(1), 300);
    const t2 = setTimeout(() => setStep(2), 1800);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [active]);

  return (
    <div className="flex flex-col h-full bg-[#08070b]/60 rounded-xl p-3 border border-white/5 text-[11px] font-sans justify-between">
      <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-2">
        <span className="font-mono text-white/70">🎨 AI Prompt Studio</span>
        <span className="text-[9px] text-purple-400">{step >= 2 ? "Completed" : "Rendering..."}</span>
      </div>
      <div className="flex-grow flex flex-col gap-2 mb-2 justify-center">
        {step >= 1 && (
          <div className="text-[10px] text-white/50 truncate bg-white/5 p-1 rounded font-mono">
            Prompt: <Typewriter text="Futuristic neon city skyline, cyberpunk style, ultra 8k" active={active && step >= 1} />
          </div>
        )}
        {step >= 2 && (
          <div className="h-20 rounded-lg bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 border border-white/10 relative overflow-hidden flex items-center justify-center">
            <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.3)_50%)] bg-[size:100%_4px]" />
            <span className="font-serif italic text-white/40 text-[10px] tracking-widest uppercase animate-pulse">CYBERPUNK</span>
          </div>
        )}
      </div>
      <div className="border-t border-white/5 pt-2 flex items-center justify-between text-[9px] font-mono text-white/50">
        <span>RATIO: 16:9</span>
        <span>MODEL: NEURAL_V4</span>
      </div>
    </div>
  );
};

const ImageLibraryDemo = ({ active }: { active: boolean }) => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!active) {
      setStep(0);
      return;
    }
    const t1 = setTimeout(() => setStep(1), 500);

    return () => clearTimeout(t1);
  }, [active]);

  return (
    <div className="flex flex-col h-full bg-[#08070b]/60 rounded-xl p-3 border border-white/5 text-[11px] font-sans justify-between">
      <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-2">
        <span className="font-mono text-white/70">📂 AI Asset Library</span>
        <span className="text-[9px] text-white/40">{step >= 1 ? "3 items synced" : "Syncing..."}</span>
      </div>
      <div className="flex-grow flex items-center justify-center mb-2">
        {step >= 1 ? (
          <div className="grid grid-cols-3 gap-2 w-full animate-fade-in">
            <div className="h-16 rounded border border-white/10 overflow-hidden relative group/img">
              <img src="/mock_cyberpunk.png" alt="Cyberpunk" className="w-full h-full object-cover transition-transform duration-500 group-hover/img:scale-110" />
            </div>
            <div className="h-16 rounded border border-white/10 overflow-hidden relative group/img">
              <img src="/mock_abstract.png" alt="Abstract" className="w-full h-full object-cover transition-transform duration-500 group-hover/img:scale-110" />
            </div>
            <div className="h-16 rounded border border-white/10 overflow-hidden relative group/img">
              <img src="/mock_cosmic.png" alt="Cosmic" className="w-full h-full object-cover transition-transform duration-500 group-hover/img:scale-110" />
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce" />
            <div className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce [animation-delay:0.2s]" />
            <div className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce [animation-delay:0.4s]" />
          </div>
        )}
      </div>
      <div className="border-t border-white/5 pt-2 flex items-center justify-between text-[9px] font-mono text-white/50">
        <span>STORAGE: 14%</span>
        <span>CLOUD SYNC: ACTIVE</span>
      </div>
    </div>
  );
};

const BattleArenaDemo = ({ active }: { active: boolean }) => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!active) {
      setStep(0);
      return;
    }
    const t1 = setTimeout(() => setStep(1), 300);
    const t2 = setTimeout(() => setStep(2), 1500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [active]);

  return (
    <div className="flex flex-col h-full bg-[#08070b]/60 rounded-xl p-3 border border-white/5 text-[11px] font-sans justify-between">
      <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-2">
        <span className="font-mono text-white/70">🏆 Live Arena Quiz</span>
        <span className="text-[9px] bg-red-500/20 text-red-400 px-1.5 rounded animate-pulse">1v1 BATTLE</span>
      </div>
      <div className="flex-grow flex flex-col gap-2 justify-center mb-2">
        <div className="flex justify-between items-center text-[10px] font-mono text-white/60 px-1">
          <span>YOU (350 pts)</span>
          <span className="text-white/20">vs</span>
          <span>BOT ({step >= 2 ? "320 pts" : "..."})</span>
        </div>
        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden flex">
          <div className="bg-emerald-500 h-full transition-all duration-1000" style={{ width: step >= 2 ? "52%" : "30%" }} />
          <div className="bg-red-500 h-full transition-all duration-1000" style={{ width: step >= 2 ? "48%" : "30%" }} />
        </div>
        {step >= 2 && (
          <div className="text-center text-emerald-400 font-semibold mt-1">
            <Typewriter text="Victory in 3 seconds!" active={active && step >= 2} />
          </div>
        )}
      </div>
      <div className="border-t border-white/5 pt-2 text-white/30 text-[9px] text-center font-mono">
        Weekly trivia battle challenge
      </div>
    </div>
  );
};

const GmailManagerDemo = ({ active }: { active: boolean }) => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!active) {
      setStep(0);
      return;
    }
    const t1 = setTimeout(() => setStep(1), 300);
    const t2 = setTimeout(() => setStep(2), 1500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [active]);

  return (
    <div className="flex flex-col h-full bg-[#08070b]/60 rounded-xl p-3 border border-white/5 text-[11px] font-sans justify-between">
      <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-2">
        <span className="font-mono text-white/70">📬 Gmail Inbox Workspace</span>
        <span className="text-[9px] bg-cyan-500/20 text-cyan-400 px-1.5 py-0.5 rounded border border-cyan-500/20">Connected</span>
      </div>
      <div className="flex-grow flex flex-col gap-2 overflow-y-auto mb-2 pr-1 justify-center">
        {step >= 1 && (
          <div className="bg-white/5 rounded-lg p-2 text-white/80 border-l-2 border-cyan-500/40">
            <span className="text-white/40 block text-[9px] mb-0.5">SENDER: HR@ACME.COM</span>
            <span className="font-semibold block text-white/90">Subject: Project Proposal Review</span>
            <p className="text-white/60 text-[10px] mt-1">Hey team, please review the attached Q3 plan...</p>
          </div>
        )}
        {step >= 2 && (
          <div className="bg-cyan-950/20 border border-cyan-500/10 rounded-lg p-2 text-cyan-400">
            <span className="text-cyan-500/50 block text-[9px] mb-0.5">AI DRAFT REPLY</span>
            <Typewriter text="Drafting: I have reviewed the proposal and it looks solid. I will schedule a call tomorrow." active={active && step >= 2} delay={15} />
          </div>
        )}
      </div>
      <div className="border-t border-white/5 pt-2 flex items-center justify-between text-[9px] font-mono text-white/50">
        <span>UNREAD: 3</span>
        <span>LABELS: AUTO_TAGGED</span>
      </div>
    </div>
  );
};

const AutoReplyBulkDemo = ({ active }: { active: boolean }) => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!active) {
      setStep(0);
      return;
    }
    const t1 = setTimeout(() => setStep(1), 300);
    const t2 = setTimeout(() => setStep(2), 1500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [active]);

  return (
    <div className="flex flex-col h-full bg-[#08070b]/60 rounded-xl p-3 border border-white/5 text-[11px] font-sans justify-between">
      <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-2">
        <span className="font-mono text-white/70">📧 Drip Campaign (Outbox)</span>
        <span className="text-[9px] text-green-400 bg-green-500/20 px-1.5 rounded animate-pulse">Running</span>
      </div>
      <div className="flex-grow flex flex-col gap-2 justify-center mb-2">
        <div className="flex justify-between items-center text-[10px] font-mono text-white/60 px-1">
          <span>DELIVERY RATE</span>
          <span className="text-emerald-400 font-semibold">{step >= 2 ? "99.8%" : "..."}</span>
        </div>
        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden flex">
          <div className="bg-indigo-500 h-full transition-all duration-1000" style={{ width: step >= 2 ? "85%" : "30%" }} />
          <div className="bg-emerald-500 h-full transition-all duration-1000" style={{ width: step >= 2 ? "15%" : "10%" }} />
        </div>
        {step >= 1 && (
          <div className="bg-white/5 p-2 rounded border border-white/10 font-mono text-[9px] text-white/70 mt-1">
            <span className="text-white/40">Campaign: Product Launch V2</span>
            <div className="text-[10px] text-indigo-300 mt-1">
              <Typewriter text="Sent: 4,820 / 5,000 emails dispatched successfully..." active={active && step >= 1} delay={15} />
            </div>
          </div>
        )}
      </div>
      <div className="border-t border-white/5 pt-2 flex items-center justify-between text-[9px] font-mono text-white/50">
        <span>OPENS: {step >= 2 ? "68%" : "--"}</span>
        <span>BOUNCES: {step >= 2 ? "0.2%" : "--"}</span>
      </div>
    </div>
  );
};

const EnterpriseManagerDemo = ({ active }: { active: boolean }) => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!active) {
      setStep(0);
      return;
    }
    const t1 = setTimeout(() => setStep(1), 300);
    const t2 = setTimeout(() => setStep(2), 1500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [active]);

  return (
    <div className="flex flex-col h-full bg-[#08070b]/60 rounded-xl p-3 border border-white/5 text-[11px] font-sans justify-between">
      <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-2">
        <span className="font-mono text-white/70">👥 Org Workspace Manager</span>
        <span className="text-[9px] text-indigo-400">4 Teams Active</span>
      </div>
      <div className="flex-grow flex flex-col gap-2 overflow-y-auto mb-2 pr-1 justify-center">
        {step >= 1 && (
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center text-[10px] border border-white/5 rounded p-1 bg-white/5">
              <span className="text-white/80 font-mono">dev-prod-cluster</span>
              <span className="text-[8px] bg-green-500/20 text-green-400 px-1 rounded">HEALTHY</span>
            </div>
            <div className="flex justify-between items-center text-[10px] border border-white/5 rounded p-1 bg-white/5">
              <span className="text-white/80 font-mono">billing-portal-v2</span>
              <span className="text-[8px] bg-green-500/20 text-green-400 px-1 rounded">HEALTHY</span>
            </div>
          </div>
        )}
        {step >= 2 && (
          <div className="text-center font-mono text-[9px] text-cyan-300 bg-cyan-950/20 border border-cyan-500/20 rounded p-1.5">
            <Typewriter text="Telemetry sync completed for 12 nodes." active={active && step >= 2} delay={15} />
          </div>
        )}
      </div>
      <div className="border-t border-white/5 pt-2 flex items-center justify-between text-[9px] font-mono text-white/50">
        <span>MEMBERS: 240</span>
        <span>ROLE CONTROL: SAML/SSO</span>
      </div>
    </div>
  );
};

const AdminPanelDemo = ({ active }: { active: boolean }) => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!active) {
      setStep(0);
      return;
    }
    const t1 = setTimeout(() => setStep(1), 300);
    const t2 = setTimeout(() => setStep(2), 1500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [active]);

  return (
    <div className="flex flex-col h-full bg-[#08070b]/60 rounded-xl p-3 border border-white/5 text-[11px] font-sans justify-between">
      <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-2">
        <span className="font-mono text-white/70">🛡️ System Audit Logs</span>
        <span className="text-[9px] bg-red-500/20 text-red-400 px-1.5 rounded animate-pulse">SECURE</span>
      </div>
      <div className="flex-grow flex flex-col gap-2 overflow-y-auto mb-2 pr-1 justify-end font-mono text-[9px] text-white/70">
        {step >= 1 && (
          <div className="text-white/40 truncate">
            [14:44:02] SSO Login Success - user: amit@comp.com
          </div>
        )}
        {step >= 2 && (
          <div className="text-red-400">
            <Typewriter text="[14:44:15] Warning: API Rate Limit hit on /v2/analytics (IP: 182.4.9.12)" active={active && step >= 2} delay={15} />
          </div>
        )}
      </div>
      <div className="border-t border-white/5 pt-2 flex items-center justify-between text-[9px] font-mono text-white/50">
        <span>COMPLIANCE: SOC2/GDPR</span>
        <span>KEY ROTATION: NEXT IN 4H</span>
      </div>
    </div>
  );
};

const renderToolDemo = (name: string, active: boolean) => {
  switch (name) {
    case "PDF Analyze":
      return <PdfAnalyzeDemo active={active} />;
    case "Live Interview Simulator":
      return <LiveInterviewDemo active={active} />;
    case "Mock Paper Generator":
      return <MockPaperDemo active={active} />;
    case "Persona Mode":
      return <PersonaModeDemo active={active} />;
    case "Image Generation":
      return <ImageGenerationDemo active={active} />;
    case "Image Library":
      return <ImageLibraryDemo active={active} />;
    case "Battle Arena":
      return <BattleArenaDemo active={active} />;
    case "Gmail Manager":
      return <GmailManagerDemo active={active} />;
    case "Auto Reply & Bulk Email":
      return <AutoReplyBulkDemo active={active} />;
    case "Enterprise Manager":
      return <EnterpriseManagerDemo active={active} />;
    case "Admin Panel":
      return <AdminPanelDemo active={active} />;
    default:
      return null;
  }
};

const Index = () => {
  const [progress, setProgress] = useState(0);
  const [showNavbar, setShowNavbar] = useState(false);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [flipped, setFlipped] = useState<Record<number, boolean>>({});
  const timeoutsRef = useRef<Record<number, NodeJS.Timeout>>({});
  const [activeStudentCard, setActiveStudentCard] = useState(0);
  const [activeEnterpriseCard, setActiveEnterpriseCard] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [heroStage, setHeroStage] = useState<"visible" | "exiting" | "hidden">("visible");
  const [heroDismissed, setHeroDismissed] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    setIsLoggedIn(isAuthenticated());
  }, []);

  useEffect(() => {
    const reviewsList = reviewColumns.flat();
    const generated = reviewsList.map((review) => ({
      image: createReviewCardImage(review),
      link: "#",
      title: review.name,
      description: review.role,
    }));
    setMenuItems(generated);
  }, []);

  const toggleFlip = (index: number) => {
    setFlipped((prev) => {
      const nextState = !prev[index];

      // Clear any existing timeout for this card
      if (timeoutsRef.current[index]) {
        clearTimeout(timeoutsRef.current[index]);
        delete timeoutsRef.current[index];
      }

      // Automatically flip back after 6 seconds if we are flipping to the back face
      if (nextState) {
        timeoutsRef.current[index] = setTimeout(() => {
          setFlipped((prevFlipped) => ({ ...prevFlipped, [index]: false }));
        }, 6000);
      }

      return {
        ...prev,
        [index]: nextState
      };
    });
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      if ("scrollRestoration" in window.history) {
        window.history.scrollRestoration = "manual";
      }
      window.scrollTo(0, 0);
    }

    return () => {
      // Clean up all active timeouts on unmount
      Object.values(timeoutsRef.current).forEach(clearTimeout);
    };
  }, []);

  const phaseRef = useRef<"enter" | "zoom" | "scroll">("enter");
  const bodyOverflowRef = useRef("");

  useEffect(() => {
    const mb = typeof window !== "undefined" && window.innerWidth < 768;
    if (mb) {
      phaseRef.current = "scroll";
      return;
    }

    const html = document.documentElement;
    bodyOverflowRef.current = html.style.overflow;
    html.style.overflow = "hidden";

    const timeouts: number[] = [];
    const animFrameRef = { current: 0 };

    // Stage 1: Hero image slides up first
    timeouts.push(window.setTimeout(() => {
      setHeroDismissed(true);
    }, 200));

    // Stage 2: After hero slide-up (~1.4s), start laptop animation
    timeouts.push(window.setTimeout(() => {
      const LAPTOP_DURATION = 4000;
      const startTime = performance.now();

      const animate = (now: number) => {
        const elapsed = now - startTime;
        const raw = Math.min(elapsed / LAPTOP_DURATION, 1);
        const eased = 1 - Math.pow(1 - raw, 3);

        setProgress(eased);

        if (eased >= ENTER_END && phaseRef.current === "enter") {
          phaseRef.current = "zoom";
        }

        if (eased >= ZOOM_END && phaseRef.current === "zoom") {
          phaseRef.current = "scroll";
          html.style.overflow = bodyOverflowRef.current;
          window.scrollTo({ top: window.innerHeight, behavior: "smooth" });
        }

        if (eased < 1) {
          animFrameRef.current = requestAnimationFrame(animate);
        }
      };

      animFrameRef.current = requestAnimationFrame(animate);
    }, 1400));

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      timeouts.forEach(clearTimeout);
      html.style.overflow = bodyOverflowRef.current;
    };
  }, []);

  useEffect(() => {
    const mb = typeof window !== "undefined" && window.innerWidth < 768;
    if (!mb) return;

    const handleScroll = () => {
      const scrollRange = window.innerHeight * 1.2;
      const p = Math.min(window.scrollY / scrollRange, 1);
      setProgress(p);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!isMobile) return;
    const timer = setTimeout(() => {
      setHeroStage("exiting");
    }, 2500);
    return () => clearTimeout(timer);
  }, [isMobile]);

  useEffect(() => {
    const mb = typeof window !== "undefined" && window.innerWidth < 768;
    if (mb) {
      setShowNavbar(heroStage === "hidden" || window.scrollY > 50);
    } else {
      if (progress >= 1) setShowNavbar(true);
    }
  }, [progress, heroStage]);

  return (
    <div className="relative bg-[#050308] min-h-screen w-full overflow-x-hidden">
      <Navbar visible={showNavbar} />

      <div className="fixed inset-0 z-0 pointer-events-none">
        {isMobile ? <MobilePhoneViewer /> : <LapViewer progress={progress} />}
      </div>

      <div className="relative z-10 pointer-events-none">
        <section id="hero" className="h-screen flex items-center justify-center overflow-hidden pointer-events-none">
          <motion.div
            className="w-full"
            initial={false}
            animate={{
              y: ((isMobile && (heroStage === "exiting" || heroStage === "hidden")) || heroDismissed) ? "-100vh" : 0,
            }}
            transition={{ duration: 1, ease: "easeInOut" }}
            onAnimationComplete={() => {
              if (heroStage === "exiting") {
                setHeroStage("hidden");
              }
            }}
          >
            <div className="text-center max-w-3xl mx-auto px-4">
              <h1 className="mb-6 flex justify-center">
                <motion.img
                  src="/rudranex-removebg-preview.png"
                  alt="Rudranex"
                  className="h-20 md:h-32 w-auto object-contain"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                />
              </h1>
              {!isMobile && (
                <p className="text-lg md:text-xl text-white/40">
                  Scroll to explore
                </p>
              )}
            </div>
          </motion.div>
        </section>

        <div className="h-[100vh]" />

        {/* Features */}
        <section id="features" className="pt-32 pb-12 px-6 bg-[#050308] pointer-events-auto">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="text-left mb-20 max-w-7xl mx-auto"
            >
              <span className="inline-flex items-center gap-2 text-xs font-semibold text-white/30 uppercase tracking-[0.25em] mb-4">
                <span className="w-1.5 h-1.5 rounded-full bg-white/20" /> Everything You Need
              </span>
              <div className="flex items-center gap-6 mb-6">
                <h2 className="text-5xl md:text-7xl font-light text-white font-serif italic tracking-tight whitespace-nowrap">
                  AI-Powered Tools
                </h2>
                <motion.div
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
                  style={{ originX: 0 }}
                  className="h-[2px] flex-grow bg-white"
                />
              </div>
              <p className="text-base md:text-lg text-white/40 max-w-2xl leading-relaxed">
                From study aids to enterprise management — one platform does it all.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 auto-rows-[290px] md:auto-rows-[256px] grid-flow-row-dense">
              {tools.map((tool, i) => {
                const layout = getCardLayout(i);
                const isFlipped = flipped[i];
                const backInfo = getCardBackInfo(i);

                return (
                  <motion.div
                    key={tool.name}
                    className={`group perspective-1000 ${layout.span} h-full select-none cursor-pointer`}
                    initial={{
                      y: 50,
                      scale: 0.85,
                      opacity: 0,
                      rotate: i % 2 === 0 ? 3 : -3
                    }}
                    whileInView={{
                      y: 0,
                      scale: 1,
                      opacity: 1,
                      rotate: 0
                    }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{
                      type: "spring",
                      stiffness: 60,
                      damping: 14,
                      delay: (i % 4) * 0.05
                    }}
                  >
                    <div
                      className={`relative w-full h-full preserve-3d transition-transform duration-700 ${isFlipped ? "rotate-y-180" : ""
                        }`}
                      onClick={() => toggleFlip(i)}
                    >
                      {/* FRONT FACE */}
                      <div
                        className={`absolute inset-0 backface-hidden w-full h-full rounded-2xl backdrop-blur-md transition-all duration-500 ease-out ${layout.bg} ${layout.glow}`}
                      >
                        {layout.type === "large" && (
                          <div className="relative w-full h-full flex flex-col justify-start p-6 md:p-8">
                            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:20px_20px] opacity-40 pointer-events-none rounded-2xl transition-opacity duration-500 group-hover:opacity-10" />
                            <div className="absolute inset-0 bg-radial-gradient from-transparent to-black/60 pointer-events-none rounded-2xl transition-opacity duration-500 group-hover:opacity-0" />

                            <div className="relative z-10">
                              <div className="flex items-center justify-between mb-4">
                                <span className="font-serif italic text-white/30 text-xs tracking-widest transition-colors duration-500 group-hover:text-black/40">
                                  Chapter {romanNumerals[i]}
                                </span>
                                <span className="text-[9px] font-mono uppercase tracking-widest px-2.5 py-1 rounded-full border text-neutral-300 border-white/15 bg-white/5 transition-all duration-500 group-hover:bg-black group-hover:text-white group-hover:border-transparent">
                                  {tool.category}
                                </span>
                              </div>
                              <div className="w-12 h-12 rounded-xl border flex items-center justify-center mb-6 border-white/15 bg-white/5 text-white/80 shadow-[0_0_15px_rgba(255,255,255,0.02)] transition-all duration-500 group-hover:text-black group-hover:border-black/15 group-hover:bg-black/5">
                                {tool.icon}
                              </div>
                              <h3 className="font-serif text-2xl md:text-3xl font-light text-white mb-3 italic tracking-tight transition-colors duration-500 group-hover:text-black">
                                {tool.name}
                              </h3>
                              <div className="w-12 h-[1px] bg-white/10 mb-4 transition-colors duration-500 group-hover:bg-black/15" />
                              <p className="text-sm text-white/50 leading-relaxed max-w-md transition-colors duration-500 group-hover:text-black/75">
                                {tool.desc}
                              </p>
                            </div>
                          </div>
                        )}

                        {layout.type === "tall" && (
                          <div className="w-full h-full flex flex-col justify-start p-5 md:p-6">
                            <div>
                              <div className="flex items-center justify-between mb-3">
                                <span className="font-serif italic text-white/30 text-[10px] tracking-widest transition-colors duration-500 group-hover:text-black/40">
                                  Chapter {romanNumerals[i]}
                                </span>
                                <span className="text-[8px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-full border text-neutral-300 border-white/15 bg-white/5 transition-all duration-500 group-hover:bg-black group-hover:text-white group-hover:border-transparent">
                                  {tool.category}
                                </span>
                              </div>
                              <div className="w-10 h-10 rounded-lg border flex items-center justify-center mb-5 border-white/15 bg-white/5 text-white/80 transition-all duration-500 group-hover:text-black group-hover:border-black/15 group-hover:bg-black/5">
                                {tool.icon}
                              </div>
                              <h3 className="font-serif text-xl font-light text-white mb-2 italic tracking-tight transition-colors duration-500 group-hover:text-black">
                                {tool.name}
                              </h3>
                              <div className="w-8 h-[1px] bg-white/10 mb-3 transition-colors duration-500 group-hover:bg-black/15" />
                              <p className="text-xs text-white/40 leading-relaxed transition-colors duration-500 group-hover:text-black/70">
                                {tool.desc}
                              </p>
                            </div>
                          </div>
                        )}

                        {layout.type === "wide" && (
                          <div className="w-full h-full flex flex-col justify-start p-5 md:p-6">
                            <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                              <div className="w-10 h-10 shrink-0 rounded-lg border flex items-center justify-center border-white/15 bg-white/5 text-white/80 transition-all duration-500 group-hover:text-black group-hover:border-black/15 group-hover:bg-black/5">
                                {tool.icon}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between gap-3 mb-2">
                                  <span className="font-serif italic text-white/30 text-[10px] tracking-widest transition-colors duration-500 group-hover:text-black/40">
                                    Chapter {romanNumerals[i]}
                                  </span>
                                  <span className="text-[8px] font-mono uppercase tracking-widest px-1.5 py-0.5 rounded border text-neutral-300 border-white/15 bg-white/5 transition-all duration-500 group-hover:bg-black group-hover:text-white group-hover:border-transparent">
                                    {tool.category}
                                  </span>
                                </div>
                                <h3 className="font-serif text-xl font-light text-white mb-2 italic tracking-tight transition-colors duration-500 group-hover:text-black">
                                  {tool.name}
                                </h3>
                                <p className="text-xs text-white/40 leading-relaxed transition-colors duration-500 group-hover:text-black/70">
                                  {tool.desc}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {layout.type === "standard" && (
                          <div className="w-full h-full flex flex-col justify-start p-5 md:p-6">
                            <div>
                              <div className="flex items-center justify-between mb-3">
                                <span className="font-serif italic text-white/30 text-[10px] tracking-widest transition-colors duration-500 group-hover:text-black/40">
                                  Chapter {romanNumerals[i]}
                                </span>
                                <span className="text-[8px] font-mono uppercase tracking-widest px-1.5 py-0.5 rounded border text-neutral-300 border-white/15 bg-white/5 transition-all duration-500 group-hover:bg-black group-hover:text-white group-hover:border-transparent">
                                  {tool.category}
                                </span>
                              </div>
                              <div className="w-10 h-10 rounded-lg border flex items-center justify-center mb-3 border-white/15 bg-white/5 text-white/80 transition-all duration-500 group-hover:text-black group-hover:border-black/15 group-hover:bg-black/5">
                                {tool.icon}
                              </div>
                              <h3 className="font-serif text-base font-light text-white mb-1.5 italic tracking-tight transition-colors duration-500 group-hover:text-black">
                                {tool.name}
                              </h3>
                              <p className="text-xs text-white/40 leading-relaxed transition-colors duration-500 group-hover:text-black/70">
                                {tool.desc}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* BACK FACE */}
                      <div
                        className={`absolute inset-0 backface-hidden rotate-y-180 w-full h-full rounded-2xl border border-white/10 bg-neutral-950/95 backdrop-blur-xl flex flex-col justify-between overflow-hidden shadow-[inset_0_0_30px_rgba(255,255,255,0.02)] transition-all duration-500 ease-out group-hover:bg-neutral-200 group-hover:border-transparent ${layout.type === "large" ? "p-6 md:p-8" : "p-5 md:p-6"
                          }`}
                      >
                        {/* Dot Grid background for back face */}
                        <div className="absolute inset-0 bg-dot-grid opacity-30 pointer-events-none transition-opacity duration-500 group-hover:opacity-10" />

                        <div className="relative z-10 flex flex-col h-full">
                          <div className="mb-4">
                            <span className="text-[10px] font-mono tracking-wider text-white/40 uppercase transition-colors duration-500 group-hover:text-black/40">
                              AI CAPABILITY
                            </span>
                          </div>

                          <h3 className="text-base font-bold text-white mb-4 tracking-tight pb-2 border-b border-white/5 transition-all duration-500 group-hover:text-black group-hover:border-black/15 font-serif italic">
                            {tool.name}
                          </h3>

                          <ul className={`space-y-2.5 grow ${(layout.type === "large" || layout.type === "tall") ? "md:space-y-4" : ""
                            }`}>
                            {backInfo.map((info, idx) => (
                              <li key={idx} className={`flex items-start gap-2.5 text-xs text-white/60 transition-colors duration-500 group-hover:text-black/75 ${(layout.type === "large" || layout.type === "tall") ? "md:text-[13px] md:leading-relaxed" : ""
                                }`}>
                                <svg className="w-3.5 h-3.5 text-white/40 shrink-0 mt-0.5 transition-colors duration-500 group-hover:text-black/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                                </svg>
                                <span>{info}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Reviews */}
        <section className="relative bg-white w-full pointer-events-auto">
          <div className="w-full relative">
            {menuItems.length > 0 && (
              <div className="relative w-full h-[800px] md:h-[900px] overflow-hidden bg-transparent">
                {/* Heading inside the globe section container */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="absolute top-8 left-4 right-8 md:top-12 md:left-6 md:right-12 z-20 text-right pointer-events-none"
                >
                  <span className="inline-flex items-center gap-2 text-xs font-semibold text-black/35 uppercase tracking-[0.25em] mb-3">
                    User Reviews <span className="w-1.5 h-1.5 rounded-full bg-black/20" />
                  </span>
                  <div className="flex items-center gap-3 mb-3">
                    <motion.div
                      initial={{ scaleX: 0 }}
                      whileInView={{ scaleX: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
                      style={{ originX: 1 }}
                      className="h-[2px] flex-grow bg-black"
                    />
                    <h2 className="text-4xl md:text-5xl font-light text-black font-serif italic tracking-tight whitespace-nowrap">
                      What They Say
                    </h2>
                  </div>
                  <p className="text-xs md:text-sm text-black/50 max-w-md ml-auto leading-relaxed">
                    Here is how students and enterprises are leveling up their workflow with Rudranex.
                  </p>
                </motion.div>

                <InfiniteMenu items={menuItems} scale={0.8} />
              </div>
            )}
          </div>
        </section>

        {/* For Students */}
        <section id="students" className="py-20 px-6 border-t border-white/5 bg-[#050308] pointer-events-auto">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="text-left mb-16 max-w-7xl mx-auto"
            >
              <span className="inline-flex items-center gap-2 text-xs font-semibold text-white/30 uppercase tracking-[0.25em] mb-4">
                <span className="w-1.5 h-1.5 rounded-full bg-white/20" /> For Students
              </span>
              <div className="flex items-center gap-6 mb-6">
                <h2 className="text-5xl md:text-7xl font-light text-white font-serif italic tracking-tight md:whitespace-nowrap">
                  Your AI Study Companion
                </h2>
                <motion.div
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
                  style={{ originX: 0 }}
                  className="h-[2px] flex-grow bg-white"
                />
              </div>
              <p className="text-base md:text-lg text-white/40 max-w-2xl leading-relaxed">
                Ace your exams, practice interviews, generate study materials, and compete with friends — all powered by cutting-edge AI.
              </p>
            </motion.div>

            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div className="order-last lg:order-first">
                <style>{`
                  @keyframes progressFill {
                    from { transform: scaleX(0); }
                    to { transform: scaleX(1); }
                  }
                `}</style>
                <span className="inline-flex items-center gap-2 text-xs font-semibold text-white/30 uppercase tracking-[0.25em] mb-6">
                  <span className="w-1.5 h-1.5 rounded-full bg-white/20" /> Select a Tool
                </span>
                <div className="flex flex-col gap-3 max-w-lg">
                  {studentTools.map((t, idx) => {
                    const isActive = activeStudentCard === idx;
                    return (
                      <div
                        key={t.name}
                        onClick={() => setActiveStudentCard(idx)}
                        className={`relative overflow-hidden rounded-xl border p-3.5 transition-all duration-500 cursor-pointer flex items-center justify-between select-none ${isActive
                          ? "border-white/25 bg-white/[0.04] shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] backdrop-blur-md translate-x-2"
                          : "border-white/5 bg-transparent hover:bg-white/[0.01] hover:border-white/10 hover:translate-x-1"
                          }`}
                      >
                        <div className="flex items-center gap-3.5">
                          <div className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-all duration-500 ${isActive
                            ? "border-cyan-500/30 bg-cyan-950/20 text-cyan-400"
                            : "border-white/10 bg-white/5 text-white/40"
                            }`}>
                            {t.icon}
                          </div>
                          <div>
                            <h4 className={`text-xs font-semibold transition-colors duration-300 ${isActive ? "text-white" : "text-white/50"
                              }`}>
                              {t.name}
                            </h4>
                            <p className="text-[9px] text-white/30 truncate max-w-[200px] sm:max-w-[280px]">
                              {t.desc}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {isActive ? (
                            <span className="flex items-center gap-1.5 text-[8px] font-mono tracking-wider text-cyan-400 bg-cyan-950/30 border border-cyan-500/20 px-2 py-0.5 rounded-full uppercase">
                              <span className="w-1 h-1 rounded-full bg-cyan-400 animate-ping" /> Live
                            </span>
                          ) : (
                            <span className="text-[8px] font-mono tracking-wider text-white/20 border border-white/5 px-2 py-0.5 rounded-full uppercase">
                              Idle
                            </span>
                          )}
                        </div>

                        {isActive && (
                          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/5 overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-cyan-400 to-indigo-500 origin-left"
                              style={{
                                animation: 'progressFill 6000ms linear forwards'
                              }}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="relative h-[400px] md:h-[480px] w-full flex items-center justify-center overflow-visible order-first lg:order-last">
                <CardSwap
                  width={420}
                  height={320}
                  cardDistance={40}
                  verticalDistance={40}
                  delay={6000}
                  pauseOnHover={true}
                  activeIndex={activeStudentCard}
                  onActiveIndexChange={setActiveStudentCard}
                  className="left-1/2 transform -translate-x-1/2 -translate-y-[6vh] max-[768px]:translate-y-[0%] max-[768px]:scale-[0.75] max-[480px]:scale-[0.6] origin-center"
                >
                  {studentTools.map((tool, idx) => {
                    const isActive = activeStudentCard === idx;
                    return (
                      <Card key={tool.name}>
                        <div className="flex flex-col h-full justify-between select-none">
                          <div className="flex items-center gap-3 shrink-0">
                            <div className="w-8 h-8 rounded-lg border border-white/10 flex items-center justify-center text-white/70 bg-white/5">
                              {tool.icon}
                            </div>
                            <div>
                              <h3 className="text-sm font-semibold text-white font-serif italic tracking-tight leading-tight">{tool.name}</h3>
                            </div>
                          </div>
                          <div className="flex-grow overflow-hidden mt-3 mb-2">
                            {renderToolDemo(tool.name, isActive)}
                          </div>
                          <div className="text-[8px] font-mono uppercase tracking-[0.2em] text-white/25 border-t border-white/5 pt-1.5 shrink-0">
                            STUDENT COMPANION
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </CardSwap>
              </div>
            </div>
          </div>
        </section>

        {/* For Enterprise */}
        <section id="enterprise" className="pt-20 pb-10 px-6 border-t border-black/5 bg-white pointer-events-auto">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="text-left mb-16 max-w-7xl mx-auto"
            >
              <span className="inline-flex items-center gap-2 text-xs font-semibold text-black/35 uppercase tracking-[0.25em] mb-4">
                <span className="w-1.5 h-1.5 rounded-full bg-black/20" /> For Enterprise
              </span>
              <div className="flex items-center gap-6 mb-6">
                <h2 className="text-5xl md:text-7xl font-light text-black font-serif italic tracking-tight md:whitespace-nowrap">
                  Scale Your Business With AI
                </h2>
                <motion.div
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
                  style={{ originX: 0 }}
                  className="h-[2px] flex-grow bg-black"
                />
              </div>
              <p className="text-base md:text-lg text-black/60 max-w-2xl leading-relaxed">
                Streamline communications, manage teams, automate workflows, and gain full control with enterprise-grade administration tools.
              </p>
            </motion.div>

            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div className="order-last lg:order-last">
                <div className="flex justify-start max-w-lg ml-auto mb-6">
                  <span className="inline-flex items-center gap-2 text-xs font-bold text-black/60 uppercase tracking-[0.25em]">
                    <span className="w-1.5 h-1.5 rounded-full bg-black/20" /> Select a Service
                  </span>
                </div>
                <div className="flex flex-col gap-3 max-w-lg ml-auto">
                  {enterpriseTools.map((t, idx) => {
                    const isActive = activeEnterpriseCard === idx;
                    return (
                      <div
                        key={t.name}
                        onClick={() => setActiveEnterpriseCard(idx)}
                        className={`relative overflow-hidden rounded-xl border p-3.5 transition-all duration-500 cursor-pointer flex items-center justify-between select-none ${isActive
                          ? "border-black/70 bg-black/[0.02] shadow-[0_8px_32px_0_rgba(0,0,0,0.06)] backdrop-blur-md -translate-x-2"
                          : "border-black/30 bg-transparent hover:bg-black/[0.01] hover:border-black/60 hover:-translate-x-1"
                          }`}
                      >
                        <div className="flex items-center gap-3.5 text-left">
                          <div className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-all duration-500 ${isActive
                            ? "border-cyan-500/35 bg-cyan-50 text-cyan-600"
                            : "border-black/10 bg-black/5 text-black/40"
                            }`}>
                            {t.icon}
                          </div>
                          <div>
                            <h4 className={`text-xs font-semibold transition-colors duration-300 ${isActive ? "text-black" : "text-black/50"
                              }`}>
                              {t.name}
                            </h4>
                            <p className="text-[9px] text-black/40 truncate max-w-[200px] sm:max-w-[280px]">
                              {t.desc}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {isActive ? (
                            <span className="flex items-center gap-1.5 text-[8px] font-mono tracking-wider text-cyan-600 bg-cyan-50 border border-cyan-500/20 px-2 py-0.5 rounded-full uppercase">
                              <span className="w-1 h-1 rounded-full bg-cyan-500 animate-ping" /> Live
                            </span>
                          ) : (
                            <span className="text-[8px] font-mono tracking-wider text-black/35 border border-black/10 px-2 py-0.5 rounded-full uppercase">
                              Idle
                            </span>
                          )}
                        </div>

                        {isActive && (
                          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-black/5 overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-cyan-400 to-indigo-500 origin-right"
                              style={{
                                animation: 'progressFill 6000ms linear forwards'
                              }}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-end mt-8">
                  <button className="text-sm bg-black text-white px-6 py-3 rounded-lg font-medium hover:bg-black/90 transition-all">
                    Contact Sales
                  </button>
                </div>
              </div>

              <div className="relative h-[400px] md:h-[480px] w-full flex items-center justify-center overflow-visible order-first lg:order-first">
                <CardSwap
                  width={420}
                  height={320}
                  cardDistance={40}
                  verticalDistance={40}
                  delay={6000}
                  pauseOnHover={true}
                  activeIndex={activeEnterpriseCard}
                  onActiveIndexChange={setActiveEnterpriseCard}
                  invertStacking={true}
                  className="left-0 md:left-20 transform translate-x-[12%] md:translate-x-[16%] -translate-y-[12vh] origin-bottom-left max-[768px]:translate-x-[10%] max-[768px]:translate-y-[0%] max-[768px]:scale-[0.75] max-[480px]:translate-x-[6%] max-[480px]:-translate-y-[2%] max-[480px]:scale-[0.6]"
                >
                  {enterpriseTools.map((tool, idx) => {
                    const isActive = activeEnterpriseCard === idx;
                    return (
                      <Card key={tool.name} customClass="bg-neutral-700/95">
                        <div className="flex flex-col h-full justify-between select-none">
                          <div className="flex items-center justify-end gap-3 shrink-0 text-right w-full">
                            <div>
                              <h3 className="text-sm font-semibold text-white font-serif italic tracking-tight leading-tight">{tool.name}</h3>
                            </div>
                            <div className="w-8 h-8 rounded-lg border border-white/10 flex items-center justify-center text-white/70 bg-white/5">
                              {tool.icon}
                            </div>
                          </div>
                          <div className="flex-grow overflow-hidden mt-3 mb-2">
                            {renderToolDemo(tool.name, isActive)}
                          </div>
                          <div className="text-[8px] font-mono uppercase tracking-[0.2em] text-white/25 border-t border-white/5 pt-1.5 shrink-0">
                            ENTERPRISE READY
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </CardSwap>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section id="pricing" className="py-20 px-6 border-t border-white/5 bg-[#050308] rounded-b-[40px] pointer-events-auto">
          <div className="max-w-7xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              {/* <span className="inline-flex items-center gap-2 text-xs font-semibold text-white/30 uppercase tracking-[0.25em] mb-4">
                <span className="w-1.5 h-1.5 rounded-full bg-white/20" /> Get Started
              </span> */}
              <div className="flex items-center gap-6 justify-center mb-6">
                <h2 className="text-5xl md:text-7xl font-light text-white font-serif italic tracking-tight">
                  Ready to Get Started ?
                </h2>
                <motion.div
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
                  style={{ originX: 0 }}
                  className="h-[2px] w-20 bg-white"
                />
              </div>
              <p className="text-base md:text-lg text-white/40 max-w-2xl mx-auto leading-relaxed mb-10">
                Join thousands of students and enterprises already using Rudranex to
                transform the way they work and learn.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <button
                  onClick={() => {
                    if (isLoggedIn) {
                      window.location.href = "/chat";
                    } else {
                      setAuthOpen(true);
                    }
                  }}
                  className="text-sm bg-white text-black px-8 py-3.5 rounded-lg font-medium hover:bg-white/90 transition-all"
                >
                  Start Free Trial
                </button>
                <button onClick={() => window.location.href = "/pricing"} className="text-sm border border-white/10 text-white/70 px-8 py-3.5 rounded-lg font-medium hover:border-white/20 hover:text-white transition-all">
                  View Pricing
                </button>
              </div>
            </motion.div>
          </div>
        </section>

        <div className="pointer-events-auto">
          <Footer />
        </div>
      </div>
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  );
};

export default Index;
