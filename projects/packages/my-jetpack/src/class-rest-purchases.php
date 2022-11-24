<?php
/**
 * Sets up the Purchases REST API endpoints.
 *
 * @package automattic/my-jetpack
 */

namespace Automattic\Jetpack\My_Jetpack;

use Automattic\Jetpack\Connection\Client as Client;
use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Current_Plan;
use Jetpack_Options;

/**
 * Registers the REST routes for Purchases.
 */
class REST_Purchases {
	/**
	 * Constructor.
	 */
	public function __construct() {
		register_rest_route(
			'my-jetpack/v1',
			'/site/purchases',
			array(
				'methods'             => \WP_REST_Server::READABLE,
				'callback'            => __CLASS__ . '::get_site_current_purchases',
				'permission_callback' => __CLASS__ . '::permissions_callback',
			)
		);

		register_rest_route(
			'my-jetpack/v1',
			'/refresh-plan-data',
			array(
				'methods'             => \WP_REST_Server::READABLE,
				'callback'            => __CLASS__ . '::refresh_plan_data',
				'permission_callback' => __CLASS__ . '::permissions_callback',
			)
		);
	}

	/**
	 * Check user capability to access the endpoint.
	 *
	 * @access public
	 * @static
	 *
	 * @return true|WP_Error
	 */
	public static function permissions_callback() {
		$connection        = new Connection_Manager();
		$is_site_connected = $connection->is_connected();

		if ( ! $is_site_connected ) {
			return new \WP_Error(
				'not_connected',
				__( 'Your site is not connected to Jetpack.', 'jetpack-my-jetpack' ),
				array(
					'status' => 400,
				)
			);
		}

		return current_user_can( 'manage_options' );
	}

	/**
	 * Site purchases endpoint.
	 *
	 * @return array of site purchases.
	 */
	public static function get_site_current_purchases() {
		$site_id           = \Jetpack_Options::get_option( 'id' );
		$wpcom_endpoint    = sprintf( '/sites/%1$d/purchases?locale=%2$s', $site_id, get_user_locale() );
		$wpcom_api_version = '1.1';
		$response          = Client::wpcom_json_api_request_as_blog( $wpcom_endpoint, $wpcom_api_version );
		$response_code     = wp_remote_retrieve_response_code( $response );
		$body              = json_decode( wp_remote_retrieve_body( $response ) );

		if ( is_wp_error( $response ) || empty( $response['body'] ) || 200 !== $response_code ) {
			return new \WP_Error( 'site_data_fetch_failed', 'Site data fetch failed', array( 'status' => $response_code ? $response_code : 400 ) );
		}

		return rest_ensure_response( $body, 200 );
	}

	/**
	 * Refresh plan data.
	 */
	public static function refresh_plan_data() {
		$site_id = Jetpack_Options::get_option( 'id' );

		if ( ! $site_id ) {
			return new WP_Error( 'site_id_missing', '', array( 'api_error_code' => __( 'site_id_missing', 'jetpack-my-jetpack' ) ) );
		}

		$args = array( 'headers' => array() );

		// Allow use a store sandbox. Internal ref: PCYsg-IA-p2.
		if ( isset( $_COOKIE ) && isset( $_COOKIE['store_sandbox'] ) ) {
			$secret                    = filter_var( wp_unslash( $_COOKIE['store_sandbox'] ) );
			$args['headers']['Cookie'] = "store_sandbox=$secret;";
		}

		$response = Client::wpcom_json_api_request_as_blog( sprintf( '/sites/%d', $site_id ) . '?force=wpcom', '1.1', $args );
		$body     = wp_remote_retrieve_body( $response );
		$data     = $body ? json_decode( $body ) : null;

		if ( 200 !== wp_remote_retrieve_response_code( $response ) ) {
			$error_info = array(
				'api_error_code' => null,
				'api_http_code'  => wp_remote_retrieve_response_code( $response ),
			);

			if ( is_wp_error( $response ) ) {
				$error_info['api_error_code'] = $response->get_error_code() ? wp_strip_all_tags( $response->get_error_code() ) : null;
			} elseif ( $data && ! empty( $data->error ) ) {
				$error_info['api_error_code'] = $data->error;
			}

			return new WP_Error( 'site_data_fetch_failed', '', $error_info );
		}

		Current_Plan::update_from_sites_response( $response );
	}
}
