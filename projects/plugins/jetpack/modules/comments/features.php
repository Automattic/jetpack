<?php
/**
 * Feature Catalog registration for the "Comments" module.
 *
 * Discovered and loaded by the Feature Catalog loader via the per-module features.php convention.
 *
 * @package automattic/jetpack
 */

use function Automattic\Jetpack\Features\register_feature;

register_feature(
	'comments',
	array(
		'title'           => __( 'Comments', 'jetpack' ),
		'description'     => __( 'Replace the default comment form with a modern, feature‑rich alternative.', 'jetpack' ),
		'category'        => 'engagement',
		'connection'      => 'site',
		'module'          => 'comments',
		'available_since' => array( 'jetpack' => '1.4' ),
		'docs'            => array( 'jetpack' => 'https://jetpack.com/redirect/?source=jetpack-support-comments' ),
	)
);
