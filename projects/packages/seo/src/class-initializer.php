<?php
/**
 * Jetpack SEO — the visibility command center for WordPress sites.
 *
 * Gates the surface behind its feature flag and cohort, then wires the admin
 * page ({@see Admin_Page}), the dashboard's REST reads ({@see Dashboard_Data}),
 * the content-coverage cache invalidation ({@see Content_Coverage}), and the
 * opt-in surface ({@see Surface_Visibility}).
 *
 * @package automattic/jetpack-seo-package
 */

namespace Automattic\Jetpack\SEO;

use Automattic\Jetpack\Current_Plan;
use Automattic\Jetpack\Modules;
use Automattic\Jetpack\Status;
use Automattic\Jetpack\Status\Host;

/**
 * Boots the package and carries its cross-plugin contract: the feature flag,
 * the script-data key, and the option names / visibility reads other plugins consume.
 */
class Initializer {

	/**
	 * Jetpack SEO package version.
	 *
	 * @var string
	 */
	const PACKAGE_VERSION = '0.8.1';

	/**
	 * WordPress.com site feature that enables the Jetpack SEO surface.
	 *
	 * Kept separate from `advanced-seo`, which gates the paid parts of the
	 * dashboard after this product-level availability check has passed.
	 *
	 * @var string
	 */
	const FEATURE_SLUG = 'seo-admin-ui';

	/**
	 * Filter name that can enable the entire Jetpack SEO surface.
	 *
	 * The surface is available when this filter returns true or the current site's
	 * active features include {@see self::FEATURE_SLUG}. When neither is enabled,
	 * the package registers no admin menu or assets and changes nothing about the
	 * existing Jetpack UI.
	 *
	 * @var string
	 */
	const FEATURE_FILTER = 'rsm_jetpack_seo';

	/**
	 * Key under `window.JetpackScriptData` the React app reads its state from
	 * (`window.JetpackScriptData.seo`). Must match the JS-side reader in
	 * `_inc/data/get-overview.ts`.
	 */
	const SCRIPT_DATA_KEY = 'seo';

	/**
	 * Option recording whether sitemap generation is enabled.
	 *
	 * Read in place of the standalone `sitemaps` module's active state. Module-active
	 * state is filtered against the modules present on disk, so once that module is
	 * removed it would read as inactive even for sites that had it on. A one-time
	 * migration in the Jetpack plugin seeds this option from the site's existing module
	 * state and keeps it in sync while the legacy module still exists. See
	 * `Jetpack::migrate_sitemaps_module_to_seo_option()`.
	 *
	 * @var string
	 */
	const SITEMAP_ENABLED_OPTION = 'jetpack_seo_sitemap_enabled';

	/**
	 * Option recording that the user has deliberately turned the site's sitemap OFF,
	 * so WordPress core's own sitemap should be suppressed too ("off" means no sitemap
	 * at all, not a fallback to `/wp-sitemap.xml`).
	 *
	 * Set when the sitemaps module is switched off and cleared when it's switched on
	 * (see {@see self::flag_sitemap_user_disabled()} / {@see self::clear_sitemap_user_disabled()}),
	 * so it captures a deliberate off — a *transition* — rather than the ambient
	 * off-state. A site that simply never enabled the sitemap never fires the toggle,
	 * so the flag stays absent and its existing (e.g. WordPress-native) sitemap is left
	 * untouched.
	 *
	 * @var string
	 */
	const SUPPRESS_WP_SITEMAP_OPTION = 'jetpack_seo_suppress_wp_sitemap';

	/**
	 * Option recording whether canonical URLs are enabled.
	 *
	 * Read in place of the standalone `canonical-urls` module's active state. Module-active
	 * state is filtered against the modules present on disk, so once that module is
	 * removed it would read as inactive even for sites that had it on. A one-time
	 * migration in the Jetpack plugin seeds this option from the site's existing module
	 * state and keeps it in sync while the legacy module still exists. See
	 * `Jetpack::migrate_canonical_urls_module_to_seo_option()`.
	 *
	 * @var string
	 */
	const CANONICAL_ENABLED_OPTION = 'jetpack_seo_canonical_urls_enabled';

	/**
	 * Option recording whether the Jetpack SEO surface is discoverable on this site.
	 *
	 * Gates whether the SEO admin menu registers on self-hosted sites. Seeded once by the
	 * Jetpack plugin on install/upgrade: fresh installs default to visible, existing
	 * installs default to hidden and opt in via the legacy Traffic page or My Jetpack.
	 * WordPress.com (Simple + Atomic) bypasses this option entirely and is always visible.
	 * Absent until seeded, in which case self-hosted defaults to hidden (the non-disruptive
	 * default). See {@see Surface_Visibility::is_visible()}.
	 *
	 * @var string
	 */
	const VISIBILITY_OPTION = 'jetpack_seo_surface_visible';

	/**
	 * Whether the package has been initialized.
	 *
	 * @var bool
	 */
	private static $initialized = false;

	/**
	 * Initialize the package.
	 *
	 * Called from the Jetpack plugin's `late_initialization()` hook.
	 *
	 * @return void
	 */
	public static function init() {
		if ( self::$initialized ) {
			return;
		}
		self::$initialized = true;

		// Gate the entire SEO surface behind its legacy filter or per-site feature.
		if ( ! self::is_available() ) {
			return;
		}

		// The opt-in endpoint must be reachable even before the surface is visible, so
		// existing self-hosted installs can switch to the new experience from the legacy
		// Traffic page or My Jetpack (JETPACK-1700). Registered ahead of the cohort gate.
		add_action( 'rest_api_init', array( Surface_Visibility::class, 'register_optin_route' ) );

		// Expose opt-in availability to other admin surfaces (the legacy Traffic-page
		// banner reads it via `@automattic/jetpack-script-data`). Hooked here — after the
		// feature flag, before the cohort gate — so a still-hidden install gets the signal.
		add_filter( 'jetpack_admin_js_script_data', array( Surface_Visibility::class, 'inject_optin_availability' ) );

		// Sitemap output is a front-end concern tied to the SEO feature itself, not to
		// whether the admin dashboard is visible — so register it here, ahead of the
		// cohort gate. This keeps the deliberate-off behavior consistent in the two
		// edges the surface gate would otherwise break: a site that turns the sitemap
		// off while the dashboard is still hidden (an existing self-hosted install that
		// hasn't opted in), and a flag set while the dashboard was visible that must
		// stay honored if the dashboard is later hidden.
		//
		// Maintain the deliberate-off flag as the sitemap is toggled: these fire only on
		// a genuine module toggle (not wpcomsh's private-site suppression, which is a
		// filter, not a deactivation), and are registered before the toggle's REST write.
		add_action( 'jetpack_deactivate_module_sitemaps', array( __CLASS__, 'flag_sitemap_user_disabled' ) );
		add_action( 'jetpack_activate_module_sitemaps', array( __CLASS__, 'clear_sitemap_user_disabled' ) );

		// When the user has deliberately turned the sitemap off, suppress WordPress
		// core's own sitemap too — otherwise "off" silently falls back to core's
		// `/wp-sitemap.xml` (and its `/sitemap.xml` → `/wp-sitemap.xml` redirect). Keyed
		// on the deliberate-off flag, NOT the ambient off-state, so a site that never
		// enabled the sitemap keeps whatever sitemap it already had. Runs on
		// `plugins_loaded`, before core registers its sitemap server on `init`, so the
		// filter is in place; with core sitemaps disabled, `/sitemap.xml` and
		// `/wp-sitemap.xml` both return a proper 404. (When the sitemap is ON, the
		// Jetpack sitemaps module already disables core's duplicate.)
		if ( get_option( self::SUPPRESS_WP_SITEMAP_OPTION, false ) ) {
			add_filter( 'wp_sitemaps_enabled', '__return_false' );
		}

		// Discoverability cohort gate: the SEO surface is auto-discoverable for fresh
		// installs and all WordPress.com sites; existing self-hosted installs opt in via
		// the legacy Traffic page or My Jetpack (JETPACK-1700). Until it's visible we
		// register nothing else here and let those opt-in surfaces drive discovery.
		if ( ! self::is_seo_surface_visible() ) {
			return;
		}

		// The admin menu and app shell register whenever the surface is visible, even
		// when the `seo-tools` module is inactive, so SEO stays discoverable and can be
		// turned on from within the page itself (JETPACK-1700). When the module is off,
		// the Overview renders only its "enable SEO tools" affordance.
		//
		// Priority 1: load the wp-build bundle (and define its render function)
		// before `add_menu_item()` runs at the default priority and needs it.
		add_action( 'admin_menu', array( Admin_Page::class, 'maybe_load_wp_build' ), 1 );
		add_action( 'admin_menu', array( Admin_Page::class, 'add_menu_item' ), 10 );

		// Read-only REST routes the dashboard hydrates its initial state from. Preloaded
		// into the page (see Admin_Page::inject_script_data) so a normal load resolves
		// them with no request, and fetched by the app when that preload is missing or
		// stale — so the dashboard recovers its data instead of dead-ending. Registered
		// whenever the surface is visible (independent of the seo-tools module, like the
		// Overview).
		add_action( 'rest_api_init', array( Dashboard_Data::class, 'register_rest_reads' ) );

		// Keep the Overview's cached content-coverage counts honest. Hooked here rather than
		// alongside the admin surface above because posts are written from everywhere — the
		// block editor (REST), the classic editor, wp-cli, cron, other plugins — and the
		// cache has to be dropped wherever that happens, not just where it's read.
		Content_Coverage::register_invalidation();

		// The settings surface only comes online once SEO tools are active — there's
		// nothing to configure while the module is off, so we don't register its REST
		// endpoints until then. Expose the core `blog_public` option to the REST settings
		// endpoint so the Settings tab can save search-engine visibility via
		// `/wp/v2/settings` (the Jetpack settings endpoint only accepts Jetpack options).
		// Writes are still capability-gated by the core settings controller.
		if ( self::is_seo_tools_module_active() ) {
			// Front-end JSON-LD schema output and author profile schema fields.
			// Intentionally NOT gated: every site keeps emitting its structured data —
			// a plan-gated site loses the schema *settings* card (a paid control), but
			// stripping the schema its pages already carry would hurt SEO it has today.
			// (Finer per-type gating — e.g. sitewide LocalBusiness to paid plans on
			// self-hosted — is a separate follow-up, tracked in the schema project.)
			Schema_Builder::init();
			Author_Schema_Node::init();

			// GEO-tab front-end services. These are paid surfaces on WordPress.com: a
			// plan-gated site has the GEO tab hidden from its dashboard, so it must not
			// keep emitting their front-end output either — otherwise it would still
			// serve /llms.txt and AI-crawler robots.txt directives it doesn't qualify
			// for. Self-hosted is never gated, so it always registers both.
			if ( ! self::is_gated() ) {
				// The /llms.txt handler. Self-hooks a front-end action, so it no-ops off
				// the front end and stays behind the same gates as the schema above.
				Llms_Txt::init();
				// robots.txt directives for blocked AI crawlers. Self-hooks the
				// `robots_txt` filter, so it stays inert off the front end.
				Ai_Crawlers::init();
			}

			add_action( 'rest_api_init', array( Dashboard_Data::class, 'register_rest_settings' ) );
			// Package-owned route for the site-level Schema settings (see the controller).
			add_action( 'rest_api_init', array( Schema_Settings_Controller::class, 'register_routes' ) );
		}

		/**
		 * Fires after the Jetpack SEO package is initialized.
		 *
		 * @since 0.1.0
		 */
		do_action( 'jetpack_seo_init' );
	}

	/**
	 * Whether the Jetpack SEO product is available on this site.
	 *
	 * Keep the existing filter as an override while allowing WordPress.com to
	 * enable the product for individual sites through its feature registry.
	 *
	 * @return bool
	 */
	public static function is_available() {
		if ( (bool) apply_filters( self::FEATURE_FILTER, false ) ) {
			return true;
		}

		$features = ( new Host() )->is_wpcom_simple()
			? Current_Plan::get_simple_site_specific_features()
			: Current_Plan::get()['features'];

		return in_array( self::FEATURE_SLUG, $features['active'] ?? array(), true );
	}

	/**
	 * Whether the Jetpack SEO surface should be discoverable (admin menu registered).
	 *
	 * @return bool
	 */
	public static function is_seo_surface_visible() {
		return Surface_Visibility::is_visible();
	}

	/**
	 * Whether to offer an existing install the chance to opt into the new SEO experience.
	 *
	 * @return bool
	 */
	public static function is_optin_available() {
		return Surface_Visibility::is_optin_available();
	}

	/**
	 * Whether the SEO dashboard is plan-gated for this site.
	 *
	 * Gating applies only on WordPress.com (Simple + Atomic): `advanced-seo` is in the
	 * FREE plan's supports list, so `Current_Plan::supports( 'advanced-seo' )` returns
	 * true on self-hosted (never gated) and hijacks to `wpcom_site_has_feature()` on
	 * WordPress.com, where it's false below the Premium plan. Mirrors the AI SEO
	 * Enhancer's plan check in {@see Dashboard_Data::get_ai_data()}.
	 *
	 * Public because {@see Admin_Page::inject_script_data()} reads it to build the
	 * dashboard's gating payload, and {@see self::init()} uses it to decide whether the
	 * GEO-tab front-end services register at all.
	 *
	 * @return bool
	 */
	public static function is_gated() {
		return ( new Host() )->is_wpcom_platform()
			&& ! Current_Plan::supports( 'advanced-seo' );
	}

	/**
	 * The WordPress.com Premium checkout URL for this site, used by the upsell banner
	 * shown to gated sites.
	 *
	 * Built server-side because the client doesn't have the site slug. `value_bundle`
	 * is the wpcom Premium plan slug (see the `premium` entry in
	 * `Automattic\Jetpack\Current_Plan`), and `Status::get_site_suffix()` resolves the
	 * Calypso site slug (via `WPCOM_Masterbar::get_calypso_site_slug()` on wpcom).
	 *
	 * @return string
	 */
	public static function get_upsell_url() {
		$site_slug = ( new Status() )->get_site_suffix();

		return sprintf( 'https://wordpress.com/checkout/%s/value_bundle', $site_slug );
	}

	/**
	 * Whether the `seo-tools` Jetpack module is currently active.
	 *
	 * @return bool
	 */
	private static function is_seo_tools_module_active() {
		if ( ! class_exists( 'Automattic\\Jetpack\\Modules' ) ) {
			return false;
		}
		return ( new Modules() )->is_active( 'seo-tools' );
	}

	/**
	 * Record that the user has turned the sitemap off, so WordPress core's own sitemap
	 * is suppressed too. Hooked to the sitemaps module's deactivation, which fires only
	 * on a real toggle from a surface (the SEO Settings tab, the legacy Traffic page, or
	 * WP-CLI) — not wpcomsh's private-site suppression, which is a filter on the
	 * active-modules read rather than a deactivation.
	 *
	 * @return void
	 */
	public static function flag_sitemap_user_disabled() {
		update_option( self::SUPPRESS_WP_SITEMAP_OPTION, true );
	}

	/**
	 * Clear the deliberate-off flag when the sitemap is turned back on — the Jetpack
	 * sitemaps module then serves `/sitemap.xml` and suppresses core's duplicate itself.
	 *
	 * @return void
	 */
	public static function clear_sitemap_user_disabled() {
		delete_option( self::SUPPRESS_WP_SITEMAP_OPTION );
	}
}
