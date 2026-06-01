"use client"

import { ThemeProvider } from "@/lib/theme-context"
import LibraryPage from "@/app/pages/Library"

export default function Library() {
  return (
    <ThemeProvider>
      <LibraryPage />
    </ThemeProvider>
  )
}
