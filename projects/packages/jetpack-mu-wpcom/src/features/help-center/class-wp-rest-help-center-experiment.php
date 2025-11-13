<?php
/**
 * WP_REST_Help_Center_Experiment file.
 *
 * @package automattic/jetpack-mu-wpcom
 */

namespace A8C\FSE;

use Automattic\Jetpack\Connection\Client;

/**
 * Class WP_REST_Help_Center_Experiment.
 */
class WP_REST_Help_Center_Experiment extends \WP_REST_Controller {
	/**
	 * WP_REST_Help_Center_Experiment constructor.
	 */
	public function __construct() {
		$this->namespace = 'help-center';
		$this->rest_base = '/experiment';
	}

	/**
	 * Register available routes.
	 */
	public function register_rest_route() {
		register_rest_route(
			$this->namespace,
			$this->rest_base,
			array(
				'methods'             => \WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_experiment_assignment' ),
				'permission_callback' => 'is_user_logged_in',
				'args'                => array(
					'experiment_name' => array(
						'type'     => 'string',
						'required' => true,
					),
				),
			)
		);
	}

	/**
	 * Get experiment assignment for the current user.
	 *
	 * @param \WP_REST_Request $request The request sent to the API.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function get_experiment_assignment( \WP_REST_Request $request ) {
		$experiment_name = $request['experiment_name'];

		$request_path = '/experiments/0.1.0/assignments/calypso';
		$response     = Client::wpcom_json_api_request_as_user(
			add_query_arg( array( 'experiment_name' => $experiment_name ), $request_path ),
			'v2'
		);

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$response_code = wp_remote_retrieve_response_code( $response );
		if ( 200 !== $response_code ) {
			return new \WP_Error(
				'experiment_request_failed',
				'Failed to retrieve experiment assignment',
				array( 'status' => $response_code )
			);
		}

		$data = json_decode( wp_remote_retrieve_body( $response ), true );

		return rest_ensure_response( $data );
	}
}
