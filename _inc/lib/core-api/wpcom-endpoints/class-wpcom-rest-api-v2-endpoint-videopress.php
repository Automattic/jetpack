<?php
/**
 * REST API endpoint for managing VideoPress metadata.
 *
 * @package Jetpack
 * @since 9.2.0
 */

use Automattic\Jetpack\Connection\Client;

/**
 * VideoPress wpcom api v2 endpoint
 */
class WPCOM_REST_API_V2_Endpoint_VideoPress extends WP_REST_Controller {
	/**
	 * Constructor.
	 */
	public function __construct() {
		$this->namespace = 'wpcom/v2';
		$this->rest_base = 'videopress';

		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	/**
	 * Register the route.
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			$this->rest_base . '/meta',
			array(
				'args'                => array(
					'guid'          => array(
						'description' => __( 'The VideoPress video guid.', 'jetpack' ),
						'type'        => 'string',
						'required'    => true,
					),
					'title'         => array(
						'description' => __( 'The title of the video.', 'jetpack' ),
						'type'        => 'string',
						'required'    => false,
					),
					'description'   => array(
						'description' => __( 'The description of the video.', 'jetpack' ),
						'type'        => 'string',
						'required'    => false,
					),
					'rating'        => array(
						'description' => __( 'The video content rating. One of G, PG-13, R-17 or X-18', 'jetpack' ),
						'type'        => 'string',
						'required'    => false,
					),
					'display_embed' => array(
						'description' => __( 'Display the share menu in the player.', 'jetpack' ),
						'type'        => 'boolean',
						'required'    => false,
					),
				),
				'methods'             => WP_REST_Server::EDITABLE,
				'callback'            => array( $this, 'videopress_block_update_meta' ),
				'permission_callback' => function () {
					return current_user_can( 'edit_posts' );
				},
			)
		);
	}

	/**
	 * Updates video metadata via the WPCOM REST API.
	 *
	 * @param WP_REST_Request $request the request object.
	 * @return bool If the request was successful
	 */
	public function videopress_block_update_meta( $request ) {
		$json_params = $request->get_json_params();
		if ( ! isset( $json_params ) || ! isset( $json_params['guid'] ) ) {
			return false;
		}

		$endpoint = 'videos';
		$args     = array(
			'method'  => 'POST',
			'headers' => array( 'content-type' => 'application/json' ),
		);

		$result = Client::wpcom_json_api_request_as_blog(
			$endpoint,
			'2',
			$args,
			wp_json_encode( $json_params ),
			'wpcom'
		);

		if ( is_wp_error( $result ) ) {
			return false;
		}

		return 200 === $result['response']['code'];
	}
}

wpcom_rest_api_v2_load_plugin( 'WPCOM_REST_API_V2_Endpoint_VideoPress' );
