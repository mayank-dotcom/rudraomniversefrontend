import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")
  const state = searchParams.get("state")
  const errorParam = searchParams.get("error")

  const apiBase = process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/+$/, "") || ""

  if (errorParam) {
    return NextResponse.redirect(new URL(`/google-connected?error=${encodeURIComponent(errorParam)}`, request.url))
  }

  if (!code || !state) {
    return NextResponse.redirect(new URL("/google-connected?error=Missing+code+or+state", request.url))
  }

  try {
    const backendUrl = new URL(`${apiBase}/google/callback`)
    backendUrl.searchParams.set("code", code)
    backendUrl.searchParams.set("state", state)

    // Redirect the user's browser directly to the backend callback handler
    // The backend will process tokens and redirect back to the frontend success page.
    return NextResponse.redirect(backendUrl)
  } catch (e: any) {
    return NextResponse.redirect(new URL(`/google-connected?error=${encodeURIComponent(e.message || "Connection failed")}`, request.url))
  }
}
