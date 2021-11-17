<?php
/**
 * A class that adds a search dashboard to wp-admin.
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Search;

use Automattic\Jetpack\Status;
use Automattic\Jetpack\Tracking;
use Jetpack;
use Jetpack_Plan;
/**
 * Responsible for adding a search dashboard to wp-admin.
 *
 * @package Automattic\Jetpack\Search
 */
class Dashboard {
	/**
	 * Holding the singleton
	 *
	 * @var Dashboard
	 */
	protected static $instance;

	/**
	 * Get the singleton
	 */
	public static function instance() {
		if ( is_null( static::$instance ) ) {
			static::$instance = new static();
			static::$instance->init_hooks();
		}
		return static::$instance;
	}

	/**
	 * Initialise hooks
	 */
	protected function init_hooks() {
		add_action( 'admin_menu', array( $this, 'add_wp_admin_page' ), 999 );
	}

	/**
	 * The page to be added to submenu
	 */
	public function add_wp_admin_page() {
		$is_offline_mode = ( new Status() )->is_offline_mode();

		// If user is not an admin and site is in Offline Mode or not connected yet then don't do anything.
		if ( ! current_user_can( 'manage_options' ) && ( $is_offline_mode || ! Jetpack::is_connection_ready() ) ) {
			return;
		}

		// Is Jetpack not connected and not offline?
		// True means that Jetpack is NOT connected and NOT in offline mode.
		// If Jetpack is connected OR in offline mode, this will be false.
		$connectable = ! Jetpack::is_connection_ready() && ! $is_offline_mode;

		// Don't add in the modules page unless modules are available!
		if ( $connectable ) {
			return;
		}

		// Check if the site plan changed and deactivate modules accordingly.
		// add_action( 'current_screen', array( $this, 'check_plan_deactivate_modules' ) );.

		if ( ! $this->supports_search() ) {
			return;
		}

		// Attach page specific actions in addition to the above.
		$hook = add_submenu_page(
			'jetpack',
			__( 'Search Settings', 'jetpack' ),
			_x( 'Search', 'product name shown in menu', 'jetpack' ),
			'manage_options',
			'jetpack-search',
			array( $this, 'render' ),
			$this->get_link_offset()
		);

		add_action( "admin_print_styles-$hook", array( $this, 'load_admin_styles' ) );
		add_action( "admin_print_scripts-$hook", array( $this, 'load_admin_scripts' ) );
	}

	/**
	 * Override render funtion
	 */
	public function render() {
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
	protected function supports_search() {
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
		wp_enqueue_style(
			'jp-search-dashboard',
			plugins_url( 'vendor/automattic/jetpack-search/dist/instant-search/jp-search-dashboard-main.min.css', JETPACK__PLUGIN_FILE ),
			array(),
			Helper::get_asset_version( 'vendor/automattic/jetpack-search/dist/instant-search/jp-search-dashboard-main.min.css' )
		);
	}

	/**
	 * Enqueue admin scripts.
	 */
	public function load_admin_scripts() {
		$script_deps_path    = JETPACK__PLUGIN_DIR . 'vendor/automattic/jetpack-search/dist/instant-search/jp-search-dashboard-main.min.asset.php';
		$script_dependencies = array( 'react', 'react-dom', 'wp-polyfill' );
		if ( file_exists( $script_deps_path ) ) {
			$asset_manifest      = include $script_deps_path;
			$script_dependencies = $asset_manifest['dependencies'];
		}

		if ( ! ( new Status() )->is_offline_mode() && Jetpack::is_connection_ready() ) {
			// Required for Analytics.
			Tracking::register_tracks_functions_scripts( true );
		}

		wp_enqueue_script(
			'jp-search-dashboard',
			plugins_url( 'vendor/automattic/jetpack-search/dist/instant-search/jp-search-dashboard-main.min.js', JETPACK__PLUGIN_FILE ),
			$script_dependencies,
			Helper::get_asset_version( 'vendor/automattic/jetpack-search/dist/instant-search/jp-search-dashboard-main.min.js' ),
			true
		);

		// Add objects to be passed to the initial state of the app.
		// Use wp_add_inline_script instead of wp_localize_script, see https://core.trac.wordpress.org/ticket/25280.
		wp_add_inline_script(
			'jp-search-dashboard',
			( new Initial_State() )->render(),
			'before'
		);

		wp_set_script_translations( 'jp-search-dashboard', 'jetpack' );
	}

}
