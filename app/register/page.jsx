"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { signIn } from "next-auth/react";

export default function RegisterPage() {
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  }

  // Handle Google OAuth Sign-In from Registration Page
  const handleGoogleSignIn = async () => {
    try {
      setError("");
      setSuccess("");
      setGoogleLoading(true);
      await signIn("google", { callbackUrl: "/home" });
    } catch (err) {
      console.error("Google sign-in error:", err);
      setError("Failed to start Google sign-in. Please try again or create an account with email.");
      setGoogleLoading(false);
    }
  };

  // Handle Registration Form Submission
  async function handleRegister(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!form.name.trim()) {
      setError("Please provide your full name.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }

    if (form.password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match. Please re-enter.");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed. Please try again.");
        setLoading(false);
        return;
      }

      setSuccess("Account created successfully! Preparing your menu...");
      setTimeout(() => {
        router.push("/home");
      }, 500);
    } catch (err) {
      console.error("Register request error:", err);
      setError("Network connection error. Please try again.");
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-x-hidden bg-[#fffaf3] p-3 sm:p-6 lg:p-10">
      {/* Ambient background lighting */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <motion.div
          animate={{ x: [0, 35, 0], y: [0, 25, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -left-28 -top-28 h-72 w-72 sm:h-96 sm:w-96 rounded-full bg-orange-300/30 blur-3xl"
        />
        <motion.div
          animate={{ x: [0, -30, 0], y: [0, -20, 0], scale: [1, 1.12, 1] }}
          transition={{ duration: 17, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -right-28 -bottom-28 h-80 w-80 sm:h-[28rem] sm:w-[28rem] rounded-full bg-yellow-200/35 blur-3xl"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 grid w-full max-w-5xl overflow-hidden rounded-2xl sm:rounded-3xl border border-orange-100/80 bg-white shadow-xl sm:shadow-2xl md:grid-cols-2"
      >
        {/* Left Side: Brand Story (Compact on mobile, rich on desktop) */}
        <section className="relative flex flex-col justify-between overflow-hidden bg-gradient-to-br from-[#ef6b32] via-[#e85f26] to-[#dc5218] p-6 sm:p-10 md:p-12 md:min-h-[680px]">
          <div className="absolute -right-16 -top-16 h-60 w-60 rounded-full bg-white/10 blur-xl" />
          <div className="absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-black/15 blur-2xl" />

          {/* Top Logo & Welcome */}
          <div className="relative z-10">
            <Link href="/" className="inline-flex items-center gap-2.5 sm:gap-3">
              <motion.div
                whileHover={{ rotate: [-6, 6, 0], scale: 1.08 }}
                className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl sm:rounded-2xl bg-white text-xl sm:text-2xl shadow-md"
              >
                🍔
              </motion.div>
              <div>
                <p className="text-lg sm:text-xl font-black tracking-tight text-white sm:text-2xl">
                  Campus <span className="text-yellow-200">Crave.</span>
                </p>
                <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.2em] text-orange-200">
                  College Canteen Platform
                </p>
              </div>
            </Link>

            <div className="mt-6 sm:mt-10 md:mt-12">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] sm:text-xs font-bold uppercase tracking-wider text-orange-100 backdrop-blur-sm">
                <span>🎓</span> Join 1,200+ Campus Foodies
              </span>

              <h1 className="mt-3 sm:mt-4 text-2xl font-black leading-tight sm:text-4xl lg:text-5xl">
                Skip the lines.
                <span className="inline md:hidden"> </span>
                <br className="hidden md:inline" />
                Eat well.
                <span className="inline md:hidden"> </span>
                <br className="hidden md:inline" />
                Repeat daily.
              </h1>

              <p className="mt-2.5 sm:mt-4 max-w-md text-xs sm:text-sm md:text-base leading-relaxed text-orange-100/90">
                Set up your student account to unlock the full canteen menu, save your personal cart, and enjoy seamless order collection between classes.
              </p>
            </div>
          </div>

          {/* Value Highlights (Shown on tablet & desktop) */}
          <div className="relative z-10 mt-6 md:mt-8 space-y-3 pt-4 sm:pt-6 border-t border-white/15 text-xs sm:text-sm text-orange-50 hidden md:block">
            <div className="flex items-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/15 text-base">
                🥪
              </span>
              <span>Fast online canteen pre-orders</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/15 text-base">
                🛒
              </span>
              <span>Persistent cloud cart saved to your account</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/15 text-base">
                ⚡
              </span>
              <span>Instant order confirmation with order ID</span>
            </div>
          </div>
        </section>

        {/* Right Side: Registration Form */}
        <section className="flex flex-col justify-center p-5 sm:p-8 md:p-10 lg:p-12">
          <div className="mb-6">
            <span className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#ef6b32]">
              NEW STUDENT
            </span>

            <h2 className="mt-1 text-2xl font-black tracking-tight text-gray-900 sm:text-3xl">
              Create student account
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Sign up with Google or your college email.
            </p>
          </div>

          {/* Feedback messages */}
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                role="alert"
                className="mb-5 flex items-start gap-2.5 rounded-2xl border border-red-200 bg-red-50/90 p-3.5 text-xs sm:text-sm font-semibold text-red-700"
              >
                <span className="text-base leading-none">⚠️</span>
                <span className="flex-1">{error}</span>
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
          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-gray-200" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
              OR REGISTER WITH EMAIL
            </span>
            <div className="h-px flex-1 bg-gray-200" />
          </div>

          {/* 2. Registration Form */}
          <form onSubmit={handleRegister} className="space-y-3.5">
            <div>
              <label
                htmlFor="name"
                className="mb-1 block text-xs sm:text-sm font-bold text-gray-700"
              >
                Full name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                placeholder="e.g. Rahul Sharma"
                autoComplete="name"
                value={form.name}
                onChange={handleChange}
                required
                className="w-full rounded-2xl border border-gray-200 bg-gray-50/80 px-4 py-3 text-base sm:text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#ef6b32] focus:bg-white focus:ring-4 focus:ring-orange-100"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="mb-1 block text-xs sm:text-sm font-bold text-gray-700"
              >
                College email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="you@college.edu"
                autoComplete="email"
                value={form.email}
                onChange={handleChange}
                required
                className="w-full rounded-2xl border border-gray-200 bg-gray-50/80 px-4 py-3 text-base sm:text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#ef6b32] focus:bg-white focus:ring-4 focus:ring-orange-100"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-1 block text-xs sm:text-sm font-bold text-gray-700"
              >
                Password <span className="text-[11px] font-normal text-gray-400">(min. 8 characters)</span>
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a strong password"
                  autoComplete="new-password"
                  value={form.password}
                  onChange={handleChange}
                  minLength={8}
                  required
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50/80 px-4 py-3 pr-16 text-base sm:text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#ef6b32] focus:bg-white focus:ring-4 focus:ring-orange-100"
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

            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-1 block text-xs sm:text-sm font-bold text-gray-700"
              >
                Confirm password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Re-enter your password"
                  autoComplete="new-password"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  required
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50/80 px-4 py-3 pr-16 text-base sm:text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#ef6b32] focus:bg-white focus:ring-4 focus:ring-orange-100"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-500 hover:text-[#ef6b32] cursor-pointer"
                >
                  {showConfirmPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || googleLoading}
              className="mt-3 w-full rounded-2xl bg-gradient-to-r from-[#ef6b32] to-orange-500 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-orange-200/80 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-orange-200 active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Creating account...
                </span>
              ) : (
                "Create Account →"
              )}
            </button>
          </form>

          {/* Switch to Sign In */}
          <div className="mt-6 text-center">
            <p className="text-xs sm:text-sm text-gray-600">
              Already have an account?{" "}
              <Link
                href="/"
                className="font-extrabold text-[#ef6b32] hover:text-[#dc5218] hover:underline"
              >
                Sign in here →
              </Link>
            </p>

            <p className="mt-5 text-[11px] text-gray-400">
              © 2026 Campus Crave · Made for campus life
            </p>
          </div>
        </section>
      </motion.div>
    </main>
  );
}