#!/bin/sh
set -e

npx prisma db push

npx ts-node --transpile-only prisma/seed-products.ts
npx ts-node --transpile-only prisma/seed-admin.ts

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
