"use client"
import { useTheme } from "@/lib/theme-context"

export default function PageLoader() {
  let isDarkMode = true;
  try {
    const theme = useTheme();
    isDarkMode = theme.isDarkMode;
  } catch (e) {
    // Fallback if rendered outside of ThemeProvider
  }
  const logoSrc = isDarkMode ? "/dark.png" : "/light.png";

  return (
    <div className={`fixed inset-0 z-[9999] flex items-center justify-center ${isDarkMode ? "bg-[#0a0a0a]" : "bg-white"}`}>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes pagePixelGlow {
          0%, 100% { filter: drop-shadow(0 0 2px rgba(0,221,221,0.2)) contrast(1.1); }
          50% { filter: drop-shadow(0 0 20px rgba(0,221,221,0.8)) contrast(1.4); }
        }
        .pixelated-page-loader {
          animation: pagePixelGlow 3.2s infinite ease-in-out;
          image-rendering: pixelated;
        }
      `}} />
      <div className="relative flex items-center justify-center">
        <div
          className={`absolute w-32 h-32 rounded-full border-2 border-transparent animate-spin`}
          style={{
            borderTopColor: "var(--brand-accent)",
            opacity: isDarkMode ? 0.8 : 1,
            boxShadow: isDarkMode ? "0 0 30px rgba(0,221,221,0.15)" : "0 0 30px rgba(0,221,221,0.25)",
          }}
        />
        <div className={`absolute w-24 h-24 rounded-full border ${isDarkMode ? "border-white/5 animate-pulse" : "border-black/5 animate-pulse"}`} />
        <div className="w-16 h-16 relative flex items-center justify-center shrink-0">
          <img 
            src={logoSrc} 
            alt="Loading..." 
            className="w-full h-full object-contain pixelated-page-loader transition-transform duration-300"
            style={{ transform: isDarkMode ? "scale(1.5)" : "none" }}
          />
        </div>
      </div>
    </div>
  )
}
