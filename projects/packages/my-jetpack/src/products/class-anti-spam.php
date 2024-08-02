<?php
/**
 * Anti_Spam product
 *
 * @package my-jetpack
 */

namespace Automattic\Jetpack\My_Jetpack\Products;

use Automattic\Jetpack\My_Jetpack\Product;
use Automattic\Jetpack\My_Jetpack\Wpcom_Products;

/**
 * Class responsible for handling the Anti_Spam product
 */
class Anti_Spam extends Product {

	/**
	 * The product slug
	 *
	 * @var string
	 */
	public static $slug = 'anti-spam';

	/**
	 * The filename (id) of the plugin associated with this product. If not defined, it will default to the Jetpack plugin
	 *
	 * @var string
	 */
	public static $plugin_filename = 'akismet/akismet.php';

	/**
	 * The slug of the plugin associated with this product. If not defined, it will default to the Jetpack plugin
	 *
	 * @var string
	 */
	public static $plugin_slug = 'akismet';

	/**
	 * Whether this product requires a user connection
	 *
	 * @var string
	 */
	public static $requires_user_connection = false;

	/**
	 * Whether this product has a free offering
	 *
	 * @var bool
	 */
	public static $has_free_offering = true;

	/**
	 * Akismet has a standalone plugin
	 *
	 * @var bool
	 */
	public static $has_standalone_plugin = true;

	/**
	 * Get the product name
	 *
	 * @return string
	 */
	public static function get_name() {
		return 'Akismet Anti-spam';
	}

	/**
	 * Get the product title
	 *
	 * @return string
	 */
	public static function get_title() {
		return 'Jetpack Akismet Anti-spam';
	}

	/**
	 * Get the internationalized product description
	 *
	 * @return string
	 */
	public static function get_description() {
		return __( 'Stop comment and form spam', 'jetpack-my-jetpack' );
	}

	/**
	 * Get the internationalized product long description
	 *
	 * @return string
	 */
	public static function get_long_description() {
		return __( 'Save time and get better responses by automatically blocking spam from your comments and forms.', 'jetpack-my-jetpack' );
	}

	/**
	 * Get the internationalized features list
	 *
	 * @return array Boost features list
	 */
	public static function get_features() {
		return array(
			_x( 'Comment and form spam protection', 'Anti-Spam Product Feature', 'jetpack-my-jetpack' ),
			_x( 'Block spam without CAPTCHAs', 'Anti-Spam Product Feature', 'jetpack-my-jetpack' ),
			_x( 'Advanced stats', 'Anti-Spam Product Feature', 'jetpack-my-jetpack' ),
		);
	}

	/**
	 * Determine if the site has an Akismet plan by checking for an API key
	 * Note that some Akismet Plans are free - we're just checking for an API key and don't have the perspective of the plan attached to it here
	 *
	 * @return bool - whether an API key was found
	 */
	public static function has_paid_plan_for_product() {
		$products_with_anti_spam = array(
			'jetpack_anti_spam',
			'jetpack_complete',
			'jetpack_security',
			'jetpack_personal',
			'jetpack_premium',
			'jetpack_business',
		);
		// Check if the site has an API key for Akismet
		$akismet_api_key = apply_filters( 'akismet_get_api_key', defined( 'WPCOM_API_KEY' ) ? constant( 'WPCOM_API_KEY' ) : get_option( 'wordpress_api_key' ) );
		$fallback        = ! empty( $akismet_api_key );

		// Check for existing plans
		$purchases_data = Wpcom_Products::get_site_current_purchases();
		if ( is_wp_error( $purchases_data ) ) {
			return $fallback;
		}

		if ( is_array( $purchases_data ) && ! empty( $purchases_data ) ) {
			foreach ( $purchases_data as $purchase ) {
				foreach ( $products_with_anti_spam as $product ) {
					if ( strpos( $purchase->product_slug, $product ) !== false ) {
						return true;
					}
				}
			}
		}

		return $fallback;
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
		return 'jetpack_anti_spam';
	}

	/**
	 * Return product bundles list
	 * that supports the product.
	 *
	 * @return boolean|array Products bundle list.
	 */
	public static function is_upgradable_by_bundle() {
		return array( 'security' );
	}

	/**
	 * Get the URL where the user manages the product
	 *
	 * @return ?string
	 */
	public static function get_manage_url() {
		return admin_url( 'admin.php?page=akismet-key-config' );
	}
}
