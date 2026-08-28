# PayPal Payments Package — Development Guide

## This Is the Source of Truth

All live plugin code lives in this package. The two plugins that ship it — `plugins/paypal-payment-buttons` (standalone) and `plugins/jetpack` — consume it through Composer; neither carries its own copy of the block.

## Quick Reference

| What | Where |
|------|-------|
| Source files | `src/paypal-payment-buttons/` |
| PHP tests | `tests/php/` — `jp test php packages/paypal-payments` |
| JS tests | `tests/js/` — `jp test js packages/paypal-payments` |
| E2E tests | `../../plugins/paypal-payment-buttons/tests/e2e/specs/` |
| Static analysis | `jp phan packages/paypal-payments` |
| Build | `jp build plugins/paypal-payment-buttons --deps` |
| Watch | `jp watch packages/paypal-payments` |
| Block metadata | `src/paypal-payment-buttons/block-v2.json` (V2), `block.json` (V1) |
| Doc drafts | `docs/` (for the Jetpack support team) |

`jp` is the monorepo CLI (`npm install -g @automattic/jetpack-cli`). Everything below can also be run as `pnpm jetpack <...>` from the monorepo root.

## Running the Tests

```bash
jp install packages/paypal-payments
jp test php packages/paypal-payments      # PHPUnit
jp test js  packages/paypal-payments      # Jest
jp phan     packages/paypal-payments      # Static analysis
```

`jp test php` does not accept passthrough options. To run a single PHPUnit class, invoke PHPUnit directly from this directory:

```bash
php vendor/bin/phpunit --configuration phpunit.11.xml.dist --filter PayPal_OAuth_Test
```

The `wpcom/v2/paypal/platform/signup-link` endpoint lives in `plugins/jetpack` and needs a full WordPress environment:

```bash
jp docker up -d && jp docker install
jp docker phpunit jetpack -- --filter=PayPal
```

E2E runs from the standalone plugin, against a mocked PayPal API:

```bash
cd ../../plugins/paypal-payment-buttons/tests/e2e
pnpm env:up
pnpm test:run
```

## Testing Against a Real Site

Docker auto-links everything under `projects/plugins/`, so the standalone plugin appears in the plugin list once built:

```bash
jp build plugins/paypal-payment-buttons --deps
jp docker up -d && jp docker install
```

Credentials are encrypted with `AUTH_KEY`, so a `wp-config.php` still carrying the `put your unique phrase here` placeholder will refuse to store them — generate real salts first. Then connect with sandbox credentials from [developer.paypal.com](https://developer.paypal.com/dashboard/applications/sandbox); the admin screen is at **Jetpack → Payment Links**, or **Settings → Payment Links** when Jetpack is not active.

## Options and Transients

| Key | Kind | Holds |
|---|---|---|
| `jetpack_paypal_payment_buttons_credentials` | option | Client ID and secret, encrypted with `sodium_crypto_secretbox` |
| `jetpack_paypal_payment_buttons_environment` | option | `sandbox` or `production` |
| `jetpack_paypal_payment_buttons_token` | transient | Encrypted access token |
| `jetpack_paypal_payment_buttons_token_expires_at` | option | Unix timestamp; paired with the transient so expiry survives object-cache flushes |
| `jetpack_paypal_payment_buttons_seller_nonce` | transient | Onboarding nonce, 30-minute TTL |

## Changelog Entries

This package is shipped by two plugins, so a user-facing change needs three entries — one here, one in each plugin:

```bash
jp changelog add packages/paypal-payments      -s minor -t added       -e "..."
jp changelog add plugins/paypal-payment-buttons -s minor -t added      -e "..."
jp changelog add plugins/jetpack               -s minor -t enhancement -e "PayPal Payment Buttons: ..."
```

`plugins/jetpack` uses its own type vocabulary (`major`, `enhancement`, `compat`, `bugfix`, `other`), not the default `added`/`fixed` set.

## Related

- **Linear project:** PayPal Payment Buttons V2: API Integration
