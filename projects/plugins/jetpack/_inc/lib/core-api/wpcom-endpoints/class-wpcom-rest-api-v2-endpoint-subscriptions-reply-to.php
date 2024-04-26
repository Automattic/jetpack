<?php
/**
 * REST API endpoint for the Newsletter Categories
 *
 * @package automattic/jetpack
 * @since 12.6
 */

use Automattic\Jetpack\Status\Host;

require_once __DIR__ . '/trait-wpcom-rest-api-proxy-request-trait.php';

/**
 * Class WPCOM_REST_API_V2_Endpoint_Following
 */
class WPCOM_REST_API_V2_Endpoint_Subscriptions_Reply_To extends WP_REST_Controller {
	use WPCOM_REST_API_Proxy_Request_Trait;

	/**
	 * Constructor.
	 */
	public function __construct() {
		$this->wpcom_is_wpcom_only_endpoint    = true;
		$this->wpcom_is_site_specific_endpoint = true;
		$this->base_api_path                   = 'wpcom';
		$this->version                         = 'v2';
		$this->namespace                       = $this->base_api_path . '/' . $this->version;
		$this->rest_base                       = '/newsletter/reply-to';
		$this->wpcom_is_wpcom_only_endpoint    = true;
		$this->wpcom_is_site_specific_endpoint = true;

		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	/**
	 * Register routes.
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			$this->rest_base,
			array(
				'show_in_index'       => true,
				'methods'             => WP_REST_Server::READABLE,
				// if this is not a wpcom site, we need to proxy the request to wpcom
				'callback'            => ( ( new Host() )->is_wpcom_simple() ) ? array( $this, 'get_reply_to_status' ) : array( $this, 'proxy_request_to_wpcom_as_user' ),
				'permission_callback' => array( $this, 'permissions' ),
			)
		);

		register_rest_route(
			$this->namespace,
			$this->rest_base,
			array(
				'show_in_index'       => true,
				'methods'             => WP_REST_Server::CREATABLE,
				// if this is not a wpcom site, we need to proxy the request to wpcom
				'callback'            => ( ( new Host() )->is_wpcom_simple() ) ? array( $this, 'resend_verification' ) : array( $this, 'proxy_request_to_wpcom_as_user' ),
				'permission_callback' => array( $this, 'permissions' ),
			)
		);
	}
	/**
	 * Permission check for the endpoints.
	 *
	 * @return bool
	 */
	public function permissions() {
		return current_user_can( 'manage_options' );
	}

	/**
	 * Get the state of the reply-to setting.
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 *
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function get_reply_to_status( $request ) {
		return rest_ensure_response(
			array(
				'status' => apply_filters( 'jetpack_subscriptions_reply_to_status', 'not_set', $request ),
			)
		);
	}
	/**
	 * Resend the verification email.
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 *
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function resend_verification( $request ) {
		return rest_ensure_response(
			array(
				'resend' => apply_filters( 'jetpack_subscriptions_reply_to_status_resend', false, $request ),
			)
		);
	}
}

wpcom_rest_api_v2_load_plugin( 'WPCOM_REST_API_V2_Endpoint_Subscriptions_Reply_To' );
