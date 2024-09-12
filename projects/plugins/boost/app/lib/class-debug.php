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
}
