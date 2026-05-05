'use strict';

/**
 * TST-C5: RBAC (Role-Based Access Control) integration tests
 *
 * Verifies that:
 * - Admin-only endpoints reject regular users and unauthenticated requests
 * - Admin users can access admin endpoints
 * - Auth-protected cart/order endpoints reject unauthenticated requests
 *
 * Notes:
 * - BadUser2RequestError (non-admin) uses statusCode 403 (FORBIDDEN)
 * - BadUserRequestError (no token) uses statusCode 401 (UNAUTHORIZED)
 * - GET /api/get-order-admin requires authAdmin (payments routes)
 */

const request = require('supertest');
const { createTestApp } = require('../helpers/testApp');
const { connectTestDB, disconnectTestDB, clearCollections } = require('../helpers/mongoHelper');

let app;

beforeAll(async () => {
  await connectTestDB();
  app = createTestApp();
});

afterAll(async () => {
  await disconnectTestDB();
});

afterEach(async () => {
  await clearCollections();
});

// ─── helpers ────────────────────────────────────────────────────────────────

async function registerRegularUser() {
  const email = `regular_${Date.now()}@example.com`;
  const res = await request(app).post('/api/register').send({
    fullName: 'Regular User',
    email,
    password: 'userpass123',
    phone: '0900111222',
  });
  return res.body.metadata.token;
}

async function registerAdminAndGetToken() {
  const modelUser = require('../../src/models/users.model');
  const email = `rbac_admin_${Date.now()}@example.com`;
  const password = 'adminpass123';

  await request(app).post('/api/register').send({
    fullName: 'RBAC Admin',
    email,
    password,
    phone: '0900111333',
  });

  await modelUser.updateOne({ email }, { $set: { isAdmin: true } });

  const loginRes = await request(app)
    .post('/api/login')
    .send({ email, password });

  return loginRes.body.metadata.token;
}

// ─── tests ──────────────────────────────────────────────────────────────────

describe('TST-C5: RBAC Integration', () => {
  test('1. Regular user cannot access GET /api/get-admin-stats → 4xx', async () => {
    const userToken = await registerRegularUser();

    const res = await request(app)
      .get('/api/get-admin-stats')
      .set('Cookie', `token=${userToken}`);

    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.body).toHaveProperty('message');
    expect(res.body.message).toContain('quyền');
  });

  test('2. Admin can access GET /api/get-admin-stats → 200', async () => {
    const adminToken = await registerAdminAndGetToken();

    const res = await request(app)
      .get('/api/get-admin-stats')
      .set('Cookie', `token=${adminToken}`);

    expect(res.status).toBe(200);
  });

  test('3. Unauthenticated user cannot POST /api/add-to-cart → 4xx', async () => {
    const res = await request(app)
      .post('/api/add-to-cart')
      .send({ productId: 'fakeid', quantity: 1 });

    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.body).toHaveProperty('message');
  });

  test('4. Unauthenticated user cannot GET /api/get-order-admin → 4xx', async () => {
    const res = await request(app).get('/api/get-order-admin');

    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.body).toHaveProperty('message');
  });
});
