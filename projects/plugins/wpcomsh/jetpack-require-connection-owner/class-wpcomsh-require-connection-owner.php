<?php
/**
 * Force Jetpack connection to require a connected owner
 *
 * Since Jetpack 9.7, the connection is considered active as soon as a site level connection is established,
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
	 * Initialize the class by adding necessary hooks.
	 */
	public static function init() {
		// Require user connection for Atomic sites.
		add_filter( 'jetpack_is_connection_ready', array( __CLASS__, 'filter_is_connection_ready' ), 1000, 2 );

		// Register the site connection if missing during admin_init (not during API calls).
		add_action( 'admin_init', array( __CLASS__, 'maybe_register_site_connection' ), 5 );
	}

	/**
	 * Filters the Jetpack::is_connection_ready to ensure a connection owner is always needed
	 *
	 * @param bool                                  $is_connection_ready True if connection is ready; elsewise false.
	 * @param Automattic\Jetpack\Connection\Manager $connection_manager Instance of the Manager class, can be used to check the connection status.
	 * @return bool
	 */
	public static function filter_is_connection_ready( $is_connection_ready, $connection_manager ) {
		return $connection_manager->has_connected_owner() || $connection_manager->is_user_connected();
	}

	/**
	 * Check if site connection exists, and register it if it doesn't.
	 * This runs during admin_init, separate from the filter, to avoid loops.
	 */
	public static function maybe_register_site_connection() {
		// Don't run during AJAX, REST, or API calls to prevent loops
		if ( wp_doing_ajax() || defined( 'REST_REQUEST' ) || defined( 'XMLRPC_REQUEST' ) ) {
			return;
		}

		// Use a transient to prevent multiple registration attempts in quick succession
		if ( get_transient( 'wpcomsh_registration_attempted' ) ) {
			return;
		}

		$connection_manager = new Manager( 'wpcomsh-auto-connect' );

		// Only attempt registration if site is not already connected
		if ( ! $connection_manager->is_connected() ) {
			// Set transient to prevent repeated attempts
			set_transient( 'wpcomsh_registration_attempted', true, HOUR_IN_SECONDS );

			// Attempt registration
			$registration_result = $connection_manager->try_registration();

			// Log result
			if ( true === $registration_result ) {
				error_log( 'WoA site automatically registered successfully.' ); //phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
			} else {
				error_log( 'WoA site automatic registration failed: ' . wp_json_encode( $registration_result ) ); //phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
			}

			// Clear transient on success to allow subsequent attempts if needed
			if ( true === $registration_result ) {
				delete_transient( 'wpcomsh_registration_attempted' );
			}
		}
	}
}

// Initialize the class
WPCOMSH_Require_Connection_Owner::init();
