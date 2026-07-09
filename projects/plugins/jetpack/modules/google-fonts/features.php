<?php
/**
 * Feature Catalog registration for the "Google Fonts (Beta)" module.
 *
 * Discovered and loaded by the Feature Catalog loader via the per-module features.php convention.
 *
 * @package automattic/jetpack
 */

use function Automattic\Jetpack\Features\register_feature;

register_feature(
	'google-fonts',
	array(
		'title'           => __( 'Google Fonts (Beta)', 'jetpack' ),
		'description'     => __( 'This feature is now supported natively in WordPress when using any block theme. To use Google Fonts, refer to the WordPress.org Font Library documentation.', 'jetpack' ),
		'category'        => 'writing',
		'connection'      => 'none',
		'module'          => 'google-fonts',
		'available_since' => array( 'jetpack' => '10.8.0' ),
		'docs'            => array( 'jetpack' => 'https://jetpack.com/redirect/?source=jetpack-support-google-fonts' ),
	)
);
