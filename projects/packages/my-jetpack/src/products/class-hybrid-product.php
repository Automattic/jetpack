<?php
/**
 * Base product
 *
 * @package my-jetpack
 */

namespace Automattic\Jetpack\My_Jetpack;

/**
 * Class responsible for handling the hybrid products
 *
 * Hybrid products are those that may work both as a stand-alone plugin or with the Jetpack plugin.
 *
 * In case Jetpack plugin is active, it will not attempt to install its stand-alone plugin.
 *
 * But if Jetpack plugin is not active, then it will prompt to install and activate its stand-alone plugin.
 */
abstract class Hybrid_Product extends Product {

	/**
	 * Checks whether the Product is active
	 *
	 * @return boolean
	 */
	public static function is_active() {
		return static::is_plugin_active() || static::is_jetpack_plugin_active();
	}

}
