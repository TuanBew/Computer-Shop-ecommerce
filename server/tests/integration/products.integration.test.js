'use strict';

/**
 * TST-C2: Products integration tests
 *
 * Notes:
 * - GET /api/products returns all products (no server-side pagination in controller)
 * - GET /api/search-product uses query param `keyword` (not `search`)
 * - POST /api/add-product requires authAdmin middleware
 * - DELETE /api/delete-product uses query param `id`
 */

const request = require('supertest');
const mongoose = require('mongoose');
const { createTestApp } = require('../helpers/testApp');
const { connectTestDB, disconnectTestDB, clearCollections } = require('../helpers/mongoHelper');
const { productFactory } = require('../factories/index');

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

/**
 * Register a user, set isAdmin=true via mongoose, then login to get a
 * fresh token (login regenerates the RSA keypair).
 */
async function getAdminToken() {
  const modelUser = require('../../src/models/users.model');

  const email = `admin_${Date.now()}@example.com`;
  const password = 'adminpass123';

  // Register
  await request(app).post('/api/register').send({
    fullName: 'Admin User',
    email,
    password,
    phone: '0909999999',
  });

  // Promote to admin directly in DB
  await modelUser.updateOne({ email }, { $set: { isAdmin: true } });

  // Login to get a token signed with the latest RSA keypair
  const loginRes = await request(app)
    .post('/api/login')
    .send({ email, password });

  return loginRes.body.metadata.token;
}

const sampleProduct = productFactory();

// ─── tests ──────────────────────────────────────────────────────────────────

describe('TST-C2: Products Integration', () => {
  test('1. GET /api/products → 200, has metadata array', async () => {
    const res = await request(app).get('/api/products');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('metadata');
    expect(Array.isArray(res.body.metadata)).toBe(true);
  });

  test('2. GET /api/search-product?keyword=laptop → 200', async () => {
    // Seed a product first
    const modelProduct = require('../../src/models/products.model');
    await modelProduct.create(sampleProduct);

    const res = await request(app).get('/api/search-product?keyword=laptop');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('metadata');
    expect(Array.isArray(res.body.metadata)).toBe(true);
  });

  test('3. POST /api/add-product with admin auth → 200 (product created)', async () => {
    const token = await getAdminToken();

    const res = await request(app)
      .post('/api/add-product')
      .set('Cookie', `token=${token}`)
      .send(sampleProduct);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('metadata');
    expect(res.body.metadata).toHaveProperty('name', sampleProduct.name);
  });

  test('4. POST /api/add-product without auth → 4xx', async () => {
    const res = await request(app)
      .post('/api/add-product')
      .send(sampleProduct);

    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  test('5. DELETE /api/delete-product?id=<id> with admin auth → 200', async () => {
    const token = await getAdminToken();

    // Seed product directly
    const modelProduct = require('../../src/models/products.model');
    const product = await modelProduct.create(sampleProduct);

    const res = await request(app)
      .delete(`/api/delete-product?id=${product._id}`)
      .set('Cookie', `token=${token}`);

    // delete-product does not use authAdmin — any token works (or no auth).
    // The controller just looks up by id and deletes.
    expect(res.status).toBe(200);
    expect(res.body.message).toContain('Xoá');
  });
});
