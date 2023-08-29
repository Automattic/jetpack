<?php
/**
 * Jetpack CRM Automation Contact_Transitional_Status condition.
 *
 * @package automattic/jetpack-crm
 */

namespace Automattic\Jetpack\CRM\Automation\Conditions;

use Automattic\Jetpack\CRM\Automation\Attribute_Definition;
use Automattic\Jetpack\CRM\Automation\Automation_Exception;
use Automattic\Jetpack\CRM\Automation\Base_Condition;
use Automattic\Jetpack\CRM\Automation\Data_Types\Data_Type_Contact;

/**
 * Contact_Transitional_Status condition class.
 *
 * @since $$next-version$$
 */
class Contact_Transitional_Status extends Base_Condition {

	/**
	 * Contact_Transitional_Status constructor.
	 *
	 * @since $$next-version$$
	 *
	 * @param array $step_data The step data.
	 */
	public function __construct( array $step_data ) {
		parent::__construct( $step_data );

		$this->valid_operators = array(
			'from_to' => __( 'From (...) To (...)', 'zero-bs-crm' ),
		);

		$this->set_attribute_definitions(
			array(
				new Attribute_Definition( 'previous_status_was', __( 'Previous Status Was', 'zero-bs-crm' ), __( 'Value to compare with the previous status.', 'zero-bs-crm' ), Attribute_Definition::TEXT ),
				new Attribute_Definition( 'new_status_is', __( 'New Status Is', 'zero-bs-crm' ), __( 'Value to compare with the new status.', 'zero-bs-crm' ), Attribute_Definition::TEXT ),
			)
		);
	}

	/**
	 * Executes the condition. If the condition is met, the value stored in the
	 * attribute $condition_met is set to true; otherwise, it is set to false.
	 *
	 * @since $$next-version$$
	 *
	 * @param mixed  $data Data passed from the trigger.
	 * @param ?mixed $previous_data (Optional) The data before being changed.
	 * @return void
	 *
	 * @throws Automation_Exception If an invalid operator is encountered.
	 */
	public function execute( $data, $previous_data = null ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		if ( $previous_data === null ) {
			$this->logger->log( 'Invalid previous contact status transitional data' );
			$this->condition_met = false;

			return;
		}

		if ( ! $this->is_valid_contact_status_transitional_data( $data ) || ! $this->is_valid_contact_status_transitional_data( $previous_data ) ) {
			$this->logger->log( 'Invalid contact status transitional data' );
			$this->condition_met = false;

			return;
		}

		$operator   = $this->get_attributes()['operator'];
		$status_was = $this->get_attributes()['previous_status_was'];
		$status_is  = $this->get_attributes()['new_status_is'];

		$this->check_for_valid_operator( $operator );
		$this->logger->log( 'Condition: Contact_Transitional_Status ' . $operator . ' ' . $status_was . ' => ' . $status_is );

		switch ( $operator ) {
			case 'from_to':
				$this->condition_met = ( $previous_data['status'] === $status_was ) && ( $data['status'] === $status_is );
				$this->logger->log( 'Condition met?: ' . ( $this->condition_met ? 'true' : 'false' ) );

				return;
			default:
				$this->condition_met = false;
				throw new Automation_Exception(
					/* Translators: %s is the unimplemented operator. */
					sprintf( __( 'Valid but unimplemented operator: %s', 'zero-bs-crm' ), $operator ),
					Automation_Exception::CONDITION_OPERATOR_NOT_IMPLEMENTED
				);
		}
	}

	/**
	 * Checks if the contact has at least the necessary keys to detect a transitional
	 * status condition.
	 *
	 * @since $$next-version$$
	 *
	 * @param array $data The event data.
	 * @return bool True if the data is valid to detect a transitional status change, false otherwise.
	 */
	private function is_valid_contact_status_transitional_data( array $data ): bool {
		return is_array( $data ) && isset( $data['status'] );
	}

	/**
	 * Get the title for the contact transitional status condition.
	 *
	 * @since $$next-version$$
	 *
	 * @return string The title 'Contact Transitional Status'.
	 */
	public static function get_title(): string {
		return __( 'Contact Transitional Status', 'zero-bs-crm' );
	}

	/**
	 * Get the slug for the contact transitional status condition.
	 *
	 * @since $$next-version$$
	 *
	 * @return string The slug 'contact_status_transitional'.
	 */
	public static function get_slug(): string {
		return 'jpcrm/condition/contact_status_transitional';
	}

	/**
	 * Get the description for the contact transitional status condition.
	 *
	 * @since $$next-version$$
	 *
	 * @return string The description for the condition.
	 */
	public static function get_description(): string {
		return __( 'Checks if a contact status changes from a specified initial value to a designated target one', 'zero-bs-crm' );
	}

	/**
	 * Get the category of the contact transitional status condition.
	 *
	 * @since $$next-version$$
	 *
	 * @return string The category 'contact'.
	 */
	public static function get_category(): string {
		return 'contact';
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
	 * Get the allowed triggers for the contact transitional status condition.
	 *
	 * @since $$next-version$$
	 *
	 * @return string[] An array of allowed triggers:
	 *               - 'jpcrm/contact_status_updated'
	 */
	public static function get_allowed_triggers(): array {
		return array(
			'jpcrm/contact_status_updated',
		);
	}

}
