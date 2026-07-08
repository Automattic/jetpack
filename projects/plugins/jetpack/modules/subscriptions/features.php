<?php
/**
 * Feature Catalog registration for the "Newsletter" module.
 *
 * Discovered and loaded by the Feature Catalog loader via the per-module features.php convention.
 *
 * @package automattic/jetpack
 */

use function Automattic\Jetpack\Features\register_feature;

register_feature(
	'subscriptions',
	array(
		'title'           => __( 'Newsletter', 'jetpack' ),
		'description'     => __( 'Grow your subscriber list and deliver your content directly to their email inbox.', 'jetpack' ),
		'category'        => 'engagement',
		'connection'      => 'user',
		'module'          => 'subscriptions',
		'available_since' => array( 'jetpack' => '1.2' ),
		'docs'            => array( 'jetpack' => 'https://jetpack.com/redirect/?source=jetpack-support-newsletter' ),
	)
);
