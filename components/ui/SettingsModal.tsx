"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    X,
    Sparkles,
    CreditCard,
    HelpCircle,
    Bug,
    Trash2,
    UserPlus,
    Check,
    ChevronDown,
    ChevronRight,
    AlertTriangle,
    Send,
    Loader2,
    Wallet,
    Zap,
} from "lucide-react";
import { getApiKey } from "@/lib/auth";

// ─── Persona types ────────────────────────────────────────────────────────────
export interface Persona {
    name: string;
    systemPrompt: string;
    predefined: boolean;
}

const PREDEFINED_PERSONAS: Persona[] = [
    { name: "Teacher", systemPrompt: "You are a knowledgeable teacher who explains concepts thoroughly with examples, analogies, and structured lessons. Adapt your teaching style to the student's level.", predefined: true },
    { name: "Tutor", systemPrompt: "You are a patient tutor who guides students step-by-step without giving direct answers. Ask probing questions to help them discover solutions themselves.", predefined: true },
    { name: "Interviewer", systemPrompt: "You are a professional interviewer conducting a mock interview. Ask relevant questions, evaluate answers, provide constructive feedback, and track the candidate's performance.", predefined: true },
    { name: "Career Coach", systemPrompt: "You are a career coach providing professional advice on career paths, skill development, resume building, and interview preparation. Be practical and encouraging.", predefined: true },
    { name: "Study Buddy", systemPrompt: "You are a friendly study buddy who makes learning collaborative and fun. Use casual language, share tips, and help with revision in an engaging way.", predefined: true },
    { name: "Explainer", systemPrompt: "You are an expert at simplifying complex topics. Break down difficult concepts into simple terms using everyday examples. Assume no prior knowledge.", predefined: true },
];

const FAQ_ITEMS = [
    { q: "How do I upgrade my plan?", a: "Go to the Pricing page from the sidebar or visit rudranex.com/pricing. You can upgrade anytime and the new plan activates immediately." },
    { q: "Are my conversations private?", a: "Yes. Your chats are encrypted and stored securely. We never share your data with third parties. You can delete all your chat history at any time." },
    { q: "What is Persona Mode?", a: "Persona Mode lets you configure the AI to adopt a specific role (e.g., Teacher, Career Coach) so every response is tailored to that style and context." },
    { q: "How do I reset my usage limits?", a: "Usage limits reset automatically at the start of each billing cycle (monthly). Daily limits reset every midnight IST." },
    { q: "Can I export my chats?", a: "Chat export is coming soon. You can currently copy individual messages using the copy button on any AI response." },
    { q: "How do I cancel my subscription?", a: "You can use the 'Deactivate Account' option in settings to discontinue your account and stop billing. For cancellation only, contact support@rudranex.com." },
    { q: "What happens to my data if I deactivate?", a: "All your chats, personas, and account data are permanently deleted. This action is irreversible — make sure you've saved anything important before proceeding." },
];

// ─── Panel IDs ────────────────────────────────────────────────────────────────
type Panel = "persona" | "plan" | "faq" | "bug" | "deactivate";

// ─── Props ────────────────────────────────────────────────────────────────────
interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    isDarkMode: boolean;
    isMobile: boolean;
    subscription: any;
    isSubscriptionLoading: boolean;
    onPersonaSelect: (persona: Persona) => void;
    currentPersona: Persona | null;
    onDeactivate: () => void;
    userRole: string | null;
    userName: string;
    userEmail: string;
    initialPanel?: Panel;
}

// ─── Persona Panel ─────────────────────────────────────────────────────────
function PersonaPanel({ isDarkMode, onPersonaSelect, currentPersona }: {
    isDarkMode: boolean;
    onPersonaSelect: (p: Persona) => void;
    currentPersona: Persona | null;
}) {
    const [tab, setTab] = useState<"predefined" | "custom">("predefined");
    const [customName, setCustomName] = useState("");
    const [customPrompt, setCustomPrompt] = useState("");

    const handleCreateCustom = () => {
        if (!customName.trim() || !customPrompt.trim()) return;
        onPersonaSelect({ name: customName.trim(), systemPrompt: customPrompt.trim(), predefined: false });
    };

    return (
        <div className="space-y-6">
            <div>
                <h3 className={`text-xl font-serif font-bold ${isDarkMode ? "text-white" : "text-black"}`}>Persona Mode</h3>
                <p className={`text-[11px] font-mono mt-1 ${isDarkMode ? "text-white/40" : "text-black/40"}`}>Configure how the AI behaves in every conversation</p>
            </div>

            {currentPersona && (
                <div className={`flex items-center justify-between p-3.5 rounded-xl border ${isDarkMode ? "border-white/10 bg-white/5" : "border-black/10 bg-black/5"}`}>
                    <div className="flex items-center gap-2.5">
                        <div className={`h-7 w-7 rounded-lg flex items-center justify-center ${isDarkMode ? "bg-white text-black" : "bg-black text-white"}`}>
                            <Sparkles className="h-3.5 w-3.5" />
                        </div>
                        <div>
                            <p className={`text-[11px] font-mono font-bold ${isDarkMode ? "text-white" : "text-black"}`}>{currentPersona.name}</p>
                            <p className={`text-[9px] font-mono ${isDarkMode ? "text-white/40" : "text-black/40"}`}>Active Persona</p>
                        </div>
                    </div>
                    <button
                        onClick={() => onPersonaSelect({ name: "", systemPrompt: "", predefined: true })}
                        className={`text-[9px] font-mono px-3 py-1.5 rounded-lg border transition-all ${isDarkMode ? "border-white/10 text-white/50 hover:text-white hover:border-white/30" : "border-black/10 text-black/50 hover:text-black hover:border-black/30"}`}
                    >
                        Clear
                    </button>
                </div>
            )}

            <div className={`flex border-b ${isDarkMode ? "border-white/10" : "border-black/10"}`}>
                {(["predefined", "custom"] as const).map((t) => (
                    <button
                        key={t}
                        onClick={() => setTab(t)}
                        className={`flex-1 py-2.5 text-[9px] font-mono uppercase tracking-[0.15em] transition-all ${tab === t
                            ? isDarkMode ? "border-b-2 border-white text-white font-bold" : "border-b-2 border-black text-black font-bold"
                            : isDarkMode ? "text-white/40 hover:text-white/70" : "text-black/40 hover:text-black/70"
                        }`}
                    >
                        {t === "predefined" ? "Predefined" : "Custom"}
                    </button>
                ))}
            </div>

            {tab === "predefined" && (
                <div className="grid grid-cols-1 gap-2.5">
                    {PREDEFINED_PERSONAS.map((p) => {
                        const isActive = currentPersona?.name === p.name;
                        return (
                            <button
                                key={p.name}
                                onClick={() => onPersonaSelect(p)}
                                className={`w-full text-left p-4 rounded-xl border transition-all ${isActive
                                    ? isDarkMode ? "bg-white text-black border-white" : "bg-black text-white border-black"
                                    : isDarkMode ? "bg-white/[0.03] border-white/10 text-white/70 hover:border-white/25 hover:bg-white/[0.06]" : "bg-black/[0.02] border-black/10 text-black/70 hover:border-black/25 hover:bg-black/[0.04]"
                                }`}
                            >
                                <div className="flex items-center justify-between mb-1.5">
                                    <span className="text-[11px] font-mono font-bold uppercase tracking-widest">{p.name}</span>
                                    {isActive && <Check className="h-3.5 w-3.5 shrink-0" />}
                                </div>
                                <p className="text-[9px] leading-relaxed opacity-60 font-sans line-clamp-2">{p.systemPrompt}</p>
                            </button>
                        );
                    })}
                </div>
            )}

            {tab === "custom" && (
                <div className="space-y-5">
                    <div>
                        <label className={`block text-[9px] font-mono uppercase tracking-[0.2em] ${isDarkMode ? "text-white/40" : "text-black/40"} mb-2`}>Persona Name</label>
                        <input
                            type="text"
                            value={customName}
                            onChange={(e) => setCustomName(e.target.value)}
                            placeholder="e.g. Code Mentor, Math Genius..."
                            className={`w-full p-3.5 text-xs font-mono border rounded-xl focus:outline-none transition-all ${isDarkMode
                                ? "bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-white/40"
                                : "bg-black/5 border-black/10 text-black placeholder:text-black/20 focus:border-black/40"
                            }`}
                        />
                    </div>
                    <div>
                        <label className={`block text-[9px] font-mono uppercase tracking-[0.2em] ${isDarkMode ? "text-white/40" : "text-black/40"} mb-2`}>System Prompt</label>
                        <textarea
                            value={customPrompt}
                            onChange={(e) => setCustomPrompt(e.target.value)}
                            placeholder="Describe how this AI persona should behave..."
                            rows={5}
                            className={`w-full p-3.5 text-xs font-mono border rounded-xl focus:outline-none transition-all resize-none ${isDarkMode
                                ? "bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-white/40"
                                : "bg-black/5 border-black/10 text-black placeholder:text-black/20 focus:border-black/40"
                            }`}
                        />
                    </div>
                    <button
                        onClick={handleCreateCustom}
                        disabled={!customName.trim() || !customPrompt.trim()}
                        className={`w-full py-3.5 text-[10px] font-mono font-black uppercase tracking-[0.25em] rounded-xl transition-all disabled:opacity-30 flex items-center justify-center gap-2 ${isDarkMode ? "bg-white text-black hover:bg-white/90" : "bg-black text-white hover:bg-black/90"}`}
                    >
                        <UserPlus className="h-3.5 w-3.5" />
                        Create Persona
                    </button>
                </div>
            )}
        </div>
    );
}

// ─── Plan Panel ────────────────────────────────────────────────────────────
function PlanPanel({ isDarkMode, subscription, isSubscriptionLoading }: {
    isDarkMode: boolean;
    subscription: any;
    isSubscriptionLoading: boolean;
}) {
    const planName = subscription?.subscription?.plan_name || "Free Trial";
    const tokensRemaining = subscription?.tokens_remaining ?? 0;
    const monthlyTokens = subscription?.subscription?.details?.monthly_tokens || 1;
    const usage = subscription?.usage;

    const metrics = [
        { label: "Chat + Code Tokens", used: (usage?.chat_tokens_used ?? 0) + (usage?.coding_tokens_used ?? 0), limit: monthlyTokens },
        { label: "Daily Images", used: usage?.daily_images ?? 0, limit: subscription?.subscription?.details?.daily_image_limit ?? 0 },
        { label: "TTS Minutes", used: usage?.tts_minutes_used ?? 0, limit: subscription?.subscription?.details?.tts_minutes_limit ?? 0 },
        { label: "STT Minutes", used: usage?.stt_minutes_used ?? 0, limit: subscription?.subscription?.details?.stt_minutes_limit ?? 0 },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h3 className={`text-xl font-serif font-bold ${isDarkMode ? "text-white" : "text-black"}`}>Plan Details</h3>
                <p className={`text-[11px] font-mono mt-1 ${isDarkMode ? "text-white/40" : "text-black/40"}`}>Your current subscription and usage</p>
            </div>

            {/* Plan Badge */}
            <div className={`p-5 rounded-2xl border ${isDarkMode ? "border-white/10 bg-white/[0.03]" : "border-black/10 bg-black/[0.02]"}`}>
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${isDarkMode ? "bg-white text-black" : "bg-black text-white"}`}>
                            <CreditCard className="h-5 w-5" />
                        </div>
                        <div>
                            {isSubscriptionLoading ? (
                                <div className={`h-4 w-24 rounded ${isDarkMode ? "bg-white/10" : "bg-black/10"} animate-pulse`} />
                            ) : (
                                <p className={`text-sm font-serif font-bold ${isDarkMode ? "text-white" : "text-black"}`}>{planName}</p>
                            )}
                            <p className={`text-[9px] font-mono mt-0.5 ${isDarkMode ? "text-white/40" : "text-black/40"}`}>Active Plan</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className={`text-xl font-mono font-black ${isDarkMode ? "text-white" : "text-black"}`}>
                            {isSubscriptionLoading ? "—" : tokensRemaining.toLocaleString()}
                        </p>
                        <p className={`text-[8px] font-mono ${isDarkMode ? "text-white/40" : "text-black/40"}`}>TOKENS LEFT</p>
                    </div>
                </div>

                {/* Token Progress */}
                <div className="space-y-1.5">
                    <div className="flex justify-between">
                        <span className={`text-[9px] font-mono ${isDarkMode ? "text-white/40" : "text-black/40"}`}>Tokens Remaining</span>
                        <span className={`text-[9px] font-mono ${isDarkMode ? "text-white/60" : "text-black/60"}`}>{tokensRemaining} / {monthlyTokens}</span>
                    </div>
                    <div className={`h-1.5 rounded-full overflow-hidden ${isDarkMode ? "bg-white/10" : "bg-black/10"}`}>
                        <div
                            className={`h-full rounded-full transition-all duration-700 ${isDarkMode ? "bg-white" : "bg-black"}`}
                            style={{ width: `${Math.min(100, (tokensRemaining / monthlyTokens) * 100)}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Usage Metrics */}
            <div className="space-y-3">
                {metrics.map((m) => (
                    <div key={m.label} className={`p-4 rounded-xl border ${isDarkMode ? "border-white/8 bg-white/[0.02]" : "border-black/8 bg-black/[0.01]"}`}>
                        <div className="flex justify-between items-center mb-2">
                            <span className={`text-[10px] font-mono ${isDarkMode ? "text-white/60" : "text-black/60"}`}>{m.label}</span>
                            <span className={`text-[10px] font-mono font-bold ${isDarkMode ? "text-white" : "text-black"}`}>{m.used} <span className={`font-normal opacity-40`}>/ {m.limit || "—"}</span></span>
                        </div>
                        {m.limit > 0 && (
                            <div className={`h-1 rounded-full overflow-hidden ${isDarkMode ? "bg-white/10" : "bg-black/10"}`}>
                                <div
                                    className={`h-full rounded-full ${isDarkMode ? "bg-white/60" : "bg-black/60"}`}
                                    style={{ width: `${Math.min(100, (m.used / m.limit) * 100)}%` }}
                                />
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <a
                href="/pricing"
                className={`flex items-center justify-center gap-2 w-full py-3.5 text-[10px] font-mono font-black uppercase tracking-[0.25em] rounded-xl transition-all ${isDarkMode ? "bg-white text-black hover:bg-white/90" : "bg-black text-white hover:bg-black/90"}`}
            >
                <Zap className="h-3.5 w-3.5 fill-current" />
                Upgrade Plan
            </a>
        </div>
    );
}

// ─── FAQ Panel ─────────────────────────────────────────────────────────────
function FAQPanel({ isDarkMode }: { isDarkMode: boolean }) {
    const [open, setOpen] = useState<number | null>(null);

    return (
        <div className="space-y-6">
            <div>
                <h3 className={`text-xl font-serif font-bold ${isDarkMode ? "text-white" : "text-black"}`}>FAQ</h3>
                <p className={`text-[11px] font-mono mt-1 ${isDarkMode ? "text-white/40" : "text-black/40"}`}>Frequently asked questions</p>
            </div>
            <div className="space-y-2.5">
                {FAQ_ITEMS.map((item, i) => (
                    <div key={i} className={`border rounded-xl overflow-hidden transition-all ${isDarkMode ? "border-white/10" : "border-black/10"}`}>
                        <button
                            onClick={() => setOpen(open === i ? null : i)}
                            className={`w-full flex items-center justify-between p-4 text-left transition-colors ${isDarkMode ? "hover:bg-white/5" : "hover:bg-black/5"}`}
                        >
                            <span className={`text-[11px] font-sans font-medium pr-4 ${isDarkMode ? "text-white/90" : "text-black/90"}`}>{item.q}</span>
                            {open === i
                                ? <ChevronDown className={`h-3.5 w-3.5 shrink-0 ${isDarkMode ? "text-white/40" : "text-black/40"}`} />
                                : <ChevronRight className={`h-3.5 w-3.5 shrink-0 ${isDarkMode ? "text-white/40" : "text-black/40"}`} />
                            }
                        </button>
                        <AnimatePresence>
                            {open === i && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="overflow-hidden"
                                >
                                    <p className={`px-4 pb-4 text-[11px] font-sans leading-relaxed ${isDarkMode ? "text-white/50" : "text-black/50"}`}>
                                        {item.a}
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Bug Report Panel ──────────────────────────────────────────────────────
function BugPanel({ isDarkMode, userEmail }: { isDarkMode: boolean; userEmail: string }) {
    const [type, setType] = useState("UI Bug");
    const [desc, setDesc] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState("");

    const issueTypes = ["UI Bug", "Chat Not Working", "Payment Issue", "Performance Issue", "Feature Request", "Other"];

    const handleSubmit = async () => {
        if (!desc.trim()) return;
        setSubmitting(true);
        setError("");
        try {
            const API_BASE = process.env.NEXT_PUBLIC_BASE_URL!;
            const apiKey = getApiKey();
            await fetch(`${API_BASE}/user/bug-report`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": apiKey || "",
                },
                body: JSON.stringify({ issue_type: type, description: desc, reporter_email: userEmail }),
            });
            setSubmitted(true);
            setDesc("");
        } catch {
            setError("Failed to submit. Please try emailing support@rudranex.com");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h3 className={`text-xl font-serif font-bold ${isDarkMode ? "text-white" : "text-black"}`}>Bug Report</h3>
                <p className={`text-[11px] font-mono mt-1 ${isDarkMode ? "text-white/40" : "text-black/40"}`}>Help us improve by reporting issues</p>
            </div>

            {submitted ? (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`flex flex-col items-center py-10 gap-4 text-center`}
                >
                    <div className={`h-16 w-16 rounded-2xl flex items-center justify-center ${isDarkMode ? "bg-white text-black" : "bg-black text-white"}`}>
                        <Check className="h-8 w-8" />
                    </div>
                    <p className={`text-sm font-serif font-bold ${isDarkMode ? "text-white" : "text-black"}`}>Report Submitted!</p>
                    <p className={`text-[11px] font-mono ${isDarkMode ? "text-white/40" : "text-black/40"}`}>Our team will look into this shortly.</p>
                    <button
                        onClick={() => setSubmitted(false)}
                        className={`mt-2 text-[9px] font-mono uppercase tracking-[0.15em] px-4 py-2 rounded-lg border transition-all ${isDarkMode ? "border-white/10 text-white/40 hover:text-white hover:border-white/30" : "border-black/10 text-black/40 hover:text-black hover:border-black/30"}`}
                    >
                        Report Another
                    </button>
                </motion.div>
            ) : (
                <div className="space-y-5">
                    <div>
                        <label className={`block text-[9px] font-mono uppercase tracking-[0.2em] ${isDarkMode ? "text-white/40" : "text-black/40"} mb-2`}>Issue Type</label>
                        <div className="grid grid-cols-2 gap-2">
                            {issueTypes.map((t) => (
                                <button
                                    key={t}
                                    onClick={() => setType(t)}
                                    className={`py-2.5 px-3 text-[9px] font-mono rounded-xl border transition-all ${type === t
                                        ? isDarkMode ? "bg-white text-black border-white font-bold" : "bg-black text-white border-black font-bold"
                                        : isDarkMode ? "border-white/10 text-white/50 hover:border-white/30 hover:text-white/80" : "border-black/10 text-black/50 hover:border-black/30 hover:text-black/80"
                                    }`}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className={`block text-[9px] font-mono uppercase tracking-[0.2em] ${isDarkMode ? "text-white/40" : "text-black/40"} mb-2`}>Description</label>
                        <textarea
                            value={desc}
                            onChange={(e) => setDesc(e.target.value)}
                            placeholder="Describe the issue in detail — what happened, what you expected, and steps to reproduce..."
                            rows={5}
                            className={`w-full p-3.5 text-xs font-mono border rounded-xl focus:outline-none transition-all resize-none ${isDarkMode
                                ? "bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-white/40"
                                : "bg-black/5 border-black/10 text-black placeholder:text-black/20 focus:border-black/40"
                            }`}
                        />
                    </div>

                    {error && (
                        <p className="text-[10px] font-mono text-red-400">{error}</p>
                    )}

                    <button
                        onClick={handleSubmit}
                        disabled={!desc.trim() || submitting}
                        className={`w-full py-3.5 text-[10px] font-mono font-black uppercase tracking-[0.25em] rounded-xl transition-all disabled:opacity-30 flex items-center justify-center gap-2 ${isDarkMode ? "bg-white text-black hover:bg-white/90" : "bg-black text-white hover:bg-black/90"}`}
                    >
                        {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                        {submitting ? "Submitting..." : "Submit Report"}
                    </button>
                </div>
            )}
        </div>
    );
}

// ─── Deactivate Panel ──────────────────────────────────────────────────────
function DeactivatePanel({ isDarkMode, onDeactivate, userEmail }: { isDarkMode: boolean; onDeactivate: () => void; userEmail: string }) {
    const [confirmed, setConfirmed] = useState(false);
    const [inputVal, setInputVal] = useState("");

    const isMatch = inputVal.trim().toLowerCase() === "delete my account";

    return (
        <div className="space-y-6">
            <div>
                <h3 className={`text-xl font-serif font-bold text-red-500`}>Deactivate Account</h3>
                <p className={`text-[11px] font-mono mt-1 ${isDarkMode ? "text-white/40" : "text-black/40"}`}>Permanently delete your account and all data</p>
            </div>

            <div className={`p-4 rounded-xl border border-red-500/20 ${isDarkMode ? "bg-red-500/5" : "bg-red-500/3"}`}>
                <div className="flex items-start gap-3">
                    <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                    <div className="space-y-1.5">
                        <p className="text-[11px] font-sans font-semibold text-red-500">This action is permanent and cannot be undone.</p>
                        <ul className={`text-[10px] font-mono space-y-1 ${isDarkMode ? "text-white/40" : "text-black/40"}`}>
                            <li>• All your chats will be deleted</li>
                            <li>• All custom personas will be removed</li>
                            <li>• Your subscription will be cancelled</li>
                            <li>• Account: <span className="text-red-400">{userEmail}</span></li>
                        </ul>
                    </div>
                </div>
            </div>

            <div>
                <label className={`block text-[9px] font-mono uppercase tracking-[0.15em] mb-2 ${isDarkMode ? "text-white/40" : "text-black/40"}`}>
                    Type <span className="text-red-400 font-bold">delete my account</span> to confirm
                </label>
                <input
                    type="text"
                    value={inputVal}
                    onChange={(e) => setInputVal(e.target.value)}
                    placeholder="delete my account"
                    className={`w-full p-3.5 text-xs font-mono border rounded-xl focus:outline-none transition-all ${isDarkMode
                        ? "bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-red-500/50"
                        : "bg-black/5 border-black/10 text-black placeholder:text-black/20 focus:border-red-500/50"
                    }`}
                />
            </div>

            <button
                onClick={() => { if (isMatch) onDeactivate(); }}
                disabled={!isMatch}
                className={`w-full py-3.5 text-[10px] font-mono font-black uppercase tracking-[0.2em] rounded-xl transition-all flex items-center justify-center gap-2 ${isMatch
                    ? "bg-red-500 text-white hover:bg-red-600 cursor-pointer"
                    : isDarkMode ? "bg-red-500/10 text-red-500/30 border border-red-500/20 cursor-not-allowed" : "bg-red-500/5 text-red-500/30 border border-red-500/20 cursor-not-allowed"
                }`}
            >
                <Trash2 className="h-3.5 w-3.5" />
                Delete My Account
            </button>
        </div>
    );
}

// ─── Main Modal ────────────────────────────────────────────────────────────
export default function SettingsModal({
    isOpen,
    onClose,
    isDarkMode,
    isMobile,
    subscription,
    isSubscriptionLoading,
    onPersonaSelect,
    currentPersona,
    onDeactivate,
    userRole,
    userName,
    userEmail,
    initialPanel = "persona",
}: SettingsModalProps) {
    const [activePanel, setActivePanel] = useState<Panel>(initialPanel);

    useEffect(() => {
        if (isOpen) setActivePanel(initialPanel);
    }, [isOpen, initialPanel]);

    const navItems: { id: Panel; label: string; icon: any }[] = [
        { id: "persona", label: "Persona", icon: Sparkles },
        { id: "plan", label: "Plan Details", icon: CreditCard },
        { id: "faq", label: "FAQ", icon: HelpCircle },
        { id: "bug", label: "Bug Report", icon: Bug },
        { id: "deactivate", label: "Deactivate", icon: Trash2 },
    ];

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="fixed inset-0 z-[300] flex items-center justify-center p-4"
                    onClick={onClose}
                >
                    {/* Backdrop */}
                    <div className={`absolute inset-0 backdrop-blur-md ${isDarkMode ? "bg-black/80" : "bg-white/80"}`} />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.96, y: 16 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: 16 }}
                        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                        className={`relative w-full max-w-3xl rounded-2xl border shadow-2xl overflow-hidden flex ${isMobile ? "flex-col max-h-[90dvh]" : "flex-row h-[580px]"} ${isDarkMode
                            ? "bg-[#0d0d0c] border-white/10"
                            : "bg-white border-black/10"
                        }`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Left Nav */}
                        <div className={`${isMobile ? "flex flex-row border-b overflow-x-auto shrink-0" : "flex flex-col w-52 border-r shrink-0"} ${isDarkMode ? "border-white/8 bg-white/[0.02]" : "border-black/8 bg-black/[0.01]"}`}>
                            {/* Header */}
                            {!isMobile && (
                                <div className="px-5 py-5 border-b border-inherit">
                                    <p className={`text-xs font-serif font-bold ${isDarkMode ? "text-white" : "text-black"}`}>Settings</p>
                                    <p className={`text-[9px] font-mono mt-0.5 ${isDarkMode ? "text-white/30" : "text-black/30"}`}>{userName || "User"}</p>
                                </div>
                            )}
                            {navItems.map(({ id, label, icon: Icon }) => {
                                const isActive = activePanel === id;
                                const isDanger = id === "deactivate";
                                return (
                                    <button
                                        key={id}
                                        onClick={() => setActivePanel(id)}
                                        className={`${isMobile ? "flex-shrink-0 flex flex-col items-center py-3 px-4 gap-1" : "flex items-center gap-3 px-5 py-3.5 w-full text-left"} transition-all text-[10px] font-mono uppercase tracking-[0.12em] ${
                                            isActive
                                                ? isDanger
                                                    ? "text-red-500 font-bold" + (isDarkMode ? " bg-red-500/10" : " bg-red-500/5")
                                                    : isDarkMode ? "bg-white/8 text-white font-bold border-r-2 border-white" : "bg-black/8 text-black font-bold border-r-2 border-black"
                                                : isDanger
                                                    ? isDarkMode ? "text-red-500/50 hover:text-red-500 hover:bg-red-500/5" : "text-red-500/50 hover:text-red-500 hover:bg-red-500/5"
                                                    : isDarkMode ? "text-white/40 hover:text-white/80 hover:bg-white/5" : "text-black/40 hover:text-black/80 hover:bg-black/5"
                                        }`}
                                    >
                                        <Icon className={`${isMobile ? "h-4 w-4" : "h-3.5 w-3.5"} shrink-0`} />
                                        <span className={isMobile ? "text-[8px]" : ""}>{label}</span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Right Content */}
                        <div className="flex-1 overflow-y-auto">
                            <div className="p-6 h-full">
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={activePanel}
                                        initial={{ opacity: 0, x: 10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -10 }}
                                        transition={{ duration: 0.15 }}
                                    >
                                        {activePanel === "persona" && (
                                            <PersonaPanel isDarkMode={isDarkMode} onPersonaSelect={onPersonaSelect} currentPersona={currentPersona} />
                                        )}
                                        {activePanel === "plan" && (
                                            <PlanPanel isDarkMode={isDarkMode} subscription={subscription} isSubscriptionLoading={isSubscriptionLoading} />
                                        )}
                                        {activePanel === "faq" && (
                                            <FAQPanel isDarkMode={isDarkMode} />
                                        )}
                                        {activePanel === "bug" && (
                                            <BugPanel isDarkMode={isDarkMode} userEmail={userEmail} />
                                        )}
                                        {activePanel === "deactivate" && (
                                            <DeactivatePanel isDarkMode={isDarkMode} onDeactivate={() => { onDeactivate(); onClose(); }} userEmail={userEmail} />
                                        )}
                                    </motion.div>
                                </AnimatePresence>
                            </div>
                        </div>

                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className={`absolute top-4 right-4 p-2 rounded-xl transition-all z-10 ${isDarkMode ? "text-white/30 hover:text-white hover:bg-white/10" : "text-black/30 hover:text-black hover:bg-black/10"}`}
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
