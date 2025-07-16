<?php
/**
 * Compatibility for Breakdance
 *
 * @package automattic/jetpack-boost
 */

namespace Automattic\Jetpack_Boost\Compatibility\Breakdance;

/**
 * Exclude Breakdance custom post types from list of posts to generate critical CSS for.
 *
 * @param array $post_types Post types.
 */
function exclude_breakdance_custom_post_types( $post_types ) {
	if ( defined( 'BREAKDANCE_ALL_EDITABLE_POST_TYPES' ) ) {
		foreach ( BREAKDANCE_ALL_EDITABLE_POST_TYPES as $post_type ) {
			unset( $post_types[ $post_type ] );
		}
	}

	return $post_types;
}

add_filter( 'jetpack_boost_critical_css_post_types_singular', __NAMESPACE__ . '\exclude_breakdance_custom_post_types' );
add_filter( 'jetpack_boost_critical_css_post_types_archives', __NAMESPACE__ . '\exclude_breakdance_custom_post_types' );
