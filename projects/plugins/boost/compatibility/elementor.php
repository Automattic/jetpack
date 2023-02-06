<?php
/**
 * Compatibility functions for Elementor
 *
 * @package automattic/jetpack-boost
 */

namespace Automattic\Jetpack_Boost\Compatibility\Elementor;

use Elementor\TemplateLibrary\Source_Local;

/**
 * Exclude Elementor Library custom post type from the list of post types to get urls from.
 *
 * @param array $post_types Post types.
 */
function exclude_elementor_library_custom_post_type( $post_types ) {
	if ( isset( $post_types[ Source_Local::CPT ] ) ) {
		unset( $post_types[ Source_Local::CPT ] );
	}

	return $post_types;
}

add_filter( 'jetpack_boost_critical_css_post_types', __NAMESPACE__ . '\exclude_elementor_library_custom_post_type' );
