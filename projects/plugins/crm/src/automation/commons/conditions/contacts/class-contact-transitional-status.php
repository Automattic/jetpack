<?php
/**
 * Jetpack CRM Automation Contact_Transitional_Status condition.
 *
 * @package automattic/jetpack-crm
 */

namespace Automattic\Jetpack\CRM\Automation\Conditions;

use Automattic\Jetpack\CRM\Automation\Automation_Exception;
use Automattic\Jetpack\CRM\Automation\Base_Condition;

/**
 * Contact_Transitional_Status condition class.
 *
 * @since $$next-version$$
 */
class Contact_Transitional_Status extends Base_Condition {
	/**
	 * All valid operators for this condition.
	 *
	 * @since $$next-version$$
	 * @var string[] $valid_operators Valid operators.
	 */
	protected $valid_operators = array(
		'from_to',
	);

	/**
	 * All valid attributes for this condition.
	 *
	 * @since $$next-version$$
	 * @var string[] $valid_operators Valid attributes.
	 */
	private $valid_attributes = array(
		'previous_status_was',
		'new_status_is',
	);

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
		if ( ! $this->is_valid_contact_status_transitional_data( $data ) ) {
			$this->logger->log( 'Invalid contact status transitional data', $data );
			$this->condition_met = false;

			return;
		}

		$operator   = $this->get_attributes()['operator'];
		$status_was = $this->get_attributes()['previous_status_was'];
		$status_is  = $this->get_attributes()['new_status_is'];

		if ( ! $this->is_valid_operator( $operator ) ) {
			$this->condition_met = false;
			$this->logger->log( 'Invalid operator: ' . $operator );
			throw new Automation_Exception( 'Invalid operator: ' . $operator );
		}

		$this->logger->log( 'Condition: Contact_Transitional_Status ' . $operator . ' ' . $status_was . ' => ' . $status_is );
		switch ( $operator ) {
			case 'from_to':
				$this->condition_met = ( $data['old_status_value'] === $status_was ) && ( $data['contact']['data']['status'] === $status_is );
				$this->logger->log( 'Condition met?: ' . ( $this->condition_met ? 'true' : 'false' ) );

				return;
			default:
				$this->condition_met = false;
				throw new Automation_Exception( 'Valid but unimplemented operator: ' . $operator );
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
		return isset( $data['contact'] ) && isset( $data['old_status_value'] ) && isset( $data['contact']['data']['status'] );
	}

	/**
	 * Checks if this is a valid operator for this condition.
	 *
	 * @since $$next-version$$
	 *
	 * @param string $operator The operator.
	 * @return bool True if the operator is valid for this condition, false otherwise.
	 */
	private function is_valid_operator( string $operator ): bool {
		return in_array( $operator, $this->valid_operators, true );
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
	 * Get the type of the contact transitional status condition.
	 *
	 * @since $$next-version$$
	 *
	 * @return string The type 'condition'.
	 */
	public static function get_type(): string {
		return 'condition';
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
