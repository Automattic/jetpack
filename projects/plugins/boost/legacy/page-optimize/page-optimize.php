<?php
/*
Plugin Name: Page Optimize
Plugin URI: https://wordpress.org/plugins/page-optimize/
Description: Optimizes JS and CSS for faster page load and render in the browser.
Author: Automattic
Version: 0.5.2
Author URI: http://automattic.com/
*/

// Default cache directory
if ( ! defined( 'PAGE_OPTIMIZE_CACHE_DIR' ) ) {
	define( 'PAGE_OPTIMIZE_CACHE_DIR', WP_CONTENT_DIR . '/cache/page_optimize' );
}

if ( ! defined( 'PAGE_OPTIMIZE_ABSPATH' ) ) {
	define( 'PAGE_OPTIMIZE_ABSPATH', ABSPATH );
}

if ( ! defined( 'PAGE_OPTIMIZE_CSS_MINIFY' ) ) {
	define( 'PAGE_OPTIMIZE_CSS_MINIFY', false );
}

define( 'PAGE_OPTIMIZE_CRON_CACHE_CLEANUP_JOB', 'page_optimize_cron_cache_cleanup' );

// TODO: Copy tests from nginx-http-concat and/or write them

// TODO: Make concat URL dir configurable
if ( isset( $_SERVER['REQUEST_URI'] ) && '/_static/' === substr( $_SERVER['REQUEST_URI'], 0, 9 ) ) {
	require_once __DIR__ . '/service.php';
	exit;
}

function page_optimize_cache_cleanup( $cache_folder = false, $file_age = DAY_IN_SECONDS ) {
	if ( ! is_dir( $cache_folder ) ) {
		return;
	}

	// If cache is disabled when the cleanup runs, purge it
	$using_cache = defined( 'PAGE_OPTIMIZE_CACHE_DIR' ) && ! empty( PAGE_OPTIMIZE_CACHE_DIR );
	if ( ! $using_cache ) {
		$file_age = 0;
	}
	// If the cache folder changed since queueing, purge it
	if ( $using_cache && $cache_folder !== PAGE_OPTIMIZE_CACHE_DIR ) {
		$file_age = 0;
	}

	// Grab all files in the cache directory
	$cache_files = glob( $cache_folder . '/page-optimize-cache-*' );

	// Cleanup all files older than $file_age
	foreach ( $cache_files as $cache_file ) {
		if ( ! is_file( $cache_file ) ) {
			continue;
		}

		if ( ( time() - $file_age ) > filemtime( $cache_file ) ) {
			unlink( $cache_file );
		}
	}
}
add_action( PAGE_OPTIMIZE_CRON_CACHE_CLEANUP_JOB, 'page_optimize_cache_cleanup' );

// Unschedule cache cleanup, and purge cache directory
function page_optimize_deactivate() {
	$cache_folder = false;
	if ( defined( 'PAGE_OPTIMIZE_CACHE_DIR' ) && ! empty( PAGE_OPTIMIZE_CACHE_DIR ) ) {
		$cache_folder = PAGE_OPTIMIZE_CACHE_DIR;
	}

	page_optimize_cache_cleanup( $cache_folder, 0 /* max file age in seconds */ );

	wp_clear_scheduled_hook( PAGE_OPTIMIZE_CRON_CACHE_CLEANUP_JOB, [ $cache_folder ] );
}
register_deactivation_hook( __FILE__, 'page_optimize_deactivate' );

function page_optimize_uninstall() {
	// Run cleanup on uninstall. You can uninstall an active plugin w/o deactivation.
	page_optimize_deactivate();

	// JS
	delete_option( 'page_optimize-js' );
	delete_option( 'page_optimize-load-mode' );
	delete_option( 'page_optimize-js-exclude' );
	// CSS
	delete_option( 'page_optimize-css' );
	delete_option( 'page_optimize-css-exclude' );

}
register_uninstall_hook( __FILE__, 'page_optimize_uninstall' );

function page_optimize_get_text_domain() {
	return 'page-optimize';
}

function page_optimize_should_concat_js() {
	// Support query param for easy testing
	if ( isset( $_GET['concat-js'] ) ) {
		return $_GET['concat-js'] !== '0';
	}

	return !! get_option( 'page_optimize-js', page_optimize_js_default() );
}

// TODO: Support JS load mode regardless of whether concat is enabled
function page_optimize_load_mode_js() {
	// Support query param for easy testing
	if ( ! empty( $_GET['load-mode-js'] ) ) {
		$load_mode = page_optimize_sanitize_js_load_mode( $_GET['load-mode-js'] );
	} else {
		$load_mode = page_optimize_sanitize_js_load_mode( get_option( 'page_optimize-load-mode', page_optimize_js_load_mode_default() ) );
	}

	return $load_mode;
}

function page_optimize_should_concat_css() {
	// Support query param for easy testing
	if ( isset( $_GET['concat-css'] ) ) {
		return $_GET['concat-css'] !== '0';
	}

	return !! get_option( 'page_optimize-css', page_optimize_css_default() );
}

function page_optimize_js_default() {
	return true;
}

function page_optimize_css_default() {
	return true;
}

function page_optimize_js_load_mode_default() {
	return '';
}

function page_optimize_js_exclude_list() {
	$exclude_list = get_option( 'page_optimize-js-exclude' );
	if ( false === $exclude_list ) {
		// Use the default since the option is not set
		return page_optimize_js_exclude_list_default();
	}
	if ( '' === $exclude_list ) {
		return [];
	}

	return explode( ',', $exclude_list );
}

function page_optimize_js_exclude_list_default() {
	// WordPress core stuff, a lot of other plugins depend on it.
	return [ 'jquery', 'jquery-core', 'underscore', 'backbone' ];
}

function page_optimize_css_exclude_list() {
	$exclude_list = get_option( 'page_optimize-css-exclude' );
	if ( false === $exclude_list ) {
		// Use the default since the option is not set
		return page_optimize_css_exclude_list_default();
	}
	if ( '' === $exclude_list ) {
		return [];
	}

	return explode( ',', $exclude_list );
}

function page_optimize_css_exclude_list_default() {
	// WordPress core stuff
	return [ 'admin-bar', 'dashicons' ];
}

function page_optimize_sanitize_js_load_mode( $value ) {
	switch ( $value ) {
		case 'async':
		case 'defer':
			break;
		default:
			$value = '';
			break;
	}

	return $value;
}

function page_optimize_sanitize_exclude_field( $value ) {
	if ( empty( $value ) ) {
		return '';
	}

	$excluded_strings = explode( ',', sanitize_text_field( $value ) );
	$sanitized_values = [];
	foreach ( $excluded_strings as $excluded_string ) {
		if ( ! empty( $excluded_string ) ) {
			$sanitized_values[] = trim( $excluded_string );
		}
	}

	return implode( ',', $sanitized_values );
}

/**
 * Determines whether a string starts with another string.
 */
function page_optimize_starts_with( $prefix, $str ) {
	$prefix_length = strlen( $prefix );
	if ( strlen( $str ) < $prefix_length ) {
		return false;
	}

	return substr( $str, 0, $prefix_length ) === $prefix;
}

/**
 * Answers whether the plugin should provide concat resource URIs
 * that are relative to a common ancestor directory. Assuming a common ancestor
 * allows us to skip resolving resource URIs to filesystem paths later on.
 */
function page_optimize_use_concat_base_dir() {
	return defined( 'PAGE_OPTIMIZE_CONCAT_BASE_DIR' ) && file_exists( PAGE_OPTIMIZE_CONCAT_BASE_DIR );
}

/**
 * Get a filesystem path relative to a configured base path for resources
 * that will be concatenated. Assuming a common ancestor allows us to skip
 * resolving resource URIs to filesystem paths later on.
 */
function page_optimize_remove_concat_base_prefix( $original_fs_path ) {
	// Always check longer path first
	if ( strlen( PAGE_OPTIMIZE_ABSPATH ) > strlen( PAGE_OPTIMIZE_CONCAT_BASE_DIR ) ) {
		$longer_path = PAGE_OPTIMIZE_ABSPATH;
		$shorter_path = PAGE_OPTIMIZE_CONCAT_BASE_DIR;
	} else {
		$longer_path = PAGE_OPTIMIZE_CONCAT_BASE_DIR;
		$shorter_path = PAGE_OPTIMIZE_ABSPATH;
	}

	$prefix_abspath = trailingslashit( $longer_path );
	if ( page_optimize_starts_with( $prefix_abspath, $original_fs_path ) ) {
		return substr( $original_fs_path, strlen( $prefix_abspath ) );
	}

	$prefix_basedir = trailingslashit( $shorter_path );
	if ( page_optimize_starts_with( $prefix_basedir, $original_fs_path ) ) {
		return substr( $original_fs_path, strlen( $prefix_basedir ) );
	}

	// If we end up here, this is a resource we shouldn't have tried to concat in the first place
	return '/page-optimize-resource-outside-base-path/' . basename( $original_fs_path );
}

function page_optimize_schedule_cache_cleanup() {
	$cache_folder = false;
	if ( defined( 'PAGE_OPTIMIZE_CACHE_DIR' ) && ! empty( PAGE_OPTIMIZE_CACHE_DIR ) ) {
		$cache_folder = PAGE_OPTIMIZE_CACHE_DIR;
	}
	$args = [ $cache_folder ];

	// If caching is on, and job isn't queued for current cache folder
	if( false !== $cache_folder && false === wp_next_scheduled( PAGE_OPTIMIZE_CRON_CACHE_CLEANUP_JOB, $args ) ) {
		wp_schedule_event( time(), 'daily', PAGE_OPTIMIZE_CRON_CACHE_CLEANUP_JOB, $args );
	}
}

// Cases when we don't want to concat
function page_optimize_bail() {
	// Bail if we're in customizer
	global $wp_customize;
	if ( isset( $wp_customize ) ) {
		return true;
	}

	// Bail if Divi theme is active, and we're in the Divi Front End Builder
	if ( ! empty( $_GET['et_fb'] ) && 'Divi' === wp_get_theme()->get_template() ) {
		return true;
	}

	// Bail if we're editing pages in Brizy Editor
	if ( class_exists( 'Brizy_Editor' ) && method_exists( 'Brizy_Editor', 'prefix' ) && ( isset( $_GET[ Brizy_Editor::prefix( '-edit-iframe' ) ] ) || isset( $_GET[ Brizy_Editor::prefix( '-edit' ) ] ) ) ) {
		return true;
	}

	return false;
}

function page_optimize_init() {
	if ( page_optimize_bail() ) {
		return;
	}

	page_optimize_schedule_cache_cleanup();

	require_once __DIR__ . '/settings.php';
	require_once __DIR__ . '/concat-css.php';
	require_once __DIR__ . '/concat-js.php';

	// Disable Jetpack photon-cdn for static JS/CSS
	add_filter( 'jetpack_force_disable_site_accelerator', '__return_true' );
}
add_action( 'plugins_loaded', 'page_optimize_init' );
