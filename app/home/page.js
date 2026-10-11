
"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Toast from "@/components/Toast";
import ProfileDropdown from "@/components/ProfileDropdown";

const categories = [
    { name: "All Items", emoji: "🍽️" },
    { name: "Breakfast", emoji: "🍳" },
    { name: "Snacks", emoji: "🍟" },
    { name: "Meals", emoji: "🍛" },
    { name: "Beverages", emoji: "🥤" },
    { name: "Desserts", emoji: "🍰" },
];

// Presentation maps — emoji and gradient color by food name, with category fallbacks
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

/** Map an API food object to the shape the UI needs */
function mapFood(item) {
    const category = item.category?.name || "Other";
    return {
        id: item.id,
        name: item.name,
        description: item.description || "",
        price: Number(item.price),
        image: item.image || null,
        category,
        emoji: emojiByName[item.name] || emojiByCategory[category] || defaultEmoji,
        color: colorByName[item.name] || colorByCategory[category] || defaultColor,
    };
}

/** Map a database cart item to the shape the UI components expect */
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

const floatingFoods = [
    { emoji: "🍕", x: "8%", y: "12%", delay: 0 },
    { emoji: "🍟", x: "83%", y: "8%", delay: 1 },
    { emoji: "🥤", x: "88%", y: "65%", delay: 0.5 },
    { emoji: "🍩", x: "5%", y: "72%", delay: 1.5 },
    { emoji: "🍓", x: "72%", y: "85%", delay: 0.8 },
];

export default function HomePage() {
    const router = useRouter();
    const [activeCategory, setActiveCategory] = useState("All Items");
    const [search, setSearch] = useState("");
    const [cart, setCart] = useState([]);
    const [cartLoaded, setCartLoaded] = useState(false);
    const [addingId, setAddingId] = useState(null);
    const [cartFeedback, setCartFeedback] = useState(null);
    const [user, setUser] = useState(null);
    const [toast, setToast] = useState(null);
    const loginFlashCheckedRef = useRef(false);

    const [foods, setFoods] = useState([]);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState(null);

    // Load server-authenticated session & handle one-time login success popup
    useEffect(() => {
        let isMounted = true;

        async function checkAuthAndFlash() {
            let currentUser = null;
            try {
                const res = await fetch("/api/auth/me");
                if (res.ok) {
                    const data = await res.json();
                    currentUser = data.user;
                    if (isMounted) setUser(data.user);
                } else {
                    if (isMounted) setUser(null);
                }
            } catch (err) {
                console.error("Failed to load user:", err);
                if (isMounted) setUser(null);
            }

            // Check if there is a pending one-time flash from a fresh login
            if (typeof window !== "undefined" && !loginFlashCheckedRef.current) {
                // 1. Email & password login flash
                const rawFlash = sessionStorage.getItem("campus_crave_login_flash");
                if (rawFlash) {
                    loginFlashCheckedRef.current = true;
                    sessionStorage.removeItem("campus_crave_login_flash");
                    try {
                        const flash = JSON.parse(rawFlash);
                        const displayName = flash.name || currentUser?.name || "";
                        if (isMounted) {
                            setToast({
                                id: "login-success",
                                type: "success",
                                title: "Login Successful",
                                message: displayName
                                    ? `Welcome back, ${displayName}! Enjoy your campus cravings.`
                                    : "Login successful! Welcome to Campus Crave.",
                                duration: 3500,
                            });
                        }
                    } catch {
                        if (isMounted) {
                            setToast({
                                id: "login-success",
                                type: "success",
                                title: "Login Successful",
                                message: "Login successful! Welcome to Campus Crave.",
                                duration: 3500,
                            });
                        }
                    }
                    return;
                }

                // 2. Google OAuth login callback return
                const isPendingGoogle = sessionStorage.getItem("campus_crave_pending_google_login");
                if (isPendingGoogle) {
                    loginFlashCheckedRef.current = true;
                    sessionStorage.removeItem("campus_crave_pending_google_login");
                    if (currentUser) {
                        const displayName = currentUser.name || "Student";
                        if (isMounted) {
                            setToast({
                                id: "google-login-success",
                                type: "success",
                                title: "Login Successful",
                                message: `Welcome back, ${displayName}! Logged in with Google.`,
                                duration: 3500,
                            });
                        }
                    } else {
                        if (isMounted) {
                            setToast({
                                id: "google-login-failed",
                                type: "error",
                                title: "Authentication Failed",
                                message: "Google sign-in could not be completed. Please try again.",
                                duration: 4000,
                            });
                        }
                    }
                }
            }
        }

        checkAuthAndFlash();

        return () => {
            isMounted = false;
        };
    }, []);

    // Load database cart with safe migration of legacy localStorage items
    async function loadCart() {
        try {
            const res = await fetch("/api/cart");
            if (res.ok) {
                const data = await res.json();
                const dbItems = Array.isArray(data.items) ? data.items.map(mapCartItem) : [];

                // Safe one-time migration of legacy localStorage cart if present
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
            } else if (res.status === 401) {
                setCart([]);
            }
        } catch (err) {
            console.error("Failed to load cart:", err);
        } finally {
            setCartLoaded(true);
        }
    }

    useEffect(() => {
        loadCart();
    }, []);

    // Auto-clear feedback notifications
    useEffect(() => {
        if (!cartFeedback) return;
        const timer = setTimeout(() => setCartFeedback(null), 4000);
        return () => clearTimeout(timer);
    }, [cartFeedback]);

    // Fetch menu from the API
    useEffect(() => {
        let cancelled = false;

        async function fetchFoods() {
            try {
                setLoading(true);
                setFetchError(null);

                const res = await fetch("/api/foods");

                if (!res.ok) {
                    throw new Error(`API returned ${res.status}`);
                }

                const data = await res.json();

                if (!cancelled) {
                    setFoods(Array.isArray(data) ? data.map(mapFood) : []);
                }
            } catch (err) {
                if (!cancelled) {
                    console.error("Failed to fetch menu:", err);
                    setFetchError("Could not load the menu. Please try again.");
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        fetchFoods();

        return () => {
            cancelled = true;
        };
    }, []);

    const cartCount = cart.reduce(
        (sum, item) => sum + item.quantity,
        0
    );

    const filteredFoods = foods.filter((food) => {
        const matchesCategory =
            activeCategory === "All Items" ||
            food.category === activeCategory;

        const matchesSearch =
            `${food.name} ${food.category}`
                .toLowerCase()
                .includes(search.toLowerCase());

        return matchesCategory && matchesSearch;
    });

    async function addToCart(food) {
        try {
            setAddingId(food.id);
            setCartFeedback(null);

            const res = await fetch("/api/cart", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ foodId: food.id, quantity: 1 }),
            });

            if (res.status === 401) {
                setCartFeedback({
                    type: "auth",
                    message: "Please sign in to add items to your cart.",
                });
                return;
            }

            const data = await res.json();

            if (!res.ok) {
                setCartFeedback({
                    type: "error",
                    message: data.error || "Failed to add item to cart.",
                });
                return;
            }

            // Refresh saved cart from database
            await loadCart();
            setCartFeedback({
                type: "success",
                message: `Added ${food.name} to your cart!`,
            });
        } catch (err) {
            console.error("Add to cart error:", err);
            setCartFeedback({
                type: "error",
                message: "Could not add item. Please try again.",
            });
        } finally {
            setAddingId(null);
        }
    }

    async function handleSignOut(e) {
        if (e && e.preventDefault) e.preventDefault();
        try {
            await fetch("/api/auth/logout", { method: "POST" });
            const { signOut } = await import("next-auth/react");
            await signOut({ redirect: false });
        } catch (err) {
            console.error("Logout error:", err);
        }
        setUser(null);
        setCart([]);
        setToast({
            id: "logout-toast",
            type: "success",
            title: "Signed Out",
            message: "You have been logged out. See you soon!",
            duration: 3000,
        });
    }

    const scrollToMenu = () => {
        document.getElementById("menu")?.scrollIntoView({
            behavior: "smooth",
        });
    };

    return (
        <main className="min-h-screen overflow-hidden bg-[#fffaf3] text-gray-900">
            {/* Professional Toast Popup */}
            <Toast toast={toast} onDismiss={() => setToast(null)} />

            {/* Animated background */}
            <div className="pointer-events-none fixed inset-0 -z-0 overflow-hidden">
                <motion.div
                    className="absolute -left-40 -top-32 h-96 w-96 rounded-full bg-orange-300/30 blur-3xl"
                    animate={{
                        x: [0, 70, 0],
                        y: [0, 60, 0],
                        scale: [1, 1.2, 1],
                    }}
                    transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
                />

                <motion.div
                    className="absolute -right-40 top-1/3 h-[30rem] w-[30rem] rounded-full bg-yellow-200/40 blur-3xl"
                    animate={{
                        x: [0, -80, 0],
                        y: [0, 70, 0],
                    }}
                    transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
                />

                <motion.div
                    className="absolute -bottom-48 left-1/3 h-96 w-96 rounded-full bg-rose-200/30 blur-3xl"
                    animate={{ x: [0, 80, 0], scale: [1, 1.15, 1] }}
                    transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
                />
            </div>

            {/* Keep page content above the background */}
            <div className="relative z-10">

                {/* Navbar */}
                <nav className="sticky top-0 z-30 border-b border-orange-100/70 bg-white/80 backdrop-blur-xl">
                    <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 sm:gap-4 px-3.5 sm:px-6 lg:px-8 py-3 sm:py-4">

                        <Link href="/home" className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                            <motion.span
                                className="text-2xl sm:text-3xl"
                                whileHover={{ rotate: [-10, 10, 0], scale: 1.15 }}
                            >
                                🍔
                            </motion.span>

                            <span className="text-base sm:text-xl md:text-2xl font-black tracking-tight">
                                Campus <span className="text-[#ef6b32]">Crave.</span>
                            </span>
                        </Link>

                        <div className="hidden gap-6 text-sm font-semibold md:flex">
                            <a href="#menu" className="transition hover:text-[#ef6b32]">
                                Menu
                            </a>
                            <a href="#popular" className="transition hover:text-[#ef6b32]">
                                Popular
                            </a>
                        </div>

                        <div className="flex items-center gap-2 sm:gap-3">
                            <Link
                                href="/cart"
                                aria-label="Shopping Cart"
                                className="rounded-xl bg-[#ef6b32] px-3 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm font-bold text-white shadow-md sm:shadow-lg shadow-orange-200/60 transition hover:bg-orange-600 flex items-center gap-1.5 shrink-0"
                            >
                                <span>🛒</span>
                                <span><span className="hidden xs:inline">Cart </span>({cartCount})</span>
                            </Link> 

                            {user ? (
                                <ProfileDropdown user={user} onSignOut={handleSignOut} />
                            ) : (
                                <div className="flex items-center gap-1.5 sm:gap-2">
                                    <Link
                                        href="/"
                                        className="rounded-xl border border-orange-200/90 bg-white/90 px-3 py-2 text-xs sm:text-sm font-bold text-orange-600 transition hover:bg-orange-50"
                                    >
                                        Sign In
                                    </Link>
                                    <Link
                                        href="/register"
                                        className="hidden sm:inline-flex rounded-xl bg-gradient-to-r from-[#ef6b32] to-[#dc5218] px-3.5 py-2 text-xs sm:text-sm font-bold text-white shadow-sm transition hover:opacity-95"
                                    >
                                        Register
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </nav>

                {/* Hero */}
                <section className="relative mx-auto grid max-w-7xl items-center gap-8 md:gap-10 px-4 sm:px-6 lg:px-8 py-10 sm:py-16 md:py-20 md:grid-cols-2 overflow-hidden sm:overflow-visible">

                    {/* Floating food decorations */}
                    {floatingFoods.map((food) => (
                        <motion.div
                            key={food.emoji}
                            className="pointer-events-none absolute hidden text-3xl opacity-70 sm:block md:text-4xl"
                            style={{ left: food.x, top: food.y }}
                            animate={{
                                y: [0, -18, 0],
                                rotate: [0, 8, -8, 0],
                            }}
                            transition={{
                                duration: 4 + food.delay,
                                delay: food.delay,
                                repeat: Infinity,
                                ease: "easeInOut",
                            }}
                        >
                            {food.emoji}
                        </motion.div>
                    ))}

                    <motion.div
                        initial={{ opacity: 0, x: -45 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="relative z-10 text-center md:text-left"
                    >
                        <motion.span
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="inline-flex rounded-full border border-orange-200 bg-white/80 px-3.5 py-1.5 text-xs sm:text-sm font-bold text-orange-700 shadow-sm"
                        >
                            ✨ YOUR CAMPUS FOOD DESTINATION
                        </motion.span>

                        <h1 className="mt-4 sm:mt-6 text-3xl sm:text-5xl lg:text-6xl font-black leading-[1.15] tracking-tight">
                            Hungry between
                            <br className="hidden sm:inline" /> classes?
                            <br />
                            <span className="bg-gradient-to-r from-[#ef6b32] via-orange-500 to-amber-500 bg-clip-text text-transparent">
                                We got you.
                            </span>
                        </h1>

                        <p className="mt-4 sm:mt-5 max-w-lg mx-auto md:mx-0 text-sm leading-6 text-gray-600 sm:text-base sm:leading-7">
                            Your favourite canteen food, just a few clicks away.
                            Order ahead, skip the queue, and make every campus
                            break delicious.
                        </p>

                        <div className="mt-6 sm:mt-8 flex flex-wrap justify-center md:justify-start gap-4">
                            <motion.button
                                whileHover={{
                                    scale: 1.05,
                                    boxShadow: "0px 15px 35px rgba(239,107,50,0.3)",
                                }}
                                whileTap={{ scale: 0.96 }}
                                onClick={scrollToMenu}
                                className="w-full sm:w-auto rounded-2xl bg-gradient-to-r from-[#ef6b32] to-orange-500 px-7 py-3.5 sm:py-4 font-bold text-white shadow-xl shadow-orange-200/60 cursor-pointer"
                            >
                                Explore Menu <span className="ml-2">→</span>
                            </motion.button>
                        </div>

                        <div className="mt-7 sm:mt-9 flex flex-wrap justify-center md:justify-start gap-x-5 gap-y-2 text-xs sm:text-sm font-medium text-gray-600">
                            <span>⚡ Quick ordering</span>
                            <span>🍽️ Canteen favourites</span>
                            <span>🎓 Made for students</span>
                        </div>
                    </motion.div>

                    {/* Animated hero artwork */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.75, rotate: 8 }}
                        animate={{ opacity: 1, scale: 1, rotate: 0 }}
                        transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
                        className="relative mx-auto flex min-h-64 sm:min-h-80 w-full max-w-sm sm:max-w-lg items-center justify-center sm:min-h-[440px]"
                    >
                        <motion.div
                            className="absolute h-48 w-48 sm:h-72 sm:w-72 md:h-80 md:w-80 rounded-full bg-gradient-to-br from-orange-200 via-amber-100 to-rose-200"
                            animate={{ scale: [1, 1.08, 1], rotate: [0, 8, 0] }}
                            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
                        />

                        <motion.div
                            className="absolute h-56 w-56 sm:h-80 sm:w-80 md:h-[23rem] md:w-[23rem] rounded-full border border-dashed border-orange-300/70"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 35, repeat: Infinity, ease: "linear" }}
                        />

                        <motion.div
                            whileHover={{ rotate: 5, scale: 1.06 }}
                            animate={{ y: [0, -10, 0] }}
                            transition={{
                                y: { duration: 4, repeat: Infinity, ease: "easeInOut" },
                            }}
                            className="relative flex h-40 w-40 sm:h-56 sm:w-56 md:h-64 md:w-64 items-center justify-center rounded-[2rem] sm:rounded-[2.5rem] border-4 sm:border-8 border-white/90 bg-gradient-to-br from-orange-100 to-yellow-50 text-[6rem] sm:text-[8rem] md:text-[10rem] shadow-[0_20px_50px_rgba(190,80,20,0.16)]"
                        >
                            🍔
                        </motion.div>

                        <motion.div
                            animate={{ y: [0, -6, 0], rotate: [0, 2, 0] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute bottom-2 left-2 sm:bottom-8 sm:left-0 rounded-xl sm:rounded-2xl border border-white bg-white/90 p-3 sm:p-4 shadow-lg sm:shadow-xl backdrop-blur"
                        >
                            <p className="text-xs sm:text-sm font-extrabold">Made for your breaks ❤️</p>
                            <p className="mt-0.5 text-[10px] sm:text-xs text-gray-500">
                                Good food, happy students
                            </p>
                        </motion.div>

                        <motion.div
                            animate={{ y: [0, 7, 0], rotate: [0, -3, 0] }}
                            transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute right-2 top-4 sm:right-1 sm:top-10 rounded-xl sm:rounded-2xl border border-white bg-white/90 px-3 py-2 sm:px-4 sm:py-3 shadow-lg sm:shadow-xl backdrop-blur"
                        >
                            <p className="text-xs sm:text-sm font-extrabold">Cravings = Solved!</p>
                            <p className="mt-0.5 text-[10px] sm:text-xs text-orange-600">
                                Your campus, your food
                            </p>
                        </motion.div>
                    </motion.div>
                </section>

                {/* Menu */}
                <section
                    id="menu"
                    className="mx-auto max-w-7xl scroll-mt-20 sm:scroll-mt-24 px-4 sm:px-6 lg:px-8 py-10 sm:py-16"
                >
                    <motion.div
                        id="popular"
                        initial={{ opacity: 0, y: 25 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.3 }}
                        transition={{ duration: 0.6 }}
                        className="mb-6 sm:mb-9"
                    >
                        <p className="text-xs sm:text-sm font-extrabold uppercase tracking-[0.2em] text-[#ef6b32]">
                            EXPLORE THE CANTEEN
                        </p>

                        <h2 className="mt-2 sm:mt-3 text-2xl sm:text-4xl md:text-5xl font-black tracking-tight">
                            What are you{" "}
                            <span className="text-[#ef6b32]">craving?</span>
                        </h2>

                        <p className="mt-2 sm:mt-3 text-xs sm:text-base text-gray-600">
                            Discover something delicious for your next campus break.
                        </p>
                    </motion.div>

                    {/* Search */}
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="mb-5 sm:mb-7"
                    >
                        <input
                            type="search"
                            placeholder="🔍  Search food or category..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full rounded-2xl border border-orange-100 bg-white/80 px-4 py-3 sm:px-5 sm:py-4 text-base sm:text-sm shadow-sm outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100 sm:max-w-md"
                        />
                    </motion.div>

                    {/* Categories Horizontal Scroller */}
                    <div className="mb-7 sm:mb-9 flex gap-2 sm:gap-3 overflow-x-auto pb-2 sm:pb-3 no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
                        {categories.map((category) => (
                            <motion.button
                                key={category.name}
                                whileTap={{ scale: 0.94 }}
                                onClick={() => setActiveCategory(category.name)}
                                className={`shrink-0 rounded-xl px-4 py-2.5 sm:px-5 sm:py-3 text-xs sm:text-sm font-bold transition-all duration-300 cursor-pointer whitespace-nowrap ${activeCategory === category.name
                                        ? "bg-gradient-to-r from-[#ef6b32] to-orange-500 text-white shadow-md sm:shadow-lg shadow-orange-200"
                                        : "border border-orange-100 bg-white/80 text-gray-600 hover:border-orange-300 hover:bg-orange-50"
                                    }`}
                            >
                                {category.emoji} {category.name}
                            </motion.button>
                        ))}
                    </div>

                    {/* Food cards */}
                    {loading && (
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {[1, 2, 3, 4, 5, 6].map((n) => (
                                <div
                                    key={n}
                                    className="animate-pulse overflow-hidden rounded-3xl border border-orange-100/80 bg-white/85"
                                >
                                    <div className="h-52 bg-gradient-to-br from-orange-50 to-amber-50" />
                                    <div className="p-5 space-y-3">
                                        <div className="h-5 w-2/3 rounded-lg bg-orange-100" />
                                        <div className="h-4 w-full rounded-lg bg-orange-50" />
                                        <div className="h-11 w-full rounded-xl bg-orange-50 mt-4" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {fetchError && !loading && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="rounded-3xl border border-red-100 bg-red-50/80 p-12 text-center"
                        >
                            <span className="text-5xl">⚠️</span>
                            <h3 className="mt-4 text-2xl font-extrabold text-red-700">
                                Something went wrong
                            </h3>
                            <p className="mt-2 text-red-600">
                                {fetchError}
                            </p>
                            <button
                                onClick={() => window.location.reload()}
                                className="mt-5 font-bold text-orange-600 hover:underline"
                            >
                                Reload page
                            </button>
                        </motion.div>
                    )}

                    {!loading && !fetchError && (
                        <>
                            <motion.div
                                layout
                                className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                            >
                                {filteredFoods.map((food, index) => (
                                    <motion.article
                                        layout
                                        key={food.id}
                                        initial={{ opacity: 0, y: 35 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true, amount: 0.15 }}
                                        transition={{
                                             duration: 0.45,
                                             delay: index * 0.08,
                                        }}
                                        whileHover={{ y: -6 }}
                                        className="group overflow-hidden rounded-2xl sm:rounded-3xl border border-orange-100/80 bg-white/85 shadow-sm backdrop-blur-sm transition-shadow duration-300 hover:shadow-xl hover:shadow-orange-100 flex flex-col justify-between"
                                    >
                                        <div
                                            className={`relative flex h-40 sm:h-52 items-center justify-center overflow-hidden bg-gradient-to-br ${food.color}`}
                                        >
                                            <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/40 blur-2xl" />

                                            {food.image ? (
                                                <img
                                                    src={food.image}
                                                    alt={food.name}
                                                    className="relative h-full w-full object-cover"
                                                />
                                            ) : (
                                                <motion.span
                                                    whileHover={{ scale: 1.2, rotate: 8 }}
                                                    transition={{ type: "spring", stiffness: 250 }}
                                                    className="relative text-7xl sm:text-8xl drop-shadow-md select-none"
                                                >
                                                    {food.emoji}
                                                </motion.span>
                                            )}

                                            <span className="absolute left-3.5 top-3.5 rounded-full border border-white/70 bg-white/85 px-2.5 py-0.5 sm:px-3 sm:py-1 text-[11px] sm:text-xs font-bold text-orange-700 backdrop-blur shadow-xs">
                                                {food.category}
                                            </span>
                                        </div>

                                        <div className="p-4 sm:p-5 flex flex-col flex-1 justify-between">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0 flex-1">
                                                    <h3 className="text-lg sm:text-xl font-extrabold transition-colors group-hover:text-[#ef6b32] truncate">
                                                        {food.name}
                                                    </h3>
                                                    <p className="mt-1 sm:mt-1.5 text-xs sm:text-sm leading-relaxed text-gray-500 line-clamp-2">
                                                        {food.description}
                                                    </p>
                                                </div>

                                                <span className="shrink-0 rounded-xl bg-orange-50 px-2.5 py-1.5 sm:px-3 sm:py-2 text-base sm:text-lg font-black text-[#ef6b32]">
                                                    ₹{food.price}
                                                </span>
                                            </div>

                                            <motion.button
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.97 }}
                                                onClick={() => addToCart(food)}
                                                disabled={addingId === food.id}
                                                className="mt-4 sm:mt-6 w-full rounded-xl border border-orange-200 bg-orange-50/70 py-3 sm:py-3.5 text-sm sm:text-base font-bold text-[#e9602b] transition-colors hover:border-[#ef6b32] hover:bg-[#ef6b32] hover:text-white disabled:opacity-60 disabled:cursor-wait min-h-[44px] cursor-pointer"
                                            >
                                                {addingId === food.id ? "Saving to cart..." : "+ Add to Cart"}
                                            </motion.button>
                                        </div>
                                    </motion.article>
                                ))}
                            </motion.div>

                            {filteredFoods.length === 0 && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="rounded-3xl border border-orange-100 bg-white/80 p-8 sm:p-12 text-center"
                                >
                                    <span className="text-4xl sm:text-5xl">🔎</span>
                                    <h3 className="mt-3 sm:mt-4 text-xl sm:text-2xl font-extrabold">
                                        No food found
                                    </h3>
                                    <p className="mt-1.5 text-xs sm:text-sm text-gray-500">
                                        Try another food name or select a different category.
                                    </p>
                                    <button
                                        onClick={() => {
                                            setSearch("");
                                            setActiveCategory("All Items");
                                        }}
                                        className="mt-4 font-bold text-orange-600 hover:underline text-sm cursor-pointer"
                                    >
                                        Clear filters
                                    </button>
                                </motion.div>
                            )}
                        </>
                    )}
                </section>

                {/* Animated call-to-action */}
                <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-12 sm:pb-16">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="relative overflow-hidden rounded-2xl sm:rounded-[2rem] bg-gradient-to-r from-orange-500 via-[#ef6b32] to-rose-500 p-6 sm:p-10 lg:p-12 text-white shadow-xl"
                    >
                        <motion.div
                            className="absolute -right-16 -top-24 h-72 w-72 rounded-full border-[35px] border-white/10"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                        />

                        <div className="relative z-10 max-w-2xl">
                            <p className="text-xs sm:text-sm font-bold uppercase tracking-[0.2em] text-orange-100">
                                YOUR NEXT BREAK STARTS HERE
                            </p>
                            <h2 className="mt-2.5 sm:mt-4 text-2xl sm:text-4xl font-black">
                                Good food. Great mood. ❤️
                            </h2>
                            <p className="mt-2 sm:mt-3 text-sm sm:text-base leading-relaxed text-orange-50">
                                Find your favourite food and make your campus break count.
                            </p>

                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.96 }}
                                onClick={scrollToMenu}
                                className="mt-5 sm:mt-7 rounded-xl bg-white px-5 sm:px-6 py-3 sm:py-3.5 text-sm sm:text-base font-extrabold text-orange-600 shadow-lg cursor-pointer"
                            >
                                Order your favourites →
                            </motion.button>
                        </div>
                    </motion.div>
                </section>

                {/* Footer */}
                <footer className="border-t border-orange-100/80 bg-white/70 backdrop-blur-lg">
                    <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 sm:px-6 lg:px-8 py-6 sm:py-8 text-center sm:flex-row sm:text-left">
                        <p className="text-base sm:text-lg font-black">
                            🍔 Campus <span className="text-[#ef6b32]">Crave.</span>
                        </p>
                        <p className="text-xs sm:text-sm text-gray-500">
                            Made with ❤️ for campus life · © 2026 Campus Crave
                        </p>
                    </div>
                </footer>
            </div>

            {/* Notification Toast */}
            <AnimatePresence>
                {cartFeedback && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.9 }}
                        className={`fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 sm:max-w-md z-50 flex items-center gap-3 rounded-2xl px-4 py-3.5 sm:px-5 sm:py-4 shadow-2xl backdrop-blur-lg border ${
                            cartFeedback.type === "success"
                                ? "bg-green-600/95 text-white border-green-500"
                                : cartFeedback.type === "auth"
                                ? "bg-orange-600/95 text-white border-orange-500"
                                : "bg-red-600/95 text-white border-red-500"
                        }`}
                    >
                        <span className="text-lg sm:text-xl shrink-0">
                            {cartFeedback.type === "success" ? "✓" : cartFeedback.type === "auth" ? "🔒" : "⚠️"}
                        </span>
                        <div className="text-xs sm:text-sm font-bold flex-1">
                            {cartFeedback.message}
                            {cartFeedback.type === "auth" && (
                                <Link href="/" className="ml-2 underline font-extrabold text-yellow-200 hover:text-white">
                                    Sign In →
                                </Link>
                            )}
                        </div>
                        <button
                            onClick={() => setCartFeedback(null)}
                            className="ml-2 rounded-lg bg-white/20 px-2 py-0.5 text-xs font-bold hover:bg-white/30 cursor-pointer"
                        >
                            ✕
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </main>
    );
}
