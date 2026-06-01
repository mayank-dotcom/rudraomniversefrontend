"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useTheme } from "@/lib/theme-context"
import Navbar from "@/components/ui/Navbar"
import Footer from "@/components/ui/Footer"
import { getLibraryAssets, deleteLibraryAsset, type LibraryAsset } from "@/lib/chat-api"
import { isAuthenticated } from "@/lib/auth"
import { Loader2, Trash2, Image, Download, X, Clock } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export default function LibraryPage() {
  const { isDarkMode } = useTheme()
  const router = useRouter()
  const [assets, setAssets] = useState<LibraryAsset[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedAsset, setSelectedAsset] = useState<LibraryAsset | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

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

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm("Delete this asset?")) return
    setDeletingId(id)
    try {
      await deleteLibraryAsset(id)
      setAssets((prev) => prev.filter((a) => a.id !== id))
      if (selectedAsset?.id === id) setSelectedAsset(null)
      toast.success("Asset deleted.")
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
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? "bg-[#0a0a0a]" : "bg-[#fdfdfd]"}`}>
        <Loader2 className={`h-8 w-8 animate-spin ${isDarkMode ? "text-white/20" : "text-black/20"}`} />
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? "bg-[#0a0a0a] text-white" : "bg-[#fdfdfd] text-black"} selection:bg-[var(--color-cyan)] selection:text-white`}>
      <Navbar />
      <section className="relative pt-40 pb-20 px-6 md:px-12">
        <div className="max-w-[1400px] mx-auto">
          {/* Header */}
          <div className="flex flex-col lg:flex-row gap-12 mb-16">
            <div className="lg:w-1/4">
              <span
                className={`font-sans font-bold uppercase ${isDarkMode ? "text-white/20" : "text-black/30"} block mb-8`}
                style={{ fontSize: "11px", letterSpacing: "0.1em" }}
              >
                § 05 — LIBRARY
              </span>
              <h2
                className={`font-sans font-bold uppercase leading-relaxed ${isDarkMode ? "text-white/30" : "text-black/40"}`}
                style={{ fontSize: "11px", letterSpacing: "0.1em" }}
              >
                Your Generated <br /> Assets
              </h2>
            </div>
            <div className="lg:w-3/4">
              <h1
                className="font-display font-bold leading-[0.9] mb-6"
                style={{ fontSize: "clamp(2.5rem, 7vw, 56px)", letterSpacing: "-0.04em" }}
              >
                Image{" "}
                <span className="italic text-[var(--color-cyan)]">Library</span>
              </h1>
              <p
                className={`max-w-xl leading-relaxed ${isDarkMode ? "text-white/50" : "text-black/50"}`}
                style={{ fontSize: "16px" }}
              >
                Every image you have created, preserved with its original prompt.
              </p>
            </div>
          </div>

          {/* Empty State */}
          {assets.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex flex-col items-center justify-center py-32 border ${isDarkMode ? "border-white/10" : "border-black/10"}`}
            >
              <Image className={`h-12 w-12 mb-6 ${isDarkMode ? "text-white/10" : "text-black/10"}`} />
              <p className={`font-sans font-bold uppercase mb-2 ${isDarkMode ? "text-white/20" : "text-black/20"}`} style={{ fontSize: "11px", letterSpacing: "0.1em" }}>
                No images yet
              </p>
              <p className={`font-sans text-sm ${isDarkMode ? "text-white/30" : "text-black/30"}`}>
                Generated images will appear here.
              </p>
            </motion.div>
          ) : (
            /* Grid */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {assets.map((asset, i) => (
                <motion.div
                  key={asset.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: i * 0.03 }}
                  onClick={() => setSelectedAsset(asset)}
                  className={`group relative cursor-pointer border ${isDarkMode ? "border-white/10 hover:border-white/30" : "border-black/10 hover:border-black/30"} transition-all duration-300 overflow-hidden`}
                >
                  {/* Image */}
                  <div className="aspect-square overflow-hidden bg-[var(--color-cyan)]/5">
                    <img
                      src={asset.asset_url}
                      alt={asset.prompt || "Generated image"}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>

                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-end p-4">
                    <div className="translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 w-full">
                      <p className="text-white/90 text-sm font-medium line-clamp-2 mb-2">
                        {asset.prompt || "No prompt"}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-white/50 text-[10px] font-sans font-bold uppercase tracking-wider">
                          {formatDate(asset.created_at)}
                        </span>
                        <button
                          onClick={(e) => handleDelete(asset.id, e)}
                          disabled={deletingId === asset.id}
                          className="p-1.5 bg-white/10 hover:bg-red-500/80 transition-colors rounded"
                        >
                          {deletingId === asset.id ? (
                            <Loader2 className="h-3.5 w-3.5 text-white animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5 text-white/80" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {selectedAsset && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedAsset(null)}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 md:p-8"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              onClick={(e) => e.stopPropagation()}
              className={`relative max-w-4xl w-full flex flex-col md:flex-row border ${isDarkMode ? "border-white/10 bg-[#0a0a0a]" : "border-black/10 bg-white"}`}
            >
              {/* Close */}
              <button
                onClick={() => setSelectedAsset(null)}
                className={`absolute top-4 right-4 z-10 p-2 ${isDarkMode ? "bg-black/60 text-white hover:bg-white/20" : "bg-white/60 text-black hover:bg-black/20"} transition-colors`}
              >
                <X className="h-5 w-5" />
              </button>

              {/* Image */}
              <div className="md:w-3/5 bg-[var(--color-cyan)]/5 flex items-center justify-center p-2">
                <img
                  src={selectedAsset.asset_url}
                  alt={selectedAsset.prompt || "Generated image"}
                  className="w-full h-auto max-h-[70vh] object-contain"
                />
              </div>

              {/* Details */}
              <div className="md:w-2/5 p-8 flex flex-col">
                <span
                  className={`font-sans font-bold uppercase mb-6 ${isDarkMode ? "text-white/20" : "text-black/30"}`}
                  style={{ fontSize: "11px", letterSpacing: "0.1em" }}
                >
                  Details
                </span>

                {/* Prompt */}
                <div className="mb-8">
                  <span className={`font-sans font-bold uppercase text-[10px] tracking-[0.1em] block mb-2 ${isDarkMode ? "text-white/30" : "text-black/40"}`}>
                    Prompt
                  </span>
                  <p className={`text-sm leading-relaxed ${isDarkMode ? "text-white/70" : "text-black/70"}`}>
                    {selectedAsset.prompt || "No prompt recorded."}
                  </p>
                </div>

                {/* Type */}
                <div className="mb-8">
                  <span className={`font-sans font-bold uppercase text-[10px] tracking-[0.1em] block mb-2 ${isDarkMode ? "text-white/30" : "text-black/40"}`}>
                    Type
                  </span>
                  <p className={`text-sm uppercase tracking-wider ${isDarkMode ? "text-white/50" : "text-black/50"}`}>
                    {selectedAsset.asset_type}
                  </p>
                </div>

                {/* Date */}
                <div className="mb-8">
                  <span className={`font-sans font-bold uppercase text-[10px] tracking-[0.1em] block mb-2 ${isDarkMode ? "text-white/30" : "text-black/40"}`}>
                    Created
                  </span>
                  <div className="flex items-center gap-2">
                    <Clock className={`h-3.5 w-3.5 ${isDarkMode ? "text-white/30" : "text-black/40"}`} />
                    <p className={`text-sm ${isDarkMode ? "text-white/50" : "text-black/50"}`}>
                      {formatDate(selectedAsset.created_at)}
                    </p>
                  </div>
                </div>

                {/* Spacer */}
                <div className="flex-1" />

                {/* Download */}
                <a
                  href={selectedAsset.asset_url}
                  download={`asset-${selectedAsset.id.slice(0, 8)}.png`}
                  className={`flex items-center justify-center gap-3 w-full py-4 font-sans font-bold uppercase tracking-widest transition-all active:scale-95 ${isDarkMode ? "bg-white text-black hover:bg-white/90" : "bg-black text-white hover:bg-black/90"}`}
                  style={{ fontSize: "11px", letterSpacing: "0.2em" }}
                >
                  <Download className="h-4 w-4" />
                  Download
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  )
}
