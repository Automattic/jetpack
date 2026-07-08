<?php
/**
 * Feature Catalog registration for the "VaultPress Backup" module.
 *
 * Discovered and loaded by the Feature Catalog loader via the per-module features.php convention.
 *
 * @package automattic/jetpack
 */

use function Automattic\Jetpack\Features\register_feature;

register_feature(
	'vaultpress',
	array(
		'title'           => __( 'VaultPress Backup', 'jetpack' ),
		'description'     => __( 'Real-time backups save every change, and one-click restores get you back online quickly.', 'jetpack' ),
		'category'        => 'security',
		'connection'      => 'site',
		'entitlement'     => 'backups',
		'module'          => 'vaultpress',
		'available_since' => array( 'jetpack' => '1.2' ),
		'docs'            => array( 'jetpack' => 'https://jetpack.com/redirect/?source=jetpack-support-backup' ),
	)
);
