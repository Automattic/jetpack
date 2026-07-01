# Cookie Consent

Cookie Consent (`@automattic/jetpack-cookie-consent`) is a plugin-agnostic package intended to provide a GDPR cookie-consent banner, a CCPA "Do Not Sell/Share" opt-out flow, geolocation-based consent-model selection, WP Consent API integration, and consent logging.

It renders a fixed-position consent banner and a preferences modal on `wp_footer` (driven by the WordPress Interactivity API), auto-creates a CCPA "Your Privacy Choices" opt-out page, injects the required legal links into a footer `core/navigation` block on block themes (via Block Hooks), and provides a floating fallback control for those links on classic themes.

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

Filter `jetpack_cookie_consent_config` to override defaults. Geo controls are grouped under `geo`:

```php
add_filter(
	'jetpack_cookie_consent_config',
	static function ( $config ) {
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

The default geo provider is `wpcom`, which resolves shoppers through `https://public-api.wordpress.com/geo/`. Set `geo.provider` to `custom` and provide `geo.api_url` to use a different source. The endpoint is fetched client-side with `cache: 'no-store'`, must be reachable from the browser, and must return JSON with `country_short` as a two-letter country code and `region` as a region/state name. The configured `geo.country_code_cookie` and `geo.region_cookie` values are written as host-only cookies and ignored by Jetpack Boost's page-cache key.

The Tracks event prefix defaults to `jetpack`; set it to `woocommerceanalytics` to keep continuity with the WooCommerce/Unified Analytics Tracks stream.

Link URLs are configured through the `links` group. `links.cookie_policy_url`
defaults to an empty string, which hides the Cookie Policy link in the
preferences modal. The Privacy Policy link uses the site's own WordPress
Privacy Policy URL from `get_privacy_policy_url()`, and is likewise hidden when
no Privacy Policy page is configured, so the modal never renders an empty link.
Set `links.cookie_policy_url` only when the consuming site has a separate cookie
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

## Public APIs

### Gating scripts on consent

Consumers that need to gate their own scripts on visitor consent should use the
WP Consent API directly, not a Cookie Consent lifecycle event:

- JavaScript: call `window.wp_has_consent( category )` for the initial state and
  listen for the `wp_listen_for_consent_change` DOM event for changes.
- PHP: call `wp_has_consent( category )` before rendering or enqueueing gated
  server-side output.

The canonical integration pattern is `woocommerce-analytics`: it gates tracking
with the WP Consent API state and change event because those APIs model consent
categories across providers.

### `wp_consent_saved`

Cookie Consent dispatches `wp_consent_saved` on `window` after it writes a
visitor choice through the WP Consent API. This event is public API and follows
the package's backward-compatibility policy for documented APIs.

```js
window.addEventListener( 'wp_consent_saved', event => {
	const { eventType, choices } = event.detail;
} );
```

The event detail has this stable shape:

```ts
type CookieConsentSavedDetail = {
	eventType:
		| 'accept_all'
		| 'accept_selected'
		| 'reject_all'
		| 'auto_granted'
		| 'opt-out';
	choices: Partial< Record< string, boolean > >;
};
```

`choices` is keyed by Cookie Consent category keys (`consent.categories`;
currently `analytics` and `advertising`), not raw WP Consent API category names,
and each present value indicates whether that category was allowed. Use
`eventType` when you need to distinguish the user action behind the saved choice.
Use the WP Consent API for category-state gating.

`wp_consent_type_defined` remains an internal implementation event and is not
part of the public API surface.

## Theming and customization

The banner, modal, category toggles, and footer-links fallback control are styled from namespaced CSS custom properties (design tokens) with self-contained defaults, so they render consistently regardless of the active theme. The tokens are deliberately **not** derived from theme presets (`--wp--preset--*`): a theme that defines those presets for its own layout (a small spacing scale, an inverted palette, etc.) cannot break or recolor the consent UI.

Override the tokens to customize the look — via the Customizer/Site Editor **Additional CSS**, a child theme stylesheet, or inline styles. Define them on `.jetpack-cookie-consent` (banner/modal) and/or `.jetpack-cookie-consent-footer-links` (the classic-theme fallback control):

```css
.jetpack-cookie-consent,
.jetpack-cookie-consent-footer-links {
	--jp-cookie-consent--color-background: #102a43;
	--jp-cookie-consent--color-text: #f0f4f8;
	--jp-cookie-consent--color-text-muted: #9fb3c8;
	--jp-cookie-consent--color-border: #334e68;
	--jp-cookie-consent--color-surface-hover: #243b53;
	--jp-cookie-consent--spacing: 20px;
	--jp-cookie-consent--font-size: 16px;
	--jp-cookie-consent--z-index: 50000; /* the modal sits at this value + 1 */
}
```

The token-defining rule uses `:where()` (zero specificity), so any of these mechanisms overrides it without needing `!important`. The banner is rendered on `wp_footer` and is not a block, so it cannot be customized through the block editor or Global Styles — Additional CSS / the tokens are the supported customization path.

## Theme support

| Required legal links                                                                                  | Banner + modal | Consistent styling |
| ----------------------------------------------------------------------------------------------------- | -------------- | ------------------ |
| **Block theme with a footer `core/navigation`** — injected into the footer navigation via Block Hooks | ✓              | ✓                  |
| **Block theme without a footer nav** — floating fallback control                                      | ✓              | ✓                  |
| **Classic theme** — floating fallback control                                                         | ✓              | ✓                  |

Rendering assumes the theme calls `wp_footer()`, which is effectively universal. A theme that omits `wp_footer()` will simply not render the banner/controls — a graceful no-op, not an error.

Manual test matrix: verify on a representative classic theme (Twenty Twenty-One) and a block theme (Twenty Twenty-Four), with and without a footer `core/navigation` block.

## Requirements

- PHP >= 7.2
- The WordPress Interactivity API (WP 6.5+ / Gutenberg).
- The WP Consent API plugin (provides `window.wp_set_consent`) for writing consent state.
