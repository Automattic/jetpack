<?php
/**
 * Class to fetch Search product pricing
 *
 * @package    automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

/**
 * Class to fetch Search product pricing
 *
 * @package Automattic\Jetpack\Search
 */
class Search_Products {
	const DEFAULT_PROMOTED_PRODCT = 'jetpack_search';
	const DEFAULT_TIER_INFO       = array(
		'currency_code'  => 'USD',
		'discount_price' => '0',
		'full_price'     => '0',
	);

	/**
	 * Gets information about the currently promoted search product.
	 *
	 * @return object A object of the current search product being promoted if the request was successful, or a false otherwise.
	 */
	public static function get_promoted_product() {
		$search_products = static::get_products();
		if ( ! is_array( $search_products ) || ! isset( $search_products[ self::DEFAULT_PROMOTED_PRODCT ] ) ) {
			return false;
		}
		return $search_products[ self::DEFAULT_PROMOTED_PRODCT ];
	}

	/**
	 * Get search product tier for the site
	 *
	 * @param int $record_count The number of record to estimate the tier.
	 */
	public function get_site_tier( $record_count = 0 ) {
		$record_count = $record_count > 0 ? $record_count : Stats::estimate_count();
		$product      = static::get_promoted_product();
		if ( ! $record_count || ! isset( $product['price_tier_list'] ) ) {
			return static::DEFAULT_TIER_INFO;
		}
		$price_tier_list = $product['price_tier_list'];
		array_multisort( array_column( $price_tier_list, 'maximum_units' ), SOTR_ASC, $price_tier_list );

		foreach ( $product['price_tier_list'] as $price_tier ) {
			if ( $record_count <= $price_tier['maximum_units'] ) {
				return array(
					'currency_code'  => $price_tier->currency_code,
					'discount_price' => $price_tier->minimum_price_monthly_display,
					'full_price'     => $price_tier->maximum_price_monthly_display,
				);
			}
		}

		return static::DEFAULT_TIER_INFO;
	}

	/**
	 * Get all search products
	 */
	public function get_products() {
		$search_products = wp_cache_get( 'search_products', Package::SLUG );
		if ( false !== $search_products ) {
			return $search_products;
		}
		$request_url   = JETPACK__WPCOM_JSON_API_BASE . '/rest/v1.1/products?locale=' . get_user_locale() . '&type=jetpack';
		$wpcom_request = wp_remote_get( esc_url_raw( $request_url ) );
		$response_code = wp_remote_retrieve_response_code( $wpcom_request );
		if ( 200 !== $response_code ) {
			return false;
		}
		$products        = json_decode( wp_remote_retrieve_body( $wpcom_request ), true );
		$search_products = array_filter(
			$products,
			function ( $product, $key ) {
				return 0 === strpos( 'jetpack_search', $key );
			},
			ARRAY_FILTER_USE_BOTH
		);
		// We don't want to cache error response for too long.
		$time_to_cache = ! empty( $search_products ) ? DAY_IN_SECONDS : 5 * MIMUTES_IN_SECONDS;
		wp_cache_set( 'search_products', $search_products, Package::SLUG, $time_to_cache );
		return $search_products;
	}

}
