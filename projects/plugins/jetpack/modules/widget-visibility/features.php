<?php
/**
 * Feature Catalog registration for the "Widget Visibility" module.
 *
 * Discovered and loaded by the Feature Catalog loader via the per-module features.php convention.
 *
 * @package automattic/jetpack
 */

use function Automattic\Jetpack\Features\register_feature;

register_feature(
	'widget-visibility',
	array(
		'title'           => __( 'Widget Visibility', 'jetpack' ),
		'description'     => __( 'Choose which widgets appear on specific pages or posts with advanced controls.', 'jetpack' ),
		'category'        => 'appearance',
		'connection'      => 'none',
		'module'          => 'widget-visibility',
		'available_since' => array( 'jetpack' => '2.4' ),
		'docs'            => array( 'jetpack' => 'https://jetpack.com/redirect/?source=jetpack-support-widget-visibility' ),
	)
);
