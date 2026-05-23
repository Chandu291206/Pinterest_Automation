import { NextResponse } from "next/server";

import { setSettings } from "@/lib/settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const code = String(request.nextUrl.searchParams.get("code") ?? "").trim();
    if (!code) {
      return NextResponse.redirect(new URL("/admin/pinterest-auth?error=missing_code", request.url));
    }

    const clientId = process.env.PINTEREST_APP_ID;
    const clientSecret = process.env.PINTEREST_APP_SECRET;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;
    const redirectUri = `${siteUrl}/api/admin/pinterest-callback`;

    if (!clientId || !clientSecret) {
      return NextResponse.redirect(
        new URL("/admin/pinterest-auth?error=missing_app_credentials", request.url)
      );
    }

    const body = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      client_id: clientId,
      client_secret: clientSecret,
    });

    const response = await fetch("https://api.pinterest.com/v5/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
      cache: "no-store",
    });

    if (!response.ok) {
      const text = await response.text();
      return NextResponse.redirect(
        new URL(`/admin/pinterest-auth?error=token_exchange_failed&detail=${encodeURIComponent(text.slice(0, 200))}`, request.url)
      );
    }

    const payload = await response.json();
    const accessToken = String(payload?.access_token ?? "").trim();
    const refreshToken = String(payload?.refresh_token ?? "").trim();
    const expiresIn = Number(payload?.expires_in ?? 0);

    if (!accessToken) {
      return NextResponse.redirect(new URL("/admin/pinterest-auth?error=missing_access_token", request.url));
    }

    const expiresAt = Math.floor(Date.now() / 1000) + (Number.isFinite(expiresIn) ? expiresIn : 0);

    await setSettings({
      pinterest_access_token: accessToken,
      pinterest_refresh_token: refreshToken,
      pinterest_token_expires_at: String(expiresAt),
    });

    return NextResponse.redirect(new URL("/admin/pinterest-auth?success=1", request.url));
  } catch (error) {
    const detail = encodeURIComponent(error instanceof Error ? error.message : "oauth_failure");
    return NextResponse.redirect(new URL(`/admin/pinterest-auth?error=unexpected&detail=${detail}`, request.url));
  }
}
