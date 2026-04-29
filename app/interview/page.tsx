"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Mic, MicOff, Video, VideoOff, PhoneOff } from "lucide-react";
import ChatLoader from "@/components/ui/ChatLoader";
import { createChat, saveChatMessage, sendAiRequest } from "@/lib/chat-api";

function InterviewRoomContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const topic = searchParams.get("topic") || "General Interview";
    const duration = parseInt(searchParams.get("duration") || "45") * 60;
    
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isMicOn, setIsMicOn] = useState(true);
    const [isCameraOn, setIsCameraOn] = useState(true);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [timeLeft, setTimeLeft] = useState(duration);
    const [isInterviewActive, setIsInterviewActive] = useState(false);
    const [isBotSpeaking, setIsBotSpeaking] = useState(false);
    const [isUserSpeaking, setIsUserSpeaking] = useState(false);
    const [conversation, setConversation] = useState<Array<{role: "bot" | "user", text: string}>>([]);
    const [chatId, setChatId] = useState<string | null>(null);
    const [interviewEnded, setInterviewEnded] = useState(false);
    const [feedback, setFeedback] = useState<string | null>(null);
    
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const currentAudioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        startCamera();
        initializeChat();
        return () => {
            stream?.getTracks().forEach(track => track.stop());
            if (currentAudioRef.current) {
                currentAudioRef.current.pause();
            }
        };
    }, []);

    useEffect(() => {
        if (timeLeft > 0 && isInterviewActive && !interviewEnded) {
            const timer = setInterval(() => {
                setTimeLeft(prev => prev - 1);
            }, 1000);
            return () => clearInterval(timer);
        } else if (timeLeft === 0 && isInterviewActive) {
            endInterview();
        }
    }, [timeLeft, isInterviewActive, interviewEnded]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const startCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
            });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
        } catch (error) {
            console.error("Camera access denied:", error);
        }
    };

    const initializeChat = async () => {
        try {
            const chat = await createChat(`Interview: ${topic}`);
            setChatId(chat.chat.id);
        } catch (error) {
            console.error("Failed to create chat:", error);
        }
    };

    const startInterview = async () => {
        setIsInterviewActive(true);
        await askQuestion(null);
    };

    const askQuestion = async (previousAnswer: string | null) => {
        try {
            setIsBotSpeaking(true);
            
            let messages: Array<{role: "user" | "assistant", content: string}> = [];
            
            if (previousAnswer) {
                messages = [
                    ...conversation.map(c => ({
                        role: c.role === "bot" ? "assistant" as const : "user" as const,
                        content: c.text
                    })),
                    { role: "user" as const, content: previousAnswer }
                ];
            }
            
            const prompt = previousAnswer 
                ? `Candidate answered: "${previousAnswer}". Continue the interview on topic "${topic}". Ask the next relevant question.`
                : `Start an interview on the topic "${topic}". Ask the first question to the candidate.`;
            
            messages.push({ role: "user", content: prompt });

            const response = await sendAiRequest({
                endpoint: "/chat",
                messages: messages,
                chat_id: chatId || undefined,
                modality: "text"
            });

            const botText = response.data?.[0]?.message?.content || response.data?.[0]?.text || "Please tell me about yourself.";
            
            setConversation(prev => [...prev, { role: "bot", text: botText }]);
            
            if (chatId) {
                await saveChatMessage(chatId, "assistant", botText);
            }

            await playTTSAudio(botText);
            
            setIsBotSpeaking(false);
            
            await listenForAnswer();
            
        } catch (error) {
            console.error("Error in interview:", error);
            setIsBotSpeaking(false);
        }
    };

    const playTTSAudio = async (text: string) => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/tts/generate`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": localStorage.getItem("rudranex_api_key") || "",
                },
                body: JSON.stringify({ text }),
            });

            if (!response.ok) throw new Error("TTS failed");

            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);
            const audio = new Audio(audioUrl);
            currentAudioRef.current = audio;

            await audio.play();
            
            await new Promise(resolve => {
                audio.onended = resolve;
            });
            
            URL.revokeObjectURL(audioUrl);
        } catch (error) {
            console.error("TTS Error:", error);
        }
    };

    const listenForAnswer = async () => {
        if (!stream) return;
        
        setIsUserSpeaking(true);
        
        const audioStream = new MediaStream(stream.getAudioTracks());
        const mediaRecorder = new MediaRecorder(audioStream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                audioChunksRef.current.push(event.data);
            }
        };

        mediaRecorder.onstop = async () => {
            const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
            await processAnswer(audioBlob);
        };

        mediaRecorder.start();
        
        setTimeout(() => {
            if (mediaRecorder.state === "recording") {
                mediaRecorder.stop();
            }
        }, 10000); // Listen for 10 seconds
    };

    const processAnswer = async (audioBlob: Blob) => {
        try {
            setIsUserSpeaking(false);
            
            const formData = new FormData();
            formData.append("audio", audioBlob, "recording.webm");

            const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/speech/transcribe`, {
                method: "POST",
                headers: {
                    "x-api-key": localStorage.getItem("rudranex_api_key") || "",
                },
                body: formData,
            });

            const data = await response.json();
            const userText = data.text || "No answer detected.";

            setConversation(prev => [...prev, { role: "user", text: userText }]);
            
            if (chatId) {
                await saveChatMessage(chatId, "user", userText);
            }

            if (timeLeft > 10) {
                await askQuestion(userText);
            } else {
                endInterview();
            }
            
        } catch (error) {
            console.error("Transcription Error:", error);
            setIsUserSpeaking(false);
        }
    };

    const endInterview = async () => {
        setIsInterviewActive(false);
        setIsBotSpeaking(false);
        setIsUserSpeaking(false);
        setInterviewEnded(true);
        
        await generateFeedback();
    };

    const generateFeedback = async () => {
        try {
            const conversationText = conversation.map(c => 
                `${c.role === "bot" ? "Interviewer" : "Candidate"}: ${c.text}`
            ).join("\n\n");

            const response = await sendAiRequest({
                endpoint: "/chat",
                messages: [{
                    role: "user",
                    content: `Based on this interview conversation, provide detailed feedback for the candidate. Rate them on: technical knowledge, communication skills, problem-solving, and overall performance. Topic was: ${topic}\n\nConversation:\n${conversationText}`
                }],
                chat_id: chatId || undefined,
                modality: "text"
            });

            const feedbackText = response.data?.[0]?.message?.content || response.data?.[0]?.text || "Interview completed.";
            setFeedback(feedbackText);
            
            if (chatId) {
                await saveChatMessage(chatId, "assistant", `Interview Feedback: ${feedbackText}`);
            }
        } catch (error) {
            console.error("Feedback generation error:", error);
            setFeedback("Unable to generate feedback at this time.");
        }
    };

    const toggleMic = () => {
        if (stream) {
            stream.getAudioTracks().forEach(track => {
                track.enabled = !isMicOn;
            });
            setIsMicOn(!isMicOn);
        }
    };

    const toggleCamera = () => {
        if (stream) {
            stream.getVideoTracks().forEach(track => {
                track.enabled = !isCameraOn;
            });
            setIsCameraOn(!isCameraOn);
        }
    };

    const handleLeave = () => {
        stream?.getTracks().forEach(track => track.stop());
        if (currentAudioRef.current) {
            currentAudioRef.current.pause();
        }
        router.push("/chat");
    };

    if (interviewEnded && feedback) {
        return (
            <div className="h-screen w-full bg-black flex items-center justify-center p-8">
                <div className="max-w-2xl w-full bg-[#0a0a0a] border border-white/10 p-8 rounded-lg">
                    <h2 className="text-2xl font-bold text-white mb-6">Interview Feedback</h2>
                    <div className="text-white/80 leading-relaxed mb-8 whitespace-pre-wrap">{feedback}</div>
                    <button
                        onClick={handleLeave}
                        className="w-full py-3 bg-white text-black font-mono text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-white/90 transition-all"
                    >
                        Back to Chat →
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen w-full bg-black relative overflow-hidden">
            {/* User Video (Small - Bottom Left) */}
            <div className="absolute bottom-24 left-6 h-40 w-56 bg-[#1a1a1a] rounded-lg overflow-hidden border border-white/10 shadow-2xl z-10">
                {isCameraOn ? (
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="h-full w-full object-cover scale-x-[-1]"
                    />
                ) : (
                    <div className="h-full w-full bg-[#1a1a1a] flex items-center justify-center">
                        <span className="text-[8px] font-mono uppercase tracking-widest text-white/40">Camera Off</span>
                    </div>
                )}
            </div>

            {/* AI Interviewer (Large - Center) */}
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black">
                <div className="relative">
                    <div className="h-64 w-64 rounded-full bg-black flex items-center justify-center border-2 border-white/5">
                        <ChatLoader isDarkMode={true} />
                    </div>
                    {isBotSpeaking && (
                        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex gap-1">
                            <div className="h-1 w-1 bg-emerald-400 rounded-full animate-bounce" />
                            <div className="h-1 w-1 bg-emerald-400 rounded-full animate-bounce delay-100" />
                            <div className="h-1 w-1 bg-emerald-400 rounded-full animate-bounce delay-200" />
                        </div>
                    )}
                </div>
                <div className="mt-6">
                    <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/40">AI Interviewer</span>
                </div>
                {isUserSpeaking && (
                    <div className="mt-4 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded">
                        <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400">Listening...</span>
                    </div>
                )}
            </div>

            {/* Status Messages */}
            {!isInterviewActive && !interviewEnded && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-20">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-white mb-4">Ready to Start?</h2>
                        <p className="text-white/60 mb-8">Topic: {topic}</p>
                        <button
                            onClick={startInterview}
                            className="px-8 py-3 bg-white text-black font-mono text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-white/90 transition-all"
                        >
                            Start Interview
                        </button>
                    </div>
                </div>
            )}

            {/* Topic Badge */}
            <div className="absolute top-6 left-6 px-4 py-3 bg-black/60 backdrop-blur-sm border border-white/10 rounded-lg shadow-2xl">
                <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/40">Topic</span>
                <p className="text-sm text-white font-sans mt-1 font-medium">{topic}</p>
            </div>

            {/* Timer (Top Center) */}
            <div className="absolute top-6 left-1/2 -translate-x-1/2 px-6 py-3 bg-black/60 backdrop-blur-sm border border-white/10 rounded-lg shadow-2xl">
                <span className="text-2xl font-mono text-white font-bold">{formatTime(timeLeft)}</span>
            </div>

            {/* Control Bar (Bottom Center) */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3">
                <button
                    onClick={toggleMic}
                    className={`p-4 rounded-full transition-all ${
                        isMicOn
                            ? "bg-[#2a2a2a] border border-white/10 text-white hover:bg-[#3a3a3a]"
                            : "bg-red-500/20 border border-red-500/30 text-red-400"
                    }`}
                    title={isMicOn ? "Turn off microphone" : "Turn on microphone"}
                >
                    {isMicOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
                </button>

                <button
                    onClick={toggleCamera}
                    className={`p-4 rounded-full transition-all ${
                        isCameraOn
                            ? "bg-[#2a2a2a] border border-white/10 text-white hover:bg-[#3a3a3a]"
                            : "bg-red-500/20 border border-red-500/30 text-red-400"
                    }`}
                    title={isCameraOn ? "Turn off camera" : "Turn on camera"}
                >
                    {isCameraOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
                </button>

                <button
                    onClick={endInterview}
                    className="p-4 rounded-full bg-red-500 hover:bg-red-600 text-white transition-all shadow-lg shadow-red-500/20"
                    title="End interview"
                >
                    <PhoneOff className="h-5 w-5" />
                </button>
            </div>
        </div>
    );
}

export default function InterviewRoom() {
    return (
        <Suspense fallback={<div className="h-screen w-full bg-black flex items-center justify-center">
            <div className="h-16 w-16 rounded-full border-2 border-white/20 border-t-white animate-spin" />
        </div>}>
            <InterviewRoomContent />
        </Suspense>
    );
}
