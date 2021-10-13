<?php
/**
 * Jetpack Search: Dashboard class
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

use Automattic\Jetpack\Admin_UI\Admin_Menu;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Used to render the Search dashboard.
 */
class Dashboard {
	/**
	 * Constructor.
	 */
	public function __construct() {
		$page_suffix = Admin_Menu::add_menu(
			__( 'Search 2', 'jetpack-search' ),
			__( 'Search 2', 'jetpack-search' ),
			'manage_options',
			'jetpack-search-2',
			array( $this, 'render_dashboard_root' ),
			99
		);
		add_action( 'load-' . $page_suffix, array( $this, 'enqueue_assets' ) );
	}

	/**
	 * Main plugin settings page.
	 */
	public function render_dashboard_root() {
		?>
			<div id="jp-search-dashboard" class="jp-search-dashboard">
				<div class="hide-if-js">
					<?php esc_html_e( 'Your Search dashboard requires JavaScript to function properly.', 'jetpack' ); ?>
				</div>
			</div>
		<?php
	}

	/**
	 * Enqueue scripts and styles for the dashboard page.
	 */
	public function enqueue_assets() {
		wp_enqueue_style(
			'jp-search-dashboard',
			plugins_url( 'build/dashboard.css', __DIR__ ),
			array(),
			JETPACK__VERSION
		);

		$script_deps_path    = dirname( __DIR__ ) . '/build/dashboard.asset.php';
		$script_dependencies = array( 'react', 'react-dom', 'wp-polyfill' );
		if ( file_exists( $script_deps_path ) ) {
			$asset_manifest      = require_once $script_deps_path;
			$script_dependencies = $asset_manifest['dependencies'];
		}

		// TODO: Reimplement in package context.
		// if ( ! ( new \Automattic\Jetpack\Status() )->is_offline_mode() && \Jetpack::is_connection_ready() ) {
		// 	// Required for Analytics.
		// 	\Automattic\Jetpack\Tracking::register_tracks_functions_scripts( true );
		// }

		wp_enqueue_script(
			'jp-search-dashboard',
			plugins_url( 'build/dashboard.js', __DIR__ ),
			$script_dependencies,
			JETPACK__VERSION,
			true
		);

		// Add objects to be passed to the initial state of the app.
		// Use wp_add_inline_script instead of wp_localize_script, see https://core.trac.wordpress.org/ticket/25280.
		wp_add_inline_script(
			'jp-search-dashboard',
			'var Initial_State=JSON.parse(decodeURIComponent("' . rawurlencode( wp_json_encode( \Jetpack_Redux_State_Helper::get_initial_state() ) ) . '"));',
			'before'
		);

		wp_set_script_translations( 'jp-search-dashboard', 'jetpack' );
	}
}
