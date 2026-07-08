<?php
/**
 * Feature Catalog registration for the "Custom Content Types" module.
 *
 * Discovered and loaded by the Feature Catalog loader via the per-module features.php convention.
 *
 * @package automattic/jetpack
 */

use function Automattic\Jetpack\Features\register_feature;

register_feature(
	'custom-content-types',
	array(
		'title'           => __( 'Custom Content Types', 'jetpack' ),
		'description'     => __( 'Display different types of content on your site with custom content types.', 'jetpack' ),
		'category'        => 'writing',
		'connection'      => 'none',
		'module'          => 'custom-content-types',
		'available_since' => array( 'jetpack' => '3.1' ),
		'docs'            => array( 'jetpack' => 'https://jetpack.com/redirect/?source=jetpack-support-custom-content-types' ),
	)
);
