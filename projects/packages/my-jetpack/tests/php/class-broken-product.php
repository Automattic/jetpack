<?php
/**
 * Testing class
 *
 * @package my-jetpack
 */

namespace Automattic\Jetpack\My_Jetpack;

/**
 * Broken product for testing
 */
class Broken_Product extends Module_Product {
	/**
	 * Product slug
	 *
	 * @var string
	 */
	public static $slug = 'broken';

	/**
	 * Get the product name
	 *
	 * @return string
	 */
	public static function get_name() {
		return 'CRM';
	}

	/**
	 * Get the product title
	 *
	 * @return string
	 */
	public static function get_title() {
		return 'Jetpack CRM';
	}

	/**
	 * Get the internationalized product description
	 *
	 * @return string
	 */
	public static function get_description() {
		return __( 'Connect with your people', 'jetpack-my-jetpack' );
	}

	/**
	 * Get the internationalized product long description
	 *
	 * @return string
	 */
	public static function get_long_description() {
		return ''; // @todo Add long description
	}

	/**
	 * Get the internationalized features list
	 *
	 * @return array Boost features list
	 */
	public static function get_features() {
		return array();
	}

	/**
	 * Get the product pricing
	 *
	 * @return array
	 */
	public static function get_pricing_for_ui() {
		return array();
	}

	/**
	 * Get the URL where the user manages the product
	 *
	 * @return ?string
	 */
	public static function get_manage_url() {
		return '';
	}
}
