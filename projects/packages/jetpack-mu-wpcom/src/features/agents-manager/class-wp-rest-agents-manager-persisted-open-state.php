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
	 * Get chat_id and last_chat_id from user preferences.
	 */
	public function get_state() {
		// Forward the request body to the support chat endpoint.
		$body = Client::wpcom_json_api_request_as_user(
			'/me/preferences',
			'2',
			array( 'method' => 'GET' )
		);

		if ( is_wp_error( $body ) ) {
			return $body;
		}

		$response = json_decode( wp_remote_retrieve_body( $body ) );

		$calypso_preferences = $response->calypso_preferences ?? (object) array();

		$is_open           = $calypso_preferences->agents_manager_open ?? false;
		$is_docked         = $calypso_preferences->agents_manager_docked ?? false;
		$floating_position = $calypso_preferences->agents_manager_floating_position ?? 'right';
		$router_history    = $calypso_preferences->agents_manager_router_history ?? null;

		$projected_response = array(
			'calypso_preferences' => array(
				'agents_manager_open'              => (bool) $is_open,
				'agents_manager_docked'            => (bool) $is_docked,
				'agents_manager_floating_position' => $floating_position,
				'agents_manager_router_history'    => $router_history,
			),
		);

		return rest_ensure_response( $projected_response );
	}

	/**
	 * Set chat_id or last_chat_id from user preferences.
	 *
	 * @param \WP_REST_Request $request The request sent to the API.
	 */
	public function set_state( \WP_REST_Request $request ) {
		$state             = $request['agents_manager_open'];
		$router_history    = $request['agents_manager_router_history'];
		$docked            = $request['agents_manager_docked'];
		$floating_position = $request['agents_manager_floating_position'];

		$data = array(
			'calypso_preferences' => array(),
		);

		if ( $request->has_param( 'agents_manager_open' ) ) {
			$data['calypso_preferences']['agents_manager_open'] = $state;
		}

		if ( $request->has_param( 'agents_manager_router_history' ) ) {
			$data['calypso_preferences']['agents_manager_router_history'] = $router_history;
		}

		if ( $request->has_param( 'agents_manager_docked' ) ) {
			$data['calypso_preferences']['agents_manager_docked'] = $docked;
		}

		if ( $request->has_param( 'agents_manager_floating_position' ) ) {
			$data['calypso_preferences']['agents_manager_floating_position'] = $floating_position;
		}

		$body = Client::wpcom_json_api_request_as_user(
			'/me/preferences',
			'2',
			array( 'method' => 'POST' ),
			$data
		);

		if ( is_wp_error( $body ) ) {
			return $body;
		}

		$response = json_decode( wp_remote_retrieve_body( $body ) );

		$is_open           = $response->calypso_preferences->agents_manager_open ?? false;
		$is_docked         = $response->calypso_preferences->agents_manager_docked ?? false;
		$floating_position = $response->calypso_preferences->agents_manager_floating_position ?? 'right';
		$router_history    = $response->calypso_preferences->agents_manager_router_history ?? null;

		$projected_response = array(
			'calypso_preferences' => array(
				'agents_manager_open'              => (bool) $is_open,
				'agents_manager_docked'            => (bool) $is_docked,
				'agents_manager_floating_position' => $floating_position,
				'agents_manager_router_history'    => $router_history,
			),
		);

		return rest_ensure_response( $projected_response );
	}
}
