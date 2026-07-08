<?php
/**
 * Feature Catalog registration for the "Account Protection" module.
 *
 * Discovered and loaded by the Feature Catalog loader via the per-module features.php convention.
 *
 * @package automattic/jetpack
 */

use function Automattic\Jetpack\Features\register_feature;

register_feature(
	'account-protection',
	array(
		'title'           => __( 'Account Protection', 'jetpack' ),
		'description'     => __( 'Shield your login page with rate‑limiting and secure authentication safeguards.', 'jetpack' ),
		'category'        => 'security',
		'connection'      => 'site',
		'module'          => 'account-protection',
		'available_since' => array( 'jetpack' => '14.5' ),
		'docs'            => array( 'jetpack' => 'https://jetpack.com/redirect/?source=jetpack-support-account-protection' ),
	)
);
