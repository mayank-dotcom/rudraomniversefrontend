"use client"

import { getApiKey } from "@/lib/auth"

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

function getHeaders() {
  return {
    "Content-Type": "application/json",
    "x-api-key": getApiKey() || "",
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
  const res = await fetch(`${API_BASE}${payload.endpoint}`, {
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

export async function generateTTS(text: string) {
  const res = await fetch(`${API_BASE}/tts/generate`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ text }),
  })

  const data = await parseJson<TTSResponse>(res)
  if (!res.ok) {
    throw new Error(data.error || "Unable to generate speech.")
  }
  return data
}

export async function transcribeSpeech(audioBlob: Blob) {
  const formData = new FormData()
  formData.append("audio", audioBlob, "recording.webm")

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
    throw new Error(data.error || "Unable to transcribe speech.")
  }
  return data
}
