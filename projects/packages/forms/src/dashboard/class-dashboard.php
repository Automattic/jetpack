<?php
/**
 * Jetpack forms dashboard.
 *
 * @package automattic/jetpack-forms
 */

namespace Automattic\Jetpack\Forms\Dashboard;

use Automattic\Jetpack\Admin_UI\Admin_Menu;
use Automattic\Jetpack\Assets;

/**
 * Handles the Jetpack Forms dashboard.
 */
class Dashboard {

	/**
	 * Priority for the dashboard menu
	 * For Jetpack sites: Jetpack uses 998 and 'Admin_Menu' uses 1000, so we need to use 999.
	 * For simple site: the value is overriden in a child class with value 100000 to wait for all menus to be registered.
	 *
	 * @var int
	 */
	const MENU_PRIORITY = 999;

	/**
	 * Initialize the dashboard.
	 */
	public function init() {
		add_action( 'admin_menu', array( $this, 'add_admin_submenu' ), self::MENU_PRIORITY );
		add_action( 'admin_enqueue_scripts', array( $this, 'load_admin_scripts' ) );
	}

	/**
	 * Load JavaScript for the dashboard.
	 *
	 * @param string $hook The current admin page.
	 */
	public function load_admin_scripts( $hook ) {
		if ( 'jetpack_page_jetpack-forms' !== $hook ) {
			return;
		}

		Assets::register_script(
			'jp-forms-dashboard',
			'../../dist/dashboard/jetpack-forms-dashboard.js',
			__FILE__,
			array(
				'in_footer'  => true,
				'textdomain' => 'jetpack-forms',
				'enqueue'    => true,
			)
		);
	}

	/**
	 * Register the dashboard admin submenu.
	 */
	public function add_admin_submenu() {
		Admin_Menu::add_menu(
			__( 'Jetpack Forms', 'jetpack-forms' ),
			_x( 'Jetpack Forms', 'product name shown in menu', 'jetpack-forms' ),
			'read',
			'jetpack-forms',
			array( $this, 'render_dashboard' ),
			100
		);
	}

	/**
	 * Render the dashboard.
	 */
	public function render_dashboard() {
		?>
		<div id="jp-forms-dashboard" style="min-height: calc(100vh - 100px);"></div>
		<?php
	}
}
