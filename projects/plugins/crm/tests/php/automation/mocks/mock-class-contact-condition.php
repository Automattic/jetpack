<?php

namespace Automattic\Jetpack\CRM\Automation\Tests\Mocks;

use Automattic\Jetpack\CRM\Automation\Automation_Exception;
use Automattic\Jetpack\CRM\Automation\Automation_Logger;
use Automattic\Jetpack\CRM\Automation\Base_Condition;

class Contact_Condition extends Base_Condition {

	/** @var Automation_Logger */
	private $logger;

	/** @var string[] Valid contact keys */
	private $valid_contact_keys = array(
		'id',
		'name',
		'email',
		'status',
	);

	/** @var string[] Valid operators */
	private $valid_operators = array(
		'is',
		'is_not',
	);

	/** @var string[] Valid condition attributes */
	private $valid_attributes = array(
		'field',
		'operator',
		'value',
	);

	/**
	 * Contact_Condition constructor.
	 *
	 * @param array $step_data
	 * @throws Automation_Exception
	 */
	public function __construct( array $step_data ) {
		parent::__construct( $step_data );

		$this->name        = 'contact_status';
		$this->title       = 'Contact Status';
		$this->description = 'Check if a contact has a specific status';
		$this->type        = 'condition';
		$this->category    = 'testing';

		// Check if condition data has the expected attributes
		if ( ! $this->has_valid_attributes() && ! $this->has_valid_operator() ) {
			throw new Automation_Exception( 'Invalid attributes for contact condition' );
		}

		$this->logger = Automation_Logger::instance();
	}

	/**
	 * Validate the contact data
	 *
	 * @param array $contact_data
	 * @return bool
	 */
	private function is_valid_contact_data( array $contact_data ): bool {

		// Check if the contact data has at least the required keys
		if ( ! array_intersect( $this->valid_contact_keys, array_keys( $contact_data ) ) ) {
			return false;
		}
		return true;
	}

	/**
	 * Check if the condition has valid attributes
	 *
	 * @return bool
	 */
	private function has_valid_attributes(): bool {

		if ( ! array_intersect( $this->valid_attributes, array_keys( $this->get_attributes() ) ) ) {
			return false;
		}
		return true;
	}

	/**
	 * Check if it has a valid operator
	 *
	 * @return bool
	 */
	private function has_valid_operator(): bool {

		$operator = $this->get_attributes()['operator'];

		if ( ! in_array( $operator, $this->valid_operators ) ) {
			return false;
		}

		return true;
	}

	/**
	 * Execute the step
	 *
	 * @param array $data
	 * @return void
	 * @throws Automation_Exception
	 */
	public function execute( array $data ) {

		if ( ! $this->is_valid_contact_data( $data ) ) {
			$this->logger->log( 'Invalid contact data', $data );
			$this->condition_met = false;
			return;
		}

		$field    = $this->get_attributes()['field'];
		$operator = $this->get_attributes()['operator'];
		$value    = $this->get_attributes()['value'];

		$this->logger->log( 'Condition: ' . $field . ' ' . $operator . ' ' . $value . ' => ' . $data[ $field ] );

		switch ( $operator ) {
			case 'is':
				$this->condition_met = ( $data[ $field ] === $value );
				$this->logger->log( 'Condition met?: ' . ( $this->condition_met ? 'true' : 'false' ) );
				return;
			case 'is_not':
				$this->condition_met = ( $data[ $field ] !== $value );
				$this->logger->log( 'Condition met?: ' . ( $this->condition_met ? 'true' : 'false' ) );
				return;
		}

		$this->condition_met = false;
		$this->logger->log( 'Invalid operator: ' . $operator );

		throw new Automation_Exception( 'Invalid operator: ' . $operator );
	}
}
