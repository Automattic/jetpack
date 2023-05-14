<?php
/**
 * Boost product
 *
 * @package my-jetpack
 */

namespace Automattic\Jetpack\My_Jetpack\Products;

use Automattic\Jetpack\My_Jetpack\Module_Product;
use Automattic\Jetpack\My_Jetpack\Wpcom_Products;

/**
 * Class responsible for handling the Jetpack AI product
 */
class Jetpack_Ai extends Module_Product {

	/**
	 * The product slug
	 *
	 * @var string
	 */
	public static $slug = 'jetpack-ai';

	/**
	 * The Jetpack module name
	 *
	 * @var string
	 */
	public static $module_name = 'jetpack-ai';

	/**
	 * Get the internationalized product name
	 *
	 * @return string
	 */
	public static function get_name() {
		return __( 'AI', 'jetpack-my-jetpack' );
	}

	/**
	 * Get the internationalized product title
	 *
	 * @return string
	 */
	public static function get_title() {
		return __( 'Jetpack AI', 'jetpack-my-jetpack' );
	}

	/**
	 * Get the internationalized product description
	 *
	 * @return string
	 */
	public static function get_description() {
		return __( 'Unleash Creativity, Skyrocket Efficiency', 'jetpack-my-jetpack' );
	}

	/**
	 * Get the internationalized product long description
	 *
	 * @return string
	 */
	public static function get_long_description() {
		return __( 'Soar to New Heights in Content Creation with Your AI-Powered WordPress Assistant.', 'jetpack-my-jetpack' );
	}

	/**
	 * Get the internationalized features list
	 *
	 * @return array CRM features list
	 */
	public static function get_features() {
		return array(
			__( 'Smart Text Generation', 'jetpack-my-jetpack' ),
			__( 'Dynamic Image Creation', 'jetpack-my-jetpack' ),
			__( 'Personalized Recommendations', 'jetpack-my-jetpack' ),
			__( 'Seamless WordPress Integration', 'jetpack-my-jetpack' ),
		);
	}

	/**
	 * Get the product princing details
	 *
	 * @return array Pricing details
	 */
	public static function get_pricing_for_ui() {
		return array_merge(
			array(
				'available'          => true,
				'wpcom_product_slug' => static::get_wpcom_product_slug(),
			),
			Wpcom_Products::get_product_pricing( static::get_wpcom_product_slug() )
		);
	}

	/**
	 * Get the WPCOM product slug used to make the purchase
	 *
	 * @return ?string
	 */
	public static function get_wpcom_product_slug() {
		return 'jetpack_ai_monthly';
	}

	/**
	 * Checks whether the Jetpack module is active
	 *
	 * This is a bundle and not a product. We should not use this information for anything
	 *
	 * @return bool
	 */
	public static function is_module_active() {
		return false;
	}

	/**
	 * Get the URL where the user manages the product
	 *
	 * @return ?string
	 */
	public static function get_manage_url() {
		return '';
	}
}
