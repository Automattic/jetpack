<?php
/**
 * Get blog stats.
 *
 * @package automattic/jetpack
 */

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
}

wpcom_rest_api_v2_load_plugin( 'WPCOM_REST_API_V2_Endpoint_Blog_Stats' );
