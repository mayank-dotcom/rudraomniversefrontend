"use client"

import { getApiKey, getAdminKey } from "@/lib/auth"

const API_BASE = process.env.NEXT_PUBLIC_BASE_URL!

export interface ChatSummary {
  id: string
  title: string
  created_at: string
}

export interface ChatMessageRecord {
  role: "user" | "assistant"
  content: string | any // Allow complex content for vision/structured data
  created_at?: string
}

export interface ChatDetailResponse {
  success: boolean
  chat: ChatSummary
  messages: ChatMessageRecord[]
  error?: string
}

export interface ChatsListResponse {
  success: boolean
  chats: ChatSummary[]
  error?: string
}

export interface CreateChatResponse {
  success: boolean
  chat: ChatSummary
  error?: string
}

export interface DeleteChatResponse {
  success: boolean
  message?: string
  error?: string
}

export interface ChatCompletionResponse {
  success: boolean
  model?: string
  data?: Array<{
    message?: {
      content?: string
    }
    text?: string
  }>
  error?: string
}

export interface TTSResponse {
  success: boolean
  audio_url?: string
  error?: string
}

export interface TranscriptionResponse {
  success: boolean
  text?: string
  error?: string
}

export interface UpdateTokensResponse {
  success: boolean
  tokens_used?: number
  tokens_limit?: number
  error?: string
}

export async function updateTokens(payload: { user_id: string, tokens: number }) {
  const res = await fetch(`${API_BASE}/tools/tokens`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(payload),
  })

  const data = await parseJson<UpdateTokensResponse>(res)
  if (!res.ok) {
    throw new Error(data.error || "Unable to update tokens.")
  }
  return data
}

export interface SubscriptionStatusResponse {
  success: boolean
  subscription?: {
    plan_id: number
    plan_name: string
    price_inr: number
    details: {
      daily_chat_limit: number
      daily_coding_limit: number
      daily_vision_limit: number
      daily_tts_limit: number
      daily_stt_limit: number
      monthly_image_limit: number
      monthly_flux_limit: number
    }
  }
  usage?: {
    daily_chats: number
    daily_codings: number
    daily_visions: number
    daily_tts: number
    daily_stt: number
    monthly_images: number
    monthly_flux: number
    last_reset: string
  }
  error?: string
}

export async function getSubscriptionStatus() {
  const res = await fetch(`${API_BASE}/subscription/status`, {
    method: "GET",
    headers: getHeaders(),
  })

  const data = await parseJson<SubscriptionStatusResponse>(res)
  if (!res.ok) {
    throw new Error(data.error || "Unable to fetch subscription status.")
  }
  return data
}

export interface AdminUser {
  id: string
  name: string
  email: string
  subscription: {
    plan: string
    status: string
    tokens_used: number
    tokens_limit: number
    images_used: number
    images_limit: number
    personas_used: number
    personas_limit: number
    latency_ms: number
  }
}

export interface AdminUsersResponse {
  success: boolean
  users?: AdminUser[]
  error?: string
}

export async function getAdminUsers() {
  const res = await fetch(`${API_BASE}/admin/users`, {
    method: "GET",
    headers: getHeaders(),
  })

  const data = await res.json()
  if (!res.ok) {
    throw new Error(data.error || "Unable to fetch users.")
  }

  // Map flat backend response to nested frontend interface
  if (data.success && Array.isArray(data.users)) {
    data.users = data.users.map((u: any) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      subscription: {
        plan: u.plan_name || "Free Trial",
        status: "active", // Default status as backend doesn't provide it yet
        tokens_used: u.daily_chats || 0,
        tokens_limit: 1000, // Placeholder as backend doesn't join with limits yet
        images_used: u.monthly_images || 0,
        images_limit: 100, // Placeholder
        personas_used: 0,
        personas_limit: 10,
        latency_ms: "24"
      }
    }))
  }

  return data as AdminUsersResponse
}

export async function adminLogin(adminKey: string) {
  // First try the specific login endpoint requested by user
  const res = await fetch(`${API_BASE}/admin/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": getApiKey() || "",
      "x-admin-key": adminKey
    },
    body: JSON.stringify({ key: adminKey })
  })

  if (res.ok) return await res.json();

  // Fallback: If login endpoint doesn't exist (404), validate by trying to fetch admin users
  if (res.status === 404) {
    const valRes = await fetch(`${API_BASE}/admin/users`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": getApiKey() || "",
        "x-admin-key": adminKey
      }
    });
    
    if (valRes.ok) {
      return { success: true, message: "Admin authenticated via validation" };
    }
    const errData = await valRes.json().catch(() => ({}));
    throw new Error(errData.error || "Invalid Admin Key");
  }

  const data = await res.json().catch(() => ({}));
  throw new Error(data.error || "Login failed");
}

function getHeaders() {
  return {
    "Content-Type": "application/json",
    "x-api-key": getApiKey() || "",
    "x-admin-key": getAdminKey() || "",
  }
}

async function parseJson<T>(res: Response): Promise<T> {
  return res.json() as Promise<T>
}

export async function listChats() {
  const res = await fetch(`${API_BASE}/chats`, {
    method: "GET",
    headers: getHeaders(),
  })

  const data = await parseJson<ChatsListResponse>(res)
  if (!res.ok) {
    throw new Error(data.error || "Unable to load chats.")
  }
  return data
}

export async function createChat(title: string) {
  const res = await fetch(`${API_BASE}/chats`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ title }),
  })

  const data = await parseJson<CreateChatResponse>(res)
  if (!res.ok) {
    throw new Error(data.error || "Unable to create chat.")
  }
  return data
}

export async function getChatHistory(chatId: string) {
  const res = await fetch(`${API_BASE}/chats/${chatId}`, {
    method: "GET",
    headers: getHeaders(),
  })

  const data = await parseJson<ChatDetailResponse>(res)
  if (!res.ok) {
    throw new Error(data.error || "Unable to fetch chat history.")
  }
  return data
}

export async function saveChatMessage(chatId: string, role: "user" | "assistant", content: string) {
  const res = await fetch(`${API_BASE}/chats/${chatId}/messages`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ role, content }),
  })

  const data = await res.json()
  if (!res.ok) {
    throw new Error(data.error || "Unable to sync message.")
  }
  return data
}

export async function deleteChat(chatId: string) {
  const res = await fetch(`${API_BASE}/chats/${chatId}`, {
    method: "DELETE",
    headers: getHeaders(),
  })

  const data = await parseJson<DeleteChatResponse>(res)
  if (!res.ok) {
    throw new Error(data.error || "Unable to delete chat.")
  }
  return data
}

export async function sendAiRequest(payload: {
  endpoint: string
  messages: Array<{ role: "user" | "assistant"; content: any }>
  chat_id?: string
  modality?: string
}) {
  const fullUrl = `${API_BASE}${payload.endpoint}`;
  console.log(`[sendAiRequest] Fetching: ${fullUrl}`);
  const res = await fetch(fullUrl, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      messages: payload.messages,
      ...(payload.modality ? { modality: payload.modality } : {}),
      ...(payload.chat_id ? { chat_id: payload.chat_id } : {}),
    }),
  })

  const data = await parseJson<ChatCompletionResponse>(res)
  if (!res.ok) {
    throw new Error(data.error || "Unable to process your request.")
  }
  return data
}

export async function sendChatCompletion(payload: {
  messages: Array<{ role: "user" | "assistant"; content: string }>
  chat_id?: string
}) {
  return sendAiRequest({
    endpoint: "/chat",
    messages: payload.messages,
    chat_id: payload.chat_id,
    modality: "text",
  })
}

export async function generateTTSAudio(text: string, language: string = 'hi-IN') {
  try {
    const res = await fetch(`${API_BASE}/tts/generate`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ text, language }),
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data.error || "Unable to generate speech.")
    }

    const data = await res.json()
    if (!data.success || !data.audioData) {
      throw new Error("Invalid TTS response from server")
    }

    // Convert base64 to blob more robustly
    const binaryString = window.atob(data.audioData)
    const len = binaryString.length
    const bytes = new Uint8Array(len)
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }
    
    // Detect format if possible, default to mpeg
    return new Blob([bytes], { type: 'audio/mpeg' })
  } catch (error) {
    console.error("TTS API Error:", error)
    throw error
  }
}

export async function transcribeSpeech(audioBlob: Blob, language: string = 'hi-IN') {
  try {
    // Convert to WAV for better Whisper compatibility
    const { convertToWav } = await import('./audio-converter');
    const wavBlob = await convertToWav(audioBlob);
    console.log('Audio converted to WAV:', { original: audioBlob.type, wavSize: wavBlob.size, wavType: wavBlob.type });

    const formData = new FormData()
    formData.append("file", wavBlob, "recording.wav")
    formData.append("language", language)

    const apiKey = getApiKey()
    const res = await fetch(`${API_BASE}/speech/transcribe`, {
      method: "POST",
      headers: {
        "x-api-key": apiKey || "",
      },
      body: formData,
    })

    const data = await parseJson<TranscriptionResponse>(res)
    if (!res.ok) {
      console.error("Backend Transcription Error Details:", data);
      throw new Error(data.error || "Unable to transcribe speech.")
    }

    // Map backend 'transcript' field to 'text' for frontend compatibility
    if (data.transcript && !data.text) {
      data.text = data.transcript
    }

    return data
  } catch (error) {
    console.error("Transcription Error:", error);
    throw error;
  }
}
