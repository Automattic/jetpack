<?php
/**
 * Settings REST integration for Jetpack Podcast.
 *
 * Exposes the `podcasting_*` options through:
 *   - Atomic / standard WP: `register_setting()` so they appear in `/wp/v2/settings`.
 *   - Simple (wpcom): `site_settings_endpoint_get` / `rest_api_update_site_settings`
 *     filters consumed by the wpcom site-settings REST endpoint.
 *
 * @package automattic/jetpack-podcast
 */

namespace Automattic\Jetpack\Podcast\REST;

use Automattic\Jetpack\Podcast\Podcast;

/**
 * Registers the podcast settings on the site-settings endpoints used by both
 * Simple and Atomic sites.
 */
class Settings_REST {

	/**
	 * Schema for each podcasting setting.
	 *
	 *   - type:    'string' or 'integer'.
	 *   - default: scalar default value.
	 *   - enum:    optional whitelist used for `podcasting_explicit`.
	 *
	 * @var array<string, array{type: string, default: mixed, enum?: array<int, string>}>
	 */
	private const SETTINGS = array(
		'podcasting_category_id' => array(
			'type'    => 'integer',
			'default' => 0,
		),
		'podcasting_title'       => array(
			'type'    => 'string',
			'default' => '',
		),
		'podcasting_talent_name' => array(
			'type'    => 'string',
			'default' => '',
		),
		'podcasting_summary'     => array(
			'type'    => 'string',
			'default' => '',
		),
		'podcasting_copyright'   => array(
			'type'    => 'string',
			'default' => '',
		),
		'podcasting_explicit'    => array(
			'type'    => 'string',
			'default' => 'no',
			'enum'    => array( 'no', 'yes', 'clean' ),
		),
		'podcasting_image'       => array(
			'type'    => 'string',
			'default' => '',
		),
		'podcasting_image_id'    => array(
			'type'    => 'integer',
			'default' => 0,
		),
		'podcasting_category_1'  => array(
			'type'    => 'string',
			'default' => '',
		),
		'podcasting_category_2'  => array(
			'type'    => 'string',
			'default' => '',
		),
		'podcasting_category_3'  => array(
			'type'    => 'string',
			'default' => '',
		),
		'podcasting_email'       => array(
			'type'    => 'string',
			'default' => '',
		),
	);

	/**
	 * Whether hooks have been registered.
	 *
	 * @var bool
	 */
	private static $initialized = false;

	/**
	 * Register hooks.
	 */
	public static function init() {
		if ( self::$initialized ) {
			return;
		}
		self::$initialized = true;

		// register_setting() is only consumed by the /wp/v2/settings REST controller
		// during REST requests, so registering anywhere else (e.g. on `init`) just
		// burns cycles on every frontend pageload.
		add_action( 'rest_api_init', array( __CLASS__, 'register_settings' ) );

		// wpcom-only filters; no-ops on Atomic. Cheap to register either way.
		add_filter( 'site_settings_endpoint_get', array( __CLASS__, 'handle_wpcom_get' ) );
		add_filter( 'rest_api_update_site_settings', array( __CLASS__, 'handle_wpcom_update' ), 10, 2 );
	}

	/**
	 * Register podcasting options with the WP settings registry so they appear
	 * in `/wp/v2/settings` on standard WP installs and Atomic.
	 */
	public static function register_settings() {
		foreach ( self::SETTINGS as $option => $schema ) {
			$args = array(
				'type'         => $schema['type'],
				'default'      => $schema['default'],
				'show_in_rest' => array(
					'name'   => $option,
					'schema' => array(
						'type' => $schema['type'],
					),
				),
			);

			if ( isset( $schema['enum'] ) ) {
				$args['show_in_rest']['schema']['enum'] = $schema['enum'];
			}

			register_setting( 'general', $option, $args );
		}
	}

	/**
	 * Inject podcasting settings into the wpcom site-settings GET response (Simple sites).
	 *
	 * @param array $settings Existing settings array.
	 * @return array
	 */
	public static function handle_wpcom_get( $settings ) {
		$settings['podcasting_category_id'] = (int) Podcast::get_category_id();
		$settings['podcasting_image']       = (string) Podcast::get_image_url();
		$settings['podcasting_image_id']    = (int) get_option( 'podcasting_image_id', 0 );

		foreach ( self::SETTINGS as $option => $schema ) {
			if ( isset( $settings[ $option ] ) ) {
				continue;
			}
			$value               = get_option( $option, $schema['default'] );
			$settings[ $option ] = 'integer' === $schema['type'] ? (int) $value : (string) $value;
		}

		return $settings;
	}

	/**
	 * Cast podcasting settings on incoming wpcom site-settings POST requests (Simple sites).
	 *
	 * @param array $original_input   Already-sanitized input array.
	 * @param array $unfiltered_input Raw client input.
	 * @return array
	 */
	public static function handle_wpcom_update( $original_input, $unfiltered_input ) {
		$output = (array) $original_input;

		foreach ( self::SETTINGS as $option => $schema ) {
			if ( ! isset( $unfiltered_input[ $option ] ) ) {
				continue;
			}

			if ( 'integer' === $schema['type'] ) {
				$output[ $option ] = (int) $unfiltered_input[ $option ];
				continue;
			}

			$value = (string) $unfiltered_input[ $option ];
			if ( isset( $schema['enum'] ) && ! in_array( $value, $schema['enum'], true ) ) {
				$value = (string) $schema['default'];
			}
			$output[ $option ] = $value;
		}

		return $output;
	}
}
