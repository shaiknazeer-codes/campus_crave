import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { createSessionCookie } from "@/lib/auth";

// POST /api/auth/login — Secure login with bcrypt verification and session cookie
export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email?.trim() || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    if (!user.password) {
      return NextResponse.json(
        {
          error:
            "This account was registered with Google. Please use 'Continue with Google'.",
        },
        { status: 400 }
      );
    }

    const isBcrypt =
      user.password.startsWith("$2a$") ||
      user.password.startsWith("$2b$") ||
      user.password.startsWith("$2y$");

    let isValid = false;
    if (isBcrypt) {
      isValid = await bcrypt.compare(password, user.password);
    } else {
      // Legacy hash check with automatic upgrade to bcrypt
      const crypto = await import("crypto");
      const sha = crypto
        .createHash("sha256")
        .update(password)
        .digest("hex");
      if (sha === user.password) {
        isValid = true;
        const newHash = await bcrypt.hash(password, 10);
        await prisma.user.update({
          where: { id: user.id },
          data: { password: newHash },
        });
      }
    }

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    const cookie = createSessionCookie(user.id);
    const res = NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
      },
    });
    res.cookies.set(cookie);
    return res;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Login failed. Please try again." },
      { status: 500 }
    );
  }
}
