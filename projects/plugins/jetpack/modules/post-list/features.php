<?php
/**
 * Feature Catalog registration for the "Post List" module.
 *
 * Discovered and loaded by the Feature Catalog loader via the per-module features.php convention.
 *
 * @package automattic/jetpack
 */

use function Automattic\Jetpack\Features\register_feature;

register_feature(
	'post-list',
	array(
		'title'           => __( 'Post List', 'jetpack' ),
		'description'     => __( 'Display a customizable list of your latest posts anywhere on your site.', 'jetpack' ),
		'category'        => 'appearance',
		'connection'      => 'none',
		'module'          => 'post-list',
		'available_since' => array( 'jetpack' => '11.3' ),
		'docs'            => array( 'jetpack' => 'https://jetpack.com/redirect/?source=jetpack-support-post-list' ),
	)
);
