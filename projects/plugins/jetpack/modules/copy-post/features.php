<?php
/**
 * Feature Catalog registration for the "Copy Post" module.
 *
 * Discovered and loaded by the Feature Catalog loader via the per-module features.php convention.
 *
 * @package automattic/jetpack
 */

use function Automattic\Jetpack\Features\register_feature;

register_feature(
	'copy-post',
	array(
		'title'           => __( 'Copy Post', 'jetpack' ),
		'description'     => __( 'Duplicate any post or page in one click to speed up content creation.', 'jetpack' ),
		'category'        => 'writing',
		'connection'      => 'none',
		'module'          => 'copy-post',
		'available_since' => array( 'jetpack' => '7.0' ),
		'docs'            => array( 'jetpack' => 'https://jetpack.com/redirect/?source=jetpack-support-copy-post' ),
	)
);
