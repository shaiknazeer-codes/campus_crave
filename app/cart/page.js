"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

const emojiByName = {
  "Veg Sandwich": "🥪",
  "Masala Dosa": "🥞",
  "Veg Burger": "🍔",
  "Cold Coffee": "☕",
  "Veg Thali": "🍛",
  "Chocolate Cake": "🍰",
};

const emojiByCategory = {
  Breakfast: "🍳",
  Snacks: "🍟",
  Meals: "🍛",
  Beverages: "🥤",
  Desserts: "🍰",
};

const colorByName = {
  "Veg Sandwich": "from-yellow-100 to-orange-50",
  "Masala Dosa": "from-orange-100 to-yellow-50",
  "Veg Burger": "from-red-100 to-orange-50",
  "Cold Coffee": "from-amber-100 to-yellow-50",
  "Veg Thali": "from-green-100 to-lime-50",
  "Chocolate Cake": "from-pink-100 to-rose-50",
};

const colorByCategory = {
  Breakfast: "from-orange-100 to-yellow-50",
  Snacks: "from-yellow-100 to-orange-50",
  Meals: "from-green-100 to-lime-50",
  Beverages: "from-amber-100 to-yellow-50",
  Desserts: "from-pink-100 to-rose-50",
};

const defaultEmoji = "🍽️";
const defaultColor = "from-orange-100 to-amber-50";

function mapCartItem(item) {
  const category = item.food?.category?.name || "Other";
  return {
    id: item.foodId,
    cartItemId: item.id,
    foodId: item.foodId,
    name: item.food?.name || "Food Item",
    description: item.food?.description || "",
    price: Number(item.food?.price || 0),
    quantity: item.quantity,
    category,
    image: item.food?.image || null,
    emoji: emojiByName[item.food?.name] || emojiByCategory[category] || defaultEmoji,
    color: colorByName[item.food?.name] || colorByCategory[category] || defaultColor,
    available: item.food?.available ?? true,
  };
}

export default function CartPage() {
  const [cart, setCart] = useState([]);
  const [cartLoaded, setCartLoaded] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [actionError, setActionError] = useState("");
  const [isAuthRequired, setIsAuthRequired] = useState(false);

  // Fetch cart directly from MySQL database API
  async function loadCart() {
    try {
      setActionError("");
      const res = await fetch("/api/cart");

      if (res.status === 401) {
        setIsAuthRequired(true);
        setCart([]);
        return;
      }

      if (!res.ok) {
        throw new Error("Failed to load cart");
      }

      setIsAuthRequired(false);
      const data = await res.json();
      const dbItems = Array.isArray(data.items) ? data.items.map(mapCartItem) : [];

      // Safe migration of legacy localStorage cart if present
      try {
        const legacy = localStorage.getItem("campus-crave-cart");
        if (legacy) {
          const parsed = JSON.parse(legacy);
          if (Array.isArray(parsed) && parsed.length > 0) {
            for (const legacyItem of parsed) {
              if (legacyItem.id && !dbItems.some((di) => di.foodId === legacyItem.id)) {
                await fetch("/api/cart", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ foodId: legacyItem.id, quantity: legacyItem.quantity || 1 }),
                });
              }
            }
            const updatedRes = await fetch("/api/cart");
            if (updatedRes.ok) {
              const updatedData = await updatedRes.json();
              setCart(Array.isArray(updatedData.items) ? updatedData.items.map(mapCartItem) : []);
            }
          }
          localStorage.removeItem("campus-crave-cart");
        } else {
          setCart(dbItems);
        }
      } catch {
        setCart(dbItems);
      }
    } catch (err) {
      console.error("Cart load error:", err);
      setActionError("Could not connect to the database to load your cart.");
    } finally {
      setCartLoaded(true);
    }
  }

  useEffect(() => {
    loadCart();
  }, []);

  const totalItems = cart.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  async function updateQuantity(foodId, change) {
    const existing = cart.find((item) => item.foodId === foodId);
    if (!existing) return;

    const newQuantity = existing.quantity + change;
    setUpdatingId(foodId);
    setActionError("");

    try {
      if (newQuantity <= 0) {
        // Remove item from database
        const res = await fetch("/api/cart", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ foodId }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to remove item");
        }
      } else {
        // Update item quantity in database
        const res = await fetch("/api/cart", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ foodId, quantity: newQuantity }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to update quantity");
        }
      }

      await loadCart();
    } catch (err) {
      console.error("Update quantity error:", err);
      setActionError(err.message || "Could not update item quantity.");
    } finally {
      setUpdatingId(null);
    }
  }

  async function removeItem(foodId) {
    setUpdatingId(foodId);
    setActionError("");

    try {
      const res = await fetch("/api/cart", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ foodId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to remove item");
      }

      await loadCart();
    } catch (err) {
      console.error("Remove item error:", err);
      setActionError(err.message || "Could not remove item from database.");
    } finally {
      setUpdatingId(null);
    }
  }

  async function clearCart() {
    setActionError("");

    try {
      const res = await fetch("/api/cart", {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to clear cart");
      }

      setCart([]);
    } catch (err) {
      console.error("Clear cart error:", err);
      setActionError(err.message || "Could not clear cart.");
    }
  }

  if (!cartLoaded) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fffaf3]">
        <div className="flex flex-col items-center gap-3">
          <div className="text-4xl animate-bounce">🍔</div>
          <p className="font-semibold text-orange-600">
            Loading your database cart...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#fffaf3] text-gray-900">

      {/* Background decoration */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-32 top-20 h-80 w-80 rounded-full bg-orange-200/30 blur-3xl" />
        <div className="absolute -right-32 top-96 h-96 w-96 rounded-full bg-yellow-200/30 blur-3xl" />
      </div>

      <div className="relative z-10">

        {/* Navbar */}
        <nav className="border-b border-orange-100 bg-white/80 backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">

            <Link href="/home" className="flex items-center gap-2">
              <span className="text-3xl">🍔</span>
              <span className="text-xl font-black sm:text-2xl">
                Campus <span className="text-[#ef6b32]">Crave.</span>
              </span>
            </Link>

            <Link
              href="/home"
              className="rounded-xl border border-orange-200 px-4 py-2.5 text-sm font-bold text-orange-600 transition hover:bg-orange-50"
            >
              ← Continue Shopping
            </Link>
          </div>
        </nav>

        {/* Heading */}
        <section className="mx-auto max-w-7xl px-5 pb-12 pt-12 sm:pt-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-[#ef6b32]">
              YOUR FOOD SELECTION
            </p>

            <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
              Your Cart<span className="text-[#ef6b32]">.</span>
            </h1>

            <p className="mt-3 text-gray-500">
              {totalItems} {totalItems === 1 ? "item" : "items"} selected
              for your next campus break.
            </p>
          </motion.div>

          {/* Action error banner */}
          {actionError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700"
            >
              ⚠️ {actionError}
            </motion.div>
          )}

          {isAuthRequired ? (
            /* Authentication required banner */
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-10 rounded-3xl border border-orange-100 bg-white/90 px-5 py-16 text-center shadow-sm sm:py-20"
            >
              <div className="text-6xl">🔒</div>
              <h2 className="mt-6 text-2xl font-extrabold">
                Sign in to view your cart
              </h2>
              <p className="mx-auto mt-3 max-w-md text-gray-500">
                Your cart is saved securely to your personal student account.
                Please sign in to view and manage your items.
              </p>
              <Link
                href="/"
                className="mt-7 inline-flex rounded-xl bg-[#ef6b32] px-7 py-4 font-bold text-white shadow-lg shadow-orange-200 transition hover:-translate-y-1 hover:bg-orange-600"
              >
                Sign In to Campus Crave →
              </Link>
            </motion.div>
          ) : cart.length === 0 ? (
            /* Empty cart */
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-10 rounded-3xl border border-orange-100 bg-white/90 px-5 py-16 text-center shadow-sm sm:py-20"
            >
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="text-7xl"
              >
                🛒
              </motion.div>

              <h2 className="mt-6 text-2xl font-extrabold">
                Your cart is feeling lonely!
              </h2>

              <p className="mx-auto mt-3 max-w-md text-gray-500">
                Looks like you haven&apos;t added any delicious food yet.
                Explore the menu and find your favourites.
              </p>

              <Link
                href="/home"
                className="mt-7 inline-flex rounded-xl bg-[#ef6b32] px-7 py-4 font-bold text-white shadow-lg shadow-orange-200 transition hover:-translate-y-1 hover:bg-orange-600"
              >
                Explore Menu →
              </Link>
            </motion.div>
          ) : (
            <div className="mt-10 grid items-start gap-8 lg:grid-cols-[1fr_360px]">

              {/* Cart items */}
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-extrabold">
                    Selected Items
                  </h2>

                  <button
                    onClick={clearCart}
                    className="text-sm font-bold text-red-500 transition hover:text-red-700 cursor-pointer"
                  >
                    Clear cart
                  </button>
                </div>

                <AnimatePresence mode="popLayout">
                  {cart.map((item) => (
                    <motion.article
                      layout
                      key={item.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -30, height: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden rounded-2xl border border-orange-100 bg-white/90 p-4 shadow-sm sm:p-5"
                    >
                      <div className="flex items-center gap-4 sm:gap-5">

                        {/* Food image */}
                        <div
                          className={`flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${
                            item.color || "from-orange-100 to-yellow-50"
                          } text-5xl sm:h-28 sm:w-28 sm:text-6xl`}
                        >
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={item.name}
                              className="h-full w-full rounded-2xl object-cover"
                            />
                          ) : (
                            item.emoji || "🍽️"
                          )}
                        </div>

                        {/* Food details */}
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold uppercase tracking-wider text-[#ef6b32]">
                            {item.category}
                          </p>

                          <h3 className="mt-1 truncate text-base font-extrabold sm:text-xl">
                            {item.name}
                          </h3>

                          <p className="mt-1 text-sm text-gray-500">
                            ₹{item.price} per item
                          </p>

                          <button
                            onClick={() => removeItem(item.foodId)}
                            disabled={updatingId === item.foodId}
                            className="mt-2 text-xs font-bold text-red-500 hover:underline disabled:opacity-50 cursor-pointer"
                          >
                            {updatingId === item.foodId ? "Removing..." : "Remove"}
                          </button>
                        </div>

                        {/* Quantity controls */}
                        <div className="flex shrink-0 flex-col items-end gap-3">
                          <p className="text-base font-black sm:text-lg">
                            ₹{item.price * item.quantity}
                          </p>

                          <div className="flex items-center gap-3 rounded-xl border border-orange-100 bg-orange-50/70 p-1.5">
                            <button
                              onClick={() => updateQuantity(item.foodId, -1)}
                              disabled={updatingId === item.foodId}
                              aria-label={`Decrease ${item.name} quantity`}
                              className="flex h-7 w-7 items-center justify-center rounded-lg bg-white font-bold text-orange-600 shadow-sm transition hover:bg-orange-100 disabled:opacity-50 cursor-pointer"
                            >
                              −
                            </button>

                            <span className="min-w-4 text-center text-sm font-extrabold">
                              {updatingId === item.foodId ? "…" : item.quantity}
                            </span>

                            <button
                              onClick={() => updateQuantity(item.foodId, 1)}
                              disabled={updatingId === item.foodId}
                              aria-label={`Increase ${item.name} quantity`}
                              className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#ef6b32] font-bold text-white shadow-sm transition hover:bg-orange-600 disabled:opacity-50 cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.article>
                  ))}
                </AnimatePresence>

                <Link
                  href="/home"
                  className="inline-flex items-center gap-2 py-3 font-bold text-orange-600 hover:underline"
                >
                  <span>←</span> Add more food
                </Link>
              </section>

              {/* Order summary */}
              <motion.aside
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.15 }}
                className="rounded-3xl border border-orange-100 bg-white/95 p-6 shadow-lg shadow-orange-100/50 lg:sticky lg:top-6"
              >
                <h2 className="text-xl font-extrabold">
                  Order Summary
                </h2>

                <div className="mt-6 space-y-4 text-sm">
                  <div className="flex justify-between gap-3 text-gray-600">
                    <span>Items ({totalItems})</span>
                    <span className="font-semibold text-gray-900">
                      ₹{subtotal}
                    </span>
                  </div>

                  <div className="flex justify-between gap-3 text-gray-600">
                    <span>Pickup / delivery fee</span>
                    <span className="font-semibold text-green-600">
                      Free
                    </span>
                  </div>

                  <div className="border-t border-dashed border-orange-200 pt-4">
                    <div className="flex justify-between gap-3">
                      <span className="font-extrabold">Total</span>
                      <span className="text-2xl font-black text-[#ef6b32]">
                        ₹{subtotal}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 rounded-2xl bg-orange-50 p-4">
                  <p className="text-sm font-bold text-orange-800">
                    🎓 Made for campus life
                  </p>
                  <p className="mt-1 text-xs leading-5 text-orange-700">
                    Order your favourites and collect them from your
                    campus canteen.
                  </p>
                </div>

                <Link
                  href="/checkout"
                  className="mt-6 block w-full rounded-xl bg-gradient-to-r from-[#ef6b32] to-orange-500 py-4 text-center font-extrabold text-white shadow-lg shadow-orange-200 transition hover:-translate-y-0.5 hover:shadow-xl"
                >
                  Proceed to Checkout →
                </Link>

                <p className="mt-4 text-center text-xs text-gray-400">
                  Database-verified secure checkout.
                </p>
              </motion.aside>
            </div>
          )}
        </section>

        {/* Footer */}
        <footer className="mt-10 border-t border-orange-100 bg-white/70">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-5 py-7 text-center sm:flex-row">
            <p className="font-black">
              🍔 Campus <span className="text-[#ef6b32]">Crave.</span>
            </p>
            <p className="text-xs text-gray-500">
              Good food. Less waiting. © 2026 Campus Crave
            </p>
          </div>
        </footer>
      </div>
    </main>
  );
}
