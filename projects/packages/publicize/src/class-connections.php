<?php
/**
 * Publicize Connections class.
 *
 * @package automattic/jetpack-publicize
 */

namespace Automattic\Jetpack\Publicize;

use Automattic\Jetpack\Connection;
use Automattic\Jetpack\Publicize\REST_API\Proxy_Requests;
use WP_Error;
use WP_REST_Request;

/**
 * Publicize Connections class.
 */
class Connections {

	const CONNECTIONS_TRANSIENT = 'jetpack_social_connections_list';

	/**
	 * Get all connections.
	 *
	 * @param array $args Arguments
	 *                - 'ignore_cache': bool Whether to ignore the cache and fetch the connections from the API.
	 * @return array
	 */
	public static function get_all( $args = array() ) {

		if ( Publicize_Utils::is_wpcom() ) {
			$connections = self::wpcom_get_connections( array( 'context' => 'blog' ) );
		} else {

			$ignore_cache = $args['ignore_cache'] ?? false;

			$connections = get_transient( self::CONNECTIONS_TRANSIENT );

			if ( $ignore_cache || false === $connections ) {
				$connections = self::fetch_and_cache_connections();
			}
		}

		return $connections;
	}

	/**
	 * Get a connection by connection_id.
	 *
	 * @param string $connection_id Connection ID.
	 *
	 * @return array|null
	 */
	public static function get_by_id( $connection_id ) {

		$connections = self::get_all();

		foreach ( $connections as $connection ) {
			if ( $connection['connection_id'] === $connection_id ) {
				return $connection;
			}
		}

		return null;
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

			if ( self::is_shared( $connection ) || self::user_owns_connection( $connection ) ) {
				$connections_for_user[] = $connection;
			}
		}

		return $connections_for_user;
	}

	/**
	 * Check whether a connection is shared.
	 *
	 * @param array $connection The connection.
	 *
	 * @return boolean
	 */
	public static function is_shared( $connection ) {
		return ! empty( $connection['shared'] );
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
		if ( Publicize_Utils::is_wpcom() ) {
			$wpcom_user_id = get_current_user_id();
		} else {

			$wpcom_user_data = ( new Connection\Manager() )->get_connected_user_data( $user_id );

			$wpcom_user_id = ! empty( $wpcom_user_data['ID'] ) ? $wpcom_user_data['ID'] : null;
		}

		return $wpcom_user_id && $connection['wpcom_user_id'] === $wpcom_user_id;
	}

	/**
	 * Fetch connections from the REST API and cache them.
	 *
	 * @return array
	 */
	public static function fetch_and_cache_connections() {
		$connections = self::fetch_site_connections();

		if ( is_wp_error( $connections ) ) {
			// @todo log error.
			return array();
		}

		if ( is_array( $connections ) ) {
			if ( ! set_transient( self::CONNECTIONS_TRANSIENT, $connections, HOUR_IN_SECONDS * 4 ) ) {
				// If the transient has beeen set in another request, the call to set_transient can fail.
				// If so, we can delete the transient and try again.
				self::clear_cache();

				set_transient( self::CONNECTIONS_TRANSIENT, $connections, HOUR_IN_SECONDS * 4 );
			}
		}

		return $connections;
	}

	/**
	 * Fetch connections for the site from WPCOM REST API.
	 *
	 * @return array|WP_Error
	 */
	public static function fetch_site_connections() {
		$proxy = new Proxy_Requests( 'publicize/connections' );

		$request = new WP_REST_Request( 'GET' );

		return $proxy->proxy_request_to_wpcom_as_blog( $request );
	}

	/**
	 * Get all connections. Meant to be called directly only on WPCOM.
	 *
	 * @param array $args Arguments
	 *                    - 'test_connections': bool Whether to run connection tests.
	 *                    - 'context': enum('blog', 'user') Whether to include connections for the current blog or user.
	 *
	 * @return array
	 */
	public static function wpcom_get_connections( $args = array() ) {
		// Ensure that we are on WPCOM.
		Publicize_Utils::assert_is_wpcom( __METHOD__ );

		/**
		 * Publicize instance.
		 */
		global $publicize;

		$items = array();

		$run_tests = $args['test_connections'] ?? false;

		$test_results = $run_tests ? self::get_test_status() : array();

		$service_connections = $publicize->get_all_connections_for_blog_id( get_current_blog_id() );

		$context = $args['context'] ?? 'user';

		foreach ( $service_connections as $service_name => $connections ) {
			foreach ( $connections as $connection ) {
				$connection_id = $publicize->get_connection_id( $connection );

				$item = self::wpcom_prepare_connection_data( $connection, $service_name );

				$item['status'] = $test_results[ $connection_id ] ?? null;

				// For blog context, return all connections.
				// Otherwise, return only connections owned by the user and the shared ones.
				if ( 'blog' === $context || $item['shared'] || self::user_owns_connection( $item ) ) {
					$items[] = $item;
				}
			}
		}

		return $items;
	}

	/**
	 * Filters out data based on ?_fields= request parameter
	 *
	 * @param mixed  $connection   Connection to prepare.
	 * @param string $service_name Service name.
	 *
	 * @return array
	 */
	public static function wpcom_prepare_connection_data( $connection, $service_name ) {
		// Ensure that we are on WPCOM.
		Publicize_Utils::assert_is_wpcom( __METHOD__ );

		/**
		 * Publicize instance.
		 */
		global $publicize;

		$connection_id = $publicize->get_connection_id( $connection );

		$connection_meta = $publicize->get_connection_meta( $connection );
		$connection_data = $connection_meta['connection_data'];

		return array(
			'connection_id'        => (string) $connection_id,
			'display_name'         => (string) $publicize->get_display_name( $service_name, $connection ),
			'external_handle'      => (string) $publicize->get_external_handle( $service_name, $connection ),
			'external_id'          => $connection_meta['external_id'] ?? '',
			'profile_link'         => (string) $publicize->get_profile_link( $service_name, $connection ),
			'profile_picture'      => (string) $publicize->get_profile_picture( $connection ),
			'service_label'        => (string) Publicize::get_service_label( $service_name ),
			'service_name'         => $service_name,
			'shared'               => ! $connection_data['user_id'],
			'wpcom_user_id'        => (int) $connection_data['user_id'],

			// Deprecated fields.
			'id'                   => (string) $publicize->get_connection_unique_id( $connection ),
			'username'             => $publicize->get_username( $service_name, $connection ),
			'profile_display_name' => ! empty( $connection_meta['profile_display_name'] ) ? $connection_meta['profile_display_name'] : '',
			// phpcs:ignore Universal.Operators.StrictComparisons.LooseEqual -- We expect an integer, but do loose comparison below in case some other type is stored.
			'global'               => 0 == $connection_data['user_id'],

		);
	}

	/**
	 * Create a connection. Meant to be called directly only on WPCOM.
	 *
	 * @param mixed $input Input data.
	 *
	 * @return string|WP_Error Connection ID or WP_Error.
	 */
	public static function wpcom_create_connection( $input ) {
		// Ensure that we are on WPCOM.
		Publicize_Utils::assert_is_wpcom( __METHOD__ );

		require_lib( 'social-connections-rest-helper' );

		$connections_helper = \Social_Connections_Rest_Helper::init();

		$result = $connections_helper->create_publicize_connection( $input );

		if ( is_wp_error( $result ) ) {
			return $result;
		}

		if ( ! isset( $result['ID'] ) ) {
			return new WP_Error(
				'wpcom_connection_creation_failed',
				__( 'Something went wrong while creating a connection.', 'jetpack-publicize-pkg' )
			);
		}

		return (string) $result['ID'];
	}

	/**
	 * Update a connection. Meant to be called directly only on WPCOM.
	 *
	 * @param string $connection_id Connection ID.
	 * @param mixed  $input Input data.
	 *
	 * @return string|WP_Error Connection ID or WP_Error.
	 */
	public static function wpcom_update_connection( $connection_id, $input ) {
		// Ensure that we are on WPCOM.
		Publicize_Utils::assert_is_wpcom( __METHOD__ );

		require_lib( 'social-connections-rest-helper' );
		$connections_helper = \Social_Connections_Rest_Helper::init();

		$result = $connections_helper->update_connection( $connection_id, $input );

		if ( is_wp_error( $result ) ) {
			return $result;
		}

		if ( ! $result ) {
			return new WP_Error(
				'wpcom_connection_updation_failed',
				__( 'Something went wrong while updating the connection.', 'jetpack-publicize-pkg' )
			);
		}

		return (string) $connection_id;
	}

	/**
	 * Delete a connection. Meant to be called directly only on WPCOM.
	 *
	 * @param string $connection_id Connection ID.
	 *
	 * @return bool|WP_Error
	 */
	public static function wpcom_delete_connection( $connection_id ) {
		// Ensure that we are on WPCOM.
		Publicize_Utils::assert_is_wpcom( __METHOD__ );

		require_lib( 'social-connections-rest-helper' );
		$connections_helper = \Social_Connections_Rest_Helper::init();

		$result = $connections_helper->delete_publicize_connection( $connection_id );

		if ( is_wp_error( $result ) ) {
			return $result;
		}

		if ( ! $result ) {
			return new WP_Error(
				'wpcom_connection_deletion_failed',
				__( 'Something went wrong while deleting the connection.', 'jetpack-publicize-pkg' )
			);
		}

		return true;
	}

	/**
	 * Get the connections test status.
	 *
	 * @return array
	 */
	public static function get_test_status() {
		/**
		 * Publicize instance.
		 *
		 * @var \Automattic\Jetpack\Publicize\Publicize $publicize
		 */
		global $publicize;

		$test_results = $publicize->get_publicize_conns_test_results();

		$test_results_map = array();

		foreach ( $test_results as $test_result ) {
			$result = $test_result['connectionTestPassed'];
			if ( 'must_reauth' !== $result ) {
				$result = $test_result['connectionTestPassed'] ? 'ok' : 'broken';
			}
			$test_results_map[ $test_result['connectionID'] ] = $result;
		}

		return $test_results_map;
	}

	/**
	 * Clear the connections cache.
	 */
	public static function clear_cache() {
		delete_transient( self::CONNECTIONS_TRANSIENT );
	}
}
