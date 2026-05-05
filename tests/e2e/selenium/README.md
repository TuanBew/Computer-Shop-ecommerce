# Selenium E2E Tests

## Why Selenium alongside Playwright?

Playwright is the modern choice for new projects. Selenium appears in ~70% of QA job descriptions and dominates enterprise testing. Having both proves:

1. The critical flows pass regardless of the automation framework
2. If Playwright and Selenium disagree — that disagreement **is itself a finding** worth investigating
3. The test engineer understands dual-framework discipline

## Prerequisites

1. Chrome browser installed
2. ChromeDriver matching your Chrome version (download from https://chromedriver.chromium.org/downloads or use `npm install chromedriver`)
3. App running: `docker compose up -d`

## Run

```bash
# Individual test files
node tests/e2e/selenium/auth.selenium.test.js
node tests/e2e/selenium/products.selenium.test.js
```

## Architecture: Page Object Model

```
tests/e2e/selenium/
├── pageObjects/
│   ├── LoginPage.js     — login form interactions
│   └── HomePage.js      — homepage interactions
├── auth.selenium.test.js     — TST-G1: auth flows
├── products.selenium.test.js — TST-G2: product listing
└── README.md
```

## Known limitation: BUG-001

Tests requiring authenticated state (admin product creation, checkout) are skipped due to BUG-001: the server sets cookies with `secure: true` which browsers will not store over HTTP. Both Playwright and Selenium tests document this skip with the same reason, demonstrating consistent test design.

Fix (not applied — per spec, no refactoring of app code):
```js
// server/src/controllers/users.controller.js
res.cookie('token', token, {
  secure: process.env.NODE_ENV === 'production', // was: secure: true
  ...
});
```
