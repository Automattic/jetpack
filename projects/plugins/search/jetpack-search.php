<?php
/**
 *
 * Plugin Name: Jetpack Search
 * Plugin URI: https://jetpack.com/search/
 * Description: A cloud-powered replacement for WordPress' search.
 * Version: 0.1.0-alpha
 * Author: Automattic
 * Author URI: https://jetpack.com/
 * License: GPLv2 or later
 * Text Domain: jetpack-search
 *
 * @package automattic/jetpack-search
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

// Constant definitions.
define( 'JETPACK_SEARCH_PLUGIN__DIR', plugin_dir_path( __FILE__ ) );
define( 'JETPACK_SEARCH_PLUGIN__SLUG', 'jetpack-backup' );
define( 'JETPACK_SEARCH_PLUGIN__VERSION', '0.1.0-alpha' );
