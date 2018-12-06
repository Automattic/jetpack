<?php

/*
 * Plugin Name: Jetpack by WordPress.com
 * Plugin URI: https://jetpack.com
 * Description: Bring the power of the WordPress.com cloud to your self-hosted WordPress. Jetpack enables you to connect your blog to a WordPress.com account to use the powerful features normally only available to WordPress.com users.
 * Author: Automattic
 * Version: 6.8.1
 * Author URI: https://jetpack.com
 * License: GPL2+
 * Text Domain: jetpack
 * Domain Path: /languages/
 */

define( 'JETPACK__MINIMUM_WP_VERSION', '4.8' );

define( 'JETPACK__VERSION',            '6.8.1' );
define( 'JETPACK_MASTER_USER',         true );
define( 'JETPACK__API_VERSION',        1 );
define( 'JETPACK__PLUGIN_DIR',         plugin_dir_path( __FILE__ ) );
define( 'JETPACK__PLUGIN_FILE',        __FILE__ );

defined( 'JETPACK_CLIENT__AUTH_LOCATION' )   or define( 'JETPACK_CLIENT__AUTH_LOCATION', 'header' );
defined( 'JETPACK_CLIENT__HTTPS' )           or define( 'JETPACK_CLIENT__HTTPS', 'AUTO' );
defined( 'JETPACK__GLOTPRESS_LOCALES_PATH' ) or define( 'JETPACK__GLOTPRESS_LOCALES_PATH', JETPACK__PLUGIN_DIR . 'locales.php' );
defined( 'JETPACK__API_BASE' )               or define( 'JETPACK__API_BASE', 'https://jetpack.wordpress.com/jetpack.' );
defined( 'JETPACK_PROTECT__API_HOST' )       or define( 'JETPACK_PROTECT__API_HOST', 'https://api.bruteprotect.com/' );
defined( 'JETPACK__WPCOM_JSON_API_HOST' )    or define( 'JETPACK__WPCOM_JSON_API_HOST', 'public-api.wordpress.com' );

defined( 'JETPACK__SANDBOX_DOMAIN' ) or define( 'JETPACK__SANDBOX_DOMAIN', '' );

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
require_once( JETPACK__PLUGIN_DIR . 'class.jetpack.php'               );
require_once( JETPACK__PLUGIN_DIR . 'class.jetpack-network.php'       );
require_once( JETPACK__PLUGIN_DIR . 'class.jetpack-client.php'        );
require_once( JETPACK__PLUGIN_DIR . 'class.jetpack-data.php'          );
require_once( JETPACK__PLUGIN_DIR . 'class.jetpack-client-server.php' );
require_once( JETPACK__PLUGIN_DIR . 'sync/class.jetpack-sync-actions.php' );
require_once( JETPACK__PLUGIN_DIR . 'class.jetpack-options.php'       );
require_once( JETPACK__PLUGIN_DIR . 'class.jetpack-user-agent.php'    );
require_once( JETPACK__PLUGIN_DIR . 'class.jetpack-post-images.php'   );
require_once( JETPACK__PLUGIN_DIR . 'class.jetpack-error.php'         );
require_once( JETPACK__PLUGIN_DIR . 'class.jetpack-heartbeat.php'     );
require_once( JETPACK__PLUGIN_DIR . 'class.photon.php'                );
require_once( JETPACK__PLUGIN_DIR . 'functions.photon.php'            );
require_once( JETPACK__PLUGIN_DIR . 'functions.global.php'            );
require_once( JETPACK__PLUGIN_DIR . 'functions.compat.php'            );
require_once( JETPACK__PLUGIN_DIR . 'functions.gallery.php'           );
require_once( JETPACK__PLUGIN_DIR . 'require-lib.php'                 );
require_once( JETPACK__PLUGIN_DIR . 'class.jetpack-autoupdate.php'    );
require_once( JETPACK__PLUGIN_DIR . 'class.jetpack-tracks.php'        );
require_once( JETPACK__PLUGIN_DIR . 'class.frame-nonce-preview.php'   );
require_once( JETPACK__PLUGIN_DIR . 'modules/module-headings.php');
require_once( JETPACK__PLUGIN_DIR . 'class.jetpack-constants.php');
require_once( JETPACK__PLUGIN_DIR . 'class.jetpack-idc.php'  );
require_once( JETPACK__PLUGIN_DIR . 'class.jetpack-connection-banner.php'  );

if ( is_admin() ) {
	require_once( JETPACK__PLUGIN_DIR . 'class.jetpack-admin.php'     );
	require_once( JETPACK__PLUGIN_DIR . 'class.jetpack-jitm.php'      );
	require_once( JETPACK__PLUGIN_DIR . 'class.jetpack-debugger.php'  );
}

// Play nice with http://wp-cli.org/
if ( defined( 'WP_CLI' ) && WP_CLI ) {
	require_once( JETPACK__PLUGIN_DIR . 'class.jetpack-cli.php'       );
}

require_once( JETPACK__PLUGIN_DIR . '_inc/lib/class.core-rest-api-endpoints.php' );

register_activation_hook( __FILE__, array( 'Jetpack', 'plugin_activation' ) );
register_deactivation_hook( __FILE__, array( 'Jetpack', 'plugin_deactivation' ) );
add_action( 'updating_jetpack_version', array( 'Jetpack', 'do_version_bump' ), 10, 2 );
add_action( 'init', array( 'Jetpack', 'init' ) );
add_action( 'plugins_loaded', array( 'Jetpack', 'plugin_textdomain' ), 99 );
add_action( 'plugins_loaded', array( 'Jetpack', 'load_modules' ), 100 );
add_filter( 'jetpack_static_url', array( 'Jetpack', 'staticize_subdomain' ) );
add_filter( 'is_jetpack_site', '__return_true' );

/**
 * Add an easy way to photon-ize a URL that is safe to call even if Jetpack isn't active.
 *
 * See: http://jetpack.com/2013/07/11/photon-and-themes/
 */
if ( Jetpack::is_module_active( 'photon' ) ) {
	add_filter( 'jetpack_photon_url', 'jetpack_photon_url', 10, 3 );
}

if ( JETPACK__SANDBOX_DOMAIN ) {
	require_once( JETPACK__PLUGIN_DIR . '_inc/jetpack-server-sandbox.php' );
}

require_once( JETPACK__PLUGIN_DIR . '3rd-party/3rd-party.php' );

Jetpack::init();
