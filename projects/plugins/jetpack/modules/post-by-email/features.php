<?php
/**
 * Feature Catalog registration for the "Post by Email" module.
 *
 * Discovered and loaded by the Feature Catalog loader via the per-module features.php convention.
 *
 * @package automattic/jetpack
 */

use function Automattic\Jetpack\Features\register_feature;

register_feature(
	'post-by-email',
	array(
		'title'           => __( 'Post by Email', 'jetpack' ),
		'description'     => __( 'Publish blog posts simply by sending an email to a custom address.', 'jetpack' ),
		'category'        => 'writing',
		'connection'      => 'user',
		'module'          => 'post-by-email',
		'available_since' => array( 'jetpack' => '2.0' ),
		'docs'            => array( 'jetpack' => 'https://jetpack.com/redirect/?source=jetpack-support-post-by-email' ),
	)
);
