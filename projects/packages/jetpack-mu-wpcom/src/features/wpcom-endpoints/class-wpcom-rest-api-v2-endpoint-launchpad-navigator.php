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
				array(
					'methods'             => WP_REST_Server::EDITABLE,
					'callback'            => array( $this, 'update_navigator_options' ),
					'permission_callback' => array( $this, 'can_access' ),
					'args'                => array(
						'active_checklist_slug' => array(
							'description'       => 'The slug of the checklist to set as active.',
							'type'              => array( 'null', 'string' ),
							'validate_callback' => array( $this, 'validate_checklist_slug_param' ),
						),
						'remove_checklist_slug' => array(
							'description' => 'The slug of the checklist to remove from the active list.',
							'type'        => 'string',
							'enum'        => $this->get_checklist_slug_enums(),
						),
					),
				),
			)
		);
	}

	/**
	 * Validates that the argument sent to the active_checklist_slug parameter is a valid checklist slug or empty.
	 *
	 * @param string $value The value of the active_checklist_slug parameter.
	 * @return bool
	 */
	public function validate_checklist_slug_param( $value ) {
		if ( $value === null ) {
			return true;
		}

		return is_string( $value ) && in_array( $value, $this->get_checklist_slug_enums(), true );
	}

	/**
	 * Returns all available checklist slugs.
	 * TODO: This function is used by both endpoints, we should move it somewhere common.
	 *
	 * @return array Array of checklist slugs.
	 */
	public function get_checklist_slug_enums() {
		$checklists = wpcom_launchpad_checklists()->get_all_task_lists();
		return array_keys( $checklists );
	}

	/**
	 * Updates Launchpad navigator-related options and returns the result
	 *
	 * @param WP_REST_Request $request Request object.
	 */
	public function update_navigator_options( $request ) {
		$updated               = array();
		$input                 = $request->get_json_params();
		$extra_response_params = array();

		foreach ( $input as $key => $value ) {
			switch ( $key ) {
				case 'active_checklist_slug':
					$updated[ $key ] = wpcom_launchpad_set_current_active_checklist( $input['active_checklist_slug'] );
					break;
				case 'remove_checklist_slug':
					$removal_result  = wpcom_launchpad_navigator_remove_checklist( $input['remove_checklist_slug'] );
					$updated[ $key ] = $removal_result['updated'];

					$extra_response_params['new_active_checklist'] = $removal_result['new_active_checklist'];
					break;
			}
		}

		return array_merge(
			array(
				'updated' => $updated,
			),
			$extra_response_params
		);
	}

	/**
	 * Returns a list of available checklists and the currently active checklist.
	 *
	 * @return array Array with two keys: `checklists` and `active_checklist`.
	 */
	public function get_navigator_data() {
		return array(
			'available_checklists' => wpcom_launchpad_navigator_get_checklists(),
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
