import { Router } from "express";
import { prisma } from "../lib/prisma";
import { trackOrderSchema, contactFormSchema } from "../lib/validation";

export const trackOrderRouter = Router();

trackOrderRouter.post("/", async (req, res) => {
  const parsed = trackOrderSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Please enter a valid order ID and mobile number." });
  }

  const { orderNumber, phone } = parsed.data;

  const order = await prisma.order.findFirst({
    where: { orderNumber: orderNumber.trim().toUpperCase(), phone },
    include: { items: true, statusHistory: { orderBy: { createdAt: "asc" } } },
  });

  if (!order) {
    return res.status(404).json({
      error: "We couldn't find an order with those details. Please check your order ID and mobile number.",
    });
  }

  res.json({
    orderNumber: order.orderNumber,
    createdAt: order.createdAt,
    customerName: order.customerName,
    address: order.address,
    city: order.city,
    state: order.state,
    pincode: order.pincode,
    paymentStatus: order.paymentStatus,
    paymentMethod: order.paymentMethod,
    orderStatus: order.orderStatus,
    total: order.total,
    items: order.items.map((i) => ({ name: i.productName, image: i.image, price: i.price, quantity: i.quantity })),
    statusHistory: order.statusHistory.map((s) => ({ status: s.status, createdAt: s.createdAt, note: s.note })),
  });
});

export const contactRouter = Router();

contactRouter.post("/", async (req, res) => {
  const parsed = contactFormSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Please check your details and try again." });
  }
  // Demo only — wire this up to an email provider, helpdesk, or CRM later.
  console.log("[contact-form]", parsed.data);
  res.json({ success: true });
});
