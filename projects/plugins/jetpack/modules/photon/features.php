<?php
/**
 * Feature Catalog registration for the "Image CDN" module.
 *
 * Discovered and loaded by the Feature Catalog loader via the per-module features.php convention.
 *
 * @package automattic/jetpack
 */

use function Automattic\Jetpack\Features\register_feature;

register_feature(
	'photon',
	array(
		'title'           => __( 'Image CDN', 'jetpack' ),
		'description'     => __( 'Deliver images quickly with automatic resizing from Jetpack’s global image CDN.', 'jetpack' ),
		'category'        => 'appearance',
		'connection'      => 'site',
		'module'          => 'photon',
		'available_since' => array( 'jetpack' => '2.0' ),
		'docs'            => array( 'jetpack' => 'https://jetpack.com/redirect/?source=jetpack-support-image-cdn' ),
	)
);
