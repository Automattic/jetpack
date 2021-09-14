<?php
/**
 * REST API endpoint for External Services.
 *
 * @package automattic/jetpack
 * @since
 */

use Automattic\Jetpack\Connection\Client;

/**
 * External Services proxy endpoint.
 *
 * @since
 */
class WPCOM_REST_API_V2_Endpoint_External_Services extends WP_REST_Controller {
	/**
	 * Constructor.
	 */
	public function __construct() {
		$this->namespace = 'wpcom/v2';
		$this->rest_base = 'external-services';
		$this->is_wpcom  = false;

		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			$this->is_wpcom = true;

			if ( ! class_exists( 'WPCOM_External_Connections' ) ) {
				\jetpack_require_lib( 'external-connections' );
			}
		}

		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	/**
	 * Register the route.
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			$this->rest_base,
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_external_services' ),
				'permission_callback' => '__return_true',
			)
		);
	}

	/**
	 * Get External Services.
	 *
	 * @return mixed
	 */
	public function get_external_services() {
		if ( $this->is_wpcom ) {
			return WPCOM_External_Connections::get_external_services_list();
		}

		$site_id = self::get_site_id();
		if ( is_wp_error( $site_id ) ) {
			return $site_id;
		}

		$path     = sprintf( '/sites/%d/external-services', $site_id );
		$response = Client::wpcom_json_api_request_as_user( $path );
		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$body = json_decode( wp_remote_retrieve_body( $response ) );
		if ( ! property_exists( $body, 'services' ) ) {
			return new WP_Error(
				'bad_request',
				__( 'An error occurred. Please try again later.', 'jetpack' ),
				array( 'status' => 400 )
			);
		}

		return $body;
	}

	/**
	 * Get the WPCOM or self-hosted site ID.
	 *
	 * @return mixed
	 */
	private static function get_site_id() {
		$is_wpcom = ( defined( 'IS_WPCOM' ) && IS_WPCOM );
		$site_id  = $is_wpcom ? get_current_blog_id() : Jetpack_Options::get_option( 'id' );
		if ( ! $site_id ) {
			return new WP_Error(
				'unavailable_site_id',
				__( 'Sorry, something is wrong with your Jetpack connection.', 'jetpack' ),
				403
			);
		}
		return (int) $site_id;
	}
}

wpcom_rest_api_v2_load_plugin( 'WPCOM_REST_API_V2_Endpoint_External_Services' );
