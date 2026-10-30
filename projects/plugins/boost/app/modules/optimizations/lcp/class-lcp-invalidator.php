<?php
/**
 * LCP Invalidator
 *
 * Reset LCP analysis data on certain events.
 */

namespace Automattic\Jetpack_Boost\Modules\Optimizations\Lcp;

use Automattic\Jetpack_Boost\Lib\Cornerstone\Cornerstone_Utils;

class LCP_Invalidator {

	const STYLE_REANALYSIS_HOOK = 'jetpack_boost_lcp_style_reanalysis';

	/**
	 * Post types whose saves can restyle the LCP image on every cornerstone page.
	 */
	const STYLE_POST_TYPES = array( 'wp_template', 'wp_template_part', 'wp_global_styles', 'custom_css' );

	public static function init() {
		add_action( 'jetpack_boost_deactivate', array( self::class, 'reset_data' ) );
		add_action( 'update_option_jetpack_boost_ds_cornerstone_pages_list', array( self::class, 'reset_and_analyze' ) );
		add_action( 'jetpack_boost_environment_changed', array( self::class, 'handle_environment_change' ) );
		add_action( 'post_updated', array( self::class, 'handle_post_update' ) );
		add_action( 'save_post', array( self::class, 'handle_style_save' ), 10, 2 );
		add_action( self::STYLE_REANALYSIS_HOOK, array( self::class, 'reanalyze_cornerstone_pages' ) );
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

		wp_clear_scheduled_hook( self::STYLE_REANALYSIS_HOOK );
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

	/**
	 * Schedule a re-analysis of every cornerstone page after a template or site-wide style is saved.
	 *
	 * @since $$next-version$$
	 * @param int      $post_id The ID of the saved post.
	 * @param \WP_Post $post    The saved post.
	 * @return void
	 */
	public static function handle_style_save( $post_id, $post ) {
		if ( 'publish' !== $post->post_status || ! in_array( $post->post_type, self::STYLE_POST_TYPES, true ) ) {
			return;
		}

		// One Site Editor save writes several of these, and the cloud caps LCP URLs per hour, so wait for the last.
		wp_clear_scheduled_hook( self::STYLE_REANALYSIS_HOOK );
		wp_schedule_single_event( time() + 5 * MINUTE_IN_SECONDS, self::STYLE_REANALYSIS_HOOK );
	}

	/**
	 * Re-analyse every cornerstone page, serving the current results until new ones arrive.
	 *
	 * @since $$next-version$$
	 * @return void
	 */
	public static function reanalyze_cornerstone_pages() {
		$state = ( new LCP_State() )->get();
		if ( empty( $state['pages'] ) ) {
			return;
		}

		$pages = array_map( array( Cornerstone_Utils::class, 'prepare_provider_data' ), Cornerstone_Utils::get_list() );

		( new LCP_Analyzer() )->start_partial_analysis( $pages );
	}
}
