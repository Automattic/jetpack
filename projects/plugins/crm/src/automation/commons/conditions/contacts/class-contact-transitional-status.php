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
use Automattic\Jetpack\CRM\Automation\Data_Types\Contact_Data;
use Automattic\Jetpack\CRM\Automation\Data_Types\Data_Type;
use Automattic\Jetpack\CRM\Entities\Contact;

/**
 * Contact_Transitional_Status condition class.
 *
 * @since 6.2.0
 */
class Contact_Transitional_Status extends Base_Condition {

	/**
	 * Contact_Transitional_Status constructor.
	 *
	 * @since 6.2.0
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
	 * @since 6.2.0
	 *
	 * @param Data_Type $data Data passed from the trigger.
	 * @return void
	 *
	 * @throws Automation_Exception If an invalid operator is encountered.
	 */
	protected function execute( Data_Type $data ) {
		/** @var Contact $contact */
		$contact          = $data->get_data();
		$previous_contact = $data->get_previous_data();

		$operator   = $this->get_attributes()['operator'];
		$status_was = $this->get_attributes()['previous_status_was'];
		$status_is  = $this->get_attributes()['new_status_is'];

		$this->check_for_valid_operator( $operator );
		$this->logger->log( 'Condition: Contact_Transitional_Status ' . $operator . ' ' . $status_was . ' => ' . $status_is );

		switch ( $operator ) {
			case 'from_to':
				$this->condition_met = ( $previous_contact->status === $status_was ) && ( $contact->status === $status_is );
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
	 * Get the title for the contact transitional status condition.
	 *
	 * @since 6.2.0
	 *
	 * @return string The title 'Contact Transitional Status'.
	 */
	public static function get_title(): string {
		return __( 'Contact Transitional Status', 'zero-bs-crm' );
	}

	/**
	 * Get the slug for the contact transitional status condition.
	 *
	 * @since 6.2.0
	 *
	 * @return string The slug 'contact_status_transitional'.
	 */
	public static function get_slug(): string {
		return 'jpcrm/condition/contact_status_transitional';
	}

	/**
	 * Get the description for the contact transitional status condition.
	 *
	 * @since 6.2.0
	 *
	 * @return string The description for the condition.
	 */
	public static function get_description(): string {
		return __( 'Checks if a contact status changes from a specified initial value to a designated target one', 'zero-bs-crm' );
	}

	/**
	 * Get the category of the contact transitional status condition.
	 *
	 * @since 6.2.0
	 *
	 * @return string The category 'contact'.
	 */
	public static function get_category(): string {
		return __( 'Contact', 'zero-bs-crm' );
	}

	/**
	 * Get the data type.
	 *
	 * @since 6.2.0
	 *
	 * @return string The type of the step.
	 */
	public static function get_data_type(): string {
		return Contact_Data::class;
	}
}
