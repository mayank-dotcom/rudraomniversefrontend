"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Send, Bot, User, LogOut, MessageSquare, Plus, Search,
    ChevronLeft, ChevronRight, Moon, Sun, GraduationCap,
    UserCog, Mic, ChevronUp,
    ThumbsUp, ThumbsDown, RotateCcw, Edit3, Copy, Clock, Trash2, Inbox,
    Paperclip, X, ImageIcon, FileDown, FileText as FileIcon, Sparkles,
    Swords, CheckCircle, XCircle, Code, Zap, Pause
} from "lucide-react";
import Link from "next/link";
import { Poppins, Roboto, Space_Grotesk } from "next/font/google";
import { isAuthenticated, getApiKey, removeApiKey, getUserInfo, removeUserInfo, getUserRole } from "@/lib/auth";
import { useTheme } from "@/lib/theme-context";
import {
    ChatSummary,
    createChat,
    deleteChat,
    updateChat,
    getChatHistory,
    listChats,
    saveChatMessage,
    sendChatCompletion,
    sendAiRequest,
    sendAiRequestStream,
    sendMessageFeedback,
    getSubscriptionStatus,
    getPlanFeatures,
    getFeatureIdForEngine
} from "@/lib/chat-api";
import { processFile, ProcessedFile } from "@/lib/file-processor";
import { toast } from "sonner";

import ChatLoader from "@/components/ui/ChatLoader";
import DotsLoader from "@/components/ui/DotsLoader";
import MarkdownRenderer from "@/components/ui/MarkdownRenderer";
import InterviewPrepModal from "@/components/InterviewPrepModal";
import MockPaperModal, { MockPaperConfig } from "@/components/MockPaperModal";
import MockPaperView from "@/components/MockPaperView";
import MCQQuizView from "@/components/MCQQuizView";
import type { MCQQuestion } from "@/components/MCQQuizView";
import PersonaModal, { type Persona } from "@/components/PersonaModal";
import BattleArenaModal from "@/components/BattleArenaModal";
import { GraduationCap as MockIcon } from "lucide-react";
import WelcomeBox from "@/components/ui/WelcomeBox";

interface Message {
    role: "user" | "assistant" | "system";
    content: string;
    timestamp: string;
    localOnly?: boolean;
    messageId?: string;
    feedback?: number;
}

const WELCOME_CONTENT = "Welcome to Rudranex AI. I am your study-pilot. How can I assist your learning journey today?";
const ACTIVE_CHAT_STORAGE_KEY = "rudranex_active_chat_id";
const IMAGE_HISTORY_KEY = "rudranex_image_history";
const MAX_IMAGE_HISTORY = 30;

const getImageHistory = (): Message[] => {
    if (typeof window === "undefined") return [];
    try {
        const raw = window.localStorage.getItem(IMAGE_HISTORY_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch { return []; }
};

const saveImageToHistory = (userMsg: Message, assistantMsg: Message) => {
    if (typeof window === "undefined") return;
    try {
        const history = getImageHistory();
        history.push(userMsg, assistantMsg);
        if (history.length > MAX_IMAGE_HISTORY * 2) {
            history.splice(0, history.length - MAX_IMAGE_HISTORY * 2);
        }
        window.localStorage.setItem(IMAGE_HISTORY_KEY, JSON.stringify(history));
    } catch { /* ignore storage errors */ }
};

const chatHeadingFont = Poppins({
    subsets: ["latin"],
    weight: ["400", "500", "600", "700", "800"],
    variable: "--font-chat-heading",
});

const chatBodyFont = Roboto({
    subsets: ["latin"],
    weight: ["400", "500", "700"],
    variable: "--font-chat-body",
});

const chatAccentFont = Space_Grotesk({
    subsets: ["latin"],
    weight: ["400", "500", "700"],
    variable: "--font-chat-accent",
});

const getWelcomeMessages = (): Message[] => [
    {
        role: "assistant",
        content: WELCOME_CONTENT,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        localOnly: true
    }
];

const formatTimestamp = (value?: string) =>
    new Date(value || Date.now()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const isImageContent = (content: string): boolean => {
    if (!content) return false;
    const trimmed = content.trim();
    if (trimmed.startsWith("data:image/")) return true;
    if (/^https?:\/\/[^\s]+$/i.test(trimmed)) {
        if (trimmed.includes("pollinations.ai") || /\.(png|jpe?g|gif|webp|svg|bmp)(\?.*)?$/i.test(trimmed)) {
            return true;
        }
    }
    return false;
};

const buildChatTitle = (value: string) => {
    const normalized = value.trim().replace(/\s+/g, " ");
    if (!normalized) return "New Chat";
    return normalized.length > 40 ? `${normalized.slice(0, 40)}...` : normalized;
};

const getStoredActiveChatId = () => {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(ACTIVE_CHAT_STORAGE_KEY);
};

const setStoredActiveChatId = (chatId: string | null) => {
    if (typeof window === "undefined") return;

    if (chatId) {
        window.localStorage.setItem(ACTIVE_CHAT_STORAGE_KEY, chatId);
        return;
    }

    window.localStorage.removeItem(ACTIVE_CHAT_STORAGE_KEY);
};

const IMAGE_STYLES = [
    { id: "monochrome", label: "Monochrome", prompt: "Create a highly dramatic, high-contrast monochrome fine-art photograph with strong studio shadows, detailed textures, and timeless grayscale tones. ", sample: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80" },
    { id: "colour-block", label: "Colour block", prompt: "Create a minimalist color block digital artwork with bold contrasting solid colors, geometric shapes, and a highly aesthetic clean composition. ", sample: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=600&q=80" },
    { id: "runway", label: "Runway", prompt: "Create a high-fashion runway editorial photograph featuring a model walking under dramatic moody spotlighting, rich ambient mist, and highly saturated vintage color-grading. ", sample: "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=600&q=80" },
    { id: "risograph", label: "Risograph", prompt: "Create an authentic risograph print illustration with granular organic textures, slightly misaligned ink layers, soft halftone dots, and a vibrant neon duo-tone palette. ", sample: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=600&q=80" },
    { id: "technicolour", label: "Technicolour", prompt: "Create a saturated technicolor vintage 70s film style photograph, featuring warm ambient light projections, rich golden sunset shadows, and a dreamy nostalgic glow. ", sample: "https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=600&q=80" },
    { id: "gothic-clay", label: "Gothic clay", prompt: "Create a stop-motion style gothic claymation scene, featuring detailed whimsical clay textures, a miniature gothic room with warm candlelight, and a dark cozy fairy tale mood. ", sample: "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80" },
    { id: "cyberpunk", label: "Cyberpunk", prompt: "Create a cyberpunk digital artwork featuring a glowing neon city alleyway at night under light rain, reflections on wet asphalt, and deep high contrast colors. ", sample: "https://images.unsplash.com/photo-1515621061946-eff1c2a352bd?auto=format&fit=crop&w=600&q=80" },
    { id: "anime", label: "Anime", prompt: "Create a beautiful modern anime-style digital illustration with soft cel-shading, vibrant magical colors, highly detailed atmospheric lighting, and high-fidelity scenery. ", sample: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=600&q=80" },
    { id: "ghibli", label: "Ghibli", prompt: "Create a whimsical Studio Ghibli-inspired scene with soft watercolor textures, warm earthy tones, lush green landscapes, gentle magical lighting, and a nostalgic hand-painted feel. ", sample: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80" },
];

const LAB_IMAGES_COL_1 = [
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80", // Portrait (Woman)
    "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=600&q=80", // Anime alley neon
    "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=600&q=80", // Scenery mountains mist
    "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=80", // Portrait classic face
    "https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=600&q=80", // Anime art
    "https://images.unsplash.com/photo-1522391692407-3e7f91e1b7a4?auto=format&fit=crop&w=600&q=80", // Anime character
    "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=600&q=80", // Scenery mountain stars
    "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&w=600&q=80", // Anime art girl
];

const LAB_IMAGES_COL_2 = [
    "https://images.unsplash.com/photo-1515260268569-9271009adfdb?auto=format&fit=crop&w=600&q=80", // Light scenery pastel pink sky
    "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80", // Scenery Yosemite valley river
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80", // Portrait man close-up
    "https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=600&q=80", // Vaporwave/synthwave dark neon
    "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80", // Light abstract shape
    "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=600&q=80", // Scenery waterfall forest
    "https://images.unsplash.com/photo-1618336753974-aae8e04506aa?auto=format&fit=crop&w=600&q=80", // Anime style art
    "https://images.unsplash.com/photo-1518173946687-a36f968b86fc?auto=format&fit=crop&w=600&q=80", // Scenery aurora sky
];

const LAB_IMAGES_COL_3 = [
    "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?auto=format&fit=crop&w=600&q=80", // Scenery forest sunrays
    "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&q=80", // Anime cyberpunk neon cityscape
    "https://images.unsplash.com/photo-1501854140801-50d01698950b?auto=format&fit=crop&w=600&q=80", // Scenery lush valley hills
    "https://images.unsplash.com/photo-1511556532299-8f662fc26c06?auto=format&fit=crop&w=600&q=80", // Dark aesthetic sneaker neon
    "https://images.unsplash.com/photo-1554151228-14d9def656e4?auto=format&fit=crop&w=600&q=80", // Portrait creative art face
    "https://images.unsplash.com/photo-1567095761054-7a02e69e5c43?auto=format&fit=crop&w=600&q=80", // Anime illustration
    "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&w=600&q=80", // Scenery mountain lake
    "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=600&q=80", // Scenery cityscape dusk
];

const Chat = () => {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
        };
        handleResize();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const [authed, setAuthed] = useState<boolean | null>(null);
    const [userName, setUserName] = useState<string>("");
    const [userEmail, setUserEmail] = useState<string>("");
    const [messages, setMessages] = useState<Message[]>(getWelcomeMessages);
    const [input, setInput] = useState("");
    const [sidebarWidth, setSidebarWidth] = useState(260);
    const [rightSidebarWidth, setRightSidebarWidth] = useState(260);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
    const [isRightSidebarCollapsed, setIsRightSidebarCollapsed] = useState(true);
    const [isResizingLeft, setIsResizingLeft] = useState(false);
    const [isResizingRight, setIsResizingRight] = useState(false);
    const { isDarkMode, toggleTheme } = useTheme();
    const [showEngineSelect, setShowEngineSelect] = useState(false);
    const [selectedEngine, setSelectedEngine] = useState("Student Mode");
    const [selectedImageStyle, setSelectedImageStyle] = useState("realistic");
    const [isLoading, setIsLoading] = useState(false);
    const [chats, setChats] = useState<ChatSummary[]>([]);
    const [activeChatId, setActiveChatId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [isSessionsLoading, setIsSessionsLoading] = useState(false);
    const [isHistoryLoading, setIsHistoryLoading] = useState(false);
    const [isCreatingChat, setIsCreatingChat] = useState(false);
    const [chatError, setChatError] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<ProcessedFile | null>(null);
    const [isProcessingFile, setIsProcessingFile] = useState(false);
    const [isInterviewModalOpen, setIsInterviewModalOpen] = useState(false);
    const [isMockPaperModalOpen, setIsMockPaperModalOpen] = useState(false);
    const [isPersonaModalOpen, setIsPersonaModalOpen] = useState(false);
    const [isBattleArenaModalOpen, setIsBattleArenaModalOpen] = useState(false);
    const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);
    const [generatedPaper, setGeneratedPaper] = useState<string | null>(null);
    const [paperConfig, setPaperConfig] = useState<MockPaperConfig | null>(null);
    const [isGeneratingPaper, setIsGeneratingPaper] = useState(false);
    const [mcqQuestions, setMcqQuestions] = useState<MCQQuestion[] | null>(null);
    const [mcqExamType, setMcqExamType] = useState("");
    const [mcqSession, setMcqSession] = useState<{
        questions: MCQQuestion[];
        currentIndex: number;
        answers: (number | null)[];
        examType: string;
    } | null>(null);
    const [showDots, setShowDots] = useState(false);
    const [responseTime, setResponseTime] = useState<number | null>(null);
    const [sidebarTab, setSidebarTab] = useState<"history" | "modes">("history");
    const [rightSidebarTab, setRightSidebarTab] = useState<"usage" | "gmail">("usage");
    const [gmailConnected, setGmailConnected] = useState(false);
    const [gmailEmail, setGmailEmail] = useState("");
    const [gmailEmails, setGmailEmails] = useState<any[]>([]);
    const [gmailLoading, setGmailLoading] = useState(false);
    const [gmailError, setGmailError] = useState("");
    const [gmailSelectedEmail, setGmailSelectedEmail] = useState<any | null>(null);
    const [gmailConnecting, setGmailConnecting] = useState(false);
    const [gmailSearchQuery, setGmailSearchQuery] = useState("");
    const [gmailMailTo, setGmailMailTo] = useState("");
    const [gmailSending, setGmailSending] = useState(false);
    const [gmailSendResult, setGmailSendResult] = useState("");
    const [gmailAutoStatus, setGmailAutoStatus] = useState("");
    const PLACEHOLDER_TEXTS = useMemo(() => [
        "Describe your query or paste a concept...",
        "Ask me anything about your studies...",
        "Upload a file or type your question...",
        "How can I assist your learning today?",
        "Paste a topic and I'll explain it..."
    ], []);
    const [placeholderIndex, setPlaceholderIndex] = useState(0);
    const [typedPlaceholder, setTypedPlaceholder] = useState(PLACEHOLDER_TEXTS[0]);
    const [editingChatId, setEditingChatId] = useState<string | null>(null);
    const [editingTitle, setEditingTitle] = useState("");
    const editingInputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const requestStartTime = useRef<number>(0);
    const engineSelectRef = useRef<HTMLDivElement>(null);
    const stopGenerationRef = useRef(false);
    const styleCardsScrollRef = useRef<HTMLDivElement>(null);

    const [subscription, setSubscription] = useState<any>(null);
    const [isSubscriptionLoading, setIsSubscriptionLoading] = useState(false);
    const [planFeatures, setPlanFeaturesState] = useState<string[]>([]);

    const engines = [
        { name: "Student Mode", endpoint: "/chat", version: "1.0", icon: GraduationCap },
        { name: "Assistant Mode", endpoint: "/chat", version: "1.0", icon: Bot },

        { name: "Interview Prep", endpoint: "/tools/interview", version: "1.0", icon: UserCog },
        { name: "Mock Paper Generator", endpoint: "/chat", version: "1.0", icon: MockIcon },
        { name: "Persona Mode", endpoint: "/chat", version: "1.0", icon: Sparkles },
        { name: "AI Image Lab", endpoint: "/features/image/generate", version: "1.0", icon: ImageIcon },
        { name: "Battle Arena", endpoint: "/battle-arena", version: "1.0", icon: Swords },
    ];

    const employeeRestrictedEngines = ["Student Mode", "Interview Prep", "Mock Paper Generator", "Battle Arena"];
    const userRole = typeof window !== "undefined" ? getUserRole() : null;
    const visibleEngines = userRole === "employee"
        ? engines.filter(e => !employeeRestrictedEngines.includes(e.name))
        : engines;

    const activeChat = chats.find((chat) => chat.id === activeChatId) || null;
    const filteredChats = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        if (!query) return chats;
        return chats.filter((chat) => chat.title.toLowerCase().includes(query));
    }, [chats, searchQuery]);

    useEffect(() => {
        const syncAuth = () => setAuthed(isAuthenticated());
        const timeoutId = window.setTimeout(syncAuth, 0);

        window.addEventListener("storage", syncAuth);

        return () => {
            window.clearTimeout(timeoutId);
            window.removeEventListener("storage", syncAuth);
        };
    }, []);

    const startResizingLeft = useCallback((e: React.MouseEvent) => {
        setIsResizingLeft(true);
        e.preventDefault();
    }, []);

    const startResizingRight = useCallback((e: React.MouseEvent) => {
        setIsResizingRight(true);
        e.preventDefault();
    }, []);

    const stopResizing = useCallback(() => {
        setIsResizingLeft(false);
        setIsResizingRight(false);
    }, []);

    const resize = useCallback((e: MouseEvent) => {
        if (isResizingLeft) {
            const newWidth = e.clientX;
            if (newWidth > 60 && newWidth < 400) {
                setSidebarWidth(newWidth);
            }
        } else if (isResizingRight) {
            const newWidth = window.innerWidth - e.clientX;
            if (newWidth > 60 && newWidth < 400) {
                setRightSidebarWidth(newWidth);
            }
        }
    }, [isResizingLeft, isResizingRight]);

    useEffect(() => {
        window.addEventListener("mousemove", resize);
        window.addEventListener("mouseup", stopResizing);
        return () => {
            window.removeEventListener("mousemove", resize);
            window.removeEventListener("mouseup", stopResizing);
        };
    }, [resize, stopResizing]);

    useEffect(() => {
        const lastMessage = messages[messages.length - 1];
        if (lastMessage?.role === "user" && !lastMessage.localOnly) {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    useEffect(() => {
        if (selectedEngine === "AI Image Lab") {
            const imageHistory = getImageHistory();
            if (imageHistory.length > 0) {
                setMessages(imageHistory);
            }
        }
    }, [selectedEngine]);

    useEffect(() => {
        if (selectedEngine !== "AI Image Lab") return;
        const interval = setInterval(() => {
            const history = getImageHistory();
            const cutoff = Date.now() - 24 * 60 * 60 * 1000;
            const filtered = history.filter((m) => {
                const t = new Date(m.timestamp).getTime();
                return !isNaN(t) && t > cutoff;
            });
            if (filtered.length !== history.length) {
                try {
                    window.localStorage.setItem(IMAGE_HISTORY_KEY, JSON.stringify(filtered));
                } catch { /* ignore */ }
            }
        }, 3600000);
        return () => clearInterval(interval);
    }, [selectedEngine]);

    // ── Gmail / Google Connection ──
    const checkGmailStatus = useCallback(async () => {
        try {
            const { getGoogleStatus } = await import("@/lib/chat-api")
            const res = await getGoogleStatus()
            setGmailConnected(res.connected === true)
            if (res.connected === true && res.email) {
                setGmailEmail(res.email)
            }
        } catch { /* ignore */ }
    }, [])

    useEffect(() => {
        if (userRole !== "employee" || rightSidebarTab !== "gmail" || isRightSidebarCollapsed) return
        checkGmailStatus()
    }, [userRole, rightSidebarTab, isRightSidebarCollapsed, checkGmailStatus])

    const fetchGmailEmails = useCallback(async (searchQuery?: string) => {
        setGmailLoading(true)
        setGmailError("")
        try {
            const { listGoogleEmails } = await import("@/lib/chat-api")
            const params: any = { maxResults: 50 }
            if (searchQuery) params.q = searchQuery
            const res = await listGoogleEmails(params)
            if (res.success) {
                setGmailEmails(res.emails || [])
                if (!res.emails || res.emails.length === 0) {
                    setGmailError("")
                }
            } else {
                setGmailError(res.error || "Failed to fetch emails")
            }
        } catch (e: any) {
            setGmailError(e.message || "Failed to fetch emails")
        } finally {
            setGmailLoading(false)
        }
    }, [])

    useEffect(() => {
        if (gmailConnected && rightSidebarTab === "gmail" && !isRightSidebarCollapsed) {
            fetchGmailEmails()
        }
    }, [gmailConnected, rightSidebarTab, isRightSidebarCollapsed, fetchGmailEmails])

    // Listen for Gmail connected signal from popup (via localStorage)
    useEffect(() => {
        const handleStorage = (e: StorageEvent) => {
            if (e.key === "gmail_just_connected" && e.newValue) {
                setGmailConnected(true)
                setGmailEmail(e.newValue)
                localStorage.removeItem("gmail_just_connected")
                // If on Gmail tab, fetch emails
                if (rightSidebarTab === "gmail" && !isRightSidebarCollapsed) {
                    fetchGmailEmails()
                }
            }
        }
        window.addEventListener("storage", handleStorage)
        return () => window.removeEventListener("storage", handleStorage)
    }, [rightSidebarTab, isRightSidebarCollapsed, fetchGmailEmails])

    const handleConnectGmail = async () => {
        setGmailConnecting(true)
        setGmailError("")
        try {
            const { getGoogleAuthUrl } = await import("@/lib/chat-api")
            const redirectUri = window.location.origin + '/google-connected'
            const res = await getGoogleAuthUrl(redirectUri)
            if (res.success && res.url) {
                window.open(res.url, "_blank", "width=600,height=700")
            } else {
                setGmailError("Failed to get auth URL")
            }
        } catch (e: any) {
            setGmailError("Connection error: " + (e.message || "Unknown"))
        } finally {
            setGmailConnecting(false)
        }
    }

    const handleDisconnectGmail = async () => {
        setGmailLoading(true)
        try {
            const { disconnectGoogle } = await import("@/lib/chat-api")
            await disconnectGoogle()
            setGmailConnected(false)
            setGmailEmail("")
            setGmailEmails([])
            setGmailSelectedEmail(null)
            setGmailMailTo("")
            setGmailSendResult("")
            setGmailAutoStatus("")
        } catch (e: any) {
            setGmailError(e.message || "Failed to disconnect")
        } finally {
            setGmailLoading(false)
        }
    }

    const handleSelectEmail = async (msgId: string) => {
        try {
            const { getGoogleEmailDetail } = await import("@/lib/chat-api")
            const res = await getGoogleEmailDetail(msgId)
            if (res.success) {
                setGmailSelectedEmail(res.email)
            }
        } catch (e: any) {
            setGmailError(e.message || "Failed to load email")
        }
    }

    // ── Gmail Send / Auto-Reply Handlers ──
    const [gmailConfirmSend, setGmailConfirmSend] = useState(false);
    const [gmailSendMode, setGmailSendMode] = useState<"single" | "bulk" | null>(null);
    const [gmailPolishedBody, setGmailPolishedBody] = useState("");
    const [gmailPolishing, setGmailPolishing] = useState(false);

    const handleMailSend = async (body: string) => {
        const to = gmailMailTo.trim();
        if (!to || !body.trim()) return;
        const recipients = to.includes(",") ? to.split(",").map(s => s.trim()).filter(Boolean) : [to];
        const subject = body.split("\n")[0].slice(0, 80) || "Message from Rudranex AI";
        setGmailSending(true);
        setGmailSendResult("");
        try {
            const { sendGoogleEmail } = await import("@/lib/chat-api");
            let sent = 0, failed = 0;
            for (const r of recipients) {
                try {
                    const res = await sendGoogleEmail({ to: r, subject, body });
                    if (res.success) sent++; else failed++;
                } catch { failed++ }
            }
            setGmailSendResult(`Sent to ${sent}/${recipients.length} recipient(s)` + (failed ? ` (${failed} failed)` : " ✓"));
            if (sent > 0) { setGmailMailTo(""); setInput(""); }
        } catch (e: any) {
            setGmailSendResult("Failed: " + (e.message || "Unknown error"));
        } finally {
            setGmailSending(false);
            setGmailConfirmSend(false);
            setGmailPolishedBody("");
        }
    };

    const handleTriggerAutoReply = async () => {
        setGmailSending(true);
        setGmailAutoStatus("Processing unread emails...");
        try {
            const { triggerGoogleAutoReplyAll } = await import("@/lib/chat-api");
            const res = await triggerGoogleAutoReplyAll(10);
            setGmailAutoStatus(res.success ? `Auto-replied to ${res.replied} email(s) ✓` : (res.error || "Auto-reply failed"));
        } catch (e: any) {
            setGmailAutoStatus("Failed: " + (e.message || "Unknown error"));
        } finally {
            setGmailSending(false);
        }
    };

    const handleTriggerBulkAutoReply = async () => {
        setGmailSending(true);
        setGmailAutoStatus("Fetching employees...");
        try {
            const { getEnterpriseEmailEmployees, triggerEnterpriseBulkReply } = await import("@/lib/chat-api");
            const empRes = await getEnterpriseEmailEmployees({ connected_only: true, agent_active_only: true });
            if (!empRes.success || !empRes.employees?.length) {
                setGmailAutoStatus("No employees with active agent found");
                setGmailSending(false);
                return
            }
            const ids = empRes.employees.map((e: any) => e.id);
            setGmailAutoStatus(`Triggering bulk reply for ${ids.length} employee(s)...`);
            const res = await triggerEnterpriseBulkReply(ids, 5);
            setGmailAutoStatus(res.success ? (res.message || "Bulk auto-reply completed ✓") : (res.error || "Failed"));
        } catch (e: any) {
            setGmailAutoStatus("Failed: " + (e.message || "Unknown error"));
        } finally {
            setGmailSending(false);
        }
    };

    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);

    const startRecording = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            setStream(mediaStream);
            const mediaRecorder = new MediaRecorder(mediaStream);
            mediaRecorderRef.current = mediaRecorder;
            const chunks: Blob[] = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunks.push(e.data);
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(chunks, { type: 'audio/webm' });

                // Prevent sending empty/tiny recordings (less than 1KB)
                if (audioBlob.size < 1000) {
                    toast.error("Recording too short. Please try again.");
                    return;
                }

                try {
                    toast.promise(
                        (async () => {
                            const { transcribeSpeech } = await import("@/lib/chat-api");
                            const transcript = await transcribeSpeech(audioBlob);
                            if (transcript) {
                                setInput(prev => prev + (prev ? " " : "") + transcript);
                                return "Speech converted to text";
                            }
                            throw new Error("No transcript received");
                        })(),
                        {
                            loading: 'Transcribing speech...',
                            success: (data) => data,
                            error: (err) => `STT Error: ${err.message}`,
                        }
                    );
                } catch (err: any) {
                    console.error("STT Process Error:", err);
                }
            };

            mediaRecorder.start();
            setIsRecording(true);
        } catch (err) {
            console.error("Recording error:", err);
            toast.error("Could not access microphone");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
                setStream(null);
            }
        }
    };

    useEffect(() => {
        if (mcqSession) {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, mcqSession]);

    useEffect(() => {
        if (isProcessingFile) return;
        let charPos = 0;
        let interval: ReturnType<typeof setInterval>;
        const startTyping = () => {
            const text = PLACEHOLDER_TEXTS[placeholderIndex];
            charPos = 0;
            interval = setInterval(() => {
                charPos++;
                if (charPos <= text.length) {
                    setTypedPlaceholder(text.slice(0, charPos));
                }
                if (charPos >= text.length) {
                    clearInterval(interval);
                    setTimeout(() => {
                        setPlaceholderIndex(prev => (prev + 1) % PLACEHOLDER_TEXTS.length);
                    }, 2000);
                }
            }, 20);
        };
        startTyping();
        return () => clearInterval(interval);
    }, [placeholderIndex, PLACEHOLDER_TEXTS, isProcessingFile]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (engineSelectRef.current && !engineSelectRef.current.contains(e.target as Node)) {
                setShowEngineSelect(false);
            }
        };
        if (showEngineSelect) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [showEngineSelect]);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    const downloadAsPdf = (title: string, content: string) => {
        const printWindow = window.open("", "_blank");
        if (!printWindow) return;
        const isDark = isDarkMode;

        const mdToHtml = (text: string) => {
            let html = text
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width:100%;margin:12px 0;border-radius:8px;">')
                .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color:#3b82f6;">$1</a>')
                .replace(/`{3}(\w*)\n?([\s\S]*?)`{3}/g, '<pre style="background:' + (isDark ? '#1a1a1a' : '#f5f5f5') + ';padding:16px;border-radius:8px;overflow-x:auto;white-space:pre-wrap;font-size:13px;margin:12px 0;"><code>$2</code></pre>')
                .replace(/`([^`]+)`/g, '<code style="background:' + (isDark ? '#1a1a1a' : '#f5f5f5') + ';padding:2px 6px;border-radius:4px;font-size:13px;">$1</code>')
                .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
                .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.+?)\*/g, '<em>$1</em>')
                .replace(/^### (.+)$/gm, '<h3 style="margin:20px 0 8px;font-size:17px;">$1</h3>')
                .replace(/^## (.+)$/gm, '<h2 style="margin:24px 0 8px;font-size:19px;">$1</h2>')
                .replace(/^# (.+)$/gm, '<h1 style="margin:28px 0 8px;font-size:22px;">$1</h1>')
                .replace(/^- (.+)$/gm, '<li style="margin:4px 0 4px 20px;">$1</li>')
                .replace(/^\* (.+)$/gm, '<li style="margin:4px 0 4px 20px;">$1</li>')
                .replace(/\n{2,}/g, '</p><p style="margin:12px 0;">')
                .replace(/\n/g, '<br>');
            return '<p style="margin:12px 0;">' + html + '</p>';
        };

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>${title}</title>
                <style>
                    body { font-family: system-ui, -apple-system, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; line-height: 1.8; font-size: 15px; color: ${isDark ? "#e5e5e5" : "#171717"}; background: ${isDark ? "#0a0a0a" : "#fff"}; }
                    img { max-width: 100%; }
                    blockquote { border-left: 3px solid #888; margin: 12px 0; padding: 8px 16px; color: #666; background: ${isDark ? "#111" : "#fafafa"}; border-radius: 4px; }
                    table { border-collapse: collapse; width: 100%; margin: 12px 0; }
                    th, td { border: 1px solid ${isDark ? "#333" : "#ddd"}; padding: 8px; text-align: left; }
                    @media print { body { color: #000; background: #fff; } pre { background: #f5f5f5 !important; -webkit-print-color-adjust: exact; } img { -webkit-print-color-adjust: exact; } }
                </style>
            </head>
            <body>
                <div style="margin-bottom: 32px; border-bottom: 1px solid ${isDark ? "#333" : "#ddd"}; padding-bottom: 16px;">
                    <h1 style="font-size: 20px; margin: 0;">Rudranex AI</h1>
                    <p style="color: #888; font-size: 12px; margin: 4px 0 0;">${new Date().toLocaleString()}</p>
                </div>
                <div id="content">${mdToHtml(content)}</div>
                <script>window.onload=function(){setTimeout(function(){window.print()},500)}<\/script>
            </body>
            </html>
        `);
        printWindow.document.close();
    };

    const handleDownloadImage = async (url: string, filename: string = "rudranex-ai-image.png") => {
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = blobUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(blobUrl);
        } catch (error) {
            const link = document.createElement("a");
            link.href = url;
            link.target = "_blank";
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    const hydrateMessages = (items: Array<{ role: "user" | "assistant" | "system"; content: string; created_at?: string; id?: string; feedback?: number }>) => {
        if (!items.length) {
            setMessages(getWelcomeMessages());
            return;
        }

        setMessages(items.map((message) => ({
            role: message.role,
            content: message.content,
            timestamp: formatTimestamp(message.created_at),
            messageId: message.id,
            feedback: message.feedback
        })));
    };

    const openChat = useCallback(async (chatId: string) => {
        setActiveChatId(chatId);
        setStoredActiveChatId(chatId);
        setChatError(null);
        setIsHistoryLoading(true);

        try {
            const data = await getChatHistory(chatId);
            hydrateMessages(data.messages);
        } catch (error) {
            const message = error instanceof Error ? error.message : "Unable to load chat history.";
            setChatError(message);
            setMessages(getWelcomeMessages());
        } finally {
            setIsHistoryLoading(false);
        }
    }, []);

    const loadChats = useCallback(async () => {
        if (!isAuthenticated()) return;

        setIsSessionsLoading(true);
        setChatError(null);

        try {
            const data = await listChats();
            setChats(data.chats);

            if (data.chats.length > 0) {
                const storedChatId = getStoredActiveChatId();
                const preferredChat = data.chats.find((chat) => chat.id === storedChatId) || data.chats[0];
                await openChat(preferredChat.id);
            } else {
                setActiveChatId(null);
                setStoredActiveChatId(null);
                setMessages(getWelcomeMessages());
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : "Unable to load chats.";
            setChatError(message);
            setChats([]);
            setActiveChatId(null);
            setStoredActiveChatId(null);
            setMessages(getWelcomeMessages());
        } finally {
            setIsSessionsLoading(false);
        }
    }, [openChat]);

    useEffect(() => {
        if (!authed) return;

        const userInfo = getUserInfo();
        if (userInfo) {
            setUserName(userInfo.name);
            setUserEmail(userInfo.email);
        }

        // Fetch subscription status
        setIsSubscriptionLoading(true);
        getSubscriptionStatus()
            .then(data => {
                console.log("Subscription API response:", data);
                if (data.success) {
                    setSubscription(data);
                    const pid = data.subscription?.plan_id
                    if (pid) {
                        const features = getPlanFeatures(String(pid))
                        setPlanFeaturesState(features)
                    }
                }
            })
            .catch(err => {
                console.warn("Failed to fetch subscription status:", err.message || err);
            })
            .finally(() => {
                setIsSubscriptionLoading(false);
            });

        const timeoutId = window.setTimeout(() => {
            void loadChats();
        }, 0);

        return () => window.clearTimeout(timeoutId);
    }, [authed, loadChats]);

    const handleCreateChat = async () => {
        setIsCreatingChat(true);
        setChatError(null);

        try {
            const data = await createChat("New Chat");
            setChats((prev) => [data.chat, ...prev]);
            setActiveChatId(data.chat.id);
            setStoredActiveChatId(data.chat.id);
            setMessages(getWelcomeMessages());
            setSearchQuery("");
        } catch (error) {
            const message = error instanceof Error ? error.message : "Unable to create chat.";
            setChatError(message);
        } finally {
            setIsCreatingChat(false);
        }
    };

    const handleStartEditing = (chat: ChatSummary) => {
        setEditingChatId(chat.id);
        setEditingTitle(chat.title);
        setTimeout(() => editingInputRef.current?.select(), 0);
    };

    const handleCancelEditing = () => {
        setEditingChatId(null);
        setEditingTitle("");
    };

    const handleRenameChat = async () => {
        const chatId = editingChatId;
        const newTitle = editingTitle.trim();
        if (!chatId || !newTitle) {
            handleCancelEditing();
            return;
        }

        setChatError(null);

        try {
            await updateChat(chatId, newTitle);
            setChats((prev) =>
                prev.map((chat) =>
                    chat.id === chatId ? { ...chat, title: newTitle } : chat
                )
            );
        } catch (error) {
            const message = error instanceof Error ? error.message : "Unable to rename chat.";
            setChatError(message);
            toast.error(message);
        } finally {
            handleCancelEditing();
        }
    };

    const handleDeleteChat = async (chatId: string) => {
        const confirmed = window.confirm("Do you want to delete this chat ?");
        if (!confirmed) return;

        setChatError(null);

        try {
            await deleteChat(chatId);
            const remainingChats = chats.filter((chat) => chat.id !== chatId);
            setChats(remainingChats);

            if (activeChatId === chatId) {
                const nextChat = remainingChats[0];
                if (nextChat) {
                    await openChat(nextChat.id);
                } else {
                    setActiveChatId(null);
                    setStoredActiveChatId(null);
                    setMessages(getWelcomeMessages());
                }
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : "Unable to delete chat.";
            setChatError(message);
        }
    };

    const handleToggleFeedback = async (messageId: string | undefined, currentFeedback: number | undefined, value: number) => {
        if (!messageId) {
            toast.error("Cannot save feedback for this message");
            return;
        }

        const newFeedback = currentFeedback === value ? 0 : value;

        try {
            await sendMessageFeedback(messageId, newFeedback);
            setMessages((prev) =>
                prev.map((msg) =>
                    msg.messageId === messageId ? { ...msg, feedback: newFeedback } : msg
                )
            );
        } catch (error) {
            const message = error instanceof Error ? error.message : "Unable to save feedback.";
            toast.error(message);
        }
    };

    const retryMessage = (index: number) => {
        const msg = messages[index];
        if (msg && msg.role === "assistant" && index > 0) {
            const prevUserMsg = messages[index - 1];
            if (prevUserMsg && prevUserMsg.role === "user") {
                setInput(prevUserMsg.content);
                setMessages((prev) => prev.slice(0, index));
            }
        }
    };

    const handleStartInterview = (topic: string, duration: number) => {
        setIsInterviewModalOpen(false);
        window.location.href = `/interview?topic=${encodeURIComponent(topic)}&duration=${duration}`;
    };

    const handlePersonaSelect = (persona: Persona) => {
        setSelectedPersona(persona);
        setSelectedEngine("Persona Mode");
    };

    const scrollStyleCards = (direction: "left" | "right") => {
        if (styleCardsScrollRef.current) {
            const container = styleCardsScrollRef.current;
            const firstCard = container.firstElementChild as HTMLElement;
            if (firstCard) {
                const cardWidth = firstCard.offsetWidth;
                const gap = 20;
                const scrollAmount = cardWidth + gap;
                container.scrollBy({
                    left: direction === "left" ? -scrollAmount : scrollAmount,
                    behavior: "smooth"
                });
            } else {
                container.scrollBy({
                    left: direction === "left" ? -340 : 340,
                    behavior: "smooth"
                });
            }
        }
    };

    // Auto-scroll style cards carousel — pauses on user interaction, resumes after 1.5s
    useEffect(() => {
        if (selectedEngine !== "AI Image Lab") return;
        const container = styleCardsScrollRef.current;
        if (!container) return;

        let rafId: number;
        let isPaused = false;
        let resumeTimeout: ReturnType<typeof setTimeout>;
        const SPEED = 0.6; // px per frame

        const step = () => {
            if (!isPaused && container) {
                // Loop back to start when we reach (or pass) the end
                if (container.scrollLeft + container.clientWidth >= container.scrollWidth - 1) {
                    container.scrollLeft = 0;
                } else {
                    container.scrollLeft += SPEED;
                }
            }
            rafId = requestAnimationFrame(step);
        };

        const pause = () => {
            isPaused = true;
            clearTimeout(resumeTimeout);
            resumeTimeout = setTimeout(() => { isPaused = false; }, 1500);
        };

        container.addEventListener("pointerdown", pause, { passive: true });
        container.addEventListener("touchstart", pause, { passive: true });
        container.addEventListener("wheel", pause, { passive: true });

        rafId = requestAnimationFrame(step);

        return () => {
            cancelAnimationFrame(rafId);
            clearTimeout(resumeTimeout);
            container.removeEventListener("pointerdown", pause);
            container.removeEventListener("touchstart", pause);
            container.removeEventListener("wheel", pause);
        };
    }, [selectedEngine]);

    const handleBattleArenaHost = (config: { adminName: string; topic: string; difficulty: string; questionCount: number }) => {
        setIsBattleArenaModalOpen(false);
        window.location.href = `/battle-arena?host=true&name=${encodeURIComponent(config.adminName)}&topic=${encodeURIComponent(config.topic)}&difficulty=${config.difficulty}&count=${config.questionCount}`;
    };

    const handleBattleArenaJoin = (config: { lobbyCode: string; participantName: string }) => {
        setIsBattleArenaModalOpen(false);
        window.location.href = `/battle-arena?code=${encodeURIComponent(config.lobbyCode)}&name=${encodeURIComponent(config.participantName)}`;
    };

    const handleGenerateMockPaper = async (config: MockPaperConfig) => {
        setIsMockPaperModalOpen(false);
        setIsGeneratingPaper(true);
        setPaperConfig(config);

        const examName = (config.examType === 'Other' ? config.customExamType : config.examType) || "General";

        if (config.mode === "mcq") {
            const prompt = `You are an expert quiz generator. Generate exactly ${config.numQuestions} multiple choice questions for "${examName}".

Return ONLY valid JSON array (no markdown, no code fences) in this exact structure:
[
  {
    "question": "question text here",
    "options": ["A) option1", "B) option2", "C) option3", "D) option4"],
    "correctAnswer": 0,
    "explanation": "one line explanation for the correct answer"
  }
]

Rules:
- correctAnswer is the 0-based index of the right option
- questions must test core ${examName} knowledge
- each question has exactly 4 options
- keep explanation brief (max 15 words)
- generate NOW`;

            try {
                const data = await sendAiRequest({
                    endpoint: "/chat",
                    messages: [{ role: "user", content: prompt }],
                    modality: "text"
                });

                const raw = data.data?.[0]?.message?.content || data.data?.[0]?.text || "";
                const jsonMatch = raw.match(/\[[\s\S]*\]/);
                if (!jsonMatch) throw new Error("Could not parse MCQ data from AI response");
                const questions: MCQQuestion[] = JSON.parse(jsonMatch[0]);
                if (!questions.length) throw new Error("No questions generated");
                const session = {
                    questions,
                    currentIndex: 0,
                    answers: new Array(questions.length).fill(null),
                    examType: examName
                };
                setMcqSession(session);
                setMessages(prev => [
                    ...prev.filter(m => !m.localOnly),
                    { role: "assistant" as const, content: `📝 **MCQ Quiz: ${examName}**\n\nI've generated **${questions.length}** questions. Select your answer below.`, timestamp: formatTimestamp(), localOnly: true },
                    { role: "assistant" as const, content: `**Q1.** ${questions[0].question}`, timestamp: formatTimestamp(), localOnly: true }
                ]);
                toast.success("MCQ Quiz Generated Successfully!");
            } catch (error) {
                toast.error("Failed to generate MCQ: " + (error as Error).message);
            } finally {
                setIsGeneratingPaper(false);
            }
            return;
        }

        // Paper mode
        const prompt = `Act as an expert examiner. Generate a professional question paper for ${examName}.
Duration: ${config.duration}.
Total Questions: ${config.numQuestions}.

STRUCTURE:
- Section A: Multiple Choice (Conceptual)
- Section B: Short Answer (Analytical)
- Section C: Long Answer (Application-based)

STRICT RULES:
1. Provide ONLY the paper content. 
2. No intro/outro or conversational text.
3. Be concise but maintain high academic standards.
4. Focus on core ${examName} syllabus.
5. Generate NOW.`;

        try {
            const data = await sendAiRequest({
                endpoint: "/chat",
                messages: [{ role: "user", content: prompt }],
                modality: "text"
            });

            const content = data.data?.[0]?.message?.content || data.data?.[0]?.text || "Failed to generate paper.";
            setGeneratedPaper(content);
            toast.success("Neural Paper Synthesized Successfully.");
        } catch (error) {
            toast.error("Failed to generate paper: " + (error as Error).message);
        } finally {
            setIsGeneratingPaper(false);
        }
    };

    const handleMcqOptionClick = (optionIndex: number) => {
        if (!mcqSession) return;
        const { questions, currentIndex, answers, examType } = mcqSession;
        if (answers[currentIndex] !== null) return;

        const newAnswers = [...answers];
        newAnswers[currentIndex] = optionIndex;
        const optText = questions[currentIndex].options[optionIndex];

        if (currentIndex < questions.length - 1) {
            setMessages(prev => [
                ...prev,
                { role: "user", content: optText, timestamp: formatTimestamp(), localOnly: true },
                { role: "assistant", content: `**Q${currentIndex + 2}.** ${questions[currentIndex + 1].question}`, timestamp: formatTimestamp(), localOnly: true }
            ]);
            setMcqSession({ ...mcqSession, currentIndex: currentIndex + 1, answers: newAnswers });
        } else {
            const score = newAnswers.reduce<number>((acc, ans, i) => acc + (ans === questions[i].correctAnswer ? 1 : 0), 0);
            const percentage = Math.round((score / questions.length) * 100);
            const resultsText = questions.map((q, i) => {
                const isCorrect = newAnswers[i] === q.correctAnswer;
                return `**Q${i + 1}.** ${isCorrect ? "[Correct]" : "[Wrong]"} ${q.question}\n  > Your answer: ${q.options[newAnswers[i]!]}\n  > Correct answer: ${q.options[q.correctAnswer]}\n  > *${q.explanation}*`;
            }).join("\n\n");
            setMessages(prev => [
                ...prev,
                { role: "user", content: optText, timestamp: formatTimestamp(), localOnly: true },
                { role: "assistant", content: `## 🎯 Quiz Complete!\n\n**Score: ${score}/${questions.length} (${percentage}%)**\n\n${resultsText}`, timestamp: formatTimestamp(), localOnly: true }
            ]);
            setMcqSession(null);
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsProcessingFile(true);
        try {
            const processed = await processFile(file);
            setSelectedFile(processed);

            if (processed.isImage && !processed.isPdf) {
                toast.success(`Image "${processed.name}" ready`);
            } else if (processed.isPdf) {
                toast.success(`PDF "${processed.name}" ready`);
            } else {
                toast.success(`File "${processed.name}" ready`);
            }
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to process file.");
        } finally {
            setIsProcessingFile(false);
            e.target.value = "";
        }
    };

    const handleSend = async () => {
        const trimmedInput = input.trim();
        if ((!trimmedInput && !selectedFile) || isLoading || isProcessingFile) {
            toast.error("Please enter a message or attach a file");
            return;
        }

        // Gmail mode: if To is filled, polish with AI then show confirmation
        if (rightSidebarTab === "gmail" && userRole === "employee" && gmailConnected && gmailMailTo.trim()) {
            setGmailPolishing(true);
            setGmailPolishedBody("");
            setGmailConfirmSend(true);
            try {
                const { sendChatCompletion } = await import("@/lib/chat-api");
                const res = await sendChatCompletion({
                    messages: [
                        { role: "system", content: "You are an email writing assistant. Polish the following rough text into a professional, well-formatted email. Fix grammar, improve clarity, and add appropriate structure. Return ONLY the polished email body — no explanations, no greetings like 'Here is your polished email', no extra commentary." },
                        { role: "user", content: trimmedInput }
                    ]
                });
                setGmailPolishedBody((res as any)?.choices?.[0]?.message?.content || trimmedInput);
            } catch {
                setGmailPolishedBody(trimmedInput);
            }
            setGmailPolishing(false);
            return;
        }

        const apiKey = getApiKey();
        if (!apiKey) {
            toast.error("Please login first");
            return;
        }

        setIsLoading(true);
        setShowDots(true);
        setChatError(null);
        setResponseTime(null);
        const requestStart = Date.now();

        let currentChatId = activeChatId;
        const currentEngine = engines.find(e => e.name === selectedEngine) || engines[0];
        const isImageGenMode = selectedEngine === "AI Image Lab";

        try {
            if (!currentChatId) {
                const created = await createChat(buildChatTitle(trimmedInput || selectedFile?.name || "New Chat"));
                currentChatId = created.chat.id;
                setActiveChatId(created.chat.id);
                setStoredActiveChatId(created.chat.id);
                setChats((prev) => [created.chat, ...prev]);
            }

            let userContent: any = trimmedInput;
            let displayContent = trimmedInput;
            // Determine request modality — may be overridden for PDF/vision files
            let requestModality: string = isImageGenMode ? "image_gen" : "text";
            // Determine endpoint — PDFs always go to /features/pdf/intel regardless of engine name
            let requestEndpoint: string = currentEngine.endpoint;

            if (selectedFile) {
                const isPdfFile = selectedFile.isPdf === true;
                const isScannedPdf = isPdfFile && selectedFile.isImage === true;
                const isRegularImage = selectedFile.isImage === true && !isPdfFile;

                displayContent = trimmedInput
                    ? `${trimmedInput} [📎 ${selectedFile.name}]`
                    : `[📎 ${selectedFile.name}]`;

                if (isRegularImage) {
                    userContent = [
                        { type: "text", text: trimmedInput || "Please analyze this image in detail." },
                        { type: "image_url", image_url: { url: selectedFile.content } }
                    ];
                    requestModality = "vision";

                } else if (isScannedPdf) {
                    // ── Scanned (image-only) PDF → PDF Intel with OCR modality ─────
                    // Convert the raw PDF file to a base64 data URL for vision
                    const base64: string = await new Promise((res, rej) => {
                        const reader = new FileReader();
                        reader.onload = () => res(reader.result as string);
                        reader.onerror = rej;
                        reader.readAsDataURL(selectedFile.rawFile!);
                    });
                    userContent = [
                        { type: "text", text: trimmedInput || "Please extract and analyze all text from this scanned PDF." },
                        { type: "image_url", image_url: { url: base64 } }
                    ];
                    requestModality = "ocr";
                    requestEndpoint = "/features/pdf/intel";

                } else if (isPdfFile) {
                    // ── Text PDF → PDF Intel endpoint ───────────────────────────────
                    const MAX_CHARS = 14000;
                    const truncated = selectedFile.content.length > MAX_CHARS
                        ? selectedFile.content.slice(0, MAX_CHARS) + "\n\n[Content truncated due to length...]"
                        : selectedFile.content;

                    userContent = trimmedInput
                        ? `PDF Document: "${selectedFile.name}"\n\nContent:\n${truncated}\n\n---\nUser question: ${trimmedInput}`
                        : `PDF Document: "${selectedFile.name}"\n\nContent:\n${truncated}\n\n---\nPlease analyze this document, summarize the key points, and provide useful insights.`;

                    requestModality = "text";
                    requestEndpoint = "/features/pdf/intel";

                } else {
                    // ── Plain text file ─────────────────────────────────────────────
                    const MAX_CHARS = 12000;
                    const truncated = selectedFile.content.length > MAX_CHARS
                        ? selectedFile.content.slice(0, MAX_CHARS) + "\n\n[Content truncated...]"
                        : selectedFile.content;

                    userContent = trimmedInput
                        ? `File: "${selectedFile.name}"\n\n${truncated}\n\n---\nUser's request: ${trimmedInput}`
                        : `File: "${selectedFile.name}"\n\n${truncated}\n\n---\nPlease analyze and respond to the above content.`;
                }
            }

            if (isImageGenMode && !selectedFile) {
                const style = IMAGE_STYLES.find(s => s.id === selectedImageStyle);
                if (style && !trimmedInput.startsWith(style.prompt)) {
                    userContent = style.prompt + (trimmedInput || "");
                }
            }

            const userMessage: Message = {
                role: "user",
                content: displayContent,
                timestamp: formatTimestamp()
            };

            const conversationHistory = isImageGenMode
                ? [{ role: "user" as const, content: userContent }]
                : [
                    ...(selectedPersona && selectedEngine === "Persona Mode"
                        ? [{ role: "system" as const, content: selectedPersona.systemPrompt }]
                        : []),
                    ...messages
                        .filter((message) => !message.localOnly && message.content.trim())
                        .map((message) => ({
                            role: message.role as "user" | "assistant" | "system",
                            content: message.content
                        })),
                    {
                        role: "user" as const,
                        content: userContent
                    }
                ];

            setMessages((prev) => [...prev.filter((message) => !message.localOnly), userMessage]);
            setInput("");
            setSelectedFile(null);

            const data = await sendAiRequest({
                endpoint: requestEndpoint,
                messages: conversationHistory,
                chat_id: undefined,
                modality: requestModality
            });

            console.log("AI Response:", data);
            // Backend returns { success, model, data: choices_array }
            const firstChoice = data.data?.[0];
            console.log("First choice:", firstChoice);
            const isImageGen = isImageGenMode;

            let aiContent: string;
            if (isImageGen) {
                aiContent = (data as any).response || firstChoice?.message?.content || firstChoice?.text || "";
            } else {
                aiContent = firstChoice?.message?.content || firstChoice?.text || "";
            }
            if (!aiContent) {
                aiContent = firstChoice ? JSON.stringify(firstChoice) : "Response received from Rudranex AI.";
            }

            const isImage = isImageGen || isImageContent(aiContent);

            setShowDots(false);

            const assistantMessage: Message = {
                role: "assistant",
                content: "",
                timestamp: formatTimestamp()
            };
            setMessages((prev) => [...prev, assistantMessage]);

            if (isImage) {
                setMessages((prev) => {
                    const newMessages = [...prev];
                    const lastMsg = newMessages[newMessages.length - 1];
                    if (lastMsg && lastMsg.role === "assistant") {
                        lastMsg.content = aiContent;
                    }
                    return newMessages;
                });
            } else {
                const words = aiContent.split(/(?<=\s)/);
                let currentText = "";
                for (let i = 0; i < words.length; i++) {
                    if (stopGenerationRef.current) {
                        aiContent = currentText;
                        break;
                    }
                    currentText += words[i];
                    if (i % 3 === 0 || i === words.length - 1) {
                        setMessages((prev) => {
                            const newMessages = [...prev];
                            const lastMsg = newMessages[newMessages.length - 1];
                            if (lastMsg && lastMsg.role === "assistant") {
                                lastMsg.content = currentText;
                            }
                            return newMessages;
                        });
                        await new Promise(resolve => setTimeout(resolve, 5));
                    }
                }
            }
            if (isImageGenMode) {
                saveImageToHistory(userMessage, { role: "assistant", content: aiContent, timestamp: formatTimestamp() });
            }
            if (currentChatId) {
                try {
                    const [savedUser, savedAssistant] = await Promise.all([
                        saveChatMessage(currentChatId, "user", displayContent),
                        saveChatMessage(currentChatId, "assistant", aiContent)
                    ]);
                    const userMsgId = savedUser?.message?.id as string | undefined;
                    const assistantMsgId = savedAssistant?.message?.id as string | undefined;
                    if (userMsgId || assistantMsgId) {
                        setMessages((prev) => {
                            const updated = [...prev];
                            for (let i = updated.length - 1; i >= 0; i--) {
                                if (updated[i].role === "user" && !updated[i].messageId && userMsgId) {
                                    updated[i] = { ...updated[i], messageId: userMsgId };
                                    break;
                                }
                            }
                            for (let i = updated.length - 1; i >= 0; i--) {
                                if (updated[i].role === "assistant" && !updated[i].messageId && assistantMsgId) {
                                    updated[i] = { ...updated[i], messageId: assistantMsgId };
                                    break;
                                }
                            }
                            return updated;
                        });
                    }
                } catch {
                    // Best effort - feedback won't persist for this exchange
                }
            }

            setResponseTime((Date.now() - requestStart) / 1000);
        } catch (error) {
            setShowDots(false);
            const message = error instanceof Error ? error.message : "Unable to process your request.";
            setChatError(message);
            toast.error(message);

            if (currentChatId) {
                try {
                    await saveChatMessage(currentChatId, "user", trimmedInput || "File Upload");
                    await saveChatMessage(currentChatId, "assistant", `Request failed: ${message}`);
                } catch {
                    // Keep the UI responsive even if manual sync also fails.
                }
            }

            const errorMsg: Message = {
                role: "assistant",
                content: `Error: ${message}`,
                timestamp: formatTimestamp()
            };
            setMessages((prev) => [...prev, errorMsg]);
        } finally {
            setShowDots(false);
            setIsLoading(false);
            stopGenerationRef.current = false;
        }
    };

    const handleStopGeneration = () => {
        stopGenerationRef.current = true;
        setIsLoading(false);
        setShowDots(false);
    };

    if (authed === null) {
        return (
            <div className="h-screen w-full bg-[#0a0a0a] text-white flex items-center justify-center">
                <ChatLoader isDarkMode={isDarkMode} />
            </div>
        );
    }

    if (!authed) {
        window.location.href = "/";
        return null;
    }

    const isChatEmpty = messages.length === 0 || messages.every((msg) => msg.localOnly);

    return (
        <div className={`${chatHeadingFont.variable} ${chatBodyFont.variable} ${chatAccentFont.variable} chat-shell h-screen w-full ${isDarkMode ? "bg-[#0a0a0a] text-white" : "bg-white text-black"} selection:bg-white selection:text-black flex overflow-hidden transition-colors duration-500 ${isDarkMode ? "custom-scrollbar" : "light-scrollbar"}`}>
            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes bounceArrowLeft {
                    0%, 100% { transform: translateY(-50%) translateX(0) scale(1.1); }
                    50% { transform: translateY(-50%) translateX(4px) scale(1.1); }
                }
                @keyframes bounceArrowRight {
                    0%, 100% { transform: translateY(-50%) translateX(0) scale(1.1); }
                    50% { transform: translateY(-50%) translateX(-4px) scale(1.1); }
                }
                .toggle-btn-left {
                    animation: bounceArrowLeft 2s infinite ease-in-out;
                }
                .toggle-btn-right {
                    animation: bounceArrowRight 2s infinite ease-in-out;
                }
                @keyframes scrollUp {
                    0% { transform: translateY(0); }
                    100% { transform: translateY(-50%); }
                }
                @keyframes scrollDown {
                    0% { transform: translateY(-50%); }
                    100% { transform: translateY(0); }
                }
                .animate-scroll-up {
                    animation: scrollUp 35s linear infinite;
                }
                .animate-scroll-down {
                    animation: scrollDown 45s linear infinite;
                }
                .animate-scroll-up-slow {
                    animation: scrollUp 50s linear infinite;
                }
                .animate-scroll-down-slow {
                    animation: scrollDown 40s linear infinite;
                }
                .no-scrollbar::-webkit-scrollbar {
                    display: none !important;
                }
                .no-scrollbar {
                    -ms-overflow-style: none !important;
                    scrollbar-width: none !important;
                }
            `}} />
            <div className={`absolute inset-0 noise opacity-[0.02] pointer-events-none ${isDarkMode ? "invert-0" : "invert"}`} />

            {/* Mobile Sidebar Overlays */}
            {isMobile && !isSidebarCollapsed && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 transition-opacity duration-300"
                    onClick={() => setIsSidebarCollapsed(true)}
                />
            )}
            {isMobile && !isRightSidebarCollapsed && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 transition-opacity duration-300"
                    onClick={() => setIsRightSidebarCollapsed(true)}
                />
            )}

            <aside
                style={{ width: isSidebarCollapsed ? (isMobile ? "0px" : "72px") : (isMobile ? "280px" : `${sidebarWidth}px`) }}
                className={`h-full border-r-2 ${isSidebarCollapsed && isMobile ? "border-r-0" : isDarkMode ? "border-white" : "border-black"} ${isDarkMode ? "bg-[#0a0a0a]" : "bg-[#fcfcfc]"} flex flex-col ${isMobile ? "fixed left-0 top-0 bottom-0 h-[100dvh] z-[60] shadow-2xl" : "relative z-20"} transition-[width] duration-300 ease-in-out ${isResizingLeft ? "transition-none" : ""}`}
            >
                {!isSidebarCollapsed ? (
                    <div className="flex flex-col h-full overflow-hidden">
                        <div className={`p-6 border-b-2 ${isDarkMode ? "border-white" : "border-black"} flex items-center justify-between`}>
                            <Link href="/" className="flex items-center gap-3">
                                <div className="h-[44px] w-[44px] flex items-center justify-center overflow-hidden">
                                    <img
                                        src={isDarkMode ? "/dark.png" : "/light.png"}
                                        alt="Logo"
                                        className="h-full w-full object-contain transition-transform duration-300"
                                        style={{ transform: isDarkMode ? "scale(1.5)" : "none" }}
                                    />
                                </div>
                            </Link>
                            <button
                                onClick={handleCreateChat}
                                disabled={isCreatingChat}
                                title="New Chat"
                                className={`p-2 transition-all duration-300 border-2 disabled:opacity-50 ${isDarkMode ? "bg-white border-white hover:bg-gray-200 hover:scale-110 hover:shadow-[0_0_15px_rgba(255,255,255,0.3)]" : "bg-white border-black hover:bg-gray-50 hover:scale-110 hover:shadow-[0_0_15px_rgba(0,0,0,0.3)]"} group`}
                            >
                                <Plus className={`h-4 w-4 ${isDarkMode ? "text-black group-hover:text-black" : "text-black group-hover:text-black"} transition-transform group-hover:rotate-90`} />
                            </button>
                        </div>

                        {/* Sidebar Tab Switcher */}
                        <div className={`flex ${isDarkMode ? "border-white" : "border-black"} border-b-2`}>
                            <button
                                onClick={() => setSidebarTab("history")}
                                className={`flex-1 py-3 text-[9px] font-mono uppercase tracking-[0.2em] transition-all ${sidebarTab === "history"
                                    ? (isDarkMode ? "bg-white text-black font-bold" : "bg-[#00DDDD] text-white font-bold shadow-[inset_0_-2px_0_rgba(0,0,0,0.2)]")
                                    : (isDarkMode ? "text-white/40 hover:text-white hover:bg-white/5" : "text-black hover:bg-black/5")
                                    }`}
                            >
                                <Clock className="h-3 w-3 inline mr-1.5 -mt-0.5" />
                                History
                            </button>
                            <button
                                onClick={() => setSidebarTab("modes")}
                                className={`flex-1 py-3 text-[9px] font-mono uppercase tracking-[0.2em] transition-all ${sidebarTab === "modes"
                                    ? (isDarkMode ? "bg-white text-black font-bold" : "bg-[#00DDDD] text-white font-bold shadow-[inset_0_-2px_0_rgba(0,0,0,0.2)]")
                                    : (isDarkMode ? "text-white/40 hover:text-white hover:bg-white/5" : "text-black hover:bg-black/5")
                                    }`}
                            >
                                <Bot className="h-3 w-3 inline mr-1.5 -mt-0.5" />
                                Modes
                            </button>
                        </div>

                        <div className={`flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-2 ${isDarkMode ? "custom-scrollbar" : "light-scrollbar"}`}>
                            {sidebarTab === "history" && (
                                <>
                                    {sidebarWidth > 120 && (
                                        <div className="mb-8">
                                            <div className="relative group">
                                                <Search className={`absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 ${isDarkMode ? "text-white group-focus-within:text-white" : "text-black group-focus-within:text-black"} transition-colors`} />
                                                <input
                                                    type="text"
                                                    placeholder="Search sessions..."
                                                    value={searchQuery}
                                                    onChange={(e) => setSearchQuery(e.target.value)}
                                                    className={`w-full ${isDarkMode ? "bg-white/5 border-white placeholder:text-white/30" : "bg-white border-black placeholder:text-black"} border p-2 pl-9 text-[10px] font-mono uppercase tracking-widest focus:outline-none focus:border-white transition-all ${isDarkMode ? "text-white" : "text-black"}`}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-1">
                                        {sidebarWidth > 120 && <span className={`px-2 text-[9px] font-mono uppercase tracking-[0.3em] ${isDarkMode ? "text-white/20" : "text-black"}`}>Recent Sessions</span>}
                                        {isSessionsLoading && (
                                            <div className={`px-3 py-4 text-[10px] font-mono uppercase tracking-[0.2em] ${isDarkMode ? "text-white/30" : "text-black"}`}>
                                                Loading sessions...
                                            </div>
                                        )}
                                        {!isSessionsLoading && filteredChats.length === 0 && (
                                            <div className={`px-3 py-4 text-[10px] font-mono uppercase tracking-[0.2em] ${isDarkMode ? "text-white/30" : "text-black"}`}>
                                                {searchQuery ? "No matching sessions" : "No chats yet"}
                                            </div>
                                        )}
                                        {!isSessionsLoading && filteredChats.map((chat) => (
                                            <div
                                                key={chat.id}
                                                className={`group flex items-center gap-1 pr-2 transition-all duration-300 ${activeChatId === chat.id
                                                    ? (isDarkMode ? "bg-[#00DDDD]/10 border-l-2 border-[#00DDDD]" : "bg-[#00DDDD] border-l-2 border-black shadow-[0_4px_20px_rgba(0,221,221,0.3)]")
                                                    : ""
                                                    }`}
                                            >
                                                {editingChatId === chat.id ? (
                                                    <div className="flex-1 flex items-center gap-1 p-1.5">
                                                        <input
                                                            ref={editingChatId === chat.id ? editingInputRef : null}
                                                            type="text"
                                                            value={editingTitle}
                                                            onChange={(e) => setEditingTitle(e.target.value)}
                                                            onKeyDown={(e) => {
                                                                if (e.key === "Enter") void handleRenameChat();
                                                                if (e.key === "Escape") handleCancelEditing();
                                                            }}
                                                            onBlur={() => void handleRenameChat()}
                                                            className={`w-full p-2 text-xs border bg-transparent focus:outline-none ${isDarkMode ? "border-white/40 text-white" : "border-black/40 text-black"}`}
                                                            autoFocus
                                                        />
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => void openChat(chat.id)}
                                                        onDoubleClick={() => handleStartEditing(chat)}
                                                        className={`flex-1 text-left p-3 text-xs flex items-center gap-3 transition-colors min-w-0 ${activeChatId === chat.id
                                                            ? (isDarkMode ? "text-[#00DDDD]" : "text-white")
                                                            : (isDarkMode ? "text-white/60 hover:bg-white/5" : "text-black hover:bg-black/5")
                                                            }`}
                                                    >
                                                        <MessageSquare className={`h-3 w-3 flex-shrink-0 ${activeChatId === chat.id
                                                            ? (isDarkMode ? "text-[#00DDDD]" : "text-white")
                                                            : (isDarkMode ? "text-white/20" : "text-black")
                                                            }`} />
                                                        {sidebarWidth > 120 && <span className={`truncate font-sans ${activeChatId === chat.id ? "font-bold" : (isDarkMode ? "opacity-60" : "text-black")}`}>{chat.title}</span>}
                                                    </button>
                                                )}
                                                {sidebarWidth > 120 && editingChatId !== chat.id && (
                                                    <>
                                                        <button
                                                            onClick={() => handleStartEditing(chat)}
                                                            className={`${isMobile ? "opacity-100" : "opacity-0 group-hover:opacity-100"} transition-all duration-300 p-1.5 flex-shrink-0 ${isDarkMode ? "text-white/40 hover:text-white hover:scale-110" : "text-black hover:scale-110"}`}
                                                            aria-label={`Rename ${chat.title}`}
                                                        >
                                                            <Edit3 className="h-3 w-3" />
                                                        </button>
                                                        <button
                                                            onClick={() => void handleDeleteChat(chat.id)}
                                                            className={`${isMobile ? "opacity-100" : "opacity-0 group-hover:opacity-100"} transition-all duration-300 p-1.5 flex-shrink-0 ${isDarkMode ? "text-white/40 hover:text-red-400 hover:scale-110" : "text-black hover:text-red-600 hover:scale-110"}`}
                                                            aria-label={`Delete ${chat.id}`}
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        ))}
                                        {chatError && sidebarWidth > 120 && (
                                            <p className="px-2 pt-3 text-[10px] text-red-400">{chatError}</p>
                                        )}
                                    </div>
                                </>
                            )}

                            {sidebarTab === "modes" && (
                                <div className="space-y-1 px-1">
                                    {sidebarWidth > 120 && <span className={`px-2 text-[9px] font-mono uppercase tracking-[0.3em] ${isDarkMode ? "text-white/20" : "text-black"}`}>AI Engines</span>}
                                    {visibleEngines.map((engine) => {
                                        const featureId = getFeatureIdForEngine(engine.name)
                                        const isAvailable = planFeatures.length === 0 || planFeatures.includes(featureId)
                                        return (
                                            <button
                                                key={engine.name}
                                                onClick={() => {
                                                    if (!isAvailable) {
                                                        window.location.href = "/pricing"
                                                        return
                                                    }
                                                    if (engine.name === "Interview Prep") {
                                                        setIsInterviewModalOpen(true);
                                                    } else if (engine.name === "Mock Paper Generator") {
                                                        setIsMockPaperModalOpen(true);
                                                    } else if (engine.name === "Persona Mode") {
                                                        setIsPersonaModalOpen(true);
                                                    } else if (engine.name === "Battle Arena") {
                                                        setIsBattleArenaModalOpen(true);
                                                    } else {
                                                        setSelectedEngine(engine.name);
                                                    }
                                                }}
                                                className={`w-full flex items-center gap-3 p-3 text-xs transition-all ${selectedEngine === engine.name
                                                    ? (isDarkMode ? "bg-[#00DDDD]/10 text-[#00DDDD] border-l-2 border-[#00DDDD]" : "bg-[#00DDDD] text-white border-l-2 border-black shadow-[0_4px_20px_rgba(0,221,221,0.4)]")
                                                    : (isDarkMode ? "text-white/60 hover:text-white hover:bg-white/5" : "text-black hover:bg-black/5")
                                                    }`}
                                            >
                                                {(() => {
                                                    const Icon = engine.icon as any;
                                                    return (
                                                        <Icon className={`h-4 w-4 flex-shrink-0 ${isDarkMode ? 'text-white' : (selectedEngine === engine.name ? 'text-white' : 'text-black')}`} />
                                                    );
                                                })()}
                                                {sidebarWidth > 120 && (
                                                    <div className="flex items-center justify-between w-full min-w-0">
                                                        <span className="truncate">{engine.name}</span>
                                                        <div className="flex items-center gap-2 flex-shrink-0">
                                                            {isAvailable ? (
                                                                <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                                                            ) : (
                                                                <XCircle className="h-3.5 w-3.5 text-red-400" />
                                                            )}
                                                            <span className={`text-[8px] font-mono ${isDarkMode ? "text-white/30" : "text-black"}`}>{engine.version}</span>
                                                        </div>
                                                    </div>
                                                )}
                                            </button>
                                        )
                                    })}
                                </div>
                            )}
                        </div>

                        {/* User Profile */}
                        {!isMobile && (
                            <div className={`p-6 border-t-2 ${isDarkMode ? "border-white bg-black/40" : "border-black bg-white"}`}>
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className={`h-10 w-10 ${isDarkMode ? "bg-white/5 border-white" : "bg-white border-black"} border flex items-center justify-center relative group`}>
                                            <User className={`h-5 w-5 ${isDarkMode ? "text-white" : "text-black"}`} />
                                            <div className={`absolute top-0 left-0 w-1 h-1 border-t border-l ${isDarkMode ? "border-white" : "border-black"}`} />
                                        </div>
                                        {sidebarWidth > 120 && (
                                            <div className="flex flex-col">
                                                <span className={`text-xs font-bold ${isDarkMode ? "text-white" : "text-black"}`}>{userName || userEmail || "User"}</span>
                                                <span className={`text-[9px] font-mono uppercase tracking-widest ${isDarkMode ? "text-white/60" : "text-black"}`}>Pro Member</span>
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        onClick={toggleTheme}
                                        className={`p-2 border transition-all duration-300 group ${isDarkMode ? "border-white hover:bg-white/5 hover:scale-110 hover:shadow-[0_0_15px_rgba(255,255,255,0.3)]" : "border-black bg-white hover:bg-gray-50 hover:scale-110 hover:shadow-[0_0_15px_rgba(0,0,0,0.3)]"}`}
                                        title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                                    >
                                        <div className="group-hover:rotate-180 transition-transform duration-500">
                                            {isDarkMode ? <Moon className="h-4 w-4 text-white" /> : <Sun className="h-4 w-4 text-black" />}
                                        </div>
                                    </button>
                                </div>
                                <button
                                    onClick={() => {
                                        removeApiKey();
                                        removeUserInfo();
                                        setStoredActiveChatId(null);
                                        setAuthed(false);
                                        setUserName("");
                                        setUserEmail("");
                                        window.location.href = "/";
                                    }}
                                    title="Logout"
                                    className={`w-full flex items-center justify-center gap-3 p-3 border-2 ${isDarkMode ? "border-white bg-white/5 text-[10px] font-mono uppercase tracking-widest hover:bg-red-500 hover:text-white hover:border-red-500 transition-all active:scale-95 text-white" : "border-black bg-white text-[10px] font-mono uppercase tracking-widest hover:bg-red-500 hover:text-white hover:border-red-500 transition-all active:scale-95 text-black"}`}
                                >
                                    <LogOut className={`h-3 w-3 ${isDarkMode ? "text-white" : "text-black"}`} /> {sidebarWidth > 120 && "Logout session"}
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col h-full items-center py-6 justify-between overflow-hidden w-full">
                        {/* Top: Logo */}
                        <div className="flex flex-col items-center w-full">
                            <Link href="/" className="flex items-center justify-center mb-4">
                                <div className="h-10 w-10 flex items-center justify-center overflow-hidden">
                                    <img
                                        src={isDarkMode ? "/dark.png" : "/light.png"}
                                        alt="Logo"
                                        className="h-full w-full object-contain transition-transform duration-300"
                                        style={{ transform: isDarkMode ? "scale(1.5)" : "none" }}
                                    />
                                </div>
                            </Link>
                            <div className={`h-[1px] w-8 ${isDarkMode ? "bg-white/10" : "bg-black/10"}`} />
                        </div>

                        {/* Middle Group: All active icons tightly stacked with identical sizes */}
                        <div className="flex flex-col items-center gap-3 w-full my-auto py-4">
                            <button
                                onClick={handleCreateChat}
                                disabled={isCreatingChat}
                                title="New Chat"
                                className={`h-11 w-11 flex items-center justify-center border-2 disabled:opacity-50 transition-all duration-300 ${isDarkMode
                                    ? "bg-white border-white text-black hover:bg-gray-200 hover:scale-110"
                                    : "bg-white border-black text-black hover:bg-gray-50 hover:scale-110"
                                    }`}
                            >
                                <Plus className="h-4 w-4 text-black font-bold" />
                            </button>

                            <button
                                onClick={() => {
                                    setSidebarTab("history");
                                    setIsSidebarCollapsed(false);
                                }}
                                title="History"
                                className={`h-11 w-11 flex items-center justify-center border-2 transition-all duration-300 ${sidebarTab === "history"
                                    ? (isDarkMode ? "bg-white border-white text-black font-bold" : "bg-[#00DDDD] border-black text-white font-bold")
                                    : (isDarkMode ? "border-white/20 text-white/60 hover:border-white hover:text-white hover:bg-white/5" : "bg-white border-black text-black hover:bg-gray-50 hover:scale-110")
                                    }`}
                            >
                                <Clock className="h-4 w-4" />
                            </button>

                            <button
                                onClick={() => {
                                    setSidebarTab("modes");
                                    setIsSidebarCollapsed(false);
                                }}
                                title="Modes"
                                className={`h-11 w-11 flex items-center justify-center border-2 transition-all duration-300 ${sidebarTab === "modes"
                                    ? (isDarkMode ? "bg-white border-white text-black font-bold" : "bg-black border-black text-white font-bold")
                                    : (isDarkMode ? "border-white/20 text-white/60 hover:border-white hover:text-white hover:bg-white/5" : "bg-white border-black text-black hover:bg-gray-50 hover:scale-110")
                                    }`}
                            >
                                <Bot className="h-4 w-4" />
                            </button>

                            <button
                                onClick={toggleTheme}
                                title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                                className={`h-11 w-11 flex items-center justify-center border-2 transition-all duration-300 ${isDarkMode
                                    ? "border-white/20 text-white/60 hover:border-white hover:text-white hover:bg-white/5"
                                    : "bg-white border-black text-black hover:bg-gray-50 hover:scale-110"
                                    }`}
                            >
                                {isDarkMode ? <Moon className="h-4 w-4 text-white" /> : <Sun className="h-4 w-4 text-black" />}
                            </button>
                        </div>

                        {/* Bottom: Logout with identical size */}
                        {/* Bottom: Logout with identical size */}
                        {!isMobile && (
                            <div className="flex flex-col items-center w-full px-2">
                                <button
                                    onClick={() => {
                                        removeApiKey();
                                        removeUserInfo();
                                        setStoredActiveChatId(null);
                                        setAuthed(false);
                                        setUserName("");
                                        setUserEmail("");
                                        window.location.href = "/";
                                    }}
                                    title="Logout"
                                    className={`h-11 w-11 flex items-center justify-center border-2 transition-all duration-300 ${isDarkMode
                                        ? "border-white/20 bg-white/5 text-white hover:bg-red-500 hover:text-white hover:border-red-500"
                                        : "bg-white border-black text-black hover:bg-red-500 hover:text-white hover:border-red-500"
                                        }`}
                                >
                                    <LogOut className="h-4 w-4" />
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Resize Handle */}
                <div
                    onMouseDown={startResizingLeft}
                    className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-white/20 transition-colors z-30 ${isMobile ? "hidden" : ""}`}
                />

                {/* Left Toggle Button */}
                <button
                    onClick={() => {
                        const newCollapsed = !isSidebarCollapsed;
                        setIsSidebarCollapsed(newCollapsed);
                        if (!newCollapsed) {
                            setIsRightSidebarCollapsed(true);
                        }
                    }}
                    className={`absolute top-1/2 -translate-y-1/2 z-50 p-2 bg-[#0a0a0a] border-2 border-white/30 text-white/40 hover:text-white hover:scale-110 hover:shadow-[0_0_15px_rgba(255,255,255,0.3)] transition-all rounded-full shadow-xl shadow-black/20 toggle-btn-left ${isMobile ? "hidden" : ""}`}
                    style={isMobile && isSidebarCollapsed ? { left: "0.8rem" } : { right: isSidebarCollapsed ? "-2.2rem" : "-0.95rem" }}
                >
                    {isSidebarCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
                </button>
            </aside>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col relative h-full overflow-hidden">
                {/* Fixed Header / Navbar */}
                <header className={`h-20 flex-shrink-0 border-b-2 ${isDarkMode ? "border-white bg-[#0a0a0a]/80" : "border-black bg-white/80"} backdrop-blur-xl flex items-center justify-between px-4 md:px-10 relative z-30`}>
                    <div className="flex items-center gap-4">
                        <div className="h-[44px] w-[44px] flex items-center justify-center overflow-hidden">
                            <img
                                src={isDarkMode ? "/dark.png" : "/light.png"}
                                alt="Logo"
                                className="h-full w-full object-contain transition-transform duration-300"
                                style={{ transform: isDarkMode ? "scale(1.5)" : "none" }}
                            />
                        </div>
                        {!isMobile && (
                            <div className="h-5 flex items-center shrink-0 overflow-hidden ml-1">
                                <img
                                    src={isDarkMode ? "/dark_text.png" : "/light_text.png"}
                                    alt="Rudranex"
                                    className="h-full object-contain"
                                />
                            </div>
                        )}
                    </div>
                    {isMobile ? (
                        <div className="flex items-center gap-2">
                            {/* Chat Sidebar Toggler */}
                            <button
                                onClick={() => {
                                    setIsSidebarCollapsed(!isSidebarCollapsed);
                                    setIsRightSidebarCollapsed(true);
                                }}
                                className={`p-2 border transition-all duration-300 ${isDarkMode ? "border-white/20 hover:bg-white/5 text-white" : "border-black bg-white text-black hover:bg-gray-50"}`}
                                title="Toggle Sessions History"
                            >
                                <MessageSquare className="h-4 w-4" />
                            </button>

                            {/* Right Sidebar Toggler */}
                            <button
                                onClick={() => {
                                    setIsRightSidebarCollapsed(!isRightSidebarCollapsed);
                                    setIsSidebarCollapsed(true);
                                }}
                                className={`p-2 border transition-all duration-300 ${isDarkMode ? "border-white/20 hover:bg-white/5 text-white" : "border-black bg-white text-black hover:bg-gray-50"}`}
                                title="Toggle Plan Details"
                            >
                                <UserCog className="h-4 w-4" />
                            </button>

                            {/* Theme Toggler */}
                            <button
                                onClick={toggleTheme}
                                className={`p-2 border transition-all duration-300 ${isDarkMode ? "border-white/20 hover:bg-white/5 text-white" : "border-black bg-white text-black hover:bg-gray-50"}`}
                                title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                            >
                                {isDarkMode ? <Moon className="h-4 w-4 text-white" /> : <Sun className="h-4 w-4 text-black" />}
                            </button>

                            {/* Logout button */}
                            <button
                                onClick={() => {
                                    removeApiKey();
                                    removeUserInfo();
                                    setStoredActiveChatId(null);
                                    setAuthed(false);
                                    setUserName("");
                                    setUserEmail("");
                                    window.location.href = "/";
                                }}
                                title="Logout"
                                className={`p-2 border-2 transition-all active:scale-95 ${isDarkMode
                                    ? "border-white bg-white/5 text-white hover:bg-red-500 hover:text-white hover:border-red-500"
                                    : "border-black bg-white text-black hover:bg-red-500 hover:text-white hover:border-red-500"
                                    }`}
                            >
                                <LogOut className="h-4 w-4" />
                            </button>
                        </div>
                    ) : (
                        <div className="hidden md:flex flex-col items-end gap-0.5">
                            <span className={`text-[9px] font-mono uppercase tracking-[0.2em] ${isDarkMode ? (selectedEngine === "AI Image Lab" ? "text-white/70" : "text-white/30") : "text-black/40"}`}>Current Session</span>
                            <div className="flex items-center gap-2">
                                <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full ${isDarkMode ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-emerald-500/10 border border-emerald-500/20"}`}>
                                    <div className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                    <span className="text-[8px] font-mono text-emerald-500 uppercase tracking-widest">Active</span>
                                </div>
                                <span className={`text-xs ${isDarkMode ? "text-white/70" : "text-black/70"}`}>{activeChat?.title || "Unsaved chat"}</span>
                            </div>
                        </div>
                    )}
                </header>

                <main className={`flex-1 ${isChatEmpty ? "overflow-y-hidden flex flex-col justify-center pt-20 md:pt-32 pb-16" : "overflow-y-auto block pt-10 pb-36"} px-4 md:px-20 relative z-10 ${isDarkMode ? "custom-scrollbar" : "light-scrollbar"}`}>
                    <div className={`${isChatEmpty ? "w-full" : "max-w-3xl w-full"} mx-auto`}>
                        {/* Error Display */}
                        {chatError && (
                            <div className="mb-4 p-4 border border-red-500/20 bg-red-500/10 text-red-400 text-sm">
                                {chatError}
                            </div>
                        )}

                        {/* Chat Area */}
                        <div className="space-y-16">
                            {isHistoryLoading && <ChatLoader isDarkMode={isDarkMode} />}
                            <AnimatePresence initial={false}>
                                {messages.length === 0 || messages.every((msg) => msg.localOnly) ? (
                                    selectedEngine === "AI Image Lab" ? (
                                        <div className="w-full max-w-4xl mx-auto py-4 md:py-2 px-0">
                                            {/* Redesigned AI Image Lab Header */}
                                            <div className="text-center mb-4 md:mb-2 px-4 md:px-0">

                                                <motion.h1
                                                    initial={{ opacity: 0, y: -10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ duration: 0.5, delay: 0.1 }}
                                                    className={`text-2xl sm:text-3xl md:text-5xl font-sans font-extrabold tracking-tight mb-2 md:mb-4 ${isDarkMode
                                                        ? "text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]"
                                                        : "text-black"
                                                        }`}
                                                >
                                                    Choose Your Visual Style
                                                </motion.h1>
                                                <motion.p
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ duration: 0.5, delay: 0.2 }}
                                                    className={`text-xs sm:text-sm md:text-base font-sans max-w-xs sm:max-w-lg mx-auto ${isDarkMode ? "text-white/90 drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]" : "text-black/60"
                                                        }`}
                                                >
                                                    Select a style template and let your imagination come to life.
                                                </motion.p>
                                            </div>

                                            {/* Style Cards Horizontally Scrollable Slider */}
                                            <div className="relative w-full sm:px-12 px-0">
                                                {/* Left Arrow Button - hidden on mobile, shown on sm+ */}
                                                <button
                                                    onClick={() => scrollStyleCards("left")}
                                                    className={`hidden sm:flex absolute left-0 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full border-2 transition-all duration-300 items-center justify-center shadow-2xl active:scale-90 ${isDarkMode
                                                        ? "bg-black/90 border-white/15 text-white/95 hover:text-[#00DDDD] hover:border-[#00DDDD] hover:shadow-[0_0_20px_rgba(0,221,221,0.5)]"
                                                        : "bg-white/95 border-black/15 text-black hover:text-[#00DDDD] hover:border-[#00DDDD] hover:shadow-[0_0_20px_rgba(0,221,221,0.3)]"
                                                        }`}
                                                    title="Scroll Left"
                                                >
                                                    <ChevronLeft className="h-6 w-6 stroke-[2.5]" />
                                                </button>

                                                {/* Right Arrow Button - hidden on mobile, shown on sm+ */}
                                                <button
                                                    onClick={() => scrollStyleCards("right")}
                                                    className={`hidden sm:flex absolute right-0 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full border-2 transition-all duration-300 items-center justify-center shadow-2xl active:scale-90 ${isDarkMode
                                                        ? "bg-black/90 border-white/15 text-white/95 hover:text-[#00DDDD] hover:border-[#00DDDD] hover:shadow-[0_0_20px_rgba(0,221,221,0.5)]"
                                                        : "bg-white/95 border-black/15 text-black hover:text-[#00DDDD] hover:border-[#00DDDD] hover:shadow-[0_0_20px_rgba(0,221,221,0.3)]"
                                                        }`}
                                                    title="Scroll Right"
                                                >
                                                    <ChevronRight className="h-6 w-6 stroke-[2.5]" />
                                                </button>

                                                {/* Scrollable Container */}
                                                <motion.div
                                                    ref={styleCardsScrollRef}
                                                    variants={{
                                                        hidden: { opacity: 0 },
                                                        show: {
                                                            opacity: 1,
                                                            transition: {
                                                                staggerChildren: 0.05
                                                            }
                                                        }
                                                    }}
                                                    initial="hidden"
                                                    animate="show"
                                                    className="flex flex-row flex-nowrap overflow-x-auto no-scrollbar scroll-smooth gap-3 sm:gap-5 py-2 sm:py-1 w-full px-4 sm:px-0"
                                                >
                                                    {IMAGE_STYLES.map((style) => {
                                                        const isSelected = selectedImageStyle === style.id;
                                                        return (
                                                            <motion.div
                                                                key={style.id}
                                                                variants={{
                                                                    hidden: { opacity: 0, x: 30, scale: 0.95 },
                                                                    show: {
                                                                        opacity: 1,
                                                                        x: 0,
                                                                        scale: 1,
                                                                        transition: {
                                                                            type: "spring",
                                                                            stiffness: 100,
                                                                            damping: 15
                                                                        }
                                                                    }
                                                                }}
                                                                whileHover={{ scale: 1.03, y: -2 }}
                                                                whileTap={{ scale: 0.98 }}
                                                                onClick={() => {
                                                                    setSelectedImageStyle(style.id);
                                                                    // Find if input already starts with another style's prompt
                                                                    const currentStyle = IMAGE_STYLES.find(s => input.startsWith(s.prompt));
                                                                    if (currentStyle) {
                                                                        setInput(input.replace(currentStyle.prompt, style.prompt));
                                                                    } else {
                                                                        setInput(style.prompt + input);
                                                                    }
                                                                    toast.success(`Active Style: ${style.label}`);
                                                                }}
                                                                className={`group relative w-[72vw] sm:w-[calc((100%-20px)/2)] md:w-[calc((100%-40px)/3)] flex-shrink-0 aspect-[4/3] sm:aspect-[16/10] overflow-hidden rounded-[1.5rem] sm:rounded-[2.2rem] cursor-pointer border-2 transition-all duration-300 ${isSelected
                                                                    ? "border-[#00DDDD] shadow-[0_0_25px_rgba(0,221,221,0.4)]"
                                                                    : isDarkMode
                                                                        ? "border-white/5 hover:border-white/20 hover:shadow-[0_12px_30px_rgba(0,0,0,0.5)]"
                                                                        : "border-black/5 hover:border-black/20 hover:shadow-[0_12px_30px_rgba(0,0,0,0.15)]"
                                                                    }`}
                                                            >
                                                                {/* Background image preview */}
                                                                <img
                                                                    src={style.sample}
                                                                    alt={style.label}
                                                                    className="absolute inset-0 w-full h-full object-cover select-none transition-transform duration-500 ease-out group-hover:scale-105"
                                                                    loading="lazy"
                                                                />

                                                                {/* Linear overlay */}
                                                                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent transition-opacity duration-300 group-hover:opacity-90" />

                                                                {/* Selected Check Indicator */}
                                                                {isSelected && (
                                                                    <div className="absolute top-2 right-2 sm:top-4 sm:right-4 h-5 w-5 sm:h-6 sm:w-6 rounded-full bg-[#00DDDD] text-black flex items-center justify-center shadow-[0_0_12px_rgba(0,221,221,0.6)] z-20">
                                                                        <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 stroke-[3]" />
                                                                    </div>
                                                                )}

                                                                {/* Label text */}
                                                                <div className="absolute bottom-3 sm:bottom-5 left-3 sm:left-5 right-3 sm:right-5 text-left z-10">
                                                                    <span className="text-white text-sm sm:text-base md:text-lg font-sans font-semibold tracking-tight leading-tight block group-hover:text-[#00DDDD] transition-colors duration-200">
                                                                        {style.label}
                                                                    </span>
                                                                </div>
                                                            </motion.div>
                                                        );
                                                    })}
                                                </motion.div>
                                            </div>
                                        </div>
                                    ) : (
                                        <WelcomeBox
                                            isDarkMode={isDarkMode}
                                            onSelectEngine={(engine) => {
                                                setSelectedEngine(engine);
                                                setShowEngineSelect(false);
                                            }}
                                            onOpenMockPaper={() => setIsMockPaperModalOpen(true)}
                                            onOpenInterview={() => setIsInterviewModalOpen(true)}
                                            hiddenEngines={userRole === "employee" ? employeeRestrictedEngines : []}
                                        />
                                    )
                                ) : (
                                    messages.map((msg, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                                            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} w-full`}
                                        >
                                            <div className={`flex flex-col ${msg.role === "user" ? "items-end max-w-[90%] md:max-w-[80%]" : "items-start max-w-[90%] md:max-w-[60%]"}`}>
                                                <div className="flex items-center gap-3 mb-4">
                                                    <span className={`text-[9px] font-mono uppercase tracking-[0.2em] ${isDarkMode ? (selectedEngine === "AI Image Lab" ? "text-white/80 drop-shadow-[0_1px_3px_rgba(0,0,0,1)]" : "text-white/30") : (selectedEngine === "AI Image Lab" ? "text-black drop-shadow-[0_1px_3px_rgba(255,255,255,0.9)]" : "text-black/60")}`}>
                                                        {msg.role === "assistant" ? "§ RUDRA_AI" : "§ STUDENT_USER"}
                                                    </span>
                                                    <span className={`text-[9px] font-mono ${isDarkMode ? (selectedEngine === "AI Image Lab" ? "text-white/60 drop-shadow-[0_1px_3px_rgba(0,0,0,1)]" : "text-white/20") : (selectedEngine === "AI Image Lab" ? "text-black drop-shadow-[0_1px_3px_rgba(255,255,255,0.9)]" : "text-black/60")}`}>{msg.timestamp}</span>
                                                </div>

                                                <div className={`py-1.5 px-4 md:py-2 md:px-5 ${msg.role === "user"
                                                    ? (isDarkMode ? "bg-black border border-white/20 rounded-[18px_4px_18px_4px]" : (selectedEngine === "AI Image Lab" ? "bg-white border-2 border-black/10 rounded-[18px_4px_18px_4px]" : "bg-transparent border-2 border-black rounded-[18px_4px_18px_4px]"))
                                                    : (isDarkMode ? "bg-transparent rounded-[2.5rem]" : "bg-transparent rounded-[2.5rem]")
                                                    } relative group`}>
                                                    {msg.role === "user" ? (
                                                        <p className={`text-base md:text-lg leading-relaxed ${isDarkMode ? "text-white font-sans" : "text-black font-sans"}`}>
                                                            {msg.content}
                                                        </p>
                                                    ) : isImageContent(msg.content) ? (
                                                        <div className="relative group/img-wrapper max-w-full">
                                                            <img
                                                                src={msg.content}
                                                                alt="Generated image"
                                                                className="w-full h-auto rounded-2xl border border-white/10 shadow-2xl transition-transform duration-300 group-hover/img-wrapper:scale-[1.01]"
                                                            />
                                                            <button
                                                                onClick={() => handleDownloadImage(msg.content)}
                                                                title="Download Image"
                                                                className="absolute bottom-4 right-4 p-3 rounded-full bg-black/80 hover:bg-black text-white hover:text-[#00DDDD] border border-white/20 shadow-lg backdrop-blur-md opacity-0 group-hover/img-wrapper:opacity-100 transition-all duration-300 scale-90 group-hover/img-wrapper:scale-100 flex items-center justify-center gap-1.5 hover:scale-105 active:scale-95"
                                                            >
                                                                <FileDown className="h-4 w-4" />
                                                                <span className="text-[10px] font-mono uppercase tracking-wider font-bold pr-1">Download</span>
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <MarkdownRenderer content={msg.content} isDarkMode={isDarkMode} />
                                                    )}

                                                    {msg.role === "assistant" && responseTime !== null && i === messages.length - 1 && (
                                                        <div className={`text-[8px] font-mono mt-4 text-right ${isDarkMode ? "text-white" : "text-black"}`}>
                                                            Done in {responseTime.toFixed(1)}s
                                                        </div>
                                                    )}

                                                    {msg.role === "user" && (
                                                        <>
                                                            <div className={`absolute top-0 left-0 w-1.5 h-1.5 border-t border-l ${isDarkMode ? "border-white/40" : "border-black/40"}`} />
                                                            <div className={`absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r ${isDarkMode ? "border-white/40" : "border-black/40"}`} />
                                                        </>
                                                    )}
                                                </div>

                                                {/* Action Buttons */}
                                                <div className={`flex items-center gap-3 mt-3 ${msg.role === "user" ? "justify-end" : "justify-start px-8"}`}>
                                                    {msg.role === "user" ? (
                                                        <>
                                                            <button onClick={() => setInput(msg.content)} title="Edit & resend" className={`p-2 ${isDarkMode ? (selectedEngine === "AI Image Lab" ? "text-white drop-shadow-[0_1px_3px_rgba(0,0,0,1)] hover:text-[#00DDDD]" : "text-white/60 hover:text-white") : (selectedEngine === "AI Image Lab" ? "text-black drop-shadow-[0_1px_3px_rgba(255,255,255,0.9)] hover:text-[#00AAAA]" : "text-black/60 hover:text-black")} hover:scale-105 transition-all duration-300 group`}>
                                                                <Edit3 className="h-5 w-5 group-hover:scale-110 transition-transform" />
                                                            </button>
                                                            <button onClick={() => copyToClipboard(msg.content)} title="Copy message" className={`p-2 ${isDarkMode ? (selectedEngine === "AI Image Lab" ? "text-white drop-shadow-[0_1px_3px_rgba(0,0,0,1)] hover:text-[#00DDDD]" : "text-white/60 hover:text-white") : (selectedEngine === "AI Image Lab" ? "text-black drop-shadow-[0_1px_3px_rgba(255,255,255,0.9)] hover:text-[#00AAAA]" : "text-black/60 hover:text-black")} hover:scale-105 transition-all duration-300 group`}>
                                                                <Copy className="h-5 w-5 group-hover:scale-110 transition-transform" />
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <button
                                                                title="Like"
                                                                onClick={() => void handleToggleFeedback(msg.messageId, msg.feedback, 1)}
                                                                className={`p-2 transition-all duration-300 group ${msg.feedback === 1
                                                                    ? (isDarkMode ? "text-emerald-400" : "text-emerald-600")
                                                                    : (isDarkMode ? (selectedEngine === "AI Image Lab" ? "text-white drop-shadow-[0_1px_3px_rgba(0,0,0,1)] hover:text-emerald-400 hover:scale-105" : "text-white/60 hover:text-white hover:scale-105") : (selectedEngine === "AI Image Lab" ? "text-black drop-shadow-[0_1px_3px_rgba(255,255,255,0.9)] hover:text-emerald-600 hover:scale-105" : "text-black/60 hover:text-black hover:scale-105"))
                                                                    }`}
                                                            >
                                                                <ThumbsUp className="h-5 w-5 group-hover:scale-110 transition-transform" />
                                                            </button>
                                                            <button
                                                                title="Dislike"
                                                                onClick={() => void handleToggleFeedback(msg.messageId, msg.feedback, -1)}
                                                                className={`p-2 transition-all duration-300 group ${msg.feedback === -1
                                                                    ? (isDarkMode ? "text-red-400" : "text-red-600")
                                                                    : (isDarkMode ? (selectedEngine === "AI Image Lab" ? "text-white drop-shadow-[0_1px_3px_rgba(0,0,0,1)] hover:text-red-400 hover:scale-105" : "text-white/60 hover:text-white hover:scale-105") : (selectedEngine === "AI Image Lab" ? "text-black drop-shadow-[0_1px_3px_rgba(255,255,255,0.9)] hover:text-red-600 hover:scale-105" : "text-black/60 hover:text-black hover:scale-105"))
                                                                    }`}
                                                            >
                                                                <ThumbsDown className="h-5 w-5 group-hover:scale-110 transition-transform" />
                                                            </button>
                                                            <button onClick={() => copyToClipboard(msg.content)} title="Copy message" className={`p-2 ${isDarkMode ? (selectedEngine === "AI Image Lab" ? "text-white drop-shadow-[0_1px_3px_rgba(0,0,0,1)] hover:text-[#00DDDD]" : "text-white/60 hover:text-white") : (selectedEngine === "AI Image Lab" ? "text-black drop-shadow-[0_1px_3px_rgba(255,255,255,0.9)] hover:text-[#00AAAA]" : "text-black/60 hover:text-black")} hover:scale-105 transition-all duration-300 group`}>
                                                                <Copy className="h-5 w-5 group-hover:scale-110 transition-transform" />
                                                            </button>
                                                            <button onClick={() => retryMessage(i)} title="Regenerate" className={`p-2 ${isDarkMode ? (selectedEngine === "AI Image Lab" ? "text-white drop-shadow-[0_1px_3px_rgba(0,0,0,1)] hover:text-[#00DDDD]" : "text-white/60 hover:text-white") : (selectedEngine === "AI Image Lab" ? "text-black drop-shadow-[0_1px_3px_rgba(255,255,255,0.9)] hover:text-[#00AAAA]" : "text-black/60 hover:text-black")} hover:scale-105 transition-all duration-300 group`}>
                                                                <RotateCcw className="h-5 w-5 group-hover:scale-110 transition-transform" />
                                                            </button>
                                                            <button onClick={() => downloadAsPdf("Rudranex AI Response", msg.content)} title="Download as PDF" className={`p-2 ${isDarkMode ? (selectedEngine === "AI Image Lab" ? "text-white drop-shadow-[0_1px_3px_rgba(0,0,0,1)] hover:text-[#00DDDD]" : "text-white/60 hover:text-white") : (selectedEngine === "AI Image Lab" ? "text-black drop-shadow-[0_1px_3px_rgba(255,255,255,0.9)] hover:text-[#00AAAA]" : "text-black/60 hover:text-black")} hover:scale-105 transition-all duration-300 group`}>
                                                                <FileDown className="h-5 w-5 group-hover:scale-110 transition-transform" />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))
                                )}
                            </AnimatePresence>
                            {showDots && <DotsLoader isDarkMode={isDarkMode} />}
                            <div ref={messagesEndRef} />
                        </div>
                    </div>
                </main>

                {/* Input Bar */}
                <div className={`${isMobile ? "fixed" : "absolute"} ${isMobile ? "bottom-[10px]" : "bottom-0"} left-0 right-0 z-50 p-4 md:p-10 ${isDarkMode ? "bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]" : "bg-gradient-to-t from-white via-white"} to-transparent flex justify-center`}>
                    <div className={`w-full max-w-4xl relative mb-4 md:mb-0`}>
                        <div className="relative">
                            {/* File Preview */}
                            <AnimatePresence>
                                {selectedFile && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 10 }}
                                        className={`absolute bottom-full left-4 mb-4 p-4 border-2 ${isDarkMode ? "bg-[#0d0d0d] border-white/20" : "bg-white border-black/20"} flex items-center gap-4 shadow-2xl z-40`}
                                    >
                                        <div className="h-12 w-12 flex items-center justify-center bg-white/5">
                                            {selectedFile.previewUrl ? (
                                                <img src={selectedFile.previewUrl} alt="Preview" className="h-full w-full object-cover" />
                                            ) : (
                                                <FileIcon className="h-6 w-6 opacity-40" />
                                            )}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-xs font-medium truncate max-w-[200px]">{selectedFile.name}</span>
                                            <span className="text-[10px] font-mono opacity-40 uppercase">{(selectedFile.size / 1024).toFixed(1)} KB</span>
                                        </div>
                                        <button
                                            onClick={() => setSelectedFile(null)}
                                            className="p-1 hover:bg-white/10 hover:scale-110 hover:rotate-90 transition-all duration-300 rounded-full"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* MCQ Options Panel */}
                            {mcqSession && (() => {
                                const q = mcqSession.questions[mcqSession.currentIndex];
                                const hasAnswered = mcqSession.answers[mcqSession.currentIndex] !== null;
                                return (
                                    <div className={`mb-4 p-6 ${isDarkMode ? "bg-[#0d0d0d] border-white/10" : "bg-white border-black/30"} border-2 rounded-2xl`}>
                                        <div className="grid grid-cols-2 gap-3">
                                            {q.options.map((opt, oi) => {
                                                const isSelected = mcqSession.answers[mcqSession.currentIndex] === oi;
                                                return (
                                                    <button
                                                        key={oi}
                                                        onClick={() => handleMcqOptionClick(oi)}
                                                        disabled={hasAnswered}
                                                        className={`p-4 rounded-xl border text-xs font-mono text-left transition-all ${isSelected
                                                            ? `${isDarkMode ? "bg-white text-black border-white" : "bg-black text-white border-black"} font-bold scale-[1.02]`
                                                            : hasAnswered
                                                                ? `${isDarkMode ? "border-white/10 text-white/30" : "border-black/20 text-black/30"}`
                                                                : `${isDarkMode ? "border-white/20 text-white/70 hover:border-white/50 hover:bg-white/5" : "border-black/20 text-black/70 hover:border-black/50 hover:bg-black/5"}`
                                                            }`}
                                                    >
                                                        {opt}
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </div>
                                )
                            })()}

                            {selectedEngine === "AI Image Lab" && (
                                <div className="hidden sm:block mb-3 w-full">
                                    <div className="flex flex-row flex-nowrap gap-1.5 md:gap-2 overflow-x-auto no-scrollbar w-full pb-1 scroll-smooth px-0.5 md:px-1">
                                        {IMAGE_STYLES.map((style) => {
                                            const isSelected = selectedImageStyle === style.id;
                                            return (
                                                <button
                                                    key={style.id}
                                                    onClick={() => {
                                                        setSelectedImageStyle(style.id);
                                                        const currentStyle = IMAGE_STYLES.find(s => input.startsWith(s.prompt));
                                                        if (currentStyle) {
                                                            setInput(input.replace(currentStyle.prompt, style.prompt));
                                                        } else {
                                                            setInput(style.prompt + input);
                                                        }
                                                        toast.success(`Active Style: ${style.label}`);
                                                    }}
                                                    className={`group flex items-center gap-1.5 md:gap-2 px-2.5 md:px-3 py-1 md:py-1.5 text-[10px] md:text-xs font-sans font-medium tracking-wide rounded-full border-2 transition-all duration-300 flex-shrink-0 ${isSelected
                                                        ? "bg-[#00DDDD] text-black border-[#00DDDD] shadow-[0_0_15px_rgba(0,221,221,0.45)] scale-[1.04] font-bold"
                                                        : isDarkMode
                                                            ? "bg-white/5 text-white/70 border-white/10 hover:bg-white/10 hover:text-white hover:border-white/20 hover:scale-[1.02]"
                                                            : "bg-black/5 text-black/70 border-black/10 hover:bg-black/10 hover:text-black hover:border-black/20 hover:scale-[1.02]"
                                                        }`}
                                                >
                                                    <img
                                                        src={style.sample}
                                                        alt=""
                                                        className={`w-4 h-4 md:w-5 md:h-5 rounded-full object-cover flex-shrink-0 transition-transform duration-300 group-hover:scale-110 border ${isSelected ? "border-black/20" : "border-white/10"
                                                            }`}
                                                        loading="lazy"
                                                    />
                                                    <span className="whitespace-nowrap">{style.label}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                            {/* ─── Gmail Mail Toolbar ─── */}
                            {rightSidebarTab === "gmail" && userRole === "employee" && gmailConnected && (
                                <div className="mb-2 space-y-1.5">
                                    {/* To: field + Send/Bulk toggle */}
                                    <div className="flex items-center gap-2">
                                        <span className={`text-[9px] font-mono uppercase tracking-widest shrink-0 ${isDarkMode ? "text-white/40" : "text-black/40"}`}>To:</span>
                                        <div className="relative flex-1">
                                            <input
                                                type="text"
                                                placeholder="email@example.com or comma,separated,emails"
                                                value={gmailMailTo}
                                                onChange={(e) => setGmailMailTo(e.target.value)}
                                                className={`w-full px-2 py-1.5 text-[10px] font-mono rounded border outline-none transition-all ${isDarkMode
                                                    ? "bg-white/[0.03] border-white/10 text-white placeholder-white/20 focus:border-[#4285F4]/50"
                                                    : "bg-black/[0.02] border-black/10 text-black placeholder-black/30 focus:border-[#4285F4]/50"
                                                    }`}
                                            />
                                        </div>
                                        <button
                                            onClick={() => setGmailMailTo("")}
                                            className={`p-1.5 rounded transition-all ${isDarkMode ? "hover:bg-white/10 text-white/30" : "hover:bg-black/10 text-black/30"}`}
                                            title="Clear"
                                        >
                                            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                                            </svg>
                                        </button>
                                    </div>
                                    {/* Action buttons */}
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                        <button
                                            onClick={() => {
                                                if (!gmailMailTo.trim() || !input.trim()) return;
                                                setGmailConfirmSend(true);
                                            }}
                                            disabled={!gmailMailTo.trim() || !input.trim() || gmailSending}
                                            className={`flex items-center gap-1 px-2.5 py-1.5 text-[8px] font-mono uppercase tracking-[0.15em] border rounded-md transition-all disabled:opacity-30 ${isDarkMode
                                                ? "border-white/15 text-white/60 hover:border-white/30 hover:text-white"
                                                : "border-black/15 text-black/60 hover:border-black/30 hover:text-black"
                                                }`}
                                        >
                                            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M22 2L11 13" /><path d="M22 2L15 22l-4-9-9-4z" />
                                            </svg>
                                            Send
                                        </button>
                                        <button
                                            onClick={handleTriggerAutoReply}
                                            disabled={gmailSending}
                                            className={`flex items-center gap-1 px-2.5 py-1.5 text-[8px] font-mono uppercase tracking-[0.15em] border rounded-md transition-all disabled:opacity-30 ${isDarkMode
                                                ? "border-white/15 text-white/60 hover:border-white/30 hover:text-white"
                                                : "border-black/15 text-black/60 hover:border-black/30 hover:text-black"
                                                }`}
                                        >
                                            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
                                                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                                            </svg>
                                            Auto
                                        </button>
                                        <button
                                            onClick={handleTriggerBulkAutoReply}
                                            disabled={gmailSending}
                                            className={`flex items-center gap-1 px-2.5 py-1.5 text-[8px] font-mono uppercase tracking-[0.15em] border rounded-md transition-all disabled:opacity-30 ${isDarkMode
                                                ? "border-white/15 text-white/60 hover:border-white/30 hover:text-white"
                                                : "border-black/15 text-black/60 hover:border-black/30 hover:text-black"
                                                }`}
                                        >
                                            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                            </svg>
                                            Bulk Auto
                                        </button>
                                        {gmailSendResult && (
                                            <span className={`text-[8px] font-mono ${gmailSendResult.includes("✓") ? "text-green-500" : "text-red-400"}`}>{gmailSendResult}</span>
                                        )}
                                        {gmailAutoStatus && !gmailSendResult && (
                                            <span className={`text-[8px] font-mono ${gmailAutoStatus.includes("✓") ? "text-green-500" : "text-red-400"}`}>{gmailAutoStatus}</span>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* ─── Send Confirmation Modal ─── */}
                            <AnimatePresence>
                                {gmailConfirmSend && gmailMailTo.trim() && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="fixed inset-0 z-[150] flex items-center justify-center p-4"
                                        onClick={() => { setGmailConfirmSend(false); setGmailPolishedBody(""); }}
                                    >
                                        <div className={`absolute inset-0 ${isDarkMode ? "bg-black/60" : "bg-black/40"} backdrop-blur-sm`} />
                                        <motion.div
                                            initial={{ scale: 0.92, opacity: 0, y: 20 }}
                                            animate={{ scale: 1, opacity: 1, y: 0 }}
                                            exit={{ scale: 0.92, opacity: 0, y: 20 }}
                                            onClick={(e: React.MouseEvent) => e.stopPropagation()}
                                            className={`relative w-full max-w-lg rounded-xl border p-5 shadow-2xl ${isDarkMode ? "bg-[#0a0a0a] border-white/10" : "bg-[#fcfcfc] border-black/10"}`}
                                        >
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className={`p-1.5 rounded-lg ${isDarkMode ? "bg-[#EA4335]/10" : "bg-[#EA4335]/15"}`}>
                                                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
                                                        <rect x="2" y="4" width="20" height="16" rx="2" fill="#EA4335"/>
                                                        <path d="M22 6l-10 7L2 6" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
                                                    </svg>
                                                </div>
                                                <div>
                                                    <p className={`text-[10px] font-bold font-mono uppercase tracking-[0.15em] ${isDarkMode ? "text-white" : "text-black"}`}>Send as Email</p>
                                                    <p className={`text-[8px] font-mono ${isDarkMode ? "text-white/40" : "text-black/40"}`}>
                                                        To: <span className="font-bold">{gmailMailTo.includes(",") ? `${gmailMailTo.split(",").length} recipients` : gmailMailTo}</span>
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Polished email body */}
                                            {gmailPolishing ? (
                                                <div className="flex items-center gap-2 mb-4 p-3 rounded-lg bg-white/[0.03]">
                                                    <div className="h-4 w-4 rounded-full border-2 border-t-transparent animate-spin border-[#4285F4]" />
                                                    <span className={`text-[9px] font-mono ${isDarkMode ? "text-white/50" : "text-black/50"}`}>AI is polishing your message...</span>
                                                </div>
                                            ) : gmailPolishedBody ? (
                                                <>
                                                    <textarea
                                                        value={gmailPolishedBody}
                                                        onChange={(e) => setGmailPolishedBody(e.target.value)}
                                                        rows={6}
                                                        className={`w-full mb-3 p-2.5 text-[10px] font-mono leading-relaxed rounded-lg border outline-none resize-none transition-all ${isDarkMode
                                                            ? "bg-white/[0.03] border-white/10 text-white/80 focus:border-[#4285F4]/50"
                                                            : "bg-black/[0.02] border-black/10 text-black/80 focus:border-[#4285F4]/50"
                                                            }`}
                                                    />
                                                    <div className="flex items-center gap-2 mb-4">
                                                        <button
                                                            onClick={async () => {
                                                                setGmailPolishing(true);
                                                                try {
                                                                    const { sendChatCompletion } = await import("@/lib/chat-api");
                                                                    const res = await sendChatCompletion({
                                                                        messages: [
                                                                            { role: "system", content: "You are an email writing assistant. Polish the following rough text into a professional, well-formatted email. Return ONLY the polished email body." },
                                                                            { role: "user", content: input.trim() }
                                                                        ]
                                                                    });
                                                                    setGmailPolishedBody((res as any)?.choices?.[0]?.message?.content || input.trim());
                                                                } catch {
                                                                    setGmailPolishedBody(input.trim());
                                                                }
                                                                setGmailPolishing(false);
                                                            }}
                                                            className={`flex items-center gap-1 px-2 py-1 text-[8px] font-mono rounded-md border transition-all ${isDarkMode ? "border-white/10 text-white/40 hover:border-white/30" : "border-black/10 text-black/40 hover:border-black/30"}`}
                                                        >
                                                            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
                                                                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                                                            </svg>
                                                            Regenerate
                                                        </button>
                                                        <span className={`text-[7px] font-mono ${isDarkMode ? "text-white/25" : "text-black/25"}`}>Edit freely above</span>
                                                    </div>
                                                </>
                                            ) : null}

                                            <div className="flex items-center gap-2 justify-end">
                                                <button
                                                    onClick={() => { setGmailConfirmSend(false); setGmailPolishedBody(""); }}
                                                    className={`px-3 py-1.5 text-[9px] font-mono rounded-md transition-all ${isDarkMode ? "text-white/50 hover:bg-white/10" : "text-black/50 hover:bg-black/10"}`}
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    onClick={() => handleMailSend(gmailPolishedBody || input.trim())}
                                                    disabled={gmailSending || gmailPolishing}
                                                    className={`px-4 py-1.5 text-[9px] font-mono uppercase tracking-[0.15em] font-bold rounded-md transition-all disabled:opacity-50 ${isDarkMode ? "bg-white text-black hover:bg-white/90" : "bg-black text-white hover:bg-black/90"}`}
                                                >
                                                    {gmailSending ? "Sending..." : "Send"}
                                                </button>
                                            </div>
                                        </motion.div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className={`relative flex border-2 transition-all duration-300 ${isDarkMode ? "border-white bg-[#0a0a0a] focus-within:border-white focus-within:shadow-[0_0_20px_rgba(255,255,255,0.08)]" : "border-black bg-white focus-within:border-black focus-within:shadow-[0_0_20px_rgba(0,0,0,0.08)]"}`}>
                                <div className="flex-1 min-w-0 flex">
                                    <div className="flex items-end gap-1 md:gap-2 pl-1.5 md:pl-3 pb-2.5">
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={isLoading || isProcessingFile}
                                            className={`p-2 ${isDarkMode ? "text-white hover:text-[#D4AF37]" : "text-black hover:text-[#B8962E]"} transition-all active:scale-95`}
                                            title="Attach File"
                                        >
                                            {isProcessingFile ? (
                                                <div className="h-4 w-4 border-2 border-[#D4AF37] border-t-transparent animate-spin rounded-full" />
                                            ) : (
                                                <Paperclip className="h-4 w-4" />
                                            )}
                                        </button>
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={handleFileChange}
                                            className="hidden"
                                            accept="image/*,application/pdf,text/plain,.md"
                                        />
                                    </div>

                                    <textarea
                                        value={input}
                                        onChange={(e) => {
                                            setInput(e.target.value);
                                            e.currentTarget.style.height = 'auto';
                                            e.currentTarget.style.height = e.currentTarget.scrollHeight + 'px';
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter" && !e.shiftKey && !isProcessingFile) {
                                                e.preventDefault();
                                                void handleSend();
                                            }
                                        }}
                                        onInput={(e) => {
                                            e.currentTarget.style.height = 'auto';
                                            e.currentTarget.style.height = e.currentTarget.scrollHeight + 'px';
                                        }}
                                        placeholder={isProcessingFile ? "Processing file..." : typedPlaceholder}
                                        rows={1}
                                        className={`flex-1 min-w-0 bg-transparent resize-none ${isDarkMode ? "text-white placeholder:text-white/30" : "text-black placeholder:text-black/50"} py-2.5 pl-2 text-base focus:outline-none`}
                                        style={{ maxHeight: '40vh' }}
                                    />
                                </div>

                                <div className="flex items-end justify-end gap-1 md:gap-1.5 pr-1 md:pr-2 pb-2 flex-shrink-0">
                                    {!input.trim() && !isProcessingFile && (
                                        <div className="relative flex items-center justify-center mr-1">
                                            <AnimatePresence>
                                                {isRecording && (
                                                    <>
                                                        {/* Animated Pulse Circles */}
                                                        <motion.div
                                                            initial={{ scale: 0.8, opacity: 0 }}
                                                            animate={{ scale: [1, 2, 2.5], opacity: [0.5, 0.2, 0] }}
                                                            exit={{ scale: 0.8, opacity: 0 }}
                                                            transition={{ repeat: Infinity, duration: 2, ease: "easeOut" }}
                                                            className="absolute w-8 h-8 rounded-full bg-[#00DDDD]"
                                                        />
                                                        <motion.div
                                                            initial={{ scale: 0.8, opacity: 0 }}
                                                            animate={{ scale: [1, 1.5, 2], opacity: [0.8, 0.4, 0] }}
                                                            exit={{ scale: 0.8, opacity: 0 }}
                                                            transition={{ repeat: Infinity, duration: 1.5, ease: "easeOut" }}
                                                            className="absolute w-8 h-8 rounded-full bg-[#00DDDD]"
                                                        />
                                                        {/* Sound Waves */}
                                                        <div className="absolute -top-10 flex gap-0.5 items-end justify-center h-8">
                                                            {[1, 2, 3, 4, 5].map((i) => (
                                                                <motion.div
                                                                    key={i}
                                                                    animate={{ height: [4, 16, 8, 24, 4] }}
                                                                    transition={{
                                                                        repeat: Infinity,
                                                                        duration: 0.4 + (i * 0.1),
                                                                        ease: "easeInOut"
                                                                    }}
                                                                    className="w-1 bg-[#00DDDD] rounded-full shadow-[0_0_10px_rgba(0,221,221,0.5)]"
                                                                />
                                                            ))}
                                                        </div>
                                                    </>
                                                )}
                                            </AnimatePresence>
                                            <button
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    if (isRecording) {
                                                        stopRecording();
                                                    } else {
                                                        startRecording();
                                                    }
                                                }}
                                                className={`p-2 rounded-full transition-all duration-300 relative z-10 ${isRecording
                                                    ? "bg-[#00DDDD] text-black scale-125 shadow-[0_0_20px_rgba(0,221,221,0.6)]"
                                                    : (isDarkMode ? "text-white hover:text-[#00DDDD] hover:bg-[#00DDDD]/10" : "text-black hover:text-[#00DDDD] hover:bg-[#00DDDD]/10")
                                                    }`}
                                                title={isRecording ? "Click to stop" : "Click to speak"}
                                            >
                                                <Mic className={`h-4 w-4 ${isRecording ? "animate-pulse" : ""}`} />
                                            </button>
                                        </div>
                                    )}
                                    <div className="relative" ref={engineSelectRef}>
                                        <button
                                            onClick={() => setShowEngineSelect(!showEngineSelect)}
                                            className={`flex items-center gap-2 ${isMobile ? "p-2" : "px-3 py-2"} border-2 ${showEngineSelect ? "border-[#00DDDD] text-[#00DDDD]" : (isDarkMode ? "border-white text-white hover:border-[#00DDDD] hover:text-[#00DDDD]" : "border-black text-black hover:border-[#00DDDD] hover:text-[#00DDDD]")} text-[9px] font-mono uppercase tracking-widest transition-all duration-300 rounded`}
                                        >
                                            <Bot className="h-3.5 w-3.5" />
                                            {!isMobile && selectedEngine}
                                        </button>

                                        <AnimatePresence>
                                            {showEngineSelect && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                    className={`absolute bottom-full right-0 mb-4 w-72 ${isDarkMode ? "bg-[#0d0d0d] border-white" : "bg-white border-black"} border p-2 shadow-2xl z-50`}
                                                >
                                                    <div className="px-4 py-3 border-b border-black/10 flex justify-between items-center mb-2">
                                                        <span className={`text-[10px] font-mono font-bold ${isDarkMode ? "text-white" : "text-black"} tracking-[0.2em]`}>SELECT AI ENGINE</span>
                                                        <span className={`px-2 py-0.5 ${isDarkMode ? "bg-white/10 text-white" : "bg-black/5 text-black/60"} text-[8px] font-mono rounded`}>FREE</span>
                                                    </div>
                                                    <div className="space-y-1">
                                                        {visibleEngines.map((engine) => {
                                                            const featureId = getFeatureIdForEngine(engine.name)
                                                            const isAvailable = planFeatures.length === 0 || planFeatures.includes(featureId)
                                                            return (
                                                                <button
                                                                    key={engine.name}
                                                                    onClick={() => {
                                                                        if (!isAvailable) {
                                                                            setShowEngineSelect(false);
                                                                            window.location.href = "/pricing"
                                                                            return
                                                                        }
                                                                        if (engine.name === "Interview Prep") {
                                                                            setShowEngineSelect(false);
                                                                            setIsInterviewModalOpen(true);
                                                                        } else if (engine.name === "Mock Paper Generator") {
                                                                            setShowEngineSelect(false);
                                                                            setIsMockPaperModalOpen(true);
                                                                        } else if (engine.name === "Persona Mode") {
                                                                            setShowEngineSelect(false);
                                                                            setIsPersonaModalOpen(true);
                                                                        } else if (engine.name === "Battle Arena") {
                                                                            setShowEngineSelect(false);
                                                                            setIsBattleArenaModalOpen(true);
                                                                        } else {
                                                                            setSelectedEngine(engine.name);
                                                                            setShowEngineSelect(false);
                                                                        }
                                                                    }}
                                                                    className={`w-full flex items-center justify-between p-3 transition-all duration-300 ${selectedEngine === engine.name ? (isDarkMode ? "bg-white/5 text-white scale-102" : "bg-black/5 text-black scale-102") : (isDarkMode ? "hover:bg-white/5 text-white hover:scale-105" : "hover:bg-black/5 text-black hover:scale-105")}`}
                                                                >
                                                                    <div className="flex items-center gap-4">
                                                                        <engine.icon className={`h-4 w-4 ${isDarkMode ? "text-white" : "text-black/60"} group-hover:rotate-12 transition-transform`} />
                                                                        <span className={`text-xs font-medium ${isDarkMode ? "text-white" : "text-black"}`}>{engine.name}</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        {isAvailable ? (
                                                                            <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                                                                        ) : (
                                                                            <XCircle className="h-3.5 w-3.5 text-red-400" />
                                                                        )}
                                                                        <span className={`text-[10px] font-mono font-bold ${isDarkMode ? "text-white/40" : "text-black/40"}`}>{engine.version}</span>
                                                                    </div>
                                                                </button>
                                                            )
                                                        })}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                    {isLoading ? (
                                        <button
                                            onClick={handleStopGeneration}
                                            className="p-2 md:p-2.5 bg-[#00DDDD] hover:bg-[#00c5c5] transition-all hover:scale-105 active:scale-95 relative overflow-hidden group flex items-center justify-center"
                                            title="Pause generation"
                                        >
                                            <Pause className="h-3 w-3 text-black fill-black" />
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => void handleSend()}
                                            disabled={isHistoryLoading || isProcessingFile}
                                            className="p-2 md:p-2.5 bg-[#00DDDD] text-black hover:shadow-[0_0_25px_rgba(0,221,221,0.5)] transition-all hover:scale-105 active:scale-95 relative overflow-hidden group"
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                                            <Send className="h-4 w-4 relative z-10" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Sidebar */}
            <aside
                style={{ width: isRightSidebarCollapsed ? (isMobile ? "0px" : "72px") : (isMobile ? "280px" : `${rightSidebarWidth}px`) }}
                className={`h-full border-l-2 ${isRightSidebarCollapsed && isMobile ? "border-l-0" : isDarkMode ? "border-white" : "border-black"} ${isDarkMode ? "bg-[#0a0a0a]" : "bg-[#fcfcfc]"} flex flex-col ${isMobile ? "fixed right-0 top-0 bottom-0 h-[100dvh] z-[60] shadow-2xl" : "relative z-20"} transition-[width] duration-300 ease-in-out ${isResizingRight ? "transition-none" : ""}`}
            >
                {!isRightSidebarCollapsed ? (
                    <div className="flex flex-col h-full overflow-hidden">
                        {/* Tab Bar */}
                        <div className={`flex border-b ${isDarkMode ? "border-white/10" : "border-black/10"} shrink-0`}>
                            <button
                                onClick={() => setRightSidebarTab("usage")}
                                className={`flex-1 py-3 text-[9px] font-mono uppercase tracking-[0.2em] transition-all ${rightSidebarTab === "usage"
                                    ? (isDarkMode ? "bg-white text-black font-bold" : "bg-[#00DDDD] text-white font-bold shadow-[inset_0_-2px_0_rgba(0,0,0,0.2)]")
                                    : (isDarkMode ? "text-white/40 hover:text-white hover:bg-white/5" : "text-black hover:bg-black/5")}`}
                            >
                                Usage
                            </button>
                            {userRole === "employee" && (
                                <button
                                    onClick={() => setRightSidebarTab("gmail")}
                                    className={`flex-1 py-3 text-[9px] font-mono uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-1.5 ${rightSidebarTab === "gmail"
                                        ? (isDarkMode ? "bg-white text-black font-bold" : "bg-[#00DDDD] text-white font-bold shadow-[inset_0_-2px_0_rgba(0,0,0,0.2)]")
                                        : (isDarkMode ? "text-white/40 hover:text-white hover:bg-white/5" : "text-black hover:bg-black/5")}`}
                                >
                                    <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none">
                                        <rect x="2" y="4" width="20" height="16" rx="2" fill="currentColor"/>
                                        <path d="M22 6l-10 7L2 6" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
                                    </svg>
                                    Gmail
                                </button>
                            )}
                        </div>

                        <div className={`flex-1 p-8 ${isDarkMode ? "custom-scrollbar" : "light-scrollbar"} overflow-y-auto`}>
                            {rightSidebarTab === "usage" && (
                                <>
                                    {/* Plan Badge */}
                                    <div className="flex items-start mb-8">
                                        <div className="flex flex-col">
                                            <span className={`text-[8px] font-mono uppercase tracking-[0.3em] ${isDarkMode ? "text-black bg-white px-2 py-0.5" : "text-white bg-black px-2 py-0.5"} mb-1 pl-4`}>Active Plan</span>
                                            <div className="flex items-stretch gap-2">
                                                <div className={`flex items-center justify-center ${isDarkMode ? "bg-black border-2 border-white" : "bg-white border-2 border-black"} px-2`}>
                                                    <div className={`h-1.5 w-1.5 rounded-full animate-pulse shadow-[0_0_8px_rgba(0,221,221,0.5)] ${subscription?.subscription ? 'bg-[#00DDDD]' : 'bg-amber-500'}`} />
                                                </div>
                                                <span className={`flex items-center text-xs font-bold ${isDarkMode ? "text-black bg-white px-2 border-2 border-transparent" : "text-white bg-black px-2 border-2 border-transparent"} tracking-widest uppercase`}>
                                                    {isSubscriptionLoading ? "Loading..." : (subscription?.subscription?.plan_name || "Free Trial")}
                                                </span>
                                            </div>
                                        </div>
                                        <div className={`h-8 w-8 ${isDarkMode ? "bg-white/5 border-white" : "bg-white border-black"} border flex items-center justify-center relative mt-[1px] ml-[6px]`}>
                                            <Clock className={`h-4 w-4 ${isDarkMode ? "text-white" : "text-black"}`} />
                                            <div className={`absolute inset-0 rounded-sm border ${isDarkMode ? 'border-white' : 'border-black'} pointer-events-none`} />
                                        </div>
                                    </div>

                                    {/* Circular Usage Chart */}
                                    <div className="relative w-32 h-32 mx-auto mb-8 flex-shrink-0">
                                        <svg className="w-full h-full rotate-[-90deg]">
                                            <circle cx="64" cy="64" r="58" fill="none" stroke={isDarkMode ? "rgba(0, 221, 221, 0.1)" : "rgba(0, 221, 221, 0.05)"} strokeWidth="6" />
                                            <circle
                                                cx="64" cy="64" r="58" fill="none"
                                                stroke="#00DDDD"
                                                strokeWidth="6"
                                                strokeDasharray="364"
                                                strokeDashoffset={String(
                                                    isSubscriptionLoading || !subscription?.usage || !subscription?.subscription?.details?.daily_chat_limit
                                                        ? 364
                                                        : 364 - ((subscription.usage.daily_chats / subscription.subscription.details.daily_chat_limit) * 364)
                                                )}
                                                strokeLinecap="round"
                                                className="transition-all duration-1000 drop-shadow-[0_0_8px_rgba(0,221,221,0.5)]"
                                            />
                                        </svg>
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <ChatLoader isDarkMode={isDarkMode} />
                                        </div>
                                    </div>

                                    {/* Detailed Metrics */}
                                    <div className="space-y-4 mb-8">
                                        {/* Chats Usage */}
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-[8px] font-mono uppercase tracking-widest">
                                                <span className={isDarkMode ? "text-white/50" : "text-black/50"}>Chats Used</span>
                                                <span className={isDarkMode ? "text-white" : "text-black"}>
                                                    {subscription?.usage?.daily_chats || 0} / {subscription?.subscription?.details?.daily_chat_limit || 1}
                                                </span>
                                            </div>
                                            <div className={`h-1 w-full ${isDarkMode ? "bg-white/10" : "bg-black/5"} rounded-full overflow-hidden`}>
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{
                                                        width: `${Math.min(100, ((subscription?.usage?.daily_chats || 0) / (subscription?.subscription?.details?.daily_chat_limit || 1)) * 100)}%`
                                                    }}
                                                    className="h-full bg-[#00DDDD] shadow-[0_0_10px_rgba(0,221,221,0.5)]"
                                                />
                                            </div>
                                        </div>
                                        <div className={`h-[1px] w-full ${isDarkMode ? "bg-white/5" : "bg-black/5"}`} />

                                        {/* Usage Progress Bars */}
                                        <div className="space-y-6">
                                            {/* Images Usage */}
                                            <div className="space-y-2">
                                                <div className="flex justify-between text-[8px] font-mono uppercase tracking-widest">
                                                    <span className={isDarkMode ? "text-white/50" : "text-black/50"}>Images Used</span>
                                                    <span className={isDarkMode ? "text-white" : "text-black"}>
                                                        {subscription?.usage?.monthly_images || 0} / {subscription?.subscription?.details?.monthly_image_limit || 1}
                                                    </span>
                                                </div>
                                                <div className={`h-1 w-full ${isDarkMode ? "bg-white/10" : "bg-black/5"} rounded-full overflow-hidden`}>
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{
                                                            width: `${Math.min(100, ((subscription?.usage?.monthly_images || 0) / (subscription?.subscription?.details?.monthly_image_limit || 1)) * 100)}%`
                                                        }}
                                                        className="h-full bg-[#00DDDD] shadow-[0_0_10px_rgba(0,221,221,0.5)]"
                                                    />
                                                </div>
                                            </div>

                                            {/* Coding Usage */}
                                            <div className="space-y-2">
                                                <div className="flex justify-between text-[8px] font-mono uppercase tracking-widest">
                                                    <span className={isDarkMode ? "text-white/50" : "text-black/50"}>Coding Used</span>
                                                    <span className={isDarkMode ? "text-white" : "text-black"}>
                                                        {subscription?.usage?.daily_codings || 0} / {subscription?.subscription?.details?.daily_coding_limit || 1}
                                                    </span>
                                                </div>
                                                <div className={`h-1 w-full ${isDarkMode ? "bg-white/10" : "bg-black/5"} rounded-full overflow-hidden`}>
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{
                                                            width: `${Math.min(100, ((subscription?.usage?.daily_codings || 0) / (subscription?.subscription?.details?.daily_coding_limit || 1)) * 100)}%`
                                                        }}
                                                        className="h-full bg-[#00DDDD] shadow-[0_0_10px_rgba(0,221,221,0.5)]"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2 mb-8">
                                        <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                                            <div className="h-full w-full bg-[#00DDDD] shadow-[0_0_10px_rgba(0,221,221,0.5)]" />
                                        </div>
                                        <div className="flex justify-between text-[8px] font-mono uppercase opacity-70">
                                            <span>Backend</span>
                                            <span className="text-[#00DDDD]">Stable</span>
                                        </div>
                                    </div>

                                    <div className="space-y-2 mb-8">
                                        <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                                            <div className="h-full w-full bg-[#00DDDD] shadow-[0_0_10px_rgba(0,221,221,0.5)]" />
                                        </div>
                                        <div className="flex justify-between text-[8px] font-mono uppercase opacity-70">
                                            <span>Frontend</span>
                                            <span className="text-[#00DDDD]">Stable</span>
                                        </div>
                                    </div>

                                    <Link href="/pricing" className={`block w-full ${isMobile ? "mt-24 mb-10" : ""}`}>
                                        <button className="upgrade-btn hover:scale-105 hover:shadow-[0_0_30px_rgba(0,221,221,0.5)] transition-all duration-300">
                                            <div className="bubble-layer bubble-1"></div>
                                            <div className="bubble-layer bubble-2"></div>
                                            <div className="bubble-layer bubble-3"></div>
                                            <div className="bubble-layer bubble-4"></div>
                                            <div className="bubble-layer bubble-5"></div>
                                            <div className="bubble-layer bubble-6"></div>
                                            <div className="bubble-layer bubble-7"></div>
                                            <span>Upgrade Now</span>
                                        </button>
                                    </Link>
                                </>
                            )}

                            {rightSidebarTab === "gmail" && userRole === "employee" && (
                                <div className="flex flex-col h-full">
                                    {/* ─── SEARCH BAR ─── */}
                                    {gmailConnected && (
                                        <div className="shrink-0 mb-4">
                                            <div className="relative group">
                                                <div className={`absolute inset-0 rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 ${isDarkMode ? "bg-gradient-to-r from-[#EA4335]/10 via-[#FBBC05]/10 to-[#34A853]/10" : "bg-gradient-to-r from-[#EA4335]/5 via-[#FBBC05]/5 to-[#34A853]/5"}`} />
                                                <div className="relative flex items-center">
                                                    <div className={`absolute left-3 flex items-center gap-1.5`}>
                                                        <Search className={`h-3.5 w-3.5 ${isDarkMode ? "text-white/30" : "text-black/50"}`} />
                                                        <span className={`h-3 w-[1px] ${isDarkMode ? "bg-white/10" : "bg-black/30"}`} />
                                                    </div>
                                                    <input
                                                        type="text"
                                                        value={gmailSearchQuery}
                                                        onChange={(e) => setGmailSearchQuery(e.target.value)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === "Enter") {
                                                                fetchGmailEmails(gmailSearchQuery || undefined)
                                                            }
                                                        }}
                                                        placeholder="Search emails..."
                                                        className={`w-full pl-10 pr-10 py-2.5 text-[10px] font-mono rounded-xl border outline-none transition-all duration-200 ${isDarkMode
                                                            ? "bg-white/[0.03] border-white/10 text-white placeholder-white/20 focus:border-[#4285F4]/50 focus:bg-white/[0.05]"
                                                            : "bg-white border-black/30 text-black placeholder-black/50 focus:border-[#4285F4]/70 focus:bg-white"
                                                            }`}
                                                    />
                                                    {gmailSearchQuery && (
                                                        <button
                                                            onClick={() => { setGmailSearchQuery(""); fetchGmailEmails() }}
                                                            className={`absolute right-2 p-1.5 rounded-lg transition-all ${isDarkMode ? "hover:bg-white/10 text-white/30 hover:text-white" : "hover:bg-black/10 text-black/50 hover:text-black"}`}
                                                        >
                                                            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                                                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                                                            </svg>
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 mt-2 px-1">
                                                {["in:inbox", "is:unread", "is:important", "has:attachment"].map((filter) => (
                                                    <button
                                                        key={filter}
                                                        onClick={() => {
                                                            setGmailSearchQuery(filter)
                                                            fetchGmailEmails(filter)
                                                        }}
                                                        className={`text-[7px] font-mono uppercase tracking-[0.15em] px-2 py-1 rounded-md border transition-all ${gmailSearchQuery === filter
                                                            ? (isDarkMode
                                                                ? "bg-[#4285F4]/20 border-[#4285F4]/40 text-[#4285F4]"
                                                                : "bg-[#4285F4]/10 border-[#4285F4]/30 text-[#4285F4]")
                                                            : (isDarkMode
                                                                ? "border-white/10 text-white/30 hover:border-white/20 hover:text-white/50"
                                                                : "border-black/30 text-black/60 hover:border-black/60 hover:text-black/90")
                                                            }`}
                                                    >
                                                        {filter.replace(":", " ")}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* ─── ERROR ─── */}
                                    {gmailError && (
                                        <div className={`shrink-0 mb-4 p-3 rounded-lg flex items-start gap-2.5 ${isDarkMode ? "bg-red-500/10 border border-red-500/20" : "bg-red-500/5 border border-red-500/20"}`}>
                                            <div className={`h-4 w-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${isDarkMode ? "bg-red-500/20" : "bg-red-500/15"}`}>
                                                <svg className="h-2.5 w-2.5 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                                                </svg>
                                            </div>
                                            <p className="text-[10px] font-mono text-red-400 leading-relaxed">{gmailError}</p>
                                        </div>
                                    )}

                                    {/* ─── CONTENT ─── */}
                                    <div className="flex-1 min-h-0 overflow-y-auto space-y-2.5 custom-scrollbar">
                                        {!gmailConnected ? (
                                            <div className="flex flex-col items-center justify-center py-10 px-4">
                                                <div className={`relative mb-6`}>
                                                    <div className={`h-20 w-20 mx-auto rounded-2xl flex items-center justify-center bg-gradient-to-br ${isDarkMode ? "from-[#EA4335]/20 via-[#FBBC05]/10 to-[#4285F4]/20 border border-white/10" : "from-[#EA4335]/10 via-[#FBBC05]/5 to-[#4285F4]/10 border border-black/10"}`}>
                                                        <svg className="h-9 w-9" viewBox="0 0 24 24" fill="none">
                                                            <rect x="2" y="4" width="20" height="16" rx="2" fill="#EA4335"/>
                                                            <path d="M22 6l-10 7L2 6" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
                                                        </svg>
                                                    </div>
                                                    <div className={`absolute -bottom-1 -right-1 h-6 w-6 rounded-full flex items-center justify-center ${isDarkMode ? "bg-white text-black" : "bg-black text-white"}`}>
                                                        <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                                                        </svg>
                                                    </div>
                                                </div>
                                                <p className={`text-[11px] font-mono text-center leading-relaxed mb-6 ${isDarkMode ? "text-white/50" : "text-black/50"}`}>
                                                    Connect your Gmail account to view<br />your inbox directly in the chat.
                                                </p>
                                                <button
                                                    onClick={handleConnectGmail}
                                                    disabled={gmailConnecting}
                                                    className={`group relative px-6 py-3 text-[10px] font-mono uppercase tracking-[0.2em] font-bold rounded-xl transition-all duration-300 ${gmailConnecting ? "opacity-50" : "hover:scale-[1.02] active:scale-[0.98]"} ${isDarkMode ? "bg-white text-black hover:shadow-[0_0_30px_rgba(255,255,255,0.15)]" : "bg-black text-white hover:shadow-[0_0_30px_rgba(0,0,0,0.15)]"}`}
                                                >
                                                    <span className="relative z-10 flex items-center gap-2">
                                                        {gmailConnecting ? (
                                                            <>
                                                                <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none">
                                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                                                </svg>
                                                                Connecting...
                                                            </>
                                                        ) : (
                                                            <>+ Gmail <span className="text-[14px]">→</span></>
                                                        )}
                                                    </span>
                                                </button>
                                            </div>
                                        ) : gmailLoading ? (
                                            <div className="flex flex-col items-center justify-center py-16 gap-3">
                                                <div className={`h-8 w-8 rounded-full border-2 border-t-transparent animate-spin ${isDarkMode ? "border-white/20 border-t-white" : "border-black/20 border-t-black"}`} />
                                                <p className={`text-[9px] font-mono ${isDarkMode ? "text-white/30" : "text-black/30"}`}>Loading emails...</p>
                                            </div>
                                        ) : gmailEmails.length === 0 ? (
                                            <div className="flex flex-col items-center py-12 gap-4">
                                                <div className={`h-14 w-14 rounded-xl flex items-center justify-center ${isDarkMode ? "bg-white/[0.03] border border-white/5" : "bg-black/[0.02] border border-black/5"}`}>
                                                    <Inbox className={`h-6 w-6 ${isDarkMode ? "text-white/20" : "text-black/20"}`} />
                                                </div>
                                                <p className={`text-[10px] font-mono ${isDarkMode ? "text-white/30" : "text-black/30"}`}>
                                                    {gmailSearchQuery ? `No results for "${gmailSearchQuery}"` : "No emails found in your inbox."}
                                                </p>
                                            </div>
                                        ) : (
                                            gmailEmails.map((email: any, idx: number) => (
                                                <button
                                                    key={email.id}
                                                    onClick={() => handleSelectEmail(email.id)}
                                                    className={`group w-full text-left rounded-xl border transition-all duration-200 ${email.unread
                                                        ? (isDarkMode
                                                            ? "border-[#EA4335]/20 bg-[#EA4335]/[0.02] hover:bg-[#EA4335]/[0.06]"
                                                            : "border-[#EA4335]/20 bg-[#EA4335]/[0.02] hover:bg-[#EA4335]/[0.05]")
                                                        : (isDarkMode
                                                            ? "border-white/5 hover:border-white/15 bg-white/[0.02] hover:bg-white/[0.04]"
                                                            : "border-black/5 hover:border-black/15 bg-black/[0.01] hover:bg-black/[0.03]")
                                                        }`}
                                                >
                                                    <div className="p-3.5">
                                                        <div className="flex items-start justify-between gap-3 mb-2">
                                                            <p className={`text-[11px] font-bold truncate flex-1 ${email.unread ? (isDarkMode ? "text-white" : "text-black") : (isDarkMode ? "text-white/70" : "text-black/70")}`}>
                                                                {email.subject || "(No Subject)"}
                                                            </p>
                                                            <span className={`text-[8px] font-mono whitespace-nowrap shrink-0 ${isDarkMode ? "text-white/25" : "text-black/25"}`}>
                                                                {email.date ? new Date(email.date).toLocaleDateString() : ""}
                                                            </span>
                                                        </div>
                                                        <p className={`text-[9px] font-mono truncate mb-1.5 ${isDarkMode ? "text-white/40" : "text-black/40"}`}>
                                                            {email.from}
                                                        </p>
                                                        <p className={`text-[9px] font-mono line-clamp-1 leading-relaxed ${isDarkMode ? "text-white/25" : "text-black/25"}`}>
                                                            {email.snippet || ""}
                                                        </p>
                                                    </div>
                                                </button>
                                            ))
                                        )}
                                    </div>

                                    {/* ─── FOOTER (sticky bottom) ─── */}
                                    {gmailConnected && (
                                        <div className={`shrink-0 mt-4 pt-4 border-t sticky bottom-0 ${isDarkMode ? "border-white/10 bg-[#0a0a0a]" : "border-black/10 bg-[#fcfcfc]"}`}>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2.5">
                                                    <div className={`p-1.5 rounded-lg ${isDarkMode ? "bg-[#EA4335]/10" : "bg-[#EA4335]/15"}`}>
                                                        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                                                            <rect x="2" y="4" width="20" height="16" rx="2" fill="#EA4335"/>
                                                            <path d="M22 6l-10 7L2 6" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
                                                        </svg>
                                                    </div>
                                                    <div>
                                                        <p className={`text-[8px] font-bold font-mono uppercase tracking-[0.15em] ${isDarkMode ? "text-white" : "text-black"}`}>
                                                            Gmail Inbox
                                                        </p>
                                                        {gmailEmail && (
                                                            <p className={`text-[8px] font-mono ${isDarkMode ? "text-white/35" : "text-black/60"}`}>{gmailEmail}</p>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={() => fetchGmailEmails(gmailSearchQuery || undefined)}
                                                        disabled={gmailLoading}
                                                        title="Refresh"
                                                        className={`p-1.5 rounded-lg transition-all disabled:opacity-30 ${isDarkMode ? "hover:bg-white/10 text-white/40 hover:text-white" : "hover:bg-black/10 text-black/60 hover:text-black"}`}
                                                    >
                                                        <svg className={`h-3 w-3 ${gmailLoading ? "animate-spin" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <polyline points="23 4 23 10 17 10" />
                                                            <polyline points="1 20 1 14 7 14" />
                                                            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={handleDisconnectGmail}
                                                        disabled={gmailLoading}
                                                        title="Disconnect"
                                                        className={`p-1.5 rounded-lg transition-all disabled:opacity-30 ${isDarkMode ? "hover:bg-white/10 text-white/30 hover:text-[#EA4335]" : "hover:bg-black/10 text-black/60 hover:text-[#EA4335]"}`}
                                                    >
                                                        <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                                            <polyline points="16 17 21 12 16 7" />
                                                            <line x1="21" y1="12" x2="9" y2="12" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col h-full items-center py-6 justify-between overflow-hidden w-full">
                        {/* Top: Plan Indicator using Clock icon from the Plan Badge */}
                        <div className="flex flex-col items-center gap-6 w-full px-2">
                            <div
                                title={`Active Plan: ${isSubscriptionLoading ? "Loading..." : (subscription?.subscription?.plan_name || "Free Trial")}`}
                                className={`h-8 w-8 ${isDarkMode ? "bg-white/5 border-white" : "bg-white border-black"} border flex items-center justify-center relative cursor-help`}
                            >
                                <Clock className={`h-4 w-4 ${isDarkMode ? "text-white" : "text-black"}`} />
                                <div className={`absolute inset-0 rounded-sm border ${isDarkMode ? 'border-white' : 'border-black'} pointer-events-none`} />
                            </div>

                            {userRole === "employee" && (
                                <button
                                    onClick={() => { setRightSidebarTab("gmail"); setIsRightSidebarCollapsed(false) }}
                                    title="Gmail"
                                    className={`h-8 w-8 ${isDarkMode ? "bg-white/5 border-white" : "bg-white border-black"} border flex items-center justify-center relative cursor-pointer hover:scale-110 transition-all ${rightSidebarTab === "gmail" && !isRightSidebarCollapsed ? "ring-1 ring-white" : ""}`}
                                >
                                    <svg className={`h-4 w-4 ${gmailConnected ? "text-[#00DDDD]" : (isDarkMode ? "text-white" : "text-black")}`} viewBox="0 0 24 24" fill="none">
                                        <rect x="2" y="4" width="20" height="16" rx="2" fill="currentColor"/>
                                        <path d="M22 6l-10 7L2 6" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
                                    </svg>
                                </button>
                            )}

                            <div className={`h-[1px] w-8 ${isDarkMode ? "bg-white/10" : "bg-black/10"}`} />
                        </div>

                        {/* Middle: Live Usage Progress Circle using ChatLoader */}
                        <div className="flex flex-col items-center gap-6 w-full">
                            <div
                                title="Live Chat Usage"
                                className="relative w-12 h-12 flex items-center justify-center cursor-help"
                            >
                                <svg className="w-full h-full rotate-[-90deg] absolute">
                                    <circle cx="24" cy="24" r="20" fill="none" stroke={isDarkMode ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)"} strokeWidth="3" />
                                    <circle
                                        cx="24" cy="24" r="20" fill="none"
                                        stroke="#00DDDD"
                                        strokeWidth="3"
                                        strokeDasharray="125.6"
                                        strokeDashoffset={String(
                                            isSubscriptionLoading || !subscription?.usage || !subscription?.subscription?.details?.daily_chat_limit
                                                ? 125.6
                                                : 125.6 - ((subscription.usage.daily_chats / subscription.subscription.details.daily_chat_limit) * 125.6)
                                        )}
                                        strokeLinecap="round"
                                        className="transition-all duration-1000 drop-shadow-[0_0_4px_rgba(0,221,221,0.5)]"
                                    />
                                </svg>
                                <div className="scale-[0.6] flex items-center justify-center">
                                    <ChatLoader isDarkMode={isDarkMode} />
                                </div>
                            </div>

                            {/* CHT (Chats Used) Metric */}
                            <div
                                title={`Chats Used: ${subscription?.usage?.daily_chats || 0} / ${subscription?.subscription?.details?.daily_chat_limit || 1}`}
                                className="flex flex-col items-center gap-0.5 cursor-help"
                            >
                                <span className={`text-[9px] font-mono font-black ${isDarkMode ? "text-white/40" : "text-black/40"}`}>
                                    CHT
                                </span>
                                <span className="text-[10px] font-mono font-bold text-[#00DDDD]">
                                    {subscription?.usage?.daily_chats || 0}
                                </span>
                            </div>

                            {/* IMG (Images Used) Metric */}
                            <div
                                title={`Images Used: ${subscription?.usage?.monthly_images || 0} / ${subscription?.subscription?.details?.monthly_image_limit || 1}`}
                                className="flex flex-col items-center gap-0.5 cursor-help"
                            >
                                <span className={`text-[9px] font-mono font-black ${isDarkMode ? "text-white/40" : "text-black/40"}`}>
                                    IMG
                                </span>
                                <span className="text-[10px] font-mono font-bold text-[#00DDDD]">
                                    {subscription?.usage?.monthly_images || 0}
                                </span>
                            </div>

                            {/* COD (Coding Used) Metric */}
                            <div
                                title={`Coding Used: ${subscription?.usage?.daily_codings || 0} / ${subscription?.subscription?.details?.daily_coding_limit || 1}`}
                                className="flex flex-col items-center gap-0.5 cursor-help"
                            >
                                <span className={`text-[9px] font-mono font-black ${isDarkMode ? "text-white/40" : "text-black/40"}`}>
                                    COD
                                </span>
                                <span className="text-[10px] font-mono font-bold text-[#00DDDD]">
                                    {subscription?.usage?.daily_codings || 0}
                                </span>
                            </div>
                        </div>

                        {/* Bottom: Mini Cyan Upgrade Button */}
                        <div className="w-full flex items-center justify-center px-2 pb-10">
                            <Link href="/pricing" title="Upgrade Now" className="block cursor-pointer">
                                <button className={`upgrade-btn h-11 w-11 flex items-center justify-center rounded-none hover:scale-115 active:scale-95 transition-all duration-300 relative overflow-hidden border-2 ${isDarkMode ? "border-white" : "border-black"} shadow-md shadow-[rgba(0,221,221,0.2)]`}>
                                    <div className="bubble-layer bubble-1"></div>
                                    <div className="bubble-layer bubble-2"></div>
                                    <div className="bubble-layer bubble-3"></div>
                                    <div className="bubble-layer bubble-4"></div>
                                    <div className="bubble-layer bubble-5"></div>
                                    <div className="bubble-layer bubble-6"></div>
                                    <div className="bubble-layer bubble-7"></div>
                                    <Zap className="h-5 w-5 text-black relative z-10 fill-black" />
                                </button>
                            </Link>
                        </div>
                    </div>
                )}

                {/* Right Resize Handle */}
                <div
                    onMouseDown={startResizingRight}
                    className={`absolute top-0 left-0 w-1 h-full cursor-col-resize hover:bg-white/20 transition-colors z-30 ${isMobile ? "hidden" : ""}`}
                />

                {/* Right Toggle Button */}
                <button
                    onClick={() => {
                        const newCollapsed = !isRightSidebarCollapsed;
                        setIsRightSidebarCollapsed(newCollapsed);
                        if (!newCollapsed) {
                            setIsSidebarCollapsed(true);
                        }
                    }}
                    className={`absolute top-1/2 -translate-y-1/2 z-50 p-2 bg-[#0a0a0a] border border-white text-white/40 hover:text-white hover:scale-110 hover:shadow-[0_0_15px_rgba(255,255,255,0.3)] transition-all rounded-full shadow-xl shadow-black/20 toggle-btn-right ${isMobile ? "hidden" : ""}`}
                    style={isMobile && isRightSidebarCollapsed ? { right: "0.8rem" } : { left: isRightSidebarCollapsed ? "-2.2rem" : "-0.95rem" }}
                >
                    {isRightSidebarCollapsed ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                </button>
            </aside>

            {/* ─── EMAIL DETAIL MODAL (root level) ─── */}
            <AnimatePresence>
                {gmailSelectedEmail && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-8"
                        onClick={() => setGmailSelectedEmail(null)}
                    >
                        <div className={`absolute inset-0 ${isDarkMode ? "bg-black/70" : "bg-black/50"} backdrop-blur-sm`} />
                        <motion.div
                            initial={{ scale: 0.92, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.92, opacity: 0, y: 20 }}
                            transition={{ type: "spring", duration: 0.4, bounce: 0.2 }}
                            onClick={(e: React.MouseEvent) => e.stopPropagation()}
                            className={`relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl border shadow-2xl ${isDarkMode
                                ? "bg-[#0a0a0a] border-white/10"
                                : "bg-[#fcfcfc] border-black/10"
                                }`}
                        >
                            {/* Header */}
                            <div className={`sticky top-0 z-10 flex items-center justify-between p-4 border-b ${isDarkMode ? "border-white/10 bg-[#0a0a0a]" : "border-black/10 bg-[#fcfcfc]"}`}>
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className={`p-1.5 rounded-lg shrink-0 ${isDarkMode ? "bg-[#EA4335]/10" : "bg-[#EA4335]/15"}`}>
                                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
                                            <rect x="2" y="4" width="20" height="16" rx="2" fill="#EA4335"/>
                                            <path d="M22 6l-10 7L2 6" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
                                        </svg>
                                    </div>
                                    <h3 className={`text-[11px] font-bold font-mono uppercase tracking-[0.15em] truncate ${isDarkMode ? "text-white" : "text-black"}`}>
                                        Email Detail
                                    </h3>
                                </div>
                                <button
                                    onClick={() => setGmailSelectedEmail(null)}
                                    className={`p-1.5 rounded-lg transition-all ${isDarkMode ? "hover:bg-white/10 text-white/40 hover:text-white" : "hover:bg-black/10 text-black/40 hover:text-black"}`}
                                >
                                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                                    </svg>
                                </button>
                            </div>

                            {/* Subject */}
                            <div className="p-5 pb-0">
                                <p className={`text-[13px] font-bold leading-snug ${isDarkMode ? "text-white" : "text-black"}`}>{gmailSelectedEmail.subject}</p>
                            </div>

                            {/* Meta */}
                            <div className="p-5 pt-3">
                                <div className={`flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[10px] font-mono ${isDarkMode ? "text-white/50" : "text-black/50"}`}>
                                    <span className="flex items-center gap-1.5">
                                        <span className={`text-[7px] uppercase tracking-widest ${isDarkMode ? "text-white/25" : "text-black/25"}`}>From</span>
                                        <span className={isDarkMode ? "text-white/70" : "text-black/70"}>{gmailSelectedEmail.from}</span>
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <span className={`text-[7px] uppercase tracking-widest ${isDarkMode ? "text-white/25" : "text-black/25"}`}>Date</span>
                                        <span className={isDarkMode ? "text-white/60" : "text-black/60"}>{gmailSelectedEmail.date}</span>
                                    </span>
                                    {gmailSelectedEmail.to && (
                                        <span className="flex items-center gap-1.5">
                                            <span className={`text-[7px] uppercase tracking-widest ${isDarkMode ? "text-white/25" : "text-black/25"}`}>To</span>
                                            <span className={`truncate max-w-[200px] ${isDarkMode ? "text-white/60" : "text-black/60"}`}>{gmailSelectedEmail.to}</span>
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Divider */}
                            <div className={`mx-5 h-px ${isDarkMode ? "bg-white/5" : "bg-black/5"}`} />

                            {/* Body */}
                            <div className="p-5">
                                <div
                                    className={`text-[12px] leading-relaxed ${isDarkMode ? "text-white/80" : "text-black/80"} prose prose-sm max-w-none ${isDarkMode ? "prose-invert" : ""}`}
                                    dangerouslySetInnerHTML={{ __html: gmailSelectedEmail.body || gmailSelectedEmail.snippet || "" }}
                                />
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Ambient Background Grid */}
            {selectedEngine !== "AI Image Lab" && (
                <div className={`fixed inset-0 z-0 pointer-events-none overflow-hidden opacity-10 ${isDarkMode ? "invert-0" : "invert"}`}>
                    <div className="absolute inset-0" style={{
                        backgroundImage: `linear-gradient(to right, #ffffff05 1px, transparent 1px), linear-gradient(to bottom, #ffffff05 1px, transparent 1px)`,
                        backgroundSize: '100px 100px'
                    }} />
                </div>
            )}

            {/* AI Image Lab Mode Background Flowing Grids */}
            {selectedEngine === "AI Image Lab" && (
                <div className={`fixed inset-0 z-0 pointer-events-none overflow-hidden transition-opacity duration-1000 ${isDarkMode ? "opacity-[0.88]" : "opacity-[0.80]"}`}>
                    <div className="absolute inset-0 flex gap-0 w-full h-full blur-[2px]">
                        {/* Column 1 */}
                        <div className="flex-1 max-w-[33.33%] lg:max-w-[25%] flex flex-col gap-0 overflow-hidden">
                            <div className="flex flex-col gap-0 animate-scroll-up">
                                {[...LAB_IMAGES_COL_1, ...LAB_IMAGES_COL_1].map((url, index) => {
                                    const heights = [260, 360, 220, 400, 280, 340, 240, 380];
                                    const h = heights[index % heights.length];
                                    return (
                                        <div
                                            key={`col1-${index}`}
                                            style={{ height: `${h}px` }}
                                            className="w-full relative bg-[#0a0a0a]"
                                        >
                                            <img src={url} alt="" className="w-full h-full object-cover select-none" loading="lazy" />
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                        {/* Column 2 */}
                        <div className="flex-1 max-w-[33.33%] lg:max-w-[25%] flex flex-col gap-0 overflow-hidden">
                            <div className="flex flex-col gap-0 animate-scroll-down">
                                {[...LAB_IMAGES_COL_2, ...LAB_IMAGES_COL_2].map((url, index) => {
                                    const heights = [320, 200, 380, 270, 340, 250, 360, 300];
                                    const h = heights[index % heights.length];
                                    return (
                                        <div
                                            key={`col2-${index}`}
                                            style={{ height: `${h}px` }}
                                            className="w-full relative bg-[#0a0a0a]"
                                        >
                                            <img src={url} alt="" className="w-full h-full object-cover select-none" loading="lazy" />
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                        {/* Column 3 */}
                        <div className="flex-1 max-w-[33.33%] lg:max-w-[25%] flex flex-col gap-0 overflow-hidden">
                            <div className="flex flex-col gap-0 animate-scroll-up-slow">
                                {[...LAB_IMAGES_COL_3, ...LAB_IMAGES_COL_3].map((url, index) => {
                                    const heights = [240, 350, 210, 390, 300, 270, 330, 370];
                                    const h = heights[index % heights.length];
                                    return (
                                        <div
                                            key={`col3-${index}`}
                                            style={{ height: `${h}px` }}
                                            className="w-full relative bg-[#0a0a0a]"
                                        >
                                            <img src={url} alt="" className="w-full h-full object-cover select-none" loading="lazy" />
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                        {/* Column 4 - hidden on mobile/small screens, but shown on lg screens */}
                        <div className="hidden lg:flex flex-1 max-w-[25%] flex-col gap-0 overflow-hidden">
                            <div className="flex flex-col gap-0 animate-scroll-down-slow">
                                {[...LAB_IMAGES_COL_1, ...LAB_IMAGES_COL_1].reverse().map((url, index) => {
                                    const heights = [300, 230, 370, 250, 330, 310, 260, 350];
                                    const h = heights[index % heights.length];
                                    return (
                                        <div
                                            key={`col4-${index}`}
                                            style={{ height: `${h}px` }}
                                            className="w-full relative bg-[#0a0a0a]"
                                        >
                                            <img src={url} alt="" className="w-full h-full object-cover select-none" loading="lazy" />
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                </div>
            )}

            {/* Mock Paper Generation Overlay */}
            {isGeneratingPaper && (
                <div className="fixed inset-0 z-[300] bg-black/90 backdrop-blur-xl flex items-center justify-center flex-col">
                    <ChatLoader isDarkMode={true} />
                    <div className="mt-12 text-center">
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: [0.4, 1, 0.4] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="text-[11px] font-mono uppercase tracking-[0.5em] text-white font-black"
                        >
                            Synthesizing Your Paper
                        </motion.p>

                    </div>
                </div>
            )}

            {/* Mock Paper View */}
            {generatedPaper && paperConfig && (
                <MockPaperView
                    paper={generatedPaper}
                    examType={paperConfig.examType === 'Other' ? (paperConfig.customExamType || 'EXAM') : paperConfig.examType}
                    duration={paperConfig.duration}
                    onClose={() => setGeneratedPaper(null)}
                    isDarkMode={isDarkMode}
                />
            )}

            {/* Mock Paper Modal */}
            <MockPaperModal
                isOpen={isMockPaperModalOpen}
                onClose={() => setIsMockPaperModalOpen(false)}
                onGenerate={handleGenerateMockPaper}
                isDarkMode={isDarkMode}
            />

            {/* Interview Prep Modal */}
            <InterviewPrepModal
                isOpen={isInterviewModalOpen}
                onClose={() => setIsInterviewModalOpen(false)}
                onStart={handleStartInterview}
                isDarkMode={isDarkMode}
            />

            {/* Persona Modal */}
            <PersonaModal
                isOpen={isPersonaModalOpen}
                onClose={() => setIsPersonaModalOpen(false)}
                onSelect={handlePersonaSelect}
                isDarkMode={isDarkMode}
                currentPersona={selectedPersona}
            />

            {/* Battle Arena Modal */}
            <BattleArenaModal
                isOpen={isBattleArenaModalOpen}
                onClose={() => setIsBattleArenaModalOpen(false)}
                onHost={handleBattleArenaHost}
                onJoin={handleBattleArenaJoin}
                isDarkMode={isDarkMode}
            />
        </div>
    );
};

export default Chat;
