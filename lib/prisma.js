
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis;

const prisma =
  (globalForPrisma.prisma && globalForPrisma.prisma.cart && globalForPrisma.prisma.account)
    ? globalForPrisma.prisma
    : new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
