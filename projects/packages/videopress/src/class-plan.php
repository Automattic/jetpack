<?php
/**
 * The Plan class.
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack\VideoPress;

/**
 * The Plan class.
 */
class Plan {
	/**
	 * The meta name used to store the cache date
	 *
	 * @var string
	 */
	const CACHE_DATE_META_NAME = 'videopress-cache-date';

	/**
	 * Valid pediord for the cache: One week.
	 */
	const CACHE_VALIDITY_PERIOD = 7 * DAY_IN_SECONDS;

	/**
	 * The meta name used to store the cache
	 *
	 * @var string
	 */
	const CACHE_META_NAME = 'videopress-cache';

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
	 * @return array
	 */
	public static function get_product() {
		$request_url   = 'https://public-api.wordpress.com/rest/v1.1/products?locale=' . get_user_locale() . '&type=jetpack';
		$wpcom_request = wp_remote_get( esc_url_raw( $request_url ) );
		$response_code = wp_remote_retrieve_response_code( $wpcom_request );

		if ( 200 === $response_code ) {
			$products = json_decode( wp_remote_retrieve_body( $wpcom_request ) );
			if ( ! isset( $products->jetpack_videopress ) || ! isset( $products->jetpack_videopress_monthly ) ) {
				return array();
			}

			// Pick the desired product...
			$product = $products->jetpack_videopress;

			$product->product_price = array(
				'yearly'  => array(
					'price'        => $products->jetpack_videopress->cost,
					'priceByMonth' => round( $products->jetpack_videopress->cost / 12, 2 ),
					'currency'     => $products->jetpack_videopress->currency_code,
				),
				'monthly' => array(
					'price'    => $products->jetpack_videopress_monthly->cost,
					'currency' => $products->jetpack_videopress_monthly->currency_code,
				),
			);

			// ... and store it into the cache.
			update_user_meta( get_current_user_id(), self::CACHE_DATE_META_NAME, time() );
			update_user_meta( get_current_user_id(), self::CACHE_META_NAME, $product );

			return $product;
		}

		return new \WP_Error(
			'failed_to_fetch_data',
			esc_html__( 'Unable to fetch the requested data.', 'jetpack-videopress-pkg' ),
			array(
				'status'  => $response_code,
				'request' => $wpcom_request,
			)
		);
	}
}
