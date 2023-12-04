<?php
/**
 * Manage the display of an "Jetpack Manage" menu item.
 *
 * @package automattic/my-jetpack
 */

namespace Automattic\Jetpack\My_Jetpack;

use Automattic\Jetpack\Admin_UI\Admin_Menu;
use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Redirect;

/**
 * Jetpack Manage features in My Jetpack.
 */
class Jetpack_Manage {
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

		// Do not display the menu if Jetpack plugin is not installed.
		if ( ! class_exists( 'Jetpack' ) ) {
			return;
		}

		// Do not display the menu on Multisite.
		if ( is_multisite() ) {
			return;
		}

		// Do not display the menu if the user has <= 2 sites.
		$user_data = ( new Connection_Manager() )->get_connected_user_data( get_current_user_id() );
		if ( ! isset( $user_data['site_count'] ) || $user_data['site_count'] < 2 ) {
			return;
		}

		return Admin_Menu::add_menu(
			__( 'Jetpack Manage', 'jetpack-my-jetpack' ),
			_x( 'Jetpack Manage', 'product name shown in menu', 'jetpack-my-jetpack' ) . ' <span class="dashicons dashicons-external"></span>',
			'manage_options',
			esc_url( Redirect::get_url( 'cloud-manage-dashboard-wp-menu' ) ),
			null,
			100
		);
	}
}
