<?php
/**
 * Jetpack CRM Automation Quote_Status_Changed condition.
 *
 * @package automattic/jetpack-crm
 */

namespace Automattic\Jetpack\CRM\Automation\Conditions;

use Automattic\Jetpack\CRM\Automation\Automation_Exception;
use Automattic\Jetpack\CRM\Automation\Base_Condition;

/**
 * Quote_Status_Changed condition class.
 *
 * @since $$next-version$$
 */
class Quote_Status_Changed extends Base_Condition {

	/**
	 * All valid operators for this condition.
	 *
	 * @since $$next-version$$
	 * @var string[] $valid_operators Valid operators.
	 */
	protected $valid_operators = array(
		'is',
		'is_not',
	);

	/**
	 * All valid attributes for this condition.
	 *
	 * @since $$next-version$$
	 * @var string[] $valid_operators Valid attributes.
	 */
	private $valid_attributes = array(
		'operator',
		'value',
	);

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
		if ( ! $this->is_valid_quote_status_changed_data( $data ) ) {
			$this->logger->log( 'Invalid quote status changed data', $data );
			$this->condition_met = false;
			return;
		}

		$status_value = ( $data['data']['accepted'] > 0 ) ? 'accepted' : ( $data['data']['template'] > 0 ? 'published' : 'draft' );
		$operator     = $this->get_attributes()['operator'];
		$value        = $this->get_attributes()['value'];

		$this->check_for_valid_operator( $operator );
		$this->logger->log( 'Condition: quote status ' . $operator . ' ' . $value . ' => ' . $status_value );

		switch ( $operator ) {
			case 'is':
				$this->condition_met = ( $status_value === $value );
				$this->logger->log( 'Condition met?: ' . ( $this->condition_met ? 'true' : 'false' ) );

				return;
			case 'is_not':
				$this->condition_met = ( $status_value !== $value );
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
	 * Checks if the quote has at least the necessary keys to detect a status
	 * change.
	 *
	 * @since $$next-version$$
	 *
	 * @param array $quote_data The quote data.
	 * @return bool True if the data is valid to detect a status change, false otherwise
	 */
	private function is_valid_quote_status_changed_data( array $quote_data ): bool {
		return isset( $quote_data['id'] ) && isset( $quote_data['data'] ) && isset( $quote_data['data']['accepted'] ) && isset( $quote_data['data']['template'] );
	}

	/**
	 * Get the slug for the quote status changed condition.
	 *
	 * @since $$next-version$$
	 *
	 * @return string The slug 'quote_status_changed'.
	 */
	public static function get_slug(): string {
		return 'jpcrm/condition/quote_status_changed';
	}

	/**
	 * Get the title for the quote status changed condition.
	 *
	 * @since $$next-version$$
	 *
	 * @return string The title 'Quote Status Changed'.
	 */
	public static function get_title(): string {
		return __( 'Quote Status Changed', 'zero-bs-crm' );
	}

	/**
	 * Get the description for the quote status changed condition.
	 *
	 * @since $$next-version$$
	 *
	 * @return string The description for the condition.
	 */
	public static function get_description(): string {
		return __( 'Checks if a quote status change matches an expected value', 'zero-bs-crm' );
	}

	/**
	 * Get the type of the quote status changed condition.
	 *
	 * @since $$next-version$$
	 *
	 * @return string The type 'condition'.
	 */
	public static function get_type(): string {
		return 'condition';
	}

	/**
	 * Get the category of the quote status changed condition.
	 *
	 * @since $$next-version$$
	 *
	 * @return string The category 'jpcrm/quote_condition'.
	 */
	public static function get_category(): string {
		return __( 'quote', 'zero-bs-crm' );
	}

	/**
	 * Get the allowed triggers for the quote status changed condition.
	 *
	 * @since $$next-version$$
	 *
	 * @return string[] An array of allowed triggers:
	 *               - 'jpcrm/quote_status_updated'
	 *               - 'jpcrm/quote_updated'
	 */
	public static function get_allowed_triggers(): array {
		return array(
			'jpcrm/quote_status_updated',
			'jpcrm/quote_updated',
		);
	}
}
