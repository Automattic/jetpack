# Test Plan — PayPal Payment Buttons V2 (v0.8.0)

**Project:** PayPal Payment Buttons V2: API Integration
**Scope:** WOOPTP-146 → WOOPTP-167 (18 tickets)
**Target release:** Jetpack 15.7 / WordCamp Asia (April 9–11, 2026)
**Gate:** Pluginomattic Quality Gate — test_plan.md
**Status:** PHPUnit ✅ Jest ✅ Playwright ✅

> **Note:** counts below are for the suites as they stand in the Jetpack monorepo. Earlier
> revisions of this document referenced the standalone `compat-plugin` workspace the feature
> was prototyped in; those paths and commands no longer exist.

---

## 1. Test Coverage Summary

| Layer | Count | Status |
|---|---|---|
| PHP unit tests (PHPUnit) | 243 tests, 502 assertions | ✅ All passing |
| JS unit tests (Jest) | 105 tests, 11 suites | ✅ All passing |
| E2E tests (Playwright) | 50 specs, 0 skipped | ✅ All passing |
| Manual-only test points | 13 | Pending |
| **Total** | **398** | **PHPUnit + Jest + Playwright green** |

---

## 2. Automated Tests

### 2.1 PHP Unit Tests — 243 tests, 502 assertions ✅

**Run command:**
```bash
jp test php packages/paypal-payments
```

`jp test php` takes no passthrough options. To run one class:

```bash
cd projects/packages/paypal-payments
php vendor/bin/phpunit --configuration phpunit.11.xml.dist --filter PayPal_OAuth_Test
```

All files live in `projects/packages/paypal-payments/tests/php/`.

| File | Covers |
|---|---|
| `PayPal_OAuth_Test.php` | Credential encryption, environment switching, token caching, integrity checks — includes the WOOPTP-163 production default |
| `PayPal_API_Client_Test.php` | CRUD operations, resource ID validation, error code mapping, request format |
| `PayPal_API_Client_Retry_Test.php` | URL domain allowlist, retry on 500 with backoff, 403 auth retry, timeout, non-retryable passthrough |
| `PayPal_Attribute_Mapper_Test.php` | Validation (name/price/currency/description/URL), bidirectional mapping, merge logic |
| `PayPal_REST_Controller_Test.php` | Permission checks, input validation, error response normalization, 404-on-delete |
| `PayPal_Admin_Page_Test.php` | Menu registration, capability gate, delete action nonce handling, rendering |
| `PayPal_Payment_Links_List_Table_Test.php` | Column output, status badges, cursor pagination, empty and error states |
| `PayPal_Partner_Onboarding_Test.php` | Signup link generation, seller nonce lifecycle, auth code exchange |
| `PayPal_Email_Sender_Test.php` | Merchant notification content and recipients |
| `Order_REST_Controller_Test.php` | Order lookup routes and permission checks |
| `Paypal_Payment_Buttons_Test.php` | Script URL sanitization, block render output for both V1 and V2 attributes |
| `Simple_Payments_Rest_Redaction_Test.php` | Redaction of legacy SimplePayments REST fields |

The `wpcom/v2/paypal/platform/signup-link` endpoint lives in `plugins/jetpack` and needs a full
WordPress environment:

```bash
jp docker up -d && jp docker install
jp docker phpunit jetpack -- --filter=PayPal
```

**Pass criteria:** 100% pass rate, zero skipped. ✅ Met

### 2.2 JS Unit Tests — 105 tests, 11 suites ✅

**Run command:**
```bash
jp test js packages/paypal-payments
```

All files live in `projects/packages/paypal-payments/tests/js/`. Modules containing JSX carry a
`.jsx` extension.

| File | Covers |
|---|---|
| `validation.test.js` | `validatePrice`, `validateProductName`, `validateDescription`, `getUserFriendlyError`, currency set |
| `edit.test.jsx` | Wizard flow (WOOPTP-162): navigate Welcome → Dashboard → Credentials before asserting fields; the environment field is a link-button toggle, not a SelectControl; the connect label is "Connect", not "Connect PayPal" |
| `paypal-button-preview.test.jsx` | Product card rendering, currency formatting, theme-native button styling, click prevention, "Powered by PayPal" attribution |
| `save.test.jsx` | API-managed rendering, legacy rendering, wp-element-button output, empty fallback |
| `deprecated.test.js` | `isEligible` detection, `migrate` attribute transformation, deprecated save markup |
| `controls.test.jsx`, `validate.test.js` | Shared block controls and attribute validation |
| `paypal-payment-buttons-block-tests/`, `simple-payments-block-tests/` | Block-level editor and V1 → V2 migration fixtures |

**Pass criteria:** 100% pass rate, zero skipped. ✅ Met

### 2.3 E2E Tests — 50 specs (Playwright) ✅ 0 skipped

**Run command:**
```bash
cd projects/plugins/paypal-payment-buttons/tests/e2e
pnpm env:up
pnpm test:run
```

**Spec:** `tests/e2e/specs/paypal-payment-buttons.spec.js`
**Config:** `tests/e2e/playwright.config.mjs` (extends `@automattic/_jetpack-e2e-commons`)
**Mock layer:** `tests/e2e/helpers/paypal-api-mock.js` — no PayPal credentials needed

| Section | Status | Covers | Ticket |
|---|---|---|---|
| Credential Wizard Flow | ✅ | Welcome → Dashboard → Credentials → Success wizard, show/hide toggle, dashboard link URL, whitespace trimming, Client ID format warning, environment default, sandbox toggle + warning, inline error on bad credentials, back nav preserves data, Success CTA transition | WOOPTP-162 |
| Create Button Flow | ✅ | Form rendering, disabled state, button creation + preview, edit/preview toolbar toggle, edit mode with existing data | WOOPTP-154 |
| Frontend Rendering | ✅ | Published post "Buy Now" button + payment link, "Powered by PayPal" attribution | WOOPTP-154 |
| Error Flow | ✅ | Empty name disabled, zero price disabled, blur field error, API 400 notice | WOOPTP-154 |
| Legacy Block Compatibility | ✅ | Legacy paste-code indicator in the editor, front-end rendering of V1 markup | WOOPTP-154 |
| Disconnect Flow | ✅ | Disconnect and delete via sidebar InspectorControls | WOOPTP-154 |
| Production Default | ✅ | Connected badge, environment defaults to production | WOOPTP-163 |
| Token Pre-validation | ✅ | 403 shows Payment Links guidance + stays on Credentials, 403 clears partial state, 5xx does not block connection | WOOPTP-164 |
| SVG Block Icon | ✅ | SVG in block inserter, SVG in block toolbar | WOOPTP-166 |
| Format Switcher | ✅ | Button/Link/QR selection, CTA label changes, format badge in preview, switching format without recreating the product, front-end anchor and standalone QR canvas | WOOPTP-390 |
| Style Preset | ✅ | Light/Auto/Dark selection and theme custom-property inheritance | WOOPTP-390 |

**WP 6.9 compatibility notes:**
- Block editor uses an iframe (`iframe[name="editor-canvas"]`) — all block locators go through `page.frameLocator()`
- Block inserter button: `aria-label="Block Inserter"` (was `"Toggle block inserter"`)
- Publish flow uses snackbar notification for "View Post" link
- Code editor toggle via Options menu (cross-platform)
- API mock uses single `**/paypal/**` catch-all route to avoid glob pattern conflicts

**Pass criteria:** 0 failures, 0 skipped. ✅ Met

---

## 3. Coverage by Ticket — Automated vs Manual

Items marked ✅ Auto are fully covered by PHPUnit, Jest, or E2E and do not require manual verification.
Items marked 🔧 Manual are genuinely manual-only (accessibility, live PayPal API, WP CLI, Playground environment).

### WOOPTP-162 — Guided Credential Wizard

| Test Point | Coverage |
|---|---|
| Full wizard flow: Welcome → Dashboard → Credentials → Success → Create Button | ✅ Auto (E2E + Jest) |
| Pasted credentials with whitespace are auto-trimmed | ✅ Auto (E2E + PHPUnit) |
| Client ID format warning for invalid-looking IDs | ✅ Auto (E2E) |
| Show/hide toggle on Client Secret | ✅ Auto (E2E) |
| Invalid credentials show inline error on Credentials step | ✅ Auto (E2E) |
| Back navigation preserves entered data | ✅ Auto (E2E) |
| "Open PayPal Dashboard" link points to correct URL | ✅ Auto (E2E) |
| Environment defaults to Production | ✅ Auto (E2E + PHPUnit) |
| Sandbox toggle switches environment and shows warning | ✅ Auto (E2E) |
| Success step transitions to button creation form | ✅ Auto (E2E) |
| Keyboard navigation through wizard steps (Tab, Enter) | 🔧 Manual |
| Screen reader announces step changes (VoiceOver / NVDA) | 🔧 Manual |

### WOOPTP-163 — Production Default

| Test Point | Coverage |
|---|---|
| New installs connect to `api.paypal.com` (Production) by default | ✅ Auto (PHPUnit + E2E) |
| Existing merchants with explicit env option are unaffected | ✅ Auto (PHPUnit) |
| `/paypal/connect` accepts both `sandbox` and `production` | ✅ Auto (PHPUnit) |
| Sandbox can still be selected via wizard toggle | ✅ Auto (E2E + PHPUnit) |

### WOOPTP-164 — Token Pre-validation

| Test Point | Coverage |
|---|---|
| Valid credentials + Payment Links access succeeds normally | ✅ Auto (E2E) |
| 403 (no Payment Links) shows specific guidance error | ✅ Auto (E2E) |
| After 403, credentials are cleared — no partial connection state | ✅ Auto (E2E) |
| 5xx from PayPal does NOT block connection | ✅ Auto (E2E) |
| Network timeout does NOT block connection | ✅ Auto (PHPUnit — `PayPal_API_Client_Retry_Test`) |
| Error message names corrective action | ✅ Auto (E2E — asserts `Payment Links|Developer Dashboard` in notice) |

### WOOPTP-165 — Token Expiry Dual-Storage

| Test Point | Coverage |
|---|---|
| Token cached with both transient and `expires_at` option | ✅ Auto (PHPUnit) |
| Expired token triggers fresh request even if transient exists | ✅ Auto (PHPUnit) |
| `clear_cached_token()` removes both transient and option | ✅ Auto (PHPUnit) |
| `disconnect()` removes the option | ✅ Auto (PHPUnit) |
| Normal token refresh via transient expiry still works | ✅ Auto (PHPUnit) |

### WOOPTP-166 — SVG Block Icon

| Test Point | Coverage |
|---|---|
| PayPal SVG logo in block inserter | ✅ Auto (E2E) |
| PayPal SVG logo in block toolbar | ✅ Auto (E2E) |
| Other Jetpack blocks with dashicons still display correctly | 🔧 Manual |

### WOOPTP-167 — Standalone Script Stubs / Playground

| Test Point | Coverage |
|---|---|
| Install standalone plugin in WordPress Playground | 🔧 Manual (environment-dependent) |
| Insert block in new post — editor UI loads | 🔧 Manual (environment-dependent) |
| Open post with existing PayPal block — no "doesn't include support" error | 🔧 Manual (environment-dependent) |
| Block works in full Jetpack context (stub is no-op) | 🔧 Manual (environment-dependent) |

---

## 4. Manual-Only Checklist (13 items)

These cannot be automated and require a human tester with the specified environment.

### Accessibility (WOOPTP-162)

- [ ] Keyboard navigation moves through wizard steps correctly (Tab, Enter, Shift+Tab)
- [ ] Screen reader announces step changes (test with VoiceOver on macOS or NVDA on Windows)

### Visual Regression (WOOPTP-166)

- [ ] Other Jetpack blocks (e.g., Contact Form, Subscriptions) still show their correct dashicons in the inserter — no regression from `register-jetpack-block.js` change

### Playground / Standalone Mode (WOOPTP-167)

**Environment:** WordPress Playground via `playground-blueprint.json`

- [ ] Standalone plugin installs cleanly in WordPress Playground
- [ ] Create a new post → insert PayPal Payment Buttons block → editor UI loads (no "doesn't include support" error)
- [ ] Open a post containing an existing PayPal block → block renders without error
- [ ] Same block works correctly in full Jetpack monorepo context (stub is a no-op when real `jetpack-script-data` handle is registered)

### Live PayPal API (WOOPTP-163 + WOOPTP-164)

**Requires:** Real PayPal Developer Dashboard credentials

- [ ] Confirm Production API URL (`api.paypal.com`) in browser network tab during live connect
- [ ] Connect with a real PayPal app that does NOT have Payment Links enabled — confirm 403 with specific guidance
- [ ] After 403, confirm credentials are fully cleared (no stale `jetpack_paypal_payment_buttons_credentials` option in `wp_options`)

### WP CLI Verification (WOOPTP-165)

- [ ] After connecting: `wp option get jetpack_paypal_payment_buttons_token_expires_at` returns a future Unix timestamp
- [ ] After disconnecting: `wp option get jetpack_paypal_payment_buttons_token_expires_at` returns empty/not found

---

## 5. Pass Criteria Summary

All of the following must be true before the PR is submitted:

| Criteria | Required | Status |
|---|---|---|
| PHP unit tests | 243/243 pass, 502 assertions | ✅ |
| JS unit tests | 105/105 pass, 11 suites | ✅ |
| E2E tests | 50/50 pass, 0 skipped | ✅ |
| Manual checklist | All 13 points checked | Pending |
| Zero critical security issues | From PHP adversarial council review (Priority 2) | Pending |
| Product confirmations | BN code approach (WOOPTP-187) ✅ + RUB sanctions flag ✅ | ✅ Done — RUB confirmed NOT allowed on the Pay Links & Buttons API. Removed from readme. Never present in code. |

---

## 6. Known Risks

| Risk | Mitigation |
|---|---|
| E2E tests require a running WP environment | ✅ Resolved — `pnpm env:up` in `plugins/paypal-payment-buttons/tests/e2e` brings up the shared Jetpack e2e environment |
| PayPal sandbox API rate limits during testing | Use `helpers/paypal-api-mock.js` for E2E; hit the real API only for manual live tests |
| WOOPTP-163 Production default surfaced sandbox-specific test assumptions | ✅ Resolved — 8 `PayPal_OAuth_Test.php` assertions updated to expect `production` default |
| ~~RUB currency support~~ | ✅ Resolved — RUB is NOT supported on the Pay Links & Buttons API. Not in code, removed from readme (WOOPTP-261). |
| E2E wizard selectors needed tuning for WP 6.9 | ✅ Resolved — iframed editor, updated aria-labels, publish flow, route patterns all adapted (2026-03-26) |
| ~~4 E2E specs skipped in compat-plugin~~ | ✅ Resolved — the suite now runs in the monorepo against the shipped UI, so the sidebar InspectorControls, production env default, and legacy save markup specs all execute. |
