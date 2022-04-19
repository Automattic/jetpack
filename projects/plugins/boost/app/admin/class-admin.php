<?php
/**
 * The admin-specific functionality of the plugin.
 *
 * @since      1.0.0
 * @package    automattic/jetpack-boost
 */

namespace Automattic\Jetpack_Boost\Admin;

use Automattic\Jetpack\Admin_UI\Admin_Menu;
use Automattic\Jetpack\Status;
use Automattic\Jetpack_Boost\Features\Optimizations\Optimizations;
use Automattic\Jetpack_Boost\Features\Speed_Score\Speed_Score;
use Automattic\Jetpack_Boost\Jetpack_Boost;
use Automattic\Jetpack_Boost\Lib\Analytics;
use Automattic\Jetpack_Boost\Lib\Environment_Change_Detector;
use Automattic\Jetpack_Boost\Lib\Premium_Features;
use Automattic\Jetpack_Boost\REST_API\Permissions\Nonce;

class Admin {

	/**
	 * Menu slug.
	 */
	const MENU_SLUG = 'jetpack-boost';

	/**
	 * Nonce action for setting the status of show_rating_prompt.
	 */
	const SET_SHOW_RATING_PROMPT_NONCE = 'set_show_rating_prompt';

	/**
	 * Option to store options that have been dismissed.
	 */
	const DISMISSED_NOTICE_OPTION = 'jb-dismissed-notices';

	/**
	 * Name of option to store status of show/hide rating prompts
	 */
	const SHOW_RATING_PROMPT_OPTION = 'jb_show_rating_prompt';

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

	public function __construct( Optimizations $modules ) {
		$this->modules     = $modules;
		$this->speed_score = new Speed_Score( $modules );
		Environment_Change_Detector::init();

		add_action( 'init', array( new Analytics(), 'init' ) );
		add_filter( 'plugin_action_links_' . JETPACK_BOOST_PLUGIN_BASE, array( $this, 'plugin_page_settings_link' ) );
		add_action( 'admin_notices', array( $this, 'show_notices' ) );
		add_action( 'wp_ajax_set_show_rating_prompt', array( $this, 'handle_set_show_rating_prompt' ) );
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

		$optimizations = ( new Optimizations() )->get_status();
		// Prepare configuration constants for JavaScript.
		$constants = array(
			'version'             => JETPACK_BOOST_VERSION,
			'api'                 => array(
				'namespace' => JETPACK_BOOST_REST_NAMESPACE,
				'prefix'    => JETPACK_BOOST_REST_PREFIX,
			),
			'optimizations'       => $optimizations,
			'locale'              => get_locale(),
			'site'                => array(
				'domain'    => ( new Status() )->get_site_suffix(),
				'url'       => get_home_url(),
				'online'    => ! ( new Status() )->is_offline_mode(),
				'assetPath' => plugins_url( $internal_path, JETPACK_BOOST_PATH ),
			),
			'shownAdminNoticeIds' => $this->get_shown_admin_notice_ids(),
			'preferences'         => array(
				'showRatingPrompt' => $this->get_show_rating_prompt(),
				'prioritySupport'  => Premium_Features::has_feature( Premium_Features::PRIORITY_SUPPORT ),
			),

			/**
			 * A bit of necessary magic,
			 * Explained more in the Nonce class.
			 *
			 * Nonces are automatically generated when registering routes.
			 */
			'nonces'              => Nonce::get_generated_nonces(),
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
	 * Check for permissions.
	 *
	 * @return bool
	 */
	public function check_for_permissions() {
		return current_user_can( 'manage_options' );
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
		$notices = $this->get_admin_notices();
		$ids     = array();
		foreach ( $notices as $notice ) {
			$ids[] = $notice->get_id();
		}

		return $ids;
	}

	/**
	 * Returns a list of admin notices to show. Asks each module to provide admin notices the user needs to see.
	 *
	 * @return \Automattic\Jetpack_Boost\Admin\Admin_Notice[]
	 */
	public function get_admin_notices() {
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

			$dismissed_notices = \get_option( self::DISMISSED_NOTICE_OPTION, array() );

			if ( ! in_array( $slug, $dismissed_notices, true ) ) {
				$dismissed_notices[] = $slug;
			}

			\update_option( self::DISMISSED_NOTICE_OPTION, $dismissed_notices, false );
		}
	}
	// phpcs:enable WordPress.Security.NonceVerification.Recommended

	/**
	 * Handle the ajax request to set show-rating-prompt status.
	 */
	public function handle_set_show_rating_prompt() {
		if ( check_ajax_referer( self::SET_SHOW_RATING_PROMPT_NONCE, 'nonce' ) && $this->check_for_permissions() ) {
			$response = array(
				'status' => 'ok',
			);

			$is_enabled = isset( $_POST['value'] ) && 'true' === $_POST['value'] ? '1' : '0';
			\update_option( self::SHOW_RATING_PROMPT_OPTION, $is_enabled );

			wp_send_json( $response );
		} else {
			$error = new \WP_Error( 'authorization', __( 'You do not have permission to take this action.', 'jetpack-boost' ) );
			wp_send_json_error( $error, 403 );
		}
	}

	/**
	 * Get the value of show_rating_prompt.
	 *
	 * This determines if there should be a prompt after speed score improvements. Initially the value is set to true by
	 * default. Once the user clicks on the rating button, it is switched to false.
	 *
	 * @return bool
	 */
	public function get_show_rating_prompt() {
		return \get_option( self::SHOW_RATING_PROMPT_OPTION, '1' ) === '1';
	}

	/**
	 * Delete the option tracking which admin notices have been dismissed during deactivation.
	 */
	public static function clear_dismissed_notices() {
		\delete_option( self::DISMISSED_NOTICE_OPTION );
	}

	/**
	 * Clear the status of show_rating_prompt
	 */
	public static function clear_show_rating_prompt() {
		\delete_option( self::SHOW_RATING_PROMPT_OPTION );
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

	/**
	 * Add Admin related constants to be passed to JavaScript.
	 *
	 * @param array $constants Constants to be passed to JavaScript.
	 *
	 * @return array
	 */
	public function add_js_constants( $constants ) {
		// Information about the current status of Critical CSS / generation.
		$constants['showRatingPromptNonce'] = wp_create_nonce( self::SET_SHOW_RATING_PROMPT_NONCE );

		return $constants;
	}
}
