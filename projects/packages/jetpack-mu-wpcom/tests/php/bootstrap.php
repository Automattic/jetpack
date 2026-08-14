<?php
/**
 * Bootstrap.
 *
 * @package automattic/
 */

// Brain Monkey / Patchwork instruments every included file, and this package's
// suite loads a large amount of mu-wpcom code, so it runs up against the default
// 128M limit. Raise it (only when the current limit is lower, and never when it
// is unlimited) so adding tests doesn't OOM mid-run.
$mu_wpcom_mem_limit = trim( ini_get( 'memory_limit' ) );
if ( '' !== $mu_wpcom_mem_limit && '-1' !== $mu_wpcom_mem_limit ) {
	$mu_wpcom_mem_bytes = (int) $mu_wpcom_mem_limit;
	switch ( strtolower( $mu_wpcom_mem_limit[ strlen( $mu_wpcom_mem_limit ) - 1 ] ) ) {
		case 'g':
			$mu_wpcom_mem_bytes *= 1024;
			// Fall through.
		case 'm':
			$mu_wpcom_mem_bytes *= 1024;
			// Fall through.
		case 'k':
			$mu_wpcom_mem_bytes *= 1024;
	}
	if ( $mu_wpcom_mem_bytes < 256 * 1024 * 1024 ) {
		ini_set( 'memory_limit', '256M' ); // phpcs:ignore WordPress.PHP.IniSet.memory_limit_Blacklisted
	}
}

/**
 * Include the composer autoloader.
 */
require_once __DIR__ . '/../../vendor/autoload.php';

// Initialize WordPress test environment
\Automattic\Jetpack\Test_Environment::init();

require_once __DIR__ . '/../lib/functions-wordpress.php';
require_once __DIR__ . '/../lib/class-wpcom-features.php';
require_once __DIR__ . '/../../src/class-jetpack-mu-wpcom.php';
Automattic\Jetpack\Jetpack_Mu_Wpcom::init();
