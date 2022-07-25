<?php
/**
 * The admin-specific functionality of the plugin.
 *
 * @since      1.0.0
 * @package    automattic/jetpack-boost
 */

namespace Automattic\Jetpack_Boost\Admin;

use Automattic\Jetpack\Admin_UI\Admin_Menu;
use Automattic\Jetpack_Boost\Features\Optimizations\Optimizations;
use Automattic\Jetpack_Boost\Features\Speed_Score\Speed_Score;
use Automattic\Jetpack_Boost\Jetpack_Boost;
use Automattic\Jetpack_Boost\Lib\Analytics;
use Automattic\Jetpack_Boost\Lib\Environment_Change_Detector;
use Automattic\Jetpack_Boost\Lib\Premium_Features;
use Automattic\Jetpack_Boost\Lib\Premium_Pricing;

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
	private $modules;

	/**
	 * Speed_Score class instance.
	 *
	 * @var Speed_Score instance.
	 */
	private $speed_score;

	/**
	 * Configuration constants.
	 *
	 * @param Config $config
	 */
	private $config;

	public function __construct( Optimizations $modules ) {
		$this->modules     = $modules;
		$this->speed_score = new Speed_Score( $modules );
		Environment_Change_Detector::init();
		Premium_Pricing::init();

		$this->config = new Config();
		$this->config->init();

		add_action( 'init', array( new Analytics(), 'init' ) );
		add_filter( 'plugin_action_links_' . JETPACK_BOOST_PLUGIN_BASE, array( $this, 'plugin_page_settings_link' ) );
		add_action( 'admin_notices', array( $this, 'show_notices' ) );
		add_filter( 'jetpack_boost_js_constants', array( $this, 'add_js_constants' ) );

		$this->handle_get_parameters();

		$page_suffix = Admin_Menu::add_menu(
			__( 'Jetpack Boost - Settings', 'jetpack-boost' ),
			'Boost',
			'manage_options',
			JETPACK_BOOST_SLUG,
			array( $this, 'render_settings' )
		);
		add_action( 'load-' . $page_suffix, array( $this, 'admin_init' ) );
	}

	/**
	 * Enqueue scripts and styles for the admin page.
	 */
	public function admin_init() {
		// Clear premium features cache when the plugin settings page is loaded.
		Premium_Features::clear_cache();

		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_styles' ) );
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_scripts' ) );
	}

	/**
	 * Register the stylesheets for the admin area.
	 *
	 * @since    1.0.0
	 */
	public function enqueue_styles() {
		$internal_path = apply_filters( 'jetpack_boost_asset_internal_path', 'app/assets/dist/' );

		wp_enqueue_style(
			'jetpack-boost-css',
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
		$internal_path = apply_filters( 'jetpack_boost_asset_internal_path', 'app/assets/dist/' );

		$admin_js_handle = 'jetpack-boost-admin';

		wp_register_script(
			$admin_js_handle,
			plugins_url( $internal_path . 'jetpack-boost.js', JETPACK_BOOST_PATH ),
			array( 'wp-i18n', 'wp-components' ),
			JETPACK_BOOST_VERSION,
			true
		);

		wp_localize_script(
			$admin_js_handle,
			'Jetpack_Boost',
			$this->config->constants()
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
	 * Get the list of dismissed notices.
	 */
	public static function get_dismissed_notices() {
		return \get_option( self::DISMISSED_NOTICE_OPTION, array() );
	}

	/**
	 * Delete the option tracking which admin notices have been dismissed during deactivation.
	 */
	public static function clear_dismissed_notices() {
		\delete_option( self::DISMISSED_NOTICE_OPTION );
	}

	/**
	 * Show any admin notices from enabled modules.
	 */
	public function show_notices() {
		// Determine if we're already on the settings page.
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended
		$on_settings_page = isset( $_GET['page'] ) && self::MENU_SLUG === $_GET['page'];
		$notices          = $this->get_admin_notices();

		// Filter out any that have been dismissed, unless newer than the dismissal.
		$dismissed_notices = self::get_dismissed_notices();
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
	 * Returns a list of admin notices to show. Asks each module to provide admin notices the user needs to see.
	 *
	 * @return \Automattic\Jetpack_Boost\Admin\Admin_Notice[]
	 */
	public static function get_admin_notices() {
		return apply_filters( 'jetpack_boost_admin_notices', array() );
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
			$slug = sanitize_title( wp_unslash( $_GET['jb-dismiss-notice'] ) );

			$dismissed_notices = self::get_dismissed_notices();

			if ( ! in_array( $slug, $dismissed_notices, true ) ) {
				$dismissed_notices[] = $slug;
			}

			\update_option( self::DISMISSED_NOTICE_OPTION, $dismissed_notices, false );
		}
	}
	// phpcs:enable WordPress.Security.NonceVerification.Recommended

	/**
	 * Clear a specific admin notice.
	 *
	 * @param string $notice_slug The notice slug.
	 */
	public static function clear_dismissed_notice( $notice_slug ) {
		$dismissed_notices = self::get_dismissed_notices();

		if ( in_array( $notice_slug, $dismissed_notices, true ) ) {
			array_splice( $dismissed_notices, array_search( $notice_slug, $dismissed_notices, true ), 1 );
		}

		\update_option( self::DISMISSED_NOTICE_OPTION, $dismissed_notices, false );
	}

	/**
	 * Add Admin related constants to be passed to JavaScript.
	 *
	 * @param array $constants Constants to be passed to JavaScript.
	 *
	 * @return array
	 */
	public function add_js_constants( $constants ) {
		// Information about the current status of Critical CSS / generation.
		$constants['showRatingPromptNonce'] = wp_create_nonce( Config::SET_SHOW_RATING_PROMPT_NONCE );
		$constants['showScorePromptNonce']  = wp_create_nonce( Config::SET_SHOW_SCORE_PROMPT_NONCE );

		return $constants;
	}
}
