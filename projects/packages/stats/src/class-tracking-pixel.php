<?php
/**
 * Stats Tracking_Pixel
 *
 * @package automattic/jetpack-stats
 */

namespace Automattic\Jetpack\Stats;

use Jetpack_Options;
use WP_Post;

/**
 * Stats Tracking_Pixel class.
 *
 * Responsible for embedding the Stats tracking pixel.
 *
 * @since 0.1.0
 */
class Tracking_Pixel {

	/**
	 * Array name.
	 *
	 * @var string $array_name The 'stats' array name
	 */
	const STATS_ARRAY_TO_STRING_FILTER = 'stats_array';

	/**
	 * Stats Build View Data.
	 *
	 * @access public
	 * @return array.
	 */
	public static function build_view_data() {
		global $wp_the_query;

		$blog     = Jetpack_Options::get_option( 'id' );
		$tz       = get_option( 'gmt_offset' );
		$v        = 'ext';
		$blog_url = wp_parse_url( site_url() );
		$srv      = $blog_url['host'];
		if ( $wp_the_query->is_single || $wp_the_query->is_page || $wp_the_query->is_posts_page ) {
			// Store and reset the queried_object and queried_object_id
			// Otherwise, redirect_canonical() will redirect to home_url( '/' ) for show_on_front = page sites where home_url() is not all lowercase.
			// Repro:
			// 1. Set home_url = https://ExamPle.com/
			// 2. Set show_on_front = page
			// 3. Set page_on_front = something
			// 4. Visit https://example.com/ !
			$queried_object    = isset( $wp_the_query->queried_object ) ? $wp_the_query->queried_object : null;
			$queried_object_id = isset( $wp_the_query->queried_object_id ) ? $wp_the_query->queried_object_id : null;
			try {
				$post_obj = $wp_the_query->get_queried_object();
				$post     = $post_obj instanceof WP_Post ? $post_obj->ID : '0';
			} finally {
				$wp_the_query->queried_object    = $queried_object;
				$wp_the_query->queried_object_id = $queried_object_id;
			}
		} else {
			$post = '0';
		}
		return compact( 'v', 'blog', 'post', 'tz', 'srv' );
	}

	/**
	 * Stats Footer.
	 *
	 * @access public
	 * @return void
	 */
	public static function add_to_footer() {
		$data   = self::build_view_data();
		$footer = self::get_footer_to_add( $data );
		print $footer; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	}

	/**
	 * Gets the footer to add for the Stats tracker.
	 *
	 * @access public
	 * @param array $data Array of data for the JS stats tracker.
	 * @return string Returns the footer to add for the Stats tracker.
	 */
	public static function get_footer_to_add( $data ) {
		if ( self::is_amp_request() ) {
			/**
			 * Filter the parameters added to the AMP pixel tracking code.
			 *
			 * @module stats
			 *
			 * @since-jetpack 10.9
			 *
			 * @param array $data Array of options about the site and page you're on.
			 */
			$data = (array) apply_filters( 'jetpack_stats_footer_amp_data', $data );
			return self::get_amp_footer( $data );
		} else {
			/**
			 * Filter the parameters added to the JavaScript stats tracking code.
			 *
			 * @module stats
			 *
			 * @since-jetpack 10.9
			 *
			 * @param array $data Array of options about the site and page you're on.
			 */
			$data = (array) apply_filters( 'jetpack_stats_footer_js_data', $data );
			return self::get_footer( $data );
		}
	}

	/**
	 * Gets the stats footer
	 *
	 * @access private
	 * @param array $data Array of data for the JS stats tracker.
	 * @return string Returns the footer to add for the Stats tracker in a non AMP scenario.
	 */
	private static function get_footer( $data ) {
		// phpcs:disable WordPress.WP.EnqueuedResources.NonEnqueuedScript
		// When there is a way to use defer with enqueue, we can move to it and inline the custom data.
		$script           = 'https://stats.wp.com/e-' . gmdate( 'YW' ) . '.js';
		$data_stats_array = self::stats_array_to_string( $data );
		$stats_footer     = <<<END
	<script src='{$script}' defer></script>
	<script>
		_stq = window._stq || [];
		_stq.push([ 'view', {{$data_stats_array}} ]);
		_stq.push([ 'clickTrackerInit', '{$data['blog']}', '{$data['post']}' ]);
	</script>
END;
		// phpcs:enable
		return $stats_footer;
	}

	/**
	 * Render the stats footer. Kept for backward compatibility
	 *
	 * @access public
	 * @param array $data Array of data for the JS stats tracker.
	 */
	public static function render_footer( $data ) {
		print self::get_footer( $data ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	}

	/**
	 * Gets the stats footer for AMP output.
	 *
	 * @access private
	 * @param array $data Array of data for the AMP pixel tracker.
	 * @return string Returns the footer to add for the Stats tracker in an AMP scenario.
	 */
	private static function get_amp_footer( $data ) {
		$data['host'] = isset( $_SERVER['HTTP_HOST'] ) ? sanitize_text_field( wp_unslash( $_SERVER['HTTP_HOST'] ) ) : ''; // input var ok.
		$data['rand'] = 'RANDOM'; // AMP placeholder.
		$data['ref']  = 'DOCUMENT_REFERRER'; // AMP placeholder.
		$data         = array_map( 'rawurlencode', $data );
		$pixel_url    = add_query_arg( $data, 'https://pixel.wp.com/g.gif' );
		return '<amp-pixel src="' . esc_url( $pixel_url ) . '"></amp-pixel>';
	}

	/**
	 * Render the stats footer for AMP output.
	 *
	 * @access public
	 * @param array $data Array of data for the AMP pixel tracker.
	 */
	public static function render_amp_footer( $data ) {
		print self::get_amp_footer( $data ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	}

	/**
	 * Creates the "array" string used as part of the JS tracker.
	 *
	 * @access private
	 * @param array $kvs Array of options about the site and page you're on.
	 * @return string
	 */
	private static function stats_array_to_string( $kvs ) {
		/**
		 * Filters the options added to the JavaScript Stats tracking code.
		 *
		 * @since-jetpack 1.1.0
		 *
		 * @param array $kvs Array of options about the site and page you're on.
		 */
		$kvs   = (array) apply_filters( self::STATS_ARRAY_TO_STRING_FILTER, $kvs );
		$kvs   = array_map( 'addslashes', $kvs );
		$jskvs = array();
		foreach ( $kvs as $k => $v ) {
			$jskvs[] = "$k:'$v'";
		}
		return join( ',', $jskvs );
	}

	/**
	 * Does the page return AMP content.
	 *
	 * @return bool $is_amp_request Are we on AMP view.
	 */
	private static function is_amp_request() {
		$is_amp_request = ( function_exists( 'amp_is_request' ) && amp_is_request() );

		/**
		 * Returns true if the current request should return valid AMP content.
		 *
		 * @since 6.2.0
		 *
		 * @param boolean $is_amp_request Is this request supposed to return valid AMP content?
		 */
		return apply_filters( 'jetpack_is_amp_request', $is_amp_request );
	}
}
