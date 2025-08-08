<?php
/**
 * Get the User ID of a Goodreads account using its Author ID.
 *
 * @package automattic/jetpack
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Goodreads block endpoint.
 */
class WPCOM_REST_API_V2_Endpoint_Goodreads extends WP_REST_Controller {
	/**
	 * Constructor.
	 */
	public function __construct() {
		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	/**
	 * Register endpoint route.
	 */
	public function register_routes() {
		register_rest_route(
			'wpcom/v2',
			'/goodreads/user-id',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_goodreads_user_id' ),
					'permission_callback' => function () {
						return current_user_can( 'edit_posts' );
					},
					'args'                => array(
						'id' => array(
							'description'       => __( 'Goodreads user ID', 'jetpack' ),
							'type'              => 'integer',
							'required'          => true,
							'minimum'           => 1,
							'validate_callback' => function ( $param ) {
								return is_numeric( $param ) && (int) $param > 0;
							},
						),
					),
				),
			)
		);
	}

	/**
	 * Get the user ID from the author ID.
	 *
	 * @param \WP_REST_Request $request request object.
	 *
	 * @return \WP_Error|int Goodreads user ID (or 404 error if not found).
	 */
	public function get_goodreads_user_id( $request ) {
		$profile_id = $request->get_param( 'id' );
		$url        = 'https://www.goodreads.com/author/show/' . $profile_id;
		$response   = wp_remote_get( esc_url_raw( $url ) );
		$not_found  = new WP_Error( 'not_found', 'Goodreads user not found.', array( 'status' => 404 ) );

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$body    = wp_remote_retrieve_body( $response );
		$pattern = '/goodreads\.com\/user\/updates_rss\/(\d+)/';

		if ( preg_match( $pattern, $body, $matches ) ) {
			$user_id = intval( $matches[1] );
			return $user_id;
		}

		return $not_found;
	}
}

wpcom_rest_api_v2_load_plugin( 'WPCOM_REST_API_V2_Endpoint_Goodreads' );
