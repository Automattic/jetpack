<?php
/**
 * The Publicize Keyring Result Controller class.
 *
 * @package automattic/jetpack-publicize
 */

namespace Automattic\Jetpack\Publicize\REST_API;

use Automattic\Jetpack\Connection\Traits\WPCOM_REST_API_Proxy_Request;
use Automattic\Jetpack\Publicize\Publicize_Utils;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Keyring Result Controller.
 *
 * Returns the verified keyring connection item for a just-completed connect request
 * (auth_flow=v2). The connect popup no longer posts the result back through
 * window.opener; instead the same-origin completion page broadcasts the request_id and the
 * client fetches the result here once.
 *
 * @phan-constructor-used-for-side-effects
 */
class Keyring_Result_Controller extends Base_Controller {

	use WPCOM_REST_API_Proxy_Request;

	/**
	 * Constructor.
	 */
	public function __construct() {
		parent::__construct();

		$this->base_api_path = 'wpcom';
		$this->version       = 'v2';

		$this->namespace = "{$this->base_api_path}/{$this->version}";
		$this->rest_base = 'publicize/keyring-result';

		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	/**
	 * Register the routes.
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base,
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_keyring_result' ),
					'permission_callback' => array( $this, 'get_keyring_result_permissions_check' ),
					'args'                => array(
						'request_id' => array(
							'type'        => 'string',
							'required'    => true,
							'description' => __( 'ID of the connect request.', 'jetpack-publicize-pkg' ),
						),
					),
				),
			)
		);
	}

	/**
	 * Verify that the request has access to the keyring result.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return true|\WP_Error
	 */
	public function get_keyring_result_permissions_check( $request ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		return $this->publicize_permissions_check() && (bool) get_current_user_id();
	}

	/**
	 * Get the keyring result for a completed connect request.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 *
	 * @return WP_REST_Response The response object: { code, data }.
	 */
	public function get_keyring_result( $request ) {
		if ( ! Publicize_Utils::is_wpcom() ) {
			return rest_ensure_response( $this->proxy_request_to_wpcom_as_user( $request ) );
		}

		$response = array(
			'code' => 'unknown',
			'data' => null,
		);

		require_lib( 'external-connections' );

		$external_connections = \WPCOM_External_Connections::init();

		$request_id = $request->get_param( 'request_id' );

		// The transient is keyed by current user + request_id, so a hit already proves ownership.
		$data = $external_connections->get_last_keyring_token_details( $request_id );

		if ( ! $data ) {
			$response['code'] = 'no_data_found';
			return rest_ensure_response( $response );
		}

		$token_id = $data['token_id'] ?? null;

		if ( ! $token_id ) {
			$response['code'] = 'token_id_missing';
			return rest_ensure_response( $response );
		}

		// On reconnect of a broken connection, re-test so the cached failure is overwritten.
		$force_connection_test = $external_connections->has_failing_cached_connection_test( $token_id );

		$item = $external_connections->get_keyring_connection_item( $token_id, false, $force_connection_test );

		if ( ! $item ) {
			$response['code'] = 'token_not_found';
			return rest_ensure_response( $response );
		}

		$response['code'] = 'success';
		$response['data'] = $item;

		return rest_ensure_response( $response );
	}
}
