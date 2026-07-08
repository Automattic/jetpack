<?php
/**
 * Feature Catalog registration for the "Site Verification" module.
 *
 * Discovered and loaded by the Feature Catalog loader via the per-module features.php convention.
 *
 * @package automattic/jetpack
 */

use function Automattic\Jetpack\Features\register_feature;

register_feature(
	'verification-tools',
	array(
		'title'           => __( 'Site Verification', 'jetpack' ),
		'description'     => __( 'Verify your site with search engines and social platforms in a couple of clicks.', 'jetpack' ),
		'category'        => 'engagement',
		'connection'      => 'none',
		'module'          => 'verification-tools',
		'available_since' => array( 'jetpack' => '3.0' ),
		'docs'            => array( 'jetpack' => 'https://jetpack.com/redirect/?source=jetpack-support-verification-tools' ),
	)
);
