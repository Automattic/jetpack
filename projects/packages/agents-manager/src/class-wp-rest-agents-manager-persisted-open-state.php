<?php
/**
 * WP_REST_Agents_Manager_Persisted_Open_State file.
 *
 * @package automattic/jetpack-agents-manager
 */

namespace Automattic\Jetpack\Agents_Manager;

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
	 * Default state values.
	 */
	private const DEFAULTS = array(
		'agents_manager_open'              => false,
		'agents_manager_docked'            => false,
		'agents_manager_floating_position' => 'right',
		'agents_manager_router_history'    => null,
	);

	/**
	 * Get Agents Manager state from user preferences.
	 *
	 * Uses the dedicated wpcom/v2/agents-manager/state endpoint
	 * which only exposes the specific preferences needed.
	 */
	public function get_state() {
		$body = Client::wpcom_json_api_request_as_user(
			'/agents-manager/state',
			'2',
			array( 'method' => 'GET' )
		);

		if ( is_wp_error( $body ) ) {
			return $body;
		}

		$response = json_decode( wp_remote_retrieve_body( $body ), true );

		if ( ! is_array( $response ) ) {
			return rest_ensure_response( self::DEFAULTS );
		}

		return rest_ensure_response(
			array(
				'agents_manager_open'              => (bool) ( $response['agents_manager_open'] ?? self::DEFAULTS['agents_manager_open'] ),
				'agents_manager_docked'            => (bool) ( $response['agents_manager_docked'] ?? self::DEFAULTS['agents_manager_docked'] ),
				'agents_manager_floating_position' => $response['agents_manager_floating_position'] ?? self::DEFAULTS['agents_manager_floating_position'],
				'agents_manager_router_history'    => $response['agents_manager_router_history'] ?? self::DEFAULTS['agents_manager_router_history'],
			)
		);
	}

	/**
	 * Set Agents Manager state in user preferences.
	 *
	 * Uses the dedicated wpcom/v2/agents-manager/state endpoint
	 * which only allows updating the specific preferences needed.
	 *
	 * @param \WP_REST_Request $request The request sent to the API.
	 */
	public function set_state( \WP_REST_Request $request ) {
		$state = array();

		foreach ( array_keys( self::DEFAULTS ) as $key ) {
			if ( $request->has_param( $key ) ) {
				$state[ $key ] = $request[ $key ];
			}
		}

		$body = Client::wpcom_json_api_request_as_user(
			'/agents-manager/state',
			'2',
			array( 'method' => 'POST' ),
			array( 'state' => $state )
		);

		if ( is_wp_error( $body ) ) {
			return $body;
		}

		$response = json_decode( wp_remote_retrieve_body( $body ), true );

		if ( ! is_array( $response ) ) {
			return new \WP_Error(
				'invalid_response',
				'Invalid response from WPCOM endpoint',
				array( 'status' => 500 )
			);
		}

		return rest_ensure_response(
			array(
				'agents_manager_open'              => (bool) ( $response['agents_manager_open'] ?? self::DEFAULTS['agents_manager_open'] ),
				'agents_manager_docked'            => (bool) ( $response['agents_manager_docked'] ?? self::DEFAULTS['agents_manager_docked'] ),
				'agents_manager_floating_position' => $response['agents_manager_floating_position'] ?? self::DEFAULTS['agents_manager_floating_position'],
				'agents_manager_router_history'    => $response['agents_manager_router_history'] ?? self::DEFAULTS['agents_manager_router_history'],
			)
		);
	}
}
