<?php
/**
 * WP_REST_Help_Center_Jetpack_Connection_Health file.
 *
 * @package automattic/jetpack-help-center
 */

namespace Automattic\Jetpack\Help_Center;

/**
 * Class WP_REST_Help_Center_Jetpack_Connection_Health.
 */
class WP_REST_Help_Center_Jetpack_Connection_Health extends WP_REST_Help_Center_Controller {
	/**
	 * WP_REST_Help_Center_Jetpack_Connection_Health constructor.
	 *
	 * @param Wpcom_Request_Client|null $wpcom_request_client WP.com request client.
	 */
	public function __construct( ?Wpcom_Request_Client $wpcom_request_client = null ) {
		parent::__construct( $wpcom_request_client );
		$this->namespace = 'help-center';
		$this->rest_base = '/jetpack-connection-health';
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
				'callback'            => array( $this, 'get_connection_health' ),
				'permission_callback' => '__return_true',
			)
		);
	}

	/**
	 * Return the Jetpack connection health for the current site.
	 */
	public function get_connection_health() {
		/*
		 * Atomic sites have the WP.com blog ID stored as a Jetpack option. This code deliberately
		 * doesn't use `Jetpack_Options::get_option` so it works even when Jetpack has not been loaded.
		 */
		$jetpack_options = get_option( 'jetpack_options' );
		if ( is_array( $jetpack_options ) && isset( $jetpack_options['id'] ) ) {
			$site = (int) $jetpack_options['id'];
		} else {
			$site = get_current_blog_id();
		}

		$body = $this->wpcom_request_client->request(
			'sites/' . $site . '/jetpack-connection-health',
			'2'
		);

		if ( is_wp_error( $body ) ) {
			return $body;
		}

		$response = json_decode( wp_remote_retrieve_body( $body ) );

		return rest_ensure_response( $response );
	}
}
