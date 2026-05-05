# Computer Shop E-commerce (MERN)

![CI](https://github.com/TuanBew/Computer-Shop-ecommerce/actions/workflows/test.yml/badge.svg?branch=feature/testing-suite)

Full-stack e-commerce application for selling computers & accessories. Includes authentication (local + Google OAuth), product browsing/search, cart & ordering, multiple payment methods, and an AI chatbot + AI product comparison powered by Google Gemini.

## Repo Structure

- `client/` — React + Vite frontend (port **5173**)
- `server/` — Node.js + Express API (port **3000**)
- `docker-compose.yml` — runs client, server, MongoDB, and DB seeding
- `setup-database.js` — seeds MongoDB (admin account + sample products)
- `Dockerfile.setup` — container used to run the seeding script

## Tech Stack

### Frontend
- React 18 (Vite)
- Ant Design
- SCSS
- Axios

### Backend
- Node.js, Express
- MongoDB (Mongoose)
- JWT auth (access + refresh, RSA keypairs)
- Google OAuth (also used for email/OTP via Gmail OAuth)
- Google Gemini (`@google/generative-ai`) for:
  - Chatbot (`/chat`)
  - Product comparison (`/compare-product`)

### Payments
- MOMO
- VNPAY
- Cash on Delivery (COD)

### Testing
- **Jest** — backend unit and integration tests
- **Vitest + React Testing Library** — frontend unit tests
- **Supertest** — HTTP integration testing against Express
- **mongodb-memory-server** — isolated in-memory MongoDB for integration tests
- **Playwright** — E2E browser automation (5 scenarios)
- **Selenium WebDriver** — E2E cross-framework verification (2–3 scenarios)
- **Postman / Newman** — API contract tests (all endpoints)
- **ESLint** — static analysis

## Getting Started

### Prerequisites
- Node.js (recommended: 18+)
- npm
- Docker + Docker Compose (recommended for easiest setup)
- (Optional) MongoDB if running without Docker

---

##Docker

From the repository root:

```bash
docker compose build
docker compose up -d
```

Services started by `docker-compose.yml`:
- MongoDB: `localhost:27017`
- Server: `http://localhost:3000`
- Client: `http://localhost:5173`
- `mongo-setup`: runs once to seed the database

Stop everything:

```bash
docker compose down
```

View logs:

```bash
docker compose logs
docker compose logs server
docker compose logs client
```

## Environment Variables

### Server (`server/.env`)
Create a file at `server/.env`:

```env
# Database
CONNECT_DB=mongodb://localhost:27017/computer-shop

# JWT
JWT_SECRET=your_jwt_secret_key
JWT_REFRESH_SECRET=your_jwt_refresh_secret_key

# Google OAuth (used for login and for sending email via Gmail OAuth)
CLIENT_ID=your_google_client_id
CLIENT_SECRET=your_google_client_secret
REDIRECT_URI=http://localhost:3000/auth/google/callback
REFRESH_TOKEN=your_google_refresh_token

# Email (sender address for forgot-password OTP)
USER_EMAIL=your_email@gmail.com

# Gemini AI
API_KEY_GEMINI=your_gemini_api_key

# CORS
CLIENT_URL=http://localhost:5173
```

> Notes:
> - Docker Compose sets `CONNECT_DB=mongodb://mongo:27017/computer-shop` automatically for the `server` container.
> - `setup-database.js` loads env from `./server/.env` when executed.

### Client (`client/.env`)
Create a file at `client/.env`:

```env
VITE_API_URL=http://localhost:3000
VITE_CLIENT_ID=your_google_client_id
VITE_SECRET_CRYPTO=your_crypto_secret
```

---

## Demo Account (Seeded)

After the seed script runs, you can login with:

**Admin**
- Admin page: `http://localhost:5173/admin`
- Email: `admin@computershop.com`
- Password: `admin123`

---

## API (Quick Reference)

- `POST /chat`
  - Body: `{ "question": "..." }`
  - Returns: Gemini-generated Vietnamese consultation text

- `POST /compare-product`
  - Body: `{ "productId1": "...", "productId2": "..." }`
  - Returns: Gemini-generated HTML comparison

---

## Testing

The project has a full automated testing suite (50+ tests) spanning unit, integration, API contract, and end-to-end layers. See [`docs/testing/TEST-STRATEGY.md`](docs/testing/TEST-STRATEGY.md) for the full strategy and [`docs/testing/BUG-FINDINGS.md`](docs/testing/BUG-FINDINGS.md) for bugs discovered during test development.

### Quick-Start Commands

```bash
# Backend unit tests (24 tests)
cd server && npm test

# Backend integration tests (~10 tests)
cd server && npm run test:integration

# Frontend unit tests (~6 tests)
cd client && npm test

# E2E tests (requires app running via docker compose up)
npx playwright test

# Run all unit + integration tests from the repo root
npm run test:all
```

### Test Documentation

| Document | Description |
|---|---|
| [`docs/testing/TEST-STRATEGY.md`](docs/testing/TEST-STRATEGY.md) | Full test strategy: pyramid, scope, tools, mocking strategy, CI plan |
| [`docs/testing/BUG-FINDINGS.md`](docs/testing/BUG-FINDINGS.md) | 5 bugs found during testing (2 security, 2 functional, 1 code quality) |
| [`docs/testing/TEST-CASES.md`](docs/testing/TEST-CASES.md) | 15 manual test cases with EP/BVA/decision table techniques |
| [`docs/testing/DEMO-CHEAT-SHEET.md`](docs/testing/DEMO-CHEAT-SHEET.md) | Interview walkthrough guide and Q&A preparation |

### CI Pipeline

Three GitHub Actions jobs run on every pull request to `main`:

1. **lint-and-unit** — ESLint + Jest unit tests + Vitest unit tests (~1–2 min)
2. **integration** — Jest integration tests + Newman API contract tests (~2–3 min)
3. **e2e** — Full stack via Docker + Playwright (~5–8 min)

---

## Troubleshooting

- **Client can’t call API / CORS errors**  
  Ensure `CLIENT_URL=http://localhost:5173` in `server/.env` (or compose env) and restart the server.

- **Mongo connection fails**  
  Confirm MongoDB is running and `CONNECT_DB` is correct (Docker uses `mongo`, local uses `localhost`).

- **Login cookies not being set in local dev**  
  Your server sets cookies with `secure: true` (HTTPS-only). In HTTP local development, cookies may not be stored by the browser. Consider adjusting cookie settings for local dev if needed.

---
