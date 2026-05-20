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
 * Dedicated REST surface for the 14 `podcasting_*` options the wp-admin SPA
 * reads and writes. Decouples the SPA from `/wp/v2/settings` (which is shape-
 * guarded in wpcom and bloated by these keys). Storage stays as `wp_options`;
 * each `register_setting()` sanitizer fires on write because {@see update_option()}
 * runs the `sanitize_option_{$name}` filter.
 */
class Settings_Endpoint extends WP_REST_Controller {

	const REST_NAMESPACE = 'wpcom/v2';
	const REST_BASE      = 'podcast/settings';

	/**
	 * Init guard.
	 *
	 * @var bool
	 */
	private static $initialized = false;

	/**
	 * Wire the route registration. Idempotent.
	 */
	public static function init() {
		if ( self::$initialized ) {
			return;
		}
		self::$initialized = true;

		add_action( 'rest_api_init', array( new self(), 'register_routes' ) );
	}

	/**
	 * Register GET (full record) and POST/PUT/PATCH (partial update) routes.
	 *
	 * The update `args` schema is intentionally top-level type coercion only —
	 * the registered `sanitize_callback`s do the real validation when
	 * {@see update_option()} fires `sanitize_option_{$name}`. Strict schema
	 * validation here would 400 a whole patch on one bad field; the SPA depends
	 * on silent-drop semantics.
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
					'args'                => array(
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
					),
				),
			)
		);
	}

	/**
	 * Site admins only — same gate as the wp-admin Podcast page.
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
	 * Full settings record.
	 *
	 * @param WP_REST_Request $request Unused.
	 * @return WP_REST_Response
	 */
	public function get_item( $request ) {
		unset( $request );
		return rest_ensure_response( $this->collect_settings() );
	}

	/**
	 * Partial update. Returns the full merged record.
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
	 * Assemble the response body from stored option values.
	 *
	 * @return array<string, mixed>
	 */
	private function collect_settings() {
		$empty_map   = array_fill_keys( array_keys( Settings::SHOW_URL_HOSTS ), '' );
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
}
