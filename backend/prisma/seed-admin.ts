import { auth } from "../src/lib/auth";
import { prisma } from "../src/lib/prisma";
import dotenv from "dotenv";

dotenv.config();

const ADMIN_EMAIL = "admin@example.com";
const ADMIN_PASSWORD = "password123";
const ADMIN_NAME = "Admin User";

async function ensureAdminRole(email: string) {
  return prisma.user.update({
    where: { email },
    data: { role: "admin" },
  });
}

async function main() {
  // Remove users left behind by a failed sign-up (user row, no credential account).
  const orphans = await prisma.user.findMany({
    where: { accounts: { none: {} } },
    select: { id: true, email: true },
  });
  if (orphans.length > 0) {
    await prisma.user.deleteMany({
      where: { id: { in: orphans.map((user) => user.id) } },
    });
    console.log(`Removed ${orphans.length} orphan user(s) without accounts.`);
  }

  const existingUser = await prisma.user.findFirst({
    where: { email: ADMIN_EMAIL },
    include: { accounts: true },
  });

  if (existingUser) {
    const admin = await ensureAdminRole(ADMIN_EMAIL);
    console.log("Admin user already exists.");
    console.log(`Email: ${ADMIN_EMAIL}`);
    console.log(`User id: ${admin.id}`);
    console.log(`Role: ${admin.role}`);
    if (existingUser.accounts.length === 0) {
      console.log(
        "Warning: this user has no credential account. Delete the user and re-run the seed."
      );
    }
    return;
  }

  console.log("Creating admin user...");

  const res = await auth.api.signUpEmail({
    body: {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      name: ADMIN_NAME,
    },
  });

  if (!res) {
    throw new Error("Better Auth sign-up returned an empty response");
  }

  const admin = await ensureAdminRole(ADMIN_EMAIL);
  console.log("Admin user created.");
  console.log(`Email: ${ADMIN_EMAIL}`);
  console.log(`Password: ${ADMIN_PASSWORD}`);
  console.log(`User id: ${admin.id}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
