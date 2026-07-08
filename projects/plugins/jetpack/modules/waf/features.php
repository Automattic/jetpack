<?php
/**
 * Feature Catalog registration for the "Firewall" module.
 *
 * Discovered and loaded by the Feature Catalog loader via the per-module features.php convention.
 *
 * @package automattic/jetpack
 */

use function Automattic\Jetpack\Features\register_feature;

register_feature(
	'waf',
	array(
		'title'           => __( 'Firewall', 'jetpack' ),
		'description'     => __( 'Filter malicious traffic in real time with Jetpack’s site firewall.', 'jetpack' ),
		'category'        => 'security',
		'connection'      => 'site',
		'module'          => 'waf',
		'available_since' => array( 'jetpack' => '10.9' ),
		'docs'            => array( 'jetpack' => 'https://jetpack.com/redirect/?source=jetpack-support-firewall' ),
	)
);
