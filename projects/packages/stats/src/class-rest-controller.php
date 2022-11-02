<?php
/**
 * The Search Rest Controller class.
 * Registers the REST routes for Search.
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Stats;

use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\Connection\Rest_Authentication;
use Jetpack_Options;
use WP_Error;
use WP_REST_Server;

/**
 * Registers the REST routes for Search.
 */
class REST_Controller {
	/**
	 * Namespace for the REST API.
	 *
	 * This is overriden with value `wpcom-orgin/jetpack/v4` for WPCOM.
	 *
	 * @var string
	 */
	public static $namespace = 'jetpack/v4/stats-app';
	/**
	 * Whether it's run on WPCOM.
	 *
	 * @var bool
	 */
	protected $is_wpcom;

	/**
	 * Module Control object.
	 *
	 * @var Module_Control
	 */
	protected $search_module;

	/**
	 * Registers the REST routes for Search.
	 *
	 * @access public
	 * @static
	 */
	public function register_rest_routes() {
		register_rest_route(
			static::$namespace,
			'/me',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'me' ),
				'permission_callback' => 'is_user_logged_in',
			)
		);
		register_rest_route(
			static::$namespace,
			'/sites/' . Jetpack_Options::get_option( 'id' ),
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'site' ),
				'permission_callback' => 'is_user_logged_in',
			)
		);
		register_rest_route(
			static::$namespace,
			'/sites/' . Jetpack_Options::get_option( 'id' ) . '/stats/(?P<resource>[\-\w]+)',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_resource_from_wpcom' ),
				'permission_callback' => 'is_user_logged_in',
			)
		);
		register_rest_route(
			static::$namespace,
			'/sites/' . Jetpack_Options::get_option( 'id' ) . '/(?P<resource>[\-\w]+)',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_site_resource_from_wpcom' ),
				'permission_callback' => 'is_user_logged_in',
			)
		);
		register_rest_route(
			static::$namespace,
			sprintf( '/jetpack-blogs/%d/rest-api', Jetpack_Options::get_option( 'id' ) ),
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'empty_result' ),
				'permission_callback' => 'is_user_logged_in',
			)
		);
		// jetpack-blogs/193141071/rest-api/?path=%2Fjetpack%2Fv4%2Fmodule%2Fall%2F
		register_rest_route(
			static::$namespace,
			'/me/sites',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'sites' ),
				'permission_callback' => 'is_user_logged_in',
			)
		);
		register_rest_route(
			static::$namespace,
			'/me/settings',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'empty_result' ),
				'permission_callback' => 'is_user_logged_in',
			)
		);
		register_rest_route(
			static::$namespace,
			'/me/preferences',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'empty_result' ),
				'permission_callback' => 'is_user_logged_in',
			)
		);
		register_rest_route(
			static::$namespace,
			'/me/connections',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'empty_result' ),
				'permission_callback' => 'is_user_logged_in',
			)
		);
	}

	/**
	 * Only administrators can access the API.
	 *
	 * @return bool|WP_Error True if a blog token was used to sign the request, WP_Error otherwise.
	 */
	public function require_admin_privilege_callback() {
		if ( current_user_can( 'manage_options' ) ) {
			return true;
		}

		return $this->get_forbidden_error();
	}

	/**
	 * The corresponding endpoints can only be accessible from WPCOM.
	 *
	 * @access public
	 * @static
	 *
	 * @return bool|WP_Error True if a blog token was used to sign the request, WP_Error otherwise.
	 */
	public function require_valid_blog_token_callback() {
		if ( Rest_Authentication::is_signed_with_blog_token() ) {
			return true;
		}

		return $this->get_forbidden_error();
	}

	/**
	 * Me endpoint.
	 *
	 * @return array
	 */
	public function me() {
		return array(
			'ID'       => 1000,
			'username' => 'no-user',
		);
	}

	/**
	 * Site endpoint.
	 *
	 * @param WP_REST_Request $req The request object.
	 * @return array
	 */
	public function site( $req ) {
		$response      = static::request_as_blog_cached(
			sprintf(
				'/sites/%d?%s',
				Jetpack_Options::get_option( 'id' ),
				http_build_query(
					$req->get_params()
				)
			),
			'1.1',
			array( 'timeout' => 30 )
		);
		$response_code = wp_remote_retrieve_response_code( $response );
		$response_body = wp_remote_retrieve_body( $response );

		if ( is_wp_error( $response ) || 200 !== $response_code || empty( $response_body ) ) {
			return is_wp_error( $response ) ? $response : new WP_Error( 'stats_error', $response_body );
		}

		return json_decode( $response_body, true );
	}

	/**
	 * Sites endpoint.
	 *
	 * @return array
	 */
	public function sites() {
		return array( 'sites' => $this->site() );
	}

	/**
	 * Resource endpoint.
	 *
	 * @param WP_REST_Request $req The request object.
	 * @return array
	 */
	public function get_resource_from_wpcom( $req ) {
		// TODO: add a whitelist of allowed resources.
		$wpcom_stats = new WPCOM_Stats( $req['resource'] );
		return $wpcom_stats->fetch_stats( $req->get_params() );
	}

	/**
	 * Returns an empty object.
	 *
	 * @return object
	 */
	public function empty_result() {
		return json_decode( '{}' );
	}

	/**
	 * Empty result.
	 *
	 * @param WP_REST_Request $req The request object.
	 * @return array
	 */
	public function get_site_resource_from_wpcom( $req ) {
		// TODO: add a whitelist of allowed resources.
		$req['resouce'] = $req['resouce'] ? $req['resouce'] : '';
		$response       = static::request_as_blog_cached(
			sprintf(
				'/sites/%d/%s?%s',
				Jetpack_Options::get_option( 'id' ),
				$req['resouce'],
				http_build_query(
					$req->get_params()
				)
			),
			'1.1',
			array( 'timeout' => 30 )
		);
		$response_code  = wp_remote_retrieve_response_code( $response );
		$response_body  = wp_remote_retrieve_body( $response );

		if ( is_wp_error( $response ) || 200 !== $response_code || empty( $response_body ) ) {
			return is_wp_error( $response ) ? $response : new WP_Error( 'stats_error', $response_body );
		}

		return json_decode( $response_body, true );
	}

	/**
	 * Return a WP_Error object with a forbidden error.
	 */
	protected function get_forbidden_error() {
		$error_msg = esc_html__(
			'You are not allowed to perform this action.',
			'jetpack-stats'
		);

		return new WP_Error( 'rest_forbidden', $error_msg, array( 'status' => rest_authorization_required_code() ) );
	}

	/**
	 * Forward remote response to client with error handling.
	 *
	 * @param array|WP_Error $response - Response from WPCOM.
	 */
	protected function make_proper_response( $response ) {
		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$body        = json_decode( wp_remote_retrieve_body( $response ), true );
		$status_code = wp_remote_retrieve_response_code( $response );

		if ( 200 === $status_code ) {
			return $body;
		}

		return new WP_Error(
			isset( $body['error'] ) ? 'remote-error-' . $body['error'] : 'remote-error',
			isset( $body['message'] ) ? $body['message'] : 'unknown remote error',
			array( 'status' => $status_code )
		);
	}
	/**
	 * Query the WordPress.com REST API using the blog token
	 *
	 * @param String $path The API endpoint relative path.
	 * @param String $version The API version.
	 * @param array  $args Request arguments.
	 * @param String $body Request body.
	 * @param String $base_api_path (optional) the API base path override, defaults to 'rest'.
	 * @param bool   $use_cache (optional) default to true.
	 * @return array|WP_Error $response Data.
	 */
	protected function request_as_blog_cached( $path, $version = '1.1', $args = array(), $body = null, $base_api_path = 'rest', $use_cache = true ) {
		// Arrays are serialized without considering the order of objects, but it's okay atm.
		$cache_key = 'STATS_REST_RESP_' . md5( implode( '|', array( $path, $version, wp_json_encode( $args ), wp_json_encode( $body ), $base_api_path ) ) );

		if ( $use_cache ) {
			$response = get_transient( $cache_key );
			if ( false !== $response ) {
				return json_decode( $response, true );
			}
		}

		$response          = Client::wpcom_json_api_request_as_blog(
			$path,
			$version,
			$args,
			$body,
			$base_api_path = 'rest'
		);
		set_transient( $cache_key, wp_json_encode( $response ), 5 * MINUTE_IN_SECONDS );
		return $response;
	}

	/**
	 * Get blog id
	 */
	protected function get_blog_id() {
		return $this->is_wpcom ? get_current_blog_id() : Jetpack_Options::get_option( 'id' );
	}

}
