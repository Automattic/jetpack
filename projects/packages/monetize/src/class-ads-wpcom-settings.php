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
 * WordPress.com refuses any save without a PayPal address, so the site's settings wait until one is on file.
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
	 * WordPress.com-only fields a save sends back as they are, since its POST replaces the whole record.
	 *
	 * @var string[]
	 */
	const KEPT_FIELDS = array( 'paypal', 'tos', 'show_to_logged_in', 'optimized_ads' );

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
			'ccpa_privacy_policy_url' => (string) get_option( 'wordads_ccpa_privacy_policy_url', $privacy_page ? get_permalink( $privacy_page ) : '' ),
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
		$current = self::fetch();
		if ( is_wp_error( $current ) ) {
			return $current;
		}

		return self::to_payout( $current );
	}

	/**
	 * Save the payout details, along with the site's Ads settings.
	 *
	 * @param string $paypal    PayPal email address.
	 * @param bool   $sign_tos  Whether the user agreed to the terms.
	 * @return array|WP_Error The saved payout details.
	 */
	public static function save_payout( $paypal, $sign_tos ) {
		$current = self::fetch();
		if ( is_wp_error( $current ) ) {
			return $current;
		}

		$changes = array( 'paypal' => $paypal );
		if ( $sign_tos ) {
			$changes['tos'] = 'signed';
		}

		$saved = self::write( $current, $changes );
		return is_wp_error( $saved ) ? $saved : self::to_payout( $saved );
	}

	/**
	 * Send the site's Ads settings to WordPress.com if they changed and it has a PayPal address to save them with.
	 *
	 * @return bool|WP_Error Whether WordPress.com is caught up.
	 */
	public static function sync() {
		if ( ! self::is_out_of_date() ) {
			return true;
		}

		$current = self::fetch();
		if ( is_wp_error( $current ) ) {
			return $current;
		}

		if ( empty( $current['paypal'] ) ) {
			return false;
		}

		$saved = self::write( $current );
		return is_wp_error( $saved ) ? $saved : true;
	}

	/**
	 * WordPress.com's current settings.
	 *
	 * @return array|WP_Error
	 */
	private static function fetch() {
		$response = Client::wpcom_json_api_request_as_user( self::get_path(), '1.1', array( 'method' => 'GET' ), null, 'rest' );
		$body     = self::parse( $response );
		if ( is_wp_error( $body ) ) {
			return $body;
		}

		return is_array( $body['settings'] ?? null ) ? $body['settings'] : array();
	}

	/**
	 * Replace WordPress.com's settings with the site's values and any changes, keeping the fields only WordPress.com has.
	 *
	 * @param array $current WordPress.com's current settings.
	 * @param array $changes Payout fields to change.
	 * @return array|WP_Error The settings sent.
	 */
	private static function write( array $current, array $changes = array() ) {
		$site = self::get_site_values();
		$body = array_merge( array_intersect_key( $current, array_flip( self::KEPT_FIELDS ) ), $site, $changes );

		// The sidebar placement only exists on WordPress.com.
		$current_display = (array) ( $current['display_options'] ?? array() );
		if ( isset( $current_display['sidebar'] ) ) {
			$body['display_options']['sidebar'] = $current_display['sidebar'];
		}

		$response = Client::wpcom_json_api_request_as_user( self::get_path(), '1.1', array( 'method' => 'POST' ), $body, 'rest' );
		$result   = self::parse( $response );
		if ( is_wp_error( $result ) ) {
			return $result;
		}

		update_option( self::SYNCED_OPTION, self::hash( $site ), false );

		return $body;
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
	 * Decode a response, turning v1.1's `{ error, message }` failures into a WP_Error.
	 *
	 * @param array|WP_Error $response Remote response.
	 * @return array|WP_Error
	 */
	private static function parse( $response ) {
		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$status = (int) wp_remote_retrieve_response_code( $response );
		$body   = json_decode( wp_remote_retrieve_body( $response ), true );
		$body   = is_array( $body ) ? $body : array();

		if ( $status >= 400 || isset( $body['error'] ) ) {
			return new WP_Error(
				(string) ( $body['error'] ?? $body['code'] ?? 'wpcom_error' ),
				(string) ( $body['message'] ?? '' ),
				array( 'status' => $status >= 400 ? $status : 500 )
			);
		}

		return $body;
	}

	/**
	 * The v1.1 settings path for this site.
	 *
	 * @return string
	 */
	private static function get_path() {
		return sprintf( '/sites/%d/wordads/settings', (int) Jetpack_Options::get_option( 'id' ) );
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
