const { PrismaClient, Role } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function hashPassword(password) {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
}

async function main() {
  // Create initial admin
  await prisma.user.create({
    data: {
      first_name: "Admin",
      last_name: "User",
      email: "admin@sufrikh.com",
      password: await hashPassword("secure123"), // Change this in production!
      role: Role.ADMIN,
      is_verified: true,
      phone: "+1234567890",
      no_alcohol: true,
      zabihah_only: true,
      is_super_admin: true
    }
  });

  // Create sample worker
  await prisma.user.create({
    data: {
      first_name: "Staff",
      last_name: "Member",
      email: "worker@sufrikh.com",
      password: await hashPassword("workerpass123"),
      role: Role.WORKER,
      is_verified: true,
      position: "Receptionist",
      department: "Front Desk",
      is_super_admin: true,
      last_password_change: new Date(),
    }
  });

  console.log('✅ Seed completed: Admin and Worker users created');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });