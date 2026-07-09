"use client";

import { useState, useRef, useEffect } from "react";
import {
    PanelLeftClose,
    Plus,
    Swords,
    Search,
    MessageSquare,
    User,
    Settings,
    Zap,
    Image as ImageIcon,
    Car,
    Bell,
    Sun,
    Paperclip,
    Mic,
    ArrowUp,
    Loader2,
    Sparkles,
    GraduationCap,
    BookOpen,
    Drama,
} from "lucide-react";

/* ─────────────────────────────────────────────────────────────
   Mini replica of the Rudra Nexus chat page (dark mode, regular
   user view) rendered on the 3D laptop screen after the intro
   video ends. Mirrors app/pages/Chat.tsx styling exactly.
   ───────────────────────────────────────────────────────────── */

interface ScreenMessage {
    role: "user" | "assistant";
    content: string;
    timestamp: string;
}

interface DemoChat {
    id: string;
    title: string;
    messages: ScreenMessage[];
}

const PLACEHOLDER_TEXTS = [
    "Describe your query or paste a concept...",
    "Ask me anything about your studies...",
    "Upload a file or type your question...",
    "How can I assist your learning today?",
    "Paste a topic and I'll explain it...",
];

const REPLIES: Record<string, string> = {
    hello: "Hey there! Welcome to Rudranex. What brings you here today?",
    hi: "Hello! I'm Rudra AI. How may I help you explore Rudranex?",
    help: "Sure! Rudranex offers AI-powered study tools, Battle Arena, interview prep, mock papers and more. What interests you?",
    thanks: "You're welcome! Feel free to ask anything else.",
    default:
        "Great question! Rudranex brings AI-powered learning, Battle Arena challenges, interview prep and much more — sign up to explore the full experience.",
};

const formatTime = () =>
    new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const DEMO_CHATS: DemoChat[] = [
    {
        id: "demo-1",
        title: "What is Rudranex?",
        messages: [
            { role: "user", content: "What is Rudranex?", timestamp: "10:24 AM" },
            {
                role: "assistant",
                content:
                    "Rudranex is an AI-powered learning platform — chat with Rudra AI, battle friends in the Arena, prep for interviews and generate mock papers, all in one place.",
                timestamp: "10:24 AM",
            },
        ],
    },
    {
        id: "demo-2",
        title: "Interview prep tips",
        messages: [
            { role: "user", content: "Give me interview prep tips", timestamp: "09:12 AM" },
            {
                role: "assistant",
                content:
                    "Start with fundamentals, practice aloud daily, and use Rudranex Interview Prep mode for realistic AI mock interviews with instant feedback.",
                timestamp: "09:13 AM",
            },
        ],
    },
    {
        id: "demo-3",
        title: "Explain quantum computing",
        messages: [
            { role: "user", content: "Explain quantum computing simply", timestamp: "Yesterday" },
            {
                role: "assistant",
                content:
                    "Imagine a coin spinning in the air — it's both heads and tails until it lands. Qubits work like that, letting quantum computers explore many answers at once.",
                timestamp: "Yesterday",
            },
        ],
    },
];

const ENGINE_ICONS = [
    { name: "Query Mode", Icon: Sparkles },
    { name: "Interview Prep", Icon: GraduationCap },
    { name: "Mock Paper Generator", Icon: BookOpen },
    { name: "Persona Mode", Icon: Drama },
];

export default function ChatOnScreen() {
    const [messages, setMessages] = useState<ScreenMessage[]>([]);
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [activeChatId, setActiveChatId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedEngine, setSelectedEngine] = useState("Query Mode");
    const [selectedMode, setSelectedMode] = useState<"query" | "image">("query");
    const [typedPlaceholder, setTypedPlaceholder] = useState(PLACEHOLDER_TEXTS[0]);
    const [mounted, setMounted] = useState(false);

    const endRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLElement>(null);
    const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const isChatEmpty = messages.length === 0;

    useEffect(() => {
        const t = setTimeout(() => setMounted(true), 50);
        return () => clearTimeout(t);
    }, []);

    /* Rotating typewriter placeholder — mirrors the real chat page */
    useEffect(() => {
        let index = 0;
        let char = 0;
        let deleting = false;
        const tick = () => {
            const text = PLACEHOLDER_TEXTS[index % PLACEHOLDER_TEXTS.length];
            if (!deleting) {
                char++;
                setTypedPlaceholder(text.slice(0, char));
                if (char >= text.length) {
                    deleting = true;
                    timer = setTimeout(tick, 2200);
                    return;
                }
                timer = setTimeout(tick, 45);
            } else {
                char--;
                setTypedPlaceholder(text.slice(0, char));
                if (char <= 0) {
                    deleting = false;
                    index++;
                    timer = setTimeout(tick, 350);
                    return;
                }
                timer = setTimeout(tick, 18);
            }
        };
        let timer = setTimeout(tick, 1200);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTo({
                top: scrollContainerRef.current.scrollHeight,
                behavior: "smooth"
            });
        }
    }, [messages, isTyping]);

    useEffect(() => {
        return () => {
            if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
        };
    }, []);

    const streamReply = (fullText: string) => {
        let i = 0;
        const step = () => {
            i += 2;
            const partial = fullText.slice(0, i);
            setMessages((prev) => {
                const next = [...prev];
                next[next.length - 1] = { ...next[next.length - 1], content: partial };
                return next;
            });
            if (i < fullText.length) {
                typingTimerRef.current = setTimeout(step, 18);
            } else {
                setIsTyping(false);
            }
        };
        setMessages((prev) => [
            ...prev,
            { role: "assistant", content: "", timestamp: formatTime() },
        ]);
        typingTimerRef.current = setTimeout(step, 100);
    };

    const handleSend = () => {
        if (!input.trim() || isTyping) return;
        const text = input.trim();
        setMessages((prev) => [
            ...prev,
            { role: "user", content: text, timestamp: formatTime() },
        ]);
        setInput("");
        setIsTyping(true);
        const key = Object.keys(REPLIES).find(
            (k) => k !== "default" && text.toLowerCase().includes(k)
        );
        typingTimerRef.current = setTimeout(() => {
            streamReply(REPLIES[key ?? "default"]);
        }, 700);
    };

    const handleNewChat = () => {
        if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
        setIsTyping(false);
        setMessages([]);
        setActiveChatId(null);
    };

    const openDemoChat = (chat: DemoChat) => {
        if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
        setIsTyping(false);
        setActiveChatId(chat.id);
        setMessages(chat.messages);
    };

    const filteredChats = DEMO_CHATS.filter((c) =>
        c.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    /* ───────────── Input container (exact replica of renderInputContainer) ───────────── */
    const renderInputContainer = (isCentered: boolean) => (
        <div
            className={`w-full ${isCentered ? "max-w-2xl mx-auto mt-4" : "max-w-4xl mx-auto"} rounded-3xl p-4 transition-all duration-300 bg-[#222120] border border-white/5 shadow-2xl`}
        >
            <div className="flex items-start gap-2">
                <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSend();
                        }
                    }}
                    placeholder={typedPlaceholder}
                    rows={isCentered ? 2 : 1}
                    className="flex-1 min-w-0 bg-transparent resize-none text-white placeholder:text-white/30 py-1.5 text-base focus:outline-none [&::-webkit-scrollbar]:hidden"
                />
            </div>

            <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/5">
                {/* Bottom Left: Add files + quick engine toggles */}
                <div className="flex items-center gap-2">
                    <button
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[10px] font-sans font-medium transition-all duration-200 cursor-pointer border-white/10 bg-white/5 text-white/80 hover:bg-white/10 hover:text-white hover:scale-105 active:scale-95"
                        title="Add files"
                    >
                        <Paperclip className="h-3.5 w-3.5" />
                        <span>Add files</span>
                    </button>
                    <div className="h-4 w-px bg-white/10 mx-1" />
                    <div className="flex items-center gap-1">
                        {ENGINE_ICONS.map(({ name, Icon }) => (
                            <button
                                key={name}
                                onClick={() => setSelectedEngine(name)}
                                className={`p-1.5 rounded-lg transition-all duration-200 cursor-pointer hover:scale-110 active:scale-90 ${selectedEngine === name
                                        ? "bg-white/15 text-white shadow-sm"
                                        : "text-white/40 hover:text-white hover:bg-white/5"
                                    }`}
                                title={name}
                            >
                                <Icon className="h-3.5 w-3.5" />
                            </button>
                        ))}
                    </div>
                </div>

                {/* Bottom Right: mic + circular send */}
                <div className="flex items-center gap-2">
                    <button
                        className="h-8 w-8 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg bg-white/10 text-white/60 hover:bg-white/20 hover:text-white hover:scale-110 active:scale-90"
                        title="Start recording"
                    >
                        <Mic className="h-3.5 w-3.5" />
                    </button>
                    <button
                        onClick={handleSend}
                        disabled={!input.trim() || isTyping}
                        className={`h-8 w-8 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg ${input.trim() && !isTyping
                                ? "bg-white text-black hover:bg-white/95 hover:scale-110 active:scale-90 cursor-pointer"
                                : "bg-white/10 text-white/30 cursor-not-allowed"
                            }`}
                        title="Send message"
                    >
                        <ArrowUp className="h-4 w-4 stroke-[2.5]" />
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <div
            onWheel={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            className={`h-full w-full bg-[#0d0d0c] text-white selection:bg-white selection:text-black flex overflow-hidden transition-opacity duration-700 ${mounted ? "opacity-100" : "opacity-0"}`}
            style={{ pointerEvents: "auto" }}
        >
            {/* ───────────── Left Sidebar ───────────── */}
            <aside className="h-full w-60 shrink-0 border-r border-white/10 bg-[#0d0d0c] flex flex-col">
                {/* Logo header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
                    <div className="flex items-center gap-2 select-none">
                        <img src="/dark.png" alt="Logo" className="w-6 h-6 object-contain" />
                        <img src="/dark_text.png" alt="Rudra Nexus" className="h-4 object-contain" />
                    </div>
                    <button
                        className="p-1.5 rounded-lg transition-colors cursor-pointer text-white/60 hover:text-white hover:bg-white/5"
                        title="Collapse sidebar"
                    >
                        <PanelLeftClose className="w-4 h-4" />
                    </button>
                </div>

                {/* New chat / Leaderboard / Search */}
                <div className="px-4 pt-4 pb-2 space-y-2">
                    <button
                        onClick={handleNewChat}
                        className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs border rounded-xl font-sans font-medium transition-all duration-200 border-white/10 bg-white/5 text-white hover:bg-white/10 hover:border-white/20 hover:scale-[1.03] active:scale-[0.97] cursor-pointer"
                    >
                        <Plus className="w-4 h-4" />
                        <span>New Chat</span>
                    </button>
                    <button className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs border rounded-xl font-sans font-medium transition-all duration-200 border-white/10 bg-white/5 text-white hover:bg-white/10 hover:border-white/20 hover:scale-[1.03] active:scale-[0.97] cursor-pointer">
                        <Swords className="h-4 w-4" />
                        <span>Leaderboard</span>
                    </button>
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/30" />
                        <input
                            type="text"
                            placeholder="Search chats..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-transparent border rounded-xl py-1.5 pl-9 pr-3 text-xs font-sans focus:outline-none transition-all border-white/10 text-white placeholder:text-white/30 focus:border-white/25 focus:bg-white/5"
                        />
                    </div>
                </div>

                {/* Recent history */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-4 text-zinc-300 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full">
                    <div className="space-y-1">
                        <div className="px-2 text-[9px] font-bold font-mono uppercase tracking-[0.2em] text-white/30">
                            Today
                        </div>
                        {filteredChats.length === 0 && (
                            <div className="px-2 py-3 text-xs opacity-50">No matching sessions</div>
                        )}
                        {filteredChats.map((chat) => (
                            <button
                                key={chat.id}
                                onClick={() => openDemoChat(chat)}
                                className={`group w-full flex items-center justify-between rounded-lg px-2 py-1.5 transition-all text-xs cursor-pointer ${activeChatId === chat.id
                                        ? "bg-white/5 text-white"
                                        : "text-white/60 hover:text-white hover:bg-white/5"
                                    }`}
                            >
                                <span className="flex-1 text-left truncate flex items-center gap-2.5 min-w-0">
                                    <MessageSquare className="h-3.5 w-3.5 opacity-55 flex-shrink-0" />
                                    <span className="truncate">{chat.title}</span>
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Bottom profile bar */}
                <div className="p-3 border-t border-white/5">
                    <div className="flex items-center justify-between">
                        <button className="flex items-center gap-2 min-w-0 text-left cursor-pointer hover:opacity-80 transition-opacity">
                            <div className="h-8 w-8 rounded-full flex items-center justify-center relative shrink-0 bg-white/5 border-white/10 border overflow-hidden">
                                <User className="h-4 w-4 text-white/80" />
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className="text-[11px] font-bold truncate text-white">Guest</span>
                                <span className="text-[9px] font-mono uppercase tracking-widest text-white/40">
                                    Free Trial
                                </span>
                            </div>
                        </button>
                        <div className="flex items-center gap-1.5">
                            <button
                                className="p-1.5 rounded-lg border transition-colors border-white/10 text-white/60 hover:text-white hover:bg-white/5 cursor-pointer"
                                title="Settings"
                            >
                                <Settings className="h-4 w-4" />
                            </button>
                            <button
                                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-sans font-semibold transition-colors border-white/10 text-white/80 hover:text-white hover:bg-white/5 cursor-pointer"
                                title="Upgrade"
                            >
                                <Zap className="h-3.5 w-3.5" />
                                <span>Upgrade</span>
                            </button>
                        </div>
                    </div>
                </div>
            </aside>

            {/* ───────────── Main Chat Area ───────────── */}
            <div className="flex-1 flex flex-col relative h-full overflow-hidden">
                {/* Header */}
                <header className="h-16 flex-shrink-0 flex items-center justify-between px-6 relative z-30 border-b bg-[#0d0d0c] border-white/5">
                    {/* Mode toggle */}
                    <div className="flex items-center gap-1 p-0.5 rounded-xl border text-xs font-medium transition-all duration-200 border-white/10">
                        <button
                            onClick={() => setSelectedMode("query")}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all duration-200 cursor-pointer ${selectedMode === "query"
                                    ? "bg-white/10 text-white shadow-sm"
                                    : "text-white/50 hover:text-white"
                                }`}
                        >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>Query Mode</span>
                        </button>
                        <button
                            onClick={() => setSelectedMode("image")}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all duration-200 cursor-pointer ${selectedMode === "image"
                                    ? "bg-white/10 text-white shadow-sm"
                                    : "text-white/50 hover:text-white"
                                }`}
                        >
                            <ImageIcon className="w-3.5 h-3.5" />
                            <span>Image Mode</span>
                        </button>
                    </div>

                    {/* Right controls */}
                    <div className="flex items-center gap-3">
                        <button
                            className="p-2 border rounded-full transition-all duration-200 flex items-center justify-center cursor-pointer border-white/10 bg-white/5 text-white hover:bg-white/10 hover:border-white/20"
                            title="Quick tour"
                        >
                            <Car className="h-4 w-4 opacity-70" />
                        </button>
                        <button
                            className="p-2 border rounded-full transition-all duration-200 flex items-center justify-center cursor-pointer border-white/10 bg-white/5 text-white hover:bg-white/10 hover:border-white/20"
                            title="Notifications"
                        >
                            <Bell className="h-4 w-4 opacity-70" />
                        </button>
                        <button
                            className="p-2 border rounded-full transition-all duration-200 flex items-center justify-center cursor-pointer border-white/10 bg-white/5 text-white hover:bg-white/10 hover:border-white/20"
                            title="Switch to light mode"
                        >
                            <Sun className="h-4 w-4 opacity-70" />
                        </button>
                    </div>
                </header>

                {/* Main scroll area */}
                <main
                    ref={scrollContainerRef}
                    className={`flex-1 ${isChatEmpty ? "overflow-y-hidden flex flex-col justify-center pb-10" : "overflow-y-auto block pt-8 pb-6"} px-8 relative z-10 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full`}
                >
                    <div className={`${isChatEmpty ? "w-full" : "max-w-3xl w-full"} mx-auto`}>
                        {isChatEmpty ? (
                            <div className="flex flex-col items-center justify-center max-w-2xl mx-auto px-4 text-center">
                                <h1 className="font-serif italic text-4xl mb-8 tracking-tight text-white">
                                    What would you like to do?
                                </h1>
                                <div className="w-full text-left">{renderInputContainer(true)}</div>
                            </div>
                        ) : (
                            <div className="space-y-10">
                                {messages.map((msg, i) => (
                                    <div
                                        key={i}
                                        className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} w-full`}
                                    >
                                        <div
                                            className={`flex flex-col ${msg.role === "user" ? "items-end max-w-[80%]" : "items-start max-w-[85%]"}`}
                                        >
                                            <div className="flex items-center gap-3 mb-3">
                                                <span className="text-[9px] font-mono uppercase tracking-[0.2em] flex items-center gap-1.5 text-white/40">
                                                    {msg.role === "assistant" &&
                                                        isTyping &&
                                                        i === messages.length - 1 && (
                                                            <Loader2 className="h-3 w-3 animate-spin shrink-0" />
                                                        )}
                                                    {msg.role === "assistant" ? "Rudra AI" : "You"}
                                                </span>
                                                <span className="text-[9px] font-mono text-white/20">
                                                    {msg.timestamp}
                                                </span>
                                            </div>
                                            <div
                                                className={`py-1.5 px-4 ${msg.role === "user"
                                                        ? "bg-[#222120] border border-white/5 rounded-2xl text-white"
                                                        : "bg-transparent text-current"
                                                    }`}
                                            >
                                                <p className="text-base leading-relaxed text-white">
                                                    {msg.content}
                                                    {msg.role === "assistant" &&
                                                        isTyping &&
                                                        i === messages.length - 1 && (
                                                            <span className="inline-block w-1.5 h-4 ml-0.5 bg-white/60 animate-pulse align-middle" />
                                                        )}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                <div ref={endRef} />
                            </div>
                        )}
                    </div>
                </main>

                {/* Bottom input (active chat only) */}
                {!isChatEmpty && (
                    <div className="flex-shrink-0 px-8 pb-5 pt-2">
                        {renderInputContainer(false)}
                    </div>
                )}
            </div>
        </div>
    );
}
