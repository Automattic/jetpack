<?php
/**
 * The admin-specific functionality of the plugin.
 *
 * @since      1.0.0
 * @package    automattic/jetpack-boost
 */

namespace Automattic\Jetpack_Boost\Admin;

use Automattic\Jetpack\Status;
use Automattic\Jetpack_Boost\Jetpack_Boost;
use Automattic\Jetpack_Boost\Lib\Environment_Change_Detector;
use Automattic\Jetpack_Boost\Lib\Speed_Score;

/**
 * Class Admin
 */
class Admin {

	/**
	 * Menu slug.
	 */
	const MENU_SLUG = 'jetpack-boost';

	/**
	 * Option to store options that have been dismissed.
	 */
	const DISMISSED_NOTICE_OPTION = 'jb-dismissed-notices';

	/**
	 * Main plugin instance.
	 *
	 * @var Jetpack_Boost Plugin.
	 */
	private $jetpack_boost;

	/**
	 * Speed_Score class instance.
	 *
	 * @var Speed_Score instance.
	 */
	private $speed_score;

	/**
	 * Initialize the class and set its properties.
	 *
	 * @param Jetpack_Boost $jetpack_boost Main plugin instance.
	 *
	 * @since    1.0.0
	 */
	public function __construct( Jetpack_Boost $jetpack_boost ) {
		$this->jetpack_boost = $jetpack_boost;
		$this->speed_score   = new Speed_Score();
		Environment_Change_Detector::init();

		add_action( 'admin_menu', array( $this, 'admin_menu' ) );
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_styles' ) );
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_scripts' ) );
		add_filter( 'plugin_action_links_' . JETPACK_BOOST_PLUGIN_BASE, array( $this, 'plugin_page_settings_link' ) );
		add_action( 'rest_api_init', array( $this, 'register_rest_routes' ) );
		add_action( 'admin_notices', array( $this, 'show_notices' ) );

		$this->handle_get_parameters();
	}

	/**
	 * Runs the function that generates the admin menu for the plugin.
	 */
	public function admin_menu() {
		add_menu_page(
			__( 'Jetpack Boost', 'jetpack-boost' ),
			__( 'Jetpack Boost', 'jetpack-boost' ),
			'manage_options',
			JETPACK_BOOST_SLUG,
			array( $this, 'render_settings' ),
			'dashicons-chart-line',
			77 // Between Tools & Settings.
		);

		add_submenu_page(
			'jetpack-boost',
			__( 'Jetpack Boost - Settings', 'jetpack-boost' ),
			__( 'Settings', 'jetpack-boost' ),
			'manage_options',
			JETPACK_BOOST_SLUG,
			array( $this, 'render_settings' )
		);
	}

	/**
	 * Returns true if on Jetpack Boost admin page.
	 *
	 * @return bool
	 */
	public function on_boost_admin_page() {
		$screen = get_current_screen();

		return 'toplevel_page_jetpack-boost' === $screen->id;
	}

	/**
	 * Register the stylesheets for the admin area.
	 *
	 * @since    1.0.0
	 */
	public function enqueue_styles() {
		if ( ! $this->on_boost_admin_page() ) {
			return;
		}

		$internal_path = apply_filters( 'jetpack_boost_asset_internal_path', 'app/assets/dist/' );

		wp_enqueue_style(
			$this->jetpack_boost->get_plugin_name() . '-css',
			plugins_url( $internal_path . 'jetpack-boost.css', JETPACK_BOOST_PATH ),
			array( 'wp-components' ),
			JETPACK_BOOST_VERSION
		);
	}

	/**
	 * Register the JavaScript for the admin area.
	 *
	 * @since    1.0.0
	 */
	public function enqueue_scripts() {
		if ( ! $this->on_boost_admin_page() ) {
			return;
		}

		$internal_path = apply_filters( 'jetpack_boost_asset_internal_path', 'app/assets/dist/' );

		$admin_js_handle = $this->jetpack_boost->get_plugin_name() . '-admin';

		wp_register_script(
			$admin_js_handle,
			plugins_url( $internal_path . 'jetpack-boost.js', JETPACK_BOOST_PATH ),
			array(),
			JETPACK_BOOST_VERSION,
			true
		);

		// Prepare configuration constants for JavaScript.
		$constants = array(
			'version'             => JETPACK_BOOST_VERSION,
			'api'                 => array(
				'namespace' => JETPACK_BOOST_REST_NAMESPACE,
				'prefix'    => JETPACK_BOOST_REST_PREFIX,
			),
			'modules'             => $this->jetpack_boost->get_available_modules(),
			'config'              => $this->jetpack_boost->config()->get_data(),
			'locale'              => get_locale(),
			'site'                => array(
				'url'       => get_site_url(),
				'online'    => ! ( new Status() )->is_offline_mode(),
				'assetPath' => plugins_url( $internal_path, JETPACK_BOOST_PATH ),
			),
			'shownAdminNoticeIds' => $this->get_shown_admin_notice_ids(),
		);

		// Give each module an opportunity to define extra constants.
		$constants = apply_filters( 'jetpack_boost_js_constants', $constants );

		wp_localize_script(
			$admin_js_handle,
			'Jetpack_Boost',
			$constants
		);

		wp_set_script_translations( $admin_js_handle, 'jetpack-boost' );

		wp_enqueue_script( $admin_js_handle );
	}

	/**
	 * Get settings link.
	 *
	 * @param array $links the array of links.
	 */
	public function plugin_page_settings_link( $links ) {
		$settings_link = '<a href="' . admin_url( '?page=jetpack-boost' ) . '">' . esc_html__( 'Settings', 'jetpack-boost' ) . '</a>';
		array_unshift( $links, $settings_link );

		return $links;
	}

	/**
	 * Generate the settings page.
	 */
	public function render_settings() {
		wp_localize_script(
			$this->jetpack_boost->get_plugin_name() . '-admin',
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
	 * Check for permissions.
	 *
	 * @return bool
	 */
	public function check_for_permissions() {
		return current_user_can( 'manage_options' );
	}

	/**
	 * Register REST routes for settings.
	 *
	 * @return void
	 */
	public function register_rest_routes() {
		// Activate and deactivate a module.
		register_rest_route(
			JETPACK_BOOST_REST_NAMESPACE,
			JETPACK_BOOST_REST_PREFIX . '/module/(?P<slug>[a-z\-]+)/status',
			array(
				'methods'             => \WP_REST_Server::EDITABLE,
				'callback'            => array( $this, 'set_module_status' ),
				'permission_callback' => array( $this, 'check_for_permissions' ),
			)
		);
	}

	/**
	 * Handler for the /module/(?P<slug>[a-z\-]+)/status endpoint.
	 *
	 * @param \WP_REST_Request $request The request object.
	 *
	 * @return \WP_REST_Response|\WP_Error The response.
	 */
	public function set_module_status( $request ) {
		$params = $request->get_json_params();

		if ( ! isset( $params['status'] ) ) {
			return new \WP_Error(
				'jetpack_boost_error_missing_module_status_param',
				__( 'Missing status param', 'jetpack-boost' )
			);
		}

		$module_slug = $request['slug'];
		$this->jetpack_boost->set_module_status( (bool) $params['status'], $module_slug );

		return rest_ensure_response(
			$this->jetpack_boost->get_module_status( $module_slug )
		);
	}

	/**
	 * Show any admin notices from enabled modules.
	 */
	public function show_notices() {
		// Determine if we're already on the settings page.
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended
		$on_settings_page = isset( $_GET['page'] ) && self::MENU_SLUG === $_GET['page'];
		$notices          = $this->jetpack_boost->get_admin_notices();

		// Filter out any that have been dismissed, unless newer than the dismissal.
		$dismissed_notices = \get_option( self::DISMISSED_NOTICE_OPTION, array() );
		$notices           = array_filter(
			$notices,
			function ( $notice ) use ( $dismissed_notices ) {
				$notice_slug = $notice->get_slug();

				return ! in_array( $notice_slug, $dismissed_notices, true );
			}
		);

		// Abort early if no notices to show.
		if ( count( $notices ) === 0 ) {
			return;
		}

		// Display all notices.
		foreach ( $notices as $notice ) {
			$notice->render( $on_settings_page );
		}
	}

	/**
	 * Returns an array of notice ids (i.e.: jetpack-boost-notice-[slug]) for all
	 * visible admin notices.
	 *
	 * @return array List of notice ids.
	 */
	private function get_shown_admin_notice_ids() {
		$notices = $this->jetpack_boost->get_admin_notices();
		$ids     = array();
		foreach ( $notices as $notice ) {
			$ids[] = $notice->get_id();
		}

		return $ids;
	}

	/**
	 * Check for a GET parameter used to dismiss an admin notice.
	 *
	 * Note: this method ignores the nonce verification linter rule, as jb-dismiss-notice is intended to work
	 * without a nonce.
	 *
	 * phpcs:disable WordPress.Security.NonceVerification.Recommended
	 */
	public function handle_get_parameters() {
		if ( is_admin() && ! empty( $_GET['jb-dismiss-notice'] ) ) {
			$slug = sanitize_title( $_GET['jb-dismiss-notice'] );

			$dismissed_notices = \get_option( self::DISMISSED_NOTICE_OPTION, array() );

			if ( ! in_array( $slug, $dismissed_notices, true ) ) {
				$dismissed_notices[] = $slug;
			}

			\update_option( self::DISMISSED_NOTICE_OPTION, $dismissed_notices, false );
		}
	}
	// phpcs:enable WordPress.Security.NonceVerification.Recommended

	/**
	 * Delete the option tracking which admin notices have been dismissed during deactivation.
	 */
	public static function clear_dismissed_notices() {
		\delete_option( self::DISMISSED_NOTICE_OPTION );
	}

	/**
	 * Clear a specific admin notice.
	 *
	 * @param string $notice_slug The notice slug.
	 */
	public static function clear_dismissed_notice( $notice_slug ) {
		$dismissed_notices = \get_option( self::DISMISSED_NOTICE_OPTION, array() );

		if ( in_array( $notice_slug, $dismissed_notices, true ) ) {
			array_splice( $dismissed_notices, array_search( $notice_slug, $dismissed_notices, true ), 1 );
		}

		\update_option( self::DISMISSED_NOTICE_OPTION, $dismissed_notices, false );
	}
}
