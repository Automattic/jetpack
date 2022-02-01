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
	 * Get the internationalized product name
	 *
	 * @return string
	 */
	public static function get_name() {
		return __( 'CRM', 'jetpack-my-jetpack' );
	}

	/**
	 * Get the internationalized product description
	 *
	 * @return string
	 */
	public static function get_description() {
		return __( 'Connect with your people', 'jetpack-my-jetpack' );
	}
}
