<?php
/**
 * Hotfixes for Nav Unification feature, due to Jetpack monthly release cycle.
 * Each hotfix should declare when it is safe to be removed.
 *
 * @package wpcomsh
 */

/**
 * Fix third-party dependencies that expect index.php submenu item to be available.
 */
function wpcomsh_add_index_page_hotfix() {
	global $submenu;

	// Do not run if Jetpack is not enabled.
	if ( ! defined( 'JETPACK__VERSION' ) ) {
		return;
	}

	// Do not clash with the fix already shipped in Jetpack 9.6.
	if ( version_compare( JETPACK__VERSION, '9.7-alpha', '>=' ) ) {
		return;
	}

	// Safety - don't alter anything if Nav Unification is not enabled.
	if ( ! wpcomsh_activate_nav_unification( false ) ) {
		return;
	}

	add_submenu_page( 'index.php', '', '', 'read', 'index.php', '', 10 );


	foreach ( $submenu['index.php'] as $index => $item ) {
		if ( 'index.php' !== $item[2] ) {
			continue;
		}

		// phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
		$submenu['index.php'][ $index ][4] = 'hide-if-no-js hide-if-js';
	}
}

add_action( 'admin_menu', 'wpcomsh_add_index_page_hotfix', 100000 );
