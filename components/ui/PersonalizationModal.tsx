"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, User, Camera, Loader2 } from "lucide-react";
import { uploadProfilePicture } from "@/lib/chat-api";
import { getProfilePicture, setProfilePicture } from "@/lib/auth";
import { toast } from "sonner";

interface PersonalizationModalProps {
    isOpen: boolean;
    onClose: () => void;
    isDarkMode: boolean;
    userName: string;
    userEmail: string;
    userRole: string | null;
}

export default function PersonalizationModal({
    isOpen,
    onClose,
    isDarkMode,
    userName,
    userEmail,
    userRole,
}: PersonalizationModalProps) {
    const [profilePic, setProfilePic] = useState<string | null>(getProfilePicture);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsUploading(true);
        try {
            const data = await uploadProfilePicture(file);
            const fullUrl = data.url
                ? `${process.env.NEXT_PUBLIC_BASE_URL?.replace("/api/v1", "")}${data.url}`
                : null;
            if (fullUrl) {
                setProfilePic(fullUrl);
                setProfilePicture(fullUrl);
            }
            toast.success("Profile picture updated!");
        } catch (err: any) {
            toast.error(err.message || "Failed to upload");
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const roleLabel = userRole === "school_admin" ? "Admin"
        : userRole === "faculty" ? "Faculty"
        : userRole === "enterprise_admin" ? "Admin"
        : userRole === "manager" ? "Manager"
        : userRole === "global_admin" ? "Admin"
        : "Pro Member";

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="fixed inset-0 z-[300] flex items-center justify-center p-4"
                    onClick={onClose}
                >
                    <div className={`absolute inset-0 ${isDarkMode ? "bg-black/80" : "bg-[#f2f1f0]/80"}`} />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.96, y: 16 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: 16 }}
                        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                        className={`relative w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden ${
                            isDarkMode ? "bg-[#0d0d0c] border-white/10" : "bg-[#f2f1f0] border-black/10"
                        }`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <p className={`text-xs font-sans font-bold ${isDarkMode ? "text-white" : "text-black"}`}>Personalization</p>
                                    <p className={`text-[9px] font-sans mt-0.5 ${isDarkMode ? "text-white/30" : "text-black/30"}`}>Your profile settings</p>
                                </div>
                                <button
                                    onClick={onClose}
                                    className={`p-2 rounded-xl transition-all ${
                                        isDarkMode ? "text-white/30 hover:text-white hover:bg-white/10" : "text-black/30 hover:text-black hover:bg-black/10"
                                    }`}
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                            <div className="max-h-[65vh] overflow-y-auto scrollbar-hide">
                                <div className="space-y-6">
                                    {/* Profile Picture */}
                                    <div className="flex flex-col items-center gap-3">
                                        <div className={`h-20 w-20 rounded-full flex items-center justify-center border-2 overflow-hidden ${
                                            isDarkMode ? "border-white/20" : "border-black/20"
                                        }`}>
                                            {profilePic ? (
                                                <img src={profilePic} alt="Profile" className="h-full w-full object-cover" />
                                            ) : (
                                                <User className={`h-8 w-8 ${isDarkMode ? "text-white/60" : "text-black/60"}`} />
                                            )}
                                        </div>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            onChange={handleUpload}
                                            className="hidden"
                                        />
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={isUploading}
                                            className={`flex items-center gap-1.5 px-3 py-1.5 text-[9px] font-mono font-bold uppercase tracking-[0.2em] border-2 transition-all active:scale-95 disabled:opacity-40 ${
                                                isDarkMode
                                                    ? "border-white/20 text-white hover:bg-white/10"
                                                    : "border-black/20 text-black hover:bg-black/10"
                                            }`}
                                        >
                                            {isUploading ? (
                                                <Loader2 className="h-3 w-3 animate-spin" />
                                            ) : (
                                                <Camera className="h-3 w-3" />
                                            )}
                                            {isUploading ? "Uploading..." : profilePic ? "Change Photo" : "Upload Photo"}
                                        </button>
                                    </div>

                                    {/* User Details */}
                                    <div className={`space-y-3 p-4 border-2 ${isDarkMode ? "border-white/10 bg-white/[0.03]" : "border-black/10 bg-black/[0.02]"}`}>
                                        <div>
                                            <p className={`text-[8px] font-mono uppercase tracking-[0.2em] mb-1 ${isDarkMode ? "text-white/40" : "text-black/40"}`}>Name</p>
                                            <p className={`text-sm font-bold ${isDarkMode ? "text-white" : "text-black"}`}>{userName || "User"}</p>
                                        </div>
                                        {userEmail && (
                                            <div>
                                                <p className={`text-[8px] font-mono uppercase tracking-[0.2em] mb-1 ${isDarkMode ? "text-white/40" : "text-black/40"}`}>Email</p>
                                                <p className={`text-sm ${isDarkMode ? "text-white/70" : "text-black/70"}`}>{userEmail}</p>
                                            </div>
                                        )}
                                        <div>
                                            <p className={`text-[8px] font-mono uppercase tracking-[0.2em] mb-1 ${isDarkMode ? "text-white/40" : "text-black/40"}`}>Role</p>
                                            <span className={`inline-block px-2 py-0.5 text-[9px] font-mono font-bold uppercase tracking-widest border ${
                                                isDarkMode ? "border-white/20 text-white/80" : "border-black/20 text-black/80"
                                            }`}>
                                                {roleLabel}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
