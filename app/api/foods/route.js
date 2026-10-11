
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET: Fetch all available food items
export async function GET() {
  try {
    const foods = await prisma.food.findMany({
      where: { available: true },
      include: { category: true },
      orderBy: { id: "desc" },
    });

    return NextResponse.json(foods, { status: 200 });
  } catch (error) {
    console.error("Fetch foods error:", error);

    return NextResponse.json(
      { error: "Failed to fetch food items" },
      { status: 500 }
    );
  }
}

// POST: Add a new food item
export async function POST(request) {
  try {
    const body = await request.json();

    const { name, description, price, image, categoryId } = body;

    if (
      typeof name !== "string" ||
      !name.trim() ||
      price === undefined ||
      !Number.isFinite(Number(price)) ||
      Number(price) <= 0 ||
      !Number.isInteger(Number(categoryId)) ||
      Number(categoryId) <= 0
    ) {
      return NextResponse.json(
        { error: "Valid name, positive price, and categoryId are required" },
        { status: 400 }
      );
    }

    const food = await prisma.food.create({
      data: {
        name: name.trim(),
        description: description || null,
        price: String(price),
        image: image || null,
        categoryId: Number(categoryId),
      },
      include: { category: true },
    });

    return NextResponse.json(food, { status: 201 });
  } catch (error) {
    console.error("Create food error:", error);

    return NextResponse.json(
      { error: "Failed to create food item" },
      { status: 500 }
    );
  }
}
