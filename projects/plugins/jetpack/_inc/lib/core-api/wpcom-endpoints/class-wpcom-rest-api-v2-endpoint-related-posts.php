<?php
/**
 * REST API endpoint for Related Posts
 *
 * @package automattic/jetpack
 * @since 12.6
 */

/**
 * Class WPCOM_REST_API_V2_Endpoint_Related_Posts
 */
class WPCOM_REST_API_V2_Endpoint_Related_Posts extends WP_REST_Controller {
	/**
	 * Constructor.
	 */
	public function __construct() {
		$this->base_api_path = 'wpcom';
		$this->version       = 'v2';
		$this->namespace     = $this->base_api_path . '/' . $this->version;
		$this->rest_base     = '/related-posts';

		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	/**
	 * Register routes.
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			$this->rest_base,
			array(
				'show_in_index'       => true,
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_options' ),
				'permission_callback' => function () {
					return current_user_can( 'manage_options' );
				},
			)
		);

		register_rest_route(
			$this->namespace,
			$this->rest_base . '/enable',
			array(
				'show_in_index'       => true,
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'enable_rp' ),
				'permission_callback' => function () {
					return current_user_can( 'manage_options' );
				},
			)
		);
	}

	/**
	 * Gets the site's Related Posts Options.
	 *
	 * @return WP_REST_Response Array of information about the site's Related Posts options.
	 * - enabled: Whether Related Posts is enabled.
	 * - options: Array of options for Related Posts.
	 */
	public function get_options() {
		$options = Jetpack_Options::get_option( 'relatedposts', array() );
		$enabled = isset( $options['enabled'] ) ? (bool) $options['enabled'] : false;

		return rest_ensure_response(
			array(
				'enabled' => $enabled,
				'options' => $options,
			)
		);
	}

	/**
	 * Enables the site's Related Posts.
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 *
	 * @return WP_REST_Response Array confirming the new status.
	 */
	public function enable_rp( $request ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		$old_relatedposts_options                = Jetpack_Options::get_option( 'relatedposts', array() );
		$relatedposts_options_to_save            = $old_relatedposts_options;
		$relatedposts_options_to_save['enabled'] = true;

		// Enable Related Posts.
		$enable = Jetpack_Options::update_option( 'relatedposts', $relatedposts_options_to_save );

		return rest_ensure_response(
			array(
				'enabled' => (bool) $enable,
			)
		);
	}
}

wpcom_rest_api_v2_load_plugin( 'WPCOM_REST_API_V2_Endpoint_Related_Posts' );
