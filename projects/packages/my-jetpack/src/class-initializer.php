<?php
/**
 * WP Admin page with information and configuration shared among all Jetpack stand-alone plugins
 *
 * @package automattic/my-jetpack
 */

namespace Automattic\Jetpack\My_Jetpack;

use Automattic\Jetpack\Admin_UI\Admin_Menu;
use Automattic\Jetpack\Assets;

/**
 * The main Initializer class that registers the admin menu and eneuque the assets.
 */
class Initializer {

	/**
	 * Initialize My Jetapack
	 *
	 * @return void
	 */
	public static function init() {
		if ( did_action( 'my_jetpack_init' ) ) {
			return;
		}

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

		/**
		 * Fires after the My Jetpack package is initialized
		 *
		 * @since $$next_version$$
		 */
		do_action( 'my_jetpack_init' );
	}

	/**
	 * Callback for the load my jetpack page hook.
	 *
	 * @return void
	 */
	public static function admin_init() {
		add_action( 'admin_enqueue_scripts', array( __CLASS__, 'enqueue_scritps' ) );
	}

	/**
	 * Enqueue admin page assets.
	 *
	 * @return void
	 */
	public static function enqueue_scritps() {
		Assets::register_script(
			'my_jetpack_main_app',
			'../build/index.js',
			__FILE__,
			array(
				'enqueue'    => true,
				'in_footer'  => true,
				'textdomain' => 'jetpack',
			)
		);
	}

	/**
	 * Echos the admin page content.
	 *
	 * @return void
	 */
	public static function admin_page() {
		echo '<div id="my-jetpack-container" class="wrap"></div>';
	}
}
