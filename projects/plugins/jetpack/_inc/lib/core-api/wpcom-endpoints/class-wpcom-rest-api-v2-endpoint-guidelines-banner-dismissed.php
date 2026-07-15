<?php
/**
 * REST API endpoint for the Content Guidelines AI empty-state banner.
 *
 * Stores a per-user flag (so it persists across the user's devices/browsers)
 * for whether the banner has been dismissed, instead of relying on per-browser
 * localStorage. Modeled on the wpcom block-editor "recommended tags modal
 * dismissed" flow, but scoped to the user via user meta.
 *
 * @package automattic/jetpack
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

// Load before the class definition, not in the constructor: META_KEY below
// delegates to a Jetpack_AI_Helper constant, and PHP resolves class constant
// expressions at first instantiation, before the constructor body runs.
if ( ! class_exists( 'Jetpack_AI_Helper' ) ) {
	require_once JETPACK__PLUGIN_DIR . '_inc/lib/class-jetpack-ai-helper.php';
}

/**
 * Class WPCOM_REST_API_V2_Endpoint_Guidelines_Banner_Dismissed
 *
 * @since 16.0
 */
class WPCOM_REST_API_V2_Endpoint_Guidelines_Banner_Dismissed extends WP_REST_Controller {
	/**
	 * User meta key storing the dismissed flag.
	 *
	 * The canonical key lives on Jetpack_AI_Helper (required at the top of
	 * this file) because this class is not loaded during admin page loads on
	 * Simple sites, while the admin-page preload in
	 * _inc/content-guidelines-ai.php needs the key there.
	 *
	 * @var string
	 */
	const META_KEY = Jetpack_AI_Helper::GUIDELINES_BANNER_DISMISSED_META_KEY;

	/**
	 * Namespace prefix.
	 *
	 * @var string
	 */
	public $namespace = 'wpcom/v2';

	/**
	 * Endpoint base route.
	 *
	 * @var string
	 */
	public $rest_base = 'jetpack-ai/guidelines-banner-dismissed';

	/**
	 * Constructor.
	 */
	public function __construct() {
		$this->is_wpcom                     = true;
		$this->wpcom_is_wpcom_only_endpoint = true;

		// Match the suggest-guidelines endpoint: register on Simple/Atomic only.
		if ( ! \Jetpack_AI_Helper::is_enabled() ) {
			return;
		}

		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	/**
	 * Register routes.
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base,
			array(
				array(
					'methods'             => WP_REST_Server::EDITABLE,
					'callback'            => array( $this, 'set_dismissed' ),
					'permission_callback' => array( $this, 'permission_callback' ),
				),
			)
		);
	}

	/**
	 * Permission check.
	 *
	 * Gated to the same capability as the Content Guidelines page (and the
	 * suggest-guidelines endpoint): only admins ever see the banner, so only
	 * they need to dismiss it.
	 *
	 * @return bool
	 */
	public function permission_callback() {
		return current_user_can( 'manage_options' );
	}

	/**
	 * Whether the current user has dismissed the banner.
	 *
	 * Back-compat alias: the admin-page preload reads the flag via
	 * Jetpack_AI_Helper::is_guidelines_banner_dismissed() instead, because
	 * this class is not loaded during admin page loads on Simple sites.
	 *
	 * @return bool
	 */
	public static function is_dismissed() {
		return Jetpack_AI_Helper::is_guidelines_banner_dismissed();
	}

	/**
	 * Mark the banner as dismissed for the current user.
	 *
	 * Dismissal is one-way — the banner has no "show again" control — so this
	 * only ever sets the flag.
	 *
	 * @return WP_REST_Response
	 */
	public function set_dismissed() {
		update_user_meta( get_current_user_id(), self::META_KEY, '1' );

		// Just set above — return it directly instead of re-reading the meta.
		return rest_ensure_response( array( 'dismissed' => true ) );
	}
}

wpcom_rest_api_v2_load_plugin( 'WPCOM_REST_API_V2_Endpoint_Guidelines_Banner_Dismissed' );
