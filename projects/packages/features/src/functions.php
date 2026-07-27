<?php
/**
 * Namespaced helper functions for the Jetpack Feature Catalog.
 *
 * @package automattic/jetpack-features
 */

namespace Automattic\Jetpack\Features;

if ( ! function_exists( __NAMESPACE__ . '\register_feature' ) ) {
	/**
	 * Declare a feature in the catalog. Side-effect-free: registers metadata only.
	 *
	 * @param string $slug Unique feature slug.
	 * @param array  $args Feature metadata (see Feature::__construct).
	 */
	function register_feature( $slug, array $args = array() ) {
		Registry::instance()->register( new Feature( $slug, $args ) );
	}
}
