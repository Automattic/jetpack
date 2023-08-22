<?php
/**
 * Yoast SEO compatibility for Boost
 *
 * @package automattic/jetpack-boost
 */

namespace Automattic\Jetpack_Boost\Compatibility\Yoast;

function prevent_c_css_query_arg_removal( $default_allowed_extravars ) {
	$default_allowed_extravars[] = 'jb-generate-critical-css';

	return $default_allowed_extravars;
}

add_filter( 'Yoast\WP\SEO\allowlist_permalink_vars', __NAMESPACE__ . '\prevent_c_css_query_arg_removal' );
