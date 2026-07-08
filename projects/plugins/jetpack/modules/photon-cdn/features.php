<?php
/**
 * Feature Catalog registration for the "Asset CDN" module.
 *
 * Discovered and loaded by the Feature Catalog loader via the per-module features.php convention.
 *
 * @package automattic/jetpack
 */

use function Automattic\Jetpack\Features\register_feature;

register_feature(
	'photon-cdn',
	array(
		'title'           => __( 'Asset CDN', 'jetpack' ),
		'description'     => __( 'Serve static files like CSS and JS from Jetpack’s global CDN for faster load times.', 'jetpack' ),
		'category'        => 'appearance',
		'connection'      => 'none',
		'module'          => 'photon-cdn',
		'available_since' => array( 'jetpack' => '6.6' ),
		'docs'            => array( 'jetpack' => 'https://jetpack.com/redirect/?source=jetpack-support-asset-cdn' ),
	)
);
