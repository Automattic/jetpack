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

/**
 * Invoice_Field_Contains condition class.
 *
 * @since $$next-version$$
 */
class Invoice_Field_Contains extends Base_Condition {

	/**
	 * Invoice_Field_Contains constructor.
	 *
	 * @since $$next-version$$
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
	 * @since $$next-version$$
	 *
	 * @param array $data The data this condition has to evaluate.
	 * @return void
	 * @throws Automation_Exception If an invalid operator is encountered.
	 */
	public function execute( array $data ) {
		if ( ! $this->is_valid_invoice_field_contains_data( $data ) ) {
			$this->logger->log( 'Invalid invoice field contains data', $data );
			$this->condition_met = false;
			return;
		}

		$field    = $this->get_attributes()['field'];
		$operator = $this->get_attributes()['operator'];
		$value    = $this->get_attributes()['value'];

		$this->check_for_valid_operator( $operator );
		$this->logger->log( 'Condition: ' . $field . ' ' . $operator . ' ' . $value . ' => ' . $data['data'][ $field ] );

		switch ( $operator ) {
			case 'contains':
				$this->condition_met = ( strpos( $data['data'][ $field ], $value ) !== false );
				$this->logger->log( 'Condition met?: ' . ( $this->condition_met ? 'true' : 'false' ) );

				return;
			case 'does_not_contain':
				$this->condition_met = ( strpos( $data['data'][ $field ], $value ) === false );
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
	 * Checks if the invoice has at least the necessary keys to detect if a field
	 * contains some value.
	 *
	 * @since $$next-version$$
	 *
	 * @param array $invoice_data The invoice data.
	 * @return bool True if the data is valid to detect if a field contains some value, false otherwise
	 */
	private function is_valid_invoice_field_contains_data( array $invoice_data ): bool {
		return isset( $invoice_data['id'] ) && isset( $invoice_data['data'] ) && isset( $invoice_data['data'][ $this->get_attributes()['field'] ] );
	}

	/**
	 * Get the title for the invoice field contains condition.
	 *
	 * @since $$next-version$$
	 *
	 * @return string The title 'Invoice Field Contains'.
	 */
	public static function get_title(): string {
		return __( 'Invoice Field Contains', 'zero-bs-crm' );
	}

	/**
	 * Get the slug for the invoice field contains condition.
	 *
	 * @since $$next-version$$
	 *
	 * @return string The slug 'invoice_field_contains'.
	 */
	public static function get_slug(): string {
		return 'jpcrm/condition/invoice_field_contains';
	}

	/**
	 * Get the description for the invoice field contains condition.
	 *
	 * @since $$next-version$$
	 *
	 * @return string The description for the condition.
	 */
	public static function get_description(): string {
		return __( 'Checks if an invoice field contains an expected value', 'zero-bs-crm' );
	}

	/**
	 * Get the type of the invoice field contains condition.
	 *
	 * @since $$next-version$$
	 *
	 * @return string The type 'condition'.
	 */
	public static function get_type(): string {
		return 'condition';
	}

	/**
	 * Get the category of the invoice field contains condition.
	 *
	 * @since $$next-version$$
	 *
	 * @return string The category 'invoice'.
	 */
	public static function get_category(): string {
		return __( 'invoice', 'zero-bs-crm' );
	}

	/**
	 * Get the allowed triggers for the invoice field contains condition.
	 *
	 * @since $$next-version$$
	 *
	 * @return string[] An array of allowed triggers:
	 *               - 'jpcrm/invoice_updated'
	 */
	public static function get_allowed_triggers(): array {
		return array(
			'jpcrm/invoice_updated',
		);
	}
}
