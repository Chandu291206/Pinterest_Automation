import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

export async function middleware(request) {
  const sessionCookie = request.cookies.get("admin_session");

  if (!sessionCookie?.value) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const payload = await verifyToken(sessionCookie.value);

  if (!payload || payload.user !== "admin") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/admin/:path*",
    "/api/campaigns/:path*",
    "/api/affiliate-links/:path*",
    "/api/pins/:path*",
  ],
};
