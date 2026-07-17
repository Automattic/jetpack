<?php
/**
 * REST API endpoint for logging PingHub connection events to Logstash.
 *
 * Only registered on Simple sites where log2logstash() is available.
 *
 * @package automattic/jetpack-rtc
 */

namespace Automattic\Jetpack\RTC;

use WP_Error;
use WP_REST_Controller;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;

/**
 * REST controller that receives PingHub connection lifecycle events from
 * the browser and forwards them to Logstash for debugging.
 */
class REST_Connection_Log extends WP_REST_Controller {

	/**
	 * Constructor.
	 */
	public function __construct() {
		$this->namespace = 'wpcom/v2';
		$this->rest_base = 'rtc/connection-log';
	}

	/**
	 * Register routes.
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base,
			array(
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'create_item' ),
					'permission_callback' => array( $this, 'create_item_permissions_check' ),
					'args'                => array(
						'event'      => array(
							'required' => true,
							'type'     => 'string',
							'enum'     => array( 'connected', 'disconnected', 'reconnecting', 'jwt_fetch_error' ),
						),
						'properties' => array(
							'required' => false,
							'type'     => 'object',
							'default'  => array(),
						),
					),
				),
			)
		);
	}

	/**
	 * Permission check: current user must be a member of the blog.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return true|WP_Error
	 */
	public function create_item_permissions_check( $request ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		if ( ! is_user_member_of_blog() ) {
			return new WP_Error(
				'rest_forbidden',
				__( 'You are not allowed to access this endpoint.', 'jetpack-rtc' ),
				array( 'status' => 403 )
			);
		}

		return true;
	}

	/**
	 * Log a PingHub connection event to Logstash.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response
	 */
	public function create_item( $request ) {
		$event      = $request['event'];
		$properties = $request['properties'];

		// Sanitize properties to scalar values only.
		$sanitized = array();
		if ( is_array( $properties ) ) {
			foreach ( $properties as $key => $value ) {
				if ( is_scalar( $value ) ) {
					$sanitized[ sanitize_key( $key ) ] = $value;
				}
			}
		}

		log2logstash(
			array(
				'feature' => 'rtc',
				'message' => 'pinghub_' . $event,
				'blog_id' => get_current_blog_id(),
				'user_id' => get_current_user_id(),
				'extra'   => wp_json_encode( $sanitized, JSON_UNESCAPED_SLASHES ),
			)
		);

		return rest_ensure_response( array( 'success' => true ) );
	}
}
