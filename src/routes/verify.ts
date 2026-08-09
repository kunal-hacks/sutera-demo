import { Router } from "express";
import { prisma } from "../lib/prisma";
import { verifyRazorpaySignature } from "../lib/razorpay";
import { notify } from "../lib/notifications";

export const verifyRouter = Router();

verifyRouter.post("/", async (req, res) => {
  const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body ?? {};

  if (!orderId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ error: "Missing payment details." });
  }

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || order.razorpayOrderId !== razorpay_order_id) {
    return res.status(404).json({ error: "Order not found." });
  }

  const isValid = verifyRazorpaySignature({
    orderId: razorpay_order_id,
    paymentId: razorpay_payment_id,
    signature: razorpay_signature,
  });

  if (!isValid) {
    await prisma.order.update({ where: { id: order.id }, data: { paymentStatus: "FAILED" } });
    return res.status(400).json({ error: "Payment verification failed." });
  }

  await prisma.order.update({
    where: { id: order.id },
    data: {
      paymentStatus: "PAID",
      orderStatus: "CONFIRMED",
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      statusHistory: { create: { status: "CONFIRMED", note: "Payment verified" } },
    },
  });

  const items = await prisma.orderItem.findMany({ where: { orderId: order.id } });
  await Promise.all(
    items.map((item) =>
      prisma.product.update({ where: { id: item.productId }, data: { stock: { decrement: item.quantity } } })
    )
  );

  await notify({ type: "PAYMENT_SUCCESSFUL", orderNumber: order.orderNumber, phone: order.phone, email: order.email });

  res.json({ success: true, orderNumber: order.orderNumber });
});
