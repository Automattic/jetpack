<?php
/**
 * Boost product
 *
 * @package my-jetpack
 */

namespace Automattic\Jetpack\My_Jetpack\Products;

use Automattic\Jetpack\My_Jetpack\Product;

/**
 * Class responsible for handling the CRM product
 */
class Crm extends Product {

	/**
	 * The product slug
	 *
	 * @var string
	 */
	public static $slug = 'crm';

	/**
	 * The filename (id) of the plugin associated with this product. If not defined, it will default to the Jetpack plugin
	 *
	 * @var string
	 */
	public static $plugin_filename = 'zero-bs-crm/ZeroBSCRM.php';

	/**
	 * The slug of the plugin associated with this product. If not defined, it will default to the Jetpack plugin
	 *
	 * @var string
	 */
	public static $plugin_slug = 'zero-bs-crm';

	/**
	 * Whether this product requires a user connection
	 *
	 * @var string
	 */
	public static $requires_user_connection = false;

	/**
	 * Get the internationalized product name
	 *
	 * @return string
	 */
	public static function get_name() {
		return __( 'CRM', 'jetpack-my-jetpack' );
	}

	/**
	 * Get the internationalized product title
	 *
	 * @return string
	 */
	public static function get_title() {
		return ''; // @todo title
	}

	/**
	 * Get the internationalized product description
	 *
	 * @return string
	 */
	public static function get_description() {
		return __( 'Connect with your people', 'jetpack-my-jetpack' );
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
	 * @return array CRM features list
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
}
