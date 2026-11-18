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

$jetpack_patchwork_cache = getenv( 'JETPACK_MASTERBAR_PATCHWORK_CACHE' );
if ( ! $jetpack_patchwork_cache ) {
	$jetpack_patchwork_cache = sys_get_temp_dir() . '/jetpack-masterbar-patchwork-' . uniqid( '', true );
	if ( ! mkdir( $jetpack_patchwork_cache, 0700 ) ) {
		throw new RuntimeException( "Could not create the Patchwork cache directory $jetpack_patchwork_cache." );
	}
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
} elseif ( ! is_dir( $jetpack_patchwork_cache ) || ! is_writable( $jetpack_patchwork_cache ) ) {
	throw new RuntimeException( "The Patchwork cache directory $jetpack_patchwork_cache is missing or not writable." );
}
\Patchwork\Config\setCachePath( $jetpack_patchwork_cache, __DIR__ );

define( 'WP_DEBUG', true );

// Process-isolated tests need a script filename to avoid wp_guess_url() warnings on PHP 7.4.
if ( empty( $_SERVER['SCRIPT_FILENAME'] ) ) {
	$_SERVER['SCRIPT_FILENAME'] = __FILE__;
}

// Initialize WordPress test environment
\Automattic\Jetpack\Test_Environment::init();

\Automattic\RedefineExit::setup();
