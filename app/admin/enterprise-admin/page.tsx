"use client"

import Link from "next/link"
import { Building2, LogOut } from "lucide-react"
import { removeApiKey } from "@/lib/auth"

export default function EnterpriseAdminPage() {
  const handleLogout = () => {
    removeApiKey()
    window.location.href = "/admin"
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white px-6 md:px-20 py-20">
      <div className="max-w-4xl mx-auto border border-white/10 rounded-3xl p-10 bg-white/5">
        <div className="flex items-center gap-4 mb-6">
          <div className="h-12 w-12 rounded-2xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center">
            <Building2 className="h-6 w-6 text-orange-400" />
          </div>
          <h1 className="text-3xl font-display font-black tracking-tight">Enterprise Admin Panel</h1>
        </div>
        <p className="text-white/60 text-sm mb-8">
          Login successful. Enterprise admin routing is active and this panel is ready for next feature integration.
        </p>
        <div className="flex items-center gap-3">
          <Link href="/auth" className="px-5 py-3 border border-white/10 rounded-2xl text-[10px] font-mono uppercase tracking-[0.2em] hover:bg-white/5">
            Back to Roles
          </Link>
          <button
            onClick={handleLogout}
            className="px-5 py-3 bg-white text-black rounded-2xl text-[10px] font-mono uppercase tracking-[0.2em] font-bold flex items-center gap-2"
          >
            <LogOut className="h-3.5 w-3.5" />
            Logout
          </button>
        </div>
      </div>
    </div>
  )
}
