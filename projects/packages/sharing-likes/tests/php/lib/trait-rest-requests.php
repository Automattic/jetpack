<?php
/**
 * Dispatches requests to the Sharing & Likes REST routes.
 *
 * @package automattic/jetpack-sharing-likes
 */

declare( strict_types = 1 );

namespace Automattic\Jetpack\Sharing_Likes\REST;

use RuntimeException;
use WorDBless\Users as WorDBless_Users;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;

/**
 * Registers the routes on a fresh server, the way `rest_api_init` does in a request.
 */
trait REST_Requests {

	/**
	 * Register the routes on a fresh server.
	 */
	protected function set_up_rest(): void {
		global $wp_rest_server;
		$wp_rest_server = new WP_REST_Server();

		Endpoints::init();
		do_action( 'rest_api_init', $wp_rest_server );
	}

	/**
	 * Drop the server, the routes' hook and the users.
	 */
	protected function tear_down_rest(): void {
		global $wp_rest_server;
		$wp_rest_server = null;

		remove_all_actions( 'rest_api_init' );
		wp_set_current_user( 0 );
		WorDBless_Users::init()->clear_all_users();
	}

	/**
	 * Log in as a new user with the given role.
	 *
	 * @param string $role Role name.
	 * @throws RuntimeException If the user cannot be created.
	 */
	protected function log_in_as( string $role ): void {
		$user_id = wp_insert_user(
			array(
				'user_login' => 'sharing_rest_' . $role,
				'user_pass'  => 'password',
				'user_email' => $role . '@example.com',
				'role'       => $role,
			)
		);

		if ( ! is_int( $user_id ) ) {
			throw new RuntimeException( 'Could not create the test user.' );
		}

		wp_set_current_user( $user_id );
	}

	/**
	 * Send a request with a JSON body.
	 *
	 * @param string              $method HTTP method.
	 * @param string              $route  Route under `wpcom/v2/sharing-likes/`.
	 * @param array<string,mixed> $body   Request body.
	 */
	protected function request( string $method, string $route, array $body = array() ): WP_REST_Response {
		$request = new WP_REST_Request( $method, '/' . Endpoints::NAMESPACE . '/' . Endpoints::BASE . '/' . $route );

		if ( $body ) {
			$request->set_header( 'content-type', 'application/json' );
			$request->set_body( (string) wp_json_encode( $body, JSON_UNESCAPED_SLASHES ) );
		}

		return rest_do_request( $request );
	}
}
