<?php
/**
 * Feature Catalog registration for the "Blaze" module.
 *
 * Discovered and loaded by the Feature Catalog loader via the per-module features.php convention.
 *
 * @package automattic/jetpack
 */

use function Automattic\Jetpack\Features\register_feature;

register_feature(
	'blaze',
	array(
		'title'           => __( 'Blaze', 'jetpack' ),
		'description'     => __( 'Promote your posts and pages across millions of sites in the WordPress.com and Tumblr ad network.', 'jetpack' ),
		'category'        => 'other',
		'connection'      => 'site',
		'module'          => 'blaze',
		'available_since' => array( 'jetpack' => '12.3' ),
		'docs'            => array( 'jetpack' => 'https://jetpack.com/redirect/?source=jetpack-support-blaze' ),
	)
);
