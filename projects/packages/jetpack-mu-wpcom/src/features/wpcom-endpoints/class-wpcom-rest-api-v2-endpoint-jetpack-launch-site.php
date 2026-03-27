<?php
/**
 * Launch Site REST API endpoint.
 *
 * Used by Atomic sites (where WPCOM APIs are not directly accessible) to launch
 * the site by proxying the request to WPCOM via the Jetpack Connection.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Connection\Client;

/**
 * Launches the site by proxying to the WPCOM REST API.
 */
class WPCOM_REST_API_V2_Endpoint_Jetpack_Launch_Site extends WP_REST_Controller {

	/**
	 * Class constructor.
	 */
	public function __construct() {
		$this->namespace = 'wpcom/v2';
		$this->rest_base = 'launch-site';

		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	/**
	 * Register our routes.
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			$this->rest_base,
			array(
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'launch_site' ),
					'permission_callback' => array( $this, 'can_access' ),
				),
			)
		);
	}

	/**
	 * Permission callback: only admins may launch the site.
	 *
	 * @return bool
	 */
	public function can_access() {
		return current_user_can( 'manage_options' );
	}

	/**
	 * Proxies a launch request to the WPCOM REST API.
	 *
	 * @return WP_REST_Response|WP_Error
	 */
	public function launch_site() {
		$blog_id  = \Jetpack_Options::get_option( 'id' );
		$response = Client::wpcom_json_api_request_as_user(
			'/sites/' . rawurlencode( $blog_id ) . '/launch',
			'v2',
			array(
				'method'  => 'POST',
				'headers' => array(
					'content-type' => 'application/json',
				),
			),
			null,
			'wpcom'
		);

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$body        = wp_remote_retrieve_body( $response );
		$status_code = wp_remote_retrieve_response_code( $response );
		$data        = json_decode( $body );

		return new WP_REST_Response( $data, $status_code );
	}
}

wpcom_rest_api_v2_load_plugin( 'WPCOM_REST_API_V2_Endpoint_Jetpack_Launch_Site' );
