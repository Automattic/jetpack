<?php
/**
 * Jetpack forms dashboard.
 *
 * @package automattic/jetpack-forms
 */

namespace Automattic\Jetpack\Forms\Dashboard;

use Automattic\Jetpack\Assets;

/**
 * Handles the Jetpack Forms dashboard.
 */
class Dashboard {

	/**
	 * Priority for the dashboard menu.
	 * Needs to be high enough for us to be able to unregister the default edit.php menu item.
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
		if ( 'toplevel_page_jetpack-forms' !== $hook ) {
			return;
		}

		Assets::register_script(
			'jp-forms-dashboard',
			'../../dist/dashboard/jetpack-forms-dashboard.js',
			__FILE__,
			array(
				'in_footer'    => true,
				'textdomain'   => 'jetpack-forms',
				'enqueue'      => true,
				'dependencies' => array( 'wp-api-fetch' ), // this here just for testing, remove when done (apiFetch will be on build)
			)
		);

		$api_root = defined( 'IS_WPCOM' ) && IS_WPCOM
			? sprintf( '/wpcom/v2/sites/%s/', esc_url_raw( rest_url() ) ) // should we include full URL here (public-api.wordpress.com)?
			: '/wp-json/wpcom/v2/';

		wp_add_inline_script(
			'jp-forms-dashboard',
			'window.jetpackFormsData = ' . wp_json_encode( array( 'apiRoot' => $api_root ) ) . ';',
			'before'
		);
	}

	/**
	 * Register the dashboard admin submenu.
	 */
	public function add_admin_submenu() {
		remove_menu_page( 'feedback' );

		add_menu_page(
			__( 'Form Responses', 'jetpack-forms' ),
			_x( 'Feedback', 'post type name shown in menu', 'jetpack-forms' ),
			'read',
			'jetpack-forms',
			array( $this, 'render_dashboard' ),
			'dashicons-feedback',
			25 // Places 'Feedback' under 'Comments' in the menu
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
