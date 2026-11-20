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
	 * Whether the product's standalone plugin reads as installed.
	 *
	 * @var bool
	 */
	public static $installed = true;

	/**
	 * The standalone plugin's filename while $installed, and the Jetpack plugin's as found on disk.
	 *
	 * @param string $plugin Which plugin to check. jetpack for the jetpack plugin or product for the product specific plugin.
	 * @return ?string
	 */
	public static function get_installed_plugin_filename( $plugin = 'product' ) {
		if ( self::JETPACK_PLUGIN_SLUG === $plugin ) {
			return parent::get_installed_plugin_filename( $plugin );
		}

		return static::$installed ? 'jetpack-stats/jetpack-stats.php' : null;
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
