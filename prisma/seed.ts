import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Product photography is served as static SVG illustrations from the
// frontend's /public/illustrations folder — see that project's README for
// how to swap these for real product photography later.
const images = {
  contour: ["/illustrations/product-contour.svg"],
  memoryFoam: ["/illustrations/product-memory-foam.svg"],
  travel: ["/illustrations/product-travel.svg"],
};

const DEMO_ADMIN_EMAIL = "admin@sutera.demo";
const DEMO_ADMIN_PASSWORD = "Sutera@Admin123";
export const DEMO_TRACKING_PHONE = "9876543210";

async function main() {
  console.log("Seeding Sutera demo data...");

  // ---- Site settings ----
  await prisma.siteSetting.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton" },
  });

  // ---- Admin account ----
  const passwordHash = await bcrypt.hash(DEMO_ADMIN_PASSWORD, 12);
  await prisma.admin.upsert({
    where: { email: DEMO_ADMIN_EMAIL },
    update: { passwordHash },
    create: {
      name: "Sutera Admin",
      email: DEMO_ADMIN_EMAIL,
      passwordHash,
    },
  });

  // ---- Category ----
  const category = await prisma.category.upsert({
    where: { slug: "pillows" },
    update: {},
    create: { name: "Pillows", slug: "pillows" },
  });

  // Clean slate for products so re-seeding is idempotent and predictable.
  await prisma.orderItem.deleteMany({});
  await prisma.statusEvent.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.review.deleteMany({});
  await prisma.productFaq.deleteMany({});
  await prisma.productBenefit.deleteMany({});
  await prisma.productImage.deleteMany({});
  await prisma.product.deleteMany({});

  // ---- Product 1: Cervical Contour Pillow ----
  const contour = await prisma.product.create({
    data: {
      slug: "sutera-cervical-contour-pillow",
      name: "Sutera Cervical Contour Pillow",
      shortDescription:
        "An ergonomically contoured pillow designed to provide balanced head and neck support while you sleep.",
      description:
        "The Cervical Contour Pillow is shaped around the natural curve of the neck to help keep your head, neck and shoulders in a more supported alignment through the night. A dual-height contour design means side sleepers and back sleepers can both find a comfortable resting position, while the medium-firm memory foam core slowly adapts to your shape and recovers overnight. Finished with a breathable, removable and washable cover for easy everyday care.",
      price: 149900,
      mrp: 199900,
      stock: 42,
      material: "Contoured memory foam core, knitted breathable fabric cover",
      dimensions: "60 cm x 38 cm x 12/9 cm (dual height)",
      firmness: "Medium-firm",
      sleepPosition: "Back & side sleepers",
      weight: "1.1 kg",
      coverType: "Removable, machine washable",
      status: "ACTIVE",
      rating: 4.8,
      reviewCount: 236,
      categoryId: category.id,
      seoTitle: "Sutera Cervical Contour Pillow — Ergonomic Neck Support",
      seoDescription:
        "Shop the Sutera Cervical Contour Pillow — a dual-height memory foam pillow designed for balanced head and neck support for back and side sleepers.",
      images: {
        create: images.contour.map((url, i) => ({
          url,
          alt: "Sutera Cervical Contour Pillow",
          position: i,
        })),
      },
      benefits: {
        create: [
          { title: "Ergonomic contour", detail: "Dual-height design shaped around the neck's natural curve.", position: 0 },
          { title: "Memory foam support", detail: "Slow-recovery foam that adapts through the night.", position: 1 },
          { title: "Breathable cover", detail: "Removable, washable knitted fabric cover.", position: 2 },
          { title: "For back & side sleepers", detail: "Two contour heights suit both sleeping positions.", position: 3 },
        ],
      },
      faqs: {
        create: [
          { question: "Is this pillow suitable for side sleepers?", answer: "Yes — the higher contour edge is designed to support side sleepers, while the lower centre panel suits back sleepers.", position: 0 },
          { question: "How firm is it?", answer: "Medium-firm. It offers noticeable support while still contouring to your shape.", position: 1 },
          { question: "Is the cover washable?", answer: "Yes, the outer cover unzips and is machine washable on a gentle cycle.", position: 2 },
        ],
      },
      reviews: {
        create: [
          { customer: "Demo Customer", rating: 5, title: "Great support, not too firm", body: "The pillow feels supportive without feeling too firm. I've really enjoyed the shape and comfort over the past month.", isDemo: true },
          { customer: "Demo Customer", rating: 5, title: "Better mornings", body: "Took a few nights to get used to the contour, but now I look forward to it every night. Waking up feeling much less stiff.", isDemo: true },
          { customer: "Demo Customer", rating: 4, title: "Good, slightly firm for me", body: "Quality feels premium and the cover washes well. Slightly firmer than I expected but settling in nicely.", isDemo: true },
        ],
      },
    },
  });

  // ---- Product 2: Premium Memory Foam Pillow ----
  await prisma.product.create({
    data: {
      slug: "sutera-premium-memory-foam-pillow",
      name: "Sutera Premium Memory Foam Pillow",
      shortDescription:
        "Premium memory foam comfort with a supportive contour designed for a more comfortable night's sleep.",
      description:
        "A softer, more traditional pillow shape built on the same premium memory foam core as the rest of the Sutera range. The gently domed profile offers cushioned support for the head and neck without the pronounced contour of our cervical range — a good everyday option for anyone who prefers a classic pillow feel with the benefits of slow-recovery foam and a breathable, washable cover.",
      price: 199900,
      mrp: 249900,
      stock: 35,
      material: "Memory foam core, breathable fabric cover",
      dimensions: "66 cm x 41 cm x 13 cm",
      firmness: "Medium",
      sleepPosition: "All sleeping positions",
      weight: "1.3 kg",
      coverType: "Removable, machine washable",
      status: "ACTIVE",
      rating: 4.7,
      reviewCount: 158,
      categoryId: category.id,
      seoTitle: "Sutera Premium Memory Foam Pillow",
      seoDescription:
        "The Sutera Premium Memory Foam Pillow offers classic pillow comfort with a supportive, slow-recovery foam core and washable cover.",
      images: {
        create: images.memoryFoam.map((url, i) => ({
          url,
          alt: "Sutera Premium Memory Foam Pillow",
          position: i,
        })),
      },
      benefits: {
        create: [
          { title: "Classic comfort", detail: "A gently domed profile familiar to most sleepers.", position: 0 },
          { title: "Slow-recovery foam", detail: "Cushions the head while offering steady support.", position: 1 },
          { title: "Suits all positions", detail: "Comfortable for back, side and combination sleepers.", position: 2 },
        ],
      },
      faqs: {
        create: [
          { question: "How is this different from the Cervical Contour Pillow?", answer: "This has a classic domed shape rather than a dual-height contour — a softer, more traditional feel.", position: 0 },
          { question: "Does it sleep hot?", answer: "The cover is breathable and designed to help with airflow, but foam pillows generally retain more heat than fibre pillows.", position: 1 },
        ],
      },
      reviews: {
        create: [
          { customer: "Demo Customer", rating: 5, title: "Comfortable every night", body: "Softer than I expected in a good way. Still feels supportive under my neck.", isDemo: true },
          { customer: "Demo Customer", rating: 4, title: "Solid pillow", body: "Good quality foam, cover feels premium. Took about a week to fully expand after unboxing.", isDemo: true },
        ],
      },
    },
  });

  // ---- Product 3: Travel Neck Support Pillow ----
  await prisma.product.create({
    data: {
      slug: "sutera-travel-neck-support-pillow",
      name: "Sutera Travel Neck Support Pillow",
      shortDescription: "Compact neck support designed for travel, work breaks and everyday comfort.",
      description:
        "A compact, lightweight neck pillow built for flights, road trips and quick breaks at your desk. The U-shaped memory foam design cushions the neck to help you rest more comfortably while seated, and folds flat into the included pouch for easy packing.",
      price: 89900,
      mrp: 119900,
      stock: 60,
      material: "Memory foam core, soft-touch velour cover",
      dimensions: "28 cm x 24 cm x 9 cm",
      firmness: "Soft-medium",
      sleepPosition: "Seated / upright rest",
      weight: "320 g",
      coverType: "Removable, hand washable",
      status: "ACTIVE",
      rating: 4.6,
      reviewCount: 94,
      categoryId: category.id,
      seoTitle: "Sutera Travel Neck Support Pillow",
      seoDescription:
        "The Sutera Travel Neck Support Pillow is a compact, memory foam neck pillow designed for flights, commutes and desk breaks.",
      images: {
        create: images.travel.map((url, i) => ({
          url,
          alt: "Sutera Travel Neck Support Pillow",
          position: i,
        })),
      },
      benefits: {
        create: [
          { title: "Travel-ready", detail: "Folds flat with an included carry pouch.", position: 0 },
          { title: "U-shaped support", detail: "Cushions the neck while seated upright.", position: 1 },
          { title: "Lightweight", detail: "Just 320g — easy to carry in any bag.", position: 2 },
        ],
      },
      faqs: {
        create: [
          { question: "Does it come with a carry pouch?", answer: "Yes, a compact drawstring pouch is included.", position: 0 },
          { question: "Can I use this for sleeping in bed?", answer: "It's designed for seated, upright rest — for bed use we'd recommend the Cervical Contour or Memory Foam Pillow.", position: 1 },
        ],
      },
      reviews: {
        create: [
          { customer: "Demo Customer", rating: 5, title: "Perfect for flights", body: "Used it on a 6-hour flight and actually managed to sleep. Packs down really small too.", isDemo: true },
          { customer: "Demo Customer", rating: 4, title: "Handy for the desk", body: "I keep this at my desk for a quick neck stretch break. Good quality for the price.", isDemo: true },
        ],
      },
    },
  });

  // ---- Demo orders (for admin + track-order demo) ----
  const products = await prisma.product.findMany();
  const pick = (slug: string) => products.find((p) => p.slug === slug)!;

  const demoOrdersData = [
    { num: "101", status: "DELIVERED" as const, paid: true, product: contour, qty: 1, daysAgo: 12 },
    { num: "102", status: "SHIPPED" as const, paid: true, product: pick("sutera-premium-memory-foam-pillow"), qty: 2, daysAgo: 6 },
    { num: "103", status: "PROCESSING" as const, paid: true, product: pick("sutera-travel-neck-support-pillow"), qty: 1, daysAgo: 3 },
    { num: "104", status: "CONFIRMED" as const, paid: true, product: contour, qty: 1, daysAgo: 2 },
    { num: "105", status: "PENDING" as const, paid: false, product: pick("sutera-premium-memory-foam-pillow"), qty: 1, daysAgo: 1 },
    { num: "106", status: "CANCELLED" as const, paid: false, product: pick("sutera-travel-neck-support-pillow"), qty: 1, daysAgo: 8 },
  ];

  const statusFlow: Record<string, string[]> = {
    PENDING: ["PENDING"],
    CONFIRMED: ["PENDING", "CONFIRMED"],
    PROCESSING: ["PENDING", "CONFIRMED", "PROCESSING"],
    SHIPPED: ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED"],
    DELIVERED: ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"],
    CANCELLED: ["PENDING", "CANCELLED"],
  };

  for (const d of demoOrdersData) {
    const createdAt = new Date(Date.now() - d.daysAgo * 24 * 60 * 60 * 1000);
    const subtotal = d.product.price * d.qty;
    const shipping = subtotal >= 99900 ? 0 : 9900;
    const total = subtotal + shipping;

    await prisma.order.create({
      data: {
        orderNumber: `SUT-2026-000${d.num}`, // e.g. SUT-2026-000101
        customerName: "Demo Customer",
        email: "demo.customer@example.com",
        phone: DEMO_TRACKING_PHONE,
        address: "221B, Sector 17, Model Town",
        city: "Chandigarh",
        state: "Chandigarh",
        pincode: "160017",
        subtotal,
        shipping,
        discount: 0,
        total,
        paymentMethod: "RAZORPAY",
        paymentStatus: d.paid ? "PAID" : "PENDING",
        orderStatus: d.status,
        razorpayPaymentId: d.paid ? `pay_demo_${d.num}` : null,
        createdAt,
        items: {
          create: [
            {
              productId: d.product.id,
              productName: d.product.name,
              image: images.contour[0],
              price: d.product.price,
              quantity: d.qty,
            },
          ],
        },
        statusHistory: {
          create: statusFlow[d.status].map((s, i) => ({
            status: s,
            createdAt: new Date(createdAt.getTime() + i * 60 * 60 * 1000),
          })),
        },
      },
    });
  }

  console.log("Seed complete.");
  console.log("---------------------------------------------");
  console.log("Demo admin login:  /admin/login");
  console.log(`  email:    ${DEMO_ADMIN_EMAIL}`);
  console.log(`  password: ${DEMO_ADMIN_PASSWORD}`);
  console.log("Demo order tracking:  /track-order");
  console.log(`  order id: SUT-2026-000102   phone: ${DEMO_TRACKING_PHONE}`);
  console.log("---------------------------------------------");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
