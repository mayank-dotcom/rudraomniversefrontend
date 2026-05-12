"use client"

import Schools from "../pages/Schools"
import { ThemeProvider } from "@/lib/theme-context"

export default function SchoolsPage() {
    return (
        <ThemeProvider>
            <Schools />
        </ThemeProvider>
    )
}
