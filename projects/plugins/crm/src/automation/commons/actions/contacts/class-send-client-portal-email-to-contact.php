<?php
/**
 * Jetpack CRM Automation Send_Client_Portal_Email_To_Contact action.
 *
 * @package automattic/jetpack-crm
 * @since $$next-version$$
 */

namespace Automattic\Jetpack\CRM\Automation\Actions;

use Automattic\Jetpack\CRM\Automation\Data_Types\Data_Type_Contact;

/**
 * Adds the Send_Client_Portal_Email_To_Contact class.
 *
 * @since $$next-version$$
 */
class Send_Client_Portal_Email_To_Contact extends Send_Email {

	/**
	 * Get the slug name of the step.
	 *
	 * @since $$next-version$$
	 *
	 * @return string The slug name of the step.
	 */
	public static function get_slug(): string {
		return 'jpcrm/send_client_portal_email_to_contact';
	}

	/**
	 * Get the title of the step.
	 *
	 * @since $$next-version$$
	 *
	 * @return string The title of the step.
	 */
	public static function get_title(): string {
		return __( 'Send client portal email', 'zero-bs-crm' );
	}

	/**
	 * Get the description of the step.
	 *
	 * @since $$next-version$$
	 *
	 * @return string The description of the step.
	 */
	public static function get_description(): string {
		return __( 'Sends a client portal email to a contact', 'zero-bs-crm' );
	}

	/**
	 * Get the data type.
	 *
	 * @since $$next-version$$
	 *
	 * @return string The type of the step.
	 */
	public static function get_data_type(): string {
		return Data_Type_Contact::get_slug();
	}

	/**
	 * Get the category of the step.
	 *
	 * @since $$next-version$$
	 *
	 * @return string The category of the step.
	 */
	public static function get_category(): string {
		return __( 'Contact', 'zero-bs-crm' );
	}

	/**
	 * Send a client portal email to the contact.
	 *
	 * @since $$next-version$$
	 *
	 * @param mixed  $contact_data Data passed from the trigger.
	 * @param ?mixed $previous_data (Optional) The data before being changed.
	 */
	public function execute( $contact_data, $previous_data = null ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable

		$is_valid_email = zeroBSCRM_validateEmail( $contact_data['email'] );
		if ( ! $is_valid_email || empty( $this->attributes['password'] ) ) {
			return;
		}

		// get email content
		$email_body = zeroBSCRM_Portal_generateNotificationHTML( $this->attributes['password'], true, $contact_data['email'], $contact_data['id'] );
		$email_type = ZBSEMAIL_CLIENTPORTALWELCOME;

		$email_data = array(
			'to_email'     => $contact_data['email'],
			'to_name'      => '',
			'subject'      => zeroBSCRM_mailTemplate_getSubject( $email_type ),
			'headers'      => zeroBSCRM_mailTemplate_getHeaders( $email_type ),
			'body'         => $email_body,
			'template'     => $email_type,
			'target_id'    => $contact_data['id'],
			'sender_id'    => -10, // legacy
			'assoc_obj_id' => -1, // no associated object
		);

		$this->send_email( $email_data );
	}
}
