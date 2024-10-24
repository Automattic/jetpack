<?php
/**
 * REST API endpoint for Tumblr Gifs
 *
 * @package automattic/jetpack
 */

declare(strict_types=1);

use Automattic\Jetpack\Connection\Client;

/**
 * WPCOM_REST_API_V2_Endpoint_Tumblr_Gifs class.
 * Accesses the Tumblr API to retrieve GIFs, search for GIFs, and send feedback.
 */
class WPCOM_REST_API_V2_Endpoint_Tumblr_Gifs extends WP_REST_Controller {

	/**
	 * Registers the API namespace and base for the Tumblr Gifs REST API endpoints.
	 *
	 * @return void
	 */
	public function __construct() {
		$this->base_api_path                   = 'wpcom';
		$this->version                         = 'v2';
		$this->namespace                       = $this->base_api_path . '/' . $this->version;
		$this->rest_base                       = '/tumblr-gifs';
		$this->wpcom_is_site_specific_endpoint = false;
		$this->wpcom_is_wpcom_only_endpoint    = false;
		$this->is_wpcom                        = defined( 'IS_WPCOM' ) && IS_WPCOM;
		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	/**
	 * Register the routes for the Tumblr Gifs REST API endpoint.
	 *
	 * @return void
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			$this->rest_base . '/popular',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_popular_gifs' ),
				'permission_callback' => array( $this, 'check_permissions' ),
				'args'                => array(
					'limit'  => array(
						'default'           => 10,
						'type'              => 'integer',
						'validate_callback' => array( $this, 'validate_numeric' ),
					),
					'offset' => array(
						'default'           => 0,
						'type'              => 'integer',
						'validate_callback' => array( $this, 'validate_numeric' ),
					),
				),
			)
		);

		register_rest_route(
			$this->namespace,
			$this->rest_base . '/search/(?P<query>.+)',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'search_gifs' ),
				'permission_callback' => array( $this, 'check_permissions' ),
				'args'                => array(
					'limit'           => array(
						'default'           => 10,
						'type'              => 'integer',
						'validate_callback' => array( $this, 'validate_numeric' ),
					),
					'offset'          => array(
						'default'           => 0,
						'type'              => 'integer',
						'validate_callback' => array( $this, 'validate_numeric' ),
					),
					'allow_photosets' => array(
						'default'           => true,
						'type'              => 'boolean',
						'validate_callback' => 'rest_validate_request_arg',
					),
				),
			)
		);

		register_rest_route(
			$this->namespace,
			$this->rest_base . '/feedback/(?P<token>.+)',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_feedback' ),
				'permission_callback' => array( $this, 'check_permissions' ),
				'args'                => array(
					'token' => array(
						'required'          => true,
						'type'              => 'string',
						'validate_callback' => 'rest_validate_request_arg',
					),
				),
			)
		);
	}

	/**
	 * Check if the request has permissions to access the endpoint.
	 *
	 * @return bool
	 */
	public function check_permissions() {
		if ( ! $this->is_wpcom ) {
			return current_user_can( 'manage_options' );
		}

		if ( ! class_exists( 'WPCOM_REST_API_V2_Endpoint_Jetpack_Auth' ) ) {
			require_once dirname( __DIR__ ) . '/rest-api-plugins/endpoints/jetpack-auth.php';
		}

		$jp_auth_endpoint                                  = new WPCOM_REST_API_V2_Endpoint_Jetpack_Auth();
		$jp_auth_endpoint->wpcom_is_site_specific_endpoint = $this->wpcom_is_site_specific_endpoint;

		if ( is_wp_error( $jp_auth_endpoint->is_jetpack_authorized_for_site() ) || ! $jp_auth_endpoint->is_jetpack_authorized_for_site() ) {
			return false;
		}

		return true;
	}

	/**
	 * Get popular GIFs from Tumblr.
	 *
	 * @param WP_REST_Request $request The request object.
	 *
	 * @return WP_REST_Response The response object.
	 */
	public function get_popular_gifs( $request ) {
		if ( ! $this->is_wpcom ) {
			return $this->proxy_request_to_wpcom( $request, 'popular' );
		}

		$response = $this->proxy_tumblr_request( 'gif/popular', $request->get_params() );
		return rest_ensure_response( $response );
	}

	/**
	 * Search GIFs on Tumblr.
	 *
	 * @param WP_REST_Request $request The request object.
	 *
	 * @return WP_REST_Response The response object.
	 */
	public function search_gifs( $request ) {
		$query = $request['query'];

		if ( ! $this->is_wpcom ) {
			return $this->proxy_request_to_wpcom( $request, 'search/' . $query );
		}

		// Append ?blocks=true to the request parameters so that we get NPF posts back instead of legacy posts,
		// which are not created much anymore.
		$params           = $request->get_params();
		$params['blocks'] = true;

		$response = $this->proxy_tumblr_request( "gif/search/{$query}", $params );
		return rest_ensure_response( $response );
	}

	/**
	 * Sends a 'feedback' request to Tumblr for a GIF search.
	 *
	 * @param WP_REST_Request $request The request object.
	 *
	 * @return WP_REST_Response The response object.
	 */
	public function get_feedback( $request ) {
		if ( ! $this->is_wpcom ) {
			return $this->proxy_request_to_wpcom( $request, 'feedback' );
		}

		$token    = $request['token'];
		$response = $this->proxy_tumblr_request( "gif/feedback/{$token}", $request->get_params() );
		return rest_ensure_response( $response );
	}

	/**
	 * Proxy request to Tumblr API.
	 *
	 * @param string $endpoint The Tumblr API endpoint.
	 * @param array  $params The parameters for the request.
	 *
	 * @return array|WP_Error The response from the Tumblr API or WP_Error on failure.
	 */
	protected function proxy_tumblr_request( $endpoint, $params ) {
		$params['api_key'] = defined( 'TUMBLR_API_KEY' ) ? TUMBLR_API_KEY : '';
		$url               = add_query_arg( $params, "https://api.tumblr.com/v2/{$endpoint}" );

		$response = wp_remote_get( $url );

		if ( is_wp_error( $response ) ) {
			return new WP_Error( 'tumblr_api_error', 'Error connecting to Tumblr API', array( 'status' => 500 ) );
		}

		$body = wp_remote_retrieve_body( $response );

		return json_decode( $body, true );
	}

	/**
	 * Custom validation function to check if a value is numeric. is_numeric itself
	 * only takes 1 argument, so we can't use it as a callback directly.
	 *
	 * @param mixed $param The parameter to validate.
	 *
	 * @return bool True if the parameter is numeric, false otherwise.
	 */
	public function validate_numeric( $param ) {
		return is_numeric( $param );
	}

	/**
	 * Proxy request to wpcom servers for the site and user.
	 *
	 * @param  WP_Rest_Request $request Request to proxy.
	 * @param  string          $path    Path to append to the rest base.
	 * @return mixed|WP_Error           Response from wpcom servers or an error.
	 */
	public function proxy_request_to_wpcom( $request, $path = '' ) {
		$path    = rawurldecode( $this->rest_base ) . ( $path ? '/' . rawurldecode( $path ) : '' );
		$api_url = add_query_arg( $request->get_query_params(), $path );

		$response = Client::wpcom_json_api_request_as_blog( $api_url, 'v2', array(), null, 'wpcom' );

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$response_status = wp_remote_retrieve_response_code( $response );
		$response_body   = json_decode( wp_remote_retrieve_body( $response ), true );

		if ( $response_status >= 400 ) {
			$code    = $response_body['code'] ?? 'unknown_error';
			$message = $response_body['message'] ?? __( 'An unknown error occurred.', 'jetpack' );
			return new WP_Error( $code, $message, array( 'status' => $response_status ) );
		}

		return $response_body;
	}
}

wpcom_rest_api_v2_load_plugin( 'WPCOM_REST_API_V2_Endpoint_Tumblr_Gifs' );
