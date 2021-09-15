<?php
/**
 * REST API endpoint for External Services.
 * This endpoint is used by the Publicize feature to avoid client-side CORS issues.
 *
 * @package automattic/jetpack
 * @since 10.1
 */

use Automattic\Jetpack\Connection\Client;

/**
 * This class creates the Jetpack endpoint: http://{$site}/wp-json/wpcom/v2/external-services
 * It is a proxy of the WPCOM endpoint: https://public-api.wordpress.com/wpcom/v2/sites/{$site}/external-services
 * This give us the same data found in the WPCOM API, but returned on our customized domain.
 * Below we simply register the Jetpack route, call the WPCOM endpoint, and return the response body.
 *
 * @since 10.1
 */
class WPCOM_REST_API_V2_Endpoint_External_Services extends WP_REST_Controller {
	/**
	 * The constructor sets the route namespace and rest_base.
	 * It also adds the action that registers our API endpoint route.
	 */
	public function __construct() {
		$this->namespace = 'wpcom/v2';
		$this->rest_base = 'external-services';

		add_action( 'rest_api_init', array( $this, 'register_route' ) );
	}

	/**
	 * This is the function we reference in the add_action callback in the constructor.
	 * It registers the endpoint route: http://{$site}/wp-json/wpcom/v2/external-services
	 */
	public function register_route() {
		register_rest_route(
			$this->namespace,
			$this->rest_base,
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_external_services' ),
				'permission_callback' => array( $this, 'permissions_check' ),
			)
		);
	}

	/**
	 * This is the function we reference in the register_rest_route permission_callback in the register_route function.
	 * It returns true if the user has access to the Publicize feature or WP_Error if not.
	 *
	 * @return true|WP_Error
	 */
	public function permissions_check() {
		global $publicize;

		if ( ! $publicize ) {
			return new WP_Error(
				'publicize_not_available',
				__( 'Sorry, Publicize is not available on your site right now.', 'jetpack' ),
				array( 'status' => rest_authorization_required_code() )
			);
		}

		if ( $publicize->current_user_can_access_publicize_data() ) {
			return true;
		}

		return new WP_Error(
			'invalid_user_permission_publicize',
			__( 'Sorry, you are not allowed to access Publicize data on this site.', 'jetpack' ),
			array( 'status' => rest_authorization_required_code() )
		);
	}

	/**
	 * This method gets the current site ID, then calls a GET request to /wpcom/v2/sites/{$site}/external-services
	 * as the user, and finally returns the response body.
	 *
	 * @return mixed
	 */
	public function get_external_services() {
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
	 * Gets the Jetpack site_id and returns it as an int. If the site_id is not found it returns a WP_Error.
	 *
	 * @return int|WP_Error
	 */
	private static function get_site_id() {
		$site_id = Jetpack_Options::get_option( 'id' );
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
