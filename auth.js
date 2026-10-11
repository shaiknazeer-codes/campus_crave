import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

const googleClientId = process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET;

const providers = [];

// 1. Google OAuth Provider
providers.push(
  Google({
    clientId: googleClientId || "placeholder-google-client-id",
    clientSecret: googleClientSecret || "placeholder-google-client-secret",
    allowDangerousEmailAccountLinking: true,
  })
);

// 2. Email & Password Credentials Provider
providers.push(
  Credentials({
    id: "credentials",
    name: "Campus Crave Student Login",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.password) {
        throw new Error("Email and password are required.");
      }

      const email = String(credentials.email).trim().toLowerCase();
      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        throw new Error("No account found with this email. Please create an account first.");
      }

      if (!user.password) {
        throw new Error(
          "This account was registered using Google Sign-In. Please sign in with Google."
        );
      }

      const isBcrypt =
        user.password.startsWith("$2a$") ||
        user.password.startsWith("$2b$") ||
        user.password.startsWith("$2y$");

      let isValid = false;
      if (isBcrypt) {
        isValid = await bcrypt.compare(String(credentials.password), user.password);
      } else {
        // Fallback and upgrade legacy hash if needed
        const crypto = await import("crypto");
        const sha = crypto.createHash("sha256").update(String(credentials.password)).digest("hex");
        if (sha === user.password) {
          isValid = true;
          const newHash = await bcrypt.hash(String(credentials.password), 10);
          await prisma.user.update({
            where: { id: user.id },
            data: { password: newHash },
          });
        }
      }

      if (!isValid) {
        throw new Error("Incorrect password. Please try again.");
      }

      return {
        id: String(user.id),
        name: user.name,
        email: user.email,
        image: user.image,
      };
    },
  })
);

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  providers,
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        if (user.image) {
          token.picture = user.image;
        }
      }
      if (!token.id && token.email) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { email: token.email },
            select: { id: true, image: true },
          });
          if (dbUser) {
            token.id = String(dbUser.id);
            if (!token.picture && dbUser.image) {
              token.picture = dbUser.image;
            }
          }
        } catch (e) {
          console.error("JWT user lookup error:", e);
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token?.id) {
        session.user.id = String(token.id);
      }
      if (token?.picture && !session.user.image) {
        session.user.image = token.picture;
      }
      if (!session.user.id && session?.user?.email) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true, image: true },
          });
          if (dbUser) {
            session.user.id = String(dbUser.id);
            if (!session.user.image && dbUser.image) {
              session.user.image = dbUser.image;
            }
          }
        } catch (e) {
          console.error("Session user lookup error:", e);
        }
      }
      return session;
    },
  },
  pages: {
    signIn: "/",
    error: "/",
  },
});
