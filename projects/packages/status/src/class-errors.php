<?php
/**
 * An errors utility class for Jetpack.
 *
 * @package automattic/jetpack-status
 */

// phpcs:disable WordPress.PHP.IniSet.display_errors_Disallowed
// phpcs:disable WordPress.PHP.NoSilencedErrors.Discouraged
// phpcs:disable WordPress.PHP.DevelopmentFunctions.prevent_path_disclosure_error_reporting
// phpcs:disable WordPress.PHP.DiscouragedPHPFunctions.runtime_configuration_error_reporting

namespace Automattic\Jetpack;

/**
 * Erros class.
 *
 * @deprecated since 3.2.0
 */
class Errors {
	/**
	 * Catches PHP errors.  Must be used in conjunction with output buffering.
	 *
	 * @deprecated since 3.2.0
	 * @param bool $catch True to start catching, False to stop.
	 *
	 * @static
	 */
	public function catch_errors( $catch ) {
		_deprecated_function( __METHOD__, '3.2.0' );
		static $display_errors, $error_reporting;

		if ( $catch ) {
			// Force error reporting and output, store original values.
			$display_errors  = @ini_set( 'display_errors', 1 );
			$error_reporting = @error_reporting( E_ALL );
			if ( class_exists( 'Jetpack' ) ) {
				add_action( 'shutdown', array( 'Jetpack', 'catch_errors_on_shutdown' ), 0 );
			}
		} else {
			// Restore the original values for error reporting and output.
			@ini_set( 'display_errors', $display_errors );
			if ( $error_reporting !== null ) {
				@error_reporting( $error_reporting );
			}
			if ( class_exists( 'Jetpack' ) ) {
				remove_action( 'shutdown', array( 'Jetpack', 'catch_errors_on_shutdown' ), 0 );
			}
		}
	}
}
