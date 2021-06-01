<?php
/**
 * Jetpack REST API token endpoints.
 *
 * @package automattic/jetpack-connection
 */

namespace Automattic\Jetpack\Connection\REST_Endpoints;

use Automattic\Jetpack\Connection\Manager;
use Automattic\Jetpack\Connection\Rest_Authentication;
use Automattic\Jetpack\Connection\REST_Connector;
use Automattic\Jetpack\Connection\Tokens;
use WP_Error;
use WP_REST_Server;

/**
 * Jetpack REST API token endpoints.
 *
 * @package Automattic\Jetpack\Core_API
 */
class Token_Endpoints {

	/**
	 * Registering endpoints.
	 */
	public function register_endpoints() {
		register_rest_route(
			'jetpack/v4',
			'/user-token',
			array(
				array(
					'methods'             => WP_REST_Server::EDITABLE,
					'callback'            => array( static::class, 'update_user_token' ),
					'permission_callback' => array( static::class, 'update_user_token_permission_check' ),
					'args'                => array(
						'user_token'          => array(
							'description' => __( 'New user token', 'jetpack' ),
							'type'        => 'string',
							'required'    => true,
						),
						'is_connection_owner' => array(
							'description' => __( 'Is connection owner', 'jetpack' ),
							'type'        => 'boolean',
						),
					),
				),
			)
		);
	}

	/**
	 * The endpoint tried to partially or fully reconnect the website to WP.com.
	 *
	 * @since 9.9.0
	 *
	 * @param \WP_REST_Request $request The request sent to the WP REST API.
	 *
	 * @return \WP_REST_Response|WP_Error
	 */
	public static function update_user_token( $request ) {
		$token_parts = explode( '.', $request['user_token'] );

		if ( count( $token_parts ) !== 3 || ! (int) $token_parts[2] || ! ctype_digit( $token_parts[2] ) ) {
			return new WP_Error( 'invalid_argument_user_token', esc_html__( 'Invalid user token is provided', 'jetpack' ) );
		}

		$connection = new Manager();

		if ( ! $connection->is_connected() ) {
			return new WP_Error( 'site_not_connected', esc_html__( 'Site is not connected', 'jetpack' ) );
		}

		$is_connection_owner = isset( $request['is_connection_owner'] )
			? (bool) $request['is_connection_owner']
			: ( new Manager() )->get_connection_owner_id() === (int) $token_parts[2];

		( new Tokens() )->update_user_token( $token_parts[2], $request['user_token'], $is_connection_owner );

		return rest_ensure_response(
			array(
				'success' => true,
			)
		);
	}

	/**
	 * Verify that the API client is allowed to replace user token.
	 *
	 * @since 9.9.0
	 *
	 * @return bool|WP_Error.
	 */
	public static function update_user_token_permission_check() {
		return Rest_Authentication::is_signed_with_blog_token()
			? true
			: new WP_Error( 'invalid_permission_update_user_token', REST_Connector::get_user_permissions_error_msg(), array( 'status' => rest_authorization_required_code() ) );
	}

}
