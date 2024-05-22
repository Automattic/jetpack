<?php
/**
 * Compatibility functions for Elementor
 *
 * @package automattic/jetpack-boost
 */

namespace Automattic\Jetpack_Boost\Compatibility\Elementor;

use Elementor\Modules\LandingPages\Module;
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

	// Elementor's landing pages are broken. See https://github.com/elementor/elementor/issues/16244
	if ( isset( $post_types[ Module::CPT ] ) ) {
		unset( $post_types[ Module::CPT ] );
	}

	if ( isset( $post_types['elementor-hf'] ) ) {
		unset( $post_types['elementor-hf'] );
	}

	return $post_types;
}

add_filter( 'jetpack_boost_critical_css_post_types_singular', __NAMESPACE__ . '\exclude_elementor_library_custom_post_type' );
add_filter( 'jetpack_boost_critical_css_post_types_archives', __NAMESPACE__ . '\exclude_elementor_library_custom_post_type' );
