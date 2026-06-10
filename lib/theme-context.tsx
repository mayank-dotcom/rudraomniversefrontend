"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from "react"

type ThemeContextType = {
  isDarkMode: boolean
  toggleTheme: () => void
  setDarkMode: (dark: boolean) => void
}

const ThemeContext = createContext<ThemeContextType>({
  isDarkMode: true,
  toggleTheme: () => {},
  setDarkMode: () => {},
})

const ACCENT_STORAGE_KEY = "rudranex_accent";

function hexToRgb(hex: string): string {
  if (!hex) return "0, 0, 0";
  const h = hex.replace("#", "");
  return `${parseInt(h.substring(0, 2), 16)}, ${parseInt(h.substring(2, 4), 16)}, ${parseInt(h.substring(4, 6), 16)}`;
}

function applyStoredAccent() {
  if (typeof window === "undefined") return;
  const color = localStorage.getItem(ACCENT_STORAGE_KEY);
  if (color) {
    document.documentElement.style.setProperty("--brand-accent", color);
    document.documentElement.style.setProperty("--brand-accent-rgb", hexToRgb(color));
  } else {
    document.documentElement.style.removeProperty("--brand-accent");
    document.documentElement.style.removeProperty("--brand-accent-rgb");
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [isDarkMode, setIsDarkMode] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    applyStoredAccent()
    const stored = localStorage.getItem("rudranex_theme")
    if (stored !== null) {
      setIsDarkMode(stored === "dark")
    }
  }, [])

  useEffect(() => {
    if (mounted) {
      localStorage.setItem("rudranex_theme", isDarkMode ? "dark" : "light")
      if (isDarkMode) {
        document.documentElement.classList.add("dark")
      } else {
        document.documentElement.classList.add("light")
        document.documentElement.classList.remove("dark")
      }
    }
  }, [isDarkMode, mounted])

  const toggleTheme = () => setIsDarkMode(prev => !prev)
  const setDarkMode = (dark: boolean) => setIsDarkMode(dark)

  if (!mounted) {
    return <div style={{ display: "none" }}>{children}</div>
  }

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme, setDarkMode }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
