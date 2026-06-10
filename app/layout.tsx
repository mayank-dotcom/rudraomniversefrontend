import type { Metadata } from "next";
import { Geist, Geist_Mono, Instrument_Serif, Orbitron, Hanken_Grotesk, Edu_NSW_ACT_Cursive } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import "@/lib/i18n";

const hankenGrotesk = Hanken_Grotesk({
  variable: "--font-hanken",
  subsets: ["latin"],
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-serif",
  weight: "400",
  subsets: ["latin"],
});

const orbitron = Orbitron({
  variable: "--font-orbitron",
  subsets: ["latin"],
});

const eduCursive = Edu_NSW_ACT_Cursive({
  variable: "--font-edu-cursive",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Rudranex AI",
  description: "Rudranex AI: Student Mode, Coding, Interview Prep, and more — all in one.",
  icons: {
    icon: "/dark.svg",
    shortcut: "/dark.svg",
    apple: "/dark.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${hankenGrotesk.variable} ${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable} ${orbitron.variable} ${eduCursive.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster
          position="bottom-right"
          richColors
          toastOptions={{
            style: {
              background: "#111",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "#fff",
              fontFamily: "var(--font-geist-mono)",
              fontSize: "11px",
              letterSpacing: "0.05em",
            },
          }}
        />
      </body>
    </html>
  );
}
