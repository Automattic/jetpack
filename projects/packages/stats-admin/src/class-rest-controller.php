<?php
/**
 * The Search Rest Controller class.
 * Registers the REST routes for Search.
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\StatsAdmin;

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
			'/sites/' . Jetpack_Options::get_option( 'id' ) . '/stats/(?P<resource>[\-\w]+)/(?P<resource_id>[\d]+)',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_stats_single_resource_from_wpcom' ),
				'permission_callback' => 'is_user_logged_in',
			)
		);
		register_rest_route(
			static::$namespace,
			'/sites/' . Jetpack_Options::get_option( 'id' ) . '/stats/(?P<resource>[\-\w]+)',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_stats_resource_from_wpcom' ),
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
			sprintf( '/sites/%d', Jetpack_Options::get_option( 'id' ) ),
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'site' ),
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
		return static::request_as_blog_cached(
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
	}

	/**
	 * Sites endpoint.
	 *
	 * @param WP_REST_Request $req The request object.
	 * @return array
	 */
	public function sites( $req ) {
		return array( 'sites' => $this->site( $req ) );
	}

	/**
	 * Resource endpoint.
	 *
	 * @param WP_REST_Request $req The request object.
	 * @return array
	 */
	public function get_stats_resource_from_wpcom( $req ) {
		// TODO: add a whitelist of allowed resources.
		return static::request_as_blog_cached(
			sprintf(
				'/sites/%d/stats/%s?%s',
				Jetpack_Options::get_option( 'id' ),
				$req->get_param( 'resource' ),
				http_build_query(
					$req->get_params()
				)
			),
			'1.1',
			array( 'timeout' => 30 )
		);
	}

	/**
	 * Resource endpoint.
	 *
	 * @param WP_REST_Request $req The request object.
	 * @return array
	 */
	public function get_stats_single_resource_from_wpcom( $req ) {
		// TODO: add a whitelist of allowed resources.
		return static::request_as_blog_cached(
			sprintf(
				'/sites/%d/stats/%s/%d?%s',
				Jetpack_Options::get_option( 'id' ),
				$req->get_param( 'resource' ),
				$req->get_param( 'resource_id' ),
				http_build_query(
					$req->get_params()
				)
			),
			'1.1',
			array( 'timeout' => 30 )
		);
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
		// TODO: we could serve 'posts' locally.
		// TODO: add a whitelist of allowed resources.
		if ( 'site-has-never-published-post' === $req->get_param( 'resource' ) ) {
			return $this->get_has_never_published_post( $req );
		}
		// TODO: remove calling those APIs.
		if ( in_array( $req->get_param( 'resource' ), array( 'sharing-buttons', 'plugins', 'keyrings', 'rewind' ), true ) ) {
			return $this->empty_result();
		}
		return static::request_as_blog_cached(
			sprintf(
				'/sites/%d/%s?%s',
				Jetpack_Options::get_option( 'id' ),
				$req->get_param( 'resource' ),
				http_build_query(
					$req->get_params()
				)
			),
			'1.1',
			array( 'timeout' => 30 )
		);
	}

	/**
	 * Stolen from `wp-content/rest-api-plugins/endpoints/sites-has-never-published-post.php`
	 *
	 * @param WP_REST_Request $req The request object.
	 *
	 * @return bool the value of has ever published post
	 */
	protected function get_has_never_published_post( $req ) {
		$has_never_published_post = (bool) get_option( 'has_never_published_post', false );

		if ( ! $has_never_published_post ) {
			return false;
		}

		$include_pages = $req->get_param( 'include_pages' );
		if ( $include_pages ) {
			$has_never_published_page = true;
			$pages                    = get_pages();
			// 20 is a threshold, We are assuming that there won't be more than 20 head start pages.
			if ( count( $pages ) <= 20 ) {
				foreach ( $pages as $page ) {
					$is_headstart_post = ! empty( get_post_meta( $page->ID, '_headstart_post' ) );
					if ( ! $is_headstart_post ) {
						$has_never_published_page = false;
						break;
					}
				}
			} else {
				$has_never_published_page = false;
			}
			return rest_ensure_response( $has_never_published_post && $has_never_published_page );
		}

		return rest_ensure_response( $has_never_published_post );
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
	protected function request_as_blog_cached( $path, $version = '1.1', $args = array(), $body = null, $base_api_path = 'rest', $use_cache = false ) {
		// Arrays are serialized without considering the order of objects, but it's okay atm.
		$cache_key = 'STATS_REST_RESP_' . md5( implode( '|', array( $path, $version, wp_json_encode( $args ), wp_json_encode( $body ), $base_api_path ) ) );

		if ( $use_cache ) {
			$response_body = get_transient( $cache_key );
			if ( false !== $response_body ) {
				return json_decode( $response_body, true );
			}
		}

		$response          = Client::wpcom_json_api_request_as_blog(
			$path,
			$version,
			$args,
			$body,
			$base_api_path = 'rest'
		);
		$response_code = wp_remote_retrieve_response_code( $response );
		$response_body = wp_remote_retrieve_body( $response );

		if ( is_wp_error( $response ) || 200 !== $response_code || empty( $response_body ) ) {
			return is_wp_error( $response ) ? $response : new WP_Error(
				isset( $response_body['error'] ) ? 'remote-error-' . $response_body['error'] : 'remote-error',
				isset( $response_body['message'] ) ? $response_body['message'] : 'unknown remote error',
				array( 'status' => $response_code )
			);

		}

		set_transient( $cache_key, $response_body, 5 * MINUTE_IN_SECONDS );
		return json_decode( $response_body, true );
	}

	/**
	 * Return a WP_Error object with a forbidden error.
	 */
	protected function get_forbidden_error() {
		$error_msg = esc_html__(
			'You are not allowed to perform this action.',
			'jetpack-stats-admin'
		);

		return new WP_Error( 'rest_forbidden', $error_msg, array( 'status' => rest_authorization_required_code() ) );
	}
}
