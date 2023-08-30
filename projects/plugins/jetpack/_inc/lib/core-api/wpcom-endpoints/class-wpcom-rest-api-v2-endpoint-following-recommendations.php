<?php
/**
 * REST API endpoint to retrieve following recommendations
 *
 * @package automattic/jetpack
 * @since $$next-version$$
 */

use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\Status\Visitor;

/**
 * Class WPCOM_REST_API_V2_Endpoint_Following_Recommendations
 */
class WPCOM_REST_API_V2_Endpoint_Following_Recommendations extends WP_REST_Controller {
	/**
	 * Namespace prefix.
	 *
	 * @var string
	 */
	public $namespace = 'wpcom/v2';

	/**
	 * Endpoint base route.
	 *
	 * @var string
	 */
	public $rest_base = 'following';

	/**
	 * Constructor.
	 */
	public function __construct() {
		$this->wpcom_is_wpcom_only_endpoint    = true;
		$this->wpcom_is_site_specific_endpoint = false;

		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	/**
	 * Register routes.
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			$this->rest_base . '/recommendations',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_response' ),
					'permission_callback' => 'is_user_logged_in',
				),
			)
		);
	}

	/**
	 * Gets the sites the user is following
	 *
	 * @return array|WP_Error list of followed sites, WP_Error otherwise
	 */
	public function get_response() {
		$body = Client::wpcom_json_api_request_as_user(
			'/me/following/recommendations',
			'2',
			array(
				'method'  => 'GET',
				'headers' => array(
					'Content-Type'    => 'application/json',
					'X-Forwarded-For' => ( new Visitor() )->get_ip( true ),
				),
			)
		);

		if ( is_wp_error( $body ) ) {
			return $body;
		}

		return json_decode( wp_remote_retrieve_body( $body ) );
	}

}

wpcom_rest_api_v2_load_plugin( 'WPCOM_REST_API_V2_Endpoint_Following_Recommendations' );
