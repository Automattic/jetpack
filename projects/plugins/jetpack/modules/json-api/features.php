<?php
/**
 * Feature Catalog registration for the "JSON API" module.
 *
 * Discovered and loaded by the Feature Catalog loader via the per-module features.php convention.
 *
 * @package automattic/jetpack
 */

use function Automattic\Jetpack\Features\register_feature;

register_feature(
	'json-api',
	array(
		'title'           => __( 'JSON API', 'jetpack' ),
		'description'     => __( 'Access your site’s data remotely through the WordPress.com REST API.', 'jetpack' ),
		'category'        => 'general',
		'connection'      => 'site',
		'module'          => 'json-api',
		'available_since' => array( 'jetpack' => '1.9' ),
		'docs'            => array( 'jetpack' => 'https://jetpack.com/redirect/?source=jetpack-support-json-api' ),
	)
);
