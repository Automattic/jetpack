<?php
/**
 * Sets up the Product Data REST API endpoints.
 *
 * @package automattic/my-jetpack
 */

namespace Automattic\Jetpack\My_Jetpack;

use Automattic\Jetpack\Connection\Client;
use WP_Error;

/**
 * Registers the REST routes for Product Data
 */
class REST_Product_Data {
	/**
	 * Constructor.
	 */
	public function __construct() {
		register_rest_route(
			'my-jetpack/v1',
			'site/product-data',
			array(
				'methods'             => \WP_REST_Server::READABLE,
				'callback'            => __CLASS__ . '::get_all_product_data',
				'permission_callback' => __CLASS__ . '::permissions_callback',
			)
		);
	}

	/**
	 * Checks if the user has the correct permissions
	 */
	public static function permissions_callback() {
		return current_user_can( 'manage_options' );
	}

	/**
	 * Gets the product data for all products
	 *
	 * @return array|WP_Error
	 */
	public static function get_all_product_data() {
		$site_id        = \Jetpack_Options::get_option( 'id' );
		$wpcom_endpoint = sprintf( 'sites/%d/jetpack-product-data?locale=%2$s&force=wpcom', $site_id, get_user_locale() );
		$api_version    = '2';
		$response       = Client::wpcom_json_api_request_as_blog( $wpcom_endpoint, $api_version, array(), null, 'wpcom' );
		$response_code  = wp_remote_retrieve_response_code( $response );
		$body           = json_decode( wp_remote_retrieve_body( $response ) );

		if ( is_wp_error( $response ) || empty( $response['body'] ) || 200 !== $response_code ) {
			return new WP_Error( 'site_products_data_fetch_failed', 'Site products data fetch failed', array( 'status' => $response_code ? $response_code : 400 ) );
		}

		return rest_ensure_response( $body, 200 );
	}
}
