"use client"

import { ThemeProvider } from "@/lib/theme-context"
import EnterprisePortalLogin from "../../pages/EnterprisePortalLogin"

export default function EnterprisePortalLoginPage() {
    return <ThemeProvider><EnterprisePortalLogin /></ThemeProvider>
}
