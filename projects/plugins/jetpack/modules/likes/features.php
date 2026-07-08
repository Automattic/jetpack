<?php
/**
 * Feature Catalog registration for the "Likes" module.
 *
 * Discovered and loaded by the Feature Catalog loader via the per-module features.php convention.
 *
 * @package automattic/jetpack
 */

use function Automattic\Jetpack\Features\register_feature;

register_feature(
	'likes',
	array(
		'title'           => __( 'Likes', 'jetpack' ),
		'description'     => __( 'Let readers like your posts to show appreciation and encourage interaction.', 'jetpack' ),
		'category'        => 'engagement',
		'connection'      => 'site',
		'module'          => 'likes',
		'available_since' => array( 'jetpack' => '2.2' ),
		'docs'            => array( 'jetpack' => 'https://jetpack.com/redirect/?source=jetpack-support-likes' ),
	)
);
