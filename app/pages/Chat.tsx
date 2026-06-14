"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Send, Bot, User, LogOut, MessageSquare, Plus, Search,
    ChevronLeft, ChevronRight, Moon, Sun, GraduationCap,
    UserCog, Mic, ChevronUp,
    ThumbsUp, ThumbsDown, RotateCcw, Edit3, Copy, Check, Clock, Trash2, Inbox,
    Paperclip, X, ImageIcon, FileDown, FileText as FileIcon, Sparkles, Pencil,
    Swords, CheckCircle, XCircle, Code, Zap, Pause, BookOpen, Wallet, Building2, LayoutDashboard, Share, Loader2,
    Settings, Bell, Key, ChevronDown, Compass, Palette, Globe, Maximize2, ArrowUp,
    PanelLeftOpen, PanelLeftClose, MessageSquarePlus, ListOrdered, Car, MicOff, Headphones, Upload, FolderOpen
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Poppins, Roboto, Space_Grotesk } from "next/font/google";
import { isAuthenticated, getApiKey, removeApiKey, getUserInfo, removeUserInfo, getUserRole, getSchoolName, getEnterpriseName, removeUserRole, removeSchoolName, removeEnterpriseName, getProfilePicture } from "@/lib/auth";
import { useTheme } from "@/lib/theme-context";
import { useTranslation } from "react-i18next";
import Cookies from "js-cookie";
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
    enhanceViaChatApi,
    getSubscriptionStatus,
    getPlanFeatures,
    getFeatureIdForEngine,
    getNotifications,
    markNotificationAsRead,
    type SocialNotification,
    discontinueAccount,
    getNotes,
    createNote,
    updateNote,
    deleteNote,
    aiRewriteNote,
    type Note
} from "@/lib/chat-api";
import { processFile, ProcessedFile } from "@/lib/file-processor";
import { toast } from "sonner";

import DotsLoader from "@/components/ui/DotsLoader";
import { MultiStepLoader } from "@/components/ui/multi-step-loader";
import MarkdownRenderer from "@/components/ui/MarkdownRenderer";
import "katex/dist/katex.min.css";
import InterviewPrepModal from "@/components/InterviewPrepModal";
import MockPaperModal, { MockPaperConfig } from "@/components/MockPaperModal";
import MockPaperView from "@/components/MockPaperView";
import MCQQuizView from "@/components/MCQQuizView";
import type { MCQQuestion } from "@/components/MCQQuizView";
import PersonaModal, { type Persona } from "@/components/PersonaModal";
import BattleArenaModal from "@/components/BattleArenaModal";
import WelcomeBox from "@/components/ui/WelcomeBox";
import WalletPanel from "@/components/ui/WalletPanel";
import OnboardingWalkthrough from "@/components/OnboardingWalkthrough";
import SettingsModal from "@/components/ui/SettingsModal";
import ReflectiveCard from "@/components/ReflectiveCard";
import WalletModal from "@/components/ui/WalletModal";

function getContrastColor(hex: string): string {
    if (!hex) return "";
    const h = hex.replace("#", "");
    if (h.length < 6) return "#ffffff";
    const r = parseInt(h.substring(0, 2), 16);
    const g = parseInt(h.substring(2, 4), 16);
    const b = parseInt(h.substring(4, 6), 16);
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    return yiq >= 128 ? "#000000" : "#ffffff";
}

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

const GENERATION_STEPS = [
    { text: "Analyzing your input..." },
    { text: "Processing request..." },
    { text: "Generating response..." },
    { text: "Refining output..." },
    { text: "Finalizing..." },
];

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

const hasEmbeddedImage = (content: string): string | null => {
    if (!content) return null;
    const dataUriMatch = content.match(/!\[.*?\]\((data:image\/[^;]+;base64,[A-Za-z0-9+/=]+)\)/);
    if (dataUriMatch) return dataUriMatch[1];
    const urlMatch = content.match(/!\[.*?\]\((https?:\/\/[^\s)]+\.(?:png|jpe?g|gif|webp|svg|bmp)(?:\?.*?)?)\)/);
    if (urlMatch) return urlMatch[1];
    return null;
};

const stripEmbeddedImage = (content: string): string => {
    return content.replace(/<!--.*?-->/g, '').replace(/!\[.*?\]\((data:image\/[^;]+;base64,[A-Za-z0-9+/=]+)\)/g, '').replace(/!\[.*?\]\((https?:\/\/[^\s)]+\.(?:png|jpe?g|gif|webp|svg|bmp)(?:\?.*?)?)\)/g, '').replace(/\n{3,}/g, '\n\n').trim();
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
    const { t, i18n } = useTranslation();
    const router = useRouter();
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
    const [showWalkthrough, setShowWalkthrough] = useState(false);
    const [imageGenStatus, setImageGenStatus] = useState<"idle" | "generating" | "completed">("idle");
    const [notifications, setNotifications] = useState<SocialNotification[]>([]);
    const [showNotificationPanel, setShowNotificationPanel] = useState(false);
    const notificationPanelRef = useRef<HTMLDivElement>(null);
    const [userName, setUserName] = useState<string>("");
    const [userEmail, setUserEmail] = useState<string>("");
    const [messages, setMessages] = useState<Message[]>(getWelcomeMessages);
    const [editingMessageIndex, setEditingMessageIndex] = useState<number | null>(null);
    const [editingMessageText, setEditingMessageText] = useState<string>("");
    const [input, setInput] = useState("");
    const [sidebarWidth, setSidebarWidth] = useState(260);
    const [rightSidebarWidth, setRightSidebarWidth] = useState(340);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
        if (typeof window === "undefined") return true;
        return window.innerWidth < 768;
    });
    const [isRightSidebarCollapsed, setIsRightSidebarCollapsed] = useState(true);
    const [proActive, setProActive] = useState(false);
    const [codeActive, setCodeActive] = useState(false);
    const [webActive, setWebActive] = useState(false);
    const [isResizingLeft, setIsResizingLeft] = useState(false);
    const [isResizingRight, setIsResizingRight] = useState(false);
    const [showPromo, setShowPromo] = useState(() => {
        if (typeof window === "undefined") return true;
        return window.localStorage.getItem("arena_show_promo") !== "false";
    });
    const { isDarkMode, toggleTheme } = useTheme();
    const [selectedEngine, setSelectedEngine] = useState(() => Cookies.get("selectedMode") || "Query Mode");
    useEffect(() => { Cookies.set("selectedMode", selectedEngine, { expires: 365 }); }, [selectedEngine]);
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
    const [copiedMsgIndex, setCopiedMsgIndex] = useState<number | null>(null);
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
    const [rightSidebarTab, setRightSidebarTab] = useState<"usage" | "gmail" | "wallet">("usage");
    const [isEnterpriseMode, setIsEnterpriseMode] = useState(false);
    const [sidebarView, setSidebarView] = useState<"chat" | "mail" | "notes">("chat");
    const [notes, setNotes] = useState<Note[]>([]);
    const [loadingNotes, setLoadingNotes] = useState(false);
    const [searchNoteQuery, setSearchNoteQuery] = useState("");
    const [selectedNote, setSelectedNote] = useState<Note | null>(null);
    const [editingNoteTitleId, setEditingNoteTitleId] = useState<string | null>(null);
    const [editingNoteTitleValue, setEditingNoteTitleValue] = useState("");
    const [isNoteEditorOpen, setIsNoteEditorOpen] = useState(false);
    const [isNotePopup, setIsNotePopup] = useState(false);
    const [isNoteMaximized, setIsNoteMaximized] = useState(false);
    const [notePopupPosition, setNotePopupPosition] = useState({ x: 100, y: 100 });
    const [notePopupSize, setNotePopupSize] = useState({ width: 600, height: 500 });
    const [editorTitle, setEditorTitle] = useState("");
    const [editorColor, setEditorColor] = useState("#ffffff");
    const [editorLined, setEditorLined] = useState(false);
    const [showWhiteboard, setShowWhiteboard] = useState(false);
    const [showAiRewrite, setShowAiRewrite] = useState(false);
    const [aiRewriteInstruction, setAiRewriteInstruction] = useState("");
    const [aiRewriting, setAiRewriting] = useState(false);
    const [isDraggingNote, setIsDraggingNote] = useState(false);
    const [noteDragOffset, setNoteDragOffset] = useState({ x: 0, y: 0 });
    const [isResizingNote, setIsResizingNote] = useState(false);
    const [noteResizeOffset, setNoteResizeOffset] = useState({ startX: 0, startY: 0, startW: 0, startH: 0 });
    const [showImageInsertOptions, setShowImageInsertOptions] = useState(false);
    const [showLibraryPicker, setShowLibraryPicker] = useState(false);
    const [libraryAssets, setLibraryAssets] = useState<any[]>([]);
    const [showImageGenerate, setShowImageGenerate] = useState(false);
    const [imageGeneratePrompt, setImageGeneratePrompt] = useState("");
    const [imageGenerating, setImageGenerating] = useState(false);
    const deviceFileInputRef = useRef<HTMLInputElement>(null);
    const [isNoteRecording, setIsNoteRecording] = useState(false);
    const noteMediaRecorderRef = useRef<MediaRecorder | null>(null);
    const [noteStream, setNoteStream] = useState<MediaStream | null>(null);
    const noteAudioRef = useRef<HTMLAudioElement | null>(null);

    const [noteFontSize, setNoteFontSize] = useState(16);
    const [noteLineSpacing, setNoteLineSpacing] = useState(1.8);
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
    const [gmailAutoOn, setGmailAutoOn] = useState(false);
    const [gmailAutoShowModal, setGmailAutoShowModal] = useState(false);
    const [gmailAutoMode, setGmailAutoMode] = useState<"all" | "to" | null>(null);
    const [gmailAutoTargetEmail, setGmailAutoTargetEmail] = useState("");
    const [gmailAutoTone, setGmailAutoTone] = useState("professional");
    const [gmailAutoSignature, setGmailAutoSignature] = useState("");
    const [gmailAutoInstructions, setGmailAutoInstructions] = useState("");
    const [gmailBulkModal, setGmailBulkModal] = useState(false);
    const [gmailRewriteModal, setGmailRewriteModal] = useState(false);
    const [gmailRewriting, setGmailRewriting] = useState(false);
    const [gmailRewrittenBody, setGmailRewrittenBody] = useState("");
    const gmailAutoIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const gmailAutoRunningRef = useRef(false);
    const PLACEHOLDER_TEXTS = useMemo(() => [
        t("hint_1"),
        t("hint_2"),
        t("hint_3"),
        t("hint_4"),
        t("hint_5"),
    ], [t]);
    const placeholderTextsRef = useRef(PLACEHOLDER_TEXTS);
    useEffect(() => { placeholderTextsRef.current = PLACEHOLDER_TEXTS; }, [PLACEHOLDER_TEXTS]);
    const [placeholderIndex, setPlaceholderIndex] = useState(0);
    const [typedPlaceholder, setTypedPlaceholder] = useState(PLACEHOLDER_TEXTS[0]);
    const [editingChatId, setEditingChatId] = useState<string | null>(null);
    const [editingTitle, setEditingTitle] = useState("");
    const editingInputRef = useRef<HTMLInputElement>(null);
    const noteEditorRef = useRef<HTMLDivElement>(null);
    const noteInlineTitleRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [showScrollToBottom, setShowScrollToBottom] = useState(false);
    const mainScrollRef = useRef<HTMLElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const bulkFileInputRef = useRef<HTMLInputElement>(null);
    const requestStartTime = useRef<number>(0);
    const stopGenerationRef = useRef(false);
    const abortControllerRef = useRef<AbortController | null>(null);
    const styleCardsScrollRef = useRef<HTMLDivElement>(null);

    const [accent, setAccent] = useState<string>("");

    useEffect(() => {
        if (typeof window !== "undefined") {
            setAccent(localStorage.getItem("rudranex_accent") || "");
        }
    }, []);

    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [settingsPanel, setSettingsPanel] = useState<"persona" | "faq" | "bug" | "deactivate">("persona");
    const [isPersonalizationModalOpen, setIsPersonalizationModalOpen] = useState(false);
    const [profilePic, setProfilePic] = useState<string | null>(null);
    useEffect(() => {
        if (typeof window !== "undefined") {
            setProfilePic(getProfilePicture());
        }
    }, [isPersonalizationModalOpen]);
    const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
    const [showProfileDropup, setShowProfileDropup] = useState(false);
    const [emptyChats, setEmptyChats] = useState<Set<string>>(new Set());
    const profileDropupRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (profileDropupRef.current && !profileDropupRef.current.contains(event.target as Node)) {
                setShowProfileDropup(false);
            }
        };
        if (showProfileDropup) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [showProfileDropup]);

    const [subscription, setSubscription] = useState<any>(null);
    const [isSubscriptionLoading, setIsSubscriptionLoading] = useState(false);
    const [planFeatures, setPlanFeaturesState] = useState<string[]>([]);

    const engines = [
        { name: "Explore Mode", endpoint: "/chat", icon: GraduationCap },
        { name: "Assistant Mode", endpoint: "/chat", icon: Bot },
        { name: "Interview Prep", endpoint: "/tools/interview", icon: UserCog },
        { name: "Mock Paper Generator", endpoint: "/chat", icon: FileIcon },
        { name: "Persona Mode", endpoint: "/chat", icon: Sparkles },
        { name: "AI Image Lab", endpoint: "/features/image/generate", icon: ImageIcon },
        { name: "Battle Arena", endpoint: "/battle-arena", icon: Swords },
    ];


    const userRole = typeof window !== "undefined" ? getUserRole() : null;
    const schoolName = typeof window !== "undefined" ? getSchoolName() : null;
    const isGlobalAdmin = userRole === "global_admin";
    const showEmployeeView = userRole === "employee" || userRole === "enterprise_admin" || userRole === "manager" || userRole === "school_admin" || userRole === "faculty" || (isGlobalAdmin && isEnterpriseMode);
    const isEnterpriseUser = userRole === "employee" || userRole === "enterprise_admin" || userRole === "manager";
    const isEnterpriseModeActive = isEnterpriseUser || (isGlobalAdmin && isEnterpriseMode);

    const employeeRestrictedEngines = ["Explore Mode", "Interview Prep", "Mock Paper Generator", "Battle Arena"];
    const visibleEngines = showEmployeeView
        ? engines.filter(e => !employeeRestrictedEngines.includes(e.name) && e.name !== "Persona Mode" && e.name !== "AI Image Lab")
        : engines.filter(e => e.name !== "Assistant Mode" && e.name !== "Persona Mode" && e.name !== "AI Image Lab");

    // Set default engine based on user role
    useEffect(() => {
        setSelectedEngine(showEmployeeView ? "Assistant Mode" : "Explore Mode");
    }, [showEmployeeView]);

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

    useEffect(() => {
        if (authed && !showEmployeeView) {
            const shouldShow = window.localStorage.getItem("show_walkthrough") === "true";
            if (shouldShow) {
                setShowWalkthrough(true);
                window.localStorage.removeItem("show_walkthrough");
            }
        }
    }, [authed, showEmployeeView]);

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

    const handleMainScroll = (e: React.UIEvent<HTMLElement>) => {
        const target = e.currentTarget;
        const threshold = 300;
        const isNearBottom = target.scrollHeight - target.scrollTop - target.clientHeight < threshold;
        setShowScrollToBottom(!isNearBottom);
    };

    const handleScrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

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
        if (!showEmployeeView || rightSidebarTab !== "gmail" || isRightSidebarCollapsed) return
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

    // ── Gmail Auto-Reply Polling ──
    const doAutoReplyCycle = useCallback(async () => {
        if (gmailAutoRunningRef.current || !gmailAutoOn) return;
        gmailAutoRunningRef.current = true;
        try {
            if (gmailAutoMode === "all") {
                const { triggerGoogleAutoReplyAll } = await import("@/lib/chat-api");
                const res = await triggerGoogleAutoReplyAll(5);
                if (res.success) {
                    if (res.replied && res.replied > 0) {
                        setGmailAutoStatus(`Auto-replied to ${res.replied} email(s) ✓`);
                    } else {
                        setGmailAutoStatus("Watching all emails...");
                    }
                } else {
                    setGmailAutoStatus(res.error || "Auto-reply failed");
                }
            } else if (gmailAutoMode === "to" && gmailAutoTargetEmail.trim()) {
                const { getGoogleAgentUnread, triggerGoogleAutoReply } = await import("@/lib/chat-api");
                const unreadRes = await getGoogleAgentUnread(20);
                if (unreadRes.success && unreadRes.emails?.length) {
                    const target = gmailAutoTargetEmail.trim().toLowerCase();
                    const matching = unreadRes.emails.filter(
                        (e: any) => e.from?.toLowerCase().includes(target)
                    );
                    if (matching.length > 0) {
                        for (const email of matching) {
                            if (!gmailAutoOn) break;
                            const replyRes = await triggerGoogleAutoReply(email.id);
                            if (replyRes?.success) {
                                setGmailAutoStatus(`Auto-replied to ${target} ✓`);
                            } else {
                                setGmailAutoStatus(replyRes?.error || `Reply to ${target} failed`);
                            }
                        }
                    } else {
                        setGmailAutoStatus(`Watching ${gmailAutoTargetEmail}...`);
                    }
                } else {
                    setGmailAutoStatus(unreadRes?.error || `Watching ${gmailAutoTargetEmail}...`);
                }
            }
        } catch (e: any) {
            setGmailAutoStatus("Auto-reply error: " + (e.message || "Unknown"));
        }
        finally { gmailAutoRunningRef.current = false; }
    }, [gmailAutoOn, gmailAutoMode, gmailAutoTargetEmail]);

    useEffect(() => {
        if (gmailAutoOn && gmailAutoMode) {
            doAutoReplyCycle();
            gmailAutoIntervalRef.current = setInterval(doAutoReplyCycle, 45000);
        }
        return () => {
            if (gmailAutoIntervalRef.current) {
                clearInterval(gmailAutoIntervalRef.current);
                gmailAutoIntervalRef.current = null;
            }
        };
    }, [gmailAutoOn, gmailAutoMode, doAutoReplyCycle]);

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

    const handleDiscontinueAccount = async () => {
        const confirmDelete = window.confirm(
            "Are you sure you want to discontinue your account? All your chats, custom personas, and settings will be permanently deleted. This action cannot be undone."
        );
        if (!confirmDelete) return;

        try {
            await discontinueAccount();
            toast.success("Account deleted successfully.");

            // Clear all credentials
            removeApiKey();
            removeUserInfo();
            removeUserRole();
            removeSchoolName();
            removeEnterpriseName();
            setStoredActiveChatId(null);
            setAuthed(false);
            setUserName("");
            setUserEmail("");
            window.location.href = "/";
        } catch (error: any) {
            console.error("Failed to delete account:", error);
            toast.error(error.message || "Failed to delete account. Please try again.");
        }
    };

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

    const handleBulkExcelUpload = async (file: File) => {
        const ext = file.name.split('.').pop()?.toLowerCase();
        if (!ext || !['xlsx', 'xls', 'csv'].includes(ext)) {
            setGmailSendResult("Please upload an Excel (.xlsx/.xls) or CSV file");
            return;
        }
        setGmailSending(true);
        setGmailSendResult("");
        setGmailAutoStatus("Reading file...");
        try {
            const reader = new FileReader();
            const text = await new Promise<string>((resolve, reject) => {
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = () => reject(new Error("Failed to read file"));
                if (ext === 'csv') reader.readAsText(file);
                else reader.readAsArrayBuffer(file);
            });

            let rows: { email: string; message: string }[];
            if (ext === 'csv') {
                rows = text.split('\n').filter(Boolean).slice(1).map(line => {
                    const [email, message] = line.split(',').map(s => s.trim().replace(/^"|"$/g, ''));
                    return { email, message };
                }).filter(r => r.email && r.message);
            } else {
                // Excel file — use a simple CSV-like parser for now (or integrate xlsx library)
                setGmailSendResult("Excel parsing not available. Please use CSV format.");
                setGmailSending(false);
                return;
            }

            if (!rows.length) {
                setGmailSendResult("No valid rows found. Expected columns: email, message");
                setGmailSending(false);
                return;
            }

            const { sendGoogleEmail } = await import("@/lib/chat-api");
            let sent = 0, failed = 0;
            for (const r of rows) {
                try {
                    const res = await sendGoogleEmail({ to: r.email, subject: "Message from Rudranex AI", body: r.message });
                    if (res.success) sent++; else failed++;
                } catch { failed++; }
            }
            setGmailAutoStatus(`Bulk sent: ${sent}✓ ${failed}✗`);
            setGmailSendResult(`Sent to ${sent}/${rows.length} (${failed} failed)`);
        } catch (e: any) {
            setGmailSendResult("Bulk failed: " + (e.message || "Unknown error"));
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
            const text = placeholderTextsRef.current[placeholderIndex % placeholderTextsRef.current.length];

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
    }, [placeholderIndex, isProcessingFile]);

    // Poll for image generation status from Library
    useEffect(() => {
        const checkStatus = () => {
            if (typeof window === "undefined") return;
            const status = localStorage.getItem("image_gen_status");
            const timestamp = localStorage.getItem("image_gen_timestamp");
            if (status && timestamp) {
                const age = Date.now() - Number(timestamp);
                if (age < 30000) {
                    setImageGenStatus(status as "idle" | "generating" | "completed");
                } else {
                    setImageGenStatus("idle");
                }
            }
        };
        checkStatus();
        const interval = setInterval(checkStatus, 1000);
        return () => clearInterval(interval);
    }, []);

    const chatNotificationsInitialFetchRef = useRef(true);

    // Load and poll social notifications
    useEffect(() => {
        if (!isAuthenticated()) return;

        const fetchNotifs = () => {
            getNotifications()
                .then((res) => {
                    if (res.success && res.notifications) {
                        setNotifications((prev) => {
                            const prevIds = prev.map((n) => n.id);
                            const hasNew = res.notifications.some((n: any) => !prevIds.includes(n.id));
                            if (hasNew && !chatNotificationsInitialFetchRef.current) {
                                const audio = new Audio("/noti.mp3");
                                audio.play().catch((err) => console.log("Notification sound autoplay blocked or failed:", err));
                            }
                            return res.notifications;
                        });
                        if (chatNotificationsInitialFetchRef.current) {
                            chatNotificationsInitialFetchRef.current = false;
                        }
                    }
                })
                .catch((err) => {
                    console.error("Failed to fetch notifications:", err);
                });
        };

        fetchNotifs();
        const interval = setInterval(fetchNotifs, 15000);
        return () => clearInterval(interval);
    }, []);

    const handleNotificationClick = async (notif: SocialNotification) => {
        try {
            setShowNotificationPanel(false);
            if (!notif.is_read) {
                await markNotificationAsRead(notif.id);
                setNotifications(prev =>
                    prev.map(n => (n.id === notif.id ? { ...n, is_read: true } : n))
                );
            }
            if (typeof window !== "undefined") {
                localStorage.setItem("expand_asset_id", notif.asset_id);
                router.push("/library");
            }
        } catch (err: any) {
            console.error("Failed to click notification:", err);
        }
    };

    // Click outside to close notification panel
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (notificationPanelRef.current && !notificationPanelRef.current.contains(event.target as Node)) {
                setShowNotificationPanel(false);
            }
        };
        if (showNotificationPanel) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [showNotificationPanel]);


    const copyToClipboard = (text: string, index?: number) => {
        navigator.clipboard.writeText(text);
        if (index !== undefined) {
            setCopiedMsgIndex(index);
            setTimeout(() => setCopiedMsgIndex(null), 2000);
        }
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

        if (typeof window !== "undefined") {
            const currentUrl = new URL(window.location.href);
            if (currentUrl.searchParams.get("id") !== chatId) {
                currentUrl.searchParams.set("id", chatId);
                window.history.pushState({}, "", currentUrl.toString());
            }
        }

        try {
            const data = await getChatHistory(chatId);
            if (data.messages && data.messages.length === 0) {
                setEmptyChats((prev) => {
                    const next = new Set(prev);
                    next.add(chatId);
                    return next;
                });
            } else {
                setEmptyChats((prev) => {
                    if (prev.has(chatId)) {
                        const next = new Set(prev);
                        next.delete(chatId);
                        return next;
                    }
                    return prev;
                });
            }
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

        if (typeof window !== "undefined") {
            const params = new URLSearchParams(window.location.search);
            const queryChatId = params.get("id");
            if (queryChatId) {
                setStoredActiveChatId(queryChatId);
                setActiveChatId(queryChatId);
            }
        }

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
            setEmptyChats((prev) => {
                const next = new Set(prev);
                next.add(data.chat.id);
                return next;
            });
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

    const fetchNotes = useCallback(async () => {
        setLoadingNotes(true);
        try {
            const res = await getNotes();
            if (res.success && res.notes) {
                setNotes(res.notes);
            }
        } catch (error) {
            console.error("Failed to load notes:", error);
            toast.error("Failed to load notes.");
        } finally {
            setLoadingNotes(false);
        }
    }, []);

    const handleCreateNote = async () => {
        try {
            const res = await createNote({
                title: "New Note",
                content: "",
                drawing_data: "",
                page_color: "#ffffff",
                is_lined: false,
            });
            if (res.success && res.note) {
                setNotes((prev) => [res.note!, ...prev]);
                setSelectedNote(res.note);
                setIsNoteEditorOpen(true);
                toast.success("Note created!");
            }
        } catch (error) {
            console.error("Failed to create note:", error);
            toast.error("Failed to create note.");
        }
    };

    const handleUpdateNote = async (id: string, updates: Partial<Note>) => {
        try {
            const res = await updateNote(id, updates);
            if (res.success && res.note) {
                setNotes((prev) =>
                    prev.map((n) => (n.id === id ? { ...n, ...updates } : n))
                );
                if (selectedNote && selectedNote.id === id) {
                    setSelectedNote((prev) => (prev ? { ...prev, ...updates } : null));
                }
            }
        } catch (error) {
            console.error("Failed to update note:", error);
        }
    };

    const handleDeleteNote = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this note?")) return;
        try {
            const res = await deleteNote(id);
            if (res.success) {
                setNotes((prev) => prev.filter((n) => n.id !== id));
                if (selectedNote && selectedNote.id === id) {
                    setSelectedNote(null);
                    setIsNoteEditorOpen(false);
                }
                toast.success("Note deleted!");
            }
        } catch (error) {
            console.error("Failed to delete note:", error);
            toast.error("Failed to delete note.");
        }
    };

    const pausePodcastForAsk = () => {
        if (noteAudioRef.current) {
            noteAudioRef.current.pause();
            noteAudioRef.current = null;
        }
        if (podcastAskAudioRef.current) {
            podcastAskAudioRef.current.pause();
            podcastAskAudioRef.current = null;
        }
        window.speechSynthesis?.cancel();
        setIsNoteTTSPlaying(false);
        setIsPodcastAnswering(false);
        setIsPodcastGenerating(false);
        setNoteTTSProvider(null);
        // Keep podcastChunks, podcastChunkIndex, notePodcastText intact for resume
    };

    const startNoteRecording = async () => {
        try {
            // If podcast is playing or AI is answering, pause and switch to ask mode
            if (isNoteTTSPlaying || isPodcastAnswering) {
                pausePodcastForAsk();
                setPendingResumePodcast(false);
            }
            const mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            setNoteStream(mediaStream);
            let mimeType = 'audio/webm;codecs=opus';
            if (MediaRecorder.isTypeSupported('audio/mp4')) {
                mimeType = 'audio/mp4';
            } else if (MediaRecorder.isTypeSupported('audio/mpeg')) {
                mimeType = 'audio/mpeg';
            } else if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
                mimeType = 'audio/webm;codecs=opus';
            }
            const mediaRecorder = new MediaRecorder(mediaStream, { mimeType });
            noteMediaRecorderRef.current = mediaRecorder;
            const chunks: Blob[] = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunks.push(e.data);
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(chunks, { type: mediaRecorder.mimeType || 'audio/webm' });
                if (audioBlob.size < 1000) {
                    toast.error("Recording too short.");
                    return;
                }
                // Transcribe
                setIsNoteTranscribing(true);
                let transcript = "";
                try {
                    const { transcribeSpeech } = await import("@/lib/chat-api");
                    transcript = await transcribeSpeech(audioBlob);
                } catch (err: any) {
                    console.error("Note STT Error:", err);
                    try {
                        const { transcribeSpeechFallback } = await import("@/lib/chat-api");
                        const fallbackResult = await transcribeSpeechFallback("hi-IN");
                        if (fallbackResult.success && fallbackResult.text) {
                            transcript = fallbackResult.text;
                        }
                    } catch (fallbackErr) {
                        console.error("Note STT fallback also failed:", fallbackErr);
                    }
                }
                setIsNoteTranscribing(false);
                if (!transcript) {
                    toast.error("Could not transcribe speech.");
                    return;
                }
                // If podcast was active, treat as an ask — send to AI
                if (notePodcastText) {
                    await handlePodcastAsk(transcript);
                } else {
                    // Normal mode: insert text into note editor
                    if (noteEditorRef.current) {
                        noteEditorRef.current.focus();
                        document.execCommand("insertText", false, transcript + " ");
                        void handleUpdateNote(selectedNote!.id, { content: getNoteContent() });
                        toast.success("Speech converted to text");
                    }
                }
            };

            mediaRecorder.start();
            setIsNoteRecording(true);
        } catch (err) {
            console.error("Note recording error:", err);
            toast.error("Could not access microphone");
        }
    };

    const stopNoteRecording = () => {
        if (noteMediaRecorderRef.current && isNoteRecording) {
            noteMediaRecorderRef.current.stop();
            setIsNoteRecording(false);
            if (noteStream) {
                noteStream.getTracks().forEach(track => track.stop());
                setNoteStream(null);
            }
        }
    };

    const [isNoteTTSPlaying, setIsNoteTTSPlaying] = useState(false);
    const [noteTTSProvider, setNoteTTSProvider] = useState<"sarvam" | "browser" | null>(null);
    const [notePodcastText, setNotePodcastText] = useState("");
    const [isPodcastAsking, setIsPodcastAsking] = useState(false);
    const [isPodcastAnswering, setIsPodcastAnswering] = useState(false);
    const [isPodcastGenerating, setIsPodcastGenerating] = useState(false);
    const [isNoteTranscribing, setIsNoteTranscribing] = useState(false);
    const [pendingResumePodcast, setPendingResumePodcast] = useState(false);
    const [podcastChunks, setPodcastChunks] = useState<string[]>([]);
    const [podcastChunkIndex, setPodcastChunkIndex] = useState(0);
    const [podcastAskHistory, setPodcastAskHistory] = useState<{q:string,a:string}[]>([]);
    const podcastAskAudioRef = useRef<HTMLAudioElement | null>(null);

    const splitNoteIntoChunks = (text: string): string[] => {
        const chunks: string[] = [];
        const paragraphs = text.split(/\n\s*\n/);
        let current = "";
        for (const p of paragraphs) {
            const trimmed = p.trim();
            if (!trimmed) continue;
            if (current.length + trimmed.length > 700) {
                if (current) chunks.push(current.trim());
                current = trimmed;
            } else {
                current += (current ? "\n\n" : "") + trimmed;
            }
        }
        if (current.trim()) chunks.push(current.trim());
        if (chunks.length === 0 && text.trim()) chunks.push(text.trim());
        return chunks;
    };

    const stopAllAudio = () => {
        if (noteAudioRef.current) {
            noteAudioRef.current.pause();
            noteAudioRef.current = null;
        }
        if (podcastAskAudioRef.current) {
            podcastAskAudioRef.current.pause();
            podcastAskAudioRef.current = null;
        }
        window.speechSynthesis?.cancel();
        setIsNoteTTSPlaying(false);
        setIsPodcastAnswering(false);
        setIsPodcastGenerating(false);
        setNoteTTSProvider(null);
        setNotePodcastText("");
        setPodcastChunks([]);
        setPodcastChunkIndex(0);
        setPendingResumePodcast(false);
    };

    const podcastPlayChunk = async (chunkIdx: number, overrideChunks?: string[]) => {
        const chunks = overrideChunks || podcastChunks;
        if (!chunks.length || chunkIdx >= chunks.length) {
            setIsNoteTTSPlaying(false);
            setNoteTTSProvider(null);
            setNotePodcastText("");
            setPodcastChunks([]);
            setPodcastChunkIndex(0);
            return;
        }
        const chunkText = chunks[chunkIdx];
        setIsPodcastGenerating(true);
        setPodcastChunkIndex(chunkIdx);
        let audioBlob: Blob | null = null;
        for (let attempt = 0; attempt <= 2; attempt++) {
            try {
                const { generateTTSAudio } = await import("@/lib/chat-api");
                audioBlob = await generateTTSAudio(chunkText, "hi-IN");
                break;
            } catch {
                if (attempt < 2) {
                    await new Promise(r => setTimeout(r, 500));
                    continue;
                }
            }
        }
        if (audioBlob) {
            const audioUrl = URL.createObjectURL(audioBlob);
            const audio = new Audio(audioUrl);
            noteAudioRef.current = audio;
            setNoteTTSProvider("sarvam");
            setIsNoteTTSPlaying(true);
            setIsPodcastGenerating(false);
            const nextIdx = chunkIdx + 1;
            audio.onended = () => {
                URL.revokeObjectURL(audioUrl);
                noteAudioRef.current = null;
                if (nextIdx < chunks.length) {
                    podcastPlayChunk(nextIdx, chunks);
                } else {
                    setIsNoteTTSPlaying(false);
                    setNoteTTSProvider(null);
                    setNotePodcastText("");
                    setPodcastChunks([]);
                    setPodcastChunkIndex(0);
                }
            };
            audio.onerror = () => {
                URL.revokeObjectURL(audioUrl);
                noteAudioRef.current = null;
                if (nextIdx < chunks.length) {
                    podcastPlayChunk(nextIdx, chunks);
                } else {
                    setIsNoteTTSPlaying(false);
                    setNoteTTSProvider(null);
                    setNotePodcastText("");
                    setPodcastChunks([]);
                    setPodcastChunkIndex(0);
                }
            };
            try {
                await audio.play();
            } catch {
                try { await audio.play(); } catch {}
            }
        } else {
            // Single-chunk fallback: browser speech synthesis for the full remaining text
            setIsPodcastGenerating(false);
            const remainingText = chunks.slice(chunkIdx).join("\n\n");
            try {
                if ("speechSynthesis" in window) {
                    setNoteTTSProvider("browser");
                    setIsNoteTTSPlaying(true);
                    const utterance = new SpeechSynthesisUtterance(remainingText);
                    utterance.rate = 0.9;
                    utterance.pitch = 1;
                    utterance.onend = () => {
                        setIsNoteTTSPlaying(false);
                        setNoteTTSProvider(null);
                        setNotePodcastText("");
                        setPodcastChunks([]);
                        setPodcastChunkIndex(0);
                    };
                    utterance.onerror = () => {
                        setIsNoteTTSPlaying(false);
                        setNoteTTSProvider(null);
                        setNotePodcastText("");
                        setPodcastChunks([]);
                        setPodcastChunkIndex(0);
                    };
                    window.speechSynthesis.speak(utterance);
                } else {
                    toast.error("TTS not available.");
                    setIsNoteTTSPlaying(false);
                    setNotePodcastText("");
                    setPodcastChunks([]);
                    setPodcastChunkIndex(0);
                }
            } catch {
                toast.error("TTS failed.");
                setIsNoteTTSPlaying(false);
                setNotePodcastText("");
                setPodcastChunks([]);
                setPodcastChunkIndex(0);
            }
        }
    };

    const playNotePodcast = async () => {
        if (isNoteTTSPlaying || isPodcastAnswering) {
            stopAllAudio();
            return;
        }
        // Resume from saved position if chunks exist
        if (pendingResumePodcast && podcastChunks.length > 0) {
            setPendingResumePodcast(false);
            const resumeIdx = podcastChunkIndex;
            await podcastPlayChunk(resumeIdx, podcastChunks);
            return;
        }
        const text = noteEditorRef.current?.innerText || "";
        if (!text.trim()) {
            toast.error("No text to read.");
            return;
        }
        setNotePodcastText(text);
        const chunks = splitNoteIntoChunks(text);
        setPodcastChunks(chunks);
        setPodcastChunkIndex(0);
        await podcastPlayChunk(0, chunks);
    };

    const speakAiResponse = async (text: string) => {
        if (!text.trim()) return;
        setIsPodcastAnswering(true);
        try {
            const { generateTTSAudio } = await import("@/lib/chat-api");
            const audioBlob = await generateTTSAudio(text, "hi-IN");
            const audioUrl = URL.createObjectURL(audioBlob);
            const audio = new Audio(audioUrl);
            podcastAskAudioRef.current = audio;
            audio.onended = () => {
                URL.revokeObjectURL(audioUrl);
                podcastAskAudioRef.current = null;
                setIsPodcastAnswering(false);
                setPendingResumePodcast(true);
            };
            audio.onerror = () => {
                URL.revokeObjectURL(audioUrl);
                podcastAskAudioRef.current = null;
                setIsPodcastAnswering(false);
                setPendingResumePodcast(true);
            };
            await audio.play();
        } catch {
            try {
                if ("speechSynthesis" in window) {
                    const utterance = new SpeechSynthesisUtterance(text);
                    utterance.rate = 0.9;
                    utterance.pitch = 1;
                    utterance.onend = () => {
                        setIsPodcastAnswering(false);
                        setPendingResumePodcast(true);
                    };
                    utterance.onerror = () => {
                        setIsPodcastAnswering(false);
                        setPendingResumePodcast(true);
                    };
                    window.speechSynthesis.speak(utterance);
                } else {
                    setIsPodcastAnswering(false);
                    setPendingResumePodcast(true);
                    toast.error("Voice answer not available.");
                }
            } catch {
                setIsPodcastAnswering(false);
                setPendingResumePodcast(true);
            }
        }
    };

    const handlePodcastAsk = async (transcript: string) => {
        setIsPodcastAsking(true);
        try {
            const { sendChatCompletion } = await import("@/lib/chat-api");
            const noteContext = notePodcastText || noteEditorRef.current?.innerText || "";
            // Build previous Q&A context
            const qaHistory = podcastAskHistory.slice(-3).map(
                (qa, i) => `Q${i + 1}: ${qa.q}\nA${i + 1}: ${qa.a}`
            ).join("\n");
            const qaBlock = qaHistory ? `\n\nPrevious Q&A:\n${qaHistory}` : "";
            const systemMsg = `You are a helpful tutor. The user was listening to the following note via podcast:\n\n${noteContext.slice(0, 4000)}${qaBlock}\n\nAnswer the user's question based on the note content and previous Q&A. Keep your answer concise and spoken-word friendly (2-4 sentences). If the question is a follow-up, use the previous context.`;
            const res = await sendChatCompletion({
                messages: [
                    { role: "system", content: systemMsg },
                    { role: "user", content: transcript }
                ]
            });
            const answer = (res as any)?.response || res.data?.[0]?.message?.content || "";
            if (answer) {
                setPodcastAskHistory(prev => [...prev, { q: transcript, a: answer }]);
                setIsPodcastAsking(false);
                await speakAiResponse(answer);
            } else {
                throw new Error("No answer");
            }
        } catch {
            setIsPodcastAsking(false);
            toast.error("Failed to get AI answer.");
            setPendingResumePodcast(true);
        }
    };

    useEffect(() => {
        if (sidebarView === "notes" && !isEnterpriseModeActive) {
            void fetchNotes();
        }
    }, [sidebarView, isEnterpriseModeActive, fetchNotes]);

    useEffect(() => {
        const handlePointerMove = (e: PointerEvent) => {
            if (isDraggingNote) {
                setNotePopupPosition({
                    x: e.clientX - noteDragOffset.x,
                    y: e.clientY - noteDragOffset.y,
                });
            } else if (isResizingNote) {
                const deltaX = e.clientX - noteResizeOffset.startX;
                const deltaY = e.clientY - noteResizeOffset.startY;
                setNotePopupSize({
                    width: Math.max(300, noteResizeOffset.startW + deltaX),
                    height: Math.max(300, noteResizeOffset.startH + deltaY),
                });
            }
        };

        const handlePointerUp = () => {
            setIsDraggingNote(false);
            setIsResizingNote(false);
        };

        if (isDraggingNote || isResizingNote) {
            document.addEventListener("pointermove", handlePointerMove);
            document.addEventListener("pointerup", handlePointerUp);
        }

        return () => {
            document.removeEventListener("pointermove", handlePointerMove);
            document.removeEventListener("pointerup", handlePointerUp);
        };
    }, [isDraggingNote, isResizingNote, noteDragOffset, noteResizeOffset]);

    const renderNoteMath = async (html: string) => {
        try {
            const katex = await import("katex");
            const renderKatex = (katex as any).default.renderToString || (katex as any).renderToString;
            if (typeof renderKatex !== "function") return html;
            return html.replace(/\$\$([\s\S]*?)\$\$/g, (_m: string, latex: string) => {
                try {
                    const rendered = renderKatex(latex.trim(), { displayMode: true, throwOnError: false });
                    return `<span class="math-block" contenteditable="false" data-latex="${encodeURIComponent(latex.trim())}">${rendered}</span>`;
                } catch {
                    return `<span class="math-block" contenteditable="false" style="background:rgba(255,255,255,0.05);padding:8px 12px;border-radius:6px;display:block;font-family:monospace;margin:8px 0;">$${latex}$$</span>`;
                }
            });
        } catch {
            return html;
        }
    };

    useEffect(() => {
        if (selectedNote) {
            setEditorTitle(selectedNote.title || "Untitled Note");
            setEditorColor(selectedNote.page_color || "#ffffff");
            setEditorLined(selectedNote.is_lined || false);
            if (noteEditorRef.current) {
                document.execCommand("defaultParagraphSeparator", false, "div");
                noteEditorRef.current.innerHTML = selectedNote.content || "";
                void renderNoteMath(selectedNote.content || "").then((rendered) => {
                    if (noteEditorRef.current) {
                        noteEditorRef.current.innerHTML = rendered;
                    }
                });
            }
        }
    }, [selectedNote?.id]);

    const getNoteContent = () => {
        if (!noteEditorRef.current) return "";
        let html = noteEditorRef.current.innerHTML;
        html = html.replace(/<span[^>]*data-latex="([^"]*)"[^>]*>[\s\S]*?<\/span>/g, (_m: string, encoded: string) => {
            return `$$${decodeURIComponent(encoded)}$$`;
        });
        return html;
    };

    const exportAsTxt = () => {
        if (!selectedNote) return;
        const text = noteEditorRef.current?.innerText || "";
        const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${editorTitle || "Untitled Note"}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const exportAsPdf = () => {
        if (!selectedNote) return;
        const title = editorTitle || "Untitled Note";
        const content = noteEditorRef.current?.innerHTML || "";
        const pageColor = editorColor || "#ffffff";
        const isLined = editorLined;
        const lineSpacing = noteLineSpacing;
        const isDark = pageColor === "#1a1a1a" || pageColor === "#201b2b";
        
        const printWindow = window.open("", "_blank");
        if (!printWindow) {
            toast.error("Popup blocked! Please allow popups to export PDF.");
            return;
        }
        
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>${title}</title>
                <link rel="preconnect" href="https://fonts.googleapis.com">
                <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
                <link href="https://fonts.googleapis.com/css2?family=Edu+NSW+ACT+Foundation:wght@400;700&family=Poppins:wght@400;600;700&family=Roboto:wght@400;700&family=Space+Grotesk:wght@400;600&display=swap" rel="stylesheet">
                <style>
                    body {
                        font-family: 'Poppins', 'Roboto', sans-serif;
                        margin: 0;
                        padding: 0;
                        color: ${isDark ? "#f5f5f4" : "#1a1a19"} !important;
                        background-color: ${pageColor} !important;
                        font-size: ${noteFontSize}px;
                        print-color-adjust: exact !important;
                        -webkit-print-color-adjust: exact !important;
                    }
                    .page-wrapper {
                        min-height: 100vh;
                        padding: 40px;
                        box-sizing: border-box;
                        background-color: ${pageColor} !important;
                        print-color-adjust: exact !important;
                        -webkit-print-color-adjust: exact !important;
                    }
                    .lined-paper {
                        background-image: linear-gradient(rgba(0, 0, 0, 0) calc(100% - 1px), ${
                            isDark ? "rgba(255, 255, 255, 0.25)" : "rgba(33, 150, 243, 0.35)"
                        } calc(100% - 1px)) !important;
                        background-size: 100% ${lineSpacing * 16}px !important;
                        background-repeat: repeat !important;
                        background-position: 0 0 !important;
                        background-origin: content-box !important;
                        print-color-adjust: exact !important;
                        -webkit-print-color-adjust: exact !important;
                    }
                    .lined-paper, .lined-paper * {
                        line-height: ${lineSpacing * 16}px !important;
                    }
                    .lined-paper img {
                        line-height: normal !important;
                    }
                    img {
                        max-width: 100%;
                        height: auto;
                        border-radius: 8px;
                        margin: 15px 0;
                    }
                    .lined-paper font[size="1"], font[size="1"] { font-size: 10px; line-height: normal !important; }
                    .lined-paper font[size="2"], font[size="2"] { font-size: 13px; line-height: normal !important; }
                    .lined-paper font[size="3"], font[size="3"] { font-size: 16px; line-height: normal !important; }
                    .lined-paper font[size="4"], font[size="4"] { font-size: 18px; line-height: normal !important; }
                    .lined-paper font[size="5"], font[size="5"] { font-size: 24px; line-height: 1.4 !important; }
                    .lined-paper font[size="6"], font[size="6"] { font-size: 32px; line-height: 1.3 !important; }
                    .lined-paper font[size="7"], font[size="7"] { font-size: 48px; line-height: 1.2 !important; }
                    
                    @media print {
                        html, body {
                            background-color: ${pageColor} !important;
                            color: ${isDark ? "#f5f5f4" : "#1a1a19"} !important;
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
                        }
                        .page-wrapper {
                            background-color: ${pageColor} !important;
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
                        }
                        .lined-paper {
                            background-image: linear-gradient(rgba(0, 0, 0, 0) calc(100% - 1px), ${
                                isDark ? "rgba(255, 255, 255, 0.25)" : "rgba(33, 150, 243, 0.35)"
                            } calc(100% - 1px)) !important;
                            background-size: 100% ${lineSpacing * 16}px !important;
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="page-wrapper ${isLined ? 'lined-paper' : ''}">
                    <h1 style="margin-top: 0; font-size: 24px; border-bottom: 2px solid ${isDark ? '#333' : '#eee'}; padding-bottom: 10px;">${title}</h1>
                    <div style="font-size: inherit; line-height: inherit;">${content}</div>
                </div>
                <script>
                    window.onload = function() {
                        window.print();
                        window.close();
                    };
                </script>
            </body>
            </html>
        `);
        printWindow.document.close();
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
                const retryContent = prevUserMsg.content;
                const priorHistory = messages.slice(0, index - 1);
                setMessages((prev) => prev.slice(0, index));
                void handleSend(retryContent, priorHistory);
            }
        }
    };

    const handleSaveEdit = async (index: number) => {
        const trimmedText = editingMessageText.trim();
        if (!trimmedText) {
            toast.error("Message cannot be empty");
            return;
        }

        const slicedHistory = messages.slice(0, index + 1).map((m, idx) => {
            if (idx === index) {
                return { ...m, content: trimmedText };
            }
            return m;
        });

        setMessages(slicedHistory);
        setEditingMessageIndex(null);

        const priorHistory = slicedHistory.slice(0, index);
        void handleSend(trimmedText, priorHistory);
    };

    const handleStartInterview = (topic: string, duration: number, difficulty: string, vibe: string, focus: string) => {
        setIsInterviewModalOpen(false);
        window.location.href = `/interview?topic=${encodeURIComponent(topic)}&duration=${duration}&difficulty=${difficulty}&vibe=${vibe}&focus=${focus}`;
    };

    const handlePersonaSelect = (persona: Persona) => {
        if (!persona.name) {
            setSelectedPersona(null);
            setSelectedEngine(showEmployeeView ? "Assistant Mode" : "Explore Mode");
        } else {
            setSelectedPersona(persona);
            setSelectedEngine(showEmployeeView ? "Assistant Mode" : "Explore Mode");
        }
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

    const handleBattleArenaHost = (config: { adminName: string; topic: string; difficulty: string; questionCount: number; timePerQuestion: number; gameMode: string }) => {
        setIsBattleArenaModalOpen(false);
        window.location.href = `/battle-arena?host=true&name=${encodeURIComponent(config.adminName)}&topic=${encodeURIComponent(config.topic)}&difficulty=${config.difficulty}&count=${config.questionCount}&time=${config.timePerQuestion}&mode=${config.gameMode}`;
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
        const focusInstruction = config.cognitiveFocus
            ? `\nFocus Area: Customize the style of questions to focus primarily on ${config.cognitiveFocus.toUpperCase()} content (${
                config.cognitiveFocus === "conceptual" ? "theory, definitions, and core conceptual principles" :
                config.cognitiveFocus === "practical" ? "applied labs, code reviews, case studies, and hands-on scenario solving" :
                "analytical logic, out-of-the-box thinking, and complex reasoning challenges"
              }).`
            : "";
        const rigorInstruction = config.evaluationRigor
            ? `\nDifficulty / Rigor: The questions should be written with a ${config.evaluationRigor.toUpperCase()} standard (${
                config.evaluationRigor === "lax" ? "easier questions, encouraging tone, straightforward concepts" :
                config.evaluationRigor === "rigorous" ? "harder questions, trickier distractors, advanced edge cases, and high evaluation standards" :
                "balanced standard difficulty, testing average to above-average concepts"
              }).`
            : "";
        const notesInstruction = config.customNotes
            ? `\nStudy Material / Custom Notes: Generate the questions strictly and directly from the following content:\n"${config.customNotes}"`
            : "";

        if (config.mode === "mcq") {
            const prompt = `You are an expert quiz generator. Generate exactly ${config.numQuestions} multiple choice questions for "${examName}".${focusInstruction}${rigorInstruction}${notesInstruction}

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
        const answerKeyInstruction = config.includeAnswerKey
            ? `\n6. Include an "ANSWER KEY / SOLUTIONS" section at the very end of the paper containing precise solutions and detailed explanations for all questions in Sections A, B, and C.`
            : "";

        const prompt = `Act as an expert examiner. Generate a professional question paper for ${examName}.${focusInstruction}${rigorInstruction}${notesInstruction}
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
5. Generate NOW.${answerKeyInstruction}`;

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

    const handleSend = async (overrideInput?: string, overrideHistory?: Message[]) => {
        const trimmedInput = typeof overrideInput === "string" ? overrideInput.trim() : input.trim();
        if ((!trimmedInput && !selectedFile) || isLoading || isProcessingFile) {
            toast.error("Please enter a message or attach a file");
            return;
        }

        // Gmail mode: if To is filled, polish with AI then show confirmation
        if (rightSidebarTab === "gmail" && showEmployeeView && gmailMailTo.trim()) {
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
                const polished = (res as any)?.response || res.data?.[0]?.message?.content || trimmedInput;
                setGmailPolishedBody(polished);
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

            if (currentChatId) {
                const chatIdStr = currentChatId;
                setEmptyChats((prev) => {
                    if (prev.has(chatIdStr)) {
                        const next = new Set(prev);
                        next.delete(chatIdStr);
                        return next;
                    }
                    return prev;
                });
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
                    if (isImageGenMode) {
                        userContent = [
                            { type: "text", text: trimmedInput },
                            { type: "image_url", image_url: { url: selectedFile.content } }
                        ];
                        requestModality = "image_gen";
                        requestEndpoint = "/features/image/generate";
                    } else {
                        userContent = [
                            { type: "text", text: trimmedInput || "Please extract and return ALL text visible in this image. Perform OCR on the entire image and return the extracted text." },
                            { type: "image_url", image_url: { url: selectedFile.content } }
                        ];
                        requestModality = "ocr";
                        requestEndpoint = "/features/vision/solve";
                    }

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

            // ── Inject Hindi instruction when Hindi language is selected ──
            if (i18n.language === "hi") {
                const hindiInstruction = "hindi mei answer kro. ";
                if (typeof userContent === "string") {
                    userContent = hindiInstruction + userContent;
                } else if (Array.isArray(userContent)) {
                    const firstText = userContent.find((item: any) => item.type === "text");
                    if (firstText) {
                        firstText.text = hindiInstruction + firstText.text;
                    }
                }
            }

            // ── Podcast mode: auto-pause & inject note context ──
            if (isNoteTTSPlaying && notePodcastText) {
                pausePodcastForAsk();
                const noteCtx = `[Podcast Context — the user was listening to the following note via podcast:\n\n${notePodcastText.slice(0, 4000)}\n\n]\n\n`;
                if (typeof userContent === "string") {
                    userContent = noteCtx + userContent;
                } else if (Array.isArray(userContent)) {
                    const firstText = userContent.find((item: any) => item.type === "text");
                    if (firstText) {
                        firstText.text = noteCtx + firstText.text;
                    }
                }
                toast.info("Podcast paused — ask your question.");
            }

            const userMessage: Message = {
                role: "user",
                content: displayContent,
                timestamp: formatTimestamp()
            };

            const conversationHistory = isImageGenMode
                ? [{ role: "user" as const, content: userContent }]
                : [
                    ...(selectedPersona
                        ? [{ role: "system" as const, content: selectedPersona.systemPrompt }]
                        : []),
                    ...(overrideHistory || messages)
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

            // ── Streaming for text chat, non-streaming for image gen / file uploads ──
            const useStreaming = !isImageGenMode && !selectedFile && requestModality === "text";

            if (useStreaming) {
                // --- SSE streaming path ---
                setMessages((prev) => [...(overrideHistory || prev).filter((m) => !m.localOnly), userMessage]);
                setInput("");
                setSelectedFile(null);

                const ctrl = new AbortController();
                abortControllerRef.current = ctrl;

                let aiContent = "";
                let hasReceivedFirstChunk = false;
                try {
                    aiContent = await sendAiRequestStream(
                        {
                            endpoint: requestEndpoint,
                            messages: conversationHistory,
                            modality: requestModality,
                            signal: ctrl.signal,
                        },
                        (chunk) => {
                            if (!hasReceivedFirstChunk) {
                                hasReceivedFirstChunk = true;
                                setShowDots(false);
                                setMessages((prev) => [...prev, {
                                    role: "assistant" as const,
                                    content: chunk,
                                    timestamp: formatTimestamp()
                                }]);
                            } else {
                                setMessages((prev) => {
                                    const updated = [...prev];
                                    const last = updated[updated.length - 1];
                                    if (last && last.role === "assistant") {
                                        updated[updated.length - 1] = { ...last, content: chunk };
                                    }
                                    return updated;
                                });
                            }
                        }
                    );
                } catch (err: any) {
                    if (err.name === "AbortError") {
                        // Stream was cancelled — keep whatever was received so far
                        if (hasReceivedFirstChunk) {
                            const currentContent = await new Promise<string>((resolve) => {
                                setMessages((prev) => {
                                    const last = prev[prev.length - 1];
                                    resolve(last?.role === "assistant" ? last.content : "");
                                    return prev;
                                });
                            });
                            aiContent = currentContent;
                        }
                    } else {
                        throw err;
                    }
                } finally {
                    abortControllerRef.current = null;
                }

                setIsLoading(false);

                // ── Enhance response disabled to prevent duplicate request ──


                if (currentChatId && aiContent) {
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
                        // Best effort
                    }
                }

                // Auto-generate title from first message if still "New Chat"
                if (currentChatId) {
                    const chat = chats.find(c => c.id === currentChatId);
                    if (chat && chat.title === "New Chat") {
                        const newTitle = buildChatTitle(displayContent);
                        if (newTitle !== "New Chat") {
                            try {
                                await updateChat(currentChatId, newTitle);
                                setChats((prev) =>
                                    prev.map((c) =>
                                        c.id === currentChatId ? { ...c, title: newTitle } : c
                                    )
                                );
                            } catch { /* best effort */ }
                        }
                    }
                }

                setResponseTime((Date.now() - requestStart) / 1000);

            } else {
                // --- Non-streaming path (image gen, file uploads, OCR) ---
                setMessages((prev) => [...(overrideHistory || prev).filter((message) => !message.localOnly), userMessage]);
                setInput("");
                setSelectedFile(null);

                if (isImageGenMode) {
                    setImageGenStatus("generating");
                    localStorage.setItem("image_gen_status", "generating");
                    localStorage.setItem("image_gen_timestamp", String(Date.now()));
                }

                const data = await sendAiRequest({
                    endpoint: requestEndpoint,
                    messages: conversationHistory,
                    chat_id: undefined,
                    modality: requestModality
                });

                console.log("AI Response:", data);
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

                setMessages((prev) => {
                    const newMessages = [...prev];
                    const lastMsg = newMessages[newMessages.length - 1];
                    if (lastMsg && lastMsg.role === "assistant") {
                        lastMsg.content = aiContent;
                    }
                    return newMessages;
                });

                setIsLoading(false);

                // ── Enhance response disabled to prevent duplicate request ──

                if (isImageGenMode) {
                    saveImageToHistory(userMessage, { role: "assistant", content: aiContent, timestamp: formatTimestamp() });
                    setImageGenStatus("completed");
                    localStorage.setItem("image_gen_status", "completed");
                    localStorage.setItem("image_gen_timestamp", String(Date.now()));
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

                // Auto-generate title from first message if still "New Chat"
                if (currentChatId) {
                    const chat = chats.find(c => c.id === currentChatId);
                    if (chat && chat.title === "New Chat") {
                        const newTitle = buildChatTitle(displayContent);
                        if (newTitle !== "New Chat") {
                            try {
                                await updateChat(currentChatId, newTitle);
                                setChats((prev) =>
                                    prev.map((c) =>
                                        c.id === currentChatId ? { ...c, title: newTitle } : c
                                    )
                                );
                            } catch { /* best effort */ }
                        }
                    }
                }

                setResponseTime((Date.now() - requestStart) / 1000);
            } // end non-streaming block
        } catch (error) {
            setShowDots(false);
            const message = error instanceof Error ? error.message : "Unable to process your request.";
            setChatError(message);
            toast.error(message);

            if (isImageGenMode) {
                setImageGenStatus("idle");
                localStorage.setItem("image_gen_status", "idle");
                localStorage.setItem("image_gen_timestamp", String(Date.now()));
            }

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
        // Abort the in-flight SSE stream if one is active
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
        stopGenerationRef.current = true;
        setIsLoading(false);
        setShowDots(false);
    };

    if (authed === null) {
        return null;
    }

    if (!authed) {
        window.location.href = "/";
        return null;
    }

    const isChatEmpty = messages.length === 0 || messages.every((msg) => msg.localOnly);

    const renderInputContainer = (isCenteredEmptyState: boolean) => {
        const inputId = isCenteredEmptyState ? "chat-file-input-empty" : "chat-file-input-active";
        return (
            <div
                id="walkthrough-input-area"
                className={`w-full ${isCenteredEmptyState ? "max-w-2xl mx-auto mt-4" : "max-w-4xl"} rounded-3xl p-4 transition-all duration-300 ${isDarkMode
                        ? "bg-[#222120] border border-white/5 shadow-2xl"
                        : "bg-[#f2f1f0] border border-black/5 shadow-2xl"
                    } ${mcqSession ? "opacity-40 pointer-events-none" : ""}`}
            >
                {/* File Preview inside the container */}
                {selectedFile && (
                    <div className={`mb-3 p-2 rounded-xl flex items-center gap-3 w-fit ${isDarkMode ? "bg-white/5 text-white/90" : "bg-black/5 text-black/90"}`}>
                        <div className="h-8 w-8 flex-shrink-0 flex items-center justify-center bg-white/10 rounded-lg overflow-hidden">
                            {selectedFile.previewUrl ? (
                                <img src={selectedFile.previewUrl} alt="Preview" className="h-full w-full object-cover rounded-lg" />
                            ) : (
                                <FileIcon className="h-4 w-4 opacity-70" />
                            )}
                        </div>
                        <div className="flex flex-col text-left">
                            <span className="text-[10px] font-sans font-semibold truncate max-w-[150px]">{selectedFile.name}</span>
                            <span className="text-[8px] font-mono opacity-50 uppercase">{(selectedFile.size / 1024).toFixed(1)} KB</span>
                        </div>
                        <button
                            onClick={() => setSelectedFile(null)}
                            className="p-1 hover:bg-white/10 rounded-full transition-all"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    </div>
                )}

                <div className="flex items-start gap-2">
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
                        placeholder={isProcessingFile ? t("processing_file") : typedPlaceholder}
                        rows={isCenteredEmptyState ? 2 : 1}
                        className={`flex-1 min-w-0 bg-transparent resize-none no-scrollbar ${isDarkMode ? "text-white placeholder:text-white/30" : "text-black placeholder:text-black/50"
                            } py-1.5 text-base focus:outline-none`}
                        style={{ maxHeight: '30vh' }}
                    />
                </div>

                {/* ─── Mail Quick Actions Row (Enterprise + Gmail) ─── */}
                {gmailConnected && showEmployeeView && isEnterpriseModeActive && (
                    <div className={`mt-2 pt-2 border-t border-dashed flex items-center gap-1.5 flex-wrap ${isDarkMode ? "border-white/10" : "border-black/10"}`}>
                        <span className={`text-[8px] font-mono uppercase tracking-[0.2em] mr-1 ${isDarkMode ? "text-white/40" : "text-black/50"}`}>Mail</span>

                        {/* Auto Reply */}
                        <motion.button
                            onClick={() => {
                                const next = !gmailAutoOn;
                                setGmailAutoOn(next);
                                if (next) setGmailAutoShowModal(true);
                            }}
                            whileHover={isLoading || isProcessingFile ? undefined : { scale: 1.05 }}
                            whileTap={isLoading || isProcessingFile ? undefined : { scale: 0.95 }}
                            disabled={isLoading || isProcessingFile}
                            className={`flex items-center gap-1 px-2.5 py-1 text-[9px] font-mono uppercase tracking-[0.15em] rounded-md border transition-all ${gmailAutoOn
                                ? (isDarkMode ? "bg-accent/20 border-accent text-accent" : "bg-accent/15 border-accent text-accent")
                                : (isDarkMode ? "border-white/15 bg-white/5 text-white/80 hover:border-white/30 hover:text-white" : "border-black/15 bg-black/5 text-black/80 hover:border-black/30 hover:text-black")
                                } ${isLoading || isProcessingFile ? "opacity-50 pointer-events-none" : ""}`}
                            title="Auto Reply"
                        >
                            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
                                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                            </svg>
                            {gmailAutoOn ? "Auto ON" : "Auto Reply"}
                        </motion.button>

                        {/* Bulk Auto */}
                        <motion.button
                            onClick={() => setGmailBulkModal(true)}
                            whileHover={isLoading || isProcessingFile ? undefined : { scale: 1.05 }}
                            whileTap={isLoading || isProcessingFile ? undefined : { scale: 0.95 }}
                            disabled={isLoading || isProcessingFile || gmailSending}
                            className={`flex items-center gap-1 px-2.5 py-1 text-[9px] font-mono uppercase tracking-[0.15em] rounded-md border transition-all ${isDarkMode ? "border-white/15 bg-white/5 text-white/80 hover:border-white/30 hover:text-white" : "border-black/15 bg-black/5 text-black/80 hover:border-black/30 hover:text-black"} ${isLoading || isProcessingFile ? "opacity-50 pointer-events-none" : ""}`}
                            title="Bulk Auto Reply"
                        >
                            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                                <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                            </svg>
                            Bulk Auto
                        </motion.button>

                        {/* Send Mail */}
                        <motion.button
                            onClick={() => {
                                if (!gmailMailTo.trim() || !input.trim()) {
                                    setGmailSendResult("Add recipient(s) in the right panel first");
                                    setTimeout(() => setGmailSendResult(""), 2500);
                                    return;
                                }
                                setGmailConfirmSend(true);
                            }}
                            whileHover={isLoading || isProcessingFile ? undefined : { scale: 1.05 }}
                            whileTap={isLoading || isProcessingFile ? undefined : { scale: 0.95 }}
                            disabled={isLoading || isProcessingFile || gmailSending}
                            className={`flex items-center gap-1 px-2.5 py-1 text-[9px] font-mono uppercase tracking-[0.15em] rounded-md border transition-all ${isDarkMode ? "border-[#EA4335]/40 bg-[#EA4335]/10 text-[#EA4335] hover:border-[#EA4335]/60 hover:bg-[#EA4335]/15" : "border-[#EA4335]/50 bg-[#EA4335]/10 text-[#EA4335] hover:border-[#EA4335]/70 hover:bg-[#EA4335]/15"} ${isLoading || isProcessingFile ? "opacity-50 pointer-events-none" : ""}`}
                            title="Send Mail"
                        >
                            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M22 2L11 13" /><path d="M22 2L15 22l-4-9-9-4z" />
                            </svg>
                            Send Mail
                        </motion.button>

                        {/* Rewrite Mail */}
                        <motion.button
                            onClick={async () => {
                                const trimmedInput = input.trim();
                                if (!trimmedInput) {
                                    setGmailSendResult("Type something to rewrite");
                                    setTimeout(() => setGmailSendResult(""), 2500);
                                    return;
                                }
                                setGmailRewriteModal(true);
                                setGmailRewriting(true);
                                setGmailRewrittenBody("");
                                try {
                                    const { sendChatCompletion } = await import("@/lib/chat-api");
                                    const res = await sendChatCompletion({
                                        messages: [
                                            { role: "system", content: "You are an email writing assistant. Rewrite the following rough text into a polished, professional email. Fix grammar, improve clarity, structure the content well, and return ONLY the rewritten email body — no explanations, no greetings, no extra commentary." },
                                            { role: "user", content: trimmedInput }
                                        ]
                                    });
                                    const rewritten = (res as any)?.response || res.data?.[0]?.message?.content || trimmedInput;
                                    setGmailRewrittenBody(rewritten);
                                } catch {
                                    setGmailRewrittenBody(trimmedInput);
                                }
                                setGmailRewriting(false);
                            }}
                            whileHover={isLoading || isProcessingFile ? undefined : { scale: 1.05 }}
                            whileTap={isLoading || isProcessingFile ? undefined : { scale: 0.95 }}
                            disabled={isLoading || isProcessingFile || gmailRewriting}
                            className={`flex items-center gap-1 px-2.5 py-1 text-[9px] font-mono uppercase tracking-[0.15em] rounded-md border transition-all ${isDarkMode ? "border-[#4285F4]/40 bg-[#4285F4]/10 text-[#4285F4] hover:border-[#4285F4]/60 hover:bg-[#4285F4]/15" : "border-[#4285F4]/50 bg-[#4285F4]/10 text-[#4285F4] hover:border-[#4285F4]/70 hover:bg-[#4285F4]/15"} ${isLoading || isProcessingFile ? "opacity-50 pointer-events-none" : ""}`}
                            title="Rewrite Mail with AI"
                        >
                            {gmailRewriting ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                                <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 20h9" />
                                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                                </svg>
                            )}
                            {gmailRewriting ? "Rewriting..." : "Rewrite Mail"}
                        </motion.button>

                        {/* To: field for quick recipient entry */}
                        <div className="flex items-center gap-1.5 ml-auto min-w-0">
                            <span className={`text-[8px] font-mono uppercase tracking-widest shrink-0 ${isDarkMode ? "text-white/40" : "text-black/50"}`}>To:</span>
                            <input
                                type="text"
                                placeholder="email@example.com"
                                value={gmailMailTo}
                                onChange={(e) => setGmailMailTo(e.target.value)}
                                className={`w-32 md:w-44 px-2 py-1 text-[9px] font-mono rounded border outline-none transition-all ${isDarkMode
                                    ? "bg-white/[0.05] border-white/15 text-white placeholder-white/30 focus:border-[#4285F4]/50"
                                    : "bg-black/[0.04] border-black/25 text-black placeholder-black/40 focus:border-[#4285F4]/70"
                                    }`}
                            />
                            {gmailMailTo && (
                                <button
                                    onClick={() => setGmailMailTo("")}
                                    className={`p-1 rounded ${isDarkMode ? "hover:bg-white/10 text-white/40" : "hover:bg-black/10 text-black/50"}`}
                                    title="Clear"
                                >
                                    <svg className="h-2.5 w-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                                                    </svg>
                                                </button>
                                            )}
                        </div>
                    </div>
                )}

                <div className={`flex items-center justify-between mt-3 pt-2 border-t ${isDarkMode ? "border-white/5" : "border-black/5"}`}>
                    {/* Bottom Left: Add files button + minimal quick toggles */}
                    <div className="flex items-center gap-2">
                        {/* Add Files Button */}
                        <motion.label
                            htmlFor={inputId}
                            id="walkthrough-add-files"
                            whileHover={isLoading || isProcessingFile ? undefined : { scale: 1.05 }}
                            whileTap={isLoading || isProcessingFile ? undefined : { scale: 0.95 }}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[10px] font-sans font-medium transition-all duration-200 cursor-pointer ${isDarkMode
                                    ? "border-white/10 bg-white/5 text-white/80 hover:bg-white/10 hover:text-white"
                                    : "border-black/10 bg-black/5 text-black/80 hover:bg-black/10 hover:text-black"
                                } ${isLoading || isProcessingFile ? "opacity-50 pointer-events-none" : ""}`}
                            title={t("add_files")}
                        >
                            {isProcessingFile ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                                <Paperclip className="h-3.5 w-3.5" />
                            )}
                            <span>{t("add_files")}</span>
                        </motion.label>
                        <input
                            type="file"
                            id={inputId}
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            className="hidden"
                            accept="image/*,application/pdf,text/plain,.md"
                            disabled={isLoading || isProcessingFile}
                        />
                        <div className={`h-4 w-px ${isDarkMode ? "bg-white/10" : "bg-black/10"} mx-1`} />

                        {/* Quick Engine Mode Switcher */}
                        <div className="flex items-center gap-1" id="walkthrough-input-modes">
                            {visibleEngines.map((engine) => {
                                const featureId = getFeatureIdForEngine(engine.name);
                                const isAvailable = planFeatures.length === 0 || planFeatures.includes(featureId);
                                const Icon = engine.icon as any;
                                return (
                                    <motion.button
                                        key={engine.name}
                                        id={`walkthrough-engine-${engine.name.toLowerCase().replace(/\s+/g, '-')}`}
                                        onClick={() => {
                                            if (!isAvailable) {
                                                window.location.href = "/pricing";
                                                return;
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
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        className={`p-1.5 rounded-lg transition-all duration-200 cursor-pointer ${selectedEngine === engine.name
                                                ? (isDarkMode ? "bg-white/15 text-white shadow-sm" : "bg-black/15 text-black shadow-sm")
                                                : (isDarkMode ? "text-white/40 hover:text-white hover:bg-white/5" : "text-black/40 hover:text-black hover:bg-black/5")
                                            }`}
                                        title={engine.name}
                                    >
                                        <Icon className="h-3.5 w-3.5" />
                                    </motion.button>
                                );
                            })}
                        </div>


                    </div>

                    {/* Bottom Right: Maximize layout button + circular send button */}
                    <div className="flex items-center gap-2">
                        {/* Maximize Layout Button */}
                        {false && (
                            <motion.button
                                onClick={() => setIsRightSidebarCollapsed(!isRightSidebarCollapsed)}
                                id="walkthrough-maximize-layout"
                                whileHover={{ scale: 1.15 }}
                                whileTap={{ scale: 0.85 }}
                                className={`p-1.5 rounded-lg transition-all duration-200 cursor-pointer ${!isRightSidebarCollapsed
                                        ? (isDarkMode ? "bg-white/10 text-white" : "bg-black/10 text-black")
                                        : (isDarkMode ? "text-white/40 hover:text-white hover:bg-white/5" : "text-black/40 hover:text-black hover:bg-black/5")
                                    }`}
                                title="Toggle Right Panel Layout"
                            >
                                <Maximize2 className="h-3.5 w-3.5" />
                            </motion.button>
                        )}

                        {/* Mic Button */}
                        <motion.button
                            onClick={isRecording ? stopRecording : startRecording}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className={`h-8 w-8 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg ${isRecording
                                    ? "bg-red-500 text-white animate-pulse"
                                    : (isDarkMode ? "bg-white/10 text-white/60 hover:bg-white/20 hover:text-white" : "bg-black/10 text-black/60 hover:bg-black/20 hover:text-black")
                                }`}
                            title={isRecording ? "Stop recording" : "Start recording"}
                            disabled={isLoading || isProcessingFile}
                        >
                            {isRecording ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
                        </motion.button>

                        {/* Send / Stop Generation Button */}
                        {isLoading ? (
                            <motion.button
                                onClick={handleStopGeneration}
                                whileHover={{ scale: 1.1, rotate: 90 }}
                                whileTap={{ scale: 0.9 }}
                                className="h-8 w-8 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-all duration-200 shadow-lg"
                                title={t("stop_generation")}
                            >
                                <Pause className="h-3 w-3 fill-white stroke-none" />
                            </motion.button>
                        ) : (
                            <motion.button
                                onClick={() => void handleSend()}
                                disabled={isHistoryLoading || isProcessingFile || !input.trim()}
                                whileHover={input.trim() ? { scale: 1.1, x: [0, -3, 6, 0] } : {}}
                                whileTap={input.trim() ? { scale: 0.9, x: 12 } : {}}
                                transition={{
                                    x: {
                                        times: [0, 0.2, 0.7, 1],
                                        duration: 0.45,
                                        ease: "easeInOut"
                                    }
                                }}
                                className={`h-8 w-8 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg ${input.trim()
                                        ? (accent
                                            ? "hover:opacity-90"
                                            : (isDarkMode ? "bg-white text-black hover:bg-white/95" : "bg-black text-white hover:bg-black/95"))
                                        : (isDarkMode ? "bg-white/10 text-white/30 cursor-not-allowed" : "bg-black/10 text-black/30 cursor-not-allowed")
                                    }`}
                                style={
                                    input.trim() && accent
                                        ? {
                                            backgroundColor: accent,
                                            color: getContrastColor(accent),
                                        }
                                        : undefined
                                }
                                title={t("send_message")}
                            >
                                <ArrowUp className="h-4 w-4 stroke-[2.5]" />
                            </motion.button>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className={`${chatHeadingFont.variable} ${chatBodyFont.variable} ${chatAccentFont.variable} chat-shell h-screen w-full ${isDarkMode ? "bg-[#0d0d0c] text-white" : "bg-[#f4f3f2] text-black"} selection:bg-white selection:text-black flex overflow-hidden transition-colors duration-500 ${isDarkMode ? "custom-scrollbar" : "light-scrollbar"}`}>
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
                @keyframes rainbow-glow {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
                .rainbow-glow-border {
                    background: linear-gradient(90deg, #4285f4, #ea4335, #fbbc05, #34a853, #4285f4);
                    background-size: 300% 300%;
                    animation: rainbow-glow 6s ease infinite;
                }
                @keyframes pulse-shine {
                    0%, 100% { transform: scale(1); opacity: 0.8; }
                    50% { transform: scale(1.15); opacity: 1; filter: drop-shadow(0 0 8px rgba(59, 130, 246, 0.6)); }
                }
                .shine-star {
                    animation: pulse-shine 3s infinite ease-in-out;
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
            {false && isMobile && !isRightSidebarCollapsed && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 transition-opacity duration-300"
                    onClick={() => setIsRightSidebarCollapsed(true)}
                />
            )}

            <aside
                id="walkthrough-sidebar"
                style={{ width: isSidebarCollapsed ? (isMobile ? "0px" : "72px") : (isMobile ? "280px" : `${sidebarWidth}px`) }}
                className={`h-full border-r ${isSidebarCollapsed && isMobile ? "border-r-0" : isDarkMode ? "border-white/10" : "border-black/10"} ${isDarkMode ? "bg-[#0d0d0c]" : "bg-[#f4f3f2]"} flex flex-col ${isMobile ? "fixed left-0 top-0 bottom-0 h-[100dvh] z-[60] shadow-2xl" : "relative z-20"} transition-[width] duration-300 ease-in-out ${isResizingLeft ? "transition-none" : ""}`}
            >
                {isSidebarCollapsed && !isMobile ? (
                    <div className="flex flex-col h-full items-center py-4 justify-between relative select-none">
                        {/* Top Group */}
                        <div className="flex flex-col items-center gap-6 w-full">
                            {/* Toggle Button */}
                            <motion.button
                                onClick={() => setIsSidebarCollapsed(false)}
                                whileHover={{ scale: 1.15, x: 2 }}
                                whileTap={{ scale: 0.85 }}
                                className={`p-2 rounded-lg transition-colors cursor-pointer ${isDarkMode
                                        ? "text-white/60 hover:text-white hover:bg-white/5"
                                        : "text-black/60 hover:text-black hover:bg-black/5"
                                    }`}
                                title={t("open_sidebar")}
                            >
                                <PanelLeftOpen className="w-5 h-5" />
                            </motion.button>

                            {/* New Chat Button */}
                            <motion.button
                                onClick={handleCreateChat}
                                disabled={isCreatingChat}
                                whileHover={{ scale: 1.15, rotate: 90 }}
                                whileTap={{ scale: 0.85 }}
                                className={`p-2 rounded-lg transition-colors cursor-pointer ${isDarkMode
                                        ? "text-white/60 hover:text-white hover:bg-white/5"
                                        : "text-black/60 hover:text-black hover:bg-black/5"
                                    }`}
                                title={t("new_chat")}
                            >
                                <MessageSquarePlus className="w-5 h-5" />
                            </motion.button>

                            {/* Notes icon (student) / Mail icon (employee) */}
                            {!isEnterpriseModeActive ? (
                                <motion.button
                                    onClick={() => { setIsSidebarCollapsed(false); setSidebarView("notes"); }}
                                    whileHover={{ scale: 1.15 }}
                                    whileTap={{ scale: 0.85 }}
                                    className={`p-2 rounded-lg transition-colors cursor-pointer ${isDarkMode
                                            ? "text-white/60 hover:text-white hover:bg-white/5"
                                            : "text-black/60 hover:text-black hover:bg-black/5"
                                        }`}
                                    title="Notes"
                                >
                                    <FileIcon className="w-5 h-5" />
                                </motion.button>
                            ) : (
                                <motion.button
                                    onClick={() => { setIsSidebarCollapsed(false); setSidebarView("mail"); }}
                                    whileHover={{ scale: 1.15 }}
                                    whileTap={{ scale: 0.85 }}
                                    className={`p-2 rounded-lg transition-colors cursor-pointer ${isDarkMode
                                            ? "text-white/60 hover:text-white hover:bg-white/5"
                                            : "text-black/60 hover:text-black hover:bg-black/5"
                                        }`}
                                    title="Mail"
                                >
                                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                                        <rect x="2" y="4" width="20" height="16" rx="2" fill="currentColor" />
                                        <path d="M22 6l-10 7L2 6" fill="none" stroke={isDarkMode ? "#0d0d0c" : "#f4f3f2"} strokeWidth="2" strokeLinecap="round" />
                                    </svg>
                                </motion.button>
                            )}

                            {!isEnterpriseModeActive && (
                                <motion.div
                                    whileHover={{ scale: 1.15 }}
                                    whileTap={{ scale: 0.85 }}
                                >
                                    <Link
                                        href="/battle-arena"
                                        className={`p-2 rounded-lg transition-colors cursor-pointer ${isDarkMode
                                                ? "text-white/60 hover:text-white hover:bg-white/5"
                                                : "text-black/60 hover:text-black hover:bg-black/5"
                                            }`}
                                        title={t("leaderboard")}
                                    >
                                        <ListOrdered className="w-5 h-5" />
                                    </Link>
                                </motion.div>
                            )}
                        </div>

                        {/* Bottom Group */}
                        <div className="flex flex-col items-center w-full relative">
                            {/* Top divider */}
                            <div className={`w-full border-t ${isDarkMode ? "border-white/10" : "border-black/10"} mb-4`} />

                            {/* Profile / Avatar Button */}
                            <div className="mb-4 relative">
                                <motion.button
                                    onClick={() => setShowProfileDropup(!showProfileDropup)}
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    className={`h-8 w-8 rounded-full overflow-hidden border border-transparent transition-all cursor-pointer relative shrink-0 flex items-center justify-center animate-fade-in ${selectedEngine === "AI Image Lab" ? "hover:border-black" : "hover:border-accent"}`}
                                    title={t("profile_options")}
                                >
                                    {profilePic ? (
                                        <img src={profilePic} alt="Profile" className="h-full w-full object-cover" />
                                    ) : (
                                        <div className={`h-full w-full flex items-center justify-center ${isDarkMode ? "bg-white/5 border-white/10" : "bg-black/5 border-black/10"} border rounded-full`}>
                                            <User className={`h-4 w-4 ${isDarkMode ? "text-white/80" : "text-black/80"}`} />
                                        </div>
                                    )}
                                </motion.button>

                                {showProfileDropup && (
                                    <div
                                        ref={profileDropupRef}
                                        className={`absolute bottom-0 left-[48px] w-56 z-[100] rounded-xl border p-1.5 shadow-2xl ${isDarkMode
                                                ? "bg-[#222120]/95 border-white/10 text-white"
                                                : "bg-[#f2f1f0]/95 border-black/10 text-black"
                                            }`}
                                    >
                                        {/* Personalization Option */}
                                        <button
                                            onClick={() => {
                                                setShowProfileDropup(false);
                                                setIsPersonalizationModalOpen(true);
                                            }}
                                            className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs rounded-lg text-left transition-colors ${isDarkMode ? "hover:bg-white/5 text-white/90 hover:text-white" : "hover:bg-black/5 text-black/90 hover:text-black"
                                                }`}
                                        >
                                            <User className="h-3.5 w-3.5 opacity-60" />
                                            <span>Profile</span>
                                        </button>

                                        {/* Wallet Option */}
                                    <button
                                        onClick={() => {
                                            setShowProfileDropup(false);
                                            setIsWalletModalOpen(true);
                                        }}
                                        className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs rounded-lg text-left transition-colors ${isDarkMode ? "hover:bg-white/5 text-white/90 hover:text-white" : "hover:bg-black/5 text-black/90 hover:text-black"
                                            }`}
                                    >
                                        <Wallet className="h-3.5 w-3.5 opacity-60" />
                                        <span>{t("wallet")}</span>
                                    </button>

                                        {/* Divider */}
                                        <div className={`my-1 h-px ${isDarkMode ? "bg-white/5" : "bg-black/5"}`} />

                                        {/* Logout Option */}
                                        <button
                                            onClick={() => {
                                                setShowProfileDropup(false);
                                                removeApiKey();
                                                removeUserInfo();
                                                removeUserRole();
                                                removeSchoolName();
                                                removeEnterpriseName();
                                                setStoredActiveChatId(null);
                                                setAuthed(false);
                                                setUserName("");
                                                setUserEmail("");
                                                window.location.href = "/";
                                            }}
                                            className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs rounded-lg text-left text-red-500 transition-colors ${isDarkMode ? "hover:bg-red-500/10" : "hover:bg-red-500/5"
                                                }`}
                                        >
                                            <LogOut className="h-3.5 w-3.5" />
                                            <span>{t("logout")}</span>
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Middle divider */}
                            <div className={`w-full border-t ${isDarkMode ? "border-white/10" : "border-black/10"} mb-4`} />

                            {/* Settings / Document Button */}
                            <button
                                onClick={() => {
                                    setSettingsPanel("persona");
                                    setIsSettingsModalOpen(true);
                                }}
                                className={`p-2 rounded-lg transition-colors cursor-pointer mb-2 ${isDarkMode
                                        ? "text-white/60 hover:text-white hover:bg-white/5"
                                        : "text-black/60 hover:text-black hover:bg-black/5"
                                    }`}
                                title={t("settings")}
                            >
                                <Settings className="w-6 h-6" />
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col h-full overflow-hidden">
                        {/* Header: Logo, Arena, Toggle */}
                        <div className={`flex items-center justify-between px-5 py-4 border-b ${isDarkMode ? "border-white/5" : "border-black/5"}`}>
                            <Link href="/" className="flex items-center gap-2 cursor-pointer select-none">
                                <img
                                    src={isDarkMode ? "/dark.png" : "/light.png"}
                                    alt="Logo"
                                    className={`${isDarkMode ? "w-6 h-6" : "w-[19px] h-[19px]"} object-contain`}
                                />
                                <img
                                    src={isDarkMode ? "/dark_text.png" : "/light_text.png"}
                                    alt="Rudra Nexus"
                                    className="h-4 object-contain"
                                />
                            </Link>
                            <motion.button
                                onClick={() => setIsSidebarCollapsed(true)}
                                whileHover={{ scale: 1.15, x: -2 }}
                                whileTap={{ scale: 0.85 }}
                                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${isDarkMode ? "text-white/60 hover:text-white hover:bg-white/5" : "text-black/60 hover:text-black hover:bg-black/5"}`}
                                title={t("collapse_sidebar")}
                            >
                                <PanelLeftClose className="w-4 h-4" />
                            </motion.button>
                        </div>

                        {/* Enterprise Mail/Chat Toggle */}
                        {isEnterpriseModeActive ? (
                            <div className={`px-4 pt-3 pb-1 flex items-center gap-1 border-b ${isDarkMode ? "border-white/5" : "border-black/5"}`}>
                                <button
                                    onClick={() => setSidebarView("chat")}
                                    className={`flex-1 py-2 text-[10px] font-mono uppercase tracking-[0.15em] rounded-lg transition-all ${sidebarView === "chat"
                                        ? (isDarkMode ? "bg-white/10 text-white font-bold" : "bg-black/10 text-black font-bold")
                                        : (isDarkMode ? "text-white/40 hover:text-white" : "text-black/40 hover:text-black")
                                    }`}
                                >
                                    <MessageSquare className="h-3.5 w-3.5 inline mr-1.5" />
                                    Chat
                                </button>
                                <button
                                    onClick={() => setSidebarView("mail")}
                                    className={`flex-1 py-2 text-[10px] font-mono uppercase tracking-[0.15em] rounded-lg transition-all ${sidebarView === "mail"
                                        ? (isDarkMode ? "bg-white/10 text-white font-bold" : "bg-black/10 text-black font-bold")
                                        : (isDarkMode ? "text-white/40 hover:text-white" : "text-black/40 hover:text-black")
                                    }`}
                                >
                                    <svg className="h-3.5 w-3.5 inline mr-1.5" viewBox="0 0 24 24" fill="none">
                                        <rect x="2" y="4" width="20" height="16" rx="2" fill="currentColor" />
                                        <path d="M22 6l-10 7L2 6" fill="none" stroke={isDarkMode ? "#0d0d0c" : "#f4f3f2"} strokeWidth="2" strokeLinecap="round" />
                                    </svg>
                                    Mail
                                </button>
                            </div>
                        ) : (
                            <div className={`px-4 pt-3 pb-1 flex items-center gap-1 border-b ${isDarkMode ? "border-white/5" : "border-black/5"}`}>
                                <button
                                    onClick={() => setSidebarView("chat")}
                                    className={`flex-1 py-2 text-[10px] font-mono uppercase tracking-[0.15em] rounded-lg transition-all ${sidebarView === "chat" || sidebarView === "mail"
                                        ? (isDarkMode ? "bg-white/10 text-white font-bold" : "bg-black/10 text-black font-bold")
                                        : (isDarkMode ? "text-white/40 hover:text-white" : "text-black/40 hover:text-black")
                                    }`}
                                >
                                    <MessageSquare className="h-3.5 w-3.5 inline mr-1.5" />
                                    Chats
                                </button>
                                <button
                                    onClick={() => setSidebarView("notes")}
                                    className={`flex-1 py-2 text-[10px] font-mono uppercase tracking-[0.15em] rounded-lg transition-all ${sidebarView === "notes"
                                        ? (isDarkMode ? "bg-white/10 text-white font-bold" : "bg-black/10 text-black font-bold")
                                        : (isDarkMode ? "text-white/40 hover:text-white" : "text-black/40 hover:text-black")
                                    }`}
                                >
                                    <FileIcon className="h-3.5 w-3.5 inline mr-1.5" />
                                    Notes
                                </button>
                            </div>
                        )}

                        {/* Chat View */}
                        {sidebarView === "chat" && (
                        <>
                        <div className="px-4 pt-4 pb-2 space-y-2">
                            {/* New Chat Button */}
                            <motion.button
                                onClick={handleCreateChat}
                                disabled={isCreatingChat}
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                                className={`w-full flex items-center justify-center gap-2 py-2 px-3 text-xs border rounded-xl font-sans font-medium transition-all duration-200 ${isDarkMode
                                        ? "border-white/10 bg-white/5 text-white hover:bg-white/10 hover:border-white/20"
                                        : "border-black/10 bg-black/5 text-black hover:bg-black/10 hover:border-black/20"
                                    }`}
                            >
                                <Plus className="w-4 h-4" />
                                <span>{t("new_chat")}</span>
                            </motion.button>

                            {!isEnterpriseModeActive && (
                                <motion.div
                                    whileHover={{ scale: 1.03 }}
                                    whileTap={{ scale: 0.97 }}
                                >
                                    <Link
                                        href="/battle-arena"
                                        className={`w-full flex items-center justify-center gap-2 py-2 px-3 text-xs border rounded-xl font-sans font-medium transition-all duration-200 ${isDarkMode
                                                ? "border-white/10 bg-white/5 text-white hover:bg-white/10 hover:border-white/20"
                                                : "border-black/10 bg-black/5 text-black hover:bg-black/10 hover:border-black/20"
                                            }`}
                                    >
                                        <Swords className="h-4 w-4" />
                                        <span>{t("leaderboard")}</span>
                                    </Link>
                                </motion.div>
                            )}

                            {/* Clean Search Input */}
                            <div className="relative group">
                                <Search className={`absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 ${isDarkMode ? "text-white/30" : "text-black/70"}`} />
                                <input
                                    type="text"
                                    placeholder={t("search_chats")}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className={`w-full bg-transparent border rounded-xl py-1.5 pl-9 pr-3 text-xs font-sans focus:outline-none transition-all ${isDarkMode
                                            ? "border-white/10 text-white placeholder:text-white/30 focus:border-white/25 focus:bg-white/5"
                                            : "border-black/20 text-black placeholder:text-black/60 focus:border-black/40 focus:bg-black/5"
                                        }`}
                                />
                            </div>
                        </div>

                        {/* Recent History Section */}
                        <div className={`flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-4 ${isDarkMode ? "custom-scrollbar text-zinc-300" : "light-scrollbar text-black"}`}>
                            <div className="space-y-1">
                                <div className={`px-2 text-[9px] font-bold font-mono uppercase tracking-[0.2em] ${isDarkMode ? "text-white/30" : "text-black/30"}`}>{t("today")}</div>
                                {isSessionsLoading && (
                                    <div className={`px-2 py-3 text-xs opacity-50`}>
                                        {t("loading_sessions")}
                                    </div>
                                )}
                                {!isSessionsLoading && filteredChats.length === 0 && (
                                    <div className={`px-2 py-3 text-xs opacity-50`}>
                                        {searchQuery ? t("no_matching_sessions") : t("no_chats_yet")}
                                    </div>
                                )}
                                {!isSessionsLoading && filteredChats.map((chat) => (
                                    <div
                                        key={chat.id}
                                        className={`group flex items-center justify-between rounded-lg px-2 py-1.5 transition-all text-xs ${activeChatId === chat.id
                                                ? (isDarkMode ? "bg-white/5 text-white" : "bg-black/5 text-black font-semibold")
                                                : (isDarkMode ? "text-white/60 hover:text-white hover:bg-white/5" : "text-black/60 hover:text-black hover:bg-black/5")
                                            }`}
                                    >
                                        {editingChatId === chat.id ? (
                                            <div className="flex-1 flex items-center gap-1">
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
                                                    className="w-full bg-transparent border-none p-0 text-xs focus:ring-0 focus:outline-none"
                                                    autoFocus
                                                />
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => void openChat(chat.id)}
                                                onDoubleClick={() => handleStartEditing(chat)}
                                                className="flex-1 text-left truncate flex items-center gap-2.5 min-w-0"
                                            >
                                                <MessageSquare className="h-3.5 w-3.5 opacity-55 flex-shrink-0" />
                                                <span className="truncate">{chat.title}</span>
                                            </button>
                                        )}
                                        {editingChatId !== chat.id && (
                                            <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                                                <button
                                                    onClick={() => handleStartEditing(chat)}
                                                    className="p-1 hover:bg-white/10 rounded transition-colors text-inherit"
                                                    title={t("rename")}
                                                >
                                                    <Edit3 className="h-3 w-3" />
                                                </button>
                                                <button
                                                    onClick={() => void handleDeleteChat(chat.id)}
                                                    className="p-1 hover:bg-red-500/20 hover:text-red-500 rounded transition-colors text-inherit"
                                                    title={t("delete")}
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Agent Promotion Card */}
                        {showPromo && !isEnterpriseModeActive && (
                            <div className="p-3 mx-3 mb-2 rounded-xl bg-gradient-to-b from-zinc-900 to-black border border-white/5 relative overflow-hidden flex flex-col gap-2">
                                <div className="flex items-start justify-between">
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-[10px] font-bold text-white uppercase tracking-wider">{t("battle_arena")}</span>
                                            <span className="bg-[#4285f4] text-white text-[8px] font-bold px-1 rounded">{t("new_badge")}</span>
                                        </div>
                                        <h5 className="text-[11px] font-bold text-white/95">{t("get_more_done")}</h5>
                                        <p className="text-[10px] text-zinc-400 leading-normal">{t("arena_desc")}</p>
                                    </div>
                                </div>
                                <div className="flex gap-2 mt-1 z-10">
                                    <button
                                        onClick={() => setIsBattleArenaModalOpen(true)}
                                        className="flex-1 py-1.5 px-2 bg-white text-black font-semibold text-[10px] rounded-lg text-center hover:bg-gray-200 transition-colors cursor-pointer"
                                    >
                                        {t("try_now")}
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowPromo(false);
                                            window.localStorage.setItem("arena_show_promo", "false");
                                        }}
                                        className="py-1.5 px-2 bg-zinc-900 border border-zinc-800 text-white font-medium text-[10px] rounded-lg text-center hover:bg-zinc-800 transition-colors cursor-pointer"
                                    >
                                        {t("hide")}
                                    </button>
                                </div>
                                <div className="absolute right-[-10px] bottom-[-10px] w-16 h-16 opacity-10 pointer-events-none">
                                    <Swords className="w-full h-full text-white" />
                                </div>
                            </div>
                        )}
                        </>)}

                        {/* Notes View */}
                        {sidebarView === "notes" && !isEnterpriseModeActive && (
                            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                                <div className="px-4 pt-4 pb-2 space-y-2 shrink-0">
                                    {/* New Note Button */}
                                    <motion.button
                                        onClick={handleCreateNote}
                                        whileHover={{ scale: 1.03 }}
                                        whileTap={{ scale: 0.97 }}
                                        className={`w-full flex items-center justify-center gap-2 py-2 px-3 text-xs border rounded-xl font-sans font-medium transition-all duration-200 ${isDarkMode
                                                ? "border-white/10 bg-white/5 text-white hover:bg-white/10 hover:border-white/20"
                                                : "border-black/10 bg-black/5 text-black hover:bg-black/10 hover:border-black/20"
                                            }`}
                                    >
                                        <Plus className="w-4 h-4" />
                                        <span>New Note</span>
                                    </motion.button>

                                    {/* Search Notes Bar */}
                                    <div className="relative flex items-center">
                                        <Search className={`absolute left-3 h-3.5 w-3.5 ${isDarkMode ? "text-white/30" : "text-black/50"}`} />
                                        <input
                                            type="text"
                                            value={searchNoteQuery}
                                            onChange={(e) => setSearchNoteQuery(e.target.value)}
                                            placeholder="Search notes..."
                                            className={`w-full pl-9 pr-4 py-2 text-[11px] font-sans rounded-xl border outline-none transition-all ${isDarkMode
                                                    ? "bg-white/5 border-white/10 text-white placeholder-white/30 focus:border-white/20 focus:bg-white/10"
                                                    : "bg-black/5 border-black/10 text-black placeholder-black/40 focus:border-black/20 focus:bg-black/10"
                                                }`}
                                        />
                                        {searchNoteQuery && (
                                            <button
                                                onClick={() => setSearchNoteQuery("")}
                                                className={`absolute right-3 p-0.5 rounded-full hover:bg-white/10 ${isDarkMode ? "text-white/50 hover:text-white" : "text-black/60 hover:text-black"}`}
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Notes List */}
                                <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2 min-h-0">
                                    {loadingNotes && notes.length === 0 ? (
                                        <div className="flex items-center justify-center py-8">
                                            <Loader2 className={`w-5 h-5 animate-spin ${isDarkMode ? "text-white/40" : "text-black/40"}`} />
                                        </div>
                                    ) : notes.filter(n => n.title.toLowerCase().includes(searchNoteQuery.toLowerCase()) || n.content.toLowerCase().includes(searchNoteQuery.toLowerCase())).length === 0 ? (
                                        <div className={`text-center py-8 text-xs font-sans ${isDarkMode ? "text-white/40" : "text-black/40"}`}>
                                            No notes found.
                                        </div>
                                    ) : (
                                        notes
                                            .filter(n => n.title.toLowerCase().includes(searchNoteQuery.toLowerCase()) || n.content.toLowerCase().includes(searchNoteQuery.toLowerCase()))
                                            .map((note) => (
                                                <div
                                                    key={note.id}
                                                    onClick={() => {
                                                        if (editingNoteTitleId !== note.id) {
                                                            setSelectedNote(note);
                                                            setIsNoteEditorOpen(true);
                                                        }
                                                    }}
                                                    className={`group relative flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                                                        isDarkMode
                                                            ? "border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/10 text-white"
                                                            : "border-black/5 bg-black/5 hover:bg-black/10 hover:border-black/10 text-black"
                                                    }`}
                                                >
                                                    <div className="flex flex-col min-w-0 pr-2 flex-1">
                                                        {editingNoteTitleId === note.id ? (
                                                            <input
                                                                ref={noteInlineTitleRef}
                                                                type="text"
                                                                value={editingNoteTitleValue}
                                                                onChange={(e) => setEditingNoteTitleValue(e.target.value)}
                                                                onBlur={() => {
                                                                    const trimmed = editingNoteTitleValue.trim();
                                                                    if (trimmed && trimmed !== note.title) {
                                                                        void handleUpdateNote(note.id, { title: trimmed });
                                                                    }
                                                                    setEditingNoteTitleId(null);
                                                                }}
                                                                onKeyDown={(e) => {
                                                                    if (e.key === "Enter") {
                                                                        (e.target as HTMLInputElement).blur();
                                                                    } else if (e.key === "Escape") {
                                                                        setEditingNoteTitleId(null);
                                                                    }
                                                                    e.stopPropagation();
                                                                }}
                                                                onClick={(e) => e.stopPropagation()}
                                                                className={`text-xs font-sans font-medium w-full bg-transparent border-b border-blue-500 outline-none px-0 py-0 ${
                                                                    isDarkMode ? "text-white" : "text-black"
                                                                }`}
                                                                autoFocus
                                                            />
                                                        ) : (
                                                            <div className="flex items-center gap-1.5 min-w-0">
                                                                <FileIcon className="w-3.5 h-3.5 shrink-0 text-blue-400/70" />
                                                                <span
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setSelectedNote(note);
                                                                        setIsNoteEditorOpen(true);
                                                                    }}
                                                                    className="text-xs font-sans font-medium truncate cursor-pointer"
                                                                >
                                                                    {note.title || "Untitled Note"}
                                                                </span>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setEditingNoteTitleId(note.id);
                                                                        setEditingNoteTitleValue(note.title || "");
                                                                        setTimeout(() => noteInlineTitleRef.current?.focus(), 0);
                                                                    }}
                                                                    className="shrink-0 p-0.5 rounded hover:bg-white/10 text-zinc-400 hover:text-blue-400 transition-colors"
                                                                    title="Rename note"
                                                                >
                                                                    <Edit3 className="w-3 h-3" />
                                                                </button>
                                                            </div>
                                                        )}
                                                        <span className={`text-[10px] font-sans truncate mt-0.5 ${isDarkMode ? "text-white/40" : "text-black/40"}`}>
                                                            {note.content ? note.content.replace(/<[^>]*>/g, '').substring(0, 45) : "Empty note"}
                                                        </span>
                                                    </div>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            void handleDeleteNote(note.id);
                                                        }}
                                                        className="shrink-0 opacity-0 group-hover:opacity-100 p-1.5 rounded-lg transition-opacity hover:bg-red-500/10 text-red-500"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            ))
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Mail View */}
                        {sidebarView === "mail" && isEnterpriseModeActive && (
                            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                                <div className="px-4 pt-4 pb-2 space-y-3 flex-1 flex flex-col min-h-0">
                                    {gmailConnected && (
                                        <>
                                            <div className="relative group shrink-0">
                                                <div className="relative flex items-center">
                                                    <Search className={`absolute left-3 h-3.5 w-3.5 ${isDarkMode ? "text-white/30" : "text-black/50"}`} />
                                                    <input
                                                        type="text"
                                                        value={gmailSearchQuery}
                                                        onChange={(e) => setGmailSearchQuery(e.target.value)}
                                                        onKeyDown={(e) => { if (e.key === "Enter") fetchGmailEmails(gmailSearchQuery || undefined) }}
                                                        placeholder="Search emails..."
                                                        className={`w-full pl-10 pr-4 py-2 text-[10px] font-mono rounded-xl border outline-none transition-all ${isDarkMode
                                                            ? "bg-white/[0.03] border-white/10 text-white placeholder-white/20 focus:border-[#4285F4]/50"
                                                            : "bg-white border-black/30 text-black placeholder-black/50 focus:border-[#4285F4]/70"
                                                        }`}
                                                    />
                                                    {gmailSearchQuery && (
                                                        <button onClick={() => { setGmailSearchQuery(""); fetchGmailEmails() }} className={`absolute right-2 p-1 rounded-lg ${isDarkMode ? "hover:bg-white/10 text-white/30" : "hover:bg-black/10 text-black/50"}`}>
                                                            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                                                        </button>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 mt-2 px-1 flex-wrap">
                                                    {["in:inbox", "is:unread", "is:important", "has:attachment"].map((filter) => (
                                                        <button key={filter} onClick={() => { setGmailSearchQuery(filter); fetchGmailEmails(filter) }}
                                                            className={`text-[7px] font-mono uppercase tracking-[0.15em] px-2 py-1 rounded-md border transition-all ${gmailSearchQuery === filter
                                                                ? (isDarkMode ? "bg-[#4285F4]/20 border-[#4285F4]/40 text-[#4285F4]" : "bg-[#4285F4]/10 border-[#4285F4]/30 text-[#4285F4]")
                                                                : (isDarkMode ? "border-white/10 text-white/30 hover:border-white/20" : "border-black/30 text-black/60 hover:border-black/60")
                                                            }`}
                                                        >{filter.replace(":", " ")}</button>
                                                    ))}
                                                </div>
                                            </div>

                                            {gmailError && (
                                                <div className={`shrink-0 p-3 rounded-lg flex items-start gap-2.5 ${isDarkMode ? "bg-red-500/10 border border-red-500/20" : "bg-red-500/5 border border-red-500/20"}`}>
                                                    <p className="text-[10px] font-mono text-red-400">{gmailError}</p>
                                                </div>
                                            )}
                                        </>
                                    )}

                                    <div className="flex-1 min-h-0 overflow-y-auto space-y-2 custom-scrollbar">
                                        {!gmailConnected ? (
                                            <div className="flex flex-col items-center justify-center py-10 px-4">
                                                <div className={`h-16 w-16 mx-auto rounded-2xl flex items-center justify-center bg-gradient-to-br ${isDarkMode ? "from-[#EA4335]/20 via-[#FBBC05]/10 to-[#4285F4]/20" : "from-[#EA4335]/10 via-[#FBBC05]/5 to-[#4285F4]/10"}`}>
                                                    <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none"><rect x="2" y="4" width="20" height="16" rx="2" fill="#EA4335" /><path d="M22 6l-10 7L2 6" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" /></svg>
                                                </div>
                                                <p className={`text-[11px] font-mono text-center mt-4 mb-4 ${isDarkMode ? "text-white/50" : "text-black/50"}`}>Connect your Gmail account</p>
                                                <button onClick={handleConnectGmail} disabled={gmailConnecting}
                                                    className={`px-5 py-2.5 text-[10px] font-mono uppercase tracking-[0.2em] font-bold rounded-xl transition-all ${gmailConnecting ? "opacity-50" : ""} ${isDarkMode ? "bg-white text-black" : "bg-black text-white"}`}>
                                                    {gmailConnecting ? "Connecting..." : "+ Connect Gmail"}
                                                </button>
                                            </div>
                                        ) : gmailLoading ? (
                                            <div className="flex flex-col items-center justify-center py-16 gap-3">
                                                <div className={`h-8 w-8 rounded-full border-2 border-t-transparent animate-spin ${isDarkMode ? "border-white/20" : "border-black/20"}`} />
                                                <p className={`text-[9px] font-mono ${isDarkMode ? "text-white/30" : "text-black/30"}`}>Loading emails...</p>
                                            </div>
                                        ) : gmailEmails.length === 0 ? (
                                            <div className="flex flex-col items-center py-12 gap-4">
                                                <Inbox className={`h-6 w-6 ${isDarkMode ? "text-white/20" : "text-black/20"}`} />
                                                <p className={`text-[10px] font-mono ${isDarkMode ? "text-white/30" : "text-black/30"}`}>
                                                    {gmailSearchQuery ? `No results for "${gmailSearchQuery}"` : "No emails found."}
                                                </p>
                                            </div>
                                        ) : (
                                            gmailEmails.map((email: any, idx: number) => (
                                                <button key={email.id} onClick={() => handleSelectEmail(email.id)}
                                                    className={`group w-full text-left rounded-xl border transition-all p-3 ${email.unread
                                                        ? (isDarkMode ? "border-[#EA4335]/20 bg-[#EA4335]/[0.02]" : "border-[#EA4335]/20 bg-[#EA4335]/[0.02]")
                                                        : (isDarkMode ? "border-white/5 hover:border-white/15" : "border-black/5 hover:border-black/15")
                                                    }`}>
                                                    <p className={`text-[11px] font-bold truncate ${email.unread ? (isDarkMode ? "text-white" : "text-black") : (isDarkMode ? "text-white/70" : "text-black/70")}`}>{email.subject || "(No Subject)"}</p>
                                                    <p className={`text-[9px] font-mono truncate mt-1 ${isDarkMode ? "text-white/40" : "text-black/40"}`}>{email.from}</p>
                                                    <p className={`text-[9px] font-mono line-clamp-1 ${isDarkMode ? "text-white/25" : "text-black/25"}`}>{email.snippet || ""}</p>
                                                </button>
                                            ))
                                        )}
                                    </div>

                                    {gmailConnected && (
                                        <div className={`shrink-0 pt-3 border-t ${isDarkMode ? "border-white/10" : "border-black/10"}`}>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <div className={`p-1.5 rounded-lg ${isDarkMode ? "bg-[#EA4335]/10" : "bg-[#EA4335]/15"}`}>
                                                        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none"><rect x="2" y="4" width="20" height="16" rx="2" fill="#EA4335" /><path d="M22 6l-10 7L2 6" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" /></svg>
                                                    </div>
                                                    <p className={`text-[8px] font-mono ${isDarkMode ? "text-white/35" : "text-black/60"}`}>{gmailEmail || "Gmail"}</p>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <button onClick={() => fetchGmailEmails(gmailSearchQuery || undefined)} disabled={gmailLoading}
                                                        className={`p-1.5 rounded-lg ${isDarkMode ? "hover:bg-white/10 text-white/40" : "hover:bg-black/10 text-black/60"}`}>
                                                        <svg className={`h-3 w-3 ${gmailLoading ? "animate-spin" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" /><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" /></svg>
                                                    </button>
                                                    <button onClick={handleDisconnectGmail}
                                                        className={`p-1.5 rounded-lg ${isDarkMode ? "hover:bg-white/10 text-white/30 hover:text-[#EA4335]" : "hover:bg-black/10 text-black/60 hover:text-[#EA4335]"}`}>
                                                        <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Footer & User Profile */}
                        <div className={`p-4 border-t ${isDarkMode ? "border-white/5 bg-white/[0.01]" : "border-black/5 bg-black/[0.01]"} flex flex-col gap-3 relative`}>
                            {showProfileDropup && (
                                <div
                                    ref={profileDropupRef}
                                    className={`absolute bottom-[68px] left-4 right-4 z-[100] rounded-xl border p-1.5 shadow-2xl ${isDarkMode
                                            ? "bg-[#222120]/95 border-white/10 text-white"
                                            : "bg-[#f2f1f0]/95 border-black/10 text-black"
                                        }`}
                                >
                                    {/* Personalization Option */}
                                    <button
                                        onClick={() => {
                                            setShowProfileDropup(false);
                                            setIsPersonalizationModalOpen(true);
                                        }}
                                        className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs rounded-lg text-left transition-colors ${isDarkMode ? "hover:bg-white/5 text-white/90 hover:text-white" : "hover:bg-black/5 text-black/90 hover:text-black"
                                            }`}
                                    >
                                        <User className="h-3.5 w-3.5 opacity-60" />
                                        <span>Profile</span>
                                        </button>

                                        {/* Wallet Option */}
                                    <button
                                        onClick={() => {
                                            setShowProfileDropup(false);
                                            setIsWalletModalOpen(true);
                                        }}
                                        className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs rounded-lg text-left transition-colors ${isDarkMode ? "hover:bg-white/5 text-white/90 hover:text-white" : "hover:bg-black/5 text-black/90 hover:text-black"
                                            }`}
                                    >
                                        <Wallet className="h-3.5 w-3.5 opacity-60" />
                                        <span>{t("wallet")}</span>
                                    </button>

                                    {/* Divider */}
                                    <div className={`my-1 h-px ${isDarkMode ? "bg-white/5" : "bg-black/5"}`} />

                                    {/* Logout Option */}
                                    <button
                                        onClick={() => {
                                            setShowProfileDropup(false);
                                            removeApiKey();
                                            removeUserInfo();
                                            removeUserRole();
                                            removeSchoolName();
                                            removeEnterpriseName();
                                            setStoredActiveChatId(null);
                                            setAuthed(false);
                                            setUserName("");
                                            setUserEmail("");
                                            window.location.href = "/";
                                        }}
                                        className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs rounded-lg text-left text-red-500 transition-colors ${isDarkMode ? "hover:bg-red-500/10" : "hover:bg-red-500/5"
                                            }`}
                                    >
                                        <LogOut className="h-3.5 w-3.5" />
                                        <span>{t("logout")}</span>
                                    </button>
                                </div>
                            )}

                            <div className="flex items-center justify-between">
                                <motion.button
                                    id="walkthrough-profile-area"
                                    onClick={() => setShowProfileDropup(!showProfileDropup)}
                                    whileHover={{ scale: 1.03 }}
                                    whileTap={{ scale: 0.97 }}
                                    className="flex items-center gap-2 min-w-0 text-left cursor-pointer hover:opacity-80 transition-opacity"
                                    title={t("profile_options")}
                                >
                                    <div className={`h-8 w-8 rounded-full flex items-center justify-center relative shrink-0 ${isDarkMode ? "bg-white/5 border-white/10" : "bg-black/5 border-black/10"} border overflow-hidden`}>
                                        {profilePic ? (
                                            <img src={profilePic} alt="Profile" className="h-full w-full object-cover" />
                                        ) : (
                                            <User className={`h-4 w-4 ${isDarkMode ? "text-white/80" : "text-black/80"}`} />
                                        )}
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <span className={`text-[11px] font-bold truncate ${isDarkMode ? "text-white" : "text-black"}`}>{userRole === "global_admin" ? "CEO" : (userName || userEmail || t("user_fallback"))}</span>
                                        <span className={`text-[9px] font-mono uppercase tracking-widest ${isDarkMode ? "text-white/40" : "text-black/40"}`}>{userRole === "school_admin" ? t("admin_role") : userRole === "faculty" ? t("faculty_role") : userRole === "enterprise_admin" ? t("admin_role") : userRole === "manager" ? t("manager_role") : userRole === "global_admin" ? t("admin_role") : (subscription?.subscription?.plan_name?.toLowerCase().includes("agency") || subscription?.subscription?.plan_name?.toLowerCase().includes("heavy duty") ? "Agency" : subscription?.subscription?.plan_name || t("free_trial"))}</span>
                                    </div>
                                </motion.button>
                                <div className="flex items-center gap-1.5">
                                    {isGlobalAdmin && (
                                        <motion.button
                                            onClick={() => {
                                                const nextMode = !isEnterpriseMode;
                                                setIsEnterpriseMode(nextMode);
                                                setRightSidebarTab(nextMode ? "gmail" : "wallet");
                                            }}
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                            className={`p-2 border rounded-lg transition-all text-[9px] font-mono ${isDarkMode ? "border-white/10 text-white/60 hover:text-white" : "border-black/10 text-black/60 hover:text-black"} ${isEnterpriseMode ? (selectedEngine === "AI Image Lab" ? "text-black" : "text-accent") : ""}`}
                                            title={isEnterpriseMode ? t("switch_regular") : t("switch_enterprise")}
                                        >
                                            {isEnterpriseMode ? t("ent") : t("reg")}
                                        </motion.button>
                                    )}
                                    <motion.button
                                        onClick={() => {
                                            setSettingsPanel("persona");
                                            setIsSettingsModalOpen(true);
                                        }}
                                        whileHover={{ scale: 1.1, rotate: 30 }}
                                        whileTap={{ scale: 0.9 }}
                                        title={t("settings")}
                                        className={`p-1.5 rounded-lg border transition-colors ${isDarkMode
                                                ? "border-white/10 text-white/60 hover:text-white hover:bg-white/5"
                                                : "border-black/10 text-black/60 hover:text-black hover:bg-black/5"
                                            }`}
                                    >
                                        <Settings className="h-4 w-4" />
                                    </motion.button>
                                    {(!userRole || (userRole as any) === "student") && (
                                        <motion.button
                                            onClick={() => window.location.href = "/pricing"}
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            title={t("upgrade")}
                                            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-sans font-semibold transition-colors ${isDarkMode
                                                    ? "border-white/10 text-white/80 hover:text-white hover:bg-white/5"
                                                    : "border-black/10 text-black/80 hover:text-black hover:bg-black/5"
                                                }`}
                                        >
                                            <Zap className="h-3.5 w-3.5" />
                                            <span>{t("upgrade")}</span>
                                        </motion.button>
                                    )}
                                </div>
                            </div>

                        </div>
                    </div>
                )}
            </aside>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col relative h-full overflow-hidden">
                {/* Fixed Header / Navbar */}
                <header className={`h-16 flex-shrink-0 flex items-center justify-between px-6 md:px-10 relative z-30 transition-colors duration-500 border-b ${isDarkMode ? "bg-[#0d0d0c] border-white/5" : "bg-[#f4f3f2] border-black/5"}`}>
                    {/* Left: Engine / Mode Dropdown Selector */}
                    <div className="flex items-center gap-3">
                        {/* Mobile left-sidebar toggle button */}
                        {isMobile && (
                            <motion.button
                                onClick={() => {
                                    setIsSidebarCollapsed(!isSidebarCollapsed);
                                    setIsRightSidebarCollapsed(true);
                                }}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                className={`p-2 border rounded-xl transition-all cursor-pointer ${isDarkMode ? "border-white/10 text-white hover:bg-white/5" : "border-black/10 text-black hover:bg-black/5"}`}
                            >
                                <MessageSquare className="h-4 w-4" />
                            </motion.button>
                        )}



                        {/* Mode Toggle Buttons */}
                        <div className={`flex items-center gap-1 p-0.5 rounded-xl border text-xs font-medium transition-all duration-200 cursor-pointer bg-inherit ${isDarkMode ? "border-white/10" : "border-black/10"}`}>
                            <button
                                onClick={() => setSelectedEngine("Query Mode")}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all duration-200 cursor-pointer ${selectedEngine !== "Image Mode"
                                        ? (isDarkMode ? "bg-white/10 text-white shadow-sm" : "bg-black/10 text-black shadow-sm")
                                        : (isDarkMode ? "text-white/50 hover:text-white" : "text-black/50 hover:text-black")
                                    }`}
                            >
                                <MessageSquare className="w-3.5 h-3.5" />
                                <span>Query Mode</span>
                            </button>
                            <button
                                onClick={() => window.location.href = "/library"}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all duration-200 cursor-pointer ${selectedEngine === "Image Mode"
                                        ? (isDarkMode ? "bg-white/10 text-white shadow-sm" : "bg-black/10 text-black shadow-sm")
                                        : (isDarkMode ? "text-white/50 hover:text-white" : "text-black/50 hover:text-black")
                                    }`}
                            >
                                <ImageIcon className="w-3.5 h-3.5" />
                                <span>Image Mode</span>
                            </button>
                        </div>
                    </div>

                    {/* Right Controls */}
                    <div className="flex items-center gap-3">
                        {/* Quick Tour Button */}
                        {!showEmployeeView && !isMobile && (
                            <motion.button
                                onClick={() => setShowWalkthrough(true)}
                                className={`p-2 border rounded-full transition-all duration-200 flex items-center justify-center cursor-pointer overflow-hidden relative ${isDarkMode
                                        ? "border-white/10 bg-white/5 text-white hover:bg-white/10 hover:border-white/20"
                                        : "border-black/10 bg-black/5 text-black hover:bg-black/10 hover:border-black/20"
                                    }`}
                                title={t("start_tour")}
                            >
                                <motion.div
                                    whileHover={{
                                        scale: 1.1,
                                        y: [0, -1, 1, -1, 0],
                                        transition: {
                                            y: {
                                                repeat: Infinity,
                                                duration: 0.15,
                                                ease: "linear"
                                            }
                                        }
                                    }}
                                    whileTap={{
                                        x: [0, -6, 35],
                                        transition: {
                                            duration: 0.4,
                                            ease: "easeInOut"
                                        }
                                    }}
                                    className="flex items-center justify-center"
                                >
                                    <Car className="h-4 w-4 opacity-70" />
                                </motion.div>
                            </motion.button>
                        )}

                        {/* Notification Bell for Image Generation & Social Notifications */}
                        <div className="relative" ref={notificationPanelRef}>
                                <motion.button
                                    onClick={() => setShowNotificationPanel(prev => !prev)}
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    className={`p-2 border rounded-full transition-all duration-200 flex items-center justify-center cursor-pointer relative ${isDarkMode
                                            ? "border-white/10 bg-white/5 text-white hover:bg-white/10 hover:border-white/20"
                                            : "border-black/10 bg-black/5 text-black hover:bg-black/10 hover:border-black/20"
                                        }`}
                                    title="Notifications"
                                >
                                    <Bell className="h-4 w-4" />
                                    {(imageGenStatus === "generating" || notifications.some(n => !n.is_read)) && (
                                        <span className={`absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-white dark:ring-[#0d0d0c] ${
                                            imageGenStatus === "generating" ? "bg-yellow-400" : "bg-red-500"
                                        }`} />
                                    )}
                                </motion.button>

                                {showNotificationPanel && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -8, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: -8, scale: 0.95 }}
                                        transition={{ duration: 0.15 }}
                                        className={`absolute right-0 top-full mt-2 w-72 rounded-xl border shadow-2xl overflow-hidden z-50 ${
                                            isDarkMode
                                                ? "bg-[#222120]/95 border-white/10 text-white"
                                                : "bg-[#f2f1f0]/95 border-black/10 text-black"
                                        }`}
                                    >
                                        <div className="p-3 space-y-2">
                                            <div className={`text-[10px] font-mono uppercase tracking-widest ${isDarkMode ? "text-white/40" : "text-black/40"}`}>
                                                Notifications
                                            </div>
                                            <div className={`h-px ${isDarkMode ? "bg-white/5" : "bg-black/5"}`} />

                                            {imageGenStatus === "generating" && (
                                                <button
                                                    onClick={() => { setShowNotificationPanel(false); router.push("/library"); }}
                                                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors text-xs ${
                                                        isDarkMode ? "hover:bg-white/5" : "hover:bg-black/5"
                                                    }`}
                                                >
                                                    <Loader2 className="h-4 w-4 animate-spin shrink-0 text-yellow-400" />
                                                    <div className="min-w-0">
                                                        <div className="font-medium truncate">Generating image...</div>
                                                        <div className={`text-[10px] mt-0.5 truncate ${isDarkMode ? "text-white/40" : "text-black/40"}`}>
                                                            Click to view progress
                                                        </div>
                                                    </div>
                                                </button>
                                            )}
                                            {imageGenStatus === "completed" && (
                                                <button
                                                    onClick={() => { setShowNotificationPanel(false); setImageGenStatus("idle"); if (typeof window !== "undefined") { localStorage.setItem("image_gen_status", "idle"); localStorage.setItem("image_gen_timestamp", String(Date.now())); } router.push("/library"); }}
                                                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors text-xs ${
                                                        isDarkMode ? "hover:bg-white/5" : "hover:bg-black/5"
                                                    }`}
                                                >
                                                    <CheckCircle className="h-4 w-4 shrink-0 text-green-500" />
                                                    <div className="min-w-0">
                                                        <div className="font-medium truncate">Image created!</div>
                                                        <div className={`text-[10px] mt-0.5 truncate ${isDarkMode ? "text-white/40" : "text-black/40"}`}>
                                                            Click to view in My Gallery
                                                        </div>
                                                    </div>
                                                </button>
                                            )}

                                            {/* Social Notifications */}
                                            {notifications.length > 0 && (
                                                <div className="max-h-60 overflow-y-auto space-y-1.5 custom-scrollbar pr-1">
                                                    {[...notifications]
                                                        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                                                        .map((notif) => (
                                                            <button
                                                                key={notif.id}
                                                                onClick={() => handleNotificationClick(notif)}
                                                                className={`w-full flex items-start gap-2.5 px-2.5 py-2 rounded-lg text-left transition-colors text-xs relative ${
                                                                    notif.is_read
                                                                        ? (isDarkMode ? "hover:bg-white/5" : "hover:bg-black/5")
                                                                        : (isDarkMode ? "bg-white/[0.03] hover:bg-white/5 font-medium" : "bg-black/[0.03] hover:bg-black/5 font-medium")
                                                                }`}
                                                            >
                                                                <div className="h-7 w-7 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden flex items-center justify-center shrink-0 font-bold text-[10px] text-zinc-650 dark:text-zinc-350">
                                                                    {notif.sender_avatar ? (
                                                                        <img src={notif.sender_avatar} className="h-full w-full object-cover" alt="" />
                                                                    ) : (
                                                                        notif.sender_name.slice(0, 2).toUpperCase()
                                                                    )}
                                                                </div>
                                                                <div className="flex-1 min-w-0 pr-2">
                                                                    <p className="leading-tight text-zinc-900 dark:text-zinc-100">
                                                                        <span className="font-bold mr-1">{notif.sender_name}</span>
                                                                        {notif.type === 'like' ? 'liked your image.' : notif.type === 'reply' ? 'replied to your comment.' : notif.type === 'message' ? 'sent you a message.' : (notif.type === 'creation' || notif.type === 'created') ? 'created a new image.' : 'commented on your image.'}
                                                                    </p>
                                                                    {notif.type !== 'like' && notif.content && (
                                                                        <p className={`text-[10px] truncate mt-1 ${isDarkMode ? "text-white/50" : "text-black/50"}`}>
                                                                            "{notif.content}"
                                                                        </p>
                                                                    )}
                                                                    <span className={`text-[9px] block mt-0.5 ${isDarkMode ? "text-white/30" : "text-black/30"}`}>
                                                                        {new Date(notif.created_at).toLocaleDateString()}
                                                                    </span>
                                                                </div>
                                                                {!notif.is_read && (
                                                                    <span className="absolute right-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#00DDDD]" />
                                                                )}
                                                            </button>
                                                        ))}
                                                </div>
                                            )}

                                            {imageGenStatus === "idle" && notifications.length === 0 && (
                                                <div className={`px-3 py-6 text-center text-xs ${isDarkMode ? "text-white/30" : "text-black/30"}`}>
                                                    No notifications
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </div>

                        {/* Theme Toggler */}
                        <motion.button
                            onClick={toggleTheme}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className={`p-2 border rounded-full transition-all duration-200 flex items-center justify-center cursor-pointer overflow-hidden relative ${isDarkMode
                                    ? "border-white/10 bg-white/5 text-white hover:bg-white/10 hover:border-white/20"
                                    : "border-black/10 bg-black/5 text-black hover:bg-black/10 hover:border-black/20"
                                }`}
                            title={isDarkMode ? t("switch_light") : t("switch_dark")}
                        >
                            <AnimatePresence mode="wait" initial={false}>
                                <motion.div
                                    key={isDarkMode ? "dark" : "light"}
                                    initial={{ y: -20, opacity: 0, rotate: -90 }}
                                    animate={{ y: 0, opacity: 1, rotate: 0 }}
                                    exit={{ y: 20, opacity: 0, rotate: 90 }}
                                    transition={{ duration: 0.25, ease: "easeInOut" }}
                                    className="flex items-center justify-center"
                                >
                                    {isDarkMode ? <Sun className="h-4 w-4 opacity-70" /> : <Moon className="h-4 w-4 opacity-70" />}
                                </motion.div>
                            </AnimatePresence>
                        </motion.button>
                    </div>
                </header>

                <main
                    ref={mainScrollRef}
                    onScroll={handleMainScroll}
                    className={`flex-1 ${isChatEmpty ? "overflow-y-hidden flex flex-col justify-center pt-20 md:pt-32 pb-16" : "overflow-y-auto block pt-10 pb-36"} px-4 md:px-20 relative z-10 ${isDarkMode ? "custom-scrollbar" : "light-scrollbar"}`}
                >
                    <div className={`${isChatEmpty ? "w-full" : "max-w-3xl w-full"} mx-auto`}>
                        {/* Error Display */}
                        {chatError && (
                            <div className="mb-4 p-4 border border-red-500/20 bg-red-500/10 text-red-400 text-sm">
                                {chatError}
                            </div>
                        )}

                        {/* Chat Area */}
                        <div className="space-y-16">
                            <AnimatePresence initial={false}>
                                {messages.length === 0 || messages.every((msg) => msg.localOnly) ? (
                                    <div className="flex flex-col items-center justify-center min-h-[50vh] max-w-2xl mx-auto px-4 text-center">
                                        <motion.h1
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.5 }}
                                            className={`font-serif italic text-4xl sm:text-5xl md:text-6xl mb-8 tracking-tight ${isDarkMode ? "text-white" : "text-black"}`}
                                        >
                                            {t("what_would_you_like")}
                                        </motion.h1>
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.5, delay: 0.15 }}
                                            className="w-full text-left"
                                        >
                                            {renderInputContainer(true)}
                                        </motion.div>
                                    </div>
                                ) : (
                                    messages.map((msg, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
                                            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} w-full`}
                                        >
                                            <div className={`flex flex-col ${msg.role === "user" ? "items-end max-w-[90%] md:max-w-[80%]" : "items-start max-w-[90%] md:max-w-[85%]"}`}>
                                                <div className="flex items-center gap-3 mb-4">
                                                    <span className={`text-[9px] font-mono uppercase tracking-[0.2em] flex items-center gap-1.5 ${isDarkMode ? "text-white/40" : "text-black/40"}`}>
                                                        {msg.role === "assistant" && isLoading && i === messages.length - 1 && (
                                                            <Loader2 className="h-3 w-3 animate-spin text-accent shrink-0" />
                                                        )}
                                                        {msg.role === "assistant" ? t("rudra_ai") : t("you_label")}
                                                    </span>
                                                    <span className={`text-[9px] font-mono ${isDarkMode ? (selectedEngine === "AI Image Lab" ? "text-white/60 drop-shadow-[0_1px_3px_rgba(0,0,0,1)]" : "text-white/20") : (selectedEngine === "AI Image Lab" ? "text-black drop-shadow-[0_1px_3px_rgba(255,255,255,0.9)]" : "text-black/60")}`}>{msg.timestamp}</span>
                                                    {msg.role === "assistant" && showEmployeeView && !(isLoading && i === messages.length - 1) && (
                                                        <span className={`text-[8px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full border ${isDarkMode ? "border-accent/40 text-accent/80" : "border-[#00AAAA]/40 text-[#00AAAA]/80"}`}>
                                                            Enhanced
                                                        </span>
                                                    )}
                                                </div>

                                                <div className={`py-1.5 px-4 md:py-2 md:px-5 ${msg.role === "user"
                                                    ? (isDarkMode ? "bg-[#222120] border border-white/5 rounded-2xl text-white" : "bg-[#f2f1f0] border border-black/5 rounded-2xl text-black")
                                                    : "bg-transparent text-current"
                                                    } relative group`}>
                                                    {msg.role === "user" ? (
                                                         editingMessageIndex === i ? (
                                                             <div className="flex flex-col gap-2 min-w-[280px] sm:min-w-[400px] py-1">
                                                                 <textarea
                                                                     value={editingMessageText}
                                                                     onChange={(e) => setEditingMessageText(e.target.value)}
                                                                     onKeyDown={(e) => {
                                                                         if (e.key === "Enter" && !e.shiftKey) {
                                                                             e.preventDefault();
                                                                             void handleSaveEdit(i);
                                                                         }
                                                                         if (e.key === "Escape") {
                                                                             setEditingMessageIndex(null);
                                                                         }
                                                                     }}
                                                                     className={`w-full p-2 text-base rounded-xl resize-none focus:outline-none border ${
                                                                         isDarkMode
                                                                             ? "bg-[#111] border-white/10 text-white placeholder:text-white/30"
                                                                             : "bg-white border-black/10 text-black placeholder:text-black/30"
                                                                     }`}
                                                                     rows={3}
                                                                     autoFocus
                                                                 />
                                                                 <div className="flex justify-end gap-2 text-[10px] font-mono uppercase tracking-wider">
                                                                     <motion.button
                                                                         onClick={() => setEditingMessageIndex(null)}
                                                                         whileHover={{ scale: 1.05 }}
                                                                         whileTap={{ scale: 0.95 }}
                                                                         className={`px-3 py-1.5 rounded-lg border ${
                                                                             isDarkMode
                                                                                 ? "border-white/10 text-white/60 hover:text-white"
                                                                                 : "border-black/10 text-black/60 hover:text-black"
                                                                         }`}
                                                                     >
                                                                         Cancel
                                                                     </motion.button>
                                                                     <motion.button
                                                                         onClick={() => void handleSaveEdit(i)}
                                                                         whileHover={{ scale: 1.05 }}
                                                                         whileTap={{ scale: 0.95 }}
                                                                         className={`px-3 py-1.5 rounded-lg font-bold ${
                                                                             isDarkMode
                                                                                 ? "bg-white text-black hover:bg-white/90"
                                                                                 : "bg-black text-white hover:bg-black/90"
                                                                         }`}
                                                                     >
                                                                         Save & Submit
                                                                     </motion.button>
                                                                 </div>
                                                             </div>
                                                         ) : (
                                                             <p className={`text-base md:text-lg leading-relaxed ${isDarkMode ? "text-white" : "text-black"}`}>
                                                                 {msg.content}
                                                             </p>
                                                         )
                                                    ) : isImageContent(msg.content) ? (
                                                        <div className={`relative group/img-wrapper ${selectedEngine === "AI Image Lab"
                                                                ? "max-w-[450px]"
                                                                : "w-full"
                                                            }`}>
                                                            <img
                                                                src={msg.content}
                                                                alt="Generated image"
                                                                className={`w-full object-contain rounded-2xl border border-white/10 shadow-2xl transition-transform duration-300 group-hover/img-wrapper:scale-[1.01] ${selectedEngine === "AI Image Lab"
                                                                        ? "max-h-[350px]"
                                                                        : "max-h-[300px] md:max-h-[400px]"
                                                                    }`}
                                                            />
                                                            <button
                                                                onClick={() => handleDownloadImage(msg.content)}
                                                                title="Download Image"
                                                                className="absolute top-4 right-4 p-3 rounded-full bg-black/80 hover:bg-black text-white hover:text-accent border border-white/20 shadow-lg backdrop-blur-md opacity-0 group-hover/img-wrapper:opacity-100 transition-all duration-300 scale-90 group-hover/img-wrapper:scale-100 flex items-center justify-center gap-1.5 hover:scale-105 active:scale-95"
                                                            >
                                                                <FileDown className="h-4 w-4" />
                                                                <span className="text-[10px] font-mono uppercase tracking-wider font-bold pr-1">Download</span>
                                                            </button>
                                                        </div>
                                                    ) : (() => {
                                                        const embedImgUrl = hasEmbeddedImage(msg.content);
                                                        if (embedImgUrl) {
                                                            const textOnly = stripEmbeddedImage(msg.content);
                                                            return (
                                                                <div className="flex flex-col gap-3">
                                                                    {textOnly && (
                                                                        <MarkdownRenderer
                                                                            content={textOnly}
                                                                            isDarkMode={isDarkMode}
                                                                            onDownloadImage={handleDownloadImage}
                                                                            isImageCompact={selectedEngine !== "AI Image Lab"}
                                                                            isGenerating={isLoading && i === messages.length - 1}
                                                                        />
                                                                    )}
                                                                    <div className={`relative group/img-wrapper ${selectedEngine === "AI Image Lab"
                                                                            ? "max-w-[450px]"
                                                                            : "w-full"
                                                                        }`}>
                                                                        <img
                                                                            src={embedImgUrl}
                                                                            alt="Generated image"
                                                                            className={`w-full object-contain rounded-2xl border border-white/10 shadow-2xl transition-transform duration-300 group-hover/img-wrapper:scale-[1.01] ${selectedEngine === "AI Image Lab"
                                                                                    ? "max-h-[350px]"
                                                                                    : "max-h-[300px] md:max-h-[400px]"
                                                                                }`}
                                                                        />
                                                                        <button
                                                                            onClick={() => handleDownloadImage(embedImgUrl)}
                                                                            title="Download Image"
                                                                            className="absolute top-4 right-4 p-3 rounded-full bg-black/80 hover:bg-black text-white hover:text-accent border border-white/20 shadow-lg backdrop-blur-md opacity-0 group-hover/img-wrapper:opacity-100 transition-all duration-300 scale-90 group-hover/img-wrapper:scale-100 flex items-center justify-center gap-1.5 hover:scale-105 active:scale-95"
                                                                        >
                                                                            <FileDown className="h-4 w-4" />
                                                                            <span className="text-[10px] font-mono uppercase tracking-wider font-bold pr-1">Download</span>
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            );
                                                        }
                                                        return (
                                                            <MarkdownRenderer
                                                                content={msg.content}
                                                                isDarkMode={isDarkMode}
                                                                onDownloadImage={handleDownloadImage}
                                                                isImageCompact={selectedEngine !== "AI Image Lab"}
                                                                isGenerating={isLoading && i === messages.length - 1}
                                                            />
                                                        );
                                                    })()}

                                                    {msg.role === "assistant" && responseTime !== null && i === messages.length - 1 && (
                                                        <div className={`text-[8px] font-mono mt-4 text-right ${isDarkMode ? "text-white" : "text-black"}`}>
                                                            Done in {responseTime.toFixed(1)}s
                                                        </div>
                                                    )}


                                                </div>

                                                {/* Action Buttons */}
                                                <div className={`flex items-center gap-2 mt-2 ${msg.role === "user" ? "justify-end" : "justify-start px-2"}`}>
                                                    {msg.role === "user" ? (
                                                        <>
                                                            <motion.button 
                                                                onClick={() => {
                                                                    setEditingMessageIndex(i);
                                                                    setEditingMessageText(msg.content);
                                                                }} 
                                                                whileHover={{ scale: 1.15 }}
                                                                whileTap={{ scale: 0.85 }}
                                                                title="Edit message" 
                                                                className={`p-1.5 transition-all rounded-lg ${isDarkMode ? "text-neutral-400 hover:text-neutral-200 hover:bg-white/5" : "text-black hover:text-black/80 hover:bg-black/5"}`}
                                                            >
                                                                <Edit3 className="h-5 w-5" />
                                                            </motion.button>
                                                            <motion.button 
                                                                onClick={() => copyToClipboard(msg.content, i)} 
                                                                whileHover={{ scale: 1.15 }}
                                                                whileTap={{ scale: 0.85 }}
                                                                title="Copy message" 
                                                                className={`p-1.5 transition-all rounded-lg ${isDarkMode ? "text-neutral-400 hover:text-neutral-200 hover:bg-white/5" : "text-black hover:text-black/80 hover:bg-black/5"}`}
                                                            >
                                                                {copiedMsgIndex === i ? (
                                                                    <Check className="h-5 w-5 text-emerald-400" />
                                                                ) : (
                                                                    <Copy className="h-5 w-5" />
                                                                )}
                                                            </motion.button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <motion.button
                                                                title="Like"
                                                                onClick={() => void handleToggleFeedback(msg.messageId, msg.feedback, 1)}
                                                                whileHover={{ scale: 1.15 }}
                                                                whileTap={{ scale: 0.85 }}
                                                                className={`p-1.5 transition-all rounded-lg ${msg.feedback === 1
                                                                    ? "text-emerald-400 bg-emerald-500/10"
                                                                    : (isDarkMode ? "text-neutral-400 hover:text-neutral-200 hover:bg-white/5" : "text-black hover:text-black/80 hover:bg-black/5")
                                                                    }`}
                                                            >
                                                                <ThumbsUp className="h-5 w-5" />
                                                            </motion.button>
                                                            <motion.button
                                                                title="Dislike"
                                                                onClick={() => void handleToggleFeedback(msg.messageId, msg.feedback, -1)}
                                                                whileHover={{ scale: 1.15 }}
                                                                whileTap={{ scale: 0.85 }}
                                                                className={`p-1.5 transition-all rounded-lg ${msg.feedback === -1
                                                                    ? "text-red-400 bg-red-500/10"
                                                                    : (isDarkMode ? "text-neutral-400 hover:text-neutral-200 hover:bg-white/5" : "text-black hover:text-black/80 hover:bg-black/5")
                                                                    }`}
                                                            >
                                                                <ThumbsDown className="h-5 w-5" />
                                                            </motion.button>
                                                            <motion.button 
                                                                onClick={() => copyToClipboard(msg.content, i)} 
                                                                whileHover={{ scale: 1.15 }}
                                                                whileTap={{ scale: 0.85 }}
                                                                title="Copy message" 
                                                                className={`p-1.5 transition-all rounded-lg ${isDarkMode ? "text-neutral-400 hover:text-neutral-200 hover:bg-white/5" : "text-black hover:text-black/80 hover:bg-black/5"}`}
                                                            >
                                                                {copiedMsgIndex === i ? (
                                                                    <Check className="h-5 w-5 text-emerald-400" />
                                                                ) : (
                                                                    <Copy className="h-5 w-5" />
                                                                )}
                                                            </motion.button>
                                                            <motion.button 
                                                                onClick={() => retryMessage(i)} 
                                                                whileHover={{ scale: 1.15 }}
                                                                whileTap={{ scale: 0.85 }}
                                                                title="Regenerate" 
                                                                className={`p-1.5 transition-all rounded-lg ${isDarkMode ? "text-neutral-400 hover:text-neutral-200 hover:bg-white/5" : "text-black hover:text-black/80 hover:bg-black/5"}`}
                                                            >
                                                                <RotateCcw className="h-5 w-5" />
                                                            </motion.button>
                                                            <motion.button 
                                                                onClick={() => downloadAsPdf("Rudranex AI Response", msg.content)} 
                                                                whileHover={{ scale: 1.15 }}
                                                                whileTap={{ scale: 0.85 }}
                                                                title="Download as PDF" 
                                                                className={`p-1.5 transition-all rounded-lg ${isDarkMode ? "text-neutral-400 hover:text-neutral-200 hover:bg-white/5" : "text-black hover:text-black/80 hover:bg-black/5"}`}
                                                            >
                                                                <FileDown className="h-5 w-5" />
                                                            </motion.button>
                                                            <motion.button 
                                                                onClick={() => { if (navigator.share) { navigator.share({ title: "Rudranex AI Response", text: msg.content }); } else { navigator.clipboard.writeText(msg.content); toast.success("Link copied to clipboard"); } }} 
                                                                whileHover={{ scale: 1.15 }}
                                                                whileTap={{ scale: 0.85 }}
                                                                title="Share" 
                                                                className={`p-1.5 transition-all rounded-lg ${isDarkMode ? "text-neutral-400 hover:text-neutral-200 hover:bg-white/5" : "text-black hover:text-black/80 hover:bg-black/5"}`}
                                                            >
                                                                <Share className="h-5 w-5" />
                                                            </motion.button>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))
                                )}
                            </AnimatePresence>
                            <MultiStepLoader loadingStates={GENERATION_STEPS} loading={isLoading && messages[messages.length - 1]?.role !== "assistant"} duration={1500} isInline={true} />

                            {/* MCQ Options Panel — below the question message */}
                            {mcqSession && (() => {
                                const q = mcqSession.questions[mcqSession.currentIndex];
                                const hasAnswered = mcqSession.answers[mcqSession.currentIndex] !== null;
                                const totalQ = mcqSession.questions.length;
                                return (
                                    <div className={`mb-6 p-6 ${isDarkMode ? "bg-[#0d0d0d] border-white/10" : "bg-[#f5f5f5] border-black/30"} border-2 rounded-2xl`}>
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-2">
                                                <span className={`text-[10px] font-mono uppercase tracking-widest ${isDarkMode ? "text-white/60" : "text-black/60"}`}>
                                                    Q{mcqSession.currentIndex + 1}/{totalQ}
                                                </span>
                                                {mcqSession.examType && (
                                                    <span className={`text-[8px] font-mono ${isDarkMode ? "text-white/30" : "text-black/40"}`}>
                                                        {mcqSession.examType}
                                                    </span>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => setMcqSession(null)}
                                                className={`flex items-center gap-1 px-2.5 py-1 text-[8px] font-mono uppercase tracking-[0.15em] border rounded-md transition-all ${isDarkMode ? "border-red-500/40 text-red-400 hover:border-red-500 hover:text-red-500" : "border-red-500/50 text-red-600 hover:border-red-500 hover:text-red-700"}`}
                                            >
                                                Exit Quiz
                                            </button>
                                        </div>
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

                            <div ref={messagesEndRef} />
                        </div>
                    </div>
                </main>

                {/* Input Bar */}
                {!isChatEmpty && (
                    <div
                        className={`${isMobile ? "fixed" : "absolute"} ${isMobile ? "bottom-[10px]" : ""} left-0 right-0 z-50 p-4 md:p-10 ${isDarkMode ? "bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]" : "bg-gradient-to-t from-white via-white"} to-transparent flex justify-center`}
                        style={isMobile ? undefined : { bottom: '-2px' }}
                    >
                        <div className={`w-full max-w-4xl relative mb-4 md:mb-0`}>
                            <div className="relative">
                                <AnimatePresence>
                                    {showScrollToBottom && (
                                        <motion.button
                                            initial={{ opacity: 0, y: 10, scale: 0.8 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 10, scale: 0.8 }}
                                            onClick={handleScrollToBottom}
                                            className={`absolute left-1/2 -translate-x-1/2 -top-14 z-50 p-2.5 rounded-full border shadow-xl transition-all duration-200 cursor-pointer flex items-center justify-center ${
                                                isDarkMode
                                                    ? "bg-[#222120] border-white/10 text-white/70 hover:text-white hover:bg-[#323130] hover:scale-110"
                                                    : "bg-[#f2f1f0] border-black/10 text-black/70 hover:text-black hover:bg-[#e2e1e0] hover:scale-110"
                                            }`}
                                            title="Scroll to Bottom"
                                        >
                                            <ChevronDown className="h-4 w-4" />
                                        </motion.button>
                                    )}
                                </AnimatePresence>


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
                                                        className={`group flex items-center gap-1.5 md:gap-2 px-2.5 md:px-3 py-1 md:py-1.5 text-[10px] md:text-xs font-sans font-medium tracking-wide rounded-full border transition-all duration-200 flex-shrink-0 ${isSelected
                                                            ? (isDarkMode ? "bg-white text-black border-white shadow-md font-bold" : "bg-black text-white border-black shadow-md font-bold")
                                                            : isDarkMode
                                                                ? "bg-white/5 text-white/70 border-white/10 hover:bg-white/10 hover:text-white hover:border-white/20"
                                                                : "bg-black/5 text-black/70 border-black/10 hover:bg-black/10 hover:text-black hover:border-black/20"
                                                            }`}
                                                    >
                                                        <img
                                                            src={style.sample}
                                                            alt=""
                                                            className={`w-4 h-4 md:w-5 md:h-5 rounded-full object-cover flex-shrink-0 transition-transform duration-300 group-hover:scale-110 border ${isSelected ? "border-black/25" : "border-white/10"
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
                                {rightSidebarTab === "gmail" && showEmployeeView && gmailConnected && (
                                    <div className="mb-2 space-y-1.5">
                                        {/* To: field + Send/Bulk toggle */}
                                        <div className="flex items-center gap-2">
                                            <span className={`text-[9px] font-mono uppercase tracking-widest shrink-0 ${isDarkMode ? "text-white/60" : "text-black/70"}`}>To:</span>
                                            <div className="relative flex-1">
                                                <input
                                                    type="text"
                                                    placeholder="email@example.com or comma,separated,emails"
                                                    value={gmailMailTo}
                                                    onChange={(e) => setGmailMailTo(e.target.value)}
                                                    className={`w-full px-2 py-1.5 text-[10px] font-mono rounded border outline-none transition-all ${isDarkMode
                                                        ? "bg-white/[0.05] border-white/20 text-white placeholder-white/30 focus:border-[#4285F4]/50"
                                                        : "bg-black/[0.04] border-black/30 text-black placeholder-black/50 focus:border-[#4285F4]/70"
                                                        }`}
                                                />
                                            </div>
                                            <button
                                                onClick={() => setGmailMailTo("")}
                                                className={`p-1.5 rounded transition-all ${isDarkMode ? "hover:bg-white/10 text-white/50" : "hover:bg-black/10 text-black/60"}`}
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
                                                    ? "border-white/25 text-white/70 hover:border-white/40 hover:text-white"
                                                    : "border-black/30 text-black/80 hover:border-black/50 hover:text-black"
                                                    }`}
                                            >
                                                <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M22 2L11 13" /><path d="M22 2L15 22l-4-9-9-4z" />
                                                </svg>
                                                Send
                                            </button>
                                            <button
                                                onClick={() => {
                                                    const next = !gmailAutoOn;
                                                    setGmailAutoOn(next);
                                                    if (next) setGmailAutoShowModal(true);
                                                }}
                                                className={`flex items-center gap-1 px-2.5 py-1.5 text-[8px] font-mono uppercase tracking-[0.15em] border rounded-md transition-all ${gmailAutoOn
                                                    ? (isDarkMode ? "bg-accent/20 border-accent text-accent" : "bg-accent/15 border-accent text-accent")
                                                    : (isDarkMode ? "border-white/25 text-white/70 hover:border-white/40 hover:text-white" : "border-black/30 text-black/80 hover:border-black/50 hover:text-black")
                                                    }`}
                                            >
                                                <svg className={`h-3 w-3 ${gmailAutoOn ? "text-accent" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
                                                    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                                                </svg>
                                                {gmailAutoOn ? "Auto ON" : "Auto"}
                                            </button>
                                            <button
                                                onClick={() => setGmailBulkModal(true)}
                                                disabled={gmailSending}
                                                className={`flex items-center gap-1 px-2.5 py-1.5 text-[8px] font-mono uppercase tracking-[0.15em] border rounded-md transition-all disabled:opacity-30 ${isDarkMode
                                                    ? "border-white/25 text-white/70 hover:border-white/40 hover:text-white"
                                                    : "border-black/30 text-black/80 hover:border-black/50 hover:text-black"
                                                    }`}
                                            >
                                                <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                                </svg>
                                                Bulk
                                            </button>
                                            {gmailSendResult && (
                                                <span className={`text-[9px] font-mono font-semibold ${gmailSendResult.includes("✓") ? "text-green-600" : "text-red-500"}`}>{gmailSendResult}</span>
                                            )}
                                            {gmailAutoOn && !gmailAutoStatus && !gmailSendResult && (
                                                <span className="flex items-center gap-1 text-[8px] font-mono font-semibold text-accent">
                                                    <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
                                                    Watching{gmailAutoMode === "to" ? ` ${gmailAutoTargetEmail}` : ""}...
                                                </span>
                                            )}
                                            {gmailAutoStatus && !gmailSendResult && (
                                                <span className={`text-[9px] font-mono font-semibold ${gmailAutoStatus.includes("✓") ? "text-green-600" : "text-red-500"}`}>{gmailAutoStatus}</span>
                                            )}
                                        </div>
                                    </div>
                                )}







                                {renderInputContainer(false)}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Right Sidebar */}
            {false && (
                <aside
                    style={{ width: isRightSidebarCollapsed ? (isMobile ? "0px" : "72px") : (isMobile ? "280px" : `${rightSidebarWidth}px`) }}
                    className={`h-full border-l-2 ${isRightSidebarCollapsed && isMobile ? "border-l-0" : isDarkMode ? "border-white/10" : "border-black/10"} ${isDarkMode ? "bg-[#0d0d0c]" : "bg-[#f9f9f8]"} flex flex-col ${isMobile ? "fixed right-0 top-0 bottom-0 h-[100dvh] z-[60] shadow-2xl" : "relative z-20"} transition-[width] duration-300 ease-in-out ${isResizingRight ? "transition-none" : ""}`}
                >
                    {!isRightSidebarCollapsed ? (
                        <div className="flex flex-col h-full overflow-hidden">
                            {/* Tab Bar */}
                            <div className={`flex border-b ${isDarkMode ? "border-white/10" : "border-black/10"} shrink-0`}>
                                <button
                                    onClick={() => setRightSidebarTab("usage")}
                                    className={`flex-1 py-3 text-[9px] font-mono uppercase tracking-[0.2em] transition-all ${rightSidebarTab === "usage"
                                        ? (isDarkMode ? "bg-white text-black font-bold" : "bg-black text-white font-bold")
                                        : (isDarkMode ? "text-white/40 hover:text-white hover:bg-white/5" : "text-black/50 hover:bg-black/5")}`}
                                >
                                    {t("settings")}
                                </button>
                                {!showEmployeeView && (
                                    <button
                                        onClick={() => setRightSidebarTab("wallet")}
                                        className={`flex-1 py-3 text-[9px] font-mono uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-1.5 ${rightSidebarTab === "wallet"
                                            ? (isDarkMode ? "bg-white text-black font-bold" : "bg-black text-white font-bold")
                                            : (isDarkMode ? "text-white/40 hover:text-white hover:bg-white/5" : "text-black/50 hover:bg-black/5")}`}
                                    >
                                        <Wallet className="h-3 w-3" />
                                        {t("wallet")}
                                    </button>
                                )}
                                {showEmployeeView && (
                                    <button
                                        onClick={() => setRightSidebarTab("gmail")}
                                        className={`flex-1 py-3 text-[9px] font-mono uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-1.5 ${rightSidebarTab === "gmail"
                                            ? (isDarkMode ? "bg-white text-black font-bold" : "bg-black text-white font-bold")
                                            : (isDarkMode ? "text-white/40 hover:text-white hover:bg-white/5" : "text-black/50 hover:bg-black/5")}`}
                                    >
                                        <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none">
                                            <rect x="2" y="4" width="20" height="16" rx="2" fill="currentColor" />
                                            <path d="M22 6l-10 7L2 6" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
                                        </svg>
                                        {t("gmail")}
                                    </button>
                                )}
                            </div>

                            <div className={`flex-1 p-8 ${isDarkMode ? "custom-scrollbar" : "light-scrollbar"} overflow-y-auto`}>
                                {rightSidebarTab === "usage" && (
                                    <>
                                        {/* Plan Badge */}
                                        <div className="flex items-start mb-8">
                                            <div className="flex flex-col">
                                                <span className={`text-[8px] font-mono uppercase tracking-[0.3em] ${isDarkMode ? "text-black bg-white px-2 py-0.5" : "text-white bg-black px-2 py-0.5"} mb-1 pl-4`}>{t("active_plan")}</span>
                                                <div className="flex items-stretch gap-2">
                                                    <div className={`flex items-center justify-center ${isDarkMode ? "bg-black border-2 border-white" : "bg-white border-2 border-black"} px-2`}>
                                                        <div className={`h-1.5 w-1.5 rounded-full animate-pulse shadow-[0_0_8px_rgba(var(--brand-accent-rgb),0.5)] ${subscription?.subscription ? 'bg-accent' : 'bg-amber-500'}`} />
                                                    </div>
                                                    <span className={`flex items-center text-xs font-bold ${isDarkMode ? "text-black bg-white px-2 border-2 border-transparent" : "text-white bg-black px-2 border-2 border-transparent"} tracking-widest uppercase`}>
                                                        {isSubscriptionLoading ? t("loading") : (subscription?.subscription?.plan_name || t("free_trial"))}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className={`h-8 w-8 ${isDarkMode ? "bg-white/5 border-white" : "bg-white border-black"} border flex items-center justify-center relative mt-[1px] ml-[6px]`}>
                                                <Clock className={`h-4 w-4 ${isDarkMode ? "text-white" : "text-black"}`} />
                                                <div className={`absolute inset-0 rounded-sm border ${isDarkMode ? 'border-white' : 'border-black'} pointer-events-none`} />
                                            </div>
                                        </div>

                                        {/* School / Enterprise Details */}
                                        {(() => {
                                            const schoolName = getSchoolName()
                                            const enterpriseName = getEnterpriseName()
                                            if (schoolName) {
                                                return (
                                                    <div className={`flex items-center gap-3 mb-6 px-4 py-3 ${isDarkMode ? "bg-white/5" : "bg-black/5"}`}>
                                                        <GraduationCap className={`h-4 w-4 shrink-0 ${isDarkMode ? "text-white/60" : "text-black/60"}`} />
                                                        <div className="flex flex-col min-w-0">
                                                            <span className={`text-[8px] font-mono uppercase tracking-[0.2em] ${isDarkMode ? "text-white/40" : "text-black/40"}`}>{t("school")}</span>
                                                            <span className={`text-[11px] font-bold truncate ${isDarkMode ? "text-white" : "text-black"}`}>{schoolName}</span>
                                                        </div>
                                                    </div>
                                                )
                                            }
                                            if (enterpriseName) {
                                                return (
                                                    <div className={`flex items-center gap-3 mb-6 px-4 py-3 ${isDarkMode ? "bg-white/5" : "bg-black/5"}`}>
                                                        <Building2 className={`h-4 w-4 shrink-0 ${isDarkMode ? "text-white/60" : "text-black/60"}`} />
                                                        <div className="flex flex-col min-w-0">
                                                            <span className={`text-[8px] font-mono uppercase tracking-[0.2em] ${isDarkMode ? "text-white/40" : "text-black/40"}`}>{t("enterprise")}</span>
                                                            <span className={`text-[11px] font-bold truncate ${isDarkMode ? "text-white" : "text-black"}`}>{enterpriseName}</span>
                                                        </div>
                                                    </div>
                                                )
                                            }
                                            return null
                                        })()}

                                        {/* Tokens Remaining Circle */}
                                        <div className="relative w-32 h-32 mx-auto mb-8 flex-shrink-0 overflow-hidden">
                                            <svg className="w-full h-full rotate-[-90deg]" viewBox="0 0 128 128">
                                                <circle cx="64" cy="64" r="58" fill="none" stroke={isDarkMode ? "rgba(0, 221, 221, 0.1)" : "rgba(0, 221, 221, 0.05)"} strokeWidth="6" />
                                                <circle
                                                    cx="64" cy="64" r="58" fill="none"
                                                    stroke={isDarkMode ? "#ffffff" : "#000000"}
                                                    strokeWidth="6"
                                                    strokeDasharray="364"
                                                    strokeDashoffset={String(
                                                        isSubscriptionLoading || !subscription?.subscription?.details?.monthly_tokens
                                                            ? 364
                                                            : 364 - ((subscription.tokens_remaining ?? 0) / subscription.subscription.details.monthly_tokens) * 364
                                                    )}
                                                    strokeLinecap="round"
                                                    className="transition-all duration-1000"
                                                />
                                            </svg>
                                            <div className="absolute inset-0 flex items-center justify-center flex-col">
                                                <span className={`text-lg font-bold ${isDarkMode ? "text-white" : "text-black"}`}>{subscription?.tokens_remaining ?? 0}</span>
                                                <span className={`text-[6px] font-mono uppercase tracking-widest ${isDarkMode ? "text-white/40" : "text-black/40"}`}>{t("tokens_left")}</span>
                                            </div>
                                        </div>

                                        {/* Detailed Metrics */}
                                        <div className="space-y-6">
                                            {/* Chat+Code (Chat + Coding Tokens) */}
                                            <div className="space-y-2">
                                                <div className="flex justify-between text-[8px] font-mono uppercase tracking-widest">
                                                    <span className={isDarkMode ? "text-white/50" : "text-black/50"}>{t("chat_code")}</span>
                                                    <span className={isDarkMode ? "text-white" : "text-black"}>
                                                        {(subscription?.usage?.chat_tokens_used ?? 0) + (subscription?.usage?.coding_tokens_used ?? 0)} / {subscription?.subscription?.details?.monthly_tokens || 1}
                                                    </span>
                                                </div>
                                                <div className={`h-1 w-full ${isDarkMode ? "bg-white/10" : "bg-black/5"} rounded-full overflow-hidden`}>
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{
                                                            width: `${Math.min(100, (((subscription?.usage?.chat_tokens_used ?? 0) + (subscription?.usage?.coding_tokens_used ?? 0)) / (subscription?.subscription?.details?.monthly_tokens || 1)) * 100)}%`
                                                        }}
                                                        className={`h-full ${isDarkMode ? "bg-white" : "bg-black"}`}
                                                    />
                                                </div>
                                            </div>

                                            {/* Images Today */}
                                            <div className="space-y-2">
                                                <div className="flex justify-between text-[8px] font-mono uppercase tracking-widest">
                                                    <span className={isDarkMode ? "text-white/50" : "text-black/50"}>{t("images_today")}</span>
                                                    <span className={isDarkMode ? "text-white" : "text-black"}>
                                                        {subscription?.usage?.daily_images ?? 0} / {subscription?.subscription?.details?.daily_image_limit || 1}
                                                    </span>
                                                </div>
                                                <div className={`h-1 w-full ${isDarkMode ? "bg-white/10" : "bg-black/5"} rounded-full overflow-hidden`}>
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{
                                                            width: `${Math.min(100, ((subscription?.usage?.daily_images ?? 0) / (subscription?.subscription?.details?.daily_image_limit || 1)) * 100)}%`
                                                        }}
                                                        className={`h-full ${isDarkMode ? "bg-white" : "bg-black"}`}
                                                    />
                                                </div>
                                            </div>

                                            {/* TTS Minutes */}
                                            <div className="space-y-2">
                                                <div className="flex justify-between text-[8px] font-mono uppercase tracking-widest">
                                                    <span className={isDarkMode ? "text-white/50" : "text-black/50"}>{t("tts_minutes")}</span>
                                                    <span className={isDarkMode ? "text-white" : "text-black"}>
                                                        {subscription?.usage?.tts_minutes_used ?? 0} / {subscription?.subscription?.details?.tts_minutes_limit || 1}
                                                    </span>
                                                </div>
                                                <div className={`h-1 w-full ${isDarkMode ? "bg-white/10" : "bg-black/5"} rounded-full overflow-hidden`}>
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{
                                                            width: `${Math.min(100, ((subscription?.usage?.tts_minutes_used ?? 0) / (subscription?.subscription?.details?.tts_minutes_limit || 1)) * 100)}%`
                                                        }}
                                                        className={`h-full ${isDarkMode ? "bg-white" : "bg-black"}`}
                                                    />
                                                </div>
                                            </div>

                                            {/* STT Minutes */}
                                            <div className="space-y-2">
                                                <div className="flex justify-between text-[8px] font-mono uppercase tracking-widest">
                                                    <span className={isDarkMode ? "text-white/50" : "text-black/50"}>{t("stt_minutes")}</span>
                                                    <span className={isDarkMode ? "text-white" : "text-black"}>
                                                        {subscription?.usage?.stt_minutes_used ?? 0} / {subscription?.subscription?.details?.stt_minutes_limit || 1}
                                                    </span>
                                                </div>
                                                <div className={`h-1 w-full ${isDarkMode ? "bg-white/10" : "bg-black/5"} rounded-full overflow-hidden`}>
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{
                                                            width: `${Math.min(100, ((subscription?.usage?.stt_minutes_used ?? 0) / (subscription?.subscription?.details?.stt_minutes_limit || 1)) * 100)}%`
                                                        }}
                                                        className={`h-full ${isDarkMode ? "bg-white" : "bg-black"}`}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {!userRole || (userRole as any) === "student" ? (
                                            <Link href="/pricing" className={`block w-full ${isMobile ? "mt-24 mb-10" : "mt-12"}`}>
                                                <button className="upgrade-btn hover:scale-105 hover:shadow-[0_0_30px_rgba(var(--brand-accent-rgb),0.5)] transition-all duration-300">
                                                    <div className="bubble-layer bubble-1"></div>
                                                    <div className="bubble-layer bubble-2"></div>
                                                    <div className="bubble-layer bubble-3"></div>
                                                    <div className="bubble-layer bubble-4"></div>
                                                    <div className="bubble-layer bubble-5"></div>
                                                    <div className="bubble-layer bubble-6"></div>
                                                    <div className="bubble-layer bubble-7"></div>
                                                    <span>{t("upgrade_now")}</span>
                                                </button>
                                            </Link>
                                        ) : null}

                                        {!getSchoolName() && !getEnterpriseName() && userRole !== "global_admin" && (
                                            <div className={`mt-8 ${isMobile ? "mb-10" : ""}`}>
                                                <button
                                                    onClick={handleDiscontinueAccount}
                                                    className={`w-full py-3 text-[9px] font-mono uppercase tracking-[0.2em] transition-all border rounded-md font-bold ${isDarkMode
                                                        ? "border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500 hover:shadow-[0_0_20px_rgba(239,68,68,0.2)]"
                                                        : "border-red-500/30 text-red-600 hover:bg-red-500/5 hover:border-red-500 hover:shadow-[0_0_20px_rgba(239,68,68,0.15)]"}`}
                                                >
                                                    {t("discontinue")}
                                                </button>
                                            </div>
                                        )}
                                    </>
                                )}

                                {rightSidebarTab === "wallet" && !showEmployeeView && (
                                    <WalletPanel isDarkMode={isDarkMode} isMobile={isMobile} />
                                )}

                                {rightSidebarTab === "gmail" && showEmployeeView && (
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
                                                                <rect x="2" y="4" width="20" height="16" rx="2" fill="#EA4335" />
                                                                <path d="M22 6l-10 7L2 6" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
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
                                            <div className={`shrink-0 mt-4 pt-4 border-t sticky bottom-0 ${isDarkMode ? "border-white/10 bg-[#0a0a0a]" : "border-black/10 bg-white"}`}>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className={`p-1.5 rounded-lg ${isDarkMode ? "bg-[#EA4335]/10" : "bg-[#EA4335]/15"}`}>
                                                            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                                                                <rect x="2" y="4" width="20" height="16" rx="2" fill="#EA4335" />
                                                                <path d="M22 6l-10 7L2 6" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
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
                        <div className="flex flex-col h-full items-center py-6 overflow-y-auto overflow-x-hidden w-full">
                            {/* Top: Plan Indicator using Clock icon from the Plan Badge */}
                            <div className="flex flex-col items-center gap-6 w-full px-2">
                                <div
                                    title={`${t("active_plan")}: ${isSubscriptionLoading ? t("loading") : (subscription?.subscription?.plan_name || t("free_trial"))}`}
                                    className={`h-8 w-8 ${isDarkMode ? "bg-white/5 border-white" : "bg-white border-black"} border flex items-center justify-center relative cursor-help`}
                                >
                                    <Clock className={`h-4 w-4 ${isDarkMode ? "text-white" : "text-black"}`} />
                                    <div className={`absolute inset-0 rounded-sm border ${isDarkMode ? 'border-white' : 'border-black'} pointer-events-none`} />
                                </div>

                                {!showEmployeeView && (
                                    <button
                                        onClick={() => { setRightSidebarTab("wallet"); setIsRightSidebarCollapsed(false) }}
                                        title={t("wallet")}
                                        className={`h-8 w-8 ${isDarkMode ? "bg-white/5 border-white" : "bg-white border-black"} border flex items-center justify-center relative cursor-pointer hover:scale-110 transition-all ${rightSidebarTab === "wallet" && !isRightSidebarCollapsed ? "ring-1 ring-white" : ""}`}
                                    >
                                        <Wallet className={`h-4 w-4 ${isDarkMode ? "text-white" : "text-black"}`} />
                                    </button>
                                )}
                                {showEmployeeView && (
                                    <button
                                        onClick={() => { setRightSidebarTab("gmail"); setIsRightSidebarCollapsed(false) }}
                                        title={t("gmail")}
                                        className={`h-8 w-8 ${isDarkMode ? "bg-white/5 border-white" : "bg-white border-black"} border flex items-center justify-center relative cursor-pointer hover:scale-110 transition-all ${rightSidebarTab === "gmail" && !isRightSidebarCollapsed ? "ring-1 ring-white" : ""}`}
                                    >
                                        <svg className={`h-4 w-4 ${gmailConnected ? "text-accent" : (isDarkMode ? "text-white" : "text-black")}`} viewBox="0 0 24 24" fill="none">
                                            <rect x="2" y="4" width="20" height="16" rx="2" fill="currentColor" />
                                            <path d="M22 6l-10 7L2 6" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
                                        </svg>
                                    </button>
                                )}

                                <div className={`h-[1px] w-8 ${isDarkMode ? "bg-white/10" : "bg-black/10"}`} />
                            </div>

                            {/* Upgrade Button right below Wallet/Mail */}
                            {(!userRole || (userRole as any) === "student") && (
                                <div className="w-full flex items-center justify-center px-2 pt-[21px] pb-4">
                                    <Link href="/pricing" title={t("upgrade_now")} className="block cursor-pointer">
                                        <button className={`upgrade-btn h-11 w-11 flex items-center justify-center rounded-none hover:scale-115 active:scale-95 transition-all duration-300 relative overflow-hidden border-2 ${isDarkMode ? "border-white" : "border-black"} shadow-md shadow-[rgba(var(--brand-accent-rgb),0.2)]`}>
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
                            )}

                            {/* Middle: Live Usage Progress Circle using ChatLoader */}
                            <div className="flex flex-col items-center gap-6 w-full">
                                <div
                                    title={`Tokens: ${subscription?.tokens_remaining ?? 0} / ${subscription?.subscription?.details?.monthly_tokens || 1}`}
                                    className="relative w-12 h-12 flex items-center justify-center cursor-help"
                                >
                                    <svg className="w-full h-full rotate-[-90deg] absolute">
                                        <circle cx="24" cy="24" r="20" fill="none" stroke={isDarkMode ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)"} strokeWidth="3" />
                                        <circle
                                            cx="24" cy="24" r="20" fill="none"
                                            stroke={isDarkMode ? "#ffffff" : "#000000"}
                                            strokeWidth="3"
                                            strokeDasharray="125.6"
                                            strokeDashoffset={String(
                                                isSubscriptionLoading || !subscription?.subscription?.details?.monthly_tokens
                                                    ? 125.6
                                                    : 125.6 - ((subscription.tokens_remaining ?? 0) / subscription.subscription.details.monthly_tokens) * 125.6
                                            )}
                                            strokeLinecap="round"
                                            className="transition-all duration-1000 drop-shadow-[0_0_4px_rgba(var(--brand-accent-rgb),0.5)]"
                                        />
                                    </svg>
                                    <div className="scale-[0.6] flex items-center justify-center" />
                                </div>

                                {/* Chat+Code (Chat + Coding Tokens) Metric */}
                                <div
                                    title={`${t("chat_code")}: ${(subscription?.usage?.chat_tokens_used ?? 0) + (subscription?.usage?.coding_tokens_used ?? 0)} / ${subscription?.subscription?.details?.monthly_tokens || 1}`}
                                    className="flex flex-col items-center gap-0.5 cursor-help"
                                >
                                    <span className={`text-[9px] font-mono font-black ${isDarkMode ? "text-white/40" : "text-black/40"}`}>
                                        {t("chat_code")}
                                    </span>
                                    <span className={`text-[10px] font-mono font-bold ${isDarkMode ? "text-white" : "text-black"}`}>
                                        {(subscription?.usage?.chat_tokens_used ?? 0) + (subscription?.usage?.coding_tokens_used ?? 0)}
                                    </span>
                                </div>

                                {/* IMG (Images Today) Metric */}
                                <div
                                    title={`${t("images_today")}: ${subscription?.usage?.daily_images ?? 0} / ${subscription?.subscription?.details?.daily_image_limit || 1}`}
                                    className="flex flex-col items-center gap-0.5 cursor-help"
                                >
                                    <span className={`text-[9px] font-mono font-black ${isDarkMode ? "text-white/40" : "text-black/40"}`}>
                                        {t("img_label")}
                                    </span>
                                    <span className={`text-[10px] font-mono font-bold ${isDarkMode ? "text-white" : "text-black"}`}>
                                        {subscription?.usage?.daily_images ?? 0}
                                    </span>
                                </div>

                                {/* TTS Metric */}
                                <div
                                    title={`${t("tts_minutes")}: ${subscription?.usage?.tts_minutes_used ?? 0} / ${subscription?.subscription?.details?.tts_minutes_limit || 1}`}
                                    className="flex flex-col items-center gap-0.5 cursor-help"
                                >
                                    <span className={`text-[9px] font-mono font-black ${isDarkMode ? "text-white/40" : "text-black/40"}`}>
                                        {t("tts_label")}
                                    </span>
                                    <span className={`text-[10px] font-mono font-bold ${isDarkMode ? "text-white" : "text-black"}`}>
                                        {subscription?.usage?.tts_minutes_used ?? 0}
                                    </span>
                                </div>

                                {/* STT Metric */}
                                <div
                                    title={`${t("stt_minutes")}: ${subscription?.usage?.stt_minutes_used ?? 0} / ${subscription?.subscription?.details?.stt_minutes_limit || 1}`}
                                    className="flex flex-col items-center gap-0.5 cursor-help"
                                >
                                    <span className={`text-[9px] font-mono font-black ${isDarkMode ? "text-white/40" : "text-black/40"}`}>
                                        {t("stt_label")}
                                    </span>
                                    <span className={`text-[10px] font-mono font-bold ${isDarkMode ? "text-white" : "text-black"}`}>
                                        {subscription?.usage?.stt_minutes_used ?? 0}
                                    </span>
                                </div>
                            </div>

                        </div>
                    )}

                    {/* Right Toggle Button */}
                    <motion.button
                        id="walkthrough-right-sidebar-toggle"
                        onClick={() => {
                            const newCollapsed = !isRightSidebarCollapsed;
                            setIsRightSidebarCollapsed(newCollapsed);
                            if (!newCollapsed) {
                                setIsSidebarCollapsed(true);
                            }
                        }}
                        whileHover={{ scale: 1.15 }}
                        whileTap={{ scale: 0.85 }}
                        className={`absolute top-1/2 -translate-y-1/2 z-50 p-2 bg-[#0a0a0a] border border-white text-white/40 hover:text-white hover:shadow-[0_0_15px_rgba(255,255,255,0.3)] transition-all rounded-full shadow-xl shadow-black/20 toggle-btn-right ${isMobile ? "hidden" : ""}`}
                        style={isMobile && isRightSidebarCollapsed ? { right: "0.8rem" } : { left: isRightSidebarCollapsed ? "-2.2rem" : "-0.95rem" }}
                    >
                        {isRightSidebarCollapsed ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                    </motion.button>
                </aside>
            )}

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
                                : "bg-white border-black/10"
                                }`}
                        >
                            {/* Header */}
                            <div className={`sticky top-0 z-10 flex items-center justify-between p-4 border-b ${isDarkMode ? "border-white/10 bg-[#0a0a0a]" : "border-black/10 bg-white"}`}>
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className={`p-1.5 rounded-lg shrink-0 ${isDarkMode ? "bg-[#EA4335]/10" : "bg-[#EA4335]/15"}`}>
                                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
                                            <rect x="2" y="4" width="20" height="16" rx="2" fill="#EA4335" />
                                            <path d="M22 6l-10 7L2 6" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
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

            {/* Note Editor Modal / Popup */}
            {isNoteEditorOpen && selectedNote && (
                <div
                    style={
                        isNotePopup && !isNoteMaximized
                            ? {
                                  position: "fixed",
                                  left: `${notePopupPosition.x}px`,
                                  top: `${notePopupPosition.y}px`,
                                  width: `${notePopupSize.width}px`,
                                  height: `${notePopupSize.height}px`,
                                  zIndex: 100,
                              }
                            : undefined
                    }
                    className={
                        isNoteMaximized
                            ? "fixed inset-0 z-[100] flex flex-col bg-[#0d0d0c] text-white"
                            : isNotePopup
                            ? "flex flex-col rounded-2xl border shadow-2xl overflow-hidden bg-[#161615] border-white/10 text-white"
                            : "fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                    }
                >
                    {/* Styles for Notebook ruling lines */}
                    <style dangerouslySetInnerHTML={{__html: `
                        .notes-ruled-light {
                            background-image: linear-gradient(rgba(0, 0, 0, 0) calc(100% - 1px), rgba(33, 150, 243, 0.15) calc(100% - 1px)) !important;
                            background-size: 100% ${noteLineSpacing * 16}px !important;
                            background-repeat: repeat !important;
                            background-position: 0 0 !important;
                            background-origin: content-box !important;
                        }
                        .notes-ruled-light, .notes-ruled-light * {
                            line-height: ${noteLineSpacing * 16}px !important;
                        }
                        .notes-ruled-dark {
                            background-image: linear-gradient(rgba(0, 0, 0, 0) calc(100% - 1px), rgba(255, 255, 255, 0.08) calc(100% - 1px)) !important;
                            background-size: 100% ${noteLineSpacing * 16}px !important;
                            background-repeat: repeat !important;
                            background-position: 0 0 !important;
                            background-origin: content-box !important;
                        }
                        .notes-ruled-dark, .notes-ruled-dark * {
                            line-height: ${noteLineSpacing * 16}px !important;
                        }
                        .notes-ruled-light font[size="1"], .notes-ruled-dark font[size="1"], .note-content font[size="1"] { font-size: 10px; line-height: normal !important; }
                        .notes-ruled-light font[size="2"], .notes-ruled-dark font[size="2"], .note-content font[size="2"] { font-size: 13px; line-height: normal !important; }
                        .notes-ruled-light font[size="3"], .notes-ruled-dark font[size="3"], .note-content font[size="3"] { font-size: 16px; line-height: normal !important; }
                        .notes-ruled-light font[size="4"], .notes-ruled-dark font[size="4"], .note-content font[size="4"] { font-size: 18px; line-height: normal !important; }
                        .notes-ruled-light font[size="5"], .notes-ruled-dark font[size="5"], .note-content font[size="5"] { font-size: 24px; line-height: 1.4 !important; }
                        .notes-ruled-light font[size="6"], .notes-ruled-dark font[size="6"], .note-content font[size="6"] { font-size: 32px; line-height: 1.3 !important; }
                        .notes-ruled-light font[size="7"], .notes-ruled-dark font[size="7"], .note-content font[size="7"] { font-size: 48px; line-height: 1.2 !important; }

                        .notes-ruled-light img, .notes-ruled-dark img {
                            line-height: normal !important;
                        }
                        .note-bg-swatch-white { border: 1px solid rgba(255,255,255,0.3) !important; }
                        .note-bg-swatch-light { border: 1px solid rgba(0,0,0,0.15) !important; }
                        .note-bg-swatch-dark { border: 1px solid rgba(255,255,255,0.3) !important; }
                        .note-resize-handle { opacity: 0.3; }
                        .note-resize-handle:hover { opacity: 0.8; }
                        .note-resize-handle-right, .note-resize-handle-left { width: 6px; }
                        .note-resize-handle-top, .note-resize-handle-bottom { height: 6px; }
                        .note-content ul {
                            padding-left: 24px !important;
                            margin: 4px 0 !important;
                            list-style-type: disc !important;
                        }
                        .note-content ol {
                            padding-left: 24px !important;
                            margin: 4px 0 !important;
                            list-style-type: decimal !important;
                        }
                        .note-content li {
                            margin: 2px 0 !important;
                            list-style-position: outside !important;
                        }
                        .note-content ul ul { list-style-type: circle !important; }
                        .note-content ul ul ul { list-style-type: square !important; }
                        .note-content ol ol { list-style-type: lower-alpha !important; }
                        .note-content ol ol ol { list-style-type: lower-roman !important; }
                    `}} />

                    {/* Modal container wrapper for non-popup mode */}
                    <div
                        className={
                            isNoteMaximized || isNotePopup
                                ? "flex-1 flex flex-col min-h-0 h-full w-full"
                                : "w-full max-w-4xl h-[85vh] flex flex-col rounded-2xl border shadow-2xl overflow-hidden bg-[#161615] border-white/10 text-white"
                        }
                    >
                        {/* Header bar (Draggable if popped out) */}
                        <div
                            onPointerDown={(e) => {
                                if (isNotePopup && !isNoteMaximized) {
                                    if ((e.target as HTMLElement).closest("button") || (e.target as HTMLElement).closest("input") || (e.target as HTMLElement).closest("select")) return;
                                    setIsDraggingNote(true);
                                    setNoteDragOffset({
                                        x: e.clientX - notePopupPosition.x,
                                        y: e.clientY - notePopupPosition.y,
                                    });
                                }
                            }}
                            className={`flex items-center justify-between px-4 py-3 border-b select-none shrink-0 ${
                                isNotePopup && !isNoteMaximized ? "cursor-move" : ""
                            } border-white/10 bg-white/5`}
                        >
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                                <FileIcon className="w-4 h-4 text-blue-500 shrink-0" />
                                <input
                                    type="text"
                                    value={editorTitle}
                                    onChange={(e) => {
                                        setEditorTitle(e.target.value);
                                        void handleUpdateNote(selectedNote.id, { title: e.target.value });
                                    }}
                                    className="bg-transparent text-xs font-sans font-semibold focus:outline-none border-b border-transparent hover:border-zinc-500 focus:border-blue-500 w-full truncate text-white"
                                    placeholder="Note Title"
                                />
                            </div>
                            
                            <div className="flex items-center gap-1.5 ml-4 shrink-0">
                                {/* Popup / Dock Toggle */}
                                <button
                                    onClick={() => setIsNotePopup(!isNotePopup)}
                                    className="p-1.5 rounded-lg transition-colors hover:bg-white/10 text-white/70"
                                    title={isNotePopup ? "Dock window" : "Pop out window"}
                                >
                                    {isNotePopup ? (
                                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M9 17h6" /></svg>
                                    ) : (
                                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M21 15v6h-6M21 21L14 14" /></svg>
                                    )}
                                </button>

                                {/* Maximize Toggle */}
                                <button
                                    onClick={() => setIsNoteMaximized(!isNoteMaximized)}
                                    className="p-1.5 rounded-lg transition-colors hover:bg-white/10 text-white/70"
                                    title={isNoteMaximized ? "Restore screen size" : "Maximize screen size"}
                                >
                                    {isNoteMaximized ? (
                                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 14h6v6M20 10h-6V4M14 10l7-7M10 14l-7 7" /></svg>
                                    ) : (
                                        <Maximize2 className="w-3.5 h-3.5" />
                                    )}
                                </button>

                                {/* Close Button */}
                                 <button
                                     onClick={() => {
                                         setIsNoteEditorOpen(false);
                                         setSelectedNote(null);
                                         stopAllAudio();
                                     }}
                                    className="p-1.5 rounded-lg transition-colors hover:bg-white/10 text-white/70 hover:text-red-500"
                                    title="Close note"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>

                        {/* Rich Formatting Toolbar */}
                        <div className="flex flex-wrap items-center gap-1.5 px-3 py-2 border-b shrink-0 border-white/10 bg-zinc-900">
                            {/* Font Family Selection */}
                            <select
                                onChange={(e) => document.execCommand("fontName", false, e.target.value)}
                                className="text-[11px] rounded border px-1.5 py-1 outline-none bg-zinc-800 border-white/10 text-white"
                                title="Font Family"
                            >
                                <option value="Edu NSW ACT Cursive, cursive">Edu NSW ACT Cursive (Chat Headings)</option>
                                <option value="Poppins, sans-serif">Poppins (Heading)</option>
                                <option value="Roboto, sans-serif">Roboto (Body)</option>
                                <option value="Space Grotesk, sans-serif">Space Grotesk (Accent)</option>
                                <option value="sans-serif">System Sans</option>
                                <option value="serif">System Serif</option>
                                <option value="monospace">System Monospace</option>
                            </select>

                            {/* Font Size Selector */}
                            <select
                                onChange={(e) => {
                                    document.execCommand("fontSize", false, e.target.value);
                                }}
                                className="text-[11px] rounded border px-1.5 py-1 outline-none bg-zinc-800 border-white/10 text-white"
                                title="Font Size"
                            >
                                <option value="1">Small</option>
                                <option value="3" selected>Normal</option>
                                <option value="5">Large</option>
                                <option value="7">Extra Large</option>
                            </select>

                            {/* Font Size Increase / Decrease (Selected Text Only) */}
                            <button
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => {
                                    let currentSize = 3; // default normal
                                    try {
                                        const val = document.queryCommandValue("fontSize");
                                        if (val) {
                                            currentSize = parseInt(val, 10) || 3;
                                        }
                                    } catch (e) {
                                        console.error(e);
                                    }
                                    const newSize = Math.min(currentSize + 1, 7);
                                    document.execCommand("fontSize", false, String(newSize));
                                }}
                                className="px-2 py-1 text-xs font-bold rounded text-white hover:bg-white/10"
                                title="Increase font size of selected text"
                            >
                                A+
                            </button>
                            <button
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => {
                                    let currentSize = 3; // default normal
                                    try {
                                        const val = document.queryCommandValue("fontSize");
                                        if (val) {
                                            currentSize = parseInt(val, 10) || 3;
                                        }
                                    } catch (e) {
                                        console.error(e);
                                    }
                                    const newSize = Math.max(currentSize - 1, 1);
                                    document.execCommand("fontSize", false, String(newSize));
                                }}
                                className="px-2 py-1 text-xs font-bold rounded text-white hover:bg-white/10"
                                title="Decrease font size of selected text"
                            >
                                A-
                            </button>

                            {/* Line Spacing Increase / Decrease */}
                            <button
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => {
                                    setNoteLineSpacing((prev) => Math.round((prev + 0.2) * 10) / 10);
                                }}
                                className="px-2 py-1 text-xs font-bold rounded text-white hover:bg-white/10"
                                title="Increase line spacing"
                            >
                                <span style={{lineHeight:1}}>⊞</span>
                            </button>
                            <button
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => {
                                    setNoteLineSpacing((prev) => Math.max(Math.round((prev - 0.2) * 10) / 10, 1.0));
                                }}
                                className="px-2 py-1 text-xs font-bold rounded text-white hover:bg-white/10"
                                title="Decrease line spacing"
                            >
                                <span style={{lineHeight:1}}>⊟</span>
                            </button>

                            {/* Bold */}
                            <button
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => document.execCommand("bold")}
                                className="px-2 py-1 text-xs font-bold rounded text-white hover:bg-white/10"
                                title="Bold (Ctrl+B)"
                            >
                                <b>B</b>
                            </button>

                            {/* Italic */}
                            <button
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => document.execCommand("italic")}
                                className="px-2 py-1 text-xs italic rounded text-white hover:bg-white/10"
                                title="Italic (Ctrl+I)"
                            >
                                <i>I</i>
                            </button>

                            {/* Underline */}
                            <button
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => document.execCommand("underline")}
                                className="px-2 py-1 text-xs underline rounded text-white hover:bg-white/10"
                                title="Underline (Ctrl+U)"
                            >
                                <u>U</u>
                            </button>

                            {/* Strikethrough */}
                            <button
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => document.execCommand("strikeThrough")}
                                className="px-2 py-1 text-xs rounded text-white hover:bg-white/10"
                                title="Strikethrough"
                            >
                                <s>S</s>
                            </button>

                            <div className="w-px h-5 bg-zinc-700 mx-0.5" />

                            {/* Ordered List */}
                            <button
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => {
                                    document.execCommand("insertOrderedList");
                                }}
                                className="px-2 py-1 text-[11px] rounded text-white hover:bg-white/10"
                                title="Numbered List"
                            >
                                1.
                            </button>

                            {/* Unordered List */}
                            <button
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => {
                                    document.execCommand("insertUnorderedList");
                                }}
                                className="px-2 py-1 text-[11px] rounded text-white hover:bg-white/10"
                                title="Bullet List"
                            >
                                •
                            </button>

                            {/* Indent */}
                            <button
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => document.execCommand("indent")}
                                className="px-2 py-1 text-[11px] rounded text-white hover:bg-white/10"
                                title="Increase Indent"
                            >
                                <span className="text-xs">→</span>
                            </button>

                            {/* Outdent */}
                            <button
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => document.execCommand("outdent")}
                                className="px-2 py-1 text-[11px] rounded text-white hover:bg-white/10"
                                title="Decrease Indent"
                            >
                                <span className="text-xs">←</span>
                            </button>

                            <div className="w-px h-5 bg-zinc-700 mx-0.5" />

                            {/* Alignment buttons */}
                            <button
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => document.execCommand("justifyLeft")}
                                className="px-2 py-1 text-[11px] rounded text-white hover:bg-white/10"
                                title="Align Left"
                            >
                                ═╌
                            </button>
                            <button
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => document.execCommand("justifyCenter")}
                                className="px-2 py-1 text-[11px] rounded text-white hover:bg-white/10"
                                title="Align Center"
                            >
                                ═══
                            </button>
                            <button
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => document.execCommand("justifyRight")}
                                className="px-2 py-1 text-[11px] rounded text-white hover:bg-white/10"
                                title="Align Right"
                            >
                                ═╌
                            </button>

                            <div className="w-px h-5 bg-zinc-700 mx-0.5" />

                            {/* Text Color Picker */}
                            <div className="flex items-center">
                                <Palette className="w-3.5 h-3.5 mr-1 text-zinc-400" />
                                <input
                                    type="color"
                                    onChange={(e) => document.execCommand("foreColor", false, e.target.value)}
                                    className="w-4 h-4 border border-zinc-500 rounded cursor-pointer"
                                    title="Text Color"
                                />
                            </div>

                            <div className="w-px h-5 bg-zinc-700 mx-0.5" />

                            {/* Insert Table */}
                            <button
                                onClick={() => {
                                    if (!noteEditorRef.current) return;
                                    noteEditorRef.current.focus();
                                    document.execCommand("insertHTML", false, '<table style="width:100%;border-collapse:collapse;border:1px solid #555;margin:6px 0"><thead><tr><th style="border:1px solid #555;padding:4px">Header 1</th><th style="border:1px solid #555;padding:4px">Header 2</th></tr></thead><tbody><tr><td style="border:1px solid #555;padding:4px">Cell 1</td><td style="border:1px solid #555;padding:4px">Cell 2</td></tr></tbody></table><br>');
                                }}
                                className="flex items-center gap-1 py-1.5 px-2 text-[11px] font-sans font-medium rounded transition-all bg-white/5 border border-white/10 text-white hover:bg-white/10"
                                title="Insert Table"
                            >
                                ▦ <span>Table</span>
                            </button>

                            {/* Insert Horizontal Rule / Line */}
                            <button
                                onClick={() => {
                                    if (!noteEditorRef.current) return;
                                    noteEditorRef.current.focus();
                                    const sep = document.createElement("div");
                                    sep.style.cssText = "border-top:1px solid rgba(255,255,255,0.2);margin:12px 0;height:0;pointer-events:none";
                                    sep.contentEditable = "false";
                                    document.execCommand("insertHTML", false, sep.outerHTML + "<br>");
                                }}
                                className="flex items-center gap-1 py-1.5 px-2 text-[11px] font-sans font-medium rounded transition-all bg-white/5 border border-white/10 text-white hover:bg-white/10"
                                title="Insert regular line"
                            >
                                ─ <span>Line</span>
                            </button>
                            <button
                                onClick={() => {
                                    if (!noteEditorRef.current) return;
                                    noteEditorRef.current.focus();
                                    document.execCommand("insertHTML", false, '<div style="border-top:1px dashed rgba(255,255,255,0.3);margin:12px 0;height:0;pointer-events:none" contenteditable="false"></div><br>');
                                }}
                                className="flex items-center gap-1 py-1.5 px-2 text-[11px] font-sans font-medium rounded transition-all bg-white/5 border border-white/10 text-white hover:bg-white/10"
                                title="Insert dotted line"
                            >
                                ┈ <span>Dotted</span>
                            </button>

                            <div className="w-px h-5 bg-zinc-700 mx-0.5" />

                            {/* Speech-to-Text Mic Button — also used to ask while podcasting */}
                            <button
                                onClick={isNoteRecording ? stopNoteRecording : startNoteRecording}
                                className={`flex items-center gap-1.5 py-1.5 px-2 text-[11px] font-sans font-medium rounded transition-all ${
                                    isNoteTranscribing
                                        ? "bg-blue-500 text-white"
                                        : isNoteRecording
                                        ? "bg-red-500 text-white animate-pulse"
                                        : isNoteTTSPlaying || isPodcastAnswering
                                        ? "bg-blue-500 text-white border border-blue-400"
                                        : "bg-white/5 border border-white/10 text-white hover:bg-white/10"
                                }`}
                                title={
                                    isNoteTranscribing ? "Transcribing..." :
                                    isNoteRecording ? "Stop recording" :
                                    isNoteTTSPlaying || isPodcastAnswering ? "Ask a question" :
                                    "Voice input (STT)"
                                }
                                disabled={isNoteTranscribing}
                            >
                                {isNoteTranscribing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> :
                                 isNoteRecording ? <MicOff className="w-3.5 h-3.5" /> :
                                 <Mic className="w-3.5 h-3.5" />}
                                <span>
                                    {isNoteTranscribing ? "Transcribing..." :
                                     isPodcastAnswering ? "Answering..." :
                                     isPodcastAsking ? "Asking..." :
                                     isNoteRecording ? "Recording..." :
                                     isNoteTTSPlaying ? "Ask" : "STT"}
                                </span>
                            </button>

                            {/* Podcast Play / Stop / Resume Button */}
                            <button
                                onClick={() => {
                                    if (pendingResumePodcast && !isPodcastAnswering) {
                                        setPendingResumePodcast(false);
                                        playNotePodcast();
                                    } else {
                                        playNotePodcast();
                                    }
                                }}
                                className={`flex items-center gap-1.5 py-1.5 px-2 text-[11px] font-sans font-medium rounded transition-all ${
                                    isPodcastGenerating
                                        ? "bg-emerald-500 text-white"
                                        : isPodcastAnswering
                                        ? "bg-amber-500 text-white"
                                        : isNoteTTSPlaying
                                        ? "bg-emerald-500 text-white animate-pulse"
                                        : pendingResumePodcast
                                        ? "bg-emerald-500 text-white"
                                        : "bg-white/5 border border-white/10 text-white hover:bg-white/10"
                                }`}
                                title={
                                    isPodcastGenerating ? "Generating audio..." :
                                    isPodcastAnswering ? "Click to stop answer" :
                                    isNoteTTSPlaying ? "Stop podcast" :
                                    pendingResumePodcast ? "Resume podcast" :
                                    "Play note as podcast"
                                }
                                disabled={isPodcastGenerating}
                            >
                                {isPodcastGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> :
                                 <Headphones className="w-3.5 h-3.5" />}
                                <span>
                                    {isPodcastGenerating ? "Generating..." :
                                     isPodcastAnswering ? "Answering..." :
                                     isNoteTTSPlaying ? `Podcast...` :
                                     pendingResumePodcast ? "Resume" : "Podcast"}
                                </span>
                            </button>

                            {/* Draw Diagram Whiteboard Toggle */}
                            <button
                                onClick={() => setShowWhiteboard(!showWhiteboard)}
                                className={`flex items-center gap-1.5 py-1.5 px-2 text-[11px] font-sans font-medium rounded transition-all ${
                                    showWhiteboard
                                        ? "bg-blue-500 text-white"
                                        : "bg-white/5 border border-white/10 text-white hover:bg-white/10"
                                }`}
                                title="Draw whiteboard diagram sketch"
                            >
                                <Pencil className="w-3.5 h-3.5" />
                                <span>Draw</span>
                            </button>

                            {/* Image Insert Button with dropdown */}
                            <div className="relative">
                                <button
                                    onClick={() => setShowImageInsertOptions(!showImageInsertOptions)}
                                    className={`flex items-center gap-1.5 py-1.5 px-2 text-[11px] font-sans font-medium rounded transition-all ${
                                        showImageInsertOptions
                                            ? "bg-blue-500 text-white"
                                            : "bg-white/5 border border-white/10 text-white hover:bg-white/10"
                                    }`}
                                    title="Insert Image"
                                >
                                    <ImageIcon className="w-3.5 h-3.5" />
                                    <span>Image</span>
                                </button>
                                {showImageInsertOptions && (
                                    <div className="absolute top-full left-0 mt-1 w-44 rounded-lg border border-white/10 bg-zinc-800 shadow-2xl z-50 overflow-hidden">
                                        <button
                                            onClick={() => {
                                                setShowImageInsertOptions(false);
                                                deviceFileInputRef.current?.click();
                                            }}
                                            className="w-full flex items-center gap-2 px-3 py-2 text-[11px] text-left text-white hover:bg-white/10 transition-colors"
                                        >
                                            <Upload className="w-3.5 h-3.5" />
                                            <span>Upload from Device</span>
                                        </button>
                                        <button
                                            onClick={async () => {
                                                setShowImageInsertOptions(false);
                                                try {
                                                    const { getLibraryAssets } = await import("@/lib/chat-api");
                                                    const res = await getLibraryAssets();
                                                    if (res.success && res.assets) {
                                                        const images = res.assets.filter((a: any) => a.asset_type === "image");
                                                        if (images.length === 0) {
                                                            toast.error("No images in your library.");
                                                            return;
                                                        }
                                                        setLibraryAssets(images);
                                                        setShowLibraryPicker(true);
                                                    } else {
                                                        toast.error("No images in your library.");
                                                    }
                                                } catch {
                                                    toast.error("Failed to load image library.");
                                                }
                                            }}
                                            className="w-full flex items-center gap-2 px-3 py-2 text-[11px] text-left text-white hover:bg-white/10 transition-colors"
                                        >
                                            <FolderOpen className="w-3.5 h-3.5" />
                                            <span>Image Library</span>
                                        </button>
                                        <button
                                            onClick={() => {
                                                setShowImageInsertOptions(false);
                                                setShowImageGenerate(true);
                                            }}
                                            className="w-full flex items-center gap-2 px-3 py-2 text-[11px] text-left text-white hover:bg-white/10 transition-colors"
                                        >
                                            <Sparkles className="w-3.5 h-3.5" />
                                            <span>Generate AI Image</span>
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Hidden device file input (images, text, PDFs) */}
                            <input
                                ref={deviceFileInputRef}
                                type="file"
                                accept="image/*,.txt,.md,.pdf"
                                className="hidden"
                                onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) { e.target.value = ""; return; }
                                    if (!noteEditorRef.current) { e.target.value = ""; return; }
                                    noteEditorRef.current.focus();

                                    const isTextFile = file.type.startsWith("text/") || /\.(txt|md)$/i.test(file.name);
                                    const isPdfFile = file.type === "application/pdf" || /\.pdf$/i.test(file.name);

                                    if (isPdfFile) {
                                        try {
                                            const { processFile } = await import("@/lib/file-processor");
                                            const result = await processFile(file);
                                            const text = result.content;
                                            if (text) {
                                                const html = text.split("\n").filter(Boolean).map(line => `<p>${line.replace(/</g,"&lt;").replace(/>/g,"&gt;")}</p>`).join("");
                                                document.execCommand("insertHTML", false, html);
                                            } else {
                                                toast.error("This PDF contains no extractable text (scanned document). Try uploading it to the chat instead.");
                                            }
                                        } catch {
                                            toast.error("Failed to extract text from PDF.");
                                        }
                                    } else if (isTextFile) {
                                        const reader = new FileReader();
                                        reader.onload = () => {
                                            if (typeof reader.result === "string") {
                                                const html = reader.result.split("\n").filter(Boolean).map(line => `<p>${line.replace(/</g,"&lt;").replace(/>/g,"&gt;")}</p>`).join("");
                                                document.execCommand("insertHTML", false, html);
                                                void handleUpdateNote(selectedNote.id, { content: getNoteContent() });
                                            }
                                        };
                                        reader.readAsText(file);
                                    } else {
                                        const reader = new FileReader();
                                        reader.onload = () => {
                                            if (typeof reader.result === "string") {
                                                document.execCommand("insertImage", false, reader.result);
                                                void handleUpdateNote(selectedNote.id, { content: getNoteContent() });
                                            }
                                        };
                                        reader.readAsDataURL(file);
                                    }
                                    e.target.value = "";
                                }}
                            />

                            {/* AI Rewrite Panel Toggle */}
                            <button
                                onClick={() => setShowAiRewrite(!showAiRewrite)}
                                className={`flex items-center gap-1.5 py-1.5 px-2 text-[11px] font-sans font-medium rounded transition-all ${
                                    showAiRewrite
                                        ? "bg-blue-500 text-white"
                                        : "bg-white/5 border border-white/10 text-white hover:bg-white/10"
                                }`}
                                title="AI rewriting suggestions panel"
                            >
                                <Sparkles className="w-3.5 h-3.5" />
                                <span>AI Rewrite</span>
                            </button>

                            <div className="w-px h-5 bg-zinc-700 mx-0.5" />

                            {/* Page Color Picker */}
                            <div className="flex items-center gap-1">
                                <span className="text-[10px] text-zinc-400">BG:</span>
                                {[
                                    { l: "White", c: "#ffffff" },
                                    { l: "Ivory", c: "#faf8f5" },
                                    { l: "Cream", c: "#f5f0eb" },
                                    { l: "Mint", c: "#f0fbf0" },
                                    { l: "Charcoal", c: "#1a1a1a" },
                                    { l: "Deep slate", c: "#201b2b" },
                                ].map((bg) => (
                                    <button
                                        key={bg.c}
                                        onClick={() => {
                                            setEditorColor(bg.c);
                                            void handleUpdateNote(selectedNote.id, { page_color: bg.c });
                                        }}
                                        style={{ backgroundColor: bg.c }}
                                        title={bg.l}
                                        className={`w-4 h-4 rounded-full border-2 ${
                                            editorColor === bg.c ? "border-blue-400 scale-110" : "border-white/30"
                                        }`}
                                    />
                                ))}
                            </div>

                            {/* Notebook Ruled Lines Toggle */}
                            <button
                                onClick={() => {
                                    const nextLined = !editorLined;
                                    setEditorLined(nextLined);
                                    void handleUpdateNote(selectedNote.id, { is_lined: nextLined });
                                }}
                                className={`flex items-center gap-1.5 py-1.5 px-2 text-[11px] font-sans font-medium rounded transition-all ${
                                    editorLined
                                        ? "bg-blue-500 text-white"
                                        : "bg-white/5 border border-white/10 text-white hover:bg-white/10"
                                }`}
                                title="Toggle notebook ruled lines"
                            >
                                <ListOrdered className="w-3.5 h-3.5" />
                                <span>Lined</span>
                            </button>

                            <div className="w-px h-5 bg-zinc-700 mx-0.5" />

                            {/* Exports Dropdown buttons */}
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => {
                                        if (noteEditorRef.current) {
                                            exportAsTxt();
                                        }
                                    }}
                                    className="flex items-center gap-1.5 py-1.5 px-2 text-[11px] font-sans font-medium rounded transition-all bg-white/5 border border-white/10 text-white hover:bg-white/10"
                                    title="Export note as raw .txt file"
                                >
                                    <FileIcon className="w-3.5 h-3.5" />
                                    <span>TXT</span>
                                </button>
                                <button
                                    onClick={() => {
                                        if (noteEditorRef.current) {
                                            exportAsPdf();
                                        }
                                    }}
                                    className="flex items-center gap-1.5 py-1.5 px-2 text-[11px] font-sans font-medium rounded transition-all bg-white/5 border border-white/10 text-white hover:bg-white/10"
                                    title="Export note as formatted PDF file"
                                >
                                    <FileDown className="w-3.5 h-3.5" />
                                    <span>PDF</span>
                                </button>
                            </div>
                        </div>

                        {/* Editor body container */}
                        <div className="flex-1 flex flex-col min-h-0 relative">
                            {/* AI Rewrite Panel */}
                            {showAiRewrite && (
                                <div className="p-4 border-b flex flex-col gap-2 shrink-0 bg-zinc-900/95 border-white/10">
                                    <div className="flex items-center justify-between w-full">
                                        <span className="text-[10px] font-bold font-sans uppercase tracking-wider flex items-center gap-1 text-blue-500">
                                            <Sparkles className="w-3.5 h-3.5" />
                                            AI Note Rewrite Helper
                                        </span>
                                        <button onClick={() => setShowAiRewrite(false)} className="text-[10px] text-white/40 hover:text-white">
                                            Close
                                        </button>
                                    </div>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={aiRewriteInstruction}
                                            onChange={(e) => setAiRewriteInstruction(e.target.value)}
                                            placeholder="Enter instructions (e.g. summarize this, fix grammar, rewrite in simple Hindi...)"
                                            className="flex-1 px-3 py-1.5 text-[11px] rounded-lg border focus:outline-none bg-zinc-800 border-white/10 text-white placeholder-white/30 focus:border-zinc-700"
                                        />
                                        <button
                                            disabled={aiRewriting}
                                            onClick={async () => {
                                                if (!aiRewriteInstruction.trim()) {
                                                    toast.error("Please enter a rewrite instruction.");
                                                    return;
                                                }
                                                let textToRewrite = "";
                                                let isSelection = false;
                                                let rangeToRestore: Range | null = null;
                                                const selection = window.getSelection();
                                                if (selection && selection.toString().trim().length > 0) {
                                                    const range = selection.getRangeAt(0);
                                                    rangeToRestore = range;
                                                    const fragment = range.cloneContents();
                                                    const tempDiv = document.createElement("div");
                                                    tempDiv.appendChild(fragment.cloneNode(true));
                                                    textToRewrite = tempDiv.innerHTML;
                                                    isSelection = true;
                                                } else {
                                                    textToRewrite = noteEditorRef.current?.innerHTML || "";
                                                }

                                                setAiRewriting(true);
                                                try {
                                                    const { sendChatCompletion } = await import("@/lib/chat-api");
                                                    const res = await sendChatCompletion({
                                                        messages: [
                                                            { role: "system", content: `You are an expert HTML editor. Rewrite the following HTML content according to this instruction: "${aiRewriteInstruction}". Return ONLY the rewritten HTML. Preserve ALL formatting: headings, bold, italic, lists, tables, horizontal rules, math formulas ($$...$$, $...$), spacing, and indentation. Do NOT wrap in markdown code fences. Do NOT add explanations or greetings.` },
                                                            { role: "user", content: textToRewrite }
                                                        ]
                                                    });
                                                    const rewrittenText = (res as any)?.response || (res as any)?.data?.[0]?.message?.content || "";
                                                    if (rewrittenText) {
                                                        if (isSelection && selection && rangeToRestore) {
                                                            selection.removeAllRanges();
                                                            selection.addRange(rangeToRestore);
                                                            document.execCommand("insertHTML", false, rewrittenText);
                                                        } else {
                                                            if (noteEditorRef.current) {
                                                                noteEditorRef.current.innerHTML = rewrittenText;
                                                            }
                                                        }
                                                        if (noteEditorRef.current) {
                                                            void renderNoteMath(noteEditorRef.current.innerHTML).then((rendered) => {
                                                                if (noteEditorRef.current) {
                                                                    noteEditorRef.current.innerHTML = rendered;
                                                                }
                                                            });
                                                            void handleUpdateNote(selectedNote.id, { content: getNoteContent() });
                                                        }
                                                        toast.success("Text rewritten!");
                                                    } else {
                                                        toast.error("AI Rewrite returned no text.");
                                                    }
                                                } catch (err) {
                                                    console.error(err);
                                                    toast.error("AI Rewrite failed.");
                                                } finally {
                                                    setAiRewriting(false);
                                                }
                                            }}
                                            className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5"
                                        >
                                            {aiRewriting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Rewrite"}
                                        </button>
                                    </div>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        <span className="text-[9px] text-zinc-400 mr-2 flex items-center">Quick options:</span>
                                        {["Summarize", "Fix Grammar", "Simplify", "Make it Professional", "Elongate", "Translate to Hindi"].map((opt) => (
                                            <button
                                                key={opt}
                                                onClick={() => setAiRewriteInstruction(opt)}
                                                className="text-[9px] px-2 py-0.5 rounded-full border bg-zinc-800 border-white/10 hover:bg-zinc-700 text-zinc-300"
                                            >
                                                {opt}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Whiteboard Drawing Canvas overlay */}
                            {showWhiteboard && (
                                <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/40 p-4 overflow-y-auto">
                                    <WhiteboardCanvas
                                        initialData=""
                                        onClose={() => setShowWhiteboard(false)}
                                        onSave={(drawingUrl) => {
                                            if (noteEditorRef.current) {
                                                noteEditorRef.current.focus();
                                                document.execCommand("insertImage", false, drawingUrl);
                                                void handleUpdateNote(selectedNote.id, { content: getNoteContent() });
                                            }
                                            setShowWhiteboard(false);
                                            toast.success("Drawing inserted!");
                                        }}
                                    />
                                </div>
                            )}

                            {/* Main Editable note canvas */}
                            <div className="flex-1 overflow-y-auto relative w-full h-full">
                                <div
                                    ref={noteEditorRef}
                                    contentEditable
                                    suppressContentEditableWarning
                                    onBlur={() => {
                                        if (noteEditorRef.current) {
                                            void handleUpdateNote(selectedNote.id, { content: getNoteContent() });
                                        }
                                    }}
                                    onInput={() => {
                                        if (noteEditorRef.current) {
                                            const html = getNoteContent();
                                            setSelectedNote((prev) => prev ? { ...prev, content: html } : null);
                                            setNotes((prev) =>
                                                prev.map((n) => (n.id === selectedNote.id ? { ...n, content: html } : n))
                                            );
                                        }
                                    }}
                                    style={{
                                        backgroundColor: editorColor,
                                        color: editorColor === "#1a1a1a" || editorColor === "#201b2b" ? "#f5f5f4" : "#1a1a19",
                                        fontFamily: "Poppins, Roboto, sans-serif",
                                        minHeight: "100%",
                                        fontSize: noteFontSize,
                                        lineHeight: noteLineSpacing,
                                    }}
                                    className={`note-content p-6 outline-none pb-24 font-normal ${
                                        editorLined
                                            ? editorColor === "#1a1a1a" || editorColor === "#201b2b"
                                                ? "notes-ruled-dark"
                                                : "notes-ruled-light"
                                            : ""
                                    }`}
                                />
                            </div>
                        </div>

                        {/* Resize handles (popup mode only) */}
                        {isNotePopup && !isNoteMaximized && (
                            <>
                                {/* Bottom-right corner */}
                                <div
                                    onPointerDown={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setIsResizingNote(true);
                                        setNoteResizeOffset({
                                            startX: e.clientX,
                                            startY: e.clientY,
                                            startW: notePopupSize.width,
                                            startH: notePopupSize.height,
                                        });
                                    }}
                                    className="absolute bottom-0 right-0 w-6 h-6 cursor-se-resize z-50 flex items-end justify-end pb-0.5 pr-0.5 note-resize-handle"
                                >
                                    <svg className="w-3 h-3 text-zinc-400" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5">
                                        <line x1="10" y1="0" x2="0" y2="10" />
                                        <line x1="10" y1="4" x2="4" y2="10" />
                                        <line x1="10" y1="8" x2="8" y2="10" />
                                    </svg>
                                </div>
                                {/* Right edge */}
                                <div
                                    onPointerDown={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setIsResizingNote(true);
                                        setNoteResizeOffset({
                                            startX: e.clientX,
                                            startY: e.clientY,
                                            startW: notePopupSize.width,
                                            startH: notePopupSize.height,
                                        });
                                    }}
                                    className="absolute top-0 right-0 w-1.5 h-full cursor-e-resize z-50 note-resize-handle opacity-0 hover:opacity-100 bg-transparent hover:bg-blue-500/20"
                                />
                                {/* Bottom edge */}
                                <div
                                    onPointerDown={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setIsResizingNote(true);
                                        setNoteResizeOffset({
                                            startX: e.clientX,
                                            startY: e.clientY,
                                            startW: notePopupSize.width,
                                            startH: notePopupSize.height,
                                        });
                                    }}
                                    className="absolute bottom-0 left-0 w-full h-1.5 cursor-s-resize z-50 note-resize-handle opacity-0 hover:opacity-100 bg-transparent hover:bg-blue-500/20"
                                />
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Library Image Picker Modal */}
            {showLibraryPicker && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowLibraryPicker(false)}>
                    <div onClick={(e) => e.stopPropagation()} className="w-full max-w-lg rounded-xl border border-white/10 bg-zinc-900 shadow-2xl p-4">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-sans font-semibold text-white">Select Image from Library</h3>
                            <button onClick={() => setShowLibraryPicker(false)} className="text-white/50 hover:text-white"><X className="w-4 h-4" /></button>
                        </div>
                        <div className="grid grid-cols-3 gap-2 overflow-y-auto max-h-[50vh]">
                            {libraryAssets.length > 0 ? libraryAssets.slice(0, 30).map((asset: any) => (
                                <button
                                    key={asset.id}
                                    onClick={() => {
                                        const imgUrl = asset.asset_url;
                                        if (noteEditorRef.current && imgUrl && selectedNote) {
                                            noteEditorRef.current.focus();
                                            document.execCommand("insertImage", false, imgUrl);
                                            void handleUpdateNote(selectedNote.id, { content: getNoteContent() });
                                        }
                                        setShowLibraryPicker(false);
                                        toast.success("Image inserted!");
                                    }}
                                    className="aspect-video rounded-lg overflow-hidden border border-white/10 hover:border-blue-500 transition-all"
                                >
                                    <img src={asset.asset_url} alt={asset.prompt || "Library image"} className="w-full h-full object-cover" />
                                </button>
                            )) : (
                                <div className="col-span-3 text-center py-8 text-white/40 text-xs">No images in your library.</div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* AI Image Generation Modal */}
            {showImageGenerate && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowImageGenerate(false)}>
                    <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-xl border border-white/10 bg-zinc-900 shadow-2xl p-4">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-sans font-semibold text-white">Generate AI Image</h3>
                            <button onClick={() => setShowImageGenerate(false)} className="text-white/50 hover:text-white"><X className="w-4 h-4" /></button>
                        </div>
                        <textarea
                            value={imageGeneratePrompt}
                            onChange={(e) => setImageGeneratePrompt(e.target.value)}
                            placeholder="Describe the image you want to generate..."
                            rows={3}
                            className="w-full px-3 py-2 text-xs rounded-lg border border-white/10 bg-zinc-800 text-white placeholder-white/30 focus:outline-none focus:border-blue-500 resize-none"
                        />
                        <button
                            disabled={imageGenerating || !imageGeneratePrompt.trim()}
                            onClick={async () => {
                                if (!imageGeneratePrompt.trim()) return;
                                setImageGenerating(true);
                                try {
                                    const { sendAiRequest, getLibraryAssets } = await import("@/lib/chat-api");
                                    const res = await sendAiRequest({
                                        endpoint: "/features/image/generate",
                                        messages: [
                                            { role: "user", content: imageGeneratePrompt }
                                        ],
                                        modality: "image_gen"
                                    });
                                    const imageResponse = (res as any)?.response || (res as any)?.data?.[0]?.message?.content || (res as any)?.data?.[0]?.text || "";
                                    if (imageResponse && noteEditorRef.current && selectedNote) {
                                        const urlMatch = imageResponse.match(/https?:\/\/[^\s\)\]]+/);
                                        const finalUrl = urlMatch ? urlMatch[0] : imageResponse;
                                        noteEditorRef.current.focus();
                                        document.execCommand("insertImage", false, finalUrl);
                                        void handleUpdateNote(selectedNote.id, { content: getNoteContent() });
                                        toast.success("Image generated & inserted!");
                                        setShowImageGenerate(false);
                                        // Refresh library assets so the new image shows up in picker
                                        try {
                                            const libRes = await getLibraryAssets();
                                            if (libRes.success && libRes.assets) {
                                                setLibraryAssets(libRes.assets.filter((a: any) => a.asset_type === "image"));
                                            }
                                        } catch {}
                                    } else {
                                        toast.error("No image generated. Response format: " + JSON.stringify(res).substring(0, 200));
                                    }
                                } catch (err) {
                                    console.error(err);
                                    toast.error("Image generation failed.");
                                } finally {
                                    setImageGenerating(false);
                                }
                            }}
                            className="w-full mt-2 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2"
                        >
                            {imageGenerating ? (
                                <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating...</>
                            ) : (
                                <><Sparkles className="w-3.5 h-3.5" /> Generate Image</>
                            )}
                        </button>
                    </div>
                </div>
            )}

            {/* Settings Modal */}
            <SettingsModal
                isOpen={isSettingsModalOpen}
                onClose={() => setIsSettingsModalOpen(false)}
                isDarkMode={isDarkMode}
                isMobile={isMobile}
                onPersonaSelect={handlePersonaSelect}
                currentPersona={selectedPersona}
                onDeactivate={handleDiscontinueAccount}
                userRole={userRole}
                userName={userName}
                userEmail={userEmail}
                initialPanel={settingsPanel}
                onAccentChange={setAccent}
                subscription={subscription}
                isSubscriptionLoading={isSubscriptionLoading}
            />

            {/* Reflective Card Modal */}
            {isPersonalizationModalOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setIsPersonalizationModalOpen(false)}>
                    <div onClick={e => e.stopPropagation()}>
                        <ReflectiveCard
                            userName={userName || "User"}
                            userEmail={userEmail || ""}
                            userRole={userRole}
                            schoolName={schoolName || ""}
                            subscription={subscription}
                            isDarkMode={isDarkMode}
                            onClose={() => setIsPersonalizationModalOpen(false)}
                        />
                    </div>
                </div>
            )}

            {/* Wallet Modal */}
            <WalletModal
                isOpen={isWalletModalOpen}
                onClose={() => setIsWalletModalOpen(false)}
                isDarkMode={isDarkMode}
                isMobile={isMobile}
            />

            {/* ─── Bulk Email Modal (Excel Upload) ─── */}
            <AnimatePresence>
                {gmailBulkModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[150] flex items-center justify-center p-4"
                        onClick={() => setGmailBulkModal(false)}
                    >
                        <div className={`absolute inset-0 ${isDarkMode ? "bg-black/60" : "bg-black/60"} backdrop-blur-sm`} />
                        <motion.div
                            initial={{ scale: 0.92, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.92, opacity: 0, y: 20 }}
                            onClick={(e: React.MouseEvent) => e.stopPropagation()}
                            className={`relative w-full max-w-md rounded-xl border p-5 shadow-2xl ${isDarkMode ? "bg-[#0a0a0a] border-white/10" : "bg-[#fcfcfc] border-black/20"}`}
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div className={`p-1.5 rounded-lg ${isDarkMode ? "bg-[#EA4335]/10" : "bg-[#EA4335]/15"}`}>
                                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="#EA4335" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
                                    </svg>
                                </div>
                                <div>
                                    <p className={`text-[10px] font-bold font-mono uppercase tracking-[0.15em] ${isDarkMode ? "text-white" : "text-black"}`}>Bulk Email Send</p>
                                    <p className={`text-[8px] font-mono ${isDarkMode ? "text-white/60" : "text-black/70"}`}>Upload CSV file with columns: email, message</p>
                                </div>
                            </div>

                            <div className={`mb-3 p-2.5 rounded-lg ${isDarkMode ? "bg-white/[0.05] border border-white/10" : "bg-black/[0.06] border border-black/25"}`}>
                                <p className={`text-[7px] font-mono uppercase tracking-widest mb-1 ${isDarkMode ? "text-white/50" : "text-black/60"}`}>Accepted CSV format</p>
                                <pre className={`text-[8px] font-mono leading-relaxed ${isDarkMode ? "text-white/70" : "text-black/80"}`}>
                                    email,message{'\n'}
                                    john@example.com,Hello John check this out{'\n'}
                                    jane@example.com,"Hey Jane, here is the update"</pre>
                            </div>

                            <div
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    const file = e.dataTransfer.files[0];
                                    if (file) handleBulkExcelUpload(file);
                                }}
                                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all ${isDarkMode ? "border-white/30 hover:border-accent/50 text-white/60" : "border-black/40 hover:border-accent/60 text-black/80"}`}
                                onClick={() => bulkFileInputRef.current?.click()}
                            >
                                <svg className="h-8 w-8 mx-auto mb-2 opacity-60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
                                </svg>
                                <p className={`text-[9px] font-mono ${isDarkMode ? "text-white/50" : "text-black/80"}`}>Drop CSV file here or click to browse</p>
                            </div>
                            <input ref={bulkFileInputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleBulkExcelUpload(file);
                                e.target.value = "";
                            }} />

                            {gmailSending && (
                                <div className="flex items-center gap-2 mt-3 p-2 rounded-lg bg-white/[0.05]">
                                    <div className="h-3 w-3 rounded-full border-2 border-t-transparent animate-spin border-accent" />
                                    <span className={`text-[8px] font-mono ${isDarkMode ? "text-white/70" : "text-black/80"}`}>Sending emails...</span>
                                </div>
                            )}

                            <div className="flex items-center gap-2 justify-end mt-3">
                                <button onClick={() => setGmailBulkModal(false)}
                                    className={`px-3 py-1.5 text-[9px] font-mono rounded-md transition-all ${isDarkMode ? "text-white/70 hover:bg-white/10" : "text-black/80 hover:bg-black/10"}`}
                                >Close</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

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
                        <div className={`absolute inset-0 ${isDarkMode ? "bg-black/60" : "bg-black/60"} backdrop-blur-sm`} />
                        <motion.div
                            initial={{ scale: 0.92, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.92, opacity: 0, y: 20 }}
                            onClick={(e: React.MouseEvent) => e.stopPropagation()}
                            className={`relative w-full max-w-lg rounded-xl border p-5 shadow-2xl ${isDarkMode ? "bg-[#0a0a0a] border-white/10" : "bg-[#fcfcfc] border-black/20"}`}
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div className={`p-1.5 rounded-lg ${isDarkMode ? "bg-[#EA4335]/10" : "bg-[#EA4335]/15"}`}>
                                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
                                        <rect x="2" y="4" width="20" height="16" rx="2" fill="#EA4335" />
                                        <path d="M22 6l-10 7L2 6" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
                                    </svg>
                                </div>
                                <div>
                                    <p className={`text-[10px] font-bold font-mono uppercase tracking-[0.15em] ${isDarkMode ? "text-white" : "text-black"}`}>Send as Email</p>
                                    <p className={`text-[8px] font-mono ${isDarkMode ? "text-white/60" : "text-black/80"}`}>
                                        To: <span className="font-bold">{gmailMailTo.includes(",") ? `${gmailMailTo.split(",").length} recipients` : gmailMailTo}</span>
                                    </p>
                                </div>
                            </div>

                            {/* Polished email body */}
                            {gmailPolishing ? (
                                <div className="flex items-center gap-2 mb-4 p-3 rounded-lg bg-white/[0.05]">
                                    <div className="h-4 w-4 rounded-full border-2 border-t-transparent animate-spin border-[#4285F4]" />
                                    <span className={`text-[9px] font-mono ${isDarkMode ? "text-white/70" : "text-black/80"}`}>AI is polishing your message...</span>
                                </div>
                            ) : gmailPolishedBody ? (
                                <>
                                    <textarea
                                        value={gmailPolishedBody}
                                        onChange={(e) => setGmailPolishedBody(e.target.value)}
                                        rows={6}
                                        className={`w-full mb-3 p-2.5 text-[10px] font-mono leading-relaxed rounded-lg border outline-none resize-none transition-all ${isDarkMode
                                            ? "bg-white/[0.05] border-white/20 text-white/90 focus:border-[#4285F4]/50"
                                            : "bg-black/[0.04] border-black/30 text-black/90 focus:border-[#4285F4]/70"
                                            }`}
                                    />
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className={`p-1.5 rounded-lg ${isDarkMode ? "bg-[#EA4335]/10" : "bg-[#EA4335]/15"}`}>
                                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
                                                <rect x="2" y="4" width="20" height="16" rx="2" fill="#EA4335" />
                                                <path d="M22 6l-10 7L2 6" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className={`text-[10px] font-bold font-mono uppercase tracking-[0.15em] ${isDarkMode ? "text-white" : "text-black"}`}>Send as Email</p>
                                            <p className={`text-[8px] font-mono ${isDarkMode ? "text-white/60" : "text-black/80"}`}>
                                                To: <span className="font-bold">{gmailMailTo.includes(",") ? `${gmailMailTo.split(",").length} recipients` : gmailMailTo}</span>
                                            </p>
                                        </div>
                                    </div>
                                </>
                            ) : null}

                            <div className="flex items-center gap-2 justify-end">
                                <button
                                    onClick={() => { setGmailConfirmSend(false); setGmailPolishedBody(""); }}
                                    className={`px-3 py-1.5 text-[9px] font-mono rounded-md transition-all ${isDarkMode ? "text-white/70 hover:bg-white/10" : "text-black/80 hover:bg-black/10"}`}
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

            {/* ─── Auto Context Modal ─── */}
            <AnimatePresence>
                {gmailAutoShowModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[150] flex items-center justify-center p-4"
                        onClick={() => setGmailAutoShowModal(false)}
                    >
                        <div className={`absolute inset-0 ${isDarkMode ? "bg-black/60" : "bg-black/60"} backdrop-blur-sm`} />
                        <motion.div
                            initial={{ scale: 0.92, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.92, opacity: 0, y: 20 }}
                            onClick={(e: React.MouseEvent) => e.stopPropagation()}
                            className={`relative w-full max-w-lg rounded-xl border p-5 shadow-2xl ${isDarkMode ? "bg-[#0a0a0a] border-white/10" : "bg-[#fcfcfc] border-black/20"}`}
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div className={`p-1.5 rounded-lg ${isDarkMode ? "bg-accent/10" : "bg-accent/15"}`}>
                                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke={isDarkMode ? "#ffffff" : "#000000"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
                                        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                                    </svg>
                                </div>
                                <div>
                                    <p className={`text-[10px] font-bold font-mono uppercase tracking-[0.15em] ${isDarkMode ? "text-white" : "text-black"}`}>Auto Email Context</p>
                                    <p className={`text-[8px] font-mono ${isDarkMode ? "text-white/60" : "text-black/70"}`}>Set tone, signature, and mode for auto-replies</p>
                                </div>
                            </div>

                            <div className="space-y-3 mb-4">
                                <div>
                                    <label className={`text-[8px] font-mono uppercase tracking-widest ${isDarkMode ? "text-white/60" : "text-black/70"}`}>Tone</label>
                                    <select value={gmailAutoTone} onChange={(e) => setGmailAutoTone(e.target.value)}
                                        className={`w-full mt-1 px-2 py-1.5 text-[10px] font-mono rounded border outline-none ${isDarkMode ? "bg-white/[0.05] border-white/20 text-white" : "bg-black/[0.04] border-black/30 text-black"}`}
                                    >
                                        <option value="professional">Professional</option>
                                        <option value="casual">Casual</option>
                                        <option value="formal">Formal</option>
                                        <option value="direct">Direct</option>
                                    </select>
                                </div>
                                <div>
                                    <label className={`text-[8px] font-mono uppercase tracking-widest ${isDarkMode ? "text-white/60" : "text-black/70"}`}>Signature (optional)</label>
                                    <textarea value={gmailAutoSignature} onChange={(e) => setGmailAutoSignature(e.target.value)} rows={2}
                                        className={`w-full mt-1 px-2 py-1.5 text-[10px] font-mono rounded border outline-none resize-none ${isDarkMode ? "bg-white/[0.05] border-white/20 text-white/80" : "bg-black/[0.04] border-black/30 text-black/80"}`}
                                        placeholder="Best regards,&#10;John Doe"
                                    />
                                </div>
                                <div>
                                    <label className={`text-[8px] font-mono uppercase tracking-widest ${isDarkMode ? "text-white/60" : "text-black/70"}`}>Instructions (optional)</label>
                                    <textarea value={gmailAutoInstructions} onChange={(e) => setGmailAutoInstructions(e.target.value)} rows={3}
                                        className={`w-full mt-1 px-2 py-1.5 text-[10px] font-mono rounded border outline-none resize-none ${isDarkMode ? "bg-white/[0.05] border-white/20 text-white/80" : "bg-black/[0.04] border-black/30 text-black/80"}`}
                                        placeholder="Be concise, always include a call to action..."
                                    />
                                </div>

                                <div className="flex items-center gap-2 pt-2">
                                    <label className={`text-[8px] font-mono uppercase tracking-widest ${isDarkMode ? "text-white/60" : "text-black/70"}`}>Mode:</label>
                                    <button
                                        onClick={() => setGmailAutoMode(gmailAutoMode === "all" ? null : "all")}
                                        className={`px-2.5 py-1 text-[8px] font-mono rounded border transition-all ${gmailAutoMode === "all"
                                            ? (isDarkMode ? "bg-accent/20 border-accent text-accent" : "bg-accent/15 border-accent text-accent")
                                            : (isDarkMode ? "border-white/25 text-white/70" : "border-black/30 text-black/70")
                                            }`}
                                    >
                                        Auto All
                                    </button>
                                    <button
                                        onClick={() => setGmailAutoMode(gmailAutoMode === "to" ? null : "to")}
                                        className={`px-2.5 py-1 text-[8px] font-mono rounded border transition-all ${gmailAutoMode === "to"
                                            ? (isDarkMode ? "bg-accent/20 border-accent text-accent" : "bg-accent/15 border-accent text-accent")
                                            : (isDarkMode ? "border-white/25 text-white/70" : "border-black/30 text-black/70")
                                            }`}
                                    >
                                        Auto To
                                    </button>
                                </div>
                                {gmailAutoMode === "to" && (
                                    <div>
                                        <label className={`text-[8px] font-mono uppercase tracking-widest ${isDarkMode ? "text-white/60" : "text-black/70"}`}>Target Email</label>
                                        <input type="email" value={gmailAutoTargetEmail} onChange={(e) => setGmailAutoTargetEmail(e.target.value)}
                                            className={`w-full mt-1 px-2 py-1.5 text-[10px] font-mono rounded border outline-none ${isDarkMode ? "bg-white/[0.05] border-white/20 text-white" : "bg-black/[0.04] border-black/30 text-black"}`}
                                            placeholder="someone@example.com"
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-2 justify-end">
                                <button onClick={() => { setGmailAutoShowModal(false); setGmailAutoOn(false); setGmailAutoMode(null); }}
                                    className={`px-3 py-1.5 text-[9px] font-mono rounded-md transition-all ${isDarkMode ? "text-white/70 hover:bg-white/10" : "text-black/80 hover:bg-black/10"}`}
                                >Cancel</button>
                                <button onClick={async () => {
                                    setGmailAutoShowModal(false);
                                    if (!gmailAutoMode) return;
                                    try {
                                        const { setGoogleAgentContext } = await import("@/lib/chat-api");
                                        await setGoogleAgentContext({
                                            tone: gmailAutoTone,
                                            signature: gmailAutoSignature,
                                            instructions: gmailAutoInstructions,
                                            is_active: true,
                                            reply_strategy: gmailAutoMode
                                        });
                                    } catch { /* context save optional */ }
                                    setGmailAutoStatus(gmailAutoMode === "all" ? "Watching all emails..." : `Watching ${gmailAutoTargetEmail}...`);
                                }} disabled={!gmailAutoMode || (gmailAutoMode === "to" && !gmailAutoTargetEmail.trim())}
                                    className={`px-4 py-1.5 text-[9px] font-mono uppercase tracking-[0.15em] font-bold rounded-md transition-all disabled:opacity-50 ${isDarkMode ? "bg-accent text-black hover:bg-accent/90" : "bg-accent text-black hover:bg-accent/90"}`}
                                >Apply</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ─── Rewrite Mail Modal ─── */}
            <AnimatePresence>
                {gmailRewriteModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[150] flex items-center justify-center p-4"
                        onClick={() => { setGmailRewriteModal(false); setGmailRewrittenBody(""); }}
                    >
                        <div className={`absolute inset-0 ${isDarkMode ? "bg-black/60" : "bg-black/60"} backdrop-blur-sm`} />
                        <motion.div
                            initial={{ scale: 0.92, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.92, opacity: 0, y: 20 }}
                            onClick={(e: React.MouseEvent) => e.stopPropagation()}
                            className={`relative w-full max-w-lg rounded-xl border p-5 shadow-2xl ${isDarkMode ? "bg-[#0a0a0a] border-white/10" : "bg-[#fcfcfc] border-black/20"}`}
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div className={`p-1.5 rounded-lg ${isDarkMode ? "bg-[#4285F4]/10" : "bg-[#4285F4]/15"}`}>
                                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="#4285F4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M12 20h9" />
                                        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className={`text-[10px] font-bold font-mono uppercase tracking-[0.15em] ${isDarkMode ? "text-white" : "text-black"}`}>Rewrite Mail</p>
                                    <p className={`text-[8px] font-mono ${isDarkMode ? "text-white/60" : "text-black/80"}`}>AI-polished version of your draft</p>
                                </div>
                            </div>

                            {gmailRewriting ? (
                                <div className="flex items-center gap-2 mb-4 p-3 rounded-lg bg-white/[0.05]">
                                    <div className="h-4 w-4 rounded-full border-2 border-t-transparent animate-spin border-[#4285F4]" />
                                    <span className={`text-[9px] font-mono ${isDarkMode ? "text-white/70" : "text-black/80"}`}>AI is rewriting your message...</span>
                                </div>
                            ) : (
                                <textarea
                                    value={gmailRewrittenBody}
                                    onChange={(e) => setGmailRewrittenBody(e.target.value)}
                                    rows={8}
                                    className={`w-full mb-3 p-2.5 text-[10px] font-mono leading-relaxed rounded-lg border outline-none resize-none transition-all ${isDarkMode
                                        ? "bg-white/[0.05] border-white/20 text-white/90 focus:border-[#4285F4]/50"
                                        : "bg-black/[0.04] border-black/30 text-black/90 focus:border-[#4285F4]/70"
                                        }`}
                                />
                            )}

                            <div className="flex items-center justify-between gap-2">
                                <button
                                    onClick={async () => {
                                        const trimmedInput = input.trim();
                                        if (!trimmedInput) return;
                                        setGmailRewriting(true);
                                        setGmailRewrittenBody("");
                                        try {
                                            const { sendChatCompletion } = await import("@/lib/chat-api");
                                            const res = await sendChatCompletion({
                                                messages: [
                                                    { role: "system", content: "You are an email writing assistant. Rewrite the following rough text into a polished, professional email. Fix grammar, improve clarity, structure the content well, and return ONLY the rewritten email body — no explanations, no greetings, no extra commentary." },
                                                    { role: "user", content: trimmedInput }
                                                ]
                                            });
                                            const rewritten = (res as any)?.response || res.data?.[0]?.message?.content || trimmedInput;
                                            setGmailRewrittenBody(rewritten);
                                        } catch {
                                            setGmailRewrittenBody(trimmedInput);
                                        }
                                        setGmailRewriting(false);
                                    }}
                                    disabled={gmailRewriting}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 text-[9px] font-mono uppercase tracking-[0.15em] rounded-md border transition-all disabled:opacity-50 ${isDarkMode ? "border-white/25 text-white/70 hover:border-white/40 hover:text-white" : "border-black/30 text-black/80 hover:border-black/50 hover:text-black"}`}
                                >
                                    <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
                                        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                                    </svg>
                                    Re-Rewrite
                                </button>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => { setGmailRewriteModal(false); setGmailRewrittenBody(""); }}
                                        className={`px-3 py-1.5 text-[9px] font-mono rounded-md transition-all ${isDarkMode ? "text-white/70 hover:bg-white/10" : "text-black/80 hover:bg-black/10"}`}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => {
                                            // Replace the input with the rewritten text and close the modal
                                            if (gmailRewrittenBody.trim()) {
                                                setInput(gmailRewrittenBody);
                                            }
                                            setGmailRewriteModal(false);
                                            setGmailRewrittenBody("");
                                        }}
                                        disabled={gmailRewriting || !gmailRewrittenBody.trim()}
                                        className={`px-4 py-1.5 text-[9px] font-mono uppercase tracking-[0.15em] font-bold rounded-md transition-all disabled:opacity-50 ${isDarkMode ? "bg-[#4285F4] text-white hover:bg-[#4285F4]/90" : "bg-[#4285F4] text-white hover:bg-[#4285F4]/90"}`}
                                    >
                                        Use Rewrite
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Onboarding Walkthrough */}
            <OnboardingWalkthrough
                isOpen={showWalkthrough}
                onClose={() => setShowWalkthrough(false)}
                isMobile={isMobile}
                setIsSidebarCollapsed={setIsSidebarCollapsed}
                setIsRightSidebarCollapsed={setIsRightSidebarCollapsed}
                isDarkMode={isDarkMode}
            />

        </div>
    );
};

export default Chat;

const WhiteboardCanvas = ({
    initialData,
    onSave,
    onClose,
}: {
    initialData: string;
    onSave: (dataUrl: string) => void;
    onClose: () => void;
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [color, setColor] = useState("#ffffff");
    const [lineWidth, setLineWidth] = useState(3);
    const [isDrawing, setIsDrawing] = useState(false);
    const [tool, setTool] = useState<"freehand" | "rectangle" | "circle" | "line" | "arrow">("freehand");
    const prevPos = useRef({ x: 0, y: 0 });
    const startPos = useRef({ x: 0, y: 0 });
    const savedData = useRef<ImageData | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        if (initialData) {
            const img = new Image();
            img.onload = () => {
                ctx.drawImage(img, 0, 0);
            };
            img.src = initialData;
        } else {
            ctx.fillStyle = "#1e1e1e";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
    }, [initialData]);

    const saveState = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        savedData.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
    };

    const restoreState = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        if (savedData.current) {
            ctx.putImageData(savedData.current, 0, 0);
        }
    };

    const getCoordinates = (e: React.PointerEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY,
        };
    };

    const drawShape = (fromX: number, fromY: number, toX: number, toY: number) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        restoreState();
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        switch (tool) {
            case "freehand":
                ctx.moveTo(fromX, fromY);
                ctx.lineTo(toX, toY);
                ctx.stroke();
                break;
            case "rectangle":
                ctx.strokeRect(
                    Math.min(fromX, toX),
                    Math.min(fromY, toY),
                    Math.abs(toX - fromX),
                    Math.abs(toY - fromY)
                );
                break;
            case "circle": {
                const cx = (fromX + toX) / 2;
                const cy = (fromY + toY) / 2;
                const rx = Math.abs(toX - fromX) / 2;
                const ry = Math.abs(toY - fromY) / 2;
                ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
                ctx.stroke();
                break;
            }
            case "line":
                ctx.moveTo(fromX, fromY);
                ctx.lineTo(toX, toY);
                ctx.stroke();
                break;
            case "arrow": {
                const headLen = Math.min(20, Math.hypot(toX - fromX, toY - fromY) * 0.3);
                const angle = Math.atan2(toY - fromY, toX - fromX);
                ctx.moveTo(fromX, fromY);
                ctx.lineTo(toX, toY);
                ctx.moveTo(toX, toY);
                ctx.lineTo(toX - headLen * Math.cos(angle - Math.PI / 6), toY - headLen * Math.sin(angle - Math.PI / 6));
                ctx.moveTo(toX, toY);
                ctx.lineTo(toX - headLen * Math.cos(angle + Math.PI / 6), toY - headLen * Math.sin(angle + Math.PI / 6));
                ctx.stroke();
                break;
            }
        }
    };

    const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
        const pos = getCoordinates(e);
        prevPos.current = pos;
        startPos.current = pos;
        setIsDrawing(true);

        if (tool === "freehand") {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const ctx = canvas.getContext("2d");
            if (!ctx) return;
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, lineWidth / 2, 0, Math.PI * 2);
            ctx.fillStyle = color;
            ctx.fill();
        } else {
            saveState();
        }
    };

    const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
        if (!isDrawing) return;
        const currentPos = getCoordinates(e);

        if (tool === "freehand") {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const ctx = canvas.getContext("2d");
            if (!ctx) return;
            ctx.beginPath();
            ctx.moveTo(prevPos.current.x, prevPos.current.y);
            ctx.lineTo(currentPos.x, currentPos.y);
            ctx.strokeStyle = color;
            ctx.lineWidth = lineWidth;
            ctx.lineCap = "round";
            ctx.lineJoin = "round";
            ctx.stroke();
            prevPos.current = currentPos;
        } else {
            drawShape(startPos.current.x, startPos.current.y, currentPos.x, currentPos.y);
        }
    };

    const handlePointerUp = () => {
        if (isDrawing && tool !== "freehand") {
            saveState();
        }
        setIsDrawing(false);
    };

    const handleClear = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.fillStyle = "#1e1e1e";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        savedData.current = null;
    };

    const tools: { id: typeof tool; label: string; icon: string }[] = [
        { id: "freehand", label: "Pen", icon: "✏️" },
        { id: "rectangle", label: "Rect", icon: "▭" },
        { id: "circle", label: "Circle", icon: "○" },
        { id: "line", label: "Line", icon: "╱" },
        { id: "arrow", label: "Arrow", icon: "→" },
    ];

    return (
        <div className="p-4 rounded-xl border flex flex-col items-center gap-3 bg-zinc-900 border-white/10">
            <div className="flex items-center justify-between w-full">
                <span className="text-xs font-sans font-semibold text-white">Whiteboard Drawing Pad</span>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleClear}
                        className="py-1 px-2 text-[10px] rounded hover:bg-red-500/10 text-red-500 font-medium"
                    >
                        Clear
                    </button>
                    <button
                        onClick={onClose}
                        className="py-1 px-2 text-[10px] rounded hover:bg-white/10 text-white"
                    >
                        Cancel
                    </button>
                </div>
            </div>

            {/* Shape Tool Selector */}
            <div className="flex items-center gap-1.5 w-full justify-center">
                {tools.map((t) => (
                    <button
                        key={t.id}
                        onClick={() => setTool(t.id)}
                        className={`px-2.5 py-1 text-[10px] font-sans rounded transition-all ${
                            tool === t.id
                                ? "bg-blue-500 text-white"
                                : "bg-white/5 border border-white/10 text-zinc-300 hover:bg-white/10"
                        }`}
                    >
                        {t.icon} {t.label}
                    </button>
                ))}
            </div>

            <div className="relative border rounded overflow-hidden border-white/10">
                <canvas
                    ref={canvasRef}
                    width={500}
                    height={350}
                    className="touch-none cursor-crosshair max-w-full"
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerLeave={handlePointerUp}
                />
            </div>
            <div className="flex flex-wrap items-center justify-between w-full gap-2 mt-1">
                <div className="flex items-center gap-2">
                    <span className="text-[10px] text-zinc-400">Color:</span>
                    {["#000000", "#ffffff", "#ea4335", "#34a853", "#4285f4", "#fbbc05", "#ff00ff"].map((c) => (
                        <button
                            key={c}
                            onClick={() => setColor(c)}
                            style={{ backgroundColor: c }}
                            className={`w-4 h-4 rounded-full border-2 ${color === c ? "border-blue-400 scale-125" : "border-white/30"}`}
                        />
                    ))}
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-zinc-400">Width:</span>
                        <input
                            type="range"
                            min="1"
                            max="20"
                            value={lineWidth}
                            onChange={(e) => setLineWidth(Number(e.target.value))}
                            className="w-16 h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer"
                        />
                        <span className="text-[10px] font-mono text-zinc-300">{lineWidth}px</span>
                    </div>
                    <button
                        onClick={() => {
                            const canvas = canvasRef.current;
                            if (canvas) {
                                onSave(canvas.toDataURL("image/png"));
                            }
                        }}
                        className="py-1 px-3 bg-blue-500 hover:bg-blue-600 text-white rounded text-[10px] font-semibold"
                    >
                        Insert Drawing
                    </button>
                </div>
            </div>
        </div>
    );
};
