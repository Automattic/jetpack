<?php
/**
 * Scan product
 *
 * @package my-jetpack
 */

namespace Automattic\Jetpack\My_Jetpack\Products;

use Automattic\Jetpack\My_Jetpack\Module_Product;

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
	 * Get the internationalized product name
	 *
	 * @return string
	 */
	public static function get_name() {
		return __( 'Scan', 'jetpack-my-jetpack' );
	}

	/**
	 * Get the internationalized product description
	 *
	 * @return string
	 */
	public static function get_description() {
		return __( 'Stay one step ahead of threats', 'jetpack-my-jetpack' );
	}

}
