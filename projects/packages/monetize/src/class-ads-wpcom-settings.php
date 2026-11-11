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
 * Keeps WordPress.com's Ads settings caught up with the site's, which always win.
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
		$privacy_url  = esc_url_raw( (string) get_option( 'wordads_ccpa_privacy_policy_url', $privacy_page ? get_permalink( $privacy_page ) : '' ), array( 'http', 'https' ) );

		return array(
			'display_options'         => $display,
			'ccpa_enabled'            => (bool) get_option( 'wordads_ccpa_enabled', false ),
			// WordPress.com only accepts an empty value or an absolute http(s) URL, and the site may hold a relative one.
			'ccpa_privacy_policy_url' => wp_parse_url( $privacy_url, PHP_URL_HOST ) ? $privacy_url : '',
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
	 * Send the site's Ads settings to WordPress.com as the current user, if they changed since it last accepted them.
	 *
	 * @return true|WP_Error
	 */
	public static function sync() {
		if ( ! self::is_out_of_date() ) {
			return true;
		}

		$site     = self::get_site_values();
		$response = Client::wpcom_json_api_request_as_user(
			sprintf( '/sites/%d/wordads/settings', self::get_blog_id() ),
			'2',
			array( 'method' => 'POST' ),
			$site
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

		if ( ! is_array( $data['settings'] ?? null ) ) {
			return new WP_Error( 'wpcom_invalid_response', __( 'WordPress.com sent an unexpected response.', 'jetpack-monetize' ), array( 'status' => 502 ) );
		}

		update_option( self::SYNCED_OPTION, self::hash( $site ), false );
		return true;
	}

	/**
	 * The site's WordPress.com blog ID.
	 *
	 * @return int
	 */
	private static function get_blog_id() {
		return (int) Jetpack_Options::get_option( 'id' );
	}

	/**
	 * A stable fingerprint of site values, tied to the WordPress.com site so a clone or reconnect catches up.
	 *
	 * @param array $values Site values.
	 * @return string
	 */
	private static function hash( array $values ) {
		return md5( (string) wp_json_encode( array( self::get_blog_id(), $values ), JSON_UNESCAPED_SLASHES ) );
	}
}
