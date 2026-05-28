"use client"

import Plugin from "../pages/Extension"
import { ThemeProvider } from "@/lib/theme-context"

export default function PluginPage() {
    return (
        <ThemeProvider>
            <Plugin />
        </ThemeProvider>
    )
}
