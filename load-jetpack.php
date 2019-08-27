<?php
/**
 * Load all Jetpack files that do not get loaded via the autoloader.
 *
 * @package Jetpack
 */

/**
 * Returns the location of Jetpack's lib directory. This filter is applied
 * in require_lib().
 *
 * @since 4.0.2
 *
 * @return string Location of Jetpack library directory.
 *
 * @filter require_lib_dir
 */
function jetpack_require_lib_dir() {
	return JETPACK__PLUGIN_DIR . '_inc/lib';
}
add_filter( 'jetpack_require_lib_dir', 'jetpack_require_lib_dir' );

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
	if ( defined( 'SCRIPT_DEBUG' ) && SCRIPT_DEBUG ) {
		return false;
	}
	return true;
}
add_filter( 'jetpack_should_use_minified_assets', 'jetpack_should_use_minified_assets', 9 );

// @todo: Abstract out the admin functions, and only include them if is_admin()
require_once JETPACK__PLUGIN_DIR . 'class.jetpack.php';
require_once JETPACK__PLUGIN_DIR . 'class.jetpack-network.php';
require_once JETPACK__PLUGIN_DIR . 'class.jetpack-data.php';
require_once JETPACK__PLUGIN_DIR . 'class.jetpack-client-server.php';
require_once JETPACK__PLUGIN_DIR . 'class.jetpack-user-agent.php';
require_once JETPACK__PLUGIN_DIR . 'class.jetpack-post-images.php';
require_once JETPACK__PLUGIN_DIR . 'class.jetpack-error.php';
require_once JETPACK__PLUGIN_DIR . 'class.jetpack-heartbeat.php';
require_once JETPACK__PLUGIN_DIR . 'class.photon.php';
require_once JETPACK__PLUGIN_DIR . 'functions.photon.php';
require_once JETPACK__PLUGIN_DIR . 'functions.global.php';
require_once JETPACK__PLUGIN_DIR . 'functions.compat.php';
require_once JETPACK__PLUGIN_DIR . 'functions.gallery.php';
require_once JETPACK__PLUGIN_DIR . 'require-lib.php';
require_once JETPACK__PLUGIN_DIR . 'class.jetpack-autoupdate.php';
require_once JETPACK__PLUGIN_DIR . 'class.frame-nonce-preview.php';
require_once JETPACK__PLUGIN_DIR . 'modules/module-headings.php';
require_once JETPACK__PLUGIN_DIR . 'class.jetpack-idc.php';
require_once JETPACK__PLUGIN_DIR . 'class.jetpack-connection-banner.php';
require_once JETPACK__PLUGIN_DIR . 'class.jetpack-plan.php';

\Automattic\Jetpack\Sync\Main::init();

if ( is_admin() ) {
	require_once JETPACK__PLUGIN_DIR . 'class.jetpack-admin.php';
	require_once JETPACK__PLUGIN_DIR . 'class.jetpack-affiliate.php';
	$jitm = new Automattic\Jetpack\JITM();
	$jitm->register();
	jetpack_require_lib( 'debugger' );
}

// Play nice with https://wp-cli.org/.
if ( defined( 'WP_CLI' ) && WP_CLI ) {
	require_once JETPACK__PLUGIN_DIR . 'class.jetpack-cli.php';
}

require_once JETPACK__PLUGIN_DIR . '_inc/lib/class.core-rest-api-endpoints.php';

add_action( 'updating_jetpack_version', array( 'Jetpack', 'do_version_bump' ), 10, 2 );
add_action( 'init', array( 'Jetpack', 'init' ) );
add_action( 'plugins_loaded', array( 'Jetpack', 'plugin_textdomain' ), 99 );
add_action( 'plugins_loaded', array( 'Jetpack', 'load_modules' ), 100 );
add_filter( 'jetpack_static_url', array( 'Jetpack', 'staticize_subdomain' ) );
add_filter( 'is_jetpack_site', '__return_true' );

/**
 * Add an easy way to photon-ize a URL that is safe to call even if Jetpack isn't active.
 *
 * See: https://jetpack.com/2013/07/11/photon-and-themes/
 */
if ( Jetpack::is_module_active( 'photon' ) ) {
	add_filter( 'jetpack_photon_url', 'jetpack_photon_url', 10, 3 );
}

if ( JETPACK__SANDBOX_DOMAIN ) {
	require_once JETPACK__PLUGIN_DIR . '_inc/jetpack-server-sandbox.php';
}

require_once JETPACK__PLUGIN_DIR . '3rd-party/3rd-party.php';

Jetpack::init();
