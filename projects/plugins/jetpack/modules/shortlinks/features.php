<?php
/**
 * Feature Catalog registration for the "WP.me Shortlinks" module.
 *
 * Discovered and loaded by the Feature Catalog loader via the per-module features.php convention.
 *
 * @package automattic/jetpack
 */

use function Automattic\Jetpack\Features\register_feature;

register_feature(
	'shortlinks',
	array(
		'title'           => __( 'WP.me Shortlinks', 'jetpack' ),
		'description'     => __( 'Share short, easy-to-remember links to your posts and pages.', 'jetpack' ),
		'category'        => 'writing',
		'connection'      => 'site',
		'module'          => 'shortlinks',
		'available_since' => array( 'jetpack' => '1.1' ),
		'docs'            => array( 'jetpack' => 'https://jetpack.com/redirect/?source=jetpack-support-shortlinks' ),
	)
);
