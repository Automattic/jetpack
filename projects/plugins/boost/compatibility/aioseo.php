<?php
/**
 * All in One SEO compatibility for Boost
 *
 * @package automattic/jetpack-boost
 */

namespace Automattic\Jetpack_Boost\Compatibility\AIOSEO;

function prevent_c_css_query_arg_removal( $query_args ) {
	$query_args[] = 'jb-generate-critical-css';

	return $query_args;
}

add_filter( 'aioseo_unrecognized_allowed_query_args', __NAMESPACE__ . '\prevent_c_css_query_arg_removal' );
