<?php
/**
 * Jetpack Stats on WordPress.com
 *
 * @package automattic/jetpack-mu-wpcom
 */

/**
 * Extends the default value for which roles can access the Stats menu item.
 *
 * This enables the `view_stats` capability to work with all roles that are available on Simple sites.
 *
 * @see https://wordpress.com/support/invite-people/user-roles/#access-to-stats
 * @see projects/plugins/wpcomsh/feature-plugins/stats.php
 *
 * @param mixed $caps Caps.
 * @param mixed $cap Cap.
 * @param mixed $user_id User ID.
 * @return array Possibly mapped capabilities for meta capability.
 */
function wpcom_map_jetpack_stats_caps( $caps, $cap, $user_id ) {
	// Map view_stats to exists.
	if ( 'view_stats' === $cap ) {
		$user        = new WP_User( $user_id );
		$user_role   = array_shift( $user->roles );
		$stats_roles = array( 'administrator', 'editor', 'author', 'contributor' );

		// Is the users role in the available stats roles?
		if ( in_array( $user_role, $stats_roles, true ) ) {
			$caps = array( 'read' );
		}
	}

	return $caps;
}

// Let Atomic sites handle this through the Jetpack settings.
if ( ( defined( 'IS_WPCOM' ) && IS_WPCOM ) && ( ! defined( 'IS_ATOMIC' ) || ! IS_ATOMIC ) ) {
	add_filter( 'map_meta_cap', 'wpcom_map_jetpack_stats_caps', 10, 3 );
}
