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

	/**
	 * Whether something other than its switch keeps it off.
	 *
	 * @var bool
	 */
	public static $held_off = false;

	/**
	 * Whether something other than its switch keeps it off.
	 *
	 * @return bool
	 */
	public static function is_held_off() {
		return static::$held_off;
	}

	/**
	 * What is_plugin_installed() should answer.
	 *
	 * @var bool
	 */
	public static $installed = true;

	/**
	 * Whether the product's plugin is installed.
	 *
	 * @return bool
	 */
	public static function is_plugin_installed() {
		return static::$installed;
	}

	/**
	 * How often Product::activate() got as far as asking whether the product is active, its first step.
	 *
	 * @var int
	 */
	public static $activation_attempts = 0;

	/**
	 * Count the attempt and report active, so activation goes no further.
	 *
	 * @return bool
	 */
	public static function is_active() {
		++static::$activation_attempts;
		return true;
	}
}
