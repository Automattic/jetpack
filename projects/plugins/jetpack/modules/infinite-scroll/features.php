<?php
/**
 * Feature Catalog registration for the "Infinite Scroll" module.
 *
 * Discovered and loaded by the Feature Catalog loader via the per-module features.php convention.
 *
 * @package automattic/jetpack
 */

use function Automattic\Jetpack\Features\register_feature;

register_feature(
	'infinite-scroll',
	array(
		'title'           => __( 'Infinite Scroll', 'jetpack' ),
		'description'     => __( 'Automatically load new posts as visitors scroll down your site.', 'jetpack' ),
		'category'        => 'appearance',
		'connection'      => 'none',
		'module'          => 'infinite-scroll',
		'available_since' => array( 'jetpack' => '2.0' ),
		'docs'            => array( 'jetpack' => 'https://jetpack.com/redirect/?source=jetpack-support-infinite-scroll' ),
	)
);
