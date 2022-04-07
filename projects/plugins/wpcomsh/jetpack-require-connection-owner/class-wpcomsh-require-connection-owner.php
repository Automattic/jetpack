<?php
/**
 * Force Jetpack connection to require a connected owner
 *
 * Since Jetpack 9.7, the connection is considered active as soon as a site level conneciton is established,
 * making the user authorization step optional. For Atomic sites, we only want the Jetpack connection to work when
 * there's an authorized user.
 *
 * @package wpcomsh
 */

/**
 * Class WPCOMSH_Require_Connection_Owner.
 */
class WPCOMSH_Require_Connection_Owner {

	/**
	 * Filters the Jetpack::is_connection_ready to ensure a connectino owner is always needed
	 *
	 * @param bool                                  $is_conection_ready Is the connection ready?
	 * @param Automattic\Jetpack\Connection\Manager $connection_manager Instance of the Manager class, can be used to check the connection status.
	 * @return bool
	 */
	public static function filter_is_connection_ready( $is_conection_ready, $connection_manager ) { // phpcs:ignore Generic.CodeAnalysis.UnusedFunctionParameter
		return $connection_manager->has_connected_owner();
	}
}
add_filter( 'jetpack_is_connection_ready', array( 'WPCOMSH_Require_Connection_Owner', 'filter_is_connection_ready' ), 1000, 2 );
