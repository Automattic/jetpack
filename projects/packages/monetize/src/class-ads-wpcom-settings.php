<?php
/**
 * The WordPress.com copy of the site's Ads settings.
 *
 * @package automattic/jetpack-monetize
 */

namespace Automattic\Jetpack\Monetize;

use Automattic\Jetpack\Connection\Client;
use Jetpack_Options;
use WP_Error;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Keeps WordPress.com's Ads settings caught up with the site's, which always win, and saves the payout details.
 *
 * @since $$next-version$$
 */
class Ads_Wpcom_Settings {

	/**
	 * Hash of the site values WordPress.com last accepted.
	 *
	 * @var string
	 */
	const SYNCED_OPTION = 'jetpack_monetize_ads_wpcom_synced';

	/**
	 * Site option => WordPress.com `display_options` key.
	 *
	 * @var array<string, string>
	 */
	const DISPLAY_OPTIONS = array(
		'wordads_display_front_page' => 'display_front_page',
		'wordads_display_post'       => 'display_post',
		'wordads_display_page'       => 'display_page',
		'wordads_display_archive'    => 'display_archive',
		'enable_header_ad'           => 'enable_header_ad',
		'wordads_second_belowpost'   => 'second_belowpost',
		'wordads_inline_enabled'     => 'inline_enabled',
	);

	/**
	 * The site's Ads settings in WordPress.com's shape, defaults included.
	 *
	 * @return array
	 */
	public static function get_site_values() {
		// Defaults as in the Jetpack plugin's WordAds_Params, which stores them the first time ads load.
		$display = array();
		foreach ( self::DISPLAY_OPTIONS as $option => $key ) {
			$display[ $key ] = (bool) get_option( $option, true );
		}

		$privacy_page = (int) get_option( 'wp_page_for_privacy_policy' );

		return array(
			'display_options'         => $display,
			'ccpa_enabled'            => (bool) get_option( 'wordads_ccpa_enabled', false ),
			// WordPress.com only accepts an empty value or an http(s) URL.
			'ccpa_privacy_policy_url' => esc_url_raw( (string) get_option( 'wordads_ccpa_privacy_policy_url', $privacy_page ? get_permalink( $privacy_page ) : '' ), array( 'http', 'https' ) ),
		);
	}

	/**
	 * Whether the site's Ads settings changed since WordPress.com last accepted them.
	 *
	 * @return bool
	 */
	public static function is_out_of_date() {
		return get_option( self::SYNCED_OPTION ) !== self::hash( self::get_site_values() );
	}

	/**
	 * Where earnings are paid, and whether the terms are signed.
	 *
	 * @return array|WP_Error
	 */
	public static function get_payout() {
		$settings = self::request( 'GET' );
		return is_wp_error( $settings ) ? $settings : self::to_payout( $settings );
	}

	/**
	 * Save the payout details, along with the site's Ads settings.
	 *
	 * @param string $paypal   PayPal email address.
	 * @param bool   $sign_tos Whether the user agreed to the terms.
	 * @return array|WP_Error The saved payout details.
	 */
	public static function save_payout( $paypal, $sign_tos ) {
		$changes = array( 'paypal' => $paypal );
		if ( $sign_tos ) {
			$changes['tos'] = 'signed';
		}

		$settings = self::send_site_values( $changes );
		return is_wp_error( $settings ) ? $settings : self::to_payout( $settings );
	}

	/**
	 * Send the site's Ads settings to WordPress.com if they changed since it last accepted them.
	 *
	 * @return true|WP_Error
	 */
	public static function sync() {
		if ( ! self::is_out_of_date() ) {
			return true;
		}

		$settings = self::send_site_values();
		return is_wp_error( $settings ) ? $settings : true;
	}

	/**
	 * Update WordPress.com with the site's values and any payout changes, and remember what it accepted.
	 *
	 * @param array $changes Payout fields to change.
	 * @return array|WP_Error WordPress.com's settings after the update.
	 */
	private static function send_site_values( array $changes = array() ) {
		$site     = self::get_site_values();
		$settings = self::request( 'POST', array_merge( $site, $changes ) );
		if ( ! is_wp_error( $settings ) ) {
			update_option( self::SYNCED_OPTION, self::hash( $site ), false );
		}

		return $settings;
	}

	/**
	 * Read or update WordPress.com's settings as the current user.
	 *
	 * @param string     $method HTTP method.
	 * @param array|null $body   Fields to change.
	 * @return array|WP_Error The settings.
	 */
	private static function request( $method, $body = null ) {
		$response = Client::wpcom_json_api_request_as_user(
			sprintf( '/sites/%d/wordads/settings', (int) Jetpack_Options::get_option( 'id' ) ),
			'2',
			array( 'method' => $method ),
			$body
		);

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$status = (int) wp_remote_retrieve_response_code( $response );
		$data   = json_decode( wp_remote_retrieve_body( $response ), true );
		$data   = is_array( $data ) ? $data : array();

		if ( $status >= 400 ) {
			return new WP_Error(
				(string) ( $data['code'] ?? 'wpcom_error' ),
				(string) ( $data['message'] ?? '' ),
				array( 'status' => $status )
			);
		}

		return is_array( $data['settings'] ?? null ) ? $data['settings'] : array();
	}

	/**
	 * The payout fields the dashboard shows.
	 *
	 * @param array $settings WordPress.com settings.
	 * @return array
	 */
	private static function to_payout( array $settings ) {
		return array(
			'paypal'    => (string) ( $settings['paypal'] ?? '' ),
			'tosSigned' => 'signed' === ( $settings['tos'] ?? '' ),
		);
	}

	/**
	 * A stable fingerprint of site values.
	 *
	 * @param array $values Site values.
	 * @return string
	 */
	private static function hash( array $values ) {
		return md5( (string) wp_json_encode( $values, JSON_UNESCAPED_SLASHES ) );
	}
}
