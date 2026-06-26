# Cookie Consent

Cookie Consent (`@automattic/jetpack-cookie-consent`) is a plugin-agnostic package intended to provide a GDPR cookie-consent banner, a CCPA "Do Not Sell/Share" opt-out flow, geolocation-based consent-model selection, WP Consent API integration, and consent logging.

This package is currently scaffold-only (no runtime behavior yet) and includes a placeholder Interactivity module entry point so the build passes; feature code is introduced in follow-up PRs.

## Usage

`\Automattic\Jetpack\CookieConsent\Cookie_Consent::init();`

Build the frontend module before use:

`pnpm --filter @automattic/jetpack-cookie-consent build`

## Lifecycle

Cookie Consent is a package, not a plugin, so consumers must wire lifecycle hooks
from their own plugin entry point:

```php
add_action( 'plugins_loaded', array( \Automattic\Jetpack\CookieConsent\Cookie_Consent::class, 'init' ) );
register_deactivation_hook( __FILE__, array( \Automattic\Jetpack\CookieConsent\Cookie_Consent::class, 'deactivate' ) );

register_uninstall_hook( __FILE__, 'my_plugin_uninstall' );
function my_plugin_uninstall() {
	\Automattic\Jetpack\CookieConsent\Cookie_Consent::uninstall();
}
```

`deactivate()` unschedules the daily consent-log cleanup cron while keeping the
CCPA page, options, and consent logs intact.

`uninstall()` unschedules cron, deletes the package-created CCPA page, and
clears the `jetpack_cookie_consent_ccpa_page_id` and
`jetpack_cookie_consent_ccpa_page_created` options. If the stored CCPA page ID
points to a manually configured page or a page adopted by slug, the page is left
intact and only the package options are cleared. Consent logs are retained by
default because they may be compliance records. To drop the consent-log table and
clear `jetpack_cookie_consent_consent_log_db_version`, call:

```php
\Automattic\Jetpack\CookieConsent\Cookie_Consent::uninstall( true );
```

## Configuration

Filter `jetpack_cookie_consent_config` to override defaults (geo API URL, GDPR/CCPA region lists, cookie policy URL, and the Tracks `event_prefix`). The Tracks event prefix defaults to `jetpack`; set it to `woocommerceanalytics` to keep continuity with the WooCommerce/Unified Analytics Tracks stream.

## Requirements

- PHP >= 7.2
- The WordPress Interactivity API (WP 6.5+ / Gutenberg).
- The WP Consent API plugin (provides `window.wp_set_consent`) for writing consent state.
