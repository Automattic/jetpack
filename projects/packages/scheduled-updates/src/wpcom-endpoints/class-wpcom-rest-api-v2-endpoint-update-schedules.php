<?php
/**
 * Endpoint to manage plugin and theme update schedules.
 *
 * Example: https://public-api.wordpress.com/wpcom/v2/update-schedules
 *
 * @package automattic/scheduled-updates
 */

use Automattic\Jetpack\Scheduled_Updates;
use Automattic\Jetpack\Scheduled_Updates_Health_Paths;
use Automattic\Jetpack\Scheduled_Updates_Logs;

/**
 * Class WPCOM_REST_API_V2_Endpoint_Update_Schedules
 */
class WPCOM_REST_API_V2_Endpoint_Update_Schedules extends WP_REST_Controller {
	/**
	 * The pattern for a plugin basename.
	 *
	 * @var string
	 */
	const PATTERN = '[^.\/]+(?:\/[^.\/]+)?';

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
			'/' . $this->rest_base . '/capabilities',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_capabilities' ),
					'permission_callback' => array( $this, 'get_capabilities_permissions_check' ),
				),
			)
		);

		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<schedule_id>[\w]+)/status',
			array(
				array(
					'methods'             => WP_REST_Server::EDITABLE,
					'callback'            => array( $this, 'update_status' ),
					'permission_callback' => array( $this, 'update_status_permissions_check' ),
					'args'                => array(
						'last_run_timestamp' => array(
							'description' => 'Unix timestamp (UTC) for when the last run occurred.',
							'type'        => 'integer',
							'required'    => true,
						),
						'last_run_status'    => array(
							'description' => 'Status of last run.',
							'type'        => 'string',
							'enum'        => array( 'success', 'failure-and-rollback', 'failure-and-rollback-fail' ),
							'required'    => true,
						),
					),
				),
			)
		);

		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<schedule_id>[\w]+)/logs',
			array(
				array(
					'methods'             => WP_REST_Server::EDITABLE,
					'callback'            => array( $this, 'add_log' ),
					'permission_callback' => array( $this, 'add_log_permissions_check' ),
					'args'                => array(
						'action'  => array(
							'description' => 'The action to be logged',
							'type'        => 'string',
							'required'    => true,
							'enum'        => array(
								Scheduled_Updates_Logs::PLUGIN_UPDATES_START,
								Scheduled_Updates_Logs::PLUGIN_UPDATES_SUCCESS,
								Scheduled_Updates_Logs::PLUGIN_UPDATES_FAILURE,
								Scheduled_Updates_Logs::PLUGIN_UPDATE_SUCCESS,
								Scheduled_Updates_Logs::PLUGIN_UPDATE_FAILURE,
								Scheduled_Updates_Logs::PLUGIN_SITE_HEALTH_CHECK_SUCCESS,
								Scheduled_Updates_Logs::PLUGIN_SITE_HEALTH_CHECK_FAILURE,
								Scheduled_Updates_Logs::PLUGIN_UPDATE_FAILURE_AND_ROLLBACK,
								Scheduled_Updates_Logs::PLUGIN_UPDATE_FAILURE_AND_ROLLBACK_FAIL,
							),
						),
						'message' => array(
							'description' => 'The message to be logged',
							'type'        => 'string',
							'required'    => false,
						),
						'context' => array(
							'description' => 'The context to be logged',
							'type'        => 'object',
							'required'    => false,
						),
					),
				),
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_logs' ),
					'permission_callback' => array( $this, 'get_logs_permissions_check' ),
				),
			)
		);

		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<schedule_id>[\w]+)',
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
	 * @return bool|WP_Error
	 */
	public function get_items_permissions_check( $request ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			return new WP_Error( 'rest_forbidden', __( 'Sorry, you are not allowed to access this endpoint.', 'jetpack-scheduled-updates' ), array( 'status' => 403 ) );
		}

		return current_user_can( 'update_plugins' );
	}

	/**
	 * Returns a list of update schedules.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function get_items( $request ) {
		$events   = wp_get_scheduled_events( Scheduled_Updates::PLUGIN_CRON_HOOK );
		$response = array();

		foreach ( $events as $schedule_id => $event ) {
			// Add the schedule_id to the object.
			$event->schedule_id = $schedule_id;

			// Run through the prepare_item_for_response method to add the last run status.
			$response[ $schedule_id ] = $this->prepare_response_for_collection(
				$this->prepare_item_for_response( $event, $request )
			);
		}

		return rest_ensure_response( $response );
	}

	/**
	 * Permission check for creating a new schedule.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return bool|WP_Error
	 */
	public function create_item_permissions_check( $request ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			return new WP_Error( 'rest_forbidden', __( 'Sorry, you are not allowed to access this endpoint.', 'jetpack-scheduled-updates' ), array( 'status' => 403 ) );
		}

		if ( ! ( method_exists( 'Automattic\Jetpack\Current_Plan', 'supports' ) && Automattic\Jetpack\Current_Plan::supports( 'scheduled-updates' ) ) ) {
			return new WP_Error( 'rest_forbidden', __( 'Sorry, you are not allowed to access this endpoint.', 'jetpack-scheduled-updates' ), array( 'status' => 403 ) );
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
		$result = $this->validate_schedule( $request );
		if ( is_wp_error( $result ) ) {
			return $result;
		}

		$schedule = $request['schedule'];
		$plugins  = $request['plugins'];
		usort( $plugins, 'strnatcasecmp' );

		$event = Scheduled_Updates::create_scheduled_update( $schedule['timestamp'], $schedule['interval'], $plugins );

		if ( is_wp_error( $event ) ) {
			return $event;
		}

		$id = Scheduled_Updates::generate_schedule_id( $plugins );
		Scheduled_Updates_Health_Paths::update( $id, $schedule['health_check_paths'] ?? array() );

		/**
		 * Fires when a scheduled update is created.
		 *
		 * @param string          $id      The ID of the schedule.
		 * @param object          $event   The event object.
		 * @param WP_REST_Request $request The request object.
		 */
		do_action( 'jetpack_scheduled_update_created', $id, $event, $request );

		return rest_ensure_response( $id );
	}

	/**
	 * Permission check for retrieving a specific schedule.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return bool|WP_Error
	 */
	public function get_item_permissions_check( $request ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			return new WP_Error( 'rest_forbidden', __( 'Sorry, you are not allowed to access this endpoint.', 'jetpack-scheduled-updates' ), array( 'status' => 403 ) );
		}

		return current_user_can( 'update_plugins' );
	}

	/**
	 * Returns information about an update schedule.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response|WP_Error The scheduled event or a WP_Error if the schedule could not be found.
	 */
	public function get_item( $request ) {
		$events = wp_get_scheduled_events( Scheduled_Updates::PLUGIN_CRON_HOOK );

		if ( empty( $events[ $request['schedule_id'] ] ) ) {
			return new WP_Error( 'rest_invalid_schedule', __( 'The schedule could not be found.', 'jetpack-scheduled-updates' ), array( 'status' => 404 ) );
		}

		// Add the schedule_id to the object.
		$events[ $request['schedule_id'] ]->schedule_id = $request['schedule_id'];

		return $this->prepare_item_for_response( $events[ $request['schedule_id'] ], $request );
	}

	/**
	 * Permission check for updating a specific schedule.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return bool|WP_Error
	 */
	public function update_item_permissions_check( $request ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			return new WP_Error( 'rest_forbidden', __( 'Sorry, you are not allowed to access this endpoint.', 'jetpack-scheduled-updates' ), array( 'status' => 403 ) );
		}

		if ( ! ( method_exists( 'Automattic\Jetpack\Current_Plan', 'supports' ) && Automattic\Jetpack\Current_Plan::supports( 'scheduled-updates' ) ) ) {
			return new WP_Error( 'rest_forbidden', __( 'Sorry, you are not allowed to access this endpoint.', 'jetpack-scheduled-updates' ), array( 'status' => 403 ) );
		}

		return current_user_can( 'update_plugins' );
	}

	/**
	 * Updates an existing update schedule.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response|WP_Error The updated event or a WP_Error if the schedule could not be found.
	 */
	public function update_item( $request ) {
		$result = $this->validate_schedule( $request );
		if ( is_wp_error( $result ) ) {
			return $result;
		}

		$deleted = $this->delete_item( $request );
		if ( is_wp_error( $deleted ) ) {
			return $deleted;
		}

		$item = $this->create_item( $request );

		/**
		 * Fires when a scheduled update is updated.
		 *
		 * @param string          $old_id  The ID of the schedule to update.
		 * @param string          $new_id  The ID of the updated event.
		 * @param WP_REST_Request $request The request object.
		 */
		do_action( 'jetpack_scheduled_update_updated', $request['schedule_id'], $item->data, $request );

		return $item;
	}

	/**
	 * Permission check for updating last status.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return bool|WP_Error
	 */
	public function update_status_permissions_check( $request ) {
		return $this->update_item_permissions_check( $request );
	}

	/**
	 * Updates last status of an existing update schedule.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response|WP_Error The updated event or a WP_Error if the schedule could not be found.
	 */
	public function update_status( $request ) {
		$events = wp_get_scheduled_events( Scheduled_Updates::PLUGIN_CRON_HOOK );

		if ( empty( $events[ $request['schedule_id'] ] ) ) {
			return new WP_Error( 'rest_invalid_schedule', __( 'The schedule could not be found.', 'jetpack-scheduled-updates' ), array( 'status' => 404 ) );
		}

		$option = Scheduled_Updates::set_scheduled_update_status(
			$request['schedule_id'],
			$request['last_run_timestamp'],
			$request['last_run_status']
		);

		return rest_ensure_response( $option[ $request['schedule_id'] ] );
	}

	/**
	 * Permission check for adding a log entry
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return bool|WP_Error
	 */
	public function add_log_permissions_check( $request ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			return new WP_Error( 'rest_forbidden', __( 'Sorry, you are not allowed to access this endpoint.', 'jetpack-scheduled-updates' ), array( 'status' => 403 ) );
		}

		return current_user_can( 'update_plugins' );
	}

	/**
	 * Adds a log entry to an update schedule.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response|WP_Error The updated event or a WP_Error if the schedule could not be found.
	 */
	public function add_log( $request ) {
		$schedule_id = $request['schedule_id'];
		$action      = $request['action'];
		$message     = $request['message'];
		$context     = $request['context'];

		$success = Scheduled_Updates_Logs::log( $schedule_id, $action, $message, $context );

		if ( ! $success ) {
			return new WP_Error( 'rest_invalid_schedule', __( 'The schedule could not be found.', 'jetpack-scheduled-updates' ), array( 'status' => 404 ) );
		}

		return rest_ensure_response( true );
	}

	/**
	 * Permission check for retrieving logs.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return bool|WP_Error
	 */
	public function get_logs_permissions_check( $request ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			return new WP_Error( 'rest_forbidden', __( 'Sorry, you are not allowed to access this endpoint.', 'jetpack-scheduled-updates' ), array( 'status' => 403 ) );
		}

		return current_user_can( 'update_plugins' );
	}

	/**
	 * Retrieves logs for a specific schedule.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response|WP_Error The logs for the schedule or a WP_Error if the schedule could not be found.
	 */
	public function get_logs( $request ) {
		$schedule_id = $request['schedule_id'];
		$logs        = Scheduled_Updates_Logs::get( $schedule_id );

		return rest_ensure_response( $logs );
	}

	/**
	 * Permission check for deleting a specific schedule.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return bool|WP_Error
	 */
	public function delete_item_permissions_check( $request ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			return new WP_Error( 'rest_forbidden', __( 'Sorry, you are not allowed to access this endpoint.', 'jetpack-scheduled-updates' ), array( 'status' => 403 ) );
		}

		return current_user_can( 'update_plugins' );
	}

	/**
	 * Deletes an existing update schedule.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response|WP_Error
	 */
	public function delete_item( $request ) {
		$events = wp_get_scheduled_events( Scheduled_Updates::PLUGIN_CRON_HOOK );

		if ( ! isset( $events[ $request['schedule_id'] ] ) ) {
			return new WP_Error( 'rest_invalid_schedule', __( 'The schedule could not be found.', 'jetpack-scheduled-updates' ), array( 'status' => 404 ) );
		}

		$event = $events[ $request['schedule_id'] ];

		$result = Scheduled_Updates::delete_scheduled_update( $event->timestamp, $event->args );
		if ( is_wp_error( $result ) ) {
			return $result;
		}

		if ( false === $result ) {
			return new WP_Error( 'unschedule_event_error', __( 'Error during unschedule of the event.', 'jetpack-scheduled-updates' ), array( 'status' => 500 ) );
		}

		/**
		 * Fires when a scheduled update is deleted.
		 *
		 * @param string          $id      The ID of the schedule to delete.
		 * @param object          $event   The deleted event object.
		 * @param WP_REST_Request $request The request object.
		 */
		do_action( 'jetpack_scheduled_update_deleted', $request['schedule_id'], $event, $request );

		Scheduled_Updates_Health_Paths::clear( $request['schedule_id'] );

		return rest_ensure_response( true );
	}

	/**
	 * Prepares a response for insertion into a collection.
	 *
	 * @param WP_REST_Response $response Response object.
	 * @return array|mixed Response data, ready for insertion into collection data.
	 */
	public function prepare_response_for_collection( $response ) {
		if ( ! ( $response instanceof WP_REST_Response ) ) {
			return $response;
		}

		$data   = (array) $response->get_data();
		$server = rest_get_server();
		$links  = $server::get_compact_response_links( $response );

		if ( ! empty( $links ) ) {
			$data['_links'] = $links;
		}

		return $data;
	}

	/**
	 * Prepares the scheduled update for the REST response.
	 *
	 * @param object          $item    WP Cron event.
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response Response object on success.
	 */
	public function prepare_item_for_response( $item, $request ) {
		$item = (array) $item;

		$status = Scheduled_Updates::get_scheduled_update_status( $item['schedule_id'] );
		if ( ! $status ) {
			$status = array(
				'last_run_timestamp' => null,
				'last_run_status'    => null,
			);
		}

		$item                       = array_merge( $item, $status );
		$item['health_check_paths'] = Scheduled_Updates_Health_Paths::get( $item['schedule_id'] );

		$item = $this->add_additional_fields_to_object( $item, $request );

		// Remove schedule ID, not needed in the response.
		unset( $item['schedule_id'] );

		return rest_ensure_response( $item );
	}

	/**
	 * Checks that the "plugins" parameter is a valid path.
	 *
	 * @param array $plugins List of plugins to update.
	 * @return bool|WP_Error
	 */
	public function validate_plugins_param( $plugins ) {
		$schema            = array(
			'items'    => array( 'type' => 'string' ),
			'maxItems' => 10,
		);
		$validated_plugins = rest_validate_array_value_from_schema( $plugins, $schema, 'plugins' );
		if ( is_wp_error( $validated_plugins ) ) {
			return $validated_plugins;
		}

		foreach ( $plugins as $plugin ) {
			if ( ! $this->validate_plugin_param( $plugin ) ) {
				return new WP_Error(
					'rest_invalid_plugin',
					/* translators: %s: plugin file */
					sprintf( __( 'The plugin "%s" is not a valid plugin file.', 'jetpack-scheduled-updates' ), $plugin ),
					array( 'status' => 400 )
				);
			}
		}

		return true;
	}

	/**
	 * Sanitizes the plugin slugs contained in the "plugins" parameter.
	 *
	 * @param array $plugins List of plugins to update.
	 * @return array
	 */
	public function sanitize_plugins_param( $plugins ) {
		return array_map( array( $this, 'sanitize_plugin_param' ), $plugins );
	}

	/**
	 * Checks that the "plugin" parameter is a valid path.
	 *
	 * @param string $file The plugin file parameter.
	 * @return bool
	 */
	public function validate_plugin_param( $file ) {
		if ( ! is_string( $file ) || ! preg_match( '/' . self::PATTERN . '/u', $file ) ) {
			return false;
		}

		return 0 === validate_file( plugin_basename( $file ) );
	}

	/**
	 * Sanitizes the "plugin" parameter to be a proper plugin file with ".php" appended.
	 *
	 * @param string $file The plugin file parameter.
	 * @return string
	 */
	public function sanitize_plugin_param( $file ) {
		if ( ! str_ends_with( $file, '.php' ) ) {
			$file .= '.php';
		}

		return plugin_basename( sanitize_text_field( $file ) );
	}

	/**
	 * Checks that the "themes" parameter is empty.
	 *
	 * @param array $themes List of themes to update.
	 * @return bool|WP_Error
	 */
	public function validate_themes_param( $themes ) {
		if ( ! empty( $themes ) ) {
			return new WP_Error( 'rest_forbidden', __( 'Sorry, you can not schedule theme updates at this time.', 'jetpack-scheduled-updates' ), array( 'status' => 403 ) );
		}

		return true;
	}

	/**
	 * Checks that the "paths" parameter is a valid array of paths.
	 *
	 * @param array $paths List of paths to check.
	 * @return bool|WP_Error
	 */
	public function validate_paths_param( $paths ) {
		foreach ( $paths as $path ) {
			$valid = Scheduled_Updates_Health_Paths::validate( $path );

			if ( is_wp_error( $valid ) ) {
				$valid->add_data( array( 'status' => 400 ) );

				return $valid;
			}
		}

		return true;
	}

	/**
	 * Validates the submitted schedule.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return bool|WP_Error
	 */
	public function validate_schedule( $request ) {
		$events = wp_get_scheduled_events( Scheduled_Updates::PLUGIN_CRON_HOOK );

		$plugins = $request['plugins'];
		usort( $plugins, 'strnatcasecmp' );

		if ( empty( $request['schedule_id'] ) && count( $events ) >= 2 ) {
			return new WP_Error( 'rest_forbidden', __( 'Sorry, you can not create more than two schedules at this time.', 'jetpack-scheduled-updates' ), array( 'status' => 403 ) );
		}

		foreach ( $events as $key => $event ) {

			// We'll update this schedule, so none of the checks apply.
			if ( isset( $request['schedule_id'] ) && $key === $request['schedule_id'] ) {
				continue;
			}

			if ( $request['schedule']['timestamp'] === $event->timestamp ) {
				return new WP_Error( 'rest_forbidden', __( 'Sorry, you can not create a schedule with the same time as an existing schedule.', 'jetpack-scheduled-updates' ), array( 'status' => 403 ) );
			}

			if ( $event->args === $plugins ) {
				return new WP_Error( 'rest_forbidden', __( 'Sorry, you can not create a schedule with the same plugins as an existing schedule.', 'jetpack-scheduled-updates' ), array( 'status' => 403 ) );
			}
		}

		return true;
	}

	/**
	 * Permission check for retrieving capabilities.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return bool|WP_Error
	 */
	public function get_capabilities_permissions_check( $request ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			return new WP_Error( 'rest_forbidden', __( 'Sorry, you are not allowed to access this endpoint.', 'jetpack-scheduled-updates' ), array( 'status' => 403 ) );
		}

		return current_user_can( 'update_plugins' );
	}

	/**
	 * Returns a list of capabilities for updating plugins, and errors if those capabilities are not met.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response
	 */
	public function get_capabilities( $request ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		$file_mod_capabilities = Scheduled_Updates::get_file_mod_capabilities();

		return rest_ensure_response( $file_mod_capabilities );
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
				'hook'               => array(
					'description' => 'The hook name.',
					'type'        => 'string',
					'readonly'    => true,
				),
				'timestamp'          => array(
					'description' => 'Unix timestamp (UTC) for when to next run the event.',
					'type'        => 'integer',
					'readonly'    => true,
				),
				'schedule'           => array(
					'description' => 'How often the event should subsequently recur.',
					'type'        => 'string',
					'enum'        => array( 'daily', 'weekly' ),
				),
				'args'               => array(
					'description' => 'The plugins to be updated on this schedule.',
					'type'        => 'array',
				),
				'interval'           => array(
					'description' => 'The interval time in seconds for the schedule.',
					'type'        => 'integer',
				),
				'last_run_timestamp' => array(
					'description' => 'Unix timestamp (UTC) for when the last run occurred.',
					'type'        => 'integer',
				),
				'last_run_status'    => array(
					'description' => 'Status of last run.',
					'type'        => 'string',
					'enum'        => array( 'success', 'failure-and-rollback', 'failure-and-rollback-fail' ),
				),
				'health_check_paths' => array(
					'description' => 'Paths to check for site health.',
					'type'        => 'array',
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
				'description'       => 'List of plugin slugs to update.',
				'type'              => 'array',
				'validate_callback' => array( $this, 'validate_plugins_param' ),
				'sanitize_callback' => array( $this, 'sanitize_plugins_param' ),
			),
			'themes'   => array(
				'description'       => 'List of theme slugs to update.',
				'type'              => 'array',
				'required'          => false,
				'validate_callback' => array( $this, 'validate_themes_param' ),
			),
			'schedule' => array(
				'description' => 'Update schedule.',
				'type'        => 'object',
				'required'    => true,
				'properties'  => array(
					'interval'           => array(
						'description' => 'Interval for the schedule.',
						'type'        => 'string',
						'enum'        => array( 'daily', 'weekly' ),
						'required'    => true,
					),
					'timestamp'          => array(
						'description' => 'Unix timestamp (UTC) for when to first run the schedule.',
						'type'        => 'integer',
						'required'    => true,
					),
					'health_check_paths' => array(
						'description'       => 'List of paths to check for site health after the update.',
						'type'              => 'array',
						'maxItems'          => 5,
						'items'             => array(
							'type' => 'string',
						),
						'required'          => false,
						'default'           => array(),
						'validate_callback' => array( $this, 'validate_paths_param' ),
					),
				),
			),
		);
	}
}

wpcom_rest_api_v2_load_plugin( 'WPCOM_REST_API_V2_Endpoint_Update_Schedules' );
