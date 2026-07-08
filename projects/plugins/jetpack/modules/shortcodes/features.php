<?php
/**
 * Feature Catalog registration for the "Shortcode Embeds" module.
 *
 * Discovered and loaded by the Feature Catalog loader via the per-module features.php convention.
 *
 * @package automattic/jetpack
 */

use function Automattic\Jetpack\Features\register_feature;

register_feature(
	'shortcodes',
	array(
		'title'           => __( 'Shortcode Embeds', 'jetpack' ),
		'description'     => __( 'Easily embed rich media like YouTube videos and tweets using simple shortcodes.', 'jetpack' ),
		'category'        => 'writing',
		'connection'      => 'none',
		'module'          => 'shortcodes',
		'available_since' => array( 'jetpack' => '1.1' ),
		'docs'            => array( 'jetpack' => 'https://jetpack.com/redirect/?source=jetpack-support-shortcodes' ),
	)
);
