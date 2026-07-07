<?php
/**
 * REST controller for the site-level Schema settings.
 *
 * Exposes {@see Schema_Settings} over a dedicated `jetpack/v4/seo/schema-settings`
 * route rather than `/jetpack/v4/settings`, which rejects the nested schema
 * container. GET returns the editing payload; the write method sanitizes,
 * persists, and returns the new payload. Gated on `manage_options`.
 *
 * @package automattic/jetpack-seo-package
 */

namespace Automattic\Jetpack\SEO;

use WP_REST_Request;
use WP_REST_Server;

/**
 * Registers and serves the Schema settings REST route.
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
	 * Register the GET (read) and write (sanitize + persist) route.
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
	}

	/**
	 * Only administrators can read or change the site's schema settings.
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
	 * The store only reads the keys it knows (`organization` today).
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
}
