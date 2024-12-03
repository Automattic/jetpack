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
	 * The feature slug that identifies the paid plan
	 *
	 * @var string
	 */
	public static $feature_identifying_paid_plan = 'antispam';

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
		return __( 'Keep your site free from spam and bots', 'jetpack-my-jetpack' );
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
	 * Get the product-slugs of the paid plans for this product.
	 * (Do not include bundle plans, unless it's a bundle plan itself).
	 *
	 * @return array
	 */
	public static function get_paid_plan_product_slugs() {
		return array(
			'jetpack_anti_spam',
			'jetpack_anti_spam_monthly',
			'jetpack_anti_spam_bi_yearly',
		);
	}

	/**
	 * Determine if the site has an Akismet plan.
	 *
	 * @return bool - whether an API key was found
	 */
	public static function has_paid_plan_for_product() {
		if ( parent::has_paid_plan_for_product() ) {
			return true;
		}
		// As a fallback, we're checking if the site has an API key for Akismet.
		// Note that some Akismet Plans are free - we're just checking for an API key and don't have the perspective of the plan attached to it here
		$akismet_api_key = apply_filters( 'akismet_get_api_key', defined( 'WPCOM_API_KEY' ) ? constant( 'WPCOM_API_KEY' ) : get_option( 'wordpress_api_key' ) );
		if ( ! empty( $akismet_api_key ) ) {
			return true;

		}

		return false;
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
		return array( 'security', 'complete' );
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
