import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const initialCategories = [
  "Breakfast",
  "Snacks",
  "Meals",
  "Beverages",
  "Desserts",
];

const initialFoods = [
  {
    name: "Veg Sandwich",
    category: "Snacks",
    price: 50.0,
    description: "Freshly toasted vegetable sandwich with mint chutney and spices.",
    available: true,
  },
  {
    name: "Masala Dosa",
    category: "Breakfast",
    price: 60.0,
    description: "Crispy golden crepe with spiced potato filling, served with sambar and chutney.",
    available: true,
  },
  {
    name: "Veg Burger",
    category: "Snacks",
    price: 70.0,
    description: "Crispy spiced vegetable patty topped with fresh veggies and tangy sauce.",
    available: true,
  },
  {
    name: "Cold Coffee",
    category: "Beverages",
    price: 45.0,
    description: "Chilled brewed coffee blended with rich milk and chocolate drizzle.",
    available: true,
  },
  {
    name: "Veg Thali",
    category: "Meals",
    price: 100.0,
    description: "Wholesome campus meal with seasonal curry, dal, rice, rotis, and salad.",
    available: true,
  },
  {
    name: "Chocolate Cake",
    category: "Desserts",
    price: 80.0,
    description: "Rich, decadent chocolate sponge cake layered with creamy chocolate ganache.",
    available: true,
  },
];

async function main() {
  console.log("🌱 Starting Campus Crave database seeding...");

  // 1. Upsert categories (idempotent, won't duplicate)
  const categoryMap = new Map();
  for (const catName of initialCategories) {
    const category = await prisma.category.upsert({
      where: { name: catName },
      update: {},
      create: { name: catName },
    });
    categoryMap.set(catName, category.id);
    console.log(`✓ Category ensured: ${catName} (ID: ${category.id})`);
  }

  // 2. Upsert food items (idempotent, safe on multiple runs)
  for (const item of initialFoods) {
    const categoryId = categoryMap.get(item.category);
    if (!categoryId) {
      console.warn(`⚠️ Category not found for food item: ${item.name}`);
      continue;
    }

    const existing = await prisma.food.findFirst({
      where: { name: item.name },
    });

    if (existing) {
      await prisma.food.update({
        where: { id: existing.id },
        data: {
          description: item.description,
          price: item.price,
          available: item.available,
          categoryId: categoryId,
        },
      });
      console.log(`✓ Updated existing food: ${item.name} (₹${item.price})`);
    } else {
      const created = await prisma.food.create({
        data: {
          name: item.name,
          description: item.description,
          price: item.price,
          available: item.available,
          categoryId: categoryId,
        },
      });
      console.log(`✓ Created new food: ${item.name} (₹${item.price}, ID: ${created.id})`);
    }
  }

  console.log("✨ Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
