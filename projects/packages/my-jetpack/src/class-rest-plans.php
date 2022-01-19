<?php
/**
 * Sets up the Plans REST API endpoints.
 *
 * @package automattic/my-jetpack
 */

namespace Automattic\Jetpack\My_Jetpack;

use Automattic\Jetpack\Connection\Client as Client;

/**
 * Registers the REST routes for Plans.
 */
class REST_Plans {
	/**
	 * Constructor.
	 */
	public function __construct() {
		register_rest_route(
			'my-jetpack/v1',
			'/site/plans',
			array(
				'methods'             => \WP_REST_Server::READABLE,
				'callback'            => __CLASS__ . '::get_site_plans',
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
		return current_user_can( 'manage_options' );
	}

	/**
	 * Site plans endpoint.
	 *
	 * @return array Site plans.
	 */
	public static function get_site_plans() {
		$wpcom_endpoint    = sprintf( '/plans?_locale=%s?force=wpcom', get_user_locale() );
		$wpcom_api_version = '2';
		$response          = Client::wpcom_json_api_request_as_user(
			$wpcom_endpoint,
			$wpcom_api_version,
			array(
				'headers' => array(
					'X-Forwarded-For' => \Jetpack::current_user_ip( true ),
				),
			)
		);
		$response_code     = wp_remote_retrieve_response_code( $response );
		$body              = json_decode( wp_remote_retrieve_body( $response ) );

		if ( is_wp_error( $response ) ) {
			return new \WP_Error( 'site_plans_data_fetch_failed', 'Site plans data fetch failed', array( 'status' => $response_code ) );
		}

		return rest_ensure_response( $body, 200 );
	}
}
