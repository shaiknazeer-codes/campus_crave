/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Campus Crave Profile Dropdown & Avatar Component
 * - Shows Google user profile image or fallback letter avatar
 * - Opens interactive dropdown on click
 * - Closes on click outside or Escape
 * - Renders user details, disabled "My Orders (Coming Soon)", and Sign Out
 */
export default function ProfileDropdown({ user, onSignOut }) {
  const [isOpen, setIsOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside or pressing Escape
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  if (!user) return null;

  // Determine avatar content
  const initial = user.name ? user.name.trim().charAt(0).toUpperCase() : "U";
  const hasValidImage = Boolean(user.image) && !imageError;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="User profile menu"
        className="flex items-center gap-2 rounded-full border border-orange-200/90 bg-white/90 p-1 pr-2.5 shadow-sm transition hover:border-[#ef6b32] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#ef6b32]/40 cursor-pointer"
      >
        <div className="relative flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center overflow-hidden rounded-full border border-orange-100 bg-gradient-to-br from-[#ef6b32] via-[#e85f26] to-[#dc5218] text-sm font-black text-white shadow-xs">
          {hasValidImage ? (
            <img
              src={user.image}
              alt={user.name || "Student"}
              className="h-full w-full object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <span>{initial}</span>
          )}
        </div>

        {/* Name preview & dropdown arrow */}
        <div className="hidden text-left lg:block max-w-[120px]">
          <p className="truncate text-xs font-bold text-gray-800">
            {user.name || "Student"}
          </p>
          <p className="truncate text-[10px] font-semibold text-gray-400">
            Canteen Member
          </p>
        </div>

        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-[10px] text-gray-500 font-bold ml-0.5"
        >
          ▼
        </motion.span>
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="absolute right-0 top-full mt-2.5 w-72 origin-top-right rounded-2xl border border-orange-100 bg-white/95 p-3 shadow-2xl backdrop-blur-xl z-50"
          >
            {/* User Details Header */}
            <div className="flex items-center gap-3 rounded-xl bg-orange-50/70 p-3 border border-orange-100/60">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-orange-200 bg-gradient-to-br from-[#ef6b32] to-[#dc5218] text-base font-black text-white shadow-xs">
                {hasValidImage ? (
                  <img
                    src={user.image}
                    alt={user.name || "Student"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span>{initial}</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-black tracking-tight text-gray-900">
                  {user.name || "Campus Student"}
                </p>
                <p className="truncate text-xs font-medium text-gray-500">
                  {user.email || "student@college.edu"}
                </p>
                <span className="mt-1 inline-block rounded-md bg-orange-100/90 px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-[#c2410c]">
                  🎓 Verified Student
                </span>
              </div>
            </div>

            {/* Menu Items */}
            <div className="mt-2 space-y-1">
              {/* My Orders — Non-functional since page is not yet implemented */}
              <div
                title="Orders history is coming soon!"
                className="flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-bold text-gray-400 bg-gray-50/60 cursor-not-allowed select-none"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-sm">📦</span>
                  <span>My Orders</span>
                </div>
                <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-[#ea580c]">
                  Coming Soon
                </span>
              </div>
            </div>

            <div className="my-2 border-t border-orange-100/80" />

            {/* Sign Out Button */}
            <button
              onClick={() => {
                setIsOpen(false);
                onSignOut();
              }}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs sm:text-sm font-bold text-red-600 transition hover:bg-red-50 hover:text-red-700 cursor-pointer text-left"
            >
              <span className="text-base">🚪</span>
              <span>Sign out</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
