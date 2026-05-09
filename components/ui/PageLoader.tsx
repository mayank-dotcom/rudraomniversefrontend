"use client"

export default function PageLoader() {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#0a0a0a]">
      <div className="relative flex items-center justify-center">
        <div
          className="absolute w-24 h-24 rounded-full border-2 border-transparent border-t-white/80 animate-spin"
          style={{ boxShadow: "0 0 20px rgba(255,255,255,0.1)" }}
        />
        <div className="absolute w-20 h-20 rounded-full border border-white/10 animate-pulse" />
        <div className="scale-150">
          <svg width="48" height="48" viewBox="0 0 128 128" className="text-white/90">
            <polygon
              points="20,20 86,20 86,55 58,55 58,40 42,40 42,55 42,68 104,108 78,108 50,72 42,72 42,108 20,108"
              fill="currentColor"
            />
          </svg>
        </div>
      </div>
    </div>
  )
}
