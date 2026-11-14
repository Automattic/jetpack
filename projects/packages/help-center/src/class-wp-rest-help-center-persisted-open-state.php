<?php
/**
 * WP_REST_Help_Center_Persisted_Open_State file.
 *
 * @package automattic/jetpack-help-center
 */

namespace Automattic\Jetpack\Help_Center;

/**
 * Class WP_REST_Help_Center_Persisted_Open_State.
 */
class WP_REST_Help_Center_Persisted_Open_State extends WP_REST_Help_Center_Controller {

	/**
	 * Matches the preferences the Help Center persists. Apps other than WordPress.com keep their
	 * own copy of each one under an app suffix, e.g. `help_center_open_woo`.
	 */
	private const PREFERENCE_KEY_PATTERN = '/^help_center_(open|minimized|router_history)(_[a-z0-9_-]+)?$/';

	/**
	 * WP_REST_Help_Center_Persisted_Open_State constructor.
	 *
	 * @param Wpcom_Request_Client|null $wpcom_request_client WP.com request client.
	 */
	public function __construct( ?Wpcom_Request_Client $wpcom_request_client = null ) {
		parent::__construct( $wpcom_request_client );
		$this->namespace = 'help-center';
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
					'permission_callback' => '__return_true',
				),
				// Set the open state
				array(
					'methods'             => \WP_REST_Server::EDITABLE,
					'callback'            => array( $this, 'set_state' ),
					'permission_callback' => '__return_true',
				),
			)
		);
	}

	/**
	 * Get chat_id and last_chat_id from user preferences.
	 */
	public function get_state() {
		// Forward the request body to the support chat endpoint.
		$body = $this->wpcom_request_client->request(
			'/me/preferences',
			'2',
			array( 'method' => 'GET' )
		);

		if ( is_wp_error( $body ) ) {
			return $body;
		}

		$response = json_decode( wp_remote_retrieve_body( $body ) );

		return rest_ensure_response( $this->project_preferences( $response->calypso_preferences ?? null ) );
	}

	/**
	 * Set chat_id or last_chat_id from user preferences.
	 *
	 * @param \WP_REST_Request $request The request sent to the API.
	 */
	public function set_state( \WP_REST_Request $request ) {
		$data = array(
			'calypso_preferences' => array(),
		);

		foreach ( $request->get_params() as $key => $value ) {
			if ( is_string( $key ) && preg_match( self::PREFERENCE_KEY_PATTERN, $key ) ) {
				$data['calypso_preferences'][ $key ] = $value;
			}
		}

		$body = $this->wpcom_request_client->request(
			'/me/preferences',
			'2',
			array( 'method' => 'POST' ),
			$data
		);

		if ( is_wp_error( $body ) ) {
			return $body;
		}

		$response = json_decode( wp_remote_retrieve_body( $body ) );

		return rest_ensure_response(
			array(
				'calypso_preferences' => $this->project_preferences( $response->calypso_preferences ?? null ),
			)
		);
	}

	/**
	 * Keep only the Help Center preferences from the user's Calypso preferences.
	 *
	 * The shared preferences are always returned. An app's own copy is returned only when it is
	 * saved, so the client can fall back to the shared value.
	 *
	 * @param mixed $preferences The decoded `calypso_preferences` from WP.com.
	 * @return array
	 */
	private function project_preferences( $preferences ) {
		$preferences = is_object( $preferences ) ? get_object_vars( $preferences ) : array();

		$projected = array(
			'help_center_open'           => (bool) ( $preferences['help_center_open'] ?? false ),
			'help_center_minimized'      => (bool) ( $preferences['help_center_minimized'] ?? false ),
			'help_center_router_history' => $preferences['help_center_router_history'] ?? null,
		);

		foreach ( $preferences as $key => $value ) {
			if ( array_key_exists( $key, $projected ) || ! preg_match( self::PREFERENCE_KEY_PATTERN, (string) $key, $matches ) ) {
				continue;
			}

			$projected[ $key ] = 'router_history' === $matches[1] ? $value : (bool) $value;
		}

		return $projected;
	}
}
