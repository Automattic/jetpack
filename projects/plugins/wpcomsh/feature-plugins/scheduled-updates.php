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

	add_submenu_page(
		'plugins.php',
		esc_attr__( 'Scheduled Updates', 'scheduled-updates' ),
		__( 'Scheduled Updates', 'scheduled-updates' ),
		'update_plugins',
		'https://wordpress.com/plugins/scheduled-updates/' . ( new Automattic\Jetpack\Status() )->get_site_suffix(),
		null
	);
}
add_action( 'admin_menu', 'scheduled_updates_menu' );
