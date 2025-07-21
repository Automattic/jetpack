<?php
/**
 * Shared utility functions for Jetpack shortcodes.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Status\Request;

if ( ! function_exists( 'jetpack_shortcodes_should_hook_pre_kses' ) ) {
	/**
	 * Determine if shortcodes should hook on pre_kses.
	 *
	 * @return bool True if shortcodes should hook on pre_kses, false otherwise.
	 */
	function jetpack_shortcodes_should_hook_pre_kses() {
		static $is_frontend;

		if ( null === $is_frontend ) {
			$is_frontend = Request::is_frontend( false );
		}

		return ! $is_frontend;
	}
}
