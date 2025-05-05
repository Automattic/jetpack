<?php
/**
 * LCP Invalidator
 *
 * Reset LCP analysis data on certain events.
 */

namespace Automattic\Jetpack_Boost\Modules\Optimizations\Lcp;

class LCP_Invalidator {

	public static function init() {
		add_action( 'jetpack_boost_deactivate', array( self::class, 'reset_data' ) );
		add_action( 'jetpack_boost_environment_changed', array( self::class, 'handle_environment_change' ) );
	}

	/**
	 * Reset any LCP analysis data (state and storage).
	 *
	 * @since $$next-version$$
	 */
	public static function reset_data() {
		$state = new LCP_State();
		$state->clear();

		$storage = new LCP_Storage();
		$storage->clear();
	}

	/**
	 * Respond to environment changes; deciding whether or not to clear LCP analysis data.
	 *
	 * @since $$next-version$$
	 */
	public static function handle_environment_change( $is_major_change ) {
		if ( $is_major_change ) {
			self::reset_data();

			/**
			 * Indicate that the latest LCP analysis data has been invalidated.
			 */
			do_action( 'jetpack_boost_lcp_invalidated' );
		}
	}
}
