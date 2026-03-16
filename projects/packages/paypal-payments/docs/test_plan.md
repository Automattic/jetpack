# Test Plan — PayPal Payment Buttons V2 (v0.8.0)

**Project:** PayPal Payment Buttons V2: API Integration
**Scope:** WOOPTP-146 → WOOPTP-167 (18 tickets)
**Target release:** Jetpack 15.7 / WordCamp Asia (April 9–11, 2026)
**Gate:** Pluginomattic Quality Gate — test_plan.md
**Status:** PHPUnit ✅ Jest ✅ — Playwright pending (week of 2026-03-24)

---

## 1. Test Coverage Summary

| Layer | Count | Status |
|---|---|---|
| PHP unit tests (PHPUnit) | 163 tests, 349 assertions | ✅ All passing |
| JS unit tests (Jest) | 105 tests, 11 suites | ✅ All passing |
| E2E tests (Playwright) | 33 specs | Pending — week of 2026-03-24 |
| Manual-only test points | 13 | Pending |
| **Total** | **314** | **PHPUnit + Jest green** |

---

## 2. Automated Tests

### 2.1 PHP Unit Tests — 163 tests, 349 assertions ✅

**Run command:**
```bash
cd /path/to/jetpack
composer test-php extensions/plugins/paypal-payment-buttons
```

| File | Tests | Covers |
|---|---|---|
| `PayPal_OAuth_Test.php` | 22 | Credential encryption, environment switching, token caching, integrity checks — 8 tests fixed for WOOPTP-163 production default |
| `PayPal_API_Client_Test.php` | 28 | CRUD operations, resource ID validation, error code mapping, request format |
| `PayPal_Attribute_Mapper_Test.php` | 30 | Validation (name/price/currency/description/URL), bidirectional mapping, merge logic |
| `PayPal_REST_Controller_Test.php` | 17 | Permission checks, input validation, error response normalization, 404-on-delete |
| `PayPal_API_Client_Retry_Test.php` | 16 | URL domain whitelist, retry on 500 with backoff, 403 auth retry, timeout, non-retryable passthrough |

**Pass criteria:** 100% pass rate, zero skipped. ✅ Met — 2026-03-15

### 2.2 JS Unit Tests — 105 tests, 11 suites ✅

**Run command:**
```bash
cd /path/to/jetpack
pnpm jest extensions/plugins/paypal-payment-buttons
```

| File | Tests | Covers |
|---|---|---|
| `validation.test.js` | 16 | `validatePrice`, `validateProductName`, `validateDescription`, `getUserFriendlyError`, currency set — fixed missing `sprintf` in `@wordpress/i18n` mock |
| `edit.test.js` | — | Wizard flow assertions updated for WOOPTP-162: navigate Welcome → Dashboard → Credentials before asserting fields; environment field is a link-button toggle, not SelectControl; connect label is "Connect" not "Connect PayPal" |
| `paypal-button-preview.test.js` | 11 | Product card rendering, currency formatting, layout variants, click prevention, PayPal logo |
| `save.test.js` | 6 | API-managed rendering, legacy rendering, stacked/single layouts, empty fallback |
| `deprecated.test.js` | 8 | `isEligible` detection, `migrate` attribute transformation, deprecated save markup |

**Pass criteria:** 100% pass rate, zero skipped. ✅ Met — 2026-03-15

### 2.3 E2E Tests — 33 specs (Playwright)

**Run command:**
```bash
cd /path/to/jetpack
pnpm playwright test extensions/plugins/paypal-payment-buttons
```

**Config:** `implementation/CONSOLIDATED/tests/e2e/playwright.config.js`
**Mock layer:** `implementation/CONSOLIDATED/tests/e2e/paypal-api-mock.js`

| Section | Specs | Covers | Ticket |
|---|---|---|---|
| Credential Wizard Flow | 14 | Welcome → Dashboard → Credentials → Success wizard, show/hide toggle, dashboard link URL, whitespace trimming, Client ID format warning, environment default, sandbox toggle + warning, inline error on bad credentials, back nav preserves data, Success CTA transition | WOOPTP-162 |
| Create Button Flow | 5 | Form rendering, disabled state, button creation + preview, edit/preview toolbar toggle, edit mode with existing data | WOOPTP-154 |
| Frontend Rendering | 2 | Published post PayPal button + payment link, stacked layout debit/credit | WOOPTP-154 |
| Error Flow | 4 | Empty name disabled, zero price disabled, blur field error, API 400 notice | WOOPTP-154 |
| Legacy Block Compatibility | 2 | Legacy paste-code indicator in editor, legacy block frontend rendering | WOOPTP-154 |
| Disconnect Flow | 2 | Disconnect resets to wizard, delete button clears state | WOOPTP-154 |
| Production Default | 2 | Production badge on connected status, connect POST defaults to production env | WOOPTP-163 |
| Token Pre-validation | 3 | 403 shows Payment Links guidance + stays on Credentials, 403 clears partial state, 5xx does not block connection | WOOPTP-164 |
| SVG Block Icon | 2 | SVG in block inserter, SVG in block toolbar | WOOPTP-166 |

**Pass criteria:** 0 failures, `playwright_results.json` produced.

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

**Tester:** Andrew Wikel

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
- [ ] After 403, confirm credentials are fully cleared (no stale `paypal_credentials` option in `wp_options`)

### WP CLI Verification (WOOPTP-165)

- [ ] After connecting: `wp option get paypal_token_expires_at` returns a future Unix timestamp
- [ ] After disconnecting: `wp option get paypal_token_expires_at` returns empty/not found

---

## 5. Pass Criteria Summary

All of the following must be true before the PR is submitted:

| Criteria | Required | Status |
|---|---|---|
| PHP unit tests | 163/163 pass, 349 assertions | ✅ 2026-03-15 |
| JS unit tests | 105/105 pass, 11 suites | ✅ 2026-03-15 |
| E2E tests | 33/33 pass, `playwright_results.json` exists | Pending — week of 2026-03-24 |
| Manual checklist | All 13 points checked | Pending |
| Zero critical security issues | From PHP adversarial council review (Priority 2) | Pending |
| Jarred confirmations | BN code approach (WOOPTP-187) + RUB sanctions flag | Pending — Andrew to confirm with Jarred |

---

## 6. Known Risks

| Risk | Mitigation |
|---|---|
| E2E tests require a running WP environment | Use `playground-blueprint.json` or local dev — schedule week of 2026-03-24 |
| PayPal sandbox API rate limits during testing | Use `paypal-api-mock.js` for E2E; hit real API only for manual live tests |
| WOOPTP-163 Production default surfaced sandbox-specific test assumptions | ✅ Resolved — 8 `PayPal_OAuth_Test.php` assertions updated to expect `production` default |
| RUB currency support unconfirmed (pending Jarred) | Do not include RUB in currency test fixtures until confirmed |
| E2E wizard selectors may need tuning | Selectors use multiple fallbacks (`placeholder*=`, `aria-label*=`); adjust after first Playwright run |
