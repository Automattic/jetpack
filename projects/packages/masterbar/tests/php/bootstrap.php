<?php
/**
 * Bootstrap.
 *
 * @package automattic/jetpack-masterbar
 */

/**
 * Include the composer autoloader.
 */
require_once __DIR__ . '/../../vendor/autoload.php';
require_once __DIR__ . '/../../vendor/antecedent/patchwork/Patchwork.php';

/*
 * One Patchwork cache per run, inherited by process-isolated tests so each skips re-instrumenting
 * WordPress. Never reused across runs, so it cannot serve code from an older WordPress or Patchwork.
 */
$jetpack_patchwork_cache = getenv( 'JETPACK_MASTERBAR_PATCHWORK_CACHE' );
if ( ! $jetpack_patchwork_cache && function_exists( 'Patchwork\Config\setCachePath' ) ) {
	$jetpack_patchwork_cache = sys_get_temp_dir() . '/jetpack-masterbar-patchwork-' . uniqid( '', true );
	if ( mkdir( $jetpack_patchwork_cache, 0700 ) ) {
		$jetpack_patchwork_cache = realpath( $jetpack_patchwork_cache );
		putenv( "JETPACK_MASTERBAR_PATCHWORK_CACHE=$jetpack_patchwork_cache" );
		register_shutdown_function(
			static function () use ( $jetpack_patchwork_cache ) {
				foreach ( glob( $jetpack_patchwork_cache . '/*' ) as $file ) {
					unlink( $file );
				}
				rmdir( $jetpack_patchwork_cache );
			}
		);
	} else {
		$jetpack_patchwork_cache = false;
	}
}
if ( $jetpack_patchwork_cache && is_dir( $jetpack_patchwork_cache ) && is_writable( $jetpack_patchwork_cache ) ) {
	\Patchwork\Config\setCachePath( $jetpack_patchwork_cache, __DIR__ );
}

define( 'WP_DEBUG', true );

// Process-isolated tests need a script filename to avoid wp_guess_url() warnings on PHP 7.4.
if ( empty( $_SERVER['SCRIPT_FILENAME'] ) ) {
	$_SERVER['SCRIPT_FILENAME'] = __FILE__;
}

// Initialize WordPress test environment
\Automattic\Jetpack\Test_Environment::init();

\Automattic\RedefineExit::setup();
