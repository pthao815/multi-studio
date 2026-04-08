import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
  const { pathname } = request.nextUrl;
  const isAuthPage = pathname === "/login" || pathname === "/register";

  const jwt = request.cookies.get("appwrite-jwt")?.value;

  let isAuthenticated = false;
  if (jwt) {
    try {
      const response = await fetch(`${endpoint}/account`, {
        headers: {
          "X-Appwrite-Project": projectId ?? "",
          "X-Appwrite-JWT": jwt,
        },
      });
      isAuthenticated = response.ok;
    } catch {
      isAuthenticated = false;
    }
  }

  // Authenticated user hitting /login or /register → send to dashboard
  if (isAuthenticated && isAuthPage) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Unauthenticated user hitting /dashboard/* → send to login
  if (!isAuthenticated && !isAuthPage) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard", "/dashboard/:path*", "/login", "/register"],
};
