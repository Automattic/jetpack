<?php
/**
 * Compatibility functions for Elementor
 *
 * @package automattic/jetpack-boost
 */

namespace Automattic\Jetpack_Boost\Compatibility\Elementor;

/**
 * Exclude Elementor Library custom post type from the list of post types to get urls from.
 *
 * @param array $post_types Post types.
 */
function exclude_elementor_library_custom_post_type( $post_types ) {
	if ( defined( '\Elementor\TemplateLibrary\Source_Local::CPT' ) ) {
		unset( $post_types[ \Elementor\TemplateLibrary\Source_Local::CPT ] );
	}

	// Elementor's landing pages are broken. See https://github.com/elementor/elementor/issues/16244
	if ( defined( '\Elementor\Modules\LandingPages\Module::CPT' ) ) {
		unset( $post_types[ \Elementor\Modules\LandingPages\Module::CPT ] );
	}

	if ( defined( '\Elementor\Modules\FloatingButtons\Module::CPT_FLOATING_BUTTONS' ) ) {
		unset( $post_types[ \Elementor\Modules\FloatingButtons\Module::CPT_FLOATING_BUTTONS ] );
	}

	if ( isset( $post_types['elementor-hf'] ) ) {
		unset( $post_types['elementor-hf'] );
	}

	return $post_types;
}

add_filter( 'jetpack_boost_critical_css_post_types_singular', __NAMESPACE__ . '\exclude_elementor_library_custom_post_type' );
add_filter( 'jetpack_boost_critical_css_post_types_archives', __NAMESPACE__ . '\exclude_elementor_library_custom_post_type' );
