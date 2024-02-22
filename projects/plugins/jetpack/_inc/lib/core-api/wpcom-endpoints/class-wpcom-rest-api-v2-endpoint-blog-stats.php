<?php
/**
 * Get blog stats.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Stats\WPCOM_Stats;

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
	}

	/**
	 * Get the blog stats.
	 *
	 * @param \WP_REST_Request $request Request object.
	 *
	 * @return array Blog stats.
	 */
	public function get_blog_stats( $request ) {
		$post_id   = $request->get_param( 'post_id' );
		$post_data = convert_stats_array_to_object(
			( new WPCOM_Stats() )->get_post_views( $post_id, array( 'fields' => 'views' ) )
		);
		$blog_data = convert_stats_array_to_object(
			( new WPCOM_Stats() )->get_stats( array( 'fields' => 'stats' ) )
		);

		if ( ! isset( $blog_data->stats->views ) || ! isset( $blog_data->stats->visitors ) ) {
			return false;
		}

		if ( ! isset( $post_data->views ) ) {
			$post_data->views = 0;
		}

		return array(
			'post-views'    => $post_data->views,
			'blog-visitors' => $blog_data->stats->visitors,
			'blog-views'    => $blog_data->stats->views,
		);
	}
}

wpcom_rest_api_v2_load_plugin( 'WPCOM_REST_API_V2_Endpoint_Blog_Stats' );
