<?php

use Automattic\Jetpack_Boost\Lib\Minify\Config;
use Automattic\Jetpack_Boost\Lib\Minify\Dependency_Path_Mapping;

/**
 * Get an extra cache key for requests. We can manually bump this when we want
 * to ensure a new version of Jetpack Boost never reuses old cached URLs.
 */
function jetpack_boost_minify_cache_buster() {
	return 1;
}

/**
 * Cleanup the given cache folder, removing all files older than $file_age seconds.
 *
 * @param string $cache_folder The path to the cache folder to cleanup.
 * @param int $file_age The age of files to purge, in seconds.
 */
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

/**
 * Plugin deactivation hook - unschedule cronjobs and purge cache.
 */
function jetpack_boost_page_optimize_deactivate() {
	$cache_folder = Config::get_cache_dir_path();

	jetpack_boost_page_optimize_cache_cleanup( $cache_folder, 0 /* max file age in seconds */ );

	wp_clear_scheduled_hook( 'jetpack_boost_minify_cron_cache_cleanup', array( $cache_folder ) );
}

/**
 * Plugin uninstall hook - cleanup options.
 */
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
 * Convert enqueued home-relative URLs to absolute ones.
 *
 * Enqueued script URLs which start with / are relative to WordPress' home URL.
 * i.e.: "/wp-includes/x.js" should be "WP_HOME/wp-includes/x.js".
 *
 * Note: this method uses home_url, so should only be used plugin-side when
 * generating concatenated URLs.
 */
function jetpack_boost_enqueued_to_absolute_url( $url ) {
	if ( substr( $url, 0, 1 ) === '/' ) {
		return home_url( $url );
	}

	return $url;
}

/**
 * Get the list of JS slugs to exclude from minification.
 */
function jetpack_boost_page_optimize_js_exclude_list() {
	return jetpack_boost_ds_get( 'minify_js_excludes' );
}

/**
 * Get the list of CSS slugs to exclude from minification.
 */
function jetpack_boost_page_optimize_css_exclude_list() {
	return jetpack_boost_ds_get( 'minify_css_excludes' );
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

/**
 * Schedule a cronjob for cache cleanup, if one isn't already scheduled.
 */
function jetpack_boost_page_optimize_schedule_cache_cleanup() {
	$cache_folder = Config::get_cache_dir_path();
	$args         = array( $cache_folder );

	// If caching is on, and job isn't queued for current cache folder
	if ( false !== $cache_folder && false === wp_next_scheduled( 'jetpack_boost_minify_cron_cache_cleanup', $args ) ) {
		wp_schedule_event( time(), 'daily', 'jetpack_boost_minify_cron_cache_cleanup', $args );
	}
}

/**
 * Check whether it's safe to minify for the duration of this HTTP request. Checks
 * for things like page-builder editors, etc.
 *
 * @return bool True if we don't want to minify/concatenate CSS/JS for this request.
 */
function jetpack_boost_page_optimize_bail() {
	static $should_bail = null;
	if ( null !== $should_bail ) {
		return $should_bail;
	}

	$should_bail = false;

	// Bail if this is an admin page
	if ( is_admin() ) {
		$should_bail = true;
		return true;
	}

	// Bail if we're in customizer
	global $wp_customize;
	if ( isset( $wp_customize ) ) {
		$should_bail = true;
		return true;
	}

	// Bail if Divi theme is active, and we're in the Divi Front End Builder
	// phpcs:ignore WordPress.Security.NonceVerification.Recommended
	if ( ! empty( $_GET['et_fb'] ) && 'Divi' === wp_get_theme()->get_template() ) {
		$should_bail = true;
		return true;
	}

	// Bail if we're editing pages in Brizy Editor
	// phpcs:ignore WordPress.Security.NonceVerification.Recommended
	if ( class_exists( 'Brizy_Editor' ) && method_exists( 'Brizy_Editor', 'prefix' ) && ( isset( $_GET[ Brizy_Editor::prefix( '-edit-iframe' ) ] ) || isset( $_GET[ Brizy_Editor::prefix( '-edit' ) ] ) ) ) {
		$should_bail = true;
		return true;
	}

	return $should_bail;
}

/**
 * Return a URL with a cache-busting query string based on the file's mtime.
 */
function jetpack_boost_page_optimize_cache_bust_mtime( $path, $siteurl ) {
	static $dependency_path_mapping;

	// Absolute paths should dump the path component of siteurl.
	if ( substr( $path, 0, 1 ) === '/' ) {
		$parts   = wp_parse_url( $siteurl );
		$siteurl = $parts['scheme'] . '://' . $parts['host'];
	}

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
 * Get the URL prefix for static minify/concat resources. Defaults to /jb_static/, but can be
 * overridden by defining JETPACK_BOOST_STATIC_PREFIX.
 */
function jetpack_boost_get_static_prefix() {
	$prefix = defined( 'JETPACK_BOOST_STATIC_PREFIX' ) ? JETPACK_BOOST_STATIC_PREFIX : '/_jb_static/';

	if ( substr( $prefix, 0, 1 ) !== '/' ) {
		$prefix = '/' . $prefix;
	}

	return trailingslashit( $prefix );
}

/**
 * Detects requests within the `/_jb_static/` directory, and serves minified content.
 *
 * @return void
 */
function jetpack_boost_minify_serve_concatenated() {
	// Potential improvement: Make concat URL dir configurable
	// phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
	if ( isset( $_SERVER['REQUEST_URI'] ) ) {
		// phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
		$request_path = explode( '?', wp_unslash( $_SERVER['REQUEST_URI'] ) )[0];
		$prefix       = jetpack_boost_get_static_prefix();
		if ( $prefix === substr( $request_path, -strlen( $prefix ), strlen( $prefix ) ) ) {
			require_once __DIR__ . '/functions-service.php';
			jetpack_boost_page_optimize_service_request();
			exit;
		}
	}
}

/**
 * Handles cache service initialization, scheduling of cache cleanup, and disabling of
 * Jetpack photon-cdn for static JS/CSS. Automatically ensures that we don't setup
 * the cache service more than once per request.
 *
 * @return void
 */
function jetpack_boost_minify_setup() {
	static $setup_done = false;
	if ( $setup_done ) {
		return;
	}
	$setup_done = true;

	// Hook up deactivation and uninstall cleanup paths.
	register_deactivation_hook( JETPACK_BOOST_PATH, 'jetpack_boost_page_optimize_deactivate' );
	register_uninstall_hook( JETPACK_BOOST_PATH, 'jetpack_boost_page_optimize_uninstall' );

	// Schedule cache cleanup.
	add_action( 'jetpack_boost_minify_cron_cache_cleanup', 'jetpack_boost_page_optimize_cache_cleanup' );
	jetpack_boost_page_optimize_schedule_cache_cleanup();

	if ( ! jetpack_boost_page_optimize_bail() ) {
		// Disable Jetpack Site Accelerator CDN for static JS/CSS, if we're minifying this page.
		add_filter( 'jetpack_force_disable_site_accelerator', '__return_true' );
	}
}
