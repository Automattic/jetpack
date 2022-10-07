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
