<?php
/**
 * Entrypoint for actually executing the WAF.
 *
 * @package automattic/jetpack-waf
 */

namespace Automattic\Jetpack\Waf;

/**
 * Executes the WAF.
 */
class WafRunner {

	const RULES_FILE = __DIR__ . '/../rules/rules.php';

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
		// Make double-sure we are only running once.
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
		// phpcs:ignore
		ini_set( 'display_errors', 'Off' );
		// phpcs:ignore
		set_error_handler( array( self::class, 'errorHandler' ) );

		try {

			// phpcs:ignore
			$waf = new WafRuntime( new WafTransforms(), new WafOperators() );

			// execute waf rules.
			// phpcs:ignore
			include self::RULES_FILE;
		} catch ( \Exception $err ) { // phpcs:ignore
			// Intentionally doing nothing.
		}

		// remove the custom error handler, so we don't interfere with the site.
		restore_error_handler();
		// phpcs:ignore
		ini_set( 'display_errors', $display_errors );
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
	public static function errorHandler( $code, $message, $file, $line ) { // phpcs:ignore
		// Intentionally doing nothing for now.
	}
}
