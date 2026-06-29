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

Filter `jetpack_cookie_consent_config` to override defaults (geo API URL,
GDPR/CCPA region lists, link URLs, and the Tracks `event_prefix`). The Tracks
event prefix defaults to `jetpack`; set it to `woocommerceanalytics` to keep
continuity with the WooCommerce/Unified Analytics Tracks stream.

Link URLs are configured through the `links` group. `links.cookie_policy_url`
defaults to an empty string, which hides the Cookie Policy link in the
preferences modal. The Privacy Policy link still uses the site's own WordPress
Privacy Policy URL from `get_privacy_policy_url()`. Set
`links.cookie_policy_url` only when the consuming site has a separate cookie
policy page:

```php
add_filter(
	'jetpack_cookie_consent_config',
	function ( $config ) {
		$config['links']['cookie_policy_url'] = 'https://example.com/cookie-policy/';

		return $config;
	}
);
```

The legacy top-level `cookie_policy_url` config key is still honored and mapped
to `links.cookie_policy_url` for backwards compatibility.

User-facing banner, preferences modal, footer link, CCPA page, and CCPA snackbar strings are configured through the `copy` group. Package defaults are translated with the `jetpack-cookie-consent` text domain. Consumers that override strings should translate those overrides before returning them from the filter, using their own text domain:

```php
add_filter(
	'jetpack_cookie_consent_config',
	function ( $config ) {
		$config['copy']['banner_title'] = __( 'Your privacy settings', 'my-plugin' );
		$config['copy']['ccpa_opt_out_button'] = __( 'Do Not Sell or Share My Personal Information', 'my-plugin' );

		return $config;
	}
);
```

## Requirements

- PHP >= 7.2
- The WordPress Interactivity API (WP 6.5+ / Gutenberg).
- The WP Consent API plugin (provides `window.wp_set_consent`) for writing consent state.
