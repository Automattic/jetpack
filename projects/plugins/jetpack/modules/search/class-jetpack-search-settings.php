<?php
/**
 * Jetpack Search Overlay Settings
 *
 * @package automattic/jetpack
 */

// Exit if file is accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

require_once __DIR__ . '/class-jetpack-search-options.php';

/**
 * Class to initialize search settings on the site.
 *
 * @since 8.3.0
 */
class Jetpack_Search_Settings {

	/**
	 * Class initialization.
	 *
	 * @since 8.3.0
	 */
	public function __construct() {
		add_action( 'admin_init', array( $this, 'settings_register' ) );
		add_action( 'rest_api_init', array( $this, 'settings_register' ) );
	}

	/**
	 * Register requisite settings.
	 *
	 * @since 9.x.x
	 */
	public function settings_register() {
		// NOTE: This contains significant code overlap with class-jetpack-search-customize.
		$setting_prefix = Jetpack_Search_Options::OPTION_PREFIX;
		$settings       = array(
			array( $setting_prefix . 'color_theme', 'string', 'light' ),
			array( $setting_prefix . 'result_format', 'string', 'minimal' ),
			array( $setting_prefix . 'default_sort', 'string', 'relevance' ),
			array( $setting_prefix . 'overlay_trigger', 'string', 'results' ),
			array( $setting_prefix . 'excluded_post_types', 'string', '' ),
			array( $setting_prefix . 'highlight_color', 'string', '#FFC' ),
			array( $setting_prefix . 'enable_sort', 'boolean', true ),
			array( $setting_prefix . 'inf_scroll', 'boolean', true ),
			array( $setting_prefix . 'show_powered_by', 'boolean', true ),
		);
		foreach ( $settings as $value ) {
			register_setting(
				'options',
				$value[0],
				array(
					'default'      => $value[2],
					'show_in_rest' => true,
					'type'         => $value[1],
				)
			);
		}
	}
}
