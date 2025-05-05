<?php
/**
 * A class that adds a subscribers dashboard to wp-admin.
 *
 * @package automattic/jetpack-subscribers
 */

namespace Automattic\Jetpack\Subscribers_Dashboard;

use Automattic\Jetpack\Admin_UI\Admin_Menu;
use Automattic\Jetpack\Assets;
use Automattic\Jetpack\Status\Host;

/**
 * Responsible for adding a subscribers dashboard to wp-admin.
 *
 * @package jetpack-subscribers
 */
class Dashboard {
	const VERSION = '0.1.9';
	/**
	 * Whether the class has been initialized
	 *
	 * @var boolean
	 */
	private static $initialized = false;

	/**
	 * Whether the menu was added.
	 *
	 * @var boolean
	 */
	private static $menu_added = false;

	/**
	 * Priority for the dashboard menu
	 * For Jetpack sites: Jetpack uses 998 and 'Admin_Menu' uses 1000, so we need to use 999.
	 * For simple site: the value is overriden in a child class with value 100000 to wait for all menus to be registered.
	 *
	 * @var int
	 */
	protected $menu_priority = 999;

	/**
	 * Init Stats dashboard.
	 */
	public static function init() {
		if ( ! self::$initialized ) {
			self::$initialized = true;
			( new self() )->init_hooks();
		}
	}

	/**
	 * Initialize the hooks.
	 */
	public function init_hooks() {
		self::$initialized = true;
		// Jetpack uses 998 and 'Admin_Menu' uses 1000.
		add_action( 'admin_menu', array( $this, 'add_wp_admin_submenu' ), $this->menu_priority );
	}

	/**
	 * The page to be added to submenu
	 */
	public function add_wp_admin_submenu() {
		if ( ! apply_filters( 'jetpack_wp_admin_subscriber_management_enabled', false ) || self::$menu_added ) {
			return;
		}

		$page_suffix = null;
		if ( ( new Host() )->is_wpcom_platform() ) {
			$page_suffix = add_submenu_page( 'users.php', __( 'Subscribers', 'jetpack-subscribers-dashboard' ), __( 'Subscribers', 'jetpack-subscribers-dashboard' ), 'manage_options', 'subscribers', array( $this, 'render' ) );
		} else {
			$page_suffix = Admin_Menu::add_menu(
				__( 'Subscribers', 'jetpack-subscribers-dashboard' ),
				_x( 'Subscribers', 'product name shown in menu', 'jetpack-subscribers-dashboard' ),
				'manage_options',
				'subscribers',
				array( $this, 'render' )
			);
		}

		if ( $page_suffix ) {
			add_action( 'load-' . $page_suffix, array( $this, 'admin_init' ) );
			self::$menu_added = true;
		}
	}

	/**
	 * Override render funtion
	 */
	public function render() {
		echo '<div id="jetpack-subscribers-dashboard"></div>';
	}

	/**
	 * Initialize the admin resources.
	 */
	public function admin_init() {
		add_action( 'admin_enqueue_scripts', array( $this, 'load_admin_scripts' ) );
	}

	/**
	 * Load the admin scripts.
	 */
	public function load_admin_scripts() {
		Assets::register_script(
			'jetpack-subscribers-dashboard',
			'../build/index.js',
			__FILE__,
			array(
				'in_footer'  => true,
				'textdomain' => 'jetpack-subscribers-dashboard',
				'enqueue'    => true,
			)
		);
		Assets::enqueue_script( 'jetpack-script-data' );
	}
}
