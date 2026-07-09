<?php
/**
 * Feature Catalog registration for the "Secure Sign On" module.
 *
 * Discovered and loaded by the Feature Catalog loader via the per-module features.php convention.
 *
 * @package automattic/jetpack
 */

use function Automattic\Jetpack\Features\register_feature;

register_feature(
	'sso',
	array(
		'title'           => __( 'Secure Sign On', 'jetpack' ),
		'description'     => __( 'Let users log in with their WordPress.com account for quick, secure access.', 'jetpack' ),
		'category'        => 'security',
		'connection'      => 'user',
		'module'          => 'sso',
		'available_since' => array( 'jetpack' => '2.6' ),
		'docs'            => array( 'jetpack' => 'https://jetpack.com/redirect/?source=jetpack-support-sso' ),
	)
);
