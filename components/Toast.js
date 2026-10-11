"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Campus Crave Professional Toast / Popup Notification
 * - Smooth entrance and exit animations with framer-motion
 * - Auto-dismiss after 3 seconds (customizable)
 * - Accessible with role="alert" or role="status"
 * - Mobile responsive and aligned with Campus Crave warm palette
 */
export default function Toast({ toast, onDismiss }) {
  useEffect(() => {
    if (!toast) return;

    const duration = toast.duration || (toast.type === "error" ? 4000 : 3000);
    const timer = setTimeout(() => {
      if (onDismiss) onDismiss();
    }, duration);

    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  return (
    <div className="pointer-events-none fixed top-5 left-1/2 -translate-x-1/2 z-[100] flex w-full max-w-md flex-col items-center px-4">
      <AnimatePresence mode="wait">
        {toast && (
          <motion.div
            key={toast.id || toast.message}
            initial={{ opacity: 0, y: -20, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 28 }}
            role={toast.type === "error" ? "alert" : "status"}
            aria-live="polite"
            className={`pointer-events-auto flex w-full items-start gap-3.5 rounded-2xl p-4 shadow-2xl backdrop-blur-xl border transition-all ${
              toast.type === "error"
                ? "border-red-200 bg-white/95 text-red-950 shadow-red-500/10"
                : "border-orange-200 bg-white/95 text-gray-900 shadow-orange-500/15"
            }`}
          >
            {/* Status Icon */}
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg font-black shadow-sm ${
                toast.type === "error"
                  ? "bg-red-100 text-red-600"
                  : "bg-gradient-to-br from-green-500 to-emerald-600 text-white"
              }`}
            >
              {toast.type === "error" ? "⚠️" : "✓"}
            </div>

            {/* Content */}
            <div className="flex-1 pt-0.5">
              {toast.title && (
                <p className="text-sm font-black tracking-tight text-gray-900">
                  {toast.title}
                </p>
              )}
              <p className="text-xs sm:text-sm font-medium leading-relaxed text-gray-700">
                {toast.message}
              </p>
            </div>

            {/* Close button */}
            <button
              onClick={onDismiss}
              aria-label="Close notification"
              className="ml-1 -mr-1 -mt-1 flex h-8 w-8 sm:h-7 sm:w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition cursor-pointer active:scale-95"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
