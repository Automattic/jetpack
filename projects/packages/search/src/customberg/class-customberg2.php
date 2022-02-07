<?php
/**
 * A class that adds a search customization interface to wp-admin.
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

use Automattic\Jetpack\Assets;
use Automattic\Jetpack\Status;
use Automattic\Jetpack\Tracking;
use Jetpack;
use Jetpack_Plan;

/**
 * Responsible for adding a search customization interface to wp-admin.
 *
 * Note that this has been temporarily renamed Customberg2 in order to avoid namespace conflicts
 * with the existing Customberg class that may temporarily co-exist on WPCOM.
 *
 * TODO: Rename back to "Customberg" following WPCOM release.
 *
 * @package Automattic\Jetpack\Search
 */
class Customberg2 {
	/**
	 * The singleton instance of this class.
	 *
	 * @var Customberg2
	 */
	protected static $instance;

	/**
	 * Get the singleton instance of the class.
	 *
	 * @return Customberg2
	 */
	public static function instance() {
		if ( ! isset( self::$instance ) ) {
			self::$instance = new static();
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
			__( 'Search Settings', 'jetpack-search-pkg' ),
			__( 'Search', 'jetpack-search-pkg' ),
			'manage_options', // Must be an admin.
			'jetpack-search-configure',
			array( $this, 'jetpack_search_admin_page' )
		);

		add_action( "admin_print_scripts-$hook", array( $this, 'load_assets' ) );
		add_action( 'admin_footer', array( 'Automattic\Jetpack\Search\Helper', 'print_instant_search_sidebar' ) );
	}

	/**
	 * Prints the dashboard container.
	 */
	public function jetpack_search_admin_page() {
		// TODO: Spin this function off into a static helper function in a helper class for code reuse.
		$static_url = apply_filters( 'jetpack_static_url', '//en.wordpress.com/i/loading/loading-64.gif' );
		?>
			<div id="jp-search-configure" class="jp-search-configure-dashboard" style="height: calc(100vh - 100px);">
				<div class="hide-if-no-js" style="height: 100%;">
					<img class="jp-search-loader" width="32" height="32" alt="<?php esc_attr_e( 'Loading&hellip;', 'jetpack-search-pkg' ); ?>" src="<?php echo esc_url( $static_url ); ?>" style="
						position: absolute;
						left: 50%;
						top: 50%;
					"/>
				</div>
				<div class="hide-if-js"><?php esc_html_e( 'Your Search customization page requires JavaScript to function properly.', 'jetpack-search-pkg' ); ?></div>
			</div>
		<?php
	}

	/**
	 * Loads assets for the customization experience.
	 */
	public function load_assets() {
			$this->load_assets_with_parameters( constant( 'JETPACK_SEARCH_PKG__DIR' ) );
	}

	/**
	 * Loads script and style assets according to parameters provided.
	 *
	 * @param string $package_base_path - Base path for the search package.
	 */
	public function load_assets_with_parameters( $package_base_path ) {
		Tracking::register_tracks_functions_scripts( true );

		Assets::register_script(
			'jp-search-configure',
			'build/customberg/jp-search-configure.js',
			$package_base_path . '/src', // A full path to a file or a directory inside a plugin.
			array(
				'css_dependencies' => array(
					'wp-components',
					'wp-block-editor',
				),
				'in_footer'        => true,
				'textdomain'       => 'jetpack-search-pkg',
			)
		);
		Assets::enqueue_script( 'jp-search-configure' );

		// Use wp_add_inline_script instead of wp_localize_script, see https://core.trac.wordpress.org/ticket/25280.
		wp_add_inline_script( 'jp-search-configure', 'var JetpackInstantSearchOptions=JSON.parse(decodeURIComponent("' . rawurlencode( wp_json_encode( Helper::generate_initial_javascript_state() ) ) . '"));', 'before' );
		wp_add_inline_script(
			'jp-search-configure',
			"window.jetpackSearchConfigureInit( 'jp-search-configure' )"
		);
	}

	/**
	 * Determine if the requisite page should be added to wp-admin.
	 *
	 * @return boolean
	 */
	protected function should_add_page() {
		$is_offline_mode = ( new Status() )->is_offline_mode();
		return (
			! $is_offline_mode && // Must be online.
			Jetpack::is_connection_ready() && // Must be connected.
			method_exists( 'Jetpack_Plan', 'supports' ) && Jetpack_Plan::supports( 'search' ) // Must have plan supporting Jetpack (Instant) Search.
		);
	}
}
