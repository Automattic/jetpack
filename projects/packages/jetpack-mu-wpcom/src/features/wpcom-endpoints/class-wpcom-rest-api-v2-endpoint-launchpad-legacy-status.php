<?php
/**
 * Launchpad API endpoint
 *
 * @package automattic/jetpack-mu-wpcom
 * @since 4.9.0
 */

/**
 * Fetches Launchpad Navigator-related data for the site.
 *
 * @since 4.9.0
 */
class WPCOM_REST_API_V2_Endpoint_Launchpad_Legacy_Status extends WP_REST_Controller {

	/**
	 * Class constructor
	 */
	public function __construct() {
		$this->namespace = 'wpcom/v2';
		$this->rest_base = 'launchpad/legacy-site-setup-tasks-status';

		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	/**
	 * Register our routes.
	 */
	public function register_routes() {
		// Register rest route for getting a list of available checklists and the currently active checklist.
		register_rest_route(
			$this->namespace,
			$this->rest_base,
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_legacy_site_setup_tasks_status' ),
					'permission_callback' => array( $this, 'can_access' ),
				),
			)
		);
	}

	/**
	 * TODO
	 */
	public function get_legacy_site_setup_tasks_status() {
		return array(
			'tasks_status' => wpcom_get_launchpad_legacy_site_setup_tasks_status(),
		);
	}

	/**
	 * Permission callback for the REST route.
	 *
	 * @return boolean
	 */
	public function can_access() {
		return current_user_can( 'manage_options' );
	}
}

wpcom_rest_api_v2_load_plugin( 'WPCOM_REST_API_V2_Endpoint_Launchpad_Navigator' );
