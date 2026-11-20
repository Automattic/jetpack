<?php
/**
 * Testing class
 *
 * @package my-jetpack
 */

namespace Automattic\Jetpack\My_Jetpack;

/**
 * Sample Product for testing the base class, which neither a module nor a standalone plugin gates.
 */
class Sample_Plain_Product extends Product {
	/**
	 * The product slug
	 *
	 * @var string
	 */
	public static $slug = 'sample-plain-product';

	/**
	 * The slug of the plugin that delivers this product.
	 *
	 * @var string
	 */
	public static $plugin_slug = 'jetpack-backup';

	/**
	 * The filename of the plugin that delivers this product.
	 *
	 * @var string
	 */
	public static $plugin_filename = 'jetpack-backup/jetpack-backup.php';

	/**
	 * Get the product name. Sample data.
	 *
	 * @return string
	 */
	public static function get_name() {
		return 'Mock Plain Product';
	}

	/**
	 * Get the product title. Sample data.
	 *
	 * @return string
	 */
	public static function get_title() {
		return 'Mock_Plain_Product';
	}

	/**
	 * Get the internationalized product description. Sample data.
	 *
	 * @return string
	 */
	public static function get_description() {
		return __( 'Test your plain product class', 'jetpack-my-jetpack' );
	}

	/**
	 * Get the internationalized product long description. Sample data.
	 *
	 * @return string
	 */
	public static function get_long_description() {
		return '';
	}

	/**
	 * Get the internationalized features list. Sample data.
	 *
	 * @return array
	 */
	public static function get_features() {
		return array();
	}

	/**
	 * Get the product pricing. Sample data.
	 *
	 * @return array
	 */
	public static function get_pricing_for_ui() {
		return array();
	}

	/**
	 * Get the URL where the user manages the product. Sample data.
	 *
	 * @return ?string
	 */
	public static function get_manage_url() {
		return '';
	}
}
