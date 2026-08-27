# PayPal Payments Package — Development Guide

**Last updated:** 2026-03-16

## This Is the Source of Truth

All live plugin code lives here. The implementation workspace at `Automattic/paypal-payment-buttons-v2` holds planning documents — not code.

## Quick Reference

| What | Where |
|------|-------|
| Source files | `src/paypal-payment-buttons/` |
| PHP tests | `tests/php/` — run with `php vendor/bin/phpunit --configuration phpunit.11.xml.dist` |
| JS tests | `tests/js/` — run with `pnpm run test:js` |
| Build | `pnpm run build-production` |
| Watch | `pnpm run watch` |
| Block metadata | `src/paypal-payment-buttons/block.json` |
| Doc drafts | `docs/` (for Jetpack support team) |

## Test Status

- **PHPUnit:** 163 tests, 349 assertions
- **Jest:** 109 tests, 11 suites
- **Playwright E2E:** 33 specs (pending execution week of Mar 24)

## Branch

Work happens on `paypal-payment-buttons-v2` branch in the `slash1andy/jetpack` fork. Push to `fork` remote only. Never push to `origin` (Automattic/jetpack) until final merge.

## Related

- **Linear project:** PayPal Payment Buttons V2: API Integration
- **Implementation workspace:** `Automattic/paypal-payment-buttons-v2` (docs, checklist, ticket folders)
- **PRD:** In the implementation workspace at `prd-paypal-payment-buttons-v2.md`
