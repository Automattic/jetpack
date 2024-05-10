<?php
/**
 * Endpoint to manage plugin and theme update schedules active status.
 *
 * Example: https://public-api.wordpress.com/wpcom/v2/update-schedules/$ID/active
 *
 * @package automattic/scheduled-updates
 */

use Automattic\Jetpack\Scheduled_Updates;
use Automattic\Jetpack\Scheduled_Updates_Active;

/**
 * Class WPCOM_REST_API_V2_Endpoint_Update_Schedules_Active
 */
class WPCOM_REST_API_V2_Endpoint_Update_Schedules_Active extends WP_REST_Controller {
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
	 * WPCOM_REST_API_V2_Endpoint_Update_Schedules_Active constructor.
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
			'/' . $this->rest_base . '/(?P<schedule_id>[\w]+)/active',
			array(
				array(
					'methods'             => WP_REST_Server::EDITABLE,
					'callback'            => array( $this, 'update_item' ),
					'permission_callback' => array( $this, 'update_item_permissions_check' ),
					'args'                => array(
						'active' => array(
							'description'       => 'Whether the schedule is active.',
							'type'              => 'boolean',
							'required'          => true,
							'sanitize_callback' => 'rest_sanitize_boolean',
						),
					),
				),
			)
		);
	}

	/**
	 * Permission check for updating active status.
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
	 * Updates active of an existing update schedule.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response|WP_Error The updated active value or a WP_Error if the schedule could not be found.
	 */
	public function update_item( $request ) {
		$events = wp_get_scheduled_events( Scheduled_Updates::PLUGIN_CRON_HOOK );

		if ( empty( $events[ $request['schedule_id'] ] ) ) {
			return new WP_Error( 'rest_invalid_schedule', __( 'The schedule could not be found.', 'jetpack-scheduled-updates' ), array( 'status' => 404 ) );
		}

		Scheduled_Updates_Active::update( $request['schedule_id'], (bool) $request['active'] );

		return rest_ensure_response( array( 'active' => (bool) $request['active'] ) );
	}
}
