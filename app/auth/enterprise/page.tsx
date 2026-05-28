"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function OldEnterpriseLoginRedirect() {
    const router = useRouter()
    useEffect(() => {
        router.replace("/auth/enterprise-portal")
    }, [router])
    return null
}
