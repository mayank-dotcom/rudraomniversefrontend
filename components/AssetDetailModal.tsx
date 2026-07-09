"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  getAssetImageUrl,
  likeAsset,
  unlikeAsset,
  getAssetSocial,
  addAssetComment,
  type LibraryAsset,
} from "@/lib/chat-api";
import {
  Heart,
  MessageSquare,
  Share2,
  ArrowLeft,
  Maximize2,
  Image as ImageIcon,
  User,
  Copy,
  Loader2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

const getStoryUrl = (url: string) => {
  if (!url) return "";
  if (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("data:") ||
    url.startsWith("blob:")
  ) {
    return url;
  }
  const apiRoot =
    process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:5000";
  let root = apiRoot;
  if (root.endsWith("/api/v1")) root = root.slice(0, -7);
  else if (root.endsWith("/api/v1/")) root = root.slice(0, -8);
  root = root.endsWith("/") ? root.slice(0, -1) : root;
  return url.startsWith("/") ? `${root}${url}` : `${root}/${url}`;
};

interface Props {
  asset: LibraryAsset | null;
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
}

export default function AssetDetailModal({
  asset,
  isOpen,
  onClose,
  isDarkMode,
}: Props) {
  const [socialLoading, setSocialLoading] = useState(false);
  const [likesCount, setLikesCount] = useState(asset?.likes_count || 0);
  const [isLiked, setIsLiked] = useState(asset?.is_liked || false);
  const [comments, setComments] = useState<any[]>([]);
  const [creatorInfo, setCreatorInfo] = useState<{
    id?: string;
    name: string;
    avatar: string | null;
  }>({ name: "AWEDICT", avatar: null });
  const [variations, setVariations] = useState<LibraryAsset[]>([]);
  const [parentAsset, setParentAsset] = useState<LibraryAsset | null>(null);
  const [newCommentText, setNewCommentText] = useState("");
  const [replyTo, setReplyTo] = useState<{
    id: number;
    user_name: string;
  } | null>(null);
  const [collapsedReplies, setCollapsedReplies] = useState<
    Record<number, boolean>
  >({});
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [zoomScale, setZoomScale] = useState(1);
  const [brokenImage, setBrokenImage] = useState(false);
  const [promptExpanded, setPromptExpanded] = useState(false);

  useEffect(() => {
    if (!asset) return;
    setSocialLoading(true);
    setBrokenImage(false);
    setLikesCount(asset.likes_count || 0);
    setIsLiked(asset.is_liked || false);
    setZoomScale(1);
    setLightboxOpen(false);
    setPromptExpanded(false);

    getAssetSocial(asset.id)
      .then((res: any) => {
        if (res.success) {
          setLikesCount(res.likes_count);
          setIsLiked(res.is_liked);
          setComments(res.comments || []);
          setCreatorInfo(
            res.owner || { name: "AWEDICT", avatar: null }
          );
          setVariations(res.variations || []);
          setParentAsset(res.parent_asset || null);
        }
      })
      .catch((err) => console.error("Failed to load social data:", err))
      .finally(() => setSocialLoading(false));
  }, [asset]);

  const handleToggleLike = useCallback(async () => {
    if (!asset) return;
    const prevLiked = isLiked;
    const prevCount = likesCount;
    setIsLiked(!prevLiked);
    setLikesCount(prevLiked ? Math.max(0, prevCount - 1) : prevCount + 1);

    try {
      if (prevLiked) {
        await unlikeAsset(asset.id);
      } else {
        await likeAsset(
          asset.id,
          asset.asset_type || "image",
          asset.asset_url || "",
          asset.prompt || ""
        );
      }
    } catch (err: any) {
      setIsLiked(prevLiked);
      setLikesCount(prevCount);
      toast.error(err.message || "Failed to update like");
    }
  }, [asset, isLiked, likesCount]);

  const handleAddComment = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!asset || !newCommentText.trim()) return;
    const content = newCommentText.trim();
    setNewCommentText("");
    const parentId = replyTo?.id || null;

    try {
      const res = await addAssetComment(asset.id, content, parentId);
      if (res.success && res.comment) {
        if (parentId) {
          setComments((prev) =>
            prev.map((c) =>
              c.id === parentId
                ? { ...c, replies: [...(c.replies || []), res.comment] }
                : c
            )
          );
        } else {
          setComments((prev) => [...prev, res.comment]);
        }
        toast.success("Comment added!");
      }
      setReplyTo(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to post comment");
    }
  };

  const handleReplyClick = (commentId: number, userName: string) => {
    setReplyTo({ id: commentId, user_name: userName });
    setNewCommentText(`@${userName} `);
    setTimeout(() => {
      document.getElementById("modal-comment-input")?.focus();
    }, 50);
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });

  const renderCommentContent = (text: string) => {
    const match = text.match(/^(@[^\s:]+:?)/);
    if (match) {
      return (
        <>
          <span className="font-semibold text-cyan-500">{match[1]}</span>
          {text.slice(match[1].length)}
        </>
      );
    }
    return text;
  };

  if (!isOpen || !asset) return null;

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[100] flex items-start md:items-center justify-center p-4 md:p-6 bg-black/60 backdrop-blur-sm overflow-y-auto"
            onClick={onClose}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={{
                type: "spring",
                damping: 26,
                stiffness: 160,
              }}
              className={`w-full max-w-5xl max-h-[calc(100dvh-2rem)] md:h-[80vh] flex flex-col md:flex-row rounded-3xl overflow-hidden border shadow-2xl ${
                isDarkMode
                  ? "bg-[#0d0d0c] border-white/[0.06] text-white"
                  : "bg-[#f4f3f2] border-black/[0.06] text-black"
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Left Column - Image */}
              <div className="flex-1 md:w-1/2 flex items-center justify-center bg-black/10 dark:bg-black/40 relative min-h-[40vh] md:min-h-0 shrink-0">
                <button
                  onClick={onClose}
                  className="absolute top-4 left-4 p-2.5 rounded-full bg-white text-black hover:bg-zinc-100 hover:scale-105 active:scale-95 shadow-md transition-all z-10"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>

                {brokenImage ? (
                  <div className="text-center p-4">
                    <ImageIcon
                      className={`h-12 w-12 mx-auto mb-3 ${
                        isDarkMode ? "text-white/20" : "text-black/20"
                      }`}
                    />
                    <p
                      className={`text-sm font-mono ${
                        isDarkMode ? "text-white/30" : "text-black/30"
                      }`}
                    >
                      Image unavailable
                    </p>
                  </div>
                ) : (
                  <img
                    src={getAssetImageUrl(asset)}
                    alt={asset.prompt || "Concept visual"}
                    className="w-full h-full object-contain max-h-[50vh] md:max-h-[80vh] select-none cursor-zoom-in hover:opacity-95 transition-all duration-300"
                    draggable={false}
                    onClick={() => setLightboxOpen(true)}
                    onError={() => setBrokenImage(true)}
                  />
                )}

                <div className="absolute bottom-4 left-4 px-3.5 py-1.5 rounded-full bg-black/60 backdrop-blur-md text-white text-xs font-semibold z-10 border border-white/10 select-none">
                  AI generated
                </div>

                <div className="absolute bottom-4 right-4 z-10">
                  <button
                    onClick={() => setLightboxOpen(true)}
                    className="p-3 rounded-full bg-white/80 hover:bg-white text-black backdrop-blur-md shadow-md transition-all hover:scale-110 active:scale-95"
                    title="Expand Image"
                  >
                    <Maximize2 className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Right Column - Details */}
              <div className="flex-1 md:w-1/2 flex flex-col min-h-0 border-t md:border-t-0 md:border-l border-zinc-100 dark:border-zinc-800/50">
                {/* Actions Row */}
                <div className="flex items-center justify-between p-4 md:p-6 pb-4 shrink-0">
                  <div className="flex items-center gap-4">
                    <motion.button
                      whileTap={{ scale: 0.85 }}
                      whileHover={{ scale: 1.08 }}
                      onClick={handleToggleLike}
                      className="flex items-center gap-1.5 text-zinc-650 hover:text-black dark:text-zinc-400 dark:hover:text-white transition-all duration-200 cursor-pointer"
                    >
                      <motion.div
                        animate={
                          isLiked ? { scale: [1, 1.15] } : { scale: 1 }
                        }
                        transition={{
                          type: "spring",
                          stiffness: 600,
                          damping: 15,
                        }}
                      >
                        <Heart
                          className={`h-6 w-6 transition-all ${
                            isLiked
                              ? "fill-red-500 text-red-500"
                              : ""
                          }`}
                        />
                      </motion.div>
                      <span className="text-sm font-semibold select-none">
                        {likesCount}
                      </span>
                    </motion.button>

                    <button
                      onClick={() => {
                        document
                          .getElementById("modal-comment-input")
                          ?.focus();
                      }}
                      className="text-zinc-655 hover:text-black dark:text-zinc-400 dark:hover:text-white hover:scale-110 active:scale-95 transition-all duration-200"
                      title="Comment"
                    >
                      <MessageSquare className="h-6 w-6" />
                    </button>

                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(
                          `${window.location.origin}/library?asset=${asset.id}`
                        );
                        toast.success("Post link copied!");
                      }}
                      className="text-zinc-655 hover:text-black dark:text-zinc-400 dark:hover:text-white hover:scale-110 active:scale-95 transition-all duration-200"
                      title="Copy Link"
                    >
                      <Share2 className="h-6 w-6" />
                    </button>
                  </div>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto px-4 md:px-6 py-2 space-y-4 md:space-y-6">
                  {/* Creator & Variations */}
                  <div className="flex flex-row items-center justify-between gap-3 bg-zinc-100/10 dark:bg-zinc-900/20 p-3 rounded-2xl border border-zinc-200/50 dark:border-zinc-800/40">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full overflow-hidden bg-gradient-to-tr from-[#A855F7] to-[#00DDDD] flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm">
                        {creatorInfo.avatar ? (
                          <img
                            src={getStoryUrl(creatorInfo.avatar)}
                            className="h-full w-full object-cover"
                            alt={creatorInfo.name}
                          />
                        ) : (
                          <User className="h-5 w-5 text-white/70" />
                        )}
                      </div>
                      <div className="flex flex-col">
                        <Link
                          href={`/profile/${encodeURIComponent(creatorInfo.id || creatorInfo.name)}`}
                          onClick={(e) => e.stopPropagation()}
                          className="font-bold text-sm leading-tight text-zinc-950 dark:text-zinc-50 hover:underline cursor-pointer"
                        >
                          {creatorInfo.name}
                        </Link>
                        <span className="text-[9px] uppercase font-mono tracking-widest text-[#00DDDD] dark:text-[#00DDDD] font-semibold mt-0.5">
                          Creator
                        </span>
                      </div>
                    </div>

                    {variations.length > 0 && (
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className="text-[8px] uppercase font-mono tracking-wider text-zinc-400 dark:text-zinc-500 font-bold">
                          Variations
                        </span>
                        <div className="flex items-center gap-1.5 overflow-x-auto max-w-[150px] no-scrollbar">
                          {variations.map((v) => (
                            <button
                              key={v.id}
                              className="h-8 w-8 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800 hover:ring-2 hover:ring-cyan-400 hover:scale-105 active:scale-95 transition-all cursor-pointer shrink-0"
                              title={v.prompt || "Variation"}
                            >
                              <img
                                src={getAssetImageUrl(v)}
                                className="h-full w-full object-cover"
                                alt="Variation"
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {parentAsset && (
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className="text-[8px] uppercase font-mono tracking-wider text-zinc-400 dark:text-zinc-500 font-bold">
                          Original
                        </span>
                        <button
                          className="flex items-center gap-2 px-2 py-1 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 hover:scale-102 active:scale-98 transition-all cursor-pointer text-left shrink-0"
                          title="View Original"
                        >
                          <img
                            src={getAssetImageUrl(parentAsset)}
                            className="h-6 w-6 rounded-lg object-cover"
                            alt="Original"
                          />
                          <span className="text-[9px] font-semibold text-zinc-550 dark:text-zinc-350 max-w-[65px] truncate">
                            {parentAsset.prompt || "Parent Asset"}
                          </span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Prompt */}
                  <div className="space-y-2">
                    <div
                      className={`text-sm leading-relaxed text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-900/40 p-3 md:p-4 rounded-xl md:rounded-2xl border border-zinc-200 dark:border-zinc-800/40 break-words ${
                        asset.prompt && !promptExpanded
                          ? "max-h-[30vh] overflow-y-auto"
                          : ""
                      }`}
                    >
                      {asset.prompt || "No prompt text provided."}
                    </div>
                    {asset.prompt && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            setPromptExpanded(!promptExpanded)
                          }
                          className="text-[11px] font-semibold text-zinc-500 hover:text-black dark:text-zinc-400 dark:hover:text-white hover:scale-[1.03] active:scale-95 transition-all duration-200"
                        >
                          {promptExpanded
                            ? "Show less"
                            : "Read more"}
                        </button>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(
                              asset.prompt || ""
                            );
                            toast.success("Prompt copied!");
                          }}
                          className="flex items-center gap-1 text-[11px] font-semibold text-zinc-500 hover:text-black dark:text-zinc-400 dark:hover:text-white hover:scale-[1.03] active:scale-95 transition-all duration-200"
                        >
                          <Copy className="h-3 w-3" />
                          Copy Prompt
                        </button>
                      </div>
                    )}
                  </div>

                  <hr className="border-zinc-100 dark:border-zinc-800/50" />

                  {/* Comments */}
                  <div className="space-y-4 pb-4">
                    <h4 className="font-bold text-base font-sans">
                      {comments.length}{" "}
                      {comments.length === 1 ? "comment" : "comments"}
                    </h4>

                    <div className="space-y-4 max-h-[200px] overflow-y-auto pr-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                      {socialLoading ? (
                        <div className="flex items-center gap-2 text-xs text-zinc-400 py-2">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Loading comments...
                        </div>
                      ) : comments.length === 0 ? (
                        <p className="text-xs text-zinc-400 italic py-2">
                          No comments yet. Share your thoughts!
                        </p>
                      ) : (
                        comments.map((comment) => (
                          <div key={comment.id}>
                            <div className="flex gap-2.5 items-start text-sm">
                              <div
                                className={`h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                                  isDarkMode
                                    ? "bg-[#f4f3f2] text-black"
                                    : "bg-[#0d0d0c] text-white"
                                }`}
                              >
                                {comment.user_avatar ? (
                                  <img
                                    src={getStoryUrl(
                                      comment.user_avatar
                                    )}
                                    className="h-full w-full object-cover rounded-full"
                                    alt={comment.user_name}
                                  />
                                ) : (
                                  <User className="h-3.5 w-3.5 text-zinc-500 dark:text-zinc-400" />
                                )}
                              </div>
                              <div className="flex-1 flex flex-col pt-0.5 pl-0.5">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-xs text-zinc-800 dark:text-zinc-200">
                                    @{comment.user_name}
                                  </span>
                                  <span className="text-[10px] text-zinc-400 select-none">
                                    {formatDate(comment.created_at)}
                                  </span>
                                </div>
                                <p className="leading-normal text-xs md:text-sm mt-1 text-zinc-700 dark:text-white">
                                  {renderCommentContent(
                                    comment.content
                                  )}
                                </p>
                                <div className="flex items-center gap-3 mt-1.5 pb-1">
                                  <button
                                    onClick={() =>
                                      handleReplyClick(
                                        comment.id,
                                        comment.user_name
                                      )
                                    }
                                    className="text-[10px] font-bold text-zinc-500 hover:text-cyan-500 dark:text-zinc-400 dark:hover:text-cyan-400 transition-colors"
                                  >
                                    Reply
                                  </button>
                                  {comment.replies &&
                                    comment.replies.length > 0 && (
                                      <>
                                        <span className="text-[10px] text-zinc-400 select-none">
                                          •
                                        </span>
                                        <button
                                          onClick={() =>
                                            setCollapsedReplies(
                                              (prev) => ({
                                                ...prev,
                                                [comment.id]:
                                                  !prev[comment.id],
                                              })
                                            )
                                          }
                                          className="text-[10px] font-bold text-zinc-500 hover:text-cyan-500 dark:text-zinc-400 dark:hover:text-cyan-400 transition-colors"
                                        >
                                          {collapsedReplies[
                                            comment.id
                                          ]
                                            ? `Show replies (${comment.replies.length})`
                                            : "Hide replies"}
                                        </button>
                                      </>
                                    )}
                                </div>
                              </div>
                            </div>
                            {comment.replies &&
                              comment.replies.length > 0 &&
                              !collapsedReplies[comment.id] && (
                                <div className="ml-9 mt-2 space-y-3 relative">
                                  <div className="absolute left-3 top-0 bottom-4 w-px bg-black dark:bg-white pointer-events-none" />
                                  {comment.replies.map(
                                    (reply: any) => (
                                      <div
                                        key={reply.id}
                                        className="flex gap-2.5 items-start text-sm pl-6"
                                      >
                                        <div
                                          className={`h-6 w-6 rounded-full flex items-center justify-center text-[8px] font-bold shrink-0 ${
                                            isDarkMode
                                              ? "bg-[#f4f3f2] text-black"
                                              : "bg-[#0d0d0c] text-white"
                                          }`}
                                        >
                                          {reply.user_avatar ? (
                                            <img
                                              src={getStoryUrl(
                                                reply.user_avatar
                                              )}
                                              className="h-full w-full object-cover rounded-full"
                                              alt={reply.user_name}
                                            />
                                          ) : (
                                            <User className="h-3 w-3 text-zinc-500 dark:text-zinc-400" />
                                          )}
                                        </div>
                                        <div className="flex-1 flex flex-col pt-0.5">
                                          <div className="flex items-center gap-2">
                                            <span className="font-bold text-xs text-zinc-800 dark:text-zinc-200">
                                              @{reply.user_name}
                                            </span>
                                            <span className="text-[10px] text-zinc-400 select-none">
                                              {formatDate(
                                                reply.created_at
                                              )}
                                            </span>
                                          </div>
                                          <p className="leading-normal text-xs md:text-sm mt-1 text-zinc-700 dark:text-white">
                                            {renderCommentContent(
                                              reply.content
                                            )}
                                          </p>
                                        </div>
                                      </div>
                                    )
                                  )}
                                </div>
                              )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Comment Input */}
                <div className="p-4 md:p-6 border-t border-zinc-100 dark:border-zinc-800/50 bg-[#0d0d0c]/5 dark:bg-[#0d0d0c]/30 backdrop-blur-md shrink-0">
                  <form
                    onSubmit={handleAddComment}
                    className="flex items-center gap-3"
                  >
                    <div
                      className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                        isDarkMode
                          ? "bg-[#f4f3f2] text-black"
                          : "bg-[#0d0d0c] text-white"
                      }`}
                    >
                      <User className="h-4 w-4" />
                    </div>
                    <div className="flex-1 flex items-center border border-zinc-200 dark:border-zinc-700 rounded-full px-3.5 py-2.5 bg-white dark:bg-zinc-800 transition-all focus-within:ring-2 focus-within:ring-zinc-400 dark:focus-within:ring-zinc-500">
                      <input
                        id="modal-comment-input"
                        type="text"
                        placeholder={
                          replyTo
                            ? `Reply to ${replyTo.user_name}...`
                            : "Add a comment..."
                        }
                        value={newCommentText}
                        onChange={(e) =>
                          setNewCommentText(e.target.value)
                        }
                        className="flex-1 bg-transparent border-none outline-none text-sm placeholder-zinc-400 pr-2"
                      />
                      {replyTo && (
                        <button
                          type="button"
                          onClick={() => {
                            setReplyTo(null);
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

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] bg-black/95 flex items-center justify-center"
            onClick={() => setLightboxOpen(false)}
          >
            <button
              onClick={() => setLightboxOpen(false)}
              className="absolute top-6 left-6 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all z-10"
            >
              <X className="h-6 w-6" />
            </button>
            <motion.img
              initial={{ scale: 0.9 }}
              animate={{ scale: zoomScale }}
              src={getAssetImageUrl(asset)}
              alt={asset.prompt || "Full size"}
              className="max-w-[95vw] max-h-[95vh] object-contain select-none cursor-pointer"
              style={{ transform: `scale(${zoomScale})` }}
              onClick={(e) => {
                e.stopPropagation();
                setZoomScale(zoomScale === 1 ? 2 : 1);
              }}
              draggable={false}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
