<?php
/**
 * Jetpack CRM Automation Send_Invoice_Email_To_Contact action.
 *
 * @package automattic/jetpack-crm
 * @since $$next-version$$
 */

namespace Automattic\Jetpack\CRM\Automation\Actions;

use Automattic\Jetpack\CRM\Automation\Data_Types\Data_Type_Invoice;

/**
 * Adds the Send_Invoice_Email_To_Contact class.
 *
 * @since $$next-version$$
 */
class Send_Invoice_Email_To_Contact extends Send_Email {

	/**
	 * Get the slug name of the step.
	 *
	 * @since $$next-version$$
	 *
	 * @return string The slug name of the step.
	 */
	public static function get_slug(): string {
		return 'jpcrm/send_invoice_email_to_contact';
	}

	/**
	 * Get the title of the step.
	 *
	 * @since $$next-version$$
	 *
	 * @return string The title of the step.
	 */
	public static function get_title(): string {
		return __( 'Send invoice email', 'zero-bs-crm' );
	}

	/**
	 * Get the description of the step.
	 *
	 * @since $$next-version$$
	 *
	 * @return string The description of the step.
	 */
	public static function get_description(): string {
		return __( 'Sends an invoice to a contact via email', 'zero-bs-crm' );
	}

	/**
	 * Get the data type.
	 *
	 * @since $$next-version$$
	 *
	 * @return string The type of the step.
	 */
	public static function get_data_type(): string {
		return Data_Type_Invoice::get_slug();
	}

	/**
	 * Get the category of the step.
	 *
	 * @since $$next-version$$
	 *
	 * @return string The category of the step.
	 */
	public static function get_category(): string {
		return __( 'Invoice', 'zero-bs-crm' );
	}

	/**
	 * Send an invoice email to the contact.
	 *
	 * @since $$next-version$$
	 *
	 * @param mixed  $invoice_data Data passed from the trigger.
	 * @param ?mixed $previous_data (Optional) The data before being changed.
	 */
	public function execute( $invoice_data, $previous_data = null ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		global $zbs;

		$contact_id = $zbs->DAL->invoices->getInvoiceContactID( $invoice_data->get_id() ); // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
		if ( ! $contact_id ) {
			return;
		}

		$contact = $zbs->DAL->contacts->getContact( $contact_id ); // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
		if ( ! $contact ) {
			return;
		}

		$is_valid_email = zeroBSCRM_validateEmail( $contact['email'] );
		if ( ! $is_valid_email ) {
			return;
		}

		// get email content
		$email_body = zeroBSCRM_invoice_generateNotificationHTML( $invoice_data['id'], true );
		$email_type = ZBSEMAIL_EMAILINVOICE;

		$email_data = array(
			'to_email'     => $contact['email'],
			'to_name'      => '',
			'subject'      => zeroBSCRM_mailTemplate_getSubject( $email_type ),
			'headers'      => zeroBSCRM_mailTemplate_getHeaders( $email_type ),
			'body'         => $email_body,
			'template'     => $email_type,
			'target_id'    => $contact_id,
			'sender_id'    => -14, // legacy
			'assoc_obj_id' => $invoice_data['id'],
		);

		$this->send_email( $email_data );
	}
}
