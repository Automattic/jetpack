<?php
/**
 * Feature Catalog registration for the "Markdown" module.
 *
 * Discovered and loaded by the Feature Catalog loader via the per-module features.php convention.
 *
 * @package automattic/jetpack
 */

use function Automattic\Jetpack\Features\register_feature;

register_feature(
	'markdown',
	array(
		'title'           => __( 'Markdown', 'jetpack' ),
		'description'     => __( 'Write and format posts using clean, readable Markdown syntax.', 'jetpack' ),
		'category'        => 'writing',
		'connection'      => 'none',
		'module'          => 'markdown',
		'available_since' => array( 'jetpack' => '2.8' ),
		'docs'            => array( 'jetpack' => 'https://jetpack.com/redirect/?source=jetpack-support-markdown' ),
	)
);
