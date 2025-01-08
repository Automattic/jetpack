<?php
/**
 * Publicize Connections class.
 *
 * @package automattic/jetpack-publicize
 */

namespace Automattic\Jetpack\Publicize;

use Automattic\Jetpack\Connection;
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
	 * @return array
	 */
	public static function get_all( $args = array() ) {

		$is_wpcom = ( new Host() )->is_wpcom_simple();

		if ( $is_wpcom ) {
			$connections = Connections_Controller::get_connections();
		} else {

			if ( $args['clear_cache'] ?? false ) {
				self::clear_cache();
			}

			$connections = get_transient( self::CONNECTIONS_TRANSIENT );

			// This can be an empty array, so we need to check for false.
			if ( false === $connections ) {
				$connections = self::fetch_and_cache_connections();
			}
		}

		// Let us add the deprecated fields for now.
		// TODO: Remove this after https://github.com/Automattic/jetpack/pull/40539 is merged.
		$connections = self::retain_deprecated_fields( $connections );

		return $connections;
	}

	/**
	 * Get all connections for the current user.
	 *
	 * @param array $args Arguments. Same as self::get_all().
	 *
	 * @see Automattic\Jetpack\Publicize\Connections::get_all()
	 *
	 * @return array
	 */
	public static function get_all_for_user( $args = array() ) {
		$connections = self::get_all( $args );

		$connections_for_user = array();

		foreach ( $connections as $connection ) {

			if ( $connection['shared'] || self::user_owns_connection( $connection ) ) {
				$connections_for_user[] = $connection;
			}
		}

		return $connections_for_user;
	}

	/**
	 * Whether the current user owns a connection.
	 *
	 * @param array $connection The connection.
	 * @param int   $user_id    The user ID. Defaults to the current user.
	 *
	 * @return bool
	 */
	public static function user_owns_connection( $connection, $user_id = null ) {
		if ( ( new Host() )->is_wpcom_simple() ) {
			$wpcom_user_id = get_current_user_id();
		} else {

			$wpcom_user_data = ( new Connection\Manager() )->get_connected_user_data( $user_id );

			$wpcom_user_id = ! empty( $wpcom_user_data['ID'] ) ? $wpcom_user_data['ID'] : null;
		}

		return $wpcom_user_id && $connection['user_id'] === $wpcom_user_id;
	}

	/**
	 * Retain deprecated fields.
	 *
	 * @param array $connections Connections.
	 * @return array
	 */
	private static function retain_deprecated_fields( $connections ) {
		return array_map(
			function ( $connection ) {

				$owns_connection = self::user_owns_connection( $connection );

				$connection = array_merge(
					$connection,
					array(
						'external_display' => $connection['display_name'],
						'can_disconnect'   => current_user_can( 'edit_others_posts' ) || $owns_connection,
						'label'            => $connection['service_label'],
					)
				);

				if ( 'bluesky' === $connection['service_name'] ) {
					$connection['external_name'] = $connection['external_handle'];
				}

				return $connection;
			},
			$connections
		);
	}

	/**
	 * Fetch connections from the REST API and cache them.
	 *
	 * @return array
	 */
	public static function fetch_and_cache_connections() {
		$args = array(
			// Request all connections.
			'scope' => 'site',
		);

		$connections = Connections_Controller::get_connections( $args );

		if ( is_array( $connections ) ) {
			set_transient( self::CONNECTIONS_TRANSIENT, $connections, HOUR_IN_SECONDS * 4 );
		}

		return $connections;
	}

	/**
	 * Clear the connections cache.
	 */
	public static function clear_cache() {
		delete_transient( self::CONNECTIONS_TRANSIENT );
	}
}
