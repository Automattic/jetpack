<?php
/**
 * Feature Catalog registration for the "VideoPress" module.
 *
 * Discovered and loaded by the Feature Catalog loader via the per-module features.php convention.
 *
 * @package automattic/jetpack
 */

use function Automattic\Jetpack\Features\register_feature;

register_feature(
	'videopress',
	array(
		'title'           => __( 'VideoPress', 'jetpack' ),
		'description'     => __( 'Powerful and flexible video hosting.', 'jetpack' ),
		'category'        => 'writing',
		'connection'      => 'site',
		'entitlement'     => 'videopress',
		'module'          => 'videopress',
		'available_since' => array( 'jetpack' => '2.5' ),
		'docs'            => array( 'jetpack' => 'https://jetpack.com/redirect/?source=jetpack-support-videopress' ),
	)
);
