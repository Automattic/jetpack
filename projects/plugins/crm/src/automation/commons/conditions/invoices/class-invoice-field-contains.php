<?php
/**
 * Jetpack CRM Automation Invoice_Field_Contains condition.
 *
 * @package automattic/jetpack-crm
 */

namespace Automattic\Jetpack\CRM\Automation\Conditions;

use Automattic\Jetpack\CRM\Automation\Attribute_Definition;
use Automattic\Jetpack\CRM\Automation\Automation_Exception;
use Automattic\Jetpack\CRM\Automation\Base_Condition;
use Automattic\Jetpack\CRM\Automation\Data_Types\Data_Type;
use Automattic\Jetpack\CRM\Automation\Data_Types\Invoice_Data;
use Automattic\Jetpack\CRM\Entities\Invoice;

/**
 * Invoice_Field_Contains condition class.
 *
 * @since 6.2.0
 */
class Invoice_Field_Contains extends Base_Condition {

	/**
	 * Invoice_Field_Contains constructor.
	 *
	 * @since 6.2.0
	 *
	 * @param array $step_data The step data.
	 */
	public function __construct( array $step_data ) {
		parent::__construct( $step_data );

		// TODO: Fetch automation fields from our DAL.
		$invoice_fields = array(
			'id'          => __( 'ID', 'zero-bs-crm' ),
			'id_override' => __( 'Reference', 'zero-bs-crm' ),
			'status'      => __( 'Status', 'zero-bs-crm' ),
		);

		$this->valid_operators = array(
			'contains'         => __( 'Contains', 'zero-bs-crm' ),
			'does_not_contain' => __( 'Does not contain', 'zero-bs-crm' ),
		);

		$this->set_attribute_definitions(
			array(
				new Attribute_Definition( 'field', __( 'Field', 'zero-bs-crm' ), __( 'Check this field against a specified value.', 'zero-bs-crm' ), Attribute_Definition::SELECT, $invoice_fields ),
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
		/** @var Invoice $invoice */
		$invoice = $data->get_data();

		$field    = $this->get_attributes()['field'];
		$operator = $this->get_attributes()['operator'];
		$value    = $this->get_attributes()['value'];

		$this->check_for_valid_operator( $operator );
		$this->logger->log( 'Condition: ' . $field . ' ' . $operator . ' ' . $value . ' => ' . $invoice->{$field} );

		switch ( $operator ) {
			case 'contains':
				$this->condition_met = ( str_contains( $invoice->{$field}, $value ) );
				$this->logger->log( 'Condition met?: ' . ( $this->condition_met ? 'true' : 'false' ) );

				return;
			case 'does_not_contain':
				$this->condition_met = ( ! str_contains( $invoice->{$field}, $value ) );
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
	 * Get the title for the invoice field contains condition.
	 *
	 * @since 6.2.0
	 *
	 * @return string The title 'Invoice Field Contains'.
	 */
	public static function get_title(): string {
		return __( 'Invoice Field Contains', 'zero-bs-crm' );
	}

	/**
	 * Get the slug for the invoice field contains condition.
	 *
	 * @since 6.2.0
	 *
	 * @return string The slug 'invoice_field_contains'.
	 */
	public static function get_slug(): string {
		return 'jpcrm/condition/invoice_field_contains';
	}

	/**
	 * Get the description for the invoice field contains condition.
	 *
	 * @since 6.2.0
	 *
	 * @return string The description for the condition.
	 */
	public static function get_description(): string {
		return __( 'Checks if an invoice field contains an expected value', 'zero-bs-crm' );
	}

	/**
	 * Get the data type.
	 *
	 * @since 6.2.0
	 *
	 * @return string The type of the step.
	 */
	public static function get_data_type(): string {
		return Invoice_Data::class;
	}

	/**
	 * Get the category of the invoice field contains condition.
	 *
	 * @since 6.2.0
	 *
	 * @return string The category 'invoice'.
	 */
	public static function get_category(): string {
		return __( 'Invoice', 'zero-bs-crm' );
	}
}
