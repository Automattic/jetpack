<?php
/**
 * WP Admin page with information and configuration shared among all Jetpack stand-alone plugins
 *
 * @package automattic/my-jetpack
 */

namespace Automattic\Jetpack\My_Jetpack;

use Automattic\Jetpack\Admin_UI\Admin_Menu;

class My_Jetpack {

	private static $initialized = false;

	public static function init() {
		if ( self::$initialized ) {
			return;
		}
		self::$initialized = true;

		// Feature flag while we are developing it.
		if ( ! defined( 'JETPACK_ENABLE_MY_JETPACK' ) || ! JETPACK_ENABLE_MY_JETPACK ) {
			return;
		}

		$page_suffix = Admin_Menu::add_menu(
			__( 'My Jetpack', 'jetpack' ),
			__( 'My Jetpack', 'jetpack' ),
			'manage_options',
			'my-jetpack',
			array( __CLASS__, 'admin_page' ),
			999
		);

		add_action( 'load-' . $page_suffix, array( __CLASS__, 'admin_init' ) );
	}

	public static function admin_init() {
		// enqueue assets.
	}

	public static function admin_page() {
		echo 'Hello Jetpack World';
	}
}
