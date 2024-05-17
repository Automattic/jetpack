<?php
/**
 * Get post types and top posts.
 *
 * @package automattic/jetpack
 */

/**
 * Top Posts & Pages block endpoint.
 */
class WPCOM_REST_API_V2_Endpoint_Top_Posts extends WP_REST_Controller {
	/**
	 * Constructor.
	 */
	public function __construct() {
		add_action( 'rest_api_init', array( $this, 'register_routes' ) );

		if ( ! class_exists( 'Jetpack_Top_Posts_Helper' ) ) {
			require_once JETPACK__PLUGIN_DIR . '_inc/lib/class-jetpack-top-posts-helper.php';
		}
	}

	/**
	 * Register endpoint routes.
	 */
	public function register_routes() {
		register_rest_route(
			'wpcom/v2',
			'/post-types',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_post_types' ),
					'permission_callback' => function () {
						return current_user_can( 'edit_posts' );
					},
				),
			)
		);

		// Number of posts and selected post types are not needed in the Editor.
		// This is to minimise requests when it can already be handled by the block.
		register_rest_route(
			'wpcom/v2',
			'/top-posts',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_top_posts' ),
					'permission_callback' => function () {
						return current_user_can( 'edit_posts' );
					},
					'args'                => array(
						'period' => array(
							'description'       => __( 'Timeframe for stats.', 'jetpack' ),
							'type'              => array( 'string', 'integer' ),
							'required'          => true,
							'validate_callback' => function ( $param ) {
								return is_numeric( $param ) || is_string( $param );
							},
						),
					),
				),
			)
		);
	}

	/**
	 * Get the site's post types.
	 *
	 * @return array Site's post types.
	 */
	public function get_post_types() {
		$post_types       = array_values( get_post_types( array( 'public' => true ) ) );
		$post_types_array = array();

		foreach ( $post_types as $type ) {
			$post_types_array[] = array(
				'label' => get_post_type_object( $type )->labels->name,
				'id'    => $type,
			);
		}

		return $post_types_array;
	}

	/**
	 * Get the site's top content.
	 *
	 * @param \WP_REST_Request $request request object.
	 *
	 * @return array Data on top posts.
	 */
	public function get_top_posts( $request ) {
		$period = $request->get_param( 'period' );
		return Jetpack_Top_Posts_Helper::get_top_posts( $period );
	}
}

wpcom_rest_api_v2_load_plugin( 'WPCOM_REST_API_V2_Endpoint_Top_Posts' );
