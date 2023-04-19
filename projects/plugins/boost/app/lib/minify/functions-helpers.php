<?php

use Automattic\Jetpack_Boost\Modules\Optimizations\Minify\Config;
use Automattic\Jetpack_Boost\Modules\Optimizations\Minify\Css as Minify_CSS;
use Automattic\Jetpack_Boost\Modules\Optimizations\Minify\Dependency_Path_Mapping;
use Automattic\Jetpack_Boost\Modules\Optimizations\Minify\Js as Minify_JS;

// @todo - refactor this. Dump of functions from page optimize.

function jetpack_boost_page_optimize_cache_cleanup( $cache_folder = false, $file_age = DAY_IN_SECONDS ) {
	if ( ! is_dir( $cache_folder ) ) {
		return;
	}

	$defined_cache_dir = Config::get_cache_dir_path();

	// If cache is disabled when the cleanup runs, purge it
	$using_cache = ! empty( $defined_cache_dir );
	if ( ! $using_cache ) {
		$file_age = 0;
	}
	// If the cache folder changed since queueing, purge it
	if ( $using_cache && $cache_folder !== $defined_cache_dir ) {
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
			wp_delete_file( $cache_file );
		}
	}
}

// Unschedule cache cleanup, and purge cache directory
function jetpack_boost_page_optimize_deactivate() {
	$cache_folder = Config::get_cache_dir_path();

	jetpack_boost_page_optimize_cache_cleanup( $cache_folder, 0 /* max file age in seconds */ );

	wp_clear_scheduled_hook( 'page_optimize_cron_cache_cleanup', array( $cache_folder ) );
}

function jetpack_boost_page_optimize_uninstall() {
	// Run cleanup on uninstall. You can uninstall an active plugin w/o deactivation.
	jetpack_boost_page_optimize_deactivate();

	// JS
	delete_option( 'page_optimize-js' );
	delete_option( 'page_optimize-load-mode' );
	delete_option( 'page_optimize-js-exclude' );
	// CSS
	delete_option( 'page_optimize-css' );
	delete_option( 'page_optimize-css-exclude' );
}

/**
 * Ensure that WP_Filesystem is ready to use.
 */
function jetpack_boost_init_filesystem() {
	global $wp_filesystem;

	if ( empty( $wp_filesystem ) ) {
		require_once ABSPATH . 'wp-admin/includes/file.php';
		\WP_Filesystem();
	}
}

function jetpack_boost_page_optimize_js_exclude_list() {
	$exclude_list = jetpack_boost_ds_get( 'minify_js_excludes' );
	if ( false === $exclude_list ) {
		// Use the default since the option is not set
		return jetpack_boost_page_optimize_js_exclude_list_default();
	}
	if ( '' === $exclude_list ) {
		return array();
	}

	return explode( ',', $exclude_list );
}

function jetpack_boost_page_optimize_js_exclude_list_default() {
	// WordPress core stuff, a lot of other plugins depend on it.
	return Minify_JS::$default_excludes;
}

function jetpack_boost_page_optimize_css_exclude_list() {
	$exclude_list = jetpack_boost_ds_get( 'minify_css_excludes' );
	if ( false === $exclude_list ) {
		// Use the default since the option is not set
		return jetpack_boost_page_optimize_css_exclude_list_default();
	}
	if ( '' === $exclude_list ) {
		return array();
	}

	return explode( ',', $exclude_list );
}

function jetpack_boost_page_optimize_css_exclude_list_default() {
	// WordPress core stuff
	return Minify_CSS::$default_excludes;
}

function jetpack_boost_page_optimize_sanitize_exclude_field( $value ) {
	if ( empty( $value ) ) {
		return '';
	}

	$excluded_strings = explode( ',', sanitize_text_field( $value ) );
	$sanitized_values = array();
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
function jetpack_boost_page_optimize_starts_with( $prefix, $str ) {
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
function jetpack_boost_page_optimize_use_concat_base_dir() {
	return defined( 'PAGE_OPTIMIZE_CONCAT_BASE_DIR' ) && file_exists( PAGE_OPTIMIZE_CONCAT_BASE_DIR );
}

/**
 * Get a filesystem path relative to a configured base path for resources
 * that will be concatenated. Assuming a common ancestor allows us to skip
 * resolving resource URIs to filesystem paths later on.
 */
function jetpack_boost_page_optimize_remove_concat_base_prefix( $original_fs_path ) {
	$abspath = Config::get_abspath();

	// Always check longer path first
	if ( strlen( $abspath ) > strlen( PAGE_OPTIMIZE_CONCAT_BASE_DIR ) ) {
		$longer_path  = $abspath;
		$shorter_path = PAGE_OPTIMIZE_CONCAT_BASE_DIR;
	} else {
		$longer_path  = PAGE_OPTIMIZE_CONCAT_BASE_DIR;
		$shorter_path = $abspath;
	}

	$prefix_abspath = trailingslashit( $longer_path );
	if ( jetpack_boost_page_optimize_starts_with( $prefix_abspath, $original_fs_path ) ) {
		return substr( $original_fs_path, strlen( $prefix_abspath ) );
	}

	$prefix_basedir = trailingslashit( $shorter_path );
	if ( jetpack_boost_page_optimize_starts_with( $prefix_basedir, $original_fs_path ) ) {
		return substr( $original_fs_path, strlen( $prefix_basedir ) );
	}

	// If we end up here, this is a resource we shouldn't have tried to concat in the first place
	return '/page-optimize-resource-outside-base-path/' . basename( $original_fs_path );
}

function jetpack_boost_page_optimize_schedule_cache_cleanup() {
	$cache_folder = Config::get_cache_dir_path();
	$args         = array( $cache_folder );

	$cache_cleanup_hook = 'page_optimize_cron_cache_cleanup';

	// If caching is on, and job isn't queued for current cache folder
	if ( false !== $cache_folder && false === wp_next_scheduled( $cache_cleanup_hook, $args ) ) {
		wp_schedule_event( time(), 'daily', $cache_cleanup_hook, $args );
	}
}

// Cases when we don't want to concat
function jetpack_boost_page_optimize_bail() {
	// Bail if we're in customizer
	global $wp_customize;
	if ( isset( $wp_customize ) ) {
		return true;
	}

	// Bail if Divi theme is active, and we're in the Divi Front End Builder
	// phpcs:ignore WordPress.Security.NonceVerification.Recommended
	if ( ! empty( $_GET['et_fb'] ) && 'Divi' === wp_get_theme()->get_template() ) {
		return true;
	}

	// Bail if we're editing pages in Brizy Editor
	// phpcs:ignore WordPress.Security.NonceVerification.Recommended
	if ( class_exists( 'Brizy_Editor' ) && method_exists( 'Brizy_Editor', 'prefix' ) && ( isset( $_GET[ Brizy_Editor::prefix( '-edit-iframe' ) ] ) || isset( $_GET[ Brizy_Editor::prefix( '-edit' ) ] ) ) ) {
		return true;
	}

	return false;
}

// Taken from utils.php/Jetpack_Boost_Page_Optimize_Utils
function jetpack_boost_page_optimize_cache_bust_mtime( $path, $siteurl ) {
	static $dependency_path_mapping;

	$url = $siteurl . $path;

	if ( strpos( $url, '?m=' ) ) {
		return $url;
	}

	$parts = wp_parse_url( $url );
	if ( ! isset( $parts['path'] ) || empty( $parts['path'] ) ) {
		return $url;
	}

	if ( empty( $dependency_path_mapping ) ) {
		$dependency_path_mapping = new Dependency_Path_Mapping();
	}

	$file = $dependency_path_mapping->dependency_src_to_fs_path( $url );

	$mtime = false;
	if ( file_exists( $file ) ) {
		$mtime = filemtime( $file );
	}

	if ( ! $mtime ) {
		return $url;
	}

	if ( false === strpos( $url, '?' ) ) {
		$q = '';
	} else {
		list( $url, $q ) = explode( '?', $url, 2 );
		if ( strlen( $q ) ) {
			$q = '&amp;' . $q;
		}
	}

	return "$url?m={$mtime}{$q}";
}

/**
 * Initializes the cache service for minification in Jetpack Boost.
 *
 * @return void
 */
function jetpack_boost_minify_init_cache_service() {
	// TODO: Make concat URL dir configurable
	// phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
	if ( isset( $_SERVER['REQUEST_URI'] ) && '/_static/' === substr( wp_unslash( $_SERVER['REQUEST_URI'] ), 0, 9 ) ) {
		require_once __DIR__ . '/functions-service.php';
		jetpack_boost_page_optimize_service_request();
		exit;
	}
}
/**
 * Handles cache service initialization, scheduling of cache cleanup,
 * and disabling of Jetpack photon-cdn for static JS/CSS.
 *
 * @return void
 */
function jetpack_boost_minify_setup() {
	static $already_done = false;
	if ( $already_done ) {
		return;
	}

	$already_done = true;

	jetpack_boost_minify_init_cache_service();

	if ( jetpack_boost_page_optimize_bail() ) {
		return;
	}

	add_action( 'page_optimize_cron_cache_cleanup', 'jetpack_boost_page_optimize_cache_cleanup' );
	register_deactivation_hook( JETPACK_BOOST_PATH, 'jetpack_boost_page_optimize_deactivate' );
	register_uninstall_hook( JETPACK_BOOST_PATH, 'jetpack_boost_page_optimize_uninstall' );

	jetpack_boost_page_optimize_schedule_cache_cleanup();

	add_filter( 'pre_option_page_optimize-js', '__return_empty_string', 0 );
	add_filter( 'pre_option_page_optimize-css', '__return_empty_string', 0 );
	add_filter( 'pre_option_page_optimize-load-mode', '__return_empty_string', 0 );

	// Disable Jetpack photon-cdn for static JS/CSS.
	add_filter( 'jetpack_force_disable_site_accelerator', '__return_true' );
}
