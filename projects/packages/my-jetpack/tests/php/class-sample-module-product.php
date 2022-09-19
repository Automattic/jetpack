<?php
/**
 * Testing class
 *
 * @package my-jetpack
 */

namespace Automattic\Jetpack\My_Jetpack;

/**
 * Sample Module Product for testing
 */
class Sample_Module_Product extends Module_Product {
	/**
	 * The product slug
	 *
	 * @var string
	 */
	public static $slug = 'sample-module-product';

	/**
	 * The Jetpack module name
	 *
	 * @var string
	 */
	public static $module_name = 'sample-module-product';

	/**
	 * Get the internationalized product name. Sample data.
	 *
	 * @return string
	 */
	public static function get_name() {
		return __( 'Mock Module Product', 'jetpack-my-jetpack' );
	}

	/**
	 * Get the internationalized product title. Sample data.
	 *
	 * @return string
	 */
	public static function get_title() {
		return __( 'Mock_Module_Product', 'jetpack-my-jetpack' );
	}

	/**
	 * Get the internationalized product description. Sample data.
	 *
	 * @return string
	 */
	public static function get_description() {
		return __( 'Test your module product class', 'jetpack-my-jetpack' );
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
