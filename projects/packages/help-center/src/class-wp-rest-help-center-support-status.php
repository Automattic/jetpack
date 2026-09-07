<?php
/**
 * WP_REST_Help_Center_Support_Status file.
 *
 * @package automattic/jetpack-help-center
 */

namespace Automattic\Jetpack\Help_Center;

/**
 * Class WP_REST_Help_Center_Support_Status.
 */
class WP_REST_Help_Center_Support_Status extends WP_REST_Help_Center_Controller {
	/**
	 * WP_REST_Help_Center_Support_Status constructor.
	 *
	 * @param Wpcom_Request_Client|null $wpcom_request_client WP.com request client.
	 */
	public function __construct( ?Wpcom_Request_Client $wpcom_request_client = null ) {
		parent::__construct( $wpcom_request_client );
		$this->namespace = 'help-center';
		$this->rest_base = '/support-status';
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
				'callback'            => array( $this, 'get_support_status' ),
				'permission_callback' => '__return_true',
			)
		);

		register_rest_route(
			$this->namespace,
			$this->rest_base . '/messaging',
			array(
				'methods'             => \WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_messaging_support_availability' ),
				'permission_callback' => '__return_true',
				'args'                => array(
					'group'       => array(
						'type'     => 'string',
						'required' => true,
					),
					'environment' => array(
						'type'     => 'string',
						'required' => true,
					),
				),
			)
		);
	}

	/**
	 * Should return the support status for the user
	 */
	public function get_support_status() {
		$body = $this->wpcom_request_client->request( 'help/support-status' );
		if ( is_wp_error( $body ) ) {
			return $body;
		}
		$response = json_decode( wp_remote_retrieve_body( $body ) );

		return rest_ensure_response( $response );
	}

	/**
	 * Should return messaging eligibility
	 *
	 * @param \WP_REST_Request $request    The request sent to the API.
	 */
	public function get_messaging_support_availability( \WP_REST_Request $request ) {
		$query_parameters = array(
			'group'       => $request['group'],
			'environment' => $request['environment'],
		);
		$body             = $this->wpcom_request_client->request( 'help/support-status/messaging?' . http_build_query( $query_parameters ) );
		if ( is_wp_error( $body ) ) {
			return $body;
		}
		$response = json_decode( wp_remote_retrieve_body( $body ) );

		return rest_ensure_response( $response );
	}
}
