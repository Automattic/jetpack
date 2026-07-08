<?php
/**
 * Feature Catalog registration for the "Ads" module.
 *
 * Discovered and loaded by the Feature Catalog loader via the per-module features.php convention.
 *
 * @package automattic/jetpack
 */

use function Automattic\Jetpack\Features\register_feature;

register_feature(
	'wordads',
	array(
		'title'           => __( 'Ads', 'jetpack' ),
		'description'     => __( 'Earn revenue by displaying high‑quality ads on your site.', 'jetpack' ),
		'category'        => 'other',
		'connection'      => 'site',
		'entitlement'     => 'wordads',
		'module'          => 'wordads',
		'available_since' => array( 'jetpack' => '4.5.0' ),
		'docs'            => array( 'jetpack' => 'https://jetpack.com/redirect/?source=jetpack-support-ads' ),
	)
);
