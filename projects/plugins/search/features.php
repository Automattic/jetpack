<?php
/**
 * Feature Catalog registration owned by the Jetpack Search plugin.
 *
 * Registers the "search" feature. The Jetpack plugin's `search` module registers the
 * SAME `search` slug — this demonstrates dedup: the slug-keyed Registry keeps only ONE
 * entry per slug, so no matter how many plugins register `search`, it appears once.
 *
 * @package automattic/jetpack-search-plugin
 */

use function Automattic\Jetpack\Features\register_feature;

add_action(
	'jetpack_features_register',
	function () {
		if ( ! function_exists( 'Automattic\Jetpack\Features\register_feature' ) ) {
			return;
		}

		register_feature(
			'search',
			array(
				'title'       => __( 'Jetpack Search', 'jetpack-search' ),
				'description' => __( 'Instantly deliver the most relevant results to your visitors.', 'jetpack-search' ),
				'category'    => 'search',
				'connection'  => 'site',
				'entitlement' => 'search',
				'module'      => 'search',
			)
		);
	}
);
