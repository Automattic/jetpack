<?php
/**
 * Automation REST controller.
 *
 * @package Automattic\Jetpack\CRM
 */

namespace Automattic\Jetpack\CRM\REST_API\V4;

use Exception;
use WP_Error;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;

defined( 'ABSPATH' ) || exit;

/**
 * REST automation controller.
 *
 * @package Automattic\Jetpack\CRM
 * @since $$next-version$$
 */
final class REST_Automation_Controller extends REST_Base_Objects_Controller {

	/**
	 * Constructor.
	 *
	 * @since $$next-version$$
	 */
	public function __construct() {
		parent::__construct();

		$this->rest_base = 'automation';
	}

	/**
	 * Registers the routes for the objects of the controller.
	 *
	 * @since $$next-version$$
	 * @see register_rest_route()
	 *
	 * @return void
	 */
	public function register_routes() {
		// Register REST collection resource endpoints.
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/workflows',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_workflows' ),
					'permission_callback' => array( $this, 'get_workflows_permissions_check' ),
				),
			)
		);
	}

	/**
	 * Get all workflows.
	 *
	 * @since $$next-version$$
	 *
	 * @param WP_REST_Request $request The request object.
	 * @return WP_Error|WP_REST_Response
	 */
	public function get_workflows( $request ) {
		try {
			// TODO: Get the Workflows from the DB.
			$workflows = array( 'Get Workflows from DB' );
		} catch ( Exception $e ) {
			return new WP_Error(
				'rest_unknown_error',
				$e->getMessage(),
				array( 'status' => 500 )
			);
		}

		$data = $this->prepare_workflows_for_response( $workflows, $request );

		return rest_ensure_response( $data );
	}

	/**
	 * Checks if a given request has access to the workflows.
	 *
	 * @since $$next-version$$
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return true|WP_Error True if the request has read access for the workflows, WP_Error object otherwise.
	 */
	public function get_workflows_permissions_check( $request ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		$can_user_manage_workflows = zeroBSCRM_isZBSAdmin();

		if ( is_wp_error( $can_user_manage_workflows ) ) {
			return $can_user_manage_workflows;
		}

		if ( $can_user_manage_workflows ) {
			return true;
		}

		return new WP_Error(
			'rest_cannot_view',
			__( 'Sorry, you cannot view this resource.', 'zero-bs-crm' ),
			array( 'status' => rest_authorization_required_code() )
		);
	}

	/**
	 * Prepares the workflow for the REST response.
	 *
	 * @since $$next-version$$
	 *
	 * @param array           $workflows WordPress' representation of the item.
	 * @param WP_REST_Request $request The request object.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function prepare_workflows_for_response( $workflows, $request ) {
		// Wrap the data in a response object.
		$response = rest_ensure_response( $workflows );

		/**
		 * Filters the REST API response for workflows.
		 *
		 * @since $$next-version$$
		 *
		 * @param WP_REST_Response $response The response object.
		 * @param array $workflows The raw workflow array.
		 * @param WP_REST_Request $request The request object.
		 */
		return apply_filters( 'jpcrm_rest_prepare_workflows_array', $response, $workflows, $request );
	}
}
