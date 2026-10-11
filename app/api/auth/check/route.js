import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  const authSecret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  const googleId = process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID;
  const googleSecret = process.env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET;
  const dbUrl = process.env.DATABASE_URL;

  let dbStatus = "not_checked";
  let dbError = null;

  if (dbUrl) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      dbStatus = "connected";
    } catch (err) {
      dbStatus = "failed";
      dbError = err?.message || String(err);
    }
  } else {
    dbStatus = "missing_url";
  }

  const isLocalDb = Boolean(
    dbUrl && (dbUrl.includes("localhost") || dbUrl.includes("127.0.0.1"))
  );

  return NextResponse.json({
    status: "ok",
    environment_variables_detected_by_vercel: {
      AUTH_SECRET: Boolean(authSecret && authSecret.length > 5),
      AUTH_GOOGLE_ID: Boolean(googleId && !googleId.includes("placeholder")),
      AUTH_GOOGLE_ID_PREVIEW: googleId ? `${googleId.substring(0, 15)}...` : "MISSING",
      AUTH_GOOGLE_SECRET: Boolean(googleSecret && !googleSecret.includes("placeholder")),
      DATABASE_URL_CONFIGURED: Boolean(dbUrl),
      DATABASE_IS_LOCALHOST: isLocalDb,
      DATABASE_CONNECTION_STATUS: dbStatus,
      DATABASE_ERROR_SAMPLE: dbError ? dbError.substring(0, 120) : null,
    },
    what_to_fix_if_false: {
      AUTH_SECRET: !authSecret ? "Add AUTH_SECRET in Vercel Project Settings -> Environment Variables" : "OK",
      AUTH_GOOGLE_ID: !googleId || googleId.includes("placeholder") ? "Add AUTH_GOOGLE_ID in Vercel Project Settings -> Environment Variables" : "OK",
      AUTH_GOOGLE_SECRET: !googleSecret || googleSecret.includes("placeholder") ? "Add AUTH_GOOGLE_SECRET in Vercel Project Settings -> Environment Variables" : "OK",
      DATABASE: isLocalDb ? "DATABASE_URL points to localhost! Vercel cannot reach your local PC MySQL. Use a cloud database." : (dbStatus === "failed" ? `DB connection failed: ${dbError?.substring(0, 80)}` : "OK"),
    },
  });
}
