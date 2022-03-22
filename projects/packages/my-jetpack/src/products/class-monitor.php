<?php
/**
 * Monitor product
 *
 * @package my-jetpack
 */

namespace Automattic\Jetpack\My_Jetpack\Products;

use Automattic\Jetpack\My_Jetpack\Module_Product;

/**
 * Class responsible for handling the Monitor product.
 */
class Monitor extends Module_Product {

	/**
	 * The product slug
	 *
	 * @var string
	 */
	public static $slug = 'monitor';

	/**
	 * The Jetpack module name
	 *
	 * @var string
	 */
	public static $module_name = 'monitor';

	/**
	 * Get the internationalized product name
	 *
	 * @return string
	 */
	public static function get_name() {
		return __( 'Monitor', 'jetpack-my-jetpack' );
	}

	/**
	 * Get the internationalized product title
	 *
	 * @return string
	 */
	public static function get_title() {
		return __( 'Jetpack Monitor', 'jetpack-my-jetpack' );
	}

	/**
	 * Get the internationalized product description
	 *
	 * @return string
	 */
	public static function get_description() {
		return __( 'Know when your site goes offline', 'jetpack-my-jetpack' );
	}

	/**
	 * Get the internationalized product long description
	 *
	 * @return string
	 */
	public static function get_long_description() {
		return __( "Jetpack's downtime monitoring will continuously watch your site and alert you the moment that downtime is detected.", 'jetpack-my-jetpack' );
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
	 * Get the product princing details
	 *
	 * @return array Pricing details
	 */
	public static function get_pricing_for_ui() {
		return array(
			'available' => true,
			'is_free'   => true,
		);
	}

	/**
	 * Get the URL the user is taken after activating the product
	 *
	 * @return ?string
	 */
	public static function get_post_activation_url() {
		return ''; // stay in My Jetpack page.
	}

	/**
	 * Get the URL where the user manages the product
	 *
	 * @return ?string
	 */
	public static function get_manage_url() {
		if ( static::is_active() ) {
			return admin_url( 'admin.php?page=jetpack#/settings?term=monitor' );
		}
	}
}
