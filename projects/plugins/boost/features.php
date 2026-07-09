<?php
/**
 * Feature Catalog registrations owned by Jetpack Boost.
 *
 * Boost registers its OWN features on the shared `jetpack_features_register` hook,
 * guarded so it is a harmless no-op when the Feature Catalog (shipped in Jetpack) is
 * not present. This is the "features that belong to a different plugin" pattern:
 * the owning plugin registers them, they are not declared centrally in Jetpack.
 *
 * @package automattic/jetpack-boost
 */

use function Automattic\Jetpack\Features\register_feature;

add_action(
	'jetpack_features_register',
	function () {
		if ( ! function_exists( 'Automattic\Jetpack\Features\register_feature' ) ) {
			return;
		}

		register_feature(
			'boost-image-cdn',
			array(
				'title'       => __( 'Boost: Image CDN', 'jetpack-boost' ),
				'description' => __( 'Serve resized, optimized images from a global CDN.', 'jetpack-boost' ),
				'category'    => 'performance',
				'connection'  => 'none',
			)
		);

		register_feature(
			'boost-critical-css',
			array(
				'title'       => __( 'Boost: Critical CSS', 'jetpack-boost' ),
				'description' => __( 'Generate critical CSS to speed up page rendering.', 'jetpack-boost' ),
				'category'    => 'performance',
				'connection'  => 'none',
			)
		);

		register_feature(
			'boost-defer-js',
			array(
				'title'       => __( 'Boost: Defer non-essential JavaScript', 'jetpack-boost' ),
				'description' => __( 'Defer non-essential JavaScript to improve load times.', 'jetpack-boost' ),
				'category'    => 'performance',
				'connection'  => 'none',
			)
		);
	}
);
