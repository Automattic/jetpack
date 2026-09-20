<?php
/**
 * WP_REST_Help_Center_CTA file.
 *
 * @package automattic/jetpack-help-center
 */

namespace Automattic\Jetpack\Help_Center;

/**
 * Class WP_REST_Help_Center_CTA.
 */
class WP_REST_Help_Center_CTA extends WP_REST_Help_Center_Controller {
	/**
	 * WP_REST_Help_Center_CTA constructor.
	 *
	 * @param Wpcom_Request_Client|null $wpcom_request_client WP.com request client.
	 */
	public function __construct( ?Wpcom_Request_Client $wpcom_request_client = null ) {
		parent::__construct( $wpcom_request_client );
		$this->namespace = 'help-center';
		$this->rest_base = '/cta';
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
				'callback'            => array( $this, 'get_cta' ),
				'permission_callback' => '__return_true',
			)
		);
	}

	/**
	 * Get the contextual CTA for the current user.
	 */
	public function get_cta() {
		$body = $this->wpcom_request_client->request( '/help/cta' );

		if ( is_wp_error( $body ) ) {
			return $body;
		}

		$response = rest_ensure_response( json_decode( wp_remote_retrieve_body( $body ) ) );

		// Pass the upstream status through: a 204 means there is no CTA for this user.
		$status = wp_remote_retrieve_response_code( $body );
		if ( $status > 0 ) {
			$response->set_status( $status );
		}

		return $response;
	}
}
