import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "appwrite-jwt";

// Called after login/register — stores JWT as HttpOnly cookie so middleware can read it
export async function POST(request: NextRequest) {
  const { jwt } = await request.json();
  const response = NextResponse.json({ ok: true });
  response.cookies.set(COOKIE_NAME, jwt, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 900, // 15 minutes — matches Appwrite JWT expiry
  });
  return response;
}

// Called on logout — clears the cookie
export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(COOKIE_NAME);
  return response;
}
