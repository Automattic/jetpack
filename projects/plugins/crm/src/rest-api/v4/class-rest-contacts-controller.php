<?php
/**
 * Contact REST controller.
 *
 * @package Automattic\Jetpack\CRM
 */

namespace Automattic\Jetpack\CRM\REST_API\V4;

use Exception;
use WP_Error;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;
use zbsDAL_contacts;

defined( 'ABSPATH' ) || exit;

/**
 * REST contacts controller.
 *
 * @package Automattic\Jetpack\CRM
 * @since 6.1.0
 */
final class REST_Contacts_Controller extends REST_Base_Objects_Controller {

	/**
	 * Constructor.
	 *
	 * @since 6.1.0
	 */
	public function __construct() {
		parent::__construct();

		$this->rest_base = 'contacts';
	}

	/**
	 * Registers the routes for the objects of the controller.
	 *
	 * @since 6.1.0
	 * @see register_rest_route()
	 *
	 * @return void
	 */
	public function register_routes() {
		// Register REST collection resource endpoints.
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base,
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_items' ),
					'permission_callback' => array( $this, 'get_items_permissions_check' ),
				),
			)
		);

		// Register REST singleton resource endpoints.
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<id>[\d]+)',
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
			)
		);
	}

	/**
	 * Get a contact.
	 *
	 * @since 6.1.0
	 *
	 * @param WP_REST_Request $request The request object.
	 * @return WP_Error|WP_REST_Response
	 */
	public function get_item( $request ) {
		try {
			// phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
			$contact = $this->get_contacts_service()->getContact(
				$request->get_param( 'id' ),
				array( 'withCustomFields' => true )
			);
		} catch ( Exception $e ) {
			return new WP_Error(
				'rest_unknown_error',
				$e->getMessage(),
				array( 'status' => 500 )
			);
		}

		if ( $contact === false ) {
			return new WP_Error(
				'rest_invalid_contact_id',
				__( 'Invalid contact ID.', 'zero-bs-crm' ),
				array( 'status' => 404 )
			);
		}

		$data = $this->prepare_item_for_response( $contact, $request );

		return rest_ensure_response( $data );
	}

	/**
	 * Checks if a given request has access to get a specific item.
	 *
	 * @since 6.1.0
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return true|WP_Error True if the request has read access for the item, WP_Error object otherwise.
	 */
	public function get_item_permissions_check( $request ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		// Technically, we should always have a current user at this point, so we
		// do not have to check if current user is a WP_User object or wrap this in
		// a try/catch since it's an actual fatal error if something weird happens.
		$can_user_manage_contacts = jpcrm_can_user_manage_contacts( wp_get_current_user(), $request->get_param( 'id' ) );

		if ( is_wp_error( $can_user_manage_contacts ) ) {
			return $can_user_manage_contacts;
		}

		if ( $can_user_manage_contacts ) {
			return true;
		}

		return new WP_Error(
			'rest_cannot_view',
			__( 'Sorry, you cannot view this resource.', 'zero-bs-crm' ),
			array( 'status' => rest_authorization_required_code() )
		);
	}

	/**
	 * Prepares the item for the REST response.
	 *
	 * @since 6.1.0
	 * @todo Implement item schema and only output fields that are part of the schema.
	 *
	 * @param array           $item WordPress' representation of the item.
	 * @param WP_REST_Request $request The request object.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function prepare_item_for_response( $item, $request ) {
		// Wrap the data in a response object.
		$response = rest_ensure_response( $item );

		// Add hyperlinking to the response.
		// @link https://developer.wordpress.org/rest-api/using-the-rest-api/linking-and-embedding/
		if ( isset( $item['id'] ) ) {
			$response->add_links( $this->prepare_links( $item['id'] ) );
		}

		/**
		 * Filters the REST API response for a contact.
		 *
		 * @since 6.1.0
		 *
		 * @param WP_REST_Response $response The response object.
		 * @param array $item The raw contact data.
		 * @param WP_REST_Request $request The request object.
		 */
		return apply_filters( 'jpcrm_rest_prepare_contact_object', $response, $item, $request );
	}

	/**
	 * Get contacts service.
	 *
	 * @since 6.1.0
	 *
	 * @return zbsDAL_contacts
	 */
	public function get_contacts_service() {
		return $this->get_dal_service()->contacts;
	}
}
