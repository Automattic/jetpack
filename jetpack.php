<?php

/*
 * Plugin Name: Jetpack by WordPress.com
 * Plugin URI: https://jetpack.com
 * Description: Bring the power of the WordPress.com cloud to your self-hosted WordPress. Jetpack enables you to connect your blog to a WordPress.com account to use the powerful features normally only available to WordPress.com users.
 * Author: Automattic
 * Version: 7.2-alpha
 * Author URI: https://jetpack.com
 * License: GPL2+
 * Text Domain: jetpack
 * Domain Path: /languages/
 */

define( 'JETPACK__VERSION',            '7.2-alpha' );
define( 'JETPACK_MASTER_USER',         true );
define( 'JETPACK__PLUGIN_DIR',         plugin_dir_path( __FILE__ ) );
define( 'JETPACK__PLUGIN_FILE',        __FILE__ );
defined( 'JETPACK__GLOTPRESS_LOCALES_PATH' ) or define( 'JETPACK__GLOTPRESS_LOCALES_PATH', JETPACK__PLUGIN_DIR . 'locales.php' );
defined( 'JETPACK__SANDBOX_DOMAIN' ) or define( 'JETPACK__SANDBOX_DOMAIN', '' );

// ensure a default autoload mechanism is available
// this is filterable so on future platforms we can use a single autoloader
// that compiles all plugin dependencies in one place
if ( ! has_filter( 'jetpack_autoload' ) ) {
	add_filter( 'jetpack_autoload', function( $plugin, $loader ) {
		return require_once plugin_dir_path( $plugin ) . '/vendor/autoload.php';
	}, 10, 2 );
}

$loader = apply_filters( 'jetpack_autoload', __FILE__, false );

// this should autoload the bootstrap file
$plugin = new \Jetpack\V7\Core\Bootstrap();
$plugin->load( $loader );

// Initialize the plugin if not already loaded.
add_action( 'init', function(){


});




// @todo: Abstract out the admin functions, and only include them if is_admin()
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
require_once( JETPACK__PLUGIN_DIR . 'class.jetpack-plan.php'          );

if ( is_admin() ) {
	require_once( JETPACK__PLUGIN_DIR . 'class.jetpack-admin.php'     );
	require_once( JETPACK__PLUGIN_DIR . 'class.jetpack-jitm.php'      );
	require_once( JETPACK__PLUGIN_DIR . 'class.jetpack-affiliate.php' );
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
