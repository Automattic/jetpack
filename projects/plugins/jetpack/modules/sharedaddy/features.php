<?php
/**
 * Feature Catalog registration for the "Sharing" module.
 *
 * Discovered and loaded by the Feature Catalog loader via the per-module features.php convention.
 *
 * @package automattic/jetpack
 */

use function Automattic\Jetpack\Features\register_feature;

register_feature(
	'sharedaddy',
	array(
		'title'           => __( 'Sharing', 'jetpack' ),
		'description'     => __( 'Add customizable share buttons so visitors can spread your content.', 'jetpack' ),
		'category'        => 'engagement',
		'connection'      => 'none',
		'module'          => 'sharedaddy',
		'available_since' => array( 'jetpack' => '1.1' ),
		'docs'            => array( 'jetpack' => 'https://jetpack.com/redirect/?source=jetpack-support-sharing-block' ),
	)
);
