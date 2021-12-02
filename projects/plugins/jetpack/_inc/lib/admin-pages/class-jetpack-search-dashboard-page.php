<?php
/**
 * A class that adds a search dashboard to wp-admin.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Assets;
use Automattic\Jetpack\Status;

/**
 * Requires files needed.
 */
require_once JETPACK__PLUGIN_DIR . '_inc/lib/admin-pages/class.jetpack-admin-page.php';
require_once JETPACK__PLUGIN_DIR . '_inc/lib/admin-pages/class-jetpack-redux-state-helper.php';

/**
 * Responsible for adding a search dashboard to wp-admin.
 *
 * @package Automattic\Jetpack\Search
 */
class Jetpack_Search_Dashboard_Page extends Jetpack_Admin_Page {
	/**
	 * Show the settings page only when Jetpack is connected or in dev mode.
	 *
	 * @var bool If the page should be shown.
	 */
	protected $dont_show_if_not_active = true;

	/**
	 * Add page specific actions given the page hook.
	 *
	 * @param {object} $hook The page hook.
	 */
	public function add_page_actions( $hook ) {}// phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable

	/**
	 * Create a menu item for the page and returns the hook.
	 */
	public function get_page_hook() {

		if ( ! $this->should_add_sub_menu() ) {
			return;
		}
		return add_submenu_page(
			'jetpack',
			__( 'Search Settings', 'jetpack' ),
			_x( 'Search', 'product name shown in menu', 'jetpack' ),
			'manage_options',
			'jetpack-search',
			array( $this, 'render' ),
			$this->get_link_offset()
		);
	}

	/**
	 * Enqueue and localize page specific scripts
	 */
	public function page_admin_scripts() {
		$this->load_admin_scripts();
	}

	/**
	 * Override render funtion
	 */
	public function render() {
		$this->page_render();
	}

	/**
	 * Render Search setting elements
	 */
	public function page_render() {
		?>
		<div id="jp-search-dashboard" class="jp-search-dashboard">
			<div class="hide-if-js"><?php esc_html_e( 'Your Search dashboard requires JavaScript to function properly.', 'jetpack' ); ?></div>
		</div>
		<?php
	}

	/**
	 * Test whether we should show Search menu.
	 *
	 * @return {boolean} Show search sub menu or not.
	 */
	protected function should_add_sub_menu() {
		return method_exists( 'Jetpack_Plan', 'supports' ) && Jetpack_Plan::supports( 'search' );
	}

	/**
	 * Place the Jetpack Search menu item at the bottom of the Jetpack submenu.
	 *
	 * @return int Menu offset.
	 */
	private function get_link_offset() {
		global $submenu;
		return count( $submenu['jetpack'] );
	}

	/**
	 * Enqueue admin styles.
	 */
	public function load_admin_styles() {
		$this->load_admin_scripts();
	}

	/**
	 * Enqueue admin scripts.
	 */
	public function load_admin_scripts() {
		\Jetpack_Admin_Page::load_wrapper_styles();

		if ( ! ( new Status() )->is_offline_mode() && Jetpack::is_connection_ready() ) {
			// Required for Analytics.
			Automattic\Jetpack\Tracking::register_tracks_functions_scripts( true );
		}

		Assets::register_script(
			'jp-search-dashboard',
			'_inc/build/search-dashboard.js',
			JETPACK__PLUGIN_FILE,
			array(
				'in_footer'  => true,
				'textdomain' => 'jetpack',
			)
		);
		Assets::enqueue_script( 'jp-search-dashboard' );

		// Add objects to be passed to the initial state of the app.
		// Use wp_add_inline_script instead of wp_localize_script, see https://core.trac.wordpress.org/ticket/25280.
		wp_add_inline_script(
			'jp-search-dashboard',
			'var Initial_State=JSON.parse(decodeURIComponent("' . rawurlencode( wp_json_encode( \Jetpack_Redux_State_Helper::get_initial_state() ) ) . '"));',
			'before'
		);
	}
}
