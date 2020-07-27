<?php //phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Handles fetching of the site's products from WordPress.com and caching the value locally.
 *
 * @package Jetpack
 */

use Automattic\Jetpack\Connection\Client;

/**
 * Provides methods methods for fetching the plan from WordPress.com.
 */
class Jetpack_Site_Products {
	/**
	 * A cache variable to hold the site's products for the current request.
	 *
	 * @var array
	 */
	private static $site_products_cache;

	const SITE_PRODUCTS_OPTION = 'jetpack_site_products';

	/**
	 * Given a response to the `/sites/%d` endpoint, will parse the response and attempt to set the
	 * site's products from the response.
	 *
	 * @param array $response The response from `/sites/%d`.
	 * @return bool Were the site's products successfully updated?
	 */
	public static function update_from_sites_response( $response ) {
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

		// Bail if there were no results or products details returned.
		if ( ! is_array( $results ) || ! isset( $results['products'] ) ) {
			return false;
		}

		// Store the site's products in an option and return true if updated.
		$result = update_option( self::SITE_PRODUCTS_OPTION, $results['products'], true );
		if ( ! $result ) {
			// If we got to this point, then we know we need to update. So, assume there is an issue
			// with caching. To fix that issue, we can delete the current option and then update.
			delete_option( self::SITE_PRODUCTS_OPTION );
			$result = update_option( self::SITE_PRODUCTS_OPTION, $results['products'], true );
		}

		if ( $result ) {
			// Reset the cache since we've just updated the site's products.
			self::$site_products_cache = null;
		}

		return $result;
	}

	/**
	 * Make an API call to WordPress.com to fetch the site's products.
	 *
	 * @uses Jetpack_Options::get_option()
	 * @uses Client::wpcom_json_api_request_as_blog()
	 * @uses update_option()
	 *
	 * @access public
	 * @static
	 *
	 * @return bool True if the site's products are updated, false if no update
	 */
	public static function refresh_from_wpcom() {
		// Make the API request.
		$request  = sprintf( '/sites/%d', Jetpack_Options::get_option( 'id' ) );
		$response = Client::wpcom_json_api_request_as_blog( $request, '1.1' );

		return self::update_from_sites_response( $response );
	}

	/**
	 * Get the list of products that this Jetpack site currently have.
	 *
	 * @uses get_option()
	 *
	 * @access public
	 * @static
	 *
	 * @return array Active Jetpack products
	 */
	public static function get() {
		// this can be expensive to compute so we cache for the duration of a request.
		if ( is_array( self::$site_products_cache ) && ! empty( self::$site_products_cache ) ) {
			return self::$site_products_cache;
		}

		$site_products             = get_option( self::SITE_PRODUCTS_OPTION, array() );
		self::$site_products_cache = $site_products;
		return $site_products;
	}
}
