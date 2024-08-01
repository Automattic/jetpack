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
		/**
		 * Ensure that assets are registered on wp_loaded,
		 * which is fired before *_enqueue_scripts actions.
		 * It means that when the dependent scripts are registered,
		 * the scripts here are already registered.
		 */
		add_action( 'wp_loaded', array( self::class, 'register_assets' ) );

		/**
		 * Notes:
		 * 1. wp_print_scripts action is fired on both admin and public pages.
		 *    On admin pages, it's fired before admin_enqueue_scripts action,
		 *    which can be a problem if the consumer package uses admin_enqueue_scripts
		 *    to hook into the initial state. Thus, we prefer to use admin_print_scripts on admin pages.
		 * 2. We want to render the initial state on print, instead of init or enqueue actions,
		 *    so that the hook callbacks have enough time and information
		 *    to decide whether to update the initial state or not.
		 */
		$hook = is_admin() ? 'admin_print_scripts' : 'wp_print_scripts';
		add_action( $hook, array( self::class, 'render_initial_state' ), 1 );
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

		$initial_state = is_admin() ? self::get_admin_initial_state() : self::get_public_initial_state();

		$initial_state = wp_json_encode(
			$initial_state,
			JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP | JSON_UNESCAPED_UNICODE
		);

		wp_add_inline_script(
			self::SCRIPT_HANDLE,
			sprintf( 'window.JetpackInitialState = %s;', $initial_state ),
			'before'
		);
	}

	/**
	 * Get the admin initial state.
	 *
	 * @return array
	 */
	protected static function get_admin_initial_state() {

		global $wp_version;

		$state = array(
			'site' => array(
				'admin_url'    => esc_url_raw( admin_url() ),
				'date_format'  => get_option( 'date_format' ),
				'icon'         => self::get_site_icon(),
				'is_multisite' => is_multisite(),
				'plan'         => array(
					// The properties here should be updated by the consumer package/plugin.
					// It includes properties like 'product_slug', 'features', etc.
					'product_slug' => '',
				),
				'rest_nonce'   => wp_create_nonce( 'wp_rest' ),
				'rest_root'    => esc_url_raw( rest_url() ),
				'title'        => self::get_site_title(),
				'wp_version'   => $wp_version,
				'wpcom'        => array(
					// This should contain the connected site details like blog_id, is_atomic etc.
					'blog_id' => 0,
				),
			),
			'user' => array(
				'current_user' => self::get_current_user_data(),
			),
		);

		/**
		 * Filter the admin initial state.
		 *
		 * When using this filter, ensure that the data is added only if it is used by some script.
		 * This filter may be called on almost every admin page load. So, one should check if the data is needed/used on that page.
		 * For example, the social (publicize) data is used only on Social admin page, Jetpack settings page and the post editor.
		 * So, the social data should be added only on those pages.
		 *
		 * @param array $state The initial state.
		 */
		return apply_filters( 'jetpack_admin_js_initial_state', $state );
	}

	/**
	 * Get the admin initial state.
	 *
	 * @return array
	 */
	protected static function get_public_initial_state() {

		$state = array(
			'site' => array(
				'icon'  => self::get_site_icon(),
				'title' => self::get_site_title(),
			),
		);

		/**
		 * Filter the public initial state.
		 *
		 * See the docs for `jetpack_admin_js_initial_state` filter for more information.
		 *
		 * @param array $state The initial state.
		 */
		return apply_filters( 'jetpack_public_js_initial_state', $state );
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
	 * Get the site icon.
	 *
	 * @return string
	 */
	protected static function get_site_icon() {
		if ( ! has_site_icon() ) {
			return '';
		}

		return apply_filters( 'jetpack_photon_url', get_site_icon_url(), array( 'w' => 64 ) );
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
