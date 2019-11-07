<?php

use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\Status;

/**
 * Methods for accessing data through the WPCOM REST API
 *
 * @since 4.5.0
 */
class WordAds_API {

	private static $wordads_status = null;

	/**
	 * Returns site's WordAds status
	 *
	 * @return array boolean values for 'approved' and 'active'
	 *
	 * @since 4.5.0
	 */
	public static function get_wordads_status() {
		global $wordads_status_response;
		if ( ( new Status() )->is_development_mode() ) {
			self::$wordads_status = array(
				'approved' => true,
				'active'   => true,
				'house'    => true,
				'unsafe'   => false,
			);

			return self::$wordads_status;
		}

		$endpoint                = sprintf( '/sites/%d/wordads/status', Jetpack::get_option( 'id' ) );
		$wordads_status_response = $response = Client::wpcom_json_api_request_as_blog( $endpoint );
		if ( 200 !== wp_remote_retrieve_response_code( $response ) ) {
			return new WP_Error( 'api_error', __( 'Error connecting to API.', 'jetpack' ), $response );
		}

		$body                 = json_decode( wp_remote_retrieve_body( $response ) );
		self::$wordads_status = array(
			'approved' => $body->approved,
			'active'   => $body->active,
			'house'    => $body->house,
			'unsafe'   => $body->unsafe,
		);

		return self::$wordads_status;
	}

	/**
	 * Returns the ads.txt content needed to run WordAds.
	 *
	 * @return array string contents of the ads.txt file.
	 *
	 * @since 6.1.0
	 */
	public static function get_wordads_ads_txt() {
		$endpoint                = sprintf( '/sites/%d/wordads/ads-txt', Jetpack::get_option( 'id' ) );
		$wordads_status_response = $response = Client::wpcom_json_api_request_as_blog( $endpoint );
		if ( 200 !== wp_remote_retrieve_response_code( $response ) ) {
			return new WP_Error( 'api_error', __( 'Error connecting to API.', 'jetpack' ), $response );
		}

		$body    = json_decode( wp_remote_retrieve_body( $response ) );
		$ads_txt = str_replace( '\\n', PHP_EOL, $body->adstxt );
		return $ads_txt;
	}

	/**
	 * Returns status of WordAds approval.
	 *
	 * @return boolean true if site is WordAds approved
	 *
	 * @since 4.5.0
	 */
	public static function is_wordads_approved() {
		if ( is_null( self::$wordads_status ) ) {
			self::get_wordads_status();
		}

		return self::$wordads_status['approved'] ? '1' : '0';
	}

	/**
	 * Returns status of WordAds active.
	 *
	 * @return boolean true if ads are active on site
	 *
	 * @since 4.5.0
	 */
	public static function is_wordads_active() {
		if ( is_null( self::$wordads_status ) ) {
			self::get_wordads_status();
		}

		return self::$wordads_status['active'] ? '1' : '0';
	}

	/**
	 * Returns status of WordAds house ads.
	 *
	 * @return boolean true if WP.com house ads should be shown
	 *
	 * @since 4.5.0
	 */
	public static function is_wordads_house() {
		if ( is_null( self::$wordads_status ) ) {
			self::get_wordads_status();
		}

		return self::$wordads_status['house'] ? '1' : '0';
	}


	/**
	 * Returns whether or not this site is safe to run ads on.
	 *
	 * @return boolean true if ads shown not be shown on this site.
	 *
	 * @since 6.5.0
	 */
	public static function is_wordads_unsafe() {
		if ( is_null( self::$wordads_status ) ) {
			self::get_wordads_status();
		}

		return self::$wordads_status['unsafe'] ? '1' : '0';
	}

	/**
	 * Grab WordAds status from WP.com API and store as option
	 *
	 * @since 4.5.0
	 */
	static function update_wordads_status_from_api() {
		$status = self::get_wordads_status();
		if ( ! is_wp_error( $status ) ) {
			update_option( 'wordads_approved', self::is_wordads_approved(), true );
			update_option( 'wordads_active', self::is_wordads_active(), true );
			update_option( 'wordads_house', self::is_wordads_house(), true );
			update_option( 'wordads_unsafe', self::is_wordads_unsafe(), true );
		}
	}
}
