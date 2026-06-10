"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import WalletPanel from "./WalletPanel";

interface WalletModalProps {
    isOpen: boolean;
    onClose: () => void;
    isDarkMode: boolean;
    isMobile: boolean;
}

export default function WalletModal({
    isOpen,
    onClose,
    isDarkMode,
    isMobile,
}: WalletModalProps) {
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
                                    <p className={`text-xs font-sans font-bold ${isDarkMode ? "text-white" : "text-black"}`}>Wallet</p>
                                    <p className={`text-[9px] font-sans mt-0.5 ${isDarkMode ? "text-white/30" : "text-black/30"}`}>Your coins and referrals</p>
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
                                <WalletPanel isDarkMode={isDarkMode} isMobile={isMobile} />
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
