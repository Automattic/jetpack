<?php
/**
 * Jetpack CRM Automation Invoice_Status_Changed condition.
 *
 * @package automattic/jetpack-crm
 */

namespace Automattic\Jetpack\CRM\Automation\Conditions;

use Automattic\Jetpack\CRM\Automation\Attribute_Definition;
use Automattic\Jetpack\CRM\Automation\Automation_Exception;
use Automattic\Jetpack\CRM\Automation\Base_Condition;

/**
 * Invoice_Status_Changed condition class.
 *
 * @since $$next-version$$
 */
class Invoice_Status_Changed extends Base_Condition {

	/**
	 * Invoice_Status_Changed constructor.
	 *
	 * @since $$next-version$$
	 *
	 * @param array $step_data The step data.
	 */
	public function __construct( array $step_data ) {
		parent::__construct( $step_data );

		$this->valid_operators = array(
			'is'     => __( 'Is', 'zero-bs-crm' ),
			'is_not' => __( 'Is not', 'zero-bs-crm' ),
		);

		$this->set_title( __( 'Invoice Status Changed', 'zero-bs-crm' ) );
		$this->set_attribute_definitions(
			array(
				new Attribute_Definition( 'operator', __( 'Operator', 'zero-bs-crm' ), __( 'Determines how the status is compared to the specified value.', 'zero-bs-crm' ), Attribute_Definition::SELECT, $this->valid_operators ),
				new Attribute_Definition( 'value', __( 'Value', 'zero-bs-crm' ), __( 'Value to compare with the status.', 'zero-bs-crm' ), Attribute_Definition::TEXT ),
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
		if ( ! $this->is_valid_invoice_status_changed_data( $data ) ) {
			$this->logger->log( 'Invalid invoice status changed data', $data );
			$this->condition_met = false;
			return;
		}

		$field    = 'status';
		$operator = $this->get_attributes()['operator'];
		$value    = $this->get_attributes()['value'];

		$this->check_for_valid_operator( $operator );
		$this->logger->log( 'Condition: ' . $field . ' ' . $operator . ' ' . $value . ' => ' . $data['data'][ $field ] );

		switch ( $operator ) {
			case 'is':
				$this->condition_met = ( $data['data'][ $field ] === $value );
				$this->logger->log( 'Condition met?: ' . ( $this->condition_met ? 'true' : 'false' ) );

				return;
			case 'is_not':
				$this->condition_met = ( $data['data'][ $field ] !== $value );
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
	 * Checks if the invoice has at least the necessary keys to detect a status
	 * change.
	 *
	 * @since $$next-version$$
	 *
	 * @param array $invoice_data The invoice data.
	 * @return bool True if the data is valid to detect a status change, false otherwise
	 */
	private function is_valid_invoice_status_changed_data( array $invoice_data ): bool {
		return isset( $invoice_data['id'] ) && isset( $invoice_data['data'] ) && isset( $invoice_data['data']['status'] );
	}

	/**
	 * Get the slug for the invoice status changed condition.
	 *
	 * @since $$next-version$$
	 *
	 * @return string The slug 'invoice_status_changed'.
	 */
	public static function get_slug(): string {
		return 'jpcrm/condition/invoice_status_changed';
	}

	/**
	 * Get the title for the invoice status changed condition.
	 *
	 * @since $$next-version$$
	 *
	 * @return string The title 'Invoice Status Changed'.
	 */
	public static function get_title(): string {
		return __( 'Invoice Status Changed', 'zero-bs-crm' );
	}

	/**
	 * Get the description for the invoice status changed condition.
	 *
	 * @since $$next-version$$
	 *
	 * @return string The description for the condition.
	 */
	public static function get_description(): string {
		return __( 'Checks if a invoice status change matches an expected value', 'zero-bs-crm' );
	}

	/**
	 * Get the type of the invoice status changed condition.
	 *
	 * @since $$next-version$$
	 *
	 * @return string The type 'condition'.
	 */
	public static function get_type(): string {
		return 'condition';
	}

	/**
	 * Get the category of the invoice status changed condition.
	 *
	 * @since $$next-version$$
	 *
	 * @return string The category 'jpcrm/invoice_condition'.
	 */
	public static function get_category(): string {
		return __( 'invoice', 'zero-bs-crm' );
	}

	/**
	 * Get the allowed triggers for the invoice status changed condition.
	 *
	 * @since $$next-version$$
	 *
	 * @return string[] An array of allowed triggers:
	 *               - 'jpcrm/invoice_status_updated'
	 *               - 'jpcrm/invoice_updated'
	 */
	public static function get_allowed_triggers(): array {
		return array(
			'jpcrm/invoice_status_updated',
			'jpcrm/invoice_updated',
		);
	}
}
