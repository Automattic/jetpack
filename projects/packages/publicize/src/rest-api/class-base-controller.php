<?php
/**
 * Base Controller class.
 *
 * @package automattic/jetpack-publicize
 */

namespace Automattic\Jetpack\Publicize\REST_API;

use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\Connection\Manager;
use Automattic\Jetpack\Status\Host;
use Automattic\Jetpack\Status\Visitor;
use WP_Error;
use WP_REST_Controller;
use WP_REST_Request;
use WP_REST_Response;

/**
 * Base controller for Publicize endpoints.
 */
abstract class Base_Controller extends WP_REST_Controller {

	/**
	 * Whether to allow requests as blog.
	 *
	 * @var bool
	 */
	protected $allow_requests_as_blog = false;

	/**
	 * Constructor.
	 */
	public function __construct() {
		$this->wpcom_is_wpcom_only_endpoint = true;
	}

	/**
	 * Check if we are on WPCOM.
	 *
	 * @return bool
	 */
	public static function is_wpcom() {
		return ( new Host() )->is_wpcom_simple();
	}

	/**
	 * Check if the request is authorized for the blog.
	 *
	 * @return bool
	 */
	protected static function is_authorized_blog_request() {
		if ( self::is_wpcom() && is_jetpack_site( get_current_blog_id() ) ) {

			$jp_auth_endpoint = new \WPCOM_REST_API_V2_Endpoint_Jetpack_Auth();

			return $jp_auth_endpoint->is_jetpack_authorized_for_site() === true;
		}

		return false;
	}

	/**
	 * Copied from WPCOM_REST_API_Proxy_Request_Trait. See the @todo below.
	 *
	 * Proxy request to wpcom servers on behalf of a user or using the Site-level Connection (blog token).
	 *
	 * @todo Swap this with the trait when it's available 🔗👇
	 * @link https://github.com/Automattic/jetpack/issues/40947
	 *
	 * @param WP_Rest_Request $request Request to proxy.
	 * @param string          $path Path to append to the rest base.
	 * @param string          $context Can be Either 'user' or 'blog'. Defaults to 'user'.
	 *
	 * @return mixed|WP_Error           Response from wpcom servers or an error.
	 */
	protected function proxy_request_to_wpcom( $request, $path = '', $context = 'user' ) {
		$blog_id      = \Jetpack_Options::get_option( 'id' );
		$path         = '/sites/' . rawurldecode( $blog_id ) . '/' . rawurldecode( ltrim( $this->rest_base, '/' ) ) . ( $path ? '/' . rawurldecode( ltrim( $path, '/' ) ) : '' );
		$query_params = $request->get_query_params();
		$manager      = new Manager();

		/*
		 * A rest_route parameter can be added when using plain permalinks.
		 * It is not necessary to pass them to WordPress.com,
		 * and may even cause issues with some endpoints.
		 * Let's remove it.
		 */
		if ( isset( $query_params['rest_route'] ) ) {
			unset( $query_params['rest_route'] );
		}
		$api_url = add_query_arg( $query_params, $path );

		$request_options = array(
			'headers' => array(
				'Content-Type'    => 'application/json',
				'X-Forwarded-For' => ( new Visitor() )->get_ip( true ),
			),
			'method'  => $request->get_method(),
		);

		// If no body is present, passing it as $request->get_body() will cause an error.
		$body = $request->get_body() ? $request->get_body() : null;

		$response = new WP_Error(
			'rest_unauthorized',
			__( 'Please connect your user account to WordPress.com', 'jetpack-publicize-pkg' ),
			array( 'status' => rest_authorization_required_code() )
		);

		if ( 'user' === $context ) {
			if ( ! $manager->is_user_connected() ) {
				return $response;
			}
			$response = Client::wpcom_json_api_request_as_user( $api_url, $this->version, $request_options, $body, $this->base_api_path );
		}

		if ( 'blog' === $context ) {
			if ( ! $manager->is_connected() ) {
				return $response;
			}

			$response = Client::wpcom_json_api_request_as_blog( $api_url, $this->version, $request_options, $body, $this->base_api_path );
		}

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$response_status = wp_remote_retrieve_response_code( $response );
		$response_body   = json_decode( wp_remote_retrieve_body( $response ), true );

		if ( $response_status >= 400 ) {
			$code    = isset( $response_body['code'] ) ? $response_body['code'] : 'unknown_error';
			$message = isset( $response_body['message'] ) ? $response_body['message'] : __( 'An unknown error occurred.', 'jetpack-publicize-pkg' );

			return new WP_Error( $code, $message, array( 'status' => $response_status ) );
		}

		return $response_body;
	}

	/**
	 * Filters out data based on ?_fields= request parameter
	 *
	 * @param array           $item    Item to prepare.
	 * @param WP_REST_Request $request Full details about the request.
	 *
	 * @return WP_REST_Response filtered item
	 */
	public function prepare_item_for_response( $item, $request ) {

		$fields = $this->get_fields_for_response( $request );

		$response_data = array();
		foreach ( $item as $field => $value ) {
			if ( rest_is_field_included( $field, $fields ) ) {
				$response_data[ $field ] = $value;
			}
		}

		return rest_ensure_response( $response_data );
	}

	/**
	 * Verify that user can access Publicize data
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return true|WP_Error
	 */
	public function get_items_permissions_check( $request ) {// phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable

		global $publicize;

		if ( ! $publicize ) {
			return new WP_Error(
				'publicize_not_available',
				__( 'Sorry, Jetpack Social is not available on your site right now.', 'jetpack-publicize-pkg' ),
				array( 'status' => rest_authorization_required_code() )
			);
		}

		if ( $this->allow_requests_as_blog && self::is_authorized_blog_request() ) {
			return true;
		}

		if ( $publicize->current_user_can_access_publicize_data() ) {
			return true;
		}

		return new WP_Error(
			'invalid_user_permission_publicize',
			__( 'Sorry, you are not allowed to access Jetpack Social data on this site.', 'jetpack-publicize-pkg' ),
			array( 'status' => rest_authorization_required_code() )
		);
	}
}
