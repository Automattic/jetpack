<?php
/**
 * Publicize Connections class.
 *
 * @package automattic/jetpack-publicize
 */

namespace Automattic\Jetpack\Publicize;

use Automattic\Jetpack\Publicize\REST_API\Connections_Controller;
use Automattic\Jetpack\Status\Host;

/**
 * Publicize Connections class.
 */
class Connections {

	const CONNECTIONS_TRANSIENT = 'jetpack_social_connections_list';

	/**
	 * Get all connections.
	 *
	 * @param array $args Arguments
	 *                - 'clear_cache': bool Whether to clear the cache.
	 *                - 'test_connections': bool Whether to run connection tests.
	 * @return array
	 */
	public static function get_all( $args = array() ) {

		$run_tests = $args['test_connections'] ?? false;

		$is_wpcom = ( new Host() )->is_wpcom_simple();

		if ( $is_wpcom ) {
			// We don't need to cache connections for simple sites.
			return Connections_Controller::get_connections( $run_tests );
		}

		$clear_cache = $args['clear_cache'] ?? false;

		if ( $clear_cache || $run_tests ) {
			self::clear_transient();
		}

		$connections = get_transient( self::CONNECTIONS_TRANSIENT );

		// This can be an empty array, so we need to check for false.
		if ( false === $connections ) {
			$connections = self::fetch_and_cache_connections( $run_tests );
		}

		return $connections;
	}

	/**
	 * Fetch connections from the REST API and cache them.
	 *
	 * @param bool $run_tests Whether to run connection tests.
	 *
	 * @return array
	 */
	public static function fetch_and_cache_connections( $run_tests = false ) {
		$connections = Connections_Controller::get_connections( $run_tests );

		if ( is_array( $connections ) ) {
			set_transient( self::CONNECTIONS_TRANSIENT, $connections, HOUR_IN_SECONDS * 4 );
		}

		return $connections;
	}

	/**
	 * Delete the transient.
	 */
	public static function clear_transient() {
		delete_transient( self::CONNECTIONS_TRANSIENT );
	}
}
