<?php
/**
 * Plugin Name: Scheduled Updates.
 *
 * @see https://github.com/Automattic/jetpack/tree/trunk/projects/packages/scheduled-updates
 *
 * @package wpcomsh
 */

/**
 * Add the Scheduled Updates menu item to the Plugins menu.
 *
 * Limited to users who can update plugins.
 */
function scheduled_updates_menu() {
	if ( ! wpcom_site_has_feature( WPCOM_Features::SCHEDULED_UPDATES ) ) {
		return;
	}

	if ( ! class_exists( 'Automattic\Jetpack\Status' ) ) {
		return;
	}

	global $submenu;

	// Check if the Scheduled Updates submenu already exists
	if ( isset( $submenu['plugins.php'] ) ) {
		foreach ( $submenu['plugins.php'] as $submenu_item ) {
			if ( $submenu_item[2] === 'https://wordpress.com/plugins/scheduled-updates/' . ( new Automattic\Jetpack\Status() )->get_site_suffix() ) {
				return; // Submenu already exists, exit the function
			}
		}
	}

	add_submenu_page(
		'plugins.php',
		esc_attr__( 'Scheduled Updates', 'wpcomsh' ),
		__( 'Scheduled Updates', 'wpcomsh' ),
		'update_plugins',
		'https://wordpress.com/plugins/scheduled-updates/' . ( new Automattic\Jetpack\Status() )->get_site_suffix(),
		null
	);
}
add_action( 'admin_menu', 'scheduled_updates_menu', 11 );
