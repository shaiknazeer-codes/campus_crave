import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/auth";

// POST /api/auth/logout — Clears all session cookies securely
export async function POST() {
  const cookie = clearSessionCookie();
  const res = NextResponse.json({ ok: true, message: "Logged out successfully" });
  res.cookies.set(cookie);

  // Clear Auth.js session cookies
  const authCookies = [
    "authjs.session-token",
    "__Secure-authjs.session-token",
    "next-auth.session-token",
    "__Secure-next-auth.session-token",
    "authjs.csrf-token",
    "next-auth.csrf-token",
    "authjs.callback-url",
    "next-auth.callback-url",
  ];

  for (const name of authCookies) {
    res.cookies.set({
      name,
      value: "",
      path: "/",
      maxAge: 0,
    });
  }

  return res;
}
