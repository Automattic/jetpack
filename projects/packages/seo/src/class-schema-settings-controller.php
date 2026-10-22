<?php
/**
 * REST controller for the site-level Schema settings.
 *
 * Exposes {@see Schema_Settings} over a dedicated `jetpack/v4/seo/schema-settings`
 * route rather than `/jetpack/v4/settings`, which rejects the nested schema
 * container. GET returns the editing payload; the write method sanitizes,
 * persists, and returns the new payload. Gated on `manage_options`.
 *
 * Also serves the signed-in user's author profile on `jetpack/v4/seo/author-profile`.
 * Simple's loader registers only the controllers it names, so that route lives here.
 *
 * @package automattic/jetpack-seo-package
 */

namespace Automattic\Jetpack\SEO;

use WP_REST_Request;
use WP_REST_Server;

/**
 * Registers and serves the Schema settings and author profile REST routes.
 */
class Schema_Settings_Controller {

	/**
	 * REST namespace, shared with the package's other Jetpack routes.
	 *
	 * @var string
	 */
	const REST_NAMESPACE = 'jetpack/v4';

	/**
	 * Route, relative to the namespace.
	 *
	 * @var string
	 */
	const REST_BASE = '/seo/schema-settings';

	/**
	 * Author profile route, relative to the namespace.
	 *
	 * @var string
	 */
	const AUTHOR_PROFILE_BASE = '/seo/author-profile';

	/**
	 * Register the GET (read) and write (sanitize + persist) routes.
	 *
	 * @return void
	 */
	public static function register_routes() {
		register_rest_route(
			self::REST_NAMESPACE,
			self::REST_BASE,
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( __CLASS__, 'get_item' ),
					'permission_callback' => array( __CLASS__, 'permissions_check' ),
				),
				array(
					'methods'             => WP_REST_Server::EDITABLE,
					'callback'            => array( __CLASS__, 'update_item' ),
					'permission_callback' => array( __CLASS__, 'permissions_check' ),
				),
			)
		);

		register_rest_route(
			self::REST_NAMESPACE,
			self::AUTHOR_PROFILE_BASE,
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( __CLASS__, 'get_author_profile' ),
					'permission_callback' => array( __CLASS__, 'permissions_check' ),
				),
				array(
					'methods'             => WP_REST_Server::EDITABLE,
					'callback'            => array( __CLASS__, 'update_author_profile' ),
					'permission_callback' => array( __CLASS__, 'permissions_check' ),
					'args'                => array(
						'name'        => array( 'type' => 'string' ),
						'description' => array( 'type' => 'string' ),
						'url'         => array( 'type' => 'string' ),
						'jobTitle'    => array( 'type' => 'string' ),
						'sameAs'      => array(
							'type'  => 'array',
							'items' => array( 'type' => 'string' ),
						),
					),
				),
			)
		);
	}

	/**
	 * Only administrators, the SEO page's audience, can use these routes.
	 *
	 * @return bool
	 */
	public static function permissions_check() {
		return current_user_can( 'manage_options' );
	}

	/**
	 * GET: the editing payload (stored overrides plus placeholder defaults).
	 *
	 * @return \WP_REST_Response
	 */
	public static function get_item() {
		return rest_ensure_response( Schema_Settings::get_editable() );
	}

	/**
	 * POST/PUT: sanitize and persist the submission, then return the new payload.
	 * Unknown keys are ignored and omitted schema sections retain their stored values.
	 *
	 * @param WP_REST_Request $request The REST request.
	 * @return \WP_REST_Response
	 */
	public static function update_item( WP_REST_Request $request ) {
		$params = $request->get_json_params();
		if ( ! is_array( $params ) ) {
			$params = $request->get_params();
		}

		return rest_ensure_response( Schema_Settings::update( $params ) );
	}

	/**
	 * GET: the signed-in user's author profile.
	 *
	 * @return \WP_REST_Response
	 */
	public static function get_author_profile() {
		return rest_ensure_response( Author_Schema_Node::get_profile( get_current_user_id() ) );
	}

	/**
	 * POST/PUT: update the signed-in user's author profile and return it as stored.
	 *
	 * @param WP_REST_Request $request The REST request.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public static function update_author_profile( WP_REST_Request $request ) {
		$fields = array_intersect_key(
			$request->get_params(),
			array_flip( array( 'name', 'description', 'url', 'jobTitle', 'sameAs' ) )
		);

		return rest_ensure_response( Author_Schema_Node::update_profile( get_current_user_id(), $fields ) );
	}
}
