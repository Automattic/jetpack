<?php
/**
 * Jetpack Search Overlay Settings
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

// Exit if file is accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class to initialize search settings on the site.
 */
class Settings {
	/**
	 * This contains significant code overlap with `customizer/class-customizer.php`.
	 *
	 * 1. The settings are synced to WPCOM thru `sync/src/modules/class-search.php`.
	 * 2. Ensure to add new options to WPCOM whitelist if need to be synced following `PCYsg-sBM-p2`.
	 *
	 * @var array
	 */
	public static $settings = array(
		array( Options::OPTION_PREFIX . 'color_theme', 'string', 'light' ),
		array( Options::OPTION_PREFIX . 'result_format', 'string', 'minimal' ),
		array( Options::OPTION_PREFIX . 'default_sort', 'string', 'relevance' ),
		array( Options::OPTION_PREFIX . 'overlay_trigger', 'string', 'results' ),
		array( Options::OPTION_PREFIX . 'excluded_post_types', 'string', '' ),
		array( Options::OPTION_PREFIX . 'highlight_color', 'string', '#FFC' ),
		array( Options::OPTION_PREFIX . 'enable_sort', 'boolean', true ),
		array( Options::OPTION_PREFIX . 'inf_scroll', 'boolean', true ),
		array( Options::OPTION_PREFIX . 'show_powered_by', 'boolean', true ),
	);

	/**
	 * Class initialization.
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
		foreach ( static::$settings as $value ) {
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
