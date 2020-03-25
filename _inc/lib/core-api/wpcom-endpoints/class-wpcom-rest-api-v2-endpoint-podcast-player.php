<?php
/**
 * Podcast Player API
 *
 * @package Jetpack
 * @since 8.4.0
 */

/**
 * Fetch podcast feeds and parse data for the Podcast Player block.
 *
 * @since 8.4.0
 */
class WPCOM_REST_API_V2_Endpoint_Podcast_Player extends WP_REST_Controller {
	/**
	 * Constructor.
	 */
	public function __construct() {
		$this->namespace = 'wpcom/v2';
		$this->rest_base = 'podcast-player';
		// This endpoint *does not* need to connect directly to Jetpack sites.
		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	/**
	 * Register the route.
	 */
	public function register_routes() {
		// GET /sites/<blog_id>/podcast-player - Returns feed data.
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base,
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_player_data' ),
					'permission_callback' => function () {
						return current_user_can( 'edit_posts' );
					},
					'args'                => array(
						'url' => array(
							'description'       => __( 'The Podcast RSS feed URL.', 'jetpack' ),
							'type'              => 'string',
							'required'          => 'true',
							'validate_callback' => function ( $param ) {
								return wp_http_validate_url( $param );
							},
						),
					),
				),
			)
		);
	}

	/**
	 * Retreives data needed to display a podcast player from RSS feed.
	 *
	 * @param WP_REST_Request $request The REST API request data.
	 * @return WP_REST_Response The REST API response.
	 */
	public function get_player_data( $request ) {
		if ( ! class_exists( 'Jetpack_Podcast_Helper' ) ) {
			jetpack_require_lib( 'class-jetpack-podcast-helper' );
		}

		$player_data = Jetpack_Podcast_Helper::get_player_data( $request['url'] );
		// $player_data can be the actual data or WP_Error.
		// rest_ensure_response handles both.
		return rest_ensure_response( $player_data );
	}
}
wpcom_rest_api_v2_load_plugin( 'WPCOM_REST_API_V2_Endpoint_Podcast_Player' );
