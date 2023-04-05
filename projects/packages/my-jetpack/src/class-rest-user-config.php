<?php
/**
 * Sets up the REST API endpoint for configuration data.
 *
 * @package automattic/my-jetpack
 */

namespace Automattic\Jetpack\My_Jetpack;

use Automattic\Jetpack\Connection\Client as Client;
use Automattic\Jetpack\Status\Visitor as Visitor;
use WP_Error;

/**
 * Registers the REST routes for configuration data.
 */
class REST_User_Config {
	/**
	 * Constructor.
	 */
	public function __construct() {
		register_rest_route(
			'my-jetpack/v1',
			'/user/config',
			array(
				array(
					'methods'             => \WP_REST_Server::READABLE,
					'callback'            => __CLASS__ . '::get_user_config',
					'permission_callback' => __CLASS__ . '::permissions_callback',
				),
				'schema' => array( $this, 'get_config_schema' ),
			)
		);
	}

	/**
	 * Get the schema for the request.
	 *
	 * @return array
	 */
	public function get_config_schema() {
		return array(
			'$schema'    => 'http://json-schema.org/draft-04/schema#',
			'title'      => 'config',
			'type'       => 'object',
			'properties' => $this->get_config_data_schema(),
		);
	}

	/**
	 * Check user capability to access the endpoint.
	 *
	 * @return bool
	 */
	public static function permissions_callback() {
		return true;
	}

	/**
	 * Get the user config data from wpcom.
	 *
	 * @return array|WP_Error
	 */
	public static function get_user_config() {
		$args              = array(
			'method'  => 'GET',
			'headers' => array(
				'X-Forwarded-For' => ( new Visitor() )->get_ip( true ),
			),
		);
		$wpcom_endpoint    = '/help/olark/mine?_locale=' . get_user_locale();
		$wpcom_api_version = '1.1';
		$response          = Client::wpcom_json_api_request_as_user( $wpcom_endpoint, $wpcom_api_version, $args, null, 'rest' );
		$response_code     = wp_remote_retrieve_response_code( $response );
		$body              = json_decode( wp_remote_retrieve_body( $response ) );

		if ( is_wp_error( $response ) || empty( $response['body'] ) || 200 !== $response_code ) {
			return new WP_Error( 'user_config_fetch_failed', 'User config fetch failed', array( 'status' => $response_code ? $response_code : 400 ) );
		}

		return rest_ensure_response( $body );
	}

	/**
	 * Get the schema for the config data.
	 *
	 * @return array
	 */
	private static function get_config_data_schema() {
		return array(
			'locale'         => 'The user locale',
			'isUserEligible' => 'Whether the user is eligible for happychat',
			'supportLevel'   => "The user's support level",
			'nickname'       => 'The user nickname',
			'isClosed'       => 'Whether happychat is closed',
			'availability'   => array(
				'presale'         => 'Wether pesale chat is available',
				'presale_zendesk' => 'Wether Zendesk pesale chat is available',
				'precancellation' => 'Wether precancellation chat is available',
			),
		);
	}
}
