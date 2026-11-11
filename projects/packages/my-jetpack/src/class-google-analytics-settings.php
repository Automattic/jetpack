<?php
/**
 * Google Analytics settings for the settings panel.
 *
 * @package automattic/my-jetpack
 */

namespace Automattic\Jetpack\My_Jetpack;

use Automattic\Jetpack\Google_Analytics\GA_Manager;
use WP_Error;
use WP_REST_Request;
use WP_REST_Server;

/**
 * Reads and saves the built-in Google Analytics setup, a WordPress.com plan feature that has no module.
 */
class Google_Analytics_Settings {

	/**
	 * The settings panel slug, as in `?configure=google-analytics`.
	 */
	const SLUG = 'google-analytics';

	/**
	 * The WordPress.com plan feature that includes the built-in setup.
	 */
	const FEATURE = 'google-analytics';

	/**
	 * Empty, or a Universal Analytics or GA4 Measurement ID.
	 */
	const CODE_PATTERN = '/^(|UA-\d+-\d+|G-[A-Z0-9]+)$/i';

	/**
	 * Whether the current user can set up Google Analytics in the settings panel.
	 *
	 * @return bool
	 */
	public static function is_available() {
		return Initializer::is_settings_consolidation_on_for_site()
			// Offline, the route is not registered.
			&& ! Initializer::is_offline_features_enabled()
			&& current_user_can( 'manage_options' )
			// Only jetpack-mu-wpcom loads it, so self-hosted sites never get the panel.
			&& class_exists( GA_Manager::class )
			// jetpack-mu-wpcom ships GA_Manager on its own release schedule.
			&& method_exists( GA_Manager::class, 'get_google_analytics_option_name' )
			&& function_exists( 'wpcom_site_has_feature' )
			&& \wpcom_site_has_feature( self::FEATURE );
	}

	/**
	 * The Features row for Google Analytics.
	 *
	 * @return array{slug: string, name: string, description: string, status: string}
	 */
	public static function get_entry() {
		$settings = self::get();
		if ( ! $settings['is_active'] ) {
			$status = 'inactive';
		} else {
			// On without a Measurement ID, GA prints no tag.
			$status = '' === $settings['code'] ? 'needs-setup' : 'active';
		}

		return array(
			'slug'        => self::SLUG,
			'name'        => __( 'Google Analytics', 'jetpack-my-jetpack' ),
			'description' => __( 'Track your site with Google Analytics.', 'jetpack-my-jetpack' ),
			'status'      => $status,
		);
	}

	/**
	 * Register the REST route the panel reads and saves through.
	 *
	 * @return void
	 */
	public static function register_rest_routes() {
		register_rest_route(
			'my-jetpack/v1',
			'site/google-analytics',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( __CLASS__, 'rest_get' ),
					'permission_callback' => array( __CLASS__, 'is_available' ),
				),
				array(
					'methods'             => WP_REST_Server::EDITABLE,
					'callback'            => array( __CLASS__, 'rest_update' ),
					'permission_callback' => array( __CLASS__, 'is_available' ),
					'args'                => array(
						'is_active'    => array( 'type' => 'boolean' ),
						'code'         => array( 'type' => 'string' ),
						'anonymize_ip' => array( 'type' => 'boolean' ),
					),
				),
			)
		);
	}

	/**
	 * The settings the panel shows.
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
	 * Merge the given settings into the stored option, keeping the keys the panel does not show.
	 *
	 * @param array $value Any of `is_active`, `code` and `anonymize_ip`.
	 * @return true|WP_Error
	 */
	public static function update( $value ) {
		$value = array_intersect_key( is_array( $value ) ? $value : array(), self::get() );

		if ( isset( $value['code'] ) ) {
			$value['code'] = trim( (string) $value['code'] );
			if ( ! preg_match( self::CODE_PATTERN, $value['code'] ) ) {
				return new WP_Error(
					'invalid_google_analytics_code',
					__( 'Enter a Measurement ID, such as G-XXXXXXX.', 'jetpack-my-jetpack' ),
					array( 'status' => 400 )
				);
			}
		}

		$option = self::get_option_name();
		$stored = get_option( $option, array() );
		$stored = is_array( $stored ) ? $stored : array();
		$merged = array_merge( $stored, $value );

		/** This filter is documented in projects/packages/google-analytics/src/class-ga-manager.php */
		$merged = apply_filters( 'site_settings_update_wga', $merged, $value ); // phpcs:ignore WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedHooknameFound -- GA_Manager's filter, applied as its own save path does.
		if ( $merged === $stored ) {
			return true;
		}

		if ( ! update_option( $option, $merged ) ) {
			return new WP_Error( 'google_analytics_not_saved', __( 'Google Analytics settings could not be saved.', 'jetpack-my-jetpack' ) );
		}

		return true;
	}

	/**
	 * REST callback: the current settings.
	 *
	 * @return \WP_REST_Response
	 */
	public static function rest_get() {
		return rest_ensure_response( self::get() );
	}

	/**
	 * REST callback: save, then answer with the settings as stored.
	 *
	 * @param WP_REST_Request $request The request.
	 * @return \WP_REST_Response|WP_Error
	 */
	public static function rest_update( WP_REST_Request $request ) {
		$result = self::update( $request->get_params() );

		return is_wp_error( $result ) ? $result : rest_ensure_response( self::get() );
	}

	/**
	 * `jetpack_wga` on Atomic, `wga` on Simple.
	 *
	 * @return string
	 */
	private static function get_option_name() {
		return GA_Manager::get_instance()->get_google_analytics_option_name();
	}
}
