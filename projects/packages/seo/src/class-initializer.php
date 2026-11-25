<?php
/**
 * Bootstrap the Jetpack SEO dashboard and its services.
 *
 * @package automattic/jetpack-seo-package
 */

namespace Automattic\Jetpack\SEO;

use Automattic\Jetpack\Admin_UI\Admin_Shell;
use Automattic\Jetpack\Modules;
use Automattic\Jetpack\Status\Host;

/**
 * Boots the package and carries its cross-plugin contract:
 * the script-data key, and the option names / visibility reads other plugins consume.
 */
class Initializer {

	/**
	 * Jetpack SEO package version.
	 *
	 * @var string
	 */
	const PACKAGE_VERSION = '0.13.0';

	/**
	 * Key under `window.JetpackScriptData` the React app reads its state from
	 * (`window.JetpackScriptData.seo`). Must match the JS-side reader in
	 * `_inc/data/get-overview.ts`.
	 */
	const SCRIPT_DATA_KEY = 'seo';

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
	 * Legacy discoverability preference, retained for older clients and integrations.
	 *
	 * The dashboard is available on eligible hosts regardless of this value. Migration
	 * leaves the saved preference untouched and does not change module activation.
	 *
	 * @var string
	 */
	const VISIBILITY_OPTION = 'jetpack_seo_surface_visible_v2';

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

		if ( ! self::is_available() ) {
			return;
		}

		Llms_Txt::register_redirect_filters();

		// Before anything can read the AI crawler choices.
		Ai_Crawlers::register_legacy_migration();

		// Keep the explicit opt-in route for older clients; the new surface no longer offers it.
		add_action( 'rest_api_init', array( Surface_Visibility::class, 'register_optin_route' ) );

		// Legacy admin surfaces use these signals to retire their replaced controls.
		add_filter( 'jetpack_admin_js_script_data', array( Surface_Visibility::class, 'inject_optin_availability' ) );

		// Honor a deliberate sitemap-off choice independently of dashboard visibility.
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

		// Each SEO module's configure URL defaults to Jetpack › Settings filtered to the
		// module. Once the surface is visible that view only points here, so link here.
		foreach ( array( 'seo-tools', 'verification-tools', 'sitemaps' ) as $module ) {
			add_filter( 'jetpack_module_configuration_url_' . $module, array( Admin_Page::class, 'get_url' ) );
		}

		// The page registers whenever the surface is visible, even with `seo-tools` off, so
		// a saved link still offers "Enable SEO tools"; the menu item hides with the module.
		//
		// Priority 1: load the wp-build bundle (and define its render function)
		// before `add_menu_item()` runs at the default priority and needs it.
		add_action( 'admin_menu', array( Admin_Page::class, 'maybe_load_wp_build' ), 1 );
		add_action( 'admin_menu', array( Admin_Page::class, 'add_menu_item' ), 10 );

		if ( class_exists( Admin_Shell::class ) ) {
			add_filter( 'jetpack_admin_shell_members', array( Admin_Page::class, 'add_admin_shell_member' ) );
		}

		// Read-only REST routes the dashboard hydrates its initial state from. Preloaded
		// into the page (see Admin_Page::inject_script_data) so a normal load resolves
		// them with no request, and fetched by the app when that preload is missing or
		// stale — so the dashboard recovers its data instead of dead-ending. Registered
		// whenever the surface is visible (independent of the seo-tools module, like the
		// Overview).
		add_action( 'rest_api_init', array( Dashboard_Data::class, 'register_rest_reads' ) );

		self::register_write_hooks();

		Indexnow::init();

		Indexnow_Client::init();
		add_action( 'rest_api_init', array( Data_Sharing::class, 'register_routes' ) );

		// Editing routes and output follow the saved SEO Tools activation choice.
		if ( self::is_seo_tools_module_active() ) {
			Share_Image::init();
			Schema_Builder::init();
			Author_Schema_Node::init();
			Canonical_Urls::init();
			Llms_Txt::init();
			Ai_Crawlers::init();

			// Wait for init-time conflict filters before core builds its settings route.
			add_action( 'rest_api_init', array( Dashboard_Data::class, 'register_rest_settings' ), 5 );
			add_action( 'rest_api_init', array( Dashboard_Data::class, 'register_module_routes' ) );

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
	 * Register content-write hooks for ordinary and centralized API requests.
	 * Centralized API requests select their site after plugins_loaded and skip init().
	 *
	 * @return void
	 */
	public static function register_write_hooks() {
		Indexnow_Events::init();
		Indexnow_Queue::init();
		Content_Coverage::register_invalidation();
		Llms_Txt::register_always_include();
		Llms_Txt::register_invalidation();
	}

	/**
	 * Whether the Jetpack SEO product is available on this site.
	 *
	 * Availability is independent of plan refreshes and connection state.
	 *
	 * @return bool
	 */
	public static function is_available() {
		return ! ( new Host() )->is_vip_site();
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
	 * Legacy opt-in signal retained for older admin clients.
	 *
	 * @return bool
	 */
	public static function is_optin_available() {
		return Surface_Visibility::is_optin_available();
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
