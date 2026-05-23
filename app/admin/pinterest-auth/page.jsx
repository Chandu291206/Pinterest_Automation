import Link from "next/link";

import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

function getAuthorizeUrl(origin) {
  const clientId = process.env.PINTEREST_APP_ID;
  if (!clientId) return "";

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || origin;
  const redirectUri = `${siteUrl}/api/admin/pinterest-callback`;

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: "boards:read,pins:read,pins:write",
  });

  return `https://www.pinterest.com/oauth/?${params.toString()}`;
}

export default async function PinterestAuthPage({ searchParams }) {
  const settings = await getSettings([
    "pinterest_access_token",
    "pinterest_refresh_token",
    "pinterest_token_expires_at",
  ]);

  const hasAccess = Boolean(String(settings.get("pinterest_access_token") ?? "").trim());
  const hasRefresh = Boolean(String(settings.get("pinterest_refresh_token") ?? "").trim());
  const expiresAt = Number(settings.get("pinterest_token_expires_at") ?? "0");
  const readableExpiry = expiresAt > 0 ? new Date(expiresAt * 1000).toLocaleString() : "-";

  const success = String(searchParams?.success ?? "") === "1";
  const error = String(searchParams?.error ?? "");
  const detail = String(searchParams?.detail ?? "");

  const authorizeUrl = getAuthorizeUrl(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000");

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Pinterest OAuth</h1>
        <p className="text-sm text-muted-foreground">
          Connect Pinterest once to save access + refresh tokens in settings.
        </p>
      </header>

      {success ? <p className="text-sm text-green-600">Pinterest connected successfully.</p> : null}
      {error ? <p className="text-sm text-destructive">OAuth error: {error} {detail ? `(${detail})` : ""}</p> : null}

      <div className="space-y-2 rounded-md border p-4 text-sm">
        <p>Access token saved: {hasAccess ? "yes" : "no"}</p>
        <p>Refresh token saved: {hasRefresh ? "yes" : "no"}</p>
        <p>Token expiry: {readableExpiry}</p>
      </div>

      {authorizeUrl ? (
        <a href={authorizeUrl} className="inline-flex rounded-md bg-black px-4 py-2 text-sm font-medium text-white">
          Connect Pinterest
        </a>
      ) : (
        <p className="text-sm text-destructive">Set PINTEREST_APP_ID first.</p>
      )}

      <p className="text-xs text-muted-foreground">
        Make sure your Pinterest app redirect URI includes <code>/api/admin/pinterest-callback</code>.
      </p>

      <Link href="/admin" className="text-sm text-muted-foreground hover:underline">Back to admin</Link>
    </div>
  );
}
