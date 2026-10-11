"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { signIn } from "next-auth/react";
import Toast from "@/components/Toast";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [toast, setToast] = useState(null);
  const oauthToastShownRef = useRef(false);

  const errorParam = searchParams?.get("error");
  const oauthErrorMessage = errorParam
    ? errorParam === "OAuthSignin" || errorParam === "OAuthCallback"
      ? "Google Sign-In was cancelled or could not be completed. Please try again or use email sign-in."
      : errorParam === "AccessDenied"
      ? "Access was denied during Google Sign-In."
      : errorParam === "Configuration"
      ? "OAuth Configuration error: Missing AUTH_SECRET, AUTH_GOOGLE_ID, or AUTH_GOOGLE_SECRET in environment variables (Vercel)."
      : "Authentication error: " + errorParam
    : "";

  const activeError = error || oauthErrorMessage;

  useEffect(() => {
    if (oauthErrorMessage && !oauthToastShownRef.current) {
      oauthToastShownRef.current = true;
      setToast({
        id: "oauth-err",
        type: "error",
        title: "Google Sign-In Error",
        message: oauthErrorMessage,
      });
    }
  }, [oauthErrorMessage]);

  // Handle Google OAuth Sign-In
  const handleGoogleSignIn = async () => {
    try {
      setError("");
      setSuccess("");
      setGoogleLoading(true);
      if (typeof window !== "undefined") {
        sessionStorage.setItem("campus_crave_pending_google_login", "true");
      }
      await signIn("google", { callbackUrl: "/home" });
    } catch (err) {
      console.error("Google sign-in error:", err);
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("campus_crave_pending_google_login");
      }
      const msg = "Failed to start Google sign-in. Please try again or sign in with email.";
      setError(msg);
      setToast({
        id: "google-start-err",
        type: "error",
        title: "Google Sign-In Failed",
        message: msg,
      });
      setGoogleLoading(false);
    }
  };

  // Handle Email & Password Sign-In
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email.trim() || !password) {
      const msg = "Please enter both your college email and password.";
      setError(msg);
      setToast({
        id: "missing-fields",
        type: "error",
        title: "Required Fields",
        message: msg,
      });
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        const errMsg = data.error || "Invalid email or password.";
        setError(errMsg);
        setToast({
          id: "auth-fail",
          type: "error",
          title: "Sign-In Failed",
          message: errMsg,
        });
        setLoading(false);
        return;
      }

      // Genuine authentication success! Pass flash to /home so success toast displays there
      if (typeof window !== "undefined") {
        sessionStorage.setItem(
          "campus_crave_login_flash",
          JSON.stringify({
            name: data.user?.name || "Student",
            provider: "credentials",
          })
        );
      }

      setSuccess("Welcome back! Loading your campus favorites...");
      router.push("/home");
    } catch (err) {
      console.error("Login request error:", err);
      const networkErr = "Network connection error. Please try again.";
      setError(networkErr);
      setToast({
        id: "network-fail",
        type: "error",
        title: "Connection Error",
        message: networkErr,
      });
      setLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#fffaf3] p-4 sm:p-6 lg:p-10">
      {/* Toast Notification Container */}
      <Toast toast={toast} onDismiss={() => setToast(null)} />
      {/* Background ambient lighting */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <motion.div
          animate={{ x: [0, 40, 0], y: [0, 30, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -left-28 -top-28 h-96 w-96 rounded-full bg-orange-300/30 blur-3xl"
        />
        <motion.div
          animate={{ x: [0, -35, 0], y: [0, -25, 0], scale: [1, 1.15, 1] }}
          transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -right-28 -bottom-28 h-[28rem] w-[28rem] rounded-full bg-yellow-200/35 blur-3xl"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 grid w-full max-w-5xl overflow-hidden rounded-3xl border border-orange-100/80 bg-white shadow-2xl md:grid-cols-2"
      >
        {/* Left Side: Brand Experience */}
        <section className="relative flex flex-col justify-between overflow-hidden bg-gradient-to-br from-[#fff4e6] via-[#ffe5cb] to-[#ffd4ac] p-8 text-gray-900 sm:p-12 md:min-h-[640px] border-b md:border-b-0 md:border-r border-orange-200/60">
          {/* Subtle geometric light circles */}
          <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/70 blur-2xl" />
          <div className="absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-orange-300/30 blur-3xl" />

          {/* Top: Logo & Welcome */}
          <div className="relative z-10">
            <Link href="/" className="inline-flex items-center gap-3">
              <motion.div
                whileHover={{ rotate: [-6, 6, 0], scale: 1.08 }}
                className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-2xl shadow-md border border-orange-100"
              >
                🍔
              </motion.div>
              <div>
                <p className="text-xl font-black tracking-tight text-gray-950 sm:text-2xl">
                  Campus <span className="text-[#ea580c]">Crave.</span>
                </p>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#c2410c]">
                  College Canteen Platform
                </p>
              </div>
            </Link>

            <div className="mt-10 sm:mt-12">
              <span className="inline-flex items-center gap-2 rounded-full border border-orange-200/90 bg-white/80 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-[#c2410c] shadow-xs backdrop-blur-sm">
                <span>🔥</span> Less Queue · More Craving
              </span>

              <h1 className="mt-4 text-3xl font-black leading-tight text-gray-950 sm:text-4xl lg:text-5xl">
                Fresh food.
                <br />
                Fast breaks.
                <br />
                <span className="text-[#ea580c]">Zero waiting.</span>
              </h1>

              <p className="mt-4 max-w-md text-sm font-medium leading-6 text-gray-700 sm:text-base sm:leading-7">
                Order your favorite sandwiches, dosas, coffee, and canteen meals directly from your phone. Skip the queue and collect when ready.
              </p>
            </div>
          </div>

          {/* Value Props */}
          <div className="relative z-10 mt-8 space-y-3.5 pt-6 border-t border-orange-200/80 text-xs sm:text-sm text-gray-800">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/90 border border-orange-200/80 text-base shadow-xs text-orange-600">
                ⚡
              </span>
              <span className="font-medium text-gray-800">Fast live menu with real-time canteen status</span>
            </div>
            <div className="flex items-center gap-3">
              
              
            </div>
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/90 border border-orange-200/80 text-base shadow-xs text-orange-600">
                🎓
              </span>
              <span className="font-medium text-gray-800">Built exclusively for your college campus</span>
            </div>
          </div>
        </section>

        {/* Right Side: Authentication Form */}
        <section className="flex flex-col justify-center p-7 sm:p-10 md:p-12 lg:p-14">
          <div className="mb-6">
            <span className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#ef6b32]">
              STUDENT SIGN IN
            </span>

            <h2 className="mt-1 text-2xl font-black tracking-tight text-gray-900 sm:text-3xl">
              Welcome to Campus Crave
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Your campus cravings, just a click away.
            </p>
          </div>

          {/* Feedback messages */}
          <AnimatePresence mode="wait">
            {activeError && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                role="alert"
                className="mb-5 flex items-start gap-2.5 rounded-2xl border border-red-200 bg-red-50/90 p-3.5 text-xs sm:text-sm font-semibold text-red-700"
              >
                <span className="text-base leading-none">⚠️</span>
                <span className="flex-1">{activeError}</span>
              </motion.div>
            )}

            {success && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                role="status"
                className="mb-5 flex items-start gap-2.5 rounded-2xl border border-green-200 bg-green-50/90 p-3.5 text-xs sm:text-sm font-semibold text-green-700"
              >
                <span className="text-base leading-none">✓</span>
                <span className="flex-1">{success}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 1. Google Sign-In Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading || loading}
            className="group relative flex w-full items-center justify-center gap-3 rounded-2xl border border-gray-200 bg-white px-5 py-3.5 text-sm font-bold text-gray-700 shadow-sm transition hover:border-gray-300 hover:bg-gray-50/80 hover:shadow-md active:translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >
            {googleLoading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-400 border-t-[#ef6b32]" />
                Connecting to Google...
              </span>
            ) : (
              <>
                {/* Standard Google Multicolor Logo */}
                <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google</span>
              </>
            )}
          </button>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-gray-200" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
              OR CONTINUE WITH EMAIL
            </span>
            <div className="h-px flex-1 bg-gray-200" />
          </div>

          {/* 2. Email & Password Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-xs sm:text-sm font-bold text-gray-700"
              >
                College email address
              </label>

              <div className="relative">
                <input
                  id="email"
                  type="email"
                  placeholder="student@college.edu"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError("");
                  }}
                  required
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50/80 px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#ef6b32] focus:bg-white focus:ring-4 focus:ring-orange-100"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-xs sm:text-sm font-bold text-gray-700"
              >
                Password
              </label>

              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                  }}
                  required
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50/80 px-4 py-3 pr-20 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#ef6b32] focus:bg-white focus:ring-4 focus:ring-orange-100"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-500 hover:text-[#ef6b32] cursor-pointer"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || googleLoading}
              className="mt-2 w-full rounded-2xl bg-gradient-to-r from-[#ef6b32] to-orange-500 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-orange-200/80 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-orange-200 active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Signing in...
                </span>
              ) : (
                "Sign In →"
              )}
            </button>
          </form>

          {/* Switch to Register */}
          <div className="mt-7 text-center">
            <p className="text-xs sm:text-sm text-gray-600">
              New to Campus Crave?{" "}
              <Link
                href="/register"
                className="font-extrabold text-[#ef6b32] hover:text-[#dc5218] hover:underline"
              >
                Create student account →
              </Link>
            </p>

            <p className="mt-6 text-[11px] text-gray-400">
              © 2026 Campus Crave · Made for campus life
            </p>
          </div>
        </section>
      </motion.div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#fffaf3]">
          <div className="text-center font-bold text-orange-600">
            <div className="text-4xl animate-bounce">🍔</div>
            <p className="mt-2">Loading Campus Crave...</p>
          </div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}