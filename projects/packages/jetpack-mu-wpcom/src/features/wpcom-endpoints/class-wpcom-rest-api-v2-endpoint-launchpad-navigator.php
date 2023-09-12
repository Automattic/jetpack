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
class WPCOM_REST_API_V2_Endpoint_Launchpad_Navigator extends WP_REST_Controller {

	/**
	 * Class constructor
	 */
	public function __construct() {
		$this->namespace = 'wpcom/v2';
		$this->rest_base = 'launchpad/navigator';

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
					'callback'            => array( $this, 'get_navigator_data' ),
					'permission_callback' => array( $this, 'can_access' ),
				),
			)
		);
	}

	/**
	 * Returns a list of available checklists and the currently active checklist.
	 *
	 * @return array Array with two keys: `checklists` and `active_checklist`.
	 */
	public function get_navigator_data() {
		$raw_checklists = wpcom_launchpad_checklists()->get_all_task_lists();
		$checklists     = array();
		foreach ( $raw_checklists as $slug => $checklist ) {
			$checklists[] = array(
				'slug'  => $slug,
				'title' => $checklist['title'],
			);
		}

		return array(
			'available_checklists' => $checklists,
			'current_checklist'    => wpcom_launchpad_get_active_checklist(),
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
