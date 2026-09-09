import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcrypt';
import { faker } from '@faker-js/faker';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding database...');

  const passwordHash = await bcrypt.hash('Password123!', 10);

  const adminName = faker.person.fullName();
  const managerName = faker.person.fullName();
  const staffName = faker.person.fullName();

  const admin = await prisma.user.upsert({
    where: { email: 'admin@stockaura.com' },
    update: { name: adminName },
    create: { email: 'admin@stockaura.com', password: passwordHash, name: adminName, role: 'ADMIN' },
  });

  const manager = await prisma.user.upsert({
    where: { email: 'manager@stockaura.com' },
    update: { name: managerName },
    create: { email: 'manager@stockaura.com', password: passwordHash, name: managerName, role: 'MANAGER' },
  });

  const staff = await prisma.user.upsert({
    where: { email: 'staff@stockaura.com' },
    update: { name: staffName },
    create: { email: 'staff@stockaura.com', password: passwordHash, name: staffName, role: 'STAFF' },
  });

  const suppliers = await Promise.all([
    prisma.supplier.upsert({
      where: { id: 1 },
      update: {},
      create: { id: 1, name: 'Northwind Office Supplies', email: 'orders@northwindoffice.co.nz', phone: '09-555-0142' },
    }),
    prisma.supplier.upsert({
      where: { id: 2 },
      update: {},
      create: { id: 2, name: 'Pacific Hardware Co.', email: 'sales@pacifichardware.co.nz', phone: '09-555-0198' },
    }),
    prisma.supplier.upsert({
      where: { id: 3 },
      update: {},
      create: { id: 3, name: 'Summit Electronics Ltd', email: 'accounts@summitelectronics.co.nz', phone: '04-555-0223' },
    }),
  ]);

  const productData = [
    { name: 'A4 Copy Paper (500 sheets)', sku: 'OFF-PAPER-A4', price: 8.5, quantity: 240, lowStockAlert: 50, supplierId: suppliers[0].id },
    { name: 'Black Ballpoint Pens (Box of 50)', sku: 'OFF-PEN-BLK', price: 12.0, quantity: 18, lowStockAlert: 20, supplierId: suppliers[0].id },
    { name: 'Lever Arch Files', sku: 'OFF-FILE-LA', price: 4.25, quantity: 65, lowStockAlert: 15, supplierId: suppliers[0].id },
    { name: 'Sticky Notes (Assorted)', sku: 'OFF-NOTE-ASST', price: 3.9, quantity: 90, lowStockAlert: 20, supplierId: suppliers[0].id },
    { name: 'Cordless Drill 18V', sku: 'HW-DRILL-18V', price: 129.99, quantity: 12, lowStockAlert: 5, supplierId: suppliers[1].id },
    { name: 'Claw Hammer 16oz', sku: 'HW-HAMMER-16', price: 24.5, quantity: 34, lowStockAlert: 10, supplierId: suppliers[1].id },
    { name: 'Adjustable Wrench Set', sku: 'HW-WRENCH-SET', price: 45.0, quantity: 8, lowStockAlert: 10, supplierId: suppliers[1].id },
    { name: 'Safety Goggles', sku: 'HW-SAFETY-GOG', price: 9.75, quantity: 56, lowStockAlert: 15, supplierId: suppliers[1].id },
    { name: 'Work Gloves (Pair)', sku: 'HW-GLOVE-PR', price: 6.2, quantity: 3, lowStockAlert: 10, supplierId: suppliers[1].id },
    { name: 'USB-C Charging Cable 1m', sku: 'ELE-CABLE-USBC', price: 11.99, quantity: 150, lowStockAlert: 30, supplierId: suppliers[2].id },
    { name: 'Wireless Mouse', sku: 'ELE-MOUSE-WL', price: 22.5, quantity: 47, lowStockAlert: 15, supplierId: suppliers[2].id },
    { name: 'Mechanical Keyboard', sku: 'ELE-KEYB-MECH', price: 89.0, quantity: 9, lowStockAlert: 10, supplierId: suppliers[2].id },
    { name: '27" Monitor', sku: 'ELE-MON-27', price: 249.0, quantity: 6, lowStockAlert: 5, supplierId: suppliers[2].id },
    { name: 'Power Strip (6-outlet)', sku: 'ELE-POWER-STRIP', price: 19.5, quantity: 28, lowStockAlert: 10, supplierId: suppliers[2].id },
  ];

  const products = [];
  for (const p of productData) {
    const product = await prisma.product.upsert({
      where: { sku: p.sku },
      update: {},
      create: p,
    });
    products.push(product);
  }

  const movementSeed = [
    { productSku: 'OFF-PEN-BLK', type: 'SALE' as const, quantity: 12, note: 'Bulk order - Marketing dept', userId: staff.id },
    { productSku: 'HW-WRENCH-SET', type: 'SALE' as const, quantity: 7, note: 'Maintenance team requisition', userId: staff.id },
    { productSku: 'HW-GLOVE-PR', type: 'SALE' as const, quantity: 22, note: 'Warehouse restock request', userId: manager.id },
    { productSku: 'ELE-MON-27', type: 'RESTOCK' as const, quantity: 6, note: 'Quarterly electronics restock', userId: manager.id },
    { productSku: 'ELE-KEYB-MECH', type: 'RESTOCK' as const, quantity: 9, note: 'New hire equipment prep', userId: manager.id },
    { productSku: 'OFF-PAPER-A4', type: 'RESTOCK' as const, quantity: 100, note: 'Monthly office restock', userId: admin.id },
    { productSku: 'HW-DRILL-18V', type: 'ADJUSTMENT' as const, quantity: -2, note: 'Stock count correction after audit', userId: admin.id },
    { productSku: 'ELE-CABLE-USBC', type: 'RETURN' as const, quantity: 5, note: 'Returned unused from IT dept', userId: staff.id },
  ];

  for (const m of movementSeed) {
    const product = products.find((p) => p.sku === m.productSku);
    if (!product) continue;
    await prisma.stockMovement.create({
      data: { productId: product.id, type: m.type, quantity: m.quantity, note: m.note, userId: m.userId },
    });
  }

  await prisma.product.upsert({
    where: { sku: 'OFF-STAPLER-DISC' },
    update: {},
    create: {
      name: 'Heavy Duty Stapler (Discontinued)',
      sku: 'OFF-STAPLER-DISC',
      price: 15.0,
      quantity: 0,
      lowStockAlert: 5,
      isActive: false,
      supplierId: suppliers[0].id,
    },
  });

  console.log('Seed complete.');
  console.log('Login with any of:');
  console.log('  admin@stockaura.com / Password123!');
  console.log('  manager@stockaura.com / Password123!');
  console.log('  staff@stockaura.com / Password123!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });