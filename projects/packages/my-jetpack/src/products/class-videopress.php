<?php
/**
 * VideoPress product
 *
 * @package my-jetpack
 */

namespace Automattic\Jetpack\My_Jetpack\Products;

use Automattic\Jetpack\My_Jetpack\Module_Product;

/**
 * Class responsible for handling the VideoPress product
 */
class Videopress extends Module_Product {

	/**
	 * The product slug
	 *
	 * @var string
	 */
	public static $slug = 'videopress';

	/**
	 * The Jetpack module name
	 *
	 * @var string
	 */
	public static $module_name = 'videopress';

	/**
	 * Get the internationalized product name
	 *
	 * @return string
	 */
	public static function get_name() {
		return __( 'VideoPress', 'jetpack-my-jetpack' );
	}

	/**
	 * Get the internationalized product description
	 *
	 * @return string
	 */
	public static function get_description() {
		return __( 'High quality, ad-free video', 'jetpack-my-jetpack' );
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

}
