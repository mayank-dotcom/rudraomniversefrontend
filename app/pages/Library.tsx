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
  getSavedAssetIds,
  saveAsset,
  unsaveAsset,
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
  FolderOpen,
  Download,
  Share2,
  Move
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
  const [createdOnFilter, setCreatedOnFilter] = useState<"all" | "today" | "week" | "month">("all")
  const [sourceFilter, setSourceFilter] = useState<"all" | "personal" | "community">("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [savedIds, setSavedIds] = useState<string[]>([])
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
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false)
  const [moveAssetId, setMoveAssetId] = useState<string | null>(null)
  const [expandedAsset, setExpandedAsset] = useState<LibraryAsset | null>(null)
  
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
        if (asset.asset_url) handleDownloadImage(asset.asset_url, `saved-${id}`)
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
      case "featured": pool = [...FEATURED_ASSETS, ...publicAssets]; break
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
              <span className={`text-[11px] font-mono tracking-widest uppercase px-2.5 mb-1 block ${isDarkMode ? "text-white/20" : "text-black"}`}>
                Explore
              </span>
              
              <button
                onClick={() => { setActiveCategory("featured"); setIsUploadDragging(false); }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium font-sans transition-all duration-200 ${
                  activeCategory === "featured"
                    ? "bg-[#00DDDD] text-black border border-[#00DDDD]"
                    : (isDarkMode ? "text-white/45 hover:text-white/90 hover:bg-white/[0.02]" : "text-black hover:bg-black/[0.02]")
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Sparkles className={`h-4.5 w-4.5 ${activeCategory === "featured" ? "text-black" : ""}`} />
                  <span>Featured Feed</span>
                </div>
                {activeCategory === "featured" && <div className="h-1.5 w-1.5 rounded-full bg-black" />}
              </button>

              <button
                onClick={() => { setActiveCategory("public_showcase"); setIsUploadDragging(false); }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium font-sans transition-all duration-200 ${
                  activeCategory === "public_showcase"
                    ? "bg-[#00DDDD] text-black border border-[#00DDDD]"
                    : (isDarkMode ? "text-white/45 hover:text-white/90 hover:bg-white/[0.02]" : "text-black hover:bg-black/[0.02]")
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Globe className={`h-4.5 w-4.5 ${activeCategory === "public_showcase" ? "text-black" : (isDarkMode ? "text-sky-500/80" : "text-black")}`} />
                  <span>Community Showcase</span>
                </div>
                {activeCategory === "public_showcase" && <div className="h-1.5 w-1.5 rounded-full bg-black" />}
              </button>

              <button
                onClick={() => { setActiveCategory("recent"); setIsUploadDragging(false); }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium font-sans transition-all duration-200 ${
                  activeCategory === "recent"
                    ? "bg-[#00DDDD] text-black border border-[#00DDDD]"
                    : (isDarkMode ? "text-white/45 hover:text-white/90 hover:bg-white/[0.02]" : "text-black hover:bg-black/[0.02]")
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Clock className="h-4.5 w-4.5" />
                  <span>Recent Creations</span>
                </div>
                {activeCategory === "recent" && <div className="h-1.5 w-1.5 rounded-full bg-black" />}
              </button>

              <button
                onClick={() => { setActiveCategory("saved"); setIsUploadDragging(false); }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium font-sans transition-all duration-200 ${
                  activeCategory === "saved"
                    ? "bg-[#00DDDD] text-black border border-[#00DDDD]"
                    : (isDarkMode ? "text-white/45 hover:text-white/90 hover:bg-white/[0.02]" : "text-black hover:bg-black/[0.02]")
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Bookmark className={`h-4.5 w-4.5 ${activeCategory === "saved" ? "text-black" : ""}`} />
                  <span>Saved</span>
                </div>
                <div className="flex items-center gap-1">
                  {savedIds.length > 0 && (
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
                      activeCategory === "saved"
                        ? "bg-black/20 text-black font-semibold"
                        : (isDarkMode ? "bg-[var(--color-cyan)]/10 text-[var(--color-cyan)]" : "bg-black/10 text-black font-semibold")
                    }`}>
                      {savedIds.length}
                    </span>
                  )}
                  {activeCategory === "saved" && <div className="h-1.5 w-1.5 rounded-full bg-black" />}
                </div>
              </button>
            </div>

            {/* Library Section */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between px-2.5 mb-1">
                <span className={`text-[11px] font-mono tracking-widest uppercase block ${isDarkMode ? "text-white/20" : "text-black"}`}>
                  Personal Workspace
                </span>
                <button onClick={handleCreateGallery} className={`transition-colors ${isDarkMode ? "text-white/30 hover:text-[var(--color-cyan)]" : "text-black hover:text-cyan-600"}`} title="Create Folder">
                  <FolderPlus className="h-4.5 w-4.5" />
                </button>
              </div>

              <button
                onClick={() => { setActiveCategory("all"); setIsUploadDragging(false); setSelectedGalleryId(null); }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium font-sans transition-all duration-200 ${
                  activeCategory === "all"
                    ? "bg-[#00DDDD] text-black border border-[#00DDDD]"
                    : (isDarkMode ? "text-white/45 hover:text-white/90 hover:bg-white/[0.02]" : "text-black hover:bg-black/[0.02]")
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <ImageIcon className={`h-4.5 w-4.5 ${activeCategory === "all" ? "text-black" : ""}`} />
                  <span>My Gallery</span>
                </div>
                {activeCategory === "all" && <div className="h-1.5 w-1.5 rounded-full bg-black" />}
              </button>

            </div>

            {/* Custom Database Galleries list */}
            <div className="flex flex-col gap-1.5">
              <span className={`text-[11px] font-mono tracking-widest uppercase px-2.5 mb-1 block ${isDarkMode ? "text-white/20" : "text-black"}`}>
                Custom Folders
              </span>
              {galleries.length === 0 ? (
                <span className={`text-xs italic px-3 py-1 font-sans ${isDarkMode ? "text-white/20" : "text-black"}`}>
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
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm text-left transition-all font-sans ${
                        isSelected
                          ? "bg-[#00DDDD] text-black border border-[#00DDDD] font-semibold"
                          : (isDarkMode ? "text-white/40 hover:text-white/85 hover:bg-white/[0.02]" : "text-black hover:bg-black/[0.02]")
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        {isSelected ? (
                          <FolderOpen className="h-4.5 w-4.5 shrink-0 text-black" />
                        ) : (
                          <Folder className={`h-4.5 w-4.5 shrink-0 ${g.is_public ? (isDarkMode ? "text-sky-400/60" : "text-black") : (isDarkMode ? "text-amber-500/60" : "text-black")}`} />
                        )}
                        <span className="truncate">{g.name}</span>
                      </div>
                      
                      <div className="flex items-center gap-1 shrink-0 select-none">
                        {g.is_public ? (
                          <Globe className={`h-3 w-3 ${isSelected ? "text-black" : (isDarkMode ? "text-sky-400/70" : "text-black")}`} />
                        ) : (
                          <Lock className={`h-3 w-3 ${isSelected ? "text-black" : (isDarkMode ? "text-white/20" : "text-black")}`} />
                        )}
                        <span className={`text-[10px] font-mono ${isSelected ? "text-black font-semibold" : (isDarkMode ? "opacity-40" : "text-black font-medium")}`}>({g.asset_count || 0})</span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>

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
                                  galleryAssetIds.forEach(a => handleDownloadImage(a.asset_url, a.id));
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
                    ? (isDarkMode ? "bg-white/10 text-[#00DDDD] shadow-sm" : "bg-white text-[#00DDDD] shadow-sm")
                    : (isDarkMode ? "text-white/45 hover:text-white/80" : "text-black/55 hover:text-black")
                }`}
              >
                Shared Prompts
              </button>
              <button
                onClick={() => setShowcaseTab("galleries")}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold font-sans tracking-wide transition-all flex items-center gap-1.5 ${
                  showcaseTab === "galleries"
                    ? (isDarkMode ? "bg-white/10 text-[#00DDDD] shadow-sm" : "bg-white text-[#00DDDD] shadow-sm")
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


          {/* ================= CONTENT CONTAINER ================= */}
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
                          <div className="p-3 bg-gradient-to-tr from-sky-500/20 to-indigo-500/20 rounded-xl text-sky-400">
                            <FolderOpen className="h-6 w-6" />
                          </div>
                          <span className="text-[10px] font-mono px-2 py-0.5 bg-black/25 rounded-full flex items-center gap-1 text-[var(--color-cyan)]">
                            <Globe className="h-2.5 w-2.5 text-[var(--color-cyan)]" />
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
                          <span className="text-[10px] font-mono text-[var(--color-cyan)]">
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <AnimatePresence mode="popLayout">
                      {activeAssets.map((asset, i) => {
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
                              className="w-full h-full object-cover transition-all duration-700 ease-out group-hover/card:scale-105 cursor-pointer"
                              loading="lazy"
                              onClick={() => setExpandedAsset(asset)}
                            />

                            {/* Top Action Indicators (Heart and Visibility) */}
                            <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none select-none z-20">
                              {/* Visibility badge */}
                              <div className="flex gap-1.5">
                                <span className={`px-2 py-0.5 backdrop-blur-md border rounded-full text-[9px] font-mono uppercase tracking-wider ${
                                  isDarkMode ? "bg-black/60 border-white/10 text-white/80" : "bg-white/80 border-black/10 text-black/80"
                                }`}>
                                  {asset.id.startsWith("feat-") ? "Featured" : asset.id.startsWith("uploaded-") ? "Upload" : "Library"}
                                </span>
                                
                                {/* Personal visibility status */}
                                {!asset.id.startsWith("feat-") && (
                                  <span className={`px-2 py-0.5 backdrop-blur-md border rounded-full text-[9px] font-mono uppercase tracking-wider flex items-center gap-1 ${
                                    isDarkMode ? "bg-black/60 border-white/10 text-white/80" : "bg-white/80 border-black/10 text-black/80"
                                  }`}>
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
                              
                              <div className="flex items-center gap-1.5 pointer-events-auto">
                                <button
                                  onClick={(e) => { e.preventDefault(); toggleSaved(asset); }}
                                  className={`p-1.5 rounded-full border backdrop-blur-md pointer-events-auto transition-all duration-200 active:scale-90 ${
                                    savedIds.includes(asset.id)
                                      ? "bg-[var(--color-cyan)] border-[var(--color-cyan)] text-black scale-110 shadow-lg shadow-cyan-500/30"
                                      : isDarkMode
                                        ? "bg-black/60 border-white/10 text-white/50 hover:text-[var(--color-cyan)] hover:border-[var(--color-cyan)]"
                                        : "bg-white/80 border-black/10 text-black/50 hover:text-[var(--color-cyan)] hover:border-[var(--color-cyan)]"
                                  }`}
                                >
                                  <Heart className={`h-3 w-3 ${savedIds.includes(asset.id) ? "fill-current" : ""}`} />
                                </button>
                              </div>
                            </div>

                            {/* Center Move to Folder button on hover */}
                            <div
                              className={`absolute inset-0 flex items-center justify-center transition-all duration-300 z-10 ${
                                hoveredId === asset.id ? "opacity-100 scale-100" : "opacity-0 scale-75 pointer-events-none"
                              }`}
                            >
                              <button
                                onClick={(e) => { e.preventDefault(); setMoveAssetId(asset.id); setIsMoveModalOpen(true); }}
                                className="p-3 rounded-full bg-black/50 border border-white/20 text-white/80 hover:bg-[var(--color-cyan)] hover:text-black hover:border-[var(--color-cyan)] transition-all duration-200 shadow-lg backdrop-blur-sm"
                                title="Move to Folder"
                              >
                                <Move className="h-5 w-5" />
                              </button>
                            </div>

                            {/* Hover action bar: visibility (own only), copy, share, download */}
                            <div
                              className={`absolute bottom-0 left-0 right-0 flex items-center justify-center gap-2 px-3 py-2.5 bg-gradient-to-t from-black/90 via-black/60 to-transparent transition-all duration-300 z-10 ${
                                hoveredId === asset.id ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"
                              }`}
                            >
                              {!asset.id.startsWith("feat-") && (
                                <button
                                  onClick={(e) => { e.preventDefault(); handleToggleVisibility(asset.id, asset.is_public); }}
                                  disabled={togglingVisibilityId === asset.id}
                                  className={`p-1.5 rounded border transition-colors ${
                                    asset.is_public
                                      ? "bg-sky-500/20 text-sky-400 hover:bg-sky-500/30 border-sky-400/20"
                                      : "bg-white/10 border-white/20 text-white/70 hover:bg-white/20"
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
                              <button
                                onClick={(e) => { e.preventDefault(); handleCopyPrompt(asset.prompt || "", asset.id); }}
                                className={`p-1.5 rounded border transition-colors ${
                                  copiedId === asset.id
                                    ? "border-emerald-400/50 text-emerald-400 bg-emerald-500/10"
                                    : "bg-white/10 border-white/20 text-white/70 hover:text-[var(--color-cyan)] hover:border-[var(--color-cyan)]"
                                }`}
                                title="Copy Prompt"
                              >
                                {copiedId === asset.id ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                              </button>
                              <button
                                onClick={(e) => { e.preventDefault(); handleDownloadImage(asset.asset_url, asset.id); }}
                                className="p-1.5 rounded border bg-white/10 border-white/20 text-white/70 hover:text-[var(--color-cyan)] hover:border-[var(--color-cyan)] transition-colors"
                                title="Download"
                              >
                                <Download className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={(e) => { e.preventDefault(); handleShareImage(asset.asset_url, asset.prompt || "Library Image"); }}
                                className="p-1.5 rounded border bg-white/10 border-white/20 text-white/70 hover:text-[var(--color-cyan)] hover:border-[var(--color-cyan)] transition-colors"
                                title="Share"
                              >
                                <Share2 className="h-3.5 w-3.5" />
                              </button>
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
          <div className="fixed bottom-6 left-[calc(50%+128px)] -translate-x-1/2 flex flex-col items-center gap-3 z-40 max-w-[1000px] w-[95%] md:w-[80%] shrink-0">
            
            {/* Core Pill Bar */}
            <div className={`w-full flex items-center justify-between gap-3 p-2 border rounded-full transition-all duration-300 ${
              isDarkMode
                ? "bg-[#101014]/90 border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] hover:border-white/20"
                : "bg-white border-black/10 shadow-[0_10px_30px_rgba(0,0,0,0.08)] hover:border-black/20"
            }`}>
              
              {/* Middle Configurations Pills */}
              <div className="flex items-center gap-2 select-none text-[10px] font-sans font-medium shrink-0">
                
                {/* Created On filter */}
                <button
                  onClick={handleCycleCreatedOn}
                  className="px-4 py-2 rounded-full bg-[#00DDDD] text-black font-semibold uppercase tracking-wider transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5 border-none shadow-[0_0_15px_rgba(0,221,221,0.2)]"
                >
                  <Clock className="h-3.5 w-3.5" />
                  <span>Created: {createdOnFilter === "all" ? "All Time" : createdOnFilter === "today" ? "Today" : createdOnFilter === "week" ? "Last 7 Days" : "Last 30 Days"}</span>
                </button>

                {/* Personal/Community filter */}
                <button
                  onClick={handleCycleSource}
                  className="px-4 py-2 rounded-full bg-[#00DDDD] text-black font-semibold uppercase tracking-wider transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5 border-none shadow-[0_0_15px_rgba(0,221,221,0.2)]"
                >
                  <Globe className="h-3.5 w-3.5" />
                  <span>Source: {sourceFilter === "all" ? "All" : sourceFilter === "personal" ? "Personal" : "Community"}</span>
                </button>

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
            className="fixed inset-0 z-[100] flex bg-black/99"
            onClick={() => setExpandedAsset(null)}
          >
            {/* Close button */}
            <button
              onClick={() => setExpandedAsset(null)}
              className="absolute top-4 right-4 md:top-5 md:right-5 z-50 p-2 md:p-2.5 rounded-full bg-white/[0.04] text-white/50 hover:bg-white/10 hover:text-white transition-colors border border-white/[0.06] backdrop-blur-md"
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
              <div className="flex-[4] flex items-center justify-center bg-black/60 p-3 md:p-6 relative min-h-[40vh] md:min-h-0">
                <img
                  src={expandedAsset.asset_url}
                  alt={expandedAsset.prompt || "Concept visual"}
                  className="max-w-full max-h-full w-auto h-auto object-contain rounded-lg md:rounded-xl select-none shadow-lg"
                  draggable={false}
                />
                {/* Mobile prompt overlay */}
                <div className="absolute bottom-2 left-2 right-2 md:hidden">
                  <div className="backdrop-blur-xl bg-black/70 border border-white/[0.06] rounded-xl px-3.5 py-2.5">
                    <p className="text-xs text-white/90 line-clamp-2">{expandedAsset.prompt || "No prompt"}</p>
                  </div>
                </div>
              </div>

              {/* Details Panel - 360px on desktop */}
              <div className={`w-full md:w-[360px] shrink-0 flex flex-col overflow-y-auto border-t md:border-t-0 md:border-l transition-colors duration-300 ${
                isDarkMode ? "bg-zinc-950 border-white/[0.06]" : "bg-white border-black/[0.06]"
              }`}>
                {/* Header badges + title + heart */}
                <div className={`px-5 py-4 border-b shrink-0 ${isDarkMode ? "border-white/[0.06]" : "border-black/[0.06]"}`}>
                  <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold font-mono uppercase tracking-wider bg-[#00DDDD]/15 text-[#00DDDD] border border-[#00DDDD]/15">
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
                            ? "text-[#00DDDD] bg-[#00DDDD]/10"
                            : isDarkMode
                              ? "text-white/30 hover:text-white/60 hover:bg-white/5"
                              : "text-black/30 hover:text-black/60 hover:bg-black/5"
                        }`}
                      >
                        <Heart className={`h-3.5 w-3.5 ${savedIds.includes(expandedAsset.id) ? "fill-[#00DDDD]" : ""}`} />
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
                        className="flex items-center gap-1 text-[10px] font-semibold mt-1.5 text-[#00DDDD] hover:text-[#00b3b3] transition-colors"
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
                      <span className={`text-[11px] font-medium block mt-0.5 ${savedIds.includes(expandedAsset.id) ? "text-[#00DDDD]" : isDarkMode ? "text-white/40" : "text-black/40"}`}>
                        {savedIds.includes(expandedAsset.id) ? "Yes" : "No"}
                      </span>
                    </div>
                    {expandedAsset.gallery_id && (
                      <div className="col-span-2">
                        <span className={`text-[9px] font-mono uppercase tracking-widest block ${isDarkMode ? "text-white/30" : "text-black/40"}`}>
                          Folder
                        </span>
                        <span className={`text-[11px] font-medium block mt-0.5 flex items-center gap-1.5 ${isDarkMode ? "text-white/70" : "text-black/60"}`}>
                          <Folder className="h-3 w-3 text-[#00DDDD]" />
                          {(() => { const g = [...galleries, ...publicGalleries].find(g => g.id === expandedAsset.gallery_id); return g?.name || "Unknown Folder"; })()}
                        </span>
                      </div>
                    )}
                    <div className="col-span-2">
                      <span className={`text-[9px] font-mono uppercase tracking-widest block ${isDarkMode ? "text-white/30" : "text-black/40"}`}>
                        Asset ID
                      </span>
                      <span className={`text-[11px] font-mono block mt-0.5 break-all ${isDarkMode ? "text-white/40" : "text-black/40"}`}>
                        {expandedAsset.id}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom actions */}
                <div className={`px-5 py-3 border-t space-y-2 shrink-0 ${isDarkMode ? "border-white/[0.06]" : "border-black/[0.06]"}`}>
                  <a
                    href={expandedAsset.asset_url}
                    download={`rudra-${expandedAsset.id}.png`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold font-mono uppercase tracking-wider bg-[#00DDDD] text-black hover:bg-[#00c5c5] transition-all active:scale-[0.98] shadow-lg shadow-[#00dddd]/10"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download Image
                  </a>
                  <button
                    onClick={() => { navigator.clipboard.writeText(expandedAsset.asset_url); toast.success("Image URL copied!"); }}
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
    </div>
  )
}
