<?php
/**
 * Fetches and store the list of Jetpack products available in WPCOM
 *
 * @package automattic/my-jetpack
 */

namespace Automattic\Jetpack\My_Jetpack;

use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Status\Visitor;
use Jetpack_Options;
use WP_Error;
/**
 * Stores the list of products available for purchase in WPCOM
 */
class Wpcom_Products {

	/**
	 * The meta name used to store the cache date
	 *
	 * @var string
	 */
	const CACHE_DATE_META_NAME = 'my-jetpack-cache-date';

	/**
	 * The meta name used to store the cache
	 *
	 * @var string
	 */
	const CACHE_META_NAME = 'my-jetpack-cache';

	const CACHE_CHECK_HASH_NAME = 'my-jetpack-wpcom-product-check-hash';

	const MY_JETPACK_PURCHASES_TRANSIENT_KEY = 'my-jetpack-purchases';

	/**
	 * Store the data on failed WPCOM requests.
	 *
	 * @var array
	 */
	private static $wpcom_request_failures = array();

	/**
	 * Fetches the list of products from WPCOM
	 *
	 * @return Object|WP_Error
	 */
	private static function get_products_from_wpcom() {
		$connection = new Connection_Manager();
		$blog_id    = \Jetpack_Options::get_option( 'id' );
		$ip         = ( new Visitor() )->get_ip( true );
		$headers    = array(
			'X-Forwarded-For' => $ip,
		);

		if ( $blog_id ) {
			$request_label   = 'get_products_from_wpcom_blog_' . $blog_id;
			$request_failure = static::get_request_failure( $request_label );
			if ( null !== $request_failure ) {
				return $request_failure;
			}

			// If has a blog id, use connected endpoint.
			$endpoint = sprintf( '/sites/%d/products/?_locale=%s&type=jetpack', $blog_id, get_user_locale() );

			// If available in the user data, set the user's currency as one of the params
			if ( $connection->is_user_connected() ) {
				$user_details = $connection->get_connected_user_data();
				if ( ! empty( $user_details['user_currency'] ) && $user_details['user_currency'] !== 'USD' ) {
					$endpoint .= sprintf( '&currency=%s', $user_details['user_currency'] );
				}
			}

			$wpcom_request = Client::wpcom_json_api_request_as_blog(
				$endpoint,
				'1.1',
				array(
					'method'  => 'GET',
					'headers' => $headers,
				)
			);
		} else {
			$request_label   = 'get_products_from_wpcom';
			$request_failure = static::get_request_failure( $request_label );
			if ( null !== $request_failure ) {
				return $request_failure;
			}

			$endpoint = 'https://public-api.wordpress.com/rest/v1.1/products?locale=' . get_user_locale() . '&type=jetpack';

			$wpcom_request = wp_remote_get(
				esc_url_raw( $endpoint ),
				array(
					'headers' => $headers,
				)
			);
		}

		$response_code = wp_remote_retrieve_response_code( $wpcom_request );

		if ( 200 === $response_code ) {
			return json_decode( wp_remote_retrieve_body( $wpcom_request ) );
		} else {
			$error = new WP_Error(
				'failed_to_fetch_wpcom_products',
				esc_html__( 'Unable to fetch the products list from WordPress.com', 'jetpack-my-jetpack' ),
				array( 'status' => $response_code )
			);
			static::set_request_failure( $request_label, $error );
			return $error;
		}
	}

	/**
	 * Super unintelligent hash string that can help us reset the cache after connection changes
	 * This is important because the currency can change after a user connects depending on what is set in their profile
	 *
	 * @return string
	 */
	private static function build_check_hash() {
		static $has_user_data_fetch_error = false;

		$hash_string = 'check_hash_';
		$connection  = new Connection_Manager();

		if ( $connection->is_connected() ) {
			$hash_string .= 'site_connected_';
		}

		if ( $connection->is_user_connected() ) {
			$hash_string .= 'user_connected';
			// Add the user's currency
			$user_details = $has_user_data_fetch_error ? false : $connection->get_connected_user_data();

			if ( $user_details === false ) {
				$has_user_data_fetch_error = true;
			} elseif ( ! empty( $user_details['user_currency'] ) ) {
				$hash_string .= '_' . $user_details['user_currency'];
			}
		}

		return md5( $hash_string );
	}

	/**
	 * Update the cache with new information retrieved from WPCOM
	 *
	 * We store one cache for each user, as the information is internationalized based on user preferences
	 * Also, the currency is based on the user IP address
	 *
	 * @param Object $products_list The products list as received from WPCOM.
	 * @return bool
	 */
	private static function update_cache( $products_list ) {
		update_user_meta( get_current_user_id(), self::CACHE_DATE_META_NAME, time() );
		update_user_meta( get_current_user_id(), self::CACHE_CHECK_HASH_NAME, self::build_check_hash() );
		return update_user_meta( get_current_user_id(), self::CACHE_META_NAME, $products_list );
	}

	/**
	 * Checks if the cache is old, meaning we need to fetch new data from WPCOM
	 */
	private static function is_cache_old() {
		if ( empty( self::get_products_from_cache() ) ) {
			return true;
		}

		// This allows the cache to reset after the site or user connects/ disconnects
		$check_hash = get_user_meta( get_current_user_id(), self::CACHE_CHECK_HASH_NAME, true );
		if ( $check_hash !== self::build_check_hash() ) {
			return true;
		}

		$cache_date = get_user_meta( get_current_user_id(), self::CACHE_DATE_META_NAME, true );
		return time() - (int) $cache_date > DAY_IN_SECONDS;
	}

	/**
	 * Gets the product list from the user cache
	 */
	private static function get_products_from_cache() {
		return get_user_meta( get_current_user_id(), self::CACHE_META_NAME, true );
	}

	/**
	 * Gets the product list
	 *
	 * Attempts to retrieve the products list from the user cache if cache is not too old.
	 * If cache is old, it will attempt to fetch information from WPCOM. If it fails, we return what we have in cache, if anything, otherwise we return an error.
	 *
	 * @param bool $skip_cache If true it will ignore the cache and attempt to fetch fresh information from WPCOM.
	 *
	 * @return Object|WP_Error
	 */
	public static function get_products( $skip_cache = false ) {
		// This is only available for logged in users.
		if ( ! get_current_user_id() ) {
			return null;
		}
		if ( ! self::is_cache_old() && ! $skip_cache ) {
			return self::get_products_from_cache();
		}

		$products = self::get_products_from_wpcom();
		if ( is_wp_error( $products ) ) {
			// Let's see if we have it cached.
			$cached = self::get_products_from_cache();
			if ( ! empty( $cached ) ) {
				return $cached;
			} else {
				return $products;
			}
		}

		self::update_cache( $products );
		return $products;
	}

	/**
	 * Get one product
	 *
	 * @param string $product_slug The product slug.
	 * @param bool   $renew_cache A flag to force the cache to be renewed.
	 *
	 * @return ?Object The product details if found
	 */
	public static function get_product( $product_slug, $renew_cache = false ) {
		$products = self::get_products( $renew_cache );
		if ( ! empty( $products->$product_slug ) ) {
			return $products->$product_slug;
		}
	}

	/**
	 * Get only the product currency code and price in an array
	 *
	 * @param string $product_slug The product slug.
	 *
	 * @return array An array with currency_code and full_price. Empty array if product not found.
	 */
	public static function get_product_pricing( $product_slug ) {
		$product = self::get_product( $product_slug );
		if ( empty( $product ) ) {
			return array();
		}

		$cost                  = $product->cost;
		$discount_price        = $cost;
		$is_introductory_offer = false;
		$introductory_offer    = null;

		// Get/compute the discounted price.
		if ( isset( $product->introductory_offer->cost_per_interval ) ) {
			$discount_price        = $product->introductory_offer->cost_per_interval;
			$is_introductory_offer = true;
			$introductory_offer    = $product->introductory_offer;
		}

		$pricing = array(
			'currency_code'         => $product->currency_code,
			'full_price'            => $cost,
			'discount_price'        => $discount_price,
			'is_introductory_offer' => $is_introductory_offer,
			'introductory_offer'    => $introductory_offer,
			'product_term'          => $product->product_term,
		);

		return self::populate_with_discount( $product, $pricing, $discount_price );
	}

	/**
	 * Populate the pricing array with the discount information.
	 *
	 * @param object $product - The product object.
	 * @param array  $pricing - The pricing array.
	 * @param float  $price   - The price to be discounted.
	 * @return array The pricing array with the discount information.
	 */
	public static function populate_with_discount( $product, $pricing, $price ) {
		// Check whether the product has a coupon.
		if ( ! isset( $product->sale_coupon ) ) {
			return $pricing;
		}

		// Check whether it is still valid.
		$coupon            = $product->sale_coupon;
		$coupon_start_date = strtotime( $coupon->start_date );
		$coupon_expires    = strtotime( $coupon->expires );
		if ( $coupon_start_date > time() || $coupon_expires < time() ) {
			return $pricing;
		}

		$coupon_discount = intval( $coupon->discount );

		// Populate response with coupon discount.
		$pricing['coupon_discount'] = $coupon_discount;

		// Apply coupon discount to the price.
		$pricing['discount_price'] = $price * ( 100 - $coupon_discount ) / 100;

		return $pricing;
	}

	/**
	 * Gets the site purchases from WPCOM.
	 *
	 * @return Object|WP_Error
	 */
	public static function get_site_current_purchases() {
		static $purchases = null;

		if ( $purchases !== null ) {
			return $purchases;
		}

		// Check for a cached value before doing lookup
		$stored_purchases = get_transient( self::MY_JETPACK_PURCHASES_TRANSIENT_KEY );
		if ( $stored_purchases !== false ) {
			return $stored_purchases;
		}

		$request_failure = static::get_request_failure( 'get_site_current_purchases' );
		if ( null !== $request_failure ) {
			return $request_failure;
		}

		$site_id = Jetpack_Options::get_option( 'id' );

		$response = Client::wpcom_json_api_request_as_blog(
			sprintf( '/sites/%d/purchases', $site_id ),
			'1.1',
			array(
				'method' => 'GET',
			)
		);
		if ( 200 !== wp_remote_retrieve_response_code( $response ) ) {
			$error = new WP_Error( 'purchases_state_fetch_failed' );
			static::set_request_failure( 'get_site_current_purchases', $error );
			return $error;
		}

		$body      = wp_remote_retrieve_body( $response );
		$purchases = json_decode( $body );
		// Set short transient to help with repeated lookups on the same page load
		set_transient( self::MY_JETPACK_PURCHASES_TRANSIENT_KEY, $purchases, 5 );

		return $purchases;
	}

	/**
	 * Reset the request failures to retry the API requests.
	 *
	 * @return void
	 */
	public static function reset_request_failures() {
		static::$wpcom_request_failures = array();
	}

	/**
	 * Record the request failure to prevent repeated requests.
	 *
	 * @param string   $request_label The request label.
	 * @param WP_Error $error The error.
	 *
	 * @return void
	 */
	private static function set_request_failure( $request_label, WP_Error $error ) {
		static::$wpcom_request_failures[ $request_label ] = $error;
	}

	/**
	 * Get the pre-saved request failure if exists.
	 *
	 * @param string $request_label The request label.
	 *
	 * @return null|WP_Error
	 */
	private static function get_request_failure( $request_label ) {
		if ( array_key_exists( $request_label, static::$wpcom_request_failures ) ) {
			return static::$wpcom_request_failures[ $request_label ];
		}

		return null;
	}
}
