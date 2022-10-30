<?php
/**
 * The Search Rest Controller class.
 * Registers the REST routes for Search.
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Stats;

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
			'/sites/(?P<blog_id>\d+)',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'site' ),
				'permission_callback' => 'is_user_logged_in',
			)
		);
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
				'callback'            => array( $this, 'empty_object' ),
				'permission_callback' => 'is_user_logged_in',
			)
		);
		register_rest_route(
			static::$namespace,
			'/me/preferences',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'empty_object' ),
				'permission_callback' => 'is_user_logged_in',
			)
		);
		register_rest_route(
			static::$namespace,
			'/sites/(?P<blog_id>\d+)/features',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'empty_object' ),
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
			'ID'       => 9025583,
			'username' => 'kangzj',
		);
	}

	/**
	 * Site endpoint.
	 *
	 * @return array
	 */
	public function site() {
		return array(
			'ID'  => 193141071,
			'URL' => 'https://jasper1.au.ngrok.io',
		);
	}

	/**
	 * Sites endpoint.
	 *
	 * @return array
	 */
	public function sites() {
		return array(
			'sites' => array(
				'ID'  => 193141071,
				'URL' => 'https://jasper1.au.ngrok.io',
			),
		);
	}

	/**
	 * Empty result.
	 *
	 * @return array
	 */
	public function empty_object() {
		return json_decode( '{}' );
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
	 * Get blog id
	 */
	protected function get_blog_id() {
		return $this->is_wpcom ? get_current_blog_id() : Jetpack_Options::get_option( 'id' );
	}

}
