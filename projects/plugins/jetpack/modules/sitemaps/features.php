<?php
/**
 * Feature Catalog registration for the "Sitemaps" module.
 *
 * Discovered and loaded by the Feature Catalog loader via the per-module features.php convention.
 *
 * @package automattic/jetpack
 */

use function Automattic\Jetpack\Features\register_feature;

register_feature(
	'sitemaps',
	array(
		'title'           => __( 'Sitemaps', 'jetpack' ),
		'description'     => __( 'Generate XML sitemaps so search engines can index your site efficiently.', 'jetpack' ),
		'category'        => 'other',
		'connection'      => 'none',
		'module'          => 'sitemaps',
		'available_since' => array( 'jetpack' => '3.9' ),
		'docs'            => array( 'jetpack' => 'https://jetpack.com/redirect/?source=jetpack-support-sitemaps' ),
	)
);
