import { Router } from "express";
import { prisma } from "../../lib/prisma";
import { orderStatusSchema } from "../../lib/validation";
import { requireAdmin } from "../../middleware/require-admin";
import { notify, NotificationEvent } from "../../lib/notifications";

export const adminOrdersRouter = Router();
adminOrdersRouter.use(requireAdmin);

adminOrdersRouter.get("/", async (req, res) => {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      orderNumber: true,
      customerName: true,
      phone: true,
      total: true,
      paymentStatus: true,
      orderStatus: true,
      paymentMethod: true,
      createdAt: true,
    },
  });
  res.json(orders);
});

adminOrdersRouter.get("/:id", async (req, res) => {
  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    include: { items: true, statusHistory: { orderBy: { createdAt: "asc" } } },
  });
  if (!order) return res.status(404).json({ error: "Order not found." });
  res.json(order);
});

const eventForStatus: Record<string, NotificationEvent["type"] | null> = {
  PENDING: null,
  CONFIRMED: "ORDER_CONFIRMED",
  PROCESSING: "ORDER_PROCESSING",
  SHIPPED: "ORDER_SHIPPED",
  DELIVERED: "ORDER_DELIVERED",
  CANCELLED: "ORDER_CANCELLED",
};

adminOrdersRouter.patch("/:id", async (req, res) => {
  const parsed = orderStatusSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Choose a valid order status." });
  }

  const order = await prisma.order.update({
    where: { id: req.params.id },
    data: {
      orderStatus: parsed.data.status,
      statusHistory: { create: { status: parsed.data.status, note: parsed.data.note } },
    },
  });

  const eventType = eventForStatus[parsed.data.status];
  if (eventType) {
    await notify({ type: eventType, orderNumber: order.orderNumber, phone: order.phone, email: order.email });
  }

  res.json(order);
});
