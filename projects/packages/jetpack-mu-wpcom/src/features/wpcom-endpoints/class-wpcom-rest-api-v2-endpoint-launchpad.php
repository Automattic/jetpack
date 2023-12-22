<?php
/**
 * Launchpad API endpoint
 *
 * @package automattic/jetpack-mu-wpcom
 * @since 1.1.0
 */

/**
 * Fetches Launchpad-related data for the site.
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
					'args'                => array(
						'checklist_slug'    => array(
							'description' => 'Checklist slug',
							'type'        => 'string',
							'enum'        => $this->get_checklist_slug_enums(),
						),
						'launchpad_context' => array(
							'description' => 'Screen where Launchpand instance is loaded.',
							'type'        => 'string',
						),
					),
				),
				array(
					'methods'             => WP_REST_Server::EDITABLE,
					'callback'            => array( $this, 'update_site_options' ),
					'permission_callback' => array( $this, 'can_access' ),
					'args'                => array(
						'checklist_statuses'        => array(
							'description'          => 'Launchpad statuses',
							'type'                 => 'object',
							'properties'           => $this->get_checklist_statuses_properties(),
							'additionalProperties' => false,
						),
						'launchpad_screen'          => array(
							'description' => 'Launchpad screen',
							'type'        => 'string',
							'enum'        => array( 'off', 'minimized', 'full', 'skipped' ),
						),
						'is_checklist_dismissed'    => array(
							'description'          => 'Marks a checklist as dismissed by the user',
							'type'                 => 'object',
							'properties'           => array(
								'slug'         => array(
									'description' => 'Checklist slug',
									'type'        => 'string',
									'enum'        => $this->get_checklist_slug_enums(),
								),
								'is_dismissed' => array(
									'type' => 'boolean',
								),
							),
							'additionalProperties' => false,
						),
						'hide_fse_next_steps_modal' => array(
							'description' => 'Controls whether we show or hide the next steps modal in the full site editor',
							'type'        => 'boolean',
						),
					),
				),
			)
		);
	}

	/**
	 * Returns all available checklist slugs.
	 *
	 * @return array Array of checklist slugs.
	 */
	public function get_checklist_slug_enums() {
		$checklists = wpcom_launchpad_checklists()->get_all_task_lists();
		return array_keys( $checklists );
	}

	/**
	 * Returns all registered checklist statuses.
	 *
	 * @return array Associative array of checklist status properties for the REST API.
	 */
	public function get_checklist_statuses_properties() {
		$tasks            = wpcom_launchpad_checklists()->get_all_tasks();
		$allowed_task_ids = array();
		foreach ( $tasks as $task ) {
			$allowed_task_ids[] = $task['id'];
			if ( isset( $task['id_map'] ) ) {
				$allowed_task_ids[] = $task['id_map'];
			}
		}
		$allowed_task_ids = array_unique( $allowed_task_ids );
		$properties       = array();
		foreach ( $allowed_task_ids as $task_id ) {
			$properties[ $task_id ] = array(
				'type' => 'boolean',
			);
		}
		return $properties;
	}

	/**
	 * Permission callback for the REST route.
	 *
	 * @return boolean
	 */
	public function can_access() {
		return current_user_can( 'manage_options' );
	}

	/**
	 * Returns Launchpad-related options.
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 *
	 * @return array Associative array with `site_intent`, `launchpad_screen`,
	 *               `launchpad_checklist_tasks_statuses` as `checklist_statuses`,
	 *               and `checklist`.
	 */
	public function get_data( $request ) {
		$checklist_slug = isset( $request['checklist_slug'] ) ? $request['checklist_slug'] : get_option( 'site_intent' );

		$launchpad_context = isset( $request['launchpad_context'] )
			? $request['launchpad_context']
			: null;

		return array(
			'site_intent'        => get_option( 'site_intent' ),
			'launchpad_screen'   => get_option( 'launchpad_screen' ),
			'checklist_statuses' => get_option( 'launchpad_checklist_tasks_statuses', array() ),
			'checklist'          => wpcom_get_launchpad_checklist_by_checklist_slug( $checklist_slug, $launchpad_context ),
			'is_enabled'         => wpcom_get_launchpad_task_list_is_enabled( $checklist_slug ),
			'is_dismissed'       => wpcom_launchpad_is_task_list_dismissed( $checklist_slug ),
			'title'              => wpcom_get_launchpad_checklist_title_by_checklist_slug( $checklist_slug ),
		);
	}

	/**
	 * Updates Launchpad-related options and returns the result
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return array Associative array with updated site options.
	 */
	public function update_site_options( $request ) {
		$updated = array();
		$input   = $request->get_json_params();

		foreach ( $input as $key => $value ) {
			switch ( $key ) {
				case 'checklist_statuses':
					$updated[ $key ] = wpcom_launchpad_update_task_status( $value );

					// This will check if we have completed all the tasks and disable Launchpad if so.
					wpcom_launchpad_checklists()->maybe_disable_fullscreen_launchpad();
					break;

				case 'is_checklist_dismissed':
					$checklist_slug = $value['slug'];
					$is_dismissed   = $value['is_dismissed'];

					wpcom_launchpad_set_task_list_dismissed( $checklist_slug, $is_dismissed );
					break;

				case 'hide_fse_next_steps_modal':
					$value = (bool) $value;
					if ( wpcom_launchpad_set_fse_next_steps_modal_hidden( $value ) ) {
						$updated[ $key ] = $value;
					}
					break;

				default:
					if ( update_option( $key, $value ) ) {
						$updated[ $key ] = $value;
					}
					break;
			}
		}

		return array(
			'updated' => $updated,
		);
	}
}

wpcom_rest_api_v2_load_plugin( 'WPCOM_REST_API_V2_Endpoint_Launchpad' );
