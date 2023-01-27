<?php
/**
 * Entrypoint for actually executing the WAF.
 *
 * @package automattic/jetpack-waf
 */

namespace Automattic\Jetpack\Waf;

use Automattic\Jetpack\Status\Host;

/**
 * Executes the WAF.
 */
class Waf_Runner {

	/**
	 * Run the WAF
	 */
	public static function initialize() {
		if ( ! Waf_Manager::is_enabled() ) {
			return;
		}
		Waf_Constants::define_mode();
		Waf_Constants::define_share_data();
		if ( ! self::is_allowed_mode( JETPACK_WAF_MODE ) ) {
			return;
		}
		// Don't run if in standalone mode
		if ( function_exists( 'add_action' ) ) {
			Waf_Manager::add_hooks();
			Waf_Rules_Manager::schedule_rules_cron();
		}
		if ( ! self::did_run() ) {
			self::run();
		}
	}

	/**
	 * Did the WAF run yet or not?
	 *
	 * @return bool
	 */
	public static function did_run() {
		return defined( 'JETPACK_WAF_RUN' );
	}

	/**
	 * Determines if the passed $option is one of the allowed WAF operation modes.
	 *
	 * @param  string $option The mode option.
	 * @return bool
	 */
	public static function is_allowed_mode( $option ) {
		// Normal constants are defined prior to WP_CLI running causing problems for activation
		if ( defined( 'WAF_CLI_MODE' ) ) {
			$option = WAF_CLI_MODE;
		}

		$allowed_modes = array(
			'normal',
			'silent',
		);

		return in_array( $option, $allowed_modes, true );
	}

	/**
	 * Determines if the WAF is supported in the current environment.
	 *
	 * @since 0.8.0
	 * @return bool
	 */
	public static function is_supported_environment() {
		// Do not run when killswitch is enabled
		if ( defined( 'DISABLE_JETPACK_WAF' ) && DISABLE_JETPACK_WAF ) {
			return false;
		}

		// Do not run in the WPCOM context
		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			return false;
		}

		// Do not run on the Atomic platform
		if ( ( new Host() )->is_atomic_platform() ) {
			return false;
		}

		return true;
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

		Waf_Constants::initialize_bootstrap_constants();

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
			$waf = new Waf_Runtime( new Waf_Transforms(), new Waf_Operators() );

			// execute waf rules.
			$rules_file_path = Waf_Manager::get_waf_file_path( Waf_Rules_Manager::RULES_ENTRYPOINT_FILE );
			if ( file_exists( $rules_file_path ) ) {
				// phpcs:ignore
				include $rules_file_path;
			}
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
