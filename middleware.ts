import { NextRequest, NextResponse } from "next/server";

function unauthorizedResponse() {
  return new NextResponse("Authentication required", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Admin Area"',
    },
  });
}

export function middleware(request: NextRequest) {
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;

  if (!username || !password) {
    return new NextResponse("Admin credentials are not configured.", { status: 500 });
  }

  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Basic ")) {
    return unauthorizedResponse();
  }

  const encoded = authHeader.replace("Basic ", "").trim();
  let decoded = "";
  try {
    decoded = atob(encoded);
  } catch {
    return unauthorizedResponse();
  }

  const separator = decoded.indexOf(":");
  if (separator === -1) {
    return unauthorizedResponse();
  }

  const providedUser = decoded.slice(0, separator);
  const providedPass = decoded.slice(separator + 1);

  if (providedUser !== username || providedPass !== password) {
    return unauthorizedResponse();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
