<?php
/**
 * Manage the display of an "Activity Log" menu item.
 *
 * @package automattic/my-jetpack
 */

namespace Automattic\Jetpack\My_Jetpack;

use Automattic\Jetpack\Admin_UI\Admin_Menu;
use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Redirect;

/**
 * Activity Log features in My Jetpack.
 */
class Activitylog {
	/**
	 * Initialize the class and hooks needed.
	 */
	public static function init() {
		add_action( 'admin_menu', array( self::class, 'add_submenu_jetpack' ) );
	}

	/**
	 * The page to be added to submenu
	 *
	 * @return void|null|string The resulting page's hook_suffix
	 */
	public static function add_submenu_jetpack() {
		// Only proceed if the user is connected to WordPress.com.
		if ( ! ( new Connection_Manager() )->is_user_connected() ) {
			return;
		}

		// Do not display the menu on Multisite.
		if ( is_multisite() ) {
			return;
		}

		return Admin_Menu::add_menu(
			__( 'Activity Log', 'jetpack-my-jetpack' ),
			_x( 'Activity Log', 'product name shown in menu', 'jetpack-my-jetpack' ) . ' <span class="dashicons dashicons-external"></span>',
			'manage_options',
			esc_url( Redirect::get_url( 'cloud-activity-log-wp-menu' ) ),
			null,
			1
		);
	}
}
