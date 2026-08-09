import { Router } from "express";
import { prisma } from "../../lib/prisma";
import { productSchema } from "../../lib/validation";
import { requireAdmin } from "../../middleware/require-admin";

export const adminProductsRouter = Router();
adminProductsRouter.use(requireAdmin);

adminProductsRouter.get("/", async (req, res) => {
  const products = await prisma.product.findMany({
    include: { images: { orderBy: { position: "asc" }, take: 1 } },
    orderBy: { createdAt: "desc" },
  });
  res.json(products);
});

adminProductsRouter.get("/:id", async (req, res) => {
  const product = await prisma.product.findUnique({
    where: { id: req.params.id },
    include: { images: { orderBy: { position: "asc" } } },
  });
  if (!product) return res.status(404).json({ error: "Product not found." });
  res.json(product);
});

adminProductsRouter.post("/", async (req, res) => {
  const parsed = productSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Please check the product details.", issues: parsed.error.flatten() });
  }

  const existing = await prisma.product.findUnique({ where: { slug: parsed.data.slug } });
  if (existing) {
    return res.status(409).json({ error: "A product with this slug already exists." });
  }

  const imageUrl: string | undefined = req.body?.imageUrl;

  const product = await prisma.product.create({
    data: {
      ...parsed.data,
      images: imageUrl ? { create: [{ url: imageUrl, alt: parsed.data.name, position: 0 }] } : undefined,
    },
  });

  res.status(201).json(product);
});

adminProductsRouter.patch("/:id", async (req, res) => {
  const parsed = productSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Please check the product details." });
  }

  const product = await prisma.product.update({ where: { id: req.params.id }, data: parsed.data });

  const imageUrl: string | undefined = req.body?.imageUrl;
  if (imageUrl) {
    const existingImage = await prisma.productImage.findFirst({ where: { productId: product.id }, orderBy: { position: "asc" } });
    if (existingImage) {
      await prisma.productImage.update({ where: { id: existingImage.id }, data: { url: imageUrl } });
    } else {
      await prisma.productImage.create({ data: { productId: product.id, url: imageUrl, alt: product.name, position: 0 } });
    }
  }

  res.json(product);
});

adminProductsRouter.delete("/:id", async (req, res) => {
  // Soft-delete via status rather than a hard delete, so historical orders
  // that reference this product remain intact.
  const product = await prisma.product.update({ where: { id: req.params.id }, data: { status: "ARCHIVED" } });
  res.json(product);
});
