<?php
/**
 * Class to handle the Protect plan
 *
 * @package automattic/jetpack-protect-plugin
 */

namespace Automattic\Jetpack\Protect;

use Automattic\Jetpack\My_Jetpack\REST_Purchases as My_Jetpack_REST_Purchases;

/**
 * The Plan class.
 */
class Plan {
	/**
	 * The array of product slugs for scan plans
	 *
	 * @var array
	 */
	const JETPACK_SCAN_PLANS = array( 'jetpack_scan', 'jetpack_scan_monthly' );

	/**
	 * The array of product slugs for plans with scan
	 *
	 * @var array
	 */
	const JETPACK_PLANS_WITH_SCAN = array(
		'jetpack_premium',
		'jetpack_business',
		// 'jetpack_personal',
		'jetpack_premium_monthly',
		'jetpack_business_monthly',
		// 'jetpack_personal_monthly',
		'jetpack_security_t1_yearly',
		'jetpack_security_t1_monthly',
		'jetpack_security_t2_yearly',
		'jetpack_security_t2_monthly',
		'jetpack_complete',
		'jetpack_complete_monthly',
	);

	/**
	 * The meta name used to store the cache date
	 *
	 * @var string
	 */
	const CACHE_DATE_META_NAME = 'protect-cache-date';

	/**
	 * Valid pediord for the cache: One week.
	 */
	const CACHE_VALIDITY_PERIOD = 7 * DAY_IN_SECONDS;

	/**
	 * The meta name used to store the cache
	 *
	 * @var string
	 */
	const CACHE_META_NAME = 'protect-cache';

	/**
	 * Checks if the cache is old, meaning we need to fetch new data from WPCOM
	 */
	private static function is_cache_old() {
		if ( empty( self::get_product_from_cache() ) ) {
			return true;
		}

		$cache_date = get_user_meta( get_current_user_id(), self::CACHE_DATE_META_NAME, true );
		return time() - (int) $cache_date > ( self::CACHE_VALIDITY_PERIOD );
	}

	/**
	 * Gets the product list from the user cache
	 */
	private static function get_product_from_cache() {
		return get_user_meta( get_current_user_id(), self::CACHE_META_NAME, true );
	}

	/**
	 * Gets the product data
	 *
	 * @param string $wpcom_product The product slug.
	 * @return array
	 */
	public static function get_product( $wpcom_product = 'jetpack_scan' ) {
		if ( ! self::is_cache_old() ) {
			return self::get_product_from_cache();
		}

		$request_url   = 'https://public-api.wordpress.com/rest/v1.1/products?locale=' . get_user_locale() . '&type=jetpack';
		$wpcom_request = wp_remote_get( esc_url_raw( $request_url ) );
		$response_code = wp_remote_retrieve_response_code( $wpcom_request );

		if ( 200 === $response_code ) {
			$products = json_decode( wp_remote_retrieve_body( $wpcom_request ) );

			// Pick the desired product...
			$product = $products->{$wpcom_product};

			// ... and store it into the cache.
			update_user_meta( get_current_user_id(), self::CACHE_DATE_META_NAME, time() );
			update_user_meta( get_current_user_id(), self::CACHE_META_NAME, $product );

			return $product;
		}

		return new \WP_Error(
			'failed_to_fetch_data',
			esc_html__( 'Unable to fetch the requested data.', 'jetpack-protect' ),
			array(
				'status'  => $response_code,
				'request' => $wpcom_request,
			)
		);
	}

	/**
	 * Gets the purchases list and compares against scan inclusive plans lists
	 */
	public static function has_required_plan() {
		$response = My_Jetpack_REST_Purchases::get_site_current_purchases();

		if ( is_wp_error( $response ) || 200 !== $response->status ) {
			return false;
		}

		$products = array_column( $response->data, 'product_slug' );

		foreach ( $products as $product ) {
			if ( in_array( $product, self::JETPACK_SCAN_PLANS, true ) ) {
				return true;
			}

			if ( in_array( $product, self::JETPACK_PLANS_WITH_SCAN, true ) ) {
				return true;
			}
		}

		return false;
	}
}
