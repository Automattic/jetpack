<?php
/**
 * Compatibility for Beaver Builder (both lite and Pro versions).
 *
 * @package automattic/jetpack-boost
 */

namespace Automattic\Jetpack_Boost\Compatibility\Beaver_Builder;

/**
 * Exclude Beaver Builder custom post types from list of posts to generate critical CSS for.
 *
 * @param array $post_types Post types.
 */
function exclude_beaver_builder_custom_post_types( $post_types ) {
	unset( $post_types['fl-builder-template'] );
	unset( $post_types['fl-theme-layout'] );

	return $post_types;
}

add_filter( 'jetpack_boost_critical_css_post_types_singular', __NAMESPACE__ . '\exclude_beaver_builder_custom_post_types' );
add_filter( 'jetpack_boost_critical_css_post_types_archives', __NAMESPACE__ . '\exclude_beaver_builder_custom_post_types' );
