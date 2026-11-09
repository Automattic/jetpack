<?php
/**
 * REST routes for the debug log.
 *
 * @package automattic/jetpack-send
 */

namespace Automattic\Jetpack\Send;

use WP_Error;
use WP_REST_Request;
use WP_REST_Server;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * `jetpack-send/v1/debug-log` routes; all require `manage_options`. There's no public link to the entries.
 */
class Debug_REST_Controller {

	/**
	 * Register the routes.
	 *
	 * @return void
	 */
	public static function register_routes() {
		$filters = array(
			'search' => array(
				'type'      => 'string',
				'maxLength' => 200,
				'default'   => '',
			),
			'level'  => REST_Controller::list_arg( Debug_Log::LEVELS ),
			'area'   => REST_Controller::list_arg( Debug_Log::AREAS ),
			'email'  => array(
				'type'    => 'integer',
				'minimum' => 0,
				'default' => 0,
			),
		);
		$routes  = array(
			'/debug-log'             => array(
				WP_REST_Server::READABLE,
				'get_entries',
				$filters + array(
					'page'     => array(
						'type'    => 'integer',
						'minimum' => 1,
						'default' => 1,
					),
					'per_page' => array(
						'type'    => 'integer',
						'minimum' => 1,
						'maximum' => 100,
						'default' => 20,
					),
				),
			),
			'/debug-log/(?P<id>\d+)' => array(
				WP_REST_Server::READABLE,
				'get_entry',
				array(
					'id' => array(
						'type'    => 'integer',
						'minimum' => 1,
					),
				),
			),
			'/debug-log/text'        => array( WP_REST_Server::READABLE, 'get_text', $filters ),
			'/debug-log/clear'       => array( WP_REST_Server::CREATABLE, 'clear', array() ),
		);
		foreach ( $routes as $route => $definition ) {
			list( $methods, $callback, $args ) = $definition;
			register_rest_route(
				REST_Controller::API_NAMESPACE,
				$route,
				array(
					'methods'             => $methods,
					'callback'            => array( __CLASS__, $callback ),
					'permission_callback' => array( REST_Controller::class, 'can_manage' ),
					'args'                => $args,
				)
			);
		}
	}

	/**
	 * GET /debug-log: a page of entries, newest first.
	 *
	 * @param WP_REST_Request $request Request.
	 * @return \WP_REST_Response
	 */
	public static function get_entries( WP_REST_Request $request ) {
		$args             = self::filters( $request );
		$args['page']     = (int) $request->get_param( 'page' );
		$args['per_page'] = (int) $request->get_param( 'per_page' );
		return rest_ensure_response( Debug_Log::query( $args ) );
	}

	/**
	 * GET /debug-log/{id}.
	 *
	 * @param WP_REST_Request $request Request.
	 * @return \WP_REST_Response|WP_Error
	 */
	public static function get_entry( WP_REST_Request $request ) {
		$entry = Debug_Log::get( (int) $request->get_param( 'id' ) );
		if ( ! $entry ) {
			return new WP_Error( 'jetpack_send_debug_entry_not_found', __( 'This entry is no longer in the debug log.', 'jetpack-send-pkg' ), array( 'status' => 404 ) );
		}
		return rest_ensure_response( $entry );
	}

	/**
	 * GET /debug-log/text: the newest 200 matching entries as plain text, for support.
	 *
	 * @param WP_REST_Request $request Request.
	 * @return \WP_REST_Response
	 */
	public static function get_text( WP_REST_Request $request ) {
		return rest_ensure_response( Debug_Log::text( self::filters( $request ) ) );
	}

	/**
	 * POST /debug-log/clear: delete every entry.
	 *
	 * @return \WP_REST_Response
	 */
	public static function clear() {
		return rest_ensure_response( array( 'deleted' => Debug_Log::clear() ) );
	}

	/**
	 * The list's filters from a request.
	 *
	 * @param WP_REST_Request $request Request.
	 * @return array
	 */
	private static function filters( WP_REST_Request $request ) {
		return array(
			'search' => (string) $request->get_param( 'search' ),
			'level'  => (array) $request->get_param( 'level' ),
			'area'   => (array) $request->get_param( 'area' ),
			'email'  => (int) $request->get_param( 'email' ),
		);
	}
}
