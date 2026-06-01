"use client"

import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import Navbar from "@/components/ui/Navbar"
import Footer from "@/components/ui/Footer"
import { getLibraryAssets, deleteLibraryAsset, type LibraryAsset } from "@/lib/chat-api"
import { isAuthenticated } from "@/lib/auth"
import { Loader2, Trash2, BookOpen, ArrowLeft } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function LibraryPage() {
  const router = useRouter()
  const [assets, setAssets] = useState<LibraryAsset[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  const fetchAssets = useCallback(async () => {
    try {
      const data = await getLibraryAssets()
      setAssets(data.assets)
    } catch (err: any) {
      toast.error(err.message || "Failed to load library.")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace("/auth/login")
      return
    }
    fetchAssets()
  }, [fetchAssets, router])

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this image?")) return
    setDeletingId(id)
    try {
      await deleteLibraryAsset(id)
      setAssets((prev) => prev.filter((a) => a.id !== id))
      toast.success("Image deleted.")
    } catch (err: any) {
      toast.error(err.message || "Failed to delete.")
    } finally {
      setDeletingId(null)
    }
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <Loader2 className="h-8 w-8 animate-spin text-white/20" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-[var(--color-cyan)] selection:text-white">
      <Navbar />
      <main className="pt-32 pb-20 px-6 md:px-12">
        <div className="max-w-[1400px] mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-12">
            <Link href="/chat" className="p-2 border border-white/10 text-white/40 hover:text-white hover:border-white/30 transition-all">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <h1 className="text-2xl md:text-3xl font-display font-bold tracking-tight">
                Image <span className="text-[var(--color-cyan)] italic">Library</span>
              </h1>
              <p className="text-sm text-white/40 mt-1 font-sans">
                {assets.length} {assets.length === 1 ? "image" : "images"} generated
              </p>
            </div>
          </div>

          {/* Empty State */}
          {assets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 border border-white/10">
              <BookOpen className="h-12 w-12 text-white/10 mb-6" />
              <p className="text-sm text-white/30 font-sans mb-1">No images in your library yet.</p>
              <p className="text-[11px] text-white/20 font-mono">Generated images will appear here automatically.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {assets.map((asset, i) => (
                <motion.div
                  key={asset.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.03 }}
                  className="relative aspect-square overflow-hidden border border-white/10 group/card"
                  onMouseEnter={() => setHoveredId(asset.id)}
                  onMouseLeave={() => setHoveredId(null)}
                >
                  <img
                    src={asset.asset_url}
                    alt={asset.prompt || "Generated image"}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover/card:scale-110"
                    loading="lazy"
                  />

                  {/* Hover overlay with prompt */}
                  <div className={`absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent flex flex-col justify-end p-4 transition-opacity duration-300 ${hoveredId === asset.id ? "opacity-100" : "opacity-0"}`}>
                    <p className="text-white text-xs font-sans leading-relaxed line-clamp-4 mb-3">
                      {asset.prompt || "No prompt"}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-white/30 text-[9px] font-mono uppercase tracking-wider">
                        {formatDate(asset.created_at)}
                      </span>
                      <button
                        onClick={() => handleDelete(asset.id)}
                        disabled={deletingId === asset.id}
                        className="p-1.5 bg-white/10 hover:bg-red-500/80 transition-colors rounded"
                      >
                        {deletingId === asset.id ? (
                          <Loader2 className="h-3.5 w-3.5 text-white animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5 text-white/70" />
                        )}
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
