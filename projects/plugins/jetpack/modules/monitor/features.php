<?php
/**
 * Feature Catalog registration for the "Downtime Monitor" module.
 *
 * Discovered and loaded by the Feature Catalog loader via the per-module features.php convention.
 *
 * @package automattic/jetpack
 */

use function Automattic\Jetpack\Features\register_feature;

register_feature(
	'monitor',
	array(
		'title'           => __( 'Downtime Monitor', 'jetpack' ),
		'description'     => __( 'Get instant alerts if your site goes down and know when it’s back online.', 'jetpack' ),
		'category'        => 'security',
		'connection'      => 'user',
		'module'          => 'monitor',
		'available_since' => array( 'jetpack' => '2.6' ),
		'docs'            => array( 'jetpack' => 'https://jetpack.com/redirect/?source=jetpack-support-monitor' ),
	)
);
