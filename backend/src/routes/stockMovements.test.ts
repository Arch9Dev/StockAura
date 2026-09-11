import request from 'supertest';
import app from '../app';
import { testPrisma } from '../lib/testPrisma';
import bcrypt from 'bcrypt';

describe('Stock movement routes', () => {
  let staffToken: string;
  let testProductId: number;
  const testSku = `JEST-STOCK-${Date.now()}`;

  beforeAll(async () => {
    const passwordHash = await bcrypt.hash('password123', 10);
    const staffUser = await testPrisma.user.create({
      data: { email: `jest-stock-staff-${Date.now()}@example.com`, password: passwordHash, name: 'Jest Stock Staff', role: 'STAFF' },
    });
    const login = await request(app).post('/auth/login').send({ email: staffUser.email, password: 'password123' });
    staffToken = login.body.token;

    const product = await testPrisma.product.create({
      data: { name: 'Jest Stock Test Product', sku: testSku, price: 10, quantity: 10, lowStockAlert: 5 },
    });
    testProductId = product.id;
  });

  afterAll(async () => {
    await testPrisma.stockMovement.deleteMany({ where: { productId: testProductId } });
    await testPrisma.product.deleteMany({ where: { sku: testSku } });
    await testPrisma.user.deleteMany({ where: { email: { contains: 'jest-stock-' } } });
    await testPrisma.$disconnect();
  });

  it('correctly increases quantity on a RESTOCK movement', async () => {
    const res = await request(app)
      .post('/stock-movements')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ productId: testProductId, type: 'RESTOCK', quantity: 20 });

    expect(res.status).toBe(201);

    const product = await testPrisma.product.findUnique({ where: { id: testProductId } });
    expect(product?.quantity).toBe(30); // 10 + 20
  });

  it('correctly decreases quantity on a SALE movement', async () => {
    const res = await request(app)
      .post('/stock-movements')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ productId: testProductId, type: 'SALE', quantity: 5 });

    expect(res.status).toBe(201);

    const product = await testPrisma.product.findUnique({ where: { id: testProductId } });
    expect(product?.quantity).toBe(25); // 30 - 5
  });

  it('rejects a SALE that would take stock below zero', async () => {
    const res = await request(app)
      .post('/stock-movements')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ productId: testProductId, type: 'SALE', quantity: 9999 });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/insufficient stock/i);

    // Confirm quantity was NOT changed by the failed attempt
    const product = await testPrisma.product.findUnique({ where: { id: testProductId } });
    expect(product?.quantity).toBe(25);
  });

  it('rejects a stock movement for a non-existent product', async () => {
    const res = await request(app)
      .post('/stock-movements')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ productId: 999999, type: 'RESTOCK', quantity: 1 });

    expect(res.status).toBe(404);
  });
});