"use client"
import { ThemeProvider } from "@/lib/theme-context";
import Chat from "../pages/Chat";

export default function ChatPage() {
    return <ThemeProvider><Chat /></ThemeProvider>;
}
