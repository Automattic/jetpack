<?php
/**
 * Implement debug helper methods.
 *
 * @link       https://automattic.com
 * @since      1.0.0
 * @package    automattic/jetpack-boost
 */

namespace Automattic\Jetpack_Boost\Lib;

/**
 * Class Debug
 */
class Debug {
	/**
	 * Returns whether the debug mode has been triggered.
	 */
	public static function is_debug_mode() {
		$script_debug      = defined( 'SCRIPT_DEBUG' ) && \SCRIPT_DEBUG;
		$manual_debug_mode = filter_input( INPUT_GET, 'jetpack-boost-debug' );

		$debug = $script_debug || $manual_debug_mode;

		/**
		 * Filter debug status on/off
		 *
		 * @param bool $debug_status enable or disable debug mode.
		 *
		 * @since   1.0.0
		 */
		return apply_filters( 'jetpack_boost_debug', $debug );
	}

	/**
	 * Write one line to the PHP error log, under WP_DEBUG only.
	 *
	 * The messages carry third-party text (exception messages, file paths, cache
	 * keys), so the line is scrubbed of CR/LF first: a message spanning two lines can
	 * otherwise forge a log entry of its own (CWE-117).
	 *
	 * @since 4.7.0
	 *
	 * @param string $message What happened. Prefixed with "Jetpack Boost: ".
	 *
	 * @return void
	 */
	public static function log( $message ) {
		if ( ! defined( 'WP_DEBUG' ) || ! \WP_DEBUG ) {
			return;
		}

		// phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
		error_log( self::scrub( 'Jetpack Boost: ' . $message ) );
	}

	/**
	 * Flatten a log line to one physical line.
	 *
	 * Separate from log(), and public, so a unit test can assert the rule without
	 * defining WP_DEBUG for the whole process. log() is the only caller.
	 *
	 * @since 4.7.0
	 *
	 * @param mixed $message Text that may contain CR/LF. Cast rather than typed: a
	 *                       logging helper must not raise a TypeError on a path
	 *                       that is already handling a failure.
	 *
	 * @return string
	 */
	public static function scrub( $message ) {
		return str_replace( array( "\r", "\n" ), ' ', (string) $message );
	}
}
