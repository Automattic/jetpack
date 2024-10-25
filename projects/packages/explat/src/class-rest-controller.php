<?php
/**
 * The ExPlat Rest Controller class.
 * Registers the REST routes for ExPlat backend
 *
 * @package automattic/jetpack-explat
 */

namespace Automattic\Jetpack\ExPlat;

use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\Connection\Manager as Jetpack_Connection;
use WP_Error;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;

/**
 * Registers general REST routes for ExPlat.
 */
class REST_Controller {
	/**
	 * Namespace for the REST API.
	 *
	 * @var string
	 */
	public static $namespace = 'jetpack/v4/explat';

	/**
	 * Current version of the ExPlat API and components
	 *
	 * @var string
	 */
	const EXPLAT_API_VERSION = '0.1.0';

	/**
	 * Base API URI for WordPress.com
	 *
	 * @var string
	 */
	const WPCOM_API_BASE_URL = 'https://public-api.wordpress.com/wpcom/v2';

	/**
	 * Registers the REST routes.
	 *
	 * @access public
	 * @static
	 */
	public function register_rest_routes() {
		register_rest_route(
			static::$namespace,
			'assignments',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_assignments' ),
				'permission_callback' => '__return_true',
				'args'                => array(
					'experiment_name'   => array(
						'type' => 'string',
					),
					'anon_id'           => array(
						'type' => 'string',
					),
					'as_connected_user' => array(
						'type' => 'boolean',
					),
				),
			)
		);
	}

	/**
	 * Get the assignments for a given experiment and anon_id
	 *
	 * @param WP_REST_Request $request The REST request object.
	 * @return WP_REST_Response|WP_Error
	 */
	public function get_assignments( $request ) {
		$response          = null;
		$is_user_connected = ( new Jetpack_Connection() )->is_user_connected();
		$request_path      = '/experiments/' . self::EXPLAT_API_VERSION . '/assignments/jetpack';
		$args              = array(
			'experiment_name' => $request['experiment_name'],
			'anon_id'         => $request['anon_id'],
		);

		if ( $request['as_connected_user'] && $is_user_connected ) {
			$response = Client::wpcom_json_api_request_as_user(
				add_query_arg( $args, $request_path ),
				'v2'
			);
		} else {
			$response = wp_remote_get(
				add_query_arg( $args, self::WPCOM_API_BASE_URL . $request_path )
			);
		}

		if ( is_wp_error( $response ) ) {
			return new WP_Error(
				'wp_error_fetching_assignment',
				$response->get_error_message(),
				array( 'status' => 500 )
			);
		}

		$response_code = wp_remote_retrieve_response_code( $response );

		if ( 200 !== $response_code ) {
			return new WP_Error(
				'http_error_fetching_assignment',
				wp_remote_retrieve_response_message( $response ),
				array( 'status' => $response_code )
			);
		}

		return rest_ensure_response(
			json_decode( wp_remote_retrieve_body( $response ), true )
		);
	}
}
