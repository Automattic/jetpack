<?php
/**
 * The admin-specific functionality of the plugin.
 *
 * @since      1.0.0
 * @package    automattic/jetpack-boost
 */

namespace Automattic\Jetpack_Boost\Admin;

use Automattic\Jetpack\Admin_UI\Admin_Menu;
use Automattic\Jetpack\Assets;
use Automattic\Jetpack\Boost_Speed_Score\Speed_Score;
use Automattic\Jetpack\My_Jetpack\Initializer as My_Jetpack_Initializer;
use Automattic\Jetpack_Boost\Lib\Analytics;
use Automattic\Jetpack_Boost\Lib\Environment_Change_Detector;
use Automattic\Jetpack_Boost\Lib\Premium_Features;
use Automattic\Jetpack_Boost\Modules\Modules_Setup;

class Admin {
	/**
	 * Menu slug.
	 */
	const MENU_SLUG = 'jetpack-boost';

	public function init( Modules_Setup $modules ) {
		Environment_Change_Detector::init();

		// Initiate speed scores.
		new Speed_Score( $modules->get_ready_active_optimization_modules(), 'boost-plugin' );

		add_action( 'init', array( new Analytics(), 'init' ) );
		add_filter( 'plugin_action_links_' . JETPACK_BOOST_PLUGIN_BASE, array( $this, 'plugin_page_settings_link' ) );
		add_action( 'admin_menu', array( $this, 'handle_admin_menu' ), 1 ); // Akismet uses 4, so we use 1 to ensure both menus are added when only they exist.
	}

	public function handle_admin_menu() {
		/**
		 * Filters the number of problems shown in the Boost sidebar menu
		 *
		 * @param int $count the number of problems shown.
		 *
		 * @since   1.0.0
		 */
		$total_problems = apply_filters( 'jetpack_boost_total_problem_count', 0 );
		$menu_label     = _x( 'Boost', 'The Jetpack Boost product name, without the Jetpack prefix', 'jetpack-boost' );
		if ( $total_problems ) {
			$menu_label .= sprintf( ' <span class="menu-counter count-%d"><span class="count">%d</span></span>', $total_problems, $total_problems );
		}

		$page_suffix = Admin_Menu::add_menu(
			__( 'Jetpack Boost - Settings', 'jetpack-boost' ),
			$menu_label,
			'manage_options',
			JETPACK_BOOST_SLUG,
			array( $this, 'render_settings' ),
			2
		);
		add_action( 'load-' . $page_suffix, array( $this, 'admin_init' ) );
	}

	/**
	 * Enqueue scripts and styles for the admin page.
	 */
	public function admin_init() {
		// Clear premium features cache when the plugin settings page is loaded.
		Premium_Features::clear_cache();

		add_action( 'admin_enqueue_scripts', array( My_Jetpack_Initializer::class, 'enqueue_scripts' ) );
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_scripts' ) );
	}

	/**
	 * Register the JavaScript for the admin area.
	 *
	 * @since    1.0.0
	 */
	public function enqueue_scripts() {
		/**
		 * Filters the internal path to the distributed assets used by the plugin
		 *
		 * @param string $path the path to the assets
		 */
		$internal_path = apply_filters( 'jetpack_boost_asset_internal_path', 'app/assets/dist/' );

		$admin_js_handle = 'jetpack-boost-admin';

		$admin_js_dependencies = array(
			'wp-i18n',
			'wp-components',
			'my_jetpack_main_app',
		);

		Assets::register_script(
			$admin_js_handle,
			$internal_path . 'jetpack-boost.js',
			JETPACK_BOOST_PATH,
			array(
				'dependencies' => $admin_js_dependencies,
				'in_footer'    => true,
				'textdomain'   => 'jetpack-boost',
				'css_path'     => $internal_path . 'jetpack-boost.css',
			)
		);

		wp_localize_script(
			$admin_js_handle,
			'Jetpack_Boost',
			( new Config() )->constants()
		);

		Assets::enqueue_script( $admin_js_handle );
	}

	/**
	 * Get settings link.
	 *
	 * @param array $links the array of links.
	 */
	public function plugin_page_settings_link( $links ) {
		$settings_link = '<a href="' . admin_url( 'admin.php?page=jetpack-boost' ) . '">' . esc_html__( 'Settings', 'jetpack-boost' ) . '</a>';
		array_unshift( $links, $settings_link );

		return $links;
	}

	/**
	 * Generate the settings page.
	 */
	public function render_settings() {
		wp_localize_script(
			'jetpack-boost-admin',
			'wpApiSettings',
			array(
				'root'  => esc_url_raw( rest_url() ),
				'nonce' => wp_create_nonce( 'wp_rest' ),
			)
		);
		?>
		<div id="jb-admin-settings"></div>
		<?php
	}
}
