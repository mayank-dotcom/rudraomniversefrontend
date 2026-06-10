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
    Settings,
    Sun,
    Moon,
    Globe,
} from "lucide-react";
import { getApiKey } from "@/lib/auth";
import { useTheme } from "@/lib/theme-context";
import { useTranslation } from "react-i18next";
import i18n from "@/lib/i18n";

// ─── Persona types ────────────────────────────────────────────────────────────
export interface Persona {
    name: string;
    systemPrompt: string;
    predefined: boolean;
    nameKey?: string;
    promptKey?: string;
}

const PREDEFINED_PERSONAS: Persona[] = [
    { name: "Teacher", nameKey: "persona_teacher_name", systemPrompt: "", promptKey: "persona_teacher_prompt", predefined: true },
    { name: "Tutor", nameKey: "persona_tutor_name", systemPrompt: "", promptKey: "persona_tutor_prompt", predefined: true },
    { name: "Interviewer", nameKey: "persona_interviewer_name", systemPrompt: "", promptKey: "persona_interviewer_prompt", predefined: true },
    { name: "Career Coach", nameKey: "persona_career_coach_name", systemPrompt: "", promptKey: "persona_career_coach_prompt", predefined: true },
    { name: "Study Buddy", nameKey: "persona_study_buddy_name", systemPrompt: "", promptKey: "persona_study_buddy_prompt", predefined: true },
    { name: "Explainer", nameKey: "persona_explainer_name", systemPrompt: "", promptKey: "persona_explainer_prompt", predefined: true },
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
type Panel = "general" | "persona" | "faq" | "bug" | "deactivate";

// ─── Props ────────────────────────────────────────────────────────────────────
interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    isDarkMode: boolean;
    isMobile: boolean;
    onPersonaSelect: (persona: Persona) => void;
    currentPersona: Persona | null;
    onDeactivate: () => void;
    userRole: string | null;
    userName: string;
    userEmail: string;
    initialPanel?: Panel;
    onAccentChange?: (color: string) => void;
}

// ─── Persona Panel ─────────────────────────────────────────────────────────
export function PersonaPanel({ isDarkMode, onPersonaSelect, currentPersona, accent }: {
    isDarkMode: boolean;
    onPersonaSelect: (p: Persona) => void;
    currentPersona: Persona | null;
    accent: string;
}) {
    const { t } = useTranslation();
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
                <h3 className={`text-xl font-sans font-bold ${isDarkMode ? "text-white" : "text-black"}`}>{t("persona_mode")}</h3>
                <p className={`text-[11px] font-sans mt-1 ${isDarkMode ? "text-white/40" : "text-black/40"}`}>{t("persona_subtitle")}</p>
            </div>

            {currentPersona && (
                <div className={`flex items-center justify-between p-3.5 rounded-xl border ${isDarkMode ? "border-white/10 bg-white/5" : "border-black/10 bg-black/5"}`}>
                    <div className="flex items-center gap-2.5">
                        <div className={`h-7 w-7 rounded-lg flex items-center justify-center ${isDarkMode ? "bg-white text-black" : "bg-black text-white"}`}>
                            <Sparkles className="h-3.5 w-3.5" />
                        </div>
                        <div>
                            <p className={`text-[11px] font-sans font-bold ${isDarkMode ? "text-white" : "text-black"}`}>{currentPersona.name}</p>
                            <p className={`text-[9px] font-sans ${isDarkMode ? "text-white/40" : "text-black/40"}`}>{t("active_persona")}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => onPersonaSelect({ name: "", systemPrompt: "", predefined: true })}
                        className={`text-[9px] font-sans px-3 py-1.5 rounded-lg border transition-all ${isDarkMode ? "border-white/10 text-white/50 hover:text-white" : "border-black/10 text-black/50 hover:text-black"}`}
                        style={{
                            borderColor: accent ? `${accent}30` : undefined,
                            color: accent ? accent : undefined
                        }}
                    >
                        {t("clear")}
                    </button>
                </div>
            )}

            <div className={`flex border-b ${isDarkMode ? "border-white/10" : "border-black/10"}`}>
                {(["predefined", "custom"] as const).map((tabVal) => (
                    <button
                        key={tabVal}
                        onClick={() => setTab(tabVal)}
                        className={`flex-1 py-2.5 text-[9px] font-sans uppercase tracking-[0.15em] transition-all ${tab === tabVal
                            ? isDarkMode ? (accent ? "font-bold" : "border-b-2 border-white text-white font-bold") : (accent ? "font-bold" : "border-b-2 border-black text-black font-bold")
                            : isDarkMode ? "text-white/40 hover:text-white/70" : "text-black/40 hover:text-black/70"
                        }`}
                        style={{
                            borderBottom: tab === tabVal && accent ? `2px solid ${accent}` : undefined,
                            color: tab === tabVal && accent ? accent : undefined
                        }}
                    >
                        {tabVal === "predefined" ? t("predefined") : t("custom")}
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
                                    ? accent
                                        ? ""
                                        : (isDarkMode ? "bg-white text-black border-white" : "bg-black text-white border-black")
                                    : isDarkMode ? "bg-white/[0.03] border-white/10 text-white/70 hover:border-white/25 hover:bg-white/[0.06]" : "bg-black/[0.02] border-black/10 text-black/70 hover:border-black/25 hover:bg-black/[0.04]"
                                }`}
                                style={{
                                    backgroundColor: isActive && accent ? accent : undefined,
                                    borderColor: isActive && accent ? accent : undefined,
                                    color: isActive && accent ? getContrastColor(accent) : undefined
                                }}
                            >
                                <div className="flex items-center justify-between mb-1.5">
                                    <span className="text-[11px] font-sans font-bold uppercase tracking-widest">{p.nameKey ? t(p.nameKey) : p.name}</span>
                                    {isActive && <Check className="h-3.5 w-3.5 shrink-0" />}
                                </div>
                                <p className="text-[9px] leading-relaxed opacity-60 font-sans line-clamp-2">{p.promptKey ? t(p.promptKey) : p.systemPrompt}</p>
                            </button>
                        );
                    })}
                </div>
            )}

            {tab === "custom" && (
                <div className="space-y-5">
                    <div>
                        <label className={`block text-[9px] font-sans uppercase tracking-[0.2em] ${isDarkMode ? "text-white/40" : "text-black/40"} mb-2`}>{t("persona_name")}</label>
                        <input
                            type="text"
                            value={customName}
                            onChange={(e) => setCustomName(e.target.value)}
                            placeholder={t("persona_name_placeholder")}
                            className={`w-full p-3.5 text-xs font-sans border rounded-xl focus:outline-none transition-all ${isDarkMode
                                ? "bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-white/40"
                                : "bg-black/5 border-black/10 text-black placeholder:text-black/20 focus:border-black/40"
                            }`}
                        />
                    </div>
                    <div>
                        <label className={`block text-[9px] font-sans uppercase tracking-[0.2em] ${isDarkMode ? "text-white/40" : "text-black/40"} mb-2`}>{t("system_prompt")}</label>
                        <textarea
                            value={customPrompt}
                            onChange={(e) => setCustomPrompt(e.target.value)}
                            placeholder={t("system_prompt_placeholder")}
                            rows={5}
                            className={`w-full p-3.5 text-xs font-sans border rounded-xl focus:outline-none transition-all resize-none ${isDarkMode
                                ? "bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-white/40"
                                : "bg-black/5 border-black/10 text-black placeholder:text-black/20 focus:border-black/40"
                            }`}
                        />
                    </div>
                    <button
                        onClick={handleCreateCustom}
                        disabled={!customName.trim() || !customPrompt.trim()}
                        className={`w-full py-3.5 text-[10px] font-sans font-black uppercase tracking-[0.25em] rounded-xl transition-all disabled:opacity-30 flex items-center justify-center gap-2 ${
                            accent
                                ? "hover:opacity-90"
                                : (isDarkMode ? "bg-white text-black hover:bg-white/90" : "bg-black text-white hover:bg-black/90")
                        }`}
                        style={{
                            backgroundColor: accent || undefined,
                            color: accent ? getContrastColor(accent) : undefined
                        }}
                    >
                        <UserPlus className="h-3.5 w-3.5" />
                        {t("create_persona")}
                    </button>
                </div>
            )}
        </div>
    );
}

// ─── Plan Panel ────────────────────────────────────────────────────────────
export function PlanPanel({ isDarkMode, subscription, isSubscriptionLoading, accent }: {
    isDarkMode: boolean;
    subscription: any;
    isSubscriptionLoading: boolean;
    accent: string;
}) {
    const { t } = useTranslation();
    const planName = subscription?.subscription?.plan_name || t("free_trial");
    const tokensRemaining = subscription?.tokens_remaining ?? 0;
    const monthlyTokens = subscription?.subscription?.details?.monthly_tokens || 1;
    const usage = subscription?.usage;

    const metrics = [
        { label: t("chat_code"), used: (usage?.chat_tokens_used ?? 0) + (usage?.coding_tokens_used ?? 0), limit: monthlyTokens },
        { label: t("daily_images_label"), used: usage?.daily_images ?? 0, limit: subscription?.subscription?.details?.daily_image_limit ?? 0 },
        { label: t("tts_minutes"), used: usage?.tts_minutes_used ?? 0, limit: subscription?.subscription?.details?.tts_minutes_limit ?? 0 },
        { label: t("stt_minutes"), used: usage?.stt_minutes_used ?? 0, limit: subscription?.subscription?.details?.stt_minutes_limit ?? 0 },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h3 className={`text-xl font-sans font-bold ${isDarkMode ? "text-white" : "text-black"}`}>{t("plan_details")}</h3>
                <p className={`text-[11px] font-sans mt-1 ${isDarkMode ? "text-white/40" : "text-black/40"}`}>{t("plan_details_subtitle")}</p>
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
                                <p className={`text-sm font-sans font-bold ${isDarkMode ? "text-white" : "text-black"}`}>{planName}</p>
                            )}
                            <p className={`text-[9px] font-sans mt-0.5 ${isDarkMode ? "text-white/40" : "text-black/40"}`}>{t("active_plan")}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className={`text-xl font-sans font-black ${isDarkMode ? "text-white" : "text-black"}`}>
                            {isSubscriptionLoading ? "—" : tokensRemaining.toLocaleString()}
                        </p>
                        <p className={`text-[8px] font-sans ${isDarkMode ? "text-white/40" : "text-black/40"}`}>{t("tokens_left")}</p>
                    </div>
                </div>

                {/* Token Progress */}
                <div className="space-y-1.5">
                    <div className="flex justify-between">
                        <span className={`text-[9px] font-sans ${isDarkMode ? "text-white/40" : "text-black/40"}`}>{t("tokens_remaining")}</span>
                        <span className={`text-[9px] font-sans ${isDarkMode ? "text-white/60" : "text-black/60"}`}>{tokensRemaining} / {monthlyTokens}</span>
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
                            <span className={`text-[10px] font-sans ${isDarkMode ? "text-white/60" : "text-black/60"}`}>{m.label}</span>
                            <span className={`text-[10px] font-sans font-bold ${isDarkMode ? "text-white" : "text-black"}`}>{m.used} <span className={`font-normal opacity-40`}>/ {m.limit || "—"}</span></span>
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
                className={`flex items-center justify-center gap-2 w-full py-3.5 text-[10px] font-sans font-black uppercase tracking-[0.25em] rounded-xl transition-all ${
                    accent
                        ? "hover:opacity-90"
                        : (isDarkMode ? "bg-white text-black hover:bg-white/90" : "bg-black text-white hover:bg-black/90")
                }`}
                style={{
                    backgroundColor: accent || undefined,
                    color: accent ? getContrastColor(accent) : undefined
                }}
            >
                <Zap className="h-3.5 w-3.5 fill-current" />
                {t("upgrade_plan")}
            </a>
        </div>
    );
}

// ─── FAQ Panel ─────────────────────────────────────────────────────────────
function FAQPanel({ isDarkMode }: { isDarkMode: boolean }) {
    const { t } = useTranslation();
    const [open, setOpen] = useState<number | null>(null);

    return (
        <div className="space-y-6">
            <div>
                <h3 className={`text-xl font-sans font-bold ${isDarkMode ? "text-white" : "text-black"}`}>{t("faq")}</h3>
                <p className={`text-[11px] font-sans mt-1 ${isDarkMode ? "text-white/40" : "text-black/40"}`}>{t("faq_subtitle")}</p>
            </div>
            <div className="space-y-2.5">
                {FAQ_ITEMS.map((item, i) => (
                    <div key={i} className={`border rounded-xl overflow-hidden transition-all ${isDarkMode ? "border-white/10" : "border-black/10"}`}>
                        <button
                            onClick={() => setOpen(open === i ? null : i)}
                            className={`w-full flex items-center justify-between p-4 text-left transition-colors ${isDarkMode ? "hover:bg-white/5" : "hover:bg-black/5"}`}
                        >
                            <span className={`text-[11px] font-sans font-medium pr-4 ${isDarkMode ? "text-white/90" : "text-black/90"}`}>{t(`faq_q${i + 1}`)}</span>
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
                                        {t(`faq_a${i + 1}`)}
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
function BugPanel({ isDarkMode, userEmail, accent }: { isDarkMode: boolean; userEmail: string; accent: string }) {
    const { t } = useTranslation();
    const [type, setType] = useState("UI Bug");
    const [desc, setDesc] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState("");

    const issueTypes = [t("ui_bug"), t("chat_not_working"), t("payment_issue"), t("performance_issue"), t("feature_request"), t("other_issue")];

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
            setError(t("failed_submit"));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h3 className={`text-xl font-sans font-bold ${isDarkMode ? "text-white" : "text-black"}`}>{t("bug_report")}</h3>
                <p className={`text-[11px] font-sans mt-1 ${isDarkMode ? "text-white/40" : "text-black/40"}`}>{t("bug_report_subtitle")}</p>
            </div>

            {submitted ? (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`flex flex-col items-center py-10 gap-4 text-center`}
                >
                    <div
                        className={`h-16 w-16 rounded-2xl flex items-center justify-center ${accent ? "" : (isDarkMode ? "bg-white text-black" : "bg-black text-white")}`}
                        style={{
                            backgroundColor: accent || undefined,
                            color: accent ? getContrastColor(accent) : undefined
                        }}
                    >
                        <Check className="h-8 w-8" />
                    </div>
                    <p className={`text-sm font-sans font-bold ${isDarkMode ? "text-white" : "text-black"}`}>{t("report_submitted")}</p>
                    <p className={`text-[11px] font-sans ${isDarkMode ? "text-white/40" : "text-black/40"}`}>{t("report_submitted_desc")}</p>
                    <button
                        onClick={() => setSubmitted(false)}
                        className={`mt-2 text-[9px] font-sans uppercase tracking-[0.15em] px-4 py-2 rounded-lg border transition-all ${isDarkMode ? "border-white/10 text-white/40 hover:text-white" : "border-black/10 text-black/40 hover:text-black"}`}
                        style={{
                            borderColor: accent ? `${accent}30` : undefined,
                            color: accent ? accent : undefined
                        }}
                    >
                        {t("report_another")}
                    </button>
                </motion.div>
            ) : (
                <div className="space-y-5">
                    <div>
                        <label className={`block text-[9px] font-sans uppercase tracking-[0.2em] ${isDarkMode ? "text-white/40" : "text-black/40"} mb-2`}>{t("issue_type")}</label>
                        <div className="grid grid-cols-2 gap-2">
                            {issueTypes.map((t) => (
                                <button
                                    key={t}
                                    onClick={() => setType(t)}
                                    className={`py-2.5 px-3 text-[9px] font-sans rounded-xl border transition-all ${type === t
                                        ? accent
                                            ? "font-bold"
                                            : (isDarkMode ? "bg-white text-black border-white font-bold" : "bg-black text-white border-black font-bold")
                                        : isDarkMode ? "border-white/10 text-white/50 hover:border-white/30 hover:text-white/80" : "border-black/10 text-black/50 hover:border-black/30 hover:text-black/80"
                                    }`}
                                    style={{
                                        backgroundColor: type === t && accent ? accent : undefined,
                                        borderColor: type === t && accent ? accent : undefined,
                                        color: type === t && accent ? getContrastColor(accent) : undefined
                                    }}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className={`block text-[9px] font-sans uppercase tracking-[0.2em] ${isDarkMode ? "text-white/40" : "text-black/40"} mb-2`}>{t("description")}</label>
                        <textarea
                            value={desc}
                            onChange={(e) => setDesc(e.target.value)}
                            placeholder={t("bug_description_placeholder")}
                            rows={5}
                            className={`w-full p-3.5 text-xs font-sans border rounded-xl focus:outline-none transition-all resize-none ${isDarkMode
                                ? "bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-white/40"
                                : "bg-black/5 border-black/10 text-black placeholder:text-black/20 focus:border-black/40"
                            }`}
                        />
                    </div>

                    {error && (
                        <p className="text-[10px] font-sans text-red-400">{error}</p>
                    )}

                    <button
                        onClick={handleSubmit}
                        disabled={!desc.trim() || submitting}
                        className={`w-full py-3.5 text-[10px] font-sans font-black uppercase tracking-[0.25em] rounded-xl transition-all disabled:opacity-30 flex items-center justify-center gap-2 ${
                            accent
                                ? "hover:opacity-90"
                                : (isDarkMode ? "bg-white text-black hover:bg-white/90" : "bg-black text-white hover:bg-black/90")
                        }`}
                        style={{
                            backgroundColor: accent || undefined,
                            color: accent ? getContrastColor(accent) : undefined
                        }}
                    >
                        {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                        {submitting ? t("submitting") : t("submit_report")}
                    </button>
                </div>
            )}
        </div>
    );
}

// ─── Deactivate Panel ──────────────────────────────────────────────────────
function DeactivatePanel({ isDarkMode, onDeactivate, userEmail }: { isDarkMode: boolean; onDeactivate: () => void; userEmail: string }) {
    const { t } = useTranslation();
    const [confirmed, setConfirmed] = useState(false);
    const [inputVal, setInputVal] = useState("");

    const isMatch = inputVal.trim().toLowerCase() === "delete my account";

    return (
        <div className="space-y-6">
            <div>
                <h3 className={`text-xl font-sans font-bold text-red-500`}>{t("deactivate_account")}</h3>
                <p className={`text-[11px] font-sans mt-1 ${isDarkMode ? "text-white/40" : "text-black/40"}`}>{t("deactivate_subtitle")}</p>
            </div>

            <div className={`p-4 rounded-xl border border-red-500/20 ${isDarkMode ? "bg-red-500/5" : "bg-red-500/3"}`}>
                <div className="flex items-start gap-3">
                    <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                    <div className="space-y-1.5">
                        <p className="text-[11px] font-sans font-semibold text-red-500">{t("permanent_warning")}</p>
                        <ul className={`text-[10px] font-sans space-y-1 ${isDarkMode ? "text-white/40" : "text-black/40"}`}>
                            <li>• {t("chats_deleted")}</li>
                            <li>• {t("personas_removed")}</li>
                            <li>• {t("subscription_cancelled")}</li>
                            <li>• Account: <span className="text-red-400">{userEmail}</span></li>
                        </ul>
                    </div>
                </div>
            </div>

            <div>
                <label className={`block text-[9px] font-sans uppercase tracking-[0.15em] mb-2 ${isDarkMode ? "text-white/40" : "text-black/40"}`}>
                    {t("type_to_confirm")}
                </label>
                <input
                    type="text"
                    value={inputVal}
                    onChange={(e) => setInputVal(e.target.value)}
                    placeholder={t("delete_account_placeholder")}
                    className={`w-full p-3.5 text-xs font-sans border rounded-xl focus:outline-none transition-all ${isDarkMode
                        ? "bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-red-500/50"
                        : "bg-black/5 border-black/10 text-black placeholder:text-black/20 focus:border-red-500/50"
                    }`}
                />
            </div>

            <button
                onClick={() => { if (isMatch) onDeactivate(); }}
                disabled={!isMatch}
                className={`w-full py-3.5 text-[10px] font-sans font-black uppercase tracking-[0.2em] rounded-xl transition-all flex items-center justify-center gap-2 ${isMatch
                    ? "bg-red-500 text-white hover:bg-red-600 cursor-pointer"
                    : isDarkMode ? "bg-red-500/10 text-red-500/30 border border-red-500/20 cursor-not-allowed" : "bg-red-500/5 text-red-500/30 border border-red-500/20 cursor-not-allowed"
                }`}
            >
                <Trash2 className="h-3.5 w-3.5" />
                {t("delete_my_account")}
            </button>
        </div>
    );
}

// ─── Accent colour options ─────────────────────────────────────────────────
const ACCENT_COLORS = [
    { name: "Cyan", value: "#00DDDD" },
    { name: "Blue", value: "#3B82F6" },
    { name: "Purple", value: "#8B5CF6" },
    { name: "Green", value: "#10B981" },
    { name: "Orange", value: "#F59E0B" },
    { name: "Pink", value: "#EC4899" },
    { name: "Red", value: "#EF4444" },
    { name: "Black", value: "#000000" },
];

const DEFAULT_ACCENT = "";
const ACCENT_STORAGE_KEY = "rudranex_accent";

function hexToRgb(hex: string): string {
    if (!hex) return "0, 0, 0";
    const h = hex.replace("#", "");
    return `${parseInt(h.substring(0, 2), 16)}, ${parseInt(h.substring(2, 4), 16)}, ${parseInt(h.substring(4, 6), 16)}`;
}

function getContrastColor(hex: string): string {
    if (!hex) return "";
    const h = hex.replace("#", "");
    const r = parseInt(h.substring(0, 2), 16);
    const g = parseInt(h.substring(2, 4), 16);
    const b = parseInt(h.substring(4, 6), 16);
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    return yiq >= 128 ? "#000000" : "#ffffff";
}

function getAccentColor(): string {
    if (typeof window === "undefined") return DEFAULT_ACCENT;
    return localStorage.getItem(ACCENT_STORAGE_KEY) || DEFAULT_ACCENT;
}

function setAccentColor(color: string) {
    if (!color) {
        localStorage.removeItem(ACCENT_STORAGE_KEY);
        if (typeof window !== "undefined") {
            document.documentElement.style.removeProperty("--brand-accent");
            document.documentElement.style.removeProperty("--brand-accent-rgb");
        }
    } else {
        localStorage.setItem(ACCENT_STORAGE_KEY, color);
        if (typeof window !== "undefined") {
            document.documentElement.style.setProperty("--brand-accent", color);
            document.documentElement.style.setProperty("--brand-accent-rgb", hexToRgb(color));
        }
    }
}

function applyStoredAccent() {
    const color = getAccentColor();
    setAccentColor(color);
}


// ─── Settings Custom Dropdown ──────────────────────────────────────────────
interface SettingsDropdownOption {
    label: string | React.ReactNode;
    value: string;
}

interface SettingsDropdownProps {
    value: string;
    onChange: (value: string) => void;
    options: SettingsDropdownOption[];
    isDarkMode: boolean;
    accent?: string;
    widthClass?: string;
    dropUp?: boolean;
}

function SettingsDropdown({ value, onChange, options, isDarkMode, accent, widthClass = "w-48", dropUp }: SettingsDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen]);

    const selectedOption = options.find(opt => opt.value === value) || options[0];

    return (
        <div className="relative" ref={containerRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs border rounded-xl font-medium transition-all duration-200 cursor-pointer ${
                    isDarkMode
                        ? "border-white/10 text-white/90 bg-white/5 hover:bg-white/10 hover:border-white/20"
                        : "border-black/10 text-black/90 bg-black/5 hover:bg-black/10 hover:border-black/20"
                }`}
            >
                <span>{selectedOption.label}</span>
                <ChevronDown className={`w-3.5 h-3.5 opacity-40 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
            </button>

            {isOpen && (
                <div className={`absolute right-0 ${dropUp ? "bottom-full mb-2" : "mt-2"} ${widthClass} max-h-60 overflow-y-auto rounded-xl border p-1 shadow-xl z-[400] backdrop-blur-xl ${
                    isDarkMode
                        ? "bg-[#0d0d0c]/95 border-white/10 text-white"
                        : "bg-white/95 border-black/10 text-black"
                } ${isDarkMode ? "custom-scrollbar" : "light-scrollbar"}`}>
                    {options.map((option) => {
                        const isSelected = option.value === value;
                        const activeTextColor = accent ? accent : undefined;
                        return (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => {
                                    onChange(option.value);
                                    setIsOpen(false);
                                }}
                                className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg text-left transition-colors cursor-pointer ${
                                    isSelected
                                        ? (isDarkMode 
                                            ? "bg-white/5 font-semibold text-white" 
                                            : "bg-black/5 font-semibold text-black")
                                        : (isDarkMode ? "text-white/70 hover:bg-white/5 hover:text-white" : "text-black/70 hover:bg-black/5 hover:text-black")
                                }`}
                                style={isSelected && accent ? { color: accent } : undefined}
                            >
                                <span className="truncate">{option.label}</span>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

// ─── General Panel ────────────────────────────────────────────────────────
interface GeneralPanelProps {
    isDarkMode: boolean;
    accent: string;
    onAccentChange: (color: string) => void;
}

function GeneralPanel({ isDarkMode, accent, onAccentChange }: GeneralPanelProps) {
    const { t } = useTranslation();
    const { toggleTheme } = useTheme();
    const [language, setLanguageState] = useState(() => {
        if (typeof window === "undefined") return "en";
        return localStorage.getItem("rudranex_language") || "en";
    });

    const handleLanguageChange = (val: string) => {
        setLanguageState(val);
        localStorage.setItem("rudranex_language", val);
        i18n.changeLanguage(val);
    };

    const appearanceOptions = [
        { label: t("dark"), value: "dark" },
        { label: t("light"), value: "light" }
    ];

    const accentOptions = [
        { label: "Default", value: "default" },
        ...ACCENT_COLORS.map(c => ({ label: c.name, value: c.value }))
    ];

    const languageOptions = [
        { label: "English", value: "en" },
        { label: "हिन्दी (Hindi)", value: "hi" }
    ];

    return (
        <div className="space-y-6">
            <div>
                <h3 className={`text-xl font-sans font-bold ${isDarkMode ? "text-white" : "text-black"}`}>{t("general")}</h3>
                <p className={`text-[11px] font-sans mt-1 ${isDarkMode ? "text-white/40" : "text-black/40"}`}>{t("customize_experience")}</p>
            </div>

            <div className={`divide-y ${isDarkMode ? "divide-white/10" : "divide-black/10"} font-sans`}>
                {/* Theme / Appearance Row */}
                <div className="py-4 flex items-center justify-between">
                    <div>
                        <h4 className={`text-[13px] font-semibold ${isDarkMode ? "text-white" : "text-black"}`}>{t("appearance")}</h4>
                        <p className={`text-[11px] ${isDarkMode ? "text-white/40" : "text-black/40"} mt-0.5`}>{t("switch_appearance")}</p>
                    </div>
                    <div>
                        <SettingsDropdown
                            value={isDarkMode ? "dark" : "light"}
                            onChange={(val) => {
                                if (val === "dark" && !isDarkMode) toggleTheme();
                                if (val === "light" && isDarkMode) toggleTheme();
                            }}
                            options={appearanceOptions}
                            isDarkMode={isDarkMode}
                            accent={accent}
                        />
                    </div>
                </div>

                {/* Accent Color Row */}
                <div className="py-4 flex items-center justify-between">
                    <div>
                        <h4 className={`text-[13px] font-semibold ${isDarkMode ? "text-white" : "text-black"}`}>{t("accent_color")}</h4>
                        <p className={`text-[11px] ${isDarkMode ? "text-white/40" : "text-black/40"} mt-0.5`}>{t("select_highlight")}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <span
                            className="h-2.5 w-2.5 rounded-full border border-white/10"
                            style={{
                                backgroundColor: accent || (isDarkMode ? "#ffffff" : "#000000"),
                            }}
                        />
                        <SettingsDropdown
                            value={accent || "default"}
                            onChange={(val) => {
                                if (val === "default") {
                                    onAccentChange("");
                                } else {
                                    onAccentChange(val);
                                }
                            }}
                            options={accentOptions}
                            isDarkMode={isDarkMode}
                            accent={accent}
                        />
                    </div>
                </div>

                {/* Language Row */}
                <div className="py-4 flex items-center justify-between">
                    <div>
                        <h4 className={`text-[13px] font-semibold ${isDarkMode ? "text-white" : "text-black"}`}>{t("language")}</h4>
                        <p className={`text-[11px] ${isDarkMode ? "text-white/40" : "text-black/40"} mt-0.5`}>{t("select_language")}</p>
                    </div>
                    <div>
                        <SettingsDropdown
                            value={language}
                            onChange={handleLanguageChange}
                            options={languageOptions}
                            isDarkMode={isDarkMode}
                            accent={accent}
                            dropUp
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Main Modal ────────────────────────────────────────────────────────────
export default function SettingsModal({
    isOpen,
    onClose,
    isDarkMode,
    isMobile,
    onPersonaSelect,
    currentPersona,
    onDeactivate,
    userRole,
    userName,
    userEmail,
    initialPanel = "persona",
    onAccentChange,
}: SettingsModalProps) {
    const { t } = useTranslation();
    const [activePanel, setActivePanel] = useState<Panel>(initialPanel);
    const [accent, setAccent] = useState<string>("");

    useEffect(() => {
        if (isOpen) {
            setActivePanel(initialPanel);
            setAccent(getAccentColor());
            applyStoredAccent();
        }
    }, [isOpen, initialPanel]);

    const navItems: { id: Panel; label: string; icon: any }[] = [
        { id: "general", label: t("general"), icon: Settings },
        { id: "persona", label: t("persona"), icon: Sparkles },
        { id: "faq", label: t("faq"), icon: HelpCircle },
        { id: "bug", label: t("bug_report"), icon: Bug },
        { id: "deactivate", label: t("deactivate"), icon: Trash2 },
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
                    <div className={`absolute inset-0 ${isDarkMode ? "bg-black/80" : "bg-[#f2f1f0]/80"}`} />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.96, y: 16 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: 16 }}
                        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                         className={`relative w-full max-w-3xl rounded-2xl border shadow-2xl overflow-hidden flex ${isMobile ? "flex-col max-h-[90dvh]" : "flex-row max-h-[80vh]"} ${isDarkMode
                            ? "bg-[#0d0d0c] border-white/10"
                            : "bg-[#f2f1f0] border-black/10"
                        }`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Left Nav */}
                        <div className={`${isMobile ? "flex flex-row border-b overflow-x-auto shrink-0" : "flex flex-col w-52 border-r shrink-0 py-4"} ${isDarkMode ? "border-white/8 bg-white/[0.02]" : "border-black/8 bg-black/[0.01]"}`}>
                            {navItems.map(({ id, label, icon: Icon }) => {
                                const isActive = activePanel === id;
                                const isDanger = id === "deactivate";
                                
                                let btnClasses = "";
                                if (isMobile) {
                                    btnClasses = "flex-shrink-0 flex flex-col items-center py-3 px-4 gap-1 transition-all text-[10px] font-sans uppercase tracking-[0.12em]";
                                    if (isActive) {
                                        if (isDanger) {
                                            btnClasses += isDarkMode ? " text-red-500 font-bold bg-red-500/10 rounded-lg" : " text-red-500 font-bold bg-red-500/5 rounded-lg";
                                        } else {
                                            btnClasses += isDarkMode ? " bg-white/8 text-white font-bold rounded-lg px-3 py-3 my-1" : " bg-black/8 text-black font-bold rounded-lg px-3 py-3 my-1";
                                        }
                                    } else {
                                        if (isDanger) {
                                            btnClasses += " text-red-500/50 hover:text-red-500 hover:bg-red-500/5";
                                        } else {
                                            btnClasses += isDarkMode ? " text-white/40 hover:text-white/80 hover:bg-white/5" : " text-black/70 hover:text-black hover:bg-black/5";
                                                                        }
                                                                    }
                                                                } else {
                                                                    btnClasses = "flex items-center gap-3 px-4 py-3 mx-3 my-1 transition-all text-[10px] font-sans uppercase tracking-[0.12em] text-left rounded-xl";
                                                                    if (isActive) {
                                                                        if (isDanger) {
                                                                            btnClasses += isDarkMode ? " text-red-500 font-bold bg-red-500/10" : " text-red-500 font-bold bg-red-500/5";
                                                                        } else {
                                                                            btnClasses += isDarkMode ? " bg-white/8 text-white font-bold" : " bg-black/8 text-black font-bold";
                                                                        }
                                                                    } else {
                                                                        if (isDanger) {
                                                                            btnClasses += isDarkMode ? " text-red-500/50 hover:text-red-500 hover:bg-red-500/5" : " text-red-500/50 hover:text-red-500 hover:bg-red-500/5";
                                                                        } else {
                                                                            btnClasses += isDarkMode ? " text-white/40 hover:text-white/80 hover:bg-white/5" : " text-black/70 hover:text-black hover:bg-black/5";
                                        }
                                    }
                                }

                                const activeBgColor = accent ? `rgba(${hexToRgb(accent)}, 0.15)` : undefined;
                                const activeTextColor = accent ? accent : undefined;

                                return (
                                    <button
                                        key={id}
                                        onClick={() => setActivePanel(id)}
                                        className={btnClasses}
                                        style={
                                            isActive && !isDanger && accent
                                                ? {
                                                      backgroundColor: activeBgColor,
                                                      color: activeTextColor,
                                                  }
                                                : undefined
                                        }
                                    >
                                        <Icon className={`${isMobile ? "h-4 w-4" : "h-3.5 w-3.5"} shrink-0`} />
                                        <span className={isMobile ? "text-[8px]" : ""}>{label}</span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Right Content */}
                        <div className="flex-1 overflow-y-auto scrollbar-hide">
                            <div className="p-6 pb-10 h-full">
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={activePanel}
                                        initial={{ opacity: 0, x: 10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -10 }}
                                        transition={{ duration: 0.15 }}
                                    >
                                        {activePanel === "general" && (
                                            <GeneralPanel
                                                isDarkMode={isDarkMode}
                                                accent={accent}
                                                onAccentChange={(color) => {
                                                    setAccent(color);
                                                    setAccentColor(color);
                                                    onAccentChange?.(color);
                                                }}
                                            />
                                        )}
                                        {activePanel === "persona" && (
                                            <PersonaPanel isDarkMode={isDarkMode} onPersonaSelect={onPersonaSelect} currentPersona={currentPersona} accent={accent} />
                                        )}
                                        {activePanel === "faq" && (
                                            <FAQPanel isDarkMode={isDarkMode} />
                                        )}
                                        {activePanel === "bug" && (
                                            <BugPanel isDarkMode={isDarkMode} userEmail={userEmail} accent={accent} />
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
