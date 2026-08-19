<?php
/**
 * WP_REST_Help_Center_Support_Activity file.
 *
 * @package automattic/jetpack-help-center
 */

namespace Automattic\Jetpack\Help_Center;

/**
 * Class WP_REST_Help_Center_Support_Activity.
 */
class WP_REST_Help_Center_Support_Activity extends WP_REST_Help_Center_Controller {
	/**
	 * WP_REST_Help_Center_Support_Activity constructor.
	 *
	 * @param Wpcom_Request_Client|null $wpcom_request_client WP.com request client.
	 */
	public function __construct( ?Wpcom_Request_Client $wpcom_request_client = null ) {
		parent::__construct( $wpcom_request_client );
		$this->namespace = 'help-center';
		$this->rest_base = '/support-activity';
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
				'callback'            => array( $this, 'get_support_activity' ),
				'permission_callback' => '__return_true',
			)
		);
	}

	/**
	 * Get support activity through Jetpack.
	 */
	public function get_support_activity() {
		$body = $this->wpcom_request_client->request( '/support-activity' );

		if ( is_wp_error( $body ) ) {
			return $body;
		}

		$response = json_decode( wp_remote_retrieve_body( $body ) );

		return rest_ensure_response( $response );
	}
}
