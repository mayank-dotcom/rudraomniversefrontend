"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Navbar from "@/components/ui/Navbar"
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
  type LibraryAsset,
  type LibraryGallery
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
  Info,
  Edit2,
  FolderOpen
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
  const [activeCategory, setActiveCategory] = useState<string>("featured")
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
  
  // Custom Real Database-backed Galleries States
  const [galleries, setGalleries] = useState<LibraryGallery[]>([])
  const [publicGalleries, setPublicGalleries] = useState<LibraryGallery[]>([])
  const [selectedGalleryId, setSelectedGalleryId] = useState<string | null>(null)
  const [selectedPublicGalleryId, setSelectedPublicGalleryId] = useState<string | null>(null)
  const [publicGalleryAssets, setPublicGalleryAssets] = useState<LibraryAsset[]>([])
  const [isFetchingPublicGalleryAssets, setIsFetchingPublicGalleryAssets] = useState(false)
  const [showcaseTab, setShowcaseTab] = useState<"assets" | "galleries">("assets")
  
  // Fetch assets and galleries from backend
  const fetchAssets = useCallback(async () => {
    try {
      const data = await getLibraryAssets()
      setAssets(data.assets)
      
      const pubData = await getPublicLibraryAssets()
      setPublicAssets(pubData.assets)

      const galleriesData = await getLibraryGalleries()
      setGalleries(galleriesData.galleries)

      const pubGalleriesData = await getPublicLibraryGalleries()
      setPublicGalleries(pubGalleriesData.galleries)
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
      case "featured": pool = FEATURED_ASSETS; break
      case "recent": pool = assets.slice(0, 4); break
      case "public_showcase": pool = publicAssets.filter((asset) => asset.gallery_id === null); break
      case "favorites": pool = [...FEATURED_ASSETS, ...assets, ...uploadedAssets].filter((asset) => favorites.includes(asset.id)); break
      case "uploads": pool = uploadedAssets; break
      case "saved": pool = [...FEATURED_ASSETS, ...assets].filter((_, index) => index % 2 === 0); break
      case "gallery": pool = assets.filter((asset) => asset.gallery_id === selectedGalleryId); break
      case "public_gallery": pool = publicGalleryAssets; break
      case "all": default: pool = [...uploadedAssets, ...assets]; break
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      pool = pool.filter((asset) => asset.prompt?.toLowerCase().includes(q))
    }
    return pool
  }, [activeCategory, assets, publicAssets, uploadedAssets, favorites, searchQuery, selectedGalleryId, publicGalleryAssets])

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
                <button onClick={handleCreateGallery} className={`transition-colors ${isDarkMode ? "text-white/30 hover:text-[var(--color-cyan)]" : "text-black/30 hover:text-cyan-600"}`} title="Create Folder">
                  <FolderPlus className="h-3.5 w-3.5" />
                </button>
              </div>

              <button
                onClick={() => { setActiveCategory("all"); setIsUploadDragging(false); setSelectedGalleryId(null); }}
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
                onClick={() => { setActiveCategory("favorites"); setIsUploadDragging(false); setSelectedGalleryId(null); }}
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

            </div>

            {/* Custom Database Galleries list */}
            <div className="flex flex-col gap-1.5">
              <span className={`text-[9px] font-mono tracking-widest uppercase px-2.5 mb-1 block ${isDarkMode ? "text-white/20" : "text-black/35"}`}>
                Custom Folders
              </span>
              {galleries.length === 0 ? (
                <span className={`text-[10px] italic px-3 py-1 font-sans ${isDarkMode ? "text-white/20" : "text-black/30"}`}>
                  No folders created yet.
                </span>
              ) : (
                galleries.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => {
                      setSelectedGalleryId(g.id);
                      setActiveCategory("gallery");
                      setIsUploadDragging(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs hover:bg-white/[0.02] text-left transition-all font-sans ${
                      activeCategory === "gallery" && selectedGalleryId === g.id
                        ? (isDarkMode ? "bg-white/5 text-[var(--color-cyan)] border border-white/5 font-semibold" : "bg-black/5 text-cyan-600 border border-black/5 font-semibold")
                        : (isDarkMode ? "text-white/40 hover:text-white/85" : "text-black/50 hover:text-black")
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      {activeCategory === "gallery" && selectedGalleryId === g.id ? (
                        <FolderOpen className={`h-3.5 w-3.5 shrink-0 ${g.is_public ? "text-sky-400" : "text-amber-500/80"}`} />
                      ) : (
                        <Folder className={`h-3.5 w-3.5 shrink-0 ${g.is_public ? "text-sky-400/60" : "text-amber-500/60"}`} />
                      )}
                      <span className="truncate">{g.name}</span>
                    </div>
                    
                    <div className="flex items-center gap-1 shrink-0 select-none">
                      {g.is_public ? (
                        <Globe className="h-2.5 w-2.5 text-sky-400/70" />
                      ) : (
                        <Lock className="h-2.5 w-2.5 text-white/20" />
                      )}
                      <span className="text-[9px] font-mono opacity-40">({g.asset_count || 0})</span>
                    </div>
                  </button>
                ))
              )}
            </div>

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
                  {activeCategory === "public_showcase" && "Community Showcase"}
                  {activeCategory === "featured" && "Featured"}
                  {activeCategory === "recent" && "Recent"}
                  {activeCategory === "saved" && "Saved"}
                  {activeCategory === "all" && "My Gallery"}
                  {activeCategory === "favorites" && "Favorites"}
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
                  {activeCategory === "saved" && "Saved Concept Templates"}
                  {activeCategory === "all" && "My Private Gallery"}
                  {activeCategory === "favorites" && "Bookmarked Prompts"}
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
                                  : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white"
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
                              className="p-1.5 rounded border bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white transition-colors"
                              title="Rename Gallery"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>

                            {/* Delete */}
                            <button
                              onClick={() => handleDeleteGallery(currentGallery.id)}
                              className="p-1.5 rounded border bg-white/5 border-white/10 text-white/60 hover:bg-red-500/80 hover:text-white transition-colors"
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
                    ? (isDarkMode ? "bg-white/10 text-[var(--color-cyan)] shadow-sm" : "bg-white text-cyan-600 shadow-sm")
                    : (isDarkMode ? "text-white/45 hover:text-white/80" : "text-black/55 hover:text-black")
                }`}
              >
                Shared Prompts
              </button>
              <button
                onClick={() => setShowcaseTab("galleries")}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold font-sans tracking-wide transition-all flex items-center gap-1.5 ${
                  showcaseTab === "galleries"
                    ? (isDarkMode ? "bg-white/10 text-[var(--color-cyan)] shadow-sm" : "bg-white text-cyan-600 shadow-sm")
                    : (isDarkMode ? "text-white/45 hover:text-white/80" : "text-black/55 hover:text-black")
                }`}
              >
                <Folder className="h-3.5 w-3.5" />
                <span>Shared Folders</span>
              </button>
            </div>
          )}

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
              {activeCategory === "public_showcase" && showcaseTab === "galleries" ? (
              /* Community Shared Galleries Grid view */
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
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
                      onClick={() => {
                        setSelectedPublicGalleryId(g.id);
                        setActiveCategory("public_gallery");
                        fetchPublicGalleryAssetsCallback(g.id);
                      }}
                      className={`p-5 rounded-2xl border cursor-pointer select-none transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl ${
                        isDarkMode
                          ? "bg-white/[0.02] border-white/5 hover:bg-white/[0.04] hover:border-white/10"
                          : "bg-white border-black/5 hover:border-black/10 shadow-sm"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="p-3 bg-gradient-to-tr from-sky-500/20 to-indigo-500/20 rounded-xl text-sky-400">
                          <FolderOpen className="h-6 w-6" />
                        </div>
                        <span className="text-[10px] font-mono opacity-50 px-2 py-0.5 bg-black/25 rounded-full flex items-center gap-1">
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

                      <div className="flex items-center justify-between border-t border-white/5 pt-3">
                        <span className="text-[10px] font-mono text-[var(--color-cyan)]">
                          {g.asset_count || 0} image prompts
                        </span>
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

                {/* Grid Empty State / Loading State */}
                {activeCategory === "public_gallery" && isFetchingPublicGalleryAssets ? (
                  <div className="flex flex-col items-center justify-center py-32 border rounded-2xl border-dashed border-white/5 bg-white/[0.01] w-full">
                    <Loader2 className={`h-8 w-8 animate-spin mb-4 ${isDarkMode ? "text-[var(--color-cyan)]" : "text-cyan-600"}`} />
                    <p className={`text-xs font-mono tracking-wider uppercase ${isDarkMode ? "text-white/45" : "text-black/45"}`}>
                      Loading folder assets...
                    </p>
                  </div>
                ) : activeAssets.length === 0 ? (
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                    <AnimatePresence mode="popLayout">
                      {activeAssets.map((asset, i) => {
                        const isOwnAsset = !asset.id.startsWith("feat-") && activeCategory !== "public_showcase" && activeCategory !== "public_gallery";
                        
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
                                  {/* Folder assignment dropdown */}
                                  {isOwnAsset && galleries.length > 0 && (
                                    <select
                                      value={asset.gallery_id || ""}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        handleMoveAssetToGallery(asset.id, val === "" ? null : val);
                                      }}
                                      className="text-[9px] font-sans bg-black/80 border border-white/10 rounded px-1.5 py-1 text-white/70 hover:text-white focus:outline-none max-w-[80px] cursor-pointer mr-1"
                                      title="Add to folder"
                                    >
                                      <option value="" className="bg-[#0f0f14] text-white/40">No Folder</option>
                                      {galleries.map((g) => (
                                        <option key={g.id} value={g.id} className="bg-[#0f0f14] text-white">
                                          {g.name}
                                        </option>
                                      ))}
                                    </select>
                                  )}

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
              </>
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
                  <Maximize2 className={`rotate-45 h-3 w-3 ${isDarkMode ? "text-white/40" : "text-black/40"}`} />
                  <span>Ratio: {aspectRatio}</span>
                </button>

                {/* Quality Resolution controller */}
                <button
                  onClick={handleCycleResolution}
                  className={`px-3 py-1.5 rounded-full border transition-all flex items-center gap-1.5 ${
                    isDarkMode ? "bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10" : "bg-black/5 border-black/5 hover:bg-black/10 hover:border-black/10"
                  }`}
                >
                  <Eye className={`h-3 w-3 ${isDarkMode ? "text-white/40" : "text-black/40"}`} />
                  <span>{resolution}</span>
                </button>

                {/* Duration Controller */}
                <button
                  onClick={handleCycleDuration}
                  className={`px-3 py-1.5 rounded-full border transition-all flex items-center gap-1.5 ${
                    isDarkMode ? "bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10" : "bg-black/5 border-black/5 hover:bg-black/10 hover:border-black/10"
                  }`}
                >
                  <Clock className={`h-3 w-3 ${isDarkMode ? "text-white/40" : "text-black/40"}`} />
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

                <div className={`h-4 w-[1px] mx-1 ${isDarkMode ? "bg-white/10" : "bg-black/10"}`} />
                <span title="Presets & Filters" className="flex items-center">
                  <HelpCircle className={`h-4.5 w-4.5 cursor-pointer transition-colors ${isDarkMode ? "text-white/20 hover:text-white/50" : "text-black/30 hover:text-black/60"}`} />
                </span>
              </div>

              {/* Text search & prompt composer wrapper */}
              <div className={`flex-1 flex items-center border transition-all rounded-full px-3 py-1 ml-1 max-w-[450px] ${
                isDarkMode ? "bg-white/[0.03] border-white/5 focus-within:border-white/20" : "bg-black/[0.03] border-black/5 focus-within:border-black/20"
              }`}>
                <Search className={`h-3.5 w-3.5 mr-2 shrink-0 ${isDarkMode ? "text-white/30" : "text-black/40"}`} />
                
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
                    className={`p-1 shrink-0 ${isDarkMode ? "text-white/40 hover:text-white/80" : "text-black/40 hover:text-black/80"}`}
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
