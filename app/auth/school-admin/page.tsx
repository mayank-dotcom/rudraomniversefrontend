"use client"

import { useEffect, useState } from "react"
import SchoolAdminLogin from "../../pages/SchoolAdminLogin"
import { getApiKey } from "@/lib/auth"

export default function SchoolAdminLoginPage() {
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    // If already authenticated as School Admin/Faculty, send to dashboard
    const key = getApiKey()
    if (key) {
      window.location.href = "/admin/school-admin"
      return
    }
    setChecking(false)
  }, [])

  if (checking) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="h-8 w-8 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    )
  }

  return <SchoolAdminLogin />
}
