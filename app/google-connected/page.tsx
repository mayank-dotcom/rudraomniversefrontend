"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { CheckCircle, XCircle, ArrowLeft, Mail } from "lucide-react"

export default function GoogleConnectedPage() {
    const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
    const [email, setEmail] = useState("")

    useEffect(() => {
        const params = new URLSearchParams(window.location.search)
        const emailParam = params.get("email")
        const errorParam = params.get("error")

        if (errorParam) {
            setStatus("error")
        } else if (emailParam) {
            setEmail(emailParam)
            setStatus("success")
            // Notify main chat window that Gmail connected
            try {
                localStorage.setItem("gmail_just_connected", emailParam)
            } catch { /* ignore */ }
            // Auto-close popup after 2 seconds
            setTimeout(() => {
                try { window.close() } catch { /* ignore */ }
            }, 2000)
        } else {
            setStatus("success")
        }
    }, [])

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center p-6">
            <div className="max-w-md w-full text-center">
                {status === "loading" && (
                    <div className="animate-pulse space-y-4">
                        <div className="h-16 w-16 mx-auto rounded-full bg-white/10" />
                        <div className="h-4 w-48 mx-auto bg-white/10 rounded" />
                    </div>
                )}
                {status === "success" && (
                    <>
                        <div className="h-16 w-16 mx-auto rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center mb-6">
                            <CheckCircle className="h-8 w-8 text-green-500" />
                        </div>
                        <h1 className="font-display font-black text-3xl tracking-tighter mb-2">Connected!</h1>
                        <p className="text-white/60 text-sm font-mono mb-1">Your Google account has been linked</p>
                        {email && (
                            <div className="flex items-center justify-center gap-2 text-white/40 text-xs font-mono mb-8">
                                <Mail className="h-3 w-3" />
                                {email}
                            </div>
                        )}
                        <Link
                            href="/chat"
                            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-black text-[10px] font-mono uppercase tracking-[0.2em] font-bold hover:bg-white/90 transition-all"
                        >
                            <ArrowLeft className="h-3.5 w-3.5" />
                            Back to Chat
                        </Link>
                    </>
                )}
                {status === "error" && (
                    <>
                        <div className="h-16 w-16 mx-auto rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center mb-6">
                            <XCircle className="h-8 w-8 text-red-500" />
                        </div>
                        <h1 className="font-display font-black text-3xl tracking-tighter mb-2">Connection Failed</h1>
                        <p className="text-white/60 text-sm font-mono mb-8">Could not connect your Google account. Please try again.</p>
                        <Link
                            href="/chat"
                            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-black text-[10px] font-mono uppercase tracking-[0.2em] font-bold hover:bg-white/90 transition-all"
                        >
                            <ArrowLeft className="h-3.5 w-3.5" />
                            Back to Chat
                        </Link>
                    </>
                )}
            </div>
        </div>
    )
}
