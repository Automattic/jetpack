<?php
/**
 * Load all Jetpack files that do not get loaded via the autoloader.
 *
 * @package automattic/jetpack
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Checks if the code debug mode turned on, and returns false if it is. When Jetpack is in
 * code debug mode, it shouldn't use minified assets. Note that this filter is not being used
 * in every place where assets are enqueued. The filter is added at priority 9 to be overridden
 * by any default priority filter that runs after it.
 *
 * @since 6.2.0
 *
 * @return boolean
 *
 * @filter jetpack_should_use_minified_assets
 */
function jetpack_should_use_minified_assets() {
	return ! defined( 'SCRIPT_DEBUG' ) || ! SCRIPT_DEBUG;
}
add_filter( 'jetpack_should_use_minified_assets', 'jetpack_should_use_minified_assets', 9 );

// @todo: Abstract out the admin functions, and only include them if is_admin()
require_once JETPACK__PLUGIN_DIR . 'class.jetpack.php';
require_once JETPACK__PLUGIN_DIR . 'class.jetpack-network.php';
require_once JETPACK__PLUGIN_DIR . 'class.jetpack-client-server.php';
require_once JETPACK__PLUGIN_DIR . 'class.jetpack-user-agent.php';
require_once JETPACK__PLUGIN_DIR . 'class.jetpack-post-images.php';
require_once JETPACK__PLUGIN_DIR . 'class.jetpack-heartbeat.php';
require_once JETPACK__PLUGIN_DIR . 'class.photon.php';
require_once JETPACK__PLUGIN_DIR . 'functions.photon.php';
require_once JETPACK__PLUGIN_DIR . 'functions.global.php';
require_once JETPACK__PLUGIN_DIR . 'functions.compat.php';
require_once JETPACK__PLUGIN_DIR . 'class-jetpack-gallery-settings.php';
require_once JETPACK__PLUGIN_DIR . 'functions.cookies.php';
require_once JETPACK__PLUGIN_DIR . 'class.jetpack-autoupdate.php';
require_once JETPACK__PLUGIN_DIR . 'class.frame-nonce-preview.php';
require_once JETPACK__PLUGIN_DIR . 'modules/module-headings.php';
require_once JETPACK__PLUGIN_DIR . 'class.jetpack-plan.php';
// Used by the API endpoints or used in an odd number of places.
require_once JETPACK__PLUGIN_DIR . 'modules/seo-tools/class-jetpack-seo-utils.php';
require_once JETPACK__PLUGIN_DIR . 'modules/seo-tools/class-jetpack-seo-titles.php';
require_once JETPACK__PLUGIN_DIR . 'modules/seo-tools/class-jetpack-seo-posts.php';
require_once JETPACK__PLUGIN_DIR . 'modules/verification-tools/verification-tools-utils.php';
require_once JETPACK__PLUGIN_DIR . 'modules/shortcodes/shortcode-utils.php'; // Shortcodes are often referenced in other modules, so making it available early.

require_once JETPACK__PLUGIN_DIR . 'class-jetpack-xmlrpc-methods.php';
Jetpack_XMLRPC_Methods::init();

require_once JETPACK__PLUGIN_DIR . 'class-jetpack-connection-status.php';
Jetpack_Connection_Status::init();

require_once JETPACK__PLUGIN_DIR . '_inc/lib/class-jetpack-application-password-extras.php';
Jetpack_Application_Password_Extras::init();

require_once JETPACK__PLUGIN_DIR . '_inc/lib/class-jetpack-recommendations.php';

if ( is_admin() ) {
	require_once JETPACK__PLUGIN_DIR . 'class.jetpack-admin.php';
	require_once JETPACK__PLUGIN_DIR . '_inc/lib/debugger.php';

	// Initialize Newsletter Settings (always-loaded so the settings page URL works even when module is inactive).
	\Automattic\Jetpack\Newsletter\Settings::init();

	\Automattic\Jetpack\Newsletter\Writing_Prompt_Widget::init();

	\Automattic\Jetpack\Plugin\Jetpack_Script_Data::configure();

	/*
	 * The real Stats admin page lives in `modules/stats.php`, whose file is never
	 * loaded in Offline Mode (it requires a connection). Bootstrap the actual
	 * Odyssey Stats dashboard (the same one connected sites see) directly here
	 * instead -- `Stats_Dashboard::init()` has no dependency on the module file
	 * itself, only on the `stats`/`stats-admin` packages, which autoload
	 * regardless of module state. The underlying data calls are mocked with
	 * sample data in Offline Mode (see WPCOM_Stats::fetch_remote_stats()), so
	 * the real dashboard UI renders instead of erroring out with no connection.
	 */
	if ( ( new Automattic\Jetpack\Status() )->is_offline_mode() ) {
		Automattic\Jetpack\Stats_Admin\Dashboard::init();
	}

	/*
	 * The "Subscribers" menu item is normally registered by modules/subscriptions.php's
	 * add_subscribers_menu(), which -- for the default modernized path -- calls
	 * Subscribers_Announcement::add_menu() with no connection requirement of its own.
	 * But that module file (Requires Connection: Yes) is never loaded at all in Offline
	 * Mode, so the menu item silently disappears rather than being intentionally hidden.
	 * The announcement page itself is a static, connection-independent "subscriber
	 * management moved to Newsletter" notice, so it's safe to bootstrap directly here,
	 * scoped to Offline Mode only so the module's own registration is never duplicated
	 * once a real connection exists.
	 */
	if ( ( new Automattic\Jetpack\Status() )->is_offline_mode() && ! ( new Automattic\Jetpack\Status\Host() )->is_wpcom_platform() ) {
		\Automattic\Jetpack\Newsletter\Subscribers_Announcement::init();
		// init() hooks maybe_load_wp_build() to `admin_menu` at priority 1, which
		// require()s the announcement app's build.php and defines the JS render
		// function add_menu() checks for via function_exists(). add_menu() must
		// run after that -- calling it directly here (immediately, at plugin
		// bootstrap, long before `admin_menu` fires at all) would always find
		// the function undefined and permanently lock in the plain-text
		// render_fallback(), even though the real app would have been ready by
		// the time the page actually rendered.
		add_action( 'admin_menu', array( '\Automattic\Jetpack\Newsletter\Subscribers_Announcement', 'add_menu' ), 5 );
	}
}

// Play nice with https://wp-cli.org/.
if ( defined( 'WP_CLI' ) && WP_CLI ) {
	require_once JETPACK__PLUGIN_DIR . 'class.jetpack-cli.php';
}

require_once JETPACK__PLUGIN_DIR . '_inc/lib/class.core-rest-api-endpoints.php';
require_once JETPACK__PLUGIN_DIR . '_inc/blogging-prompts.php';
if ( is_admin() ) {
	require_once JETPACK__PLUGIN_DIR . '_inc/content-guidelines-ai.php';
}

add_action( 'updating_jetpack_version', array( 'Jetpack', 'do_version_bump' ), 10, 2 );
add_action( 'updating_jetpack_version', array( 'Jetpack', 'activate_subscriptions_module_for_existing_sites' ), 10, 2 );
// Seed + keep in sync the durable Jetpack SEO module-state options while the legacy
// Sitemaps / Canonical URLs modules still exist. Removed in the deferred post-convergence
// follow-up that absorbs those modules into Jetpack SEO.
Jetpack::register_seo_module_migration_hooks();
add_action( 'updating_jetpack_version', array( 'Jetpack', 'seed_seo_visibility_cohort' ), 10, 2 );
add_filter( 'is_jetpack_site', '__return_true' );

require_once JETPACK__PLUGIN_DIR . '3rd-party/3rd-party.php';

Jetpack::init();
