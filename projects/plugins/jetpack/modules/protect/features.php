<?php
/**
 * Feature Catalog registration for the "Brute Force Protection" module.
 *
 * Discovered and loaded by the Feature Catalog loader via the per-module features.php convention.
 *
 * @package automattic/jetpack
 */

use function Automattic\Jetpack\Features\register_feature;

register_feature(
	'protect',
	array(
		'title'           => __( 'Brute Force Protection', 'jetpack' ),
		'description'     => __( 'Block malicious login attempts automatically and keep hackers out.', 'jetpack' ),
		'category'        => 'security',
		'connection'      => 'site',
		'module'          => 'protect',
		'available_since' => array( 'jetpack' => '3.4' ),
		'docs'            => array( 'jetpack' => 'https://jetpack.com/redirect/?source=jetpack-support-protect' ),
	)
);
