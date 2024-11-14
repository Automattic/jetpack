<?php
/**
 * Entrypoint for actually executing the WAF.
 *
 * @package automattic/jetpack-waf
 */

namespace Automattic\Jetpack\Waf_Runtime;

require_once __DIR__ . '/class-operators.php';
require_once __DIR__ . '/class-runtime.php';
require_once __DIR__ . '/class-transforms.php';

/**
 * Executes the WAF.
 */
class Runner {

	/**
	 * Did the WAF run yet or not?
	 *
	 * @return bool
	 */
	public static function did_run() {
		return defined( 'JETPACK_WAF_RUN' );
	}

	/**
	 * Runs the WAF and potentially stops the request if a problem is found.
	 *
	 * @return void
	 */
	public static function run() {
		// Only run once.
		if ( self::did_run() ) {
			return;
		}

		// if ABSPATH is defined, then WordPress has already been instantiated,
		// and we're running as a plugin (meh). Otherwise, we're running via something
		// like PHP's prepend_file setting (yay!).
		define( 'JETPACK_WAF_RUN', defined( 'ABSPATH' ) ? 'plugin' : 'preload' );

		// if the WAF is being run before a command line script, don't try to execute rules (there's no request).
		if ( PHP_SAPI === 'cli' ) {
			return;
		}

		// if something terrible happens during the WAF running, we don't want to interfere with the rest of the site,
		// so we intercept errors ONLY while the WAF is running, then we remove our handler after the WAF finishes.
		$display_errors = ini_get( 'display_errors' );

		ini_set( 'display_errors', 'Off' ); // phpcs:ignore WordPress.PHP.IniSet.display_errors_Disallowed -- We only customize error reporting while the WAF is running, and remove our handler afterwards.

		set_error_handler( array( self::class, 'error_handler' ) ); // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_set_error_handler -- We only customize error reporting while the WAF is running, and remove our handler afterwards.

		try {

			// phpcs:ignore
			$waf = new Runtime( new Transforms(), new Operators() );

			// execute waf rules.
			$rules_file_path = JETPACK_WAF_DIR . JETPACK_WAF_ENTRYPOINT;
			if ( file_exists( $rules_file_path ) ) {
				// phpcs:ignore
				include $rules_file_path;
			}
		} catch ( \Exception $err ) { // phpcs:ignore
			// Intentionally doing nothing.
		}

		// remove the custom error handler, so we don't interfere with the site.
		restore_error_handler();

		// Restore the original value.
		ini_set( 'display_errors', $display_errors ); // phpcs:ignore WordPress.PHP.IniSet.display_errors_Disallowed -- We only customize error reporting while the WAF is running, and remove our handler afterwards.
	}

	/**
	 * Error handler to be used while the WAF is being executed.
	 *
	 * @param int    $code The error code.
	 * @param string $message The error message.
	 * @param string $file File with the error.
	 * @param string $line Line of the error.
	 * @return void
	 */
	public static function error_handler( $code, $message, $file, $line ) { // phpcs:ignore
		// Intentionally doing nothing for now.
	}
}
