<?php
/**
 * Jetpack CRM Automation Contact_Field_Changed condition.
 *
 * @package automattic/jetpack-crm
 * @since 6.2.0
 */

namespace Automattic\Jetpack\CRM\Automation\Conditions;

use Automattic\Jetpack\CRM\Automation\Attribute_Definition;
use Automattic\Jetpack\CRM\Automation\Automation_Exception;
use Automattic\Jetpack\CRM\Automation\Base_Condition;
use Automattic\Jetpack\CRM\Automation\Data_Types\Contact_Data;
use Automattic\Jetpack\CRM\Automation\Data_Types\Data_Type;
use Automattic\Jetpack\CRM\Entities\Contact;

/**
 * Contact_Field_Changed condition class.
 *
 * @since 6.2.0
 */
class Contact_Field_Changed extends Base_Condition {

	/**
	 * Contact_Field_Changed constructor.
	 *
	 * @since 6.2.0
	 *
	 * @param array $step_data The step data.
	 */
	public function __construct( array $step_data ) {
		parent::__construct( $step_data );

		$contact_fields = array(
			'id'               => __( 'ID', 'zero-bs-crm' ),
			'fname'            => __( 'First Name', 'zero-bs-crm' ),
			'lname'            => __( 'Last Name', 'zero-bs-crm' ),
			'status'           => __( 'Status', 'zero-bs-crm' ),
			'email'            => __( 'Email', 'zero-bs-crm' ),
			'addr1'            => __( 'Adddress Line 1', 'zero-bs-crm' ),
			'addr2'            => __( 'Adddress Line 2', 'zero-bs-crm' ),
			'city'             => __( 'City', 'zero-bs-crm' ),
			'county'           => __( 'County', 'zero-bs-crm' ),
			'country'          => __( 'Country', 'zero-bs-crm' ),
			'postcode'         => __( 'Postcode', 'zero-bs-crm' ),
			'secaddr_addr1'    => __( 'Seccond Adddress Line 1', 'zero-bs-crm' ),
			'secaddr_addr2'    => __( 'Seccond Adddress Line 2', 'zero-bs-crm' ),
			'secaddr_city'     => __( 'Seccond City', 'zero-bs-crm' ),
			'secaddr_county'   => __( 'Seccond County', 'zero-bs-crm' ),
			'secaddr_country'  => __( 'Seccond Country', 'zero-bs-crm' ),
			'secaddr_postcode' => __( 'Seccond Postcode', 'zero-bs-crm' ),
			'hometel'          => __( 'Home Telephone', 'zero-bs-crm' ),
			'worktel'          => __( 'Work Telephone', 'zero-bs-crm' ),
			'mobtel'           => __( 'Mobile Telephone', 'zero-bs-crm' ),
		);

		$this->valid_operators = array(
			'is'     => __( 'Is', 'zero-bs-crm' ),
			'is_not' => __( 'Is not', 'zero-bs-crm' ),
		);

		$this->set_attribute_definitions(
			array(
				new Attribute_Definition( 'field', __( 'Field', 'zero-bs-crm' ), __( 'Check this field against a specified value.', 'zero-bs-crm' ), Attribute_Definition::SELECT, $contact_fields ),
				new Attribute_Definition( 'operator', __( 'Operator', 'zero-bs-crm' ), __( 'Determines how the field is compared to the specified value.', 'zero-bs-crm' ), Attribute_Definition::SELECT, $this->valid_operators ),
				new Attribute_Definition( 'value', __( 'Value', 'zero-bs-crm' ), __( 'Value to compare with the field.', 'zero-bs-crm' ), Attribute_Definition::TEXT ),
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
		$contact = $data->get_data();

		$field    = $this->get_attributes()['field'];
		$operator = $this->get_attributes()['operator'];
		$value    = $this->get_attributes()['value'];

		$this->check_for_valid_operator( $operator );
		$this->logger->log( 'Condition: ' . $field . ' ' . $operator . ' ' . $value . ' => ' . $contact->{$field} );

		switch ( $operator ) {
			case 'is':
				$this->condition_met = ( $contact->{$field} === $value );
				$this->logger->log( 'Condition met?: ' . ( $this->condition_met ? 'true' : 'false' ) );
				return;

			case 'is_not':
				$this->condition_met = ( $contact->{$field} !== $value );
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
	 * Get the title for the contact field changed condition.
	 *
	 * @since 6.2.0
	 *
	 * @return string The title 'Contact Field Changed'.
	 */
	public static function get_title(): ?string {
		return __( 'Contact Field Changed', 'zero-bs-crm' );
	}

	/**
	 * Get the slug for the contact field changed condition.
	 *
	 * @since 6.2.0
	 *
	 * @return string The slug 'contact_field_changed'.
	 */
	public static function get_slug(): string {
		return 'jpcrm/condition/contact_field_changed';
	}

	/**
	 * Get the description for the contact field changed condition.
	 *
	 * @since 6.2.0
	 *
	 * @return string The description for the condition.
	 */
	public static function get_description(): string {
		return __( 'Checks if a contact field change matches an expected value', 'zero-bs-crm' );
	}

	/**
	 * Get the category of the contact field changed condition.
	 *
	 * @since 6.2.0
	 *
	 * @return string The category 'jpcrm/contact_condition'.
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
