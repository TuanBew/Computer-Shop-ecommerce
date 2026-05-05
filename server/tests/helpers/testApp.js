// Ensure env vars needed by controllers are present in test runs
if (!process.env.SECRET_CRYPTO) process.env.SECRET_CRYPTO = 'test-secret-crypto';

// Mock Gemini globally before any require that might pull in chatbot/AICompareProduct
jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn().mockReturnValue({
      generateContent: jest.fn().mockResolvedValue({
        response: { text: () => 'Đây là tư vấn từ AI về laptop phù hợp cho bạn.' },
      }),
    }),
  })),
}));

const express = require('express');
const cookiesParser = require('cookie-parser');
const cors = require('cors');
const routes = require('../../src/routes/index');

function createTestApp() {
  const app = express();

  app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
  app.use(cookiesParser());
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  routes(app);

  // AI routes — must come after routes() registration
  const { askQuestion } = require('../../src/utils/chatbot');
  const { compareProducts } = require('../../src/utils/AICompareProduct');

  app.post('/chat', async (req, res, next) => {
    try {
      const { question } = req.body;
      const data = await askQuestion(question);
      return res.status(200).json(data);
    } catch (err) {
      next(err);
    }
  });

  app.post('/compare-product', async (req, res, next) => {
    try {
      const { productId1, productId2 } = req.body;
      const data = await compareProducts(productId1, productId2);
      return res.status(200).json(data);
    } catch (err) {
      next(err);
    }
  });

  // Centralised error handler
  app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
      success: false,
      message: err.message || 'Lỗi server',
    });
  });

  return app;
}

module.exports = { createTestApp };
