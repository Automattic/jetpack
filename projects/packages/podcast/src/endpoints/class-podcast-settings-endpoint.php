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
 * `jetpack/v4/podcast/settings` route. Schema and sanitizers live in {@see Settings},
 * so it works the same on self-hosted Jetpack with no wpcom backend.
 */
class Podcast_Settings_Endpoint extends WP_REST_Controller {

	/**
	 * Register the REST routes on `rest_api_init`.
	 */
	public static function init() {
		add_action( 'rest_api_init', array( new self(), 'register_routes' ) );
	}

	/**
	 * Register the GET (full record) + writable (partial patch) routes.
	 *
	 * Update args only coerce top-level types — the registered `sanitize_callback`s
	 * do the real validation on write, so one bad field can't 400 the whole patch.
	 */
	public function register_routes() {
		register_rest_route(
			'jetpack/v4',
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
			update_option( $name, $value );
			$saved = true;
		}

		if ( $saved ) {
			/**
			 * Fires after a podcast settings write saves at least one option.
			 *
			 * @since $$next-version$$
			 */
			do_action( 'jetpack_podcast_settings_saved' );
		}

		return rest_ensure_response( Settings::get_all() );
	}
}
