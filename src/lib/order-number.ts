import { prisma } from "./prisma";

/** Generates a human-readable, sequential order number like SUT-2026-000001. */
export async function generateOrderNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `SUT-${year}-`;
  const count = await prisma.order.count({ where: { orderNumber: { startsWith: prefix } } });
  return `${prefix}${(count + 1).toString().padStart(6, "0")}`;
}
