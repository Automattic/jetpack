<?php
/**
 * Jetpack CRM Automation Send_Quote_Email_To_Contact action.
 *
 * @package automattic/jetpack-crm
 * @since $$next-version$$
 */

namespace Automattic\Jetpack\CRM\Automation\Actions;

use Automattic\Jetpack\CRM\Automation\Data_Types\Data_Type_Quote;

/**
 * Adds the Send_Quote_Email_To_Contact class.
 *
 * @since $$next-version$$
 */
class Send_Quote_Email_To_Contact extends Send_Email {

	/**
	 * Get the slug name of the step.
	 *
	 * @since $$next-version$$
	 *
	 * @return string The slug name of the step.
	 */
	public static function get_slug(): string {
		return 'jpcrm/send_quote_email_to_contact';
	}

	/**
	 * Get the title of the step.
	 *
	 * @since $$next-version$$
	 *
	 * @return string The title of the step.
	 */
	public static function get_title(): string {
		return __( 'Send quote email', 'zero-bs-crm' );
	}

	/**
	 * Get the description of the step.
	 *
	 * @since $$next-version$$
	 *
	 * @return string The description of the step.
	 */
	public static function get_description(): string {
		return __( 'Sends a quote to a contact via email', 'zero-bs-crm' );
	}

	/**
	 * Get the data type.
	 *
	 * @since $$next-version$$
	 *
	 * @return string The type of the step.
	 */
	public static function get_data_type(): string {
		return Data_Type_Quote::get_slug();
	}

	/**
	 * Get the category of the step.
	 *
	 * @since $$next-version$$
	 *
	 * @return string The category of the step.
	 */
	public static function get_category(): string {
		return __( 'Quote', 'zero-bs-crm' );
	}

	/**
	 * Send a quote email to the contact.
	 *
	 * @since $$next-version$$
	 *
	 * @param mixed  $quote_data Data passed from the trigger.
	 * @param ?mixed $previous_data (Optional) The data before being changed.
	 */
	public function execute( $quote_data, $previous_data = null ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		global $zbs;

		$contact_id = $zbs->DAL->quotes->getQuoteContactID( $quote_data->get_id() ); // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
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
		$email_body = zeroBSCRM_quote_generateNotificationHTML( $quote_data['id'], true );
		$email_type = ZBSEMAIL_NEWQUOTE;

		$email_data = array(
			'to_email'     => $contact['email'],
			'to_name'      => '',
			'subject'      => zeroBSCRM_mailTemplate_getSubject( $email_type ),
			'headers'      => zeroBSCRM_mailTemplate_getHeaders( $email_type ),
			'body'         => $email_body,
			'template'     => $email_type,
			'target_id'    => $contact_id,
			'sender_id'    => -12, // legacy
			'assoc_obj_id' => $quote_data['id'],
		);

		$this->send_email( $email_data );
	}
}
