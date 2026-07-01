<?php
/**
 * REST controller for the site-level Schema settings.
 *
 * Exposes the package-owned {@see Schema_Settings} store over a dedicated
 * `jetpack/v4/seo/schema-settings` route rather than the shared
 * `/jetpack/v4/settings` endpoint: the schema option is a nested container, and
 * that endpoint rejects nested / unknown flat keys, so the package owns its own
 * route. GET returns the editing payload — the stored overrides plus the
 * site-identity defaults the form shows as placeholders; the write method
 * sanitizes the submission, persists it, and returns the new payload.
 *
 * Capability-gated on `manage_options`, mirroring the package's opt-in route.
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
	 * Register the GET (read effective settings) and write (sanitize + persist)
	 * route. Hooked on `rest_api_init` by the Initializer.
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
	 * GET: the editing payload — the raw stored overrides plus the site-identity
	 * defaults the form shows as field placeholders.
	 *
	 * @return \WP_REST_Response
	 */
	public static function get_item() {
		return rest_ensure_response( Schema_Settings::get_editable() );
	}

	/**
	 * POST/PUT: sanitize and persist the submission, then return the new editing
	 * payload. The whole request body is forwarded to the store, which only reads
	 * the keys it knows (`organization` today), keeping the route extensible for
	 * later schema types.
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
