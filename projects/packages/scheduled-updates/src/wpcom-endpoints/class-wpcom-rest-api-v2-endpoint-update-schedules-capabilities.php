<?php
/**
 * Endpoint to manage plugin and theme update schedules capabilities.
 *
 * Example: https://public-api.wordpress.com/wpcom/v2/update-schedules/$ID/capabilities
 *
 * @package automattic/scheduled-updates
 */

use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Status;
use Automattic\Jetpack\Sync\Functions;

/**
 * Class WPCOM_REST_API_V2_Endpoint_Update_Schedules_Capabilities
 */
class WPCOM_REST_API_V2_Endpoint_Update_Schedules_Capabilities extends WP_REST_Controller {
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
	 * WPCOM_REST_API_V2_Endpoint_Update_Schedules_Capabilities constructor.
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
			'/' . $this->rest_base . '/capabilities',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_items' ),
					'permission_callback' => array( $this, 'get_items_permissions_check' ),
				),
			)
		);
	}

	/**
	 * Permission check for retrieving capabilities.
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
	 * Returns a list of capabilities for updating plugins, and errors if those capabilities are not met.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response
	 */
	public function get_items( $request ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		$reasons_can_not_autoupdate   = array();
		$reasons_can_not_modify_files = array();

		if ( ! Functions::file_system_write_access() ) {
			$reasons_can_not_modify_files['has_no_file_system_write_access'] = __( 'The file permissions on this host prevent editing files.', 'jetpack-scheduled-updates' );
		}

		$disallow_file_mods = Constants::get_constant( 'DISALLOW_FILE_MODS' );
		if ( $disallow_file_mods ) {
			$reasons_can_not_modify_files['disallow_file_mods'] = __( 'File modifications are explicitly disabled by a site administrator.', 'jetpack-scheduled-updates' );
		}

		$automatic_updater_disabled = Constants::get_constant( 'AUTOMATIC_UPDATER_DISABLED' );
		if ( $automatic_updater_disabled ) {
			$reasons_can_not_autoupdate['automatic_updater_disabled'] = __( 'Any autoupdates are explicitly disabled by a site administrator.', 'jetpack-scheduled-updates' );
		}

		if ( is_multisite() ) {
			if ( ( new Status() )->is_multi_network() ) {
				$reasons_can_not_modify_files['is_multi_network'] = __( 'Multi network install are not supported.', 'jetpack-scheduled-updates' );
			}
			// Is the site the main site here.
			if ( ! is_main_site() ) {
				$reasons_can_not_modify_files['is_sub_site'] = __( 'The site is not the main network site', 'jetpack-scheduled-updates' );
			}
		}

		$file_mod_capabilities = array(
			'modify_files'     => empty( $reasons_can_not_modify_files ), // Install, remove, update.
			'autoupdate_files' => empty( $reasons_can_not_modify_files ) && empty( $reasons_can_not_autoupdate ), // Enable autoupdates.
		);

		$errors = array();

		if ( ! empty( $reasons_can_not_modify_files ) ) {
			foreach ( $reasons_can_not_modify_files as $error_code => $error_message ) {
				$errors[] = array(
					'code'    => $error_code,
					'message' => $error_message,
				);
			}
		}

		if ( ! $file_mod_capabilities['autoupdate_files'] ) {
			foreach ( $reasons_can_not_autoupdate as $error_code => $error_message ) {
				$errors[] = array(
					'code'    => $error_code,
					'message' => $error_message,
				);
			}
		}

		$errors = array_unique( $errors );
		if ( ! empty( $errors ) ) {
			$file_mod_capabilities['errors'] = $errors;
		}

		return rest_ensure_response( $file_mod_capabilities );
	}
}
