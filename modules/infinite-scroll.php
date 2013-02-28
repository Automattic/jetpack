<?php
/**
 * Module Name: Infinite Scroll
 * Module Description: Automatically pull the next set of posts into view when the reader approaches the bottom of the page.
 * Sort Order: 14
 * First Introduced: 2.0
 * Requires Connection: No
 */

/**
 * Jetpack-specific elements of Infinite Scroll
 */
class Jetpack_Infinite_Scroll_Extras {
	/**
	 * Class variables
	 */
	// Oh look, a singleton
	private static $__instance = null;

	// Option names
	private $option_name_google_analytics = 'infinite_scroll_google_analytics';

	/**
	 * Singleton implementation
	 *
	 * @return object
	 */
	public static function instance() {
		if ( ! is_a( self::$__instance, 'Jetpack_Infinite_Scroll_Extras' ) )
			self::$__instance = new Jetpack_Infinite_Scroll_Extras;

		return self::$__instance;
	}

	/**
	 * Register actions and filters
	 *
	 * @uses add_action, add_filter
	 * @return null
	 */
	private function __construct() {
		add_action( 'jetpack_modules_loaded', array( $this, 'action_jetpack_modules_loaded' ) );

		add_action( 'admin_init', array( $this, 'action_admin_init' ), 11 );

		add_action( 'after_setup_theme', array( $this, 'action_after_setup_theme' ), 5 );

		add_filter( 'infinite_scroll_js_settings', array( $this, 'filter_infinite_scroll_js_settings' ) );

		add_action( 'wp_enqueue_scripts', array( $this, 'action_wp_enqueue_scripts' ) );
	}

	/**
	 * Enable "Configure" button on module card
	 *
	 * @uses Jetpack::enable_module_configurable, Jetpack::module_configuration_load
	 * @action jetpack_modules_loaded
	 * @return null
	 */
	public function action_jetpack_modules_loaded() {
		Jetpack::enable_module_configurable( __FILE__ );
		Jetpack::module_configuration_load( __FILE__, array( $this, 'module_configuration_load' ) );
	}

	/**
	 * Redirect configure button to Settings > Reading
	 *
	 * @uses wp_safe_redirect, admin_url
	 * @return null
	 */
	public function module_configuration_load() {
		wp_safe_redirect( admin_url( 'options-reading.php#infinite-scroll-options' ) );
		exit;
	}

	/**
	 * Register Google Analytics setting
	 *
	 * @uses add_settings_field, __, register_setting
	 * @action admin_init
	 * @return null
	 */
	public function action_admin_init() {
		add_settings_field( $this->option_name_google_analytics, '<span id="infinite-scroll-google-analytics">' . __( 'Use Google Analytics with Infinite Scroll', 'jetpack' ) . '</span>', array( $this, 'setting_google_analytics' ), 'reading' );
		register_setting( 'reading', $this->option_name_google_analytics, array( $this, 'sanitize_boolean_value' ) );
	}

	/**
	 * Render Google Analytics option
	 *
	 * @uses checked, get_option, __
	 * @return html
	 */
	public function setting_google_analytics() {
		echo '<label><input name="infinite_scroll_google_analytics" type="checkbox" value="1" ' . checked( true, (bool) get_option( $this->option_name_google_analytics, false ), false ) . ' /> ' . __( 'Track each Infinite Scroll post load as a page view in Google Analytics', 'jetpack' ) . '</br><small>' . __( 'By checking the box above, each new set of posts loaded via Infinite Scroll will be recorded as a page view in Google Analytics.', 'jetpack' ) . '</small>' . '</label>';
	}

	/**
	 * Sanitize value as a boolean
	 *
	 * @param mixed $value
	 * @return bool
	 */
	public function sanitize_boolean_value( $value ) {
		return (bool) $value;
	}

	/**
	 * Load theme's infinite scroll annotation file, if present in the IS plugin.
	 * The `setup_theme` action is used because the annotation files should be using `after_setup_theme` to register support for IS.
	 *
	 * As released in Jetpack 2.0, a child theme's parent wasn't checked for in the plugin's bundled support, hence the convoluted way the parent is checked for now.
	 *
	 * @uses is_admin, wp_get_theme, get_theme, get_current_theme, apply_filters
	 * @action setup_theme
	 * @return null
	 */
	function action_after_setup_theme() {
		$theme = function_exists( 'wp_get_theme' ) ? wp_get_theme() : get_theme( get_current_theme() );

		if ( ! is_a( $theme, 'WP_Theme' ) && ! is_array( $theme ) )
			return;

		$customization_file = apply_filters( 'infinite_scroll_customization_file', dirname( __FILE__ ) . "/infinite-scroll/themes/{$theme['Stylesheet']}.php", $theme['Stylesheet'] );

		if ( is_readable( $customization_file ) ) {
			require_once( $customization_file );
		}
		elseif ( ! empty( $theme['Template'] ) ) {
			$customization_file = dirname( __FILE__ ) . "/infinite-scroll/themes/{$theme['Template']}.php";

			if ( is_readable( $customization_file ) )
				require_once( $customization_file );
		}
	}

	/**
	 * Modify Infinite Scroll configuration information
	 *
	 * @uses Jetpack::get_active_modules, is_user_logged_in, stats_get_options, Jetpack::get_option, get_option, JETPACK__API_VERSION, JETPACK__VERSION
	 * @filter infinite_scroll_js_settings
	 * @return array
	 */
	public function filter_infinite_scroll_js_settings( $settings ) {
		// Provide WP Stats info for tracking Infinite Scroll loads
		// Abort if Stats module isn't active
		if ( in_array( 'stats', Jetpack::get_active_modules() ) ) {
			// Abort if user is logged in but logged-in users shouldn't be tracked.
			if ( is_user_logged_in() ) {
				$stats_options = stats_get_options();
				$track_loggedin_users = isset( $stats_options['reg_users'] ) ? (bool) $stats_options['reg_users'] : false;

				if ( ! $track_loggedin_users )
					return $settings;
			}

			// We made it this far, so gather the data needed to track IS views
			$settings['stats'] = 'blog=' . Jetpack::get_option( 'id' ) . '&host=' . parse_url( get_option( 'home' ), PHP_URL_HOST ) . '&v=ext&j=' . JETPACK__API_VERSION . ':' . JETPACK__VERSION;

			// Pagetype parameter
			$settings['stats'] .= '&x_pagetype=infinite';
			if ( 'click' == $settings['type'] )
				$settings['stats'] .= '-click';

			$settings['stats'] .= '-jetpack';
		}

		// Check if Google Analytics tracking is requested
		$settings['google_analytics'] = (bool) get_option( $this->option_name_google_analytics );

		return $settings;
	}

	/**
	 * Load VideoPress scripts if plugin is active.
	 *
	 * @global $videopress
	 * @action wp_enqueue_scripts
	 * @return null
	 */
	public function action_wp_enqueue_scripts() {
		global $videopress;
		if ( ! empty( $videopress ) && The_Neverending_Home_Page::archive_supports_infinity() && is_a( $videopress, 'VideoPress' ) && method_exists( $videopress, 'enqueue_scripts' ) )
			$videopress->enqueue_scripts();
	}
}
Jetpack_Infinite_Scroll_Extras::instance();

/**
 * Load main IS file
 */
require_once( dirname( __FILE__ ) . "/infinite-scroll/infinity.php" );

/**
 * Remove the IS annotation loading function bundled with the IS plugin in favor of the Jetpack-specific version in Jetpack_Infinite_Scroll_Extras::action_after_setup_theme();
 */
remove_action( 'after_setup_theme', 'the_neverending_home_page_theme_support', 5 );