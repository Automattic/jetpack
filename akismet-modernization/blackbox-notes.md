# Project Blackbox — architecture notes for the Akismet UI exploration

Pulled from internal P2 / Linear / docs. Cite when reusing. Last refreshed 2026-05-27.

## What it is

A shipped fraud / abuse / risk-scoring service. Pairs a browser JS SDK (`blackbox-js`) with a server API at `https://blackbox-api.wp.com`. The SDK collects encrypted browser + behavioral telemetry and produces a 22-char base64url `sessionId`. At the moment of a risky action (signup, login, checkout, comment, password reset) the **integrator's backend** calls `POST /v1/verify/{sessionId}` over Bearer auth and receives a verdict (`allow` / `challenge` / `block` / `error`) plus `risk_score` (0.0–1.0).

> "Akismet for WooCommerce transaction metadata rather than comments." — Systems Update, 2026-05-20

Lead: **David Becher** (`@dtbecher`). Teams: BBOX, SAFE, SYS. Linear project [`project-blackbox-a7417d3a2e82`](https://linear.app/a8c/project/project-blackbox-a7417d3a2e82). State `started`, health `onTrack`, ~75%. Slack: `#project-blackbox`, `#woo-fraud-protection`. P2s: [`blackboxp2.wordpress.com`](https://blackboxp2.wordpress.com/) (eng), [`blackboxdocs.wordpress.com`](https://blackboxdocs.wordpress.com/) (docs).

Live in production: ~7% of WPCOM Calypso login traffic, Woo Fraud Protection v0.1.x in WC 10.6 alpha (listening mode), Tumblr/Redpop integration in flight.

## Signals collected

Sources: [Safety & Filtering Feb 9 update](https://thursdayupdates.wordpress.com/2026/02/09/safety-and-filtering-updates-february-9th-2026/), [Functional Debrief](https://riskopsp2.wordpress.com/2026/03/25/woocommerce-fraud-protection-project-blackbox-functional-debrief/), [Competitive Analysis](https://riskopsp2.wordpress.com/2026/03/25/woocommerce-fraud-protection-competitive-capability-analysis/), [Challenge Widget post](https://blackboxp2.wordpress.com/2026/04/03/blackbox-challenge-widget-how-it-works/).

- **Automation detection:** WebDriver (Playwright/Selenium/Puppeteer/stealth), CDP-connection detection (`checkCdpConnection` in `browser-signals.ts`, [BBOX-39](https://linear.app/a8c/issue/BBOX-39)), property-integrity / `attachShadow` monkey-patch detection.
- **Behavioral biometrics:** pointer-movement timing, mouse-movement speed, click coords, keypress, scroll listeners, typing.
- **Device fingerprinting (multi-strategy):** hardware, browser, font, canvas, audio.
- **Network:** client IP, `X-Forwarded-For` IPs ([SAFE-478](https://linear.app/a8c/issue/SAFE-478)), geo, proxy / VPN / Tor flags.
- **Edge fingerprints:** **JA4T (TCP/TLS)** computed at the CDN and forwarded to `blackbox-api.wp.com` via HTTP header ([HTTP/2 + HTTP/3 fingerprints](https://edgeopsp2.wordpress.com/2026/02/17/http-2-and-http-3-fingerprints/)).
- **Request headers:** full map, `sec-fetch`, `sec-CH` ([Monday memo wk 5](https://nospamp2.wordpress.com/2026/01/25/monday-memo-week-5-2026/)).
- **Velocity:** Redis HyperLogLog.
- **Akismet JS signals:** the Akismet behavior collector was ported into `blackbox-js` ([SAFE-315](https://linear.app/a8c/issue/SAFE-315), [Monday memo wk 6](https://nospamp2.wordpress.com/2026/02/01/monday-memo-week-6-2026/)).

## Identity stitching

Clients get back a stable opaque `visitor_id` in the detailed verify response. Sessions are short-lived (~15 min). Fingerprint matching uses several independent strategies so spoofing one identifier still leaves a signal. A third-party-cookie pixel fallback is being explored ([BBOX-40](https://linear.app/a8c/issue/BBOX-40)) using `client_id` + IP + UA/accept-language joined server-side.

## Privacy posture

[`blackboxdocs.wordpress.com/security-and-privacy/`](https://blackboxdocs.wordpress.com/security-and-privacy/): telemetry encrypted in the browser before it leaves the page with forward-secret keys. Intermediaries see only ciphertext. Sessions live ~15 min; after expiry `/v1/verify/{sessionId}` returns `410 Gone`. After the window, only the verdict (decision, risk score, signal hits) and submitted reports are retained — the encrypted telemetry payload is dropped.

**Implication for Akismet UI:** anything we surface from a Blackbox verify response is durable (the verdict + signal hits), but we can't go back and re-query the raw telemetry. The UI must capture and persist whatever it wants to show at verify time.

## Decision model

Rules are authored and evaluated **server-side** in the Blackbox API. ~20+ rules across browser-integrity, network reputation, request velocity (and expanding — [Systems Update 222](https://thursdayupdates.wordpress.com/2026/05/20/systems-update-222/)). Each rule is `active` / `shadow` (log only) / `disabled`, allowing shadow testing. Above the rule layer: a **Bayesian log-odds scoring pipeline** that combines signals into the final score ([Functional Debrief](https://riskopsp2.wordpress.com/2026/03/25/woocommerce-fraud-protection-project-blackbox-functional-debrief/)).

"Blocking" happens at the **integrator**, not in Blackbox. When `decision: "block"` the integrator rejects. When `decision: "challenge"`, the client renders the **Challenge Widget**: a Shadow-DOM closed-shadow honeypot with 10 checkboxes (1 real, 9 honeypots, 1 CDP trap); the "real" index is derived from a server nonce via two-iteration SHA-256. A solved challenge applies a `-10.0` log-odds adjustment.

## API surface

Base: `https://blackbox-api.wp.com`. Reference: [`blackboxdocs.wordpress.com/api-reference/`](https://blackboxdocs.wordpress.com/api-reference/).

| Endpoint | Auth | Use |
| --- | --- | --- |
| `POST /v1/collect` | `X-Blackbox-Api-Key: <public_key>` | browser-only; sends encrypted telemetry; returns `sessionId`; may include a `challenge` directive |
| `POST /v1/collect/{sessionId}` | `X-Blackbox-Api-Key: <public_key>` | re-collect with `challenge_solution` after widget solve |
| `POST /v1/verify/{sessionId}` | `Authorization: Bearer <key>` or `X_JETPACK <token>` | server-to-server. Optional `{ context: { action, payment_method, cart_value, login_method } }`. Response `{ message, data: { session_id, risk_score, decision } }`. Detailed tier adds `signals[]`, `confidence`, `visitor_id`, `telemetry_score`, `ip_address`. Errors: 400/401/403/404/409 (already verified)/410 (expired)/413 (>1 MB)/429/5xx |
| `POST /v1/verify` | as above | sessionless; body `{ visitor_ip, full_headers, context }`; always `confidence: "degraded"` |
| `POST /v1/report/{sessionId}` | Bearer | outcome feedback. Body `{ label: "bad"\|"good", source: "chargeback"\|"manual_review"\|"api", notes: "<=1000 chars" }`. Requires `reporting_enabled` |
| `POST /v1/report` | Bearer | batch ≤100 reports |
| `/v1/clients` | MC admin | client config management |
| Edge header | (CDN-set) | `X-Edge-Blackbox-Score` for systems that can't run JS |

JS client globals: `window.Blackbox.configure({ apiKey, challengeContainer, challengeTheme, onSuccess, onChallengeStart, onChallengeComplete, onChallengeFailure })`, `Blackbox.init()`, `Blackbox.getSessionId()` (Promise), `Blackbox.reset()`. Challenge bundle lazy-loads from `bb-challenge.min.js` (~8 KB gzip), registered on `window.__BlackboxChallenge`. Loader script lives at e.g. `https://blackbox-api.wp.com/v1/dist/v.js`.

Repos (a8c-internal GHE): `github.a8c.com/Automattic/blackbox-js`, server-side `blackbox.api/` inside `github.a8c.com/Automattic/wpcom`, integration docs at `github.a8c.com/Automattic/woo-fraud-protection-docs`. No public github.com repo.

## Akismet ↔ Blackbox today

| Direction | State | Evidence |
| --- | --- | --- |
| Akismet JS → Blackbox JS | Ported (live) | Akismet behavior collector merged into `blackbox-js` per [SAFE-315](https://linear.app/a8c/issue/SAFE-315) + [Monday memo wk 6](https://nospamp2.wordpress.com/2026/02/01/monday-memo-week-6-2026/) |
| Akismet rules → Blackbox rules | Migration in progress | [SAFE-457](https://linear.app/a8c/issue/SAFE-457) "Evaluate Akismet and Bkismet rules for Blackbox"; [SAFE-472](https://linear.app/a8c/issue/SAFE-472) / [SAFE-474](https://linear.app/a8c/issue/SAFE-474) ported useragent + empty-header rules |
| Blackbox `visitor_id` → Akismet comment-scoring | Not wired | no PR or post indicates Akismet reads Blackbox identity into its scoring pipeline. **Open opportunity this exploration surfaces.** |
| Blackbox `visitor_id` → Akismet **admin UI** | Doesn't exist today | this exploration is the prototype |

## Implications for this exploration

1. **Server-to-server verify call** is the primary integration path for Akismet PHP. Bearer-auth, simple POST, returns a structured verdict. We can hit it from `class.akismet-rest-api.php` (or a dedicated `class.akismet-blackbox.php`) with no Akismet UI dependency.
2. **`visitor_id` is the join key** between Akismet comments and Blackbox sessions. If Akismet captures the Blackbox `sessionId` at comment-submit time and stores it as comment meta (`_blackbox_session_id`), every spam-log row gets a stable join.
3. **Verdict + signals are durable; raw telemetry is not.** Anything we want to show in the spam-log row drawer must be persisted at verify time, not fetched on demand.
4. **Site enrollment is per-client.** The exploration UI must check whether the current site is a Blackbox client (Bearer key present, client config exists at `/v1/clients`) and degrade gracefully when it isn't.
5. **The challenge widget is HTML5 + Shadow DOM + a loader script.** If we want a "preview the challenge a visitor saw" surface inside the admin, we embed `https://blackbox-api.wp.com/v1/dist/v.js` and feed it the stored nonce — not in scope for Plans 0–4 but worth a future plan.
