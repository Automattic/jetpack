<?php
/**
 * Endpoint to manage plugin and theme update schedules status.
 *
 * Example: https://public-api.wordpress.com/wpcom/v2/update-schedules/$ID/status
 *
 * @package automattic/scheduled-updates
 */

use Automattic\Jetpack\Scheduled_Updates;

/**
 * Class WPCOM_REST_API_V2_Endpoint_Update_Schedules_Status
 */
class WPCOM_REST_API_V2_Endpoint_Update_Schedules_Status extends WP_REST_Controller {
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
	 * WPCOM_REST_API_V2_Endpoint_Update_Schedules_Status constructor.
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
			'/' . $this->rest_base . '/(?P<schedule_id>[\w]+)/status',
			array(
				array(
					'methods'             => WP_REST_Server::EDITABLE,
					'callback'            => array( $this, 'update_item' ),
					'permission_callback' => array( $this, 'update_item_permissions_check' ),
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
	}

	/**
	 * Permission check for updating last status.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return bool|WP_Error
	 */
	public function update_item_permissions_check( $request ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			return new WP_Error( 'rest_forbidden', __( 'Sorry, you are not allowed to access this endpoint.', 'jetpack-scheduled-updates' ), array( 'status' => 403 ) );
		}

		return current_user_can( 'update_plugins' );
	}

	/**
	 * Updates last status of an existing update schedule.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response|WP_Error The updated event or a WP_Error if the schedule could not be found.
	 */
	public function update_item( $request ) {
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
}
