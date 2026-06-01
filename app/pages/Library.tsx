"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Navbar from "@/components/ui/Navbar"
import {
  getLibraryAssets,
  deleteLibraryAsset,
  getPublicLibraryAssets,
  toggleAssetVisibility,
  type LibraryAsset
} from "@/lib/chat-api"
import { isAuthenticated } from "@/lib/auth"
import { useTheme } from "@/lib/theme-context"
import {
  Loader2,
  Trash2,
  BookOpen,
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
  Sliders,
  Maximize2,
  Eye,
  Search,
  X,
  ChevronRight,
  Folder,
  Globe,
  Lock,
  Info
} from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import Link from "next/link"

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

export default function LibraryPage() {
  const router = useRouter()
  const { isDarkMode } = useTheme()
  
  const [assets, setAssets] = useState<LibraryAsset[]>([])
  const [publicAssets, setPublicAssets] = useState<LibraryAsset[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [togglingVisibilityId, setTogglingVisibilityId] = useState<string | null>(null)
  
  // Custom Interactive States
  const [activeCategory, setActiveCategory] = useState<"featured" | "recent" | "saved" | "all" | "favorites" | "uploads" | "public_showcase">("featured")
  const [aspectRatio, setAspectRatio] = useState<"1:1" | "16:9" | "9:16">("1:1")
  const [activePreset, setActivePreset] = useState<"none" | "balloon" | "stop-motion" | "archival" | "film-noir" | "cardboard">("none")
  const [isPresetOpen, setIsPresetOpen] = useState(false)
  const [resolution, setResolution] = useState<"480p" | "720p" | "1080p" | "4K">("1080p")
  const [duration, setDuration] = useState<"5s" | "10s" | "15s">("5s")
  const [motionSpeed, setMotionSpeed] = useState<"2v" | "4v" | "8v">("2v")
  const [searchQuery, setSearchQuery] = useState("")
  const [favorites, setFavorites] = useState<string[]>([])
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [isUploadDragging, setIsUploadDragging] = useState(false)
  const [uploadedAssets, setUploadedAssets] = useState<LibraryAsset[]>([])
  
  // Custom Dynamic Folders
  const [customFolders, setCustomFolders] = useState<string[]>(["Cinematics", "Abstracts"])
  
  // Fetch assets from actual backend
  const fetchAssets = useCallback(async () => {
    try {
      const data = await getLibraryAssets()
      setAssets(data.assets)
      
      const pubData = await getPublicLibraryAssets()
      setPublicAssets(pubData.assets)
    } catch (err: any) {
      toast.error(err.message || "Failed to load image library.")
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Initialize Auth & Favorites
  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace("/auth/login")
      return
    }
    fetchAssets()
    
    // Load local storage favorites
    const savedFavs = localStorage.getItem("rudra_library_favorites")
    if (savedFavs) {
      try {
        setFavorites(JSON.parse(savedFavs))
      } catch (e) {}
    }
  }, [fetchAssets, router])

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

  // Toggling Favorites (stored in localStorage)
  const toggleFavorite = (id: string) => {
    let updated: string[] = []
    if (favorites.includes(id)) {
      updated = favorites.filter((favId) => favId !== id)
      toast.success("Removed from Favorites.")
    } else {
      updated = [...favorites, id]
      toast.success("Added to Favorites.")
    }
    setFavorites(updated)
    localStorage.setItem("rudra_library_favorites", JSON.stringify(updated))
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

  // Aspect ratio helper functions
  const handleCycleAspectRatio = () => {
    const ratios: ("1:1" | "16:9" | "9:16")[] = ["1:1", "16:9", "9:16"]
    const nextIndex = (ratios.indexOf(aspectRatio) + 1) % ratios.length
    const nextRatio = ratios[nextIndex]
    setAspectRatio(nextRatio)
    toast.success(`Aspect Ratio set to ${nextRatio}`)
  }

  const handleCycleResolution = () => {
    const resList: ("480p" | "720p" | "1080p" | "4K")[] = ["480p", "720p", "1080p", "4K"]
    const nextIndex = (resList.indexOf(resolution) + 1) % resList.length
    setResolution(resList[nextIndex])
    toast.success(`Quality: ${resList[nextIndex]}`)
  }

  const handleCycleDuration = () => {
    const durList: ("5s" | "10s" | "15s")[] = ["5s", "10s", "15s"]
    const nextIndex = (durList.indexOf(duration) + 1) % durList.length
    setDuration(durList[nextIndex])
    toast.success(`Length: ${durList[nextIndex]}`)
  }

  const handleCycleMotionSpeed = () => {
    const speeds: ("2v" | "4v" | "8v")[] = ["2v", "4v", "8v"]
    const nextIndex = (speeds.indexOf(motionSpeed) + 1) % speeds.length
    setMotionSpeed(speeds[nextIndex])
    toast.success(`Multiplier set to ${speeds[nextIndex]}`)
  }

  const handleCopyPrompt = (promptText: string, id: string) => {
    navigator.clipboard.writeText(promptText)
    setCopiedId(id)
    toast.success("Prompt copied to clipboard!")
    setTimeout(() => setCopiedId(null), 2000)
  }

  // Create mock new folder
  const handleCreateFolder = () => {
    const name = prompt("Enter new folder name:")
    if (name && name.trim()) {
      setCustomFolders((prev) => [...prev, name.trim()])
      toast.success(`Created folder "${name.trim()}"`)
    }
  }

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
      case "featured": pool = FEATURED_ASSETS; break
      case "recent": pool = assets.slice(0, 4); break
      case "public_showcase": pool = publicAssets; break
      case "favorites": pool = [...FEATURED_ASSETS, ...assets, ...uploadedAssets].filter((asset) => favorites.includes(asset.id)); break
      case "uploads": pool = uploadedAssets; break
      case "saved": pool = [...FEATURED_ASSETS, ...assets].filter((_, index) => index % 2 === 0); break
      case "all": default: pool = [...uploadedAssets, ...assets]; break
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      pool = pool.filter((asset) => asset.prompt?.toLowerCase().includes(q))
    }
    return pool
  }, [activeCategory, assets, publicAssets, uploadedAssets, favorites, searchQuery])

  // Get active CSS filter for presets
  const getPresetFilterClass = () => {
    switch (activePreset) {
      case "balloon": return "brightness-[1.05] contrast-[1.05] saturate-[1.4] sepia-[0.05]"
      case "stop-motion": return "contrast-[1.25] sepia-[0.15] hue-rotate-[10deg]"
      case "archival": return "sepia-[0.6] saturate-[0.6] contrast-[1.1]"
      case "film-noir": return "grayscale-[1] contrast-[1.5] brightness-[0.85]"
      case "cardboard": return "contrast-[1.1] saturate-[1.25] sepia-[0.25]"
      default: return "filter-none"
    }
  }

  // Aspect ratio wrapper class
  const getCardAspectRatioClass = () => {
    switch (aspectRatio) {
      case "16:9": return "aspect-[16/9]"
      case "9:16": return "aspect-[9/16]"
      default: return "aspect-square"
    }
  }

  if (isLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${isDarkMode ? "bg-[#070709]" : "bg-[#f8f9fa]"}`}>
        <div className="flex flex-col items-center gap-4">
          <Loader2 className={`h-10 w-10 animate-spin ${isDarkMode ? "text-[var(--color-cyan)]" : "text-cyan-600"}`} />
          <p className={`text-xs font-mono tracking-widest uppercase ${isDarkMode ? "text-white/40" : "text-black/40"}`}>
            Connecting Library...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 selection:bg-[var(--color-cyan)] selection:text-black ${
      isDarkMode ? "bg-[#060608] text-white" : "bg-[#f8f9fa] text-black"
    }`}>
      {/* Navbar styled like Chat Navbar */}
      <Navbar />

      {/* Main Core Layout: Sidebar + Grid View */}
      <div className="pt-20 flex min-h-[calc(100vh-80px)]">
        
        {/* ================= LEFT SIDEBAR ================= */}
        <aside className={`w-64 border-r flex flex-col justify-between select-none shrink-0 sticky top-20 h-[calc(100vh-80px)] overflow-y-auto scrollbar-hide transition-colors duration-300 ${
          isDarkMode ? "border-white/5 bg-[#08080a]" : "border-black/5 bg-[#f1f3f5]"
        }`}>
          
          <div className="p-5 flex flex-col gap-7">
            {/* Header */}
            <div className="flex items-center gap-3 px-1">
              <div className="h-6 w-6 rounded-full bg-gradient-to-tr from-[var(--color-cyan)] to-indigo-500 flex items-center justify-center shadow-[0_0_12px_rgba(0,221,221,0.2)]">
                <Sparkles className="h-3.5 w-3.5 text-black" />
              </div>
              <span className={`font-display font-semibold tracking-wider text-xs uppercase ${isDarkMode ? "text-white/80" : "text-black/80"}`}>
                Rudra Omniverse
              </span>
            </div>

            {/* Explore Section */}
            <div className="flex flex-col gap-1.5">
              <span className={`text-[9px] font-mono tracking-widest uppercase px-2.5 mb-1 block ${isDarkMode ? "text-white/20" : "text-black/35"}`}>
                Explore
              </span>
              
              <button
                onClick={() => { setActiveCategory("featured"); setIsUploadDragging(false); }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium font-sans transition-all duration-200 ${
                  activeCategory === "featured"
                    ? (isDarkMode ? "bg-white/5 text-[var(--color-cyan)] border border-white/5" : "bg-black/5 text-cyan-600 border border-black/5")
                    : (isDarkMode ? "text-white/45 hover:text-white/90 hover:bg-white/[0.02]" : "text-black/50 hover:text-black hover:bg-black/[0.02]")
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Featured Feed</span>
                </div>
                {activeCategory === "featured" && <div className="h-1.5 w-1.5 rounded-full bg-[var(--color-cyan)]" />}
              </button>

              <button
                onClick={() => { setActiveCategory("public_showcase"); setIsUploadDragging(false); }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium font-sans transition-all duration-200 ${
                  activeCategory === "public_showcase"
                    ? (isDarkMode ? "bg-white/5 text-[var(--color-cyan)] border border-white/5" : "bg-black/5 text-cyan-600 border border-black/5")
                    : (isDarkMode ? "text-white/45 hover:text-white/90 hover:bg-white/[0.02]" : "text-black/50 hover:text-black hover:bg-black/[0.02]")
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Globe className="h-3.5 w-3.5 text-sky-500/80" />
                  <span>Community Showcase</span>
                </div>
                {activeCategory === "public_showcase" && <div className="h-1.5 w-1.5 rounded-full bg-[var(--color-cyan)]" />}
              </button>

              <button
                onClick={() => { setActiveCategory("recent"); setIsUploadDragging(false); }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium font-sans transition-all duration-200 ${
                  activeCategory === "recent"
                    ? (isDarkMode ? "bg-white/5 text-[var(--color-cyan)] border border-white/5" : "bg-black/5 text-cyan-600 border border-black/5")
                    : (isDarkMode ? "text-white/45 hover:text-white/90 hover:bg-white/[0.02]" : "text-black/50 hover:text-black hover:bg-black/[0.02]")
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Clock className="h-3.5 w-3.5" />
                  <span>Recent Creations</span>
                </div>
                {activeCategory === "recent" && <div className="h-1.5 w-1.5 rounded-full bg-[var(--color-cyan)]" />}
              </button>

              <button
                onClick={() => { setActiveCategory("saved"); setIsUploadDragging(false); }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium font-sans transition-all duration-200 ${
                  activeCategory === "saved"
                    ? (isDarkMode ? "bg-white/5 text-[var(--color-cyan)] border border-white/5" : "bg-black/5 text-cyan-600 border border-black/5")
                    : (isDarkMode ? "text-white/45 hover:text-white/90 hover:bg-white/[0.02]" : "text-black/50 hover:text-black hover:bg-black/[0.02]")
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Bookmark className="h-3.5 w-3.5" />
                  <span>Saved Templates</span>
                </div>
                {activeCategory === "saved" && <div className="h-1.5 w-1.5 rounded-full bg-[var(--color-cyan)]" />}
              </button>
            </div>

            {/* Library Section */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between px-2.5 mb-1">
                <span className={`text-[9px] font-mono tracking-widest uppercase block ${isDarkMode ? "text-white/20" : "text-black/35"}`}>
                  Personal Workspace
                </span>
                <button onClick={handleCreateFolder} className={`transition-colors ${isDarkMode ? "text-white/30 hover:text-[var(--color-cyan)]" : "text-black/30 hover:text-cyan-600"}`}>
                  <FolderPlus className="h-3 w-3" />
                </button>
              </div>

              <button
                onClick={() => { setActiveCategory("all"); setIsUploadDragging(false); }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium font-sans transition-all duration-200 ${
                  activeCategory === "all"
                    ? (isDarkMode ? "bg-white/5 text-[var(--color-cyan)] border border-white/5" : "bg-black/5 text-cyan-600 border border-black/5")
                    : (isDarkMode ? "text-white/45 hover:text-white/90 hover:bg-white/[0.02]" : "text-black/50 hover:text-black hover:bg-black/[0.02]")
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <ImageIcon className="h-3.5 w-3.5" />
                  <span>My Gallery</span>
                </div>
                {activeCategory === "all" && <div className="h-1.5 w-1.5 rounded-full bg-[var(--color-cyan)]" />}
              </button>

              <button
                onClick={() => { setActiveCategory("favorites"); setIsUploadDragging(false); }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium font-sans transition-all duration-200 ${
                  activeCategory === "favorites"
                    ? (isDarkMode ? "bg-white/5 text-[var(--color-cyan)] border border-white/5" : "bg-black/5 text-cyan-600 border border-black/5")
                    : (isDarkMode ? "text-white/45 hover:text-white/90 hover:bg-white/[0.02]" : "text-black/50 hover:text-black hover:bg-black/[0.02]")
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Heart className="h-3.5 w-3.5" />
                  <span>Favorites</span>
                </div>
                {activeCategory === "favorites" && <div className="h-1.5 w-1.5 rounded-full bg-[var(--color-cyan)]" />}
              </button>

              <button
                onClick={() => { setActiveCategory("uploads"); setIsUploadDragging(false); }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium font-sans transition-all duration-200 ${
                  activeCategory === "uploads"
                    ? (isDarkMode ? "bg-white/5 text-[var(--color-cyan)] border border-white/5" : "bg-black/5 text-cyan-600 border border-black/5")
                    : (isDarkMode ? "text-white/45 hover:text-white/90 hover:bg-white/[0.02]" : "text-black/50 hover:text-black hover:bg-black/[0.02]")
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Upload className="h-3.5 w-3.5" />
                  <span>My Uploads</span>
                </div>
                {activeCategory === "uploads" && <div className="h-1.5 w-1.5 rounded-full bg-[var(--color-cyan)]" />}
              </button>
            </div>

            {/* Custom Folders list */}
            {customFolders.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <span className={`text-[9px] font-mono tracking-widest uppercase px-2.5 mb-1 block ${isDarkMode ? "text-white/20" : "text-black/35"}`}>
                  Folders
                </span>
                {customFolders.map((folderName) => (
                  <button
                    key={folderName}
                    onClick={() => {
                      toast.info(`Opened folder "${folderName}"`);
                      setActiveCategory("all");
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs hover:bg-white/[0.02] text-left transition-all font-sans ${
                      isDarkMode ? "text-white/40 hover:text-white/85" : "text-black/50 hover:text-black"
                    }`}
                  >
                    <Folder className="h-3.5 w-3.5 text-amber-500/60" />
                    <span className="truncate">{folderName}</span>
                  </button>
                ))}
              </div>
            )}

          </div>

          {/* Sidebar Footer info */}
          <div className={`p-5 border-t text-[10px] font-mono flex flex-col gap-1.5 ${
            isDarkMode ? "border-white/5 bg-black/10 text-white/20" : "border-black/5 bg-black/[0.02] text-black/40"
          }`}>
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Library Server: Connected</span>
            </div>
            <div>Version: Rudra 2.0</div>
          </div>
          
        </aside>

        {/* ================= RIGHT MAIN CONTENT GRID ================= */}
        <main className={`flex-1 overflow-y-auto px-8 py-8 pb-32 relative transition-colors duration-300 ${
          isDarkMode ? "bg-[#09090b] bg-mesh" : "bg-[#f8f9fa]"
        }`}>
          
          {/* Header */}
          <div className={`flex justify-between items-end mb-6 border-b pb-5 transition-colors duration-300 ${
            isDarkMode ? "border-white/5" : "border-black/5"
          }`}>
            <div>
              <div className={`flex items-center gap-2 text-[11px] font-mono tracking-widest uppercase mb-1 ${
                isDarkMode ? "text-white/40" : "text-black/50"
              }`}>
                <span>Rudra Library</span>
                <ChevronRight className="h-3 w-3" />
                <span className="text-[var(--color-cyan)] font-sans font-semibold normal-case tracking-normal">
                  {activeCategory === "public_showcase" ? "Community Showcase" : activeCategory.charAt(0).toUpperCase() + activeCategory.slice(1)}
                </span>
              </div>
              
              <div className="flex items-center gap-4">
                <h1 className="text-2xl font-display font-semibold tracking-tight">
                  {activeCategory === "featured" && "Featured Concept Showcase"}
                  {activeCategory === "public_showcase" && "Community Shared Prompts"}
                  {activeCategory === "recent" && "Your Recent Render Prompts"}
                  {activeCategory === "saved" && "Saved Concept Templates"}
                  {activeCategory === "all" && "My Private Gallery"}
                  {activeCategory === "favorites" && "Bookmarked Prompts"}
                  {activeCategory === "uploads" && "Local Upload Repository"}
                </h1>
              </div>
            </div>

            {/* Back to Chat Option */}
            <div className="flex items-center gap-3 select-none">
              <Link
                href="/chat"
                className={`flex items-center gap-2 px-4 py-2 border rounded-xl text-xs font-semibold uppercase tracking-wider transition-all duration-300 ${
                  isDarkMode
                    ? "bg-white/5 border-white/10 text-white hover:bg-white/10"
                    : "bg-white border-black/10 text-black hover:bg-black/[0.03] shadow-sm"
                }`}
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Back to Chat</span>
              </Link>
            </div>
          </div>

          {/* 💡 Prompts Only Disclaimer notice */}
          <div className={`mb-6 p-4 border rounded-xl flex items-start gap-3 text-xs leading-relaxed transition-colors duration-300 ${
            isDarkMode
              ? "bg-[#101014]/60 border-white/5 text-white/70"
              : "bg-white border-black/5 text-black/70 shadow-sm"
          }`}>
            <Info className={`h-4.5 w-4.5 shrink-0 mt-0.5 ${isDarkMode ? "text-[var(--color-cyan)]" : "text-cyan-600"}`} />
            <div>
              <p className="font-semibold mb-0.5">Prompt Repository & Personal Library</p>
              <p className={isDarkMode ? "text-white/40" : "text-black/55"}>
                This page acts as a library database for prompt discovery and storage. Images are read-only. 
                You can copy any prompt or use the bottom action panel to load them into your clipboard to generate in the Chat workspace.
              </p>
            </div>
          </div>

          {/* Curated Preset Active Indicator Banner */}
          {activePreset !== "none" && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 px-4 py-2 border border-[var(--color-cyan)]/20 bg-[var(--color-cyan)]/5 text-[var(--color-cyan)] rounded-xl flex items-center justify-between text-xs shadow-inner"
            >
              <div className="flex items-center gap-2">
                <Sliders className="h-3.5 w-3.5" />
                <span>
                  Color grading filter <strong>{activePreset.toUpperCase()}</strong> applied to view.
                </span>
              </div>
              <button
                onClick={() => { setActivePreset("none"); toast.success("Preset reset to default."); }}
                className="text-[10px] font-mono uppercase bg-white/10 hover:bg-white/20 text-white px-2 py-0.5 rounded transition-colors"
              >
                Disable
              </button>
            </motion.div>
          )}

          {/* ================= CONTENT CONTAINER ================= */}
          <div className="relative">
            
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
                  <p className={`text-xs ${isDarkMode ? "text-white/40" : "text-black/40"}`}>
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

            {/* Grid Empty State */}
            {activeAssets.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`flex flex-col items-center justify-center py-32 border rounded-2xl ${
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
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                <AnimatePresence mode="popLayout">
                  {activeAssets.map((asset, i) => {
                    const isOwnAsset = !asset.id.startsWith("feat-") && activeCategory !== "public_showcase";
                    
                    return (
                      <motion.div
                        key={asset.id}
                        layout
                        initial={{ opacity: 0, scale: 0.95, y: 15 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 10 }}
                        transition={{ duration: 0.35, ease: "easeOut", delay: Math.min(i * 0.02, 0.2) }}
                        className={`relative overflow-hidden group/card rounded-xl shadow-lg transition-shadow duration-300 hover:shadow-2xl ${
                          getCardAspectRatioClass()
                        } ${
                          isDarkMode ? "bg-black border border-white/[0.08]" : "bg-white border border-black/[0.08]"
                        }`}
                        onMouseEnter={() => setHoveredId(asset.id)}
                        onMouseLeave={() => setHoveredId(null)}
                      >
                        {/* CSS Preset Grading Filter applied here dynamically */}
                        <img
                          src={asset.asset_url}
                          alt={asset.prompt || "Concept visual"}
                          className={`w-full h-full object-cover transition-all duration-700 ease-out group-hover/card:scale-105 ${getPresetFilterClass()}`}
                          loading="lazy"
                        />

                        {/* Top Action Indicators (Heart and Visibility / Ownership) */}
                        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none select-none z-20">
                          {/* Visibility badge */}
                          <div className="flex gap-1.5">
                            <span className="px-2 py-0.5 bg-black/60 backdrop-blur-md border border-white/10 rounded-full text-[9px] font-mono uppercase tracking-wider text-white/80">
                              {asset.id.startsWith("feat-") ? "Featured" : asset.id.startsWith("uploaded-") ? "Upload" : "Library"}
                            </span>
                            
                            {/* Personal visibility status */}
                            {!asset.id.startsWith("feat-") && (
                              <span className={`px-2 py-0.5 bg-black/60 backdrop-blur-md border border-white/10 rounded-full text-[9px] font-mono uppercase tracking-wider text-white/80 flex items-center gap-1`}>
                                {asset.is_public ? (
                                  <>
                                    <Globe className="h-2.5 w-2.5 text-sky-400" />
                                    <span className="text-sky-400">Public</span>
                                  </>
                                ) : (
                                  <>
                                    <Lock className="h-2.5 w-2.5 text-amber-500/80" />
                                    <span>Private</span>
                                  </>
                                )}
                              </span>
                            )}
                          </div>
                          
                          <button
                            onClick={(e) => { e.preventDefault(); toggleFavorite(asset.id); }}
                            className={`p-1.5 rounded-full border backdrop-blur-md pointer-events-auto transition-all duration-200 active:scale-90 ${
                              favorites.includes(asset.id)
                                ? "bg-rose-500 border-rose-400 text-white scale-110 shadow-lg shadow-rose-500/20"
                                : "bg-black/60 border-white/10 text-white/50 hover:text-white hover:border-white/20"
                            }`}
                          >
                            <Heart className={`h-3 w-3 ${favorites.includes(asset.id) ? "fill-white" : ""}`} />
                          </button>
                        </div>

                        {/* Hover prompt and control Overlay */}
                        <div
                          className={`absolute inset-0 bg-gradient-to-t from-black/95 via-black/75 to-black/20 flex flex-col justify-end p-4 transition-all duration-300 z-10 ${
                            hoveredId === asset.id ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3 pointer-events-none"
                          }`}
                        >
                          {/* Prompt Description */}
                          <div className="max-h-[50%] overflow-y-auto mb-3 custom-scrollbar pr-1">
                            <p className="text-white/90 text-[11px] font-sans leading-relaxed text-left selection:bg-[var(--color-cyan)] selection:text-black">
                              {asset.prompt || "No prompt details."}
                            </p>
                          </div>

                          {/* Date and actions */}
                          <div className="flex items-center justify-between border-t border-white/10 pt-3 select-none">
                            <span className="text-white/35 text-[8.5px] font-mono uppercase tracking-wider">
                              {formatDate(asset.created_at)}
                            </span>

                            <div className="flex items-center gap-1">
                              {/* Visibility Toggle button (Only for own assets) */}
                              {isOwnAsset && (
                                <button
                                  onClick={(e) => { e.preventDefault(); handleToggleVisibility(asset.id, asset.is_public); }}
                                  disabled={togglingVisibilityId === asset.id}
                                  className={`p-1.5 rounded border border-white/5 transition-colors ${
                                    asset.is_public
                                      ? "bg-sky-500/20 text-sky-400 hover:bg-sky-500/30"
                                      : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
                                  }`}
                                  title={asset.is_public ? "Make Private" : "Make Public"}
                                >
                                  {togglingVisibilityId === asset.id ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : asset.is_public ? (
                                    <Globe className="h-3 w-3" />
                                  ) : (
                                    <Lock className="h-3 w-3" />
                                  )}
                                </button>
                              )}

                              {/* Copy prompt */}
                              <button
                                onClick={() => handleCopyPrompt(asset.prompt || "", asset.id)}
                                className="p-1.5 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors rounded border border-white/5"
                                title="Copy Prompt to Clipboard"
                              >
                                {copiedId === asset.id ? (
                                  <Check className="h-3 w-3 text-emerald-400" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </button>

                              {/* Load Prompt to Search Bar */}
                              <button
                                onClick={() => {
                                  setSearchQuery(asset.prompt || "");
                                  toast.success("Prompt loaded into filter input.");
                                }}
                                className="p-1.5 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors rounded border border-white/5"
                                title="Load Prompt to Filter input"
                              >
                                <Plus className="h-3 w-3" />
                              </button>

                              {/* Trash button (Only if own asset) */}
                              {isOwnAsset && (
                                <button
                                  onClick={() => handleDelete(asset.id)}
                                  disabled={deletingId === asset.id}
                                  className="p-1.5 bg-white/5 hover:bg-red-500/80 hover:text-white transition-colors rounded border border-white/5 group/del"
                                  title="Delete from Library"
                                >
                                  {deletingId === asset.id ? (
                                    <Loader2 className="h-3 w-3 text-white animate-spin" />
                                  ) : (
                                    <Trash2 className="h-3 w-3 text-white/45 group-hover/del:text-white" />
                                  )}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              </div>
            )}

          </div>

          {/* ================= FLOATING FILTER BAR ================= */}
          <div className="fixed bottom-6 left-[calc(50%+128px)] -translate-x-1/2 flex flex-col items-center gap-3 z-40 max-w-[800px] w-[90%] md:w-[60%] shrink-0">
            
            {/* Presets pop-up window floating above pill */}
            <AnimatePresence>
              {isPresetOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 12, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 12, scale: 0.96 }}
                  transition={{ duration: 0.2 }}
                  className={`w-64 border rounded-2xl p-2.5 shadow-2xl flex flex-col gap-1 select-none backdrop-blur-2xl ${
                    isDarkMode ? "glass-panel border-white/10 bg-[#0e0e12]/95" : "bg-white border-black/10 shadow-[0_15px_30px_rgba(0,0,0,0.15)] text-black"
                  }`}
                >
                  <div className={`flex items-center justify-between px-2.5 py-1 mb-1 border-b ${isDarkMode ? "border-white/5 text-white/45" : "border-black/5 text-black/50"}`}>
                    <span className="text-[10px] font-mono tracking-widest uppercase">Color Grading Filters</span>
                    <Sliders className={`h-3 w-3 ${isDarkMode ? "text-[var(--color-cyan)]" : "text-cyan-600"}`} />
                  </div>
                  
                  {[
                    { id: "none", label: "Default Normal" },
                    { id: "balloon", label: "Balloon (Warm tone)" },
                    { id: "stop-motion", label: "Stop Motion (Gritty)" },
                    { id: "archival", label: "Archival (Sepia)" },
                    { id: "film-noir", label: "Film Noir (High contrast B&W)" },
                    { id: "cardboard", label: "Cardboard Craft" }
                  ].map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => {
                        setActivePreset(preset.id as any);
                        setIsPresetOpen(false);
                        toast.success(`Filter: "${preset.label}" applied.`);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs font-sans transition-all flex items-center justify-between ${
                        activePreset === preset.id
                          ? (isDarkMode ? "bg-[var(--color-cyan)]/10 text-[var(--color-cyan)] font-semibold" : "bg-cyan-500/10 text-cyan-700 font-semibold")
                          : (isDarkMode ? "text-white/50 hover:bg-white/5 hover:text-white" : "text-black/60 hover:bg-black/5 hover:text-black")
                      }`}
                    >
                      <span>{preset.label}</span>
                      <div className={`h-1.5 w-1.5 rounded-full ${
                        activePreset === preset.id ? (isDarkMode ? "bg-[var(--color-cyan)]" : "bg-cyan-600") : "bg-transparent"
                      }`} />
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Core Pill Bar */}
            <div className={`w-full flex items-center justify-between gap-3 p-2 border rounded-full transition-all duration-300 ${
              isDarkMode
                ? "bg-[#101014]/90 border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] hover:border-white/20"
                : "bg-white/90 border-black/10 shadow-[0_10px_30px_rgba(0,0,0,0.08)] hover:border-black/20"
            }`}>
              
              {/* Left action Plus Button */}
              <button
                onClick={() => {
                  const p = prompt("Copy custom prompt context to load into workspace:")
                  if (p && p.trim()) {
                    setSearchQuery(p.trim());
                    toast.success("Loaded prompt query.");
                  }
                }}
                className={`h-9 w-9 rounded-full border flex items-center justify-center shrink-0 transition-all select-none ${
                  isDarkMode ? "bg-white/5 border-white/10 text-white/60 hover:text-white hover:bg-white/10" : "bg-black/5 border-black/10 text-black/60 hover:text-black hover:bg-black/10"
                }`}
                title="Input Search Filter Prompt"
              >
                <Plus className="h-4.5 w-4.5" />
              </button>

              {/* Middle Configurations Pills */}
              <div className={`hidden lg:flex items-center gap-1.5 overflow-x-auto scrollbar-hide py-0.5 select-none text-[10px] font-sans font-medium shrink-0 ${
                isDarkMode ? "text-white/50" : "text-black/60"
              }`}>
                
                {/* Preset controller */}
                <button
                  onClick={() => setIsPresetOpen(!isPresetOpen)}
                  className={`px-3 py-1.5 rounded-full border transition-all flex items-center gap-1.5 ${
                    activePreset !== "none"
                      ? (isDarkMode ? "bg-[var(--color-cyan)]/10 border-[var(--color-cyan)]/30 text-[var(--color-cyan)]" : "bg-cyan-500/10 border-cyan-500/30 text-cyan-700")
                      : (isDarkMode ? "bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10" : "bg-black/5 border-black/5 hover:bg-black/10 hover:border-black/10")
                  }`}
                >
                  <Sliders className="h-3 w-3" />
                  <span>Preset: {activePreset === "none" ? "None" : activePreset.charAt(0).toUpperCase() + activePreset.slice(1)}</span>
                </button>

                {/* Aspect Ratio controller */}
                <button
                  onClick={handleCycleAspectRatio}
                  className={`px-3 py-1.5 rounded-full border transition-all flex items-center gap-1.5 ${
                    isDarkMode ? "bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10" : "bg-black/5 border-black/5 hover:bg-black/10 hover:border-black/10"
                  }`}
                >
                  <Maximize2 className="rotate-45 h-3 w-3 text-white/40" />
                  <span>Ratio: {aspectRatio}</span>
                </button>

                {/* Quality Resolution controller */}
                <button
                  onClick={handleCycleResolution}
                  className={`px-3 py-1.5 rounded-full border transition-all flex items-center gap-1.5 ${
                    isDarkMode ? "bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10" : "bg-black/5 border-black/5 hover:bg-black/10 hover:border-black/10"
                  }`}
                >
                  <Eye className="h-3 w-3 text-white/40" />
                  <span>{resolution}</span>
                </button>

                {/* Duration Controller */}
                <button
                  onClick={handleCycleDuration}
                  className={`px-3 py-1.5 rounded-full border transition-all flex items-center gap-1.5 ${
                    isDarkMode ? "bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10" : "bg-black/5 border-black/5 hover:bg-black/10 hover:border-black/10"
                  }`}
                >
                  <Clock className="h-3 w-3 text-white/40" />
                  <span>{duration}</span>
                </button>

                {/* Speed Multiplier */}
                <button
                  onClick={handleCycleMotionSpeed}
                  className={`px-3 py-1.5 rounded-full border transition-all flex items-center gap-1.5 ${
                    isDarkMode ? "bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10" : "bg-black/5 border-black/5 hover:bg-black/10 hover:border-black/10"
                  }`}
                >
                  <span>{motionSpeed}</span>
                </button>

                <div className="h-4 w-[1px] bg-white/10 mx-1" />
                <span title="Presets & Filters" className="flex items-center">
                  <HelpCircle className="h-4.5 w-4.5 text-white/20 hover:text-white/50 cursor-pointer transition-colors" />
                </span>
              </div>

              {/* Text search & prompt composer wrapper */}
              <div className={`flex-1 flex items-center border transition-all rounded-full px-3 py-1 ml-1 max-w-[450px] ${
                isDarkMode ? "bg-white/[0.03] border-white/5 focus-within:border-white/20" : "bg-black/[0.03] border-black/5 focus-within:border-black/20"
              }`}>
                <Search className="h-3.5 w-3.5 text-white/30 mr-2 shrink-0" />
                
                <input
                  type="text"
                  placeholder="Search prompts / filter library..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full bg-transparent border-none text-xs py-1 focus:outline-none ${
                    isDarkMode ? "text-white placeholder-white/20" : "text-black placeholder-black/35"
                  }`}
                />

                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="p-1 text-white/40 hover:text-white/80 shrink-0"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>

              {/* Load Prompt Composer Action Button */}
              <button
                onClick={handleLoadPromptToComposer}
                disabled={!searchQuery.trim()}
                className={`h-9 px-4 rounded-full font-sans text-xs font-semibold uppercase tracking-wider select-none transition-all flex items-center gap-1.5 ${
                  searchQuery.trim()
                    ? "bg-[var(--color-cyan)] text-black shadow-[0_0_12px_rgba(0,221,221,0.35)] hover:scale-105 active:scale-95 cursor-pointer"
                    : (isDarkMode ? "bg-white/5 text-white/25 cursor-not-allowed" : "bg-black/5 text-black/30 cursor-not-allowed")
                }`}
                title="Copy typed prompt text"
              >
                <span>Use Prompt</span>
                <Check className="h-3.5 w-3.5" />
              </button>

            </div>

          </div>

        </main>
      </div>
    </div>
  )
}
