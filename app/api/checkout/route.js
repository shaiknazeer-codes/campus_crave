import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth";

// POST /api/checkout — Place order from the current database cart
export async function POST(request) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json(
        { error: "Please log in to complete your order." },
        { status: 401 }
      );
    }

    let body = {};
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    const { name, email, phone, pickupNote } = body;

    if (phone && !/^[6-9]\d{9}$/.test(String(phone).trim())) {
      return NextResponse.json(
        { error: "Please provide a valid 10-digit Indian mobile number." },
        { status: 400 }
      );
    }

    // 1. Fetch current user cart from database
    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: { food: true },
          orderBy: { id: "asc" },
        },
      },
    });

    if (!cart || !cart.items || cart.items.length === 0) {
      return NextResponse.json(
        { error: "Your cart is empty. Please add items before checkout." },
        { status: 400 }
      );
    }

    // 2. Validate availability and recalculate total securely using database prices
    let calculatedTotal = 0;
    for (const item of cart.items) {
      if (!item.food) {
        return NextResponse.json(
          { error: "One or more food items no longer exist." },
          { status: 400 }
        );
      }

      if (!item.food.available) {
        return NextResponse.json(
          {
            error: `"${item.food.name}" is currently unavailable. Please remove it from your cart.`,
          },
          { status: 400 }
        );
      }

      if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
        return NextResponse.json(
          { error: `Invalid quantity for "${item.food.name}".` },
          { status: 400 }
        );
      }

      const itemPrice = Number(item.food.price);
      calculatedTotal += itemPrice * item.quantity;
    }

    // 3. Execute order creation and cart clearing atomically in a Prisma transaction
    const order = await prisma.$transaction(async (tx) => {
      const createdOrder = await tx.order.create({
        data: {
          userId,
          total: calculatedTotal.toFixed(2),
          status: "PENDING",
          items: {
            create: cart.items.map((item) => ({
              foodId: item.foodId,
              quantity: item.quantity,
              price: item.food.price,
            })),
          },
        },
        include: {
          items: {
            include: { food: true },
          },
        },
      });

      // Clear the user's cart items only after order is created in this transaction
      await tx.cartItem.deleteMany({
        where: { cartId: cart.id },
      });

      return createdOrder;
    });

    return NextResponse.json(
      {
        ok: true,
        orderId: order.id,
        total: order.total,
        status: order.status,
        itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
        message: "Order placed successfully! Canteen is preparing your food.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Failed to place order. Please try again." },
      { status: 500 }
    );
  }
}
