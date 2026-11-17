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
		 * Use the WP.com blog ID of wpcomsh or WP.com when it is loaded. Otherwise, read it through
		 * `Jetpack_Options`, which reads the platform's external storage before the `jetpack_options`
		 * row. After a site migration onto Atomic, the row can lack the ID.
		 */
		$site = function_exists( '_wpcom_get_current_blog_id' ) ? (int) \_wpcom_get_current_blog_id() : 0;
		if ( ! $site && class_exists( 'Jetpack_Options' ) ) {
			$site = (int) \Jetpack_Options::get_option( 'id' );
		}
		if ( ! $site ) {
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
