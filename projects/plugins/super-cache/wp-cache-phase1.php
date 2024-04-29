<?php

if ( ! function_exists( 'wp_cache_phase2' ) ) {
	require_once __DIR__. '/wp-cache-phase2.php';
}

// error_reporting(E_ERROR | E_PARSE); // uncomment to debug this file!
// directory where the configuration file lives.
if ( !defined( 'WPCACHECONFIGPATH' ) ) {
	define( 'WPCACHECONFIGPATH', WP_CONTENT_DIR );
}

if ( ! @include WPCACHECONFIGPATH . '/wp-cache-config.php' ) {
	return false;
}

// points at the wp-super-cache plugin directory because sometimes file paths are weird. Edge cases,
if ( ! defined( 'WPCACHEHOME' ) ) {
	define( 'WPCACHEHOME', __DIR__ . '/' );
}

if ( defined( 'DISABLE_SUPERCACHE' ) ) {
	wp_cache_debug( 'DISABLE_SUPERCACHE set, super_cache disabled.' );
	$super_cache_enabled = 0;
}

require WPCACHEHOME . 'wp-cache-base.php';

if ( '/' === $cache_path || empty( $cache_path ) ) {
	define( 'WPSCSHUTDOWNMESSAGE', 'WARNING! Caching disabled. Configuration corrupted. Reset configuration on Advanced Settings page.' );
	add_action( 'wp_footer', 'wpsc_shutdown_message' );
	if ( ! defined( 'DONOTCACHEPAGE' ) ) {
		define( 'DONOTCACHEPAGE', 1 );
	}
	return;
}

// $blog_cache_dir is used all over the code alongside the supercache directory but at least with multisite installs it appears to do nothing.
// I started putting everything in cache/supercache/blogname/path/ a long time ago but never got around to removing the code that used the blogs directory.
if ( $blogcacheid != '' ) {
	$blog_cache_dir = str_replace( '//', '/', $cache_path . 'blogs/' . $blogcacheid . '/' );
} else {
	$blog_cache_dir = $cache_path;
}

$wp_cache_phase1_loaded = true;

// part of the coarse file locking which should really be removed, but there are edge cases where semaphores didn't work in the past.
$mutex_filename = 'wp_cache_mutex.lock';
$new_cache      = false;

// write a plugin to extend wp-super-cache!
if ( ! isset( $wp_cache_plugins_dir ) ) {
	$wp_cache_plugins_dir = WPCACHEHOME . 'plugins';
}

// from the secret shown on the Advanced settings page.
if ( isset( $_GET['donotcachepage'] ) && isset( $cache_page_secret ) && $_GET['donotcachepage'] == $cache_page_secret ) {
	if ( ! defined( 'DONOTCACHEPAGE' ) ) {
		define( 'DONOTCACHEPAGE', 1 );
	}
}

// Load wp-super-cache plugins
$plugins = glob( $wp_cache_plugins_dir . '/*.php' );
if ( is_array( $plugins ) ) {
	foreach ( $plugins as $plugin ) {
		if ( is_file( $plugin ) ) {
			require_once $plugin;
		}
	}
}

// Load plugins from an array of php scripts. This needs to be documented.
if ( isset( $wpsc_plugins ) && is_array( $wpsc_plugins ) ) {
	foreach( $wpsc_plugins as $plugin_file ) {
		if ( file_exists( ABSPATH . $plugin_file ) ) {
			include_once( ABSPATH . $plugin_file );
		}
	}
}

// also look for plugins in wp-content/wp-super-cache-plugins/
if (
	file_exists( WPCACHEHOME . '../wp-super-cache-plugins/' ) &&
	is_dir( WPCACHEHOME . '../wp-super-cache-plugins/' )
) {
	$plugins = glob( WPCACHEHOME . '../wp-super-cache-plugins/*.php' );
	if ( is_array( $plugins ) ) {
		foreach ( $plugins as $plugin ) {
			if ( is_file( $plugin ) ) {
				require_once $plugin;
			}
		}
	}
}

// for timing purposes for the html comments
$wp_start_time = microtime();

if ( isset( $_SERVER['REQUEST_URI'] ) ) { // Cache this in case any plugin modifies it and filter out tracking parameters.
	// phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized WordPress.Security.ValidatedSanitizedInput.MissingUnslash -- none available before WordPress is loaded. Sanitized in wp_cache_postload().
	$wp_cache_request_uri = wpsc_remove_tracking_params_from_uri( $_SERVER['REQUEST_URI'] ); // phpcs:ignore

	// $wp_cache_request_uri is expected to be a string. If running from wp-cli it will be null.
	if ( $wp_cache_request_uri === null ) {
		$wp_cache_request_uri = '';
	}
} else {
	$wp_cache_request_uri = '';
}

// don't cache in wp-admin
if ( wpsc_is_backend() ) {
	if ( ! defined( 'DONOTCACHEPAGE' ) ) {
		define( 'DONOTCACHEPAGE', 1 );
	}
	return true;
}

// if a cookie is found that we don't like then don't serve/cache the page
if ( wpsc_is_rejected_cookie() ) {
	if ( ! defined( 'DONOTCACHEPAGE' ) ) {
		define( 'DONOTCACHEPAGE', 1 );
	}
	wp_cache_debug( 'Caching disabled because rejected cookie found.' );
	return true;
}

if ( wpsc_is_caching_user_disabled() ) {
	wp_cache_debug( 'Caching disabled for logged in users on settings page.' );
	if ( ! defined( 'DONOTCACHEPAGE' ) ) {
		define( 'DONOTCACHEPAGE', 1 );
	}
	return true;
}

// make logged in users anonymous so they are shown logged out pages.
if ( isset( $wp_cache_make_known_anon ) && $wp_cache_make_known_anon ) {
	wp_supercache_cache_for_admins();
}

// an init action wpsc plugins can hook on to.
do_cacheaction( 'cache_init' );

if ( ! $cache_enabled ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UndefinedVariable -- set by configuration or cache_init action
	return true;
}

// don't cache or serve cached files for various URLs, including the Customizer.
if ( isset( $_SERVER['REQUEST_METHOD'] ) && in_array( $_SERVER['REQUEST_METHOD'], array( 'POST', 'PUT', 'DELETE' ), true ) ) {
	wp_cache_debug( 'Caching disabled for non GET request.' );
	if ( ! defined( 'DONOTCACHEPAGE' ) ) {
		define( 'DONOTCACHEPAGE', 1 );
	}
	return true;
}

if ( isset( $_GET['customize_changeset_uuid'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
	wp_cache_debug( 'Caching disabled for customizer.' );
	if ( ! defined( 'DONOTCACHEPAGE' ) ) {
		define( 'DONOTCACHEPAGE', 1 );
	}
	return true;
}

$file_expired           = false;
$cache_filename         = '';
$meta_file              = '';
$wp_cache_gzip_encoding = '';

$gzipped = 0;
$gzsize  = 0;

if ( $cache_compression ) {
	$wp_cache_gzip_encoding = gzip_accepted(); // false or 'gzip'
}

// The wp_cache_check_mobile function appends "-mobile" to the cache filename if it detects a mobile visitor.
add_cacheaction( 'supercache_filename_str', 'wp_cache_check_mobile' );
if ( function_exists( 'add_filter' ) ) { // loaded since WordPress 4.6
	add_filter( 'supercache_filename_str', 'wp_cache_check_mobile' );
}

if ( defined( 'DOING_CRON' ) ) {
	// this is required for scheduled CRON jobs.
	extract( wp_super_cache_init() ); // $key, $cache_filename, $meta_file, $cache_file, $meta_pathname
	return true;
}

// late init delays serving a cache file until after the WordPress init actin has fired and (most of?) WordPress has loaded.
// If it's not enabled then serve a cache file now if possible.
if ( ! isset( $wp_super_cache_late_init ) || ( isset( $wp_super_cache_late_init ) && false == $wp_super_cache_late_init ) ) {
	wp_cache_serve_cache_file();
}
