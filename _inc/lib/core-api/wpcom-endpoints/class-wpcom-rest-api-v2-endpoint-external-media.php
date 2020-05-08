<?php
/**
 * REST API endpoint for the External Media connections.
 *
 * @package Jetpack
 * @since 8.5.0
 */

use Automattic\Jetpack\Connection\Client;

/**
 * External Medie connections helper API.
 *
 * @since 8.5
 */
class WPCOM_REST_API_V2_Endpoint_External_Media extends WP_REST_Controller {
	/**
	 * Constructor.
	 */
	public function __construct() {
		$this->namespace = 'wpcom/v2';
		$this->rest_base = 'external-media';
		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	/**
	 * Register the route.
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			$this->rest_base . '/list/(?P<service>google_photos|pexels)',
			array(
				'methods'  => WP_REST_Server::READABLE,
				'callback' => array( $this, 'get_external_media' ),
				'permission_callback' => 'is_user_logged_in',
			)
		);
	}

	public function get_external_media( \WP_REST_Request $request ) {
		$params = $request->get_params();
		$wpcom_path = sprintf( '/meta/external-media/%s', urlencode( $params['service'] ) );
		$response = Client::wpcom_json_api_request_as_user( $wpcom_path );
		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$body = wp_remote_retrieve_body( $response );
		return json_decode( $body );
	}
}

wpcom_rest_api_v2_load_plugin( 'WPCOM_REST_API_V2_Endpoint_External_Media' );
