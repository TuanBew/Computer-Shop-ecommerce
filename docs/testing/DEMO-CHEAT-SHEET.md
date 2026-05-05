# Interview Demo Cheat Sheet

Read this the morning of your interview. You don't need to memorize it word-for-word — just read it through once, then again while you have your laptop open with the project running. The goal is to feel like you already had this conversation once before.

---

## The 30-Second Elevator Pitch

Use this when they say "tell me about a project you've worked on":

> "I built a full-stack MERN e-commerce application for selling computers and accessories — it has local and Google authentication, three payment gateways, and an AI chatbot powered by Google Gemini. After building it, I added a complete testing lifecycle from zero tests up to 50+ automated tests covering the full pyramid: unit tests, integration tests, API contract tests, and end-to-end tests with both Playwright and Selenium. I also set up a three-job GitHub Actions CI pipeline. Along the way I found and documented five real bugs, including a security vulnerability in the JWT verification flow where the server was trusting an unverified token payload to decide which public key to use — which is a key-selection attack vector."

That last sentence usually makes them lean in. Be ready for a follow-up.

---

## Numbers to Have Ready

Memorize these so you don't hesitate when asked:

- **Total automated tests**: 50+
  - Backend unit tests: 24 (Jest)
  - Frontend unit tests: ~6 (Vitest + RTL)
  - Integration tests: ~10 (Jest + supertest + mongodb-memory-server)
  - E2E Playwright: 5 scenarios
  - E2E Selenium: 2–3 scenarios
- **Bugs found**: 5 total — 2 security (P1), 2 functional (P1/P2), 1 code quality (P2)
- **CI jobs**: 3 (lint + unit → integration → E2E)
- **Test types**: Unit, Integration, API Contract (Postman/Newman), E2E (Playwright + Selenium)
- **Backend unit coverage**: ~60%+ on tested modules
- **Locales tested**: Vietnamese (chatbot response content and error messages)
- **Manual test cases written**: 15 (with EP/BVA/decision table techniques)

---

## 5-Minute Walkthrough Order

Do this in this exact order — each step flows naturally into the next:

**1. README.md (30 seconds)**
Open the repo root. Point to the CI badge at the top. Scroll to the Testing section — show the quick-start commands. Say: "The README is the entry point for any developer joining the project. They can run `cd server && npm test` and immediately see what's passing."

**2. TEST-STRATEGY.md (60 seconds)**
Open `docs/testing/TEST-STRATEGY.md`. Read the Executive Summary aloud — it's short (5 sentences), so reading it word-for-word is fine. Then point to the ASCII test pyramid. Say: "I used a risk-based approach — P0 tests are auth and payment flows because any failure there has immediate revenue impact. The pyramid shape ensures I have the most tests at the bottom where they're fastest and cheapest to run."

**3. BUG-FINDINGS.md (90 seconds)**
Open `docs/testing/BUG-FINDINGS.md`. Go straight to BUG-004. Say: "This is the one I'm most proud of finding." Read the title aloud: "verifyToken trusts unverified JWT payload to select the signing public key." Then explain it in one sentence: "The server was calling `jwtDecode` — which does zero cryptographic verification — to get a userId from the token payload, and then using that unverified userId to look up the RSA public key in the database. So an attacker partially controls key selection before any verification happens." Pause. Let that land. Then mention BUG-002 briefly: "I also found a hardcoded JWT secret — the string `'123456'` — used for the OTP reset flow, committed right in the source code."

**4. Run tests live (60 seconds)**
Open a terminal. Run `cd server && npm test`. While it runs, say: "These are the 24 backend unit tests — they cover the auth middleware, bcrypt password hashing, input validation, controller logic with mocked DB calls, and the Gemini service with a mocked AI response." When it finishes green, point to the count. If something fails (unlikely but possible), stay calm: "That's actually fine — a failing test is doing its job. Let me show you what it's telling us."

**5. Show one integration test file (45 seconds)**
Open `server/tests/integration/auth.test.js` (or equivalent). Point to the `beforeAll` / `afterAll` hooks. Say: "I'm using `mongodb-memory-server` here — each test suite spins up a fresh in-memory MongoDB instance. No shared state, no cleanup scripts, no port conflicts with other developers. The database is gone the moment the test suite finishes."

**6. Show playwright.config.js (30 seconds)**
Open `playwright.config.js` at the repo root. Point to `use: { baseURL }` and the project targets. Say: "Playwright handles the E2E tests — auto-waits, network interception for mocking the Gemini API, and I can run accessibility checks with axe-core in the same flow. Five scenarios covering the critical user journeys."

**7. Show GitHub Actions workflow (30 seconds)**
Open `.github/workflows/test.yml`. Point to the three jobs. Say: "Lint and unit run first — they're fast, about 1–2 minutes. Integration runs second. E2E last because it needs the full stack up. Nothing merges to main if any job fails."

---

## Pre-Canned Q&A

These are the questions you're most likely to get. Read each answer once, then close the doc and say it in your own words. Don't recite.

---

**Q: "How did you decide what to test?"**

A: "Risk-based prioritization mapped to the test pyramid. P0 tests cover auth flows and payment paths — any failure there stops revenue. I used equivalence partitioning to group inputs into valid and invalid classes, and boundary value analysis on numeric fields like price, stock quantity, and password length. For example, with password validation I tested at 0 characters, 7 (just below the minimum), 8 (the minimum boundary), and 100 — because off-by-one errors in validation logic are one of the most common bugs. The strategy document has the full priority matrix."

---

**Q: "Tell me about a bug you found."**

A: "The most interesting one is BUG-004. The `verifyToken` function uses `jwtDecode` — which does zero signature verification, it just base64-decodes the payload — to extract a `userId` before looking up the user's RSA public key in the database. This inverts the security model: an attacker can craft a JWT with a forged `userId` in the payload, which makes the server look up a completely different user's public key for verification. Combine that with an algorithm confusion attack — where you change `RS256` to `HS256` in the header — and you potentially bypass authentication entirely. I found it during unit test development when I noticed the code was using two different JWT libraries, `jsonwebtoken` and `jwt-decode`, on the same token, which is a code smell worth investigating."

---

**Q: "How do you mock external services?"**

A: "Two layers. For backend unit and integration tests, I use `jest.mock('@google/generative-ai')` — this replaces the Gemini SDK at the module system level before any imports, so every test that needs it gets a controlled Vietnamese string back. That makes response-language assertions deterministic: I can actually assert that the chatbot returns Vietnamese text without making a real API call. For payments — MOMO and VNPAY — I use `nock` to intercept the outbound HTTP requests at the network layer. For the frontend, MSW intercepts Axios calls at the network level inside the Vitest browser environment. The rule I follow is: if it costs money, has rate limits, or requires a browser redirect, it's always mocked. No exceptions."

---

**Q: "What's the difference between Playwright and Selenium, and why did you use both?"**

A: "Playwright is the modern choice — it has auto-waits so you don't write arbitrary `sleep()` calls, built-in network interception so I can mock the Gemini API at the E2E level, parallel test execution, and native accessibility testing via axe-core. Selenium is older but it's still in 70% of QA job descriptions because most enterprise test infrastructure was built on it and migrating is expensive. Having both demonstrates breadth and proves the critical flows work regardless of the automation framework. There's also a practical benefit: if Playwright and Selenium agree that a flow works, I have much higher confidence. If they disagree, that disagreement is itself a finding — usually a browser-specific or timing-specific bug."

---

**Q: "How would you scale this to a real team?"**

A: "Three things. First, make tests a hard PR gate in CI — nothing merges with failing tests, no exceptions. Second, enforce coverage thresholds in `jest.config.js` — I'd start at 60% line coverage and raise it over time; the number matters less than the trend. Third, establish test ownership: the feature developer writes unit tests as part of the story, the QA engineer writes integration and E2E tests after acceptance. For this specific project I'd also add contract testing with Pact for the Gemini API integration — Google can change their response format without notice, and a consumer-driven contract test would catch that before it reaches production."

---

**Q: "What would you do differently in Phase 2?"**

A: "Load testing with k6 on the `/chat` endpoint — Gemini calls are expensive per request and I don't know the breaking point yet. Visual regression testing using Playwright snapshots on the product cards and admin dashboard, because those are high-visibility, frequently-changed views where a CSS change can accidentally break layout and nobody notices until a customer complains. Mutation testing with Stryker — this is the one people don't expect — to verify that my unit tests actually catch bugs and aren't just running without asserting anything meaningful. And a security scan with OWASP ZAP to systematically find injection vulnerabilities; the hardcoded JWT secret I found manually would have been caught automatically by ZAP."

---

**Q: "How do you handle flaky tests?"**

A: "I don't tolerate them. A flaky test is worse than no test because it trains the team to ignore red CI runs. The root causes are almost always one of three things: shared state between tests (fixed by clearing the database in `afterEach`), timing issues (fixed by proper `async/await` and relying on Playwright's built-in auto-waits rather than arbitrary `setTimeout`), or real external calls that sometimes fail (fixed by mocking). Adding retry logic is a bandage that hides the root cause and inflates your passing metrics. If I can't fix a test right now, I `skip` it with a comment explaining why and file a bug — it doesn't stay in the suite as a known-flaky test."

---

**Q: "What's your test data strategy?"**

A: "Factory functions that generate unique data per test: `userFactory({ email: \`test_\${Date.now()}@example.com\` })` ensures no two tests collide even when running in parallel. `mongodb-memory-server` gives each test run an isolated in-memory database — no cleanup scripts, no port conflicts, no shared state with other developers on the team. The only exception is the seeded admin account used in E2E flows, and that's reset by the Docker Compose seed script before each E2E run. No test data is ever hardcoded across multiple test files — if I need the same user in two tests, both tests create it independently."

---

## If They Ask Something You Haven't Implemented

This is your recovery script. Use it for any question that catches you off guard:

> "That's something I haven't specifically implemented yet, but here's how I'd think about it from the test pyramid. [Name which layer the problem belongs to.] At that layer, the right tool would be [name a tool]. The key risk I'd want to isolate is [name the specific thing that could go wrong]. I'd make sure whatever solution I use is deterministic — no real external calls — and adds a gate in CI so the failure is visible before it reaches production."

This works for questions about performance testing, contract testing, security scanning, visual regression — anything in Phase 2. It shows you know the framework even if you haven't executed on it yet.

---

## Potential Trick Questions

**"Your tests are mocked — aren't you just testing your mocks?"**

> "That's a fair challenge. Unit tests with mocks test that your code handles responses correctly — the interface contract. Integration tests using `mongodb-memory-server` use a real database engine with no mocking of the persistence layer, so those do test real behavior. And the E2E tests run the full stack with a real browser against a real server and real database — the only thing mocked there is the Gemini API to avoid charges and non-determinism. So there are three levels of 'realness' depending on which test layer you're looking at."

**"How do I know the test coverage number is meaningful?"**

> "Coverage tells you what code was executed during tests, not whether the tests are any good. A test that calls a function without asserting the output can give 100% line coverage and catch zero bugs. That's why I also used mutation testing concepts when reviewing the tests — asking myself: if I change this `>` to `>=` in the source, will any test fail? If not, the test isn't actually protecting that logic. Mutation testing with Stryker automates that question, which is why it's on the Phase 2 list."

**"What's the most important test in your suite?"**

> "The JWT verification test — specifically the test that verifies `verifyToken` rejects a token signed with a different key. That test directly protects against authentication bypass. If that test disappears from the suite or starts being skipped, the door is open for the BUG-004 vulnerability to be re-introduced without anyone noticing."

---

## The Night Before Checklist

- [ ] `cd server && npm test` passes (all 24 tests green)
- [ ] `cd client && npm test` passes
- [ ] `npx playwright test` can at least start (even if it needs the app running)
- [ ] `docs/testing/` folder has all 4 files visible in VS Code
- [ ] README has the CI badge and Testing section
- [ ] You can explain BUG-004 in 3 sentences without looking at the doc
- [ ] You know the number 50+ and where it comes from
- [ ] Git branch is `feature/testing-suite` and latest commit is clean
