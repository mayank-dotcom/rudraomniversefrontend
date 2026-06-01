"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { getLibraryAssets, deleteLibraryAsset, type LibraryAsset } from "@/lib/chat-api"
import { Loader2, Trash2, X, BookOpen } from "lucide-react"
import { toast } from "sonner"

interface ImageLibraryModalProps {
  isOpen: boolean
  onClose: () => void
  isDarkMode: boolean
}

export default function ImageLibraryModal({ isOpen, onClose, isDarkMode }: ImageLibraryModalProps) {
  const [assets, setAssets] = useState<LibraryAsset[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  const fetchAssets = useCallback(async () => {
    setIsLoading(true)
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
    if (isOpen) fetchAssets()
  }, [isOpen, fetchAssets])

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
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

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.92, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
            className={`relative w-full max-w-5xl max-h-[85vh] flex flex-col border overflow-hidden ${
              isDarkMode ? "border-white/10 bg-[#0a0a0a]" : "border-black/10 bg-white"
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <BookOpen className={`h-5 w-5 ${isDarkMode ? "text-white/50" : "text-black/40"}`} />
                <span className={`font-sans font-semibold text-sm ${isDarkMode ? "text-white/80" : "text-black/80"}`}>
                  Image Library
                </span>
                <span className={`text-[10px] font-mono ${isDarkMode ? "text-white/30" : "text-black/30"}`}>
                  ({assets.length} {assets.length === 1 ? "image" : "images"})
                </span>
              </div>
              <button
                onClick={onClose}
                className={`p-1.5 transition-colors ${isDarkMode ? "text-white/40 hover:text-white" : "text-black/40 hover:text-black"}`}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6">
              {isLoading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className={`h-6 w-6 animate-spin ${isDarkMode ? "text-white/20" : "text-black/20"}`} />
                </div>
              ) : assets.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <BookOpen className={`h-10 w-10 mb-4 ${isDarkMode ? "text-white/10" : "text-black/10"}`} />
                  <p className={`text-sm font-sans ${isDarkMode ? "text-white/30" : "text-black/30"}`}>
                    No images in your library yet.
                  </p>
                  <p className={`text-[11px] font-mono mt-1 ${isDarkMode ? "text-white/20" : "text-black/20"}`}>
                    Generated images will appear here automatically.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {assets.map((asset) => (
                    <div
                      key={asset.id}
                      className="relative aspect-square overflow-hidden border border-white/10 group/card cursor-pointer"
                      onMouseEnter={() => setHoveredId(asset.id)}
                      onMouseLeave={() => setHoveredId(null)}
                    >
                      <img
                        src={asset.asset_url}
                        alt={asset.prompt || "Generated image"}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover/card:scale-110"
                        loading="lazy"
                      />

                      {/* Prompt overlay on hover */}
                      <div
                        className={`absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex flex-col justify-end p-3 transition-opacity duration-300 ${
                          hoveredId === asset.id ? "opacity-100" : "opacity-0"
                        }`}
                      >
                        <p className="text-white text-[11px] font-sans leading-relaxed line-clamp-4 mb-2">
                          {asset.prompt || "No prompt"}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-white/40 text-[9px] font-mono uppercase tracking-wider">
                            {formatDate(asset.created_at)}
                          </span>
                          <button
                            onClick={(e) => handleDelete(asset.id, e)}
                            disabled={deletingId === asset.id}
                            className="p-1 bg-white/10 hover:bg-red-500/80 transition-colors rounded"
                          >
                            {deletingId === asset.id ? (
                              <Loader2 className="h-3 w-3 text-white animate-spin" />
                            ) : (
                              <Trash2 className="h-3 w-3 text-white/70" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
