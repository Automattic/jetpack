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

Filter `jetpack_cookie_consent_config` to override defaults. The current schema groups geo controls under `geo` and feature flags under `features`:

```php
add_filter(
	'jetpack_cookie_consent_config',
	static function ( $config ) {
		$config['features']['geo'] = true;
		$config['geo']             = array_merge(
			$config['geo'],
			array(
				'provider'            => 'custom',
				'api_url'             => 'https://example.com/geo/',
				'country_code_cookie' => 'shopper_country',
				'region_cookie'       => 'shopper_region',
				'cookie_duration'     => 6 * HOUR_IN_SECONDS,
				'gdpr_countries'      => array( 'GB', 'FR' ),
				'ccpa_regions'        => array( 'california' ),
				'show_on_error'       => true,
			)
		);

		$config['event_prefix'] = 'woocommerceanalytics';

		return $config;
	}
);
```

The default geo provider is `wpcom`, which resolves shoppers through `https://public-api.wordpress.com/geo/`. Set `geo.provider` to `custom` and provide `geo.api_url` to use a different source. The endpoint is fetched client-side with `cache: 'no-store'`, must be reachable from the browser, and must return JSON with `country_short` as a two-letter country code and `region` as a region/state name. The configured `geo.country_code_cookie` and `geo.region_cookie` values are written as host-only cookies and ignored by Jetpack Boost's page-cache key while geo is enabled.

Set `features.geo` to `false` to skip geo resolution entirely. In that mode the package does not add the Boost cache-cookie filter, does not emit a geo API URL to the frontend, and does not run banner region-selection logic.

The Tracks event prefix defaults to `jetpack`; set it to `woocommerceanalytics` to keep continuity with the WooCommerce/Unified Analytics Tracks stream.

## Requirements

- PHP >= 7.2
- The WordPress Interactivity API (WP 6.5+ / Gutenberg).
- The WP Consent API plugin (provides `window.wp_set_consent`) for writing consent state.
