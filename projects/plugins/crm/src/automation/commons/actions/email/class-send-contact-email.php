<?php
/**
 * Jetpack CRM Automation Send_Contact_Email action.
 *
 * @package automattic/jetpack-crm
 * @since 6.2.0
 */

namespace Automattic\Jetpack\CRM\Automation\Actions;

use Automattic\Jetpack\CRM\Automation\Data_Types\Contact_Data;
use Automattic\Jetpack\CRM\Entities\Contact;
use Automattic\Jetpack\CRM\Entities\Factories\Contact_Factory;

/**
 * Adds the Send_Contact_Email class.
 *
 * @since 6.2.0
 */
class Send_Contact_Email extends Base_Send_Email {

	/**
	 * Get the slug name of the step.
	 *
	 * @since 6.2.0
	 *
	 * @return string The slug name of the step.
	 */
	public static function get_slug(): string {
		return 'jpcrm/send_contact_email';
	}

	/**
	 * Get the title of the step.
	 *
	 * @since 6.2.0
	 *
	 * @return string The title of the step.
	 */
	public static function get_title(): string {
		return __( 'Send email', 'zero-bs-crm' );
	}

	/**
	 * Get the description of the step.
	 *
	 * @since 6.2.0
	 *
	 * @return string The description of the step.
	 */
	public static function get_description(): string {
		return __( 'Sends an email to a contact', 'zero-bs-crm' );
	}

	/**
	 * Get the category of the step.
	 *
	 * @since 6.2.0
	 *
	 * @return string The category of the step.
	 */
	public static function get_category(): string {
		return __( 'General', 'zero-bs-crm' );
	}

	/**
	 * Send an email to a contact.
	 *
	 * @since 6.2.0
	 *
	 * @param mixed  $data Data passed from the trigger.
	 * @param ?mixed $previous_data (Optional) The data before being changed.
	 */
	public function execute( $data, $previous_data = null ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable

		/** @var Contact $contact */
		$contact = $data->get_data();

		global $zbs;

		if ( empty( $contact->email ) || empty( $this->attributes['body'] ) ) {
			return;
		}

		$to_email = $contact->email;
		$to_name  = $contact->fname;
		$headers  = array( 'Content-Type: text/html; charset=UTF-8' );
		$subject  = $this->attributes['subject'] ?? '';

		$is_valid_email = zeroBSCRM_validateEmail( $to_email );
		if ( ! $is_valid_email ) {
			return;
		}

		// get potential contact to use for tracking
		$potential_contact = $zbs->DAL->contacts->getContact( -1, array( 'email' => $to_email ) ); // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase

		$contact_dal = Contact_Factory::tidy_data( $contact );
		$email_body  = jpcrm_mailTemplates_single_send_templated( true, $this->attributes['body'], $subject, $contact_dal );

		$email_data = array(
			'to_email'     => $to_email,
			'to_name'      => $to_name,
			'subject'      => $subject,
			'headers'      => $headers,
			'body'         => $email_body,
			'target_id'    => $potential_contact ? $potential_contact['id'] : -1,
			'sender_id'    => 1, // legacy
			'assoc_obj_id' => -999, // legacy
		);

		$this->send_email( $email_data );
	}

	/**
	 * {@inheritDoc}
	 */
	public static function get_data_type(): string {
		return Contact_Data::class;
	}
}
