"use client"
import { useState, useEffect } from "react";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "@/lib/theme-context";
import Support from "../pages/Support";

export default function SupportPage() {
    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);
    if (!mounted) return null;
    return <ThemeProvider><BrowserRouter><Support /></BrowserRouter></ThemeProvider>;
}
