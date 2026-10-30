<?php
/**
 * REST route for writing the records at Cloudflare.
 *
 * @package automattic/jetpack-send
 */

namespace Automattic\Jetpack\Send;

use WP_Error;
use WP_REST_Request;
use WP_REST_Server;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * `POST jetpack-send/v1/cloudflare/apply`; requires `manage_options`.
 */
class Cloudflare_REST_Controller {

	/**
	 * Register the route.
	 *
	 * @return void
	 */
	public static function register_routes() {
		register_rest_route(
			REST_Controller::API_NAMESPACE,
			'/cloudflare/apply',
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => array( __CLASS__, 'apply' ),
				'permission_callback' => array( REST_Controller::class, 'can_manage' ),
				'args'                => array(
					'token' => array(
						'type'     => 'string',
						'required' => true,
					),
				),
			)
		);
	}

	/**
	 * POST /cloudflare/apply: write the stored account's records with the given token.
	 *
	 * Domain and records come from the stored account, never the request. Responds
	 * `{success, records, status}` (status is REST_Controller::status_data()).
	 *
	 * @param WP_REST_Request $request Request with `token`.
	 * @return \WP_REST_Response|WP_Error `jetpack_send_not_set_up` (400) without an account,
	 *                                    `jetpack_send_cloudflare_unavailable` (400) when turned off, or Cloudflare_Dns::apply() errors.
	 */
	public static function apply( WP_REST_Request $request ) {
		// Read the token from the body only; a query string would land in server logs.
		$params = $request->get_json_params();
		if ( ! is_array( $params ) || ! isset( $params['token'] ) ) {
			$params = $request->get_body_params();
		}
		$token = is_array( $params ) && isset( $params['token'] ) && is_string( $params['token'] ) ? $params['token'] : '';
		// Drop the token from the parsed params, the raw body and $_POST, so later hooks can't read it.
		unset( $request['token'] );
		$request->set_body( '' );
		unset( $_POST['token'] ); // phpcs:ignore WordPress.Security.NonceVerification.Missing -- Removing, not reading; REST checks the nonce.

		$account = Account::get();
		if ( ! $account ) {
			return new WP_Error( 'jetpack_send_not_set_up', __( 'Set up Send first.', 'jetpack-send-pkg' ), array( 'status' => 400 ) );
		}

		$dns_host = isset( $account[ Dns_Host::ACCOUNT_KEY ] ) && is_array( $account[ Dns_Host::ACCOUNT_KEY ] ) ? $account[ Dns_Host::ACCOUNT_KEY ] : array();
		if ( ! Cloudflare_Dns::is_allowed( $dns_host ) ) {
			return new WP_Error( 'jetpack_send_cloudflare_unavailable', __( 'Adding records for you isn’t available for this domain. Add them yourself instead.', 'jetpack-send-pkg' ), array( 'status' => 400 ) );
		}

		$result = Cloudflare_Dns::apply( $token, (string) $account['domain'], (array) ( $account['dns_records'] ?? array() ) );
		unset( $token );
		if ( is_wp_error( $result ) ) {
			return $result;
		}

		// Ask the mail service to look again; inside its throttle window this answers from the last check.
		$changed = array_intersect( array( 'created', 'updated' ), array_column( $result['records'], 'action' ) );
		if ( array() !== $changed ) {
			REST_Controller::check_dns();
		}

		return rest_ensure_response(
			array(
				'success' => $result['success'],
				'records' => $result['records'],
				'status'  => REST_Controller::status_data(),
			)
		);
	}
}
