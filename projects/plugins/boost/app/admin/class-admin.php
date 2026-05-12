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

	/**
	 * Filter name that gates the wp-build–based dashboard.
	 *
	 * When this filter returns true, "Boost" renders the new wp-build
	 * dashboard (Overview + Settings tabs) instead of the legacy React app.
	 */
	const MODERNIZATION_FILTER = 'rsm_jetpack_ui_modernization_boost';

	public function init( Modules_Setup $modules ) {
		Environment_Change_Detector::init();

		// Initiate speed scores.
		new Speed_Score( $modules->get_ready_active_optimization_modules(), 'boost-plugin' );

		add_action( 'init', array( new Analytics(), 'init' ) );
		add_filter( 'plugin_action_links_' . JETPACK_BOOST_PLUGIN_BASE, array( $this, 'plugin_page_settings_link' ) );

		// Defer wp-build loading to admin_menu (priority 1) on every host. The
		// modernization filter — which third parties typically register from a
		// plugins_loaded callback — needs to have been applied before we read
		// it, and the wp-build render function needs to be defined before
		// handle_admin_menu (also priority 1) runs. Registering this first
		// guarantees order at the same priority.
		add_action( 'admin_menu', array( __CLASS__, 'maybe_load_wp_build' ), 1 );
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
		$menu_label     = 'Boost'; // "Boost" is a product name, do not translate.
		if ( $total_problems ) {
			$menu_label .= sprintf( ' <span class="menu-counter count-%d"><span class="count">%d</span></span>', $total_problems, $total_problems );
		}

		$callback = self::is_modernized() && function_exists( 'jetpack_boost_jetpack_boost_dashboard_wp_admin_render_page' )
			? 'jetpack_boost_jetpack_boost_dashboard_wp_admin_render_page'
			: array( $this, 'render_settings' );

		$page_suffix = Admin_Menu::add_menu(
			__( 'Jetpack Boost - Settings', 'jetpack-boost' ),
			$menu_label,
			'manage_options',
			JETPACK_BOOST_SLUG,
			$callback,
			2
		);
		add_action( 'load-' . $page_suffix, array( $this, 'admin_init' ) );
	}

	/**
	 * Load wp-build for the Boost admin page when modernization is enabled.
	 *
	 * Hooked to `admin_menu` priority 1 so the modernization filter has been
	 * registered by any opt-in code (mu-plugins, snippets, themes) before we
	 * read it, and so the wp-build render function and enqueue hook are in
	 * place before `handle_admin_menu` runs at the same priority.
	 *
	 * @return void
	 */
	public static function maybe_load_wp_build() {
		if ( ! self::is_modernized() || ! self::is_boost_admin_request() ) {
			return;
		}

		self::load_wp_build();
		add_action( 'current_screen', array( __CLASS__, 'alias_screen_id_for_wp_build' ) );
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
		// This callback is registered via `load-{$page_suffix}` in
		// `handle_admin_menu()`, so it only fires on the Boost admin page —
		// no need to re-check the page here.
		if ( self::is_modernized() ) {
			// wp-build manages its own enqueue pipeline. The legacy Boost
			// script, localized config, and My Jetpack dependency are
			// intentionally skipped for the wp-build dashboard.
			return;
		}

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

	/**
	 * Load the wp-build entry file and register its polyfills.
	 *
	 * Only called on `?page=jetpack-boost` admin requests when the
	 * modernization filter is enabled. Keeps wp-build off every other request.
	 *
	 * @return void
	 */
	private static function load_wp_build() {
		$build_index = plugin_dir_path( JETPACK_BOOST_PATH ) . 'build/build.php';

		if ( ! file_exists( $build_index ) ) {
			return;
		}

		require_once $build_index;

		if ( ! class_exists( '\Automattic\Jetpack\WP_Build_Polyfills\WP_Build_Polyfills' ) ) {
			return;
		}

		\Automattic\Jetpack\WP_Build_Polyfills\WP_Build_Polyfills::register(
			'jetpack-boost',
			array_merge(
				\Automattic\Jetpack\WP_Build_Polyfills\WP_Build_Polyfills::SCRIPT_HANDLES,
				\Automattic\Jetpack\WP_Build_Polyfills\WP_Build_Polyfills::MODULE_IDS
			)
		);
	}

	/**
	 * Alias the current screen ID to satisfy wp-build's auto-generated enqueue check.
	 *
	 * Wp-build's `<page>-wp-admin` enqueue callback enqueues only when the
	 * screen ID matches the wp-build page slug (`jetpack-boost-dashboard`).
	 * Our wp-admin menu slug stays `jetpack-boost`, so we mutate the screen
	 * object in place to make the check pass without changing the URL.
	 *
	 * Hooked only when modernization is on AND we're on the Boost admin
	 * page, so this never affects any other request.
	 *
	 * @param \WP_Screen|null $screen The current screen object (passed by WP).
	 * @return void
	 */
	public static function alias_screen_id_for_wp_build( $screen ) {
		if ( ! is_object( $screen ) ) {
			return;
		}

		$screen->id = 'jetpack-boost-dashboard';
	}

	/**
	 * Returns true when the wp-build modernization filter is enabled.
	 *
	 * @return bool
	 */
	private static function is_modernized() {
		return (bool) apply_filters( self::MODERNIZATION_FILTER, false );
	}

	/**
	 * Returns true when the current request targets the Boost admin page.
	 *
	 * Used to scope wp-build loading to the one page that needs it. The
	 * `$_GET['page']` value is populated by wp-admin/admin.php before any
	 * of our hooks fire, so this check is reliable from `init()` onwards.
	 *
	 * @return bool
	 */
	private static function is_boost_admin_request() {
		if ( ! is_admin() || ! isset( $_GET['page'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
			return false;
		}

		return sanitize_text_field( wp_unslash( $_GET['page'] ) ) === self::MENU_SLUG; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
	}
}
