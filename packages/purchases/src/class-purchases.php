<?php
/**
 * A utility class that helps us determine what purchases a site has made.
 *
 * @package automattic/jetpack-purchases
 */

namespace Automattic\Jetpack;

use Automattic\Jetpack\Connection\Client;

/**
 * Class Automattic\Jetpack\Purchases
 *
 * Contains utilities for determining what kind of purchases (plans and products) a site has made.
 */
class Purchases {

	const OPTION_CACHE = 'jetpack_purchases';

	/**
	 * Return the purchases a site has made.
	 *
	 * @return mixed|false
	 */
	public function get() {
		// Gets back all the purchases that site has made...
		$purchases = get_option( self::OPTION_CACHE, false );

		if ( $purchases ) {
			return $purchases;
		}

		return $this->get_from_wpcom();
	}

	/**
	 * Fetches the sites purchases from WP.com and caches them in an option.
	 *
	 * @return bool|mixed
	 */
	public function get_from_wpcom() {

		$request  = sprintf( '/sites/%d/purchases', \Jetpack_Options::get_option( 'id' ) );
		$response = Client::wpcom_json_api_request_as_blog( $request . '?owner=site', '1.1' );

		// Bail if there was an error or malformed response.
		if ( is_wp_error( $response ) || ! is_array( $response ) || ! isset( $response['body'] ) ) {
			return false;
		}

		$body = wp_remote_retrieve_body( $response );
		if ( is_wp_error( $body ) ) {
			return false;
		}
		// Decode the results.
		$results = json_decode( $body, true );

		// Bail if there were no results or plan details returned.
		if ( ! is_array( $results ) ) {
			return false;
		}
		update_option( self::OPTION_CACHE, $results );
		return $results;
	}

}
