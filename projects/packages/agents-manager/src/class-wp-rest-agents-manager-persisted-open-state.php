<?php
/**
 * WP_REST_Agents_Manager_Persisted_Open_State file.
 *
 * @package automattic/jetpack-agents-manager
 */

namespace Automattic\Jetpack\Agents_Manager;

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
	 * Delegates to Open_State_Store, which fetches the dedicated
	 * wpcom/v2/agents-manager/state endpoint and refreshes the local cache.
	 */
	public function get_state() {
		$state = Open_State_Store::fetch();

		if ( is_wp_error( $state ) ) {
			return $state;
		}

		return rest_ensure_response( $state );
	}

	/**
	 * Set Agents Manager state in user preferences.
	 *
	 * Delegates to Open_State_Store, which updates the dedicated
	 * wpcom/v2/agents-manager/state endpoint and refreshes the local cache.
	 *
	 * @param \WP_REST_Request $request The request sent to the API.
	 */
	public function set_state( \WP_REST_Request $request ) {
		$state = array();

		foreach ( array_keys( Open_State_Store::DEFAULTS ) as $key ) {
			if ( $request->has_param( $key ) ) {
				$state[ $key ] = $request[ $key ];
			}
		}

		$result = Open_State_Store::update( $state );

		if ( is_wp_error( $result ) ) {
			return $result;
		}

		return rest_ensure_response( $result );
	}
}
