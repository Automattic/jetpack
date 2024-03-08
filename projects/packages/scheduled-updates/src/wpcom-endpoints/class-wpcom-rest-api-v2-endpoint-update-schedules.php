<?php
/**
 * Endpoint to manage plugin and theme update schedules.
 *
 * Example: https://public-api.wordpress.com/wpcom/v2/update-schedules
 *
 * @package automattic/scheduled-updates
 */

// Load dependencies.
require_once dirname( __DIR__ ) . '/pluggable.php';
require_once dirname( __DIR__ ) . '/class-scheduled-updates.php';

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
	 * @return WP_REST_Response
	 */
	public function get_items( $request ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		return rest_ensure_response( wp_get_scheduled_events( 'jetpack_scheduled_update' ) );
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

		$event = wp_schedule_event( $schedule['timestamp'], $schedule['interval'], 'jetpack_scheduled_update', $plugins, true );
		if ( is_wp_error( $event ) ) {
			return $event;
		}

		require_once ABSPATH . 'wp-admin/includes/update.php';

		if ( wp_is_auto_update_enabled_for_type( 'plugin' ) ) {
			// Remove the plugins that are now updated on a schedule from the auto-update list.
			$auto_update_plugins = get_option( 'auto_update_plugins', array() );
			$auto_update_plugins = array_diff( $auto_update_plugins, $plugins );
			update_option( 'auto_update_plugins', $auto_update_plugins );
		}

		return rest_ensure_response( $this->generate_schedule_id( $plugins ) );
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
		$events = wp_get_scheduled_events( 'jetpack_scheduled_update' );

		if ( empty( $events[ $request['schedule_id'] ] ) ) {
			return new WP_Error( 'rest_invalid_schedule', __( 'The schedule could not be found.', 'jetpack-scheduled-updates' ), array( 'status' => 404 ) );
		}

		return rest_ensure_response( $events[ $request['schedule_id'] ] );
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

		return $this->create_item( $request );
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
		$events = wp_get_scheduled_events( 'jetpack_scheduled_update' );

		if ( ! isset( $events[ $request['schedule_id'] ] ) ) {
			return new WP_Error( 'rest_invalid_schedule', __( 'The schedule could not be found.', 'jetpack-scheduled-updates' ), array( 'status' => 404 ) );
		}

		$event = $events[ $request['schedule_id'] ];

		$result = wp_unschedule_event( $event->timestamp, 'jetpack_scheduled_update', $event->args, true );
		if ( is_wp_error( $result ) ) {
			return $result;
		}

		if ( false === $result ) {
			return new WP_Error( 'unschedule_event_error', __( 'Error during unschedule of the event.', 'jetpack-scheduled-updates' ), array( 'status' => 500 ) );
		}

		require_once ABSPATH . 'wp-admin/includes/update.php';

		if ( wp_is_auto_update_enabled_for_type( 'plugin' ) ) {
			unset( $events[ $request['schedule_id'] ] );

			// Find the plugins that are not part of any other schedule.
			$plugins = $event->args;
			foreach ( wp_list_pluck( $events, 'args' ) as $args ) {
				$plugins = array_diff( $plugins, $args );
			}

			// Add the plugins that are no longer updated on a schedule to the auto-update list.
			$auto_update_plugins = get_option( 'auto_update_plugins', array() );
			$auto_update_plugins = array_unique( array_merge( $auto_update_plugins, $plugins ) );
			usort( $auto_update_plugins, 'strnatcasecmp' );
			update_option( 'auto_update_plugins', $auto_update_plugins );
		}

		return rest_ensure_response( true );
	}

	/**
	 * Checks that the "plugins" parameter is a valid path.
	 *
	 * @param array $plugins List of plugins to update.
	 * @return bool|WP_Error
	 */
	public function validate_plugins_param( $plugins ) {
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
	 * Validates the submitted schedule.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return bool|WP_Error
	 */
	public function validate_schedule( $request ) {
		$events = wp_get_scheduled_events( 'jetpack_scheduled_update' );

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
		$file_mod_capabilities = \Automattic\Jetpack\Scheduled_Updates::get_file_mod_capabilities();

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
				'description'       => 'List of plugin slugs to update.',
				'type'              => 'array',
				'items'             => array(
					'type' => 'string',
				),
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
