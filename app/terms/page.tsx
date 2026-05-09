"use client"
import { useState, useEffect } from "react";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "@/lib/theme-context";
import Terms from "../pages/Terms";

export default function TermsPage() {
    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);
    if (!mounted) return null;
    return <ThemeProvider><BrowserRouter><Terms /></BrowserRouter></ThemeProvider>;
}
