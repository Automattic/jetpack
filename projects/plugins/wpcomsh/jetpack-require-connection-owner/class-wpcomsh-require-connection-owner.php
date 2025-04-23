<?php
/**
 * Force Jetpack connection to require a connected owner
 *
 * Since Jetpack 9.7, the connection is considered active as soon as a site level conneciton is established,
 * making the user authorization step optional. For Atomic sites, we want to automatically register the site
 * connection and then require a user connection.
 *
 * @package wpcomsh
 */

use Automattic\Jetpack\Connection\Manager;

/**
 * Class WPCOMSH_Require_Connection_Owner.
 */
class WPCOMSH_Require_Connection_Owner {

	/**
	 * Filters the Jetpack::is_connection_ready to ensure a connection owner is always needed,
	 * but also automatically registers the site if needed.
	 *
	 * @param bool    $is_connection_ready True if connection is ready; elsewise false.
	 * @param Manager $connection_manager Instance of the Manager class, can be used to check the connection status.
	 * @return bool
	 */
	public static function filter_is_connection_ready( $is_connection_ready, $connection_manager ) {
		// If the connection is already ready, no need to do anything.
		if ( $is_connection_ready ) {
			return $is_connection_ready;
		}

		// If site is not registered, attempt automatic registration.
		if ( ! $connection_manager->is_connected() ) {
			// Create a dedicated connection manager for auto-registration.
			$auto_connect_manager = new Manager( 'wpcomsh-auto-connect' );
			$registration_result  = $auto_connect_manager->try_registration();

			// Check if registration succeeded.
			if ( true === $registration_result ) {
				// Log that automatic registration was successful.
				error_log( 'WoA site automatically registered successfully.' ); //phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
			}
		}

		// Even after auto-registration, we still require a user connection.
		return $connection_manager->has_connected_owner() || $connection_manager->is_user_connected();
	}
}
add_filter( 'jetpack_is_connection_ready', array( 'WPCOMSH_Require_Connection_Owner', 'filter_is_connection_ready' ), 1000, 2 );
