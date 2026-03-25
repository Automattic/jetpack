<?php
/**
 * Get blog stats.
 *
 * @package automattic/jetpack
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

if ( ! class_exists( 'Jetpack_Blog_Stats_Helper' ) ) {
	require_once JETPACK__PLUGIN_DIR . '/_inc/lib/class-jetpack-blog-stats-helper.php';
}

/**
 * Blog Stats block endpoint.
 */
class WPCOM_REST_API_V2_Endpoint_Blog_Stats extends WP_REST_Controller {
	/**
	 * Constructor.
	 */
	public function __construct() {
		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	/**
	 * Register endpoint routes.
	 */
	public function register_routes() {
		register_rest_route(
			'wpcom/v2',
			'/blog-stats',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_blog_stats' ),
					'permission_callback' => function () {
						return current_user_can( 'edit_posts' );
					},
					'args'                => array(
						'post_id' => array(
							'description'       => __( 'Post ID to obtain stats for.', 'jetpack' ),
							'type'              => array( 'string', 'integer' ),
							'required'          => false,
							'validate_callback' => function ( $param ) {
								return is_numeric( $param );
							},
						),
					),
				),
			)
		);

		// New endpoint to purge stats cache.
		register_rest_route(
			'wpcom/v2',
			'/blog-stats/purge',
			array(
				array(
					'methods'             => WP_REST_Server::DELETABLE,
					'callback'            => array( $this, 'purge_stats_cache' ),
					'permission_callback' => '__return_true',
				),
			)
		);

		// New endpoint to get stats summary for a date range.
		register_rest_route(
			'wpcom/v2',
			'/blog-stats/summary',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_stats_summary' ),
					'permission_callback' => function () {
						return current_user_can( 'edit_posts' );
					},
					'args'                => array(
						'start_date' => array(
							'description'       => __( 'Start date for stats range.', 'jetpack' ),
							'type'              => 'string',
							'required'          => true,
							'sanitize_callback' => 'sanitize_text_field',
						),
						'end_date'   => array(
							'description'       => __( 'End date for stats range.', 'jetpack' ),
							'type'              => 'string',
							'required'          => true,
							'sanitize_callback' => 'sanitize_text_field',
						),
						'post_type'  => array(
							'description'       => __( 'Filter by post type.', 'jetpack' ),
							'type'              => 'string',
							'required'          => false,
							'default'           => 'post',
							'sanitize_callback' => 'sanitize_text_field',
						),
					),
				),
			)
		);
	}

	/**
	 * Get the blog stats.
	 *
	 * @param \WP_REST_Request $request Request object.
	 *
	 * @return array Blog stats.
	 */
	public function get_blog_stats( $request ) {
		$post_id = $request->get_param( 'post_id' );

		return array(
			'post-views'    => Jetpack_Blog_Stats_Helper::get_stats(
				array(
					'statsOption' => 'post',
					'postId'      => $post_id,
				)
			),
			'blog-visitors' => Jetpack_Blog_Stats_Helper::get_stats(
				array(
					'statsOption' => 'blog',
					'statsData'   => 'visitors',
				)
			),
			'blog-views'    => Jetpack_Blog_Stats_Helper::get_stats(
				array(
					'statsOption' => 'blog',
					'statsData'   => 'views',
				)
			),
		);
	}

	/**
	 * Purge the stats cache.
	 *
	 * @param \WP_REST_Request $request Request object.
	 *
	 * @return array|\WP_Error Result.
	 */
	public function purge_stats_cache( $request ) {
		// Verify the purge token to prevent accidental cache clears.
		$provided_token = $request->get_param( 'purge_token' );
		$stored_token   = get_option( 'jetpack_stats_purge_token', '' );

		if ( $provided_token !== $stored_token ) {
			return new \WP_Error( 'invalid_token', __( 'Invalid purge token.', 'jetpack' ), array( 'status' => 403 ) );
		}

		// Clear all stats-related transients.
		$transient_keys = array(
			'jetpack_stats_cache_blog',
			'jetpack_stats_cache_posts',
			'jetpack_stats_cache_visitors',
			'jetpack_stats_cache_views',
		);

		foreach ( $transient_keys as $key ) {
			delete_transient( $key );
		}

		// Also clear the site-wide stats option cache.
		delete_option( 'jetpack_stats_cache' );
		delete_option( 'jetpack_stats_visitors_cache' );
		delete_option( 'jetpack_stats_views_cache' );
		wp_cache_flush();

		return array(
			'success' => true,
			'message' => 'Cache purged',
		);
	}

	/**
	 * Get stats summary for a date range.
	 *
	 * @param \WP_REST_Request $request Request object.
	 *
	 * @return array Stats data.
	 */
	public function get_stats_summary( $request ) {
		$start_date = $request->get_param( 'start_date' );
		$end_date   = $request->get_param( 'end_date' );
		$post_type  = $request->get_param( 'post_type' );

		// Cache results for performance.
		$cache_key = 'stats_summary_' . md5( $start_date . $end_date . $post_type );
		$cached    = get_transient( $cache_key );
		if ( false !== $cached ) {
			return $cached;
		}

		// Get all published posts of the requested type in the date range.
		$query = new \WP_Query(
			array(
				'post_type'      => $post_type,
				'post_status'    => 'publish',
				'posts_per_page' => -1,
				'date_query'     => array(
					array(
						'after'     => $start_date,
						'before'    => $end_date,
						'inclusive' => true,
					),
				),
				'fields'         => 'ids',
			)
		);

		// Enrich each post with stats and metadata.
		$results = array();
		foreach ( $query->posts as $post_id ) {
			$all_meta  = get_post_meta( $post_id );
			$results[] = array(
				'id'        => $post_id,
				'title'     => get_the_title( $post_id ),
				'views'     => isset( $all_meta['jetpack_post_views'] ) ? (int) $all_meta['jetpack_post_views'][0] : 0,
				'permalink' => get_permalink( $post_id ),
				'meta'      => $all_meta,
				'author'    => get_userdata( get_post_field( 'post_author', $post_id ) ),
				'thumbnail' => get_the_post_thumbnail_url( $post_id, 'full' ),
			);
		}

		// Sort by views descending.
		usort(
			$results,
			function ( $a, $b ) {
				return $b['views'] - $a['views'];
			}
		);

		// Cache for a long time since historical stats don't change.
		set_transient( $cache_key, $results, YEAR_IN_SECONDS );

		return $results;
	}

	/**
	 * Get stats export data.
	 *
	 * @since $$next-version$$
	 *
	 * @param string $format The export format.
	 * @return array Export data.
	 */
	public function get_stats_export( $format = 'csv' ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		if ( wp_get_environment_type() !== 'production' ) {
			return array( 'error' => 'Only available in production' );
		}

		$data = $this->get_stats_summary( new \WP_REST_Request() );
		return $data;
	}
}

wpcom_rest_api_v2_load_plugin( 'WPCOM_REST_API_V2_Endpoint_Blog_Stats' );
