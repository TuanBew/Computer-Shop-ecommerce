'use strict';

/**
 * TST-C3: Cart integration tests
 *
 * Notes:
 * - All cart endpoints require authUser (token cookie)
 * - addToCart decrements product stock; deleteProductCart restores it
 * - getCart throws BadRequestError when cart is empty (not found)
 * - deleteProductCart uses query param `productId`
 */

const request = require('supertest');
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

async function registerAndGetToken() {
  const email = `cartuser_${Date.now()}@example.com`;
  const password = 'cartpass123';

  const res = await request(app).post('/api/register').send({
    fullName: 'Cart User',
    email,
    password,
    phone: '0911000001',
  });

  return res.body.metadata.token;
}

async function seedProduct(overrides = {}) {
  const modelProduct = require('../../src/models/products.model');
  return modelProduct.create(productFactory(overrides));
}

// ─── tests ──────────────────────────────────────────────────────────────────

describe('TST-C3: Cart Integration', () => {
  test('1. POST /api/add-to-cart with product in DB and user auth → 200', async () => {
    const token = await registerAndGetToken();
    const product = await seedProduct({ stock: 10 });

    const res = await request(app)
      .post('/api/add-to-cart')
      .set('Cookie', `token=${token}`)
      .send({ productId: product._id.toString(), quantity: 2 });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message');
  });

  test('2. GET /api/get-cart after adding item → 200, has product data', async () => {
    const token = await registerAndGetToken();
    const product = await seedProduct({ stock: 10 });

    // Add to cart first
    await request(app)
      .post('/api/add-to-cart')
      .set('Cookie', `token=${token}`)
      .send({ productId: product._id.toString(), quantity: 1 });

    const res = await request(app)
      .get('/api/get-cart')
      .set('Cookie', `token=${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('metadata');
    expect(res.body.metadata.newData).toHaveProperty('data');
    expect(Array.isArray(res.body.metadata.newData.data)).toBe(true);
    expect(res.body.metadata.newData.data.length).toBeGreaterThan(0);
  });

  test('3. POST /api/add-to-cart with quantity > stock → 4xx error', async () => {
    const token = await registerAndGetToken();
    const product = await seedProduct({ stock: 3 });

    const res = await request(app)
      .post('/api/add-to-cart')
      .set('Cookie', `token=${token}`)
      .send({ productId: product._id.toString(), quantity: 999 });

    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.body).toHaveProperty('message');
    expect(res.body.message).toContain('không đủ');
  });

  test('4. DELETE /api/delete-cart?productId=<id> after adding → 200', async () => {
    const token = await registerAndGetToken();
    const product = await seedProduct({ stock: 10 });

    // Add to cart first
    await request(app)
      .post('/api/add-to-cart')
      .set('Cookie', `token=${token}`)
      .send({ productId: product._id.toString(), quantity: 1 });

    const res = await request(app)
      .delete(`/api/delete-cart?productId=${product._id}`)
      .set('Cookie', `token=${token}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toContain('Xoá');
  });
});
