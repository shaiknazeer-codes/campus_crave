import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth";

// GET /api/cart — get the authenticated user's cart
export async function GET() {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            food: {
              include: { category: true },
            },
          },
          orderBy: { id: "asc" },
        },
      },
    });

    return NextResponse.json({ items: cart?.items || [] });
  } catch (error) {
    console.error("Get cart error:", error);
    return NextResponse.json(
      { error: "Failed to load cart" },
      { status: 500 }
    );
  }
}

// POST /api/cart — add item to cart (or increase quantity)
// Body: { foodId: number, quantity?: number }
export async function POST(request) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const foodId = Number(body.foodId);
    const quantity = Number(body.quantity) || 1;

    if (!Number.isInteger(foodId) || foodId <= 0) {
      return NextResponse.json(
        { error: "Valid foodId is required" },
        { status: 400 }
      );
    }

    if (!Number.isInteger(quantity) || quantity <= 0) {
      return NextResponse.json(
        { error: "Quantity must be a positive integer" },
        { status: 400 }
      );
    }

    // Verify food exists and is available
    const food = await prisma.food.findUnique({
      where: { id: foodId },
    });

    if (!food) {
      return NextResponse.json(
        { error: "Food item not found" },
        { status: 404 }
      );
    }

    if (!food.available) {
      return NextResponse.json(
        { error: "This food item is currently unavailable" },
        { status: 400 }
      );
    }

    // Get or create cart
    const cart = await prisma.cart.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });

    // Upsert cart item — add quantity if exists, create if not
    const cartItem = await prisma.cartItem.upsert({
      where: {
        cartId_foodId: { cartId: cart.id, foodId },
      },
      create: {
        cartId: cart.id,
        foodId,
        quantity,
      },
      update: {
        quantity: { increment: quantity },
      },
      include: {
        food: { include: { category: true } },
      },
    });

    return NextResponse.json({ item: cartItem }, { status: 200 });
  } catch (error) {
    console.error("Add to cart error:", error);
    return NextResponse.json(
      { error: "Failed to add item to cart" },
      { status: 500 }
    );
  }
}

// PATCH /api/cart — update item quantity
// Body: { foodId: number, quantity: number }
export async function PATCH(request) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const foodId = Number(body.foodId);
    const quantity = Number(body.quantity);

    if (!Number.isInteger(foodId) || foodId <= 0) {
      return NextResponse.json(
        { error: "Valid foodId is required" },
        { status: 400 }
      );
    }

    if (!Number.isInteger(quantity) || quantity < 0) {
      return NextResponse.json(
        { error: "Quantity must be a non-negative integer" },
        { status: 400 }
      );
    }

    const cart = await prisma.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      return NextResponse.json(
        { error: "Cart not found" },
        { status: 404 }
      );
    }

    if (quantity === 0) {
      // Remove item
      await prisma.cartItem.deleteMany({
        where: { cartId: cart.id, foodId },
      });
      return NextResponse.json({ removed: true });
    }

    const cartItem = await prisma.cartItem.update({
      where: {
        cartId_foodId: { cartId: cart.id, foodId },
      },
      data: { quantity },
      include: {
        food: { include: { category: true } },
      },
    });

    return NextResponse.json({ item: cartItem });
  } catch (error) {
    console.error("Update cart error:", error);
    return NextResponse.json(
      { error: "Failed to update cart" },
      { status: 500 }
    );
  }
}

// DELETE /api/cart — remove item or clear entire cart
// Body: { foodId?: number } — if omitted, clears entire cart
export async function DELETE(request) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const cart = await prisma.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      return NextResponse.json({ ok: true });
    }

    let body = {};
    try {
      body = await request.json();
    } catch {
      // No body = clear entire cart
    }

    if (body.foodId) {
      const foodId = Number(body.foodId);
      await prisma.cartItem.deleteMany({
        where: { cartId: cart.id, foodId },
      });
    } else {
      // Clear all items from cart
      await prisma.cartItem.deleteMany({
        where: { cartId: cart.id },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Delete cart error:", error);
    return NextResponse.json(
      { error: "Failed to update cart" },
      { status: 500 }
    );
  }
}
