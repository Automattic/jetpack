<?php
/**
 * Security product
 *
 * @package my-jetpack
 */

namespace Automattic\Jetpack\My_Jetpack\Products;

use Automattic\Jetpack\My_Jetpack\Module_Product;

/**
 * Class responsible for handling the Security product
 */
class Security extends Module_Product {

	/**
	 * The product slug
	 *
	 * @var string
	 */
	public static $slug = 'security';

	/**
	 * The Jetpack module name
	 *
	 * @var string
	 */
	public static $module_name = 'security';

	/**
	 * Get the internationalized product name
	 *
	 * @return string
	 */
	public static function get_name() {
		return __( 'Security', 'jetpack-my-jetpack' );
	}

	/**
	 * Get the internationalized product title
	 *
	 * @return string
	 */
	public static function get_title() {
		return __( 'Security', 'jetpack-my-jetpack' );
	}

	/**
	 * Get the internationalized product description
	 *
	 * @return string
	 */
	public static function get_description() {
		return __( 'Comprehensive site security, including Backup, Scan, and Anti-spam.', 'jetpack-my-jetpack' );
	}

	/**
	 * Get the internationalized product long description
	 *
	 * @return string
	 */
	public static function get_long_description() {
		return __( 'Comprehensive site security, including Backup, Scan, and Anti-spam.', 'jetpack-my-jetpack' );
	}

	/**
	 * Get the internationalized features list
	 *
	 * @return array Boost features list
	 */
	public static function get_features() {
		return array(
			_x( 'Real-time cloud backups with 10GB storage', 'Security Product Feature', 'jetpack-my-jetpack' ),
			_x( 'Automated real-time malware scan', 'Security Product Feature', 'jetpack-my-jetpack' ),
			_x( 'One-click fixes for most threats', 'Security Product Feature', 'jetpack-my-jetpack' ),
			_x( 'Comment & form spam protection', 'Security Product Feature', 'jetpack-my-jetpack' ),
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
				'available'            => true,
				'show_promotion'       => true,
				'full_price'           => 24.92,
				'promotion_percentage' => 50,
			)
		);
	}

	/**
	 * Get the WPCOM product slug used to make the purchase
	 *
	 * @return ?string
	 */
	public static function get_wpcom_product_slug() {
		return 'jetpack_security';
	}

	/**
	 * Checks whether the current plan (or purchases) of the site already supports the product
	 *
	 * @return boolean
	 */
	public static function has_required_plan() {
		return false;
	}

	/**
	 * Checks whether product is a bundle.
	 *
	 * @return boolean True
	 */
	public static function is_bundle_product() {
		return true;
	}

	/**
	 * Return all the products it contains.
	 *
	 * @return Array Product slugs
	 */
	public static function get_supported_products() {
		return array( 'backup', 'scan', 'anti-spam' );
	}
}
