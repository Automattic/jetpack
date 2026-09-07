<?php
/**
 * WP_REST_Help_Center_Email_Support_Enabled file.
 *
 * @package automattic/jetpack-help-center
 */

namespace Automattic\Jetpack\Help_Center;

/**
 * Class WP_REST_Help_Center_Email_Support_Enabled.
 */
class WP_REST_Help_Center_Email_Support_Enabled extends WP_REST_Help_Center_Controller {
	/**
	 * WP_REST_Help_Center_Email_Support_Enabled constructor.
	 *
	 * @param Wpcom_Request_Client|null $wpcom_request_client WP.com request client.
	 */
	public function __construct( ?Wpcom_Request_Client $wpcom_request_client = null ) {
		parent::__construct( $wpcom_request_client );
		$this->namespace = 'help-center';
		$this->rest_base = '/support-availability';
	}

	/**
	 * Register available routes.
	 */
	public function register_rest_route() {
		register_rest_route(
			$this->namespace,
			$this->rest_base . '/email',
			array(
				'methods'             => \WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_email_support_configuration' ),
				'permission_callback' => '__return_true',
			)
		);
	}

	/**
	 * Should return if email contact is enabled for the user.
	 */
	public function get_email_support_configuration() {
		$body = $this->wpcom_request_client->request( 'help/eligibility/email/mine' );

		if ( is_wp_error( $body ) ) {
			return $body;
		}

		$response = json_decode( wp_remote_retrieve_body( $body ) );

		return rest_ensure_response( $response );
	}
}
