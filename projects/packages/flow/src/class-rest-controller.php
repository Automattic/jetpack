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

		register_rest_route(
			self::NAMESPACE,
			'/flows',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => static fn() => rest_ensure_response( Flow_Store::all() ),
					'permission_callback' => array( Flow::class, 'current_user_can_manage' ),
				),
				array(
					'methods'             => WP_REST_Server::EDITABLE,
					'callback'            => array( __CLASS__, 'save_flows' ),
					'permission_callback' => array( Flow::class, 'current_user_can_manage' ),
				),
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
	 * Save the full list of flows.
	 *
	 * @param WP_REST_Request $request Request.
	 * @return \WP_REST_Response
	 */
	public static function save_flows( $request ) {
		return rest_ensure_response( Flow_Store::save( $request->get_param( 'flows' ) ) );
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
