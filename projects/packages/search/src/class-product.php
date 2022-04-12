<?php
/**
 * Class to fetch Search product pricing
 *
 * @package    automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

use Automattic\Jetpack\Constants;
use WP_Error;

/**
 * Class to fetch Search product pricing
 *
 * @package Automattic\Jetpack\Search
 */
class Product {
	const DEFAULT_PROMOTED_PRODUCT = 'jetpack_search';
	const DEFAULT_TIER_INFO        = array(
		'currency_code'  => 'USD',
		'discount_price' => 0,
		'full_price'     => 0,
	);

	/**
	 * Gets information about the currently promoted search product.
	 *
	 * @return object A object of the current search product being promoted if the request was successful, or a WP_Error otherwise.
	 */
	public static function get_promoted_product() {
		$search_products = static::get_products();
		if ( ! is_array( $search_products ) || ! isset( $search_products[ self::DEFAULT_PROMOTED_PRODUCT ] ) ) {
			return new WP_Error( 500, __( 'error fetching products', 'jetpack-search-pkg' ) );
		}
		return $search_products[ self::DEFAULT_PROMOTED_PRODUCT ];
	}

	/**
	 * Get search product tier for the site
	 *
	 * @param int $record_count The number of record to estimate the tier.
	 */
	public static function get_site_tier_pricing( $record_count = 0 ) {
		$product = static::get_promoted_product();
		if ( is_wp_error( $product ) || ! isset( $product['price_tier_list'] ) ) {
			return static::DEFAULT_TIER_INFO;
		}
		$price_tier_list = $product['price_tier_list'];
		array_multisort( array_column( $price_tier_list, 'maximum_units' ), SORT_ASC, $price_tier_list );

		foreach ( $product['price_tier_list'] as $price_tier ) {
			if ( $record_count <= $price_tier['maximum_units'] ) {
				break;
			}
		}

		// minimum_price and maximum_price are integers.
		$minimum_price  = $price_tier['minimum_price'] / 100;
		$discount_price = $minimum_price;
		if ( isset( $product['sale_coupon']['discount'] ) ) {
			$discount_price = static::get_discount_price( $minimum_price, $product['sale_coupon'] );
		}

		// 1. Flat fee in the same tier, so for search, `minimum_price == maximum_price`.
		// 2. `maximum_units` is empty on the highest tier, so the logic displays the highest or the highest matching tier.
		return array(
			'currency_code'   => $product['currency_code'],
			'discount_price'  => $discount_price,
			'full_price'      => $minimum_price,
			'minimum_units'   => $price_tier['minimum_units'],
			'maximum_units'   => $price_tier['maximum_units'],
			'estimated_count' => $record_count,
		);
	}

	/**
	 * Get all search products
	 */
	public static function get_products() {
		$search_products = wp_cache_get( 'search_products', Package::SLUG );
		if ( false !== $search_products ) {
			return $search_products;
		}
		$request_url    = Constants::get_constant( 'JETPACK__WPCOM_JSON_API_BASE' ) . '/rest/v1.1/products?locale=' . get_user_locale() . '&type=jetpack';
		$wpcom_response = wp_remote_get( esc_url_raw( $request_url ) );
		$response_code  = wp_remote_retrieve_response_code( $wpcom_response );
		if ( 200 !== $response_code ) {
			return new WP_Error( $response_code, __( 'error fetching products', 'jetpack-search-pkg' ) );
		}
		$products        = json_decode( wp_remote_retrieve_body( $wpcom_response ), true );
		$search_products = array_filter(
			$products,
			function ( $product, $key ) {
				return 0 === strpos( 'jetpack_search', $key );
			},
			ARRAY_FILTER_USE_BOTH
		);
		// We don't want to cache error response for too long.
		$time_to_cache = ! empty( $search_products ) ? DAY_IN_SECONDS : 5 * MINUTES_IN_SECONDS;
		wp_cache_set( 'search_products', $search_products, Package::SLUG, $time_to_cache );
		return $search_products;
	}

	/**
	 * Return discount price
	 *
	 * @param decimal $full_price Full price.
	 * @param array   $sale_coupon  Sale coupon.
	 */
	protected static function get_discount_price( $full_price, $sale_coupon ) {
		$discount_price = $full_price;
		if ( isset( $sale_coupon['discount'] ) ) {
			$coupon_start_date = strtotime( $sale_coupon['start_date'] );
			$coupon_expires    = strtotime( $sale_coupon['expires'] );
			if ( $coupon_start_date <= time() && $coupon_expires > time() ) {
				$discount        = intval( $sale_coupon['discount'] );
				$discount        = $discount > 0 && $discount <= 100 ? $discount : 0;
				$discount_price *= 1 - $discount / 100;
			}
		}
		return $discount_price;
	}

}
