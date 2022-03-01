<?php
/**
 * Search product
 *
 * @package my-jetpack
 */

namespace Automattic\Jetpack\My_Jetpack\Products;

use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\My_Jetpack\Module_Product;
use Automattic\Jetpack\My_Jetpack\Wpcom_Products;
use Jetpack_Options;
use WP_Error;

/**
 * Class responsible for handling the Search product
 */
class Search extends Module_Product {

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
		return __( 'Jetpack Site Search', 'jetpack-my-jetpack' );
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
		return array_merge(
			array(
				'available'          => true,
				'wpcom_product_slug' => static::get_wpcom_product_slug(),
				'discount'           => 50, // hardcoded - it could be overwritten by the wpcom product.
			),
			Wpcom_Products::get_product_pricing( static::get_wpcom_product_slug() )
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

		if ( ! is_null( $status ) ) {
			return $status;
		}

		$blog_id = Jetpack_Options::get_option( 'id' );

		$response = Client::wpcom_json_api_request_as_blog(
			'/sites/' . $blog_id . '/jetpack-search/plan',
			'2',
			array(),
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
		return ''; // stay in My Jetpack page.
	}

	/**
	 * Get the URL where the user manages the product
	 *
	 * @return ?string
	 */
	public static function get_manage_url() {
		if ( static::is_active() ) {
			return admin_url( 'admin.php?page=jetpack-search-configure' );
		}
	}
}
