import { Router } from "express";
import { prisma } from "../../lib/prisma";
import { requireAdmin } from "../../middleware/require-admin";
import { getSiteSettings } from "../../lib/site-settings";

export const adminDashboardRouter = Router();
adminDashboardRouter.use(requireAdmin);

adminDashboardRouter.get("/", async (req, res) => {
  const [totalSalesAgg, totalOrders, pendingOrders, products, lowStock, recentOrders] = await Promise.all([
    prisma.order.aggregate({ _sum: { total: true }, where: { paymentStatus: "PAID" } }),
    prisma.order.count(),
    prisma.order.count({ where: { orderStatus: { in: ["PENDING", "CONFIRMED"] } } }),
    prisma.product.count(),
    prisma.product.count({ where: { stock: { lt: 10 }, status: "ACTIVE" } }),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        orderNumber: true,
        customerName: true,
        total: true,
        paymentStatus: true,
        orderStatus: true,
        createdAt: true,
      },
    }),
  ]);

  res.json({
    totalSales: totalSalesAgg._sum.total ?? 0,
    totalOrders,
    pendingOrders,
    products,
    lowStock,
    recentOrders,
  });
});

export const adminSettingsRouter = Router();
adminSettingsRouter.use(requireAdmin);

adminSettingsRouter.get("/", async (req, res) => {
  res.json(await getSiteSettings());
});

adminSettingsRouter.patch("/", async (req, res) => {
  const body = req.body ?? {};
  const settings = await prisma.siteSetting.update({
    where: { id: "singleton" },
    data: {
      brandName: body.brandName,
      supportEmail: body.supportEmail,
      supportPhone: body.supportPhone,
      whatsappNumber: body.whatsappNumber,
      shippingCharge: body.shippingCharge,
      freeShippingThreshold: body.freeShippingThreshold,
      codEnabled: body.codEnabled,
      storeOnline: body.storeOnline,
    },
  });
  res.json(settings);
});
