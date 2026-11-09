<?php
/**
 * The Google Analytics setting the dashboard's Settings tab edits.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

use Automattic\Jetpack\Feature_Flags\Feature_Flags;
use Automattic\Jetpack\Google_Analytics\GA_Manager;
use WP_Error;

/**
 * Reads and writes the Google Analytics option that `GA_Manager` owns, for core's `wp/v2/settings` route.
 */
final class Google_Analytics_Settings {

	/**
	 * The setting's name on the settings route. The option behind it is `jetpack_wga` or `wga`, as `GA_Manager` decides.
	 *
	 * @var string
	 */
	public const REST_NAME = 'google_analytics';

	/**
	 * The flag that moves the Google Analytics setting off Jetpack › Settings.
	 *
	 * @var string
	 */
	private const FLAG = 'my-jetpack-settings-consolidation';

	/**
	 * The plan feature that includes Google Analytics on WordPress.com.
	 *
	 * @var string
	 */
	private const FEATURE = 'google-analytics';

	/**
	 * The Measurement IDs `GA_Manager` accepts, or an empty string to clear it.
	 *
	 * @var string
	 */
	private const CODE_PATTERN = '/^(|UA-\d+-\d+|G-[A-Z0-9]+)$/i';

	/**
	 * Whether the site can set up Google Analytics here: WordPress.com loads `GA_Manager`, and the plan includes it.
	 *
	 * @return bool
	 */
	public static function is_available() {
		return Feature_Flags::is_enabled( self::FLAG )
			// Only jetpack-mu-wpcom loads it, so self-hosted sites never get the setting.
			&& class_exists( GA_Manager::class )
			&& function_exists( 'wpcom_site_has_feature' )
			&& \wpcom_site_has_feature( self::FEATURE );
	}

	/**
	 * Declare the setting so core's settings route exposes it.
	 *
	 * No `default` or `sanitize_callback`: core would apply them to every read and write of the option, including GA_Manager's own.
	 *
	 * @param string $group The settings group.
	 * @return void
	 */
	public static function register( $group ) {
		register_setting(
			$group,
			self::get_option_name(),
			array(
				'type'         => 'object',
				'show_in_rest' => array(
					'name'   => self::REST_NAME,
					'schema' => array(
						'type'                 => 'object',
						'properties'           => array(
							'is_active'    => array( 'type' => 'boolean' ),
							'code'         => array( 'type' => 'string' ),
							'anonymize_ip' => array( 'type' => 'boolean' ),
						),
						'additionalProperties' => false,
					),
				),
				'description'  => __( 'Google Analytics settings.', 'jetpack-premium-analytics-pkg' ),
			)
		);
	}

	/**
	 * The fields the Settings tab edits, defaults included.
	 *
	 * @return array{is_active: bool, code: string, anonymize_ip: bool}
	 */
	public static function get() {
		$stored = get_option( self::get_option_name(), array() );
		$stored = is_array( $stored ) ? $stored : array();

		return array(
			'is_active'    => ! empty( $stored['is_active'] ),
			'code'         => isset( $stored['code'] ) && is_string( $stored['code'] ) ? $stored['code'] : '',
			'anonymize_ip' => ! empty( $stored['anonymize_ip'] ),
		);
	}

	/**
	 * Merge a write into the stored option, keeping the fields this tab does not edit.
	 *
	 * @param mixed $value The fields sent.
	 * @return true|WP_Error
	 */
	public static function update( $value ) {
		$value = is_array( $value ) ? $value : array();

		if ( isset( $value['code'] ) ) {
			$value['code'] = trim( (string) $value['code'] );
			if ( ! preg_match( self::CODE_PATTERN, $value['code'] ) ) {
				return new WP_Error(
					'invalid_google_analytics_code',
					__( 'Enter a Measurement ID that starts with G-.', 'jetpack-premium-analytics-pkg' ),
					array( 'status' => 400 )
				);
			}
		}

		$option = self::get_option_name();
		$stored = get_option( $option, array() );
		$merged = array_merge( is_array( $stored ) ? $stored : array(), $value );
		if ( $merged === $stored ) {
			return true;
		}

		return update_option( $option, $merged )
			? true
			: new WP_Error( 'google_analytics_not_saved', __( 'Google Analytics settings could not be saved.', 'jetpack-premium-analytics-pkg' ) );
	}

	/**
	 * The option `GA_Manager` reads: `jetpack_wga` where Jetpack runs, `wga` on Simple.
	 *
	 * @return string
	 */
	private static function get_option_name() {
		return GA_Manager::get_instance()->get_google_analytics_option_name();
	}
}
