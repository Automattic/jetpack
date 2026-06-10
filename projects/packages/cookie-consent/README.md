# Cookie Consent

Cookie Consent (`@automattic/jetpack-cookie-consent`) provides a GDPR cookie-consent banner, a CCPA "Do Not Sell/Share" opt-out flow, geolocation-based consent-model selection, WP Consent API integration, and consent logging. It is plugin-agnostic — consumable by Jetpack, Woo Pro, or a standalone plugin — and has no WooCommerce dependency.

## Usage

The package has no side effects on load. A consumer activates it by calling:

`\Automattic\Jetpack\CookieConsent\Cookie_Consent::init();`

Build the frontend module before use:

`pnpm --filter @automattic/jetpack-cookie-consent build`

## Configuration

Filter `jetpack_cookie_consent_config` to override defaults (geo API URL, GDPR/CCPA region lists, cookie policy URL, and the Tracks `event_prefix`). The Tracks event prefix defaults to `jetpack`; set it to `woocommerceanalytics` to keep continuity with the WooCommerce/Unified Analytics Tracks stream.

## Requirements

- PHP >= 7.2
- The WordPress Interactivity API (WP 6.5+ / Gutenberg).
- The WP Consent API plugin (provides `window.wp_set_consent`) for writing consent state.
