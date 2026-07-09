<?php
/**
 * Feature Catalog registration for the "Search" module.
 *
 * Discovered and loaded by the Feature Catalog loader via the per-module features.php convention.
 *
 * @package automattic/jetpack
 */

use function Automattic\Jetpack\Features\register_feature;

register_feature(
	'search',
	array(
		'title'           => __( 'Search', 'jetpack' ),
		'description'     => __( 'Instantly deliver the most relevant results to your visitors.', 'jetpack' ),
		'category'        => 'search',
		'connection'      => 'site',
		'entitlement'     => 'search',
		'module'          => 'search',
		'available_since' => array( 'jetpack' => '5.0' ),
		'docs'            => array( 'jetpack' => 'https://jetpack.com/redirect/?source=jetpack-support-search' ),
	)
);
