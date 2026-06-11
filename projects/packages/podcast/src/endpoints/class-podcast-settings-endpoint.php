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
 * Package-owned REST surface for the `podcasting_*` options the dashboard SPA
 * reads and writes. Replaces the previous reliance on core `/wp/v2/settings`
 * (and, on Simple, the legacy WPCOM v1.x site-settings filters): the schema and
 * sanitizers live entirely in {@see Settings}, so this works unchanged on
 * self-hosted Jetpack — it's pure option read/write with no wpcom backend.
 *
 * Storage stays as `wp_options`; each `register_setting()` sanitizer fires on
 * write because {@see update_option()} runs the `sanitize_option_{$name}` filter.
 */
class Podcast_Settings_Endpoint extends WP_REST_Controller {

	const REST_NAMESPACE = 'jetpack/v4';
	const REST_BASE      = 'podcast/settings';

	/**
	 * Whether `init()` has wired its hooks.
	 *
	 * @var bool
	 */
	private static $initialized = false;

	/**
	 * Wire up routes. Idempotent.
	 */
	public static function init() {
		if ( self::$initialized ) {
			return;
		}
		self::$initialized = true;

		$instance = new self();
		add_action( 'rest_api_init', array( $instance, 'register_routes' ) );
	}

	/**
	 * Register the GET (full record) + writable (partial patch) routes.
	 *
	 * Update args are top-level type coercion only — the registered
	 * `sanitize_callback`s do the real validation when {@see update_option()}
	 * fires `sanitize_option_{$name}`. Strict per-field schema validation here
	 * would 400 a whole patch on one bad field; the SPA relies on silent-drop.
	 */
	public function register_routes() {
		$this->namespace = self::REST_NAMESPACE;
		$this->rest_base = self::REST_BASE;

		register_rest_route(
			$this->namespace,
			$this->rest_base,
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
		$touched = false;

		foreach ( Settings::OPTION_NAMES as $name ) {
			$value = $request->get_param( $name );
			if ( null === $value ) {
				continue;
			}
			update_option( $name, $value );
			$touched = true;
		}

		if ( $touched ) {
			/**
			 * Fires after a podcast settings write through the REST endpoint.
			 *
			 * Transport-agnostic replacement for the old `/wp/v2/settings`
			 * response hook; {@see Tracks} listens here to emit the aggregate
			 * `wpcom_podcasting_settings_saved` event.
			 *
			 * @since $$next-version$$
			 */
			do_action( 'jetpack_podcast_settings_saved' );
		}

		return rest_ensure_response( Settings::get_all() );
	}
}
