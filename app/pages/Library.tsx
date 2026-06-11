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
  type LibraryAsset,
  type LibraryGallery
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
  Bell
} from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { BentoGrid, BentoGridItem } from "@/components/ui/bento-grid"
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

export default function LibraryPage() {
  const router = useRouter()
  const { isDarkMode, toggleTheme } = useTheme()
  
  const [assets, setAssets] = useState<LibraryAsset[]>([])
  const [publicAssets, setPublicAssets] = useState<LibraryAsset[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [togglingVisibilityId, setTogglingVisibilityId] = useState<string | null>(null)
  const [brokenImages, setBrokenImages] = useState<Set<string>>(new Set())
  
  // Custom Interactive States
  const [activeCategory, setActiveCategory] = useState<string>("featured")
  const [aspectRatio, setAspectRatio] = useState<"1:1" | "16:9" | "9:16">("1:1")
  const [createdOnFilter, setCreatedOnFilter] = useState<"all" | "today" | "week" | "month">("all")
  const [sourceFilter, setSourceFilter] = useState<"all" | "personal" | "community">("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [savedIds, setSavedIds] = useState<string[]>([])
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [isUploadDragging, setIsUploadDragging] = useState(false)
  const [uploadedAssets, setUploadedAssets] = useState<LibraryAsset[]>([])
  const [generatePrompt, setGeneratePrompt] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  
  // Custom Real Database-backed Galleries States
  const [galleries, setGalleries] = useState<LibraryGallery[]>([])
  const [publicGalleries, setPublicGalleries] = useState<LibraryGallery[]>([])
  const [selectedGalleryId, setSelectedGalleryId] = useState<string | null>(null)
  const [selectedPublicGalleryId, setSelectedPublicGalleryId] = useState<string | null>(null)
  const [publicGalleryAssets, setPublicGalleryAssets] = useState<LibraryAsset[]>([])
  const [isFetchingPublicGalleryAssets, setIsFetchingPublicGalleryAssets] = useState(false)
  const [showcaseTab, setShowcaseTab] = useState<"assets" | "galleries">("assets")
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false)
  const [moveAssetId, setMoveAssetId] = useState<string | null>(null)
  const [expandedAsset, setExpandedAsset] = useState<LibraryAsset | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [sidebarWidth, setSidebarWidth] = useState(260)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    if (typeof window === "undefined") return true
    return window.innerWidth < 768
  })

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
      const [data, pubData, galleriesData, pubGalleriesData] = await Promise.all([
        fetchWithRetry(() => getLibraryAssets()).catch((err: any) => { hasError = true; return null }),
        fetchWithRetry(() => getPublicLibraryAssets()).catch((err: any) => { hasError = true; return null }),
        fetchWithRetry(() => getLibraryGalleries()).catch((err: any) => { hasError = true; return null }),
        fetchWithRetry(() => getPublicLibraryGalleries()).catch((err: any) => { hasError = true; return null }),
      ])
      if (data) setAssets(data.assets)
      if (pubData) setPublicAssets(pubData.assets)
      if (galleriesData) setGalleries(galleriesData.galleries)
      if (pubGalleriesData) setPublicGalleries(pubGalleriesData.galleries)
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

  // Close expanded modal on Escape key
  useEffect(() => {
    if (!expandedAsset) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setExpandedAsset(null)
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [expandedAsset])

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
        await unsaveAsset(id)
        setSavedIds((prev) => prev.filter((sId) => sId !== id))
        toast.success("Removed from Saved.")
      } catch {
        toast.error("Failed to unsave.")
      }
    } else {
      try {
        await saveAsset(id, asset.asset_type, asset.asset_url, asset.prompt || "")
        setSavedIds((prev) => [...prev, id])
        toast.success("Saved!")
        if (asset.asset_url) handleDownloadImage(getAssetImageUrl(asset), `saved-${id}`)
      } catch {
        toast.error("Failed to save.")
      }
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

  // Share image via clipboard (reliable for all asset types)
  const handleShareImage = async (url: string, title = "Library Image") => {
    try {
      await navigator.clipboard.writeText(url)
      toast.success("Image link copied to clipboard.")
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
      await assignAssetToGallery(assetId, galleryId)
      // Sync local assets state
      let targetPublic = false;
      if (galleryId) {
        const g = galleries.find((g) => g.id === galleryId)
        if (g) targetPublic = g.is_public
      }
      setAssets((prev) => prev.map((a) => (a.id === assetId ? { ...a, gallery_id: galleryId, is_public: galleryId ? targetPublic : a.is_public } : a)))
      
      // Update public assets if needed
      const pubData = await getPublicLibraryAssets()
      setPublicAssets(pubData.assets)
      const galleriesData = await getLibraryGalleries()
      setGalleries(galleriesData.galleries)

      toast.success(galleryId ? "Image added to gallery folder." : "Image removed from gallery folder.")
    } catch (err: any) {
      toast.error(err.message || "Failed to move image.")
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

  // ── Filtered Assets calculation ──
  const activeAssets = useMemo(() => {
    let pool: LibraryAsset[] = []
    switch (activeCategory) {
      case "featured": {
        const combined = [...publicAssets];
        pool = combined.sort((a, b) => {
          const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
          return dateB - dateA;
        });
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
      pool = pool.filter((asset) => !asset.id.startsWith("feat-") && !asset.is_public);
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

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      pool = pool.filter((asset) => asset.prompt?.toLowerCase().includes(q))
    }
    return pool
  }, [activeCategory, assets, publicAssets, uploadedAssets, savedIds, searchQuery, selectedGalleryId, publicGalleryAssets, sourceFilter, createdOnFilter])

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
  const getLikesCount = (assetId: string) => {
    if (assetId.startsWith("feat-1")) return "261"
    if (assetId.startsWith("feat-2")) return "184"
    if (assetId.startsWith("feat-3")) return "92"
    if (assetId.startsWith("feat-4")) return "395"
    const charCodeSum = assetId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
    return String((charCodeSum % 150) + 5)
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
        key={asset.id}
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
              <img
                src={getAssetImageUrl(asset)}
                alt={asset.prompt || "Concept visual"}
                className="w-full h-full object-cover transition-all duration-700 ease-out group-hover/card:scale-110 cursor-pointer"
                loading="lazy"
                onClick={() => setExpandedAsset(asset)}
                onError={() => setBrokenImages(prev => new Set(prev).add(asset.id))}
              />
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

              {/* Likes */}
              <div className="flex items-center gap-1 px-2 py-1 bg-black/40 backdrop-blur-md rounded-lg border border-white/10 text-white/80 pointer-events-auto cursor-pointer" onClick={(e) => { e.preventDefault(); toggleSaved(asset); }}>
                <Heart className={`h-3 w-3 ${savedIds.includes(asset.id) ? "fill-white text-white" : ""}`} />
                <span className="text-[9px] font-bold select-none">
                  {getLikesCount(asset.id)}
                </span>
              </div>
            </div>

            {/* Hover Content Overlay */}
            <div className={`absolute inset-0 bg-black/40 backdrop-blur-xl opacity-0 group-hover/card:opacity-100 flex flex-col justify-end p-5 transition-all duration-500 ease-out translate-y-4 group-hover/card:translate-y-0 z-30`}>
              <p className="text-[9px] font-bold text-cyan-400 uppercase tracking-widest mb-1.5">Prompt Detail</p>
              <p className="text-xs font-medium leading-relaxed text-white/90 line-clamp-3 mb-4">
                {asset.prompt || "No prompt description available for this visual concept."}
              </p>

              <div className="flex items-center justify-between pt-3 border-t border-white/10">
                <div className="flex items-center gap-3">
                  <button
                    onClick={(e) => { e.preventDefault(); handleShareImage(getAssetImageUrl(asset), asset.prompt || "Library Image"); }}
                    className="text-white/60 hover:text-cyan-400 transition-colors cursor-pointer"
                    title="Share"
                  >
                    <Globe className="h-4 w-4" />
                  </button>
                  <button
                    onClick={(e) => { e.preventDefault(); handleCopyPrompt(asset.prompt || "", asset.id); }}
                    className={`transition-colors cursor-pointer ${copiedId === asset.id ? "text-emerald-400" : "text-white/60 hover:text-cyan-400"}`}
                    title="Copy Prompt"
                  >
                    {copiedId === asset.id ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={(e) => { e.preventDefault(); handleDownloadImage(getAssetImageUrl(asset), asset.id); }}
                    className="text-white/60 hover:text-cyan-400 transition-colors cursor-pointer"
                    title="Download"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                  {!asset.id.startsWith("feat-") && (
                    <button
                      onClick={(e) => { e.preventDefault(); handleDelete(asset.id); }}
                      className="text-white/60 hover:text-red-400 transition-colors cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
                
                <button
                  onClick={() => setExpandedAsset(asset)}
                  className={`p-1.5 rounded-full transition-all cursor-pointer ${
                    isDarkMode
                      ? "bg-white/10 text-white hover:bg-white/20"
                      : "bg-black/10 text-black hover:bg-black/20"
                  }`}
                  title="Expand"
                >
                  <Maximize2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Visibility status & Move action - Top Right Overlay */}
            <div
              className={`absolute top-3 right-3 flex items-center gap-1.5 transition-all duration-300 z-40 ${
                hoveredId === asset.id ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2 pointer-events-none"
              }`}
            >
              <button
                onClick={(e) => { e.preventDefault(); setMoveAssetId(asset.id); setIsMoveModalOpen(true); }}
                className="p-1.5 rounded-lg bg-black/60 border border-white/10 text-white/70 hover:text-white hover:bg-black/80 transition-all cursor-pointer shadow-lg backdrop-blur-sm"
                title="Move to Folder"
              >
                <Move className="h-3.5 w-3.5" />
              </button>

              {!asset.id.startsWith("feat-") && (
                <button
                  onClick={(e) => { e.preventDefault(); handleToggleVisibility(asset.id, asset.is_public); }}
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

  if (isLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${isDarkMode ? "bg-[#0d0d0c]" : "bg-[#f4f3f2]"}`}>
        <div className="flex flex-col items-center gap-4">
          <Loader2 className={`h-10 w-10 animate-spin ${isDarkMode ? "text-[var(--color-cyan)]" : "text-cyan-600"}`} />
          <p className={`text-xs font-mono tracking-widest uppercase ${isDarkMode ? "text-white/45" : "text-black/45"}`}>
            Connecting Library...
          </p>
        </div>
      </div>
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
                onClick={() => { setActiveCategory("featured"); setIsUploadDragging(false); }}
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
                    onClick={() => { setActiveCategory("featured"); setIsUploadDragging(false); if (isMobile) setIsSidebarCollapsed(true); }}
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
                  {(hasNewGeneration || generationStatus === "generating") && (
                    <span className={`absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-white dark:ring-[#0d0d0c] ${
                      generationStatus === "generating" ? "bg-yellow-400" : "bg-green-500"
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
                      {generationStatus === "idle" && !hasNewGeneration && (
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
          <main className={`flex-1 overflow-y-auto px-4 md:px-8 py-6 md:py-8 pb-32 relative transition-colors duration-300 ${
            isDarkMode ? "bg-[#0d0d0c]" : "bg-[#f4f3f2]"
          }`}>
          
          {/* Header */}
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
                  {activeCategory === "public_showcase" && "Community Showcase"}
                  {activeCategory === "featured" && "Featured"}
                  {activeCategory === "recent" && "Recent"}
                  {activeCategory === "saved" && "Saved"}
                  {activeCategory === "all" && "My Gallery"}
                  {activeCategory === "uploads" && "Uploads"}
                  {activeCategory === "gallery" && "Folder"}
                  {activeCategory === "public_gallery" && "Shared Folder"}
                </span>
              </div>
              
              <div className="flex items-center gap-4">
                <h1 className="text-2xl font-display font-semibold tracking-tight flex items-center gap-3">
                  {activeCategory === "featured" && "Featured Concept Showcase"}
                  {activeCategory === "public_showcase" && "Community Shared Prompts"}
                  {activeCategory === "recent" && "Your Recent Render Prompts"}
                  {activeCategory === "saved" && `Saved (${savedIds.length})`}
                  {activeCategory === "all" && "My Private Gallery"}
                  {activeCategory === "uploads" && "Local Upload Repository"}
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

                              {/* Save Gallery */}
                              <button
                                onClick={() => {
                                  const galleryAssetIds = assets.filter(a => a.gallery_id === currentGallery.id);
                                  galleryAssetIds.forEach(a => handleDownloadImage(getAssetImageUrl(a), a.id));
                                  toast.success(`Saving ${galleryAssetIds.length} images...`);
                                }}
                                className={`p-1.5 rounded border transition-colors ${
                                  isDarkMode
                                    ? "bg-white/5 border-white/10 text-white/60 hover:bg-emerald-500/80 hover:text-white"
                                    : "bg-black/5 border-black/10 text-black/60 hover:bg-emerald-500/80 hover:text-white"
                                }`}
                                title="Save All Images"
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
                  {activeCategory === "public_gallery" && (
                    <>
                      <span>{publicGalleries.find(g => g.id === selectedPublicGalleryId)?.name || "Shared Folder"}</span>
                      <span className="text-xs font-mono font-normal opacity-40 px-2 py-0.5 border border-white/10 bg-white/5 rounded-full ml-2">
                        by {publicGalleries.find(g => g.id === selectedPublicGalleryId)?.owner_name || "Community User"}
                      </span>
                    </>
                  )}
                </h1>
              </div>
            </div>

            {/* Back to Chat Option */}
            <div className="flex items-center gap-2 select-none">
              {/* Back to Showcase Folder view */}
              {activeCategory === "public_gallery" && (
                <button
                  onClick={() => {
                    setActiveCategory("public_showcase");
                    setShowcaseTab("galleries");
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

          {/* 💡 Prompts disclaimer */}
          <div className={`mb-6 p-3 border rounded-xl flex items-start gap-2.5 text-xs leading-relaxed transition-colors duration-300 ${
            isDarkMode
              ? "bg-[#222120]/40 border-white/5 text-white/70"
              : "bg-[#f2f1f0]/40 border-black/5 text-black/70 shadow-sm"
          }`}>
            <Info className={`h-4 w-4 shrink-0 mt-0.5 ${isDarkMode ? "text-[var(--color-cyan)]" : "text-cyan-600"}`} />
            <p className={isDarkMode ? "text-white/40" : "text-black/55"}>
              This is your prompt repository and visual library. You can generate new AI images directly using the prompt input fixed at the bottom of the page.
            </p>
          </div>

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
            {activeCategory === "public_showcase" && showcaseTab === "galleries" ? (
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
                ) : (activeAssets.length === 0 && (!isGenerating || activeCategory !== "all")) ? (
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
                ) : (
                  
                  /* ================= CORE PHOTO IMAGE GRID ================= */
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
                      {activeAssets.map((asset, i) => {
                        const index = (isGenerating && activeCategory === "all") ? i + 1 : i;
                        const spanClass = getBentoSpanClass(index);
                        return renderCard(asset, index, spanClass);
                      })}
                    </AnimatePresence>
                  </BentoGrid>
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
      {/* Expanded Image Modal - Fullscreen Lightbox */}
      <AnimatePresence>
        {expandedAsset && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className={`fixed inset-0 z-[100] flex transition-colors duration-300 ${
              isDarkMode ? "bg-[#0d0d0c]/98 text-white" : "bg-[#f4f3f2]/98 text-black"
            }`}
            onClick={() => setExpandedAsset(null)}
          >
            {/* Close button */}
            <button
              onClick={() => setExpandedAsset(null)}
              className={`absolute top-4 right-4 md:top-5 md:right-5 z-50 p-2 md:p-2.5 rounded-full transition-all duration-200 border backdrop-blur-md ${
                isDarkMode
                  ? "bg-white/[0.04] text-white/50 hover:bg-white/10 hover:text-white border-white/[0.06]"
                  : "bg-black/[0.04] text-black/50 hover:bg-black/10 hover:text-black border-black/[0.06]"
              }`}
            >
              <X className="h-4 w-4 md:h-5 md:w-5" />
            </button>

            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={{ type: "spring", damping: 26, stiffness: 160 }}
              className="w-full h-full flex flex-col md:flex-row"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Image Container - 80% width on desktop */}
              <div id="expanded-image-wrap" className={`flex-[4] flex items-center justify-center p-3 md:p-6 relative min-h-[40vh] md:min-h-0 transition-colors duration-300 ${
                isDarkMode ? "bg-black/40" : "bg-black/5"
              }`}>
                {brokenImages.has(expandedAsset.id) ? (
                  <div className="text-center p-4">
                    <ImageIcon className={`h-12 w-12 mx-auto mb-3 ${isDarkMode ? "text-white/20" : "text-black/20"}`} />
                    <p className={`text-sm font-mono ${isDarkMode ? "text-white/30" : "text-black/30"}`}>Image unavailable</p>
                    <p className={`text-[11px] font-mono mt-1 ${isDarkMode ? "text-white/20" : "text-black/20"}`}>The image data may be corrupted or the URL may have expired.</p>
                  </div>
                ) : (
                  <img
                    src={getAssetImageUrl(expandedAsset)}
                    alt={expandedAsset.prompt || "Concept visual"}
                    className="max-w-full max-h-full w-auto h-auto object-contain rounded-lg md:rounded-xl select-none shadow-lg"
                    draggable={false}
                    onError={() => setBrokenImages(prev => new Set(prev).add(expandedAsset.id))}
                  />
                )}
                {/* Mobile prompt overlay */}
                <div className="absolute bottom-2 left-2 right-2 md:hidden">
                  <div className={`backdrop-blur-xl border rounded-xl px-3.5 py-2.5 transition-colors duration-300 ${
                    isDarkMode ? "bg-black/70 border-white/[0.06] text-white/90" : "bg-white/80 border-black/[0.06] text-black/90"
                  }`}>
                    <p className="text-xs line-clamp-2">{expandedAsset.prompt || "No prompt"}</p>
                  </div>
                </div>
              </div>

              {/* Details Panel - 360px on desktop */}
              <div className={`w-full md:w-[360px] shrink-0 flex flex-col overflow-y-auto border-t md:border-t-0 md:border-l transition-colors duration-300 ${
                isDarkMode ? "bg-[#0d0d0c] border-white/[0.06]" : "bg-[#f4f3f2] border-black/[0.06]"
              }`}>
                {/* Header badges + title + heart */}
                <div className={`px-5 py-4 border-b shrink-0 ${isDarkMode ? "border-white/[0.06]" : "border-black/[0.06]"}`}>
                  <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold font-mono uppercase tracking-wider border ${
                      isDarkMode ? "bg-white/10 text-white/95 border-white/10" : "bg-black/10 text-black/95 border-black/10"
                    }`}>
                      {expandedAsset.asset_type || "image"}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold font-mono uppercase tracking-wider border ${
                      expandedAsset.is_public
                        ? "bg-sky-500/10 text-sky-400 border-sky-400/20"
                        : "bg-amber-500/10 text-amber-400 border-amber-400/20"
                    }`}>
                      {expandedAsset.is_public ? "Public" : "Private"}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold font-mono uppercase tracking-wider border ${
                      isDarkMode ? "bg-white/[0.03] text-white/40 border-white/[0.06]" : "bg-black/[0.03] text-black/40 border-black/[0.06]"
                    }`}>
                      {expandedAsset.id.startsWith("feat-") ? "Featured" : expandedAsset.id.startsWith("uploaded-") ? "Upload" : "Library"}
                    </span>
                  </div>
              <div className="flex items-center justify-between">
                    <h3 className={`text-sm font-bold font-sans tracking-tight ${isDarkMode ? "text-white" : "text-black"}`}>
                      {expandedAsset.id.startsWith("feat-") ? "Featured Creation" : "Library Asset"}
                    </h3>
                    {!expandedAsset.id.startsWith("feat-") && (
                      <button
                        onClick={() => toggleSaved(expandedAsset)}
                        className={`p-1.5 rounded-full transition-all duration-200 active:scale-90 ${
                          savedIds.includes(expandedAsset.id)
                            ? (isDarkMode ? "text-white bg-white/10" : "text-black bg-black/10")
                            : isDarkMode
                              ? "text-white/30 hover:text-white/60 hover:bg-white/5"
                              : "text-black/30 hover:text-black/60 hover:bg-black/5"
                        }`}
                      >
                        <Heart className={`h-3.5 w-3.5 ${savedIds.includes(expandedAsset.id) ? "fill-current" : ""}`} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Scrollable details content */}
                <div className={`flex-1 px-5 py-4 space-y-4 overflow-y-auto ${isDarkMode ? "text-white" : "text-black"}`}>
                  {/* Prompt */}
                  <div>
                    <span className={`text-[9px] font-mono uppercase tracking-widest ${isDarkMode ? "text-white/30" : "text-black/40"}`}>
                      Prompt Idea
                    </span>
                    <p className={`text-xs mt-1 leading-relaxed font-sans ${isDarkMode ? "text-white/80" : "text-black/70"}`}>
                      {expandedAsset.prompt || "No prompt text provided."}
                    </p>
                    {expandedAsset.prompt && (
                      <button
                        onClick={() => { navigator.clipboard.writeText(expandedAsset.prompt || ""); toast.success("Prompt copied to clipboard!"); }}
                        className={`flex items-center gap-1 text-[10px] font-semibold mt-1.5 transition-colors ${
                          isDarkMode ? "text-white/80 hover:text-white" : "text-black/80 hover:text-black"
                        }`}
                      >
                        <Copy className="h-3 w-3" />
                        Copy Prompt
                      </button>
                    )}
                  </div>

                  <div className={`h-px ${isDarkMode ? "bg-white/[0.04]" : "bg-black/[0.04]"}`} />

                  {/* Metadata Grid */}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                    <div>
                      <span className={`text-[9px] font-mono uppercase tracking-widest block ${isDarkMode ? "text-white/30" : "text-black/40"}`}>
                        Created
                      </span>
                      <span className={`text-[11px] font-medium block mt-0.5 ${isDarkMode ? "text-white/70" : "text-black/60"}`}>
                        {expandedAsset.created_at
                          ? new Date(expandedAsset.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
                          : "Unknown"}
                      </span>
                    </div>
                    <div>
                      <span className={`text-[9px] font-mono uppercase tracking-widest block ${isDarkMode ? "text-white/30" : "text-black/40"}`}>
                        Type
                      </span>
                      <span className={`text-[11px] font-medium capitalize block mt-0.5 ${isDarkMode ? "text-white/70" : "text-black/60"}`}>
                        {expandedAsset.asset_type || "Image"}
                      </span>
                    </div>
                    <div>
                      <span className={`text-[9px] font-mono uppercase tracking-widest block ${isDarkMode ? "text-white/30" : "text-black/40"}`}>
                        Visibility
                      </span>
                      <span className={`text-[11px] font-semibold block mt-0.5 uppercase ${expandedAsset.is_public ? "text-sky-400" : "text-amber-400"}`}>
                        {expandedAsset.is_public ? "Public" : "Private"}
                      </span>
                    </div>
                    <div>
                      <span className={`text-[9px] font-mono uppercase tracking-widest block ${isDarkMode ? "text-white/30" : "text-black/40"}`}>
                        Saved
                      </span>
                      <span className={`text-[11px] font-medium block mt-0.5 ${savedIds.includes(expandedAsset.id) ? (isDarkMode ? "text-white" : "text-black") : isDarkMode ? "text-white" : "text-black"}`}>
                        {savedIds.includes(expandedAsset.id) ? "Yes" : "No"}
                      </span>
                    </div>
                    {expandedAsset.gallery_id && (
                      <div className="col-span-2">
                        <span className={`text-[9px] font-mono uppercase tracking-widest block ${isDarkMode ? "text-white/30" : "text-black/40"}`}>
                          Folder
                        </span>
                        <span className={`text-[11px] font-medium block mt-0.5 flex items-center gap-1.5 ${isDarkMode ? "text-white/70" : "text-black/60"}`}>
                          <Folder className="h-3 w-3 text-zinc-400" />
                          {(() => { const g = [...galleries, ...publicGalleries].find(g => g.id === expandedAsset.gallery_id); return g?.name || "Unknown Folder"; })()}
                        </span>
                      </div>
                    )}
                    <div className="col-span-2">
                      <span className={`text-[9px] font-mono uppercase tracking-widest block ${isDarkMode ? "text-white/30" : "text-black/40"}`}>
                        Asset ID
                      </span>
                      <span className={`text-[11px] font-mono block mt-0.5 break-all ${isDarkMode ? "text-white" : "text-black"}`}>
                        {expandedAsset.id}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom actions */}
                <div className={`px-5 py-3 border-t space-y-2 shrink-0 ${isDarkMode ? "border-white/[0.06]" : "border-black/[0.06]"}`}>
                  <div className="grid grid-cols-2 gap-2">
<a
                      href={getAssetImageUrl(expandedAsset)}
                      download={`rudra-${expandedAsset.id}.png`}
                      target="_blank"
                      rel="noreferrer"
                      className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold font-mono uppercase tracking-wider transition-all active:scale-[0.98] shadow-lg ${
                        isDarkMode
                          ? "bg-white text-black hover:bg-white/90 shadow-white/5"
                          : "bg-black text-white hover:bg-black/90 shadow-black/5"
                      }`}
                    >
                      <Download className="h-3.5 w-3.5" />
                      Download
                    </a>
                    <button
                      onClick={() => {
                        const el = document.getElementById("expanded-image-wrap")
                        if (el?.requestFullscreen) {
                          el.requestFullscreen()
                        } else {
                          window.open(getAssetImageUrl(expandedAsset), "_blank")
                        }
                      }}
                      className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold font-mono uppercase tracking-wider border transition-all active:scale-[0.98] ${
                        isDarkMode
                          ? "border-white/[0.06] text-white/60 hover:border-white/20 hover:text-white"
                          : "border-black/[0.06] text-black/60 hover:border-black/20 hover:text-black"
                      }`}
                    >
                      <Maximize2 className="h-3.5 w-3.5" />
                      Fullscreen
                    </button>
                  </div>
                  <button
                    onClick={() => { navigator.clipboard.writeText(getAssetImageUrl(expandedAsset)); toast.success("Image URL copied!"); }}
                    className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold font-mono uppercase tracking-wider border transition-all active:scale-[0.98] ${
                      isDarkMode
                        ? "border-white/[0.06] text-white/60 hover:border-white/20 hover:text-white"
                        : "border-black/[0.06] text-black/60 hover:border-black/20 hover:text-black"
                    }`}
                  >
                    <Copy className="h-3.5 w-3.5" />
                    Copy Link
                  </button>
                </div>
              </div>
            </motion.div>
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
