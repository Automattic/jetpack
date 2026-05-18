<?php
/**
 * Stats function mocks.
 *
 * @package automattic/jetpack-podcast
 * @phan-file-suppress PhanRedefineFunction
 */

if ( ! function_exists( 'stats_get_visitors' ) ) {
	/**
	 * Mock the WordPress.com Simple visitor stats helper.
	 *
	 * @return array
	 */
	function stats_get_visitors() {
		$GLOBALS['podcast_promo_stats_get_visitors_args'] = func_get_args();

		return isset( $GLOBALS['podcast_promo_stats_get_visitors'] ) && is_array( $GLOBALS['podcast_promo_stats_get_visitors'] )
			? $GLOBALS['podcast_promo_stats_get_visitors']
			: array();
	}
}
