"use client"

import MobileApp from "../pages/MobileApp"
import { ThemeProvider } from "@/lib/theme-context"

export default function MobileAppPage() {
    return (
        <ThemeProvider>
            <MobileApp />
        </ThemeProvider>
    )
}
