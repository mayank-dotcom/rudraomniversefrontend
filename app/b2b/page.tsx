"use client"

import B2B from "../pages/B2B"
import { ThemeProvider } from "@/lib/theme-context"

export default function B2BPage() {
    return (
        <ThemeProvider>
            <B2B />
        </ThemeProvider>
    )
}
