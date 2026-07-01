# Cookie Consent

Cookie Consent (`@automattic/jetpack-cookie-consent`) is a plugin-agnostic package intended to provide a GDPR cookie-consent banner, a CCPA "Do Not Sell/Share" opt-out flow, geolocation-based consent-model selection, WP Consent API integration, and consent logging.

It renders a fixed-position consent banner and a preferences modal on `wp_footer` (driven by the WordPress Interactivity API), auto-creates a CCPA "Your Privacy Choices" opt-out page, injects the required legal links into a footer `core/navigation` block on block themes (via Block Hooks), and provides a floating fallback control for those links on classic themes.

## Usage

`\Automattic\Jetpack\CookieConsent\Cookie_Consent::init( array $config = array() );`

`$config` is an optional, partial configuration array resolved against package
defaults — see [Configuration](#configuration) below.

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

`Cookie_Consent::init( array $config = array() )` takes the whole configuration
as a single argument. `$config` is partial — every key is optional and falls
back to a package default — and is resolved once, on the first `init()` call,
via `Config_Schema` (see `src/schema/class-config-schema.php` for the full
shape). The consuming plugin should pass everything it needs up front here.

Other code on the site that does not own the `init()` call can still layer
overrides through the `jetpack_cookie_consent_config` filter (see
[Overriding config from another plugin](#overriding-config-from-another-plugin)).

### Master switch

Set `enabled` to `false` to make `init()` a no-op — no hooks are registered at
all, including the consent-log REST controller:

```php
\Automattic\Jetpack\CookieConsent\Cookie_Consent::init(
	array(
		'enabled' => false,
	)
);
```

### Feature toggles

The `features` group turns individual pieces of functionality on or off. Every
key defaults to `true` except `page_deletion_lock`, which defaults to `false`
and is reserved for future use:

```php
\Automattic\Jetpack\CookieConsent\Cookie_Consent::init(
	array(
		'features' => array(
			'banner'             => true,  // Consent banner/modal and their frontend assets.
			'ccpa_page'          => true,  // CCPA "Your Privacy Choices" opt-out page and directives.
			'footer_links'       => true,  // Required footer legal links (Block Hooks + classic-theme fallback).
			'consent_log'        => true,  // Consent-log REST controller (table, cron cleanup, routes).
			'tracks'             => true,  // Automattic Tracks (stats.wp.com/w.js) enqueue.
			'geo'                => true,  // Geolocation-based consent model and Boost cache-key exclusion.
			'page_deletion_lock' => false, // Reserved; not yet wired to a behavior.
		),
	)
);
```

Turning `geo` off stops resolving a visitor's region and excluding the geo
cookies from Jetpack Boost's cache key, but the frontend module still receives
a `geo` config sub-object (with `geoEnabled: false`) rather than none at all,
since the module dereferences it unconditionally.

### Nested config groups

The rest of `$config` shapes behavior rather than gating it. Geo controls are
grouped under `geo`:

```php
\Automattic\Jetpack\CookieConsent\Cookie_Consent::init(
	array(
		'geo' => array(
			'provider'            => 'custom',
			'api_url'             => 'https://example.com/geo/',
			'country_code_cookie' => 'shopper_country',
			'region_cookie'       => 'shopper_region',
			'cookie_duration'     => 6 * HOUR_IN_SECONDS,
			'gdpr_countries'      => array( 'GB', 'FR' ),
			'ccpa_regions'        => array( 'california' ),
			'show_on_error'       => true,
		),
		'event_prefix' => 'woocommerceanalytics',
	)
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
\Automattic\Jetpack\CookieConsent\Cookie_Consent::init(
	array(
		'links' => array(
			'cookie_policy_url' => 'https://example.com/cookie-policy/',
		),
	)
);
```

User-facing banner, preferences modal, footer link, CCPA page, and CCPA snackbar strings are configured through the `copy` group. Package defaults are translated with the `jetpack-cookie-consent` text domain. Consumers that override strings should translate those overrides before passing them to `init()`, using their own text domain. Only the overridden keys need to be present — anything omitted keeps the package default:

```php
\Automattic\Jetpack\CookieConsent\Cookie_Consent::init(
	array(
		'copy' => array(
			'banner_title'        => __( 'Your privacy settings', 'my-plugin' ),
			'ccpa_opt_out_button' => __( 'Do Not Sell or Share My Personal Information', 'my-plugin' ),
		),
	)
);
```

Consent categories are configured through `consent.categories`. Each category is
an array with `key`, `label`, `description`, `required`, `default_checked`, and
`wp_consent_map`. Use lowercase alphanumeric or underscore category keys. The
default registry is `functional` (required), `analytics`, and `marketing`; the
frontend preserves the existing `required` and `advertising` aliases for
`functional` and `marketing`. Because of those aliases, `required` and
`advertising` are reserved keys: a category registered with either key is
ignored during normalization to avoid colliding with a built-in category.

Unlike the other groups, `consent.categories` **replaces** the default registry
rather than merging into it — there is no existing config to merge with when a
consumer calls `init()`. Include the built-in categories explicitly if they
should still appear alongside a custom one:

```php
\Automattic\Jetpack\CookieConsent\Cookie_Consent::init(
	array(
		'consent' => array(
			'categories' => array(
				array(
					'key'             => 'functional',
					'label'           => __( 'Required', 'my-plugin' ),
					'description'     => __( 'Necessary for the site to function.', 'my-plugin' ),
					'required'        => true,
					'default_checked' => true,
					'wp_consent_map'  => array( 'functional' ),
				),
				array(
					'key'             => 'analytics',
					'label'           => __( 'Analytics', 'my-plugin' ),
					'description'     => __( 'Help us understand how visitors use the site.', 'my-plugin' ),
					'required'        => false,
					'default_checked' => true,
					'wp_consent_map'  => array( 'statistics', 'statistics-anonymous' ),
				),
				array(
					'key'             => 'marketing',
					'label'           => __( 'Advertising', 'my-plugin' ),
					'description'     => __( 'Used by advertising partners to serve relevant ads.', 'my-plugin' ),
					'required'        => false,
					'default_checked' => false,
					'wp_consent_map'  => array( 'marketing' ),
				),
				array(
					'key'             => 'personalization',
					'label'           => __( 'Personalization', 'my-plugin' ),
					'description'     => __( 'Remember choices that tailor the site experience.', 'my-plugin' ),
					'required'        => false,
					'default_checked' => false,
					'wp_consent_map'  => array( 'personalization' ),
				),
			),
		),
	)
);
```

### Overriding config from another plugin

`init()` is the primary configuration path, meant for the plugin that owns the
boot call. Code that does not own that call — another plugin or a theme — can
layer overrides through the `jetpack_cookie_consent_config` filter. The filter
receives the fully resolved config and its return value is resolved again, so
unknown or malformed keys are sanitized back to package defaults rather than
trusted verbatim:

```php
add_filter(
	'jetpack_cookie_consent_config',
	function ( $config ) {
		$config['links']['cookie_policy_url'] = 'https://example.com/cookie-policy/';
		return $config;
	}
);
```

The consent-log retention period can also be overridden through the dedicated
`jetpack_cookie_consent_log_retention_days` filter, which takes precedence over
the injected `log.retention_days` when the daily cleanup cron runs.

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
	eventType: 'accept_all' | 'accept_selected' | 'reject_all' | 'auto_granted' | 'opt-out';
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
