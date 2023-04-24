<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Retrieve Mapkit access token
 *
 * @package automattic/jetpack
 */

/**
 * Mapkit: retrieve access token
 *
 * Returns string
 *
 * @since 12.1
 */
class WPCOM_REST_API_V2_Endpoint_Mapkit_Token extends WP_REST_Controller {
	/**
	 * Constructor.
	 */
	public function __construct() {
		$this->namespace                       = 'wpcom/v2';
		$this->rest_base                       = 'mapkit-token';
		$this->wpcom_is_wpcom_only_endpoint    = true;
		$this->wpcom_is_site_specific_endpoint = false;

		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	/**
	 * Register endpoint routes.
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			$this->rest_base,
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_mapkit_access_token' ),
					'permission_callback' => '__return_true',
				),
			)
		);
	}

	/**
	 * Get Mapkit key
	 *
	 *     @type string $slug Plugin slug with the syntax 'plugin-directory/plugin-main-file.php'.
	 * }
	 */
	public static function get_mapkit_access_token() {
		if ( ! class_exists( 'Jetpack_Mapkit_Helper' ) ) {
			require_once JETPACK__PLUGIN_DIR . '_inc/lib/class-jetpack-mapkit-helper.php';
		}
		return rest_ensure_response( array( 'wpcom_mapkit_access_token' => Jetpack_Mapkit_Helper::get_access_token() ) );
	}
}
wpcom_rest_api_v2_load_plugin( 'WPCOM_REST_API_V2_Endpoint_Mapkit_Token' );
