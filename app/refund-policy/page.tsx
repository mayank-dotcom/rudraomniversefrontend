"use client"
import { useState, useEffect } from "react";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "@/lib/theme-context";
import Refund from "../pages/Refund";

export default function RefundPage() {
    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);
    if (!mounted) return null;
    return <ThemeProvider><BrowserRouter><Refund /></BrowserRouter></ThemeProvider>;
}
