<?php
/**
 * Endpoint to manage plugin and theme update schedules.
 *
 * Example: https://public-api.wordpress.com/wpcom/v2/update-schedules
 *
 * @package automattic/scheduled-updates
 */

/**
 * Class WPCOM_REST_API_V2_Endpoint_Update_Schedules
 */
class WPCOM_REST_API_V2_Endpoint_Update_Schedules extends WP_REST_Controller {
	/**
	 * The namespace of this controller's route.
	 *
	 * @var string
	 */
	public $namespace = 'wpcom/v2';

	/**
	 * The base of this controller's route.
	 *
	 * @var string
	 */
	public $rest_base = 'update-schedules';

	/**
	 * WPCOM_REST_API_V2_Endpoint_Atomic_Hosting_Update_Schedule constructor.
	 */
	public function __construct() {
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
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_items' ),
					'permission_callback' => array( $this, 'get_items_permissions_check' ),
				),
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'create_item' ),
					'permission_callback' => array( $this, 'create_item_permissions_check' ),
					'args'                => $this->get_object_params(),
				),
				'schema' => array( $this, 'get_public_item_schema' ),
			)
		);

		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<schedule_id>[\w]+)/',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_item' ),
					'permission_callback' => array( $this, 'get_item_permissions_check' ),
					'args'                => array(
						'schedule_id' => array(
							'description' => 'ID of the schedule.',
							'type'        => 'string',
							'required'    => true,
						),
					),
				),
				array(
					'methods'             => WP_REST_Server::EDITABLE,
					'callback'            => array( $this, 'update_item' ),
					'permission_callback' => array( $this, 'update_item_permissions_check' ),
					'args'                => array_merge(
						array(
							'schedule_id' => array(
								'description' => 'ID of the schedule.',
								'type'        => 'string',
								'required'    => true,
							),
						),
						$this->get_object_params()
					),
				),
				array(
					'methods'             => WP_REST_Server::DELETABLE,
					'callback'            => array( $this, 'delete_item' ),
					'permission_callback' => array( $this, 'delete_item_permissions_check' ),
				),
				'schema' => array( $this, 'get_public_item_schema' ),
			)
		);
	}

	/**
	 * Permission check for retrieving schedules.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return bool
	 */
	public function get_items_permissions_check( $request ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		return current_user_can( 'update_plugins' );
	}

	/**
	 * Returns a list of update schedules.
	 *
	 * Checks the jetpack_update_schedules option for saved schedule ids and retries scheduled events with the `jetpack_scheduled_update` hook.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response
	 */
	public function get_items( $request ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		$schedules = get_option( 'jetpack_update_schedules', array() );
		$events    = array();

		foreach ( $schedules as $schedule_args ) {
			$events[] = wp_get_scheduled_event( 'jetpack_scheduled_update', $schedule_args );
		}

		return rest_ensure_response( $events );
	}

	/**
	 * Permission check for creating a new schedule.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return bool|WP_Error
	 */
	public function create_item_permissions_check( $request ) {
		// phpcs:ignore Generic.CodeAnalysis.EmptyStatement.DetectedIf
		if ( ! ( method_exists( 'Automattic\Jetpack\Current_Plan', 'supports' ) && Automattic\Jetpack\Current_Plan::supports( 'scheduled-updates', true ) ) ) {
			// phpcs:ignore
			// return new WP_Error( 'rest_forbidden', __( 'Sorry, you are not allowed to access this endpoint.', 'jetpack-scheduled-updates' ), array( 'status' => 403 ) );
		}

		$schedules = get_option( 'jetpack_update_schedules', array() );
		if ( count( $schedules ) >= 2 ) {
			return new WP_Error( 'rest_forbidden', __( 'Sorry, you can not create more than two schedules at this time.', 'jetpack-scheduled-updates' ), array( 'status' => 403 ) );
		}

		foreach ( $schedules as $schedule_args ) {
			$event = wp_get_scheduled_event( 'jetpack_scheduled_update', $schedule_args );

			if ( $request['schedule']['timestamp'] === $event->timestamp ) {
				return new WP_Error( 'rest_forbidden', __( 'Sorry, you can not create a schedule with the same time as an existing schedule.', 'jetpack-scheduled-updates' ), array( 'status' => 403 ) );
			}

			if ( $this->generate_schedule_id( $schedule_args ) === $this->generate_schedule_id( $request['plugins'] ) ) {
				return new WP_Error( 'rest_forbidden', __( 'Sorry, you can not create a schedule with the same plugins as an existing schedule.', 'jetpack-scheduled-updates' ), array( 'status' => 403 ) );
			}
		}

		if ( ! empty( $request['themes'] ) ) {
			return new WP_Error( 'rest_forbidden', __( 'Sorry, you can not schedule theme updates at this time.', 'jetpack-scheduled-updates' ), array( 'status' => 403 ) );
		}

		return current_user_can( 'update_plugins' );
	}

	/**
	 * Creates a new update schedule.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response|WP_Error
	 */
	public function create_item( $request ) {
		$schedule = $request['schedule'];
		$plugins  = $request['plugins'];

		$event = wp_schedule_event( $schedule['timestamp'], $schedule['interval'], 'jetpack_scheduled_update', $plugins, true );
		if ( is_wp_error( $event ) ) {
			return $event;
		}

		$schedules   = get_option( 'jetpack_update_schedules', array() );
		$schedules[] = $plugins;
		update_option( 'jetpack_update_schedules', $schedules );

		return rest_ensure_response( $this->generate_schedule_id( $plugins ) );
	}

	/**
	 * Permission check for retrieving a specific schedule.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return bool
	 */
	public function get_item_permissions_check( $request ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		return current_user_can( 'update_plugins' );
	}

	/**
	 * Returns information about an update schedule.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response
	 */
	public function get_item( $request ) {
		$schedules = get_option( 'jetpack_update_schedules', array() );
		$event     = array();

		foreach ( $schedules as $schedule_args ) {
			if ( $this->generate_schedule_id( $schedule_args ) === $request['schedule_id'] ) {
				$event = wp_get_scheduled_event( 'jetpack_scheduled_update', $schedule_args );
				break;
			}
		}

		return rest_ensure_response( $event );
	}

	/**
	 * Permission check for updating a specific schedule.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return bool|WP_Error
	 */
	public function update_item_permissions_check( $request ) {
		// phpcs:ignore Generic.CodeAnalysis.EmptyStatement.DetectedIf
		if ( ! ( method_exists( 'Automattic\Jetpack\Current_Plan', 'supports' ) && Automattic\Jetpack\Current_Plan::supports( 'scheduled-updates', true ) ) ) {
			// phpcs:ignore
			// return new WP_Error( 'rest_forbidden', __( 'Sorry, you are not allowed to access this endpoint.', 'jetpack-scheduled-updates' ), array( 'status' => 403 ) );
		}

		$schedules = get_option( 'jetpack_update_schedules', array() );
		foreach ( $schedules as $schedule_args ) {
			$event = wp_get_scheduled_event( 'jetpack_scheduled_update', $schedule_args );

			if ( $this->generate_schedule_id( $schedule_args ) === $request['schedule_id'] ) {
				continue;
			}

			if ( $request['schedule']['timestamp'] === $event->timestamp ) {
				return new WP_Error( 'rest_forbidden', __( 'Sorry, you can not create a schedule with the same time as an existing schedule.', 'jetpack-scheduled-updates' ), array( 'status' => 403 ) );
			}

			if ( $this->generate_schedule_id( $schedule_args ) === $this->generate_schedule_id( $request['plugins'] ) ) {
				return new WP_Error( 'rest_forbidden', __( 'Sorry, you can not create a schedule with the same plugins as an existing schedule.', 'jetpack-scheduled-updates' ), array( 'status' => 403 ) );
			}
		}

		if ( ! empty( $request['themes'] ) ) {
			return new WP_Error( 'rest_forbidden', __( 'Sorry, you can not schedule theme updates at this time.', 'jetpack-scheduled-updates' ), array( 'status' => 403 ) );
		}

		return current_user_can( 'update_plugins' );
	}

	/**
	 * Updates an existing update schedule.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response|WP_Error
	 */
	public function update_item( $request ) {
		$schedules = get_option( 'jetpack_update_schedules', array() );
		$found     = array();

		foreach ( $schedules as $key => $schedule_args ) {
			if ( $this->generate_schedule_id( $schedule_args ) === $request['schedule_id'] ) {
				// We found the schedule to update.
				$found = true;

				$event  = wp_get_scheduled_event( 'jetpack_scheduled_update', $schedule_args );
				$result = wp_unschedule_event( $event->timestamp, 'jetpack_scheduled_update', $schedule_args, true );
				if ( is_wp_error( $result ) ) {
					return $result;
				}

				// Remove the old schedule.
				unset( $schedules[ $key ] );
				update_option( 'jetpack_update_schedules', $schedules );

				break;
			}
		}

		if ( ! $found ) {
			return new WP_Error( 'rest_invalid_schedule', __( 'The schedule could not be found.', 'jetpack-scheduled-updates' ), array( 'status' => 400 ) );
		}

		return $this->create_item( $request );
	}

	/**
	 * Permission check for deleting a specific schedule.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return bool
	 */
	public function delete_item_permissions_check( $request ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		return current_user_can( 'update_plugins' );
	}

	/**
	 * Deletes an existing update schedule.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response|WP_Error
	 */
	public function delete_item( $request ) {
		$schedules = get_option( 'jetpack_update_schedules', array() );
		$found     = array();

		foreach ( $schedules as $key => $schedule_args ) {
			if ( $this->generate_schedule_id( $schedule_args ) === $request['schedule_id'] ) {
				// We found the schedule to delete.
				$found = true;

				$event  = wp_get_scheduled_event( 'jetpack_scheduled_update', $schedule_args );
				$result = wp_unschedule_event( $event->timestamp, 'jetpack_scheduled_update', $schedule_args, true );
				if ( is_wp_error( $result ) ) {
					return $result;
				}

				// Remove the old schedule.
				unset( $schedules[ $key ] );
				break;
			}
		}

		if ( ! $found ) {
			return new WP_Error( 'rest_invalid_schedule', __( 'The schedule could not be found.', 'jetpack-scheduled-updates' ), array( 'status' => 400 ) );
		}

		update_option( 'jetpack_update_schedules', $schedules );

		return rest_ensure_response( true );
	}

	/**
	 * Retrieves the update schedule's schema, conforming to JSON Schema.
	 *
	 * @return array Item schema data.
	 */
	public function get_item_schema() {
		if ( $this->schema ) {
			return $this->add_additional_fields_schema( $this->schema );
		}

		$schema = array(
			'$schema'    => 'http://json-schema.org/draft-04/schema#',
			'title'      => 'update-schedule',
			'type'       => 'object',
			'properties' => array(
				'hook'      => array(
					'description' => 'The hook name.',
					'type'        => 'string',
					'readonly'    => true,
				),
				'timestamp' => array(
					'description' => 'Unix timestamp (UTC) for when to next run the event.',
					'type'        => 'integer',
					'readonly'    => true,
				),
				'schedule'  => array(
					'description' => 'How often the event should subsequently recur.',
					'type'        => 'string',
					'enum'        => array( 'daily', 'weekly' ),
				),
				'args'      => array(
					'description' => 'The plugins to be updated on this schedule.',
					'type'        => 'array',
				),
				'interval'  => array(
					'description' => 'The interval time in seconds for the schedule.',
					'type'        => 'integer',
				),
			),
		);

		$this->schema = $schema;

		return $this->add_additional_fields_schema( $this->schema );
	}

	/**
	 * Retrieves the query params for scheduled updates.
	 *
	 * @return array[] Array of query parameters.
	 */
	public function get_object_params() {
		return array(
			'plugins'  => array(
				'description' => 'List of plugin slugs to update.',
				'type'        => 'array',
				'required'    => false,
			),
			'themes'   => array(
				'description' => 'List of theme slugs to update.',
				'type'        => 'array',
				'required'    => false,
			),
			'schedule' => array(
				'description' => 'Update schedule.',
				'type'        => 'object',
				'required'    => true,
				'properties'  => array(
					'interval'  => array(
						'description' => 'Interval for the schedule.',
						'type'        => 'string',
						'enum'        => array( 'daily', 'weekly' ),
						'required'    => true,
					),
					'timestamp' => array(
						'description' => 'Unix timestamp (UTC) for when to first run the schedule.',
						'type'        => 'integer',
						'required'    => true,
					),
				),
			),
		);
	}

	/**
	 * Generates a unique schedule ID.
	 *
	 * @see wp_schedule_event()
	 *
	 * @param array $args Schedule arguments.
	 * @return string
	 */
	private function generate_schedule_id( $args ) {
		return md5( serialize( $args ) ); // phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.serialize_serialize
	}
}

wpcom_rest_api_v2_load_plugin( 'WPCOM_REST_API_V2_Endpoint_Update_Schedules' );
