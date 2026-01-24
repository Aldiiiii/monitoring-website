import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const name = process.env.ADMIN_NAME ?? 'Admin';
  const email = process.env.ADMIN_EMAIL ?? 'admin@example.com';
  const password = process.env.ADMIN_PASSWORD ?? 'admin12345';

  if (password.length < 8) {
    throw new Error('ADMIN_PASSWORD must be at least 8 characters.');
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      name,
      password: passwordHash,
      role: UserRole.ADMIN,
      isActive: true,
    },
    create: {
      name,
      email,
      password: passwordHash,
      role: UserRole.ADMIN,
    },
    select: { id: true, email: true, role: true },
  });

  console.log('Admin user ready:', user);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
