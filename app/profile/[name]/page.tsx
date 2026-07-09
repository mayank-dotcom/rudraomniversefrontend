"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import {
  ArrowLeft,
  Image as ImageIcon,
  Heart,
  Loader2,
  Search,
  MoreVertical,
  Plus,
  Grid,
  Tv,
  Bookmark,
  User as UserIcon,
  MessageSquare,
  Check,
  X,
  Camera,
  Globe,
  PanelLeftOpen,
  PanelLeftClose,
  Compass,
  Clock,
  Wallet,
  LogOut,
  FolderPlus,
  Folder,
  FolderOpen,
  Settings,
  Bell,
  Sun,
  Moon,
  ChevronLeft,
  Maximize2,
  Minimize2,
  SquarePen,
  Smile
} from "lucide-react"
import { useTheme, ThemeProvider } from "@/lib/theme-context"
import {
  getUserProfile,
  getCurrentUserProfile,
  getPublicLibraryAssets,
  toggleFollowUser,
  updateUserProfile,
  uploadProfilePicture,
  getLibraryGalleries,
  createLibraryGallery,
  sendDM,
  getDMMessages,
  markDMRead,
  updateDMPrivacy,
  getNotifications,
  markNotificationAsRead,
  getDMConversations,
  getUserFollowers,
  getUserFollowing,
  type FollowUserItem,
  type SocialNotification,
  type UserProfileResponse,
  type LibraryAsset,
  getAssetImageUrl
} from "@/lib/chat-api"
import { removeApiKey, getUserInfo, getUserRole, getApiKey } from "@/lib/auth"
import { io } from "socket.io-client"
import SettingsModal from "@/components/ui/SettingsModal"
import AssetDetailModal from "@/components/AssetDetailModal"

const getStoryImageUrl = (url: string) => {
  if (!url) return ""
  if (url.startsWith("data:") || url.startsWith("blob:")) {
    return url
  }

  let cleanUrl = url
  
  // Extract relative uploads path to avoid hardcoded domain mismatches from localStorage
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

const getStoryImgs = (story: any): string[] => {
  if (!story) return []
  if (Array.isArray(story.imgs) && story.imgs.length > 0) {
    return story.imgs
  }
  if (story.img) {
    return [story.img]
  }
  return []
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

function ProfileContent() {
  const params = useParams()
  const router = useRouter()
  const { isDarkMode, toggleTheme } = useTheme()
  const name = params.name as string
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [profile, setProfile] = useState<UserProfileResponse["user"] | null>(null)
  const [postsCount, setPostsCount] = useState(0)
  const [followersCount, setFollowersCount] = useState(0)
  const [followingCount, setFollowingCount] = useState(0)
  const [isFollowing, setIsFollowing] = useState(false)
  const [isCurrentUser, setIsCurrentUser] = useState(false)
  const [userAssets, setUserAssets] = useState<LibraryAsset[]>([])
  const [loading, setLoading] = useState(true)
  const [assetsLoading, setAssetsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedAsset, setSelectedAsset] = useState<LibraryAsset | null>(null)

  // Sidebar States
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [showProfileDropup, setShowProfileDropup] = useState(false)

  // Settings Modal
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false)
  const [settingsPanel, setSettingsPanel] = useState<"general" | "persona" | "faq" | "bug" | "deactivate">("general")

  // Current logged-in user's own profile (always the viewer, not the viewed user)
  const [currentUserPic, setCurrentUserPic] = useState<string | null>(null)
  const [currentUserName, setCurrentUserName] = useState<string>("")
  const [currentUserId, setCurrentUserId] = useState<string>("")
  const [currentUserProfession, setCurrentUserProfession] = useState<string>("")
  const [currentUserPosts, setCurrentUserPosts] = useState<number>(0)
  const [currentUserFollowers, setCurrentUserFollowers] = useState<number>(0)
  const [currentUserFollowing, setCurrentUserFollowing] = useState<number>(0)
  const [currentUserPlan, setCurrentUserPlan] = useState<string>("")

  // Direct Avatar Upload
  const directAvatarInputRef = useRef<HTMLInputElement>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  // Stories States
  const [stories, setStories] = useState<{ name: string; img?: string; imgs?: string[] }[]>([])
  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null)
  const [activeSlideIndex, setActiveSlideIndex] = useState<number>(0)
  const [storyProgress, setStoryProgress] = useState(0)
  const [isNewStoryOpen, setIsNewStoryOpen] = useState(false)
  const [newStoryName, setNewStoryName] = useState("")
  const [storySelectedAssets, setStorySelectedAssets] = useState<LibraryAsset[]>([])
  const [uploadingStory, setUploadingStory] = useState(false)
  const [seenStories, setSeenStories] = useState<Set<number>>(new Set())

  // DM States
  const [isDmOpen, setIsDmOpen] = useState(false)
  const [dmMessages, setDmMessages] = useState<{ id?: string; sender_id: string; content: string; created_at: string }[]>([])
  const [dmInput, setDmInput] = useState("")
  const [dmSending, setDmSending] = useState(false)
  const [dmPrivacy, setDmPrivacy] = useState<"everyone" | "nobody">("everyone")
  const [dmConvOpen, setDmConvOpen] = useState(false)
  const [dmConvs, setDmConvs] = useState<any[]>([])
  const dmConvRef = useRef<HTMLDivElement>(null)
  const [dmConvPos, setDmConvPos] = useState({ top: 0, right: 0 })

  // New DM Popup States
  const [dmView, setDmView] = useState<"list" | "new" | "chat">("list")
  const [dmActiveUserId, setDmActiveUserId] = useState<string | null>(null)
  const [dmActiveUser, setDmActiveUser] = useState<any | null>(null)
  const [dmSearchQuery, setDmSearchQuery] = useState("")
  const [dmSelectedUserId, setDmSelectedUserId] = useState<string | null>(null)
  const [dmNewChatUsers, setDmNewChatUsers] = useState<any[]>([])
  const [isDmMaximized, setIsDmMaximized] = useState(false)

  // Recommendations State
  const [recommendations, setRecommendations] = useState<FollowUserItem[]>([])

  useEffect(() => {
    if (dmConvOpen && dmConvRef.current) {
      const rect = dmConvRef.current.getBoundingClientRect()
      setDmConvPos({ top: rect.bottom + 8, right: window.innerWidth - rect.right })
    }
  }, [dmConvOpen])

  useEffect(() => {
    if (!isDmOpen) return

    // Fetch conversations list
    getDMConversations()
      .then(res => {
        if (res.success) setDmConvs(res.conversations)
      })
      .catch(err => console.error("Failed to load conversations:", err))

    // Fetch followers/following of current logged-in user for "New message" screen
    if (currentUserName) {
      Promise.allSettled([
        getUserFollowers(currentUserName),
        getUserFollowing(currentUserName)
      ]).then(([followersRes, followingRes]) => {
        let combined: any[] = []
        if (followersRes.status === "fulfilled" && followersRes.value.success) {
          combined = [...combined, ...followersRes.value.users]
        }
        if (followingRes.status === "fulfilled" && followingRes.value.success) {
          combined = [...combined, ...followingRes.value.users]
        }
        // Deduplicate by user ID
        const uniqueMap = new Map<string, any>()
        combined.forEach(u => {
          uniqueMap.set(u.id, u)
        })
        setDmNewChatUsers(Array.from(uniqueMap.values()))
      }).catch(err => console.error("Failed to fetch followers/following for new chat:", err))
    }
  }, [isDmOpen, currentUserName])

  // Notification state
  const [notifications, setNotifications] = useState<SocialNotification[]>([])
  const [showNotifPanel, setShowNotifPanel] = useState(false)
  const notifPanelRef = useRef<HTMLDivElement>(null)
  const [notifDropdownPos, setNotifDropdownPos] = useState({ top: 0, right: 0 })

  useEffect(() => {
    if (showNotifPanel && notifPanelRef.current) {
      const rect = notifPanelRef.current.getBoundingClientRect()
      setNotifDropdownPos({ top: rect.bottom + 8, right: window.innerWidth - rect.right })
    }
  }, [showNotifPanel])

  useEffect(() => {
    if (!isCurrentUser) return
    const fetchNotifs = () => {
      getNotifications()
        .then((res) => {
          if (res.success && res.notifications) {
            setNotifications(res.notifications)
          }
        })
        .catch(() => { })
    }
    fetchNotifs()
    const interval = setInterval(async () => {
      fetchNotifs()
      try {
        const res = await getDMConversations()
        if (res.success) setDmConvs(res.conversations)
      } catch { }
    }, 15000)
    return () => clearInterval(interval)
  }, [isCurrentUser])

  const markStorySeen = (index: number) => {
    setSeenStories((prev) => {
      const next = new Set(prev)
      next.add(index)
      if (typeof window !== "undefined" && profile?.id) {
        localStorage.setItem(`rudra_stories_seen_${profile.id}`, JSON.stringify([...next]))
      }
      return next
    })
  }

  const hasUnseenStories = stories.length > 0 && seenStories.size < stories.length

  // Edit Profile States
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false)
  const [editName, setEditName] = useState("")
  const [editProfession, setEditProfession] = useState("")
  const [editBio, setEditBio] = useState("")
  const [editWebsite, setEditWebsite] = useState("")
  const [editAvatarUrl, setEditAvatarUrl] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [savingProfile, setSavingProfile] = useState(false)

  const handleDiscontinueAccount = async () => {
    const confirmDelete = window.confirm(
      "Are you sure you want to permanently delete your account and all data? This action cannot be undone."
    )
    if (!confirmDelete) return
    try {
      const { discontinueAccount } = await import("@/lib/chat-api")
      await discontinueAccount()
      removeApiKey()
      window.location.href = "/"
    } catch (err: any) {
      alert(err.message || "Failed to delete account")
    }
  }

  const handleDirectAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && profile) {
      setUploadingAvatar(true)
      try {
        const uploadRes = await uploadProfilePicture(file)
        if (uploadRes.url) {
          setProfile({
            ...profile,
            profile_picture: uploadRes.url
          })
          setEditAvatarUrl(uploadRes.url)
        }
      } catch (err: any) {
        alert(err.message || "Failed to upload avatar")
      } finally {
        setUploadingAvatar(false)
      }
    }
  }

  const handleAddStory = async () => {
    if (!newStoryName.trim()) {
      alert("Please enter a story name")
      return
    }
    if (storySelectedAssets.length === 0) {
      alert("Please select at least one asset from your library")
      return
    }

    setUploadingStory(true)
    try {
      const newStory = {
        name: newStoryName.trim(),
        imgs: storySelectedAssets.map((asset) => getAssetImageUrl(asset))
      }
      const updated = [...stories, newStory]
      setStories(updated)
      if (typeof window !== "undefined" && profile?.id) {
        localStorage.setItem(`rudra_stories_${profile.id}`, JSON.stringify(updated))
      }
      setIsNewStoryOpen(false)
      setNewStoryName("")
      setStorySelectedAssets([])
    } catch (err: any) {
      alert(err.message || "Failed to upload story image")
    } finally {
      setUploadingStory(false)
    }
  }

  // Custom Database Galleries list
  const [galleries, setGalleries] = useState<any[]>([])

  const handleCreateFolder = async () => {
    const folderName = prompt("Enter folder name:")
    if (!folderName?.trim()) return
    try {
      const res = await createLibraryGallery(folderName.trim())
      if (res.success) {
        setGalleries([...galleries, res.gallery])
      }
    } catch (err: any) {
      alert(err.message || "Failed to create folder")
    }
  }

  useEffect(() => {
    getLibraryGalleries()
      .then((data) => {
        if (data.success && data.galleries) {
          setGalleries(data.galleries)
        }
      })
      .catch(() => { })
  }, [])

  // WebSocket for real-time DMs
  useEffect(() => {
    if (!currentUserId) return
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
      if (msg.sender_id === profile?.id || msg.receiver_id === profile?.id) {
        setDmMessages((prev) => [...prev, msg])
      }
    })
    socket.on("dm_sent", (msg: any) => {
      setDmMessages((prev) => {
        const last = prev[prev.length - 1]
        if (last && !last.id && last.content === msg.content) {
          return [...prev.slice(0, -1), msg]
        }
        return prev
      })
    })
    return () => {
      socket.disconnect()
    }
  }, [currentUserId, profile?.id])

  // Fetch the currently logged-in user's own profile for sidebar display
  useEffect(() => {
    const loadCurrentUserSidebar = async () => {
      try {
        let userName: string | null = null
        const info = getUserInfo()
        if (info?.name) {
          userName = info.name
          setCurrentUserName(info.name)
        } else {
          // Fallback: fetch from /user/profile endpoint using auth token
          const currentProfile = await getCurrentUserProfile()
          if (currentProfile?.user?.name) {
            userName = currentProfile.user.name
            setCurrentUserName(currentProfile.user.name)
            setCurrentUserId(currentProfile.user.id)
            setCurrentUserPlan(currentProfile.user.plan_name || "")
            if (currentProfile.user.profile_picture) {
              setCurrentUserPic(getStoryImageUrl(currentProfile.user.profile_picture))
            }
            if (currentProfile.user.dm_privacy) {
              setDmPrivacy(currentProfile.user.dm_privacy)
            }
          }
        }
        if (!userName) return
        // Now fetch full profile stats (posts, followers, following)
        const data = await getUserProfile(userName)
        if (data.user) {
          setCurrentUserName(data.user.name || userName)
          setCurrentUserProfession(data.user.profession || "")
          setCurrentUserPosts(data.posts_count || 0)
          setCurrentUserFollowers(data.followers_count || 0)
          setCurrentUserFollowing(data.following_count || 0)
          if (data.user.profile_picture) {
            setCurrentUserPic(getStoryImageUrl(data.user.profile_picture))
          }
        }
      } catch {
        // silent fail
      }
    }
    loadCurrentUserSidebar()
  }, [])

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
      setIsSidebarCollapsed(window.innerWidth < 768)
    }
    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  useEffect(() => {
    if (!name) return
    setLoading(true)
    setError(null)
    getUserProfile(name)
      .then((data) => {
        setProfile(data.user)
        setEditName(data.user.name)
        setEditProfession(data.user.profession || "Photographe Freelance")
        setEditBio(data.user.bio || "")
        setEditWebsite(data.user.website || "")
        setEditAvatarUrl(data.user.profile_picture)

        setPostsCount(data.posts_count)
        setFollowersCount(data.followers_count)
        setFollowingCount(data.following_count)
        setIsFollowing(data.is_following)
        setIsCurrentUser(data.is_current_user)
      })
      .catch((err) => {
        setError(err.message || "Failed to load profile")
      })
      .finally(() => {
        setLoading(false)
      })

    // Fetch followers and following list to build recommendations
    Promise.allSettled([
      getUserFollowers(name),
      getUserFollowing(name)
    ]).then(([followersResult, followingResult]) => {
      let combined: FollowUserItem[] = []
      if (followersResult.status === "fulfilled" && followersResult.value.success) {
        combined = [...combined, ...followersResult.value.users]
      }
      if (followingResult.status === "fulfilled" && followingResult.value.success) {
        combined = [...combined, ...followingResult.value.users]
      }

      // Deduplicate by user id
      const uniqueMap = new Map<string, FollowUserItem>()
      combined.forEach(u => {
        if (u.name.toLowerCase() !== name.toLowerCase()) {
          uniqueMap.set(u.id, u)
        }
      })

      const uniqueUsers = Array.from(uniqueMap.values()).slice(0, 15)
      setRecommendations(uniqueUsers)
    }).catch((err) => {
      console.error("Failed to fetch followers/following for recommendations:", err)
      setRecommendations([])
    })
  }, [name])

  useEffect(() => {
    if (!profile?.id) return
    setAssetsLoading(true)
    getPublicLibraryAssets(undefined, undefined, profile.id)
      .then((data) => {
        if (data.assets) {
          setUserAssets(data.assets.filter((a) => a.owner_id === profile.id))
        }
      })
      .catch(() => { })
      .finally(() => {
        setAssetsLoading(false)
      })
  }, [profile?.id])

  // Load stories specific to the profile being viewed
  useEffect(() => {
    if (!profile?.id) return
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(`rudra_stories_${profile.id}`)
      if (stored) {
        setStories(JSON.parse(stored))
      } else {
        setStories([])
      }
      const seenStored = localStorage.getItem(`rudra_stories_seen_${profile.id}`)
      if (seenStored) {
        setSeenStories(new Set(JSON.parse(seenStored)))
      } else {
        setSeenStories(new Set())
      }
    }
  }, [profile?.id])

  // Auto-advance story timer
  useEffect(() => {
    if (activeStoryIndex === null) {
      setStoryProgress(0)
      return
    }

    setStoryProgress(0)
    const duration = 5000
    const startTime = Date.now()
    let rafId: number

    const tick = () => {
      const elapsed = Date.now() - startTime
      const pct = Math.min((elapsed / duration) * 100, 100)
      setStoryProgress(pct)

      if (pct >= 100) {
        const activeStorySlides = getStoryImgs(stories[activeStoryIndex])
        const slidesCount = activeStorySlides.length
        if (activeSlideIndex < slidesCount - 1) {
          setActiveSlideIndex(activeSlideIndex + 1)
        } else {
          markStorySeen(activeStoryIndex)
          if (activeStoryIndex < stories.length - 1) {
            setActiveStoryIndex(activeStoryIndex + 1)
            setActiveSlideIndex(0)
          } else {
            setActiveStoryIndex(null)
          }
        }
        return
      }

      rafId = requestAnimationFrame(tick)
    }

    rafId = requestAnimationFrame(tick)

    return () => cancelAnimationFrame(rafId)
  }, [activeStoryIndex, activeSlideIndex, stories])

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setAvatarFile(file)
      const previewUrl = URL.createObjectURL(file)
      setEditAvatarUrl(previewUrl)
    }
  }

  const handleSaveProfile = async () => {
    if (!profile) return
    setSavingProfile(true)
    try {
      let finalAvatarUrl = profile.profile_picture
      if (avatarFile) {
        const uploadRes = await uploadProfilePicture(avatarFile)
        finalAvatarUrl = uploadRes.url || null
      }

      await updateUserProfile({
        name: editName,
        bio: editBio,
        profession: editProfession,
        website: editWebsite
      })

      setProfile({
        ...profile,
        name: editName,
        bio: editBio,
        profession: editProfession,
        website: editWebsite,
        profile_picture: finalAvatarUrl
      })

      setIsEditProfileOpen(false)
      setAvatarFile(null)
    } catch (err: any) {
      alert(err.message || "Failed to update profile")
    } finally {
      setSavingProfile(false)
    }
  }

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? "bg-[#0d0d0c]" : "bg-[#f4f3f2]"}`}>
        <Loader2 className={`h-8 w-8 animate-spin ${isDarkMode ? "text-white/40" : "text-black/40"}`} />
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center gap-4 ${isDarkMode ? "bg-[#0d0d0c] text-white" : "bg-[#f4f3f2] text-black"}`}>
        <p className="text-lg font-medium">{error || "User not found"}</p>
        <Link href="/library" className="text-sm text-cyan-400 hover:underline">Back to Library</Link>
      </div>
    )
  }

  return (
    <div className={`h-[100dvh] flex overflow-hidden ${isDarkMode ? "bg-[#0d0d0c] text-white" : "bg-[#f4f3f2] text-zinc-900"}`}>
      {/* Mobile Sidebar Overlay */}
      {isMobile && !isSidebarCollapsed && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 transition-opacity duration-300"
          onClick={() => setIsSidebarCollapsed(true)}
        />
      )}

      {/* LEFT SIDEBAR (Exactly replicated style from Library.tsx / Image Mode) */}
      <aside
        id="walkthrough-sidebar"
        style={{ width: isSidebarCollapsed ? (isMobile ? "0px" : "72px") : (isMobile ? "280px" : "260px") }}
        className={`h-full border-r ${isSidebarCollapsed && isMobile ? "border-r-0" : isDarkMode ? "border-white/[0.07]" : "border-black/[0.07]"
          } ${isDarkMode ? "bg-gradient-to-b from-[#0d0d0c] via-[#0d0d0c] to-[#0a0a09]" : "bg-gradient-to-b from-[#f4f3f2] via-[#f4f3f2] to-[#efeeed]"} flex flex-col ${isMobile ? "fixed left-0 top-0 bottom-0 h-[100dvh] z-[60] shadow-2xl" : "relative z-20"
          } transition-[width] duration-300 ease-in-out`}
      >
        {isSidebarCollapsed && !isMobile ? (
          <div className="flex flex-col h-full items-center py-4 justify-between relative select-none">
            {/* Top Group */}
            <div className="flex flex-col items-center gap-5 w-full">
              {/* Toggle Button */}
              <button
                onClick={() => setIsSidebarCollapsed(false)}
                className={`p-2 rounded-xl transition-colors cursor-pointer ${isDarkMode ? "text-white hover:bg-white/5" : "text-black hover:bg-black/5"
                  }`}
                title="Open Sidebar"
              >
                <PanelLeftOpen className="w-[22px] h-[22px]" />
              </button>

              {/* Divider */}
              <div className={`w-8 border-t ${isDarkMode ? "border-white/[0.06]" : "border-black/[0.06]"}`} />

              {/* Explore */}
              <button
                onClick={() => router.push("/library?category=featured")}
                className={`p-2 rounded-xl transition-colors cursor-pointer text-zinc-400 hover:text-zinc-800 dark:hover:text-white`}
                title="Explore"
              >
                <Compass className="w-[22px] h-[22px]" />
              </button>

              {/* Recent Creations */}
              <button
                onClick={() => router.push("/library?category=recent")}
                className={`p-2 rounded-xl transition-colors cursor-pointer text-zinc-400 hover:text-zinc-800 dark:hover:text-white`}
                title="Recent Creations"
              >
                <Clock className="w-[22px] h-[22px]" />
              </button>

              {/* Saved */}
              <button
                onClick={() => router.push("/library?category=saved")}
                className={`p-2 rounded-xl transition-colors cursor-pointer text-zinc-400 hover:text-zinc-800 dark:hover:text-white`}
                title="Saved Items"
              >
                <Bookmark className="w-[22px] h-[22px]" />
              </button>

              {/* My Gallery */}
              <button
                onClick={() => router.push("/library?category=all")}
                className={`p-2 rounded-xl transition-colors cursor-pointer text-zinc-400 hover:text-zinc-800 dark:hover:text-white`}
                title="My Gallery"
              >
                <ImageIcon className="w-[22px] h-[22px]" />
              </button>
            </div>

            {/* Profile Avatar Button */}
            <div className="mb-1 relative">
              <button
                onClick={() => setShowProfileDropup(!showProfileDropup)}
                className={`h-8 w-8 rounded-full overflow-hidden border transition-all cursor-pointer relative shrink-0 flex items-center justify-center ${showProfileDropup
                  ? (isDarkMode ? "border-white/50" : "border-black/50")
                  : (isDarkMode ? "border-white/[0.06] hover:border-white/20" : "border-black/[0.06] hover:border-black/20")
                  }`}
                title="Profile Options"
              >
                {currentUserPic ? (
                  <img src={currentUserPic} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                  <div className={`h-full w-full flex items-center justify-center bg-zinc-200 dark:bg-zinc-800`}>
                    <UserIcon className="h-4 w-4 text-zinc-500" />
                  </div>
                )}
              </button>
              {/* Username below avatar in collapsed state */}
              <span className={`block text-[7px] text-center truncate max-w-[60px] leading-tight mt-1 ${isDarkMode ? "text-white/60" : "text-black/60"}`}>
                {(currentUserName || "").split(" ")[0]}
              </span>

              {showProfileDropup && (
                <div className={`absolute bottom-0 left-[52px] w-56 z-[100] rounded-xl border p-1.5 shadow-2xl backdrop-blur-xl ${isDarkMode
                  ? "bg-[#222120]/95 border-white/[0.06] text-white"
                  : "bg-[#f2f1f0]/95 border-black/[0.06] text-black"
                  }`}>
                  <button
                    onClick={() => {
                      setShowProfileDropup(false);
                      if (currentUserName) router.push(`/profile/${encodeURIComponent(currentUserName)}`);
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs rounded-lg text-left transition-colors ${isDarkMode ? "hover:bg-white/5 text-white" : "hover:bg-black/5 text-black"
                      }`}
                  >
                    <UserIcon className="h-3.5 w-3.5" />
                    <span>Profile</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowProfileDropup(false);
                      router.push("/library?wallet=true");
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs rounded-lg text-left transition-colors ${isDarkMode ? "hover:bg-white/5 text-white" : "hover:bg-black/5 text-black"
                      }`}
                  >
                    <Wallet className="h-3.5 w-3.5" />
                    <span>Wallet</span>
                  </button>
                  <div className={`my-1 h-px ${isDarkMode ? "bg-white/5" : "bg-black/5"}`} />
                  <button
                    onClick={async () => {
                      setShowProfileDropup(false)
                      const newVal = dmPrivacy === "everyone" ? "nobody" : "everyone"
                      try {
                        await updateDMPrivacy(newVal)
                        setDmPrivacy(newVal)
                      } catch {
                        alert("Failed to update DM privacy")
                      }
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs rounded-lg text-left transition-colors ${isDarkMode ? "hover:bg-white/5 text-white" : "hover:bg-black/5 text-black"
                      }`}
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    <span>Allow DMs: {dmPrivacy === "everyone" ? "Everyone" : "Nobody"}</span>
                  </button>

                  <div className={`my-1 h-px ${isDarkMode ? "bg-white/5" : "bg-black/5"}`} />

                  <button
                    onClick={() => {
                      removeApiKey();
                      window.location.href = "/";
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs rounded-lg text-left text-red-500 hover:bg-red-500/10 transition-colors`}
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col h-full overflow-hidden">
            {/* Logo Header */}
            <div className={`h-16 flex-shrink-0 flex items-center justify-between px-5 py-4 border-b ${isDarkMode ? "border-white/[0.06]" : "border-black/[0.06]"}`}>
              <div className="flex items-center gap-2.5 cursor-pointer select-none" onClick={() => router.push("/")}>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isDarkMode ? "bg-white/10" : "bg-black/10"}`}>
                  <img
                    src={isDarkMode ? "/dark.png" : "/light.png"}
                    alt="Logo"
                    className="w-5 h-5 object-contain"
                  />
                </div>
                <img
                  src={isDarkMode ? "/dark_text.png" : "/light_text.png"}
                  alt="Rudra Nexus"
                  className="h-3.5 object-contain"
                />
              </div>
              <button
                onClick={() => setIsSidebarCollapsed(true)}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${isDarkMode ? "text-white hover:bg-white/5" : "text-black hover:bg-black/5"}`}
                title="Collapse Sidebar"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            </div>

            {/* Current User's Own Profile Section inside Sidebar */}
            <div className={`px-4 py-4 flex flex-col items-center border-b ${isDarkMode ? "border-white/[0.06] text-white" : "border-black/[0.06] text-black"}`}>
              {/* Avatar with settings gear positioned absolutely */}
              <div className="relative mb-2">
                <div
                  className={`h-20 w-20 rounded-full p-[2.5px] flex items-center justify-center shadow-md cursor-pointer hover:brightness-95 ${isDarkMode
                    ? "bg-gradient-to-tr from-zinc-500 via-zinc-300 to-white"
                    : "bg-gradient-to-tr from-zinc-800 via-zinc-500 to-zinc-300"
                    }`}
                  onClick={() => {
                    if (currentUserName) router.push(`/profile/${encodeURIComponent(currentUserName)}`)
                  }}
                >
                  <div className={`h-full w-full rounded-full overflow-hidden border-2 ${isDarkMode ? "border-[#0d0d0c] bg-zinc-900" : "border-white bg-zinc-100"} flex items-center justify-center`}>
                    {currentUserPic ? (
                      <img src={currentUserPic} className="h-full w-full object-cover" alt="My Profile" />
                    ) : (
                      <UserIcon className="h-10 w-10 text-zinc-400" />
                    )}
                  </div>
                </div>
                {/* Settings icon pinned to bottom-right of avatar */}
                <div className="relative">
                  <button
                    onClick={(e) => { e.stopPropagation(); setSettingsPanel("general"); setIsSettingsModalOpen(true); }}
                    className={`absolute -bottom-1 -right-1 h-6 w-6 rounded-full border flex items-center justify-center transition-colors ${isDarkMode
                      ? "bg-zinc-800 border-zinc-700 hover:bg-zinc-700 text-zinc-300"
                      : "bg-white border-zinc-200 hover:bg-zinc-100 text-zinc-600"
                      }`}
                    title="Settings"
                  >
                    <Settings className="h-3 w-3" />
                  </button>

                  {showProfileDropup && (
                    <div className={`absolute top-6 right-0 w-48 z-[100] rounded-xl border p-1.5 shadow-2xl backdrop-blur-xl ${isDarkMode
                      ? "bg-[#222120]/95 border-white/[0.06] text-white"
                      : "bg-[#f2f1f0]/95 border-black/[0.06] text-black"
                      }`}>
                      <button
                        onClick={() => { setShowProfileDropup(false); if (currentUserName) router.push(`/profile/${encodeURIComponent(currentUserName)}`); }}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs rounded-lg text-left transition-colors ${isDarkMode ? "hover:bg-white/5 text-white" : "hover:bg-black/5 text-black"
                          }`}
                      >
                        <UserIcon className="h-3.5 w-3.5" />
                        <span>My Profile</span>
                      </button>
                      <button
                        onClick={() => { setShowProfileDropup(false); router.push("/library?wallet=true"); }}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs rounded-lg text-left transition-colors ${isDarkMode ? "hover:bg-white/5 text-white" : "hover:bg-black/5 text-black"
                          }`}
                      >
                        <Wallet className="h-3.5 w-3.5" />
                        <span>Wallet</span>
                      </button>
                      <div className={`my-1 h-px ${isDarkMode ? "bg-white/5" : "bg-black/5"}`} />
                      <button
                        onClick={async () => {
                          setShowProfileDropup(false)
                          const newVal = dmPrivacy === "everyone" ? "nobody" : "everyone"
                          try {
                            await updateDMPrivacy(newVal)
                            setDmPrivacy(newVal)
                          } catch {
                            alert("Failed to update DM privacy")
                          }
                        }}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs rounded-lg text-left transition-colors ${isDarkMode ? "hover:bg-white/5 text-white" : "hover:bg-black/5 text-black"
                          }`}
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                        <span>Allow DMs: {dmPrivacy === "everyone" ? "Everyone" : "Nobody"}</span>
                      </button>
                      <div className={`my-1 h-px ${isDarkMode ? "bg-white/5" : "bg-black/5"}`} />
                      <button
                        onClick={() => { removeApiKey(); window.location.href = "/"; }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs rounded-lg text-left text-red-500 hover:bg-red-500/10 transition-colors"
                      >
                        <LogOut className="h-3.5 w-3.5" />
                        <span>Logout</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Centered Name */}
              <span
                className={`text-xs font-bold text-center tracking-tight flex items-center justify-center gap-1 cursor-pointer hover:underline ${isDarkMode ? "text-white" : "text-black"}`}
                onClick={() => { if (currentUserName) router.push(`/profile/${encodeURIComponent(currentUserName)}`) }}
              >
                {(currentUserName || "User").split(" ")[0]}
                {currentUserPlan.toLowerCase() === "motion" ? (
                  <img src="/run.png" alt="Motion" className="w-4 h-4 object-contain shrink-0 mt-0.5 animate-plan-icon" />
                ) : currentUserPlan.toLowerCase() === "speed" ? (
                  <img src="/ride-a-bike.png" alt="Speed" className="w-4 h-4 object-contain shrink-0 mt-0.5 animate-plan-icon" />
                ) : currentUserPlan.toLowerCase() === "velocity" ? (
                  <img src="/car.png" alt="Velocity" className="w-4 h-4 object-contain shrink-0 mt-0.5 animate-plan-icon" />
                ) : currentUserPlan.toLowerCase() === "acceleration" ? (
                  <img src="/air-force.png" alt="Acceleration" className="w-4 h-4 object-contain shrink-0 mt-0.5 animate-plan-icon" />
                ) : (currentUserPlan.toLowerCase().includes("agency") || currentUserPlan.toLowerCase().includes("heavy duty")) ? (
                  <img src="/startup.png" alt="Agency" className="w-4 h-4 object-contain shrink-0 mt-0.5 animate-plan-icon" />
                ) : (
                  <svg className="w-4 h-4 text-sky-500 fill-current shrink-0 mt-0.5" viewBox="0 0 24 24">
                    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                  </svg>
                )}
              </span>

              {/* Centered Profession */}
              <span className={`text-[10px] text-center font-medium mt-0.5 ${isDarkMode ? "text-zinc-400" : "text-zinc-500"}`}>
                {currentUserProfession || "Photographe Freelance"}
              </span>

              {/* Real Stats row */}
              <div className="flex justify-around w-full mt-3 text-center">
                <div className="flex flex-col">
                  <span className={`text-[11px] font-bold ${isDarkMode ? "text-white" : "text-black"}`}>{currentUserPosts}</span>
                  <span className={`text-[8px] uppercase tracking-wider font-mono ${isDarkMode ? "text-white/40" : "text-black/40"}`}>posts</span>
                </div>
                <div className="flex flex-col">
                  <span className={`text-[11px] font-bold ${isDarkMode ? "text-white" : "text-black"}`}>{currentUserFollowers}</span>
                  <span className={`text-[8px] uppercase tracking-wider font-mono ${isDarkMode ? "text-white/40" : "text-black/40"}`}>followers</span>
                </div>
                <div className="flex flex-col">
                  <span className={`text-[11px] font-bold ${isDarkMode ? "text-white" : "text-black"}`}>{currentUserFollowing}</span>
                  <span className={`text-[8px] uppercase tracking-wider font-mono ${isDarkMode ? "text-white/40" : "text-black/40"}`}>following</span>
                </div>
              </div>
            </div>

            {/* Sidebar Menu Items */}
            <div className={`flex-1 overflow-y-auto scrollbar-hide p-3 flex flex-col gap-5 ${isDarkMode ? "text-white" : "text-black"}`}>
              {/* Explore Section */}
              <div className="space-y-1">
                <button
                  onClick={() => { router.push("/library?category=featured"); if (isMobile) setIsSidebarCollapsed(true); }}
                  className={`group flex items-center justify-between w-full rounded-xl px-3 py-2.5 transition-all text-[14px] relative overflow-hidden ${isDarkMode ? "text-white hover:bg-white/[0.03]" : "text-black hover:bg-black/[0.03]"
                    }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Compass className="h-[18px] w-[18px] flex-shrink-0 transition-all duration-200" />
                    <span className="truncate font-medium">Explore</span>
                  </div>
                </button>

                <button
                  onClick={() => { router.push("/library?category=recent"); if (isMobile) setIsSidebarCollapsed(true); }}
                  className={`group flex items-center justify-between w-full rounded-xl px-3 py-2.5 transition-all text-[14px] relative overflow-hidden ${isDarkMode ? "text-white hover:bg-white/[0.03]" : "text-black hover:bg-black/[0.03]"
                    }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Clock className="h-[18px] w-[18px] flex-shrink-0 transition-all duration-200" />
                    <span className="truncate font-medium">Recent Creations</span>
                  </div>
                </button>

                <button
                  onClick={() => { router.push("/library?category=saved"); if (isMobile) setIsSidebarCollapsed(true); }}
                  className={`group flex items-center justify-between w-full rounded-xl px-3 py-2.5 transition-all text-[14px] relative overflow-hidden ${isDarkMode ? "text-white hover:bg-white/[0.03]" : "text-black hover:bg-black/[0.03]"
                    }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Bookmark className="h-[18px] w-[18px] flex-shrink-0 transition-all duration-200" />
                    <span className="truncate font-medium">Saved</span>
                  </div>
                </button>
              </div>

              {/* Library Section */}
              <div className="space-y-1">
                <div className="flex items-center justify-between px-3 pb-1">
                  <span className={`text-[10px] font-bold font-mono uppercase tracking-[0.22em] ${isDarkMode ? "text-white/40" : "text-black/40"}`}>
                    Personal Workspace
                  </span>
                  <button onClick={handleCreateFolder} className={`transition-all duration-200 p-0.5 ${isDarkMode ? "text-white hover:bg-white/5" : "text-black hover:bg-black/5"} rounded-lg`} title="Create Folder">
                    <FolderPlus className="h-[18px] w-[18px]" />
                  </button>
                </div>

                <button
                  onClick={() => { router.push("/library?category=all"); if (isMobile) setIsSidebarCollapsed(true); }}
                  className={`group flex items-center justify-between w-full rounded-xl px-3 py-2.5 transition-all text-[14px] relative overflow-hidden ${isDarkMode ? "text-white hover:bg-white/[0.03]" : "text-black hover:bg-black/[0.03]"
                    }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <ImageIcon className="h-[18px] w-[18px] flex-shrink-0 transition-all duration-200" />
                    <span className="truncate font-medium">My Gallery</span>
                  </div>
                </button>
              </div>

              {/* Custom Database Galleries list */}
              <div className="space-y-1">
                <div className={`text-[10px] font-bold font-mono uppercase tracking-[0.22em] px-3 pb-1 ${isDarkMode ? "text-white/40" : "text-black/40"}`}>
                  Custom Folders
                </div>
                {galleries.length === 0 ? (
                  <span className={`text-[11px] italic px-3 py-1.5 block ${isDarkMode ? "text-white/40" : "text-black/40"}`}>
                    No folders created yet.
                  </span>
                ) : (
                  galleries.map((g) => (
                    <button
                      key={g.id}
                      onClick={() => {
                        router.push(`/library?category=gallery&gallery_id=${g.id}`);
                        if (isMobile) setIsSidebarCollapsed(true);
                      }}
                      className={`group flex items-center justify-between w-full rounded-xl px-3 py-2.5 transition-all text-[14px] relative overflow-hidden ${isDarkMode ? "text-white hover:bg-white/[0.03]" : "text-black hover:bg-black/[0.03]"
                        }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 truncate">
                        <Folder className="h-[18px] w-[18px] flex-shrink-0 transition-all duration-200" />
                        <span className="truncate font-medium">{g.name}</span>
                      </div>

                      <div className="flex items-center gap-1 flex-shrink-0">
                        <span className={`text-[11px] font-mono font-bold min-w-[22px] h-[20px] flex items-center justify-center rounded-full px-1.5 ${isDarkMode ? "bg-white/5 text-white" : "bg-black/5 text-black"
                          }`}>{g.asset_count || 0}</span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Logout */}
            <div className="px-3 py-2 mt-auto">
              <button
                onClick={() => { removeApiKey(); router.push("/"); }}
                className={`flex items-center justify-center gap-2 w-full rounded-xl border px-4 py-2.5 text-xs font-semibold tracking-wide transition-all ${isDarkMode
                  ? "border-zinc-700 text-red-400 hover:bg-red-500/10"
                  : "border-zinc-300 text-red-600 hover:bg-red-500/5"
                  }`}
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </div>

          </div>
        )}
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 h-full min-w-0 overflow-y-auto scrollbar-hide">
        <div className="max-w-6xl mx-auto px-4 py-6">
          {/* Back button, Mobile Toggle, Notifications & Theme */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => router.back()}
              className={`flex items-center gap-2 text-sm transition-colors ${isDarkMode ? "text-white/60 hover:text-white" : "text-zinc-600 hover:text-zinc-900"}`}
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>

            <div className="flex items-center gap-2">
              {/* Notification Bell */}
              <div className="relative" ref={notifPanelRef}>
                <motion.button
                  onClick={() => setShowNotifPanel(p => !p)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className={`p-2 border rounded-full transition-all duration-200 flex items-center justify-center cursor-pointer relative ${isDarkMode
                    ? "border-white/10 bg-white/5 text-white hover:bg-white/10 hover:border-white/20"
                    : "border-black/10 bg-black/5 text-black hover:bg-black/10 hover:border-black/20"
                    }`}
                  title="Notifications"
                >
                  <Bell className="h-4 w-4" />
                  {notifications.some(n => !n.is_read) && (
                    <span className={`absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-white dark:ring-[#0d0d0c] bg-red-500`} />
                  )}
                </motion.button>

                {showNotifPanel && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    style={{ position: 'fixed', top: notifDropdownPos.top, right: notifDropdownPos.right }}
                    className={`w-72 rounded-xl border shadow-2xl overflow-hidden z-[9999] ${isDarkMode
                      ? "bg-[#222120]/95 border-white/10 text-white"
                      : "bg-[#f2f1f0]/95 border-black/10 text-black"
                      }`}
                  >
                    <div className="p-3 space-y-2">
                      <div className={`text-[10px] font-mono uppercase tracking-widest ${isDarkMode ? "text-white/40" : "text-black/40"}`}>
                        Notifications
                      </div>
                      <div className={`h-px ${isDarkMode ? "bg-white/5" : "bg-black/5"}`} />

                      {notifications.length > 0 ? (
                        <div className="max-h-60 overflow-y-auto space-y-1.5 custom-scrollbar pr-1">
                          {[...notifications]
                            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                            .map((notif) => (
                              <button
                                key={notif.id}
                                onClick={async () => {
                                  setShowNotifPanel(false)
                                  if (!notif.is_read) {
                                    try {
                                      await markNotificationAsRead(notif.id)
                                      setNotifications(prev =>
                                        prev.map(n => (n.id === notif.id ? { ...n, is_read: true } : n))
                                      )
                                    } catch { }
                                  }
                                  if (notif.type === "message") {
                                    if (notif.sender_id || notif.sender_name) {
                                      router.push(`/profile/${encodeURIComponent(notif.sender_name || notif.sender_id!)}`)
                                    }
                                  } else {
                                    router.push("/library")
                                  }
                                }}
                                className={`w-full flex items-start gap-2.5 px-2.5 py-2 rounded-lg text-left transition-colors text-xs relative ${notif.is_read
                                  ? (isDarkMode ? "hover:bg-white/5" : "hover:bg-black/5")
                                  : (isDarkMode ? "bg-white/[0.03] hover:bg-white/5 font-medium" : "bg-black/[0.03] hover:bg-black/5 font-medium")
                                  }`}
                              >
                                <div className="h-7 w-7 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden flex items-center justify-center shrink-0 font-bold text-[10px]">
                                  {notif.sender_avatar ? (
                                    <img src={getStoryImageUrl(notif.sender_avatar)} className="h-full w-full object-cover" alt="" />
                                  ) : (
                                    <MessageSquare className="h-3.5 w-3.5 text-zinc-500 dark:text-zinc-400" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0 pr-2">
                                  <p className="leading-tight text-zinc-900 dark:text-zinc-100">
                                    <span className="font-bold mr-1">{notif.sender_name || "Someone"}</span>
                                    {notif.type === 'like' ? 'liked your image.' : notif.type === 'reply' ? 'replied to your comment.' : notif.type === 'message' ? 'sent you a message.' : (notif.type === 'creation' || notif.type === 'created') ? 'created a new image.' : 'commented on your image.'}
                                  </p>
                                  {notif.type !== 'like' && notif.content && (
                                    <p className={`text-[10px] truncate mt-1 ${isDarkMode ? "text-white/50" : "text-black/50"}`}>
                                      "{notif.content}"
                                    </p>
                                  )}
                                  <span className={`text-[9px] block mt-0.5 ${isDarkMode ? "text-white/30" : "text-black/30"}`}>
                                    {new Date(notif.created_at).toLocaleDateString()}
                                  </span>
                                </div>
                                {!notif.is_read && (
                                  <span className="absolute right-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#00DDDD]" />
                                )}
                              </button>
                            ))}
                        </div>
                      ) : (
                        <div className={`px-3 py-6 text-center text-xs ${isDarkMode ? "text-white/30" : "text-black/30"}`}>
                          No notifications
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </div>

              {/* DM Icon */}
              <div className="relative" ref={dmConvRef}>
                <motion.button
                  onClick={() => {
                    setIsDmOpen(!isDmOpen)
                    setDmView("list")
                  }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className={`p-2 border rounded-full transition-all duration-200 flex items-center justify-center cursor-pointer relative ${isDarkMode
                    ? "border-white/10 bg-white/5 text-white hover:bg-white/10 hover:border-white/20"
                    : "border-black/10 bg-black/5 text-black hover:bg-black/10 hover:border-black/20"
                    }`}
                  title="Direct Messages"
                >
                  <MessageSquare className="h-4 w-4" />
                  {dmConvs.some(c => c.unread_count > 0) && (
                    <span className={`absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-white dark:ring-[#0d0d0c] bg-sky-500`} />
                  )}
                </motion.button>
              </div>

              {/* Theme Toggler */}
              <motion.button
                onClick={toggleTheme}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className={`p-2 border rounded-full transition-all duration-200 flex items-center justify-center cursor-pointer overflow-hidden relative ${isDarkMode
                  ? "border-white/10 bg-white/5 text-white hover:bg-white/10 hover:border-white/20"
                  : "border-black/10 bg-black/5 text-black hover:bg-black/10 hover:border-black/20"
                  }`}
                title={isDarkMode ? "Switch to Light" : "Switch to Dark"}
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={isDarkMode ? "dark" : "light"}
                    initial={{ y: -20, opacity: 0, rotate: -90 }}
                    animate={{ y: 0, opacity: 1, rotate: 0 }}
                    exit={{ y: 20, opacity: 0, rotate: 90 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                    className="flex items-center justify-center"
                  >
                    {isDarkMode ? <Sun className="h-4 w-4 opacity-70" /> : <Moon className="h-4 w-4 opacity-70" />}
                  </motion.div>
                </AnimatePresence>
              </motion.button>

              {isMobile && (
                <motion.button
                  onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className={`p-2 border rounded-full transition-all duration-200 flex items-center justify-center cursor-pointer ${isDarkMode ? "border-white/10 text-white hover:bg-white/10" : "border-black/10 text-black hover:bg-black/10"
                    }`}
                  title="Toggle Sidebar"
                >
                  {isSidebarCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
                </motion.button>
              )}
            </div>
          </div>
          {/* Profile Header Block */}
          <div className="mb-8 pb-8 w-full">

            <div className="flex flex-col sm:flex-row items-center sm:items-stretch gap-6 md:gap-8">
              {/* Avatar */}
              <div className="relative shrink-0 group">
                <div className={`h-28 w-28 md:h-36 md:w-36 rounded-full p-[3px] flex items-center justify-center shadow-lg transition-all ${isCurrentUser ? "cursor-pointer hover:brightness-95" : ""
                  } ${isDarkMode
                    ? "bg-gradient-to-tr from-zinc-500 via-zinc-300 to-white"
                    : "bg-gradient-to-tr from-zinc-800 via-zinc-500 to-zinc-300"
                  }`}
                  onClick={() => {
                    if (isCurrentUser) {
                      directAvatarInputRef.current?.click()
                    }
                  }}
                >
                  <div className={`h-full w-full rounded-full overflow-hidden border-2 ${isDarkMode ? "border-[#0d0d0c] bg-zinc-900" : "border-white bg-zinc-100"} flex items-center justify-center text-white text-3xl font-bold relative`}>
                    {uploadingAvatar && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-15">
                        <Loader2 className="h-6 w-6 animate-spin text-white" />
                      </div>
                    )}

                    {profile.profile_picture ? (
                      <img src={getStoryImageUrl(profile.profile_picture)} className="h-full w-full object-cover" alt={profile.name} />
                    ) : (
                      <UserIcon className="h-16 w-16 text-zinc-400 dark:text-zinc-500" />
                    )}

                    {isCurrentUser && !uploadingAvatar && (
                      <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
                        <Camera className="h-6 w-6 text-white" />
                        <span className="text-[9px] text-white/80 font-bold uppercase mt-1">Upload</span>
                      </div>
                    )}
                  </div>
                </div>

                {isCurrentUser && (
                  <input
                    type="file"
                    ref={directAvatarInputRef}
                    onChange={handleDirectAvatarChange}
                    accept="image/*"
                    className="hidden"
                  />
                )}
              </div>

              {/* Info & Details */}
              <div className="min-w-0 text-center sm:text-left max-w-md">
                {/* Name Header */}
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1.5">
                  <h1 className="text-2xl font-bold truncate tracking-tight">{profile.name}</h1>

                  {isCurrentUser && currentUserPlan.toLowerCase() === "motion" ? (
                    <img src="/run.png" alt="Motion" className="w-6 h-6 object-contain shrink-0 mt-0.5 animate-plan-icon" />
                  ) : isCurrentUser && currentUserPlan.toLowerCase() === "speed" ? (
                    <img src="/ride-a-bike.png" alt="Speed" className="w-6 h-6 object-contain shrink-0 mt-0.5 animate-plan-icon" />
                  ) : isCurrentUser && currentUserPlan.toLowerCase() === "velocity" ? (
                    <img src="/car.png" alt="Velocity" className="w-6 h-6 object-contain shrink-0 mt-0.5 animate-plan-icon" />
                  ) : isCurrentUser && currentUserPlan.toLowerCase() === "acceleration" ? (
                    <img src="/air-force.png" alt="Acceleration" className="w-6 h-6 object-contain shrink-0 mt-0.5 animate-plan-icon" />
                  ) : isCurrentUser && (currentUserPlan.toLowerCase().includes("agency") || currentUserPlan.toLowerCase().includes("heavy duty")) ? (
                    <img src="/startup.png" alt="Agency" className="w-6 h-6 object-contain shrink-0 mt-0.5 animate-plan-icon" />
                  ) : (
                    <svg className="w-5 h-5 text-sky-500 fill-current shrink-0 mt-0.5" viewBox="0 0 24 24">
                      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                    </svg>
                  )}
                </div>

                {/* Profession */}
                <p className="text-sm text-zinc-400 font-medium mb-3">
                  {profile.profession || "Photographe Freelance"}
                </p>

                {/* Stats Row: Posts · Followers · Following */}
                <div className="flex items-center justify-center sm:justify-start gap-8 mb-4">
                  <div className="text-center sm:text-left">
                    <span className={`block text-lg font-bold leading-tight ${isDarkMode ? "text-white" : "text-zinc-800"}`}>{postsCount}</span>
                    <span className={`block text-[9px] uppercase tracking-widest font-semibold ${isDarkMode ? "text-zinc-500" : "text-zinc-450"}`}>posts</span>
                  </div>
                  <div className="text-center sm:text-left">
                    <span className={`block text-lg font-bold leading-tight ${isDarkMode ? "text-white" : "text-zinc-800"}`}>{followersCount}</span>
                    <span className={`block text-[9px] uppercase tracking-widest font-semibold ${isDarkMode ? "text-zinc-500" : "text-zinc-455"}`}>followers</span>
                  </div>
                  <div className="text-center sm:text-left">
                    <span className={`block text-lg font-bold leading-tight ${isDarkMode ? "text-white" : "text-zinc-800"}`}>{followingCount}</span>
                    <span className={`block text-[9px] uppercase tracking-widest font-semibold ${isDarkMode ? "text-zinc-500" : "text-zinc-455"}`}>following</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-4">
                  {isCurrentUser ? (
                    <button
                      onClick={() => setIsEditProfileOpen(true)}
                      className={`px-4 py-1.5 text-xs font-semibold rounded-md border transition-colors ${isDarkMode
                        ? "bg-zinc-800 border-zinc-700 hover:bg-zinc-700 text-zinc-200"
                        : "bg-zinc-100 border-zinc-200 hover:bg-zinc-200 text-zinc-800"
                        }`}
                    >
                      Edit Profile
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={async () => {
                          if (!profile?.id) return
                          setDmActiveUserId(profile.id)
                          setDmActiveUser({
                            id: profile.id,
                            name: profile.name,
                            profile_picture: profile.profile_picture
                          })
                          setDmView("chat")
                          setIsDmOpen(true)
                          setDmInput("")
                          try {
                            const res = await getDMMessages(profile.id)
                            if (res.success) {
                              setDmMessages(res.messages)
                            }
                            await markDMRead(profile.id)
                          } catch {
                            setDmMessages([])
                          }
                        }}
                        disabled={profile?.dm_privacy === "nobody"}
                        className={`px-4 py-1.5 text-xs font-semibold rounded-md border transition-colors flex items-center gap-1.5 disabled:opacity-30 disabled:cursor-not-allowed ${isDarkMode
                          ? "bg-zinc-800 border-zinc-700 hover:bg-zinc-700 text-zinc-200"
                          : "bg-white border-zinc-200 hover:bg-zinc-50 text-zinc-800"
                          }`}
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                        {profile?.dm_privacy === "nobody" ? "DMs Closed" : "Message"}
                      </button>
                      <button
                        onClick={async () => {
                          try {
                            const res = await toggleFollowUser(name)
                            setIsFollowing(res.is_following)
                            setFollowersCount(res.followers_count)
                          } catch (err: any) {
                            console.error("Failed to toggle follow:", err)
                          }
                        }}
                        className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors ${isFollowing
                          ? isDarkMode
                            ? "bg-zinc-800 hover:bg-red-950/30 hover:text-red-400 text-zinc-300"
                            : "bg-zinc-100 hover:bg-red-50 hover:text-red-600 text-zinc-700"
                          : "bg-sky-500 hover:bg-sky-600 text-white"
                          }`}
                      >
                        {isFollowing ? "Following" : "Follow"}
                      </button>
                    </>
                  )}
                </div>

                {/* Website Link */}
                <div className="flex items-center justify-center sm:justify-start">
                  {profile.website ? (
                    <a
                      href={profile.website.startsWith("http") ? profile.website : `https://${profile.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-semibold text-sky-500 dark:text-sky-400 hover:underline inline-flex items-center gap-1"
                    >
                      <Globe className="h-3 w-3" />
                      {profile.website}
                    </a>
                  ) : (
                    <a
                      href={`https://www.malt.fr/${profile.name.toLowerCase().replace(/\s+/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-semibold text-sky-500 dark:text-sky-400 hover:underline inline-flex items-center gap-1"
                    >
                      <Globe className="h-3 w-3" />
                      www.malt.fr/{profile.name.toLowerCase().replace(/\s+/g, '')}
                    </a>
                  )}
                </div>

                {/* Bio Display */}
                {profile.bio && (
                  <p className="text-sm leading-relaxed text-zinc-655 dark:text-zinc-300 mt-4 whitespace-pre-line text-left">
                    {profile.bio}
                  </p>
                )}
              </div>

              {/* Vertical Separator */}
              {recommendations.length > 0 && (
                <div className="hidden sm:block w-px self-stretch bg-zinc-200/60 mx-4" />
              )}

              {/* Recommendations Section */}
              {recommendations.length > 0 && (
                <div className="w-full sm:w-auto shrink-0 pl-0 sm:pl-2 flex flex-col justify-start">
                  <h3 className="text-[9px] font-bold tracking-widest text-zinc-400 dark:text-zinc-500 uppercase mb-3 text-center sm:text-left">Recommandations</h3>
                  <div className="grid grid-rows-3 grid-flow-col gap-2.5 w-auto mx-auto sm:mx-0">
                    {recommendations.slice(0, 15).map((recUser) => (
                      <div
                        key={recUser.id}
                        onClick={() => router.push(`/profile/${encodeURIComponent(recUser.name)}`)}
                        className="h-14 w-14 rounded-lg overflow-hidden relative group cursor-pointer border border-zinc-200 dark:border-zinc-800 shadow-sm"
                        title={recUser.name}
                      >
                        {recUser.profile_picture ? (
                          <img
                            src={getStoryImageUrl(recUser.profile_picture)}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            alt={recUser.name}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 text-zinc-450 dark:text-zinc-500">
                            <UserIcon className="h-5 w-5" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Stories Section — horizontally below bio */}
            <div className="mt-6 w-full ml-[5%]">
              <div className="flex flex-row flex-nowrap gap-4 justify-start overflow-x-auto scrollbar-hide w-full max-w-[880px] py-1 pl-[6%]">
                {isCurrentUser && (
                  <div
                    onClick={() => setIsNewStoryOpen(true)}
                    className="flex flex-col items-center gap-1 cursor-pointer group"
                  >
                    <div className={`h-14 w-14 rounded-full border border-dashed flex items-center justify-center transition-colors ${isDarkMode ? "border-zinc-700 group-hover:border-zinc-500" : "border-zinc-300 group-hover:border-zinc-500"}`}>
                      <Plus className="h-5 w-5 text-zinc-400 group-hover:text-zinc-655 dark:group-hover:text-zinc-200" />
                    </div>
                    <span className="text-[10px] font-medium text-zinc-400 group-hover:text-zinc-655 dark:group-hover:text-zinc-200 transition-colors">Nouveau</span>
                  </div>
                )}
                {stories.map((story, index) => {
                  const storyImgs = getStoryImgs(story)
                  if (storyImgs.length === 0) return null
                  const isSeen = seenStories.has(index)
                  return (
                    <div
                      key={index}
                      onClick={() => {
                        setActiveStoryIndex(index)
                        setActiveSlideIndex(0)
                      }}
                      className="flex flex-col items-center gap-1.5 cursor-pointer group"
                    >
                      <div className={`h-14 w-14 rounded-full flex items-center justify-center relative transition-all duration-300 ${isSeen
                        ? "border border-zinc-300 dark:border-zinc-700 p-[1.5px] hover:border-zinc-400 dark:hover:border-zinc-500"
                        : "bg-gradient-to-tr from-red-500 via-rose-500 to-blue-500 p-[2px]"
                        }`}>
                        <div className={`h-full w-full rounded-full overflow-hidden relative border-2 ${isDarkMode ? "border-[#0d0d0c] bg-zinc-900" : "border-white bg-zinc-100"
                          }`}>
                          <img src={storyImgs[0]} className="h-full w-full object-cover" alt={story.name} />
                          <div className="absolute inset-0 bg-black/25 flex items-center justify-center transition-opacity group-hover:bg-black/45">
                            <Tv className="h-4.5 w-4.5 text-white drop-shadow-md" />
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 transition-colors">{story.name.split(" ")[0]}</span>
                    </div>
                  )
                })}
              </div>
            </div>

          </div>

          {/* Tab Headers */}
          <div className="flex justify-center border-t border-zinc-100 dark:border-zinc-800 mt-10 mb-8">
            <div className="flex gap-8">
              {[
                { id: "publications", label: "Publications", icon: Grid },
                { id: "tv", label: "Instagram TV", icon: Tv },
                { id: "saved", label: "Enregistrements", icon: Bookmark },
                { id: "tagged", label: "Identifié(e)", icon: UserIcon }
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = tab.id === "publications";
                return (
                  <div
                    key={tab.id}
                    className={`flex items-center gap-1.5 py-4 border-t-2 transition-colors cursor-pointer text-[10px] sm:text-[11px] font-bold uppercase tracking-wider ${isActive
                      ? "border-zinc-800 dark:border-zinc-200 text-zinc-900 dark:text-white"
                      : "border-transparent text-zinc-400 dark:text-zinc-500 hover:text-zinc-655 dark:hover:text-zinc-450"
                      }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* User's public images grid */}
          <div>
            {assetsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className={`h-6 w-6 animate-spin ${isDarkMode ? "text-white/30" : "text-black/30"}`} />
              </div>
            ) : userAssets.length === 0 ? (
              <div className={`text-center py-12 ${isDarkMode ? "text-white/30" : "text-black/30"}`}>
                <ImageIcon className="h-12 w-12 mx-auto mb-3 opacity-40" />
                <p className="text-sm font-medium">No public creations yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {userAssets.map((asset) => (
                  <button
                    key={asset.id}
                    onClick={() => setSelectedAsset(asset)}
                    className="group relative overflow-hidden rounded-lg border border-zinc-100 dark:border-zinc-800 aspect-square shadow-sm text-left w-full"
                  >
                    <img
                      src={getAssetImageUrl(asset)}
                      alt={asset.prompt || "Image"}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 flex items-end p-3">
                      <div className="flex items-center gap-2 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <Heart className="h-3.5 w-3.5 fill-current" />
                        <span>{asset.likes_count || 0}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {isEditProfileOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`w-full max-w-md rounded-2xl overflow-hidden shadow-2xl border flex flex-col max-h-[90vh] ${isDarkMode
                ? "bg-zinc-900 border-zinc-800 text-white"
                : "bg-white border-zinc-200 text-zinc-900"
                }`}
            >
              {/* Header */}
              <div className="flex justify-between items-center px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
                <h2 className="text-lg font-bold">Edit Profile</h2>
                <button
                  onClick={() => {
                    setIsEditProfileOpen(false)
                    // Reset
                    setEditAvatarUrl(profile.profile_picture)
                    setEditName(profile.name)
                    setEditProfession(profile.profession || "Photographe Freelance")
                    setEditBio(profile.bio || "")
                    setEditWebsite(profile.website || "")
                    setAvatarFile(null)
                  }}
                  className="text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Body */}
              <div className="overflow-y-auto p-6 space-y-4">

                {/* Profile Pic Upload */}
                <div className="flex flex-col items-center gap-2">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="h-24 w-24 rounded-full overflow-hidden relative cursor-pointer group border border-zinc-300 dark:border-zinc-700 shadow-inner"
                  >
                    {editAvatarUrl ? (
                      <img src={getStoryImageUrl(editAvatarUrl)} className="h-full w-full object-cover group-hover:opacity-75 transition-opacity" alt="Preview" />
                    ) : (
                      <div className="h-full w-full bg-zinc-150 dark:bg-zinc-800 flex items-center justify-center text-zinc-400">
                        <Camera className="h-8 w-8" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleAvatarChange}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs font-semibold text-sky-500 hover:underline"
                  >
                    Change Profile Photo
                  </button>
                </div>

                {/* Read-only Username Handle */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Username (Read-Only)</label>
                  <input
                    type="text"
                    value={name}
                    disabled
                    className={`w-full p-2.5 text-sm rounded-lg border cursor-not-allowed opacity-60 ${isDarkMode
                      ? "bg-zinc-800/50 border-zinc-700/50 text-zinc-400"
                      : "bg-zinc-100/50 border-zinc-200/50 text-zinc-500"
                      }`}
                  />
                </div>

                {/* Display Name Input */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Display Name</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Enter display name"
                    className={`w-full p-2.5 text-sm rounded-lg border focus:outline-none focus:ring-1 focus:ring-sky-500 ${isDarkMode
                      ? "bg-zinc-950 border-zinc-800 text-white"
                      : "bg-zinc-50 border-zinc-200 text-zinc-900"
                      }`}
                  />
                </div>

                {/* Profession Input */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Profession / Title</label>
                  <input
                    type="text"
                    value={editProfession}
                    onChange={(e) => setEditProfession(e.target.value)}
                    placeholder="e.g. Photographe Freelance"
                    className={`w-full p-2.5 text-sm rounded-lg border focus:outline-none focus:ring-1 focus:ring-sky-500 ${isDarkMode
                      ? "bg-zinc-950 border-zinc-800 text-white"
                      : "bg-zinc-50 border-zinc-200 text-zinc-900"
                      }`}
                  />
                </div>

                {/* Website URL Input */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Website / Link</label>
                  <input
                    type="text"
                    value={editWebsite}
                    onChange={(e) => setEditWebsite(e.target.value)}
                    placeholder="e.g. www.malt.fr/bx"
                    className={`w-full p-2.5 text-sm rounded-lg border focus:outline-none focus:ring-1 focus:ring-sky-500 ${isDarkMode
                      ? "bg-zinc-950 border-zinc-800 text-white"
                      : "bg-zinc-50 border-zinc-200 text-zinc-900"
                      }`}
                  />
                </div>

                {/* Bio TextArea */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Bio</label>
                    <span className="text-[10px] text-zinc-400 font-mono">{editBio.length}/250</span>
                  </div>
                  <textarea
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    maxLength={250}
                    rows={3}
                    placeholder="Tell us about yourself..."
                    className={`w-full p-2.5 text-sm rounded-lg border focus:outline-none focus:ring-1 focus:ring-sky-500 ${isDarkMode
                      ? "bg-zinc-950 border-zinc-800 text-white"
                      : "bg-zinc-50 border-zinc-200 text-zinc-900"
                      }`}
                  />
                </div>

              </div>

              {/* Footer */}
              <div className="flex justify-end gap-2 px-6 py-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditProfileOpen(false)
                    // Reset
                    setEditAvatarUrl(profile.profile_picture)
                    setEditName(profile.name)
                    setEditProfession(profile.profession || "Photographe Freelance")
                    setEditBio(profile.bio || "")
                    setEditWebsite(profile.website || "")
                    setAvatarFile(null)
                  }}
                  disabled={savingProfile}
                  className={`px-4 py-2 text-xs font-semibold rounded-md border transition-colors ${isDarkMode
                    ? "bg-zinc-800 border-zinc-700 hover:bg-zinc-700 text-zinc-300"
                    : "bg-white border-zinc-200 hover:bg-zinc-100 text-zinc-700"
                    }`}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  disabled={savingProfile}
                  className="px-4 py-2 text-xs font-semibold rounded-md bg-sky-500 hover:bg-sky-600 text-white transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  {savingProfile ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add New Story Modal */}
      <AnimatePresence>
        {isNewStoryOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl border flex flex-col ${isDarkMode
                ? "bg-zinc-900 border-zinc-800 text-white"
                : "bg-white border-zinc-200 text-zinc-900"
                }`}
            >
              {/* Header */}
              <div className="flex justify-between items-center px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
                <h2 className="text-sm font-bold">Add New Story</h2>
                <button
                  onClick={() => {
                    setIsNewStoryOpen(false)
                    setNewStoryName("")
                    setStorySelectedAssets([])
                  }}
                  className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-4">
                {/* Library Asset Picker */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Choose from Library</label>
                    {storySelectedAssets.length > 0 && (
                      <span className="text-[9px] font-bold text-sky-500 bg-sky-500/10 px-2 py-0.5 rounded-full">{storySelectedAssets.length} selected</span>
                    )}
                  </div>
                  <div className="max-h-40 overflow-y-auto grid grid-cols-4 gap-2 p-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950">
                    {userAssets.length === 0 ? (
                      <div className="col-span-4 text-center text-[10px] text-zinc-400 py-4">No assets in library</div>
                    ) : (
                      userAssets.map((asset) => {
                        const selectionIndex = storySelectedAssets.findIndex((a) => a.id === asset.id)
                        const isSelected = selectionIndex !== -1
                        return (
                          <button
                            key={asset.id}
                            type="button"
                            onClick={() => {
                              if (isSelected) {
                                setStorySelectedAssets(storySelectedAssets.filter((a) => a.id !== asset.id))
                              } else {
                                setStorySelectedAssets([...storySelectedAssets, asset])
                              }
                            }}
                            className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${isSelected
                              ? "border-sky-500 ring-2 ring-sky-500/30 scale-105"
                              : "border-transparent hover:border-zinc-400 dark:hover:border-zinc-500"
                              }`}
                          >
                            <img
                              src={getAssetImageUrl(asset)}
                              alt={asset.prompt || ""}
                              className="h-full w-full object-cover"
                            />
                            {isSelected && (
                              <div className="absolute inset-0 bg-sky-500/20 flex items-center justify-center">
                                <div className="bg-sky-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold shadow-md">
                                  {selectionIndex + 1}
                                </div>
                              </div>
                            )}
                          </button>
                        )
                      })
                    )}
                  </div>
                </div>

                {/* Name Input */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Story Title / City</label>
                  <input
                    type="text"
                    value={newStoryName}
                    onChange={(e) => setNewStoryName(e.target.value)}
                    placeholder="e.g. Paris"
                    className={`w-full p-2.5 text-xs rounded-lg border focus:outline-none focus:ring-1 focus:ring-sky-500 ${isDarkMode
                      ? "bg-zinc-950 border-zinc-800 text-white"
                      : "bg-zinc-50 border-zinc-200 text-zinc-900"
                      }`}
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-2 px-6 py-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
                <button
                  type="button"
                  onClick={() => {
                    setIsNewStoryOpen(false)
                    setNewStoryName("")
                    setStorySelectedAssets([])
                  }}
                  disabled={uploadingStory}
                  className={`px-4 py-2 text-xs font-semibold rounded-md border transition-colors ${isDarkMode
                    ? "bg-zinc-800 border-zinc-700 hover:bg-zinc-700 text-zinc-300"
                    : "bg-white border-zinc-200 hover:bg-zinc-100 text-zinc-700"
                    }`}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddStory}
                  disabled={uploadingStory}
                  className="px-4 py-2 text-xs font-semibold rounded-md bg-sky-500 hover:bg-sky-600 text-white transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  {uploadingStory ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    "Publish Story"
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Story Viewer Modal */}
      <AnimatePresence>
        {activeStoryIndex !== null && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-0 sm:p-4 select-none">
            {/* Close click area */}
            <div className="absolute inset-0 cursor-pointer" onClick={() => { if (activeStoryIndex !== null) markStorySeen(activeStoryIndex); setActiveStoryIndex(null); setStoryProgress(0); }} />

            {(() => {
              const activeStorySlides = getStoryImgs(stories[activeStoryIndex])
              return (
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="relative max-w-md w-full h-full sm:h-[85vh] sm:rounded-2xl overflow-hidden shadow-2xl bg-zinc-950 flex flex-col justify-between z-10"
                >
                  {/* Top Progress bar & Header */}
                  <div className="absolute top-0 inset-x-0 p-3 bg-gradient-to-b from-black/80 to-transparent z-25 space-y-3">
                    {/* Progress Indicators */}
                    <div className="flex gap-1.5 w-full">
                      {activeStorySlides.map((_, i) => (
                        <div key={i} className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-white animate-none"
                            style={{
                              width: i < activeSlideIndex
                                ? "100%"
                                : i === activeSlideIndex
                                  ? `${storyProgress}%`
                                  : "0%"
                            }}
                          />
                        </div>
                      ))}
                    </div>

                    {/* Profile detail & close button */}
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full overflow-hidden border border-white/25 flex items-center justify-center bg-zinc-800">
                          {profile.profile_picture ? (
                            <img src={getStoryImageUrl(profile.profile_picture)} className="h-full w-full object-cover" alt="User" />
                          ) : (
                            <UserIcon className="h-4 w-4 text-zinc-400" />
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-white">{profile.name}</p>
                          <p className="text-[10px] text-white/60 font-medium">{stories[activeStoryIndex].name}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => { markStorySeen(activeStoryIndex); setActiveStoryIndex(null); setStoryProgress(0); }}
                        className="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  </div>

                  {/* Story Image */}
                  <div className="flex-1 flex items-center justify-center bg-black relative">
                    {activeStorySlides[activeSlideIndex] && (
                      <img
                        src={getStoryImageUrl(activeStorySlides[activeSlideIndex])}
                        className="max-h-full max-w-full object-contain"
                        alt={stories[activeStoryIndex].name}
                      />
                    )}

                    {/* Navigation Overlays */}
                    <div
                      onClick={() => {
                        setStoryProgress(0)
                        if (activeSlideIndex > 0) {
                          setActiveSlideIndex(activeSlideIndex - 1)
                        } else {
                          if (activeStoryIndex > 0) {
                            const prevStoryIndex = activeStoryIndex - 1
                            const prevStorySlides = getStoryImgs(stories[prevStoryIndex])
                            setActiveStoryIndex(prevStoryIndex)
                            setActiveSlideIndex(prevStorySlides.length - 1)
                          } else {
                            setActiveStoryIndex(null)
                          }
                        }
                      }}
                      className="absolute left-0 top-0 bottom-0 w-1/3 cursor-pointer"
                      title="Previous Slide"
                    />
                    <div
                      onClick={() => {
                        setStoryProgress(0)
                        const slidesCount = activeStorySlides.length
                        if (activeSlideIndex < slidesCount - 1) {
                          setActiveSlideIndex(activeSlideIndex + 1)
                        } else {
                          markStorySeen(activeStoryIndex)
                          if (activeStoryIndex < stories.length - 1) {
                            setActiveStoryIndex(activeStoryIndex + 1)
                            setActiveSlideIndex(0)
                          } else {
                            setActiveStoryIndex(null)
                          }
                        }
                      }}
                      className="absolute right-0 top-0 bottom-0 w-1/3 cursor-pointer"
                      title="Next Slide"
                    />
                  </div>

                </motion.div>
              )
            })()}
          </div>
        )}
      </AnimatePresence>

      {/* Asset Detail Modal */}
      <AssetDetailModal
        asset={selectedAsset}
        isOpen={!!selectedAsset}
        onClose={() => setSelectedAsset(null)}
        isDarkMode={isDarkMode}
      />

      {/* DM Modal / Floating Chat Popup */}
      <AnimatePresence>
        {isDmOpen && (
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
                        onClick={() => setIsDmOpen(false)}
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
                      onClick={() => setIsDmOpen(false)}
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

                  {/* Friends / Connection List */}
                  <div className="flex-1 overflow-y-auto p-3 space-y-1 min-h-0">
                    {(() => {
                      const filteredUsers = dmNewChatUsers.filter(u =>
                        u.name.toLowerCase().includes(dmSearchQuery.toLowerCase())
                      )
                      if (filteredUsers.length === 0) {
                        return <div className="text-center text-xs text-zinc-400 py-8">No users found</div>
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
                        onClick={() => setIsDmOpen(false)}
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
                      <p className="text-[10px] text-zinc-400 dark:text-zinc-500">@{dmActiveUser.name.toLowerCase().replace(/\s+/g, '_')} · Instagram</p>
                      <button
                        onClick={() => {
                          router.push(`/profile/${encodeURIComponent(dmActiveUser.name)}`)
                          setIsDmOpen(false)
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
                    </div>
                  </div>

                  {/* Input area */}
                  <div className="p-3 border-t border-zinc-100 dark:border-zinc-800 shrink-0">
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
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        isDarkMode={isDarkMode}
        isMobile={isMobile}
        onPersonaSelect={() => { }}
        currentPersona={null}
        onDeactivate={handleDiscontinueAccount}
        userRole={getUserRole()}
        userName={currentUserName}
        userEmail={getUserInfo()?.email || ""}
        initialPanel={settingsPanel}
      />
    </div>
  )
}

export default function ProfilePage() {
  return (
    <ThemeProvider>
      <ProfileContent />
    </ThemeProvider>
  )
}
