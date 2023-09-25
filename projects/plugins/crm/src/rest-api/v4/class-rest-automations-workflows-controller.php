<?php
/**
 * Automation REST controller.
 *
 * @package Automattic\Jetpack\CRM
 */

namespace Automattic\Jetpack\CRM\REST_API\V4;

use Automattic\Jetpack\CRM\Automation\Automation_Workflow;
use Automattic\Jetpack\CRM\Automation\Workflow\Workflow_Repository;
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
final class REST_Automations_Workflows_Controller extends REST_Base_Controller {

	/**
	 * The workflow repository.
	 *
	 * @since $$next-version$$
	 * @var Workflow_Repository
	 */
	protected $workflow_repository;

	/**
	 * Constructor.
	 *
	 * @since $$next-version$$
	 */
	public function __construct() {
		parent::__construct();

		$this->workflow_repository = new Workflow_Repository();
		$this->rest_base           = 'automations';
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
					'callback'            => array( $this, 'get_items' ),
					'permission_callback' => array( $this, 'get_item_permissions_check' ),
				),
			)
		);

		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/workflow/(?P<id>[\d]+)',
			array(
				'args' => array(
					'id' => array(
						'description' => __( 'Unique identifier for the resource.', 'zero-bs-crm' ),
						'type'        => 'integer',
					),
				),
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_item' ),
					'permission_callback' => array( $this, 'get_item_permissions_check' ),
				),
				array(
					'methods'             => WP_REST_Server::EDITABLE,
					'callback'            => array( $this, 'update_item' ),
					'permission_callback' => array( $this, 'get_item_permissions_check' ),
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
	public function get_items( $request ) {
		try {
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
	public function get_item( $request ) {
		try {
			$workflow = $this->workflow_repository->find( $request->get_param( 'id' ) );

			if ( ! $workflow instanceof Automation_Workflow ) {
				return new WP_Error(
					'rest_invalid_workflow_id',
					__( 'Invalid workflow ID.', 'zero-bs-crm' ),
					array( 'status' => 404 )
				);
			}
		} catch ( Exception $e ) {
			return new WP_Error(
				'rest_unknown_error',
				$e->getMessage(),
				array( 'status' => 500 )
			);
		}

		return $this->prepare_workflow_for_response( $workflow, $request );
	}

	/**
	 * Update a workflow.
	 *
	 * @since $$next-version$$
	 *
	 * @param WP_REST_Request $request The request object.
	 * @return WP_Error|WP_REST_Response
	 */
	public function update_item( $request ) {
		try {
			// TODO: Actually update the Workflow in the DB and not just fetch it.
			$workflow_id = $request->get_param( 'id' );

			$workflow = $this->workflow_repository->find( $workflow_id );
		} catch ( Exception $e ) {
			return new WP_Error(
				'rest_unknown_error',
				$e->getMessage(),
				array( 'status' => 500 )
			);
		}

		return $this->prepare_workflow_for_response( $workflow, $request );
	}

	/**
	 * Checks if a given request has admin access to automations.
	 *
	 * @since $$next-version$$
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return true|WP_Error True if the request has read access for the workflows, WP_Error object otherwise.
	 */
	public function get_item_permissions_check( $request ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
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
		 * @param array            $workflows The raw workflow array.
		 * @param WP_REST_Request  $request The request object.
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
		if ( $workflow instanceof Automation_Workflow ) {
			$workflow = $workflow->to_array();
		}

		// Wrap the data in a response object.
		$response = rest_ensure_response( $workflow );

		/**
		 * Filters the REST API response for a single workflow.
		 *
		 * @since $$next-version$$
		 *
		 * @param WP_REST_Response $response The response object.
		 * @param array            $workflow The raw workflow object.
		 * @param WP_REST_Request  $request The request object.
		 */
		return apply_filters( 'jpcrm_rest_prepare_workflow_object', $response, $workflow, $request );
	}
}
