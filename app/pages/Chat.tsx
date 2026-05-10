"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Send, Bot, User, LogOut, MessageSquare, Plus, Search,
    ChevronLeft, ChevronRight, Moon, Sun, GraduationCap,
    Code2, FileText, Calendar, UserCog, Mic, ChevronUp,
    ThumbsUp, ThumbsDown, RotateCcw, Edit3, Copy, Clock, Trash2,
    Paperclip, X, ImageIcon, FileDown, FileText as FileIcon, Sparkles
} from "lucide-react";
import Link from "next/link";
import { isAuthenticated, getApiKey, removeApiKey, getUserInfo, removeUserInfo } from "@/lib/auth";
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
    getSubscriptionStatus
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
    const { isDarkMode, toggleTheme } = useTheme();
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
    const [isPersonaModalOpen, setIsPersonaModalOpen] = useState(false);
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
    const PLACEHOLDER_TEXTS = useMemo(() => [
        "Describe your query or paste a concept...",
        "Ask me anything about your studies...",
        "Upload a file or type your question...",
        "How can I assist your learning today?",
        "Paste a topic and I'll explain it..."
    ], []);
    const [placeholderIndex, setPlaceholderIndex] = useState(0);
    const [typedPlaceholder, setTypedPlaceholder] = useState(PLACEHOLDER_TEXTS[0]);
    const [placeholderCharPos, setPlaceholderCharPos] = useState(PLACEHOLDER_TEXTS[0].length);
    const [editingChatId, setEditingChatId] = useState<string | null>(null);
    const [editingTitle, setEditingTitle] = useState("");
    const editingInputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const requestStartTime = useRef<number>(0);
    const engineSelectRef = useRef<HTMLDivElement>(null);

    const [subscription, setSubscription] = useState<any>(null);
    const [isSubscriptionLoading, setIsSubscriptionLoading] = useState(false);

    const engines = [
        { name: "Student Mode", endpoint: "/chat", version: "1.0", icon: GraduationCap },
        { name: "Coding & GitHub", endpoint: "/tools/coding", version: "2.0", icon: Code2 },
        { name: "Interview Prep", endpoint: "/tools/interview", version: "1.0", icon: UserCog },
        { name: "Resume Audit", endpoint: "/tools/resume", version: "1.0", icon: FileText },
        { name: "PDF Research", endpoint: "/features/pdf/intel", version: "1.0", icon: Calendar },
        { name: "Mock Paper Generator", endpoint: "/chat", version: "1.0", icon: MockIcon },
        { name: "Persona Mode", endpoint: "/chat", version: "1.0", icon: Sparkles },
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
        const lastMessage = messages[messages.length - 1];
        if (lastMessage?.role === "user" && !lastMessage.localOnly) {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    useEffect(() => {
        if (mcqSession) {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, mcqSession]);

    useEffect(() => {
        if (isProcessingFile) return;
        const interval = setInterval(() => {
            setPlaceholderIndex(prev => (prev + 1) % PLACEHOLDER_TEXTS.length);
            setPlaceholderCharPos(0);
        }, 4000);
        return () => clearInterval(interval);
    }, [PLACEHOLDER_TEXTS.length, isProcessingFile]);

    useEffect(() => {
        if (isProcessingFile) return;
        const currentText = PLACEHOLDER_TEXTS[placeholderIndex];
        if (placeholderCharPos < currentText.length) {
            const timeout = setTimeout(() => {
                const nextPos = Math.min(placeholderCharPos + 1, currentText.length);
                setTypedPlaceholder(currentText.slice(0, nextPos));
                setPlaceholderCharPos(nextPos);
            }, 30);
            return () => clearTimeout(timeout);
        }
    }, [placeholderCharPos, placeholderIndex, PLACEHOLDER_TEXTS, isProcessingFile]);

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
                .replace(/`{3}(\w*)\n?([\s\S]*?)`{3}/g, '<pre style="background:'+(isDark?'#1a1a1a':'#f5f5f5')+';padding:16px;border-radius:8px;overflow-x:auto;white-space:pre-wrap;font-size:13px;margin:12px 0;"><code>$2</code></pre>')
                .replace(/`([^`]+)`/g, '<code style="background:'+(isDark?'#1a1a1a':'#f5f5f5')+';padding:2px 6px;border-radius:4px;font-size:13px;">$1</code>')
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
        setShowDots(true);
        setChatError(null);
        setResponseTime(null);
        const requestStart = Date.now();

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
            const aiContent = firstChoice?.message?.content
                || firstChoice?.text
                || (firstChoice ? JSON.stringify(firstChoice) : null)
                || "Response received from Rudranex AI.";
            console.log("AI Content:", aiContent);

            setShowDots(false);

            // Stream simulation - render text character by character
            const assistantMessage: Message = {
                role: "assistant",
                content: "",
                timestamp: formatTimestamp()
            };
            setMessages((prev) => [...prev, assistantMessage]);

            for (let i = 0; i < aiContent.length; i++) {
                await new Promise(resolve => setTimeout(resolve, 10)); // 10ms delay per char
                const currentText = aiContent.slice(0, i + 1);
                setMessages((prev) => {
                    const newMessages = [...prev];
                    const lastMsg = newMessages[newMessages.length - 1];
                    if (lastMsg && lastMsg.role === "assistant") {
                        lastMsg.content = currentText;
                    }
                    return newMessages;
                });
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
        window.location.href = "/auth";
        return null;
    }

    const isChatEmpty = messages.length === 0 || messages.every((msg) => msg.localOnly);

    return (
        <div className={`h-screen w-full ${isDarkMode ? "bg-[#0a0a0a] text-white" : "bg-white text-black"} selection:bg-white selection:text-black flex font-sans overflow-hidden transition-colors duration-500 ${isDarkMode ? "custom-scrollbar" : "light-scrollbar"}`}>
            <div className={`absolute inset-0 noise opacity-[0.02] pointer-events-none ${isDarkMode ? "invert-0" : "invert"}`} />

            <aside
                style={{ width: isSidebarCollapsed ? "0px" : `${sidebarWidth}px` }}
                className={`h-full border-r-2 ${isDarkMode ? "border-white bg-[#0a0a0a]" : "border-black bg-[#fcfcfc]"} flex flex-col relative z-20 transition-[width] duration-300 ease-in-out ${isResizingLeft ? "transition-none" : ""}`}
            >
                {!isSidebarCollapsed && (
                    <div className="flex flex-col h-full overflow-hidden">
                        <div className={`p-6 border-b-2 ${isDarkMode ? "border-white" : "border-black"} flex items-center justify-between`}>
                            <Link href="/" className="flex items-center gap-3">
                                <div className={`h-[38px] w-[38px] border-2 ${isDarkMode ? "border-white" : "border-black"} flex items-center justify-center`}>
                                    <svg width="36" height="36" viewBox="0 0 128 128" className={isDarkMode ? "text-white" : "text-black"}>
                                        <polygon
                                            points="20,20 86,20 86,55 58,55 58,40 42,40 42,55 42,68 104,108 78,108 50,72 42,72 42,108 20,108"
                                            fill="currentColor"
                                        />
                                    </svg>
                                </div>
                            </Link>
                            <button
                                onClick={handleCreateChat}
                                disabled={isCreatingChat}
                                className={`p-2 transition-all duration-300 border-2 disabled:opacity-50 ${isDarkMode ? "bg-white border-white hover:bg-gray-200 hover:scale-110 hover:shadow-[0_0_15px_rgba(255,255,255,0.3)]" : "bg-white border-black hover:bg-gray-50 hover:scale-110 hover:shadow-[0_0_15px_rgba(0,0,0,0.3)]"} group`}
                            >
                                <Plus className={`h-4 w-4 ${isDarkMode ? "text-black group-hover:text-black" : "text-black group-hover:text-black"} transition-transform group-hover:rotate-90`} />
                            </button>
                        </div>

                        {/* Sidebar Tab Switcher */}
                        <div className={`flex ${isDarkMode ? "border-white" : "border-black"} border-b-2`}>
                            <button
                                onClick={() => setSidebarTab("history")}
                                className={`flex-1 py-3 text-[9px] font-mono uppercase tracking-[0.2em] transition-all ${
                                    sidebarTab === "history"
                                        ? (isDarkMode ? "bg-white text-black font-bold" : "bg-black text-white font-bold")
                                        : (isDarkMode ? "text-white/40 hover:text-white hover:bg-white/5" : "text-black/40 hover:text-black hover:bg-black/5")
                                }`}
                            >
                                <Clock className="h-3 w-3 inline mr-1.5 -mt-0.5" />
                                History
                            </button>
                            <button
                                onClick={() => setSidebarTab("modes")}
                                className={`flex-1 py-3 text-[9px] font-mono uppercase tracking-[0.2em] transition-all ${
                                    sidebarTab === "modes"
                                        ? (isDarkMode ? "bg-white text-black font-bold" : "bg-black text-white font-bold")
                                        : (isDarkMode ? "text-white/40 hover:text-white hover:bg-white/5" : "text-black/40 hover:text-black hover:bg-black/5")
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
                                                    className={`w-full ${isDarkMode ? "bg-white/5 border-white placeholder:text-white/30" : "bg-white border-black placeholder:text-black/50"} border p-2 pl-9 text-[10px] font-mono uppercase tracking-widest focus:outline-none focus:border-white transition-all ${isDarkMode ? "text-white" : "text-black"}`}
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
                                                className={`group flex items-center gap-1 pr-2 ${activeChatId === chat.id ? (isDarkMode ? "bg-white/5 border-l border-white" : "bg-black/5 border-l border-black") : ""}`}
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
                                                        className={`flex-1 text-left p-3 text-xs flex items-center gap-3 transition-colors min-w-0 ${activeChatId === chat.id ? "" : "hover:bg-white/5"}`}
                                                    >
                                                        <MessageSquare className={`h-3 w-3 flex-shrink-0 ${isDarkMode ? "text-white/20" : "text-black/40"}`} />
                                                        {sidebarWidth > 120 && <span className="truncate opacity-60 font-sans">{chat.title}</span>}
                                                    </button>
                                                )}
                                                {sidebarWidth > 120 && editingChatId !== chat.id && (
                                                    <>
                                                        <button
                                                            onClick={() => handleStartEditing(chat)}
                                                            className={`opacity-0 group-hover:opacity-100 transition-all duration-300 p-1.5 flex-shrink-0 ${isDarkMode ? "text-white/40 hover:text-white hover:scale-110" : "text-black/40 hover:text-black hover:scale-110"}`}
                                                            aria-label={`Rename ${chat.title}`}
                                                        >
                                                            <Edit3 className="h-3 w-3" />
                                                        </button>
                                                        <button
                                                            onClick={() => void handleDeleteChat(chat.id)}
                                                            className={`opacity-0 group-hover:opacity-100 transition-all duration-300 p-1.5 flex-shrink-0 ${isDarkMode ? "text-white/40 hover:text-red-400 hover:scale-110" : "text-black/40 hover:text-red-600 hover:scale-110"}`}
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
                                    {sidebarWidth > 120 && <span className={`px-2 text-[9px] font-mono uppercase tracking-[0.3em] ${isDarkMode ? "text-white/20" : "text-black/40"}`}>AI Engines</span>}
                                    {engines.map((engine) => (
                                        <button
                                            key={engine.name}
                                            onClick={() => {
                                                if (engine.name === "Interview Prep") {
                                                    setIsInterviewModalOpen(true);
                                                } else if (engine.name === "Mock Paper Generator") {
                                                    setIsMockPaperModalOpen(true);
                                                } else if (engine.name === "Persona Mode") {
                                                    setIsPersonaModalOpen(true);
                                                } else {
                                                    setSelectedEngine(engine.name);
                                                }
                                            }}
                                            className={`w-full flex items-center gap-3 p-3 text-xs transition-all ${
                                                selectedEngine === engine.name
                                                    ? (isDarkMode ? "bg-white/5 text-white border-l border-white" : "bg-black/5 text-black border-l border-black")
                                                    : (isDarkMode ? "text-white/60 hover:text-white hover:bg-white/5" : "text-black/60 hover:text-black hover:bg-black/5")
                                            }`}
                                        >
                                            <engine.icon className="h-4 w-4 flex-shrink-0" />
                                            {sidebarWidth > 120 && (
                                                <div className="flex items-center justify-between w-full min-w-0">
                                                    <span className="truncate">{engine.name}</span>
                                                    <span className={`text-[8px] font-mono ml-2 flex-shrink-0 ${isDarkMode ? "text-white/30" : "text-black/30"}`}>{engine.version}</span>
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* User Profile */}
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
                                            <span className={`text-[9px] font-mono uppercase tracking-widest ${isDarkMode ? "text-white/60" : "text-black/60"}`}>Pro Member</span>
                                        </div>
                                    )}
                                </div>
                                <button
                                    onClick={toggleTheme}
                                    className={`p-2 border transition-all duration-300 ${isDarkMode ? "border-white hover:bg-white/5 hover:scale-110 hover:shadow-[0_0_15px_rgba(255,255,255,0.3)]" : "border-black bg-white hover:bg-gray-50 hover:scale-110 hover:shadow-[0_0_15px_rgba(0,0,0,0.3)]"}`}
                                    title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                                >
                                    {isDarkMode ? <Moon className="h-4 w-4 text-white" /> : <Sun className="h-4 w-4 text-black" />}
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
                                className={`w-full flex items-center justify-center gap-3 p-3 border-2 ${isDarkMode ? "border-white bg-white/5 text-[10px] font-mono uppercase tracking-widest hover:bg-white/10 hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] transition-all active:scale-95 text-white" : "border-black bg-white text-[10px] font-mono uppercase tracking-widest hover:bg-gray-50 hover:shadow-[0_0_20px_rgba(0,0,0,0.2)] transition-all active:scale-95 text-black"}`}
                            >
                                <LogOut className={`h-3 w-3 ${isDarkMode ? "text-white" : "text-black"}`} /> {sidebarWidth > 120 && "Logout session"}
                            </button>
                        </div>
                    </div>
                )}

                {/* Resize Handle */}
                <div
                    onMouseDown={startResizingLeft}
                    className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-white/20 transition-colors z-30"
                />

                {/* Left Toggle Button */}
                <button
                    onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                    className={`absolute top-1/2 -translate-y-1/2 z-50 p-1 bg-[#0a0a0a] border-2 border-white/30 text-white/40 hover:text-white hover:scale-110 hover:shadow-[0_0_15px_rgba(255,255,255,0.3)] transition-all rounded-full shadow-xl shadow-black/20`}
                    style={{ right: isSidebarCollapsed ? "-2rem" : "-0.75rem" }}
                >
                    {isSidebarCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
                </button>
            </aside>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col relative h-full overflow-hidden">
                {/* Fixed Header / Navbar */}
                <header className={`h-20 flex-shrink-0 border-b-2 ${isDarkMode ? "border-white bg-[#0a0a0a]/80" : "border-black bg-white/80"} backdrop-blur-xl flex items-center justify-between px-10 relative z-30`}>
                    <div className="flex items-center gap-4">
                        <div className={`h-[30px] w-[30px] border-2 ${isDarkMode ? "border-white" : "border-black"} flex items-center justify-center`}>
                            <svg width="28" height="28" viewBox="0 0 128 128" className={isDarkMode ? "text-white" : "text-black"}>
                                <polygon points="20,20 86,20 86,55 58,55 58,40 42,40 42,55 42,68 104,108 78,108 50,72 42,72 42,108 20,108" fill="currentColor" />
                            </svg>
                        </div>
                        <div className="flex items-baseline gap-1.5">
                            <span className={`font-display font-black text-lg tracking-tighter ${isDarkMode ? "text-white" : "text-black"}`}>RUDRANEX</span>
                            <span className={`font-serif text-lg ${isDarkMode ? "text-white/40" : "text-black/40"} italic`}>ai</span>
                        </div>

                    </div>
                    <div className="hidden md:flex flex-col items-end gap-0.5">
                        <span className={`text-[9px] font-mono uppercase tracking-[0.2em] ${isDarkMode ? "text-white/30" : "text-black/40"}`}>Current Session</span>
                        <div className="flex items-center gap-2">
                            <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full ${isDarkMode ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-emerald-500/10 border border-emerald-500/20"}`}>
                                <div className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                <span className="text-[8px] font-mono text-emerald-500 uppercase tracking-widest">Active</span>
                            </div>
                            <span className={`text-xs ${isDarkMode ? "text-white/70" : "text-black/70"}`}>{activeChat?.title || "Unsaved chat"}</span>
                        </div>
                    </div>
                </header>

                <main className={`flex-1 ${isChatEmpty ? "overflow-y-hidden flex flex-col justify-center pt-32 pb-16" : "overflow-y-auto block pt-10 pb-44"} px-6 md:px-20 relative z-10 ${isDarkMode ? "custom-scrollbar" : "light-scrollbar"}`}>
                    <div className={`${isChatEmpty ? "w-full" : "max-w-4xl w-full"} mx-auto`}>
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
                                    <WelcomeBox
                                        isDarkMode={isDarkMode}
                                        onSelectEngine={(engine) => {
                                            setSelectedEngine(engine);
                                            setShowEngineSelect(false);
                                        }}
                                        onOpenMockPaper={() => setIsMockPaperModalOpen(true)}
                                        onOpenInterview={() => setIsInterviewModalOpen(true)}
                                    />
                                ) : (
                                    messages.map((msg, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                                            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                                        >
                                            <div className={`flex flex-col ${msg.role === "user" ? "items-end max-w-[85%]" : "items-start max-w-[68%]"}`}>
                                                <div className="flex items-center gap-3 mb-4">
                                                    <span className={`text-[9px] font-mono uppercase tracking-[0.2em] ${isDarkMode ? "text-white/30" : "text-black/60"}`}>
                                                        {msg.role === "assistant" ? "§ RUDRA_AI" : "§ STUDENT_USER"}
                                                    </span>
                                                    <span className={`text-[9px] font-mono ${isDarkMode ? "text-white/20" : "text-black/60"}`}>{msg.timestamp}</span>
                                                </div>

                                                <div className={`p-8 ${msg.role === "user"
                                                    ? (isDarkMode ? "bg-black border border-white/20 rounded-[18px_4px_18px_4px]" : "bg-transparent border-2 border-black rounded-[18px_4px_18px_4px]")
                                                    : (isDarkMode ? "bg-transparent rounded-[2.5rem]" : "bg-transparent rounded-[2.5rem]")
                                                    } relative group`}>
                                                    {msg.role === "user" ? (
                                                        <p className={`text-base md:text-lg leading-relaxed ${isDarkMode ? "text-white font-sans" : "text-black font-sans"}`}>
                                                            {msg.content}
                                                        </p>
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
                                                            <button onClick={() => setInput(msg.content)} className={`p-2 hover:bg-white/10 rounded border-2 ${isDarkMode ? "border-white hover:border-white text-white/60 hover:text-white hover:scale-105" : "border-black hover:border-black text-black/60 hover:text-black hover:scale-105"} transition-all duration-300 group`}>
                                                                <Edit3 className="h-3 w-3 group-hover:scale-110 transition-transform" />
                                                            </button>
                                                            <button onClick={() => copyToClipboard(msg.content)} className={`p-2 hover:bg-white/10 rounded border-2 ${isDarkMode ? "border-white hover:border-white text-white/60 hover:text-white hover:scale-105" : "border-black hover:border-black text-black/60 hover:text-black hover:scale-105"} transition-all duration-300 group`}>
                                                                <Copy className="h-3 w-3 group-hover:scale-110 transition-transform" />
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <button
                                                                onClick={() => void handleToggleFeedback(msg.messageId, msg.feedback, 1)}
                                                                className={`p-2 rounded border-2 transition-all duration-300 group ${msg.feedback === 1
                                                                    ? (isDarkMode ? "bg-emerald-500/20 border-emerald-500 text-emerald-400" : "bg-emerald-500/20 border-emerald-500 text-emerald-600")
                                                                    : (isDarkMode ? "border-white hover:border-white text-white/60 hover:text-white hover:scale-105" : "border-black hover:border-black text-black/60 hover:text-black hover:scale-105")
                                                                    }`}
                                                            >
                                                                <ThumbsUp className="h-3 w-3 group-hover:scale-110 transition-transform" />
                                                            </button>
                                                            <button
                                                                onClick={() => void handleToggleFeedback(msg.messageId, msg.feedback, -1)}
                                                                className={`p-2 rounded border-2 transition-all duration-300 group ${msg.feedback === -1
                                                                    ? (isDarkMode ? "bg-red-500/20 border-red-500 text-red-400" : "bg-red-500/20 border-red-500 text-red-600")
                                                                    : (isDarkMode ? "border-white hover:border-white text-white/60 hover:text-white hover:scale-105" : "border-black hover:border-black text-black/60 hover:text-black hover:scale-105")
                                                                    }`}
                                                            >
                                                                <ThumbsDown className="h-3 w-3 group-hover:scale-110 transition-transform" />
                                                            </button>
                                                            <button onClick={() => copyToClipboard(msg.content)} className={`p-2 hover:bg-white/10 rounded border-2 ${isDarkMode ? "border-white hover:border-white text-white/60 hover:text-white hover:scale-105" : "border-black hover:border-black text-black/60 hover:text-black hover:scale-105"} transition-all duration-300 group`}>
                                                                <Copy className="h-3 w-3 group-hover:scale-110 transition-transform" />
                                                            </button>
                                                            <button onClick={() => retryMessage(i)} className={`p-2 hover:bg-white/10 rounded border-2 ${isDarkMode ? "border-white hover:border-white text-white/60 hover:text-white hover:scale-105" : "border-black hover:border-black text-black/60 hover:text-black hover:scale-105"} transition-all duration-300 group`}>
                                                                <RotateCcw className="h-3 w-3 group-hover:scale-110 transition-transform" />
                                                            </button>
                                                            <button onClick={() => downloadAsPdf("Rudranex AI Response", msg.content)} className={`p-2 hover:bg-white/10 rounded border-2 ${isDarkMode ? "border-white hover:border-white text-white/60 hover:text-white hover:scale-105" : "border-black hover:border-black text-black/60 hover:text-black hover:scale-105"} transition-all duration-300 group`}>
                                                                <FileDown className="h-3 w-3 group-hover:scale-110 transition-transform" />
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
                <div className={`absolute bottom-0 left-0 right-0 z-50 p-10 ${isDarkMode ? "bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]" : "bg-gradient-to-t from-white via-white"} to-transparent flex justify-center`}>
                    <div className="w-full max-w-4xl relative">
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
                                                        className={`p-4 rounded-xl border text-xs font-mono text-left transition-all ${
                                                            isSelected
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

                            <div className={`relative flex items-center border-2 transition-all duration-300 ${isDarkMode ? "border-white bg-[#0a0a0a] focus-within:border-white focus-within:shadow-[0_0_20px_rgba(255,255,255,0.08)]" : "border-black bg-white focus-within:border-black focus-within:shadow-[0_0_20px_rgba(0,0,0,0.08)]"}`}>
                                <div className="flex items-center gap-2 pl-3">
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={isLoading || isProcessingFile}
                                        className={`p-2 ${isDarkMode ? "text-white/30 hover:text-[#D4AF37]" : "text-black/30 hover:text-[#B8962E]"} transition-all active:scale-95`}
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

                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && !isProcessingFile && void handleSend()}
                                    placeholder={isProcessingFile ? "Processing file..." : typedPlaceholder}
                                    className={`flex-1 bg-transparent ${isDarkMode ? "text-white placeholder:text-white/30" : "text-black placeholder:text-black/50"} p-4 pl-2 text-base focus:outline-none`}
                                />
                                <div className="flex items-center gap-1 pr-2">
                                    <div className="relative" ref={engineSelectRef}>
                                        <button
                                            onClick={() => setShowEngineSelect(!showEngineSelect)}
                                            className={`flex items-center gap-2 px-3 py-2 border-2 ${isDarkMode ? "border-white text-white/60 hover:bg-white/5 hover:border-white" : "border-black text-black/60 hover:bg-black/5 hover:border-black"} text-[9px] font-mono uppercase tracking-widest transition-all duration-300 rounded`}
                                        >
                                            <Bot className="h-3 w-3" />
                                            {selectedEngine}
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
                                                                    } else if (engine.name === "Persona Mode") {
                                                                        setShowEngineSelect(false);
                                                                        setIsPersonaModalOpen(true);
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
                                                                <span className={`text-[10px] font-mono font-bold ${isDarkMode ? "text-white/40" : "text-black/40"}`}>{engine.version}</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                    <button
                                        onClick={() => void handleSend()}
                                        disabled={isLoading || isHistoryLoading || isProcessingFile}
                                        className={`p-2.5 disabled:opacity-50 ${isDarkMode ? "bg-white text-black hover:shadow-[0_0_25px_rgba(255,255,255,0.3)]" : "bg-black text-white hover:shadow-[0_0_25px_rgba(0,0,0,0.3)]"} transition-all hover:scale-105 active:scale-95 relative overflow-hidden group`}
                                    >
                                        <div className={`absolute inset-0 bg-gradient-to-r from-transparent ${isDarkMode ? "via-black/10" : "via-white/20"} to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000`} />
                                        <Send className="h-4 w-4 relative z-10" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Sidebar */}
            <aside
                style={{ width: isRightSidebarCollapsed ? "0px" : `${rightSidebarWidth}px` }}
                className={`h-full border-l-2 ${isDarkMode ? "border-white bg-[#0a0a0a]" : "border-black bg-[#fcfcfc]"} flex flex-col relative z-20 transition-[width] duration-300 ease-in-out ${isResizingRight ? "transition-none" : ""}`}
            >
                {!isRightSidebarCollapsed && (
                    <div className="flex flex-col h-full overflow-hidden">
                        <div className={`p-8 border-b-2 ${isDarkMode ? "border-white" : "border-black"} ${isDarkMode ? "custom-scrollbar" : "light-scrollbar"}`}>
                            {/* Plan Badge */}
                            <div className="flex items-start mb-8">
                                <div className="flex flex-col">
                                    <span className={`text-[8px] font-mono uppercase tracking-[0.3em] ${isDarkMode ? "text-black bg-white px-2 py-0.5" : "text-white bg-black px-2 py-0.5"} mb-1 pl-4`}>Active Plan</span>
                                    <div className="flex items-stretch gap-2">
                                        <div className={`flex items-center justify-center ${isDarkMode ? "bg-black border-2 border-white" : "bg-white border-2 border-black"} px-2`}>
                                            <div className={`h-1.5 w-1.5 rounded-full animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.5)] ${subscription?.subscription ? 'bg-emerald-500' : 'bg-amber-500'}`} />
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
                                    <circle cx="64" cy="64" r="58" fill="none" stroke={isDarkMode ? "#9ca3af" : "#00000005"} strokeWidth="6" />
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
                                <div className={`flex justify-between items-center text-[10px] font-mono ${isDarkMode ? "text-white/70" : "text-black/80"}`}>
                                    <span className="uppercase tracking-widest">Chats Used</span>
                                    <span className="font-bold">
                                        {isSubscriptionLoading ? "..." : (
                                            subscription?.usage?.daily_chats !== undefined
                                                ? `${subscription.usage.daily_chats} / ${subscription.subscription?.details?.daily_chat_limit || 0}`
                                                : "0 / 0"
                                        )}
                                    </span>
                                </div>
                                <div className={`h-[1px] w-full ${isDarkMode ? "bg-white/30" : "bg-black/30"}`} />
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex flex-col">
                                        <span className={`text-[8px] font-mono uppercase ${isDarkMode ? "text-white/40" : "text-black/70"} tracking-widest mb-1`}>Images</span>
                                        <span className={`text-[10px] font-bold ${isDarkMode ? "text-white" : "text-black"}`}>
                                            {isSubscriptionLoading ? "..." : (
                                                subscription?.usage?.monthly_images !== undefined
                                                    ? `${subscription.usage.monthly_images} / ${subscription.subscription?.details?.monthly_image_limit || 0}`
                                                    : "0 / 0"
                                            )}
                                        </span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className={`text-[8px] font-mono uppercase ${isDarkMode ? "text-white/40" : "text-black/70"} tracking-widest mb-1`}>Coding</span>
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

                            <div className="space-y-2 mb-8">
                                <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                                    <div className="h-full w-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]" />
                                </div>
                                <div className="flex justify-between text-[8px] font-mono uppercase opacity-70">
                                    <span>Backend</span>
                                    <span>Stable</span>
                                </div>
                            </div>

                            <div className="space-y-2 mb-8">
                                <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                                    <div className="h-full w-full bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.5)]" />
                                </div>
                                <div className="flex justify-between text-[8px] font-mono uppercase opacity-70">
                                    <span>Frontend</span>
                                    <span>Stable</span>
                                </div>
                            </div>

                            <Link href="/pricing" className="block w-full">
                                <button className="upgrade-btn hover:scale-105 hover:shadow-[0_0_30px_rgba(212,175,55,0.5)] transition-all duration-300">
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
                        </div>

                        <div className={`flex-1 p-8 space-y-12 overflow-y-auto ${isDarkMode ? "custom-scrollbar" : "light-scrollbar"}`}>
                        </div>
                    </div>
                )}

                {/* Right Resize Handle */}
                <div
                    onMouseDown={startResizingRight}
                    className="absolute top-0 left-0 w-1 h-full cursor-col-resize hover:bg-white/20 transition-colors z-30"
                />

                {/* Right Toggle Button */}
                <button
                    onClick={() => setIsRightSidebarCollapsed(!isRightSidebarCollapsed)}
                    className={`absolute top-1/2 -translate-y-1/2 z-50 p-1 bg-[#0a0a0a] border border-white text-white/40 hover:text-white hover:scale-110 hover:shadow-[0_0_15px_rgba(255,255,255,0.3)] transition-all rounded-full shadow-xl shadow-black/20`}
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
        </div>
    );
};

export default Chat;
