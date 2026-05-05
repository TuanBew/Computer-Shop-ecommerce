// TST-G1: Selenium E2E — Authentication flows (mirrors Playwright auth.spec.js)
// Requires: docker compose up -d AND chromedriver matching installed Chrome
//
// Why both Playwright AND Selenium?
// Playwright: modern, fast, auto-wait, built-in network mocking
// Selenium: enterprise standard, appears in ~70% of QA job descriptions,
//   proves the critical flows work regardless of automation framework.
// If they disagree, that disagreement is a finding to investigate.
//
// Run: node tests/e2e/selenium/auth.selenium.test.js

const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const LoginPage = require('./pageObjects/LoginPage');

async function runTests() {
  const options = new chrome.Options();
  options.addArguments('--headless', '--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu');

  let driver;
  let passed = 0;
  let failed = 0;

  try {
    driver = await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(options)
      .build();

    console.log('\n=== Selenium Auth Tests ===\n');

    // -----------------------------------------------------------------------
    // TEST 1: Login page loads
    // -----------------------------------------------------------------------
    try {
      const loginPage = new LoginPage(driver);
      await loginPage.navigate();
      const emailInput = await driver.findElement(By.css('input[type="email"], input[name="email"]'));
      if (await emailInput.isDisplayed()) {
        console.log('✅ TEST 1: Login page loads and shows email input');
        passed++;
      } else {
        throw new Error('Email input not visible');
      }
    } catch (err) {
      console.log(`❌ TEST 1: Login page loads — ${err.message}`);
      failed++;
    }

    // -----------------------------------------------------------------------
    // TEST 2: Wrong credentials show error
    // -----------------------------------------------------------------------
    try {
      const loginPage = new LoginPage(driver);
      await loginPage.navigate();
      await loginPage.fillEmail('invalid@example.com');
      await loginPage.fillPassword('wrongpassword');
      await loginPage.submit();

      await driver.sleep(2000); // Wait for API response

      // Check for error indicator (Ant Design message or inline error)
      const errorEls = await driver.findElements(
        By.css('.ant-message-error, .ant-message-notice, [class*="error" i]')
      );
      if (errorEls.length > 0) {
        console.log('✅ TEST 2: Wrong credentials show error message');
        passed++;
      } else {
        // Check if we're still on login page (didn't redirect to home)
        const url = await driver.getCurrentUrl();
        if (url.includes('login')) {
          console.log('✅ TEST 2: Wrong credentials — stayed on login page (no redirect)');
          passed++;
        } else {
          throw new Error('No error displayed and not on login page');
        }
      }
    } catch (err) {
      console.log(`❌ TEST 2: Wrong credentials — ${err.message}`);
      failed++;
    }

    // -----------------------------------------------------------------------
    // TEST 3 (SKIP): Full login flow — blocked by BUG-001 (secure:true cookie)
    // -----------------------------------------------------------------------
    console.log('⏭️  TEST 3: Full login → home redirect — SKIPPED (BUG-001: secure:true cookie on HTTP)');
    console.log('    Fix: Change cookie options to: secure: process.env.NODE_ENV === "production"');

  } catch (setupErr) {
    console.error('\n❌ SELENIUM SETUP FAILED:', setupErr.message);
    console.log('This likely means:');
    console.log('  1. The app is not running (run: docker compose up -d)');
    console.log('  2. ChromeDriver is not installed or mismatched version');
    console.log('  3. Chrome binary not found in PATH');
    failed++;
  } finally {
    if (driver) await driver.quit();
  }

  console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
  if (failed > 0) process.exit(1);
}

runTests().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
