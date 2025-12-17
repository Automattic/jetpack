<?php
/**
 * REST API endpoint to fetch compact sites list from WordPress.com
 *
 * @package automattic/jetpack
 * @since 15.4
 */

use Automattic\Jetpack\Connection\Client;

/**
 * Endpoint to fetch compact sites list from WordPress.com
 *
 * @since 14.1
 */
class WPCOM_REST_API_V2_Endpoint_Sites_Compact extends WP_REST_Controller {

	/**
	 * Constructor.
	 */
	public function __construct() {
		$this->namespace = 'wpcom/v2';
		$this->rest_base = 'sites/compact';
		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	/**
	 * Register the route.
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base,
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_sites' ),
					'permission_callback' => array( $this, 'permission_check' ),
				),
			)
		);
	}

	/**
	 * Fetch compact sites list from WordPress.com API
	 *
	 * @return array|WP_Error
	 */
	public function get_sites() {
		$response = Client::wpcom_json_api_request_as_user(
			'/me/sites/compact',
			'v1.1',
			array( 'method' => 'GET' ),
			null,
			'rest'
		);

		if ( is_wp_error( $response ) ) {
			return new WP_Error(
				'sites_compact_error',
				__( 'Failed to fetch sites from WordPress.com', 'jetpack' ),
				array( 'status' => 500 )
			);
		}

		$response_code = wp_remote_retrieve_response_code( $response );
		if ( 200 !== $response_code ) {
			return new WP_Error(
				'sites_compact_error',
				__( 'Failed to fetch sites from WordPress.com', 'jetpack' ),
				array( 'status' => $response_code )
			);
		}

		$body = json_decode( wp_remote_retrieve_body( $response ), true );

		if ( ! isset( $body['sites'] ) ) {
			return new WP_Error(
				'sites_compact_invalid_response',
				__( 'Invalid response from WordPress.com API', 'jetpack' ),
				array( 'status' => 500 )
			);
		}

		return rest_ensure_response( $body );
	}

	/**
	 * Check if the user is logged in.
	 *
	 * @return bool
	 */
	public function permission_check() {
		return is_user_logged_in();
	}
}

wpcom_rest_api_v2_load_plugin( 'WPCOM_REST_API_V2_Endpoint_Sites_Compact' );
