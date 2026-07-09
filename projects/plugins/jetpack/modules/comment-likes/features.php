<?php
/**
 * Feature Catalog registration for the "Comment Likes" module.
 *
 * Discovered and loaded by the Feature Catalog loader via the per-module features.php convention.
 *
 * @package automattic/jetpack
 */

use function Automattic\Jetpack\Features\register_feature;

register_feature(
	'comment-likes',
	array(
		'title'           => __( 'Comment Likes', 'jetpack' ),
		'description'     => __( 'Enable visitors to like individual comments and boost engagement.', 'jetpack' ),
		'category'        => 'other',
		'connection'      => 'site',
		'module'          => 'comment-likes',
		'available_since' => array( 'jetpack' => '5.1' ),
		'docs'            => array( 'jetpack' => 'https://jetpack.com/redirect/?source=jetpack-support-comment-likes' ),
	)
);
