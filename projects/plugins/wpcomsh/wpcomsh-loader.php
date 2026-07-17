<?php
/**
 * Description: WordPress.com provided functionality & tools pre-installed and activated on all Atomic Sites
 *
 * @package wpcomsh
 */

// List of WP Cloud clients that will always load wpcomsh.
$wpcloud_client_ids = array(
	2, // wpcom
	10, // e2e
	32, // jurassicninja
);

/**
 * Filters whether wpcomsh should be loaded.
 *
 * Only mu-plugins loaded before this file can hook into this filter.
 *
 * @param bool Whether wpcomsh should be loaded.
 */
$should_load_wpcomsh = (bool) apply_filters( 'wpcomsh_force_load', false );

// Load if any of these conditions are true.
$should_load_wpcomsh = $should_load_wpcomsh
	|| ( defined( 'WPCOMSH_FORCE_LOAD' ) && WPCOMSH_FORCE_LOAD )
	|| ( defined( 'ATOMIC_CLIENT_ID' ) && in_array( (int) ATOMIC_CLIENT_ID, $wpcloud_client_ids, true ) );

if ( $should_load_wpcomsh ) {
	require_once WPMU_PLUGIN_DIR . '/wpcomsh/wpcomsh.php';
}
