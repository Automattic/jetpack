<?php
/**
 * Search product
 *
 * @package my-jetpack
 */

namespace Automattic\Jetpack\My_Jetpack\Products;

use Automattic\Jetpack\My_Jetpack\Hybrid_Product;
use Automattic\Jetpack\My_Jetpack\Wpcom_Products;

/**
 * Class responsible for handling the Social product
 */
class Social extends Hybrid_Product {

	/**
	 * The product slug
	 *
	 * @var string
	 */
	public static $slug = 'social';

	/**
	 * The Jetpack module name
	 *
	 * @var string
	 */
	public static $module_name = 'publicize';

	/**
	 * The slug of the plugin associated with this product.
	 *
	 * @var string
	 */
	public static $plugin_slug = 'jetpack-social';

	/**
	 * Social has a standalone plugin
	 *
	 * @var bool
	 */
	public static $has_standalone_plugin = true;

	/**
	 * The filename (id) of the plugin associated with this product.
	 *
	 * @var string
	 */
	public static $plugin_filename = array(
		'jetpack-social/jetpack-social.php',
		'social/jetpack-social.php',
		'jetpack-social-dev/jetpack-social.php',
	);

	/**
	 * Get the product name
	 *
	 * @return string
	 */
	public static function get_name() {
		return 'Social';
	}

	/**
	 * Get the product title
	 *
	 * @return string
	 */
	public static function get_title() {
		return 'Jetpack Social';
	}

	/**
	 * Get the internationalized product description
	 *
	 * @return string
	 */
	public static function get_description() {
		return __( 'Auto-publish to social media', 'jetpack-my-jetpack' );
	}

	/**
	 * Get the internationalized product long description
	 *
	 * @return string
	 */
	public static function get_long_description() {
		return __( 'Promote your content on social media by automatically publishing when you publish on your site.', 'jetpack-my-jetpack' );
	}

	/**
	 * Get the internationalized features list
	 *
	 * @return array Social features list
	 */
	public static function get_features() {
		return array(
			__( 'Post to social networks', 'jetpack-my-jetpack' ),
			__( 'Schedule publishing', 'jetpack-my-jetpack' ),
			__( 'Supports the major social networks', 'jetpack-my-jetpack' ),
		);
	}

	/**
	 * Get the product pricing details
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
	 * @return string
	 */
	public static function get_wpcom_product_slug() {
		return 'jetpack_social_basic_yearly';
	}

	/**
	 * Checks whether the current plan (or purchases) of the site already supports the product
	 *
	 * @return boolean
	 */
	public static function has_required_plan() {
		$purchases_data = Wpcom_Products::get_site_current_purchases();
		if ( is_wp_error( $purchases_data ) ) {
			return false;
		}
		if ( is_array( $purchases_data ) && ! empty( $purchases_data ) ) {
			foreach ( $purchases_data as $purchase ) {
				// Social is available as standalone bundle and as part of the Complete plan.
				if ( strpos( $purchase->product_slug, 'jetpack_social' ) !== false || str_starts_with( $purchase->product_slug, 'jetpack_complete' ) ) {
					return true;
				}
			}
		}
		return false;
	}

	/**
	 * Get the URL where the user manages the product.
	 *
	 * If the standalone plugin is active,
	 * it will redirect to the standalone plugin settings page.
	 * Otherwise, it will redirect to the Jetpack settings page.
	 *
	 * @return string
	 */
	public static function get_manage_url() {
		if ( static::is_standalone_plugin_active() ) {
			return admin_url( 'admin.php?page=jetpack-social' );
		}

		return admin_url( 'admin.php?page=jetpack#/settings?term=publicize' );
	}
}
