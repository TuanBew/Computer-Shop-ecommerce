'use strict';

/**
 * TST-B1: JWT middleware unit tests
 * Tests authUser and authAdmin from server/src/auth/checkAuth.js
 *
 * Strategy:
 * - Mock verifyToken (uses jwtDecode + MongoDB RSA keypair lookup — cannot test in isolation)
 * - Mock modelUser (authAdmin does a DB lookup)
 */

jest.mock('../../src/services/tokenSevices');
jest.mock('../../src/models/users.model');

const { authUser, authAdmin } = require('../../src/auth/checkAuth');
const { verifyToken } = require('../../src/services/tokenSevices');
const modelUser = require('../../src/models/users.model');

// Helper to build mock req/res/next objects
const buildReqResNext = (cookieToken) => {
  const req = {
    cookies: cookieToken !== undefined ? { token: cookieToken } : {},
  };
  const res = {};
  const next = jest.fn();
  return { req, res, next };
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('authUser middleware', () => {
  test('1. no token cookie → calls next() with BadUserRequestError (Vui lòng đăng nhập)', async () => {
    const { req, res, next } = buildReqResNext(undefined);

    await authUser(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    const err = next.mock.calls[0][0];
    expect(err).toBeDefined();
    expect(err.message).toBe('Vui lòng đăng nhập');
  });

  test('2. valid token → verifyToken resolves, sets req.user and calls next()', async () => {
    const fakeDecoded = { id: 'user123', email: 'user@example.com' };
    verifyToken.mockResolvedValueOnce(fakeDecoded);

    const { req, res, next } = buildReqResNext('valid.jwt.token');

    await authUser(req, res, next);

    expect(verifyToken).toHaveBeenCalledWith('valid.jwt.token');
    expect(req.user).toEqual(fakeDecoded);
    expect(next).toHaveBeenCalledWith(); // called with no arguments = success
  });

  test('3. invalid token (verifyToken throws) → calls next(error)', async () => {
    const authError = new Error('Vui lòng đăng nhập lại');
    verifyToken.mockRejectedValueOnce(authError);

    const { req, res, next } = buildReqResNext('bad.token');

    await authUser(req, res, next);

    expect(next).toHaveBeenCalledWith(authError);
  });
});

describe('authAdmin middleware', () => {
  test('4. no token cookie → calls next() with error', async () => {
    const { req, res, next } = buildReqResNext(undefined);

    await authAdmin(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    const err = next.mock.calls[0][0];
    expect(err).toBeDefined();
    expect(err.message).toBe('Bạn không có quyền truy cập');
  });

  test('5. valid token, user isAdmin=true → sets req.user and calls next()', async () => {
    const fakeDecoded = { id: 'admin456' };
    verifyToken.mockResolvedValueOnce(fakeDecoded);
    modelUser.findById = jest.fn().mockResolvedValueOnce({ _id: 'admin456', isAdmin: true });

    const { req, res, next } = buildReqResNext('admin.jwt.token');

    await authAdmin(req, res, next);

    expect(verifyToken).toHaveBeenCalledWith('admin.jwt.token');
    expect(modelUser.findById).toHaveBeenCalledWith('admin456');
    expect(req.user).toEqual(fakeDecoded);
    expect(next).toHaveBeenCalledWith();
  });

  test('6. valid token, user isAdmin=false → calls next() with "Bạn không có quyền truy cập"', async () => {
    const fakeDecoded = { id: 'user789' };
    verifyToken.mockResolvedValueOnce(fakeDecoded);
    modelUser.findById = jest.fn().mockResolvedValueOnce({ _id: 'user789', isAdmin: false });

    const { req, res, next } = buildReqResNext('user.jwt.token');

    await authAdmin(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    const err = next.mock.calls[0][0];
    expect(err).toBeDefined();
    expect(err.message).toBe('Bạn không có quyền truy cập');
  });
});
