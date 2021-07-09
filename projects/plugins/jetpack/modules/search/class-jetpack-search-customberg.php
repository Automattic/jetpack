<?php
/**
 * A class that adds a search customization interface to wp-admin.
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Search;

use Automattic\Jetpack\Tracking;
use Jetpack_Plan;
use Jetpack_Search_Helpers;

require_once JETPACK__PLUGIN_DIR . '_inc/lib/admin-pages/class.jetpack-admin-page.php';
require_once JETPACK__PLUGIN_DIR . '_inc/lib/admin-pages/class-jetpack-redux-state-helper.php';

/**
 * Responsible for adding a search customization interface to wp-admin.
 *
 * @package Automattic\Jetpack\Search
 */
class Jetpack_Search_Customberg {
	/**
	 * The singleton instance of this class.
	 *
	 * @var Jetpack_Search_Customberg
	 */
	protected static $instance;

	/**
	 * Get the singleton instance of the class.
	 *
	 * @return Jetpack_Search_Customberg
	 */
	public static function instance() {
		if ( ! isset( self::$instance ) ) {
			self::$instance = new Jetpack_Search_Customberg();
			self::$instance->init_hooks();
		}

		return self::$instance;
	}

	/**
	 * Adds action hooks.
	 */
	public function init_hooks() {
		add_action( 'admin_menu', array( $this, 'add_wp_admin_page' ), 999 );
	}

	/**
	 * Adds a wp-admin page without adding a sidebar submenu item.
	 */
	public function add_wp_admin_page() {
		if ( ! $this->should_add_page() ) {
			return;
		}

		// Intentionally omits adding a submenu via the first null argument.
		$hook = add_submenu_page(
			null,
			__( 'Search Settings', 'jetpack' ),
			__( 'Search', 'jetpack' ),
			'manage_options',
			'jetpack-search-customize',
			array( $this, 'jetpack_search_admin_page' )
		);
		add_action( "admin_print_scripts-$hook", array( $this, 'load_admin_scripts' ) );
		add_action( "admin_print_styles-$hook", array( $this, 'load_admin_styles' ) );
	}

	/**
	 * Prints the dashboard container.
	 *
	 * @access public
	 */
	public function jetpack_search_admin_page() {
		// TODO: Spin this function off into a static helper function in a helper class for code reuse.
		$static_url = apply_filters( 'jetpack_static_url', '//en.wordpress.com/i/loading/loading-64.gif' );
		?>
			<div id="jp-search-customization" class="jp-search-customization-dashboard">
				<div class="hide-if-no-js"><img class="jp-search-loader" width="32" height="32" alt="<?php esc_attr_e( 'Loading&hellip;', 'jetpack' ); ?>" src="<?php echo esc_url( $static_url ); ?>" /></div>
				<div class="hide-if-js"><?php esc_html_e( 'Your Search customization page requires JavaScript to function properly.', 'jetpack' ); ?><div />
			</div>
		<?php
	}

	/**
	 * Enqueue admin styles.
	 */
	public function load_admin_styles() {
		\Jetpack_Admin_Page::load_wrapper_styles();

		wp_enqueue_style(
			'jp-search-customize',
			plugins_url( '_inc/build/instant-search/jp-search-configure-main.bundle.css', JETPACK__PLUGIN_FILE ),
			array(
				'wp-components',
				'wp-block-editor',
			),
			JETPACK__VERSION
		);
	}

	/**
	 * Enqueue admin scripts.
	 */
	public function load_admin_scripts() {
		$script_deps_path    = JETPACK__PLUGIN_DIR . '_inc/build/instant-search/jp-search-configure-main.bundle.asset.php';
		$script_dependencies = array( 'react', 'wp-i18n', 'wp-polyfill' );
		if ( file_exists( $script_deps_path ) ) {
			$asset_manifest      = include $script_deps_path;
			$script_dependencies = $asset_manifest['dependencies'];
		}

		Tracking::register_tracks_functions_scripts( true );

		wp_enqueue_script(
			'jp-search-customization',
			plugins_url( '_inc/build/instant-search/jp-search-configure-main.bundle.js', JETPACK__PLUGIN_FILE ),
			$script_dependencies,
			JETPACK__VERSION,
			true
		);

		// Use wp_add_inline_script instead of wp_localize_script, see https://core.trac.wordpress.org/ticket/25280.
		wp_add_inline_script( 'jp-search-customization', 'var JetpackInstantSearchOptions=JSON.parse(decodeURIComponent("' . rawurlencode( wp_json_encode( Jetpack_Search_Helpers::generate_initial_javascript_state() ) ) . '"));', 'before' );
		wp_add_inline_script(
			'jp-search-customization',
			"window.jetpackSearchCustomizeInit( 'jp-search-customization' )"
		);

		// Inject valid post type definitions.
		wp_add_inline_script( 'jp-search-customization', 'var JetpackInstantSearchValidPostTypes=JSON.parse(decodeURIComponent("' . rawurlencode( wp_json_encode( get_post_types( array( 'exclude_from_search' => false ), 'objects' ) ) ) . '"));', 'before' );
	}

	/**
	 * Determine if the requisite page should be added to wp-admin.
	 *
	 * @return boolean
	 */
	private function should_add_page() {
		return Jetpack_Plan::supports( 'search' );
	}
}
