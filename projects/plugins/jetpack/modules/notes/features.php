<?php
/**
 * Feature Catalog registration for the "Notifications" module.
 *
 * Discovered and loaded by the Feature Catalog loader via the per-module features.php convention.
 *
 * @package automattic/jetpack
 */

use function Automattic\Jetpack\Features\register_feature;

register_feature(
	'notes',
	array(
		'title'           => __( 'Notifications', 'jetpack' ),
		'description'     => __( 'Receive real‑time notifications about site activity across your devices.', 'jetpack' ),
		'category'        => 'general',
		'connection'      => 'user',
		'module'          => 'notes',
		'available_since' => array( 'jetpack' => '1.9' ),
		'docs'            => array( 'jetpack' => 'https://jetpack.com/redirect/?source=jetpack-support-notes' ),
	)
);
