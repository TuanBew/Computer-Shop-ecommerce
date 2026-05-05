'use strict';

/**
 * TST-B3: Input validation boundary tests
 *
 * The app does inline validation in controllers (no separate validator module).
 * This file tests:
 *   a) error.response.js classes — structure and throwability
 *   b) Boundary values for product data via productFactory
 */

const {
  BadRequestError,
  BadUserRequestError,
  BadUser2RequestError,
  ConflictRequestError,
} = require('../../src/core/error.response');

const { productFactory } = require('../factories/index');

// ─── Error Response Classes ───────────────────────────────────────────────────

describe('error.response.js classes', () => {
  test('1. BadRequestError has statusCode 403 (FORBIDDEN — matches source default)', () => {
    const err = new BadRequestError('bad input');
    expect(err.statusCode).toBe(403);
    expect(err.message).toBe('bad input');
    expect(err).toBeInstanceOf(Error);
  });

  test('2. BadUserRequestError has statusCode 401 (UNAUTHORIZED) and default message', () => {
    const err = new BadUserRequestError();
    expect(err.statusCode).toBe(401);
    // Default message is reasonPhrases.UNAUTHORIZED = 'Unauthorized'
    expect(typeof err.message).toBe('string');
    expect(err.message.length).toBeGreaterThan(0);
  });

  test('3. Error classes can be thrown and caught with correct shape', () => {
    expect(() => {
      throw new BadRequestError('Vui lòng nhập đày đủ thông tin');
    }).toThrow('Vui lòng nhập đày đủ thông tin');

    expect(() => {
      throw new BadUserRequestError('Vui lòng đăng nhập');
    }).toThrow('Vui lòng đăng nhập');
  });

  test('4. ConflictRequestError is an instance of Error with a statusCode', () => {
    const err = new ConflictRequestError('duplicate');
    expect(err).toBeInstanceOf(Error);
    expect(err.statusCode).toBeDefined();
  });
});

// ─── Product Factory Boundary Tests ──────────────────────────────────────────

describe('productFactory boundary values', () => {
  test('5. price = 0 is a valid boundary (zero-price product can be constructed)', () => {
    const product = productFactory({ price: 0 });
    expect(product.price).toBe(0);
  });

  test('6. price = -1 — no server-side validation catches negative price (KNOWN MISSING VALIDATION)', () => {
    // BUG: The app has no server-side guard against negative prices.
    // A productFactory with price=-1 constructs without error at the factory level.
    // This test documents the gap — a validation rule should reject price < 0.
    const product = productFactory({ price: -1 });
    expect(product.price).toBe(-1); // passes through unchecked
  });

  test('7. stock = 0 is a valid boundary (out-of-stock product can be represented)', () => {
    const product = productFactory({ stock: 0 });
    expect(product.stock).toBe(0);
  });
});
