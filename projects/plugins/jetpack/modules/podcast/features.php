<?php
/**
 * Feature Catalog registration for the "Podcast" module.
 *
 * Discovered and loaded by the Feature Catalog loader via the per-module features.php convention.
 *
 * @package automattic/jetpack
 */

use function Automattic\Jetpack\Features\register_feature;

register_feature(
	'podcast',
	array(
		'title'       => __( 'Podcast', 'jetpack' ),
		'description' => __( 'Publish, manage, and grow your podcast right from your site.', 'jetpack' ),
		'category'    => 'writing',
		'connection'  => 'site',
		'module'      => 'podcast',
		'docs'        => array( 'jetpack' => 'https://jetpack.com/redirect/?source=jetpack-support-podcast' ),
	)
);
