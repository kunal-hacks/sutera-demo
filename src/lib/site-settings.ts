import { prisma } from "./prisma";

/** Fetches (and lazily creates) the singleton site settings row. */
export async function getSiteSettings() {
  return prisma.siteSetting.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton" },
  });
}
