<?php
/**
 * Jetpack Blaze product
 *
 * @package my-jetpack
 */

namespace Automattic\Jetpack\My_Jetpack\Products;

use Automattic\Jetpack\Blaze as Jetpack_Blaze;
use Automattic\Jetpack\My_Jetpack\Module_Product;
use Automattic\Jetpack\Redirect;

/**
 * Class responsible for handling the Jetpack Blaze product
 */
class Blaze extends Module_Product {
	/**
	 * The product slug
	 *
	 * @var string
	 */
	public static $slug = 'blaze';

	/**
	 * The Jetpack module name associated with this product
	 *
	 * @var string|null
	 */
	public static $module_name = 'blaze';

	/**
	 * Get the internationalized product name
	 *
	 * @return string
	 */
	public static function get_name() {
		return __( 'Blaze', 'jetpack-my-jetpack' );
	}

	/**
	 * Get the internationalized product title
	 *
	 * @return string
	 */
	public static function get_title() {
		return __( 'Blaze', 'jetpack-my-jetpack' );
	}

	/**
	 * Get the internationalized product description
	 *
	 * @return string
	 */
	public static function get_description() {
		return __( 'Attract high-quality traffic to your site using Blaze.', 'jetpack-my-jetpack' );
	}

	/**
	 * Get the internationalized product long description
	 *
	 * @return string
	 */
	public static function get_long_description() {
		return __( 'Grow your audience by promoting your content across Tumblr and WordPress.com.', 'jetpack-my-jetpack' );
	}

	/**
	 * Get the internationalized features list
	 *
	 * @return array Blaze features list
	 */
	public static function get_features() {
		return array(
			__( 'Launch within minutes', 'jetpack-my-jetpack' ),
			__( 'Find the right users', 'jetpack-my-jetpack' ),
			__( 'Boost your best content', 'jetpack-my-jetpack' ),
		);
	}

	/**
	 * Get the product pricing details
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
	 * Get the URL where the user manages the product
	 *
	 * @return string
	 */
	public static function get_manage_url() {
		if ( Jetpack_Blaze::is_dashboard_enabled() ) {
			return admin_url( 'tools.php?page=advertising' );
		}

		return Redirect::get_url( 'jetpack-blaze' );
	}
}
