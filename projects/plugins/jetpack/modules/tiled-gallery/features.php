<?php
/**
 * Feature Catalog registration for the "Tiled Galleries" module.
 *
 * Discovered and loaded by the Feature Catalog loader via the per-module features.php convention.
 *
 * @package automattic/jetpack
 */

use function Automattic\Jetpack\Features\register_feature;

register_feature(
	'tiled-gallery',
	array(
		'title'           => __( 'Tiled Galleries', 'jetpack' ),
		'description'     => __( 'Create visually engaging tiled image galleries with multiple layout options.', 'jetpack' ),
		'category'        => 'appearance',
		'connection'      => 'none',
		'module'          => 'tiled-gallery',
		'available_since' => array( 'jetpack' => '2.1' ),
		'docs'            => array( 'jetpack' => 'https://jetpack.com/redirect/?source=jetpack-support-tiled-galleries' ),
	)
);
