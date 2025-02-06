<?php
/**
 * Jetpack script data.
 *
 * @package  automattic/jetpack-assets
 */

namespace Automattic\Jetpack\Assets;

use Automattic\Jetpack\Assets;

/**
 * Class script data
 */
class Script_Data {

	const SCRIPT_HANDLE = 'jetpack-script-data';

	/**
	 * Whether the script data has been rendered.
	 *
	 * @var bool
	 */
	private static $did_render_script_data = false;

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
		 *    to hook into the script data. Thus, we prefer to use admin_print_scripts on admin pages.
		 * 2. We want to render the script data on print, instead of init or enqueue actions,
		 *    so that the hook callbacks have enough time and information
		 *    to decide whether to update the script data or not.
		 */
		$hook = is_admin() ? 'admin_print_scripts' : 'wp_print_scripts';
		add_action( $hook, array( self::class, 'render_script_data' ), 1 );
		add_action( 'enqueue_block_editor_assets', array( self::class, 'render_script_data' ), 1 );
	}

	/**
	 * Register assets.
	 *
	 * @access private
	 */
	public static function register_assets() {

		Assets::register_script(
			self::SCRIPT_HANDLE,
			'../build/jetpack-script-data.js',
			__FILE__,
			array(
				'in_footer'  => true,
				'textdomain' => 'jetpack-assets',
			)
		);
	}

	/**
	 * Render the script data using an inline script.
	 *
	 * @access private
	 *
	 * @return void
	 */
	public static function render_script_data() {
		// In case of 'enqueue_block_editor_assets' action, this can be called multiple times.
		if ( self::$did_render_script_data ) {
			return;
		}

		self::$did_render_script_data = true;

		$script_data = is_admin() ? self::get_admin_script_data() : self::get_public_script_data();

		$script_data = wp_json_encode(
			$script_data,
			JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP | JSON_UNESCAPED_UNICODE
		);

		wp_add_inline_script(
			self::SCRIPT_HANDLE,
			sprintf( 'window.JetpackScriptData = %s;', $script_data ),
			'before'
		);
	}

	/**
	 * Get the admin script data.
	 *
	 * @return array
	 */
	protected static function get_admin_script_data() {

		global $wp_version;

		$data = array(
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
		 * Filter the admin script data.
		 *
		 * When using this filter, ensure that the data is added only if it is used by some script.
		 * This filter may be called on almost every admin page load. So, one should check if the data is needed/used on that page.
		 * For example, the social (publicize) data is used only on Social admin page, Jetpack settings page and the post editor.
		 * So, the social data should be added only on those pages.
		 *
		 * @since 2.3.0
		 *
		 * @param array $data The script data.
		 */
		return apply_filters( 'jetpack_admin_js_script_data', $data );
	}

	/**
	 * Get the admin script data.
	 *
	 * @return array
	 */
	protected static function get_public_script_data() {

		$data = array(
			'site' => array(
				'icon'  => self::get_site_icon(),
				'title' => self::get_site_title(),
			),
		);

		/**
		 * Filter the public script data.
		 *
		 * See the docs for `jetpack_admin_js_script_data` filter for more information.
		 *
		 * @since 2.3.0
		 *
		 * @param array $data The script data.
		 */
		return apply_filters( 'jetpack_public_js_script_data', $data );
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

		/**
		 * Filters the site icon using Photon.
		 *
		 * @see https://developer.wordpress.com/docs/photon/
		 *
		 * @param string       $url The URL of the site icon.
		 * @param array|string $args An array of arguments, e.g. array( 'w' => '300', 'resize' => array( 123, 456 ) ), or in string form (w=123&h=456).
		 */
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
