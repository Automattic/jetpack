<?php
/**
 * Endpoint to manage plugin and theme update schedules.
 *
 * Example: https://public-api.wordpress.com/wpcom/v2/update-schedules
 *
 * @package automattic/scheduled-updates
 */

use Automattic\Jetpack\Scheduled_Updates;

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
		// Priority 11 to make it easier for rest field schemas to make it into get_object_params().
		add_action( 'rest_api_init', array( $this, 'register_routes' ), 11 );
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
					// @phan-suppress-next-line PhanPluginMixedKeyNoKey -- `register_rest_route()` requires mixed key/no-key for `$args`, and then https://github.com/phan/phan/issues/4852 puts the error on the wrong line.
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_items' ),
					'permission_callback' => array( $this, 'get_items_permissions_check' ),
				),
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'create_item' ),
					'permission_callback' => array( $this, 'create_item_permissions_check' ),
					'args'                => $this->get_object_params( WP_REST_Server::CREATABLE ),
				),
				'schema' => array( $this, 'get_public_item_schema' ),
			)
		);

		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<schedule_id>[\w]+)',
			array(
				array(
					// @phan-suppress-next-line PhanPluginMixedKeyNoKey -- `register_rest_route()` requires mixed key/no-key for `$args`, and then https://github.com/phan/phan/issues/4852 puts the error on the wrong line.
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
						$this->get_object_params( WP_REST_Server::EDITABLE )
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

		if ( get_option( 'wpcom_is_staging_site' ) ) {
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

			// Run through the prepare_item_for_response method to add any registered rest fields.
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

		if ( get_option( 'wpcom_is_staging_site' ) ) {
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

		$event = wp_schedule_event( $schedule['timestamp'], $schedule['interval'], Scheduled_Updates::PLUGIN_CRON_HOOK, $plugins, true );

		if ( is_wp_error( $event ) ) {
			// If the schedule could not be created, return an error.
			$event->add_data( array( 'status' => 404 ) );

			return $event;
		}

		$id    = Scheduled_Updates::generate_schedule_id( $plugins );
		$event = wp_get_scheduled_event( Scheduled_Updates::PLUGIN_CRON_HOOK, $plugins, $schedule['timestamp'] );

		if ( ! $event ) {
			return new WP_Error( 'rest_invalid_schedule', __( 'The schedule could not be created.', 'jetpack-scheduled-updates' ), array( 'status' => 404 ) );
		}

		/**
		 * Fires when a scheduled update is created.
		 *
		 * @param string          $id      The ID of the schedule.
		 * @param object          $event   The event object.
		 * @param WP_REST_Request $request The request object.
		 */
		do_action( 'jetpack_scheduled_update_created', $id, $event, $request );

		$event->schedule_id = $id;
		$this->update_additional_fields_for_object( $event, $request );

		// Clear the case and add a transient to clear it again if in 10 seconds another event is scheduled.
		Scheduled_Updates::clear_cron_cache();
		set_transient( 'pre_schedule_event_clear_cron_cache', true, 10 );

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

		if ( get_option( 'wpcom_is_staging_site' ) ) {
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

		if ( get_option( 'wpcom_is_staging_site' ) ) {
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

		// Prevent the sync option to be updated during deletion. This will ensure that the sync is performed only once.
		// Context: https://github.com/Automattic/jetpack/issues/27763
		add_filter( Scheduled_Updates::PLUGIN_CRON_SYNC_HOOK, '__return_false' );
		$deleted = $this->delete_item( $request );

		if ( is_wp_error( $deleted ) ) {
			return $deleted;
		}

		// Re-enable the sync option before creation.
		remove_filter( Scheduled_Updates::PLUGIN_CRON_SYNC_HOOK, '__return_false' );
		$item = $this->create_item( $request );

		if ( ! is_wp_error( $item ) ) {
			/**
			 * Fires when a scheduled update is updated.
			 *
			 * @param string          $old_id  The ID of the schedule to update.
			 * @param string          $new_id  The ID of the updated event.
			 * @param WP_REST_Request $request The request object.
			 */
			do_action( 'jetpack_scheduled_update_updated', $request['schedule_id'], $item->data, $request );
		}

		return $item;
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

		if ( get_option( 'wpcom_is_staging_site' ) ) {
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

		$event  = $events[ $request['schedule_id'] ];
		$result = wp_unschedule_event( $event->timestamp, Scheduled_Updates::PLUGIN_CRON_HOOK, $event->args, true );

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

		if ( 'DELETE' === $request->get_method() ) {
			// In a direct call clear the case and a transient to clear it again if in 10 seconds another event is scheduled.
			Scheduled_Updates::clear_cron_cache();
			set_transient( 'pre_schedule_event_clear_cron_cache', true, 10 );
		}

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

		$data = (array) $response->get_data();

		// Only call rest_get_server() if we're in a REST API request.
		if ( did_action( 'rest_api_init' ) ) {
			$server = rest_get_server();
			$links  = $server::get_compact_response_links( $response );

			if ( ! empty( $links ) ) {
				$data['_links'] = $links;
			}
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
		$item = apply_filters( 'jetpack_scheduled_response_item', $item, $request );
		$item = $this->add_additional_fields_to_object( $item, $request );

		// Remove schedule ID, not needed in the response.
		unset( $item['schedule_id'] );

		return rest_ensure_response( $item );
	}

	/**
	 * Checks that the "plugins" parameter is not empty.
	 *
	 * @param array           $plugins List of plugins to update.
	 * @param WP_REST_Request $request Request object.
	 * @param string          $param   The parameter name.
	 * @return bool|WP_Error
	 */
	public function validate_plugins_param( $plugins, $request, $param ) {
		$result = rest_validate_request_arg( $plugins, $request, $param );
		if ( is_wp_error( $result ) ) {
			return $result;
		}

		// We don't need to check if plugins are installed if we're on WPCOM.
		$installed_plugins = defined( 'IS_WPCOM' ) && IS_WPCOM ? $plugins : array_filter( $plugins, array( $this, 'is_plugin_installed' ) );

		if ( empty( $installed_plugins ) ) {
			add_filter( 'rest_request_after_callbacks', array( $this, 'transform_error_response' ) );

			return new \WP_Error(
				'rest_invalid_param',
				__( 'The specified plugins are not installed on the website. Please make sure the plugins are installed before attempting to schedule updates.', 'jetpack-scheduled-updates' ),
				array( 'status' => 400 )
			);
		}

		$unmanaged_plugins = array_diff( $plugins, array_filter( $plugins, array( Scheduled_Updates::class, 'is_managed_plugin' ) ) );
		if ( empty( $unmanaged_plugins ) ) {
			add_filter( 'rest_request_after_callbacks', array( $this, 'transform_error_response' ) );

			return new \WP_Error(
				'rest_invalid_param',
				__( 'The specified plugins are managed and auto-updated by WordPress.com.', 'jetpack-scheduled-updates' ),
				array( 'status' => 400 )
			);
		}

		return true;
	}

	/**
	 * Check if a plugin is installed.
	 *
	 * @param string $plugin The plugin to check.
	 * @return bool
	 */
	public function is_plugin_installed( $plugin ) {
		if ( ! function_exists( 'validate_plugin' ) ) {
			require_once ABSPATH . 'wp-admin/includes/plugin.php';
		}

		return 0 === validate_plugin( $plugin );
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
		$events = wp_get_scheduled_events( Scheduled_Updates::PLUGIN_CRON_HOOK );

		$plugins = $request['plugins'];
		usort( $plugins, 'strnatcasecmp' );

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
	 * Transforms nested error message for the plugins parameter to a top-level error.
	 *
	 * @see WP_REST_Request::has_valid_params()
	 *
	 * @param WP_REST_Response|WP_HTTP_Response|WP_Error|mixed $response Result to send to the client.
	 * @return mixed
	 */
	public function transform_error_response( $response ) {
		if ( is_wp_error( $response ) && 'rest_invalid_param' === $response->get_error_code() && isset( $response->get_error_data()['details']['plugins'] ) ) {
			$error    = $response->get_error_data()['details']['plugins'];
			$response = new WP_Error( $error['code'], $error['message'], $error['data'] );
		}

		return $response;
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
	 * @param string $method HTTP method of the request.
	 *                       The arguments for `CREATABLE` requests are checked for required values and may fall back to
	 *                       a given default. This is not done on `EDITABLE` requests.
	 * @return array[] Array of query parameters.
	 */
	public function get_object_params( $method ) {
		$endpoint_args = array(
			'title'      => 'update-schedule',
			'properties' => array(
				'plugins'  => array(
					'description' => 'List of plugin slugs to update.',
					'type'        => 'array',
					'maxItems'    => 10,
					'required'    => true,
					'arg_options' => array(
						'validate_callback' => array( $this, 'validate_plugins_param' ),
					),
					'items'       => array(
						'type'        => 'string',
						'arg_options' => array(
							'validate_callback' => array( $this, 'validate_plugin_param' ),
							'sanitize_callback' => array( $this, 'sanitize_plugin_param' ),
						),
					),
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
			),
		);

		return rest_get_endpoint_args_for_schema( $this->add_additional_fields_schema( $endpoint_args ), $method );
	}
}
