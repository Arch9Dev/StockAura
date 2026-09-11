import request from 'supertest';
import app from '../app';
import { testPrisma } from '../lib/testPrisma';
import bcrypt from 'bcrypt';

describe('Product routes', () => {
  let staffToken: string;
  let managerToken: string;
  let adminToken: string;
  let testProductId: number;
  let staffEmail: string;
  let managerEmail: string;
  let adminEmail: string;
  let userIds: number[] = [];

  const testSku = `JEST-SKU-${Date.now()}`;

  beforeAll(async () => {
    const passwordHash = await bcrypt.hash('password123', 10);

    staffEmail = `jest-staff-${Date.now()}@example.com`;
    managerEmail = `jest-manager-${Date.now()}@example.com`;
    adminEmail = `jest-admin-${Date.now()}@example.com`;

    const staffUser = await testPrisma.user.create({ data: { email: staffEmail, password: passwordHash, name: 'Jest Staff', role: 'STAFF' } });
    const managerUser = await testPrisma.user.create({ data: { email: managerEmail, password: passwordHash, name: 'Jest Manager', role: 'MANAGER' } });
    const adminUser = await testPrisma.user.create({ data: { email: adminEmail, password: passwordHash, name: 'Jest Admin', role: 'ADMIN' } });

    userIds = [staffUser.id, managerUser.id, adminUser.id];

    const staffLogin = await request(app).post('/auth/login').send({ email: staffEmail, password: 'password123' });
    const managerLogin = await request(app).post('/auth/login').send({ email: managerEmail, password: 'password123' });
    const adminLogin = await request(app).post('/auth/login').send({ email: adminEmail, password: 'password123' });

    staffToken = staffLogin.body.token;
    managerToken = managerLogin.body.token;
    adminToken = adminLogin.body.token;
  });

  afterAll(async () => {
    await testPrisma.stockMovement.deleteMany({ where: { productId: testProductId } });
    await testPrisma.auditLog.deleteMany({ where: { userId: { in: userIds } } });
    await testPrisma.product.deleteMany({ where: { sku: testSku } });
    await testPrisma.user.deleteMany({ where: { id: { in: userIds } } });
    await testPrisma.$disconnect();
  });

  describe('RBAC enforcement', () => {
    it('blocks STAFF from creating a product', async () => {
      const res = await request(app)
        .post('/products')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ name: 'Should Fail', sku: 'STAFF-BLOCKED', price: 10, quantity: 5 });

      expect(res.status).toBe(403);
    });

    it('allows MANAGER to create a product', async () => {
      const res = await request(app)
        .post('/products')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ name: 'Jest Test Product', sku: testSku, price: 19.99, quantity: 10 });

      expect(res.status).toBe(201);
      testProductId = res.body.id;
    });

    it('blocks MANAGER from archiving a product', async () => {
      const res = await request(app)
        .patch(`/products/${testProductId}/archive`)
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.status).toBe(403);
    });

    it('allows ADMIN to archive a product', async () => {
      const res = await request(app)
        .patch(`/products/${testProductId}/archive`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.isActive).toBe(false);
    });

    it('rejects requests with no token at all', async () => {
      const res = await request(app).get('/products');
      expect(res.status).toBe(401);
    });
  });

  describe('SKU uniqueness', () => {
    it('rejects creating a product with a duplicate SKU', async () => {
      const res = await request(app)
        .post('/products')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ name: 'Duplicate SKU Attempt', sku: testSku, price: 5, quantity: 1 });

      expect(res.status).toBe(409);
      expect(res.body.error).toMatch(/already in use/i);
    });
  });

  describe('Deletion safety', () => {
    it('blocks deleting a product that has stock movement history', async () => {
      await request(app).patch(`/products/${testProductId}/restore`).set('Authorization', `Bearer ${adminToken}`);

      await request(app)
        .post('/stock-movements')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ productId: testProductId, type: 'RESTOCK', quantity: 5, note: 'Jest test movement' });

      const res = await request(app)
        .delete(`/products/${testProductId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/stock movement history/i);
    });
  });
});