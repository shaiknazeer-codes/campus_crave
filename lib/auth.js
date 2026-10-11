import { cookies } from "next/headers";
import crypto from "crypto";
import { auth } from "@/auth";

const SECRET =
  process.env.SESSION_SECRET ||
  process.env.AUTH_SECRET ||
  "campus-crave-super-secure-auth-secret-key-2026";
const COOKIE_NAME = "campus-crave-session";

function sign(value) {
  const signature = crypto
    .createHmac("sha256", SECRET)
    .update(value)
    .digest("hex");
  return `${value}.${signature}`;
}

function unsign(signed) {
  const idx = signed.lastIndexOf(".");
  if (idx === -1) return null;

  const value = signed.slice(0, idx);
  const expected = sign(value);

  if (signed.length !== expected.length) return null;

  const a = Buffer.from(signed);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return null;
  if (!crypto.timingSafeEqual(a, b)) return null;

  return value;
}

/**
 * Server-side helper that reads the authenticated user's ID.
 * Works seamlessly with Auth.js (Google OAuth & NextAuth credentials)
 * as well as direct session cookies.
 */
export async function getSessionUserId() {
  // 1. Check Auth.js session (Google OAuth & NextAuth credentials)
  try {
    const session = await auth();
    if (session?.user?.id) {
      const parsed = parseInt(session.user.id, 10);
      if (Number.isFinite(parsed) && parsed > 0) {
        return parsed;
      }
    }
  } catch (err) {
    // If running in a context where auth() isn't accessible, fallback to cookie
  }

  // 2. Check signed session cookie
  try {
    const cookieStore = await cookies();
    const cookie = cookieStore.get(COOKIE_NAME);

    if (cookie?.value) {
      const raw = unsign(cookie.value);
      if (raw) {
        const parsed = parseInt(raw, 10);
        if (Number.isFinite(parsed) && parsed > 0) {
          return parsed;
        }
      }
    }
  } catch (err) {
    // Cookie store read error
  }

  return null;
}

/**
 * Create a signed session cookie value for the given userId.
 */
export function createSessionCookie(userId) {
  return {
    name: COOKIE_NAME,
    value: sign(String(userId)),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  };
}

/**
 * Create an expired cookie to clear the session.
 */
export function clearSessionCookie() {
  return {
    name: COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  };
}
