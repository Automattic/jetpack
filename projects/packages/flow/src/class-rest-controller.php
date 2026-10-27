<?php
/**
 * REST API for the Flow dashboard and inbound events.
 *
 * @package automattic/jetpack-flow
 */

namespace Automattic\Jetpack\Flow;

use WP_REST_Request;
use WP_REST_Server;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Registers the jetpack-flow/v1 routes.
 */
class REST_Controller {

	const NAMESPACE = 'jetpack-flow/v1';

	/**
	 * Hook route registration.
	 *
	 * @return void
	 */
	public static function init() {
		add_action( 'rest_api_init', array( __CLASS__, 'register_routes' ) );
	}

	/**
	 * Register routes.
	 *
	 * @return void
	 */
	public static function register_routes() {
		register_rest_route(
			self::NAMESPACE,
			'/catalog',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( __CLASS__, 'get_catalog' ),
				'permission_callback' => array( Flow::class, 'current_user_can_manage' ),
			)
		);

		$can = array( Flow::class, 'current_user_can_manage' );

		register_rest_route(
			self::NAMESPACE,
			'/flows',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => static fn() => rest_ensure_response( Flow_Store::all() ),
					'permission_callback' => $can,
				),
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => static fn( $request ) => self::respond( Flow_Store::save( (array) $request->get_json_params() ) ),
					'permission_callback' => $can,
				),
			)
		);

		register_rest_route(
			self::NAMESPACE,
			'/flows/(?P<id>\d+)',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => static fn( $request ) => self::respond( Flow_Store::get( (int) $request['id'] ) ?? self::not_found() ),
					'permission_callback' => $can,
				),
				array(
					'methods'             => WP_REST_Server::EDITABLE,
					'callback'            => static fn( $request ) => self::respond( Flow_Store::save( (array) $request->get_json_params(), (int) $request['id'] ) ),
					'permission_callback' => $can,
				),
				array(
					'methods'             => WP_REST_Server::DELETABLE,
					'callback'            => static fn( $request ) => self::respond( Flow_Store::delete( (int) $request['id'] ) ? array( 'deleted' => true ) : self::not_found() ),
					'permission_callback' => $can,
				),
			)
		);

		register_rest_route(
			self::NAMESPACE,
			'/flows/(?P<id>\d+)/enabled',
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => static fn( $request ) => self::respond( Flow_Store::set_enabled( (int) $request['id'], (bool) $request->get_param( 'enabled' ) ) ),
				'permission_callback' => $can,
			)
		);

		register_rest_route(
			self::NAMESPACE,
			'/plan',
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => array( __CLASS__, 'plan' ),
				'permission_callback' => array( Flow::class, 'current_user_can_manage' ),
				'args'                => array(
					'prompt' => array(
						'type'     => 'string',
						'required' => true,
					),
				),
			)
		);

		register_rest_route(
			self::NAMESPACE,
			'/events/(?P<trigger>[a-z_]+)',
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => array( __CLASS__, 'receive_event' ),
				'permission_callback' => array( __CLASS__, 'check_inbound_token' ),
			)
		);

		register_rest_route(
			self::NAMESPACE,
			'/hooks/(?P<token>[A-Za-z0-9]{32,})',
			array(
				'methods'             => WP_REST_Server::READABLE . ', ' . WP_REST_Server::CREATABLE,
				'callback'            => array( __CLASS__, 'receive_hook' ),
				'permission_callback' => '__return_true', // The long secret in the URL is the credential.
			)
		);
	}

	/**
	 * Run the flow behind a secret inbound URL.
	 *
	 * @param WP_REST_Request $request Request.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public static function receive_hook( $request ) {
		$flow = Flow_Store::find_by_token( (string) $request['token'] );
		if ( ! $flow ) {
			return new \WP_Error( 'not_found', __( 'Not found.', 'jetpack-flow-pkg' ), array( 'status' => 404 ) );
		}

		$fields = array_merge( (array) $request->get_query_params(), (array) $request->get_body_params(), (array) $request->get_json_params() );
		$data   = array( 'method' => $request->get_method() );
		foreach ( array_slice( $fields, 0, 50, true ) as $key => $value ) {
			if ( is_scalar( $value ) && 'token' !== $key ) {
				$data[ sanitize_key( (string) $key ) ] = mb_substr( sanitize_text_field( (string) $value ), 0, 2000 );
			}
		}

		Engine::run_flow( $flow, $data );
		return rest_ensure_response( array( 'received' => true ) );
	}

	/**
	 * Catalog plus site data the dashboard needs.
	 *
	 * @return \WP_REST_Response
	 */
	public static function get_catalog() {
		$users = array();
		foreach ( get_users(
			array(
				'number'  => 200,
				'orderby' => 'display_name',
			)
		) as $user ) {
			$users[] = array(
				'value' => (string) $user->ID,
				'label' => sprintf( '%s (%s)', $user->display_name, $user->user_email ),
			);
		}

		$roles = array();
		foreach ( wp_roles()->get_names() as $slug => $name ) {
			$roles[] = array(
				'value' => $slug,
				'label' => translate_user_role( $name ),
			);
		}

		return rest_ensure_response(
			array_merge(
				Catalog::for_rest(),
				array(
					'users'       => $users,
					'roles'       => $roles,
					'inbound_url' => add_query_arg( 'token', Flow_Store::inbound_token(), rest_url( self::NAMESPACE . '/events/' ) ),
				)
			)
		);
	}

	/**
	 * Wrap a result for REST.
	 *
	 * @param mixed $result Data or WP_Error.
	 * @return \WP_REST_Response|\WP_Error
	 */
	private static function respond( $result ) {
		return is_wp_error( $result ) ? $result : rest_ensure_response( $result );
	}

	/**
	 * Standard 404.
	 *
	 * @return \WP_Error
	 */
	private static function not_found() {
		return new \WP_Error( 'not_found', __( 'Flow not found.', 'jetpack-flow-pkg' ), array( 'status' => 404 ) );
	}

	/**
	 * Plan flows from a description.
	 *
	 * @param WP_REST_Request $request Request.
	 * @return \WP_REST_Response
	 */
	public static function plan( $request ) {
		return rest_ensure_response( Planner::plan( (string) $request->get_param( 'prompt' ) ) );
	}

	/**
	 * Accept an event posted by an external service such as Monitor.
	 *
	 * @param WP_REST_Request $request Request.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public static function receive_event( $request ) {
		$trigger = (string) $request['trigger'];
		if ( empty( Catalog::triggers()[ $trigger ]['inbound'] ) ) {
			return new \WP_Error( 'unknown_trigger', __( 'Unknown trigger.', 'jetpack-flow-pkg' ), array( 'status' => 404 ) );
		}

		$payload = array();
		foreach ( (array) $request->get_json_params() as $key => $value ) {
			if ( is_scalar( $value ) ) {
				$payload[ sanitize_key( $key ) ] = sanitize_text_field( (string) $value );
			}
		}

		Engine::fire( $trigger, $payload );
		return rest_ensure_response( array( 'received' => true ) );
	}

	/**
	 * Check the shared secret on inbound events.
	 *
	 * @param WP_REST_Request $request Request.
	 * @return bool
	 */
	public static function check_inbound_token( $request ) {
		return hash_equals( Flow_Store::inbound_token(), (string) $request->get_param( 'token' ) );
	}
}
