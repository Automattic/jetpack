<?php
/**
 * The Blaze Rest Controller class.
 * Registers the REST routes for Blaze Dashboard.
 *
 * @package automattic/jetpack-blaze
 */

namespace Automattic\Jetpack\Blaze;

use Automattic\Jetpack\Connection\Client;
use Jetpack_Options;
use WP_Error;
use WP_REST_Server;

/**
 * Registers the REST routes for Blaze Dashboard.
 * It bascially forwards the requests to the WordPress.com REST API.
 */
class Dashboard_REST_Controller {
	/**
	 * Namespace for the REST API.
	 *
	 * @var string
	 */
	public static $namespace = 'jetpack/v4/blaze-app';

	/**
	 * Registers the REST routes for Blaze Dashboard.
	 *
	 * Blaze Dashboard is built from `wp-calypso`, which leverages the `public-api.wordpress.com` API.
	 * The current Site ID is added as part of the route, so that the front end doesn't have to handle the differences.
	 *
	 * @access public
	 * @static
	 */
	public function register_rest_routes() {
		// WordAds DSP API routes
		register_rest_route(
			static::$namespace,
			sprintf( '/sites/%d/wordads/dsp/api/(?P<sub_path>.+)', Jetpack_Options::get_option( 'id' ) ),
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_wordads_dsp_generic' ),
				'permission_callback' => array( $this, 'can_user_view_wordads_dsp_callback' ),
			)
		);

		register_rest_route(
			static::$namespace,
			sprintf( '/sites/%d/wordads/dsp/api/(?P<sub_path>.+)', Jetpack_Options::get_option( 'id' ) ),
			array(
				'methods'             => WP_REST_Server::EDITABLE,
				'callback'            => array( $this, 'edit_wordads_dsp_generic' ),
				'permission_callback' => array( $this, 'can_user_view_wordads_dsp_callback' ),
			)
		);
	}

	/**
	 * Only administrators or users with capability `activate_wordads` can access the API.
	 */
	public function can_user_view_wordads_dsp_callback() {
		// phpcs:ignore WordPress.WP.Capabilities.Unknown
		if ( current_user_can( 'manage_options' ) || current_user_can( 'activate_wordads' ) ) {
			return true;
		}

		return $this->get_forbidden_error();
	}

	/**
	 * Redirect GET requests to WordAds DSP for the site.
	 *
	 * @param WP_REST_Request $req The request object.
	 * @return array
	 */
	public function get_wordads_dsp_generic( $req ) {
		return $this->request_as_user(
			sprintf( '/sites/%d/wordads/dsp/api/%s', Jetpack_Options::get_option( 'id' ), $req->get_param( 'sub_path' ) ),
			'v2',
			array( 'method' => 'GET' )
		);
	}

	/**
	 * Redirect POST/PUT/PATCH requests to WordAds DSP for the site.
	 *
	 * @param WP_REST_Request $req The request object.
	 * @return array
	 */
	public function edit_wordads_dsp_generic( $req ) {
		return $this->request_as_user(
			sprintf( '/sites/%d/wordads/dsp/api/%s', Jetpack_Options::get_option( 'id' ), $req->get_param( 'sub_path' ) ),
			'v2',
			array( 'method' => $req->get_method() ),
			$req->get_body()
		);
	}

	/**
	 * Queries the WordPress.com REST API with a user token.
	 *
	 * @param String $path The API endpoint relative path.
	 * @param String $version The API version.
	 * @param array  $args Request arguments.
	 * @param String $body Request body.
	 * @param String $base_api_path (optional) the API base path override, defaults to 'rest'.
	 * @param bool   $use_cache (optional) default to true.
	 * @return array|WP_Error $response Data.
	 */
	protected function request_as_user( $path, $version = '2', $args = array(), $body = null, $base_api_path = 'wpcom', $use_cache = false ) {
		// Arrays are serialized without considering the order of objects, but it's okay atm.
		$cache_key = 'BLAZE_REST_RESP_' . md5( implode( '|', array( $path, $version, wp_json_encode( $args ), wp_json_encode( $body ), $base_api_path ) ) );

		if ( $use_cache ) {
			$response_body_content = get_transient( $cache_key );
			if ( false !== $response_body_content ) {
				return json_decode( $response_body_content, true );
			}
		}

		$response = Client::wpcom_json_api_request_as_user(
			$path,
			$version,
			$args,
			$body,
			$base_api_path
		);

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$response_code         = wp_remote_retrieve_response_code( $response );
		$response_body_content = wp_remote_retrieve_body( $response );
		$response_body         = json_decode( $response_body_content, true );

		if ( 200 !== $response_code ) {
			return $this->get_wp_error( $response_body, $response_code );
		}

		// Cache the successful JSON response for 5 minutes.
		set_transient( $cache_key, $response_body_content, 5 * MINUTE_IN_SECONDS );
		return $response_body;
	}

	/**
	 * Return a WP_Error object with a forbidden error.
	 */
	protected function get_forbidden_error() {
		$error_msg = esc_html__(
			'You are not allowed to perform this action.',
			'jetpack-blaze'
		);

		return new WP_Error( 'rest_forbidden', $error_msg, array( 'status' => rest_authorization_required_code() ) );
	}

	/**
	 * Build error object from remote response body and status code.
	 *
	 * @param array $response_body Remote response body.
	 * @param int   $response_code Http response code.
	 * @return WP_Error
	 */
	protected function get_wp_error( $response_body, $response_code = 500 ) {
		$error_code = 'remote-error';
		foreach ( array( 'code', 'error' ) as $error_code_key ) {
			if ( isset( $response_body[ $error_code_key ] ) ) {
				$error_code = $response_body[ $error_code_key ];
				break;
			}
		}

		$error_message = isset( $response_body['message'] ) ? $response_body['message'] : 'unknown remote error';

		return new WP_Error(
			$error_code,
			$error_message,
			array( 'status' => $response_code )
		);
	}
}
