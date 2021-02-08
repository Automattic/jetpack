<?php
/**
 * Proxy endpoint for Jetpack Search
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Connection\Client;

/**
 * Jetpack Search: Makes authenticated requests to the site search API using blog tokens.
 * This endpoint will only be used when trying to search private Jetpack and WordPress.com sites.
 *
 * @since 9.0.0
 */
class WPCOM_REST_API_V2_Endpoint_Search extends WP_REST_Controller {
	/**
	 * Constructor.
	 */
	public function __construct() {
		$this->namespace = 'wpcom/v2';
		$this->rest_base = 'search';

		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	/**
	 * Called automatically on `rest_api_init()`.
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			$this->rest_base,
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_search_results' ),
					'permission_callback' => 'is_user_logged_in',
				),
			)
		);
	}

	/**
	 * Returns search results for the current blog.
	 *
	 * @param WP_REST_Request $request The REST API request data.
	 * @return mixed The REST API response from public-api.
	 */
	public function get_search_results( $request ) {
		$is_wpcom = ( defined( 'IS_WPCOM' ) && IS_WPCOM );
		$site_id  = $is_wpcom ? get_current_blog_id() : Jetpack_Options::get_option( 'id' );
		if ( ! $site_id ) {
			return new WP_Error(
				'unavailable_site_id',
				__( 'Sorry, something is wrong with your Jetpack connection.', 'jetpack' ),
				403
			);
		}

		$path    = add_query_arg(
			$request->get_query_params(),
			sprintf( '/sites/%d/search', absint( $site_id ) )
		);
		$request = Client::wpcom_json_api_request_as_blog( $path, '1.3' );
		$body    = json_decode( wp_remote_retrieve_body( $request ) );
		if ( 200 === wp_remote_retrieve_response_code( $request ) ) {
			return $body;
		}

		return new WP_Error(
			$body->error,
			$body->message,
			array( 'status' => wp_remote_retrieve_response_code( $request ) )
		);
	}
}

wpcom_rest_api_v2_load_plugin( 'WPCOM_REST_API_V2_Endpoint_Search' );
