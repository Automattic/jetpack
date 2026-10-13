<?php
/**
 * Jetpack Search Overlay Settings
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

// Exit if file is accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Class to initialize search settings on the site.
 *
 * 1. Settings are synced to WPCOM according to `Automattic\Jetpack\Sync\Modules\Search::$options_to_sync`.
 * 2. All synced options must also be explicitly whitelisted and sanitized on WPCOM; see `PCYsg-sBM-p2`.
 *
 * @phan-constructor-used-for-side-effects
 */
class Settings {

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
		// NOTE: This contains significant code overlap with class-jetpack-search-customize.
		$setting_prefix         = Options::OPTION_PREFIX;
		$settings               = array(
			array( $setting_prefix . 'ai_prompt_override', 'string', '' ),
			array( $setting_prefix . 'color_theme', 'string', 'light' ),
			array( $setting_prefix . 'result_format', 'string', 'minimal' ),
			array( $setting_prefix . 'default_sort', 'string', 'relevance' ),
			array( $setting_prefix . 'overlay_trigger', 'string', Options::DEFAULT_OVERLAY_TRIGGER ),
			array( $setting_prefix . 'excluded_post_types', 'string', '' ),
			array( $setting_prefix . 'highlight_color', 'string', '#FFC' ),
			array( $setting_prefix . 'enable_sort', 'boolean', true ),
			array( $setting_prefix . 'inf_scroll', 'boolean', true ),
			array( $setting_prefix . 'filtering_opens_overlay', 'boolean', true ),
			array( $setting_prefix . 'show_post_date', 'boolean', true ),
			array( $setting_prefix . 'show_product_price', 'boolean', true ),
			array( $setting_prefix . 'show_powered_by', 'boolean', true ),
			array( $setting_prefix . 'ai_answers_enabled', 'boolean', false ),
			array( $setting_prefix . 'suggestions_enabled', 'boolean', false ),
		);
		$ai_answers_enabled_key = $setting_prefix . 'ai_answers_enabled';

		foreach ( $settings as $value ) {
			$args = array(
				'default'      => $value[2],
				'show_in_rest' => true,
				'type'         => $value[1],
			);

			// Also reachable via WordPress core's generic /wp/v2/settings route,
			// which the plan-aware write gates elsewhere (REST_Controller, the
			// plugin's AI feature settings endpoint) don't cover.
			if ( $ai_answers_enabled_key === $value[0] ) {
				$args['sanitize_callback'] = array( __CLASS__, 'sanitize_ai_answers_enabled' );
			}

			register_setting( 'options', $value[0], $args );
		}
	}

	/**
	 * Reject enabling AI Answers on a site whose plan doesn't support it.
	 *
	 * @param mixed $value Raw value being saved.
	 * @return bool
	 */
	public static function sanitize_ai_answers_enabled( $value ) {
		$value = rest_sanitize_boolean( $value );
		return $value && ! Search_Blocks::supports_paid_search() ? false : $value;
	}
}
