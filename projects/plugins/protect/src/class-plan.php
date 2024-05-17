<?php
/**
 * Class to handle the Protect plan
 *
 * @package automattic/jetpack-protect-plugin
 */

namespace Automattic\Jetpack\Protect;

use Automattic\Jetpack\Current_Plan;

/**
 * The Plan class.
 */
class Plan {
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
	 * Has Required Plan
	 *
	 * @param bool $force_refresh Refresh the local plan cache from wpcom.
	 * @return bool True when the site has a plan or product that supports the paid Protect tier.
	 */
	public static function has_required_plan( $force_refresh = false ) {
		static $has_scan = null;
		if ( null === $has_scan || $force_refresh ) {
			$products = array_column( Current_Plan::get_products(), 'product_slug' );

			// Check for a plan or product that enables scan.
			$plan_supports_scan = Current_Plan::supports( 'scan', true );
			$has_scan_product   = count( array_intersect( array( 'jetpack_scan', 'jetpack_scan_monthly' ), $products ) ) > 0;
			$has_scan           = $plan_supports_scan || $has_scan_product;
		}

		return $has_scan;
	}
}
