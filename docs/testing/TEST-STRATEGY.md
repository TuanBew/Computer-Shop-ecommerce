# Test Strategy — Computer Shop (MERN E-Commerce)

## 1. Executive Summary

Computer Shop is a full-stack MERN e-commerce application with cookie-based JWT authentication (RSA keypairs), three payment gateways (MOMO, VNPAY, COD), and AI features powered by Google Gemini. This strategy covers automated testing from unit through end-to-end, plus static analysis and API contract testing — roughly 50+ automated tests in total. Areas explicitly out of scope for this phase include load testing, visual regression, and penetration testing; these are tracked as Phase 2 items. The approach is risk-based: authentication, payment, and security-sensitive code is tested first and most thoroughly, because a failure in any of those areas has immediate user or revenue impact.

---

## 2. Test Pyramid

```
                         ┌──────────────────────────────────┐
                         │   E2E Tests (7–8 scenarios)      │
                         │   Playwright + Selenium          │
                         │   Real browser, full stack       │
                         └──────────────────────────────────┘
                    ┌─────────────────────────────────────────────┐
                    │  API / Integration Tests (10+)              │
                    │  Jest + supertest + in-memory Mongo         │
                    │  Mocks for Gemini / payments / OAuth        │
                    └─────────────────────────────────────────────┘
                ┌────────────────────────────────────────────────────┐
                │  Unit Tests (30+)                                  │
                │  Backend: Jest  |  Frontend: Vitest + RTL         │
                │  Pure functions, controllers (mocked),            │
                │  components, hooks, validators                    │
                └────────────────────────────────────────────────────┘
                ┌────────────────────────────────────────────────────┐
                │  API Contract Tests (Postman / Newman)             │
                │  Static Analysis (ESLint)                         │
                └────────────────────────────────────────────────────┘
```

The pyramid intentionally has the most tests at the bottom (fast, cheap, isolated) and the fewest at the top (slow, expensive, full-stack). Each layer acts as a safety net for the one above it: if a unit test catches a broken validation function, we don't waste an E2E run finding it.

---

## 3. Scope

### P0 — Must Test (revenue or security impact if broken)
- User registration and login (local + Google OAuth)
- JWT issuance, refresh, and verification (including the RSA keypair flow)
- Cookie security attributes (`secure`, `httpOnly`, `sameSite`)
- Payment initiation and callback handling (MOMO, VNPAY, COD)
- Add-to-cart and checkout flow
- Admin authentication guard (routes must reject non-admins)

### P1 — Should Test (significant UX or data integrity impact)
- OTP forgot-password flow
- Product CRUD (admin: add, edit, delete)
- Product search and filter
- Cart quantity boundary conditions (stock limits)
- AI chatbot endpoint (Gemini mock; Vietnamese response format)
- AI product comparison endpoint
- Order status transitions
- Input validation on all forms

### P2 — Nice to Test (lower risk, but good coverage signal)
- Profile update (name, address, avatar)
- Pagination on product listing
- Accessibility of key pages (WCAG 2.1 AA)
- Error boundary / 404 page rendering
- Response time on search endpoint (basic smoke, not load)

### Out of Scope (Phase 2)
- Load / performance testing (k6)
- Visual regression (pixel-diff snapshots)
- Mutation testing (Stryker)
- Full penetration testing (OWASP ZAP)
- Full accessibility audit (axe-core scan of all pages)

---

## 4. Test Type Breakdown

| Layer | Tool | Why | Example Test Name | Target Count |
|---|---|---|---|---|
| Backend Unit | Jest | Fast, zero I/O, great mocking | `should return 401 when token is missing` | 24 |
| Frontend Unit | Vitest + RTL | Matches Vite build toolchain; RTL tests behavior, not implementation | `should display error when password is too short` | ~6 |
| Integration (API) | Jest + supertest + mongodb-memory-server | Tests real Express routing + Mongoose against an isolated in-memory DB | `POST /api/login returns access token for valid credentials` | ~10 |
| API Contract | Postman / Newman | Documents every endpoint; runnable in CI without a browser | `GET /api/products returns array with expected shape` | All routes |
| E2E | Playwright | Auto-waits, network interception, accessibility via axe-core, parallel execution | `user can register, add to cart, and checkout with COD` | 5 |
| E2E | Selenium | Industry-standard; proves critical flows work across automation frameworks | `login flow succeeds and redirects to homepage` | 2–3 |
| Static Analysis | ESLint | Catches bugs and style drift without running code | — | All `.js/.jsx` |

---

## 5. Test Data Strategy

**Isolation first.** Every backend test suite spins up a fresh `mongodb-memory-server` instance. There is no shared database, no cleanup scripts, and no risk of test order dependency.

**Factory functions.** Test data is generated through factory helpers rather than hardcoded literals:

```js
// Example factory — generates unique data per call
const userFactory = (overrides = {}) => ({
  name: 'Test User',
  email: `test_${Date.now()}@example.com`,
  password: 'Password123!',
  ...overrides,
});
```

Using `Date.now()` in email addresses ensures no two parallel test runs collide, even when the in-memory DB is shared within a single process.

**Seeded fixtures.** The single exception is the admin account used in E2E tests (`admin@computershop.com / admin123`). This is reset by the Docker Compose seed script before each E2E run. All other E2E accounts are created at the start of the test and cleaned up (or the whole DB is wiped) at the end.

**No production data.** No real email addresses, no real payment credentials, no real API keys are ever used in test runs. Gemini, MOMO, and VNPAY are always mocked.

---

## 6. Mocking Strategy

| External Service | Mock Tool | Notes |
|---|---|---|
| Google Gemini (`@google/generative-ai`) | `jest.mock()` (backend unit/integration) | Replaced at module level; returns a hardcoded Vietnamese string so response-language assertions are deterministic |
| Google Gemini (E2E) | Playwright `route.fulfill()` | Intercepts the outbound HTTP request; no real API key needed in CI |
| MOMO payment | `nock` (HTTP interceptor) | Mocks the MOMO API response for both initiation and IPN callback |
| VNPAY payment | `nock` | Same pattern as MOMO |
| Google OAuth | `jest.mock()` + fixture tokens | Unit/integration tests bypass the OAuth redirect flow entirely |
| Nodemailer / Gmail OAuth | `jest.mock()` | OTP email calls are mocked; tests verify the JWT is created correctly, not that email was delivered |
| Frontend API calls | MSW (Mock Service Worker) | Intercepts Axios calls at the network layer in Vitest browser environment |

The governing principle: **if it costs money, has rate limits, or requires browser redirects, it is always mocked.**

---

## 7. Environment Matrix

| Aspect | Local Dev | CI (GitHub Actions) |
|---|---|---|
| MongoDB | `mongodb-memory-server` (unit/integration) or Docker | `mongodb-memory-server` (no Docker needed) |
| Browser (E2E) | Chromium (headed, local Playwright) | Chromium headless (Playwright in CI) |
| Selenium | Local ChromeDriver | `selenium/standalone-chrome` Docker image |
| External APIs | All mocked | All mocked |
| `.env` secrets | `server/.env` file (gitignored) | GitHub Actions Secrets → env vars |
| Node version | 18+ | Node 18 (pinned in `actions/setup-node`) |
| Coverage report | Terminal output | Uploaded as Actions artifact |

---

## 8. Test Naming Convention

All tests follow the `describe` / `it('should ... when ...')` pattern:

```js
describe('POST /api/login', () => {
  it('should return 200 and set auth cookie when credentials are valid', async () => { ... });
  it('should return 401 when password is incorrect', async () => { ... });
  it('should return 400 when email field is missing', async () => { ... });
});
```

Rules:
- `describe` = feature or route being tested
- `it` = one concrete behavior, written from the user/caller's perspective
- No `it('works')` or `it('test 1')` — each name must be self-documenting
- Test file names mirror source file names: `users.controller.js` → `users.controller.test.js`

---

## 9. CI/CD Plan

Three jobs run on every pull request targeting `main`. Each job must pass before the PR can be merged.

```
┌─────────────────────────────────────┐
│  Job 1: lint-and-unit               │
│  Trigger: push / PR to main         │
│  Steps:                             │
│    - ESLint (client + server)       │
│    - Jest unit tests (server)       │
│    - Vitest unit tests (client)     │
│  Duration: ~1–2 min                 │
└─────────────────────────────────────┘
          ↓ (on success)
┌─────────────────────────────────────┐
│  Job 2: integration                 │
│  Steps:                             │
│    - Jest integration tests         │
│      (supertest + memory Mongo)     │
│    - Newman / Postman collection    │
│  Duration: ~2–3 min                 │
└─────────────────────────────────────┘
          ↓ (on success)
┌─────────────────────────────────────┐
│  Job 3: e2e                         │
│  Steps:                             │
│    - docker compose up (app + DB)   │
│    - Playwright test --reporter=ci  │
│    - Upload trace artifacts         │
│  Duration: ~5–8 min                 │
└─────────────────────────────────────┘
```

Workflow file: `.github/workflows/test.yml`
Badge: `![CI](https://github.com/TuanBew/Computer-Shop-ecommerce/actions/workflows/test.yml/badge.svg?branch=feature/testing-suite)`

Coverage threshold (enforced in `jest.config.js`):
- Lines: 60% minimum on tested modules
- Branches: 50% minimum

---

## 10. Bug Reporting Workflow

When a test fails for a reason that reveals a code defect (not a test error), it is documented in `docs/testing/BUG-FINDINGS.md` using the standard template:

1. Assign a `BUG-XXX` ID (incrementing)
2. Set severity: P0 (system down) / P1 (security or data loss) / P2 (functional regression) / P3 (cosmetic)
3. Record the affected file and line number
4. Write reproduction steps that a developer who didn't find the bug can follow
5. Propose a fix — at minimum a description; ideally a code snippet
6. Record where it was found: unit test, integration test, or code review

All bugs discovered during this testing engagement are documented in [BUG-FINDINGS.md](./BUG-FINDINGS.md). **5 bugs were found**, including 2 security issues.

---

## 11. Phase 2 Items

These are not currently implemented but are explicitly planned:

| Item | Tool | Why / When |
|---|---|---|
| Load testing | k6 | The `/chat` (Gemini) endpoint is the most expensive call per request. Load test before any production launch to find the breaking point. |
| Visual regression | Playwright snapshots | Product cards and the admin dashboard change frequently. Snapshot tests catch unintended visual changes without a full design review. |
| Mutation testing | Stryker | Verifies that unit tests actually detect bugs — not just that they run without throwing. Run once per sprint to measure test suite quality. |
| Penetration testing | OWASP ZAP | Automated DAST scan to catch injection vulnerabilities, insecure headers, and exposed sensitive data. Would have automatically caught BUG-002 (hardcoded secret). |
| Full accessibility audit | axe-core (all pages) | Current E2E tests spot-check accessibility on two pages. A full audit would cover every route against WCAG 2.1 AA. |
| Contract testing | Pact | The Gemini API response format is not under our control. A consumer-driven contract test would alert us if Google changes the response shape. |
