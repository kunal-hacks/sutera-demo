import { Router } from "express";
import { prisma } from "../lib/prisma";

export const productsRouter = Router();

// GET /api/products — active products for shop/home grids
productsRouter.get("/", async (req, res) => {
  const products = await prisma.product.findMany({
    where: { status: "ACTIVE" },
    include: { images: { orderBy: { position: "asc" }, take: 1 } },
    orderBy: { createdAt: "asc" },
  });

  res.json(
    products.map((p) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      shortDescription: p.shortDescription,
      price: p.price,
      mrp: p.mrp,
      rating: p.rating,
      reviewCount: p.reviewCount,
      stock: p.stock,
      image: p.images[0]?.url ?? null,
    }))
  );
});

// GET /api/products/:slug — full product detail
productsRouter.get("/:slug", async (req, res) => {
  const product = await prisma.product.findUnique({
    where: { slug: req.params.slug },
    include: {
      images: { orderBy: { position: "asc" } },
      benefits: { orderBy: { position: "asc" } },
      faqs: { orderBy: { position: "asc" } },
      reviews: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!product || product.status !== "ACTIVE") {
    return res.status(404).json({ error: "Product not found." });
  }

  res.json(product);
});
