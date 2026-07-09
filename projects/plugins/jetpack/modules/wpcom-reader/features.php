<?php
/**
 * Feature Catalog registration for the "WordPress.com Reader" module.
 *
 * Discovered and loaded by the Feature Catalog loader via the per-module features.php convention.
 *
 * @package automattic/jetpack
 */

use function Automattic\Jetpack\Features\register_feature;

register_feature(
	'wpcom-reader',
	array(
		'title'           => __( 'WordPress.com Reader', 'jetpack' ),
		'description'     => __( 'Quickly access the WordPress.com Reader from your site\'s admin bar.', 'jetpack' ),
		'category'        => 'engagement',
		'connection'      => 'none',
		'module'          => 'wpcom-reader',
		'available_since' => array( 'jetpack' => '15.5' ),
		'docs'            => array( 'jetpack' => 'https://jetpack.com/redirect/?source=jetpack-support-wpcom-reader' ),
	)
);
