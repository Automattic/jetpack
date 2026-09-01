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
	 * @param bool $force_recheck Whether to force a re-check of the request. Defaults to false.
	 *
	 * @return bool True if shortcodes should hook on pre_kses, false otherwise.
	 */
	function jetpack_shortcodes_should_hook_pre_kses( $force_recheck = false ) {
		static $is_frontend;

		if ( $force_recheck || null === $is_frontend ) {
			$is_frontend = Request::is_frontend( false );
		}

		$should_hook = ! $is_frontend;

		/**
		 * Filters whether shortcodes should hook on pre_kses.
		 *
		 * @since 15.0
		 *
		 * @param bool $should_hook Whether shortcodes should hook on pre_kses.
		 */
		return apply_filters( 'jetpack_shortcodes_should_hook_pre_kses', $should_hook );
	}
}
