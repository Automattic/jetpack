<?php
/**
 * Feature Catalog registration for the "Gravatar Hovercards" module.
 *
 * Discovered and loaded by the Feature Catalog loader via the per-module features.php convention.
 *
 * @package automattic/jetpack
 */

use function Automattic\Jetpack\Features\register_feature;

register_feature(
	'gravatar-hovercards',
	array(
		'title'           => __( 'Gravatar Hovercards', 'jetpack' ),
		'description'     => __( 'Show a user’s Gravatar profile when visitors hover over their name or image.', 'jetpack' ),
		'category'        => 'appearance',
		'connection'      => 'none',
		'module'          => 'gravatar-hovercards',
		'available_since' => array( 'jetpack' => '1.1' ),
		'docs'            => array( 'jetpack' => 'https://jetpack.com/redirect/?source=jetpack-support-gravatar-hovercards' ),
	)
);
