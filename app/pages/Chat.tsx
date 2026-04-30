"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Send, Bot, User, LogOut, MessageSquare, Plus, Search,
    ChevronLeft, ChevronRight, Moon, Sun, GraduationCap,
    Code2, FileText, Calendar, UserCog, Mic, ChevronUp,
    ThumbsUp, ThumbsDown, RotateCcw, Edit3, Copy, Zap, Trash2,
    Paperclip, X, ImageIcon, FileText as FileIcon
} from "lucide-react";
import Link from "next/link";
import { isAuthenticated, getApiKey, removeApiKey, getUserInfo, removeUserInfo, getUserProfile } from "@/lib/auth";
import {
    ChatSummary,
    createChat,
    deleteChat,
    getChatHistory,
    listChats,
    saveChatMessage,
    sendChatCompletion,
    sendAiRequest,
    getSubscriptionStatus
} from "@/lib/chat-api";
import { processFile, ProcessedFile } from "@/lib/file-processor";
import { toast } from "sonner";
import AuthCard from "@/components/ui/AuthCard";
import ChatLoader from "@/components/ui/ChatLoader";
import MarkdownRenderer from "@/components/ui/MarkdownRenderer";
import InterviewPrepModal from "@/components/InterviewPrepModal";
import MockPaperModal, { MockPaperConfig } from "@/components/MockPaperModal";
import MockPaperView from "@/components/MockPaperView";
import { GraduationCap as MockIcon } from "lucide-react";

interface Message {
    role: "user" | "assistant" | "system";
    content: string;
    timestamp: string;
    localOnly?: boolean;
}

const WELCOME_CONTENT = "Welcome to Rudranex AI. I am your study-pilot. How can I assist your learning journey today?";
const ACTIVE_CHAT_STORAGE_KEY = "rudranex_active_chat_id";

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

const Chat = () => {
    const [isAuthOpen, setIsAuthOpen] = useState(false);
    const [authed, setAuthed] = useState<boolean | null>(null);
    const [userName, setUserName] = useState<string>("");
    const [userEmail, setUserEmail] = useState<string>("");
    const [messages, setMessages] = useState<Message[]>(getWelcomeMessages);
    const [input, setInput] = useState("");
    const [sidebarWidth, setSidebarWidth] = useState(260);
    const [rightSidebarWidth, setRightSidebarWidth] = useState(260);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isRightSidebarCollapsed, setIsRightSidebarCollapsed] = useState(false);
    const [isResizingLeft, setIsResizingLeft] = useState(false);
    const [isResizingRight, setIsResizingRight] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(true);
    const [showEngineSelect, setShowEngineSelect] = useState(false);
    const [selectedEngine, setSelectedEngine] = useState("Student Mode");
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
    const [generatedPaper, setGeneratedPaper] = useState<string | null>(null);
    const [paperConfig, setPaperConfig] = useState<MockPaperConfig | null>(null);
    const [isGeneratingPaper, setIsGeneratingPaper] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [subscription, setSubscription] = useState<any>(null);
    const [isSubscriptionLoading, setIsSubscriptionLoading] = useState(false);

    const engines = [
        { name: "Student Mode", endpoint: "/chat", version: "1.0", icon: GraduationCap },
        { name: "Coding & GitHub", endpoint: "/tools/coding", version: "2.0", icon: Code2 },
        { name: "Interview Prep", endpoint: "/tools/interview", version: "1.0", icon: UserCog },
        { name: "Resume Audit", endpoint: "/tools/resume", version: "1.0", icon: FileText },
        { name: "PDF Research", endpoint: "/features/pdf/intel", version: "1.0", icon: Calendar },
        { name: "Mock Paper Generator", endpoint: "/chat", version: "1.0", icon: MockIcon },
        { name: "Vision Solver", endpoint: "/features/vision/solve", version: "1.0", icon: Mic },
    ];

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
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isLoading, isHistoryLoading]);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    const hydrateMessages = (items: Array<{ role: "user" | "assistant" | "system"; content: string; created_at?: string }>) => {
        if (!items.length) {
            setMessages(getWelcomeMessages());
            return;
        }

        setMessages(items.map((message) => ({
            role: message.role,
            content: message.content,
            timestamp: formatTimestamp(message.created_at)
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
        } else {
            // Fetch user profile from backend
            const apiKey = getApiKey();
            if (apiKey) {
                getUserProfile(apiKey).then(res => {
                    if (res.success && res.name) {
                        setUserName(res.name);
                        setUserEmail(res.email || "");
                    }
                }).catch(err => {
                    console.error("Failed to fetch user profile:", err);
                });
            }
        }

        // Fetch subscription status
        setIsSubscriptionLoading(true);
        getSubscriptionStatus()
            .then(data => {
                console.log("Subscription API response:", data);
                if (data.success) {
                    setSubscription(data);
                }
            })
            .catch(err => {
                console.error("Failed to fetch subscription status:", err);
            })
            .finally(() => {
                setIsSubscriptionLoading(false);
            });

        const timeoutId = window.setTimeout(() => {
            void loadChats();
        }, 0);

        return () => window.clearTimeout(timeoutId);
    }, [authed, loadChats]);

    const handleAuthSuccess = () => {
        setAuthed(true);
        setIsAuthOpen(false);
        void loadChats();
    };

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

    const handleGenerateMockPaper = async (config: MockPaperConfig) => {
        setIsMockPaperModalOpen(false);
        setIsGeneratingPaper(true);
        setPaperConfig(config);

        const examName = config.examType === 'Other' ? config.customExamType : config.examType;
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

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsProcessingFile(true);
        try {
            const processed = await processFile(file);
            setSelectedFile(processed);

            if (processed.isImage && !processed.isPdf) {
                // Regular image → Vision Solver
                setSelectedEngine("Vision Solver");
                toast.success(`Image "${processed.name}" ready — Vision Solver selected`);
            } else if (processed.isPdf) {
                if (processed.isImage) {
                    // Scanned / image-only PDF → PDF Research (will use OCR modality)
                    setSelectedEngine("PDF Research");
                    toast.success(`Scanned PDF "${processed.name}" ready — using OCR mode`);
                } else if (file.name.toLowerCase().includes("resume") || file.name.toLowerCase().includes("cv")) {
                    setSelectedEngine("Resume Audit");
                    toast.success(`Resume "${processed.name}" ready — Resume Audit selected`);
                } else {
                    setSelectedEngine("PDF Research");
                    toast.success(`PDF "${processed.name}" ready — PDF Research selected`);
                }
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

        const apiKey = getApiKey();
        if (!apiKey) {
            toast.error("Please login first");
            return;
        }

        setIsLoading(true);
        setChatError(null);

        let currentChatId = activeChatId;
        const currentEngine = engines.find(e => e.name === selectedEngine) || engines[0];

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
            let requestModality: string = currentEngine.name === "Vision Solver" ? "vision" : "text";
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
                    // ── Regular image → Vision Solver ──────────────────────────────
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

            const userMessage: Message = {
                role: "user",
                content: displayContent,
                timestamp: formatTimestamp()
            };

            const conversationHistory = [
                ...messages
                    .filter((message) => !message.localOnly && message.content.trim())
                    .map((message) => ({
                        role: message.role,
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
                chat_id: currentChatId,
                modality: requestModality
            });

            // Backend returns { success, model, data: choices_array }
            const firstChoice = data.data?.[0];
            const aiContent = firstChoice?.message?.content
                || firstChoice?.text
                || (firstChoice ? JSON.stringify(firstChoice) : null)
                || "Response received from Rudranex AI.";

            const aiResponse: Message = {
                role: "assistant",
                content: aiContent,
                timestamp: formatTimestamp()
            };

            setMessages((prev) => [...prev, aiResponse]);
        } catch (error) {
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
            setIsLoading(false);
        }
    };

    if (authed === null) {
        return (
            <div className="h-screen w-full bg-[#0a0a0a] text-white flex items-center justify-center">
                <ChatLoader isDarkMode={isDarkMode} />
            </div>
        );
    }

    if (!authed) {
        return (
            <div className="h-screen w-full bg-[#0a0a0a] text-white flex flex-col items-center justify-center selection:bg-white selection:text-black">
                <div className="text-center mb-8">
                    <div className="flex items-baseline gap-1.5 justify-center mb-4">
                        <span className="font-display font-black text-5xl tracking-tighter text-white">RUDRANEX</span>
                        <span className="font-serif text-5xl text-white/40 italic">ai</span>
                    </div>
                    <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-white/40">Authentication Required</p>
                </div>
                <button
                    onClick={() => setIsAuthOpen(true)}
                    className="px-8 py-3.5 bg-white text-black text-[10px] font-mono uppercase tracking-[0.2em] font-bold hover:bg-white/90 transition-all active:scale-95 rounded-lg"
                >
                    Sign In to Continue →
                </button>
                <AuthCard
                    isOpen={isAuthOpen}
                    onClose={() => setIsAuthOpen(false)}
                    onSuccess={handleAuthSuccess}
                    initialMode="login"
                />
            </div>
        );
    }

    return (
        <div className={`h-screen w-full ${isDarkMode ? "bg-[#0a0a0a] text-white" : "bg-white text-black"} selection:bg-white selection:text-black flex font-sans overflow-hidden transition-colors duration-500 ${isDarkMode ? "custom-scrollbar" : "light-scrollbar"}`}>
            <div className={`absolute inset-0 noise opacity-[0.02] pointer-events-none ${isDarkMode ? "invert-0" : "invert"}`} />

            <aside
                style={{ width: isSidebarCollapsed ? "0px" : `${sidebarWidth}px` }}
                className={`h-full border-r ${isDarkMode ? "border-white/5 bg-[#0a0a0a]" : "border-black/15 bg-[#fcfcfc]"} flex flex-col relative z-20 transition-[width] duration-300 ease-in-out ${isResizingLeft ? "transition-none" : ""}`}
            >
                {!isSidebarCollapsed && (
                    <div className="flex flex-col h-full overflow-hidden">
                        <div className={`p-6 border-b ${isDarkMode ? "border-white/5" : "border-black/15"} flex items-center justify-between`}>
                            <Link href="/" className="flex items-center gap-3">
                                <div className={`h-5 w-5 ${isDarkMode ? "bg-white text-black" : "bg-black text-white"} flex items-center justify-center`}>
                                    <div className={`h-1 w-1 ${isDarkMode ? "bg-black" : "bg-white"}`} />
                                </div>
                            </Link>
                            <button
                                onClick={handleCreateChat}
                                disabled={isCreatingChat}
                                className={`p-2 hover:bg-white/5 transition-colors border disabled:opacity-50 ${isDarkMode ? "border-white/10" : "border-black/10"}`}
                            >
                                <Plus className="h-4 w-4" />
                            </button>
                        </div>

                        <div className={`flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-2 ${isDarkMode ? "custom-scrollbar" : "light-scrollbar"}`}>
                            {sidebarWidth > 120 && (
                                <div className="mb-8">
                                    <div className="relative group">
                                        <Search className={`absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 ${isDarkMode ? "text-white/20 group-focus-within:text-white/60" : "text-black/40 group-focus-within:text-black/80"} transition-colors`} />
                                        <input
                                            type="text"
                                            placeholder="Search sessions..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className={`w-full ${isDarkMode ? "bg-white/5 border-white/5" : "bg-black/5 border-black/5"} border p-2 pl-9 text-[10px] font-mono uppercase tracking-widest focus:outline-none focus:border-white/20 transition-all`}
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="space-y-1">
                                {sidebarWidth > 120 && <span className={`px-2 text-[9px] font-mono uppercase tracking-[0.3em] ${isDarkMode ? "text-white/20" : "text-black/40"}`}>Recent Sessions</span>}
                                {isSessionsLoading && (
                                    <div className={`px-3 py-4 text-[10px] font-mono uppercase tracking-[0.2em] ${isDarkMode ? "text-white/30" : "text-black/40"}`}>
                                        Loading sessions...
                                    </div>
                                )}
                                {!isSessionsLoading && filteredChats.length === 0 && (
                                    <div className={`px-3 py-4 text-[10px] font-mono uppercase tracking-[0.2em] ${isDarkMode ? "text-white/30" : "text-black/40"}`}>
                                        {searchQuery ? "No matching sessions" : "No chats yet"}
                                    </div>
                                )}
                                {!isSessionsLoading && filteredChats.map((chat) => (
                                    <div
                                        key={chat.id}
                                        className={`group flex items-center gap-2 pr-2 ${activeChatId === chat.id ? (isDarkMode ? "bg-white/5 border-l border-white" : "bg-black/5 border-l border-black") : ""}`}
                                    >
                                        <button
                                            onClick={() => void openChat(chat.id)}
                                            className={`flex-1 text-left p-3 text-xs flex items-center gap-3 transition-colors min-w-0 ${activeChatId === chat.id ? "" : "hover:bg-white/5"}`}
                                        >
                                            <MessageSquare className={`h-3 w-3 flex-shrink-0 ${isDarkMode ? "text-white/20" : "text-black/40"}`} />
                                            {sidebarWidth > 120 && <span className="truncate opacity-60 font-sans">{chat.title}</span>}
                                        </button>
                                        {sidebarWidth > 120 && (
                                            <button
                                                onClick={() => void handleDeleteChat(chat.id)}
                                                className={`opacity-0 group-hover:opacity-100 transition-opacity p-1.5 flex-shrink-0 ${isDarkMode ? "text-white/40 hover:text-white" : "text-black/40 hover:text-black"}`}
                                                aria-label={`Delete ${chat.title}`}
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                                {chatError && sidebarWidth > 120 && (
                                    <p className="px-2 pt-3 text-[10px] text-red-400">{chatError}</p>
                                )}
                            </div>
                        </div>

                        {/* User Profile */}
                        <div className={`p-6 border-t ${isDarkMode ? "border-white/5 bg-black/40" : "border-black/15 bg-white"}`}>
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className={`h-10 w-10 ${isDarkMode ? "bg-white/5 border-white/10" : "bg-black/5 border-black/10"} border flex items-center justify-center relative group`}>
                                        <User className={`h-5 w-5 ${isDarkMode ? "text-white/40" : "text-black/60"}`} />
                                        <div className={`absolute top-0 left-0 w-1 h-1 border-t border-l ${isDarkMode ? "border-white/40" : "border-black/40"}`} />
                                    </div>
                                    {sidebarWidth > 120 && (
                                        <div className="flex flex-col">
                                            <span className={`text-xs font-bold ${isDarkMode ? "text-white" : "text-black"}`}>{userName || userEmail || "User"}</span>
                                            <span className="text-[9px] font-mono uppercase tracking-widest text-white/30">Pro Member</span>
                                        </div>
                                    )}
                                </div>
                                <button
                                    onClick={() => setIsDarkMode(!isDarkMode)}
                                    className={`p-2 border transition-colors ${isDarkMode ? "border-white/10 hover:bg-white/5" : "border-black/10 hover:bg-black/5"}`}
                                    title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                                >
                                    {isDarkMode ? <Moon className="h-4 w-4 text-white/40" /> : <Sun className="h-4 w-4 text-black/80" />}
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
                                className={`w-full flex items-center justify-center gap-3 p-3 border ${isDarkMode ? "border-white/10 bg-white/5" : "border-black/10 bg-black/5"} text-[10px] font-mono uppercase tracking-widest hover:bg-white/10 transition-all active:scale-95`}
                            >
                                <LogOut className="h-3 w-3" /> {sidebarWidth > 120 && "Logout session"}
                            </button>
                        </div>
                    </div>
                )}

                {/* Resize Handle */}
                <div
                    onMouseDown={startResizingLeft}
                    className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-white/10 transition-colors z-30"
                />

                {/* Left Toggle Button */}
                <button
                    onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                    className={`absolute top-1/2 -translate-y-1/2 z-50 p-1 bg-[#0a0a0a] border border-white/10 text-white/40 hover:text-white transition-all rounded-full shadow-xl shadow-black/20`}
                    style={{ right: isSidebarCollapsed ? "-2rem" : "-0.75rem" }}
                >
                    {isSidebarCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
                </button>
            </aside>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col relative h-full overflow-hidden">
                {/* Fixed Header / Navbar */}
                <header className={`h-20 flex-shrink-0 border-b ${isDarkMode ? "border-white/5 bg-[#0a0a0a]/80" : "border-black/15 bg-white/80"} backdrop-blur-xl flex items-center justify-between px-10 relative z-30`}>
                    <div className="flex items-center gap-4">
                        <div className={`h-6 w-6 ${isDarkMode ? "bg-white" : "bg-black"} flex items-center justify-center`}>
                            <div className={`h-1.5 w-1.5 ${isDarkMode ? "bg-black" : "bg-white"}`} />
                        </div>
                        <div className="flex items-baseline gap-1.5">
                            <span className={`font-display font-black text-lg tracking-tighter ${isDarkMode ? "text-white" : "text-black"}`}>RUDRANEX</span>
                            <span className={`font-serif text-lg ${isDarkMode ? "text-white/40" : "text-black/40"} italic`}>ai</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="hidden md:flex flex-col text-right">
                            <span className={`text-[9px] font-mono uppercase tracking-[0.2em] ${isDarkMode ? "text-white/30" : "text-black/40"}`}>Current Session</span>
                            <span className={`text-xs ${isDarkMode ? "text-white/70" : "text-black/70"}`}>{activeChat?.title || "Unsaved chat"}</span>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                            <div className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-pulse" />
                            <span className="text-[9px] font-mono text-emerald-500 uppercase tracking-widest">Active</span>
                        </div>
                        <button
                            onClick={() => {
                                removeApiKey();
                                setStoredActiveChatId(null);
                                setAuthed(false);
                                window.location.href = "/";
                            }}
                            className="px-4 py-2 border border-white/10 text-white/60 text-[10px] font-mono uppercase tracking-widest hover:bg-white/5 transition-all flex items-center gap-2"
                        >
                            <LogOut className="h-3 w-3" />
                            Logout
                        </button>
                    </div>
                </header>

                <main className={`flex-1 overflow-y-auto pt-10 pb-44 px-6 md:px-20 relative z-10 ${isDarkMode ? "custom-scrollbar" : "light-scrollbar"}`}>
                    <div className="max-w-4xl mx-auto">
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
                                {messages.map((msg, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                                        className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                                    >
                                        <div className={`flex flex-col ${msg.role === "user" ? "items-end max-w-[85%]" : "items-start max-w-[85%]"}`}>
                                            <div className="flex items-center gap-3 mb-4">
                                                <span className={`text-[9px] font-mono uppercase tracking-[0.2em] ${isDarkMode ? "text-white/30" : "text-black/30"}`}>
                                                    {msg.role === "assistant" ? "§ RUDRA_AI" : "§ STUDENT_USER"}
                                                </span>
                                                <span className={`text-[9px] font-mono ${isDarkMode ? "text-white/20" : "text-black/20"}`}>{msg.timestamp}</span>
                                            </div>

                                            <div className={`p-8 border ${msg.role === "user"
                                                ? (isDarkMode ? "border-white/10 bg-white/5 rounded-none" : "border-black/10 bg-black/5 rounded-none")
                                                : (isDarkMode ? "border-white/20 bg-transparent rounded-[2.5rem]" : "border-black/20 bg-transparent rounded-[2.5rem]")
                                                } relative group`}>
                                                {msg.role === "user" ? (
                                                    <p className={`text-base md:text-lg leading-relaxed ${isDarkMode ? "text-white font-sans" : "text-black font-sans"}`}>
                                                        {msg.content}
                                                    </p>
                                                ) : (
                                                    <MarkdownRenderer content={msg.content} isDarkMode={isDarkMode} />
                                                )}

                                                {msg.role === "user" && (
                                                    <>
                                                        <div className={`absolute top-0 left-0 w-1.5 h-1.5 border-t border-l ${isDarkMode ? "border-white/20" : "border-black/20"}`} />
                                                        <div className={`absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r ${isDarkMode ? "border-white/20" : "border-black/20"}`} />
                                                    </>
                                                )}
                                            </div>

                                            {/* Action Buttons */}
                                            <div className={`flex items-center gap-4 mt-3 ${msg.role === "user" ? "justify-end" : "justify-start px-8"}`}>
                                                {msg.role === "user" ? (
                                                    <>
                                                        <button onClick={() => setInput(msg.content)} className={`p-1.5 hover:bg-white/10 rounded transition-colors ${isDarkMode ? "text-white/60 hover:text-white" : "text-black/60 hover:text-black"}`}>
                                                            <div className="flex items-center gap-1.5">
                                                                <Edit3 className="h-3 w-3" />
                                                                <span className="text-[8px] font-mono uppercase tracking-widest">Edit</span>
                                                            </div>
                                                        </button>
                                                        <button onClick={() => copyToClipboard(msg.content)} className={`p-1.5 hover:bg-white/10 rounded transition-colors ${isDarkMode ? "text-white/60 hover:text-white" : "text-black/60 hover:text-black"}`}>
                                                            <div className="flex items-center gap-1.5">
                                                                <Copy className="h-3 w-3" />
                                                                <span className="text-[8px] font-mono uppercase tracking-widest">Copy</span>
                                                            </div>
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button className={`p-1.5 hover:bg-white/10 rounded transition-colors ${isDarkMode ? "text-white/60 hover:text-white" : "text-black/60 hover:text-black"}`}>
                                                            <ThumbsUp className="h-3 w-3" />
                                                        </button>
                                                        <button className={`p-1.5 hover:bg-white/10 rounded transition-colors ${isDarkMode ? "text-white/60 hover:text-white" : "text-black/60 hover:text-black"}`}>
                                                            <ThumbsDown className="h-3 w-3" />
                                                        </button>
                                                        <button onClick={() => copyToClipboard(msg.content)} className={`p-1.5 hover:bg-white/10 rounded transition-colors ${isDarkMode ? "text-white/60 hover:text-white" : "text-black/60 hover:text-black"}`}>
                                                            <div className="flex items-center gap-1.5">
                                                                <Copy className="h-3 w-3" />
                                                                <span className="text-[8px] font-mono uppercase tracking-widest">Copy</span>
                                                            </div>
                                                        </button>
                                                        <button onClick={() => retryMessage(i)} className={`p-1.5 hover:bg-white/10 rounded transition-colors ${isDarkMode ? "text-white/60 hover:text-white" : "text-black/60 hover:text-black"}`}>
                                                            <div className="flex items-center gap-1.5">
                                                                <RotateCcw className="h-3 w-3" />
                                                                <span className="text-[8px] font-mono uppercase tracking-widest">Retry</span>
                                                            </div>
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                            {isLoading && <ChatLoader isDarkMode={isDarkMode} />}
                            <div ref={messagesEndRef} />
                        </div>
                    </div>
                </main>

                {/* Input Bar */}
                <div className={`absolute bottom-0 left-0 right-0 z-50 p-10 ${isDarkMode ? "bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]" : "bg-gradient-to-t from-white via-white"} to-transparent flex justify-center`}>
                    <div className="w-full max-w-4xl relative">
                        <div className="absolute -top-14 left-0 right-0 flex justify-between px-2">
                            <div className="flex gap-4">
                                <div className="relative">
                                    <button
                                        onClick={() => setShowEngineSelect(!showEngineSelect)}
                                        className={`flex items-center gap-3 px-4 py-2 border ${isDarkMode ? "bg-white/5 border-white/10 text-white/60" : "bg-black/5 border-black/10 text-black/60"} text-[10px] font-mono uppercase tracking-widest hover:border-white/30 transition-all`}
                                    >
                                        <Bot className="h-3 w-3" />
                                        {selectedEngine}
                                        <ChevronUp className={`h-3 w-3 transition-transform ${showEngineSelect ? "rotate-180" : ""}`} />
                                    </button>

                                    <AnimatePresence>
                                        {showEngineSelect && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                className={`absolute bottom-full left-0 mb-4 w-72 ${isDarkMode ? "bg-[#0d0d0d] border-white/10" : "bg-white border-black/10"} border p-2 shadow-2xl z-50`}
                                            >
                                                <div className="px-4 py-3 border-b border-white/5 flex justify-between items-center mb-2">
                                                    <span className="text-[10px] font-mono font-bold text-emerald-500 tracking-[0.2em]">SELECT AI ENGINE</span>
                                                    <span className={`px-2 py-0.5 ${isDarkMode ? "bg-white/10 text-white/40" : "bg-black/10 text-black/40"} text-[8px] font-mono rounded`}>FREE</span>
                                                </div>
                                                <div className="space-y-1">
                                                    {engines.map((engine) => (
                                                        <button
                                                            key={engine.name}
                                                            onClick={() => {
                                                                if (engine.name === "Interview Prep") {
                                                                    setShowEngineSelect(false);
                                                                    setIsInterviewModalOpen(true);
                                                                } else if (engine.name === "Mock Paper Generator") {
                                                                    setShowEngineSelect(false);
                                                                    setIsMockPaperModalOpen(true);
                                                                } else {
                                                                    setSelectedEngine(engine.name);
                                                                    setShowEngineSelect(false);
                                                                }
                                                            }}
                                                            className={`w-full flex items-center justify-between p-3 transition-colors ${selectedEngine === engine.name ? (isDarkMode ? "bg-white/5" : "bg-black/10") : (isDarkMode ? "hover:bg-white/5" : "hover:bg-black/5")}`}
                                                        >
                                                            <div className="flex items-center gap-4">
                                                                <engine.icon className={`h-4 w-4 ${isDarkMode ? "text-white/40" : "text-black/40"}`} />
                                                                <span className="text-xs font-medium">{engine.name}</span>
                                                            </div>
                                                            <span className="text-[10px] font-mono font-bold opacity-40">{engine.version}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        </div>

                        <div className="relative">
                            {/* File Preview */}
                            <AnimatePresence>
                                {selectedFile && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 10 }}
                                        className={`absolute bottom-full left-4 mb-4 p-4 border ${isDarkMode ? "bg-[#0d0d0d] border-white/10" : "bg-white border-black/10"} flex items-center gap-4 shadow-2xl z-40`}
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
                                            className="p-1 hover:bg-white/10 rounded-full transition-colors"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center gap-2 z-10">
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isLoading || isProcessingFile}
                                    className={`p-3 ${isDarkMode ? "text-white/40 hover:text-white" : "text-black/40 hover:text-black"} transition-all active:scale-95`}
                                    title="Attach File"
                                >
                                    {isProcessingFile ? (
                                        <div className="h-4 w-4 border-2 border-emerald-500 border-t-transparent animate-spin rounded-full" />
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

                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && !isProcessingFile && void handleSend()}
                                placeholder={isProcessingFile ? "Processing file..." : "Describe your query or paste a concept..."}
                                className={`w-full bg-transparent border-b ${isDarkMode ? "border-white/10 placeholder:text-white/10" : "border-black/10 placeholder:text-black/10"} p-5 pl-14 pr-32 text-base focus:outline-none focus:border-white/40 transition-all`}
                            />
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                <button
                                    onClick={() => void handleSend()}
                                    disabled={isLoading || isHistoryLoading || isProcessingFile}
                                    className={`p-3 disabled:opacity-50 ${isDarkMode ? "bg-white text-black" : "bg-black text-white"} hover:opacity-90 transition-all active:scale-95`}
                                >
                                    <Send className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Sidebar */}
            <aside
                style={{ width: isRightSidebarCollapsed ? "0px" : `${rightSidebarWidth}px` }}
                className={`h-full border-l ${isDarkMode ? "border-white/5 bg-[#0a0a0a]" : "border-black/15 bg-[#fcfcfc]"} flex flex-col relative z-20 transition-[width] duration-300 ease-in-out ${isResizingRight ? "transition-none" : ""}`}
            >
                {!isRightSidebarCollapsed && (
                    <div className="flex flex-col h-full overflow-hidden">
                        <div className={`p-8 border-b ${isDarkMode ? "border-white/5" : "border-black/15"} ${isDarkMode ? "custom-scrollbar" : "light-scrollbar"}`}>
                            {/* Plan Badge */}
                            <div className="flex justify-between items-start mb-8">
                                <div className="flex flex-col">
                                    <span className={`text-[8px] font-mono uppercase tracking-[0.3em] ${isDarkMode ? "text-white/20" : "text-black/40"} mb-1`}>Active Plan</span>
                                    <div className="flex items-center gap-2">
                                        <div className={`h-1.5 w-1.5 rounded-full animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.5)] ${subscription?.subscription ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                        <span className={`text-xs font-bold ${isDarkMode ? "text-white" : "text-black"} tracking-widest uppercase`}>
                                            {isSubscriptionLoading ? "Loading..." : (subscription?.subscription?.plan_name || "Free Trial")}
                                        </span>
                                    </div>
                                </div>
                                <div className={`h-8 w-8 ${isDarkMode ? "bg-white/5 border-white/10" : "bg-black/5 border-black/10"} border flex items-center justify-center`}>
                                    <Zap className={`h-4 w-4 ${subscription?.subscription?.plan_name?.toLowerCase().includes('pro') ? 'text-amber-500' : 'text-white/40'}`} />
                                </div>
                            </div>

                            {/* Circular Usage Chart */}
                            <div className="relative w-32 h-32 mx-auto mb-8 flex-shrink-0">
                                <svg className="w-full h-full rotate-[-90deg]">
                                    <circle cx="64" cy="64" r="58" fill="none" stroke={isDarkMode ? "#ffffff05" : "#00000005"} strokeWidth="6" />
                                    <circle
                                        cx="64" cy="64" r="58" fill="none"
                                        stroke={isDarkMode ? "#10b981" : "black"}
                                        strokeWidth="6"
                                        strokeDasharray="364"
                                        strokeDashoffset={String(
                                            isSubscriptionLoading || !subscription?.usage || !subscription?.subscription?.details?.daily_chat_limit
                                                ? 364
                                                : 364 - ((subscription.usage.daily_chats / subscription.subscription.details.daily_chat_limit) * 364)
                                        )}
                                        strokeLinecap="round"
                                        className="transition-all duration-1000"
                                    />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <ChatLoader isDarkMode={isDarkMode} />
                                </div>
                            </div>

                            {/* Detailed Metrics */}
                            <div className="space-y-4 mb-8">
                                <div className={`flex justify-between items-center text-[10px] font-mono ${isDarkMode ? "text-white" : "text-black"}`}>
                                    <span className="opacity-40 uppercase tracking-widest">Tokens Used</span>
                                    <span className="font-bold">
                                        {isSubscriptionLoading ? "..." : (
                                            subscription?.usage?.daily_chats !== undefined
                                                ? `${subscription.usage.daily_chats} / ${subscription.subscription?.details?.daily_chat_limit || 0}`
                                                : "0 / 0"
                                        )}
                                    </span>
                                </div>
                                <div className={`h-[1px] w-full ${isDarkMode ? "bg-white/5" : "bg-black/10"}`} />
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex flex-col">
                                        <span className={`text-[8px] font-mono uppercase ${isDarkMode ? "text-white/20" : "text-black/40"} tracking-widest mb-1`}>Images</span>
                                        <span className={`text-[10px] font-bold ${isDarkMode ? "text-white" : "text-black"}`}>
                                            {isSubscriptionLoading ? "..." : (
                                                subscription?.usage?.monthly_images !== undefined
                                                    ? `${subscription.usage.monthly_images} / ${subscription.subscription?.details?.monthly_image_limit || 0}`
                                                    : "0 / 0"
                                            )}
                                        </span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className={`text-[8px] font-mono uppercase ${isDarkMode ? "text-white/20" : "text-black/40"} tracking-widest mb-1`}>Coding</span>
                                        <span className={`text-[10px] font-bold ${isDarkMode ? "text-white" : "text-black"}`}>
                                            {isSubscriptionLoading ? "..." : (
                                                subscription?.usage?.daily_codings !== undefined
                                                    ? `${subscription.usage.daily_codings} / ${subscription.subscription?.details?.daily_coding_limit || 0}`
                                                    : "0 / 0"
                                            )}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <Link href="/pricing" className="block w-full">
                                <motion.button
                                    whileHover={{ scale: 1.02, boxShadow: "0 0 25px rgba(212, 175, 55, 0.2)" }}
                                    whileTap={{ scale: 0.98 }}
                                    className="w-full bg-[#D4AF37] relative group overflow-hidden border border-black/10 py-3.5 shadow-lg"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />

                                    <div className="flex items-center justify-center gap-2 relative z-10">
                                        <Zap className="h-3 w-3 fill-black text-black" />
                                        <span className="text-black font-mono text-[10px] font-black uppercase tracking-[0.2em]">Upgrade Now</span>
                                    </div>

                                    <div className="absolute top-0 left-0 w-1 h-1 border-t border-l border-black/30" />
                                    <div className="absolute bottom-0 right-0 w-1 h-1 border-b border-r border-black/30" />
                                </motion.button>
                            </Link>
                        </div>

                        <div className={`flex-1 p-8 space-y-12 overflow-y-auto ${isDarkMode ? "custom-scrollbar" : "light-scrollbar"}`}>
                            {/* Secondary Metrics */}
                            <div className="space-y-6">
                                <span className={`text-[10px] font-mono uppercase tracking-[0.3em] ${isDarkMode ? "text-white" : "text-black"} block border-l-2 border-emerald-400 bg-emerald-400/10 pl-2 py-1`}>System Status</span>
                                <div className="space-y-2">
                                    <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                        <div className="h-full w-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]" />
                                    </div>
                                    <div className="flex justify-between text-[8px] font-mono uppercase opacity-40">
                                        <span>Backend</span>
                                        <span>Stable</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Right Resize Handle */}
                <div
                    onMouseDown={startResizingRight}
                    className="absolute top-0 left-0 w-1 h-full cursor-col-resize hover:bg-white/10 transition-colors z-30"
                />

                {/* Right Toggle Button */}
                <button
                    onClick={() => setIsRightSidebarCollapsed(!isRightSidebarCollapsed)}
                    className={`absolute top-1/2 -translate-y-1/2 z-50 p-1 bg-[#0a0a0a] border border-white/10 text-white/40 hover:text-white transition-all rounded-full shadow-xl shadow-black/20`}
                    style={{ left: isRightSidebarCollapsed ? "-2rem" : "-0.75rem" }}
                >
                    {isRightSidebarCollapsed ? <ChevronLeft className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                </button>
            </aside>

            {/* Ambient Background Grid */}
            <div className={`fixed inset-0 z-0 pointer-events-none overflow-hidden opacity-10 ${isDarkMode ? "invert-0" : "invert"}`}>
                <div className="absolute inset-0" style={{
                    backgroundImage: `linear-gradient(to right, #ffffff05 1px, transparent 1px), linear-gradient(to bottom, #ffffff05 1px, transparent 1px)`,
                    backgroundSize: '100px 100px'
                }} />
            </div>

            {/* Mock Paper Generation Overlay */}
            {isGeneratingPaper && (
                <div className="fixed inset-0 z-[300] bg-black/90 backdrop-blur-xl flex items-center justify-center flex-col">
                    <ChatLoader isDarkMode={true} />
                    <div className="mt-12 text-center">
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: [0.4, 1, 0.4] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="text-[11px] font-mono uppercase tracking-[0.5em] text-emerald-500 font-black"
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
        </div>
    );
};

export default Chat;
