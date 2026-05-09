"use client"
import { useState, useEffect } from "react";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "@/lib/theme-context";
import Privacy from "../pages/Privacy";

export default function PrivacyPage() {
    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);
    if (!mounted) return null;
    return <ThemeProvider><BrowserRouter><Privacy /></BrowserRouter></ThemeProvider>;
}
