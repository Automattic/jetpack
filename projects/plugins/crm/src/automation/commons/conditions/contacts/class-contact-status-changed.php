<?php
/**
 * Jetpack CRM Automation Contact_Status_Changed condition.
 *
 * @package automattic/jetpack-crm
 */

namespace Automattic\Jetpack\CRM\Automation\Conditions;

use Automattic\Jetpack\CRM\Automation\Automation_Exception;
use Automattic\Jetpack\CRM\Automation\Automation_Logger;
use Automattic\Jetpack\CRM\Automation\Base_Condition;

/**
 * Contact_Status_Changed condition class.
 *
 * @since $$next-version$$
 */
class Contact_Status_Changed extends Base_Condition {

	/**
	 * The Automation logger.
	 *
	 * @var Automation_Logger $logger The Automation logger.
	 */
	private $logger;

	/**
	 * All valid operators for this condition.
	 *
	 * @var string[] $valid_operators Valid operators.
	 */
	private $valid_operators = array(
		'is',
		'is_not',
	);

	/**
	 * All valid attributes for this condition.
	 *
	 * @var string[] $valid_operators Valid attributes.
	 */
	private $valid_attributes = array(
		'field',
		'operator',
		'value',
	);

	/**
	 * Contact_Status_Changed constructor.
	 *
	 * @param array $step_data The step data for the condition.
	 */
	public function __construct( array $step_data ) {
		parent::__construct( $step_data );

		$this->logger = Automation_Logger::instance();
	}

	/**
	 * Executes the condition. If the condition is met, the value stored in the
	 * attribute $condition_met is set to true; otherwise, it is set to false.
	 *
	 * @param array $data The data this condition has to evaluate.
	 * @return void
	 * @throws Automation_Exception If an invalid operator is encountered.
	 */
	public function execute( array $data ) {
		if ( ! $this->is_valid_contact_status_changed_data( $data ) ) {
			$this->logger->log( 'Invalid contact status changed data', $data );
			$this->condition_met = false;
			return;
		}

		$field    = $this->get_attributes()['field'];
		$operator = $this->get_attributes()['operator'];
		$value    = $this->get_attributes()['value'];

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
		}
		$this->condition_met = false;
		$this->logger->log( 'Invalid operator: ' . $operator );

		throw new Automation_Exception( 'Invalid operator: ' . $operator );
	}

	/**
	 * Checks if the contact has at least the necessary keys to detect a status
	 * change.
	 *
	 * @param array $contact_data The contact data.
	 * @return bool True if the data is valid to detect a status change, false otherwise
	 */
	private function is_valid_contact_status_changed_data( array $contact_data ): bool {
		return isset( $contact_data['id'] ) && isset( $contact_data['data'] ) && isset( $contact_data['data']['status'] );
	}

	/**
	 * Get the slug for the contact status changed condition.
	 *
	 * @return string The slug 'contact_status_changed'.
	 */
	public static function get_slug(): string {
		return 'jpcrm/condition/contact_status_changed';
	}

	/**
	 * Get the title for the contact status changed condition.
	 *
	 * @return string The title 'Contact Status Changed'.
	 */
	public static function get_title(): string {
		return __( 'Contact Status Changed', 'zero-bs-crm' );
	}

	/**
	 * Get the description for the contact status changed condition.
	 *
	 * @return string The description for the condition.
	 */
	public static function get_description(): string {
		return __( 'Checks if a contact status change matches an expected value', 'zero-bs-crm' );
	}

	/**
	 * Get the type of the contact status changed condition.
	 *
	 * @return string The type 'condition'.
	 */
	public static function get_type(): string {
		return 'condition';
	}

	/**
	 * Get the category of the contact status changed condition.
	 *
	 * @return string The category 'jpcrm/contact_condition'.
	 */
	public static function get_category(): string {
		return __( 'contact', 'zero-bs-crm' );
	}

	/**
	 * Get the allowed triggers for the contact status changed condition.
	 *
	 * @return array An array of allowed triggers:
	 *               - 'jpcrm/contact_status_updated'
	 *               - 'jpcrm/contact_updated'
	 */
	public static function get_allowed_triggers(): array {
		return array(
			'jpcrm/contact_status_updated',
			'jpcrm/contact_updated',
		);
	}
}
