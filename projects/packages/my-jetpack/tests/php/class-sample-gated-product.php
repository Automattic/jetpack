<?php
/**
 * Testing class
 *
 * @package my-jetpack
 */

namespace Automattic\Jetpack\My_Jetpack;

/**
 * Stands in for a registered product so tests can drive is_activated() directly.
 *
 * Products::get_products_classes() only accepts a subclass of the class it replaces, so this
 * extends the real Stats product rather than declaring a slug of its own.
 */
class Sample_Gated_Product extends Products\Stats {

	/**
	 * What is_activated() should answer.
	 *
	 * @var bool
	 */
	public static $active = true;

	/**
	 * Checks whether the site has switched the product on.
	 *
	 * @return bool
	 */
	public static function is_activated() {
		return static::$active;
	}
}
