const bcrypt = require('bcrypt');

const userFactory = (overrides = {}) => ({
  fullName: 'Test User',
  email: `test_${Date.now()}@example.com`,
  password: 'password123',
  phone: '0909000000',
  typeLogin: 'email',
  isAdmin: false,
  isActive: true,
  ...overrides,
});

const adminFactory = (overrides = {}) => userFactory({
  fullName: 'Admin Test',
  email: `admin_${Date.now()}@example.com`,
  isAdmin: true,
  isActive: true,
  ...overrides,
});

const productFactory = (overrides = {}) => ({
  name: 'Test Laptop',
  price: 20000000,
  priceDiscount: 0,
  images: ['http://localhost:3000/uploads/images/test.webp'],
  stock: 100,
  cpu: 'Intel Core i7',
  screen: '15.6 inches',
  gpu: 'NVIDIA GTX 1650',
  storage: '512GB SSD',
  screenHz: '144Hz',
  ram: '16GB DDR4',
  battery: '56Wh',
  camera: '720p HD',
  weight: '1.8 kg',
  ...overrides,
});

module.exports = { userFactory, adminFactory, productFactory };
