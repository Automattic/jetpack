<?php
/**
 * Feature Catalog registration for the "Related Posts" module.
 *
 * Discovered and loaded by the Feature Catalog loader via the per-module features.php convention.
 *
 * @package automattic/jetpack
 */

use function Automattic\Jetpack\Features\register_feature;

register_feature(
	'related-posts',
	array(
		'title'           => __( 'Related Posts', 'jetpack' ),
		'description'     => __( 'Automatically display related articles to keep visitors reading longer.', 'jetpack' ),
		'category'        => 'engagement',
		'connection'      => 'site',
		'module'          => 'related-posts',
		'available_since' => array( 'jetpack' => '2.9' ),
		'docs'            => array( 'jetpack' => 'https://jetpack.com/redirect/?source=jetpack-support-related-posts' ),
	)
);
