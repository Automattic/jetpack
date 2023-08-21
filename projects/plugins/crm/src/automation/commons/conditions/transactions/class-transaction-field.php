<?php
/**
 * Jetpack CRM Automation Transaction_Field condition.
 *
 * @package automattic/jetpack-crm
 */

namespace Automattic\Jetpack\CRM\Automation\Conditions;

use Automattic\Jetpack\CRM\Automation\Attribute_Definition;
use Automattic\Jetpack\CRM\Automation\Automation_Exception;
use Automattic\Jetpack\CRM\Automation\Base_Condition;

/**
 * Transaction_Field condition class.
 *
 * @since $$next-version$$
 */
class Transaction_Field extends Base_Condition {

	/**
	 * Transaction_Field constructor.
	 *
	 * @since $$next-version$$
	 *
	 * @param array $step_data The step data.
	 */
	public function __construct( array $step_data ) {
		parent::__construct( $step_data );

		// TODO: Fetch automation fields from our DAL.
		$transaction_fields = array(
			'status' => __( 'Status', 'zero-bs-crm' ),
			'type'   => __( 'Type', 'zero-bs-crm' ),
			'ref'    => __( 'Reference', 'zero-bs-crm' ),
			'title'  => __( 'Title', 'zero-bs-crm' ),
			'desc'   => __( 'Description', 'zero-bs-crm' ),
		);

		$this->valid_operators = array(
			'is'               => __( 'Is', 'zero-bs-crm' ),
			'is_not'           => __( 'Is not', 'zero-bs-crm' ),
			'contains'         => __( 'Contains', 'zero-bs-crm' ),
			'does_not_contain' => __( 'Does not contain', 'zero-bs-crm' ),
		);

		$this->set_title( __( 'Transaction Field', 'zero-bs-crm' ) );
		$this->set_attribute_definitions(
			array(
				new Attribute_Definition( 'field', __( 'Field', 'zero-bs-crm' ), __( 'Check this field against a specified value.', 'zero-bs-crm' ), Attribute_Definition::SELECT, $transaction_fields ),
				new Attribute_Definition( 'operator', __( 'Operator', 'zero-bs-crm' ), __( 'Determines how the field is compared to the specified value.', 'zero-bs-crm' ), Attribute_Definition::SELECT, $this->valid_operators ),
				new Attribute_Definition( 'value', __( 'Value', 'zero-bs-crm' ), __( 'Value to compare with the transaction field.', 'zero-bs-crm' ), Attribute_Definition::TEXT ),
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
	 *
	 * @throws Automation_Exception If an invalid operator is encountered.
	 */
	public function execute( array $data ) {
		if ( ! $this->is_valid_transaction_field_data( $data ) ) {
			$this->logger->log( 'Invalid transaction field condition data', $data );
			$this->condition_met = false;

			return;
		}

		$field    = $this->get_attributes()['field'];
		$operator = $this->get_attributes()['operator'];
		$value    = $this->get_attributes()['value'];

		$this->check_for_valid_operator( $operator );
		$this->logger->log( 'Condition: ' . $field . ' ' . $operator . ' ' . $value . ' => ' . $data['data'][ $field ] );

		switch ( $operator ) {
			case 'is':
				$this->condition_met = ( $data['data'][ $field ] === $value );
				$this->logger->log( 'Condition met?: ' . ( $this->condition_met ? 'true' : 'false' ) );

				break;
			case 'is_not':
				$this->condition_met = ( $data['data'][ $field ] !== $value );
				$this->logger->log( 'Condition met?: ' . ( $this->condition_met ? 'true' : 'false' ) );

				break;
			case 'contains':
				$this->condition_met = ( strpos( $data['data'][ $field ], $value ) !== false );
				$this->logger->log( 'Condition met?: ' . ( $this->condition_met ? 'true' : 'false' ) );

				break;
			case 'does_not_contain':
				$this->condition_met = ( strpos( $data['data'][ $field ], $value ) === false );

				break;
			default:
				$this->condition_met = false;
				throw new Automation_Exception(
					/* Translators: %s is the unimplemented operator. */
					sprintf( __( 'Valid but unimplemented operator: %s', 'zero-bs-crm' ), $operator ),
					Automation_Exception::CONDITION_OPERATOR_NOT_IMPLEMENTED
				);
		}

		$this->logger->log( 'Condition met?: ' . ( $this->condition_met ? 'true' : 'false' ) );
	}

	/**
	 * Checks if the transaction has at least the necessary keys to evaluate a
	 * transaction field condition.
	 *
	 * @since $$next-version$$
	 *
	 * @param array $transaction_data The transaction data.
	 * @return bool True if the data is valid to evaluate a transaction field condition, false otherwise.
	 */
	private function is_valid_transaction_field_data( array $transaction_data ): bool {
		return isset( $transaction_data['id'] ) && isset( $transaction_data['data'] ) && isset( $transaction_data['data'][ $this->get_attributes()['field'] ] );
	}

	/**
	 * Get the slug for the transaction field condition.
	 *
	 * @since $$next-version$$
	 *
	 * @return string The slug 'transaction_field'.
	 */
	public static function get_slug(): string {
		return 'jpcrm/condition/transaction_field';
	}

	/**
	 * Get the title for the transaction field condition.
	 *
	 * @since $$next-version$$
	 *
	 * @return string The title 'Transaction Field Changed'.
	 */
	public static function get_title(): string {
		return __( 'Transaction Field', 'zero-bs-crm' );
	}

	/**
	 * Get the description for the transaction field condition.
	 *
	 * @since $$next-version$$
	 *
	 * @return string The description for the condition.
	 */
	public static function get_description(): string {
		return __( 'Checks if a transaction field matches an expected value', 'zero-bs-crm' );
	}

	/**
	 * Get the type of the transaction field condition.
	 *
	 * @since $$next-version$$
	 *
	 * @return string The type 'condition'.
	 */
	public static function get_type(): string {
		return 'condition';
	}

	/**
	 * Get the category of the transaction field condition.
	 *
	 * @since $$next-version$$
	 *
	 * @return string The category 'transaction'.
	 */
	public static function get_category(): string {
		return __( 'transaction', 'zero-bs-crm' );
	}

	/**
	 * Get the allowed triggers for the transaction field condition.
	 *
	 * @since $$next-version$$
	 *
	 * @return string[] An array of allowed triggers:
	 *               - 'jpcrm/transaction_status_updated'
	 *               - 'jpcrm/transaction_updated'
	 *               - 'jpcrm/transaction_created'
	 */
	public static function get_allowed_triggers(): array {
		return array(
			'jpcrm/transaction_status_updated',
			'jpcrm/transaction_updated',
			'jpcrm/transaction_created',
		);
	}
}
