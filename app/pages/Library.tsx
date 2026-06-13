"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  getLibraryAssets,
  deleteLibraryAsset,
  getPublicLibraryAssets,
  toggleAssetVisibility,
  getLibraryGalleries,
  getPublicLibraryGalleries,
  createLibraryGallery,
  updateLibraryGallery,
  deleteLibraryGallery,
  assignAssetToGallery,
  getPublicGalleryAssets,
  getSavedAssetIds,
  saveAsset,
  unsaveAsset,
  getSubscriptionStatus,
  sendAiRequest,
  getAssetImageUrl,
  likeAsset,
  unlikeAsset,
  getLikesCounts,
  getAssetSocial,
  addAssetComment,
  getNotifications,
  markNotificationAsRead,
  getSingleAsset,
  updateAssetCategory,
  copyAssetToLibrary,
  type LibraryAsset,
  type LibraryGallery,
  type SocialNotification
} from "@/lib/chat-api"
import {
  isAuthenticated,
  removeApiKey,
  removeUserInfo,
  removeUserRole,
  removeSchoolName,
  removeEnterpriseName,
  getUserInfo,
  getUserRole,
  getProfilePicture
} from "@/lib/auth"
import { useTheme } from "@/lib/theme-context"
import {
  Loader2,
  Trash2,
  BookOpen,
  ArrowUp,
  ArrowLeft,
  Sparkles,
  Clock,
  Bookmark,
  Image as ImageIcon,
  Heart,
  Upload,
  FolderPlus,
  Plus,
  HelpCircle,
  Copy,
  Check,
  CheckCircle,
  Sliders,
  Maximize2,
  Eye,
  Search,
  X,
  ChevronRight,
  ChevronDown,
  Folder,
  Globe,
  Lock,
  Info,
  Edit2,
  FolderOpen,
  Download,
  Share2,
  Move,
  Menu,
  MessageSquare,
  Compass,
  Moon,
  Sun,
  PanelLeftOpen,
  PanelLeftClose,
  User,
  Settings,
  LogOut,
  Wallet,
  Mic,
  Zap,
  Car,
  Bell,
  MoreHorizontal,
  Minus,
  Smile,
  Tag
} from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { BentoGrid, BentoGridItem } from "@/components/ui/bento-grid"
import JSZip from "jszip"
import { Poppins, Roboto, Space_Grotesk } from "next/font/google"
import SettingsModal from "@/components/ui/SettingsModal"
import WalletModal from "@/components/ui/WalletModal"
import OnboardingWalkthrough from "@/components/OnboardingWalkthrough"
import ReflectiveCard from "@/components/ReflectiveCard"
import PixelCard from "@/components/PixelCard"

// Curated Premium Mock Assets for the "Featured" Feed
const FEATURED_ASSETS: LibraryAsset[] = [
  {
    id: "feat-1",
    asset_type: "image",
    asset_url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80",
    prompt: "A majestic golden retriever puppy running through a field of wild sunflowers during golden hour, photorealistic, captured on 35mm lens, volumetric lighting, rich warm grading.",
    is_public: true,
    created_at: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    id: "feat-2",
    asset_type: "image",
    asset_url: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&w=800&q=80",
    prompt: "Stunning papercraft model of a futuristic cyberpunk neon city, intricate paper folding, miniature stop-motion layout, glowing fiber optic lines, ultra-detailed craftsmanship.",
    is_public: true,
    created_at: new Date(Date.now() - 3600000 * 5).toISOString()
  },
  {
    id: "feat-3",
    asset_type: "image",
    asset_url: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=800&q=80",
    prompt: "A close-up of a vibrant red ladybug crawling on a wet green leaf, dew drops shimmering in crystal-clear sunlight, macro photography, 8k resolution, organic textures, cinematic focus.",
    is_public: false,
    created_at: new Date(Date.now() - 3600000 * 12).toISOString()
  },
  {
    id: "feat-4",
    asset_type: "image",
    asset_url: "https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=800&q=80",
    prompt: "Black and white film noir scene of a mysterious detective walking down a wet, foggy cobblestone street in 1940s London, casting long dramatic shadows, streetlamps glowing through haze.",
    is_public: true,
    created_at: new Date(Date.now() - 3600000 * 24).toISOString()
  }
]

const ASSET_CATEGORIES = [
  "Abstract",
  "Nature & Landscapes",
  "People & Portraits",
  "Animals & Wildlife",
  "Fantasy & Sci-Fi",
  "Architecture & Cityscapes",
  "Food & Drinks",
  "Technology & Cyberpunk",
  "Fashion & Beauty",
  "Minimalist & Geometric"
]

const chatHeadingFont = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-chat-heading",
})

const chatBodyFont = Roboto({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-chat-body",
})

const chatAccentFont = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-chat-accent",
})

const seededShuffle = <T,>(array: T[], seed: number): T[] => {
  const arr = [...array];
  let s = seed;
  for (let i = arr.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const renderCommentContent = (content: string, siblingUsernames: string[] = []) => {
  const sortedUsernames = [...siblingUsernames].sort((a, b) => b.length - a.length);
  let matchedUser: string | null = null;
  let prefixLength = 0;

  for (const username of sortedUsernames) {
    const prefixWithColon = `@${username}:`;
    const prefixWithSpace = `@${username} `;
    const exactPrefix = `@${username}`;

    if (content.startsWith(prefixWithColon)) {
      matchedUser = username;
      prefixLength = prefixWithColon.length;
      break;
    } else if (content.startsWith(prefixWithSpace)) {
      matchedUser = username;
      prefixLength = prefixWithSpace.length;
      break;
    } else if (content === exactPrefix) {
      matchedUser = username;
      prefixLength = exactPrefix.length;
      break;
    }
  }

  if (matchedUser) {
    const rest = content.slice(prefixLength);
    return (
      <>
        <span className="font-semibold text-cyan-500 mr-1 select-none">@{matchedUser}</span>
        {rest}
      </>
    );
  }

  const match = content.match(/^@([^\s:]+)/);
  if (match) {
    const username = match[1];
    const prefixLength = content.startsWith(`@${username}:`) ? username.length + 2 : username.length + 1;
    const rest = content.slice(prefixLength);
    return (
      <>
        <span className="font-semibold text-cyan-500 mr-1 select-none">@{username}</span>
        {rest}
      </>
    );
  }
  return content;
};

const ReplyItem = ({ 
  reply, 
  depth, 
  commentId, 
  isDarkMode, 
  handleReplyClick,
  siblingUsernames
}: { 
  reply: any; 
  depth: number; 
  commentId: any; 
  isDarkMode: boolean; 
  handleReplyClick: (commentId: any, targetUsername: string) => void;
  siblingUsernames: string[];
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const hasReplies = reply.replies && reply.replies.length > 0;

  return (
    <div className="relative">
      {/* Sibling reply layout */}
      <div className="flex gap-2.5 items-start text-sm relative pl-6 group/reply">
        
        {/* Curved arrow line */}
        <div className="absolute left-3 -top-3 h-6 w-3 border-l border-b border-black dark:border-zinc-800 rounded-bl-lg pointer-events-none" />
        
        {/* Arrowhead */}
        <div className="absolute left-[20px] top-[9px] w-0 h-0 border-t-[3px] border-t-transparent border-b-[3px] border-b-transparent border-l-[4px] border-l-black dark:border-l-zinc-800 pointer-events-none" />
        
        {/* Avatar */}
        <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[8px] font-bold shrink-0 transition-colors duration-300 relative z-10 ${
          isDarkMode 
            ? "bg-[#f4f3f2] text-black" 
            : "bg-[#0d0d0c] text-white"
        }`}>
          {reply.user_avatar ? (
            <img src={reply.user_avatar} className="h-full w-full object-cover rounded-full" alt={reply.user_name} />
          ) : (
            reply.user_name.slice(0, 2).toUpperCase()
          )}
        </div>

        {/* Content pane (Clean YouTube style) */}
        <div className="flex-1 flex flex-col pt-0.5 pl-0.5">
          <div className="flex items-center gap-2">
            <span className="font-bold text-xs text-zinc-800 dark:text-zinc-200">@{reply.user_name}</span>
            <span className="text-[10px] text-zinc-400 select-none">
              {new Date(reply.created_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit"
              })}
            </span>
          </div>
          
          <p className="leading-normal text-xs md:text-sm mt-1 text-zinc-700 dark:text-zinc-300">
            {renderCommentContent(reply.content, siblingUsernames)}
          </p>

          <div className="flex items-center gap-3 mt-1.5 pb-1">
            <button
              onClick={() => handleReplyClick(commentId, reply.user_name)}
              className="text-[10px] font-bold text-zinc-500 hover:text-cyan-500 dark:text-zinc-400 dark:hover:text-cyan-400 transition-colors cursor-pointer"
            >
              Reply
            </button>
            {hasReplies && (
              <>
                <span className="text-[10px] text-zinc-400 select-none">•</span>
                <button
                  onClick={() => setIsCollapsed(!isCollapsed)}
                  className="text-[10px] font-bold text-zinc-500 hover:text-cyan-500 dark:text-zinc-400 dark:hover:text-cyan-400 transition-colors cursor-pointer"
                >
                  {isCollapsed ? `Show replies (${reply.replies.length})` : "Hide replies"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Children replies */}
      {hasReplies && !isCollapsed && (
        <div className="ml-6 relative space-y-3 mt-3">
          {/* Vertical timeline line for this reply's own children */}
          <div className="absolute left-3 top-0 bottom-5 w-px bg-black dark:bg-zinc-800 pointer-events-none" />
          
          {reply.replies.map((childReply: any) => (
            <ReplyItem 
              key={childReply.id} 
              reply={childReply} 
              depth={depth + 1} 
              commentId={commentId} 
              isDarkMode={isDarkMode}
              handleReplyClick={handleReplyClick}
              siblingUsernames={siblingUsernames}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default function LibraryPage() {
  const router = useRouter()
  const { isDarkMode, toggleTheme } = useTheme()
  
  const [assets, setAssets] = useState<LibraryAsset[]>([])
  const [publicAssets, setPublicAssets] = useState<LibraryAsset[]>([])
  
  // Pinterest Detail & Lightbox States
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)
  const [zoomScale, setZoomScale] = useState(1)
  const [comments, setComments] = useState<any[]>([])
  const [likesCount, setLikesCount] = useState(0)
  const [isLiked, setIsLiked] = useState(false)
  const [newCommentText, setNewCommentText] = useState("")
  const [socialLoading, setSocialLoading] = useState(false)
  const [replyToComment, setReplyToComment] = useState<{ id: any; user_name: string } | null>(null)
  const [collapsedComments, setCollapsedComments] = useState<Record<any, boolean>>({})
  const [creatorInfo, setCreatorInfo] = useState<{ name: string; avatar: string | null }>({ name: "AWEDICT", avatar: null })
  const [notifications, setNotifications] = useState<SocialNotification[]>([])

  const [isLoading, setIsLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [togglingVisibilityId, setTogglingVisibilityId] = useState<string | null>(null)
  const [brokenImages, setBrokenImages] = useState<Set<string>>(new Set())
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set())
  
  // Custom Interactive States
  const [activeCategory, setActiveCategory] = useState<string>("featured")
  const [aspectRatio, setAspectRatio] = useState<"1:1" | "16:9" | "9:16">("1:1")
  const [createdOnFilter, setCreatedOnFilter] = useState<"all" | "today" | "week" | "month">("all")
  const [sourceFilter, setSourceFilter] = useState<"all" | "personal" | "community">("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [savedIds, setSavedIds] = useState<string[]>([])
  const [likesCountsMap, setLikesCountsMap] = useState<Record<string, number>>({})
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [isUploadDragging, setIsUploadDragging] = useState(false)
  const [uploadedAssets, setUploadedAssets] = useState<LibraryAsset[]>([])
  const [generatePrompt, setGeneratePrompt] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [generatedAssetId, setGeneratedAssetId] = useState<string | null>(null)
  const [pendingCategory, setPendingCategory] = useState<string | null>(null)
  const [customCategory, setCustomCategory] = useState("")
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false)
  const [categorySearch, setCategorySearch] = useState("")
  const [customCategoryList, setCustomCategoryList] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("library_custom_categories")
        return stored ? JSON.parse(stored) : []
      } catch { return [] }
    }
    return []
  })
  const categoryDropdownRef = useRef<HTMLDivElement>(null)
  
  // Custom Real Database-backed Galleries States
  const [galleries, setGalleries] = useState<LibraryGallery[]>([])
  const [publicGalleries, setPublicGalleries] = useState<LibraryGallery[]>([])
  const [selectedGalleryId, setSelectedGalleryId] = useState<string | null>(null)
  const [selectedPublicGalleryId, setSelectedPublicGalleryId] = useState<string | null>(null)
  const [publicGalleryAssets, setPublicGalleryAssets] = useState<LibraryAsset[]>([])
  const [isFetchingPublicGalleryAssets, setIsFetchingPublicGalleryAssets] = useState(false)
  const [showcaseTab, setShowcaseTab] = useState<"assets" | "galleries">("assets")
  const [exploreTab, setExploreTab] = useState<"images" | "folders">("images")
  const [publicGallerySource, setPublicGallerySource] = useState<"featured" | "public_showcase">("public_showcase")
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false)
  const [moveAssetId, setMoveAssetId] = useState<string | null>(null)
  const [expandedAsset, setExpandedAsset] = useState<LibraryAsset | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [sidebarWidth, setSidebarWidth] = useState(260)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true)

  const [userName, setUserName] = useState<string>("")
  const [userEmail, setUserEmail] = useState<string>("")
  const [userRole, setUserRole] = useState<string | null>(null)
  const [schoolName, setSchoolName] = useState<string>("")
  const [profilePic, setProfilePic] = useState<string | null>(null)
  const [subscription, setSubscription] = useState<any>(null)
  const [isSubscriptionLoading, setIsSubscriptionLoading] = useState(false)
  const [showProfileDropup, setShowProfileDropup] = useState(false)
  const [isPersonalizationModalOpen, setIsPersonalizationModalOpen] = useState(false)
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false)
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false)
  const [settingsPanel, setSettingsPanel] = useState<"general" | "persona" | "faq" | "bug" | "deactivate">("general")
  const [selectedPersona, setSelectedPersona] = useState<any>(null)
  const [showWalkthrough, setShowWalkthrough] = useState(false)
  const [hasNewGeneration, setHasNewGeneration] = useState(false)
  const [showNotificationPanel, setShowNotificationPanel] = useState(false)
  const [generationStatus, setGenerationStatus] = useState<"idle" | "generating" | "completed">("idle")
  const notificationPanelRef = useRef<HTMLDivElement>(null)

  const FEATURED_INITIAL_BATCH = 6
  const FEATURED_BATCH_SIZE = 6
  const PUBLIC_PAGE_SIZE = 20
  const [visibleCount, setVisibleCount] = useState(FEATURED_INITIAL_BATCH)
  const [publicAssetsPage, setPublicAssetsPage] = useState(1)
  const [hasMorePublic, setHasMorePublic] = useState(true)
  const [isLoadingMorePublic, setIsLoadingMorePublic] = useState(false)
  const publicAssetsCacheRef = useRef<LibraryAsset[]>([])
  const sentinelRef = useRef<HTMLDivElement>(null)

  const IMAGE_PLACEHOLDER_TEXTS = useMemo(() => [
    "A serene mountain landscape at sunset...",
    "A futuristic cyberpunk city with neon lights...",
    "An oil painting of a cozy cottage in the woods...",
    "A minimalist logo design for a tech startup...",
    "A realistic portrait of a wise old wizard...",
    "A steampunk airship floating above the clouds...",
    "A watercolor illustration of a botanical garden...",
    "A 3D render of a crystal palace in space...",
  ], [])
  const placeholderTextsRef = useRef(IMAGE_PLACEHOLDER_TEXTS)
  useEffect(() => { placeholderTextsRef.current = IMAGE_PLACEHOLDER_TEXTS }, [IMAGE_PLACEHOLDER_TEXTS])
  const [placeholderIndex, setPlaceholderIndex] = useState(0)
  const [typedPlaceholder, setTypedPlaceholder] = useState(IMAGE_PLACEHOLDER_TEXTS[0])

  const profileDropupRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (typeof window !== "undefined" && isAuthenticated()) {
      const info = getUserInfo()
      if (info) {
        setUserName(info.name || "")
        setUserEmail(info.email || "")
      }
      setUserRole(getUserRole())
      setProfilePic(getProfilePicture())
    }
  }, [isPersonalizationModalOpen])



  useEffect(() => {
    setIsSubscriptionLoading(true)
    getSubscriptionStatus()
      .then((res) => {
        if (res.success) setSubscription(res)
      })
      .catch(() => {})
      .finally(() => setIsSubscriptionLoading(false))
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileDropupRef.current && !profileDropupRef.current.contains(event.target as Node)) {
        setShowProfileDropup(false)
      }
    }
    if (showProfileDropup) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [showProfileDropup])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationPanelRef.current && !notificationPanelRef.current.contains(event.target as Node)) {
        setShowNotificationPanel(false)
      }
    }
    if (showNotificationPanel) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [showNotificationPanel])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target as Node)) {
        setShowCategoryDropdown(false)
        setCategorySearch("")
      }
    }
    if (showCategoryDropdown) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [showCategoryDropdown])

  // Generic infinite scroll logic is moved below activeAssets definition.

  useEffect(() => {
    let charPos = 0
    let interval: ReturnType<typeof setInterval>
    const startTyping = () => {
      const text = placeholderTextsRef.current[placeholderIndex % placeholderTextsRef.current.length]
      charPos = 0
      interval = setInterval(() => {
        charPos++
        if (charPos <= text.length) {
          setTypedPlaceholder(text.slice(0, charPos))
        }
        if (charPos >= text.length) {
          clearInterval(interval)
          setTimeout(() => {
            setPlaceholderIndex(prev => (prev + 1) % IMAGE_PLACEHOLDER_TEXTS.length)
          }, 2000)
        }
      }, 20)
    }
    startTyping()
    return () => clearInterval(interval)
  }, [placeholderIndex, IMAGE_PLACEHOLDER_TEXTS.length])

  const handleLogout = () => {
    removeApiKey()
    removeUserInfo()
    removeUserRole()
    removeSchoolName()
    removeEnterpriseName()
    window.location.href = "/"
  }

  const handlePersonaSelect = (persona: any) => {
    setSelectedPersona(persona)
  }

  const handleDiscontinueAccount = async () => {
    const confirmDelete = window.confirm(
      "Are you sure you want to discontinue your account? All your chats, custom personas, and settings will be permanently deleted. This action cannot be undone."
    )
    if (!confirmDelete) return
    try {
      const { discontinueAccount } = await import("@/lib/chat-api")
      await discontinueAccount()
      toast.success("Account deleted successfully.")
      handleLogout()
    } catch (error: any) {
      toast.error(error.message || "Failed to delete account. Please try again.")
    }
  }

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }
    handleResize()
    setIsSidebarCollapsed(window.innerWidth < 768)
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])
  
  // Fetch assets and galleries from backend
  const fetchAssets = useCallback(async () => {
    const fetchWithRetry = async (
      fn: () => Promise<any>,
      retries = 2
    ) => {
      for (let i = 0; i <= retries; i++) {
        try {
          return await fn()
        } catch (err: any) {
          const msg = err?.message?.toLowerCase() || ""
          const isAuthError = msg.includes("auth") || msg.includes("unavail") || msg.includes("401") || msg.includes("unauthorized")
          if (i < retries && isAuthError) {
            await new Promise(r => setTimeout(r, 1000 * (i + 1)))
            continue
          }
          throw err
        }
      }
      throw new Error("Max retries exceeded")
    }

    let hasError = false
    try {
      const [data, pubData, galleriesData, pubGalleriesData, likesCountsData] = await Promise.all([
        fetchWithRetry(() => getLibraryAssets()).catch((err: any) => { hasError = true; return null }),
        fetchWithRetry(() => getPublicLibraryAssets(1, PUBLIC_PAGE_SIZE)).catch((err: any) => { hasError = true; return null }),
        fetchWithRetry(() => getLibraryGalleries()).catch((err: any) => { hasError = true; return null }),
        fetchWithRetry(() => getPublicLibraryGalleries()).catch((err: any) => { hasError = true; return null }),
        fetchWithRetry(() => getLikesCounts()).catch((err: any) => { return null }),
      ])
      if (data) setAssets(data.assets)
      if (pubData && pubData.assets) {
        publicAssetsCacheRef.current = pubData.assets
        const slice = pubData.assets.slice(0, PUBLIC_PAGE_SIZE)
        setPublicAssets(slice)
        const isPaginationSupported = pubData.hasMore === true || pubData.assets.length === PUBLIC_PAGE_SIZE
        const hasMorePages = isPaginationSupported ? (pubData.hasMore ?? false) : false
        setHasMorePublic(hasMorePages)
        setPublicAssetsPage(1)
      }
      if (galleriesData) setGalleries(galleriesData.galleries)
      if (pubGalleriesData) setPublicGalleries(pubGalleriesData.galleries)
      if (likesCountsData && likesCountsData.counts) {
        setLikesCountsMap(likesCountsData.counts)
      }
      if (hasError) {
        toast.error("Some library data failed to load. Refresh to try again.")
      }
    } catch (err: any) {
      const msg = err?.message?.toLowerCase() || ""
      if (msg.includes("auth") || msg.includes("unavail") || msg.includes("401") || msg.includes("unauthorized")) {
        toast.error("Auth service unavailable. Redirecting to login...")
        setTimeout(() => router.replace("/auth/login"), 1500)
      } else {
        toast.error(err.message || "Failed to load image library.")
      }
    } finally {
      setIsLoading(false)
    }
  }, [router])

  // Load more public assets for infinite scroll
  const loadMorePublicAssets = useCallback(async () => {
    if (isLoadingMorePublic || !hasMorePublic) return
    setIsLoadingMorePublic(true)
    try {
      const cached = publicAssetsCacheRef.current
      if (cached.length > PUBLIC_PAGE_SIZE) {
        // Backend doesn't support pagination — serve from cache
        const nextCount = Math.min(cached.length, publicAssets.length + PUBLIC_PAGE_SIZE)
        setPublicAssets(cached.slice(0, nextCount))
        if (nextCount >= cached.length) setHasMorePublic(false)
      } else {
        // Backend supports pagination — fetch next page
        const nextPage = publicAssetsPage + 1
        const pubData = await getPublicLibraryAssets(nextPage, PUBLIC_PAGE_SIZE)
        if (pubData && pubData.assets) {
          publicAssetsCacheRef.current = [...publicAssetsCacheRef.current, ...pubData.assets]
          setPublicAssets((prev) => [...prev, ...pubData.assets])
          setPublicAssetsPage(nextPage)
          setHasMorePublic(pubData.hasMore ?? false)
        }
      }
    } catch {
      // silently fail - user can scroll again to retry
    } finally {
      setIsLoadingMorePublic(false)
    }
  }, [isLoadingMorePublic, hasMorePublic, publicAssetsPage, publicAssets.length])

  // Fetch more public assets when visible count exceeds pool
  useEffect(() => {
    if (activeCategory !== "featured") return
    if (!hasMorePublic || isLoadingMorePublic || publicAssets.length === 0) return
    if (visibleCount > publicAssets.length * 2) {
      loadMorePublicAssets()
    }
  }, [visibleCount, activeCategory, hasMorePublic, isLoadingMorePublic, publicAssets.length, loadMorePublicAssets])

  // Initialize Auth & fetch saved IDs from DB
  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace("/auth/login")
      return
    }
    fetchAssets()
    
    // Fetch saved asset IDs from DB
    getSavedAssetIds().then(setSavedIds).catch(() => {})
  }, [fetchAssets, router])

  // Close expanded modal or lightbox on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isLightboxOpen) {
          setIsLightboxOpen(false)
        } else if (expandedAsset) {
          setExpandedAsset(null)
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [expandedAsset, isLightboxOpen])

  // Fetch social metadata when modal opens
  useEffect(() => {
    if (!expandedAsset) {
      setComments([])
      setLikesCount(0)
      setIsLiked(false)
      setCreatorInfo({ name: "AWEDICT", avatar: null })
      return
    }

    let isSubscribed = true
    setSocialLoading(true)

    getAssetSocial(expandedAsset.id)
      .then((res) => {
        if (!isSubscribed) return
        if (res.success) {
          setLikesCount(res.likes_count)
          setIsLiked(res.is_liked)
          setComments(res.comments || [])
          setCreatorInfo(res.owner || { name: "AWEDICT", avatar: null })
        }
      })
      .catch((err) => {
        console.error("Failed to load asset social data:", err)
      })
      .finally(() => {
        if (isSubscribed) setSocialLoading(false)
      })

    return () => {
      isSubscribed = false
    }
  }, [expandedAsset])

  const handleToggleLike = async () => {
    if (!expandedAsset) return
    const prevLiked = isLiked
    const prevCount = likesCount
    const updatedCount = prevLiked ? Math.max(0, prevCount - 1) : prevCount + 1

    // Optimistically update UI states
    setIsLiked(!prevLiked)
    setLikesCount(updatedCount)
    setLikesCountsMap((prev) => ({ ...prev, [expandedAsset.id]: updatedCount }))
    setAssets((prev) => prev.map((a) => a.id === expandedAsset.id ? { ...a, likes_count: updatedCount, is_liked: !prevLiked } : a))
    setPublicAssets((prev) => prev.map((a) => a.id === expandedAsset.id ? { ...a, likes_count: updatedCount, is_liked: !prevLiked } : a))

    try {
      if (prevLiked) {
        await unlikeAsset(expandedAsset.id)
        toast.success("Removed from Saved")
        // Also update local saved ids
        setSavedIds((prev) => prev.filter((id) => id !== expandedAsset.id))
      } else {
        await likeAsset(
          expandedAsset.id,
          expandedAsset.asset_type || "image",
          expandedAsset.asset_url || "",
          expandedAsset.prompt || ""
        )
        toast.success("Saved to Library for 5 days")
        // Also update local saved ids
        if (!savedIds.includes(expandedAsset.id)) {
          setSavedIds((prev) => [...prev, expandedAsset.id])
        }
      }
    } catch (err: any) {
      // Revert optimistic updates on error
      setIsLiked(prevLiked)
      setLikesCount(prevCount)
      setLikesCountsMap((prev) => ({ ...prev, [expandedAsset.id]: prevCount }))
      setAssets((prev) => prev.map((a) => a.id === expandedAsset.id ? { ...a, likes_count: prevCount, is_liked: prevLiked } : a))
      setPublicAssets((prev) => prev.map((a) => a.id === expandedAsset.id ? { ...a, likes_count: prevCount, is_liked: prevLiked } : a))
      toast.error(err.message || "Failed to update like status")
    }
  }

  const handleReplyClick = (commentId: any, targetUsername: string) => {
    setReplyToComment({ id: commentId, user_name: targetUsername })
    setNewCommentText(`@${targetUsername} `)
    const commentInput = document.getElementById("comment-input-field")
    if (commentInput) commentInput.focus()
  }

  const buildReplyTree = (comment: any) => {
    const replies = comment.replies || []
    const rootNodes: any[] = []
    const nodeMap: { [username: string]: any } = {}

    replies.forEach((reply: any) => {
      const node = { ...reply, replies: [] }
      const match = reply.content.match(/^@([^\s:]+)/)
      const mentionedUser = match ? match[1] : null

      if (mentionedUser && mentionedUser !== comment.user_name && nodeMap[mentionedUser]) {
        const parentNode = nodeMap[mentionedUser]
        parentNode.replies.push(node)
      } else {
        rootNodes.push(node)
      }
      nodeMap[reply.user_name] = node
    })

    return rootNodes
  }

  const handleAddComment = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!expandedAsset || !newCommentText.trim()) return

    const commentContent = newCommentText.trim()
    setNewCommentText("")
    const parentId = replyToComment?.id || null

    try {
      const res = await addAssetComment(expandedAsset.id, commentContent, parentId)
      if (res.success && res.comment) {
        if (parentId) {
          setComments((prev) =>
            prev.map((c) =>
              c.id === parentId
                ? { ...c, replies: [...(c.replies || []), res.comment] }
                : c
            )
          )
        } else {
          setComments((prev) => [...prev, res.comment])
        }
        toast.success("Reply added!")
      }
      setReplyToComment(null)
    } catch (err: any) {
      toast.error(err.message || "Failed to post comment")
    }
  }

  // Load and poll notifications
  useEffect(() => {
    if (!isAuthenticated()) return

    const fetchNotifs = () => {
      getNotifications()
        .then((res) => {
          if (res.success && res.notifications) {
            setNotifications(res.notifications)
          }
        })
        .catch((err) => {
          console.error("Failed to fetch notifications:", err)
        })
    }

    fetchNotifs()
    const interval = setInterval(fetchNotifs, 15000)
    return () => clearInterval(interval)
  }, [])

  // Poll for image generation status from Chat
  useEffect(() => {
    const checkStatus = () => {
      if (typeof window === "undefined") return;
      const status = localStorage.getItem("image_gen_status");
      const timestamp = localStorage.getItem("image_gen_timestamp");
      if (status && timestamp) {
        const age = Date.now() - Number(timestamp);
        if (age < 30000) {
          setGenerationStatus(status as "idle" | "generating" | "completed");
          if (status === "completed") {
            setHasNewGeneration(true);
            fetchAssets();
          }
        } else {
          setGenerationStatus("idle");
        }
      }
    };
    checkStatus();
    const interval = setInterval(checkStatus, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleNotificationClick = async (notif: SocialNotification) => {
    try {
      setShowNotificationPanel(false)
      
      // Mark as read in DB
      if (!notif.is_read) {
        await markNotificationAsRead(notif.id)
        setNotifications(prev =>
          prev.map(n => (n.id === notif.id ? { ...n, is_read: true } : n))
        )
      }

      // Fetch target asset and open detailed modal
      const res = await getSingleAsset(notif.asset_id)
      if (res.success && res.asset) {
        setExpandedAsset(res.asset)
      } else {
        toast.error("Failed to load asset details")
      }
    } catch (err: any) {
      console.error("Failed to open notification asset:", err)
      toast.error("Asset not found or access denied")
    }
  }

  // Voice Input Speech-to-Text handlers
  const startRecording = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setStream(mediaStream);
      const mediaRecorder = new MediaRecorder(mediaStream);
      mediaRecorderRef.current = mediaRecorder;
      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });

        if (audioBlob.size < 1000) {
          toast.error("Recording too short. Please try again.");
          return;
        }

        try {
          toast.promise(
            (async () => {
              const { transcribeSpeech } = await import("@/lib/chat-api");
              const transcript = await transcribeSpeech(audioBlob);
              if (transcript) {
                setGeneratePrompt(prev => prev + (prev ? " " : "") + transcript);
                return "Speech converted to text";
              }
              throw new Error("No transcript received");
            })(),
            {
              loading: 'Transcribing speech...',
              success: (data) => data,
              error: (err) => `STT Error: ${err.message}`,
            }
          );
        } catch (err: any) {
          console.error("STT Process Error:", err);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Recording error:", err);
      toast.error("Could not access microphone");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }
    }
  };

  // Handle AI Image Generation
  const handleGenerateImage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!generatePrompt.trim()) return
    if (isGenerating) return

    setIsGenerating(true)
    setGenerationStatus("generating")
    if (typeof window !== "undefined") {
      localStorage.setItem("image_gen_status", "generating")
      localStorage.setItem("image_gen_timestamp", String(Date.now()))
    }
    setActiveCategory("all")
    const toastId = toast.loading("Generating your image...")

    try {
      console.log(`[Library] Requesting image generation for prompt: "${generatePrompt}"`)
      
      const payload = {
        endpoint: "/features/image/generate",
        messages: [{ role: "user" as const, content: generatePrompt }],
        modality: "image_gen"
      }
      
      const res: any = await sendAiRequest(payload)
      
      if (res && res.response) {
        toast.success("Image generated and saved to library!", { id: toastId })
        setGeneratePrompt("")
        setGenerationStatus("completed")
        setHasNewGeneration(true)
        if (typeof window !== "undefined") {
          localStorage.setItem("image_gen_status", "completed")
          localStorage.setItem("image_gen_timestamp", String(Date.now()))
        }
        
        // Refresh local assets to show the new image
        await fetchAssets()
        
        // Get the newly created asset ID from response
        const newAssetId = res?.asset_id || (assets.length > 0 ? assets[0].id : null)
        if (newAssetId) {
          setGeneratedAssetId(newAssetId)
          setShowCategoryModal(true)
        }
        
        // Switch to "all" (My Private Gallery) to show the new asset immediately
        setActiveCategory("all")
      } else {
        throw new Error("No image was returned from the server.")
      }
    } catch (err: any) {
      console.error("[Library] Generation error:", err)
      toast.error(err.message || "Failed to generate image.", { id: toastId })
      setGenerationStatus("idle")
      if (typeof window !== "undefined") {
        localStorage.setItem("image_gen_status", "idle")
        localStorage.setItem("image_gen_timestamp", String(Date.now()))
      }
    } finally {
      setIsGenerating(false)
      setTimeout(() => {
        setGenerationStatus("idle")
        if (typeof window !== "undefined") {
          localStorage.setItem("image_gen_status", "idle")
          localStorage.setItem("image_gen_timestamp", String(Date.now()))
        }
      }, 5000)
    }
  }

  // Handle Deleting Asset
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this asset from your library?")) return
    setDeletingId(id)
    try {
      if (id.startsWith("feat-")) {
        toast.success("Curated asset hidden from view.")
      } else if (id.startsWith("uploaded-")) {
        setUploadedAssets((prev) => prev.filter((a) => a.id !== id))
        toast.success("Uploaded asset removed.")
      } else {
        await deleteLibraryAsset(id)
        setAssets((prev) => prev.filter((a) => a.id !== id))
        setPublicAssets((prev) => prev.filter((a) => a.id !== id))
        toast.success("Asset deleted successfully.")
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to delete asset.")
    } finally {
      setDeletingId(null)
    }
  }

  // Toggling Visibility (Public / Personal) on Backend
  const handleToggleVisibility = async (id: string, currentPublic: boolean) => {
    setTogglingVisibilityId(id)
    const targetPublic = !currentPublic
    try {
      if (id.startsWith("feat-") || id.startsWith("uploaded-")) {
        if (id.startsWith("uploaded-")) {
          setUploadedAssets((prev) =>
            prev.map((a) => (a.id === id ? { ...a, is_public: targetPublic } : a))
          )
        }
        toast.success(`Mock visibility set to ${targetPublic ? "Public Showcase" : "Private Library"}.`)
      } else {
        await toggleAssetVisibility(id, targetPublic)
        setAssets((prev) =>
          prev.map((a) => (a.id === id ? { ...a, is_public: targetPublic } : a))
        )
        const pubData = await getPublicLibraryAssets()
        setPublicAssets(pubData.assets)
        toast.success(`Asset is now ${targetPublic ? "Public" : "Private"}.`)
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to update visibility.")
    } finally {
      setTogglingVisibilityId(null)
    }
  }

  // Toggling Saved (DB-backed)
  const toggleSaved = async (asset: LibraryAsset) => {
    const id = asset.id
    if (savedIds.includes(id)) {
      try {
        await unlikeAsset(id)
        setSavedIds((prev) => prev.filter((sId) => sId !== id))
        
        const updatedCount = Math.max(0, (likesCountsMap[id] ?? asset.likes_count ?? 0) - 1)
        setLikesCountsMap((prev) => ({ ...prev, [id]: updatedCount }))
        
        setAssets((prev) => prev.map((a) => a.id === id ? { ...a, likes_count: updatedCount, is_liked: false } : a))
        setPublicAssets((prev) => prev.map((a) => a.id === id ? { ...a, likes_count: updatedCount, is_liked: false } : a))
        
        if (expandedAsset && expandedAsset.id === id) {
          setIsLiked(false)
          setLikesCount(updatedCount)
        }
        
        toast.success("Removed from Saved.")
      } catch {
        toast.error("Failed to unsave.")
      }
    } else {
      try {
        await likeAsset(id, asset.asset_type, asset.asset_url, asset.prompt || "")
        setSavedIds((prev) => [...prev, id])
        
        const updatedCount = (likesCountsMap[id] ?? asset.likes_count ?? 0) + 1
        setLikesCountsMap((prev) => ({ ...prev, [id]: updatedCount }))
        
        setAssets((prev) => prev.map((a) => a.id === id ? { ...a, likes_count: updatedCount, is_liked: true } : a))
        setPublicAssets((prev) => prev.map((a) => a.id === id ? { ...a, likes_count: updatedCount, is_liked: true } : a))
        
        if (expandedAsset && expandedAsset.id === id) {
          setIsLiked(true)
          setLikesCount(updatedCount)
        }
        
        toast.success("Saved!")
      } catch {
        toast.error("Failed to save.")
      }
    }
  }

  // Copy another user's asset to personal library
  const handleCopyToLibrary = async (asset: LibraryAsset) => {
    const id = asset.id
    try {
      // Optimistically add to savedIds
      setSavedIds((prev) => prev.includes(id) ? prev : [...prev, id])

      // Optimistically add to personal assets list
      const tempNewAsset: LibraryAsset = {
        ...asset,
        is_public: false
      }
      setAssets((prev) => {
        if (prev.some(a => a.id === id)) return prev
        return [tempNewAsset, ...prev]
      })

      // Instantly show success toast
      toast.success("Saved to your library!")

      // Fire backend request in parallel
      await copyAssetToLibrary(asset.id, asset.asset_type, asset.asset_url, asset.prompt || "")
      
      // Update in background to ensure database sync
      fetchAssets().catch((err) => console.error("Background copy sync failed:", err))

    } catch (err: any) {
      toast.error(err.message || "Failed to save to library")
      // Revert on failure
      setSavedIds((prev) => prev.filter((sId) => sId !== id))
      setAssets((prev) => prev.filter((a) => a.id !== id))
    }
  }

  // Download image to device
  const handleDownloadImage = async (url: string, filename = "image") => {
    try {
      const res = await fetch(url)
      const blob = await res.blob()
      const blobUrl = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = blobUrl
      a.download = `${filename}.${blob.type.split("/")[1] || "jpg"}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(blobUrl)
    } catch {
      window.open(url, "_blank")
    }
  }

  // Download all images in a gallery as a single ZIP file
  const handleDownloadGalleryAsZip = async (assetsList: LibraryAsset[], galleryName = "gallery") => {
    if (assetsList.length === 0) {
      toast.error("No images to download.");
      return;
    }
    
    const toastId = toast.loading(`Creating ZIP of ${assetsList.length} images...`);
    
    try {
      const zip = new JSZip();
      
      const downloadPromises = assetsList.map(async (asset, index) => {
        const imageUrl = getAssetImageUrl(asset);
        try {
          const res = await fetch(imageUrl);
          if (!res.ok) throw new Error(`HTTP error ${res.status}`);
          const blob = await res.blob();
          
          let ext = blob.type.split("/")[1] || "jpg";
          if (ext.includes("+") || ext.length > 4) ext = "png";
          
          const filename = `image_${index + 1}.${ext}`;
          zip.file(filename, blob);
        } catch (err) {
          console.error(`Failed to include image ${asset.id} in ZIP:`, err);
        }
      });
      
      await Promise.all(downloadPromises);
      
      const content = await zip.generateAsync({ type: "blob" });
      const blobUrl = URL.createObjectURL(content);
      
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `${galleryName.replace(/[^a-zA-Z0-9]/g, "_")}_images.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
      
      toast.success("ZIP download complete!", { id: toastId });
    } catch (err) {
      console.error("ZIP creation failed:", err);
      toast.error("Failed to download ZIP file.", { id: toastId });
    }
  }

  // Share image via clipboard (reliable for all asset types)
  const handleShareImage = async (url: string, title = "Library Image") => {
    try {
      await navigator.clipboard.writeText(url)
      toast.success("Link copied to clipboard.")
    } catch {
      toast.error("Could not copy link.")
    }
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  // Filter helper functions
  const handleCycleCreatedOn = () => {
    const options: ("all" | "today" | "week" | "month")[] = ["all", "today", "week", "month"]
    const nextIndex = (options.indexOf(createdOnFilter) + 1) % options.length
    setCreatedOnFilter(options[nextIndex])
  }

  const handleCycleSource = () => {
    const options: ("all" | "personal" | "community")[] = ["all", "personal", "community"]
    const nextIndex = (options.indexOf(sourceFilter) + 1) % options.length
    setSourceFilter(options[nextIndex])
  }

  const handleCategoryAssign = async () => {
    const finalCategory = pendingCategory || customCategory.trim()
    if (!generatedAssetId || !finalCategory) return
    try {
      await updateAssetCategory(generatedAssetId, finalCategory)
      setShowCategoryModal(false)
      setPendingCategory(null)
      setGeneratedAssetId(null)
      setCustomCategory("")
      await fetchAssets()
      toast.success(`Image categorized as "${finalCategory}"`)

      // If custom category (not in preset list), save to localStorage for filter dropdown
      if (!ASSET_CATEGORIES.includes(finalCategory)) {
        setCustomCategoryList((prev) => {
          if (prev.includes(finalCategory)) return prev
          const updated = [...prev, finalCategory]
          if (typeof window !== "undefined") {
            localStorage.setItem("library_custom_categories", JSON.stringify(updated))
          }
          return updated
        })
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to assign category")
    }
  }

  const handleCopyPrompt = (promptText: string, id: string) => {
    navigator.clipboard.writeText(promptText)
    setCopiedId(id)
    toast.success("Prompt copied to clipboard!")
    setTimeout(() => setCopiedId(null), 2000)
  }

  // Create custom new database-backed gallery/folder
  const handleCreateGallery = async () => {
    const name = prompt("Enter new gallery/folder name:")
    if (!name || !name.trim()) return
    try {
      const isPublic = confirm("Do you want to make this gallery public to the community?")
      const data = await createLibraryGallery(name.trim(), isPublic)
      setGalleries((prev) => [data.gallery, ...prev])
      toast.success(`Gallery "${data.gallery.name}" created successfully.`)
    } catch (err: any) {
      toast.error(err.message || "Failed to create gallery.")
    }
  }

  // Rename a custom gallery
  const handleRenameGallery = async (id: string, currentName: string) => {
    const newName = prompt("Enter new name for the gallery:", currentName)
    if (!newName || !newName.trim() || newName.trim() === currentName) return
    try {
      const data = await updateLibraryGallery(id, { name: newName.trim() })
      setGalleries((prev) => prev.map((g) => (g.id === id ? data.gallery : g)))
      toast.success(`Gallery renamed to "${newName.trim()}"`)
    } catch (err: any) {
      toast.error(err.message || "Failed to rename gallery.")
    }
  }

  // Delete a custom gallery
  const handleDeleteGallery = async (id: string) => {
    if (!confirm("Are you sure you want to delete this gallery? Assets inside will remain in your library but won't be in this folder anymore.")) return
    try {
      await deleteLibraryGallery(id)
      setGalleries((prev) => prev.filter((g) => g.id !== id))
      // Update local assets that were in this gallery to have null gallery_id
      setAssets((prev) => prev.map((a) => (a.gallery_id === id ? { ...a, gallery_id: null } : a)))
      setActiveCategory("all")
      setSelectedGalleryId(null)
      toast.success("Gallery deleted successfully.")
    } catch (err: any) {
      toast.error(err.message || "Failed to delete gallery.")
    }
  }

  // Toggle Gallery Visibility (lock/globe)
  const handleToggleGalleryVisibility = async (id: string, currentPublic: boolean) => {
    const targetPublic = !currentPublic
    try {
      const data = await updateLibraryGallery(id, { is_public: targetPublic })
      setGalleries((prev) => prev.map((g) => (g.id === id ? data.gallery : g)))
      // Update all assets belonging to this gallery locally
      setAssets((prev) => prev.map((a) => (a.gallery_id === id ? { ...a, is_public: targetPublic } : a)))
      
      const pubData = await getPublicLibraryAssets()
      setPublicAssets(pubData.assets)
      const pubGalleriesData = await getPublicLibraryGalleries()
      setPublicGalleries(pubGalleriesData.galleries)

      toast.success(`Gallery "${data.gallery.name}" is now ${targetPublic ? "Public" : "Private"}.`)
    } catch (err: any) {
      toast.error(err.message || "Failed to toggle gallery visibility.")
    }
  }

  // Assign an asset to a gallery
  const handleMoveAssetToGallery = async (assetId: string, galleryId: string | null) => {
    try {
      const allPossibleAssets = [...assets, ...publicAssets, ...uploadedAssets, ...publicGalleryAssets, ...FEATURED_ASSETS];
      const asset = allPossibleAssets.find(a => a.id === assetId);

      // Determine visibility based on target gallery
      let targetPublic = false;
      if (galleryId) {
        const g = galleries.find((g) => g.id === galleryId)
        if (g) targetPublic = g.is_public
      }

      const isNewSave = !assets.some((a) => a.id === assetId)

      // Optimistically update personal assets list
      if (isNewSave && asset) {
        const tempNewAsset: LibraryAsset = {
          ...asset,
          gallery_id: galleryId,
          is_public: galleryId ? targetPublic : asset.is_public
        }
        setAssets((prev) => [tempNewAsset, ...prev])
      } else {
        setAssets((prev) => prev.map((a) => (a.id === assetId ? { ...a, gallery_id: galleryId, is_public: galleryId ? targetPublic : a.is_public } : a)))
      }

      // Optimistically update public assets visibility
      setPublicAssets((prev) => prev.map((a) => (a.id === assetId ? { ...a, gallery_id: galleryId, is_public: galleryId ? targetPublic : a.is_public } : a)))

      // Optimistically update gallery asset counts
      setGalleries((prev) => prev.map((g) => {
        const wasInG = assets.find(a => a.id === assetId)?.gallery_id === g.id
        const isNowInG = galleryId === g.id
        let diff = 0
        if (wasInG && !isNowInG) diff = -1
        if (!wasInG && isNowInG) diff = 1
        if (diff !== 0) {
          return { ...g, asset_count: Math.max(0, (g.asset_count || 0) + diff) }
        }
        return g
      }))

      // Instantly show success toast message
      if (isNewSave) {
        toast.success("Image saved to gallery.")
      } else {
        toast.success(galleryId ? "Image added to gallery folder." : "Image removed from gallery folder.")
      }

      // Fire backend request in parallel without blocking UI thread
      await assignAssetToGallery(assetId, galleryId, asset?.asset_type, asset?.asset_url, asset?.prompt || "")
      
      // Update in background to ensure database IDs sync (e.g. for copied explore assets)
      fetchAssets().catch((err) => console.error("Background sync failed:", err))

    } catch (err: any) {
      toast.error(err.message || "Failed to move image.")
      // Revert/sync with database on failure
      fetchAssets().catch((err) => console.error("Rollback sync failed:", err))
    }
  }

  // Fetch Public Gallery Assets when clicking a shared gallery in community view
  const fetchPublicGalleryAssetsCallback = useCallback(async (galleryId: string) => {
    setIsFetchingPublicGalleryAssets(true)
    try {
      const data = await getPublicGalleryAssets(galleryId)
      setPublicGalleryAssets(data.assets)
    } catch (err: any) {
      toast.error(err.message || "Failed to load public gallery images.")
    } finally {
      setIsFetchingPublicGalleryAssets(false)
    }
  }, [])

  // Handle URL parameter deep links (?asset=xxx and ?gallery=xxx) and localStorage expand requests on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const expandAssetId = localStorage.getItem("expand_asset_id");
      if (expandAssetId) {
        localStorage.removeItem("expand_asset_id");
        getSingleAsset(expandAssetId)
          .then((res) => {
            if (res.success && res.asset) {
              setExpandedAsset(res.asset);
            }
          })
          .catch((err) => {
            console.error("Failed to expand asset from notification:", err);
          });
      }

      const params = new URLSearchParams(window.location.search);
      const assetParam = params.get("asset");
      const galleryParam = params.get("gallery");

      if (assetParam) {
        getSingleAsset(assetParam)
          .then((res) => {
            if (res.success && res.asset) {
              setExpandedAsset(res.asset);
            }
          })
          .catch((err) => {
            console.error("Failed to load asset from URL parameter:", err);
          });
      }

      if (galleryParam) {
        getLibraryGalleries()
          .then((res) => {
            if (res.success && res.galleries.some(g => g.id === galleryParam)) {
              setSelectedGalleryId(galleryParam);
              setActiveCategory("gallery");
            } else {
              getPublicLibraryGalleries()
                .then((pubRes) => {
                  if (pubRes.success && pubRes.galleries.some(g => g.id === galleryParam)) {
                    setSelectedPublicGalleryId(galleryParam);
                    setActiveCategory("public_gallery");
                    fetchPublicGalleryAssetsCallback(galleryParam);
                  }
                });
            }
          })
          .catch(() => {});
      }
    }
  }, [fetchPublicGalleryAssetsCallback])

  // Simulated drag and drop uploads
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsUploadDragging(true); }
  const handleDragLeave = () => setIsUploadDragging(false)
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsUploadDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      const reader = new FileReader()
      reader.onload = (event) => {
        if (event.target && event.target.result) {
          const newAsset: LibraryAsset = {
            id: `uploaded-${Date.now()}`,
            asset_type: "image",
            asset_url: event.target.result as string,
            prompt: `Uploaded file: ${file.name}. Simulated prompt description: Deep focus high contrast photograph of ${file.name.split(".")[0]}, organic textures, atmospheric lighting.`,
            is_public: false,
            created_at: new Date().toISOString()
          }
          setUploadedAssets((prev) => [newAsset, ...prev])
          toast.success(`"${file.name}" added to uploads.`)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      const reader = new FileReader()
      reader.onload = (event) => {
        if (event.target && event.target.result) {
          const newAsset: LibraryAsset = {
            id: `uploaded-${Date.now()}`,
            asset_type: "image",
            asset_url: event.target.result as string,
            prompt: `Uploaded asset: ${file.name}. Photorealistic rendering with volumetric haze.`,
            is_public: false,
            created_at: new Date().toISOString()
          }
          setUploadedAssets((prev) => [newAsset, ...prev])
          toast.success("Asset added to uploads.")
        }
      }
      reader.readAsDataURL(file)
    }
  }

  // Use Prompt action
  const handleLoadPromptToComposer = () => {
    if (!searchQuery.trim()) return
    toast.success("Prompt copied to clipboard. Paste in chat workspace!")
    navigator.clipboard.writeText(searchQuery.trim())
  }

  // Check if asset is created by current user
  const isCreatedByMe = (asset: LibraryAsset) => {
    if (asset.id.startsWith("feat-")) return false;
    if (asset.id.startsWith("uploaded-")) return true;
    return assets.some((a) => a.id === asset.id);
  }

  // ── Filtered Assets calculation ──
  const activeAssets = useMemo(() => {
    let pool: LibraryAsset[] = []
    switch (activeCategory) {
      case "featured": {
        const combined = [...FEATURED_ASSETS, ...publicAssets];
        const sorted = combined.sort((a, b) => {
          const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
          return dateB - dateA;
        });
        if (sorted.length === 0) {
          pool = [];
        } else if (sorted.length < FEATURED_INITIAL_BATCH) {
          const result: LibraryAsset[] = [];
          let cycle = 0;
          while (result.length < FEATURED_INITIAL_BATCH) {
            const remaining = FEATURED_INITIAL_BATCH - result.length;
            const shuffled = seededShuffle(sorted, cycle);
            result.push(...shuffled.slice(0, Math.min(remaining, shuffled.length)));
            cycle++;
          }
          pool = result;
        } else {
          pool = sorted;
        }
        break;
      }
      case "recent": pool = assets.slice(0, 4); break
      case "public_showcase": pool = publicAssets.filter((asset) => asset.gallery_id === null); break
      case "uploads": pool = uploadedAssets; break
      case "saved": {
        const combined = [...FEATURED_ASSETS, ...assets, ...uploadedAssets, ...publicAssets, ...publicGalleryAssets];
        const unique = Array.from(new Map(combined.map(item => [item.id, item])).values());
        pool = unique.filter((asset) => savedIds.includes(asset.id));
        break;
      }
      case "gallery": pool = assets.filter((asset) => asset.gallery_id === selectedGalleryId); break
      case "public_gallery": pool = publicGalleryAssets; break
      case "all": default: pool = [...uploadedAssets, ...assets]; break
    }

    // Apply Personal/Community filter
    if (sourceFilter === "personal") {
      pool = pool.filter((asset) => !asset.id.startsWith("feat-") && (isCreatedByMe(asset) || !asset.is_public));
    } else if (sourceFilter === "community") {
      pool = pool.filter((asset) => asset.id.startsWith("feat-") || asset.is_public);
    }

    // Apply Created On filter
    if (createdOnFilter !== "all") {
      const now = new Date();
      pool = pool.filter((asset) => {
        if (!asset.created_at) return false;
        const assetDate = new Date(asset.created_at);
        const diffTime = Math.abs(now.getTime() - assetDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (createdOnFilter === "today") return diffDays <= 1;
        if (createdOnFilter === "week") return diffDays <= 7;
        if (createdOnFilter === "month") return diffDays <= 30;
        return true;
      });
    }

    // Apply Category filter
    if (categoryFilter !== "all") {
      pool = pool.filter((asset) => asset.category === categoryFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      pool = pool.filter((asset) => asset.prompt?.toLowerCase().includes(q))
    }
    return pool
  }, [activeCategory, assets, publicAssets, uploadedAssets, savedIds, searchQuery, selectedGalleryId, publicGalleryAssets, sourceFilter, createdOnFilter, categoryFilter, visibleCount])

  // Check if all currently visible images in activeAssets have loaded (either success or broken)
  const visibleAssets = useMemo(() => {
    return activeAssets.slice(0, visibleCount)
  }, [activeAssets, visibleCount])

  const allVisibleLoaded = useMemo(() => {
    if (visibleAssets.length === 0) return true
    return visibleAssets.every(asset => loadedImages.has(asset.id) || brokenImages.has(asset.id))
  }, [visibleAssets, loadedImages, brokenImages])

  const targetInitialCount = Math.min(6, activeAssets.length)
  const loadedInitialCount = activeAssets.slice(0, targetInitialCount).filter(asset => loadedImages.has(asset.id) || brokenImages.has(asset.id)).length
  const isInitialBatchLoading = activeAssets.length > 0 && loadedInitialCount < targetInitialCount

  // Generic infinite scroll for all categories: only appends next batch if the current visible images are fully loaded
  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && allVisibleLoaded) {
          setVisibleCount((prev) => prev + FEATURED_BATCH_SIZE)
        }
      },
      { rootMargin: "150px" }
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [activeCategory, activeAssets.length, allVisibleLoaded])

  // Reset visible count and loaded images set when filter, category, or gallery folder changes
  useEffect(() => {
    setVisibleCount(FEATURED_INITIAL_BATCH)
    setLoadedImages(new Set())
  }, [activeCategory, searchQuery, createdOnFilter, sourceFilter, selectedGalleryId, selectedPublicGalleryId, exploreTab])

  const getCardAspectRatioClass = (index: number, idxInCol?: number, colIdx?: number) => {
    switch (aspectRatio) {
      case "16:9": return "aspect-[16/9]"
      case "9:16": return "aspect-[9/16]"
      default: {
        // Balanced Staggered Heights: Alternate 3:4 and 1:1 based on column and row
        if (idxInCol !== undefined && colIdx !== undefined) {
          return (idxInCol + colIdx) % 2 === 0 ? "aspect-[3/4]" : "aspect-[1/1]";
        }
        if (index % 3 === 0) return "aspect-[3/4]"
        if (index % 3 === 1) return "aspect-[1/1]"
        return "aspect-[2/3]"
      }
    }
  }


  // Creator handle mock generator
  const getCreatorHandle = (assetId: string) => {
    if (assetId.startsWith("feat-1")) return "jiwoodanielhyun"
    if (assetId.startsWith("feat-2")) return "papercraft_neons"
    if (assetId.startsWith("feat-3")) return "macro_bug_lens"
    if (assetId.startsWith("feat-4")) return "al.tr"
    return "@my_space"
  }

  // Likes count mock generator
  const getLikesCount = (asset: LibraryAsset | string) => {
    const assetId = typeof asset === "string" ? asset : asset.id;
    if (likesCountsMap[assetId] !== undefined) {
      return String(likesCountsMap[assetId]);
    }
    if (typeof asset !== "string" && asset.likes_count !== undefined) {
      return String(asset.likes_count);
    }
    return "0";
  }

  const getBentoSpanClass = (index: number) => {
    const pattern = index % 7;
    if (pattern === 0) return "md:col-span-2 md:row-span-1";
    if (pattern === 3) return "md:col-span-1 md:row-span-2";
    return "md:col-span-1 md:row-span-1";
  }



  const renderCard = (asset: LibraryAsset, i: number, spanClass?: string) => {
    return (
      <BentoGridItem
        key={`${asset.id}-${i}`}
        className={cn(
          "p-0 overflow-hidden rounded-none bg-transparent border-none dark:bg-transparent shadow-none hover:shadow-none transition-none w-full h-[220px] md:h-full min-h-[14rem]",
          spanClass
        )}
        header={
          <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            transition={{ duration: 0.35, ease: "easeOut", delay: Math.min(i * 0.02, 0.2) }}
            className={`relative overflow-hidden group/card rounded-none border transition-all duration-300 w-full h-full ${
              isDarkMode ? "bg-[#0d0d0c] border-white/5 text-white" : "bg-[#f4f3f2] border-black/5 text-black"
            }`}
            onMouseEnter={() => setHoveredId(asset.id)}
            onMouseLeave={() => setHoveredId(null)}
          >
            {brokenImages.has(asset.id) ? (
              <div className="w-full h-full flex items-center justify-center cursor-pointer bg-black/10" onClick={() => setExpandedAsset(asset)}>
                <div className="text-center p-4">
                  <ImageIcon className={`h-8 w-8 mx-auto mb-2 ${isDarkMode ? "text-white/20" : "text-black/20"}`} />
                  <p className={`text-[10px] font-mono ${isDarkMode ? "text-white/30" : "text-black/30"}`}>Image unavailable</p>
                </div>
              </div>
            ) : (
              <>
                {!loadedImages.has(asset.id) && !brokenImages.has(asset.id) && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/5 dark:bg-white/5 animate-pulse">
                    <Loader2 className={`h-6 w-6 animate-spin ${isDarkMode ? "text-white/25" : "text-black/25"}`} />
                  </div>
                )}
                <img
                  src={getAssetImageUrl(asset)}
                  alt={asset.prompt || "Concept visual"}
                  className={cn(
                    "w-full h-full object-cover transition-all duration-700 ease-out group-hover/card:scale-110 cursor-pointer",
                    loadedImages.has(asset.id) ? "opacity-100 scale-100" : "opacity-0 scale-95"
                  )}
                  loading="lazy"
                  onClick={() => setExpandedAsset(asset)}
                  onLoad={() => setLoadedImages(prev => {
                    const next = new Set(prev);
                    next.add(asset.id);
                    return next;
                  })}
                  onError={() => {
                    setBrokenImages(prev => new Set(prev).add(asset.id));
                    setLoadedImages(prev => {
                      const next = new Set(prev);
                      next.add(asset.id);
                      return next;
                    });
                  }}
                />
              </>
            )}

            {/* Bottom Info Overlay - Premium Glassmorphism */}
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between z-20 pointer-events-none transition-all duration-300 group-hover/card:opacity-0 group-hover/card:translate-y-2">
              {/* Creator tag */}
              <div className="px-2 py-1 bg-black/40 backdrop-blur-md rounded-lg border border-white/10 flex items-center gap-1.5">
                <div className={`w-1.5 h-1.5 rounded-full ${i % 2 === 0 ? "bg-cyan-400" : "bg-purple-400"}`}></div>
                <span className="text-[10px] font-medium text-white/90 select-none truncate max-w-[100px]">
                  {getCreatorHandle(asset.id)}
                </span>
              </div>
            </div>

            {/* Hover Content Overlay */}
            <div
              onClick={() => setExpandedAsset(asset)}
              className={`absolute inset-0 bg-black/40 backdrop-blur-xl opacity-0 group-hover/card:opacity-100 flex flex-col justify-end p-5 transition-all duration-500 ease-out translate-y-4 group-hover/card:translate-y-0 z-30 cursor-pointer`}
            >
              {/* Like Count / Save Button on Top Left of Hover Overlay */}
              <div className="absolute top-3 left-3 z-40">
                <motion.button
                  whileTap={{ scale: 0.8 }}
                  whileHover={{ scale: 1.1 }}
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleSaved(asset); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-black/60 hover:bg-black/85 backdrop-blur-md rounded-xl border border-white/10 text-white/95 cursor-pointer shadow-lg transition-all"
                  title={savedIds.includes(asset.id) ? "Unlike" : "Like & Save"}
                >
                  <motion.div
                    animate={{ scale: savedIds.includes(asset.id) ? [1, 1.45, 1.15] : 1 }}
                    transition={{ type: "spring", stiffness: 600, damping: 15 }}
                  >
                    <Heart className={`h-4.5 w-4.5 transition-all ${savedIds.includes(asset.id) ? "fill-red-500 text-red-500" : ""}`} />
                  </motion.div>
                  <span className="text-xs font-bold select-none leading-none">
                    {getLikesCount(asset)}
                  </span>
                </motion.button>
              </div>

              <p className="text-[9px] font-bold text-cyan-400 uppercase tracking-widest mb-1.5">Prompt Detail</p>
              <p className="text-xs font-medium leading-relaxed text-white/90 line-clamp-3 mb-4">
                {asset.prompt || "No prompt description available for this visual concept."}
              </p>

              <div className="flex items-center justify-between pt-3 border-t border-white/10">
                <div className="flex items-center gap-3">
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleShareImage(`${window.location.origin}/library?asset=${asset.id}`, asset.prompt || "Library Image"); }}
                    className="text-white/60 hover:text-cyan-400 transition-colors cursor-pointer"
                    title="Share"
                  >
                    <Share2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleCopyPrompt(asset.prompt || "", asset.id); }}
                    className={`transition-colors cursor-pointer ${copiedId === asset.id ? "text-emerald-400" : "text-white/60 hover:text-cyan-400"}`}
                    title="Copy Prompt"
                  >
                    {copiedId === asset.id ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDownloadImage(getAssetImageUrl(asset), asset.id); }}
                    className="text-white/60 hover:text-cyan-400 transition-colors cursor-pointer"
                    title="Download"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                  {isCreatedByMe(asset) && (
                    <button
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDelete(asset.id); }}
                      className="text-white/60 hover:text-red-400 transition-colors cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Visibility status & Move action - Top Right Overlay */}
            <div
              className={`absolute top-3 right-3 flex items-center gap-1.5 transition-all duration-300 z-40 ${
                hoveredId === asset.id ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2 pointer-events-none"
              }`}
            >
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setMoveAssetId(asset.id); setIsMoveModalOpen(true); }}
                className="p-1.5 rounded-lg bg-black/60 border border-white/10 text-white/70 hover:text-white hover:bg-black/80 transition-all cursor-pointer shadow-lg backdrop-blur-sm"
                title="Move to Folder"
              >
                <Move className="h-3.5 w-3.5" />
              </button>

              {isCreatedByMe(asset) && (
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleToggleVisibility(asset.id, asset.is_public); }}
                  disabled={togglingVisibilityId === asset.id}
                  className={`p-1.5 rounded-lg bg-black/60 border border-white/10 text-white/70 hover:text-white hover:bg-black/80 transition-all cursor-pointer shadow-lg backdrop-blur-sm ${
                    asset.is_public ? "text-cyan-400" : ""
                  }`}
                  title={asset.is_public ? "Make Private" : "Make Public"}
                >
                  {togglingVisibilityId === asset.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : asset.is_public ? (
                    <Globe className="h-3.5 w-3.5" />
                  ) : (
                    <Lock className="h-3.5 w-3.5" />
                  )}
                </button>
              )}
            </div>
          </motion.div>
        }
      />
    )
  }

  return (
    <div className={`${chatHeadingFont.variable} ${chatBodyFont.variable} ${chatAccentFont.variable} chat-shell h-screen w-full flex overflow-hidden transition-colors duration-500 selection:bg-[var(--color-cyan)] selection:text-black ${
      isDarkMode ? "bg-[#0d0d0c] text-white" : "bg-[#f4f3f2] text-black"
    }`}>
      
      {/* Mobile Sidebar Overlays */}
      {isMobile && !isSidebarCollapsed && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 transition-opacity duration-300"
          onClick={() => setIsSidebarCollapsed(true)}
        />
      )}

      {/* ================= LEFT SIDEBAR ================= */}
      <aside
        id="walkthrough-sidebar"
        style={{ width: isSidebarCollapsed ? (isMobile ? "0px" : "72px") : (isMobile ? "280px" : `${sidebarWidth}px`) }}
        className={`h-full border-r ${
          isSidebarCollapsed && isMobile ? "border-r-0" : isDarkMode ? "border-white/[0.07]" : "border-black/[0.07]"
        } ${isDarkMode ? "bg-gradient-to-b from-[#0d0d0c] via-[#0d0d0c] to-[#0a0a09]" : "bg-gradient-to-b from-[#f4f3f2] via-[#f4f3f2] to-[#efeeed]"} flex flex-col ${
          isMobile ? "fixed left-0 top-0 bottom-0 h-[100dvh] z-[60] shadow-2xl" : "relative z-20"
        } transition-[width] duration-300 ease-in-out`}
      >
        {isSidebarCollapsed && !isMobile ? (
          <div className="flex flex-col h-full items-center py-4 justify-between relative select-none">
            {/* Top Group */}
            <div className="flex flex-col items-center gap-5 w-full">
              {/* Toggle Button */}
              <motion.button
                onClick={() => setIsSidebarCollapsed(false)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className={`p-2 rounded-xl transition-colors cursor-pointer ${
                  isDarkMode
                    ? "text-white hover:bg-white/5"
                    : "text-black hover:bg-black/5"
                }`}
                title="Open Sidebar"
              >
                <PanelLeftOpen className="w-[22px] h-[22px]" />
              </motion.button>

              {/* Divider */}
              <div className={`w-8 border-t ${isDarkMode ? "border-white/[0.06]" : "border-black/[0.06]"}`} />

              {/* Explore */}
              <motion.button
                onClick={() => { setActiveCategory("featured"); setExploreTab("images"); setIsUploadDragging(false); }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className={`p-2 rounded-xl transition-colors cursor-pointer relative ${
                  activeCategory === "featured"
                    ? (isDarkMode ? "bg-white/[0.06] text-white" : "bg-black/[0.06] text-black")
                    : (isDarkMode ? "text-white hover:bg-white/[0.03]" : "text-black hover:bg-black/[0.03]")
                }`}
                title="Explore"
              >
                {activeCategory === "featured" && (
                  <span className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full ${isDarkMode ? "bg-white" : "bg-black"}`} />
                )}
                <Compass className="w-[22px] h-[22px]" />
              </motion.button>

              {/* Recent Creations */}
              <motion.button
                onClick={() => { setActiveCategory("recent"); setIsUploadDragging(false); }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className={`p-2 rounded-xl transition-colors cursor-pointer ${
                  activeCategory === "recent"
                    ? (isDarkMode ? "bg-white/[0.06] text-white" : "bg-black/[0.06] text-black")
                    : (isDarkMode ? "text-white hover:bg-white/[0.03]" : "text-black hover:bg-black/[0.03]")
                }`}
                title="Recent Creations"
              >
                <Clock className="w-[22px] h-[22px]" />
              </motion.button>

              {/* Saved */}
              <motion.button
                onClick={() => { setActiveCategory("saved"); setIsUploadDragging(false); }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className={`p-2 rounded-xl transition-colors cursor-pointer relative ${
                  activeCategory === "saved"
                    ? (isDarkMode ? "bg-white/[0.06] text-white" : "bg-black/[0.06] text-black")
                    : (isDarkMode ? "text-white hover:bg-white/[0.03]" : "text-black hover:bg-black/[0.03]")
                }`}
                title={`Saved (${savedIds.length})`}
              >
                <Bookmark className="w-[22px] h-[22px]" />
                {savedIds.length > 0 && (
                  <span className={`absolute -top-1 -right-1 text-[8px] font-mono font-bold h-4 w-4 rounded-full flex items-center justify-center ${activeCategory === "saved" ? (isDarkMode ? "bg-white/20 text-white" : "bg-black/20 text-black") : (isDarkMode ? "bg-white/10 text-white" : "bg-black/10 text-black")}`}>
                    {savedIds.length > 9 ? "9+" : savedIds.length}
                  </span>
                )}
              </motion.button>

              {/* My Gallery */}
              <motion.button
                onClick={() => { setActiveCategory("all"); setIsUploadDragging(false); setSelectedGalleryId(null); setHasNewGeneration(false); }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className={`p-2 rounded-xl transition-colors cursor-pointer ${
                  activeCategory === "all"
                    ? (isDarkMode ? "bg-white/[0.06] text-white" : "bg-black/[0.06] text-black")
                    : (isDarkMode ? "text-white hover:bg-white/[0.03]" : "text-black hover:bg-black/[0.03]")
                }`}
                title="My Gallery"
              >
                <ImageIcon className="w-[22px] h-[22px]" />
              </motion.button>
            </div>

            {/* Profile / Avatar Button */}
              <div className="mb-2 relative">
                <motion.button
                  onClick={() => setShowProfileDropup(!showProfileDropup)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`h-8 w-8 rounded-full overflow-hidden border-2 transition-all cursor-pointer relative shrink-0 flex items-center justify-center ${
                    showProfileDropup 
                      ? (isDarkMode ? "border-white/50" : "border-black/50")
                      : (isDarkMode ? "border-white/[0.06] hover:border-white/20" : "border-black/[0.06] hover:border-black/20")
                  }`}
                  title="Profile Options"
                >
                  {profilePic ? (
                    <img src={profilePic} alt="Profile" className="h-full w-full object-cover" />
                  ) : (
                    <div className={`h-full w-full flex items-center justify-center ${isDarkMode ? "bg-white/5" : "bg-black/5"}`}>
                      <User className={`h-4 w-4 ${isDarkMode ? "text-white" : "text-black"}`} />
                    </div>
                  )}
                </motion.button>

                {showProfileDropup && (
                  <div
                    ref={profileDropupRef}
                    className={`absolute bottom-0 left-[52px] w-56 z-[100] rounded-xl border p-1.5 shadow-2xl backdrop-blur-xl ${
                      isDarkMode
                        ? "bg-[#222120]/95 border-white/[0.06] text-white"
                        : "bg-[#f2f1f0]/95 border-black/[0.06] text-black"
                    }`}
                  >
                    <button
                      onClick={() => {
                        setShowProfileDropup(false);
                        setIsPersonalizationModalOpen(true);
                      }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs rounded-lg text-left transition-colors ${isDarkMode ? "hover:bg-white/5 text-white" : "hover:bg-black/5 text-black"
                        }`}
                    >
<User className="h-3.5 w-3.5" />
                      <span>Profile</span>
                    </button>

                    <button
                      onClick={() => {
                        setShowProfileDropup(false);
                        setIsWalletModalOpen(true);
                      }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs rounded-lg text-left transition-colors ${isDarkMode ? "hover:bg-white/5 text-white" : "hover:bg-black/5 text-black"
                        }`}
                    >
                      <Wallet className="h-3.5 w-3.5" />
                      <span>Wallet</span>
                    </button>

                    <div className={`my-1 h-px ${isDarkMode ? "bg-white/5" : "bg-black/5"}`} />

                    <button
                      onClick={handleLogout}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs rounded-lg text-left text-red-500 transition-colors ${isDarkMode ? "hover:bg-red-500/10" : "hover:bg-red-500/5"
                        }`}
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
              <div className="flex items-center gap-2.5 cursor-pointer select-none" onClick={() => window.location.href = "/"}>
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
              <motion.button
                onClick={() => setIsSidebarCollapsed(true)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${isDarkMode ? "text-white hover:bg-white/5" : "text-black hover:bg-black/5"}`}
                title="Collapse Sidebar"
              >
                <PanelLeftClose className="w-4 h-4" />
              </motion.button>
            </div>
            
            {/* Sidebar Menu Items */}
            <div className={`flex-1 overflow-y-auto scrollbar-hide p-3 flex flex-col gap-5 ${isDarkMode ? "custom-scrollbar text-white" : "light-scrollbar text-black"}`}>
              {/* Explore Section */}
                <div className="space-y-1">
                  
                  <button
                    onClick={() => { setActiveCategory("featured"); setExploreTab("images"); setIsUploadDragging(false); if (isMobile) setIsSidebarCollapsed(true); }}
                    className={`group flex items-center justify-between w-full rounded-xl px-3 py-2.5 transition-all text-[14px] relative overflow-hidden ${
                      activeCategory === "featured"
                        ? (isDarkMode ? "bg-white/[0.06] text-white" : "bg-black/[0.06] text-black font-semibold")
                        : (isDarkMode ? "text-white hover:bg-white/[0.03]" : "text-black hover:bg-black/[0.03]")
                    }`}
                  >
                    {activeCategory === "featured" && (
                      <span className={`absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full ${isDarkMode ? "bg-white" : "bg-black"}`} />
                    )}
                    <div className="flex items-center gap-3 min-w-0">
                      <Compass className={`h-[18px] w-[18px] flex-shrink-0 transition-all duration-200 ${
                        activeCategory === "featured" ? (isDarkMode ? "text-white" : "text-black") : ""
                      }`} />
                      <span className={`truncate ${activeCategory === "featured" ? "font-semibold" : "font-medium"}`}>Explore</span>
                    </div>
                    {activeCategory === "featured" && (
                      <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded-md ${isDarkMode ? "bg-white/5 text-white" : "bg-black/5 text-black"}`}>New</span>
                    )}
                  </button>

                  <button
                    onClick={() => { setActiveCategory("recent"); setIsUploadDragging(false); if (isMobile) setIsSidebarCollapsed(true); }}
                    className={`group flex items-center justify-between w-full rounded-xl px-3 py-2.5 transition-all text-[14px] relative overflow-hidden ${
                      activeCategory === "recent"
                        ? (isDarkMode ? "bg-white/[0.06] text-white" : "bg-black/[0.06] text-black font-semibold")
                        : (isDarkMode ? "text-white hover:bg-white/[0.03]" : "text-black hover:bg-black/[0.03]")
                    }`}
                  >
                    {activeCategory === "recent" && (
                      <span className={`absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full ${isDarkMode ? "bg-white" : "bg-black"}`} />
                    )}
                    <div className="flex items-center gap-3 min-w-0">
                      <Clock className={`h-[18px] w-[18px] flex-shrink-0 transition-all duration-200 ${
                        activeCategory === "recent" ? (isDarkMode ? "text-white" : "text-black") : ""
                      }`} />
                      <span className={`truncate ${activeCategory === "recent" ? "font-semibold" : "font-medium"}`}>Recent Creations</span>
                    </div>
                  </button>

                  <button
                    onClick={() => { setActiveCategory("saved"); setIsUploadDragging(false); if (isMobile) setIsSidebarCollapsed(true); }}
                    className={`group flex items-center justify-between w-full rounded-xl px-3 py-2.5 transition-all text-[14px] relative overflow-hidden ${
                      activeCategory === "saved"
                        ? (isDarkMode ? "bg-white/[0.06] text-white" : "bg-black/[0.06] text-black font-semibold")
                        : (isDarkMode ? "text-white hover:bg-white/[0.03]" : "text-black hover:bg-black/[0.03]")
                    }`}
                  >
                    {activeCategory === "saved" && (
                      <span className={`absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full ${isDarkMode ? "bg-white" : "bg-black"}`} />
                    )}
                    <div className="flex items-center gap-3 min-w-0">
                      <Bookmark className={`h-[18px] w-[18px] flex-shrink-0 transition-all duration-200 ${
                        activeCategory === "saved" ? (isDarkMode ? "text-white" : "text-black") : ""
                      }`} />
                      <span className={`truncate ${activeCategory === "saved" ? "font-semibold" : "font-medium"}`}>Saved</span>
                    </div>
                    {savedIds.length > 0 && (
                      <span className={`text-[11px] font-mono font-bold px-1.5 min-w-[22px] h-[20px] flex items-center justify-center rounded-full flex-shrink-0 ${
                        activeCategory === "saved"
                          ? (isDarkMode ? "bg-white/20 text-white" : "bg-black/20 text-black")
                          : (isDarkMode ? "bg-white/5 text-white" : "bg-black/5 text-black")
                      }`}>
                        {savedIds.length}
                      </span>
                    )}
                  </button>
                </div>

              {/* Library Section */}
              <div className="space-y-1">
                <div className="flex items-center justify-between px-3 pb-1">
                  <span className={`text-[10px] font-bold font-mono uppercase tracking-[0.22em] ${isDarkMode ? "text-white/40" : "text-black/40"}`}>
                    Personal Workspace
                  </span>
                  <button onClick={handleCreateGallery} className={`transition-all duration-200 p-0.5 ${isDarkMode ? "text-white hover:bg-white/5" : "text-black hover:bg-black/5"} rounded-lg`} title="Create Folder">
                    <FolderPlus className="h-[18px] w-[18px]" />
                  </button>
                </div>

                <button
                  onClick={() => { setActiveCategory("all"); setIsUploadDragging(false); setSelectedGalleryId(null); if (isMobile) setIsSidebarCollapsed(true); }}
                  className={`group flex items-center justify-between w-full rounded-xl px-3 py-2.5 transition-all text-[14px] relative overflow-hidden ${
                    activeCategory === "all"
                      ? (isDarkMode ? "bg-white/[0.06] text-white" : "bg-black/[0.06] text-black font-semibold")
                      : (isDarkMode ? "text-white hover:bg-white/[0.03]" : "text-black hover:bg-black/[0.03]")
                  }`}
                >
                  {activeCategory === "all" && (
                    <span className={`absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full ${isDarkMode ? "bg-white" : "bg-black"}`} />
                  )}
                  <div className="flex items-center gap-3 min-w-0">
                    <ImageIcon className={`h-[18px] w-[18px] flex-shrink-0 transition-all duration-200 ${
                      activeCategory === "all" ? (isDarkMode ? "text-white" : "text-black") : ""
                    }`} />
                    <span className={`truncate ${activeCategory === "all" ? "font-semibold" : "font-medium"}`}>My Gallery</span>
                  </div>
                </button>
              </div>

              {/* Custom Database Galleries list */}
              <div className="space-y-1">
                <div className={`text-[10px] font-bold font-mono uppercase tracking-[0.22em] px-3 pb-1 ${isDarkMode ? "text-white/40" : "text-black/40"}`}>
                  Custom Folders
                </div>
                {galleries.length === 0 ? (
                  <span className={`text-[11px] italic px-3 py-1.5 block ${isDarkMode ? "text-white" : "text-black"}`}>
                    No folders created yet.
                  </span>
                ) : (
                  galleries.map((g) => {
                    const isSelected = activeCategory === "gallery" && selectedGalleryId === g.id;
                    return (
                      <button
                        key={g.id}
                        onClick={() => {
                          setSelectedGalleryId(g.id);
                          setActiveCategory("gallery");
                          setIsUploadDragging(false);
                          if (isMobile) setIsSidebarCollapsed(true);
                        }}
                        className={`group flex items-center justify-between w-full rounded-xl px-3 py-2.5 transition-all text-[14px] relative overflow-hidden ${
                          isSelected
                            ? (isDarkMode ? "bg-white/[0.06] text-white" : "bg-black/[0.06] text-black font-semibold")
                            : (isDarkMode ? "text-white hover:bg-white/[0.03]" : "text-black hover:bg-black/[0.03]")
                        }`}
                      >
                        {isSelected && (
                          <span className={`absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full ${isDarkMode ? "bg-white" : "bg-black"}`} />
                        )}
                        <div className="flex items-center gap-3 min-w-0 truncate">
                          {isSelected ? (
                            <FolderOpen className={`h-[18px] w-[18px] flex-shrink-0 transition-all duration-200 ${
                              isSelected ? (isDarkMode ? "text-white" : "text-black") : ""
                            }`} />
                          ) : (
                            <Folder className={`h-[18px] w-[18px] flex-shrink-0 transition-all duration-200 ${
                              isSelected ? (isDarkMode ? "text-white" : "text-black") : ""
                            }`} />
                          )}
                          <span className={`truncate ${isSelected ? "font-semibold" : "font-medium"}`}>{g.name}</span>
                        </div>
                        
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <span className={`text-[11px] font-mono font-bold min-w-[22px] h-[20px] flex items-center justify-center rounded-full px-1.5 ${
                            isSelected
                              ? (isDarkMode ? "bg-white/20 text-white" : "bg-black/20 text-black")
                              : (isDarkMode ? "bg-white/5 text-white" : "bg-black/5 text-black")
                          }`}>{g.asset_count || 0}</span>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>

            </div>
            
            {/* Footer & User Profile */}
            <div className={`p-4 border-t ${isDarkMode ? "border-white/[0.06] bg-gradient-to-t from-[#0d0d0c] to-transparent" : "border-black/[0.06] bg-gradient-to-t from-[#f4f3f2] to-transparent"} flex flex-col gap-3 relative shrink-0`}>
              {showProfileDropup && (
                <div
                  ref={profileDropupRef}
                  className={`absolute bottom-[68px] left-4 right-4 z-[100] rounded-xl border p-1.5 shadow-2xl ${isDarkMode
                      ? "bg-[#222120]/95 border-white/10 text-white"
                      : "bg-[#f2f1f0]/95 border-black/10 text-black"
                    }`}
                >
                  {/* Personalization Option */}
                  <button
                    onClick={() => {
                      setShowProfileDropup(false);
                      setIsPersonalizationModalOpen(true);
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs rounded-lg text-left transition-colors ${isDarkMode ? "hover:bg-white/5 text-white" : "hover:bg-black/5 text-black"
                      }`}
                  >
                    <User className="h-3.5 w-3.5" />
                    <span>Profile</span>
                  </button>

                  {/* Wallet Option */}
                  <button
                    onClick={() => {
                      setShowProfileDropup(false);
                      setIsWalletModalOpen(true);
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs rounded-lg text-left transition-colors ${isDarkMode ? "hover:bg-white/5 text-white" : "hover:bg-black/5 text-black"
                      }`}
                  >
                    <Wallet className="h-3.5 w-3.5" />
                    <span>Wallet</span>
                  </button>

                  {/* Divider */}
                  <div className={`my-1 h-px ${isDarkMode ? "bg-white/5" : "bg-black/5"}`} />

                  {/* Logout Option */}
                  <button
                    onClick={handleLogout}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs rounded-lg text-left text-red-500 transition-colors ${isDarkMode ? "hover:bg-red-500/10" : "hover:bg-red-500/5"
                      }`}
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span>Logout</span>
                  </button>
                </div>
              )}

              <div id="walkthrough-profile-area" className="flex items-center justify-between">
                <motion.button
                  onClick={() => setShowProfileDropup(!showProfileDropup)}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="flex items-center gap-2 min-w-0 text-left cursor-pointer hover:opacity-80 transition-opacity"
                  title="Profile Options"
                >
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center relative shrink-0 ${isDarkMode ? "bg-white/5 border-white/10" : "bg-black/5 border-black/10"} border overflow-hidden`}>
                    {profilePic ? (
                      <img src={profilePic} alt="Profile" className="h-full w-full object-cover" />
                    ) : (
                      <User className={`h-4 w-4 ${isDarkMode ? "text-white" : "text-black"}`} />
                    )}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className={`text-[11px] font-bold truncate ${isDarkMode ? "text-white" : "text-black"}`}>{userName || userEmail || "User"}</span>
                    <span className={`text-[9px] font-mono uppercase tracking-widest ${isDarkMode ? "text-white" : "text-black"}`}>{userRole === "school_admin" ? "Admin" : userRole === "faculty" ? "Faculty" : userRole === "enterprise_admin" ? "Admin" : userRole === "manager" ? "Manager" : userRole === "global_admin" ? "Admin" : (subscription?.subscription?.plan_name?.toLowerCase().includes("agency") || subscription?.subscription?.plan_name?.toLowerCase().includes("heavy duty") ? "Agency" : subscription?.subscription?.plan_name || "Free Trial")}</span>
                  </div>
                </motion.button>
                <div className="flex items-center gap-1.5">
                  <motion.button
                    onClick={() => {
                      setSettingsPanel("general");
                      setIsSettingsModalOpen(true);
                    }}
                    whileHover={{ scale: 1.1, rotate: 30 }}
                    whileTap={{ scale: 0.9 }}
                    title="Settings"
                    className={`p-1.5 rounded-lg border transition-colors ${isDarkMode
                        ? "border-white/10 text-white hover:bg-white/5"
                        : "border-black/10 text-black hover:bg-black/5"
                      }`}
                  >
                    <Settings className="h-3.5 w-3.5" />
                  </motion.button>
                  <Link
                    href="/pricing"
                    className={`p-1.5 rounded-lg border transition-colors flex items-center gap-1 text-[10px] font-semibold cursor-pointer ${
                      isDarkMode
                        ? "border-white/10 text-white hover:bg-white/5"
                        : "border-black/10 text-black hover:bg-black/5"
                    }`}
                  >
                    <Zap className="h-3.5 w-3.5" />
                    <span>Upgrade</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </aside>

        {/* Right Content Pane */}
        <div className="flex-1 flex flex-col relative h-full overflow-hidden">
          
          {/* Navbar styled like Chat Navbar */}
          <header className={`h-16 flex-shrink-0 flex items-center justify-between px-6 md:px-10 relative z-30 transition-colors duration-500 border-b ${isDarkMode ? "bg-[#0d0d0c] border-white/5" : "bg-[#f4f3f2] border-black/5"}`}>
            <div className="flex items-center gap-3">
              {/* Mobile Sidebar Toggle */}
              {isMobile && (
                <motion.button
                  onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className={`p-2 border rounded-xl transition-all cursor-pointer ${
                    isDarkMode ? "border-white/10 text-white hover:bg-white/5" : "border-black/10 text-black hover:bg-black/5"
                  }`}
                  title="Toggle Sidebar"
                >
                  <Menu className="h-4 w-4" />
                </motion.button>
              )}
              
              <div className={`flex items-center gap-1 p-0.5 rounded-xl border text-xs font-medium transition-all duration-200 ${isDarkMode ? "border-white/10" : "border-black/10"}`}>
                <button
                  onClick={() => window.location.href = "/chat"}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all duration-200 cursor-pointer ${isDarkMode ? "text-white/50 hover:text-white" : "text-black/50 hover:text-black"}`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Query Mode</span>
                </button>
                <button
                  onClick={() => window.location.href = "/library"}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all duration-200 cursor-pointer ${isDarkMode ? "bg-white/10 text-white shadow-sm" : "bg-black/10 text-black shadow-sm"}`}
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Image Mode</span>
                </button>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Quick Tour Button */}
              <motion.button
                onClick={() => setShowWalkthrough(true)}
                className={`p-2 border rounded-full transition-all duration-200 flex items-center justify-center cursor-pointer overflow-hidden relative ${isDarkMode
                    ? "border-white/10 bg-white/5 text-white hover:bg-white/10 hover:border-white/20"
                    : "border-black/10 bg-black/5 text-black hover:bg-black/10 hover:border-black/20"
                  }`}
                title="Start Tour"
              >
                <motion.div
                  whileHover={{
                    scale: 1.1,
                    y: [0, -1, 1, -1, 0],
                    transition: { y: { repeat: Infinity, duration: 0.15, ease: "linear" } }
                  }}
                  whileTap={{ x: [0, -6, 35], transition: { duration: 0.4, ease: "easeInOut" } }}
                  className="flex items-center justify-center"
                >
                  <Car className="h-4 w-4 opacity-70" />
                </motion.div>
              </motion.button>

              {/* Notification Bell */}
              <div className="relative" ref={notificationPanelRef}>
                <motion.button
                  onClick={() => setShowNotificationPanel(prev => !prev)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className={`p-2 border rounded-full transition-all duration-200 flex items-center justify-center cursor-pointer relative ${isDarkMode
                      ? "border-white/10 bg-white/5 text-white hover:bg-white/10 hover:border-white/20"
                      : "border-black/10 bg-black/5 text-black hover:bg-black/10 hover:border-black/20"
                    }`}
                  title="Notifications"
                >
                  <Bell className="h-4 w-4" />
                  {(hasNewGeneration || generationStatus === "generating" || notifications.some(n => !n.is_read)) && (
                    <span className={`absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-white dark:ring-[#0d0d0c] ${
                      generationStatus === "generating" ? "bg-yellow-400" : "bg-red-500"
                    }`} />
                  )}
                </motion.button>

                {/* Notification Dropdown Panel */}
                {showNotificationPanel && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className={`absolute right-0 top-full mt-2 w-72 rounded-xl border shadow-2xl overflow-hidden z-50 ${
                      isDarkMode
                        ? "bg-[#222120]/95 border-white/10 text-white"
                        : "bg-[#f2f1f0]/95 border-black/10 text-black"
                    }`}
                  >
                    <div className="p-3 space-y-2">
                      <div className={`text-[10px] font-mono uppercase tracking-widest ${isDarkMode ? "text-white/40" : "text-black/40"}`}>
                        Notifications
                      </div>
                      <div className={`h-px ${isDarkMode ? "bg-white/5" : "bg-black/5"}`} />

                      {/* Social Notifications */}
                      {notifications.length > 0 && (
                        <div className="max-h-60 overflow-y-auto space-y-1.5 custom-scrollbar pr-1">
                          {notifications.map((notif) => (
                            <button
                              key={notif.id}
                              onClick={() => handleNotificationClick(notif)}
                              className={`w-full flex items-start gap-2.5 px-2.5 py-2 rounded-lg text-left transition-colors text-xs relative ${
                                notif.is_read
                                  ? (isDarkMode ? "hover:bg-white/5" : "hover:bg-black/5")
                                  : (isDarkMode ? "bg-white/[0.03] hover:bg-white/5 font-medium" : "bg-black/[0.03] hover:bg-black/5 font-medium")
                              }`}
                            >
                              <div className="h-7 w-7 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden flex items-center justify-center shrink-0 font-bold text-[10px] text-zinc-650 dark:text-zinc-350">
                                {notif.sender_avatar ? (
                                  <img src={notif.sender_avatar} className="h-full w-full object-cover" alt="" />
                                ) : (
                                  notif.sender_name.slice(0, 2).toUpperCase()
                                )}
                              </div>
                              <div className="flex-1 min-w-0 pr-2">
                                <p className="leading-tight text-zinc-900 dark:text-zinc-100">
                                  <span className="font-bold mr-1">{notif.sender_name}</span>
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
                      )}

                      {generationStatus === "generating" && (
                        <button
                          onClick={() => { setShowNotificationPanel(false); setActiveCategory("all"); }}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors text-xs ${
                            isDarkMode ? "hover:bg-white/5" : "hover:bg-black/5"
                          }`}
                        >
                          <Loader2 className="h-4 w-4 animate-spin shrink-0 text-yellow-400" />
                          <div className="min-w-0">
                            <div className="font-medium truncate">Generating image...</div>
                            <div className={`text-[10px] mt-0.5 truncate ${isDarkMode ? "text-white/40" : "text-black/40"}`}>
                              Click to view progress
                            </div>
                          </div>
                        </button>
                      )}
                      {generationStatus === "completed" && (
                        <button
                          onClick={() => { setShowNotificationPanel(false); setActiveCategory("all"); setHasNewGeneration(false); setGenerationStatus("idle"); if (typeof window !== "undefined") { localStorage.setItem("image_gen_status", "idle"); localStorage.setItem("image_gen_timestamp", String(Date.now())); } }}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors text-xs ${
                            isDarkMode ? "hover:bg-white/5" : "hover:bg-black/5"
                          }`}
                        >
                          <CheckCircle className="h-4 w-4 shrink-0 text-green-500" />
                          <div className="min-w-0">
                            <div className="font-medium truncate">Image created!</div>
                            <div className={`text-[10px] mt-0.5 truncate ${isDarkMode ? "text-white/40" : "text-black/40"}`}>
                              Click to view in My Gallery
                            </div>
                          </div>
                        </button>
                      )}
                      {generationStatus === "idle" && !hasNewGeneration && notifications.length === 0 && (
                        <div className={`px-3 py-6 text-center text-xs ${isDarkMode ? "text-white/30" : "text-black/30"}`}>
                          No notifications
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </div>

              <button
                onClick={toggleTheme}
                className={`p-2 border rounded-full transition-all duration-200 flex items-center justify-center cursor-pointer ${isDarkMode ? "border-white/10 bg-white/5 text-white hover:bg-white/10" : "border-black/10 bg-black/5 text-black hover:bg-black/10"}`}
              >
                {isDarkMode ? <Sun className="h-4 w-4 opacity-70" /> : <Moon className="h-4 w-4 opacity-70" />}
              </button>
            </div>
          </header>

          {/* ================= RIGHT MAIN CONTENT GRID ================= */}
          <main className={`flex-1 ${isInitialBatchLoading ? "overflow-hidden" : "overflow-y-auto"} px-4 md:px-8 py-6 md:py-8 pb-32 relative transition-colors duration-300 ${
            isDarkMode ? "bg-[#0d0d0c]" : "bg-[#f4f3f2]"
          }`}>
          
          {/* Header - Only for Folders/Shared Folders */}
          {(activeCategory === "gallery" || activeCategory === "public_gallery") && (
            <div className={`flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 mb-6 border-b pb-5 transition-colors duration-300 ${
              isDarkMode ? "border-white/5" : "border-black/5"
            }`}>
              <div>
                <div className={`flex items-center gap-2 text-[11px] font-mono tracking-widest uppercase mb-1 ${
                  isDarkMode ? "text-white/40" : "text-black/50"
                }`}>
                  <span>Rudra Library</span>
                  <ChevronRight className="h-3 w-3" />
                  <span className="text-[var(--color-cyan)] font-sans font-semibold normal-case tracking-normal">
                    {activeCategory === "gallery" && "Folder"}
                    {activeCategory === "public_gallery" && "Shared Folder"}
                  </span>
                </div>
                
                <div className="flex items-center gap-4">
                  <h1 className="text-2xl font-display font-semibold tracking-tight flex items-center gap-3">
                    {activeCategory === "gallery" && (
                      <>
                        <span>{galleries.find(g => g.id === selectedGalleryId)?.name || "Custom Folder"}</span>
                        {(() => {
                          const currentGallery = galleries.find(g => g.id === selectedGalleryId);
                          if (!currentGallery) return null;
                          return (
                              <div className="flex items-center gap-1.5 ml-2">
                                {/* Toggle visibility */}
                                <button
                                  onClick={() => handleToggleGalleryVisibility(currentGallery.id, currentGallery.is_public)}
                                  className={`p-1.5 rounded border transition-colors ${
                                    currentGallery.is_public
                                      ? "bg-sky-500/10 border-sky-400/20 text-sky-400 hover:bg-sky-500/20"
                                      : isDarkMode
                                        ? "bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white"
                                        : "bg-black/5 border-black/10 text-black/60 hover:bg-black/10 hover:text-black"
                                  }`}
                                  title={currentGallery.is_public ? "Set Gallery Private" : "Set Gallery Public"}
                                >
                                  {currentGallery.is_public ? (
                                    <Globe className="h-3.5 w-3.5" />
                                  ) : (
                                    <Lock className="h-3.5 w-3.5" />
                                  )}
                                </button>

                                {/* Rename */}
                                <button
                                  onClick={() => handleRenameGallery(currentGallery.id, currentGallery.name)}
                                  className={`p-1.5 rounded border transition-colors ${
                                    isDarkMode
                                      ? "bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white"
                                      : "bg-black/5 border-black/10 text-black/60 hover:bg-black/10 hover:text-black"
                                  }`}
                                  title="Rename Gallery"
                                >
                                  <Edit2 className="h-3.5 w-3.5" />
                                </button>

                                {/* Share Gallery */}
                                <button
                                  onClick={() => handleShareImage(
                                    `${window.location.origin}/library?gallery=${currentGallery.id}`,
                                    currentGallery.name
                                  )}
                                  className={`p-1.5 rounded border transition-colors ${
                                    isDarkMode
                                      ? "bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white"
                                      : "bg-black/5 border-black/10 text-black/60 hover:bg-black/10 hover:text-black"
                                  }`}
                                  title="Share Gallery"
                                >
                                  <Share2 className="h-3.5 w-3.5" />
                                </button>

                                {/* Save Gallery as ZIP */}
                                <button
                                  onClick={() => {
                                    const galleryAssetIds = assets.filter(a => a.gallery_id === currentGallery.id);
                                    handleDownloadGalleryAsZip(galleryAssetIds, currentGallery.name);
                                  }}
                                  className={`p-1.5 rounded border transition-colors ${
                                    isDarkMode
                                      ? "bg-white/5 border-white/10 text-white/60 hover:bg-emerald-500/80 hover:text-white"
                                      : "bg-black/5 border-black/10 text-black/60 hover:bg-emerald-500/80 hover:text-white"
                                  }`}
                                  title="Download All Images as ZIP"
                                >
                                  <Download className="h-3.5 w-3.5" />
                                </button>

                                {/* Delete */}
                                <button
                                  onClick={() => handleDeleteGallery(currentGallery.id)}
                                  className={`p-1.5 rounded border transition-colors ${
                                    isDarkMode
                                      ? "bg-white/5 border-white/10 text-white/60 hover:bg-red-500/80 hover:text-white"
                                      : "bg-black/5 border-black/10 text-black/60 hover:bg-red-500/80 hover:text-white"
                                  }`}
                                  title="Delete Gallery"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                          );
                        })()}
                      </>
                    )}
                    {activeCategory === "public_gallery" && (() => {
                      const currentPubGallery = publicGalleries.find(g => g.id === selectedPublicGalleryId);
                      if (!currentPubGallery) return null;
                      return (
                        <>
                          <span>{currentPubGallery.name}</span>
                          <span className="text-xs font-mono font-normal opacity-40 px-2 py-0.5 border border-white/10 bg-white/5 rounded-full ml-2">
                            by {currentPubGallery.owner_name || "Community User"}
                          </span>
                          <div className="flex items-center gap-1.5 ml-2">
                            {/* Share Public Gallery */}
                            <button
                              onClick={() => handleShareImage(
                                `${window.location.origin}/library?gallery=${currentPubGallery.id}`,
                                currentPubGallery.name
                              )}
                              className={`p-1.5 rounded border transition-colors ${
                                isDarkMode
                                  ? "bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white"
                                  : "bg-black/5 border-black/10 text-black/60 hover:bg-black/10 hover:text-black"
                              }`}
                              title="Share Folder Link"
                            >
                              <Share2 className="h-3.5 w-3.5" />
                            </button>

                            {/* Download Public Gallery ZIP */}
                            <button
                              onClick={() => {
                                handleDownloadGalleryAsZip(publicGalleryAssets, currentPubGallery.name);
                              }}
                              className={`p-1.5 rounded border transition-colors ${
                                isDarkMode
                                  ? "bg-white/5 border-white/10 text-white/60 hover:bg-emerald-500/80 hover:text-white"
                                  : "bg-black/5 border-black/10 text-black/60 hover:bg-emerald-500/80 hover:text-white"
                              }`}
                              title="Download All Images as ZIP"
                            >
                              <Download className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </>
                      );
                    })()}
                  </h1>
                </div>
              </div>

              {/* Back to Chat Option */}
              <div className="flex items-center gap-2 select-none">
                {/* Back to Showcase Folder view */}
                {activeCategory === "public_gallery" && (
                  <button
                    onClick={() => {
                      if (publicGallerySource === "featured") {
                        setActiveCategory("featured");
                        setExploreTab("folders");
                      } else {
                        setActiveCategory("public_showcase");
                        setShowcaseTab("galleries");
                      }
                      setSelectedPublicGalleryId(null);
                    }}
                    className={`flex items-center gap-2 px-4 py-2 border rounded-xl text-xs font-semibold uppercase tracking-wider transition-all duration-300 ${
                      isDarkMode
                        ? "bg-white/5 border-white/10 text-white hover:bg-white/10"
                        : "bg-white border-black/10 text-black hover:bg-black/[0.03] shadow-sm"
                    }`}
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    <span>Back to Folders</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Showcase Tabs */}
          {activeCategory === "public_showcase" && (
            <div className="mb-6 flex gap-2 p-1 bg-black/10 dark:bg-white/[0.03] border border-black/5 dark:border-white/[0.05] rounded-xl w-fit">
              <button
                onClick={() => setShowcaseTab("assets")}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold font-sans tracking-wide transition-all ${
                  showcaseTab === "assets"
                    ? (isDarkMode ? "bg-white/15 text-white shadow-sm" : "bg-black/10 text-black shadow-sm")
                    : (isDarkMode ? "text-white/45 hover:text-white/80" : "text-black/55 hover:text-black")
                }`}
              >
                Shared Prompts
              </button>
              <button
                onClick={() => setShowcaseTab("galleries")}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold font-sans tracking-wide transition-all flex items-center gap-1.5 ${
                  showcaseTab === "galleries"
                    ? (isDarkMode ? "bg-white/15 text-white shadow-sm" : "bg-black/10 text-black shadow-sm")
                    : (isDarkMode ? "text-white/45 hover:text-white/80" : "text-black/55 hover:text-black")
                }`}
              >
                <Folder className="h-3.5 w-3.5" />
                <span>Shared Folders</span>
              </button>
            </div>
          )}

          {/* ================= COMPACT FILTERS & SEARCH ROW ================= */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-6 pb-4 border-b border-white/5">
            {/* Left side: Filter pills */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Created On filter */}
              <button
                onClick={handleCycleCreatedOn}
                className={`px-3 py-1.5 rounded-full border text-xs font-sans font-medium tracking-wide transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${
                  isDarkMode
                    ? "border-white/10 bg-white/5 text-white hover:bg-white/10 hover:border-white/20"
                    : "border-black/10 bg-black/5 text-black hover:bg-black/10 hover:border-black/20"
                }`}
              >
                <Clock className="h-3.5 w-3.5" />
                <span>Created: {createdOnFilter === "all" ? "All Time" : createdOnFilter === "today" ? "Today" : createdOnFilter === "week" ? "Last 7 Days" : "Last 30 Days"}</span>
              </button>

              {/* Personal/Community filter */}
              <button
                onClick={handleCycleSource}
                className={`px-3 py-1.5 rounded-full border text-xs font-sans font-medium tracking-wide transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${
                  isDarkMode
                    ? "border-white/10 bg-white/5 text-white hover:bg-white/10 hover:border-white/20"
                    : "border-black/10 bg-black/5 text-black hover:bg-black/10 hover:border-black/20"
                }`}
              >
                <Globe className="h-3.5 w-3.5" />
                <span>Source: {sourceFilter === "all" ? "All" : sourceFilter === "personal" ? "Personal" : "Community"}</span>
              </button>

              {/* Category filter dropdown */}
              <div className="relative" ref={categoryDropdownRef}>
                <button
                  onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                  className={`px-3 py-1.5 rounded-full border text-xs font-sans font-medium tracking-wide transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${
                    isDarkMode
                      ? "border-white/10 bg-white/5 text-white hover:bg-white/10 hover:border-white/20"
                      : "border-black/10 bg-black/5 text-black hover:bg-black/10 hover:border-black/20"
                  }`}
                >
                  <Tag className="h-3.5 w-3.5" />
                  <span>Category: {categoryFilter === "all" ? "All" : categoryFilter}</span>
                  <ChevronDown className={`h-3 w-3 transition-transform ${showCategoryDropdown ? "rotate-180" : ""}`} />
                </button>

                {showCategoryDropdown && (
                  <div className={`absolute top-full left-0 mt-2 w-56 rounded-xl border shadow-lg z-50 overflow-hidden ${
                    isDarkMode ? "bg-[#1a1a1a] border-white/10" : "bg-white border-black/10"
                  }`}>
                    <div className="p-2">
                      <input
                        type="text"
                        placeholder="Search categories..."
                        value={categorySearch}
                        onChange={(e) => setCategorySearch(e.target.value)}
                        className={`w-full px-2.5 py-1.5 rounded-lg text-xs outline-none transition-all ${
                          isDarkMode
                            ? "bg-white/10 text-white placeholder-white/30 focus:bg-white/15"
                            : "bg-black/5 text-black placeholder-black/30 focus:bg-black/10"
                        }`}
                        autoFocus
                      />
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                      {["all", ...ASSET_CATEGORIES, ...customCategoryList]
                        .filter((cat) => cat === "all" || cat.toLowerCase().includes(categorySearch.toLowerCase()))
                        .map((cat) => (
                          <button
                            key={cat}
                            onClick={() => { setCategoryFilter(cat); setShowCategoryDropdown(false); setCategorySearch("") }}
                            className={`w-full text-left px-3 py-2 text-xs font-medium transition-all flex items-center gap-2 ${
                              categoryFilter === cat
                                ? isDarkMode
                                  ? "bg-white/10 text-white"
                                  : "bg-black/10 text-black"
                                : isDarkMode
                                  ? "text-white/60 hover:bg-white/5 hover:text-white"
                                  : "text-black/60 hover:bg-black/5 hover:text-black"
                            }`}
                          >
                            {cat === "all" ? (
                              <span>All Categories</span>
                            ) : (
                              <span>{cat}</span>
                            )}
                          </button>
                        ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Explore tab toggler (only in featured view) */}
              {activeCategory === "featured" && (
                <>
                  <button
                    onClick={() => setExploreTab("images")}
                    className={`px-3 py-1.5 rounded-full border text-xs font-sans font-medium tracking-wide transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${
                      exploreTab === "images"
                        ? isDarkMode
                          ? "bg-white/15 border-white/30 text-white"
                          : "bg-black/10 border-black/30 text-black"
                        : isDarkMode
                          ? "border-white/10 bg-white/5 text-white hover:bg-white/10 hover:border-white/20"
                          : "border-black/10 bg-black/5 text-black hover:bg-black/10 hover:border-black/20"
                    }`}
                  >
                    <ImageIcon className="h-3.5 w-3.5" />
                    <span>Images</span>
                  </button>
                  <button
                    onClick={() => setExploreTab("folders")}
                    className={`px-3 py-1.5 rounded-full border text-xs font-sans font-medium tracking-wide transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${
                      exploreTab === "folders"
                        ? isDarkMode
                          ? "bg-white/15 border-white/30 text-white"
                          : "bg-black/10 border-black/30 text-black"
                        : isDarkMode
                          ? "border-white/10 bg-white/5 text-white hover:bg-white/10 hover:border-white/20"
                          : "border-black/10 bg-black/5 text-black hover:bg-black/10 hover:border-black/20"
                    }`}
                  >
                    <Folder className="h-3.5 w-3.5" />
                    <span>Folder</span>
                  </button>
                </>
              )}
            </div>

            {/* Right side: Search Input */}
            <div className={`flex items-center border transition-all rounded-full px-3 py-1.5 w-full md:max-w-xs ${
              isDarkMode 
                ? "bg-[#222120] border-white/5 focus-within:border-white/10" 
                : "bg-white border-black/15 focus-within:border-black/30"
            }`}>
              <Search className={`h-3.5 w-3.5 mr-2 shrink-0 ${isDarkMode ? "text-white/30" : "text-black/60"}`} />
              <input
                type="text"
                placeholder="Search library prompts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full bg-transparent border-none text-xs focus:outline-none ${
                  isDarkMode ? "text-white placeholder-white/20" : "text-black placeholder-black/50"
                }`}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className={`p-1 shrink-0 ${isDarkMode ? "text-white/40 hover:text-white/80" : "text-black/40 hover:text-black/80"}`}
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>

          <div className="relative">
            {(activeCategory === "public_showcase" && showcaseTab === "galleries") || (activeCategory === "featured" && exploreTab === "folders") ? (
              /* Community Shared Galleries Grid view */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {publicGalleries.length === 0 ? (
                  <div className={`col-span-full flex flex-col items-center justify-center py-20 border rounded-2xl ${
                    isDarkMode ? "border-white/[0.04] bg-white/[0.01]" : "border-black/[0.04] bg-black/[0.01]"
                  }`}>
                    <Folder className={`h-10 w-10 mb-4 ${isDarkMode ? "text-white/10" : "text-black/15"}`} />
                    <p className="text-sm font-sans mb-1 font-semibold">No shared folders found</p>
                    <p className={`text-[11px] font-mono text-center max-w-sm px-5 leading-normal ${isDarkMode ? "text-white/20" : "text-black/40"}`}>
                      No folders/galleries have been marked as public by community members yet.
                    </p>
                  </div>
                ) : (
                  publicGalleries.map((g) => (
                    <motion.div
                      key={g.id}
                      className={`p-5 rounded-2xl border select-none transition-all duration-300 ${
                        isDarkMode
                          ? "bg-white/[0.02] border-white/5 hover:bg-white/[0.04] hover:border-white/10"
                          : "bg-white border-black/5 hover:border-black/10 shadow-sm"
                      }`}
                    >
                      <div
                        onClick={() => {
                          setSelectedPublicGalleryId(g.id);
                          setActiveCategory("public_gallery");
                          setPublicGallerySource(activeCategory === "featured" ? "featured" : "public_showcase");
                          fetchPublicGalleryAssetsCallback(g.id);
                        }}
                        className="cursor-pointer"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="p-3 bg-gradient-to-tr from-sky-500/20 to-sky-500/5 rounded-xl text-sky-400">
                            <FolderOpen className="h-6 w-6" />
                          </div>
                          <span className="text-[10px] font-mono px-2 py-0.5 bg-black/25 rounded-full flex items-center gap-1 text-sky-400">
                            <Globe className="h-2.5 w-2.5 text-sky-400" />
                            <span>Shared</span>
                          </span>
                        </div>
                        
                        <h3 className="font-display font-semibold text-sm mb-1 truncate">
                          {g.name}
                        </h3>
                        
                        <p className={`text-[10px] font-mono mb-4 ${isDarkMode ? "text-white/40" : "text-black/50"}`}>
                          Created by <strong>{g.owner_name || "Community User"}</strong>
                        </p>
                      </div>
 
                      <div className="flex items-center justify-between border-t border-white/5 pt-3">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-sky-400">
                            {g.asset_count || 0} image prompts
                          </span>
                          <button
                            onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(`${window.location.origin}/library?gallery=${g.id}`); toast.success("Folder link copied to clipboard."); }}
                            className={`p-1.5 rounded-lg border transition-all ${
                              isDarkMode
                                ? "bg-white/5 border-white/10 text-white/50 hover:text-emerald-400 hover:border-emerald-400/50"
                                : "bg-black/5 border-black/10 text-black/50 hover:text-emerald-600"
                            }`}
                            title="Save Folder Link"
                          >
                            <Download className="h-3 w-3" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleShareImage(`${window.location.origin}/library?gallery=${g.id}`, g.name); }}
                            className={`p-1.5 rounded-lg border transition-all ${
                              isDarkMode
                                ? "bg-white/5 border-white/10 text-white/50 hover:text-sky-400 hover:border-sky-400/50"
                                : "bg-black/5 border-black/10 text-black/50 hover:text-sky-600"
                            }`}
                            title="Share Folder"
                          >
                            <Share2 className="h-3 w-3" />
                          </button>
                        </div>
                        <ChevronRight className="h-4 w-4 text-white/35" />
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            ) : (
              <>
                {/* Upload Category Dropzone UI */}
                {activeCategory === "uploads" && (
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`mb-8 border border-dashed rounded-xl p-10 flex flex-col items-center justify-center gap-4 transition-all duration-300 ${
                      isUploadDragging
                        ? "border-[var(--color-cyan)] bg-[var(--color-cyan)]/5 scale-[0.99] shadow-[0_0_20px_rgba(0,221,221,0.15)]"
                        : (isDarkMode ? "border-white/10 bg-white/[0.01] hover:border-white/20" : "border-black/10 bg-black/[0.01] hover:border-black/20")
                    }`}
                  >
                    <div className={`h-12 w-12 rounded-full flex items-center justify-center transition-all ${
                      isUploadDragging ? "bg-[var(--color-cyan)] text-black" : (isDarkMode ? "bg-white/5 text-white/50" : "bg-black/5 text-black/50")
                    }`}>
                      <Upload className="h-6 w-6" />
                    </div>
                    <div className="text-center font-sans">
                      <p className="text-sm font-semibold mb-1">Drag and drop images here</p>
                      <p className={`text-xs ${isDarkMode ? "text-white" : "text-black"}`}>
                        Drop PNG, JPG or WebP images to build your private visual prompt archive.
                      </p>
                    </div>
                    <div className="relative">
                      <input
                        type="file"
                        id="file-input"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                      <button className={`px-4 py-2 border rounded-lg text-xs font-semibold uppercase tracking-wider transition-all select-none ${
                        isDarkMode ? "border-white/10 bg-white/5 hover:bg-white/10 text-white/80" : "border-black/10 bg-black/5 hover:bg-black/10 text-black/80"
                      }`}>
                        Select File
                      </button>
                    </div>
                  </div>
                )}

                {/* Grid Empty State / Loading State */}
                {activeCategory === "public_gallery" && isFetchingPublicGalleryAssets ? (
                  <div className="flex flex-col items-center justify-center py-32 border rounded-2xl border-dashed border-white/5 bg-white/[0.01] w-full">
                    <Loader2 className={`h-8 w-8 animate-spin mb-4 ${isDarkMode ? "text-[var(--color-cyan)]" : "text-cyan-600"}`} />
                    <p className={`text-xs font-mono tracking-wider uppercase ${isDarkMode ? "text-white/45" : "text-black/45"}`}>
                      Loading folder assets...
                    </p>
                  </div>
                ) : (activeAssets.length === 0 && !isLoading && (!isGenerating || activeCategory !== "all")) ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`flex flex-col items-center justify-center py-32 border rounded-2xl w-full ${
                      isDarkMode ? "border-white/[0.04] bg-white/[0.01]" : "border-black/[0.04] bg-black/[0.01]"
                    }`}
                  >
                    <BookOpen className={`h-10 w-10 mb-5 ${isDarkMode ? "text-white/10" : "text-black/15"}`} />
                    <p className="text-sm font-sans mb-1 font-semibold">No assets found</p>
                    <p className={`text-[11px] font-mono text-center max-w-sm px-5 leading-normal ${isDarkMode ? "text-white/20" : "text-black/40"}`}>
                      {searchQuery
                        ? `No assets match your search query "${searchQuery}". Try editing the prompt filter.`
                        : "No image prompts registered in this section yet."}
                    </p>
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery("")}
                        className={`mt-4 px-3 py-1.5 border rounded-lg text-xs font-mono ${
                          isDarkMode ? "bg-white/5 border-white/15 hover:bg-white/10" : "bg-black/5 border-black/15 hover:bg-black/10"
                        }`}
                      >
                        Clear Filter
                      </button>
                    )}
                  </motion.div>
                ) : isLoading && activeAssets.length === 0 ? (
                  <BentoGrid className="w-full gap-1.5 md:gap-2 max-w-none md:auto-rows-[15rem]">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <BentoGridItem
                        key={`skeleton-${i}`}
                        className={cn(
                          "p-0 overflow-hidden rounded-none bg-transparent border-none dark:bg-transparent shadow-none hover:shadow-none transition-none w-full h-[220px] md:h-full min-h-[14rem]",
                          getBentoSpanClass(i)
                        )}
                        header={
                          <div className={`relative overflow-hidden rounded-none border w-full h-full animate-pulse ${
                            isDarkMode ? "bg-white/5 border-white/5" : "bg-black/5 border-black/5"
                          }`}>
                            <div className={`absolute inset-0 ${isDarkMode ? "bg-white/5" : "bg-black/5"}`} />
                          </div>
                        }
                      />
                    ))}
                  </BentoGrid>
                ) : (
                  <>
                  {/* ================= CORE PHOTO IMAGE GRID ================= */}
                  <BentoGrid className="w-full gap-1.5 md:gap-2 max-w-none md:auto-rows-[15rem]">
                    <AnimatePresence mode="popLayout">
                      {isGenerating && activeCategory === "all" && (
                        <BentoGridItem
                          key="generating-placeholder"
                          className={cn(
                            "p-0 overflow-hidden rounded-none bg-transparent border-none dark:bg-transparent shadow-none hover:shadow-none transition-none w-full h-[220px] md:h-full min-h-[14rem]",
                            getBentoSpanClass(0)
                          )}
                          header={
                            <motion.div
                              layout
                              initial={{ opacity: 0, scale: 0.95, y: 15 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.9, y: 10 }}
                              transition={{ duration: 0.35, ease: "easeOut" }}
                              className={`relative overflow-hidden rounded-none border transition-all duration-300 w-full h-full flex items-center justify-center ${
                                isDarkMode ? "bg-[#0d0d0c] border-white/5 text-white" : "bg-[#f4f3f2] border-black/5 text-black"
                              }`}
                            >
                              <PixelCard
                                variant={isDarkMode ? "blue" : "default"}
                                colors={isDarkMode ? undefined : "#000000,#18181b,#27272a,#3f3f46,#52525b"}
                                autoPlay
                                autoPlayInterval={2000}
                                className="!h-full !w-full !rounded-none !border-none"
                              >
                                <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none">
                                  <Loader2 className={`h-8 w-8 animate-spin mb-3 ${isDarkMode ? "text-white" : "text-black"}`} />
                                  <p className={`text-xs font-mono font-semibold tracking-wider uppercase ${isDarkMode ? "text-white/80" : "text-black/80"}`}>
                                    Generating...
                                  </p>
                                </div>
                              </PixelCard>
                            </motion.div>
                          }
                        />
                      )}
                      {activeAssets.slice(0, visibleCount).map((asset, i) => {
                        const index = (isGenerating && activeCategory === "all") ? i + 1 : i;
                        const spanClass = getBentoSpanClass(index);
                        return renderCard(asset, index, spanClass);
                      })}
                    </AnimatePresence>
                  </BentoGrid>
                  {activeAssets.length > visibleCount && (
                    <div
                      ref={sentinelRef}
                      className="w-full flex items-center justify-center py-8"
                    >
                      <Loader2 className={`h-6 w-6 animate-spin ${isDarkMode ? "text-white/30" : "text-black/30"}`} />
                    </div>
                  )}
                  </>
                )}
              </>
            )}
          </div>

        </main>

        {/* ================= FIXED BOTTOM IMAGE GENERATOR BAR ================= */}
        <div
          className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-2xl rounded-2xl px-5 py-2.5 flex items-start gap-3 transition-all duration-300 max-h-[40vh] overflow-y-auto ${
            isDarkMode
              ? "bg-[#222120] border border-white/5 shadow-2xl"
              : "bg-[#f2f1f0] border border-black/5 shadow-2xl"
          }`}
        >
            <textarea
              id="walkthrough-input-area"
              value={generatePrompt}
              onChange={(e) => {
                setGeneratePrompt(e.target.value);
                e.currentTarget.style.height = 'auto';
                e.currentTarget.style.height = e.currentTarget.scrollHeight + 'px';
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !isGenerating) {
                  e.preventDefault();
                  void handleGenerateImage();
                }
              }}
              onInput={(e) => {
                e.currentTarget.style.height = 'auto';
                e.currentTarget.style.height = e.currentTarget.scrollHeight + 'px';
              }}
              disabled={isGenerating}
              placeholder={typedPlaceholder}
              rows={1}
              className={`flex-1 min-w-0 bg-transparent resize-none no-scrollbar font-sans ${
                isDarkMode ? "text-white placeholder:text-white/30" : "text-black placeholder:text-black/50"
              } py-1 text-base focus:outline-none`}
              style={{ maxHeight: '30vh' }}
            />

            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Voice Input (Microphone) */}
              <motion.button
                type="button"
                onClick={isRecording ? stopRecording : startRecording}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className={`p-2 rounded-full transition-all duration-200 ${
                  isRecording 
                    ? "bg-red-500/20 text-red-500 animate-pulse" 
                    : (isDarkMode ? "text-white/50 hover:text-white hover:bg-white/5" : "text-black/50 hover:text-black hover:bg-black/5")
                }`}
                title={isRecording ? "Stop recording" : "Voice input"}
              >
                <Mic className="h-5 w-5" />
              </motion.button>

              {/* Generate Button */}
              {isGenerating ? (
                <div className="h-9 w-9 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center shadow-lg">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              ) : (
                <motion.button
                  onClick={() => void handleGenerateImage()}
                  disabled={!generatePrompt.trim()}
                  whileHover={generatePrompt.trim() ? { scale: 1.1 } : {}}
                  whileTap={generatePrompt.trim() ? { scale: 0.9 } : {}}
                  className={`h-9 w-9 rounded-full flex items-center justify-center transition-all duration-200 shadow-md ${
                    generatePrompt.trim()
                      ? (isDarkMode ? "bg-white text-black hover:bg-white/90 cursor-pointer" : "bg-black text-white hover:bg-black/90 cursor-pointer")
                      : (isDarkMode ? "bg-white/10 text-white/30 cursor-not-allowed" : "bg-black/10 text-black/30 cursor-not-allowed")
                  }`}
                  title="Generate Image"
                >
                  <ArrowUp className="h-5 w-5 stroke-[2.5]" />
                </motion.button>
              )}
            </div>
          </div>
      </div>

      {/* Move to Folder Modal */}
      {isMoveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => { setIsMoveModalOpen(false); setMoveAssetId(null); }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`w-80 rounded-2xl border shadow-2xl overflow-hidden ${
              isDarkMode ? "bg-[#0e0e12] border-white/10" : "bg-white border-black/10"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`flex items-center justify-between px-5 py-4 border-b ${
              isDarkMode ? "border-white/5" : "border-black/5"
            }`}>
              <h3 className="text-sm font-semibold font-sans">Move to Folder</h3>
              <button
                onClick={() => { setIsMoveModalOpen(false); setMoveAssetId(null); }}
                className={`p-1 rounded-lg transition-colors ${
                  isDarkMode ? "text-white/40 hover:bg-white/10 hover:text-white" : "text-black/40 hover:bg-black/10 hover:text-black"
                }`}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-3 max-h-64 overflow-y-auto">
              {/* My Gallery (remove from folder) */}
              <button
                onClick={() => {
                  if (moveAssetId) handleMoveAssetToGallery(moveAssetId, null);
                  setIsMoveModalOpen(false);
                  setMoveAssetId(null);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-xs font-sans transition-all ${
                  isDarkMode
                    ? "text-white/70 hover:bg-white/5 hover:text-white"
                    : "text-black/70 hover:bg-black/5 hover:text-black"
                }`}
              >
                <ImageIcon className="h-4 w-4 shrink-0" />
                <div>
                  <p className="font-semibold">My Gallery</p>
                  <p className={`text-[10px] mt-0.5 ${isDarkMode ? "text-white/30" : "text-black/30"}`}>Remove from folder</p>
                </div>
              </button>
              <div className={`my-1 mx-4 h-px ${isDarkMode ? "bg-white/5" : "bg-black/5"}`} />
              {/* Custom Folders */}
              {galleries.length === 0 ? (
                <p className={`text-[11px] px-4 py-3 italic ${isDarkMode ? "text-white/20" : "text-black/30"}`}>
                  No folders created yet.
                </p>
              ) : (
                galleries.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => {
                      if (moveAssetId) handleMoveAssetToGallery(moveAssetId, g.id);
                      setIsMoveModalOpen(false);
                      setMoveAssetId(null);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-xs font-sans transition-all ${
                      isDarkMode
                        ? "text-white/70 hover:bg-white/5 hover:text-white"
                        : "text-black/70 hover:bg-black/5 hover:text-black"
                    }`}
                  >
                    {g.is_public ? (
                      <FolderOpen className="h-4 w-4 shrink-0 text-sky-400" />
                    ) : (
                      <Folder className="h-4 w-4 shrink-0 text-amber-500/80" />
                    )}
                    <div>
                      <p className="font-semibold">{g.name}</p>
                      <p className={`text-[10px] mt-0.5 ${isDarkMode ? "text-white/30" : "text-black/30"}`}>
                        {g.asset_count || 0} images {g.is_public ? "• Public" : "• Private"}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* Expanded Image Modal */}
      <AnimatePresence>
        {expandedAsset && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 bg-black/60 backdrop-blur-sm overflow-y-auto"
            onClick={() => setExpandedAsset(null)}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={{ type: "spring", damping: 26, stiffness: 160 }}
              className={`w-full max-w-5xl h-auto md:h-[80vh] flex flex-col md:flex-row rounded-3xl overflow-hidden border shadow-2xl transition-colors duration-300 ${
                isDarkMode ? "bg-[#0d0d0c] border-white/[0.06] text-white" : "bg-[#f4f3f2] border-black/[0.06] text-black"
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Left Column - Image Container */}
              <div className="flex-1 md:w-1/2 flex items-center justify-center bg-black/10 dark:bg-black/40 relative min-h-[40vh] md:min-h-0">
                {/* Back Button */}
                <button
                  onClick={() => setExpandedAsset(null)}
                  className="absolute top-4 left-4 p-2.5 rounded-full bg-white text-black hover:bg-zinc-100 hover:scale-105 active:scale-95 shadow-md transition-all z-10"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>

                {brokenImages.has(expandedAsset.id) ? (
                  <div className="text-center p-4">
                    <ImageIcon className={`h-12 w-12 mx-auto mb-3 ${isDarkMode ? "text-white/20" : "text-black/20"}`} />
                    <p className={`text-sm font-mono ${isDarkMode ? "text-white/30" : "text-black/30"}`}>Image unavailable</p>
                  </div>
                ) : (
                  <img
                    src={getAssetImageUrl(expandedAsset)}
                    alt={expandedAsset.prompt || "Concept visual"}
                    className="w-full h-full object-contain max-h-[50vh] md:max-h-[80vh] select-none cursor-zoom-in hover:opacity-95 transition-all duration-300"
                    draggable={false}
                    onClick={() => {
                      setZoomScale(1)
                      setIsLightboxOpen(true)
                    }}
                    onError={() => setBrokenImages(prev => new Set(prev).add(expandedAsset.id))}
                  />
                )}

                {/* AI generated Pill Badge */}
                <div className="absolute bottom-4 left-4 px-3.5 py-1.5 rounded-full bg-black/60 backdrop-blur-md text-white text-xs font-semibold z-10 border border-white/10 select-none">
                  AI generated
                </div>

                {/* Interactive Controls (Expand) */}
                <div className="absolute bottom-4 right-4 z-10">
                  <button
                    onClick={() => {
                      setZoomScale(1)
                      setIsLightboxOpen(true)
                    }}
                    className="p-3 rounded-full bg-white/80 hover:bg-white text-black backdrop-blur-md shadow-md transition-all hover:scale-110 active:scale-95"
                    title="Expand Image"
                  >
                    <Maximize2 className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Right Column - Details Pane */}
              <div className="flex-1 md:w-1/2 flex flex-col h-full overflow-hidden border-t md:border-t-0 md:border-l border-zinc-100 dark:border-zinc-800/50">
                {/* Top Actions Row */}
                <div className="flex items-center justify-between p-6 pb-4 shrink-0">
                  <div className="flex items-center gap-4">
                    {/* Heart Like Button */}
                    <motion.button
                      whileTap={{ scale: 0.85 }}
                      whileHover={{ scale: 1.08 }}
                      onClick={handleToggleLike}
                      className="flex items-center gap-1.5 text-zinc-650 hover:text-black dark:text-zinc-400 dark:hover:text-white transition-all duration-200 cursor-pointer"
                      title="Like"
                    >
                      <motion.div
                        animate={{ scale: isLiked ? [1, 1.45, 1.15] : 1 }}
                        transition={{ type: "spring", stiffness: 600, damping: 15 }}
                      >
                        <Heart className={`h-6 w-6 transition-all ${isLiked ? "fill-red-500 text-red-500" : ""}`} />
                      </motion.div>
                      <span className="text-sm font-semibold select-none">{likesCount}</span>
                    </motion.button>
                    
                    {/* Comment Icon (focuses comment box) */}
                    <button
                      onClick={() => {
                        const commentInput = document.getElementById("comment-input-field")
                        if (commentInput) commentInput.focus()
                      }}
                      className="text-zinc-655 hover:text-black dark:text-zinc-400 dark:hover:text-white hover:scale-110 active:scale-95 transition-all duration-200"
                      title="Comment"
                    >
                      <MessageSquare className="h-6 w-6" />
                    </button>

                    {/* Copy Link Button */}
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/library?asset=${expandedAsset.id}`)
                        toast.success("Post link copied!")
                      }}
                      className="text-zinc-655 hover:text-black dark:text-zinc-400 dark:hover:text-white hover:scale-110 active:scale-95 transition-all duration-200"
                      title="Copy Link"
                    >
                      <Share2 className="h-6 w-6" />
                    </button>

                    {/* Save to Personal Folder */}
                    <button
                      onClick={() => toggleSaved(expandedAsset)}
                      className={`hover:scale-110 active:scale-95 transition-all duration-200 ${
                        savedIds.includes(expandedAsset.id)
                          ? "text-blue-500"
                          : "text-zinc-650 hover:text-black dark:text-zinc-400 dark:hover:text-white"
                      }`}
                      title={savedIds.includes(expandedAsset.id) ? "Unsave" : "Save to Personal Folder"}
                    >
                      <Bookmark className={`h-6 w-6 transition-all ${savedIds.includes(expandedAsset.id) ? "fill-blue-500" : ""}`} />
                    </button>

                    {/* Copy to My Library */}
                    <button
                      onClick={() => handleCopyToLibrary(expandedAsset)}
                      className="text-zinc-650 hover:text-black dark:text-zinc-400 dark:hover:text-white hover:scale-110 active:scale-95 transition-all duration-200"
                      title="Add to My Library"
                    >
                      <FolderPlus className="h-6 w-6" />
                    </button>
                  </div>
                </div>

                {/* Middle Content Section - Scrollable */}
                <div className="flex-1 overflow-y-auto px-6 py-2 space-y-6">
                  {/* Creator Info */}
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full overflow-hidden bg-gradient-to-tr from-[#A855F7] to-[#00DDDD] flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm">
                      {creatorInfo.avatar ? (
                        <img src={creatorInfo.avatar} className="h-full w-full object-cover" alt={creatorInfo.name} />
                      ) : (
                        creatorInfo.name.slice(0, 2).toUpperCase()
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-sm leading-tight text-zinc-950 dark:text-zinc-50 hover:underline cursor-pointer">{creatorInfo.name}</span>
                      <span className="text-[9px] uppercase font-mono tracking-widest text-[#00DDDD] dark:text-[#00DDDD] font-semibold mt-0.5">Creator</span>
                    </div>
                  </div>

                  {/* Caption / Prompt Description */}
                  <div className="space-y-2">
                    <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-900/40 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800/40">
                      {expandedAsset.prompt || "No prompt text provided."}
                    </p>
                    {expandedAsset.prompt && (
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(expandedAsset.prompt || "")
                          toast.success("Prompt copied to clipboard!")
                        }}
                        className="flex items-center gap-1 text-[11px] font-semibold text-zinc-500 hover:text-black dark:text-zinc-400 dark:hover:text-white hover:scale-[1.03] active:scale-95 transition-all duration-200"
                      >
                        <Copy className="h-3 w-3" />
                        Copy Prompt
                      </button>
                    )}
                  </div>

                  <hr className="border-zinc-100 dark:border-zinc-800/50" />

                  {/* Comments list & trigger */}
                  <div className="space-y-4 pb-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-base font-sans">
                        {comments.length} {comments.length === 1 ? "comment" : "comments"}
                      </h4>
                      <button className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full hover:scale-110 active:scale-95 transition-all duration-200">
                        <ChevronRight className="h-4 w-4 rotate-90 text-zinc-500" />
                      </button>
                    </div>

                    <div className="space-y-4 max-h-[200px] overflow-y-auto pr-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                      {socialLoading ? (
                        <div className="flex items-center gap-2 text-xs text-zinc-400 py-2">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Loading comments...
                        </div>
                      ) : comments.length === 0 ? (
                        <p className="text-xs text-zinc-400 italic py-2">No comments yet. Share your thoughts!</p>
                      ) : (
                        comments.map((comment) => (
                          <div key={comment.id}>
                            <div className="flex gap-2.5 items-start text-sm">
                              <div className={`h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 transition-colors duration-300 ${
                                isDarkMode 
                                  ? "bg-[#f4f3f2] text-black" 
                                  : "bg-[#0d0d0c] text-white"
                              }`}>
                                {comment.user_avatar ? (
                                  <img src={comment.user_avatar} className="h-full w-full object-cover rounded-full" alt={comment.user_name} />
                                ) : (
                                  comment.user_name.slice(0, 2).toUpperCase()
                                )}
                              </div>
                              <div className="flex-1 flex flex-col pt-0.5 pl-0.5">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-xs text-zinc-800 dark:text-zinc-200">@{comment.user_name}</span>
                                  <span className="text-[10px] text-zinc-400 select-none">
                                    {new Date(comment.created_at).toLocaleDateString("en-US", {
                                      month: "short",
                                      day: "numeric",
                                      hour: "numeric",
                                      minute: "2-digit"
                                    })}
                                  </span>
                                </div>
                                <p className="leading-normal text-xs md:text-sm mt-1 text-zinc-700 dark:text-white">
                                  {renderCommentContent(comment.content, [])}
                                </p>
                                <div className="flex items-center gap-3 mt-1.5 pb-1">
                                  <button
                                    onClick={() => handleReplyClick(comment.id, comment.user_name)}
                                    className="text-[10px] font-bold text-zinc-500 hover:text-cyan-500 dark:text-zinc-400 dark:hover:text-cyan-400 transition-colors"
                                  >
                                    Reply
                                  </button>
                                  {comment.replies && comment.replies.length > 0 && (
                                    <>
                                      <span className="text-[10px] text-zinc-400 select-none">•</span>
                                      <button
                                        onClick={() => setCollapsedComments(prev => ({ ...prev, [comment.id]: !prev[comment.id] }))}
                                        className="text-[10px] font-bold text-zinc-500 hover:text-cyan-500 dark:text-zinc-400 dark:hover:text-cyan-400 transition-colors"
                                      >
                                        {collapsedComments[comment.id] ? `Show replies (${comment.replies.length})` : "Hide replies"}
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                            {comment.replies && comment.replies.length > 0 && !collapsedComments[comment.id] && (
                              <div className="ml-9 mt-2 space-y-3 relative">
                                {/* Vertical timeline connector line */}
                                <div className="absolute left-3 top-0 bottom-4 w-px bg-black dark:bg-zinc-800 pointer-events-none" />

                                {buildReplyTree(comment).map((replyNode: any) => (
                                  <ReplyItem
                                    key={replyNode.id}
                                    reply={replyNode}
                                    depth={0}
                                    commentId={comment.id}
                                    isDarkMode={isDarkMode}
                                    handleReplyClick={handleReplyClick}
                                    siblingUsernames={comment.replies.map((r: any) => r.user_name)}
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Bottom - Add Comment Input */}
                <div className="p-6 border-t border-zinc-100 dark:border-zinc-800/50 bg-[#0d0d0c]/5 dark:bg-[#0d0d0c]/30 backdrop-blur-md shrink-0">
                  <form onSubmit={handleAddComment} className="flex items-center gap-3">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors duration-300 ${
                      isDarkMode 
                        ? "bg-[#f4f3f2] text-black" 
                        : "bg-[#0d0d0c] text-white"
                    }`}>
                      {profilePic ? (
                        <img src={profilePic} className="h-full w-full object-cover rounded-full" alt={userName} />
                      ) : (
                        (userName || "U").slice(0, 1).toUpperCase()
                      )}
                    </div>
                    <div className="flex-1 flex items-center border border-zinc-200 dark:border-zinc-700 rounded-full px-3.5 py-2.5 bg-white dark:bg-zinc-800 transition-all focus-within:ring-2 focus-within:ring-zinc-400 dark:focus-within:ring-zinc-500">
                      <input
                        id="comment-input-field"
                        type="text"
                        placeholder={replyToComment ? `Reply to ${replyToComment.user_name}...` : "Add a comment..."}
                        value={newCommentText}
                        onChange={(e) => setNewCommentText(e.target.value)}
                        className="flex-1 bg-transparent border-none outline-none text-sm placeholder-zinc-400 pr-2"
                      />
                      {replyToComment && (
                        <button
                          type="button"
                          onClick={() => {
                            setReplyToComment(null);
                            setNewCommentText("");
                          }}
                          className="text-[10px] font-semibold text-zinc-400 hover:text-red-400 transition-colors shrink-0"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fullscreen Zoomable Lightbox Modal */}
      <AnimatePresence>
        {isLightboxOpen && expandedAsset && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] bg-black/95 flex flex-col justify-between"
            onClick={() => setIsLightboxOpen(false)}
          >
            {/* Top Bar */}
            <div className="w-full flex items-center justify-between p-4 z-10" onClick={(e) => e.stopPropagation()}>
              {/* Close Button top-left */}
              <button
                onClick={() => setIsLightboxOpen(false)}
                className="p-2.5 rounded-full bg-zinc-800/80 hover:bg-zinc-700 text-white transition-all active:scale-95"
              >
                <X className="h-6 w-6" />
              </button>

              {/* Actions top-right */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/library?asset=${expandedAsset.id}`)
                    toast.success("Post link copied!")
                  }}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-white font-bold text-xs font-mono tracking-wider transition-all"
                >
                  <Share2 className="h-4 w-4" />
                  SHARE
                </button>
              </div>
            </div>

            {/* Center Image Zoomable Area */}
            <div className="flex-1 flex items-center justify-center p-4 overflow-hidden relative">
              <div
                className="relative cursor-zoom-out select-none transition-transform duration-200 ease-out"
                style={{ transform: `scale(${zoomScale})` }}
                onClick={(e) => {
                  e.stopPropagation()
                  // Toggle zoom scale between 1 and 2 on image click
                  setZoomScale(prev => prev === 1 ? 2 : 1)
                }}
              >
                <img
                  src={getAssetImageUrl(expandedAsset)}
                  alt={expandedAsset.prompt || "Lightbox visual"}
                  className="max-w-full max-h-[80vh] w-auto h-auto object-contain rounded-2xl shadow-2xl pointer-events-none"
                  draggable={false}
                />
              </div>
            </div>

            {/* Stacked Zoom Controls bottom-right */}
            <div
              className="absolute bottom-6 right-6 flex flex-col gap-2 z-10"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setZoomScale(prev => Math.min(3, prev + 0.25))}
                className="p-3 rounded-full bg-zinc-800/80 hover:bg-zinc-700 text-white shadow-xl transition-all active:scale-90"
                title="Zoom In"
              >
                <Plus className="h-5 w-5" />
              </button>
              <button
                onClick={() => setZoomScale(prev => Math.max(0.5, prev - 0.25))}
                className="p-3 rounded-full bg-zinc-800/80 hover:bg-zinc-700 text-white shadow-xl transition-all active:scale-90"
                title="Zoom Out"
              >
                <Minus className="h-5 w-5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        isDarkMode={isDarkMode}
        isMobile={isMobile}
        onPersonaSelect={handlePersonaSelect}
        currentPersona={selectedPersona}
        onDeactivate={handleDiscontinueAccount}
        userRole={userRole}
        userName={userName}
        userEmail={userEmail}
        initialPanel={settingsPanel}
      />

      {/* Reflective Card Modal */}
      {isPersonalizationModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setIsPersonalizationModalOpen(false)}>
          <div onClick={e => e.stopPropagation()}>
            <ReflectiveCard
              userName={userName || "User"}
              userEmail={userEmail || ""}
              userRole={userRole}
              schoolName={schoolName || ""}
              subscription={subscription}
              isDarkMode={isDarkMode}
              onClose={() => setIsPersonalizationModalOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Wallet Modal */}
      <WalletModal
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
        isDarkMode={isDarkMode}
        isMobile={isMobile}
      />

      {/* Category Assignment Modal */}
      <AnimatePresence>
        {showCategoryModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => { setShowCategoryModal(false); setPendingCategory(null); setGeneratedAssetId(null) }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className={`relative w-full max-w-lg rounded-2xl p-6 border ${
                isDarkMode ? "bg-[#1a1a1a] border-white/10" : "bg-white border-black/10"
              }`}
            >
              <h3 className={`text-lg font-semibold mb-1 ${isDarkMode ? "text-white" : "text-black"}`}>
                Assign a Category
              </h3>
              <p className={`text-sm mb-4 ${isDarkMode ? "text-white/50" : "text-black/50"}`}>
                Categorize your generated image to find it easily later.
              </p>

              <div className="grid grid-cols-2 gap-2 mb-4">
                {ASSET_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setPendingCategory(cat)}
                    className={`px-3 py-2.5 rounded-xl border text-sm font-medium text-left transition-all duration-200 cursor-pointer ${
                      pendingCategory === cat
                        ? isDarkMode
                          ? "bg-white/15 border-white/30 text-white"
                          : "bg-black/10 border-black/30 text-black"
                        : isDarkMode
                          ? "bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:border-white/20"
                          : "bg-black/5 border-black/10 text-black/70 hover:bg-black/10 hover:border-black/20"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Custom category input */}
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Or type a custom category..."
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  className={`w-full px-3 py-2.5 rounded-xl border text-sm outline-none transition-all ${
                    isDarkMode
                      ? "bg-white/5 border-white/10 text-white placeholder-white/30 focus:border-white/30"
                      : "bg-black/5 border-black/10 text-black placeholder-black/30 focus:border-black/30"
                  }`}
                />
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => { setShowCategoryModal(false); setPendingCategory(null); setGeneratedAssetId(null); setCustomCategory("") }}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                    isDarkMode
                      ? "bg-white/10 text-white/70 hover:bg-white/15"
                      : "bg-black/10 text-black/70 hover:bg-black/15"
                  }`}
                >
                  Skip
                </button>
                <button
                  onClick={handleCategoryAssign}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                    pendingCategory || customCategory.trim()
                      ? isDarkMode
                        ? "bg-blue-600 text-white hover:bg-blue-700"
                        : "bg-blue-500 text-white hover:bg-blue-600"
                      : isDarkMode
                        ? "bg-white/5 text-white/30 cursor-not-allowed"
                        : "bg-black/5 text-black/30 cursor-not-allowed"
                  }`}
                >
                  Assign
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Onboarding Walkthrough */}
      <OnboardingWalkthrough
        isOpen={showWalkthrough}
        onClose={() => setShowWalkthrough(false)}
        isMobile={isMobile}
        setIsSidebarCollapsed={setIsSidebarCollapsed}
        setIsRightSidebarCollapsed={() => {}}
        isDarkMode={isDarkMode}
        steps={[
          {
            title: "Welcome to Image Library",
            description: "Your personal image gallery and generation hub. Browse, create, and manage all your AI-generated visuals in one place.",
            placement: "center",
            icon: <Sparkles className="h-4 w-4" />,
          },
          {
            title: "Sidebar Navigation",
            description: "Switch between Explore, Recent Creations, Saved items, and your custom folders from this sidebar.",
            targetSelector: "#walkthrough-sidebar",
            placement: "right",
          },
          {
            title: "Image Prompt Input",
            description: "Type a detailed description of the image you want to generate. The AI will transform your words into stunning visuals.",
            targetSelector: "#walkthrough-input-area",
            placement: "top",
          },
          {
            title: "Your Profile & Settings",
            description: "Access your profile, wallet, settings, and upgrade options from here.",
            targetSelector: "#walkthrough-profile-area",
            placement: "top",
          },
          {
            title: "You're Ready to Create!",
            description: "Start generating images by typing a prompt and hitting Generate. Explore community creations and build your personal gallery!",
            placement: "center",
            icon: <CheckCircle className="h-4 w-4" />,
          },
        ]}
      />
    </div>
  )
}
