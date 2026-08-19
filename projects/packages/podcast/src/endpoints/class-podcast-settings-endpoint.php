<?php
/**
 * Dedicated REST endpoint for `podcasting_*` site settings.
 *
 * @package automattic/jetpack-podcast
 */

namespace Automattic\Jetpack\Podcast;

use WP_Error;
use WP_REST_Controller;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;

/**
 * Reads and writes the `podcasting_*` options for the dashboard SPA over its own
 * `wpcom/v2/podcast/settings` route. Schema and sanitizers live in {@see Settings}.
 *
 * Registered through the WPCOM REST API v2 plugin framework
 * ({@see wpcom_rest_api_v2_load_plugin()}), so a single definition is reachable on
 * Simple and WoA via the `public-api.wordpress.com` proxy and, once Podcast ships in
 * the Jetpack plugin, same-origin on self-hosted sites — no per-platform relay.
 */
class Podcast_Settings_Endpoint extends WP_REST_Controller {

	/**
	 * Wire the routes onto `rest_api_init`. The framework instantiates this once.
	 */
	public function __construct() {
		$this->namespace = 'wpcom/v2';
		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	/**
	 * Register the endpoint through the WPCOM REST API v2 framework. The loader
	 * ships with the Jetpack plugin core-api, present in every context Podcast runs
	 * in (Simple/WoA today, the Jetpack plugin once Podcast moves there); guarded so
	 * the package no-ops rather than fatals if it's somehow absent.
	 */
	public static function init() {
		if ( function_exists( 'wpcom_rest_api_v2_load_plugin' ) ) {
			wpcom_rest_api_v2_load_plugin( self::class );
		}
	}

	/**
	 * Register the GET (full record) + writable (partial patch) routes.
	 *
	 * Update args only coerce top-level types — the registered `sanitize_callback`s
	 * do the real validation on write, so one bad field can't 400 the whole patch.
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			'podcast/settings',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_item' ),
					'permission_callback' => array( $this, 'permission_check' ),
				),
				array(
					'methods'             => WP_REST_Server::EDITABLE,
					'callback'            => array( $this, 'update_item' ),
					'permission_callback' => array( $this, 'permission_check' ),
					'args'                => Settings::rest_schema_properties(),
				),
			)
		);
	}

	/**
	 * Site admins only — same gate as the wp-admin Podcast dashboard.
	 *
	 * @return true|WP_Error
	 */
	public function permission_check() {
		if ( ! current_user_can( 'manage_options' ) ) {
			return new WP_Error(
				'rest_forbidden',
				__( 'Sorry, you are not allowed to manage podcast settings for this site.', 'jetpack-podcast' ),
				array( 'status' => rest_authorization_required_code() )
			);
		}
		return true;
	}

	/**
	 * GET — the full, padded settings record.
	 *
	 * @param WP_REST_Request $request Unused.
	 * @return WP_REST_Response
	 */
	public function get_item( $request ) {
		unset( $request );
		return rest_ensure_response( Settings::get_all() );
	}

	/**
	 * PUT/POST/PATCH — apply a partial patch and return the full merged record.
	 *
	 * Only keys actually present in the request are written, so absent keys can
	 * never clobber stored values. Array-shaped options merge on sanitize.
	 *
	 * @param WP_REST_Request $request Incoming request.
	 * @return WP_REST_Response
	 */
	public function update_item( $request ) {
		$saved = false;

		foreach ( Settings::OPTION_NAMES as $name ) {
			$value = $request->get_param( $name );
			if ( null === $value ) {
				continue;
			}
			if ( update_option( $name, $value ) ) {
				$saved = true;
			}
		}

		if ( $saved ) {
			/**
			 * Fires after a podcast settings write changes at least one option.
			 *
			 * @since 1.1.1
			 */
			do_action( 'jetpack_podcast_settings_saved' );
		}

		return rest_ensure_response( Settings::get_all() );
	}
}
