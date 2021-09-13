<?php
/**
 * A class that adds a search customization interface to wp-admin.
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Search;

use Automattic\Jetpack\Status;
use Automattic\Jetpack\Tracking;
use Jetpack;
use Jetpack_Plan;
use Jetpack_Search_Helpers;

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
			__( 'Search Settings', 'jetpack' ),
			__( 'Search', 'jetpack' ),
			'manage_options', // Must be an admin.
			'jetpack-search-configure',
			array( $this, 'jetpack_search_admin_page' )
		);

		// Only load assets if Customberg is supported.
		if ( $this->wp_supports_customberg() ) {
			add_action( "admin_print_scripts-$hook", array( $this, 'load_assets' ) );
			add_action( 'admin_footer', array( 'Jetpack_Search_Helpers', 'print_instant_search_sidebar' ) );
		} else {
			add_action( "admin_print_scripts-$hook", array( $this, 'add_redirect_if_necessary' ) );
		}
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
					<img class="jp-search-loader" width="32" height="32" alt="<?php esc_attr_e( 'Loading&hellip;', 'jetpack' ); ?>" src="<?php echo esc_url( $static_url ); ?>" style="
						position: absolute;
						left: 50%;
						top: 50%;
					"/>
				</div>
				<div class="hide-if-js"><?php esc_html_e( 'Your Search customization page requires JavaScript to function properly.', 'jetpack' ); ?></div>
			</div>
		<?php
	}

	/**
	 * Redirects to the Customizer if Customberg is not supported by the current host.
	 */
	public function add_redirect_if_necessary() {
		// Add a JS redirect if Customberg is not supported.
		if ( ! $this->wp_supports_customberg() ) {
			?>
				<script>
					window.location.href="<?php echo esc_url( admin_url( 'customize.php?autofocus[section]=jetpack_search' ) ); ?>";
				</script>
			<?php
		}
	}

	/**
	 * Loads assets for the customization experience.
	 */
	public function load_assets() {
		$this->load_assets_with_parameters( '', JETPACK__PLUGIN_FILE );
	}

	/**
	 * Loads script and style assets according to parameters provided.
	 *
	 * @param string $path_prefix - Path prefix for built assets.
	 * @param string $plugin_base_path - Base path for plugin files.
	 */
	public function load_assets_with_parameters( $path_prefix, $plugin_base_path ) {
		$style_relative_path    = $path_prefix . '_inc/build/instant-search/jp-search-configure-main.min.css';
		$manifest_relative_path = $path_prefix . '_inc/build/instant-search/jp-search-configure-main.min.asset.php';
		$script_relative_path   = $path_prefix . '_inc/build/instant-search/jp-search-configure-main.min.js';

		//
		// Load styles.
		\Jetpack_Admin_Page::load_wrapper_styles();
		wp_enqueue_style(
			'jp-search-configure',
			plugins_url( $style_relative_path, $plugin_base_path ),
			array(
				'wp-components',
				'wp-block-editor',
			),
			JETPACK__VERSION
		);

		//
		// Load scripts.
		$manifest_path       = plugin_dir_path( $plugin_base_path ) . $manifest_relative_path;
		$script_dependencies = array();
		if ( file_exists( $manifest_path ) ) {
			$asset_manifest      = include $manifest_path;
			$script_dependencies = $asset_manifest['dependencies'];
		}

		Tracking::register_tracks_functions_scripts( true );

		wp_enqueue_script(
			'jp-search-configure',
			plugins_url( $script_relative_path, $plugin_base_path ),
			$script_dependencies,
			JETPACK__VERSION,
			true
		);
		wp_set_script_translations( 'jp-search-configure', 'jetpack' );

		// Use wp_add_inline_script instead of wp_localize_script, see https://core.trac.wordpress.org/ticket/25280.
		wp_add_inline_script( 'jp-search-configure', 'var JetpackInstantSearchOptions=JSON.parse(decodeURIComponent("' . rawurlencode( wp_json_encode( Jetpack_Search_Helpers::generate_initial_javascript_state() ) ) . '"));', 'before' );
		wp_add_inline_script(
			'jp-search-configure',
			"window.jetpackSearchConfigureInit( 'jp-search-configure' )"
		);
	}

	/**
	 * Determine if the current version of WordPress supports Customberg.
	 *
	 * @return boolean
	 */
	protected function wp_supports_customberg() {
		// Must be WP 5.8 or greater.
		global $wp_version;
		return version_compare( $wp_version, '5.8', '>=' );
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
