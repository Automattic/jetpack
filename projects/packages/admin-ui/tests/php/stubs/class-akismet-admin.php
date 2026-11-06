<?php
/**
 * Stand-in for Akismet's admin class.
 *
 * @package automattic/jetpack-admin-ui
 */

/**
 * Mirrors how Akismet registers its menu item when Jetpack is active.
 */
class Akismet_Admin {
	/** Hooked on admin_menu at priority 5. */
	public static function admin_menu() {
		add_action( 'jetpack_admin_menu', array( __CLASS__, 'load_menu' ) );
	}

	/** Registers the menu item outside Admin_Menu. */
	public static function load_menu() {
		add_submenu_page( 'jetpack', 'Akismet Anti-spam', 'Akismet Anti-spam', 'manage_options', 'akismet-key-config', array( __CLASS__, 'display_page' ) );
	}

	/** Page callback. */
	public static function display_page() {}
}
