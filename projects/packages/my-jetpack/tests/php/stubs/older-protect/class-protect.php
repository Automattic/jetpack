<?php
/**
 * Test stub for a Protect product that predates has_protect_page().
 *
 * @package automattic/my-jetpack
 */

namespace Automattic\Jetpack\My_Jetpack\Products;

use Automattic\Jetpack\My_Jetpack\Hybrid_Product;

/**
 * Protect as an older standalone plugin's copy of My Jetpack exposes it.
 */
class Protect extends Hybrid_Product {

	/**
	 * Whether the standalone Protect plugin is active.
	 *
	 * @var bool
	 */
	public static $standalone_plugin_active = true;

	/**
	 * Reports whether the standalone Protect plugin is active.
	 *
	 * @return bool
	 */
	public static function is_standalone_plugin_active() {
		return self::$standalone_plugin_active;
	}

	/**
	 * Get the product name.
	 *
	 * @return string
	 */
	public static function get_name() {
		return 'Protect';
	}

	/**
	 * Get the product title.
	 *
	 * @return string
	 */
	public static function get_title() {
		return 'Jetpack Protect';
	}

	/**
	 * Get the product description.
	 *
	 * @return string
	 */
	public static function get_description() {
		return '';
	}

	/**
	 * Get the product long description.
	 *
	 * @return string
	 */
	public static function get_long_description() {
		return '';
	}

	/**
	 * Get the product features.
	 *
	 * @return array
	 */
	public static function get_features() {
		return array();
	}

	/**
	 * Get the product pricing.
	 *
	 * @return array
	 */
	public static function get_pricing_for_ui() {
		return array();
	}

	/**
	 * Get the URL where the user manages the product.
	 *
	 * @return string
	 */
	public static function get_manage_url() {
		return admin_url( 'admin.php?page=jetpack-protect' );
	}
}
