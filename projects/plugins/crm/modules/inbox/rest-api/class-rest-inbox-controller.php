<?php
/**
 * Inbox REST controller.
 *
 * @package Automattic\Jetpack\CRM
 */

namespace Automattic\Jetpack\CRM\REST_API\V4;

use Automattic\Jetpack_CRM\Modules\Inbox\Inbox_Message;
use Exception;
use WP_Error;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;

defined( 'ABSPATH' ) || exit;

/**
 * REST Inbox Controller.
 *
 * @package Automattic\Jetpack\CRM
 * @since $$next-version$$
 */
final class REST_Inbox_Controller extends REST_Base_Objects_Controller {

	/**
	 * Constructor.
	 *
	 * @since $$next-version$$
	 */
	public function __construct() {
		parent::__construct();

		$this->rest_base = 'inbox';
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
			'/' . $this->rest_base . '/messages',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_messages' ),
					'permission_callback' => array( $this, 'get_messages_permissions_check' ),
				),
			)
		);
	}

	/**
	 * Get all received messages.
	 *
	 * @since $$next-version$$
	 *
	 * @param WP_REST_Request $request The request object.
	 * @return WP_Error|WP_REST_Response
	 */
	public function get_messages( $request ) {
		try {
			require_once plugin_dir_path( __FILE__ ) . '../sync/class-inbox-message.php';
			// TODO: For HACK Week it gets only the first 100 messages.
			$messages     = array();
			$contacts     = array();
			$contact_ids  = array();
			$mail_history = zeroBSCRM_get_email_history( 0, 100, -1, 'received', -1, false );
			foreach ( $mail_history as $mail ) {
				$messages[]                                 = new Inbox_Message( $mail->zbsmail_target_objid, $mail->zbsmail_subject, $mail->zbsmail_content, 'email', $mail->zbsmail_created );
				$contact_ids[ $mail->zbsmail_target_objid ] = true;
			}

			foreach ( array_keys( $contact_ids ) as $contact_id ) {
				$contact                       = array();
				$full_contact                  = zeroBS_getCustomer( $contact_id, true, true, true );
				$contact['id']                 = (int) $full_contact['id'];
				$contact['name']               = trim( $full_contact['fname'] . ' ' . $full_contact['lname'] );
				$contact['status']             = $full_contact['status'];
				$contact['prefix']             = $full_contact['prefix'];
				$contact['email']              = $full_contact['email'];
				$contact['phone']              = current( array_filter( array( $full_contact['hometel'], $full_contact['worktel'], $full_contact['mobtel'] ) ) ) ?: ''; // phpcs:ignore
				$contact['avatar']             = zeroBS_customerAvatarHTML( $contact_id );
				$contact['transactions_value'] = zeroBSCRM_formatCurrency( zeroBS_customerTransactionsValue( $contact_id, $full_contact['transactions'] ) );
				$contact['invoices_value']     = zeroBSCRM_formatCurrency( zeroBS_customerInvoicesValue( $contact_id, $full_contact['invoices'] ) );
				$contact['quotes_value']       = zeroBSCRM_formatCurrency( zeroBS_customerQuotesValue( $contact_id, $full_contact['quotes'] ) );
				$contact['tasks']              = zeroBSCRM_getTaskList( $contact_id );
				$contacts[]                    = $contact;
			}
		} catch ( Exception $e ) {
			return new WP_Error(
				'rest_unknown_error',
				$e->getMessage(),
				array( 'status' => 500 )
			);
		}

		$result             = array();
		$result['messages'] = $messages;
		$result['contacts'] = $contacts;

		$data = $this->prepare_messages_for_response( $result, $request );

		return rest_ensure_response( $data );
	}

	/**
	 * Checks if a given request has access to the messages.
	 *
	 * @since $$next-version$$
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return true|WP_Error True if the request has read access for the messages, WP_Error object otherwise.
	 */
	public function get_messages_permissions_check( $request ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		// TODO: Implement permission check.
		return true;
	}

	/**
	 * Prepares the message for the REST response.
	 *
	 * @since $$next-version$$
	 *
	 * @param array           $messages WordPress' representation of the item.
	 * @param WP_REST_Request $request The request object.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function prepare_messages_for_response( $messages, $request ) {
		// Wrap the data in a response object.
		$response = rest_ensure_response( $messages );

		/**
		 * Filters the REST API response for messages.
		 *
		 * @since $$next-version$$
		 *
		 * @param WP_REST_Response $response The response object.
		 * @param array $messages The raw message array.
		 * @param WP_REST_Request $request The request object.
		 */
		return apply_filters( 'jpcrm_rest_prepare_inbox_messages_array', $response, $messages, $request );
	}
}
