<?php
/**
 * WP Admin page with information and configuration shared among all Jetpack stand-alone plugins
 *
 * @package automattic/my-jetpack
 */

namespace Automattic\Jetpack\My_Jetpack;

use Automattic\Jetpack\Admin_UI\Admin_Menu;

/**
 * The main My_Jetpack class that registers the admin menu and eneuque the assets.
 */
class My_Jetpack {

	/**
	 * Whether My Jetpack was already initialized.
	 *
	 * @var boolean
	 */
	private static $initialized = false;

	/**
	 * Initialize My Jetapack
	 *
	 * @return void
	 */
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
		$build_assets = require_once __DIR__ . '/../build/index.asset.php';
		wp_enqueue_script( 'my_jetpack_main_app', plugin_dir_url( __DIR__ ) . 'build/index.js', $build_assets['dependencies'], $build_assets['version'], true );
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
