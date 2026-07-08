<?php
/**
 * Feature Catalog registration for the "Jetpack Stats" module.
 *
 * Discovered and loaded by the Feature Catalog loader via the per-module features.php convention.
 *
 * @package automattic/jetpack
 */

use function Automattic\Jetpack\Features\register_feature;

register_feature(
	'stats',
	array(
		'title'           => __( 'Jetpack Stats', 'jetpack' ),
		'description'     => __( 'Clear, concise traffic insights right in your WordPress dashboard.', 'jetpack' ),
		'category'        => 'engagement',
		'connection'      => 'site',
		'module'          => 'stats',
		'available_since' => array( 'jetpack' => '1.1' ),
		'docs'            => array( 'jetpack' => 'https://jetpack.com/redirect/?source=jetpack-support-wordpress-com-stats' ),
	)
);
