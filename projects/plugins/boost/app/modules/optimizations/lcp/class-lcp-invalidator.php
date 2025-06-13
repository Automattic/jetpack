<?php
/**
 * LCP Invalidator
 *
 * Reset LCP analysis data on certain events.
 */

namespace Automattic\Jetpack_Boost\Modules\Optimizations\Lcp;

use Automattic\Jetpack_Boost\Lib\Cornerstone\Cornerstone_Utils;

class LCP_Invalidator {

	public static function init() {
		add_action( 'jetpack_boost_deactivate', array( self::class, 'reset_data' ) );
		add_action( 'update_option_jetpack_boost_ds_cornerstone_pages_list', array( self::class, 'reset_and_analyze' ) );
		add_action( 'jetpack_boost_environment_changed', array( self::class, 'handle_environment_change' ) );
		add_action( 'post_updated', array( self::class, 'handle_post_update' ) );
	}

	/**
	 * Reset any LCP analysis data (state and storage).
	 *
	 * @since 4.0.0
	 */
	public static function reset_data() {
		$state = new LCP_State();
		$state->clear();

		$storage = new LCP_Storage();
		$storage->clear();
	}

	/**
	 * Reset the LCP analysis data, and analyze the pages again.
	 *
	 * @since 4.0.0
	 */
	public static function reset_and_analyze() {
		self::reset_data();

		/**
		 * Indicate that the latest LCP analysis data has been invalidated.
		 */
		do_action( 'jetpack_boost_lcp_invalidated' );
	}

	/**
	 * Respond to environment changes; deciding whether or not to clear LCP analysis data.
	 *
	 * @since 4.0.0
	 */
	public static function handle_environment_change( $is_major_change ) {
		if ( $is_major_change ) {
			self::reset_and_analyze();
		}
	}

	/**
	 * Handle post updates to check if the post is a cornerstone page and schedule preload if needed.
	 *
	 * @since 4.0.0
	 * @param int $post_id The ID of the post being updated.
	 * @return void
	 */
	public static function handle_post_update( int $post_id ) {
		if ( Cornerstone_Utils::is_cornerstone_page( $post_id ) ) {
			$url = get_permalink( $post_id );

			$analyzer = new LCP_Analyzer();
			$analyzer->start_partial_analysis(
				array(
					Cornerstone_Utils::prepare_provider_data( $url ),
				)
			);
		}
	}
}
