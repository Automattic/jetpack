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

// always load this

// TODO: use a filter to look up the loader - thanks Eric!
$loader = require JETPACK__PLUGIN_DIR . '/vendor/autoload.php';

// by making this check first, we never load the Bootstrap class more than once
if ( ! defined( 'Jetpack_V7_Core_Loaded' ) ) {
	// this should autoload the bootstrap file
	$plugin = new \Jetpack\V7\Core\Bootstrap();
	$plugin->load();
} else {
	// $loader->addClassMap ?? reuse existing loading instance

}

// classes to load:
// Client
// Debugger
// Compat

// eventually we won't have to force these to load, but right now they define constants that are used elsewhere in Jetpack
$loader->loadClass( 'Jetpack\V7\Core\Client'   );
$loader->loadClass( 'Jetpack\V7\Core\Debugger' );
$loader->loadClass( 'Jetpack\V7\Core\Compat'   );
$loader->loadClass( 'Jetpack\V7\Core\Api'      );
$loader->loadClass( 'Jetpack\V7\Core\Lib'      );

// Initialize the plugin if not already loaded.
add_action( 'init', function(){


});

// Optional, remove later
// Protect









// legacy classes
$loader->loadClass( 'Jetpack' );



// @todo: Abstract out the admin functions, and only include them if is_admin()
// require_once( JETPACK__PLUGIN_DIR . 'class.jetpack.php'               );
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
