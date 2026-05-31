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

    const response = await fetch(backendUrl.toString(), { redirect: "manual" })

    const location = response.headers.get("location") || ""
    const email = new URLSearchParams(location.includes("?") ? location.split("?")[1] : "").get("email") || ""
    const error = new URLSearchParams(location.includes("?") ? location.split("?")[1] : "").get("error") || ""

    if (error) {
      return NextResponse.redirect(new URL(`/google-connected?error=${encodeURIComponent(error)}`, request.url))
    }

    return NextResponse.redirect(new URL(`/google-connected?email=${encodeURIComponent(email)}`, request.url))
  } catch {
    return NextResponse.redirect(new URL("/google-connected?error=Connection+failed", request.url))
  }
}
