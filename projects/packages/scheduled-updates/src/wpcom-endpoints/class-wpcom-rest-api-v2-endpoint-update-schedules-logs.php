<?php
/**
 * Endpoint to manage plugin and theme update schedules logs.
 *
 * Example: https://public-api.wordpress.com/wpcom/v2/update-schedules/$ID/logs
 *
 * @package automattic/scheduled-updates
 */

use Automattic\Jetpack\Scheduled_Updates_Logs;

/**
 * Class WPCOM_REST_API_V2_Endpoint_Update_Schedules_Logs
 */
class WPCOM_REST_API_V2_Endpoint_Update_Schedules_Logs extends WP_REST_Controller {
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
	 * WPCOM_REST_API_V2_Endpoint_Update_Schedules_Logs constructor.
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
			'/' . $this->rest_base . '/(?P<schedule_id>[\w]+)/logs',
			array(
				array(
					'methods'             => WP_REST_Server::EDITABLE,
					'callback'            => array( $this, 'create_item' ),
					'permission_callback' => array( $this, 'create_item_permissions_check' ),
					'args'                => array(
						'action'  => array(
							'description' => 'The action to be logged',
							'type'        => 'string',
							'required'    => true,
							'enum'        => Scheduled_Updates_Logs::ENUM_ACTIONS,
						),
						'message' => array(
							'description' => 'The message to be logged',
							'type'        => 'string',
						),
						'context' => array(
							'description' => 'The context to be logged',
							'type'        => 'object',
						),
					),
				),
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_items' ),
					'permission_callback' => array( $this, 'get_items_permissions_check' ),
				),
			)
		);
	}

	/**
	 * Permission check for adding a log entry
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return bool|WP_Error
	 */
	public function create_item_permissions_check( $request ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
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
	public function create_item( $request ) {
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
	public function get_items_permissions_check( $request ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
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
	public function get_items( $request ) {
		return rest_ensure_response( Scheduled_Updates_Logs::get( $request['schedule_id'] ) );
	}
}
