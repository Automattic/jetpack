<?php

if ( ! function_exists( 'wp_cache_phase2' ) ) {
	require_once dirname( __FILE__ ) . '/wp-cache-phase2.php';
}

// error_reporting(E_ERROR | E_PARSE); // uncomment to debug this file!
if ( !defined( 'WPCACHECONFIGPATH' ) ) {
  define( 'WPCACHECONFIGPATH', WP_CONTENT_DIR );
} 

if ( ! @include WPCACHECONFIGPATH . '/wp-cache-config.php' ) {
	return false;
}

if ( ! defined( 'WPCACHEHOME' ) ) {
	define( 'WPCACHEHOME', dirname( __FILE__ ) . '/' );
}

if ( defined( 'DISABLE_SUPERCACHE' ) ) {
	wp_cache_debug( 'DISABLE_SUPERCACHE set, super_cache disabled.' );
	$super_cache_enabled = 0;
}

require WPCACHEHOME . 'wp-cache-base.php';

if ( '/' === $cache_path || empty( $cache_path ) ) {
	define( 'WPSCSHUTDOWNMESSAGE', 'WARNING! Caching disabled. Configuration corrupted. Reset configuration on Advanced Settings page.' );
	add_action( 'wp_footer', 'wpsc_shutdown_message' );
	define( 'DONOTCACHEPAGE', 1 );
	return;
}

if ( $blogcacheid != '' ) {
	$blog_cache_dir = str_replace( '//', '/', $cache_path . 'blogs/' . $blogcacheid . '/' );
} else {
	$blog_cache_dir = $cache_path;
}

$wp_cache_phase1_loaded = true;

$mutex_filename = 'wp_cache_mutex.lock';
$new_cache      = false;

if ( ! isset( $wp_cache_plugins_dir ) ) {
	$wp_cache_plugins_dir = WPCACHEHOME . 'plugins';
}

if ( isset( $_GET['donotcachepage'] ) && isset( $cache_page_secret ) && $_GET['donotcachepage'] == $cache_page_secret ) {
	$cache_enabled = false;
	define( 'DONOTCACHEPAGE', 1 );
}

$plugins = glob( $wp_cache_plugins_dir . '/*.php' );
if ( is_array( $plugins ) ) {
	foreach ( $plugins as $plugin ) {
		if ( is_file( $plugin ) ) {
			require_once $plugin;
		}
	}
}

if ( isset( $wpsc_plugins ) && is_array( $wpsc_plugins ) ) {
	foreach( $wpsc_plugins as $plugin_file ) {
		if ( file_exists( ABSPATH . $plugin_file ) ) {
			include_once( ABSPATH . $plugin_file );
		}
	}
}

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

$wp_start_time = microtime();

if ( wpsc_is_backend() ) {
	return true;
}

if ( wpsc_is_rejected_cookie() ) {
	define( 'DONOTCACHEPAGE', 1 );
	$cache_enabled = false;
	wp_cache_debug( 'Caching disabled because rejected cookie found.' );
	return true;
}

if ( wpsc_is_caching_user_disabled() ) {
	wp_cache_debug( 'Caching disabled for logged in users on settings page.' );
	return true;
}

if ( isset( $wp_cache_make_known_anon ) && $wp_cache_make_known_anon ) {
	wp_supercache_cache_for_admins();
}

do_cacheaction( 'cache_init' );

if ( ! $cache_enabled || ( isset( $_SERVER['REQUEST_METHOD'] ) && in_array( $_SERVER['REQUEST_METHOD'], array( 'POST', 'PUT', 'DELETE' ) ) ) || isset( $_GET['customize_changeset_uuid'] ) ) {
	return true;
}

$file_expired           = false;
$cache_filename         = '';
$meta_file              = '';
$wp_cache_gzip_encoding = '';

$gzipped = 0;
$gzsize  = 0;

if ( $cache_compression ) {
	$wp_cache_gzip_encoding = gzip_accepted();
}

add_cacheaction( 'supercache_filename_str', 'wp_cache_check_mobile' );
if ( function_exists( 'add_filter' ) ) { // loaded since WordPress 4.6
	add_filter( 'supercache_filename_str', 'wp_cache_check_mobile' );
}

$wp_cache_request_uri = wpsc_remove_tracking_params_from_uri( $_SERVER['REQUEST_URI'] ); // Cache this in case any plugin modifies it and filter out tracking parameters.

if ( defined( 'DOING_CRON' ) ) {
	extract( wp_super_cache_init() ); // $key, $cache_filename, $meta_file, $cache_file, $meta_pathname
	return true;
}

if ( ! isset( $wp_super_cache_late_init ) || ( isset( $wp_super_cache_late_init ) && false == $wp_super_cache_late_init ) ) {
	wp_cache_serve_cache_file();
}
