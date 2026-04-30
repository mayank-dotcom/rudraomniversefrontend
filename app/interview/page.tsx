"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Mic, MicOff, Video, VideoOff, PhoneOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ChatLoader from "@/components/ui/ChatLoader";
import { createChat, saveChatMessage, sendAiRequest, generateTTSAudio, transcribeSpeech } from "@/lib/chat-api";

function InterviewRoomContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const topic = searchParams.get("topic") || "General Interview";
    const duration = parseInt(searchParams.get("duration") || "45") * 60;

    const getLanguage = () => {
        const t = topic.toLowerCase();
        if (t.includes('react') || t.includes('java') || t.includes('coding') || t.includes('developer') || t.includes('python') || t.includes('tech')) {
            return 'en-IN';
        }
        return 'hi-IN';
    };
    
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
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const [audioLevel, setAudioLevel] = useState(0);
    const [liveTranscription, setLiveTranscription] = useState("");
    const [botLiveTranscription, setBotLiveTranscription] = useState("");
    const botTranscriptionRef = useRef("");
    const botAudioRef = useRef<HTMLAudioElement | null>(null);
    const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
    const micAudioContextRef = useRef<AudioContext | null>(null);
    const micAnalyserRef = useRef<AnalyserNode | null>(null);
    const speechRecognitionRef = useRef<any>(null);
    const liveTranscriptionIntervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        startCamera();
        initializeChat();
        return () => {
            stream?.getTracks().forEach(track => track.stop());
            if (currentAudioRef.current) {
                currentAudioRef.current.pause();
            }
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
            if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
                audioContextRef.current.close();
            }
            if (micAudioContextRef.current && micAudioContextRef.current.state !== 'closed') {
                micAudioContextRef.current.close();
            }
            if (speechRecognitionRef.current) {
                speechRecognitionRef.current.stop();
            }
            if (silenceTimerRef.current) {
                clearTimeout(silenceTimerRef.current);
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

    const endInterview = async () => {
        setInterviewEnded(true);
        setIsInterviewActive(false);
        setIsUserSpeaking(false);
        setIsBotSpeaking(false);
        setAudioLevel(0);
        setLiveTranscription("");
        
        // Stop all audio playback
        window.speechSynthesis.cancel();
        if (currentAudioRef.current) {
            currentAudioRef.current.pause();
            currentAudioRef.current = null;
        }
        if (botAudioRef.current) {
            botAudioRef.current.pause();
            botAudioRef.current = null;
        }

        // Cleanup audio contexts
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }
        if (micAudioContextRef.current && micAudioContextRef.current.state !== 'closed') {
            micAudioContextRef.current.close();
            micAudioContextRef.current = null;
        }

        // Cleanup animations
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }

        // Cleanup recorders and intervals
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
        }
        if (liveTranscriptionIntervalRef.current) {
            clearInterval(liveTranscriptionIntervalRef.current);
            liveTranscriptionIntervalRef.current = null;
        }
        if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = null;
        }

        // Stop media stream
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }

        if (chatId) {
            await generateFeedback();
            router.push(`/chat?id=${chatId}`);
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

            const systemPrompt = `You are an expert technical interviewer for: ${topic}. 
            RULES:
            1. DO NOT ask machine coding questions or long coding tasks.
            2. Keep questions focused on concepts, architecture, and problem-solving.
            3. If the user asks you to REPEAT the question, repeat the EXACT same previous question.
            4. DO NOT move to a new question until the current one is clearly answered or acknowledged.
            5. Return ONLY plain text without any markdown or formatting.`;

            const userPrompt = previousAnswer
                ? `Candidate answered: "${previousAnswer}". Continue the interview.`
                : `Start the interview. Ask the first question.`;

            messages = [
                { role: "system", content: systemPrompt },
                ...conversation.map(c => ({
                    role: c.role === "bot" ? "assistant" as const : "user" as const,
                    content: c.text
                })),
                { role: "user", content: userPrompt }
            ];

            const response = await sendAiRequest({
                endpoint: "/chat",
                messages: messages,
                chat_id: chatId || undefined,
                modality: "text"
            });

            const botText = response.data?.[0]?.message?.content || response.data?.[0]?.text || "Please tell me about yourself.";
            
            if (chatId) {
                await saveChatMessage(chatId, "assistant", botText);
            }

            // Typewriter effect for Bot Live Feed
            setBotLiveTranscription("");
            botTranscriptionRef.current = "";
            let i = 0;
            const interval = setInterval(() => {
                if (i < botText.length) {
                    const char = botText.charAt(i);
                    botTranscriptionRef.current += char;
                    setBotLiveTranscription(botTranscriptionRef.current);
                    i++;
                } else {
                    clearInterval(interval);
                }
            }, 30);

            await playTTSAudio(botText);
            
            setIsBotSpeaking(false);
            setTimeout(() => setBotLiveTranscription(""), 2000); // Wait a bit after speaking before clearing
            
            await listenForAnswer();
            
        } catch (error) {
            console.error("Error in interview:", error);
            setIsBotSpeaking(false);
        }
    };

    const playTTSAudio = async (text: string) => {
        try {
            const audioBlob = await generateTTSAudio(text, getLanguage());
            const audioUrl = URL.createObjectURL(audioBlob);
            const audio = new Audio(audioUrl);
            currentAudioRef.current = audio;
            botAudioRef.current = audio;

            // Setup audio analysis for visualization
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            const audioContext = new AudioContext();
            
            // Resume context if suspended (browser policy)
            if (audioContext.state === 'suspended') {
                await audioContext.resume();
            }

            const analyser = audioContext.createAnalyser();
            const source = audioContext.createMediaElementSource(audio);
            source.connect(analyser);
            analyser.connect(audioContext.destination);
            analyser.fftSize = 256;

            audioContextRef.current = audioContext;
            analyserRef.current = analyser;

            const updateAudioLevel = () => {
                if (!analyserRef.current) return;
                const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
                analyserRef.current.getByteFrequencyData(dataArray);
                const avg = dataArray.reduce((a, b) => a + b) / dataArray.length;
                setAudioLevel(avg / 255);
                animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
            };

            audio.play().catch(e => {
                console.warn("Audio play failed, user might need to click first:", e);
                // Try to resume context and play again
                audioContext.resume().then(() => audio.play());
            });
            updateAudioLevel();

            await new Promise(resolve => {
                audio.onended = () => {
                    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
                    if (audioContextRef.current && audioContextRef.current.state !== 'closed') audioContextRef.current.close();
                    setAudioLevel(0);
                    resolve(null);
                };
            });

            URL.revokeObjectURL(audioUrl);
        } catch (error) {
            console.error("TTS Error, using browser fallback:", error);
            await playBrowserTTS(text);
        }
    };

    const playBrowserTTS = (text: string) => {
        return new Promise(resolve => {
            if (!('speechSynthesis' in window)) {
                resolve(null);
                return;
            }
            
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 0.9;
            utterance.pitch = 1;
            utterance.onend = () => resolve(null);
            utterance.onerror = () => resolve(null);
            window.speechSynthesis.speak(utterance);
        });
    };

    const listenForAnswer = async () => {
        if (!stream) return;

        console.log('=== STARTING TO LISTEN ===');
        setIsUserSpeaking(true);
        setLiveTranscription("Listening...");

        // Setup mic audio analysis for circumference animation
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        const micAudioContext = new AudioContext();
        
        if (micAudioContext.state === 'suspended') {
            await micAudioContext.resume();
        }

        const micAnalyser = micAudioContext.createAnalyser();
        const micSource = micAudioContext.createMediaStreamSource(new MediaStream(stream.getAudioTracks()));
        micSource.connect(micAnalyser);
        micAnalyser.fftSize = 256;

        micAudioContextRef.current = micAudioContext;
        micAnalyserRef.current = micAnalyser;

        const updateMicLevel = () => {
            if (!micAnalyserRef.current) return;
            const dataArray = new Uint8Array(micAnalyserRef.current.frequencyBinCount);
            micAnalyserRef.current.getByteFrequencyData(dataArray);
            const avg = dataArray.reduce((a, b) => a + b) / dataArray.length;
            setAudioLevel(avg / 255);
            animationFrameRef.current = requestAnimationFrame(updateMicLevel);
        };
        updateMicLevel();

        const audioStream = new MediaStream(stream.getAudioTracks());
        // Try to use MP4/M4A format which is well-supported by Whisper
        let mimeType = 'audio/webm;codecs=opus'; // fallback
        
        if (MediaRecorder.isTypeSupported('audio/mp4')) {
            mimeType = 'audio/mp4';
        } else if (MediaRecorder.isTypeSupported('audio/mpeg')) {
            mimeType = 'audio/mpeg';
        } else if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
            mimeType = 'audio/webm;codecs=opus';
        }
        
        console.log('MediaRecorder using MIME type:', mimeType);
        const mediaRecorder = new MediaRecorder(audioStream, { mimeType });
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                audioChunksRef.current.push(event.data);
            }
        };

        mediaRecorder.onstop = async () => {
            // Cleanup intervals and recognizers
            if (liveTranscriptionIntervalRef.current) {
                clearInterval(liveTranscriptionIntervalRef.current);
                liveTranscriptionIntervalRef.current = null;
            }
            if (speechRecognitionRef.current) {
                speechRecognitionRef.current.stop();
                speechRecognitionRef.current = null;
            }
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
                animationFrameRef.current = null;
            }

            if (audioChunksRef.current.length === 0) {
                console.warn("No audio chunks recorded.");
                setIsUserSpeaking(false);
                return;
            }
            
            // Use the actual MIME type from MediaRecorder
            const audioBlob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType || 'audio/webm' });
            console.log('Audio blob created:', { size: audioBlob.size, type: audioBlob.type });
            
            if (audioBlob.size < 100) {
                console.warn("Audio blob too small:", audioBlob.size);
                setIsUserSpeaking(false);
                return;
            }
            await processAnswer(audioBlob);

            // Cleanup audio context
            if (micAudioContextRef.current && micAudioContextRef.current.state !== 'closed') {
                micAudioContextRef.current.close();
                micAudioContextRef.current = null;
            }
            setAudioLevel(0);
        };

        if (mediaRecorder.state === "inactive" && audioStream.active) {
            try {
                mediaRecorder.start(1000); // Collect data every 1 second
            } catch (err) {
                console.error("MediaRecorder start error:", err);
            }
        }

        // Backend-powered Live Transcription
        setLiveTranscription("Listening...");
        let isTranscribing = false;
        
        liveTranscriptionIntervalRef.current = setInterval(async () => {
            if (audioChunksRef.current.length > 0 && mediaRecorder.state === "recording" && !isTranscribing) {
                isTranscribing = true;
                try {
                    const tempBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                    
                    if (tempBlob.size > 5000) { // Increased threshold to ensure enough audio data
                        const data = await transcribeSpeech(tempBlob, getLanguage());
                        if (data.text && data.text.trim()) {
                            setLiveTranscription(data.text);
                        }
                    }
                } catch (e) {
                    console.warn("Live transcription chunk error:", e);
                } finally {
                    isTranscribing = false;
                }
            }
        }, 3500); // Every 3.5 seconds for a balance between "live" and server load

        // Silence detection
        const checkSilence = () => {
            if (!micAnalyserRef.current || mediaRecorder.state !== "recording") return;

            const dataArray = new Uint8Array(micAnalyserRef.current.frequencyBinCount);
            micAnalyserRef.current.getByteFrequencyData(dataArray);
            const avg = dataArray.reduce((a, b) => a + b) / dataArray.length;

            if (avg < 5) { // Lowered threshold for better sensitivity
                if (!silenceTimerRef.current) {
                    silenceTimerRef.current = setTimeout(() => {
                        console.log('Stopping recording due to silence...');
                        if (mediaRecorder.state === "recording") {
                            mediaRecorder.stop();
                        }
                        silenceTimerRef.current = null;
                    }, 4000); // Increased to 4 seconds for natural pauses
                }
            } else {
                if (silenceTimerRef.current) {
                    clearTimeout(silenceTimerRef.current);
                    silenceTimerRef.current = null;
                }
            }

            if (mediaRecorder.state === "recording") {
                setTimeout(checkSilence, 200);
            }
        };

        setTimeout(checkSilence, 1000); // Start checking after 1 second
    };

    const processAnswer = async (audioBlob: Blob) => {
        try {
            setIsUserSpeaking(false);
            
            let userText = "";
            try {
                const data = await transcribeSpeech(audioBlob, getLanguage());
                userText = data.text || liveTranscription || "No answer detected.";
            } catch (err) {
                console.error("Final transcription failed, falling back to live feed:", err);
                userText = liveTranscription || "No answer detected.";
            }

            setConversation(prev => [...prev, { role: "user", text: userText }]);
            
            if (chatId) {
                await saveChatMessage(chatId, "user", userText);
            }

            if (timeLeft > 10) {
                await askQuestion(userText);
            } else {
                endInterview();
            }
            
        } catch (error: any) {
            console.error("Transcription Error:", error);
            setIsUserSpeaking(false);
            setLiveTranscription("⚠️ Transcription failed. Please try again.");
            
            // Allow user to try again
            setTimeout(() => {
                setLiveTranscription("");
                listenForAnswer();
            }, 3000);
        }
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
                    content: `Analyze this interview for ${topic}. 
                    For EACH question asked, provide:
                    - Question Asked
                    - Ideal Correct Answer
                    - User's Actual Answer
                    - Recommendation for Improvement
                    - Key Topics to Study
                    
                    Format the output clearly as a structured report.
                    
                    Conversation:\n${conversationText}`
                }],
                chat_id: chatId || undefined,
                modality: "text"
            });

            const feedbackText = response.data?.[0]?.message?.content || response.data?.[0]?.text || "Interview completed.";
            setFeedback(feedbackText);
            
            if (chatId) {
                await saveChatMessage(chatId, "assistant", `## Interview Analysis Report\n\n${feedbackText}`);
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
                    <div className="relative group">
                        {/* Resonance Rings - Layered Ripple Effect */}
                        <AnimatePresence>
                            {(isBotSpeaking || isUserSpeaking) && (
                                <>
                                    {/* Outer Ripple */}
                                    <motion.div
                                        initial={{ opacity: 0, scale: 1 }}
                                        animate={{
                                            scale: 1 + audioLevel * 2.5,
                                            opacity: [0, 0.3, 0],
                                            borderRadius: ["50% 50% 50% 50%", "40% 60% 45% 55%", "55% 45% 60% 40%", "50% 50% 50% 50%"],
                                        }}
                                        transition={{ duration: 0.8, repeat: Infinity, ease: "easeOut" }}
                                        className="absolute inset-0 border-4 border-[#39FF14] blur-xl"
                                    />
                                    {/* Middle Vibration */}
                                    <motion.div
                                        animate={{
                                            scale: 1 + audioLevel * 1.2,
                                            rotate: [0, 5, -5, 0],
                                            borderRadius: ["50% 50% 50% 50%", "48% 52% 45% 55%", "52% 48% 55% 45%", "50% 50% 50% 50%"],
                                        }}
                                        transition={{ duration: 0.15, repeat: Infinity, ease: "linear" }}
                                        className="absolute inset-0 border-2 border-[#39FF14] opacity-40 blur-md"
                                    />
                                </>
                            )}
                        </AnimatePresence>

                        {/* Primary Vibrating Ring */}
                        <motion.div
                            animate={{
                                scale: 1 + audioLevel * 0.45,
                                x: (isBotSpeaking || isUserSpeaking) ? [0, audioLevel * 8, -audioLevel * 8, 0] : 0,
                                y: (isBotSpeaking || isUserSpeaking) ? [0, -audioLevel * 8, audioLevel * 8, 0] : 0,
                                borderRadius: (isBotSpeaking || isUserSpeaking) ? ["50% 50% 50% 50%", "45% 55% 48% 52%", "52% 48% 55% 45%", "50% 50% 50% 50%"] : "50%",
                            }}
                            transition={{
                                duration: 0.1,
                                repeat: (isBotSpeaking || isUserSpeaking) ? Infinity : 0,
                                repeatType: "mirror",
                                ease: "linear"
                            }}
                            className={`relative rounded-full bg-black flex items-center justify-center transition-all duration-100 z-10 ${
                                isUserSpeaking ? 'h-80 w-80' : 'h-64 w-64'
                            }`}
                            style={{
                                border: `2px solid #39FF14`,
                                boxShadow: `0 0 ${20 + audioLevel * 120}px rgba(57, 255, 20, 0.9), 0 0 ${40 + audioLevel * 200}px rgba(57, 255, 20, 0.5), inset 0 0 ${15 + audioLevel * 60}px rgba(57, 255, 20, 0.7)`,
                                filter: `drop-shadow(0 0 ${15 + audioLevel * 40}px rgba(57, 255, 20, 0.6))`,
                            }}
                        >
                            <ChatLoader isDarkMode={true} />
                        </motion.div>
                    {isBotSpeaking && (
                        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex gap-1">
                            <div className="h-1 w-1 bg-[#39FF14] rounded-full animate-bounce" />
                            <div className="h-1 w-1 bg-[#39FF14] rounded-full animate-bounce delay-100" />
                            <div className="h-1 w-1 bg-[#39FF14] rounded-full animate-bounce delay-200" />
                        </div>
                    )}
                </div>
                <div className="mt-6">
                    <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/40">AI Interviewer</span>
                </div>
            </div>

            {/* Unified Transcription Feed (Right - Top) */}
            <div className="fixed right-8 top-32 w-[500px] pointer-events-none z-50 text-right">
                <AnimatePresence mode="wait">
                    {(isUserSpeaking || isBotSpeaking) && (
                        <motion.div
                            key={isUserSpeaking ? "user" : "bot"}
                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            transition={{ type: "spring", damping: 20, stiffness: 100 }}
                            className="space-y-4 origin-bottom"
                        >
                            <div className="flex items-center justify-end gap-3">
                                <span className="text-[12px] font-mono uppercase tracking-[0.3em] text-[#39FF14] font-bold">
                                    {isUserSpeaking ? "TRANSCRIBING" : "INTERVIEWER"}
                                </span>
                                <div className="h-2 w-2 bg-[#39FF14] rounded-full animate-pulse shadow-[0_0_10px_#39FF14]" />
                            </div>
                            <div className="max-h-[400px] overflow-y-auto no-scrollbar">
                                <p className="text-lg md:text-xl text-white font-sans font-medium leading-relaxed tracking-wide drop-shadow-2xl">
                                    {isUserSpeaking ? liveTranscription : botLiveTranscription}
                                </p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
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
