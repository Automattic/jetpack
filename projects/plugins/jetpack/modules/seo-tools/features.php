<?php
/**
 * Feature Catalog registration for the "SEO Tools" module.
 *
 * Discovered and loaded by the Feature Catalog loader via the per-module features.php convention.
 *
 * @package automattic/jetpack
 */

use function Automattic\Jetpack\Features\register_feature;

register_feature(
	'seo-tools',
	array(
		'title'           => __( 'SEO Tools', 'jetpack' ),
		'description'     => __( 'Optimize titles, meta descriptions, and social previews for better search results.', 'jetpack' ),
		'category'        => 'traffic',
		'connection'      => 'none',
		'module'          => 'seo-tools',
		'available_since' => array( 'jetpack' => '4.4' ),
		'docs'            => array( 'jetpack' => 'https://jetpack.com/redirect/?source=jetpack-support-seo-tools' ),
	)
);
