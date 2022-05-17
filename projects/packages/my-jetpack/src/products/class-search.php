<?php
/**
 * Search product
 *
 * @package my-jetpack
 */

namespace Automattic\Jetpack\My_Jetpack\Products;

use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\My_Jetpack\Hybrid_Product;
use Automattic\Jetpack\My_Jetpack\Wpcom_Products;
use Jetpack_Options;
use WP_Error;

/**
 * Class responsible for handling the Search product
 */
class Search extends Hybrid_Product {
	/**
	 * The product slug
	 *
	 * @var string
	 */
	public static $slug = 'search';

	/**
	 * The Jetpack module name
	 *
	 * @var string
	 */
	public static $module_name = 'search';

	/**
	 * The slug of the plugin associated with this product.
	 *
	 * @var string
	 */
	public static $plugin_slug = 'jetpack-search';

	/**
	 * The filename (id) of the plugin associated with this product.
	 *
	 * @var string
	 */
	public static $plugin_filename = array(
		'jetpack-search/jetpack-search.php',
		'search/jetpack-search.php',
		'jetpack-search-dev/jetpack-search.php',
	);

	/**
	 * Get the internationalized product name
	 *
	 * @return string
	 */
	public static function get_name() {
		return __( 'Search', 'jetpack-my-jetpack' );
	}

	/**
	 * Get the internationalized product title
	 *
	 * @return string
	 */
	public static function get_title() {
		return __( 'Jetpack Search', 'jetpack-my-jetpack' );
	}

	/**
	 * Get the internationalized product description
	 *
	 * @return string
	 */
	public static function get_description() {
		return __( 'Help them find what they need', 'jetpack-my-jetpack' );
	}

	/**
	 * Get the internationalized product long description
	 *
	 * @return string
	 */
	public static function get_long_description() {
		return __( 'Help your site visitors find answers instantly so they keep reading and buying. Great for sites with a lot of content.', 'jetpack-my-jetpack' );
	}

	/**
	 * Get the internationalized features list
	 *
	 * @return array Boost features list
	 */
	public static function get_features() {
		return array(
			__( 'Instant search and indexing', 'jetpack-my-jetpack' ),
			__( 'Powerful filtering', 'jetpack-my-jetpack' ),
			__( 'Supports 29 languages', 'jetpack-my-jetpack' ),
			__( 'Spelling correction', 'jetpack-my-jetpack' ),
		);
	}

	/**
	 * Get the product princing details
	 *
	 * @return array Pricing details
	 */
	public static function get_pricing_for_ui() {
		// Basic pricing info.
		$pricing = array_merge(
			array(
				'available'          => true,
				'wpcom_product_slug' => static::get_wpcom_product_slug(),
			),
			Wpcom_Products::get_product_pricing( static::get_wpcom_product_slug() )
		);

		$record_count = intval( Search_Stats::estimate_count() );

		// Check whether the price is available.
		// Bail early return the pricing info if not.
		$product = Wpcom_Products::get_product( static::get_wpcom_product_slug() );
		if ( ! isset( $product->price_tier_list ) ) {
			return $pricing;
		}

		// Sort the tiers.
		$price_tier_list = $product->price_tier_list;
		array_multisort( array_column( $price_tier_list, 'maximum_units' ), SORT_ASC, $price_tier_list );

		// Pick the first tier that is less than or equal to the record count.
		foreach ( $product->price_tier_list as $price_tier ) {
			if ( $record_count <= $price_tier->maximum_units ) {
				break;
			}
		}

		// Compute the minimum price.
		$minimum_price = $price_tier->minimum_price / 100;

		// Re define the display price based on the tier.
		$pricing = Wpcom_Products::populate_with_discount( $product, $pricing, $minimum_price );

		// 1. Flat fee in the same tier, so for search, `minimum_price == maximum_price`.
		// 2. `maximum_units` is empty on the highest tier, so the logic displays the highest or the highest matching tier.
		return array_merge(
			$pricing,
			array(
				'minimum_units'   => $price_tier->minimum_units,
				'maximum_units'   => $price_tier->maximum_units,
				'estimated_count' => $record_count,
				'full_price'      => $minimum_price, // reset the full price to the minimum price.
			)
		);
	}

	/**
	 * Get the WPCOM product slug used to make the purchase
	 *
	 * @return ?string
	 */
	public static function get_wpcom_product_slug() {
		return 'jetpack_search';
	}

	/**
	 * Hits the wpcom api to check Search status.
	 *
	 * @todo Maybe add caching.
	 *
	 * @return Object|WP_Error
	 */
	private static function get_state_from_wpcom() {
		static $status = null;

		if ( $status !== null ) {
			return $status;
		}

		$blog_id = Jetpack_Options::get_option( 'id' );

		$response = Client::wpcom_json_api_request_as_blog(
			'/sites/' . $blog_id . '/jetpack-search/plan',
			'2',
			array( 'timeout' => 2 ),
			null,
			'wpcom'
		);

		if ( 200 !== wp_remote_retrieve_response_code( $response ) ) {
			return new WP_Error( 'search_state_fetch_failed' );
		}

		$body   = wp_remote_retrieve_body( $response );
		$status = json_decode( $body );
		return $status;
	}

	/**
	 * Checks whether the current plan of the site already supports the product
	 *
	 * Returns true if it supports. Return false if a purchase is still required.
	 *
	 * Free products will always return true.
	 *
	 * @return boolean
	 */
	public static function has_required_plan() {
		$search_state = static::get_state_from_wpcom();
		return ! empty( $search_state->supports_search ) || ! empty( $search_state->supports_instant_search );
	}

	/**
	 * Get the URL the user is taken after activating the product
	 *
	 * @return ?string
	 */
	public static function get_post_activation_url() {
		return ''; // stay in My Jetpack page or continue the purchase flow if needed.
	}

	/**
	 * Get the URL where the user manages the product
	 *
	 * @return ?string
	 */
	public static function get_manage_url() {
		return admin_url( 'admin.php?page=jetpack-search' );
	}

	/**
	 * Checks whether the Product is active
	 *
	 * @return boolean
	 */
	public static function is_active() {
		return parent::is_active() && static::has_required_plan();
	}

}
