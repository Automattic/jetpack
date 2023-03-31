<?php
/**
 * Launchpad API endpoint
 *
 * @package automattic/jetpack-mu-wpcom
 * @since 1.1.0
 */

/**
 * Fetches Launchpad-related data for the site
 *
 * @since 1.1.0
 */
class WPCOM_REST_API_V2_Endpoint_Launchpad extends WP_REST_Controller {

	/**
	 * Class constructor
	 */
	public function __construct() {
		$this->namespace = 'wpcom/v2';
		$this->rest_base = 'launchpad';

		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	/**
	 * Register our routes.
	 *
	 * @return void
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			$this->rest_base,
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_data' ),
					'permission_callback' => array( $this, 'can_access' ),
				),
				array(
					'methods'             => WP_REST_Server::EDITABLE,
					'callback'            => array( $this, 'update_site_options' ),
					'permission_callback' => array( $this, 'can_access' ),
					'request_format'      => array(
						'checklist_statuses' => '(array) Array of launchpad checklist tasks completion status',
					),
				),
			)
		);
	}

	/**
	 * Permission callback for the REST route
	 *
	 * @return boolean
	 */
	public function can_access() {
		return current_user_can( 'manage_options' );
	}

	/**
	 * Returns Launchpad-related options
	 *
	 * @return array Associative array with `site_intent`, `launchpad_screen`,
	 *               and `launchpad_checklist_tasks_statuses` as `checklist`.
	 */
	public function get_data() {
		return array(
			'site_intent'        => get_option( 'site_intent' ),
			'launchpad_screen'   => get_option( 'launchpad_screen' ),
			'checklist_statuses' => get_option( 'launchpad_checklist_tasks_statuses', array() ),
		);
	}

	/**
	 * Updates Launchpad-related options and returns the result
	 *
	 * @param array $request The unsanitized request values.
	 *
	 * @return array Associative array with updated site options
	 */
	public function update_site_options( $request ) {
		$updated = array();
		$input   = $request->get_json_params();

		foreach ( $input as $key => $value ) {
			if ( ! is_array( $value ) ) {
				$value = trim( $value );
			}

			switch ( $key ) {
				case 'checklist_statuses':
					$launchpad_checklist_tasks_statuses_option = get_option( 'launchpad_checklist_tasks_statuses' );

					$filtered_input_array = array_filter(
						(array) $value,
						function ( $array_value ) {
							return is_bool( $array_value );
						}
					);

					if ( ! is_array( $launchpad_checklist_tasks_statuses_option ) ) {
						$launchpad_checklist_tasks_statuses_option = array();
					}
					$launchpad_checklist_tasks_statuses_option = array_merge( $launchpad_checklist_tasks_statuses_option, $filtered_input_array );

					if ( update_option( 'launchpad_checklist_tasks_statuses', $launchpad_checklist_tasks_statuses_option ) ) {
						$updated[ $key ] = $filtered_input_array;
					}
					break;
				default:
					break;
			}

			return array(
				'updated' => $updated,
			);
		}
	}

}

wpcom_rest_api_v2_load_plugin( 'WPCOM_REST_API_V2_Endpoint_Launchpad' );
