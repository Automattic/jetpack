<?php
/**
 * Open_State_Store file.
 *
 * @package automattic/jetpack-agents-manager
 */

namespace Automattic\Jetpack\Agents_Manager;

use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\Status\Host;

/**
 * Reads and writes the Agents Manager open state.
 *
 * The state is a global, per-user wpcom preference behind the
 * `/agents-manager/state` endpoint. How the server reads it depends on the site:
 *
 * - wpcom Simple: the preference is local, so read `calypso_preferences` directly.
 * - WoA / self-hosted: the preference is remote, so reads/writes go through this
 *   store's local REST route, which calls wpcom over the Jetpack Connection and
 *   caches the result in a per-user transient. Latency-sensitive readers (the
 *   server-side pre-render) use that transient to skip the round-trip.
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
		'agents_manager_minimized'         => false,
		'agents_manager_floating_position' => 'right',
		'agents_manager_router_history'    => null,
		'agents_manager_last_activity'     => null,
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
	 * Read the current user's open state from the fastest local source.
	 *
	 * For latency-sensitive callers like the server-side pre-render: Simple sites
	 * read `calypso_preferences` directly, everywhere else uses the cached
	 * transient (see the class docblock). Returns null when nothing is known yet,
	 * so callers can skip pre-rendering until the frontend sets the real state.
	 *
	 * @return array|null `{ agents_manager_open, agents_manager_docked }` or null.
	 */
	public static function get_cached() {
		$user_id = get_current_user_id();
		if ( ! $user_id ) {
			return null;
		}

		// Simple sites have the preference locally, so read it directly (the
		// transient is never primed there).
		if ( ( new Host() )->is_wpcom_simple() && function_exists( '\get_user_attribute' ) ) {
			$calypso_prefs = \get_user_attribute( $user_id, 'calypso_preferences' );
			if ( ! is_array( $calypso_prefs ) ) {
				return null;
			}

			return array(
				'agents_manager_open'   => (bool) ( $calypso_prefs['agents_manager_open'] ?? false ),
				'agents_manager_docked' => (bool) ( $calypso_prefs['agents_manager_docked'] ?? false ),
			);
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
			'agents_manager_minimized'         => (bool) ( $response['agents_manager_minimized'] ?? self::DEFAULTS['agents_manager_minimized'] ),
			'agents_manager_floating_position' => $response['agents_manager_floating_position'] ?? self::DEFAULTS['agents_manager_floating_position'],
			'agents_manager_router_history'    => $response['agents_manager_router_history'] ?? self::DEFAULTS['agents_manager_router_history'],
			'agents_manager_last_activity'     => $response['agents_manager_last_activity'] ?? self::DEFAULTS['agents_manager_last_activity'],
		);
	}

	/**
	 * Cache the open/docked bits in a per-user transient.
	 *
	 * Only used on the remote (WoA / self-hosted) path — it's what get_cached()
	 * reads there. Simple sites read `calypso_preferences` directly and skip this.
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
		 * It's refreshed on every read/write through this store, so the TTL mainly
		 * caps how long a value changed elsewhere (e.g. in Calypso) stays stale.
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
