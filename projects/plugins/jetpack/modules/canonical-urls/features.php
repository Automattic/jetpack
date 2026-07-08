<?php
/**
 * Feature Catalog registration for the "Canonical URLs" module.
 *
 * Discovered and loaded by the Feature Catalog loader via the per-module features.php convention.
 *
 * @package automattic/jetpack
 */

use function Automattic\Jetpack\Features\register_feature;

register_feature(
	'canonical-urls',
	array(
		'title'           => __( 'Canonical URLs', 'jetpack' ),
		'description'     => __( 'Add canonical URL tags to archive pages to prevent duplicate content in search engines.', 'jetpack' ),
		'category'        => 'traffic',
		'connection'      => 'none',
		'module'          => 'canonical-urls',
		'available_since' => array( 'jetpack' => '15.6' ),
		'docs'            => array( 'jetpack' => 'https://jetpack.com/redirect/?source=jetpack-support-canonical-urls' ),
	)
);
