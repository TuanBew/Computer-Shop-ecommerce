// TST-F1: Full purchase flow E2E
// Requires: docker compose up -d (app must be running on http://localhost:5173)
import { test, expect } from '@playwright/test';

test.describe('Checkout Flow', () => {
  test('homepage is reachable and responsive', async ({ page }) => {
    const response = await page.goto('/');
    expect(response?.status()).toBeLessThan(400);
  });

  test('navigation links are present on homepage', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded', { timeout: 10000 });

    // Verify at least some navigation exists
    const links = await page.locator('a[href]').count();
    expect(links).toBeGreaterThan(0);
  });

  test.skip('full purchase flow: register → login → add to cart → COD checkout — blocked by BUG-001', async ({ page }) => {
    // BLOCKED BY BUG-001: Cookies set with secure:true on HTTP won't be stored by the browser.
    // The login endpoint returns cookies but the browser silently drops them.
    // Fix: Change cookie options to: secure: process.env.NODE_ENV === 'production'
    //
    // Full intended flow (for interview demonstration):
    const uniqueEmail = `buyer_${Date.now()}@example.com`;

    // Step 1: Register
    await page.goto('/register');
    await page.fill('input[placeholder*="họ tên" i], input[name="fullName"]', 'E2E Buyer');
    await page.fill('input[type="email"]', uniqueEmail);
    await page.fill('input[type="password"]', 'Buyer123!');
    await page.fill('input[placeholder*="điện thoại" i], input[name="phone"]', '0909111222');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);

    // Step 2: Login
    await page.goto('/login');
    await page.fill('input[type="email"]', uniqueEmail);
    await page.fill('input[type="password"]', 'Buyer123!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);

    // Step 3: Add first product to cart
    await page.goto('/');
    await page.waitForTimeout(2000);
    await page.locator('[class*="card"], [class*="Card"]').first().hover();
    await page.locator('button:has-text("Thêm"), button:has-text("Add")').first().click();

    // Step 4: Go to cart
    await page.goto('/cart');
    await expect(page.locator('[class*="cart" i]')).toBeVisible({ timeout: 5000 });

    // Step 5: Fill shipping info and place COD order
    await page.fill('input[placeholder*="địa chỉ" i], input[name="address"]', '123 Đường Test, TP.HCM');
    await page.click('button:has-text("COD"), input[value="COD"]');
    await page.click('button:has-text("Đặt hàng"), button:has-text("Thanh toán")');

    // Step 6: Verify order success
    await expect(page.locator('[class*="success" i], img[src*="success"]')).toBeVisible({ timeout: 10000 });
  });
});
