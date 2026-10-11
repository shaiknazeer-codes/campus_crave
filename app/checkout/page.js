"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

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
    price: Number(item.food?.price || 0),
    quantity: item.quantity,
    category,
    image: item.food?.image || null,
    emoji: emojiByName[item.food?.name] || emojiByCategory[category] || defaultEmoji,
    color: colorByName[item.food?.name] || colorByCategory[category] || defaultColor,
    available: item.food?.available ?? true,
  };
}

export default function CheckoutPage() {
  const [cart, setCart] = useState([]);
  const [cartLoaded, setCartLoaded] = useState(false);
  const [isAuthRequired, setIsAuthRequired] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [orderSuccess, setOrderSuccess] = useState(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    pickupNote: "",
  });

  useEffect(() => {
    async function initCheckout() {
      try {
        // 1. Fetch user cart from database
        const cartRes = await fetch("/api/cart");
        if (cartRes.status === 401) {
          setIsAuthRequired(true);
          setCart([]);
          setCartLoaded(true);
          return;
        }

        if (cartRes.ok) {
          const cartData = await cartRes.json();
          setCart(Array.isArray(cartData.items) ? cartData.items.map(mapCartItem) : []);
        }

        // 2. Fetch authenticated user details to prefill name & email
        const userRes = await fetch("/api/auth/me");
        if (userRes.ok) {
          const userData = await userRes.json();
          if (userData.user) {
            setForm((prev) => ({
              ...prev,
              name: prev.name || userData.user.name || "",
              email: prev.email || userData.user.email || "",
            }));
          }
        }
      } catch (err) {
        console.error("Init checkout error:", err);
      } finally {
        setCartLoaded(true);
      }
    }

    initCheckout();
  }, []);

  const totalItems = cart.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  function handleChange(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
    setErrorMessage("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMessage("");

    if (cart.length === 0) {
      setErrorMessage("Your cart is empty. Please add food first.");
      return;
    }

    if (!/^[6-9]\d{9}$/.test(form.phone.trim())) {
      setErrorMessage("Enter a valid 10-digit Indian mobile number.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          pickupNote: form.pickupNote.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || "Failed to place order. Please try again.");
        return;
      }

      // Order created successfully in database transaction and cart cleared
      setOrderSuccess({
        orderId: data.orderId,
        total: data.total,
        status: data.status,
        itemCount: data.itemCount,
        pickupNote: form.pickupNote.trim(),
      });
      setCart([]);
    } catch (err) {
      console.error("Submit checkout error:", err);
      setErrorMessage("Network error occurred while placing order.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!cartLoaded) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fffaf3]">
        <div className="flex flex-col items-center gap-3">
          <div className="text-4xl animate-bounce">🍔</div>
          <p className="font-semibold text-orange-600">
            Loading secure checkout...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#fffaf3] text-gray-900">
      {/* Background decoration */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <motion.div
          animate={{ x: [0, 35, 0], y: [0, 30, 0] }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute -left-32 top-20 h-80 w-80 rounded-full bg-orange-200/40 blur-3xl"
        />

        <motion.div
          animate={{ x: [0, -35, 0], y: [0, -25, 0] }}
          transition={{
            duration: 14,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute -right-32 top-80 h-96 w-96 rounded-full bg-yellow-200/40 blur-3xl"
        />
      </div>

      <div className="relative z-10">
        {/* Navbar */}
        <nav className="border-b border-orange-100 bg-white/80 backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-5 py-4">
            <Link href="/home" className="flex items-center gap-2">
              <span className="text-3xl">🍔</span>
              <span className="text-xl font-black sm:text-2xl">
                Campus <span className="text-[#ef6b32]">Crave.</span>
              </span>
            </Link>

            <Link
              href="/cart"
              className="rounded-xl border border-orange-200 px-4 py-2.5 text-sm font-bold text-orange-600 transition hover:bg-orange-50"
            >
              ← Back to Cart
            </Link>
          </div>
        </nav>

        <section className="mx-auto max-w-7xl px-5 py-12 sm:py-16">
          {orderSuccess ? (
            /* Order Success State */
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="mx-auto max-w-2xl rounded-3xl border border-orange-100 bg-white p-8 text-center shadow-xl sm:p-12"
            >
              <div className="inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-green-50 text-5xl text-green-600">
                🎉
              </div>

              <h1 className="mt-6 text-3xl font-black sm:text-4xl text-gray-900">
                Order Confirmed!
              </h1>

              <p className="mt-2 text-base text-gray-600">
                Your order has been recorded in our canteen database and sent to the kitchen.
              </p>

              <div className="mt-8 rounded-2xl bg-orange-50/80 p-6 text-left border border-orange-100">
                <div className="flex justify-between items-center pb-3 border-b border-orange-200/60 text-sm">
                  <span className="font-bold text-gray-600">Order ID</span>
                  <span className="font-black text-[#ef6b32] text-base">#{orderSuccess.orderId}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-orange-200/60 text-sm">
                  <span className="font-bold text-gray-600">Total Paid</span>
                  <span className="font-extrabold text-gray-900 text-base">₹{orderSuccess.total}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-orange-200/60 text-sm">
                  <span className="font-bold text-gray-600">Items Ordered</span>
                  <span className="font-semibold text-gray-800">{orderSuccess.itemCount} items</span>
                </div>
                <div className="flex justify-between items-center pt-3 text-sm">
                  <span className="font-bold text-gray-600">Status</span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-800">
                    <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    {orderSuccess.status} (In Kitchen)
                  </span>
                </div>
              </div>

              {orderSuccess.pickupNote && (
                <div className="mt-4 rounded-xl bg-gray-50 p-4 text-left text-xs text-gray-600">
                  <span className="font-bold">Note:</span> {orderSuccess.pickupNote}
                </div>
              )}

              <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/home"
                  className="rounded-xl bg-[#ef6b32] px-8 py-4 font-extrabold text-white shadow-lg shadow-orange-200 transition hover:bg-orange-600"
                >
                  Order More Food →
                </Link>
              </div>
            </motion.div>
          ) : isAuthRequired ? (
            /* Auth Required State */
            <div className="mt-10 rounded-3xl border border-orange-100 bg-white p-10 text-center shadow-sm">
              <div className="text-6xl">🔒</div>
              <h2 className="mt-5 text-2xl font-extrabold">
                Please Sign In to Checkout
              </h2>
              <p className="mt-2 text-gray-500">
                You must be logged in to save and process your order.
              </p>
              <Link
                href="/"
                className="mt-6 inline-flex rounded-xl bg-[#ef6b32] px-6 py-3.5 font-bold text-white transition hover:bg-orange-600"
              >
                Sign In Now →
              </Link>
            </div>
          ) : (
            <>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-[#ef6b32]">
                  ALMOST THERE
                </p>

                <h1 className="mt-3 text-4xl font-black sm:text-5xl">
                  Checkout<span className="text-[#ef6b32]">.</span>
                </h1>

                <p className="mt-3 text-gray-500">
                  Enter your details and get ready for your campus food break.
                </p>
              </motion.div>

              {cart.length === 0 ? (
                <div className="mt-10 rounded-3xl border border-orange-100 bg-white p-10 text-center shadow-sm">
                  <div className="text-6xl">🛒</div>
                  <h2 className="mt-5 text-2xl font-extrabold">
                    Your cart is empty
                  </h2>
                  <p className="mt-2 text-gray-500">
                    Add some delicious food before checking out.
                  </p>

                  <Link
                    href="/home"
                    className="mt-6 inline-flex rounded-xl bg-[#ef6b32] px-6 py-3.5 font-bold text-white transition hover:bg-orange-600"
                  >
                    Explore Menu →
                  </Link>
                </div>
              ) : (
                <div className="mt-10 grid items-start gap-8 lg:grid-cols-[1fr_380px]">
                  {/* Student details form */}
                  <motion.section
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                    className="rounded-3xl border border-orange-100 bg-white/90 p-6 shadow-sm sm:p-8"
                  >
                    <h2 className="text-2xl font-extrabold">
                      Student Details
                    </h2>

                    <p className="mt-2 text-sm text-gray-500">
                      Provide your contact information for your order.
                    </p>

                    <form onSubmit={handleSubmit} className="mt-7 space-y-5">
                      <div>
                        <label
                          htmlFor="name"
                          className="mb-2 block text-sm font-bold text-gray-700"
                        >
                          Full Name
                        </label>

                        <input
                          id="name"
                          name="name"
                          type="text"
                          autoComplete="name"
                          placeholder="Enter your full name"
                          value={form.name}
                          onChange={handleChange}
                          required
                          maxLength={100}
                          className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 outline-none transition focus:border-[#ef6b32] focus:bg-white focus:ring-4 focus:ring-orange-100"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="email"
                          className="mb-2 block text-sm font-bold text-gray-700"
                        >
                          College Email
                        </label>

                        <input
                          id="email"
                          name="email"
                          type="email"
                          autoComplete="email"
                          placeholder="you@college.edu"
                          value={form.email}
                          onChange={handleChange}
                          required
                          maxLength={254}
                          className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 outline-none transition focus:border-[#ef6b32] focus:bg-white focus:ring-4 focus:ring-orange-100"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="phone"
                          className="mb-2 block text-sm font-bold text-gray-700"
                        >
                          Mobile Number
                        </label>

                        <input
                          id="phone"
                          name="phone"
                          type="tel"
                          inputMode="numeric"
                          autoComplete="tel"
                          placeholder="10-digit mobile number"
                          value={form.phone}
                          onChange={handleChange}
                          pattern="[6-9][0-9]{9}"
                          title="Enter a valid 10-digit Indian mobile number"
                          maxLength={10}
                          required
                          className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 outline-none transition focus:border-[#ef6b32] focus:bg-white focus:ring-4 focus:ring-orange-100"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="pickupNote"
                          className="mb-2 block text-sm font-bold text-gray-700"
                        >
                          Pickup Note
                          <span className="ml-2 font-normal text-gray-400">
                            (Optional)
                          </span>
                        </label>

                        <textarea
                          id="pickupNote"
                          name="pickupNote"
                          placeholder="e.g. I'll collect during my lunch break"
                          value={form.pickupNote}
                          onChange={handleChange}
                          maxLength={250}
                          rows={3}
                          className="w-full resize-y rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 outline-none transition focus:border-[#ef6b32] focus:bg-white focus:ring-4 focus:ring-orange-100"
                        />
                      </div>

                      {/* Pickup information */}
                      <div className="rounded-2xl border border-orange-100 bg-orange-50/80 p-4">
                        <div className="flex items-start gap-3">
                          <span className="text-2xl">🎓</span>
                          <div>
                            <p className="font-extrabold text-orange-900">
                              Campus Canteen Pickup
                            </p>
                            <p className="mt-1 text-sm leading-6 text-orange-800">
                              Collect your order directly from the canteen counter.
                              Instant preparation once confirmed.
                            </p>
                          </div>
                        </div>
                      </div>

                      {errorMessage && (
                        <div
                          role="alert"
                          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700"
                        >
                          ⚠️ {errorMessage}
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={submitting}
                        className="w-full rounded-xl bg-gradient-to-r from-[#ef6b32] to-orange-500 py-4 font-extrabold text-white shadow-lg shadow-orange-200/60 transition hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {submitting ? "Placing Order..." : `Place Order · ₹${subtotal} →`}
                      </button>

                      <p className="text-center text-xs leading-5 text-gray-400">
                        🔒 Safe & transactional checkout backed by MySQL & Prisma.
                      </p>
                    </form>
                  </motion.section>

                  {/* Order summary */}
                  <motion.aside
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.15 }}
                    className="rounded-3xl border border-orange-100 bg-white/95 p-6 shadow-lg shadow-orange-100/50 lg:sticky lg:top-6"
                  >
                    <h2 className="text-xl font-extrabold">Order Summary</h2>

                    <p className="mt-2 text-sm text-gray-500">
                      {totalItems} {totalItems === 1 ? "item" : "items"} in your cart
                    </p>

                    <div className="mt-6 space-y-5">
                      {cart.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-3"
                        >
                          <div
                            className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${
                              item.color || "from-orange-100 to-yellow-50"
                            } text-3xl`}
                          >
                            {item.emoji || "🍽️"}
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-extrabold">
                              {item.name}
                            </p>
                            <p className="mt-1 text-xs text-gray-500">
                              ₹{item.price} × {item.quantity}
                            </p>
                          </div>

                          <p className="shrink-0 text-sm font-extrabold">
                            ₹{item.price * item.quantity}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="my-6 border-t border-dashed border-orange-200" />

                    <div className="space-y-4 text-sm">
                      <div className="flex justify-between text-gray-600">
                        <span>Subtotal</span>
                        <span className="font-bold text-gray-900">
                          ₹{subtotal}
                        </span>
                      </div>

                      <div className="flex justify-between text-gray-600">
                        <span>Canteen pickup</span>
                        <span className="font-bold text-green-600">Free</span>
                      </div>

                      <div className="border-t border-orange-100 pt-4">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-base font-extrabold">
                            Total Amount
                          </span>
                          <span className="text-2xl font-black text-[#ef6b32]">
                            ₹{subtotal}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 rounded-2xl bg-orange-50 p-4">
                      <p className="font-bold text-orange-900">
                        ❤️ Thanks for choosing Campus Crave
                      </p>
                      <p className="mt-1 text-xs leading-5 text-orange-800">
                        Good food, less waiting, and more time for campus life.
                      </p>
                    </div>

                    <Link
                      href="/cart"
                      className="mt-5 block text-center text-sm font-bold text-orange-600 hover:underline"
                    >
                      Edit your cart
                    </Link>
                  </motion.aside>
                </div>
              )}
            </>
          )}
        </section>

        <footer className="border-t border-orange-100 bg-white/70">
          <div className="mx-auto max-w-7xl px-5 py-7 text-center text-sm text-gray-500">
            🍔 Campus Crave · Made for campus life
          </div>
        </footer>
      </div>
    </main>
  );
}