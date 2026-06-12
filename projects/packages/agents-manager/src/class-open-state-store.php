<?php
/**
 * Open_State_Store file.
 *
 * @package automattic/jetpack-agents-manager
 */

namespace Automattic\Jetpack\Agents_Manager;

use Automattic\Jetpack\Connection\Client;

/**
 * Reads and writes the Agents Manager open state.
 *
 * The source of truth is a global (per-user) wpcom preference exposed by the
 * `/agents-manager/state` endpoint. Because that read is a remote HTTP request,
 * the resolved state is mirrored into a short-lived per-user transient so other
 * code paths (notably the server-side sidebar pre-render) can read it without
 * paying the round-trip. The transient is refreshed for free every time the
 * frontend reads or writes the state through this store.
 */
class Open_State_Store {

	/**
	 * Transient key prefix for the cached per-user open state.
	 *
	 * @var string
	 */
	private const TRANSIENT_PREFIX = 'agents_manager_open_state_';

	/**
	 * Default state values.
	 *
	 * @var array
	 */
	public const DEFAULTS = array(
		'agents_manager_open'              => false,
		'agents_manager_docked'            => false,
		'agents_manager_floating_position' => 'right',
		'agents_manager_router_history'    => null,
	);

	/**
	 * Fetch the open state from wpcom and refresh the cache.
	 *
	 * @return array|\WP_Error Normalized state, or WP_Error when the request fails.
	 */
	public static function fetch() {
		$body = Client::wpcom_json_api_request_as_user(
			'/agents-manager/state',
			'2',
			array( 'method' => 'GET' )
		);

		if ( is_wp_error( $body ) ) {
			return $body;
		}

		$response = json_decode( wp_remote_retrieve_body( $body ), true );
		$state    = self::normalize( is_array( $response ) ? $response : array() );

		self::cache( $state );

		return $state;
	}

	/**
	 * Persist the open state to wpcom and refresh the cache.
	 *
	 * @param array $state Partial state to update (subset of DEFAULTS keys).
	 * @return array|\WP_Error Normalized state, or WP_Error when the request fails.
	 */
	public static function update( array $state ) {
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

		$normalized = self::normalize( $response );

		self::cache( $normalized );

		return $normalized;
	}

	/**
	 * Read the cached open state for the current user without hitting wpcom.
	 *
	 * Intended for latency-sensitive paths (e.g. server-side pre-render). Returns
	 * null when nothing is cached yet; callers should treat that as "unknown" and
	 * avoid pre-rendering, letting the frontend establish the real state.
	 *
	 * @return array|null `{ agents_manager_open, agents_manager_docked }` or null.
	 */
	public static function get_cached() {
		$user_id = get_current_user_id();
		if ( ! $user_id ) {
			return null;
		}

		$cached = get_transient( self::cache_key( $user_id ) );

		return is_array( $cached ) ? $cached : null;
	}

	/**
	 * Normalize a raw endpoint response into the full state shape.
	 *
	 * @param array $response Raw decoded response.
	 * @return array Normalized state with all DEFAULTS keys present.
	 */
	private static function normalize( array $response ): array {
		return array(
			'agents_manager_open'              => (bool) ( $response['agents_manager_open'] ?? self::DEFAULTS['agents_manager_open'] ),
			'agents_manager_docked'            => (bool) ( $response['agents_manager_docked'] ?? self::DEFAULTS['agents_manager_docked'] ),
			'agents_manager_floating_position' => $response['agents_manager_floating_position'] ?? self::DEFAULTS['agents_manager_floating_position'],
			'agents_manager_router_history'    => $response['agents_manager_router_history'] ?? self::DEFAULTS['agents_manager_router_history'],
		);
	}

	/**
	 * Cache the bits of state the pre-render needs for the current user.
	 *
	 * @param array $state Normalized state.
	 */
	private static function cache( array $state ): void {
		$user_id = get_current_user_id();
		if ( ! $user_id ) {
			return;
		}

		/**
		 * Filter how long the cached open state lives.
		 *
		 * The cache is refreshed on every read/write through this store, so this
		 * mainly bounds how long a stale value set on another domain (e.g. the
		 * Calypso app) can linger before it is re-fetched.
		 *
		 * @since 0.4.0
		 *
		 * @param int $ttl Cache lifetime in seconds.
		 */
		$ttl = (int) apply_filters( 'agents_manager_open_state_cache_ttl', WEEK_IN_SECONDS );

		set_transient(
			self::cache_key( $user_id ),
			array(
				'agents_manager_open'   => (bool) ( $state['agents_manager_open'] ?? false ),
				'agents_manager_docked' => (bool) ( $state['agents_manager_docked'] ?? false ),
			),
			$ttl
		);
	}

	/**
	 * Build the per-user transient key.
	 *
	 * @param int $user_id User ID.
	 * @return string
	 */
	private static function cache_key( int $user_id ): string {
		return self::TRANSIENT_PREFIX . $user_id;
	}
}
