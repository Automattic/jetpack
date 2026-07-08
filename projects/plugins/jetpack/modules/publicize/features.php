<?php
/**
 * Feature Catalog registration for the "Jetpack Social" module.
 *
 * Discovered and loaded by the Feature Catalog loader via the per-module features.php convention.
 *
 * @package automattic/jetpack
 */

use function Automattic\Jetpack\Features\register_feature;

register_feature(
	'publicize',
	array(
		'title'           => __( 'Jetpack Social', 'jetpack' ),
		'description'     => __( 'Auto‑share your posts to social networks and track engagement in one place.', 'jetpack' ),
		'category'        => 'engagement',
		'connection'      => 'user',
		'module'          => 'publicize',
		'available_since' => array( 'jetpack' => '2.0' ),
		'docs'            => array( 'jetpack' => 'https://jetpack.com/redirect/?source=jetpack-support-jetpack-social' ),
	)
);
