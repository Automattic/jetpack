<?php

/*
 * Plugin Name: Jetpack by WordPress.com
 * Plugin URI: http://wordpress.org/extend/plugins/jetpack/
 * Description: Bring the power of the WordPress.com cloud to your self-hosted WordPress. Jetpack enables you to connect your blog to a WordPress.com account to use the powerful features normally only available to WordPress.com users.
 * Author: Automattic
 * Version: 2.5
 * Author URI: http://jetpack.me
 * License: GPL2+
 * Text Domain: jetpack
 * Domain Path: /languages/
 */

defined( 'JETPACK__API_BASE' ) or define( 'JETPACK__API_BASE', 'https://jetpack.wordpress.com/jetpack.' );
define( 'JETPACK__API_VERSION', 1 );
define( 'JETPACK__MINIMUM_WP_VERSION', '3.5' );
defined( 'JETPACK_CLIENT__AUTH_LOCATION' ) or define( 'JETPACK_CLIENT__AUTH_LOCATION', 'header' );
defined( 'JETPACK_CLIENT__HTTPS' ) or define( 'JETPACK_CLIENT__HTTPS', 'AUTO' );
define( 'JETPACK__VERSION', '2.5' );
define( 'JETPACK__PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
defined( 'JETPACK__GLOTPRESS_LOCALES_PATH' ) or define( 'JETPACK__GLOTPRESS_LOCALES_PATH', JETPACK__PLUGIN_DIR . 'locales.php' );

define( 'JETPACK_MASTER_USER', true );

// Constants for expressing human-readable intervals
// in their respective number of seconds.
// Introduced in WordPress 3.5, specified here for backward compatability.
defined( 'MINUTE_IN_SECONDS' ) or define( 'MINUTE_IN_SECONDS', 60 );
defined( 'HOUR_IN_SECONDS' )   or define( 'HOUR_IN_SECONDS',   60 * MINUTE_IN_SECONDS );
defined( 'DAY_IN_SECONDS' )    or define( 'DAY_IN_SECONDS',    24 * HOUR_IN_SECONDS   );
defined( 'WEEK_IN_SECONDS' )   or define( 'WEEK_IN_SECONDS',    7 * DAY_IN_SECONDS    );
defined( 'YEAR_IN_SECONDS' )   or define( 'YEAR_IN_SECONDS',  365 * DAY_IN_SECONDS    );

// @todo: Abstract out the admin functions, and only include them if is_admin()
// @todo: Only include things like class.jetpack-sync.php if we're connected.
require_once( JETPACK__PLUGIN_DIR . 'class.jetpack.php'               );
require_once( JETPACK__PLUGIN_DIR . 'class.jetpack-client.php'        );
require_once( JETPACK__PLUGIN_DIR . 'class.jetpack-data.php'          );
require_once( JETPACK__PLUGIN_DIR . 'class.jetpack-client-server.php' );
require_once( JETPACK__PLUGIN_DIR . 'class.jetpack-sync.php'          );
require_once( JETPACK__PLUGIN_DIR . 'class.jetpack-options.php'       );
require_once( JETPACK__PLUGIN_DIR . 'class.jetpack-user-agent.php'    );
require_once( JETPACK__PLUGIN_DIR . 'class.jetpack-post-images.php'   );
require_once( JETPACK__PLUGIN_DIR . 'class.jetpack-error.php'         );
require_once( JETPACK__PLUGIN_DIR . 'class.jetpack-debugger.php'      );
require_once( JETPACK__PLUGIN_DIR . 'class.jetpack-heartbeat.php'     );
require_once( JETPACK__PLUGIN_DIR . 'class.photon.php'                );
require_once( JETPACK__PLUGIN_DIR . 'functions.photon.php'            );
require_once( JETPACK__PLUGIN_DIR . 'functions.compat.php'            );
require_once( JETPACK__PLUGIN_DIR . 'functions.gallery.php'           );
require_once( JETPACK__PLUGIN_DIR . 'functions.twitter-cards.php'     );
require_once( JETPACK__PLUGIN_DIR . 'require-lib.php'                 ); 

register_activation_hook( __FILE__, array( 'Jetpack', 'plugin_activation' ) );
register_deactivation_hook( __FILE__, array( 'Jetpack', 'plugin_deactivation' ) );

add_action( 'init', array( 'Jetpack', 'init' ) );
add_action( 'plugins_loaded', array( 'Jetpack', 'load_modules' ), 100 );
add_filter( 'jetpack_static_url', array( 'Jetpack', 'staticize_subdomain' ) );

add_filter( 'jetpack_open_graph_tags', 'change_twitter_site_param' );

function change_twitter_site_param( $og_tags ) {
	$og_tags['twitter:site'] = '@jetpack';
	return $og_tags;
}

/**
 * Add an easy way to photon-ize a URL that is safe to call even if Jetpack isn't active.
 *
 * See: http://jetpack.me/2013/07/11/photon-and-themes/
 */
if ( Jetpack::init()->is_module_active( 'photon' ) ) {
	add_filter( 'jetpack_photon_url', 'jetpack_photon_url', 10, 3 );
} else {
	remove_filter( 'jetpack_photon_url', 'jetpack_photon_url', 10, 3 );
}

/*
if ( is_admin() && ! Jetpack::check_identity_crisis() ) {
	Jetpack_Sync::sync_options( __FILE__, 'db_version', 'jetpack_active_modules', 'active_plugins' );
}
*/
