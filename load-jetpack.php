<?php
/**
 * Load all Jetpack files that do not get loaded via the autoloader.
 *
 * @package Jetpack
 */

use Automattic\Jetpack\Bootstrap;

Bootstrap::init();

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
