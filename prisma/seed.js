const { PrismaClient, Role } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function hashPassword(password) {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
}

// seed.js
async function main() {
  // Create SUPER ADMIN
  await prisma.user.create({
    data: {
      first_name: "Super",
      last_name: "Admin",
      email: "superadmin@sufrikh.com",
      password: await hashPassword("SuperAdmin123!"),
      role: 'ADMIN',
      is_super_admin: true,
      is_verified: true,
      phone: "+12345678901"
    }
  });

  // Create NORMAL ADMIN
  await prisma.user.create({
    data: {
      first_name: "Normal",
      last_name: "Admin",
      email: "admin@sufrikh.com",
      password: await hashPassword("Admin123!"),
      role: 'ADMIN',
      is_super_admin: false,
      is_verified: true,
      phone: "+12345678902"
    }
  });

  console.log('✅ Seed completed: Super Admin and Normal Admin created');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });