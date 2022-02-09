<?php
/**
 * Scan product
 *
 * @package my-jetpack
 */

namespace Automattic\Jetpack\My_Jetpack\Products;

use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\My_Jetpack\Module_Product;
use Jetpack_Options;
use WP_Error;

/**
 * Class responsible for handling the Scan product
 */
class Scan extends Module_Product {

	/**
	 * The product slug
	 *
	 * @var string
	 */
	public static $slug = 'scan';

	/**
	 * The Jetpack module name
	 *
	 * @var string
	 */
	public static $module_name = 'scan';

	/**
	 * Get the internationalized product name
	 *
	 * @return string
	 */
	public static function get_name() {
		return __( 'Scan', 'jetpack-my-jetpack' );
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
		return __( 'Stay one step ahead of threats', 'jetpack-my-jetpack' );
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
	 * @return array Boost features list
	 */
	public static function get_features() {
		return array(
			_x( 'Automated daily scanning', 'Scan Product Feature', 'jetpack-my-jetpack' ),
			_x( 'One-click fixes for most issues', 'Scan Product Feature', 'jetpack-my-jetpack' ),
			_x( 'Instant email notifications', 'Scan Product Feature', 'jetpack-my-jetpack' ),
		);
	}

	/**
	 * Get the product princing details
	 *
	 * @return array Pricing details
	 */
	public static function get_pricing_for_ui() {
		return array(
			'available'            => true,
			'currency_code'        => 'EUR',
			'full_price'           => '22',
			'promotion_percentage' => '50',
		);
	}

	/**
	 * Get the WPCOM product slug used to make the purchase
	 *
	 * @return ?string
	 */
	public static function get_wpcom_product_slug() {
		return 'jetpack_scan';
	}

	/**
	 * Hits the wpcom api to check scan status.
	 *
	 * @todo Maybe add caching.
	 *
	 * @return Object|WP_Error
	 */
	private static function get_state_from_wpcom() {
		static $status = null;

		if ( ! is_null( $status ) ) {
			return $status;
		}

		$site_id = Jetpack_Options::get_option( 'id' );

		$response = Client::wpcom_json_api_request_as_blog( sprintf( '/sites/%d/scan', $site_id ) . '?force=wpcom', '2', array(), null, 'wpcom' );

		if ( 200 !== wp_remote_retrieve_response_code( $response ) ) {
			return new WP_Error( 'scan_state_fetch_failed' );
		}

		$body   = wp_remote_retrieve_body( $response );
		$status = json_decode( $body );
		return $status;
	}

	/**
	 * Checks whether the current plan (or purchases) of the site already supports the product
	 *
	 * @return boolean
	 */
	public static function has_required_plan() {
		$scan_data = static::get_state_from_wpcom();
		if ( is_wp_error( $scan_data ) ) {
			return false;
		}
		return is_object( $scan_data ) && isset( $scan_data->state ) && 'unavailable' !== $scan_data->state;
	}

}
