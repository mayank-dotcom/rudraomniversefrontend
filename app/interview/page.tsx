"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Mic, MicOff, Video, VideoOff, PhoneOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import PageLoader from "@/components/ui/PageLoader";
import { createChat, saveChatMessage, sendAiRequest, generateTTSAudio, transcribeSpeech, transcribeSpeechFallback, stopSpeechRecognition } from "@/lib/chat-api";
import { ThemeProvider } from "@/lib/theme-context";
import { HorizontalProgressLoader } from "@/components/ui/horizontal-progress-loader";
import { Brain, FileText, Database, Sparkles, ArrowRight, Save } from "lucide-react";

function InterviewRoomContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const topic = searchParams.get("topic") || "General Interview";
    const duration = parseInt(searchParams.get("duration") || "45") * 60;
    const difficulty = searchParams.get("difficulty") || "medium";
    const vibe = searchParams.get("vibe") || "standard";
    const focus = searchParams.get("focus") || "coding";

    const getLanguage = () => {
        const t = topic.toLowerCase();
        if (t.includes('react') || t.includes('java') || t.includes('coding') || t.includes('developer') || t.includes('python') || t.includes('tech')) {
            return 'en-IN';
        }
        return 'hi-IN';
    };

    const videoRef = useRef<HTMLVideoElement>(null);
    const botVideoRef = useRef<HTMLVideoElement>(null);
    const [isMicOn, setIsMicOn] = useState(true);
    const [isCameraOn, setIsCameraOn] = useState(true);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [timeLeft, setTimeLeft] = useState(duration);
    const [isInterviewActive, setIsInterviewActive] = useState(false);
    const [isBotSpeaking, setIsBotSpeaking] = useState(false);
    const [isUserSpeaking, setIsUserSpeaking] = useState(false);
    const [conversation, setConversation] = useState<Array<{ role: "bot" | "user", text: string }>>([]);
    const [chatId, setChatId] = useState<string | null>(null);
    const [interviewEnded, setInterviewEnded] = useState(false);
    const [feedback, setFeedback] = useState<string | null>(null);
    const [isGeneratingFeedback, setIsGeneratingFeedback] = useState(false);

    const FEEDBACK_STEPS = [
        { text: "Saving responses", icon: Save },
        { text: "Analyzing accuracy", icon: Brain },
        { text: "Synthesizing scores", icon: Sparkles },
        { text: "Formatting report", icon: FileText },
        { text: "Syncing with chat", icon: Database },
        { text: "Redirecting", icon: ArrowRight }
    ];

    const [ttsProvider, setTtsProvider] = useState<"sarvam" | "browser" | "loading">("loading");

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
    const recordingStartTimeRef = useRef<number>(0);
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

    // Play / pause the bot avatar video based on isBotSpeaking
    useEffect(() => {
        const v = botVideoRef.current;
        if (!v) return;
        if (isBotSpeaking) {
            // Always start from the beginning while the bot is actively talking
            v.currentTime = 0;
            const playPromise = v.play();
            if (playPromise && typeof playPromise.catch === "function") {
                playPromise.catch(() => { /* autoplay may be blocked; ignore */ });
            }
        } else {
            v.pause();
        }
    }, [isBotSpeaking]);

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
        if (botVideoRef.current) {
            botVideoRef.current.pause();
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
            setIsGeneratingFeedback(true);
            await generateFeedback();
            setIsGeneratingFeedback(false);
            router.push(`/chat?id=${chatId}`);
        } else {
            router.push("/chat");
        }
    };

    const startInterview = async () => {
        setIsInterviewActive(true);
        await askQuestion(null);
    };

    const askQuestion = async (previousAnswer: string | null) => {
        try {
            setIsBotSpeaking(true);

            let messages: Array<{ role: "user" | "assistant" | "system", content: string }> = [];

            let vibeInstruction = "";
            if (vibe === "friendly") {
                vibeInstruction = "Your personality is exceptionally encouraging, warm, and supportive. Help the candidate feel relaxed, and if they struggle, gently guide them while keeping their morale high.";
            } else if (vibe === "savage") {
                vibeInstruction = "Your personality is that of a brutal, hyper-critical, and savage interviewer. Act like a highly demanding tech lead. Poke holes in their logic, point out flaws directly, and ask aggressive follow-up questions to test their limits under pressure.";
            } else {
                vibeInstruction = "Maintain a neutral, balanced, and professional technical interviewer stance.";
            }

            let focusInstruction = "";
            if (focus === "conceptual") {
                focusInstruction = "Focus primarily on core theory, theoretical principles, fundamental concepts, and underlying design paradigms.";
            } else if (focus === "coding") {
                focusInstruction = "Focus on algorithmic reasoning, data structures, implementation approaches, logic problem verbalization, and complexity analysis.";
            } else {
                focusInstruction = "Focus on high-level system design, scalability, distributed systems architecture, API constraints, and microservices patterns.";
            }

            const systemPrompt = `You are an expert technical interviewer for: ${topic}. 
            The target difficulty level for this interview is: ${difficulty.toUpperCase()}. Please adjust the depth, complexity, and technical expectation of your questions accordingly (e.g. basic overview for EASY, standard developer interview for MEDIUM, and deep system architecture / complex scenarios for HARD).
            
            Interview Focus Area: ${focus.toUpperCase()} - ${focusInstruction}
            
            Interviewer Personality Style: ${vibeInstruction}
            
            RULES:
            1. THIS IS A VERBAL AUDIO INTERVIEW. ABSOLUTELY DO NOT ask the user to write, type, or dictate code.
            2. DO NOT ask machine coding questions. Keep questions focused on verbal explanations of concepts, architecture, and problem-solving.
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
            // PRIMARY: Sarvam AI (deployed on backend as /tts/generate → bulbul:v3)
            console.log("[Interview TTS] Attempting primary: Sarvam AI...");
            const audioBlob = await generateTTSAudio(text, getLanguage());
            console.log("[Interview TTS] ✓ Sarvam AI succeeded");
            setTtsProvider("sarvam");

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
            // FALLBACK: Browser speechSynthesis (only if Sarvam fails)
            console.warn("[Interview TTS] Sarvam AI failed, using browser speechSynthesis fallback:", error);
            setTtsProvider("browser");
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
        let mediaRecorderStartTimeRef = { current: 0 };
        mediaRecorderStartTimeRef.current = Date.now();

        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                audioChunksRef.current.push(event.data);
                console.log('[Audio] Chunk received:', { size: event.data.size, totalChunks: audioChunksRef.current.length });
            }
        };

        mediaRecorder.onstop = async () => {
            // Cleanup intervals
            if (liveTranscriptionIntervalRef.current) {
                clearInterval(liveTranscriptionIntervalRef.current);
                liveTranscriptionIntervalRef.current = null;
            }

            // Cleanup silence timer
            if (silenceTimerRef.current) {
                clearTimeout(silenceTimerRef.current);
                silenceTimerRef.current = null;
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
            console.log('Audio blob created:', { size: audioBlob.size, type: audioBlob.type, chunks: audioChunksRef.current.length });

            if (audioBlob.size < 1000) {
                console.warn("Audio blob too small:", audioBlob.size);
                setIsUserSpeaking(false);
                return;
            }

            // Send audio to backend for Whisper transcription
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

        // Silence detection - listen until silence is detected
        const checkSilence = () => {
            if (!micAnalyserRef.current || mediaRecorder.state !== "recording") return;

            const bufferLength = micAnalyserRef.current.fftSize;
            const dataArray = new Uint8Array(bufferLength);
            micAnalyserRef.current.getByteTimeDomainData(dataArray);

            // Calculate RMS (Root Mean Square) for better voice activity detection
            let sum = 0;
            for (let i = 0; i < bufferLength; i++) {
                const val = dataArray[i] - 128; // Convert 0-255 to -128 to 127 (silence = 128)
                sum += val * val;
            }
            const rms = Math.sqrt(sum / bufferLength);
            console.log('[Silence Check] RMS Level:', rms);

            const SILENCE_THRESHOLD = 5; // Tune this if needed (higher = more sensitive to sound)
            if (rms < SILENCE_THRESHOLD) {
                if (!silenceTimerRef.current) {
                    silenceTimerRef.current = setTimeout(() => {
                        console.log('[Recording] Stopping due to silence...', { rms });
                        const recordingDuration = Date.now() - (mediaRecorderStartTimeRef.current || 0);
                        if (recordingDuration > 1000 && mediaRecorder.state === "recording") {
                            mediaRecorder.stop();
                        }
                        silenceTimerRef.current = null;
                    }, 5000); // 5 seconds of continuous silence before stopping
                }
            } else {
                if (silenceTimerRef.current) {
                    console.log('[Silence Check] Sound detected, clearing silence timer');
                    clearTimeout(silenceTimerRef.current);
                    silenceTimerRef.current = null;
                }
            }

            if (mediaRecorder.state === "recording") {
                setTimeout(checkSilence, 300);
            }
        };

        setTimeout(checkSilence, 1000); // Start checking after 1 second
    };

    const processAnswer = async (audioBlob: Blob) => {
        try {
            setLiveTranscription("Transcribing...");

            // Use backend Whisper API for transcription
            const userText = await transcribeSpeech(audioBlob);
            console.log("[processAnswer] Whisper transcription:", userText);

            if (!userText || userText.trim() === "") {
                throw new Error("Empty transcription");
            }

            // Show transcribed text in UI (keep isUserSpeaking true so UI shows)
            setLiveTranscription(userText);

            setConversation(prev => [...prev, { role: "user", text: userText }]);

            if (chatId) {
                await saveChatMessage(chatId, "user", userText);
            }

            // Wait so user can see their transcribed text
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Now stop user speaking and start bot
            setIsUserSpeaking(false);

            if (timeLeft > 10) {
                await askQuestion(userText);
            } else {
                endInterview();
            }

        } catch (error: any) {
            console.error("Transcription Error:", error);
            // Show error to user (keep isUserSpeaking true so UI shows)
            setLiveTranscription("⚠️ Transcription failed: " + error.message);

            // Allow user to try again after showing error
            setTimeout(() => {
                setLiveTranscription("");
                setIsUserSpeaking(false);
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
            <HorizontalProgressLoader
                loadingStates={FEEDBACK_STEPS}
                loading={isGeneratingFeedback}
                duration={1800}
                loop={true}
                title="Analyzing Your Interview"
                subtitle="Hold tight while our AI engine prepares your performance report"
            />
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

            {/* AI Interviewer (Large - Center) - Video Background */}
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black overflow-hidden">
                {/* Fullscreen bot video as the AI interviewer backdrop */}
                <video
                    ref={botVideoRef}
                    src={encodeURI("/WhatsApp Video 2026-06-12 at 12.57.45 PM.mp4")}
                    muted
                    playsInline
                    loop
                    preload="auto"
                    className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${isBotSpeaking ? "opacity-100" : "opacity-40"}`}
                    style={{ objectPosition: "center 20%" }}
                />

                {/* Dark overlay to keep UI elements readable */}
                <div className={`absolute inset-0 bg-gradient-to-b transition-opacity duration-500 pointer-events-none ${isBotSpeaking
                    ? "from-black/40 via-black/20 to-black/60"
                    : "from-black/70 via-black/60 to-black/80"
                    }`} />

                {/* "Listening" state indicator when user is speaking (no video playback) */}
                {isUserSpeaking && !isBotSpeaking && (
                    <div className="relative z-10 flex flex-col items-center gap-3">
                        <div className="h-20 w-20 rounded-full border-2 border-[#39FF14]/60 flex items-center justify-center bg-black/40 backdrop-blur-md">
                            <Mic className="h-8 w-8 text-[#39FF14] animate-pulse" />
                        </div>
                        <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-white/70">
                            Listening...
                        </span>
                    </div>
                )}

                {/* Idle indicator when neither bot nor user is speaking */}
                {!isBotSpeaking && !isUserSpeaking && (
                    <div className="relative z-10 flex flex-col items-center gap-3">
                        <div className="h-16 w-16 rounded-full border border-white/20 flex items-center justify-center bg-black/40 backdrop-blur-md">
                            <Video className="h-7 w-7 text-white/60" />
                        </div>
                        <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-white/40">
                            Standby
                        </span>
                    </div>
                )}

                {/* Bottom-center caption */}
                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2">
                    <span className={`h-1.5 w-1.5 rounded-full ${isBotSpeaking ? "bg-[#39FF14] shadow-[0_0_8px_#39FF14] animate-pulse" : isUserSpeaking ? "bg-[#4285F4] shadow-[0_0_8px_#4285F4] animate-pulse" : "bg-white/30"}`} />
                    <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-white/50">
                        AI Interviewer
                    </span>
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

            {/* TTS Provider Badge (Top Right) */}
            <div className="absolute top-6 right-6 px-3 py-2 bg-black/60 backdrop-blur-sm border border-white/10 rounded-lg shadow-2xl flex items-center gap-2 z-10">
                <div className={`h-1.5 w-1.5 rounded-full ${ttsProvider === "sarvam" ? "bg-[#39FF14] shadow-[0_0_6px_#39FF14]"
                    : ttsProvider === "browser" ? "bg-yellow-400 shadow-[0_0_6px_rgba(250,204,21,0.6)]"
                    : "bg-white/30"
                    }`} />
                <span className="text-[8px] font-mono uppercase tracking-[0.2em] text-white/50">Voice</span>
                <span className="text-[9px] font-mono uppercase tracking-wider font-bold text-white/80">
                    {ttsProvider === "sarvam" ? "Sarvam AI" : ttsProvider === "browser" ? "Browser Fallback" : "Initializing"}
                </span>
            </div>

            {/* Timer (Top Center) */}
            <div className="absolute top-6 left-1/2 -translate-x-1/2 px-6 py-3 bg-black/60 backdrop-blur-sm border border-white/10 rounded-lg shadow-2xl">
                <span className="text-2xl font-mono text-white font-bold">{formatTime(timeLeft)}</span>
            </div>

            {/* Control Bar (Bottom Center) */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3">
                <button
                    onClick={toggleMic}
                    className={`p-4 rounded-full transition-all ${isMicOn
                            ? "bg-[#2a2a2a] border border-white/10 text-white hover:bg-[#3a3a3a]"
                            : "bg-red-500/20 border border-red-500/30 text-red-400"
                        }`}
                    title={isMicOn ? "Turn off microphone" : "Turn on microphone"}
                >
                    {isMicOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
                </button>

                <button
                    onClick={toggleCamera}
                    className={`p-4 rounded-full transition-all ${isCameraOn
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
        <ThemeProvider>
            <Suspense fallback={<PageLoader />}>
                <InterviewRoomContent />
            </Suspense>
        </ThemeProvider>
    );
}
