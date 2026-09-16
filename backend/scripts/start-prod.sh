#!/bin/sh
set -e

npx prisma migrate deploy

# Only seed initial products if the database has no products or FORCE_SEED=true
HAS_PRODUCTS="$(node -e "
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  prisma.product.count()
    .then((c) => process.stdout.write(c > 0 ? 'yes' : 'no'))
    .catch(() => process.stdout.write('no'))
    .finally(() => prisma.\$disconnect());
")"

if [ "$HAS_PRODUCTS" = "no" ] || [ "$FORCE_SEED" = "true" ]; then
  echo "Seeding initial products..."
  npx ts-node --transpile-only prisma/seed-products.ts
else
  echo "Products already exist in database. Skipping product seeding."
fi

# Only seed initial coupons if no coupons exist in DB
HAS_COUPONS="$(node -e "
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  prisma.coupon.count()
    .then((c) => process.stdout.write(c > 0 ? 'yes' : 'no'))
    .catch(() => process.stdout.write('no'))
    .finally(() => prisma.\$disconnect());
")"

if [ "$HAS_COUPONS" = "no" ]; then
  echo "Seeding initial promotional coupons..."
  npx ts-node --transpile-only prisma/seed-coupons.ts
else
  echo "Coupons already exist in database. Skipping coupon seeding."
fi


# Only seed admin if admin user does not exist yet
HAS_ADMIN="$(node -e "
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  prisma.user.findFirst({ where: { email: 'admin@example.com' } })
    .then((u) => process.stdout.write(u ? 'yes' : 'no'))
    .catch(() => process.stdout.write('no'))
    .finally(() => prisma.\$disconnect());
")"

if [ "$HAS_ADMIN" = "no" ]; then
  echo "Creating default admin user..."
  npx ts-node --transpile-only prisma/seed-admin.ts
fi

if [ -z "$ADMIN_ID" ]; then
  ADMIN_ID="$(node -e "
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    prisma.user.findUnique({ where: { email: 'admin@example.com' } })
      .then((user) => {
        if (!user) {
          throw new Error('Admin user was not created');
        }
        process.stdout.write(user.id);
      })
      .finally(() => prisma.\$disconnect());
  ")"
  export ADMIN_ID
fi

exec node dist/index.js
