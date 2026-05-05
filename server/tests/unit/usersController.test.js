'use strict';

/**
 * TST-B4: Controller unit test (mocked Mongoose)
 * Tests the `register` method of controllerUsers.
 *
 * BUG-001 NOTE: res.cookie() calls in the controller use `secure: true` and
 * `sameSite: 'Strict'`. This causes cookies to be silently dropped on local
 * HTTP dev (browsers reject secure cookies on non-HTTPS origins). The JSON
 * response body still returns token/refreshToken, so the tests below verify
 * the JSON response rather than the Set-Cookie header.
 */

jest.mock('../../src/models/users.model');
jest.mock('../../src/services/tokenSevices');

// Also stub optional/indirect deps so require() doesn't throw at module load
jest.mock('../../src/models/payments.model', () => ({}));
jest.mock('../../src/models/apiKey.model', () => ({}));
jest.mock('../../src/models/otp.model', () => ({}));
jest.mock('../../src/services/MailForgotPassword', () => jest.fn());

const modelUser = require('../../src/models/users.model');
const { createApiKey, createToken, createRefreshToken } = require('../../src/services/tokenSevices');
const controller = require('../../src/controllers/users.controller');

// Build a lightweight mock res that captures status + json calls
const buildRes = () => {
  const res = {
    _status: null,
    _body: null,
    _cookies: {},
    status(code) {
      this._status = code;
      return this;
    },
    json(body) {
      this._body = body;
      return this;
    },
    cookie(name, value) {
      this._cookies[name] = value;
      return this;
    },
  };
  return res;
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('controllerUsers.register()', () => {
  test('1. valid data → responds with 201 and returns token + refreshToken in body', async () => {
    // Arrange
    modelUser.findOne = jest.fn().mockResolvedValueOnce(null); // no existing user
    modelUser.create = jest.fn().mockResolvedValueOnce({
      _id: 'new-user-id',
      save: jest.fn().mockResolvedValue(undefined),
    });
    createApiKey.mockResolvedValueOnce({});
    createToken.mockResolvedValueOnce('mock-access-token');
    createRefreshToken.mockResolvedValueOnce('mock-refresh-token');

    const req = {
      body: {
        fullName: 'Nguyen Van A',
        email: 'vana@example.com',
        password: 'Password123!',
        phone: '0909123456',
      },
    };
    const res = buildRes();

    // Act
    await controller.register(req, res);

    // Assert
    expect(res._status).toBe(201);
    expect(res._body).toMatchObject({
      metadata: {
        token: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
      },
    });
  });

  test('2. missing required fields → throws BadRequestError "Vui lòng nhập đày đủ thông tin"', async () => {
    const req = {
      body: {
        fullName: 'Nguyen Van A',
        // email missing
        password: 'Password123!',
        phone: '0909123456',
      },
    };
    const res = buildRes();

    await expect(controller.register(req, res)).rejects.toThrow(
      'Vui lòng nhập đày đủ thông tin'
    );
  });

  test('3. email already exists → throws BadRequestError "Người dùng đã tồn tại"', async () => {
    // Simulate existing user in DB
    modelUser.findOne = jest.fn().mockResolvedValueOnce({
      _id: 'existing-user',
      email: 'vana@example.com',
    });

    const req = {
      body: {
        fullName: 'Nguyen Van A',
        email: 'vana@example.com',
        password: 'Password123!',
        phone: '0909123456',
      },
    };
    const res = buildRes();

    await expect(controller.register(req, res)).rejects.toThrow(
      'Người dùng đã tồn tại'
    );
  });
});
