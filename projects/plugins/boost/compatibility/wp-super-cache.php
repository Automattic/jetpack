<?php
/**
 * Super Cache compatibility for Boost
 *
 * @package automattic/jetpack-boost
 */

namespace Automattic\Jetpack_Boost\Compatibility\Super_Cache;

/**
 * Add WP Super Cache bypass query param to the URL.
 *
 * @param string $url The URL.
 */
function add_bypass_query_param( $url ) {
	global $cache_page_secret;

	return add_query_arg( 'donotcachepage', $cache_page_secret, $url );
}

/**
 * Add WP Super Cache bypass query params to Critical CSS URLs.
 *
 * @param array $urls list of URLs to generate Critical CSS for.
 */
function critical_css_bypass_super_cache( $urls ) {
	return array_map( __NAMESPACE__ . '\add_bypass_query_param', $urls );
}
add_filter( 'jetpack_boost_critical_css_urls', __NAMESPACE__ . '\critical_css_bypass_super_cache' );

/**
 * Clear Super Cache's cache. Called when Critical CSS finishes generating, or
 * when a module is enabled or disabled.
 */
function clear_cache() {
	global $wpdb;

	if ( function_exists( 'wp_cache_clear_cache' ) ) {
		wp_cache_clear_cache( $wpdb->blogid );
	}
}
add_action( 'jetpack_boost_critical_css_generated', __NAMESPACE__ . '\clear_cache' );

/**
 * Clear Super Cache's cache when a module is enabled or disabled.
 *
 * @param string $module The module slug.
 * @param bool   $status The new status.
 */
function module_status_updated( $module, $status ) {
	// Special case: don't clear when enabling Critical or Cloud CSS, as they will
	// be handled after generation.
	if ( $status && ( $module === 'critical-css' || $module === 'cloud-css' ) ) {
		return;
	}

	clear_cache();
}
add_action( 'jetpack_boost_module_status_updated', __NAMESPACE__ . '\module_status_updated', 10, 2 );
