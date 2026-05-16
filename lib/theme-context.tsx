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

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [isDarkMode, setIsDarkMode] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
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
