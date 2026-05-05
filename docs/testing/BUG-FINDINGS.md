# Bug Findings — Computer Shop Testing Engagement

Bugs documented here were discovered during unit test development, integration test development, and code review. All bugs were found on branch `feature/testing-suite` against the codebase as of May 2026.

**Summary: 5 bugs found — 2 security (P1), 2 functional (P1/P2), 1 code quality (P2)**

| ID | Title | Severity | Type | Status |
|---|---|---|---|---|
| BUG-001 | `secure: true` cookies break local HTTP dev | P1 | Functional / Configuration | Open |
| BUG-002 | OTP JWT signed with hardcoded secret `"123456"` | P1 | Security | Open |
| BUG-003 | `loginGoogle` method defined twice in controller | P2 | Code Quality | Open |
| BUG-004 | `verifyToken` trusts unverified JWT payload to choose public key | P1 | Security | Open |
| BUG-005 | Cart refund uses `product.price` but charge uses `priceDiscount` | P2 | Functional | Open |

---

## BUG-001: `secure: true` Cookies Break Local HTTP Development

- **Severity**: P1
- **Type**: Functional / Configuration
- **Affected File(s)**: `server/src/controllers/users.controller.js` (lines 48–68, 96–116, and every other `res.cookie()` call in the file)
- **Repro Steps**:
  1. Clone the repo and start the server locally without HTTPS (i.e., `node server/src/index.js` or `docker compose up`)
  2. Open `http://localhost:5173` in Chrome or Firefox
  3. Attempt to log in with `admin@computershop.com` / `admin123`
  4. Open DevTools → Application → Cookies → `http://localhost:5173`
  5. Observe that no `accessToken` or `refreshToken` cookies are present
  6. All subsequent authenticated API calls return `401 Unauthorized`
- **Expected Behavior**: Login succeeds in local HTTP development. Cookies are stored by the browser and sent with subsequent requests.
- **Actual Behavior**: The browser silently drops all cookies because they are flagged `Secure` but served over plain HTTP. The user sees a blank/unauthorized state even after a successful login request.
- **Suggested Fix**:

  Change every `res.cookie()` call from:
  ```js
  res.cookie('accessToken', token, {
    httpOnly: true,
    secure: true,       // ← always HTTPS-only, breaks local dev
    sameSite: 'Strict',
  });
  ```
  To:
  ```js
  res.cookie('accessToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',  // ← HTTPS in prod, HTTP ok in dev
    sameSite: process.env.NODE_ENV === 'production' ? 'Strict' : 'Lax',
  });
  ```
  Also add `NODE_ENV=production` to the production deployment environment and `NODE_ENV=development` (or omit it) in `server/.env` for local dev.

- **Found During**: Code review while writing the auth integration test — the test was using supertest over HTTP and cookies were not being propagated between requests.

---

## BUG-002: OTP JWT Signed with Hardcoded Secret `"123456"`

- **Severity**: P1
- **Type**: Security
- **Affected File(s)**: `server/src/controllers/users.controller.js` (line 446)
- **Repro Steps**:
  1. Read `server/src/controllers/users.controller.js` line 446
  2. Observe: `jwt.sign({ email: user.email }, "123456", { expiresIn: '5m' })`
  3. The string `"123456"` is a literal in the source code — it is committed to git history and visible to anyone with repo access
  4. An attacker with read access to the repo (or any git history dump) can forge OTP reset tokens for any email address:
     ```js
     const jwt = require('jsonwebtoken');
     const forgedToken = jwt.sign({ email: 'victim@example.com' }, '123456', { expiresIn: '5m' });
     // Submit forgedToken to POST /api/reset-password → password reset succeeds
     ```
- **Expected Behavior**: The OTP JWT is signed with a strong secret loaded from an environment variable, never hardcoded in source. The secret is not in git history.
- **Actual Behavior**: The JWT is signed with the literal string `"123456"`. Any attacker who can read the source code can mint valid OTP tokens for arbitrary email addresses, enabling account takeover on any registered user account including admin.
- **Suggested Fix**:

  Replace the hardcoded secret:
  ```js
  // Before (VULNERABLE)
  jwt.sign({ email: user.email }, "123456", { expiresIn: '5m' });

  // After (SECURE)
  jwt.sign({ email: user.email }, process.env.JWT_OTP_SECRET, { expiresIn: '5m' });
  ```

  Add to `server/.env`:
  ```env
  JWT_OTP_SECRET=<random 64-character string, generated with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))">
  ```

  Add to `server/.env.example` (committed to repo):
  ```env
  JWT_OTP_SECRET=your_otp_jwt_secret_here
  ```

  Also rotate any existing OTP tokens in the database (they are likely expired at 5 min anyway, but a forced rotation is good hygiene).

- **Found During**: Unit test development. When writing a test for the forgot-password flow, the hardcoded secret was noticed while reading the controller source to understand what the token payload looked like.

---

## BUG-003: `loginGoogle` Method Defined Twice in Controller

- **Severity**: P2
- **Type**: Code Quality / Maintainability
- **Affected File(s)**: `server/src/controllers/users.controller.js` (line 124 and line 509)
- **Repro Steps**:
  1. Open `server/src/controllers/users.controller.js`
  2. Search for `loginGoogle`
  3. Find two function definitions: one at approximately line 124, another at approximately line 509
  4. The exported `module.exports` object at the bottom of the file exports the second definition (line 509), making the first one dead code
- **Expected Behavior**: Each controller method is defined exactly once. The codebase has no dead code.
- **Actual Behavior**: There are two implementations of `loginGoogle`. The first (line 124) is never called. Any bugfix or feature change applied to the first definition has zero effect. A developer unaware of the duplication might fix the wrong copy.
- **Suggested Fix**:
  1. Compare the two implementations to confirm which one is correct (the exported one at line 509 is the active one)
  2. Delete the dead definition at line 124
  3. Add an ESLint rule (`no-dupe-keys` on exports, or review exports object manually) to catch this class of mistake in future reviews
- **Found During**: Code review while tracing the Google OAuth flow to write integration tests. Searching for `loginGoogle` returned two hits.

---

## BUG-004: `verifyToken` Trusts Unverified JWT Payload to Select the Signing Public Key

- **Severity**: P1
- **Type**: Security (Authentication Bypass / Token Injection)
- **Affected File(s)**: `server/src/services/tokenSevices.js` (primary), `server/src/controllers/users.controller.js` (token issuance)
- **Repro Steps**:
  1. Read `server/src/services/tokenSevices.js` and locate the `verifyToken` function
  2. Observe that the function calls `jwtDecode(token)` (from the `jwt-decode` library) to extract `userId` from the payload **before** any signature verification
  3. `jwtDecode` is a decode-only utility — it performs **zero cryptographic verification**. It simply base64-decodes the payload section of the JWT string.
  4. With the extracted (unverified) `userId`, the function queries the database: `await apiKey.findOne({ userId })`
  5. It retrieves that user's RSA public key from the database and **then** calls `jwt.verify(token, publicKey)`
  6. An attacker can craft a JWT with a forged `userId` in the payload (signing with any key, even a random one):
     ```js
     // Attacker crafts a token pointing to victim's userId
     const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
     const payload = Buffer.from(JSON.stringify({ userId: 'victimUserId123', iat: Date.now() })).toString('base64url');
     const fakeSignature = 'AAAAAA'; // garbage
     const maliciousToken = `${header}.${payload}.${fakeSignature}`;
     ```
  7. The server looks up the **victim's** RSA public key from the database
  8. `jwt.verify` will fail because the signature is garbage — **but the attacker now knows this path exists** and can potentially exploit it if they can somehow obtain a valid token signed with the victim's key (e.g., via key confusion attacks if the algorithm is not pinned)
  9. More critically: if the attacker's own `userId` is used but with an `alg: none` or algorithm confusion attack (e.g., RS256 → HS256 confusion), the server might verify using the wrong key entirely

- **Expected Behavior**: The `userId` used to look up the public key must come from a **verified** source — either a separate lookup mechanism, a claim in an outer envelope verified first, or a fixed system-level key used to verify the token before trusting any payload claim.
- **Actual Behavior**: The server unconditionally trusts the `userId` in the unverified JWT payload to determine which cryptographic key to use for verification. This inverts the security model: the attacker partially controls the key selection before any verification occurs.
- **Suggested Fix** (two options — choose one):

  **Option A (recommended): Use a symmetric key for the access token, keep RSA for the `apiKey` model separately**
  ```js
  // Verify with a server-side symmetric secret first
  const decoded = jwt.verify(token, process.env.JWT_SECRET); // throws if invalid
  // Now decoded.userId is trustworthy
  const userApiKey = await apiKey.findOne({ userId: decoded.userId });
  ```

  **Option B: Pin the algorithm and bind the key ID in the JWT header**
  ```js
  // On issuance, embed the userId in the header as 'kid'
  const token = jwt.sign(payload, privateKey, { algorithm: 'RS256', keyid: userId });

  // On verification, extract kid from header WITHOUT trusting payload
  const { header } = jwt.decode(token, { complete: true }); // still unverified, but header kid is used
  // Validate that kid matches expected format before DB lookup
  if (!isValidObjectId(header.kid)) throw new Error('Invalid key id');
  const userApiKey = await apiKey.findOne({ userId: header.kid });
  jwt.verify(token, userApiKey.publicKey, { algorithms: ['RS256'] }); // algorithm pinned
  ```

  In either case, **always pin the algorithm** with `{ algorithms: ['RS256'] }` in the `jwt.verify` options to prevent algorithm confusion attacks.

- **Found During**: Unit test development. While writing a test for `verifyToken`, two different JWT libraries (`jsonwebtoken` and `jwt-decode`) were noticed being used on the same token. Investigating why `jwtDecode` was needed before `jwt.verify` revealed the control flow issue.

---

## BUG-005: Cart Refund Applies `product.price` but Charge Applied `priceDiscount`

- **Severity**: P2
- **Type**: Functional / Data Integrity
- **Affected File(s)**: `server/src/controllers/cart.controller.js` (line 111 — `deleteProductCart`), compared against `addToCart` logic in the same file
- **Repro Steps**:
  1. Ensure a product exists with `price = 20,000,000 VND` and `priceDiscount = 15,000,000 VND`
  2. Add the product to the cart — the cart total increases by `15,000,000` (priceDiscount is used, correct)
  3. Remove the product from the cart via `DELETE /api/delete-cart`
  4. Observe that the cart total decreases by `20,000,000` (product.price is used, incorrect)
  5. The cart total is now negative (or otherwise wrong) relative to what was actually charged
- **Expected Behavior**: The price used to subtract from the cart total on deletion must match the price that was used when the item was added. If `priceDiscount` was used on add, `priceDiscount` must be used on remove.
- **Actual Behavior**: `addToCart` uses `priceDiscount` (when available) to compute the cart total. `deleteProductCart` uses `product.price` unconditionally. For any discounted product, the refund amount is higher than the charge amount, producing an incorrect (inflated) refund to the cart total.
- **Suggested Fix**:

  In `deleteProductCart`, replace:
  ```js
  // BUG: uses full price, not discount price
  cart.totalPrice -= product.price * removedItem.quantity;
  ```
  With:
  ```js
  // FIX: use same price logic as addToCart
  const effectivePrice = product.priceDiscount || product.price;
  cart.totalPrice -= effectivePrice * removedItem.quantity;
  ```

  Alternatively, store the `effectivePrice` at the time of `addToCart` on the cart line item itself (`cart.items[i].priceAtAdd`). This is more robust because it handles cases where the discount changes between add and remove.

- **Found During**: Code review while writing cart unit tests. The `addToCart` and `deleteProductCart` handlers were read side by side to write assertions, and the price field inconsistency was immediately apparent.
