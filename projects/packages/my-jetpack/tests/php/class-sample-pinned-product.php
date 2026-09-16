<?php
/**
 * Testing class
 *
 * @package my-jetpack
 */

namespace Automattic\Jetpack\My_Jetpack;

/**
 * Records whether deactivation was attempted, so tests can prove a pin stopped it.
 *
 * Products::get_products_classes() only accepts a subclass of the class it replaces, so this
 * extends the real Stats product rather than declaring a slug of its own.
 */
class Sample_Pinned_Product extends Products\Stats {

	/**
	 * Whether deactivate() ran.
	 *
	 * @var bool
	 */
	public static $deactivated = false;

	/**
	 * Deactivates the product.
	 *
	 * @return bool
	 */
	public static function deactivate() {
		static::$deactivated = true;

		return true;
	}
}
