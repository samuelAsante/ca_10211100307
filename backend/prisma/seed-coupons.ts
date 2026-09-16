import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();

export const INITIAL_COUPONS = [
  {
    code: "WELCOME10",
    description: "10% off your first cookware purchase (Orders 100+ GHS)",
    discountType: "percentage",
    discountValue: 10,
    minSubtotal: 100,
    maxDiscount: 150,
    isActive: true,
  },
  {
    code: "AKFAST5",
    description: "5% express discount on kitchen accessories",
    discountType: "percentage",
    discountValue: 5,
    minSubtotal: 50,
    maxDiscount: null,
    isActive: true,
  },
  {
    code: "CHEF20",
    description: "20% off high-volume chef & restaurant sets (Orders 500+ GHS)",
    discountType: "percentage",
    discountValue: 20,
    minSubtotal: 500,
    maxDiscount: 350,
    isActive: true,
  },
  {
    code: "FREESHIP",
    description: "25 GHS delivery subsidy for Accra & Kumasi orders (Orders 200+ GHS)",
    discountType: "fixed",
    discountValue: 25,
    minSubtotal: 200,
    maxDiscount: null,
    isActive: true,
  },
];

export async function seedCoupons() {
  try {
    const existingCount = await prisma.coupon.count();
    if (existingCount > 0) {
      console.log(`[Seed] Database already contains ${existingCount} coupon(s). Skipping coupon seed.`);
      return;
    }

    console.log("Seeding default promotional coupons into database...");
    let created = 0;

    for (const coupon of INITIAL_COUPONS) {
      const existing = await prisma.coupon.findUnique({ where: { code: coupon.code } });
      if (!existing) {
        await prisma.coupon.create({ data: coupon });
        created++;
        console.log(`[Seed] Created coupon: ${coupon.code}`);
      } else {
        console.log(`[Seed] Coupon ${coupon.code} already exists. Skipping.`);
      }
    }

    console.log(`[Seed] Coupon seeding completed (${created} created).`);
  } catch (err) {
    console.error("[Seed] Error checking/seeding coupons:", err);
  }
}

async function main() {
  try {
    await seedCoupons();
  } catch (error) {
    console.error("Failed to run seed coupons:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}
