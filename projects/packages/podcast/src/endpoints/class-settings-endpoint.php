<?php
/**
 * Dedicated REST endpoint for `podcasting_*` settings.
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
 * GET/POST `wpcom/v2/podcast/settings` — single-namespace surface for the 14
 * `podcasting_*` options the wp-admin SPA reads and writes. Decouples the SPA
 * from `/wp/v2/settings`, which bloated the shared response with podcast keys
 * and is guarded by a strict shape test in wpcom.
 *
 * Storage stays as plain `wp_options` rows; the same `register_setting()`
 * sanitizers run because {@see update_option()} fires the
 * `sanitize_option_{$name}` filter that `register_setting()` attaches.
 */
class Settings_Endpoint extends WP_REST_Controller {

	const REST_NAMESPACE = 'wpcom/v2';
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
	 * Register GET (full record) and POST/PUT/PATCH (partial update) routes.
	 */
	public function register_routes() {
		$this->namespace = self::REST_NAMESPACE;
		$this->rest_base = self::REST_BASE;

		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base,
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
					'args'                => self::update_args(),
				),
				'schema' => array( $this, 'get_public_item_schema' ),
			)
		);
	}

	/**
	 * Same gate as the wp-admin Podcast page itself — site admins only. Mirrors
	 * what `/wp/v2/settings` enforces for the `manage_options`-scoped settings.
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
	 * GET /wpcom/v2/podcast/settings — return the full settings record.
	 *
	 * @param WP_REST_Request|null $request Pass-through; the endpoint takes no query params.
	 * @return WP_REST_Response
	 */
	public function get_item( $request = null ) {
		unset( $request );
		return rest_ensure_response( $this->collect_settings() );
	}

	/**
	 * POST/PUT/PATCH /wpcom/v2/podcast/settings — partial update. Each provided
	 * key is written via {@see update_option()} so the registered sanitizers
	 * (host allowlist, state enum, explicit normalization, etc.) run server-side.
	 * Response is the full merged record.
	 *
	 * @param WP_REST_Request $request Incoming request.
	 * @return WP_REST_Response
	 */
	public function update_item( $request ) {
		foreach ( Settings::OPTION_NAMES as $name ) {
			$value = $request->get_param( $name );
			if ( null === $value ) {
				continue;
			}
			update_option( $name, $value );
		}

		return rest_ensure_response( $this->collect_settings() );
	}

	/**
	 * Build the response body from current option values, coercing each entry to
	 * the shape the SPA expects (defaults for missing rows, normalized show_urls
	 * and show_states maps).
	 *
	 * @return array<string, mixed>
	 */
	private function collect_settings() {
		$podcatcher_keys = array_keys( Settings::SHOW_URL_HOSTS );
		$empty_map       = array_fill_keys( $podcatcher_keys, '' );

		$show_urls   = (array) get_option( 'podcasting_show_urls', array() );
		$show_states = (array) get_option( 'podcasting_show_states', array() );

		return array(
			'podcasting_category_id' => (int) get_option( 'podcasting_category_id', 0 ),
			'podcasting_title'       => (string) get_option( 'podcasting_title', '' ),
			'podcasting_talent_name' => (string) get_option( 'podcasting_talent_name', '' ),
			'podcasting_summary'     => (string) get_option( 'podcasting_summary', '' ),
			'podcasting_copyright'   => (string) get_option( 'podcasting_copyright', '' ),
			'podcasting_explicit'    => Settings::sanitize_explicit( get_option( 'podcasting_explicit', false ) ),
			'podcasting_image'       => (string) get_option( 'podcasting_image', '' ),
			'podcasting_image_id'    => (int) get_option( 'podcasting_image_id', 0 ),
			'podcasting_category_1'  => (string) get_option( 'podcasting_category_1', '' ),
			'podcasting_category_2'  => (string) get_option( 'podcasting_category_2', '' ),
			'podcasting_category_3'  => (string) get_option( 'podcasting_category_3', '' ),
			'podcasting_email'       => (string) get_option( 'podcasting_email', '' ),
			'podcasting_show_urls'   => array_merge( $empty_map, array_intersect_key( $show_urls, $empty_map ) ),
			'podcasting_show_states' => array_merge( $empty_map, array_intersect_key( $show_states, $empty_map ) ),
		);
	}

	/**
	 * REST argument schema for the update route. Top-level type coercion only —
	 * detailed validation (host allowlist, state enum, explicit normalization)
	 * runs in each registered `sanitize_callback` when {@see update_option()}
	 * fires `sanitize_option_{$name}`. Going stricter at the schema layer would
	 * fail the whole request when one field is bad; the SPA depends on the
	 * silent-drop semantics the sanitizers provide.
	 *
	 * @return array<string, array<string, mixed>>
	 */
	private static function update_args() {
		return array(
			'podcasting_category_id' => array( 'type' => 'integer' ),
			'podcasting_title'       => array( 'type' => 'string' ),
			'podcasting_talent_name' => array( 'type' => 'string' ),
			'podcasting_summary'     => array( 'type' => 'string' ),
			'podcasting_copyright'   => array( 'type' => 'string' ),
			'podcasting_explicit'    => array( 'type' => array( 'boolean', 'string' ) ),
			'podcasting_image'       => array( 'type' => 'string' ),
			'podcasting_image_id'    => array( 'type' => 'integer' ),
			'podcasting_category_1'  => array( 'type' => 'string' ),
			'podcasting_category_2'  => array( 'type' => 'string' ),
			'podcasting_category_3'  => array( 'type' => 'string' ),
			'podcasting_email'       => array( 'type' => 'string' ),
			'podcasting_show_urls'   => array( 'type' => 'object' ),
			'podcasting_show_states' => array( 'type' => 'object' ),
		);
	}

	/**
	 * Public item schema for `/wpcom/v2/podcast/settings`. Same field set as
	 * {@see self::update_args()} with `readonly` defaults — keeps the OPTIONS
	 * response useful for clients that introspect.
	 *
	 * @return array<string, mixed>
	 */
	public function get_item_schema() {
		if ( $this->schema ) {
			return $this->add_additional_fields_schema( $this->schema );
		}

		$properties   = self::update_args();
		$this->schema = array(
			'$schema'    => 'http://json-schema.org/draft-04/schema#',
			'title'      => 'podcast-settings',
			'type'       => 'object',
			'properties' => $properties,
		);

		return $this->add_additional_fields_schema( $this->schema );
	}
}
