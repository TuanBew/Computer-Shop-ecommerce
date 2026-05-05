// Seeded admin credentials from setup-database.js (documented in README — not a real secret)
const ADMIN_CREDENTIALS = {
  email: 'admin@computershop.com',
  password: 'admin123',
};

const TEST_PRODUCT = {
  name: 'Laptop Test Model',
  price: 15000000,
  priceDiscount: 12000000,
  stock: 50,
};

module.exports = { ADMIN_CREDENTIALS, TEST_PRODUCT };
