<?php
/**
 * Jetpack CRM Automation Send_Generic_Email action.
 *
 * @package automattic/jetpack-crm
 * @since $$next-version$$
 */

namespace Automattic\Jetpack\CRM\Automation\Actions;

/**
 * Adds the Send_Generic_Email class.
 *
 * @since $$next-version$$
 */
class Send_Generic_Email extends Send_Email {

	/**
	 * Get the slug name of the step.
	 *
	 * @since $$next-version$$
	 *
	 * @return string The slug name of the step.
	 */
	public static function get_slug(): string {
		return 'jpcrm/send_generic_email';
	}

	/**
	 * Get the title of the step.
	 *
	 * @since $$next-version$$
	 *
	 * @return string The title of the step.
	 */
	public static function get_title(): string {
		return __( 'Send email', 'zero-bs-crm' );
	}

	/**
	 * Get the description of the step.
	 *
	 * @since $$next-version$$
	 *
	 * @return string The description of the step.
	 */
	public static function get_description(): string {
		return __( 'Sends an email', 'zero-bs-crm' );
	}

	/**
	 * Get the category of the step.
	 *
	 * @since $$next-version$$
	 *
	 * @return string The category of the step.
	 */
	public static function get_category(): string {
		return __( 'General', 'zero-bs-crm' );
	}

	/**
	 * Send a generic email.
	 *
	 * @since $$next-version$$
	 *
	 * @param mixed  $data Data passed from the trigger.
	 * @param ?mixed $previous_data (Optional) The data before being changed.
	 */
	public function execute( $data, $previous_data = null ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		global $zbs;

		if ( empty( $this->attributes['to_email'] ) || empty( $this->attributes['body'] ) ) {
			return;
		}

		$to_email = $this->attributes['to_email'];
		$headers  = array( 'Content-Type: text/html; charset=UTF-8' );
		$subject  = $this->attributes['subject'] ? $this->attributes['subject'] : '';

		$is_valid_email = zeroBSCRM_validateEmail( $to_email );
		if ( ! $is_valid_email ) {
			return;
		}

		// get potential contact to use for tracking
		$potential_contact = $zbs->DAL->contacts->getContact( -1, array( 'email' => $to_email ) ); // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase

		$email_body = jpcrm_mailTemplates_single_send_templated( true, $$this->attributes['body'], $subject );

		$email_data = array(
			'to_email'     => $to_email,
			'to_name'      => '',
			'subject'      => $subject,
			'headers'      => $headers,
			'body'         => $email_body,
			'target_id'    => $potential_contact ? $potential_contact['id'] : -1,
			'sender_id'    => 1, // legacy
			'assoc_obj_id' => -999, // legacy
		);

		$this->send_email( $email_data );
	}
}
