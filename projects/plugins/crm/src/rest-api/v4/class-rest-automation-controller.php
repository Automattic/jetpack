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
					'permission_callback' => array( $this, 'automation_admin_permissions_check' ),
				),
			)
		);
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/workflow',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_workflow' ),
					'permission_callback' => array( $this, 'automation_admin_permissions_check' ),
				),
			)
		);
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/workflow',
			array(
				array(
					'methods'             => WP_REST_Server::EDITABLE,
					'callback'            => array( $this, 'update_workflow' ),
					'permission_callback' => array( $this, 'automation_admin_permissions_check' ),
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
	 * Get a single workflow.
	 *
	 * @since $$next-version$$
	 *
	 * @param WP_REST_Request $request The request object.
	 * @return WP_Error|WP_REST_Response
	 */
	public function get_workflow( $request ) {
		try {
			// TODO: Get the Workflow from the DB.
			$workflow = array(
				'id'           => 'testing',
				'name'         => 'New Contact',
				'active'       => true,
				'version'      => 1,
				'description'  => 'This automation will change the status of a contact to "Customer" when they are created.',
				'category'     => 'Contact',
				'triggers'     => array(
					'jpcrm/invoice_created',
				),
				'initial_step' => 'step_1',
				'steps'        => array(
					'step_1' => array(
						'slug'       => 'jpcrm/update_contact_status',
						'attributes' => array(
							'new_status' => 'Customer',
						),
						'next_step'  => 'step_2',
					),
					'step_2' => array(
						'slug'       => 'jpcrm/send_email',
						'attributes' => array(
							'to'      => 'admin@example.com',
							'subject' => 'New Customer',
							'body'    => 'A new customer has been created.',
						),
						'next_step'  => null,
					),
				),
			);
		} catch ( Exception $e ) {
			return new WP_Error(
				'rest_unknown_error',
				$e->getMessage(),
				array( 'status' => 500 )
			);
		}

		$data = $this->prepare_workflow_for_response( $workflow, $request );

		return rest_ensure_response( $data );
	}

	/**
	 * Update a workflow.
	 *
	 * @since $$next-version$$
	 *
	 * @param WP_REST_Request $request The request object.
	 * @return WP_Error|WP_REST_Response
	 */
	public function update_workflow( $request ) {
		try {
			// TODO: Update the Workflow in the DB.
			$workflow_id = $request->get_param( 'id' );
			$workflow    = array(
				'id'           => $workflow_id,
				'name'         => 'New Contact',
				'active'       => true,
				'version'      => 1,
				'description'  => 'This automation will change the status of a contact to "Customer" when they are created.',
				'category'     => 'Contact',
				'triggers'     => array(
					'jpcrm/invoice_created',
				),
				'initial_step' => 'step_1',
				'steps'        => array(
					'step_1' => array(
						'slug'       => 'jpcrm/update_contact_status',
						'attributes' => array(
							'new_status' => 'Customer',
						),
						'next_step'  => 'step_2',
					),
					'step_2' => array(
						'slug'       => 'jpcrm/send_email',
						'attributes' => array(
							'to'      => 'admin@example.com',
							'subject' => 'New Customer',
							'body'    => 'A new customer has been created.',
						),
						'next_step'  => null,
					),
				),
			);
		} catch ( Exception $e ) {
			return new WP_Error(
				'rest_unknown_error',
				$e->getMessage(),
				array( 'status' => 500 )
			);
		}

		$data = $this->prepare_workflow_for_response( $workflow, $request );

		return rest_ensure_response( $data );
	}

	/**
	 * Checks if a given request has admin access to automations.
	 *
	 * @since $$next-version$$
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return true|WP_Error True if the request has read access for the workflows, WP_Error object otherwise.
	 */
	public function automation_admin_permissions_check( $request ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
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

	/**
	 * Prepares the workflow for the REST response.
	 *
	 * @since $$next-version$$
	 *
	 * @param array           $workflow WordPress' representation of the item.
	 * @param WP_REST_Request $request The request object.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function prepare_workflow_for_response( $workflow, $request ) {
		// Wrap the data in a response object.
		$response = rest_ensure_response( $workflow );

		/**
		 * Filters the REST API response for a single workflow.
		 *
		 * @since $$next-version$$
		 *
		 * @param WP_REST_Response $response The response object.
		 * @param array $workflow The raw workflow object.
		 * @param WP_REST_Request $request The request object.
		 */
		return apply_filters( 'jpcrm_rest_prepare_workflow_object', $response, $workflow, $request );
	}
}
