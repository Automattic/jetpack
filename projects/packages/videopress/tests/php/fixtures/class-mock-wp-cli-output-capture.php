<?php
/**
 * Capture buffer for the mock WP_CLI used in package tests.
 *
 * Lives in its own file (parseable by phan, unlike wp-cli-mock.php which
 * redefines core WP_CLI classes) so tests can read static state without
 * triggering PhanUndeclaredStaticProperty against the real wp-cli stubs.
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack\VideoPress\Tests;

/**
 * Records output emitted by the mock WP_CLI methods.
 */
class Mock_WP_CLI_Output_Capture {

	/**
	 * Captured messages keyed by WP_CLI output level.
	 *
	 * @var array<string,array<int,string>>
	 */
	public static $captured = array();

	/**
	 * Reset the captured-message buffer between tests.
	 */
	public static function reset() {
		self::$captured = array(
			'warning' => array(),
			'log'     => array(),
			'success' => array(),
		);
	}

	/**
	 * Record a message emitted by the mock WP_CLI.
	 *
	 * @param string $level   Output level: warning, log, success.
	 * @param string $message Message text.
	 */
	public static function record( $level, $message ) {
		if ( ! isset( self::$captured[ $level ] ) ) {
			self::$captured[ $level ] = array();
		}
		self::$captured[ $level ][] = $message;
	}
}
