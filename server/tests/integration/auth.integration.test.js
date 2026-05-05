'use strict';

/**
 * TST-C1: Auth integration tests
 * Tests the full HTTP auth flow: register → login → /api/auth
 *
 * Notes:
 * - Uses mongodb-memory-server so no real DB is needed
 * - Tokens returned from JSON body (metadata.token) are manually set as
 *   cookies on subsequent requests because supertest does not follow
 *   Set-Cookie with secure:true cookies automatically
 * - BadRequestError uses statusCode 403 (FORBIDDEN) in this codebase,
 *   not 400 — see core/error.response.js
 */

const request = require('supertest');
const { createTestApp } = require('../helpers/testApp');
const { connectTestDB, disconnectTestDB, clearCollections } = require('../helpers/mongoHelper');

let app;

beforeAll(async () => {
  // SECRET_CRYPTO is needed by the authUser controller (CryptoJS.AES.encrypt).
  // It must be set before the app is created so the controller can find it.
  if (!process.env.SECRET_CRYPTO) process.env.SECRET_CRYPTO = 'test-secret-crypto';

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

const validUser = {
  fullName: 'Test User',
  email: 'testuser@example.com',
  password: 'password123',
  phone: '0909000001',
};

async function registerUser(data = validUser) {
  return request(app).post('/api/register').send(data);
}

// ─── tests ──────────────────────────────────────────────────────────────────

describe('TST-C1: Auth Integration', () => {
  test('1. POST /api/register with valid data → 201, has metadata.token', async () => {
    const res = await registerUser();

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('metadata');
    expect(res.body.metadata).toHaveProperty('token');
    expect(typeof res.body.metadata.token).toBe('string');
  });

  test('2. POST /api/register with missing fields → error with Vietnamese message', async () => {
    const res = await request(app)
      .post('/api/register')
      .send({ email: 'incomplete@example.com', password: 'pass123' });

    // BadRequestError uses FORBIDDEN (403) as statusCode in this codebase
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.body).toHaveProperty('message');
    expect(res.body.message).toContain('Vui lòng');
  });

  test('3. POST /api/register with duplicate email → 4xx, "Người dùng đã tồn tại"', async () => {
    // First registration
    await registerUser();

    // Second registration with same email
    const res = await registerUser();

    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.body.message).toBe('Người dùng đã tồn tại');
  });

  test('4. POST /api/login with correct credentials → 200, has metadata.token', async () => {
    // Register first
    await registerUser();

    const res = await request(app)
      .post('/api/login')
      .send({ email: validUser.email, password: validUser.password });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('metadata');
    expect(res.body.metadata).toHaveProperty('token');
    expect(typeof res.body.metadata.token).toBe('string');
  });

  test('5. POST /api/login with wrong password → 4xx error', async () => {
    await registerUser();

    const res = await request(app)
      .post('/api/login')
      .send({ email: validUser.email, password: 'wrongpassword' });

    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.body).toHaveProperty('message');
  });

  test('6. GET /api/auth with valid token cookie → 200', async () => {
    // Register to get a token
    const registerRes = await registerUser();
    const token = registerRes.body.metadata.token;

    // Use token from body as cookie (secure:true cookies are set but not
    // auto-forwarded by supertest — set manually)
    const res = await request(app)
      .get('/api/auth')
      .set('Cookie', `token=${token}`);

    expect(res.status).toBe(200);
  });

  test('7. GET /api/auth with no cookie → 4xx error', async () => {
    const res = await request(app).get('/api/auth');

    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.body).toHaveProperty('message');
  });
});
