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
use Automattic\Jetpack\WP_Build_Polyfills\WP_Build_Polyfills;
use Automattic\Jetpack_Boost\Lib\Analytics;
use Automattic\Jetpack_Boost\Lib\Debug;
use Automattic\Jetpack_Boost\Lib\Environment_Change_Detector;
use Automattic\Jetpack_Boost\Lib\Premium_Features;
use Automattic\Jetpack_Boost\Modules\Modules_Setup;

class Admin {
	/**
	 * Menu slug.
	 */
	const MENU_SLUG = 'jetpack-boost';

	/**
	 * Filter enabling the modern dashboard.
	 */
	const MODERNIZATION_FILTER = 'rsm_jetpack_ui_modernization_boost';

	/**
	 * Whether this request loaded the modern dashboard.
	 *
	 * @var bool
	 */
	private $modern_dashboard_loaded = false;

	public function init( Modules_Setup $modules ) {
		Environment_Change_Detector::init();

		// Initiate speed scores.
		new Speed_Score( $modules->get_ready_active_optimization_modules(), 'boost-plugin' );

		add_action( 'init', array( new Analytics(), 'init' ) );
		add_filter( 'plugin_action_links_' . JETPACK_BOOST_PLUGIN_BASE, array( $this, 'plugin_page_settings_link' ) );
		add_action( 'admin_menu', array( $this, 'handle_admin_menu' ), 1 ); // Akismet uses 4, so we use 1 to ensure both menus are added when only they exist.
	}

	public function handle_admin_menu() {
		$this->maybe_load_wp_build();

		/**
		 * Filters the number of problems shown in the Boost sidebar menu
		 *
		 * @param int $count the number of problems shown.
		 *
		 * @since   1.0.0
		 */
		// Only report the count to users who can actually reach the Boost menu
		// (added below with the 'manage_options' cap). Otherwise the central
		// menu-badges total would include problems the current user can't see.
		if ( current_user_can( 'manage_options' ) ) {
			$total_problems = apply_filters( 'jetpack_boost_total_problem_count', 0 );
			\Automattic\Jetpack\Menu_Badges\Menu_Badges::init(); // idempotent; wires the renderer.
			\Automattic\Jetpack\Menu_Badges\Notification_Counts::register(
				'jetpack-boost',
				array(
					'menu_slug' => JETPACK_BOOST_SLUG,
					'count'     => (int) $total_problems,
					'type'      => 'count',
				)
			);
		}

		$page_suffix = Admin_Menu::add_menu(
			__( 'Jetpack Boost - Settings', 'jetpack-boost' ),
			'Boost', // "Boost" is a product name, do not translate.
			'manage_options',
			JETPACK_BOOST_SLUG,
			$this->modern_dashboard_loaded ? 'jetpack_boost_jetpack_boost_dashboard_wp_admin_render_page' : array( $this, 'render_settings' ),
			null,
			array(
				'product' => 'boost',
				'key'     => JETPACK_BOOST_SLUG,
			)
		);
		add_action( 'load-' . $page_suffix, array( $this, 'admin_init' ) );
	}

	/**
	 * Load the modern dashboard only on an opted-in Boost admin request.
	 */
	private function maybe_load_wp_build() {
		/**
		 * Enable the modern Boost dashboard.
		 *
		 * @since $$next-version$$
		 * @param bool $enabled Whether to enable the modern dashboard. Default false.
		 */
		if ( ! apply_filters( self::MODERNIZATION_FILTER, false ) || ! is_admin() ) {
			return;
		}

		// phpcs:ignore WordPress.Security.NonceVerification.Recommended
		$page = isset( $_GET['page'] ) ? sanitize_text_field( wp_unslash( $_GET['page'] ) ) : '';
		if ( JETPACK_BOOST_SLUG !== $page || ! $this->dashboard_build_is_available() ) {
			return;
		}

		WP_Build_Polyfills::register(
			'jetpack-boost',
			array_merge( WP_Build_Polyfills::SCRIPT_HANDLES, WP_Build_Polyfills::MODULE_IDS )
		);

		// wp_default_scripts has already fired by admin_menu, so register the init module now.
		jetpack_boost_register_script_modules(); // @phan-suppress-current-line PhanUndeclaredFunction -- Defined by the generated build and checked in dashboard_build_is_available().
		add_action( 'current_screen', array( $this, 'alias_screen_id_for_wp_build' ) );
		$this->modern_dashboard_loaded = true;
	}

	/**
	 * Load the generated dashboard, retaining the legacy page when assets are absent.
	 *
	 * @return bool Whether the generated dashboard is available.
	 */
	private function dashboard_build_is_available() {
		$build_file = JETPACK_BOOST_DIR_PATH . '/build/build.php';
		if ( ! file_exists( $build_file ) ) {
			Debug::log( 'Modern dashboard build is missing; loading the legacy dashboard.' );
			return false;
		}

		require_once $build_file;

		return function_exists( 'jetpack_boost_register_script_modules' )
			&& function_exists( 'jetpack_boost_jetpack_boost_dashboard_wp_admin_render_page' );
	}

	/**
	 * Match wp-build's enqueue screen without changing the Boost menu URL.
	 *
	 * @param \WP_Screen|null $screen Current screen.
	 */
	public function alias_screen_id_for_wp_build( $screen ) {
		if ( is_object( $screen ) ) {
			$screen->id = 'jetpack-boost-dashboard';
		}
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

		if ( $this->modern_dashboard_loaded ) {
			$this->localize_api_settings( $admin_js_handle );
			$i18n_loader_registered = wp_script_is( 'wp-jp-i18n-loader', 'registered' );
			if ( $i18n_loader_registered ) {
				wp_enqueue_script( 'wp-jp-i18n-loader' );
			}

			// The webpack handle carries Boost constants and DataSync bootstrap needed before modules run.
			$prerequisites = wp_scripts()->query( 'jetpack-boost-dashboard-wp-admin-prerequisites', 'registered' );
			if ( $prerequisites ) {
				$prerequisites->deps[] = $admin_js_handle;
				if ( $i18n_loader_registered ) {
					$prerequisites->deps[] = 'wp-jp-i18n-loader';
				}
			} else {
				Debug::log( 'Modern dashboard prerequisites are not registered; bootstrap dependencies could not be attached.' );
			}
		}
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
	 * Localize the REST API settings for a script.
	 *
	 * @param string $handle Script handle.
	 */
	private function localize_api_settings( $handle ) {
		wp_localize_script(
			$handle,
			'wpApiSettings',
			array(
				'root'  => esc_url_raw( rest_url() ),
				'nonce' => wp_create_nonce( 'wp_rest' ),
			)
		);
	}

	/**
	 * Generate the settings page.
	 */
	public function render_settings() {
		$this->localize_api_settings( 'jetpack-boost-admin' );
		?>
		<div id="jb-admin-settings"></div>
		<?php
	}
}
