import request from 'supertest';
import app from '../app';
import { testPrisma } from '../lib/testPrisma';

describe('Auth routes', () => {
  const testEmail = 'jest-test-user@example.com';

  afterAll(async () => {
    await testPrisma.user.deleteMany({ where: { email: testEmail } });
    await testPrisma.$disconnect();
  });

  describe('POST /auth/register', () => {
    it('creates a new user with STAFF role by default', async () => {
      const res = await request(app).post('/auth/register').send({
        email: testEmail,
        password: 'password123',
        name: 'Jest Test User',
      });

      expect(res.status).toBe(201);
      expect(res.body.email).toBe(testEmail);
      expect(res.body.role).toBe('STAFF');
      expect(res.body.password).toBeUndefined(); // never leak the hash
    });

    it('rejects duplicate email registration', async () => {
      const res = await request(app).post('/auth/register').send({
        email: testEmail,
        password: 'password123',
        name: 'Duplicate Attempt',
      });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/already in use/i);
    });
  });

  describe('POST /auth/login', () => {
    it('logs in with correct credentials and returns a token', async () => {
      const res = await request(app).post('/auth/login').send({
        email: testEmail,
        password: 'password123',
      });

      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.email).toBe(testEmail);
    });

    it('rejects an incorrect password', async () => {
      const res = await request(app).post('/auth/login').send({
        email: testEmail,
        password: 'wrongpassword',
      });

      expect(res.status).toBe(401);
    });

    it('rejects a login for a non-existent email', async () => {
      const res = await request(app).post('/auth/login').send({
        email: 'nobody@example.com',
        password: 'password123',
      });

      expect(res.status).toBe(401);
    });
  });
});