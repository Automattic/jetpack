<?php
/**
 * Sets up the Zendesk Chat REST API endpoints.
 *
 * @package automattic/my-jetpack
 */

namespace Automattic\Jetpack\My_Jetpack;

use Automattic\Jetpack\Connection\Client as Client;

/**
 * Registers the REST routes for Zendesk Chat.
 */
class REST_Zendesk_Chat {
	const TRANSIENT_EXPIRY   = 1 * MINUTE_IN_SECONDS * 60 * 24 * 7; // 1 week (JWT is actually 2 weeks, but lets be on the safe side)
	const ZENDESK_AUTH_TOKEN = 'zendesk_auth_token';
	/**
	 * Constructor.
	 */
	public function __construct() {
		register_rest_route(
			'my-jetpack/v1',
			'chat/availability',
			array(
				'methods'             => \WP_REST_Server::READABLE,
				'callback'            => __CLASS__ . '::get_chat_availability',
				'permission_callback' => __CLASS__ . '::chat_authentication_permissions_callback',
			)
		);

		register_rest_route(
			'my-jetpack/v1',
			'chat/authentication',
			array(
				'methods'             => \WP_REST_Server::READABLE,
				'callback'            => __CLASS__ . '::get_chat_authentication',
				'args'                => array(
					'type'      => array(
						'required' => false,
						'type'     => 'string',
					),
					'test_mode' => array(
						'required' => false,
						'type'     => 'boolean',
					),
				),
				'permission_callback' => __CLASS__ . '::chat_authentication_permissions_callback',
			)
		);
	}

	/**
	 * Ensure user is logged in if making an authentication request
	 *
	 * @access public
	 * @static
	 *
	 * @return \WP_Error|true
	 */
	public static function chat_authentication_permissions_callback() {
		if ( ! get_current_user_id() ) {
			return new \WP_Error( 'unauthorized', 'You must be logged in to access this resource.', array( 'status' => 401 ) );
		}

		return true;
	}

	/**
	 * Gets the chat authentication token.
	 *
	 * @return \WP_Error|object Object: { token: string }
	 */
	public static function get_chat_authentication() {
		$authentication = get_transient( self::ZENDESK_AUTH_TOKEN );
		if ( $authentication ) {
			return rest_ensure_response( $authentication, 200 );
		}

		$proxied           = function_exists( 'wpcom_is_proxied_request' ) ? wpcom_is_proxied_request() : false;
		$wpcom_endpoint    = 'help/authenticate/chat';
		$wpcom_api_version = '2';

		$body = array(
			'type'      => 'zendesk',
			'test_mode' => $proxied ? true : false,
		);

		$response      = Client::wpcom_json_api_request_as_user( $wpcom_endpoint, $wpcom_api_version, array( 'method' => 'POST' ), $body );
		$response_code = wp_remote_retrieve_response_code( $response );
		$body          = json_decode( wp_remote_retrieve_body( $response ) );

		if ( is_wp_error( $response ) || empty( $response['body'] ) ) {
			return new \WP_Error( 'chat_authentication_failed', 'Chat authentication failed', array( 'status' => $response_code ) );
		}

		set_transient( self::ZENDESK_AUTH_TOKEN, $body, self::TRANSIENT_EXPIRY );
		return rest_ensure_response( $body, 200 );
	}

	/**
	 * Calls `wpcom/v2/presales/chat?group=jp_presales` endpoint.
	 * This endpoint returns whether or not the Jetpack presales chat group is available
	 *
	 * @return \WP_Error/object Object: { is_available: bool }
	 */
	public static function get_chat_availability() {
		$wpcom_endpoint    = '/presales/chat?group=jp_presales';
		$wpcom_api_version = '2';
		$response          = Client::wpcom_json_api_request_as_user( $wpcom_endpoint, $wpcom_api_version );
		$response_code     = wp_remote_retrieve_response_code( $response );
		$body              = json_decode( wp_remote_retrieve_body( $response ) );

		if ( is_wp_error( $response ) || empty( $response['body'] ) ) {
			return new \WP_Error( 'chat_config_data_fetch_failed', 'Chat config data fetch failed', array( 'status' => $response_code ) );
		}

		return rest_ensure_response( $body, 200 );
	}
}
