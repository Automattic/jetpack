<?php

/*
 * Plugin Name: Jetpack by WordPress.com
 * Plugin URI: http://wordpress.org/extend/plugins/jetpack/
 * Description: Bring the power of the WordPress.com cloud to your self-hosted WordPress. Jetpack enables you to connect your blog to a WordPress.com account to use the powerful features normally only available to WordPress.com users.
 * Author: Automattic
 * Version: 3.2.1
 * Author URI: http://jetpack.me
 * License: GPL2+
 * Text Domain: jetpack
 * Domain Path: /languages/
 */

define( 'JETPACK__MINIMUM_WP_VERSION', '3.9' );

define( 'JETPACK__VERSION',            '3.2.1' );
define( 'JETPACK_MASTER_USER',         true );
define( 'JETPACK__API_VERSION',        1 );
define( 'JETPACK__PLUGIN_DIR',         plugin_dir_path( __FILE__ ) );
define( 'JETPACK__PLUGIN_FILE',        __FILE__ );

defined( 'JETPACK_CLIENT__AUTH_LOCATION' )   or define( 'JETPACK_CLIENT__AUTH_LOCATION', 'header' );
defined( 'JETPACK_CLIENT__HTTPS' )           or define( 'JETPACK_CLIENT__HTTPS', 'AUTO' );
defined( 'JETPACK__GLOTPRESS_LOCALES_PATH' ) or define( 'JETPACK__GLOTPRESS_LOCALES_PATH', JETPACK__PLUGIN_DIR . 'locales.php' );
defined( 'JETPACK__API_BASE' )               or define( 'JETPACK__API_BASE', 'https://jetpack.wordpress.com/jetpack.' );

// @todo: Abstract out the admin functions, and only include them if is_admin()
// @todo: Only include things like class.jetpack-sync.php if we're connected.
require_once( JETPACK__PLUGIN_DIR . 'class.jetpack.php'               );
require_once( JETPACK__PLUGIN_DIR . 'class.jetpack-network.php'       );
require_once( JETPACK__PLUGIN_DIR . 'class.jetpack-client.php'        );
require_once( JETPACK__PLUGIN_DIR . 'class.jetpack-data.php'          );
require_once( JETPACK__PLUGIN_DIR . 'class.jetpack-client-server.php' );
require_once( JETPACK__PLUGIN_DIR . 'class.jetpack-sync.php'          );
require_once( JETPACK__PLUGIN_DIR . 'class.jetpack-options.php'       );
require_once( JETPACK__PLUGIN_DIR . 'class.jetpack-user-agent.php'    );
require_once( JETPACK__PLUGIN_DIR . 'class.jetpack-post-images.php'   );
require_once( JETPACK__PLUGIN_DIR . 'class.media-extractor.php'       );
require_once( JETPACK__PLUGIN_DIR . 'class.media-summary.php'         );
require_once( JETPACK__PLUGIN_DIR . 'class.jetpack-error.php'         );
require_once( JETPACK__PLUGIN_DIR . 'class.jetpack-debugger.php'      );
require_once( JETPACK__PLUGIN_DIR . 'class.jetpack-heartbeat.php'     );
require_once( JETPACK__PLUGIN_DIR . 'class.photon.php'                );
require_once( JETPACK__PLUGIN_DIR . 'functions.photon.php'            );
require_once( JETPACK__PLUGIN_DIR . 'functions.compat.php'            );
require_once( JETPACK__PLUGIN_DIR . 'functions.gallery.php'           );
require_once( JETPACK__PLUGIN_DIR . 'require-lib.php'                 );
require_once( JETPACK__PLUGIN_DIR . 'class.jetpack-autoupdate.php'    );

if ( is_admin() ) {
	require_once( JETPACK__PLUGIN_DIR . 'class.jetpack-admin.php'     );
}

// Play nice with http://wp-cli.org/
if ( defined( 'WP_CLI' ) && WP_CLI ) {
	require_once( JETPACK__PLUGIN_DIR . 'class.jetpack-cli.php'       );
}

register_activation_hook( __FILE__, array( 'Jetpack', 'plugin_activation' ) );
register_deactivation_hook( __FILE__, array( 'Jetpack', 'plugin_deactivation' ) );

add_action( 'init', array( 'Jetpack', 'init' ) );
add_action( 'plugins_loaded', array( 'Jetpack', 'load_modules' ), 100 );
add_filter( 'jetpack_static_url', array( 'Jetpack', 'staticize_subdomain' ) );

/**
 * Add an easy way to photon-ize a URL that is safe to call even if Jetpack isn't active.
 *
 * See: http://jetpack.me/2013/07/11/photon-and-themes/
 */
if ( Jetpack::is_module_active( 'photon' ) ) {
	add_filter( 'jetpack_photon_url', 'jetpack_photon_url', 10, 3 );
}

/*
if ( is_admin() && ! Jetpack::check_identity_crisis() ) {
	Jetpack_Sync::sync_options( __FILE__, 'db_version', 'jetpack_active_modules', 'active_plugins' );
}
*/

require_once( JETPACK__PLUGIN_DIR . '3rd-party/3rd-party.php' );
