<?php
/**
 * A class that adds a search dashboard to wp-admin.
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Search;

use Jetpack_Plan;

/**
 * Class Main
 *
 * Responsible for adding a search dashboard to wp-admin.
 *
 * @package Automattic\Jetpack\Search
 */
class Admin_Dashboard {
	/**
	 * The singleton instance of this class.
	 *
	 * @var Admin_Dashboard
	 */
	protected static $instance;

	/**
	 * Get the singleton instance of the class.
	 *
	 * @return Admin_Dashboard
	 */
	public static function instance() {
		if ( ! isset( self::$instance ) ) {
			self::$instance = new Admin_Dashboard();
			self::$instance->init_hooks();
		}

		return self::$instance;
	}

	/**
	 * Adds action hooks.
	 */
	public function init_hooks() {
		add_action( 'admin_menu', array( $this, 'add_submenu_and_scripts' ), 99 );
	}

	/**
	 * Adds an admin sidebar link pointing to the Search page.
	 */
	public function add_submenu_and_scripts() {
		if ( ! $this->should_show_link() ) {
			return;
		}

		// TODO: Set a different submenu parent slug if WPCOM.
		$hook = add_submenu_page(
			'themes.php',
			__( 'Jetpack Search Settings', 'jetpack' ),
			__( 'Jetpack Search', 'jetpack' ),
			'manage_options',
			'jetpack-search',
			array( $this, 'jetpack_search_admin_page' )
		);
		add_action( "admin_print_styles-$hook", array( $this, 'load_admin_styles' ) );
		add_action( "admin_print_scripts-$hook", array( $this, 'load_admin_scripts' ) );
	}

	/**
	 * Prints the dashboard container.
	 *
	 * @access public
	 */
	public function jetpack_search_admin_page() {
		$protocol   = is_ssl() ? 'https' : 'http';
		$static_url = apply_filters( 'jetpack_static_url', "{$protocol}://en.wordpress.com/i/loading/loading-64.gif" );
		?>
			<div id="jp-search-dashboard" class="jp-search-dashboard">
				<p class="hide-if-no-js"><img width="32" height="32" alt="<?php esc_attr_e( 'Loading&hellip;', 'jetpack' ); ?>" src="<?php echo esc_url( $static_url ); ?>" /></p>
				<p class="hide-if-js"><?php esc_html_e( 'Your Search dashboard requires JavaScript to function properly.', 'jetpack' ); ?><br />
			</div>
		<?php
	}

	/**
	 * Enqueue admin styles.
	 */
	public function load_admin_styles() {
		wp_enqueue_style(
			'jp-search-dashboard',
			plugins_url( '_inc/build/search-dashboard.css', JETPACK__PLUGIN_FILE ),
			array(),
			JETPACK__VERSION,
			true
		);
	}

	/**
	 * Enqueue admin scripts.
	 */
	public function load_admin_scripts() {
		$script_deps_path    = JETPACK__PLUGIN_DIR . '_inc/build/search-dashboard.asset.php';
		$script_dependencies = array( 'react', 'react-dom', 'wp-polyfill' );
		if ( file_exists( $script_deps_path ) ) {
			$asset_manifest      = include $script_deps_path;
			$script_dependencies = $asset_manifest['dependencies'];
		}

		wp_enqueue_script(
			'jp-search-dashboard',
			plugins_url( '_inc/build/search-dashboard.js', JETPACK__PLUGIN_FILE ),
			$script_dependencies,
			JETPACK__VERSION,
			true
		);
	}

	/**
	 * Determine if the link should appear in the sidebar.
	 *
	 * @return boolean
	 */
	private function should_show_link() {
		return Jetpack_Plan::supports( 'search' );
	}
}
