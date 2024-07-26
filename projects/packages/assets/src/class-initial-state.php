<?php
/**
 * Jetpack Initial state.
 *
 * @package  automattic/jetpack-assets
 */

namespace Automattic\Jetpack;

/**
 * Class Initial State
 */
class Initial_State {

	const SCRIPT_HANDLE = 'jetpack-initial-state';

	/**
	 * Configure.
	 */
	public static function configure() {
		// Ensure that assets are registered on wp load,
		// so that when dependent scripts are enqueued, the scripts here are already registered.
		add_action( 'wp_loaded', array( self::class, 'register_assets' ) );

		// We want to render the initial state on print
		// so that the hook callbacks have enough time and information
		// to decide whether to update the initial state or not.
		add_action( 'admin_print_scripts', array( self::class, 'render_initial_state' ), 1 );
	}

	/**
	 * Register assets.
	 *
	 * @access private
	 */
	public static function register_assets() {

		Assets::register_script(
			self::SCRIPT_HANDLE,
			'../build/jetpack-initial-state.js',
			__FILE__,
			array(
				'in_footer'  => true,
				'textdomain' => 'jetpack-assets',
			)
		);
	}

	/**
	 * Render the initial state using an inline script.
	 *
	 * @access private
	 *
	 * @return void
	 */
	public static function render_initial_state() {

		$initial_state = wp_json_encode(
			self::get_initial_state(),
			JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP | JSON_UNESCAPED_UNICODE
		);

		wp_add_inline_script(
			self::SCRIPT_HANDLE,
			sprintf( 'var JETPACK_INITIAL_STATE = %s;', $initial_state ),
			'before'
		);
	}

	/**
	 * Get the initial state.
	 *
	 * @return array
	 */
	protected static function get_initial_state() {

		global $wp_version;

		$state = array(
			'site' => array(
				'admin_url'  => esc_url_raw( admin_url() ),
				'rest_nonce' => wp_create_nonce( 'wp_rest' ),
				'rest_root'  => esc_url_raw( rest_url() ),
				'title'      => self::get_site_title(),
				'wp_version' => $wp_version,
			),
			'user' => array(
				'current_user' => self::get_current_user_data(),
			),
		);

		/**
		 * Filter the initial state.
		 *
		 * @param array $state The initial state.
		 */
		return apply_filters( 'jetpack_js_initial_state', $state );
	}

	/**
	 * Get the site title.
	 *
	 * @return string
	 */
	protected static function get_site_title() {
		$title = get_bloginfo( 'name' );

		return $title ? $title : esc_url_raw( ( get_site_url() ) );
	}

	/**
	 * Get the current user data.
	 *
	 * @return array
	 */
	protected static function get_current_user_data() {
		$current_user = wp_get_current_user();

		return array(
			'display_name' => $current_user->display_name,
			'id'           => $current_user->ID,
		);
	}
}
