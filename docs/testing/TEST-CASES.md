# Manual Test Cases — Computer Shop

These test cases are written for manual execution and serve as the specification that automated tests are built against. Techniques from ISTQB are applied explicitly — equivalence partitioning (EP), boundary value analysis (BVA), decision tables (DT), and state transition testing (STT) — so that each case is traceable to a design rationale.

**Total: 15 test cases**

---

## TC-001: Registration with a Valid Email Format

- **Feature**: User Registration
- **Type**: Functional / Positive
- **Priority**: P0
- **Preconditions**:
  - Application is running at `http://localhost:5173`
  - The email `newuser@example.com` does not already exist in the database
- **Steps**:
  1. Navigate to the registration page
  2. Enter `New User` in the Name field
  3. Enter `newuser@example.com` in the Email field (valid EP partition: `local@domain.tld`)
  4. Enter `Password123!` in the Password field (8 characters, meets minimum)
  5. Click the Register button
- **Expected Result**: Registration succeeds. User is redirected to the homepage or login page. No error message is shown. A new user document exists in the database.
- **Technique Applied**: Equivalence Partitioning — this test represents the "valid email" partition. All emails matching `[chars]@[chars].[chars]` should produce the same outcome: success.

---

## TC-002: Registration with Invalid Email Formats

- **Feature**: User Registration
- **Type**: Negative / Validation
- **Priority**: P1
- **Preconditions**:
  - Application is running
- **Steps** (run each sub-case independently):

  | Sub-case | Email Input | Expected Outcome |
  |---|---|---|
  | 2a | `notanemail` | Validation error: "Invalid email format" |
  | 2b | `missing@` | Validation error |
  | 2c | `@nodomain.com` | Validation error |
  | 2d | `spaces in@email.com` | Validation error |
  | 2e | `` (empty) | Validation error: "Email is required" |

  For each sub-case:
  1. Navigate to the registration page
  2. Enter the email from the table above
  3. Enter a valid password (`Password123!`)
  4. Click Register
- **Expected Result**: Registration is blocked for all sub-cases. An appropriate inline validation error appears. No HTTP request is sent to `POST /api/register` for client-side validation failures (verify in DevTools Network tab).
- **Technique Applied**: Equivalence Partitioning — these inputs represent distinct invalid partitions: missing `@`, missing domain, missing local part, whitespace, and empty string. Each partition should produce a validation error regardless of which specific invalid value is used.

---

## TC-003: Registration Password Length Boundary Values

- **Feature**: User Registration
- **Type**: Boundary / Validation
- **Priority**: P1
- **Preconditions**:
  - Application is running
  - Email `bvatest@example.com` does not exist in the database
- **Steps** (run each sub-case independently, using a fresh unique email each time):

  | Sub-case | Password | Length | Expected Outcome |
  |---|---|---|---|
  | 3a | `` (empty) | 0 | Error: "Password is required" |
  | 3b | `Abcdef1` | 7 | Error: "Password must be at least 8 characters" |
  | 3c | `Abcdef12` | 8 | Registration succeeds (minimum valid boundary) |
  | 3d | `A` × 100 | 100 | Registration succeeds (within max) or graceful error if max enforced |

  For each sub-case:
  1. Navigate to the registration page
  2. Enter a unique valid email
  3. Enter the password from the table
  4. Click Register
- **Expected Result**:
  - 3a and 3b: Registration blocked; inline error shown
  - 3c: Registration succeeds; this is the minimum valid boundary
  - 3d: Either succeeds (if no max enforced) or shows a graceful max-length error — must not crash or return a 500
- **Technique Applied**: Boundary Value Analysis — test at 0, just-below-minimum (7), at-minimum (8), and well-above-minimum (100). The minimum boundary (8) is the most important because off-by-one errors in validation logic are common here.

---

## TC-004: Login with Valid Credentials

- **Feature**: User Login
- **Type**: Functional / Positive
- **Priority**: P0
- **Preconditions**:
  - Application is running
  - Admin account exists: `admin@computershop.com` / `admin123`
- **Steps**:
  1. Navigate to the login page
  2. Enter `admin@computershop.com` in the Email field
  3. Enter `admin123` in the Password field
  4. Click Login
  5. Open DevTools → Application → Cookies
- **Expected Result**:
  - User is redirected to the homepage (or admin dashboard)
  - `accessToken` cookie is present, flagged `httpOnly`
  - `refreshToken` cookie is present, flagged `httpOnly`
  - The user's name is displayed in the navigation bar
- **Technique Applied**: Functional positive test; forms the baseline for all authenticated-flow tests.

---

## TC-005: Login with Invalid Credentials

- **Feature**: User Login
- **Type**: Negative
- **Priority**: P0
- **Preconditions**:
  - Application is running
- **Steps** (run each sub-case):

  | Sub-case | Email | Password | Expected HTTP Status |
  |---|---|---|---|
  | 5a | `admin@computershop.com` | `wrongpassword` | 401 |
  | 5b | `nobody@example.com` | `admin123` | 401 |
  | 5c | `admin@computershop.com` | `` (empty) | 400 |
  | 5d | `` (empty) | `admin123` | 400 |

  For each sub-case:
  1. Navigate to the login page
  2. Enter the email and password from the table
  3. Click Login
- **Expected Result**:
  - No auth cookies are set
  - An error message is shown to the user ("Invalid email or password" or similar)
  - The error message must NOT reveal whether the email exists (i.e., sub-cases 5a and 5b should show the same generic message — this is a security requirement)
- **Technique Applied**: Equivalence Partitioning on invalid credential combinations. Note the security requirement: identical error messages for "wrong password" vs "email not found" prevents user enumeration.

---

## TC-006: Product Search — Valid Query, Empty Query, and Overlong Query

- **Feature**: Product Search
- **Type**: Functional / Boundary / Negative
- **Priority**: P1
- **Preconditions**:
  - Application is running
  - At least one product with the word "laptop" exists in the database
- **Steps**:

  | Sub-case | Query Input | Expected Outcome |
  |---|---|---|
  | 6a | `laptop` | Results list shows products matching "laptop"; minimum 1 result |
  | 6b | `` (empty / only spaces) | Empty state message shown ("No products found" or similar); no 500 error |
  | 6c | `x` × 500 (500-character string) | Server returns 400 or empty results gracefully; no 500 error; no DB timeout visible to user |
  | 6d | `<script>alert(1)</script>` | No alert fires; input is escaped; results show "no results" or equivalent |

  For each sub-case:
  1. Navigate to the search page or use the search bar
  2. Enter the query from the table
  3. Submit the search
- **Expected Result**: See table above. The key requirement for 6c and 6d is that the server handles edge-case input gracefully — no crash, no script execution.
- **Technique Applied**: Equivalence Partitioning (valid/empty/overlong/malicious partitions) + Boundary Value Analysis (empty string at one extreme, 500 chars at the other) + basic XSS probe.

---

## TC-007: Product Filter by Price Range

- **Feature**: Product Filter
- **Type**: Functional / Boundary
- **Priority**: P1
- **Preconditions**:
  - Application is running
  - Products exist with varying prices (e.g., 5,000,000 VND and 25,000,000 VND)
- **Steps**:
  1. Navigate to the product listing page
  2. Set the minimum price filter to `10,000,000`
  3. Set the maximum price filter to `20,000,000`
  4. Apply the filter
  5. Inspect the results list
- **Expected Result**: Only products with price between 10,000,000 and 20,000,000 VND (inclusive) are shown. Products outside this range are not in the results.
- **Additional Sub-cases**:
  - 7b: Min = Max = `15,000,000` → only products at exactly 15M are shown (boundary)
  - 7c: Min > Max (e.g., Min = `30M`, Max = `10M`) → validation error or empty results; must not crash
- **Technique Applied**: Boundary Value Analysis on the price range — the boundary values (exactly min, exactly max) must be included in results, not excluded by an off-by-one comparison (`>` vs `>=`).

---

## TC-008: Add In-Stock Item to Cart

- **Feature**: Cart Operations
- **Type**: Functional / Positive
- **Priority**: P0
- **Preconditions**:
  - User is logged in
  - A product exists with `stock >= 1`
- **Steps**:
  1. Navigate to the product detail page for an in-stock product
  2. Set quantity to `1`
  3. Click "Add to Cart"
  4. Navigate to the cart page
- **Expected Result**:
  - The product appears in the cart with quantity 1
  - The cart total reflects the product's `priceDiscount` (if set) or `price`
  - The product's stock count in the database decreases by 1 (or stock is reserved)
- **Technique Applied**: Functional positive test; baseline for all cart tests.

---

## TC-009: Cart Quantity Boundary Values (Stock Limit)

- **Feature**: Cart Operations
- **Type**: Boundary / Negative
- **Priority**: P1
- **Preconditions**:
  - User is logged in
  - A product exists with `stock = 5` (use this exact value for BVA clarity)
- **Steps**:

  | Sub-case | Quantity Entered | Expected Outcome |
  |---|---|---|
  | 9a | `1` | Add succeeds; cart shows qty 1 (minimum valid boundary) |
  | 9b | `5` | Add succeeds; cart shows qty 5 (maximum valid boundary — equals stock) |
  | 9c | `6` | Add fails; error message "Insufficient stock" or similar; cart unchanged |
  | 9d | `0` | Add fails; validation error "Quantity must be at least 1"; cart unchanged |
  | 9e | `-1` | Add fails; validation error; cart unchanged |

  For each sub-case:
  1. Navigate to the product detail page
  2. Set the quantity field to the value in the table
  3. Click "Add to Cart"
- **Expected Result**: See table. The critical boundary is between sub-cases 9b (stock) and 9c (stock + 1). The system must enforce this boundary server-side — it must not be bypassable by sending a crafted POST request directly to `POST /api/add-to-cart`.
- **Technique Applied**: Boundary Value Analysis — testing at 0, 1, stock, and stock+1. The stock limit is the key boundary; off-by-one errors here cause overselling.

---

## TC-010: Checkout with COD — Valid Address

- **Feature**: Checkout / Payment
- **Type**: Functional / Positive
- **Priority**: P0
- **Preconditions**:
  - User is logged in
  - Cart contains at least one item
  - User has a valid shipping address (street, city, phone)
- **Steps**:
  1. Navigate to the checkout page
  2. Confirm or enter a valid shipping address
  3. Select "Cash on Delivery (COD)" as the payment method
  4. Click "Place Order"
- **Expected Result**:
  - Order is created in the database with status `"pending"`
  - A confirmation message or order ID is shown to the user
  - Cart is emptied after successful order creation
  - `POST /api/payment` returns HTTP 200 with an order reference
- **Technique Applied**: Functional positive test for the most basic payment path (COD requires no external API call, making it the lowest-risk payment method and the one to test first).

---

## TC-011: Checkout with COD — Missing Address

- **Feature**: Checkout / Payment
- **Type**: Negative / Validation
- **Priority**: P1
- **Preconditions**:
  - User is logged in
  - Cart contains at least one item
  - User's profile has **no** shipping address saved
- **Steps**:
  1. Navigate to the checkout page
  2. Clear the address fields (or ensure they are empty)
  3. Select "Cash on Delivery (COD)"
  4. Click "Place Order"
- **Expected Result**:
  - Order is NOT created
  - An inline validation error appears: "Please enter a shipping address" (or equivalent)
  - `POST /api/payment` is either not called (client-side validation) or returns HTTP 400 (server-side validation)
  - Cart remains intact
- **Technique Applied**: Negative test — required field missing. Validates both client-side and server-side validation are present (both layers must independently enforce this).

---

## TC-012: AI Chatbot — Valid Question

- **Feature**: AI Chatbot
- **Type**: Functional / Integration
- **Priority**: P1
- **Preconditions**:
  - Application is running
  - Gemini API key is configured in `server/.env`
  - User is on the chatbot page (or the chatbot widget is open)
- **Steps**:
  1. Open the chatbot interface
  2. Type: `Tôi muốn mua laptop cho sinh viên, ngân sách 15 triệu` (Vietnamese: "I want to buy a laptop for a student, budget 15 million")
  3. Submit the message
- **Expected Result**:
  - A response appears within 10 seconds
  - The response is in Vietnamese (contains Vietnamese characters or common Vietnamese words such as "bạn", "sản phẩm", "Dạ", "máy tính", etc.)
  - The response is not an error message
  - HTTP: `POST /chat` returns 200 with a non-empty `response` field
- **Technique Applied**: Functional positive test with locale verification. The Vietnamese response is an explicit product requirement, not a nice-to-have.

---

## TC-013: AI Chatbot — Empty Question

- **Feature**: AI Chatbot
- **Type**: Negative / Boundary
- **Priority**: P2
- **Preconditions**:
  - Application is running
  - User is on the chatbot page
- **Steps**:
  1. Open the chatbot interface
  2. Leave the input field empty (or enter only whitespace)
  3. Click the Send button (or press Enter)
- **Expected Result**:
  - The message is NOT submitted to `POST /chat`
  - A validation message appears: "Please enter a question" or the send button is disabled for empty input
  - No Gemini API call is made (verify in server logs or via mock in automated test)
  - The chatbot response area does not show a loading state or empty bubble
- **Vietnamese locale verification**: If the server does receive an empty input and responds with an error, the error message should be in Vietnamese (e.g., starts with "Vui lòng" or "Xin lỗi"). Expected: response contains Vietnamese text (e.g., starts with `Dạ` or contains common Vietnamese characters such as `ạ`, `ộ`, `ư`, `ề`).
- **Technique Applied**: Boundary Value Analysis — empty string is the boundary condition for the question field. Also tests that the empty-input partition is handled client-side before making an expensive Gemini API call.

---

## TC-014: Admin Creates a New Product (All Required Fields)

- **Feature**: Admin — Product Management
- **Type**: Functional / Positive
- **Priority**: P1
- **Preconditions**:
  - Admin user is logged in (`admin@computershop.com`)
  - Admin is on the product management page (`/admin`)
- **Steps**:
  1. Click "Add Product" (or equivalent button)
  2. Fill in all required fields:
     - Name: `Gaming Laptop Test XYZ`
     - Price: `25000000`
     - Discount Price: `22000000`
     - Category: `Laptop`
     - Stock: `10`
     - Description: `Test product for QA purposes`
  3. Upload a product image
  4. Click "Save" or "Create Product"
- **Expected Result**:
  - `POST /api/add-product` returns HTTP 200 or 201
  - The new product appears in the admin product list
  - The product is retrievable via `GET /api/products` with all fields matching what was entered
  - The product is visible on the storefront product listing page
- **Technique Applied**: Functional positive test for admin CRUD. Also serves as a precondition-setup test for other test cases that need a specific product to exist.

---

## TC-015: Admin Updates Order Status — State Transitions (Decision Table)

- **Feature**: Admin — Order Management
- **Type**: Functional / State Transition
- **Priority**: P1
- **Preconditions**:
  - Admin user is logged in
  - At least one order exists in each relevant status (create orders in the test)
- **Decision Table** — Valid and Invalid Transitions:

  | Current Status | Target Status | Expected Outcome |
  |---|---|---|
  | `pending` | `shipping` | Allowed — status updates, user notified |
  | `pending` | `delivered` | Blocked or requires confirmation — skipping a state should be prevented |
  | `pending` | `cancelled` | Allowed — cancellation from pending is valid |
  | `shipping` | `delivered` | Allowed — normal progression |
  | `shipping` | `pending` | Blocked — cannot revert to pending once shipped |
  | `shipping` | `cancelled` | Depends on business rule — document actual behavior |
  | `delivered` | `cancelled` | Blocked — cannot cancel a delivered order |
  | `delivered` | `pending` | Blocked |
  | `cancelled` | `pending` | Blocked — cancelled is a terminal state |
  | `cancelled` | `shipping` | Blocked |

- **Steps** (for each row in the decision table):
  1. Log in as admin
  2. Navigate to the order management page
  3. Find an order with the "Current Status" from the table row
  4. Attempt to change the status to the "Target Status"
  5. Click Save / Confirm
- **Expected Result**: Each transition either succeeds or is blocked as specified in the decision table. For blocked transitions, an error message is shown and the status does not change. The `POST /api/update-status-order` endpoint must enforce these rules server-side — the UI state machine alone is not sufficient.
- **Technique Applied**: Decision Table Testing + State Transition Testing — the order status lifecycle is a finite state machine. Testing all meaningful transitions (valid progressions and invalid reversals/skips) ensures the business rules are enforced at both the UI and API layers.
