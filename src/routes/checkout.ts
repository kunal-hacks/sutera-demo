import { Router } from "express";
import { prisma } from "../lib/prisma";
import { checkoutSchema } from "../lib/validation";
import { generateOrderNumber } from "../lib/order-number";
import { createRazorpayOrder, isRazorpayConfigured } from "../lib/razorpay";
import { notify } from "../lib/notifications";
import { getSiteSettings } from "../lib/site-settings";

export const checkoutRouter = Router();

const FREE_SHIPPING_THRESHOLD_PAISE = 99900;
const STANDARD_SHIPPING_PAISE = 9900;

checkoutRouter.post("/", async (req, res) => {
  const parsed = checkoutSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: "Please check your details and try again.",
      issues: parsed.error.flatten(),
    });
  }

  const data = parsed.data;
  const settings = await getSiteSettings();

  if (data.paymentMethod === "COD" && !settings.codEnabled) {
    return res.status(400).json({ error: "Cash on Delivery is currently unavailable." });
  }

  if (data.paymentMethod === "RAZORPAY" && !isRazorpayConfigured()) {
    return res.status(400).json({
      error:
        "Online payments aren't configured on this demo yet — add real Razorpay TEST keys " +
        "to backend/.env (see README.md) or choose Cash on Delivery to place this order.",
    });
  }

  // Never trust prices/quantities from the client — look them up server-side.
  const productIds = data.items.map((i) => i.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, status: "ACTIVE" },
    include: { images: { take: 1, orderBy: { position: "asc" } } },
  });

  if (products.length !== productIds.length) {
    return res.status(400).json({ error: "One or more items in your cart are no longer available." });
  }

  for (const item of data.items) {
    const product = products.find((p) => p.id === item.productId)!;
    if (product.stock < item.quantity) {
      return res.status(400).json({ error: `${product.name} only has ${product.stock} left in stock.` });
    }
  }

  const subtotal = data.items.reduce((sum, item) => {
    const product = products.find((p) => p.id === item.productId)!;
    return sum + product.price * item.quantity;
  }, 0);

  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD_PAISE ? 0 : STANDARD_SHIPPING_PAISE;
  const total = subtotal + shipping;
  const orderNumber = await generateOrderNumber();

  const order = await prisma.order.create({
    data: {
      orderNumber,
      customerName: data.customerName,
      email: data.email,
      phone: data.phone,
      address: data.address,
      city: data.city,
      state: data.state,
      pincode: data.pincode,
      subtotal,
      shipping,
      total,
      paymentMethod: data.paymentMethod,
      paymentStatus: "PENDING",
      orderStatus: "PENDING",
      items: {
        create: data.items.map((item) => {
          const product = products.find((p) => p.id === item.productId)!;
          return {
            productId: product.id,
            productName: product.name,
            image: product.images[0]?.url,
            price: product.price,
            quantity: item.quantity,
          };
        }),
      },
      statusHistory: { create: { status: "PENDING" } },
    },
  });

  if (data.paymentMethod === "COD") {
    await prisma.order.update({
      where: { id: order.id },
      data: {
        orderStatus: "CONFIRMED",
        statusHistory: { create: { status: "CONFIRMED", note: "Confirmed — Cash on Delivery" } },
      },
    });

    await Promise.all(
      data.items.map((item) =>
        prisma.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        })
      )
    );

    await notify({ type: "ORDER_CONFIRMED", orderNumber, phone: data.phone, email: data.email });
    return res.json({ orderId: order.id, orderNumber, paymentMethod: "COD" });
  }

  // RAZORPAY — create a Razorpay order and hand the client what it needs
  // to open Checkout. Payment success is verified server-side only.
  try {
    const rzpOrder = await createRazorpayOrder(total, orderNumber);
    await prisma.order.update({ where: { id: order.id }, data: { razorpayOrderId: rzpOrder.id } });

    res.json({
      orderId: order.id,
      orderNumber,
      paymentMethod: "RAZORPAY",
      razorpayOrderId: rzpOrder.id,
      amount: total,
      currency: "INR",
      keyId: process.env.RAZORPAY_KEY_ID,
      customer: { name: data.customerName, email: data.email, phone: data.phone },
    });
  } catch {
    res.status(502).json({ error: "We couldn't start the payment. Please try again or use Cash on Delivery." });
  }
});
