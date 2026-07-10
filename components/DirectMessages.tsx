"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  MessageSquare, User as UserIcon, X, Maximize2, Minimize2, ChevronLeft, Check, Smile, SquarePen, Loader2
} from "lucide-react"
import {
  getDMConversations, getDMMessages, sendDM, markDMRead, getUserFollowers, getUserFollowing, getCurrentUserProfile
} from "@/lib/chat-api"
import { getApiKey, getUserInfo } from "@/lib/auth"
import { io } from "socket.io-client"
import { useRouter } from "next/navigation"

const getStoryImageUrl = (url: string) => {
  if (!url) return ""
  if (url.startsWith("data:") || url.startsWith("blob:")) {
    return url
  }

  let cleanUrl = url
  
  if (cleanUrl.includes("/uploads/")) {
    const idx = cleanUrl.indexOf("/uploads/")
    cleanUrl = cleanUrl.substring(idx)
  } else if (cleanUrl.includes("/api/v1/uploads/")) {
    const idx = cleanUrl.indexOf("/api/v1/uploads/")
    cleanUrl = "/uploads/" + cleanUrl.substring(idx + 16)
  }

  if (cleanUrl.startsWith("http://") || cleanUrl.startsWith("https://")) {
    return cleanUrl
  }

  const apiRoot = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:5000"
  let serverRoot = apiRoot
  if (serverRoot.endsWith("/api/v1")) {
    serverRoot = serverRoot.slice(0, -7)
  } else if (serverRoot.endsWith("/api/v1/")) {
    serverRoot = serverRoot.slice(0, -8)
  }
  const cleanServerRoot = serverRoot.endsWith("/") ? serverRoot.slice(0, -1) : serverRoot

  const relativePath = cleanUrl.startsWith("/") ? cleanUrl : `/${cleanUrl}`
  return `${cleanServerRoot}${relativePath}`
}

const formatDMDate = (dateStr: string) => {
  if (!dateStr) return ""
  const date = new Date(dateStr)
  const diffMs = Date.now() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return "now"
  if (diffMins < 60) return `${diffMins}m`
  if (diffHours < 24) return `${diffHours}h`
  return `${diffDays}d`
}

interface DirectMessagesProps {
  isOpen: boolean
  onClose: () => void
  isDarkMode: boolean
  activeUserOverride?: { id: string; name: string; profile_picture: string | null } | null
  onUnreadCountChange?: (count: number) => void
  onConversationsUpdate?: (conversations: any[]) => void
}

export default function DirectMessages({
  isOpen,
  onClose,
  isDarkMode,
  activeUserOverride = null,
  onUnreadCountChange,
  onConversationsUpdate
}: DirectMessagesProps) {
  const router = useRouter()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Current logged in user info
  const [currentUserId, setCurrentUserId] = useState<string>("")
  const [currentUserName, setCurrentUserName] = useState<string>("")

  // DM States
  const [dmConvs, setDmConvs] = useState<any[]>([])
  const [dmView, setDmView] = useState<"list" | "new" | "chat">("list")
  const [isDmMaximized, setIsDmMaximized] = useState(false)

  // Subview 2: Compose
  const [dmSearchQuery, setDmSearchQuery] = useState("")
  const [dmSelectedUserId, setDmSelectedUserId] = useState<string | null>(null)
  const [dmNewChatUsers, setDmNewChatUsers] = useState<any[]>([])

  // Subview 3: Chat
  const [dmActiveUserId, setDmActiveUserId] = useState<string | null>(null)
  const [dmActiveUser, setDmActiveUser] = useState<any | null>(null)
  const [dmMessages, setDmMessages] = useState<any[]>([])
  const [dmInput, setDmInput] = useState("")
  const [dmSending, setDmSending] = useState(false)

  // Check screen size
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Fetch current user details
  useEffect(() => {
    const loadUserInfo = async () => {
      const info = getUserInfo() as any
      if (info?.id) setCurrentUserId(info.id)
      if (info?.name) setCurrentUserName(info.name)
      try {
        const currentProfile = await getCurrentUserProfile()
        if (currentProfile?.user?.name) {
          setCurrentUserName(currentProfile.user.name)
          setCurrentUserId(currentProfile.user.id)
        }
      } catch (err) {
        console.error("Failed to load user info in DMs:", err)
      }
    }
    loadUserInfo()
  }, [])

  // Fetch / refresh connections (followers + following)
  const refreshConnections = useCallback(async () => {
    if (!currentUserName) return
    try {
      const [followersRes, followingRes] = await Promise.all([
        getUserFollowers(currentUserName),
        getUserFollowing(currentUserName)
      ])
      let combined: any[] = []
      if (followersRes.success) combined = [...combined, ...followersRes.users]
      if (followingRes.success) combined = [...combined, ...followingRes.users]
      
      const uniqueMap = new Map<string, any>()
      combined.forEach(u => {
        uniqueMap.set(u.id, u)
      })
      setDmNewChatUsers(Array.from(uniqueMap.values()))
    } catch (err) {
      console.error("Failed to fetch connections:", err)
    }
  }, [currentUserName])

  // Fetch / refresh conversations
  const refreshConversations = useCallback(async () => {
    try {
      const res = await getDMConversations()
      if (res.success) {
        setDmConvs(res.conversations)
        const totalUnread = res.conversations.reduce((sum: number, c: any) => sum + (c.unread_count || 0), 0)
        onUnreadCountChange?.(totalUnread)
        onConversationsUpdate?.(res.conversations)
      }
    } catch (err) {
      console.error("Failed to load conversations:", err)
    }
  }, [onUnreadCountChange, onConversationsUpdate])

  // Load initial data when modal opens
  useEffect(() => {
    if (isOpen) {
      refreshConversations()
      refreshConnections()
    }
  }, [isOpen, refreshConversations, refreshConnections])

  // Handle active user override
  useEffect(() => {
    if (activeUserOverride && isOpen) {
      setDmActiveUserId(activeUserOverride.id)
      setDmActiveUser(activeUserOverride)
      setDmView("chat")
      setDmMessages([])
      setDmInput("")
      
      getDMMessages(activeUserOverride.id)
        .then(res => {
          if (res.success) setDmMessages(res.messages)
          markDMRead(activeUserOverride.id).catch(() => {})
        })
        .catch(() => setDmMessages([]))
    }
  }, [activeUserOverride, isOpen])

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (dmView === "chat") {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [dmMessages, dmView])

  // WebSocket for real-time messaging
  useEffect(() => {
    if (!isOpen || !currentUserId) return
    const socketUrl = (process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:5000").replace(/\/api\/v1\/?$/, "")
    const apiKey = getApiKey()
    const socket = io(socketUrl, {
      query: { auth_token: apiKey || "" },
      transports: ["websocket", "polling"],
    })

    socket.on("connect", () => {
      console.log("[DM Socket] connected")
    })

    socket.on("new_dm", (msg: any) => {
      if (msg.sender_id === dmActiveUserId || msg.receiver_id === dmActiveUserId) {
        setDmMessages((prev) => {
          if (prev.some(m => m.id === msg.id)) return prev
          return [...prev, msg]
        })
        if (dmActiveUserId) markDMRead(dmActiveUserId).catch(() => {})
      }
      refreshConversations()
    })

    socket.on("dm_sent", (msg: any) => {
      setDmMessages((prev) => {
        const last = prev[prev.length - 1]
        if (last && !last.id && last.content === msg.content) {
          return [...prev.slice(0, -1), msg]
        }
        if (prev.some(m => m.id === msg.id)) return prev
        return [...prev, msg]
      })
      refreshConversations()
    })

    return () => {
      socket.disconnect()
    }
  }, [isOpen, currentUserId, dmActiveUserId, refreshConversations])

  if (!isOpen) return null

  // Check relationship constraints
  const canChat = dmNewChatUsers.some(u => u.id === dmActiveUserId)

  return (
    <AnimatePresence>
      <div className="fixed bottom-0 right-0 sm:bottom-4 sm:right-4 z-[9999] w-full sm:w-[380px] h-full sm:h-[520px] select-none p-0 sm:p-0 flex items-end justify-center pointer-events-none">
        <motion.div
          initial={{ y: 100, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 100, opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          style={{
            width: isDmMaximized ? (isMobile ? "100%" : "600px") : (isMobile ? "100%" : "380px"),
            height: isDmMaximized ? (isMobile ? "100%" : "650px") : (isMobile ? "100%" : "520px")
          }}
          className={`w-full h-full sm:rounded-2xl overflow-hidden shadow-2xl border flex flex-col pointer-events-auto transition-all duration-300 ${isDarkMode
            ? "bg-zinc-900 border-zinc-800 text-white"
            : "bg-white border-zinc-200 text-zinc-900"
            }`}
        >
          {/* SUBVIEW 1: Conversations List */}
          {dmView === "list" && (
            <>
              {/* Header */}
              <div className="flex justify-between items-center px-4 py-3 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
                <h3 className="text-sm font-bold">Messages</h3>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setIsDmMaximized(!isDmMaximized)}
                    className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1"
                    title={isDmMaximized ? "Minimize" : "Maximize"}
                  >
                    {isDmMaximized ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={onClose}
                    className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Conversations list body */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0 relative">
                {dmConvs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full py-12 text-center text-xs text-zinc-400">
                    <MessageSquare className="h-10 w-10 text-zinc-300 dark:text-zinc-700 mb-2" />
                    No messages yet.<br />Start a conversation!
                  </div>
                ) : (
                  dmConvs.map((conv) => (
                    <button
                      key={conv.user_id}
                      onClick={async () => {
                        setDmActiveUserId(conv.user_id)
                        setDmActiveUser({
                          id: conv.user_id,
                          name: conv.user_name || conv.username,
                          profile_picture: conv.profile_picture
                        })
                        setDmView("chat")
                        setDmMessages([])
                        try {
                          const res = await getDMMessages(conv.user_id)
                          if (res.success) setDmMessages(res.messages)
                          await markDMRead(conv.user_id)
                        } catch {
                          setDmMessages([])
                        }
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors text-xs ${isDarkMode ? "hover:bg-white/5" : "hover:bg-black/5"
                        }`}
                    >
                      <div className="h-11 w-11 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden flex items-center justify-center shrink-0 border border-zinc-100 dark:border-zinc-800">
                        {conv.profile_picture ? (
                          <img src={getStoryImageUrl(conv.profile_picture)} className="h-full w-full object-cover" alt="" />
                        ) : (
                          <UserIcon className="h-5 w-5 text-zinc-400 dark:text-zinc-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-xs flex justify-between items-center">
                          <span className="truncate">{conv.user_name || conv.username}</span>
                          <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-normal ml-2 shrink-0">
                            {formatDMDate(conv.last_message_at)}
                          </span>
                        </div>
                        <div className={`text-[11px] truncate mt-0.5 font-medium flex items-center gap-1.5 justify-between ${conv.unread_count > 0
                          ? (isDarkMode ? "text-white" : "text-black")
                          : "text-zinc-400 dark:text-zinc-500"
                          }`}>
                          <span className="truncate">{conv.last_message}</span>
                          {conv.unread_count > 0 && (
                            <span className="bg-sky-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none shrink-0">
                              {conv.unread_count}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  ))
                )}

                {/* Floating Compose Button */}
                <button
                  onClick={() => {
                    setDmView("new")
                    setDmSearchQuery("")
                    setDmSelectedUserId(null)
                  }}
                  className="absolute bottom-4 right-4 w-12 h-12 rounded-full bg-zinc-800 dark:bg-zinc-100 text-white dark:text-zinc-900 flex items-center justify-center transition-all shadow-lg hover:scale-105"
                  title="New message"
                >
                  <SquarePen className="h-5 w-5" />
                </button>
              </div>
            </>
          )}

          {/* SUBVIEW 2: User Picker / New Message */}
          {dmView === "new" && (
            <>
              {/* Header */}
              <div className="flex justify-between items-center px-4 py-3 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setDmView("list")}
                    className="text-zinc-400 hover:text-zinc-655 dark:hover:text-zinc-200 p-1"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <h3 className="text-sm font-bold">New message</h3>
                </div>
                <button
                  onClick={onClose}
                  className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* To: Search Area */}
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
                <span className="text-xs font-bold text-zinc-400 dark:text-zinc-500 shrink-0">To:</span>
                <input
                  type="text"
                  value={dmSearchQuery}
                  onChange={(e) => setDmSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className="flex-1 text-xs bg-transparent border-none focus:outline-none focus:ring-0 text-zinc-900 dark:text-white p-0 placeholder-zinc-400 dark:placeholder-zinc-655"
                />
              </div>

              {/* Connections List */}
              <div className="flex-1 overflow-y-auto p-3 space-y-1 min-h-0">
                {(() => {
                  const filteredUsers = dmNewChatUsers.filter(u =>
                    u.name.toLowerCase().includes(dmSearchQuery.toLowerCase())
                  )
                  if (filteredUsers.length === 0) {
                    return <div className="text-center text-xs text-zinc-400 py-8">No connections found</div>
                  }
                  return filteredUsers.map((user) => {
                    const isSelected = dmSelectedUserId === user.id
                    return (
                      <div
                        key={user.id}
                        onClick={() => setDmSelectedUserId(isSelected ? null : user.id)}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-colors ${isDarkMode ? "hover:bg-white/5" : "hover:bg-black/5"
                          }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden flex items-center justify-center shrink-0 border border-zinc-100 dark:border-zinc-800">
                            {user.profile_picture ? (
                              <img src={getStoryImageUrl(user.profile_picture)} className="h-full w-full object-cover" alt="" />
                            ) : (
                              <UserIcon className="h-5 w-5 text-zinc-400 dark:text-zinc-500" />
                            )}
                          </div>
                          <div className="text-left">
                            <p className="text-xs font-bold">{user.name}</p>
                            <p className="text-[10px] text-zinc-400 dark:text-zinc-500">@{user.name.toLowerCase().replace(/\s+/g, '_')}</p>
                          </div>
                        </div>

                        {/* Check Circle */}
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${isSelected
                          ? "bg-sky-500 border-sky-500"
                          : isDarkMode ? "border-zinc-700" : "border-zinc-300"
                          }`}>
                          {isSelected && <Check className="h-3 w-3 text-white" />}
                        </div>
                      </div>
                    )
                  })
                })()}
              </div>

              {/* Chat Action Footer */}
              <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 shrink-0">
                <button
                  onClick={async () => {
                    if (!dmSelectedUserId) return
                    const selectedUser = dmNewChatUsers.find(u => u.id === dmSelectedUserId)
                    if (!selectedUser) return
                    setDmActiveUserId(selectedUser.id)
                    setDmActiveUser(selectedUser)
                    setDmView("chat")
                    setDmMessages([])
                    try {
                      const res = await getDMMessages(selectedUser.id)
                      if (res.success) setDmMessages(res.messages)
                      await markDMRead(selectedUser.id)
                    } catch { }
                  }}
                  disabled={!dmSelectedUserId}
                  className="w-full py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 disabled:opacity-40 disabled:hover:bg-sky-500 text-white text-xs font-bold transition-colors shadow-lg"
                >
                  Chat
                </button>
              </div>
            </>
          )}

          {/* SUBVIEW 3: Individual Chat View */}
          {dmView === "chat" && dmActiveUser && (
            <>
              {/* Header */}
              <div className="flex justify-between items-center px-4 py-3 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                  <button
                    onClick={() => setDmView("list")}
                    className="text-zinc-400 hover:text-zinc-655 dark:hover:text-zinc-200 p-1"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <div className="h-8 w-8 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden shrink-0 border border-zinc-100 dark:border-zinc-800">
                    {dmActiveUser.profile_picture ? (
                      <img src={getStoryImageUrl(dmActiveUser.profile_picture)} className="h-full w-full object-cover" alt="" />
                    ) : (
                      <UserIcon className="h-4 w-4 m-auto text-zinc-400 dark:text-zinc-500 mt-2" />
                    )}
                  </div>
                  <div className="truncate text-left">
                    <h3 className="text-xs font-bold truncate">{dmActiveUser.name}</h3>
                    <p className="text-[9px] text-zinc-400 dark:text-zinc-500">Active now</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => setIsDmMaximized(!isDmMaximized)}
                    className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1"
                    title={isDmMaximized ? "Minimize" : "Maximize"}
                  >
                    {isDmMaximized ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={onClose}
                    className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Chat History */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0 flex flex-col">
                {/* Header Card */}
                <div className="flex flex-col items-center justify-center py-6 text-center shrink-0 border-b border-zinc-100 dark:border-zinc-800 mb-2">
                  <div className="h-20 w-20 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden flex items-center justify-center border border-zinc-250 dark:border-zinc-700 shadow-md">
                    {dmActiveUser.profile_picture ? (
                      <img src={getStoryImageUrl(dmActiveUser.profile_picture)} className="h-full w-full object-cover" alt="" />
                    ) : (
                      <UserIcon className="h-10 w-10 text-zinc-400 dark:text-zinc-500" />
                    )}
                  </div>
                  <h4 className="text-sm font-bold mt-2">{dmActiveUser.name}</h4>
                  <p className="text-[10px] text-zinc-400 dark:text-zinc-500">@{dmActiveUser.name.toLowerCase().replace(/\s+/g, '_')}</p>
                  <button
                    onClick={() => {
                      router.push(`/profile/${encodeURIComponent(dmActiveUser.id)}`)
                      onClose()
                    }}
                    className={`mt-3 px-4 py-1.5 text-xs font-bold rounded-lg transition-colors border ${isDarkMode
                      ? "bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-white"
                      : "bg-zinc-100 hover:bg-zinc-200 border-zinc-200 text-zinc-800"
                      }`}
                  >
                    View profile
                  </button>
                </div>

                {/* Messages bubbles */}
                <div className="space-y-3 mt-auto">
                  {dmMessages.length === 0 ? (
                    <div className="text-center text-[10px] text-zinc-400 py-4">No messages yet. Send a wave! 👋</div>
                  ) : (
                    dmMessages.map((msg, idx) => {
                      const isMine = msg.sender_id === currentUserId
                      return (
                        <div key={msg.id || idx} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-xs leading-relaxed ${isMine
                            ? "bg-sky-500 text-white rounded-br-md"
                            : isDarkMode
                              ? "bg-zinc-800 text-zinc-200 rounded-bl-md"
                              : "bg-zinc-100 text-zinc-800 rounded-bl-md"
                            }`}>
                            {msg.content}
                            <div className={`text-[8px] mt-0.5 text-right ${isMine ? "text-white/60" : "text-zinc-450 dark:text-zinc-500"}`}>
                              {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </div>
                          </div>
                        </div>
                      )
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Input area with follower restriction */}
              <div className="p-3 border-t border-zinc-100 dark:border-zinc-800 shrink-0">
                {!canChat ? (
                  <div className="text-center text-[10px] text-zinc-400 dark:text-zinc-500 py-2">
                    You can only message your followers or following.
                  </div>
                ) : (
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault()
                      if (!dmInput.trim() || dmSending || !dmActiveUserId) return
                      const content = dmInput.trim()
                      setDmInput("")
                      setDmSending(true)
                      try {
                        await sendDM(dmActiveUserId, content)
                        setDmMessages((prev) => [
                          ...prev,
                          {
                            sender_id: currentUserId,
                            content: content,
                            created_at: new Date().toISOString(),
                          },
                        ])
                      } catch (err: any) {
                        alert(err.message || "Failed to send message")
                      } finally {
                        setDmSending(false)
                      }
                    }}
                    className="flex items-center gap-2"
                  >
                    <div className="text-zinc-400 dark:text-zinc-500 p-1 hover:text-zinc-655 dark:hover:text-zinc-200 cursor-pointer">
                      <Smile className="h-5 w-5" />
                    </div>
                    <input
                      type="text"
                      value={dmInput}
                      onChange={(e) => setDmInput(e.target.value)}
                      placeholder="Message..."
                      className={`flex-1 px-3 py-2 text-xs rounded-full focus:outline-none focus:ring-1 focus:ring-sky-500 ${isDarkMode
                        ? "bg-zinc-950 border-zinc-800 text-white placeholder-zinc-500"
                        : "bg-zinc-50 border-zinc-200 text-zinc-900 placeholder-zinc-400"
                        }`}
                    />
                    {dmInput.trim() && (
                      <button
                        type="submit"
                        disabled={dmSending}
                        className="text-xs font-bold text-sky-500 hover:text-sky-600 px-2 py-1 shrink-0"
                      >
                        Send
                      </button>
                    )}
                  </form>
                )}
              </div>
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
