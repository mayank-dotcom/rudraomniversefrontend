"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { Check, XCircle } from "lucide-react"
import { setApiKey } from "@/lib/auth"

function XConnectedContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [username, setUsername] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    const usernameParam = searchParams.get("username")
    const apiKeyParam = searchParams.get("api_key")
    const errorParam = searchParams.get("error")

    if (errorParam) {
      setError(errorParam)
      setStatus("error")
      return
    }

    if (apiKeyParam) {
      setApiKey(apiKeyParam)
    }

    if (usernameParam) {
      setUsername(usernameParam)
      setStatus("success")
    } else if (apiKeyParam) {
      setStatus("success")
    } else {
      setError("No username received")
      setStatus("error")
    }
  }, [searchParams])

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#0a0a0a]">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center max-w-md"
      >
        {status === "loading" && (
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ duration: 2, ease: "easeInOut" }}
            className="h-1 rounded-full bg-blue-500"
          />
        )}

        {status === "success" && (
          <>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="h-20 w-20 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center mx-auto mb-6"
            >
              <Check className="h-10 w-10 text-blue-400" />
            </motion.div>
            <h1 className="text-2xl font-bold mb-3 text-white">X Connected!</h1>
            {username && (
              <p className="text-sm text-white/60">
                Your X account <span className="text-blue-400 font-semibold">@{username}</span> has been connected successfully.
              </p>
            )}
            <p className="text-xs text-white/40 mt-4">
              You can now close this tab and return to your IDE.
            </p>
          </>
        )}

        {status === "error" && (
          <>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="h-20 w-20 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center mx-auto mb-6"
            >
              <XCircle className="h-10 w-10 text-red-400" />
            </motion.div>
            <h1 className="text-2xl font-bold mb-3 text-white">Connection Failed</h1>
            <p className="text-sm text-white/60">{error || "Failed to connect X account."}</p>
            <button
              onClick={() => router.push("/")}
              className="mt-6 px-6 py-2 bg-white text-black rounded-lg text-sm font-semibold"
            >
              Go Home
            </button>
          </>
        )}
      </motion.div>
    </div>
  )
}

export default function XConnectedPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#0a0a0a]">
        <div className="h-1 w-48 rounded-full bg-blue-500" />
      </div>
    }>
      <XConnectedContent />
    </Suspense>
  )
}
