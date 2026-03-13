<?php
/**
 * Scan product
 *
 * @package my-jetpack
 */

namespace Automattic\Jetpack\My_Jetpack\Products;

use Automattic\Jetpack\My_Jetpack\Module_Product;
use Automattic\Jetpack\My_Jetpack\Wpcom_Products;
use Automattic\Jetpack\Redirect;
use WP_Error;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Class responsible for handling the Scan product
 */
class Scan extends Module_Product {

	/**
	 * The product slug
	 *
	 * @var string
	 */
	public static $slug = 'scan';

	/**
	 * The Jetpack module name
	 *
	 * @var string
	 */
	public static $module_name = 'scan';

	/**
	 * The category of the product
	 *
	 * @var string
	 */
	public static $category = 'security';

	/**
	 * The feature slug that identifies the paid plan
	 *
	 * @var string
	 */
	public static $feature_identifying_paid_plan = 'scan';

	/**
	 * Get the product name
	 *
	 * @return string
	 */
	public static function get_name() {
		return 'Scan';
	}

	/**
	 * Get the product title
	 *
	 * @return string
	 */
	public static function get_title() {
		return 'Jetpack Scan';
	}

	/**
	 * Get the internationalized product description
	 *
	 * @return string
	 */
	public static function get_description() {
		return __( 'Around‑the‑clock web application firewall, and automated malware scanning.', 'jetpack-my-jetpack' );
	}

	/**
	 * Get the internationalized product long description
	 *
	 * @return string
	 */
	public static function get_long_description() {
		return __( 'Automatic scanning and one-click fixes keep your site one step ahead of security threats and malware.', 'jetpack-my-jetpack' );
	}

	/**
	 * Get the internationalized features list
	 *
	 * @return array Scan features list
	 */
	public static function get_features() {
		return array(
			_x( 'Automated daily scanning', 'Scan Product Feature', 'jetpack-my-jetpack' ),
			_x( 'One-click fixes for most issues', 'Scan Product Feature', 'jetpack-my-jetpack' ),
			_x( 'Instant email notifications', 'Scan Product Feature', 'jetpack-my-jetpack' ),
			_x( 'Access to latest Firewall rules', 'Scan Product Feature', 'jetpack-my-jetpack' ),
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
		return 'jetpack_scan';
	}

	/**
	 * Checks whether the Product is active
	 *
	 * Scan is not actually a module. Activation takes place on WPCOM. So lets consider it active if jetpack is active and has the plan.
	 *
	 * @return boolean
	 */
	public static function is_active() {
		return static::is_jetpack_plugin_active();
	}

	/**
	 * Activates the product by installing and activating its plugin
	 *
	 * @param bool|WP_Error $current_result Is the result of the top level activation actions. You probably won't do anything if it is an WP_Error.
	 * @return boolean|\WP_Error
	 */
	public static function do_product_specific_activation( $current_result ) {

		$product_activation = parent::do_product_specific_activation( $current_result );

		if ( is_wp_error( $product_activation ) && 'module_activation_failed' === $product_activation->get_error_code() ) {
			// Scan is not a module. There's nothing in the plugin to be activated, so it's ok to fail to activate the module.
			$product_activation = true;
		}

		return $product_activation;
	}

	/**
	 * Checks whether the Jetpack module is active
	 *
	 * Scan is not a module. Nothing needs to be active. Let's always consider it active.
	 *
	 * @return bool
	 */
	public static function is_module_active() {
		return true;
	}

	/**
	 * Get the product-slugs of the paid plans for this product.
	 * (Do not include bundle plans, unless it's a bundle plan itself).
	 *
	 * @return array
	 */
	public static function get_paid_plan_product_slugs() {
		return array(
			'jetpack_scan',
			'jetpack_scan_monthly',
			'jetpack_scan_bi_yearly',
		);
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
		return Redirect::get_url( 'my-jetpack-manage-scan' );
	}

	/**
	 * Get the URL where the user should be redirected after checkout
	 */
	public static function get_post_checkout_url() {
		if ( static::is_jetpack_plugin_active() ) {
			return 'admin.php?page=jetpack#/recommendations';
		}

		// If Jetpack is not active, it means that the user has another standalone plugin active
		// and it follows the `Protect` plugin flow instead of `Scan` so for now it would be safe
		// to return null and let the user go back to the My Jetpack page.
		return null;
	}
}
