<?php

use Automattic\Jetpack_Boost\Lib\Minify\Cleanup_Stored_Paths;
use Automattic\Jetpack_Boost\Lib\Minify\Config;
use Automattic\Jetpack_Boost\Lib\Minify\Dependency_Path_Mapping;
use Automattic\Jetpack_Boost\Lib\Minify\File_Paths;
use Automattic\Jetpack_Boost\Modules\Module;
use Automattic\Jetpack_Boost\Modules\Optimizations\Minify\Minify_CSS;
use Automattic\Jetpack_Boost\Modules\Optimizations\Minify\Minify_JS;

/**
 * Get an extra cache key for requests. We can manually bump this when we want
 * to ensure a new version of Jetpack Boost never reuses old cached URLs.
 */
function jetpack_boost_minify_cache_buster() {
	return 1;
}

/**
 * Get the number of maximum files that can be concatenated in a group.
 */
function jetpack_boost_minify_concat_max_files() {

	/**
	 * Filter the number of maximum files that can be concatenated in a group.
	 *
	 * @param int $max_files The maximum number of files that can be concatenated.
	 */
	return apply_filters( 'jetpack_boost_minify_concat_max_files', 150 );
}

/**
 * This ensures that the cache cleanup cron job is only run once per day, espicially for multisite.
 */
function jetpack_boost_should_run_daily_network_cron_job( $hook ) {
	// If we see it's been executed within 24 hours, don't run
	if ( get_site_option( 'jetpack_boost_' . $hook . '_last_run', 0 ) > time() - DAY_IN_SECONDS ) {
		return false;
	}

	update_site_option( 'jetpack_boost_' . $hook . '_last_run', time() );

	return true;
}

/**
 * This ensures that the cache cleanup cron job is only run once per day, espicially for multisite.
 */
function jetpack_boost_minify_cron_cache_cleanup() {
	if ( ! jetpack_boost_should_run_daily_network_cron_job( 'minify_cron_cache_cleanup' ) ) {
		return;
	}

	jetpack_boost_legacy_minify_cache_cleanup();
	jetpack_boost_minify_cache_cleanup();
}

/**
 * Cleanup minify cache files stored using the legacy method.
 *
 * @param int $file_age The age of files to purge, in seconds.
 */
function jetpack_boost_legacy_minify_cache_cleanup( $file_age = DAY_IN_SECONDS ) {
	// If file_age is not an int, set it to the default.
	// $file_age can be an empty string if calling this from an action: https://core.trac.wordpress.org/ticket/14881
	$file_age = is_int( $file_age ) ? $file_age : DAY_IN_SECONDS;

	$cache_folder = Config::get_legacy_cache_dir_path();

	if ( ! is_dir( $cache_folder ) ) {
		return;
	}

	$cache_files = glob( $cache_folder . '/page-optimize-cache-*' );

	jetpack_boost_delete_expired_files( $cache_files, $file_age );
}

/**
 * Cleanup obsolete files in static cache folder.
 *
 * @param int $file_age The age of files to purge, in seconds.
 */
function jetpack_boost_minify_cache_cleanup( $file_age = DAY_IN_SECONDS ) {
	// Explicitly cast to int as do_action() can pass a non-int value. https://core.trac.wordpress.org/ticket/14881
	$file_age = is_int( $file_age ) ? $file_age : DAY_IN_SECONDS;

	/*
	 * Cleanup obsolete files in static cache folder.
	 * If $file_age is 0, we can skip this as we will delete all files anyway.
	 */
	if ( $file_age !== 0 ) {
		// Cleanup obsolete files in static cache folder
		jetpack_boost_minify_remove_stale_static_files();
	}

	$cache_files = glob( Config::get_static_cache_dir_path() . '/*.min.*' );

	jetpack_boost_delete_expired_files( $cache_files, $file_age );
}

/**
 * Delete expired files based on access time or file age.
 *
 * Only delete files which are either 2x $file_age or have not been accessed in $file_age seconds.
 *
 * @param array $files The files to delete.
 * @param int   $file_age The age of files to purge, in seconds.
 */
function jetpack_boost_delete_expired_files( $files, $file_age ) {
	foreach ( $files as $file ) {
		if ( ! is_file( $file ) ) {
			continue;
		}

		if ( $file_age === 0 ) {
			wp_delete_file( $file );
			continue;
		}

		// Delete files that haven't been accessed in $file_age seconds,
		// or files that are older than 2 * $file_age regardless of access time
		if ( ( time() - $file_age ) > fileatime( $file ) ) {
			wp_delete_file( $file );
		} elseif ( ( time() - ( 2 * $file_age ) ) > filemtime( $file ) ) {
			wp_delete_file( $file );
		}
	}
}

/**
 * Clear scheduled cron events for minification.
 *
 * Removes the cache cleanup cron job and the 404 tester cron job.
 */
function jetpack_boost_minify_clear_scheduled_events() {
	wp_unschedule_hook( 'jetpack_boost_minify_cron_cache_cleanup' );
	wp_unschedule_hook( 'jetpack_boost_404_tester_cron' );
	Cleanup_Stored_Paths::clear_schedules();
}

/**
 * Plugin deactivation hook - unschedule cronjobs and purge cache.
 */
function jetpack_boost_page_optimize_deactivate() {
	// Cleanup all cache files even if they are 0 seconds old
	jetpack_boost_legacy_minify_cache_cleanup( 0 );
	jetpack_boost_minify_cache_cleanup( 0 );

	jetpack_boost_minify_clear_scheduled_events();
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
	if ( str_starts_with( $url, '/' ) ) {
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
 * Schedule a cronjob for the 404 tester, if one isn't already scheduled.
 */
function jetpack_boost_page_optimize_schedule_404_tester() {
	if ( false === wp_next_scheduled( 'jetpack_boost_404_tester_cron' ) ) {
		wp_schedule_event( time() + DAY_IN_SECONDS, 'daily', 'jetpack_boost_404_tester_cron' );

		// Run the test immediately, so the settings page can show the result.
		jetpack_boost_404_tester();
	}
}

/**
 * Schedule a cronjob for cache cleanup, if one isn't already scheduled.
 */
function jetpack_boost_page_optimize_schedule_cache_cleanup() {
	// If caching is on, and job isn't queued for current cache folder
	if ( false === wp_next_scheduled( 'jetpack_boost_minify_cron_cache_cleanup' ) ) {
		wp_schedule_event( time(), 'daily', 'jetpack_boost_minify_cron_cache_cleanup' );
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

	// Bail in elementor preview
	// phpcs:ignore WordPress.Security.NonceVerification.Recommended
	if ( isset( $_GET['elementor-preview'] ) ) {
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
	if ( str_starts_with( $path, '/' ) ) {
		$parts   = wp_parse_url( $siteurl );
		$siteurl = $parts['scheme'] . '://' . $parts['host'];
	}

	$url = $siteurl . $path;

	if ( str_contains( $url, '?m=' ) ) {
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

	if ( ! str_contains( $url, '?' ) ) {
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
 * Get the URL prefix for static minify/concat resources. Defaults to /_jb_static/, but can be
 * overridden by defining JETPACK_BOOST_STATIC_PREFIX.
 */
function jetpack_boost_get_static_prefix() {
	$prefix = defined( 'JETPACK_BOOST_STATIC_PREFIX' ) ? JETPACK_BOOST_STATIC_PREFIX : '/_jb_static/';

	if ( ! str_starts_with( $prefix, '/' ) ) {
		$prefix = '/' . $prefix;
	}

	return trailingslashit( $prefix );
}

function jetpack_boost_get_minify_url( $file_name = '' ) {
	return content_url( '/boost-cache/static/' . $file_name );
}

function jetpack_boost_get_minify_file_path( $file_name = '' ) {
	return WP_CONTENT_DIR . '/boost-cache/static/' . $file_name;
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
			require_once __DIR__ . '/functions-service-fallback.php';
			jetpack_boost_page_optimize_service_request();
			exit( 0 ); // @phan-suppress-current-line PhanPluginUnreachableCode -- Safer to include it even though jetpack_boost_page_optimize_service_request() itself never returns.
		}
	}
}

/**
 * Run during activation of any minify module.
 *
 * This handles scheduling cache cleanup, and setting up the cronjob to periodically test for the 404 handler.
 *
 * @return void
 */
function jetpack_boost_minify_activation() {
	// Schedule a cronjob for cache cleanup, if one isn't already scheduled.
	jetpack_boost_page_optimize_schedule_cache_cleanup();

	Cleanup_Stored_Paths::setup_schedule();

	// Setup the cronjob to periodically test for the 404 handler.
	jetpack_boost_404_setup();
}

function jetpack_boost_minify_is_enabled() {
	$minify_css = new Module( new Minify_CSS() );
	$minify_js  = new Module( new Minify_JS() );

	return $minify_css->is_enabled() || $minify_js->is_enabled();
}

/**
 * Run during initialization of any minify module.
 *
 * Run during every page load if any minify module is active.
 */
function jetpack_boost_minify_init() {
	add_action( 'jetpack_boost_minify_cron_cache_cleanup', 'jetpack_boost_minify_cron_cache_cleanup' );
	Cleanup_Stored_Paths::add_cleanup_actions();

	if ( jetpack_boost_page_optimize_bail() ) {
		return;
	}

	// Disable Jetpack Site Accelerator CDN for static JS/CSS, if we're minifying this page.
	add_filter( 'jetpack_force_disable_site_accelerator', '__return_true' );
}

function jetpack_boost_page_optimize_generate_concat_path( $url_paths, $dependency_path_mapping ) {
	$fs_paths = array();
	foreach ( $url_paths as $url_path ) {
		$fs_paths[] = $dependency_path_mapping->uri_path_to_fs_path( $url_path );
	}

	$mtime = max( array_map( 'filemtime', $fs_paths ) );
	if ( jetpack_boost_page_optimize_use_concat_base_dir() ) {
		$paths = array_map( 'jetpack_boost_page_optimize_remove_concat_base_prefix', $fs_paths );
	} else {
		$paths = $url_paths;
	}

	$file_paths = new File_Paths();
	$file_paths->set( $paths, $mtime, jetpack_boost_minify_cache_buster() );
	$file_paths->store();

	return $file_paths->get_cache_id();
}
