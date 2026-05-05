// TST-F4: Authentication E2E flows
// Requires: docker compose up -d (app must be running on http://localhost:5173)
import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('login page loads and shows form fields', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});

    // The login form should render email and password fields
    const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i], input[placeholder*="Email" i]');
    const passwordInput = page.locator('input[type="password"]');

    await expect(emailInput.first()).toBeVisible({ timeout: 8000 });
    await expect(passwordInput.first()).toBeVisible({ timeout: 8000 });
  });

  test('shows error message with wrong credentials', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});

    await page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]').first().fill('wrong@example.com');
    await page.locator('input[type="password"]').first().fill('wrongpassword');
    await page.locator('button[type="submit"], button:has-text("Đăng nhập")').first().click();

    // Expect some error indicator — Ant Design message or inline error
    const errorLocator = page.locator('.ant-message-error, [class*="error"], [class*="Error"]');
    await expect(errorLocator.first()).toBeVisible({ timeout: 6000 });
  });

  test.skip('full register → login flow — blocked by BUG-001 (secure:true cookie on HTTP)', async ({ page }) => {
    // BUG-001: server sets cookies with secure:true which prevents browsers from storing
    // them over HTTP. This full flow requires either HTTPS or a BUG-001 fix.
    //
    // Intended flow:
    const email = `e2e_${Date.now()}@example.com`;

    await page.goto('/register');
    await page.fill('input[name="fullName"]', 'E2E Test User');
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', 'Password123!');
    await page.fill('input[name="phone"]', '0909000001');
    await page.click('button[type="submit"]');

    // After register, navigate to login
    await page.goto('/login');
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');

    // After login, should be redirected to homepage or dashboard
    await expect(page).not.toHaveURL('/login', { timeout: 5000 });
  });
});
