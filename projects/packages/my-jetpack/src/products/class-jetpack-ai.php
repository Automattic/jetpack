<?php
/**
 * Boost product
 *
 * @package my-jetpack
 */

namespace Automattic\Jetpack\My_Jetpack\Products;

use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\My_Jetpack\Module_Product;
use Automattic\Jetpack\My_Jetpack\Wpcom_Products;
use Jetpack_Options;
use WP_Error;

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
	 * Gets the site purchases from WPCOM.
	 *
	 * @todo Maybe add caching.
	 *
	 * @return Object|WP_Error
	 */
	private static function get_site_current_purchases() {
		static $purchases = null;

		if ( $purchases !== null ) {
			return $purchases;
		}

		$site_id = Jetpack_Options::get_option( 'id' );

		$response = Client::wpcom_json_api_request_as_blog(
			sprintf( '/sites/%d/purchases', $site_id ),
			'1.1',
			array(
				'method' => 'GET',
			)
		);
		if ( 200 !== wp_remote_retrieve_response_code( $response ) ) {
			return new WP_Error( 'purchases_state_fetch_failed' );
		}

		$body      = wp_remote_retrieve_body( $response );
		$purchases = json_decode( $body );
		return $purchases;
	}

	/**
	 * Checks whether the current plan (or purchases) of the site already supports the product
	 *
	 * @return boolean
	 */
	public static function has_required_plan() {
		$purchases_data = static::get_site_current_purchases();
		if ( is_wp_error( $purchases_data ) ) {
			return false;
		}
		if ( is_array( $purchases_data ) && ! empty( $purchases_data ) ) {
			foreach ( $purchases_data as $purchase ) {
				if (
					0 === strpos( $purchase->product_slug, static::get_wpcom_product_slug() )
				) {
					return true;
				}
			}
		}
		return false;
	}

	/**
	 * Checks whether the Product is active
	 *
	 * Jetpack AI is not actually a module.
	 *
	 * @return boolean
	 */
	public static function is_active() {
		return static::is_jetpack_plugin_active() && static::has_required_plan();
	}

	/**
	 * Checks whether the Jetpack module is active
	 *
	 * This is a bundle and not a product. We should not use this information for anything
	 *
	 * @return bool
	 */
	public static function is_module_active() {
		return true;
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
