'use strict';

/**
 * TST-B5: Gemini service mock unit tests
 * Tests askQuestion from server/src/utils/Chatbot.js
 *
 * Strategy:
 * - Mock '@google/generative-ai' entirely so no real API calls are made
 * - Mock '../models/products.model' to return controllable product data
 */

// ── Mock @google/generative-ai ────────────────────────────────────────────────
const mockGenerateContent = jest.fn();

jest.mock('@google/generative-ai', () => {
  return {
    GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
      getGenerativeModel: jest.fn().mockReturnValue({
        generateContent: mockGenerateContent,
      }),
    })),
  };
});

// ── Mock products model ────────────────────────────────────────────────────────
jest.mock('../../src/models/products.model');
const modelProduct = require('../../src/models/products.model');

// Sample products used across tests
const sampleProducts = [
  {
    name: 'Laptop Gaming ABC',
    price: 25000000,
    priceDiscount: 23000000,
    cpu: 'Intel Core i7-12700H',
    screen: '15.6 inches',
    screenHz: '144Hz',
    gpu: 'NVIDIA RTX 3060',
    ram: '16GB DDR5',
    storage: '512GB NVMe SSD',
    battery: '80Wh',
    camera: '720p HD',
    weight: '2.2 kg',
    stock: 5,
  },
  {
    name: 'MacBook Pro M3',
    price: 45000000,
    priceDiscount: null,
    cpu: 'Apple M3',
    screen: '14 inches',
    screenHz: '120Hz',
    gpu: 'Apple M3 GPU',
    ram: '18GB Unified',
    storage: '512GB SSD',
    battery: '72Wh',
    camera: '1080p FaceTime HD',
    weight: '1.6 kg',
    stock: 10,
  },
];

beforeEach(() => {
  jest.clearAllMocks();
  modelProduct.find = jest.fn().mockResolvedValue(sampleProducts);
});

// Re-require Chatbot after mocks are in place
// Use jest.isolateModules to get a fresh module each test block
let askQuestion;
beforeAll(() => {
  // Load the module once — mocks are hoisted before any require
  askQuestion = require('../../src/utils/Chatbot').askQuestion;
});

describe('askQuestion (Chatbot.js)', () => {
  test('1. returns a string when Gemini responds successfully', async () => {
    mockGenerateContent.mockResolvedValueOnce({
      response: {
        text: () => 'Tôi khuyên bạn nên chọn Laptop Gaming ABC vì...',
      },
    });

    const result = await askQuestion('Tôi cần laptop cho gaming');

    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  test('2. prompt passed to Gemini includes product names from DB', async () => {
    let capturedPrompt = '';
    mockGenerateContent.mockImplementationOnce((prompt) => {
      capturedPrompt = prompt;
      return Promise.resolve({
        response: { text: () => 'Đây là tư vấn của tôi...' },
      });
    });

    await askQuestion('Laptop nào tốt cho lập trình?');

    expect(capturedPrompt).toContain('Laptop Gaming ABC');
    expect(capturedPrompt).toContain('MacBook Pro M3');
  });

  test('3. handles Gemini error gracefully, returns Vietnamese error message', async () => {
    mockGenerateContent.mockRejectedValueOnce(new Error('Gemini API quota exceeded'));

    const result = await askQuestion('Câu hỏi nào đó');

    expect(typeof result).toBe('string');
    expect(result).toContain('Xin lỗi');
  });
});
