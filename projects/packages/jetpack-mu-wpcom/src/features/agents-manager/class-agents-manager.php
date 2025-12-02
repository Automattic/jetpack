<?php
/**
 * Agents manager
 *
 * @package automattic/jetpack-mu-wpcom
 */

namespace A8C\FSE;

/**
 * Class Agents_Manager
 */
class Agents_Manager {
	/**
	 * Class instance.
	 *
	 * @var Agents_Manager
	 */
	private static $instance = null;

	/**
	 * Agents_Manager constructor.
	 */
	public function __construct() {
		add_action( 'rest_api_init', array( $this, 'register_rest_api' ) );
		add_filter( 'calypso_preferences_update', array( $this, 'calypso_preferences_update' ) );
	}

	/**
	 * Update the calypso preferences.
	 *
	 * @param \stdClass $preferences The preferences.
	 * @return \stdClass The preferences.
	 */
	public function calypso_preferences_update( $preferences ) {
		// Check if agents_manager_router_history exists and is a valid array structure
		if ( ! isset( $preferences->agents_manager_router_history ) ||
			! is_array( $preferences->agents_manager_router_history ) ) {
			return $preferences;
		}

		$router_history = $preferences->agents_manager_router_history;

		// Check if entries exist and is an array
		if ( ! isset( $router_history['entries'] ) ||
			! is_array( $router_history['entries'] ) ) {
			return $preferences;
		}

		$entries = $router_history['entries'];

		// Limit entries to 50 to prevent spamming entries in the router history.
		if ( count( $entries ) > 50 ) {
			// Keep only the last 49 entries and add the root entry at the beginning.
			$entries = array_slice( $entries, -49 );
			// Keep the start at root so the back button always works.
			array_unshift(
				$entries,
				array(
					'pathname' => '/',
					'search'   => '',
					'hash'     => '',
					'key'      => 'default',
					'state'    => null,
				)
			);

			// Update the preferences object directly
			$preferences->agents_manager_router_history['entries'] = $entries;
			$preferences->agents_manager_router_history['index']   = 49;
		}

		return $preferences;
	}

	/**
	 * Creates instance.
	 *
	 * @return void
	 */
	public static function init() {
		if ( self::$instance === null ) {
			self::$instance = new self();
		}
	}

	/**
	 * Register the Agents Manager endpoints.
	 */
	public function register_rest_api() {
		require_once __DIR__ . '/class-wp-rest-agents-manager-persisted-open-state.php';
		$controller = new WP_REST_Agents_Manager_Persisted_Open_State();
		$controller->register_rest_route();
	}
}

add_action( 'init', array( __NAMESPACE__ . '\Agents_Manager', 'init' ) );
