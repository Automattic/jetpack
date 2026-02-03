<?php
/**
 * WP_REST_Agents_Manager_Persisted_Open_State file.
 *
 * @package automattic/jetpack-mu-wpcom
 */

namespace A8C\FSE;

use Automattic\Jetpack\Connection\Client;

/**
 * Class WP_REST_Agents_Manager_Persisted_Open_State.
 */
class WP_REST_Agents_Manager_Persisted_Open_State extends \WP_REST_Controller {

	/**
	 * WP_REST_Agents_Manager_Persisted_Open_State constructor.
	 */
	public function __construct() {
		$this->namespace = 'agents-manager';
		$this->rest_base = '/open-state';
	}

	/**
	 * Register available routes.
	 */
	public function register_rest_route() {
		register_rest_route(
			$this->namespace,
			$this->rest_base,
			array(
				// Get the open state.
				array(
					'methods'             => \WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_state' ),
					'permission_callback' => 'is_user_logged_in',
				),
				// Set the open state
				array(
					'methods'             => \WP_REST_Server::EDITABLE,
					'callback'            => array( $this, 'set_state' ),
					'permission_callback' => 'is_user_logged_in',
				),
			)
		);
	}

	/**
	 * Get Agents Manager state from user preferences.
	 *
	 * Uses the dedicated /wpcom/v2/agents-manager/state endpoint
	 * which only exposes the specific preferences needed.
	 */
	public function get_state() {
		$body = Client::wpcom_json_api_request_as_user(
			'/wpcom/v2/agents-manager/state',
			'2',
			array( 'method' => 'GET' )
		);

		if ( is_wp_error( $body ) ) {
			return $body;
		}

		$response = json_decode( wp_remote_retrieve_body( $body ) );

		if ( ! $response || ! isset( $response->calypso_preferences ) ) {
			return rest_ensure_response(
				array(
					'calypso_preferences' => array(
						'agents_manager_open'              => false,
						'agents_manager_docked'            => false,
						'agents_manager_floating_position' => 'right',
						'agents_manager_router_history'    => null,
					),
				)
			);
		}

		$calypso_preferences = $response->calypso_preferences;

		$projected_response = array(
			'calypso_preferences' => array(
				'agents_manager_open'              => (bool) ( $calypso_preferences->agents_manager_open ?? false ),
				'agents_manager_docked'            => (bool) ( $calypso_preferences->agents_manager_docked ?? false ),
				'agents_manager_floating_position' => $calypso_preferences->agents_manager_floating_position ?? 'right',
				'agents_manager_router_history'    => $calypso_preferences->agents_manager_router_history ?? null,
			),
		);

		return rest_ensure_response( $projected_response );
	}

	/**
	 * Set Agents Manager state in user preferences.
	 *
	 * Uses the dedicated /wpcom/v2/agents-manager/state endpoint
	 * which only allows updating the specific preferences needed.
	 *
	 * @param \WP_REST_Request $request The request sent to the API.
	 */
	public function set_state( \WP_REST_Request $request ) {
		$data = array(
			'calypso_preferences' => array(),
		);

		if ( $request->has_param( 'agents_manager_open' ) ) {
			$data['calypso_preferences']['agents_manager_open'] = $request['agents_manager_open'];
		}

		if ( $request->has_param( 'agents_manager_router_history' ) ) {
			$data['calypso_preferences']['agents_manager_router_history'] = $request['agents_manager_router_history'];
		}

		if ( $request->has_param( 'agents_manager_docked' ) ) {
			$data['calypso_preferences']['agents_manager_docked'] = $request['agents_manager_docked'];
		}

		if ( $request->has_param( 'agents_manager_floating_position' ) ) {
			$data['calypso_preferences']['agents_manager_floating_position'] = $request['agents_manager_floating_position'];
		}

		$body = Client::wpcom_json_api_request_as_user(
			'/wpcom/v2/agents-manager/state',
			'2',
			array( 'method' => 'POST' ),
			$data
		);

		if ( is_wp_error( $body ) ) {
			return $body;
		}

		$response = json_decode( wp_remote_retrieve_body( $body ) );

		if ( ! $response || ! isset( $response->calypso_preferences ) ) {
			return new \WP_Error(
				'invalid_response',
				'Invalid response from WPCOM endpoint',
				array( 'status' => 500 )
			);
		}

		$calypso_preferences = $response->calypso_preferences;

		$projected_response = array(
			'calypso_preferences' => array(
				'agents_manager_open'              => (bool) ( $calypso_preferences->agents_manager_open ?? false ),
				'agents_manager_docked'            => (bool) ( $calypso_preferences->agents_manager_docked ?? false ),
				'agents_manager_floating_position' => $calypso_preferences->agents_manager_floating_position ?? 'right',
				'agents_manager_router_history'    => $calypso_preferences->agents_manager_router_history ?? null,
			),
		);

		return rest_ensure_response( $projected_response );
	}
}
