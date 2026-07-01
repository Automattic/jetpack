# Cookie Consent

Cookie Consent (`@automattic/jetpack-cookie-consent`) is a plugin-agnostic package that provides a GDPR cookie-consent banner, a CCPA "Do Not Sell/Share" opt-out flow, geolocation-based consent-model selection, WP Consent API integration, and consent logging.

It renders a fixed-position consent banner and a preferences modal on `wp_footer` (driven by the WordPress Interactivity API), auto-creates a CCPA "Your Privacy Choices" opt-out page, injects the required legal links into a footer `core/navigation` block on block themes (via Block Hooks), and provides a floating fallback control for those links on classic themes.

## Quick start

Wire the lifecycle hooks from your own plugin entry point — this is a package, not a plugin:

```php
use Automattic\Jetpack\CookieConsent\Cookie_Consent;

add_action( 'plugins_loaded', array( Cookie_Consent::class, 'init' ) );
register_deactivation_hook( __FILE__, array( Cookie_Consent::class, 'deactivate' ) );

register_uninstall_hook( __FILE__, 'my_plugin_uninstall' );
function my_plugin_uninstall() {
	Cookie_Consent::uninstall();
}
```

Build the frontend module before use:

```bash
pnpm --filter @automattic/jetpack-cookie-consent build
```

## Public API surface

These are the supported, stable entry points consumers may depend on. Everything not listed here — including the many `public` PHP methods that exist only because WordPress hooks require them — is **internal** (see [Internal](#internal--not-public-api)). Stability is governed by the [versioning policy](#versioning-and-backward-compatibility).

| Surface                                                     | Kind                  | Where                           |
| ----------------------------------------------------------- | --------------------- | ------------------------------- |
| `Cookie_Consent::init()`                                    | PHP static method     | Entry point                     |
| `Cookie_Consent::deactivate()`                              | PHP static method     | Lifecycle                       |
| `Cookie_Consent::uninstall( $delete_consent_logs = false )` | PHP static method     | Lifecycle                       |
| `jetpack_cookie_consent_config`                             | WP filter             | Configuration                   |
| `POST jetpack/v4/cookie-consent/consent-log`                | REST route            | Consent logging                 |
| `GET jetpack/v4/cookie-consent/consent-log`                 | REST route            | Consent logging (authenticated) |
| `wp_consent_saved`                                          | JS `window` event     | Consent notifications           |
| `--jp-cookie-consent--*`                                    | CSS custom properties | Theming                         |

### Entry point and lifecycle

`Cookie_Consent::init()` boots the package: asset enqueue, banner render, CCPA page auto-creation, footer link Block Hooks, geo cache filter, and the consent-log REST controller.

`deactivate()` unschedules the daily consent-log cleanup cron while keeping the CCPA page, options, and consent logs intact.

`uninstall()` unschedules cron, deletes the package-created CCPA page, and clears the `jetpack_cookie_consent_ccpa_page_id` and `jetpack_cookie_consent_ccpa_page_created` options. If the stored CCPA page ID points to a manually configured page or a page adopted by slug, the page is left intact and only the package options are cleared. Consent logs are retained by default because they may be compliance records. To drop the consent-log table and clear `jetpack_cookie_consent_consent_log_db_version`, pass `true`:

```php
Cookie_Consent::uninstall( true );
```

### Configuration

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

Link URLs are configured through the `links` group. `links.cookie_policy_url` defaults to an empty string, which hides the Cookie Policy link in the preferences modal. The Privacy Policy link uses the site's own WordPress Privacy Policy URL from `get_privacy_policy_url()`, and is likewise hidden when no Privacy Policy page is configured, so the modal never renders an empty link. Set `links.cookie_policy_url` only when the consuming site has a separate cookie policy page:

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

Consent categories are configured through `consent.categories`. Each category is an array with `key`, `label`, `description`, `required`, `default_checked`, and `wp_consent_map`. Use lowercase alphanumeric or underscore category keys. The default registry is `functional` (required), `analytics`, and `marketing`; the frontend preserves the existing `required` and `advertising` aliases for `functional` and `marketing`. Because of those aliases, `required` and `advertising` are reserved keys: a category registered with either key is ignored during normalization to avoid colliding with a built-in category.

```php
add_filter(
	'jetpack_cookie_consent_config',
	function ( $config ) {
		$config['consent']['categories'][] = array(
			'key'             => 'personalization',
			'label'           => __( 'Personalization', 'my-plugin' ),
			'description'     => __( 'Remember choices that tailor the site experience.', 'my-plugin' ),
			'required'        => false,
			'default_checked' => false,
			'wp_consent_map'  => array( 'personalization' ),
		);

		return $config;
	}
);
```

### REST routes

The consent-log controller registers two routes under `jetpack/v4/cookie-consent/consent-log`:

- `POST` — public and unauthenticated; anonymous visitors submit a consent record. Rate-limited (the create route enforces its own window; see `jetpack_cookie_consent_log_create_rate_limit`).
- `GET` — authenticated; reads consent-log entries for sites that surface them.

### JS events

#### Gating scripts on consent

Consumers that need to gate their own scripts on visitor consent should use the WP Consent API directly, not a Cookie Consent event:

- JavaScript: call `window.wp_has_consent( category )` for the initial state and listen for the `wp_listen_for_consent_change` DOM event for changes.
- PHP: call `wp_has_consent( category )` before rendering or enqueueing gated server-side output.

The canonical integration pattern is `woocommerce-analytics`: it gates tracking with the WP Consent API state and change event because those APIs model consent categories across providers.

#### `wp_consent_saved`

Cookie Consent dispatches `wp_consent_saved` on `window` after it writes a visitor choice through the WP Consent API:

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

`choices` is keyed by each category's **preference key** — for the default registry that is `required` (functional), `analytics`, and `advertising` (marketing) — and each present value indicates whether that category was allowed. Use `eventType` when you need to distinguish the user action behind the saved choice, and the WP Consent API for category-state gating.

### Theming tokens

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

## Internal — not public API

The following are implementation details. They may change or be removed in any release without notice, and consumers must not depend on them:

- The block-hook and Interactivity callbacks on `Cookie_Consent` (`register_footer_navigation_links`, `set_footer_navigation_link_attributes`, `add_ccpa_*`, `add_gdpr_manage_preferences_directives`, `mark_footer_links_injected`, `maybe_render_footer_links_fallback`, `maybe_suppress_privacy_policy_link`, etc.). These are `public` only because WordPress hooks require a public callable.
- Config accessors and helpers such as `get_config()`, `get_copy()`, `get_consent_categories()`, and the other `get_*` methods.
- The `wp_consent_type_defined` JS event.
- The consent-log database table, its schema, and the `jetpack_cookie_consent_consent_log_db_version` / `jetpack_cookie_consent_ccpa_page_*` option keys.

## Versioning and backward compatibility

This package follows [Semantic Versioning](https://semver.org). **It is currently pre-1.0 (`0.x`) and unreleased**: the public surface is still being designed, and anything above — including the entry point and config shape — may change in any release until 1.0. Notable changes are recorded in `CHANGELOG.md`.

The surface freezes at **1.0**. From then on, breaking changes to anything under [Public API surface](#public-api-surface) ship only in a major release; deprecations get at least one major of runway with `_deprecated_*()` notices before removal. Anything under [Internal](#internal--not-public-api) is exempt and may change at any time.

When a configuration schema is introduced, its own `schema_version` field will track the config-contract shape independently of the package version, bumping whenever that contract changes.

## Requirements

The minimum-requirements contract for consumers:

- PHP >= 7.2
- The WordPress Interactivity API (WP 6.5+ / Gutenberg).
- The WP Consent API plugin (provides `window.wp_set_consent`) for writing consent state.

## Theme support

| Required legal links                                                                                  | Banner + modal | Consistent styling |
| ----------------------------------------------------------------------------------------------------- | -------------- | ------------------ |
| **Block theme with a footer `core/navigation`** — injected into the footer navigation via Block Hooks | ✓              | ✓                  |
| **Block theme without a footer nav** — floating fallback control                                      | ✓              | ✓                  |
| **Classic theme** — floating fallback control                                                         | ✓              | ✓                  |

Rendering assumes the theme calls `wp_footer()`, which is effectively universal. A theme that omits `wp_footer()` will simply not render the banner/controls — a graceful no-op, not an error.

Manual test matrix: verify on a representative classic theme (Twenty Twenty-One) and a block theme (Twenty Twenty-Four), with and without a footer `core/navigation` block.
