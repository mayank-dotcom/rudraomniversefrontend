import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Send, Bot, User, ArrowLeft, Sparkles, Command, LogOut,
    MessageSquare, Plus, Settings, Search, ChevronLeft,
    ChevronRight, Moon, Sun, PieChart, GraduationCap,
    Code2, FileText, Calendar, UserCog, Mic, ChevronUp,
    ThumbsUp, ThumbsDown, RotateCcw, Edit3, Copy
} from "lucide-react";
import Link from "next/link";

interface Message {
    role: "user" | "assistant";
    content: string;
    timestamp: string;
}

const Chat = () => {
    const [messages, setMessages] = useState<Message[]>([
        {
            role: "assistant",
            content: "Welcome to Rudranex AI. I am your silent co-pilot. How can I assist your learning journey today?",
            timestamp: "12:00 PM"
        }
    ]);
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

    const messagesEndRef = useRef<HTMLDivElement>(null);

    const engines = [
        { name: "Student Mode (Tutor)", version: "1.0", icon: GraduationCap },
        { name: "Coding & GitHub", version: "2.0", icon: Code2 },
        { name: "Mock Test Gen", version: "1.0", icon: FileText },
        { name: "Auto Study Plan", version: "1.0", icon: Calendar },
        { name: "Custom Persona", version: "1.0", icon: UserCog },
        { name: "Voice Interview", version: "1.0", icon: Mic },
    ];

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

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = () => {
        if (!input.trim()) return;

        const newMessage: Message = {
            role: "user",
            content: input,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setMessages(prev => [...prev, newMessage]);
        setInput("");

        // Simulate AI response
        setTimeout(() => {
            const aiResponse: Message = {
                role: "assistant",
                content: "I'm processing your request with high precision. This is a simulation of the Rudranex cognitive engine.",
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            setMessages(prev => [...prev, aiResponse]);
        }, 1000);
    };

    return (
        <div className={`h-screen w-full ${isDarkMode ? "bg-[#0a0a0a] text-white" : "bg-white text-black"} selection:bg-white selection:text-black flex font-sans overflow-hidden transition-colors duration-500`}>
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
                            <button className={`p-2 hover:bg-white/5 transition-colors border ${isDarkMode ? "border-white/10" : "border-black/10"}`}>
                                <Plus className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                            {sidebarWidth > 120 && (
                                <div className="mb-8">
                                    <div className="relative group">
                                        <Search className={`absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 ${isDarkMode ? "text-white/20 group-focus-within:text-white/60" : "text-black/40 group-focus-within:text-black/80"} transition-colors`} />
                                        <input
                                            type="text"
                                            placeholder="Search sessions..."
                                            className={`w-full ${isDarkMode ? "bg-white/5 border-white/5" : "bg-black/5 border-black/5"} border p-2 pl-9 text-[10px] font-mono uppercase tracking-widest focus:outline-none focus:border-white/20 transition-all`}
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="space-y-1">
                                {sidebarWidth > 120 && <span className={`px-2 text-[9px] font-mono uppercase tracking-[0.3em] ${isDarkMode ? "text-white/20" : "text-black/40"}`}>Recent Sessions</span>}
                                {[
                                    "Architecture Analysis",
                                    "Cognitive Science Project",
                                    "Data structures deep dive",
                                    "Math - Linear Algebra"
                                ].map((session, i) => (
                                    <button key={i} className={`w-full text-left p-3 text-xs flex items-center gap-3 transition-colors ${i === 0 ? (isDarkMode ? "bg-white/5 border-l border-white" : "bg-black/5 border-l border-black") : "hover:bg-white/5"}`}>
                                        <MessageSquare className={`h-3 w-3 ${isDarkMode ? "text-white/20" : "text-black/40"}`} />
                                        {sidebarWidth > 120 && <span className="truncate opacity-60 font-sans">{session}</span>}
                                    </button>
                                ))}
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
                                            <span className={`text-xs font-bold ${isDarkMode ? "text-white" : "text-black"}`}>Mayank</span>
                                            <span className="text-[9px] font-mono uppercase tracking-widest text-white/30">Pro Member</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <button className={`w-full flex items-center justify-center gap-3 p-3 border ${isDarkMode ? "border-white/10 bg-white/5" : "border-black/10 bg-black/5"} text-[10px] font-mono uppercase tracking-widest hover:bg-white/10 transition-all active:scale-95`}>
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
                        <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                            <div className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-pulse" />
                            <span className="text-[9px] font-mono text-emerald-500 uppercase tracking-widest">Active</span>
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto pt-10 pb-44 px-6 md:px-20 relative z-10 custom-scrollbar">
                    <div className="max-w-4xl mx-auto">
                        {/* Chat Area */}
                        <div className="space-y-16">
                            <AnimatePresence initial={false}>
                                {messages.map((msg, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                                        className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                                    >
                                        <div className={`max-w-[85%] flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
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
                                                <p className={`text-base md:text-lg leading-relaxed ${msg.role === "user"
                                                        ? (isDarkMode ? "text-white font-sans" : "text-black font-sans")
                                                        : (isDarkMode ? "text-white/90 font-serif italic" : "text-black/90 font-serif italic")
                                                    }`}>
                                                    {msg.content}
                                                </p>

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
                                                        <button className={`p-1.5 hover:bg-white/10 rounded transition-colors ${isDarkMode ? "text-white/60 hover:text-white" : "text-black/60 hover:text-black"}`}>
                                                            <div className="flex items-center gap-1.5">
                                                                <Edit3 className="h-3 w-3" />
                                                                <span className="text-[8px] font-mono uppercase tracking-widest">Edit</span>
                                                            </div>
                                                        </button>
                                                        <button className={`p-1.5 hover:bg-white/10 rounded transition-colors ${isDarkMode ? "text-white/60 hover:text-white" : "text-black/60 hover:text-black"}`}>
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
                                                        <button className={`p-1.5 hover:bg-white/10 rounded transition-colors ${isDarkMode ? "text-white/60 hover:text-white" : "text-black/60 hover:text-black"}`}>
                                                            <div className="flex items-center gap-1.5">
                                                                <Copy className="h-3 w-3" />
                                                                <span className="text-[8px] font-mono uppercase tracking-widest">Copy</span>
                                                            </div>
                                                        </button>
                                                        <button className={`p-1.5 hover:bg-white/10 rounded transition-colors ${isDarkMode ? "text-white/60 hover:text-white" : "text-black/60 hover:text-black"}`}>
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
                                                                setSelectedEngine(engine.name);
                                                                setShowEngineSelect(false);
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
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyPress={(e) => e.key === "Enter" && handleSend()}
                                placeholder="Describe your query or paste a concept..."
                                className={`w-full bg-transparent border-b ${isDarkMode ? "border-white/10 placeholder:text-white/10" : "border-black/10 placeholder:text-black/10"} p-5 pr-32 text-base focus:outline-none focus:border-white/40 transition-all`}
                            />
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                <button
                                    onClick={handleSend}
                                    className={`p-3 ${isDarkMode ? "bg-white text-black" : "bg-black text-white"} hover:opacity-90 transition-all active:scale-95`}
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
                        <div className={`p-8 border-b ${isDarkMode ? "border-white/5" : "border-black/15"}`}>
                            <div className="mb-8 flex flex-col items-center">
                                <span className={`text-[10px] font-mono uppercase tracking-[0.3em] ${isDarkMode ? "text-white/20" : "text-black/60"} block text-center mb-4`}>Dashboard</span>
                                <div className={`w-8 h-[1px] ${isDarkMode ? "bg-white/10" : "bg-black/20"}`} />
                            </div>

                            {/* Circular Usage Chart */}
                            <div className="relative w-32 h-32 mx-auto mb-6 flex-shrink-0">
                                <svg className="w-full h-full rotate-[-90deg]">
                                    <circle cx="64" cy="64" r="58" fill="none" stroke={isDarkMode ? "#ffffff05" : "#00000005"} strokeWidth="8" />
                                    <circle
                                        cx="64" cy="64" r="58" fill="none"
                                        stroke={isDarkMode ? "white" : "black"}
                                        strokeWidth="8"
                                        strokeDasharray="364"
                                        strokeDashoffset="120"
                                        strokeLinecap="round"
                                        className="transition-all duration-1000"
                                    />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-2xl font-orbitron font-bold">65%</span>
                                    <span className="text-[8px] font-mono uppercase tracking-widest opacity-40">Tokens</span>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center text-[10px] font-mono">
                                    <span className="opacity-40 uppercase">Used</span>
                                    <span>64,200</span>
                                </div>
                                <div className="flex justify-between items-center text-[10px] font-mono">
                                    <span className="opacity-40 uppercase">Remaining</span>
                                    <span>35,800</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 p-8 space-y-12 overflow-y-auto custom-scrollbar">
                            {/* Secondary Metrics */}
                            <div className="space-y-6">
                                <span className={`text-[10px] font-mono uppercase tracking-[0.3em] ${isDarkMode ? "text-white/20" : "text-black/60"} block`}>Performance</span>
                                <div className="space-y-2">
                                    <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                        <div className="h-full w-4/5 bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]" />
                                    </div>
                                    <div className="flex justify-between text-[8px] font-mono uppercase opacity-40">
                                        <span>Latency</span>
                                        <span>12ms</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className={`p-6 border-t ${isDarkMode ? "border-white/5" : "border-black/15"} flex-shrink-0`}>
                            <button
                                onClick={() => setIsDarkMode(!isDarkMode)}
                                className={`w-full flex items-center justify-between p-4 border ${isDarkMode ? "border-white/10 bg-white/5" : "border-black/20 bg-black/10"} transition-all group`}
                            >
                                <div className="flex items-center gap-4">
                                    {isDarkMode ? <Moon className="h-4 w-4 text-white/40" /> : <Sun className="h-4 w-4 text-black/80" />}
                                    <span className={`text-[10px] font-mono uppercase tracking-[0.3em] ${isDarkMode ? "opacity-40" : "opacity-80"}`}>Interface Mode</span>
                                </div>
                                <div className={`w-8 h-4 rounded-full relative transition-colors ${isDarkMode ? "bg-white/20" : "bg-black/20"}`}>
                                    <div className={`absolute top-0.5 w-3 h-3 rounded-full transition-all ${isDarkMode ? "left-4 bg-white" : "left-1 bg-black"}`} />
                                </div>
                            </button>
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
        </div>
    );
};

export default Chat;



