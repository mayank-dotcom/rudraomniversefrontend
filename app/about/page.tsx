"use client"
import { useState, useEffect } from "react";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "@/lib/theme-context";
import About from "../pages/About";

export default function AboutPage() {
    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);
    if (!mounted) return null;
    return <ThemeProvider><BrowserRouter><About /></BrowserRouter></ThemeProvider>;
}
