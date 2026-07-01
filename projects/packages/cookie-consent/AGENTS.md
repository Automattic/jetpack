# AGENTS.md

Guidance for AI coding agents working in this package.

## Overview

Jetpack Cookie Consent renders a GDPR/CCPA cookie-consent banner and opt-out
controls on the **site front end**, built on the WordPress Interactivity API.
There is **no wp-admin page**: the package hooks `wp_footer` /
`wp_enqueue_scripts` and the Block Hooks API (privacy-policy + CCPA navigation
links, CCPA opt-out button/snackbar). A CCPA opt-out page is auto-created once
(removable). A consent-log REST controller persists consents (own table, cron,
route at `jetpack/v4/cookie-consent/consent-log`).

- Composer package: `automattic/jetpack-cookie-consent`
- PHP namespace: `Automattic\Jetpack\CookieConsent`
- Consumer: the **premium-analytics plugin** (`projects/plugins/premium-analytics`)
  bundles this package and calls `Cookie_Consent::init()`.

## Structure

```text
src/class-cookie-consent.php            # entry: init(), front-end hooks, Block Hooks, CCPA page
src/class-consent-log-controller.php    # consent-log REST route + table/cron
src/cookie-banner-content.php           # banner markup
src/ccpa-content.php                    # CCPA opt-out markup
src/modules/cookie-consent/             # Interactivity API front end (TS): view, styles, tracks
```

## Development

```bash
composer phpunit                        # PHP tests
pnpm run build / pnpm run test          # front-end build (webpack) / jest
jetpack build packages/cookie-consent
```

## Verifying on a real site

This is a **front-end** feature with conditional rendering — wp-admin shows
nothing. Make the banner appear by satisfying its render preconditions first:

- The **premium-analytics plugin** active (it boots this package) **and** the
  **WP Consent API** plugin active.
- A **GDPR/CCPA region**, or force rendering with `?preview_cookie_consent=1`.

Then load a **front-end** URL (not wp-admin) and confirm a cache **MISS**
(response header `cache;desc=MISS`) before trusting the HTML or a screenshot —
JN/Atomic front-end pages are page-cached and a stale HIT shows pre-edit output.

## Pitfalls

- No admin page — there is no `?page=jetpack-cookie-consent`.
- The banner/modal HTML is always server-rendered once at `wp_footer` (priority
  999); visibility is controlled client-side via Interactivity API directives
  (`showBanner` starts `false`), so the markup is present even when hidden.
- Front-end output is cached — verify a cache MISS before asserting any change.
