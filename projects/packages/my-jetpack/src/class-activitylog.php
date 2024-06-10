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
use Automattic\Jetpack\Status\Host;

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

		$is_simple_classic = ( new Host() )->is_wpcom_simple() && get_option( 'wpcom_admin_interface' ) === 'wp-admin';

		// Do not display the menu on Multisite.
		if ( is_multisite() && ! $is_simple_classic ) {
			return;
		}

		$args = array();

		$blog_id = Connection_Manager::get_site_id( true );
		if ( $blog_id ) {
			$args = array( 'site' => $blog_id );
		}

		return Admin_Menu::add_menu(
			__( 'Activity Log', 'jetpack-my-jetpack' ),
			_x( 'Activity Log', 'product name shown in menu', 'jetpack-my-jetpack' ) . ' <span class="dashicons dashicons-external"></span>',
			'manage_options',
			esc_url( Redirect::get_url( 'cloud-activity-log-wp-menu', $args ) ),
			null,
			1
		);
	}
}
